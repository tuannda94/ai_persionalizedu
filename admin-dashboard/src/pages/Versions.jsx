import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Upload, Progress, Card, Space, Tag, message, Switch, Descriptions, Tooltip, Alert } from 'antd';
import { UploadOutlined, CloudDownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons';
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

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

      // Learning package (optional)
      if (values.learning_package) {
        const learningPackageFile = values.learning_package?.file || values.learning_package;
        if (learningPackageFile) {
          uploadFormData.append('learning_package', learningPackageFile);
        }
      }
      if (values.learning_package_manifest) {
        uploadFormData.append('learning_package_manifest', values.learning_package_manifest);
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
      title: 'Learning Package',
      key: 'learning_package',
      render: (_, record) => {
        if (record.has_learning_package) {
          return (
            <Space>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Yes
              </Tag>
              {record.learning_package_size && (
                <Tooltip title={`Size: ${formatFileSize(record.learning_package_size)}`}>
                  <Tag color="blue" style={{ cursor: 'help' }}>
                    {formatFileSize(record.learning_package_size)}
                  </Tag>
                </Tooltip>
              )}
            </Space>
          );
        }
        return <Tag>No</Tag>;
      },
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
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedVersion(record);
              setDetailModalVisible(true);
            }}
          >
            Details
          </Button>
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
            App
          </Button>
          {record.has_learning_package && record.learning_package_url && (
            <Button
              type="link"
              icon={<InboxOutlined />}
              href={record.learning_package_url}
              target="_blank"
            >
              Package
            </Button>
          )}
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

          {/* Learning Package Section */}
          <div style={{
            marginTop: 24,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8,
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, marginRight: 8 }}>📦 Learning Package (Optional)</h4>
              <Tooltip title="Learning package chứa embeddings, RAG index, model config và scripts cho RAG engine">
                <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
              </Tooltip>
            </div>

            <Alert
              message="Cấu trúc Learning Package"
              description={
                <div style={{ fontSize: '12px', marginTop: 4 }}>
                  Package phải là file .zip chứa: <code>embeddings/</code>, <code>rag_index/</code>, <code>config/</code>, và <code>scripts/</code>.
                  Xem <a href="https://github.com/your-repo/docs/LEARNING_PACKAGE_STRUCTURE.md" target="_blank" rel="noopener noreferrer">tài liệu</a> để biết chi tiết.
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="learning_package"
              label="Learning Package File (.zip)"
              tooltip="File .zip chứa learning package. Kích thước tối đa phụ thuộc vào cấu hình server."
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
                <Button icon={<UploadOutlined />}>Select Learning Package</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="learning_package_manifest"
              label={
                <span>
                  Package Manifest (JSON)
                  <Tooltip title='JSON string mô tả nội dung package. Format: {"version": "1.2.3", "contents": {...}}'>
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.resolve();
                    }
                    try {
                      JSON.parse(value);
                      return Promise.resolve();
                    } catch (e) {
                      return Promise.reject(new Error('Manifest phải là JSON hợp lệ'));
                    }
                  }
                }
              ]}
            >
              <TextArea
                rows={6}
                placeholder='{"version": "1.2.3", "description": "...", "contents": {...}}'
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Form.Item>

            <div style={{ fontSize: '11px', color: '#999', marginTop: -12, marginBottom: 0 }}>
              💡 Tip: Manifest giúp client xác định nội dung package và quyết định có cần update không.
            </div>
          </div>

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

      {/* Version Detail Modal */}
      <Modal
        title={`Version Details: ${selectedVersion?.version || ''}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedVersion(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedVersion(null);
          }}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedVersion && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Version">{selectedVersion.version}</Descriptions.Item>
            <Descriptions.Item label="Version Code">{selectedVersion.version_code}</Descriptions.Item>
            <Descriptions.Item label="Platform">
              <Tag color="blue">{selectedVersion.platform?.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Release Type">
              <Tag color={selectedVersion.release_type === 'stable' ? 'green' : selectedVersion.release_type === 'beta' ? 'orange' : 'red'}>
                {selectedVersion.release_type?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="App File Size">{formatFileSize(selectedVersion.file_size)}</Descriptions.Item>
            <Descriptions.Item label="App File Hash">
              <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                {selectedVersion.file_hash || 'N/A'}
              </code>
            </Descriptions.Item>
            <Descriptions.Item label="Mandatory Update">
              {selectedVersion.is_mandatory ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>}
            </Descriptions.Item>
            {selectedVersion.min_version_code && (
              <Descriptions.Item label="Minimum Version Code">{selectedVersion.min_version_code}</Descriptions.Item>
            )}
            <Descriptions.Item label="Published">
              {formatDate(selectedVersion.published_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(selectedVersion.created_at)}
            </Descriptions.Item>
            {selectedVersion.release_notes && (
              <Descriptions.Item label="Release Notes">
                <div style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                  {selectedVersion.release_notes}
                </div>
              </Descriptions.Item>
            )}

            {/* Learning Package Section */}
            <Descriptions.Item label="Learning Package">
              {selectedVersion.has_learning_package ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Tag color="green" icon={<CheckCircleOutlined />}>Included</Tag>
                  {selectedVersion.learning_package_size && (
                    <div><strong>Size:</strong> {formatFileSize(selectedVersion.learning_package_size)}</div>
                  )}
                  {selectedVersion.learning_package_hash && (
                    <div>
                      <strong>Hash:</strong>{' '}
                      <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                        {selectedVersion.learning_package_hash}
                      </code>
                    </div>
                  )}
                  {selectedVersion.learning_package_url && (
                    <Button
                      type="link"
                      icon={<CloudDownloadOutlined />}
                      href={selectedVersion.learning_package_url}
                      target="_blank"
                      size="small"
                    >
                      Download Package
                    </Button>
                  )}
                  {selectedVersion.learning_package_manifest && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Manifest:</strong>
                      <pre style={{
                        marginTop: 4,
                        padding: 8,
                        background: '#f5f5f5',
                        borderRadius: 4,
                        fontSize: '11px',
                        maxHeight: '150px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {typeof selectedVersion.learning_package_manifest === 'string'
                          ? selectedVersion.learning_package_manifest
                          : JSON.stringify(selectedVersion.learning_package_manifest, null, 2)}
                      </pre>
                    </div>
                  )}
                </Space>
              ) : (
                <Tag>Not included</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default Versions;
