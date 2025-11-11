/**
 * UI Components for Desktop App
 * Inline components (no JSX, using React.createElement)
 */

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { ReloadOutlined, DownloadOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * Update Button Component
 */
export const UpdateButton = ({ backendUrl }) => {
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState({ percent: 0, transferred: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.electronAPI) {
      const updateStatusHandler = (data) => {
        setUpdateStatus(data.status || 'idle');
        if (data.version) setUpdateInfo(data);
        if (data.status === 'available' || data.status === 'downloading') {
          setShowProgress(true);
        }
      };

      const updateProgressHandler = (progressData) => {
        setProgress(progressData);
        setUpdateStatus('downloading');
      };

      window.electronAPI.onUpdateStatus?.(updateStatusHandler);
      window.electronAPI.onUpdateProgress?.(updateProgressHandler);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckUpdate = async () => {
    if (!isOnline) {
      alert('Không có kết nối internet. Vui lòng kiểm tra kết nối mạng.');
      return;
    }

    setUpdateStatus('checking');
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates();
    }
  };

  const handleDownloadUpdate = () => {
    if (window.electronAPI?.downloadUpdate) {
      window.electronAPI.downloadUpdate();
      setUpdateStatus('downloading');
      setShowProgress(true);
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOnline) {
    return React.createElement('div', {
      style: {
        padding: '8px 12px',
        background: '#f3f4f6',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    }, React.createElement('span', null, '🔴'), React.createElement('span', null, 'Offline'));
  }

  const getButtonProps = () => {
    switch (updateStatus) {
      case 'checking':
        return {
          icon: React.createElement(LoadingOutlined),
          children: 'Đang kiểm tra...',
          type: 'default',
          loading: true
        };
      case 'available':
        return {
          icon: React.createElement(DownloadOutlined),
          children: 'Cập nhật có sẵn',
          type: 'primary',
          style: { background: '#10b981', borderColor: '#10b981' }
        };
      case 'downloading':
        return {
          icon: React.createElement(DownloadOutlined),
          children: 'Đang tải...',
          type: 'primary',
          loading: true,
          style: { background: '#3b82f6', borderColor: '#3b82f6' }
        };
      case 'downloaded':
        return {
          icon: React.createElement(CheckCircleOutlined),
          children: 'Cài đặt ngay',
          type: 'primary',
          style: { background: '#10b981', borderColor: '#10b981' }
        };
      default:
        return {
          icon: React.createElement(ReloadOutlined),
          children: 'Kiểm tra cập nhật',
          type: 'default'
        };
    }
  };

  return React.createElement('div', { style: { position: 'relative', display: 'inline-block' } },
    React.createElement(Button, {
      ...getButtonProps(),
      onClick: handleCheckUpdate,
      disabled: updateStatus === 'checking' || updateStatus === 'downloading'
    }),

    showProgress && (updateStatus === 'downloading' || updateStatus === 'available') && React.createElement('div', {
      style: {
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '8px',
        padding: '12px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 1000,
        minWidth: '300px'
      }
    },
      updateStatus === 'available' && updateInfo && React.createElement('div', null,
        React.createElement('div', { style: { marginBottom: '8px', fontWeight: 'bold' } },
          `Phiên bản mới: ${updateInfo.version || updateInfo.latest_version}`
        ),
        updateInfo.release_notes && React.createElement('div', {
          style: { marginBottom: '8px', fontSize: '12px', color: '#6b7280' }
        }, updateInfo.release_notes),
        React.createElement('button', {
          onClick: handleDownloadUpdate,
          style: {
            width: '100%',
            padding: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }
        }, 'Tải xuống và cài đặt')
      ),
      updateStatus === 'downloading' && React.createElement('div', null,
        React.createElement('div', { style: { marginBottom: '8px', fontWeight: 'bold' } },
          'Đang tải cập nhật...'
        ),
        React.createElement('div', {
          style: {
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px'
          }
        }, React.createElement('div', {
          style: {
            width: `${progress.percent || 0}%`,
            height: '100%',
            background: '#3b82f6',
            transition: 'width 0.3s'
          }
        })),
        React.createElement('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#6b7280'
          }
        },
          React.createElement('span', null, `${Math.round(progress.percent || 0)}%`),
          React.createElement('span', null,
            `${formatBytes(progress.transferred || 0)} / ${formatBytes(progress.total || 0)}`
          )
        ),
        progress.percent === 100 && React.createElement('button', {
          onClick: handleInstallUpdate,
          style: {
            width: '100%',
            marginTop: '8px',
            padding: '8px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }
        }, 'Cài đặt và khởi động lại')
      )
    )
  );
};

/**
 * Offline Indicator Component
 */
export const OfflineIndicator = ({ children, onOnlineChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      if (onOnlineChange) onOnlineChange(true);
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onOnlineChange) onOnlineChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    if (onOnlineChange) onOnlineChange(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnlineChange]);

  return React.createElement(React.Fragment, null,
    !isOnline && React.createElement('div', {
      style: {
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
      }
    }, '🔴 Không có kết nối internet. Một số tính năng có thể không hoạt động.'),

    wasOffline && isOnline && React.createElement('div', {
      style: {
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }, '✅ Đã kết nối lại internet'),

    React.createElement('div', { style: { position: 'relative' } },
      children,
      !isOnline && React.createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          zIndex: 9999
        }
      })
    )
  );
};

