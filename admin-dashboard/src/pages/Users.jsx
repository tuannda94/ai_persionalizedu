import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Card } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usersAPI } from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

const { Option } = Select;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    is_active: ''
  });
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.list();
      let filteredUsers = response.data || [];

      if (filters.role) {
        filteredUsers = filteredUsers.filter(u => u.role === filters.role);
      }
      if (filters.is_active !== '') {
        filteredUsers = filteredUsers.filter(u => u.is_active === (filters.is_active === 'true'));
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to load users');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await usersAPI.create(values);
      message.success('User created successfully');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to create user');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    }
  };

  const handleUpdate = async (values) => {
    try {
      await usersAPI.update(selectedUser.id, values);
      message.success('User updated successfully');
      setEditModalVisible(false);
      setSelectedUser(null);
      editForm.resetFields();
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      if (shouldShowError(error)) {
        const errorMsg = handleApiError(error, 'Failed to update user');
        if (errorMsg) {
          message.error(errorMsg);
        }
      }
    }
  };

  const handleDelete = async (userId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await usersAPI.delete(userId);
          message.success('User deleted successfully');
          loadUsers();
        } catch (error) {
          console.error('Failed to delete user:', error);
          if (shouldShowError(error)) {
            const errorMsg = handleApiError(error, 'Failed to delete user');
            if (errorMsg) {
              message.error(errorMsg);
            }
          }
        }
      }
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      full_name: user.full_name || '',
      student_id: user.student_id || '',
      role: user.role || 'student',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setEditModalVisible(true);
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role?.toUpperCase() || 'STUDENT'}
        </Tag>
      ),
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
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
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
          <h2 style={{ margin: 0 }}>Users Management</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create User
          </Button>
        </div>

        {/* Filters */}
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by Role"
            style={{ width: 150 }}
            allowClear
            value={filters.role || undefined}
            onChange={(value) => setFilters({ ...filters, role: value || '' })}
          >
            <Option value="admin">Admin</Option>
            <Option value="student">Student</Option>
          </Select>
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            value={filters.is_active !== '' ? filters.is_active : undefined}
            onChange={(value) => setFilters({ ...filters, is_active: value !== undefined ? value : '' })}
          >
            <Option value="true">Active</Option>
            <Option value="false">Inactive</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New User"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please input valid email!' }
            ]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input password!', min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="full_name"
            label="Full Name"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="student_id"
            label="Student ID"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="student"
          >
            <Select>
              <Option value="student">Student</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="full_name"
            label="Full Name"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="student_id"
            label="Student ID"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
          >
            <Select>
              <Option value="student">Student</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="New Password (leave empty to keep current)"
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                setSelectedUser(null);
                editForm.resetFields();
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

export default Users;
