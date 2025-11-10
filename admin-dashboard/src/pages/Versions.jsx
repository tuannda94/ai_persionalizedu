import React, { useState, useEffect } from 'react';
import { versionsAPI } from '../services/api';

function Versions() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [platform, setPlatform] = useState('windows');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    version: '',
    version_code: '',
    platform: 'windows',
    release_type: 'stable',
    release_notes: '',
    is_mandatory: false,
    min_version_code: ''
  });

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await versionsAPI.list();
      setVersions(response.data || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
      // Don't show alert if it's a 401 - interceptor will handle redirect
      if (error.response?.status !== 401) {
        alert('Failed to load versions: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    if (!formData.version || !formData.version_code) {
      alert('Please fill in version and version code');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('version', formData.version);
      uploadFormData.append('version_code', formData.version_code);
      uploadFormData.append('platform', formData.platform);
      uploadFormData.append('release_type', formData.release_type);
      uploadFormData.append('release_notes', formData.release_notes || '');
      uploadFormData.append('is_mandatory', formData.is_mandatory);
      if (formData.min_version_code) {
        uploadFormData.append('min_version_code', formData.min_version_code);
      }

      const response = await versionsAPI.upload(uploadFormData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      alert('Version uploaded successfully!');
      setShowUpload(false);
      setSelectedFile(null);
      setFormData({
        version: '',
        version_code: '',
        platform: 'windows',
        release_type: 'stable',
        release_notes: '',
        is_mandatory: false,
        min_version_code: ''
      });
      loadVersions();
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePublish = async (versionId, published) => {
    try {
      await versionsAPI.update(versionId, {
        published_at: published ? new Date().toISOString() : null
      });
      loadVersions();
    } catch (error) {
      console.error('Failed to update version:', error);
      alert('Failed to update version');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Version Management</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showUpload ? 'Cancel' : 'Upload New Version'}
        </button>
      </div>

      {showUpload && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2>Upload New Version</h2>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Installer File *
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".exe,.msi,.dmg,.deb,.AppImage"
                required
                style={{ width: '100%', padding: '8px' }}
              />
              {selectedFile && (
                <p style={{ marginTop: '5px', color: '#666' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Version * (e.g., 1.2.3)
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.2.3"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Version Code * (e.g., 10203)
                </label>
                <input
                  type="number"
                  value={formData.version_code}
                  onChange={(e) => setFormData({ ...formData, version_code: e.target.value })}
                  placeholder="10203"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Platform *
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="windows">Windows</option>
                  <option value="macos">macOS</option>
                  <option value="linux">Linux</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Release Type *
                </label>
                <select
                  value={formData.release_type}
                  onChange={(e) => setFormData({ ...formData, release_type: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="stable">Stable</option>
                  <option value="beta">Beta</option>
                  <option value="alpha">Alpha</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Release Notes
              </label>
              <textarea
                value={formData.release_notes}
                onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                placeholder="What's new in this version..."
                rows="4"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                />
                <span style={{ fontWeight: 'bold' }}>Mandatory Update</span>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Minimum Version Code (optional)
              </label>
              <input
                type="number"
                value={formData.min_version_code}
                onChange={(e) => setFormData({ ...formData, min_version_code: e.target.value })}
                placeholder="10000"
                style={{ width: '100%', padding: '8px' }}
              />
              <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                Users with version code below this will be forced to update
              </p>
            </div>

            {uploading && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  width: '100%',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: '#007bff',
                    height: '20px',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <p style={{ marginTop: '5px', textAlign: 'center' }}>
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              style={{
                padding: '10px 20px',
                backgroundColor: uploading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Version'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2>Version List</h2>
        {loading ? (
          <p>Loading...</p>
        ) : versions.length === 0 ? (
          <p>No versions found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Version</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Platform</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Size</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Mandatory</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Published</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{version.version}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{version.platform}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{version.release_type}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatFileSize(version.file_size)}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {version.is_mandatory ? '✅' : '❌'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {formatDate(version.published_at)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {version.published_at ? (
                      <button
                        onClick={() => handlePublish(version.id, false)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ffc107',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(version.id, true)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Publish
                      </button>
                    )}
                    <a
                      href={version.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Versions;
