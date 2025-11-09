import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { UpdateButton, OfflineIndicator } from './components';

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Simple markdown renderer
const renderMarkdown = (text) => {
  if (!text) return '';

  let html = text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Wrap list items
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  return html;
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(new Map()); // Track loading per conversation
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
        createNewConversation();
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
    if (!input.trim() || isCurrentConversationLoading || backendStatus !== 'online') return;

    const userMessage = input.trim();
    setInput('');

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

    // Reload conversations list ngay để hiển thị conversation mới trong sidebar
    // (nếu đây là message đầu tiên trong conversation mới)
    if (messages.length === 0) {
      await loadConversations();
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          user_id: userId,
          conversation_id: currentConvId
        })
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
                const currentConvMessages = conversationMessagesRef.current.get(currentConvId) || newMessages;
                const updated = [...currentConvMessages];
                updated[assistantMessageIndex] = {
                  role: 'assistant',
                  content: fullAnswer
                };
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

  return (
    <OfflineIndicator onOnlineChange={(online) => {
      if (!online && backendStatus === 'online') {
        // Disable internet-dependent features when offline
      }
    }}>
    <div style={styles.container}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Lịch sử hội thoại</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              style={styles.sidebarCloseBtn}
              title="Đóng sidebar"
            >
              ✕
            </button>
          </div>
          <button
            onClick={createNewConversation}
            style={styles.newConvButton}
          >
            ➕ Cuộc hội thoại mới
          </button>
          <div style={styles.conversationsList}>
            {conversations.length === 0 ? (
              <div style={styles.emptyState}>Chưa có cuộc hội thoại nào</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onClick={() => switchConversation(conv.conversation_id)}
                  data-conversation-item
                  style={{
                    ...styles.conversationItem,
                    ...(conv.conversation_id === conversationId ? styles.conversationItemActive : {})
                  }}
                >
                  <div style={styles.conversationContent}>
                    <div style={styles.conversationPreview}>
                      {conv.last_message || 'Cuộc hội thoại trống'}
                    </div>
                    <div style={styles.conversationMeta}>
                      {conv.message_count} tin nhắn
                      {loadingConversations.get(conv.conversation_id) && (
                        <span style={{ marginLeft: '8px', color: '#007bff' }}>⏳ Đang trả lời...</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.conversation_id, e)}
                    data-delete-btn
                    style={styles.deleteButton}
                    title="Xóa cuộc hội thoại"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={styles.sidebarToggleBtn}
              title="Mở sidebar"
            >
              ☰
            </button>
          )}
        <div>
          <h1 style={styles.title}>🤖 FPT Polytechnic AI Tutor</h1>
          {conversationId && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Conversation: {conversationId}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <UpdateButton backendUrl={backendUrl} />
          <button
            onClick={createNewConversation}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Tạo cuộc hội thoại mới"
          >
            ➕ Mới
          </button>
          <div style={styles.status}>
            <div style={{
              ...styles.statusDot,
              backgroundColor: backendStatus === 'online' ? '#4caf50' : '#f44336'
            }}></div>
            <span>{backendStatus === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <h2>Xin chào! 👋</h2>
            <p>Hãy hỏi tôi bất kỳ điều gì về môn học. Ví dụ:</p>
            <ul style={styles.exampleList}>
              <li>"Giải thích về variables trong programming"</li>
              <li>"Array là gì?"</li>
              <li>"Stack hoạt động như thế nào?"</li>
            </ul>
          </div>
        )}

        {messages.filter(msg => msg && msg.role).map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage)
            }}
          >
            <div style={{
              ...styles.messageContent,
              ...(msg.role === 'user' ? styles.userMessageContent : styles.assistantMessageContent)
            }}>
              {msg.role === 'assistant' ? (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  className="markdown-content"
                />
              ) : (
                <div>{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {(() => {
          const isCurrentConversationLoading = loadingConversations.get(conversationId) || false;
          return isCurrentConversationLoading && (
            <div style={{ ...styles.message, ...styles.assistantMessage }}>
              <div style={{
                ...styles.messageContent,
                ...styles.assistantMessageContent,
                ...styles.loading
              }}>
                <div style={{...styles.loadingDot}} className="loading-dot-1"></div>
                <div style={{...styles.loadingDot}} className="loading-dot-2"></div>
                <div style={{...styles.loadingDot}} className="loading-dot-3"></div>
              </div>
            </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.inputContainer}>
        {(() => {
          const isCurrentConversationLoading = loadingConversations.get(conversationId) || false;
          return (
            <>
              <textarea
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
                style={styles.input}
                rows={1}
              />
              <button
                type="submit"
                disabled={isCurrentConversationLoading || !input.trim() || backendStatus !== 'online'}
                style={{
                  ...styles.sendButton,
                  opacity: (isCurrentConversationLoading || !input.trim() || backendStatus !== 'online') ? 0.5 : 1,
                  cursor: (isCurrentConversationLoading || !input.trim() || backendStatus !== 'online') ? 'not-allowed' : 'pointer'
                }}
              >
                {isCurrentConversationLoading ? '⏳' : '📤'}
              </button>
            </>
          );
        })()}
      </form>

      {backendStatus === 'offline' && (
        <div style={styles.errorBanner}>
          ⚠️ Backend không kết nối được. Vui lòng kiểm tra backend đang chạy.
        </div>
      )}
      </div>
    </div>
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
