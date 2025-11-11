import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const LoginModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Get remote API URL from electronAPI (renderer process không có process.env)
      const remoteApiUrl = window.electronAPI?.getRemoteApiUrl?.() || 'http://localhost:8001';

      const response = await fetch(`${remoteApiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Save tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        message.success('Đăng nhập thành công!');
        form.resetFields();
        onSuccess?.(data.user);
      } else {
        const error = await response.json();
        message.error(error.detail || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đăng nhập"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Email"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Mật khẩu"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LoginModal;

