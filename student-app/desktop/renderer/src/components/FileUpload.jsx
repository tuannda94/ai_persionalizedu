import React, { useState, useRef } from 'react';
import { Upload, Button, Image, message, Space, Tag } from 'antd';
import {
  UploadOutlined,
  FileImageOutlined,
  FileOutlined,
  DeleteOutlined,
  PaperClipOutlined
} from '@ant-design/icons';

const { Dragger } = Upload;

/**
 * File Upload Component
 * Hỗ trợ upload hình ảnh và các loại file khác
 */
const FileUpload = ({ onFilesChange, maxFiles = 5, maxSize = 10 * 1024 * 1024 }) => {
  const [fileList, setFileList] = useState([]);
  const fileInputRef = useRef(null);

  // Supported file types
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  const isImage = (file) => imageTypes.includes(file.type);
  const isDocument = (file) => documentTypes.includes(file.type);
  const isSupported = (file) => isImage(file) || isDocument(file);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (info) => {
    let newFileList = [...info.fileList];

    // Validate files
    newFileList = newFileList
      .map((file) => {
        if (file.response) {
          // File đã upload thành công
          file.url = file.response.url;
        }
        return file;
      })
      .filter((file) => {
        // Filter out files that are too large or unsupported
        if (file.size > maxSize) {
          message.error(`${file.name} quá lớn (tối đa ${formatFileSize(maxSize)})`);
          return false;
        }
        if (file.status === 'error') {
          return false;
        }
        return true;
      })
      .slice(0, maxFiles); // Limit number of files

    setFileList(newFileList);
    onFilesChange?.(newFileList);
  };

  const handleRemove = (file) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    setFileList(newFileList);
    onFilesChange?.(newFileList);
  };

  const beforeUpload = (file) => {
    if (!isSupported(file)) {
      message.error(`${file.name} không được hỗ trợ. Chỉ chấp nhận hình ảnh và tài liệu (PDF, Word, Excel, Text)`);
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto upload, we'll handle it manually
  };

  const getFileIcon = (file) => {
    if (isImage(file)) {
      return <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    }
    return <FileOutlined style={{ fontSize: 24, color: '#666' }} />;
  };

  const getFileType = (file) => {
    if (isImage(file)) return 'Hình ảnh';
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type.includes('word')) return 'Word';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'Excel';
    if (file.type === 'text/plain') return 'Text';
    if (file.type === 'text/csv') return 'CSV';
    return 'Tài liệu';
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Upload
        ref={fileInputRef}
        multiple
        fileList={fileList}
        onChange={handleFileChange}
        beforeUpload={beforeUpload}
        accept={[...imageTypes, ...documentTypes].join(',')}
        showUploadList={{
          showPreviewIcon: false,
          showRemoveIcon: true,
          removeIcon: <DeleteOutlined onClick={(e) => {
            e.stopPropagation();
          }} />
        }}
      >
        <Button
          icon={<PaperClipOutlined />}
          size="small"
          style={{ marginRight: 8 }}
        >
          Đính kèm file
        </Button>
      </Upload>

      {/* File Preview */}
      {fileList.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {fileList.map((file) => {
            const fileObj = file.originFileObj || file;

            // Get image URL safely
            let imageUrl = null;
            if (isImage(fileObj)) {
              try {
                if (fileObj instanceof File || fileObj instanceof Blob) {
                  imageUrl = URL.createObjectURL(fileObj);
                } else if (file.url) {
                  imageUrl = file.url;
                }
              } catch (error) {
                console.error('Error creating object URL:', error);
              }
            }

            return (
              <div
                key={file.uid}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 8,
                  background: '#fafafa',
                  position: 'relative',
                  maxWidth: isImage(fileObj) ? 200 : 300
                }}
              >
                {isImage(fileObj) && imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={file.name}
                    width={180}
                    height={120}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    preview={{
                      mask: 'Xem ảnh'
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', e);
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    {getFileIcon(fileObj)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </div>
                      <Space size={4} style={{ marginTop: 4 }}>
                        <Tag size="small">{getFileType(fileObj)}</Tag>
                        <span style={{ fontSize: 11, color: '#999' }}>
                          {formatFileSize(fileObj.size)}
                        </span>
                      </Space>
                    </div>
                  </div>
                )}
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(file)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    opacity: 0.7
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

