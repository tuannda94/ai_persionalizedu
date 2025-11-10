import React, { useState, useEffect } from 'react';
import { packagesAPI } from '../services/api';
import { handleApiError, shouldShowError } from '../utils/errorHandler';

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPackageFile, setSelectedPackageFile] = useState(null);
  const [selectedManifestFile, setSelectedManifestFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    subject: '',
    version: '',
    description: ''
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const response = await packagesAPI.list();
      setPackages(response.data || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      if (shouldShowError(error)) {
        const message = handleApiError(error, 'Failed to load packages');
        if (message) {
          alert(message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePackageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPackageFile(file);
    }
  };

  const handleManifestFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedManifestFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedPackageFile) {
      alert('Please select a package file');
      return;
    }

    if (!formData.subject || !formData.version) {
      alert('Please fill in subject and version');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedPackageFile);
      if (selectedManifestFile) {
        uploadFormData.append('manifest', selectedManifestFile);
      }
      uploadFormData.append('subject', formData.subject);
      uploadFormData.append('version', formData.version);
      uploadFormData.append('description', formData.description || '');

      const response = await packagesAPI.upload(uploadFormData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      alert('Package uploaded successfully!');
      setShowUpload(false);
      setSelectedPackageFile(null);
      setSelectedManifestFile(null);
      setFormData({
        subject: '',
        version: '',
        description: ''
      });
      loadPackages();
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleToggleActive = async (packageId, isActive) => {
    try {
      await packagesAPI.update(packageId, { is_active: !isActive });
      loadPackages();
    } catch (error) {
      console.error('Failed to update package:', error);
      alert('Failed to update package');
    }
  };

  const handleDelete = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await packagesAPI.delete(packageId);
      loadPackages();
    } catch (error) {
      console.error('Failed to delete package:', error);
      alert('Failed to delete package');
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
        <h1>Model Package Management</h1>
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
          {showUpload ? 'Cancel' : 'Upload New Package'}
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
          <h2>Upload New Package</h2>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Package File * (zip or tar.gz)
              </label>
              <input
                type="file"
                onChange={handlePackageFileSelect}
                accept=".zip,.tar,.gz,.tar.gz"
                required
                style={{ width: '100%', padding: '8px' }}
              />
              {selectedPackageFile && (
                <p style={{ marginTop: '5px', color: '#666' }}>
                  Selected: {selectedPackageFile.name} ({(selectedPackageFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Manifest File (optional - manifest.json)
              </label>
              <input
                type="file"
                onChange={handleManifestFileSelect}
                accept=".json"
                style={{ width: '100%', padding: '8px' }}
              />
              {selectedManifestFile && (
                <p style={{ marginTop: '5px', color: '#666' }}>
                  Selected: {selectedManifestFile.name}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Subject * (e.g., CS101, PHP1)
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value.toUpperCase() })}
                  placeholder="CS101"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Version * (e.g., v1, v2)
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value.toLowerCase() })}
                  placeholder="v1"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Package description..."
                rows="3"
                style={{ width: '100%', padding: '8px' }}
              />
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
              {uploading ? 'Uploading...' : 'Upload Package'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2>Package List</h2>
        {loading ? (
          <p>Loading...</p>
        ) : packages.length === 0 ? (
          <p>No packages found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Subject</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Version</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Size</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Active</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Published</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{pkg.subject}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{pkg.version}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatFileSize(pkg.file_size)}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {pkg.is_active ? '✅' : '❌'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {formatDate(pkg.published_at)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button
                      onClick={() => handleToggleActive(pkg.id, pkg.is_active)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: pkg.is_active ? '#ffc107' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px'
                      }}
                    >
                      {pkg.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <a
                      href={pkg.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginRight: '5px',
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
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
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

export default Packages;

