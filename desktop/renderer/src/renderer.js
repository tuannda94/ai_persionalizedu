import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

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
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // Check backend health
  useEffect(() => {
    if (backendUrl) {
      checkBackendHealth();
    }
  }, [backendUrl]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      setBackendStatus(data.ok ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || backendStatus !== 'online') return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message và empty assistant message
    const newMessages = [...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' }
    ];
    setMessages(newMessages);
    const assistantMessageIndex = newMessages.length - 1; // Index của assistant message

    try {
      const response = await fetch(`${backendUrl}/query/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnswer = '';
      let metadata = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

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
                // Update message với content mới
                setMessages(prev => {
                  const updated = [...prev];
                  updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: fullAnswer
                  };
                  return updated;
                });
              }

              if (data.done) {
                metadata = data;
                setLoading(false);

                // Log telemetry
                try {
                  await fetch(`${backendUrl}/telemetry`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: 'query_completed',
                      question: userMessage.substring(0, 100),
                      answer_length: fullAnswer.length,
                      used_segments: data.used_segments || 0,
                      duration_ms: data.duration_ms || 0,
                      timestamp: new Date().toISOString()
                    })
                  });
                } catch (err) {
                  console.warn('Telemetry failed:', err);
                }
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }
    } catch (error) {
      setLoading(false);
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          role: 'assistant',
          content: `❌ Lỗi: ${error.message}`
        };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 FPT Polytechnic AI Tutor</h1>
        <div style={styles.status}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: backendStatus === 'online' ? '#4caf50' : '#f44336'
          }}></div>
          <span>{backendStatus === 'online' ? 'Online' : 'Offline'}</span>
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

        {messages.map((msg, idx) => (
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

        {loading && (
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
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.inputContainer}>
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
          disabled={loading || backendStatus !== 'online'}
          style={styles.input}
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || backendStatus !== 'online'}
          style={{
            ...styles.sendButton,
            opacity: (loading || !input.trim() || backendStatus !== 'online') ? 0.5 : 1,
            cursor: (loading || !input.trim() || backendStatus !== 'online') ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </form>

      {backendStatus === 'offline' && (
        <div style={styles.errorBanner}>
          ⚠️ Backend không kết nối được. Vui lòng kiểm tra backend đang chạy.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5'
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
`;
document.head.appendChild(styleSheet);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
