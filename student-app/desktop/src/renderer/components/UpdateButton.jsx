/**
 * Update Button Component
 * Hiển thị button cập nhật và progress
 */
import React, { useState, useEffect } from 'react';

const UpdateButton = ({ backendUrl }) => {
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, downloaded, error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState({ percent: 0, transferred: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen to online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to update events from main process
    if (window.electronAPI) {
      window.electronAPI.onUpdateStatus?.((status, data) => {
        setUpdateStatus(status.status || 'idle');
        if (data) setUpdateInfo(data);
      });

      window.electronAPI.onUpdateProgress?.((progressData) => {
        setProgress(progressData);
        setUpdateStatus('downloading');
      });
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
    try {
      // Trigger update check from main process
      // Local backend không có endpoint /api/v1/updates/check
      // Update check được xử lý bởi main process (updater.js) gọi remote API
      if (window.electronAPI?.checkForUpdates) {
        window.electronAPI.checkForUpdates();
      } else {
        console.warn('Update check not available - electronAPI not found');
        setUpdateStatus('error');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateStatus('error');
    }
  };

  const handleDownloadUpdate = () => {
    if (window.electronAPI?.downloadUpdate) {
      window.electronAPI.downloadUpdate();
      setUpdateStatus('downloading');
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (transferred, total, percent) => {
    if (percent === 0 || !total) return '0 KB/s';
    // Estimate speed (simplified)
    return formatBytes(transferred / 10) + '/s';
  };

  if (!isOnline) {
    return (
      <div style={{
        padding: '8px 12px',
        background: '#f3f4f6',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>🔴</span>
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Update Button */}
      <button
        onClick={handleCheckUpdate}
        disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
        style={{
          padding: '8px 16px',
          background: updateStatus === 'available' ? '#10b981' :
                     updateStatus === 'downloading' ? '#3b82f6' :
                     updateStatus === 'downloaded' ? '#10b981' :
                     '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: updateStatus === 'checking' || updateStatus === 'downloading' ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: (updateStatus === 'checking' || updateStatus === 'downloading') ? 0.7 : 1
        }}
      >
        {updateStatus === 'checking' && <span>⏳</span>}
        {updateStatus === 'available' && <span>⬇️</span>}
        {updateStatus === 'downloading' && <span>⬇️</span>}
        {updateStatus === 'downloaded' && <span>✅</span>}
        {updateStatus === 'idle' && <span>🔄</span>}
        {updateStatus === 'checking' && 'Đang kiểm tra...'}
        {updateStatus === 'available' && 'Cập nhật có sẵn'}
        {updateStatus === 'downloading' && 'Đang tải...'}
        {updateStatus === 'downloaded' && 'Cài đặt ngay'}
        {updateStatus === 'idle' && 'Kiểm tra cập nhật'}
      </button>

      {/* Progress Bar */}
      {(updateStatus === 'downloading' || updateStatus === 'available') && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          padding: '12px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '300px'
        }}>
          {updateStatus === 'available' && updateInfo && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                Phiên bản mới: {updateInfo.latest_version}
              </div>
              {updateInfo.release_notes && (
                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                  {updateInfo.release_notes}
                </div>
              )}
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                Kích thước: {formatBytes(updateInfo.file_size || 0)}
              </div>
              <button
                onClick={handleDownloadUpdate}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Tải xuống và cài đặt
              </button>
            </div>
          )}

          {updateStatus === 'downloading' && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                Đang tải cập nhật...
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: `${progress.percent || 0}%`,
                  height: '100%',
                  background: '#3b82f6',
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                <span>{Math.round(progress.percent || 0)}%</span>
                <span>
                  {formatBytes(progress.transferred || 0)} / {formatBytes(progress.total || 0)}
                </span>
                <span>{formatSpeed(progress.transferred, progress.total, progress.percent)}</span>
              </div>
              {progress.percent === 100 && (
                <button
                  onClick={handleInstallUpdate}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cài đặt và khởi động lại
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {updateStatus === 'error' && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          padding: '8px 12px',
          background: '#fee2e2',
          color: '#dc2626',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          Lỗi khi kiểm tra cập nhật. Thử lại sau.
        </div>
      )}
    </div>
  );
};

export default UpdateButton;

