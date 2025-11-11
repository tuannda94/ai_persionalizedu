import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Upload, Progress, Card, Space, Tag, message } from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import api from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

const { TextArea } = Input;

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/documents/list');
      // API có thể trả về { documents: [...] } hoặc array trực tiếp
      const docs = response.data?.documents || response.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to load documents');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values) => {
    const file = values.file?.file || values.file;
    if (!file) {
      message.error('Vui lòng chọn file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('category', values.category || '');

      await api.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      message.success('Upload thành công!');
      setUploadModalVisible(false);
      form.resetFields();
      loadDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to upload document');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (filename) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc muốn xóa "${filename}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/api/v1/documents/${filename}`);
          message.success('Xóa thành công!');
          loadDocuments();
        } catch (error) {
          console.error('Failed to delete document:', error);
          if (shouldShowError(error)) {
            const errorMsg = handleApiError(error, 'Failed to delete document');
            if (errorMsg) {
              message.error(errorMsg);
            }
          }
        }
      }
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const columns = [
    {
      title: 'Tên file',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename) => (
        <Space>
          <FileOutlined />
          {filename}
        </Space>
      ),
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatFileSize(size),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'last_modified',
      key: 'last_modified',
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            href={record.url}
            target="_blank"
          >
            Download
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.filename)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Quản lý Tài liệu</h2>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Upload Tài liệu
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={Array.isArray(documents) ? documents : []}
          rowKey={(record) => record.filename || record.id || record.stored_filename || Math.random()}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} tài liệu`,
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Tài liệu mới"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="file"
            label="File"
            rules={[{ required: true, message: 'Vui lòng chọn file!' }]}
            valuePropName="file"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e[0];
              }
              return e?.fileList?.[0] || e?.file;
            }}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Tiêu đề tài liệu" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Mô tả tài liệu..." />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
          >
            <Input placeholder="Ví dụ: Lecture, Assignment, Reference..." />
          </Form.Item>

          {uploading && (
            <Form.Item>
              <Progress percent={uploadProgress} status="active" />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Upload
              </Button>
              <Button onClick={() => {
                setUploadModalVisible(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Documents;
