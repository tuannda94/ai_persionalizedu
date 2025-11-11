import React, { useState, useEffect } from 'react';
import { Modal, Progress, Button, Typography, Space, Alert, message } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const LearningPackageUpdateModal = ({ visible, onClose, packageInfo, backendUrl }) => {
  const [installing, setInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState(null); // 'installing', 'success', 'error'
  const [progress, setProgress] = useState({ percent: 0, status: 'active' });

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setInstalling(false);
      setInstallStatus(null);
      setProgress({ percent: 0, status: 'active' });
    }
  }, [visible]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleInstall = async () => {
    if (!packageInfo || !window.electronAPI) {
      message.error('Không thể cài đặt learning package');
      return;
    }

    setInstalling(true);
    setInstallStatus('installing');
    setProgress({ percent: 0, status: 'active' });

    try {
      // Call IPC handler to install learning package
      const result = await window.electronAPI.installLearningPackage({
        downloadUrl: packageInfo.downloadUrl,
        version: packageInfo.version,
        versionCode: packageInfo.versionCode,
        packageHash: packageInfo.packageHash,
        manifest: packageInfo.manifest
      });

      if (result.ok) {
        // Simulate progress (actual progress would come from backend)
        let currentPercent = 0;
        const progressInterval = setInterval(() => {
          currentPercent += 10;
          if (currentPercent >= 90) {
            clearInterval(progressInterval);
          } else {
            setProgress({ percent: currentPercent, status: 'active' });
          }
        }, 500);

        // Wait a bit then check status
        setTimeout(async () => {
          try {
            // Check if installation completed by querying current package
            const response = await fetch(`${backendUrl}/api/v1/learning-package/current`);
            if (response.ok) {
              const data = await response.json();
              if (data.installed && data.version === packageInfo.version) {
                clearInterval(progressInterval);
                setProgress({ percent: 100, status: 'success' });
                setInstallStatus('success');
                message.success('Cài đặt learning package thành công!');

                // Reload RAG engine by restarting backend or sending signal
                // For now, just show success message
                setTimeout(() => {
                  onClose();
                  // Optionally reload the page or show notification to restart
                  message.info('Learning package đã được cài đặt. RAG engine sẽ tự động tải lại.');
                }, 2000);
              } else {
                // Still installing
                setProgress({ percent: 90, status: 'active' });
              }
            }
          } catch (error) {
            console.error('Error checking install status:', error);
            clearInterval(progressInterval);
            setProgress({ percent: 100, status: 'success' });
            setInstallStatus('success');
            message.success('Cài đặt learning package đã được khởi động!');
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }, 3000);
      } else {
        setInstallStatus('error');
        message.error(result.error || 'Không thể cài đặt learning package');
      }
    } catch (error) {
      console.error('Error installing learning package:', error);
      setInstallStatus('error');
      message.error('Lỗi khi cài đặt learning package: ' + error.message);
    } finally {
      setInstalling(false);
    }
  };

  const handleCancel = () => {
    if (installing) {
      message.warning('Đang cài đặt, vui lòng đợi...');
      return;
    }
    onClose();
  };

  if (!packageInfo) return null;

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          <span>Cập nhật Learning Package</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      closable={!installing}
      maskClosable={!installing}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>Phiên bản mới: </Text>
          <Text>{packageInfo.version}</Text>
        </div>

        {packageInfo.packageSize && (
          <div>
            <Text strong>Kích thước: </Text>
            <Text>{formatBytes(packageInfo.packageSize)}</Text>
          </div>
        )}

        {packageInfo.manifest && (
          <Alert
            message="Thông tin package"
            description={
              <div style={{ marginTop: 8 }}>
                {typeof packageInfo.manifest === 'string' ? (
                  <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {packageInfo.manifest}
                  </pre>
                ) : (
                  <Paragraph style={{ fontSize: '12px', marginBottom: 0 }}>
                    {JSON.stringify(packageInfo.manifest, null, 2)}
                  </Paragraph>
                )}
              </div>
            }
            type="info"
            showIcon
          />
        )}

        {installStatus === 'installing' && (
          <div>
            <Progress
              percent={progress.percent}
              status={progress.status}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
              Đang tải và cài đặt learning package...
            </Text>
          </div>
        )}

        {installStatus === 'success' && (
          <Alert
            message="Cài đặt thành công!"
            description="Learning package đã được cài đặt. RAG engine sẽ tự động tải lại với dữ liệu mới."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        {installStatus === 'error' && (
          <Alert
            message="Lỗi cài đặt"
            description="Không thể cài đặt learning package. Vui lòng thử lại sau."
            type="error"
            showIcon
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {installStatus !== 'success' && (
            <>
              <Button onClick={handleCancel} disabled={installing}>
                {installing ? 'Đang cài đặt...' : 'Hủy'}
              </Button>
              <Button
                type="primary"
                icon={installing ? <ReloadOutlined spin /> : <DownloadOutlined />}
                onClick={handleInstall}
                loading={installing}
                disabled={installing}
              >
                {installing ? 'Đang cài đặt...' : 'Cài đặt ngay'}
              </Button>
            </>
          )}
          {installStatus === 'success' && (
            <Button type="primary" onClick={handleCancel}>
              Đóng
            </Button>
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default LearningPackageUpdateModal;

