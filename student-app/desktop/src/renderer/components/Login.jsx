import React, { useState } from 'react';

function Login({ onLogin, onSkip }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isOnline) {
      setError('Không thể đăng nhập khi offline. Vui lòng kết nối internet và thử lại.');
      setLoading(false);
      return;
    }

    try {
      // Use environment variable or default to localhost:8001
      // In Electron renderer, we can't access process.env directly, so use a constant
      const REMOTE_API_URL = window.REMOTE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${REMOTE_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Đăng nhập thất bại');
      }

      const data = await response.json();
      const { access_token, refresh_token, user } = data;

      // Store tokens and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('is_authenticated', 'true');

      // Call onLogin callback
      if (onLogin) {
        onLogin(user);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('is_authenticated', 'false');
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '10px', textAlign: 'center', color: '#2c3e50' }}>
          AI Personalized Learning
        </h1>
        <p style={{ marginBottom: '30px', textAlign: 'center', color: '#7f8c8d', fontSize: '14px' }}>
          Đăng nhập để đồng bộ dữ liệu và sử dụng đầy đủ tính năng
        </p>

        {!isOnline && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #fbbf24',
            fontSize: '14px'
          }}>
            ⚠️ Bạn đang offline. Đăng nhập yêu cầu kết nối internet.
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #fcc',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@fpt.edu.vn"
              disabled={!isOnline || loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                boxSizing: 'border-box',
                opacity: (!isOnline || loading) ? 0.6 : 1
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#2c3e50', fontWeight: '500' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
              disabled={!isOnline || loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                boxSizing: 'border-box',
                opacity: (!isOnline || loading) ? 0.6 : 1
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!isOnline || loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (!isOnline || loading) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (!isOnline || loading) ? 'not-allowed' : 'pointer',
              marginBottom: '10px'
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Bỏ qua (Sử dụng offline)
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

