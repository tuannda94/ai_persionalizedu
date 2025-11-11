import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Layout, Input, Button, List, Card, Space, Tag, Badge, Empty, Spin, message, Modal } from 'antd';
import { SendOutlined, PlusOutlined, DeleteOutlined, MenuFoldOutlined, MenuUnfoldOutlined, RobotOutlined, UserOutlined, LoginOutlined, LogoutOutlined, MessageOutlined, FileOutlined } from '@ant-design/icons';
import { UpdateButton, OfflineIndicator } from './components';
import LoginModal from './components/LoginModal';
import FeedbackModal from './components/FeedbackModal';
import LearningPackageUpdateModal from './components/LearningPackageUpdateModal';
// Temporarily disable MarkdownRenderer due to Electron compatibility issues
// import MarkdownRenderer from './components/MarkdownRenderer';
import FileUpload from './components/FileUpload';
// Import Ant Design CSS - Must be imported before any other styles
import 'antd/dist/reset.css';

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(new Map()); // Track loading per conversation
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [learningPackageModalVisible, setLearningPackageModalVisible] = useState(false);
  const [learningPackageInfo, setLearningPackageInfo] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [userId] = useState(() => {
    // Lấy user_id từ localStorage hoặc tạo mới
    let uid = localStorage.getItem('user_id');
    if (!uid) {
      uid = `user_${Date.now()}`;
      localStorage.setItem('user_id', uid);
    }
    return uid;
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeStreamsRef = useRef(new Map()); // Track active streams by conversation_id
  const conversationMessagesRef = useRef(new Map()); // Cache messages by conversation_id

  // Load user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  // Get backend URL
  useEffect(() => {
    const initBackendUrl = () => {
      if (window.electronAPI) {
        try {
          const url = window.electronAPI.getBackendUrl();
          setBackendUrl(url || DEFAULT_BACKEND_URL);
        } catch (error) {
          console.warn('Failed to get backend URL from electronAPI:', error);
          setBackendUrl(DEFAULT_BACKEND_URL);
        }
      } else {
        setBackendUrl(DEFAULT_BACKEND_URL);
      }
    };
    initBackendUrl();
  }, []);

  // Listen for learning package update events
  useEffect(() => {
    if (window.electronAPI?.onLearningPackageUpdate) {
      const handleLearningPackageUpdate = (data) => {
        if (data.status === 'available') {
          setLearningPackageInfo(data);
          setLearningPackageModalVisible(true);
        }
      };

      window.electronAPI.onLearningPackageUpdate(handleLearningPackageUpdate);

      return () => {
        // Cleanup: remove listener if possible
        // Note: ipcRenderer.removeListener would need to be called, but we'll keep it simple
      };
    }
  }, []);

  // Check backend health và load conversation
  useEffect(() => {
    if (backendUrl) {
      // Initial health check immediately
      checkBackendHealth();

      // Set up periodic health checks (every 3 seconds)
      const healthCheckInterval = setInterval(() => {
        checkBackendHealth();
      }, 3000);

      // Load conversation and conversations
      loadConversation();
      loadConversations();

      // Cleanup interval on unmount
      return () => {
        clearInterval(healthCheckInterval);
      };
    }
  }, [backendUrl]);

  // Load danh sách conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/chat/conversations?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Switch conversation
  const switchConversation = async (convId) => {
    try {
      // Lưu messages hiện tại vào cache trước khi switch
      if (conversationId) {
        conversationMessagesRef.current.set(conversationId, messages);
      }

      setConversationId(convId);
      localStorage.setItem('conversation_id', convId);

      // Kiểm tra cache trước
      if (conversationMessagesRef.current.has(convId)) {
        setMessages(conversationMessagesRef.current.get(convId));
      } else {
        // Load từ server
        const response = await fetch(`${backendUrl}/api/v1/chat/conversations/${convId}/history?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();

          if (data.messages && data.messages.length > 0) {
            const historyMessages = data.messages
              .filter(msg => msg && msg.role && msg.message)
              .map(msg => ({
                role: msg.role,
                content: msg.message || ''
              }));
            setMessages(historyMessages);
            conversationMessagesRef.current.set(convId, historyMessages);
          } else {
            setMessages([]);
            conversationMessagesRef.current.set(convId, []);
          }
        }
      }

      // Reload conversations list để cập nhật preview
      loadConversations();
    } catch (error) {
      console.error('Error switching conversation:', error);
    }
  };

  // Delete conversation
  const deleteConversation = async (convId, e) => {
    e.stopPropagation(); // Ngăn trigger switchConversation
    if (!confirm('Bạn có chắc muốn xóa cuộc hội thoại này?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/chat/conversations/${convId}?user_id=${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Reload conversations list
        await loadConversations();

        // Nếu đang xóa conversation hiện tại, tạo mới
        if (convId === conversationId) {
          await createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Lỗi khi xóa cuộc hội thoại');
    }
  };

  // Load conversation từ localStorage hoặc tạo mới
  const loadConversation = async () => {
    const savedConvId = localStorage.getItem('conversation_id');
    if (savedConvId) {
      try {
        const response = await fetch(
          `${backendUrl}/api/v1/chat/conversations/${savedConvId}/history?user_id=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setConversationId(savedConvId);
            // Convert history thành messages format, filter các messages không hợp lệ
            const historyMessages = data.messages
              .filter(msg => msg && msg.role && msg.message)
              .map(msg => ({
                role: msg.role,
                content: msg.message || ''
              }));
            setMessages(historyMessages);
            // Lưu vào cache
            conversationMessagesRef.current.set(savedConvId, historyMessages);
            // Backup vào localStorage
            try {
              localStorage.setItem(`messages_${savedConvId}`, JSON.stringify(historyMessages));
            } catch (e) {
              console.warn('Failed to backup messages to localStorage:', e);
            }
            console.log(`📜 Loaded ${historyMessages.length} messages from conversation ${savedConvId}`);
          } else {
            // Conversation rỗng, tạo mới
            createNewConversation();
          }
        } else {
          // Conversation không tồn tại, tạo mới
          createNewConversation();
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        // Thử load từ localStorage backup
        try {
          const backupMessages = localStorage.getItem(`messages_${savedConvId}`);
          if (backupMessages) {
            const parsed = JSON.parse(backupMessages);
            setMessages(parsed);
            conversationMessagesRef.current.set(savedConvId, parsed);
            console.log(`📦 Loaded ${parsed.length} messages from localStorage backup`);
          } else {
            createNewConversation();
          }
        } catch (e) {
          console.error('Error loading from backup:', e);
          createNewConversation();
        }
      }
    } else {
      createNewConversation();
    }
  };

  // Tạo conversation mới
  const createNewConversation = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/chat/conversations/new?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation_id);
        localStorage.setItem('conversation_id', data.conversation_id);
        // Đảm bảo messages là array rỗng hợp lệ
        setMessages([]);
        // Reload conversations list
        await loadConversations();
        console.log(`✨ Created new conversation: ${data.conversation_id}`);
      } else {
        console.error('Failed to create conversation:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Đảm bảo messages vẫn là array hợp lệ ngay cả khi có lỗi
      setMessages([]);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        console.error(`Health check failed: ${response.status} ${response.statusText}`);
        setBackendStatus('offline');
        return;
      }

      const data = await response.json();
      // Check both 'ok' and 'status' fields for compatibility
      const isHealthy = data.ok === true || data.status === 'ok';
      setBackendStatus(isHealthy ? 'online' : 'offline');

      if (isHealthy) {
        console.log('✅ Backend is online');
      } else {
        console.warn('⚠️ Backend health check returned unhealthy status:', data);
      }
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      setBackendStatus('offline');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Đảm bảo có conversation_id trước
    let currentConvId = conversationId;
    if (!currentConvId) {
      try {
        const convResponse = await fetch(`${backendUrl}/api/v1/chat/conversations/new?user_id=${userId}`);
        if (convResponse.ok) {
          const convData = await convResponse.json();
          currentConvId = convData.conversation_id;
          setConversationId(currentConvId);
          localStorage.setItem('conversation_id', currentConvId);
        }
      } catch (err) {
        console.error('Error creating conversation:', err);
        return;
      }
    }

    // Kiểm tra loading cho conversation hiện tại
    const isCurrentConversationLoading = loadingConversations.get(currentConvId) || false;

    // Check if there's input or files to send
    const hasFiles = attachedFiles.length > 0;
    if ((!input.trim() && !hasFiles) || isCurrentConversationLoading || backendStatus !== 'online') return;

    const userMessage = input.trim();
    setInput('');

    // Clear attached files after sending
    setAttachedFiles([]);

    // Set loading cho conversation hiện tại
    setLoadingConversations(prev => {
      const newMap = new Map(prev);
      newMap.set(currentConvId, true);
      return newMap;
    });

    // Add user message và empty assistant message
    const newMessages = [...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' }
    ];
    setMessages(newMessages);
    const assistantMessageIndex = newMessages.length - 1;

    // QUAN TRỌNG: Lưu newMessages vào cache NGAY LẬP TỨC để đảm bảo user message không bị mất
    conversationMessagesRef.current.set(currentConvId, newMessages);
    try {
      localStorage.setItem(`messages_${currentConvId}`, JSON.stringify(newMessages));
    } catch (e) {
      console.warn('Failed to backup messages to localStorage:', e);
    }

    // Reload conversations list ngay để hiển thị conversation mới trong sidebar
    // (nếu đây là message đầu tiên trong conversation mới)
    if (messages.length === 0) {
      await loadConversations();
    }

    try {
      // Prepare FormData if there are files, otherwise use JSON
      let requestBody;
      let headers = {};

      // Get files to send
      const filesToSend = attachedFiles.filter(file => {
        const fileObj = file.originFileObj || file;
        return fileObj instanceof File || fileObj instanceof Blob;
      });

      if (filesToSend.length > 0) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('question', userMessage || '');
        formData.append('user_id', userId);
        formData.append('conversation_id', currentConvId || '');

        // Append files
        filesToSend.forEach((file) => {
          const fileObj = file.originFileObj || file;
          if (fileObj instanceof File) {
            formData.append('files', fileObj);
          }
        });

        requestBody = formData;
        // Don't set Content-Type header, browser will set it with boundary
      } else {
        // Use JSON for text-only messages
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          question: userMessage,
          user_id: userId,
          conversation_id: currentConvId
        });
      }

      const response = await fetch(`${backendUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: headers,
        body: requestBody
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnswer = '';
      let metadata = null;

      // Lưu stream reference để có thể tiếp tục chạy khi switch conversation
      const streamId = `${currentConvId}_${Date.now()}`;
      activeStreamsRef.current.set(streamId, { convId: currentConvId, reader });

      // Function để update messages của conversation (có thể đang xem hoặc không)
      const updateConversationMessages = (convId, updatedMessages) => {
        // Lưu vào cache
        conversationMessagesRef.current.set(convId, updatedMessages);

        // Backup vào localStorage
        try {
          localStorage.setItem(`messages_${convId}`, JSON.stringify(updatedMessages));
        } catch (e) {
          console.warn('Failed to backup messages to localStorage:', e);
        }

        // Nếu đang xem conversation này, update UI
        // Sử dụng functional update để tránh stale closure
        setMessages(prevMessages => {
          // Lấy conversationId hiện tại từ localStorage (luôn được cập nhật)
          const currentViewingConvId = localStorage.getItem('conversation_id');
          if (currentViewingConvId === convId) {
            return updatedMessages;
          }
          return prevMessages;
        });
      };

      // Reload conversations list ngay khi bắt đầu stream (để hiển thị conversation mới trong sidebar)
      // Chỉ reload nếu đây là message đầu tiên (messages.length === 0 trước khi add)
      if (messages.length === 0) {
        await loadConversations();
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Xóa stream reference khi hoàn thành
          activeStreamsRef.current.delete(streamId);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.token) {
                fullAnswer += data.token;
                // Update messages của conversation này (có thể đang xem hoặc không)
                // QUAN TRỌNG: Luôn lấy từ cache để đảm bảo có user message
                const currentConvMessages = conversationMessagesRef.current.get(currentConvId) || newMessages;
                const updated = [...currentConvMessages];
                // Đảm bảo assistant message index vẫn đúng
                if (updated[assistantMessageIndex]) {
                  updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: fullAnswer
                  };
                } else {
                  // Nếu không có, thêm vào cuối (fallback)
                  updated.push({
                    role: 'assistant',
                    content: fullAnswer
                  });
                }
                updateConversationMessages(currentConvId, updated);
              }

              if (data.done) {
                metadata = data;
                // Set loading false cho conversation này (có thể đang xem hoặc không)
                setLoadingConversations(prev => {
                  const newMap = new Map(prev);
                  newMap.set(data.conversation_id || currentConvId, false);
                  return newMap;
                });

                // Cập nhật conversation_id nếu có (từ server)
                if (data.conversation_id && data.conversation_id !== currentConvId) {
                  // Update cache với conversation_id mới
                  const messages = conversationMessagesRef.current.get(currentConvId) || [];
                  conversationMessagesRef.current.set(data.conversation_id, messages);
                  conversationMessagesRef.current.delete(currentConvId);

                  if (conversationId === currentConvId) {
                    setConversationId(data.conversation_id);
                    localStorage.setItem('conversation_id', data.conversation_id);
                  }
                }

                // Đảm bảo messages cuối cùng được lưu vào cache
                const finalMessages = conversationMessagesRef.current.get(data.conversation_id || currentConvId) || [];
                const finalUpdated = [...finalMessages];
                if (finalUpdated[assistantMessageIndex]) {
                  finalUpdated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: fullAnswer
                  };
                  updateConversationMessages(data.conversation_id || currentConvId, finalUpdated);
                }

                // Reload conversations list sau khi có message mới để hiển thị trong sidebar
                await loadConversations();

                // Telemetry được gửi tự động từ backend đến remote API (nếu enabled)
                // Local backend không có endpoint /telemetry, nên không cần gọi từ frontend
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }
    } catch (error) {
      // Xóa stream reference khi có lỗi
      activeStreamsRef.current.delete(streamId);

      // Set loading false cho conversation này
      setLoadingConversations(prev => {
        const newMap = new Map(prev);
        newMap.set(currentConvId, false);
        return newMap;
      });

      // Update error message vào cache
      const currentConvMessages = conversationMessagesRef.current.get(currentConvId) || newMessages;
      const updated = [...currentConvMessages];
      updated[assistantMessageIndex] = {
        role: 'assistant',
        content: `❌ Lỗi: ${error.message}`
      };
      updateConversationMessages(currentConvId, updated);
    } finally {
      // Chỉ focus input nếu đang xem conversation này
      if (conversationId === currentConvId) {
        inputRef.current?.focus();
      }
    }
  };

  const { Sider, Content, Header } = Layout;
  const { TextArea } = Input;
  const isCurrentConversationLoading = loadingConversations.get(conversationId) || false;

  return (
    <OfflineIndicator onOnlineChange={(online) => {
      if (!online && backendStatus === 'online') {
        // Disable internet-dependent features when offline
      }
    }}>
      <Layout style={{ height: '100vh' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <Sider
            width={300}
            style={{
              background: '#fff',
              borderRight: '1px solid #e0e0e0'
            }}
          >
            <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Lịch sử hội thoại</h3>
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => setSidebarOpen(false)}
              />
            </div>
            <div style={{ padding: '0 12px', marginBottom: 8 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                onClick={createNewConversation}
              >
                Cuộc hội thoại mới
              </Button>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100vh - 120px)' }}>
              {conversations.length === 0 ? (
                <Empty description="Chưa có cuộc hội thoại nào" style={{ marginTop: 40 }} />
              ) : (
                <List
                  dataSource={conversations}
                  renderItem={(conv) => (
                    <List.Item
                      style={{
                        cursor: 'pointer',
                        backgroundColor: conv.conversation_id === conversationId ? '#e6f7ff' : '#fff',
                        borderLeft: conv.conversation_id === conversationId ? '3px solid #1890ff' : 'none',
                        padding: '12px 16px'
                      }}
                      onClick={() => switchConversation(conv.conversation_id)}
                      actions={[
                        <Button
                          key="delete"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.conversation_id, e);
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.last_message || 'Cuộc hội thoại trống'}
                          </div>
                        }
                        description={
                          <Space>
                            <span>{conv.message_count} tin nhắn</span>
                            {loadingConversations.get(conv.conversation_id) && (
                              <Badge status="processing" text="Đang trả lời..." />
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Sider>
        )}

        <Layout>
          {/* Header */}
          <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: 64, lineHeight: '64px' }}>
            <Space>
              {!sidebarOpen && (
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  onClick={() => setSidebarOpen(true)}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RobotOutlined />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>FPT Polytechnic AI Tutor</span>
                </div>
                {conversationId && (
                  <Tag style={{ marginTop: 4, fontSize: 11 }}>ID: {conversationId.substring(0, 12)}...</Tag>
                )}
              </div>
            </Space>
            <Space>
              <UpdateButton backendUrl={backendUrl} />
              <Button
                icon={<PlusOutlined />}
                onClick={createNewConversation}
              >
                Mới
              </Button>
              <Button
                icon={<MessageOutlined />}
                onClick={() => setFeedbackModalVisible(true)}
              >
                Feedback
              </Button>
              {user ? (
                <Space>
                  <Tag color="green">{user.full_name || user.email}</Tag>
                  <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      localStorage.removeItem('refresh_token');
                      localStorage.removeItem('user');
                      setUser(null);
                      message.success('Đã đăng xuất');
                    }}
                  >
                    Đăng xuất
                  </Button>
                </Space>
              ) : (
                <Button
                  icon={<LoginOutlined />}
                  onClick={() => setLoginModalVisible(true)}
                >
                  Đăng nhập
                </Button>
              )}
              <Tag color="blue" style={{ fontSize: 12 }}>
                v{window.electronAPI?.getVersion?.() || '1.0.0'}
              </Tag>
              <Badge
                status={backendStatus === 'online' ? 'success' : 'error'}
                text={backendStatus === 'online' ? 'Online' : 'Offline'}
              />
            </Space>
          </Header>

          {/* Messages */}
          <Content style={{ overflowY: 'auto', padding: 24, background: '#f5f5f5' }}>
            {messages.length === 0 ? (
              <Empty
                description={
                  <div>
                    <h2>Xin chào! 👋</h2>
                    <p>Hãy hỏi tôi bất kỳ điều gì về môn học. Ví dụ:</p>
                    <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                      <li>"Giải thích về variables trong programming"</li>
                      <li>"Array là gì?"</li>
                      <li>"Stack hoạt động như thế nào?"</li>
                    </ul>
                  </div>
                }
                style={{ marginTop: 100 }}
              />
            ) : (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {messages.filter(msg => msg && msg.role).map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      marginBottom: 16,
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Card
                      style={{
                        maxWidth: '70%',
                        backgroundColor: msg.role === 'user' ? '#1890ff' : '#fff',
                        border: msg.role === 'user' ? 'none' : '1px solid #e0e0e0'
                      }}
                      bodyStyle={{
                        padding: '12px 16px',
                        color: msg.role === 'user' ? '#fff' : '#333'
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        {msg.files && msg.files.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {msg.files.map((file, fileIdx) => {
                              const isImage = file.type?.startsWith('image/');
                              return (
                                <div
                                  key={fileIdx}
                                  style={{
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: 8,
                                    padding: 8,
                                    background: 'rgba(255,255,255,0.1)',
                                    maxWidth: isImage ? 200 : 250
                                  }}
                                >
                                  {isImage ? (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      style={{
                                        width: 180,
                                        height: 120,
                                        objectFit: 'cover',
                                        borderRadius: 4
                                      }}
                                    />
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <FileOutlined style={{ fontSize: 20, color: '#fff' }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                          fontSize: 12,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          color: '#fff'
                                        }}>
                                          {file.name}
                                        </div>
                                        <div style={{ fontSize: 10, opacity: 0.8, color: '#fff' }}>
                                          {file.type || 'File'}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Temporarily disabled MarkdownRenderer - using plain text */}
                        <div style={{
                          color: msg.role === 'user' ? '#fff' : '#333',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6'
                        }}>
                          {msg.content || ''}
                        </div>
                      </Space>
                    </Card>
                  </div>
                ))}

                {isCurrentConversationLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                    <Card style={{ maxWidth: '70%' }}>
                      <Spin size="small" /> <span style={{ marginLeft: 8 }}>Đang suy nghĩ...</span>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </Content>

          {/* Input */}
          <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #e0e0e0' }}>
            <FileUpload
              onFilesChange={setAttachedFiles}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
            <Space.Compact style={{ width: '100%', marginTop: 8 }}>
              <TextArea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Nhập câu hỏi của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
                disabled={isCurrentConversationLoading || backendStatus !== 'online'}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isCurrentConversationLoading}
                disabled={(!input.trim() && attachedFiles.length === 0) || backendStatus !== 'online'}
                onClick={handleSubmit}
                style={{ height: 'auto' }}
              >
                Gửi
              </Button>
            </Space.Compact>
          </div>

          {backendStatus === 'offline' && (
            <div style={{ padding: '12px 24px', background: '#fff3cd', color: '#856404', textAlign: 'center' }}>
              ⚠️ Backend không kết nối được. Vui lòng kiểm tra backend đang chạy.
            </div>
          )}
        </Layout>
      </Layout>

      {/* Login Modal */}
      <LoginModal
        visible={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
        onSuccess={(userData) => {
          setUser(userData);
          setLoginModalVisible(false);
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onSuccess={() => setFeedbackModalVisible(false)}
      />

      {/* Learning Package Update Modal */}
      <LearningPackageUpdateModal
        visible={learningPackageModalVisible}
        onClose={() => {
          setLearningPackageModalVisible(false);
          setLearningPackageInfo(null);
        }}
        packageInfo={learningPackageInfo}
        backendUrl={backendUrl}
      />
    </OfflineIndicator>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5'
  },
  sidebar: {
    width: '300px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden'
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0'
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#333'
  },
  sidebarCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px'
  },
  newConvButton: {
    margin: '12px 16px',
    padding: '10px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  },
  conversationsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },
  conversationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#f9f9f9',
    transition: 'background-color 0.2s'
  },
  conversationItemActive: {
    backgroundColor: '#e3f2fd',
    borderLeft: '3px solid #007bff'
  },
  conversationContent: {
    flex: 1,
    minWidth: 0
  },
  conversationPreview: {
    fontSize: '14px',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '4px'
  },
  conversationMeta: {
    fontSize: '12px',
    color: '#666'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#999',
    padding: '4px 8px',
    marginLeft: '8px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    borderRadius: '4px'
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden'
  },
  sidebarToggleBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    padding: '8px 12px',
    marginRight: '8px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#333'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  welcomeMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: '40px'
  },
  exampleList: {
    textAlign: 'left',
    display: 'inline-block',
    marginTop: '16px'
  },
  message: {
    display: 'flex',
    marginBottom: '8px',
    maxWidth: '80%',
    animation: 'fadeIn 0.3s ease-in'
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto'
  },
  assistantMessage: {
    alignSelf: 'flex-start'
  },
  messageContent: {
    padding: '12px 16px',
    borderRadius: '18px',
    lineHeight: '1.6',
    fontSize: '15px',
    wordWrap: 'break-word'
  },
  userMessageContent: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  assistantMessageContent: {
    backgroundColor: 'white',
    color: '#333',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  loading: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px'
  },
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#999'
  },
  inputContainer: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    resize: 'none',
    maxHeight: '120px',
    fontFamily: 'inherit',
    outline: 'none'
  },
  sendButton: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  errorBanner: {
    padding: '12px 24px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    textAlign: 'center',
    fontSize: '14px'
  }
};

// Add CSS animations and styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
  .markdown-content pre.code-block {
    background: #f4f4f4;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    border: 1px solid #e0e0e0;
  }
  .markdown-content pre.code-block code {
    font-family: Monaco, "Courier New", monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
  }
  .markdown-content code.inline-code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: Monaco, "Courier New", monospace;
    font-size: 14px;
    color: #d63384;
  }
  .markdown-content ul, .markdown-content ol {
    margin: 8px 0;
    padding-left: 24px;
  }
  .markdown-content li {
    margin: 4px 0;
  }
  .markdown-content h1, .markdown-content h2, .markdown-content h3 {
    margin: 12px 0 8px 0;
    font-weight: 600;
  }
  .markdown-content h1 { font-size: 24px; }
  .markdown-content h2 { font-size: 20px; }
  .markdown-content h3 { font-size: 18px; }
  .markdown-content strong {
    font-weight: 600;
  }
  .markdown-content em {
    font-style: italic;
  }
  textarea:focus {
    border-color: #007bff !important;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1) !important;
  }
  .loading-dot-1 { animation: bounce 1.4s infinite ease-in-out -0.32s both; }
  .loading-dot-2 { animation: bounce 1.4s infinite ease-in-out -0.16s both; }
  .loading-dot-3 { animation: bounce 1.4s infinite ease-in-out both; }
  /* Sidebar hover effects */
  [data-conversation-item]:hover {
    background-color: #f0f0f0 !important;
  }
  [data-conversation-item]:hover [data-delete-btn] {
    opacity: 1 !important;
    color: #dc3545 !important;
  }
`;
document.head.appendChild(styleSheet);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
