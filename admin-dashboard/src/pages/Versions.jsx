import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Upload, Progress, Card, Space, Tag, message, Switch } from 'antd';
import { UploadOutlined, CloudDownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { versionsAPI } from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

const { Option } = Select;
const { TextArea } = Input;

function Versions() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await versionsAPI.list();
      setVersions(response.data || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to load versions');
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
      message.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('version', values.version);
      uploadFormData.append('version_code', values.version_code);
      uploadFormData.append('platform', values.platform);
      uploadFormData.append('release_type', values.release_type);
      uploadFormData.append('release_notes', values.release_notes || '');
      uploadFormData.append('is_mandatory', values.is_mandatory || false);
      if (values.min_version_code) {
        uploadFormData.append('min_version_code', values.min_version_code);
      }

      await versionsAPI.upload(uploadFormData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      message.success('Version uploaded successfully!');
      setUploadModalVisible(false);
      form.resetFields();
      loadVersions();
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

  const handlePublish = async (versionId, published) => {
    try {
      await versionsAPI.update(versionId, {
        published_at: published ? new Date().toISOString() : null
      });
      message.success(published ? 'Version published' : 'Version unpublished');
      loadVersions();
    } catch (error) {
      console.error('Failed to update version:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to update version');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      sorter: (a, b) => a.version.localeCompare(b.version),
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => <Tag color="blue">{platform?.toUpperCase()}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'release_type',
      key: 'release_type',
      render: (type) => (
        <Tag color={type === 'stable' ? 'green' : type === 'beta' ? 'orange' : 'red'}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => formatFileSize(size),
    },
    {
      title: 'Mandatory',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      render: (mandatory) => mandatory ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Published',
      dataIndex: 'published_at',
      key: 'published_at',
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.published_at ? (
            <Button
              size="small"
              onClick={() => handlePublish(record.id, false)}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => handlePublish(record.id, true)}
            >
              Publish
            </Button>
          )}
          <Button
            type="link"
            icon={<CloudDownloadOutlined />}
            href={record.download_url}
            target="_blank"
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Version Management</h2>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Upload New Version
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} versions`,
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload New Version"
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
          initialValues={{
            platform: 'windows',
            release_type: 'stable',
            is_mandatory: false
          }}
        >
          <Form.Item
            name="file"
            label="Installer File"
            rules={[{ required: true, message: 'Please select a file!' }]}
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
              accept=".exe,.msi,.dmg,.deb,.AppImage"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="version"
            label="Version (e.g., 1.2.3)"
            rules={[{ required: true, message: 'Please input version!' }]}
          >
            <Input placeholder="1.2.3" />
          </Form.Item>

          <Form.Item
            name="version_code"
            label="Version Code (e.g., 10203)"
            rules={[{ required: true, message: 'Please input version code!' }]}
          >
            <Input type="number" placeholder="10203" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="platform"
              label="Platform"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="windows">Windows</Option>
                <Option value="macos">macOS</Option>
                <Option value="linux">Linux</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="release_type"
              label="Release Type"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="stable">Stable</Option>
                <Option value="beta">Beta</Option>
                <Option value="alpha">Alpha</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="release_notes"
            label="Release Notes"
          >
            <TextArea rows={4} placeholder="What's new in this version..." />
          </Form.Item>

          <Form.Item
            name="is_mandatory"
            label="Mandatory Update"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="min_version_code"
            label="Minimum Version Code (optional)"
            tooltip="Users with version code below this will be forced to update"
          >
            <Input type="number" placeholder="10000" />
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

export default Versions;
