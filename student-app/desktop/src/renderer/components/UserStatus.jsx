import React, { useState, useEffect } from 'react';

function UserStatus({ onLogout }) {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [pendingLogs, setPendingLogs] = useState(0);

  useEffect(() => {
    // Load user info
    const userStr = localStorage.getItem('user');
    const authStatus = localStorage.getItem('is_authenticated') === 'true';

    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
        setIsAuthenticated(authStatus);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    // Load app version
    if (window.electronAPI && window.electronAPI.getVersion) {
      const version = window.electronAPI.getVersion();
      setAppVersion(version || '1.0.0');
    } else {
      // Fallback: try to get from package.json
      fetch('/package.json')
        .then(res => res.json())
        .then(pkg => setAppVersion(pkg.version || '1.0.0'))
        .catch(() => setAppVersion('1.0.0'));
    }

    // Monitor online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending logs periodically
    const checkPendingLogs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/offline-logs/count');
        if (response.ok) {
          const data = await response.json();
          setPendingLogs(data.count || 0);
        }
      } catch (e) {
        // Ignore errors
      }
    };

    checkPendingLogs();
    const logsInterval = setInterval(checkPendingLogs, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(logsInterval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.setItem('is_authenticated', 'false');
    setUser(null);
    setIsAuthenticated(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      fontSize: '13px'
    }}>
      {/* Online/Offline Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#10b981' : '#ef4444'
        }} />
        <span style={{ color: isOnline ? '#10b981' : '#ef4444', fontWeight: '500' }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />

      {/* Authentication Status */}
      {isAuthenticated && user ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#3b82f6' }}>✓</span>
            <span style={{ color: '#374151' }}>
              {user.full_name || user.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <span style={{ color: '#6b7280' }}>Chưa đăng nhập</span>
      )}

      {/* Pending Logs */}
      {pendingLogs > 0 && (
        <>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#f59e0b' }}>📤</span>
            <span style={{ color: '#92400e' }}>
              {pendingLogs} logs chờ gửi
            </span>
          </div>
        </>
      )}

      {/* App Version */}
      <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />
      <span style={{ color: '#6b7280' }}>
        v{appVersion}
      </span>
    </div>
  );
}

export default UserStatus;

