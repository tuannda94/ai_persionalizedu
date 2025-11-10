import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/documents/list');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      if (shouldShowError(error)) {
        const message = handleApiError(error, 'Failed to load documents');
        if (message) {
          alert(message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadData.title) {
        setUploadData({ ...uploadData, title: file.name });
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Vui lòng chọn file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description || '');
      formData.append('category', uploadData.category || '');

      const response = await api.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      alert('Upload thành công!');
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadData({ title: '', description: '', category: '' });
      setUploadProgress(0);
      loadDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      if (shouldShowError(error)) {
        const message = handleApiError(error, 'Failed to upload document');
        if (message) {
          alert(message);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Bạn có chắc muốn xóa "${filename}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/documents/${filename}`);
      alert('Xóa thành công!');
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      if (shouldShowError(error)) {
        const message = handleApiError(error, 'Failed to delete document');
        if (message) {
          alert(message);
        }
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Quản lý Tài liệu</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showUploadForm ? 'Hủy' : '+ Upload Tài liệu'}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '5px',
          border: '1px solid #e5e7eb'
        }}>
          <h2>Upload Tài liệu mới</h2>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                File *
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                required
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Tiêu đề *
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                required
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Mô tả
              </label>
              <textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                disabled={uploading}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Danh mục
              </label>
              <input
                type="text"
                value={uploadData.category}
                onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                disabled={uploading}
                placeholder="Ví dụ: Lecture, Assignment, Reference..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            {uploading && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', color: '#6b7280' }}>
                  {uploadProgress}%
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !uploadFile}
              style={{
                padding: '10px 20px',
                backgroundColor: uploading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Đang upload...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Tên file</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Kích thước</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Cập nhật</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    Chưa có tài liệu nào
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>{doc.filename}</td>
                    <td style={{ padding: '12px' }}>{formatFileSize(doc.size || 0)}</td>
                    <td style={{ padding: '12px' }}>{formatDate(doc.last_modified)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <a
                          href={doc.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}
                        >
                          Download
                        </a>
                        <button
                          onClick={() => handleDelete(doc.filename)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Documents;

