import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { ExclamationCircleOutlined, BulbOutlined, StarOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const FeedbackModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const backendUrl = window.electronAPI?.getBackendUrl?.() || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/v1/feedback/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: values.type,
          category: values.category,
          title: values.title,
          message: values.message,
          priority: values.priority || 3
        })
      });

      if (response.ok) {
        message.success('Gửi feedback thành công!');
        form.resetFields();
        onSuccess?.();
      } else {
        const error = await response.json();
        message.error(error.detail || 'Gửi feedback thất bại');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      message.error('Không thể gửi feedback');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return <ExclamationCircleOutlined />;
      case 'suggestion': return <BulbOutlined />;
      case 'feature': return <StarOutlined />;
      default: return null;
    }
  };

  return (
    <Modal
      title="Gửi Feedback"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'suggestion',
          category: 'ui',
          priority: 3
        }}
      >
        <Form.Item
          name="type"
          label="Loại"
          rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
        >
          <Select size="large">
            <Option value="bug">Bug / Lỗi</Option>
            <Option value="suggestion">Gợi ý</Option>
            <Option value="feature">Tính năng mới</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="category"
          label="Danh mục"
          rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
        >
          <Select size="large">
            <Option value="chat">Chat / Hội thoại</Option>
            <Option value="ui">Giao diện</Option>
            <Option value="performance">Hiệu suất</Option>
            <Option value="update">Cập nhật</Option>
            <Option value="other">Khác</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
        >
          <Input placeholder="Tiêu đề ngắn gọn" size="large" />
        </Form.Item>

        <Form.Item
          name="message"
          label="Nội dung"
          rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
        >
          <TextArea
            rows={4}
            placeholder="Mô tả chi tiết..."
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Độ ưu tiên"
        >
          <Select size="large">
            <Option value={1}>1 - Rất quan trọng</Option>
            <Option value={2}>2 - Quan trọng</Option>
            <Option value={3}>3 - Bình thường</Option>
            <Option value={4}>4 - Thấp</Option>
            <Option value={5}>5 - Thông tin</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            Gửi Feedback
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeedbackModal;

