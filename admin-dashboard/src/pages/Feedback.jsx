import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Select, Space, Modal, Form, Input, Button, Row, Col, Statistic, Pagination, message } from 'antd';
import { MessageOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { feedbackAPI } from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

const { Option } = Select;
const { TextArea } = Input;

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: ''
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [updateForm] = Form.useForm();

  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [filters, page, pageSize]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) delete params[key];
      });
      const response = await feedbackAPI.list(params);
      setFeedbacks(response.data.items || response.data || []);
      setTotal(response.data.total || response.data.items?.length || 0);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to load feedbacks');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await feedbackAPI.stats(7);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleUpdate = async (values) => {
    if (!selectedFeedback) return;

    try {
      await feedbackAPI.update(selectedFeedback.id, values);
      message.success('Feedback updated successfully');
      setDetailModalVisible(false);
      setSelectedFeedback(null);
      updateForm.resetFields();
      loadFeedbacks();
      loadStats();
    } catch (error) {
      console.error('Failed to update feedback:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to update feedback');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    }
  };

  const openDetailModal = (feedback) => {
    setSelectedFeedback(feedback);
    updateForm.setFieldsValue({
      status: feedback.status,
      priority: feedback.priority,
      message: feedback.message
    });
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      reviewing: 'blue',
      resolved: 'green',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'red',
      2: 'orange',
      3: 'blue',
      4: 'green'
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Button type="link" onClick={() => openDetailModal(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag>{category}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          P{priority}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
  ];

  return (
    <div>
      {/* Stats */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Feedback"
                value={stats.total || 0}
                prefix={<MessageOutlined />}
              />
            </Card>
          </Col>
          {Object.entries(stats.by_status || {}).map(([status, count]) => (
            <Col span={6} key={status}>
              <Card>
                <Statistic
                  title={status.toUpperCase()}
                  value={count}
                  prefix={
                    status === 'resolved' ? <CheckCircleOutlined /> :
                    status === 'pending' ? <ClockCircleOutlined /> :
                    <CloseCircleOutlined />
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Feedback Management</h2>
          <Space>
            <Select
              placeholder="Filter by Status"
              style={{ width: 150 }}
              allowClear
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Option value="pending">Pending</Option>
              <Option value="reviewing">Reviewing</Option>
              <Option value="resolved">Resolved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
            <Select
              placeholder="Filter by Priority"
              style={{ width: 150 }}
              allowClear
              value={filters.priority || undefined}
              onChange={(value) => setFilters({ ...filters, priority: value || '' })}
            >
              <Option value="1">Critical (1)</Option>
              <Option value="2">High (2)</Option>
              <Option value="3">Medium (3)</Option>
              <Option value="4">Low (4)</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={feedbacks}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} feedbacks`,
            onChange: (page, size) => {
              setPage(page);
              setPageSize(size);
            }
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Feedback Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedFeedback(null);
          updateForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedFeedback && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3>{selectedFeedback.title}</h3>
              <Space style={{ marginTop: 8 }}>
                <Tag color={getStatusColor(selectedFeedback.status)}>
                  {selectedFeedback.status?.toUpperCase()}
                </Tag>
                <Tag color={getPriorityColor(selectedFeedback.priority)}>
                  Priority: {selectedFeedback.priority}
                </Tag>
                <Tag>{selectedFeedback.category}</Tag>
              </Space>
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <strong>Message:</strong>
              <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{selectedFeedback.message}</p>
            </div>

            <div style={{ marginBottom: 16, fontSize: 12, color: '#666' }}>
              <p>Created: {new Date(selectedFeedback.created_at).toLocaleString()}</p>
              {selectedFeedback.app_version && <p>App Version: {selectedFeedback.app_version}</p>}
              {selectedFeedback.platform && <p>Platform: {selectedFeedback.platform}</p>}
            </div>

            <Form
              form={updateForm}
              layout="vertical"
              onFinish={handleUpdate}
            >
              <Form.Item
                name="status"
                label="Status"
              >
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="reviewing">Reviewing</Option>
                  <Option value="resolved">Resolved</Option>
                  <Option value="rejected">Rejected</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label="Priority"
              >
                <Select>
                  <Option value={1}>Critical (1)</Option>
                  <Option value={2}>High (2)</Option>
                  <Option value={3}>Medium (3)</Option>
                  <Option value={4}>Low (4)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="message"
                label="Admin Notes"
              >
                <TextArea rows={4} placeholder="Add admin notes..." />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Update
                  </Button>
                  <Button onClick={() => {
                    setDetailModalVisible(false);
                    setSelectedFeedback(null);
                    updateForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Feedback;
