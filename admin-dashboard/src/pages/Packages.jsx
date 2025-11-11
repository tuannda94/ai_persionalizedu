import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Upload, Progress, Card, Space, Tag, message } from 'antd';
import { UploadOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { packagesAPI } from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

const { TextArea } = Input;

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const response = await packagesAPI.list();
      setPackages(response.data || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to load packages');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values) => {
    const packageFile = values.package_file?.file || values.package_file;
    if (!packageFile) {
      message.error('Please select a package file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', packageFile);
      if (values.manifest_file) {
        const manifestFile = values.manifest_file?.file || values.manifest_file;
        uploadFormData.append('manifest', manifestFile);
      }
      uploadFormData.append('subject', values.subject);
      uploadFormData.append('version', values.version);
      uploadFormData.append('description', values.description || '');

      await packagesAPI.upload(uploadFormData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      message.success('Package uploaded successfully!');
      setUploadModalVisible(false);
      form.resetFields();
      loadPackages();
    } catch (error) {
      console.error('Upload failed:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Upload failed');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this package?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await packagesAPI.delete(id);
          message.success('Package deleted successfully');
          loadPackages();
        } catch (error) {
          console.error('Failed to delete package:', error);
          if (shouldShowError(error)) {
            const errorMsg = handleApiError(error, 'Failed to delete package');
            if (errorMsg) {
              message.error(errorMsg);
            }
          }
        }
      }
    });
  };

  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      sorter: (a, b) => a.subject.localeCompare(b.subject),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Model Packages</h2>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Upload Package
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} packages`,
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Model Package"
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
            name="package_file"
            label="Package File (ZIP)"
            rules={[{ required: true, message: 'Please select a package file!' }]}
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
              accept=".zip"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select Package File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="manifest_file"
            label="Manifest File (JSON, optional)"
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
              accept=".json"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select Manifest File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject Code"
            rules={[{ required: true, message: 'Please input subject code!' }]}
          >
            <Input placeholder="CS101" />
          </Form.Item>

          <Form.Item
            name="version"
            label="Version"
            rules={[{ required: true, message: 'Please input version!' }]}
          >
            <Input placeholder="v1" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Package description..." />
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
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Packages;
