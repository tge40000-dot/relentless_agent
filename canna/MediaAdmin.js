// MediaAdmin.js - Media Management Admin Interface
// Simple, user-friendly interface for managing media uploads

import React, { useState, useEffect } from 'react';

const MediaAdmin = ({ apiBaseUrl = 'https://api.relentlessbillionaire.com' }) => {
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('misc');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { value: 'videos', label: 'Videos' },
    { value: 'images', label: 'Images' },
    { value: 'audio', label: 'Audio/Beats' },
    { value: 'banners', label: 'Banners' },
    { value: 'thumbnails', label: 'Thumbnails' },
    { value: 'misc', label: 'Miscellaneous' }
  ];

  // Load media files on mount
  useEffect(() => {
    loadMediaFiles();
  }, [selectedCategory]);

  const loadMediaFiles = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/secure/media/list?category=${selectedCategory}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files || []);
      } else {
        setError('Failed to load media files');
      }
    } catch (err) {
      setError('Error loading media files');
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only images and videos allowed.');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Max size is 100MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", selectedCategory);

      const response = await fetch(`${apiBaseUrl}/api/admin/secure/media/upload`, {
        method: "POST",
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('File uploaded successfully!');
        loadMediaFiles();
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Error uploading file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/secure/media/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (response.ok) {
        setSuccess('File deleted successfully!');
        loadMediaFiles();
      } else {
        setError('Failed to delete file');
      }
    } catch (err) {
      setError('Error deleting file');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('URL copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="media-admin">
      <div className="media-admin-header">
        <h1>Media Management</h1>
        <p>Upload and manage your media files</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <h2>Upload New File</h2>
        
        <div className="upload-controls">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file">Select File</label>
            <input
              id="file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <small>Max file size: 100MB. Supported: JPG, PNG, GIF, WEBP, MP4, WEBM</small>
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span>Uploading... {uploadProgress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Files List */}
      <div className="files-section">
        <div className="files-header">
          <h2>Files in {categories.find(c => c.value === selectedCategory)?.label}</h2>
          <button onClick={loadMediaFiles} className="refresh-button">
            Refresh
          </button>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <p>No files in this category</p>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <div key={file.key} className="file-card">
                <div className="file-preview">
                  {file.key.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={`https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/rbb/${file.key}`}
                      alt={file.key}
                    />
                  ) : (
                    <div className="video-preview">
                      <span>📹</span>
                    </div>
                  )}
                </div>

                <div className="file-info">
                  <h3>{file.key.split('/').pop()}</h3>
                  <p>Size: {formatFileSize(file.size)}</p>
                  <p>Uploaded: {new Date(file.uploaded).toLocaleDateString()}</p>
                </div>

                <div className="file-actions">
                  <button
                    onClick={() => copyToClipboard(`https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/rbb/${file.key}`)}
                    className="action-button copy-button"
                    title="Copy URL"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDelete(file.key)}
                    className="action-button delete-button"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .media-admin {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .media-admin-header {
          margin-bottom: 30px;
        }

        .media-admin-header h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          color: #333;
        }

        .media-admin-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .alert-success {
          background: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }

        .alert button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
        }

        .upload-section,
        .files-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .upload-section h2,
        .files-section h2 {
          margin: 0 0 20px 0;
          font-size: 24px;
          color: #333;
        }

        .upload-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-group select,
        .form-group input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group small {
          color: #666;
          font-size: 12px;
        }

        .upload-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #4CAF50;
          transition: width 0.3s ease;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .refresh-button {
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .refresh-button:hover {
          background: #5568d3;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .file-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .file-preview {
          width: 100%;
          height: 160px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-preview {
          font-size: 48px;
        }

        .file-info {
          padding: 12px;
        }

        .file-info h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-info p {
          margin: 4px 0;
          font-size: 12px;
          color: #666;
        }

        .file-actions {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e0e0e0;
        }

        .action-button {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .copy-button {
          background: #f0f0f0;
        }

        .copy-button:hover {
          background: #e0e0e0;
        }

        .delete-button {
          background: #fee;
        }

        .delete-button:hover {
          background: #fcc;
        }

        @media (max-width: 768px) {
          .media-admin {
            padding: 16px;
          }

          .files-grid {
            grid-template-columns: 1fr;
          }

          .files-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default MediaAdmin;
