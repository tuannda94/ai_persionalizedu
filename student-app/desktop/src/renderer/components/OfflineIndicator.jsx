/**
 * Offline Indicator Component
 * Hiển thị trạng thái online/offline và disable features khi offline
 */
import React, { useState, useEffect } from 'react';

const OfflineIndicator = ({ children, onOnlineChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      if (onOnlineChange) onOnlineChange(true);
      // Show reconnected message
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onOnlineChange) onOnlineChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    if (onOnlineChange) onOnlineChange(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnlineChange]);

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#f59e0b',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 10000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🔴 Không có kết nối internet. Một số tính năng có thể không hoạt động.
        </div>
      )}

      {/* Reconnected Message */}
      {wasOffline && isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#10b981',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 10000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          ✅ Đã kết nối lại internet
        </div>
      )}

      {/* Content with offline overlay */}
      <div style={{ position: 'relative' }}>
        {children}
        {!isOnline && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            zIndex: 9999
          }} />
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default OfflineIndicator;

