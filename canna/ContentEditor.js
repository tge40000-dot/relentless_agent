// ContentEditor.js - User-Friendly Content Editor for Non-Technical Users
// Simple, intuitive interface for managing banners, videos, and ads

import React, { useState, useEffect } from 'react';

const ContentEditor = ({ 
  apiBaseUrl = 'https://api.relentlessbillionaire.com',
  onSave,
  onCancel
}) => {
  const [contentType, setContentType] = useState('banner');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    ctaUrl: '',
    badgeType: 'promo',
    badgeText: '',
    imageUrl: '',
    videoUrl: '',
    priority: 5,
    rotationInterval: 5000,
    scheduleEnabled: false,
    startDate: '',
    endDate: '',
    targetingEnabled: false,
    membershipTiers: []
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const contentTypes = [
    { value: 'banner', label: 'Banner', icon: '🎨' },
    { value: 'video', label: 'Video Ad', icon: '🎬' },
    { value: 'sidebar', label: 'Sidebar Ad', icon: '📱' }
  ];

  const badgeTypes = [
    { value: 'promo', label: 'Promo', color: '#ff6b35' },
    { value: 'new', label: 'New', color: '#00c853' },
    { value: 'limited', label: 'Limited', color: '#ff1744' },
    { value: 'exclusive', label: 'Exclusive', color: '#7c4dff' }
  ];

  const membershipOptions = [
    { value: 'guest', label: 'Guest (Non-members)' },
    { value: 'STARTER', label: 'STARTER' },
    { value: 'PRO', label: 'PRO' },
    { value: 'ELITE', label: 'ELITE' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMembershipToggle = (tier) => {
    setFormData(prev => ({
      ...prev,
      membershipTiers: prev.membershipTiers.includes(tier)
        ? prev.membershipTiers.filter(t => t !== tier)
        : [...prev.membershipTiers, tier]
    }));
  };

  const validateForm = () => {
    if (!formData.title) return 'Title is required';
    if (!formData.ctaUrl && contentType === 'banner') return 'CTA URL is required for banners';
    if (formData.scheduleEnabled && !formData.startDate) return 'Start date is required when scheduling is enabled';
    return '';
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        contentType,
        createdAt: Date.now()
      };

      if (onSave) {
        await onSave(payload);
      }

      setSuccess('Content saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      ctaText: '',
      ctaUrl: '',
      badgeType: 'promo',
      badgeText: '',
      imageUrl: '',
      videoUrl: '',
      priority: 5,
      rotationInterval: 5000,
      scheduleEnabled: false,
      startDate: '',
      endDate: '',
      targetingEnabled: false,
      membershipTiers: []
    });
    setPreview(false);
  };

  return (
    <div className="content-editor">
      <div className="editor-header">
        <h1>Content Editor</h1>
        <p>Create and manage your banners, videos, and ads</p>
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

      <div className="editor-layout">
        {/* Form Section */}
        <div className="editor-form">
          {/* Content Type Selection */}
          <div className="form-section">
            <h2>Content Type</h2>
            <div className="content-type-selector">
              {contentTypes.map(type => (
                <button
                  key={type.value}
                  className={`type-button ${contentType === type.value ? 'active' : ''}`}
                  onClick={() => setContentType(type.value)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Content */}
          <div className="form-section">
            <h2>Content Details</h2>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter title"
              />
            </div>

            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Enter subtitle (optional)"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="form-section">
            <h2>Call to Action</h2>
            
            <div className="form-group">
              <label>Button Text</label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => handleInputChange('ctaText', e.target.value)}
                placeholder="e.g., Learn More, Join Now"
              />
            </div>

            <div className="form-group">
              <label>Button URL *</label>
              <input
                type="url"
                value={formData.ctaUrl}
                onChange={(e) => handleInputChange('ctaUrl', e.target.value)}
                placeholder="https://example.com/page"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="form-section">
            <h2>Badge</h2>
            
            <div className="form-group">
              <label>Badge Type</label>
              <select
                value={formData.badgeType}
                onChange={(e) => handleInputChange('badgeType', e.target.value)}
              >
                {badgeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Badge Text</label>
              <input
                type="text"
                value={formData.badgeText}
                onChange={(e) => handleInputChange('badgeText', e.target.value)}
                placeholder="e.g., PROMO, NEW, LIMITED"
              />
            </div>
          </div>

          {/* Media */}
          {(contentType === 'banner' || contentType === 'sidebar') && (
            <div className="form-section">
              <h2>Image</h2>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <small>Upload images using the Media Management tool</small>
              </div>
            </div>
          )}

          {contentType === 'video' && (
            <div className="form-section">
              <h2>Video</h2>
              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
                <small>Upload videos using the Media Management tool</small>
              </div>
            </div>
          )}

          {/* Display Settings */}
          <div className="form-section">
            <h2>Display Settings</h2>
            
            <div className="form-group">
              <label>Priority (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
              />
              <small>Higher priority = shown more often</small>
            </div>

            <div className="form-group">
              <label>Rotation Interval (seconds)</label>
              <input
                type="number"
                min="1"
                value={formData.rotationInterval / 1000}
                onChange={(e) => handleInputChange('rotationInterval', parseInt(e.target.value) * 1000)}
              />
              <small>How long to show before rotating</small>
            </div>
          </div>

          {/* Scheduling */}
          <div className="form-section">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.scheduleEnabled}
                  onChange={(e) => handleInputChange('scheduleEnabled', e.target.checked)}
                />
                Enable Scheduling
              </label>
            </div>

            {formData.scheduleEnabled && (
              <>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>End Date (optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Targeting */}
          <div className="form-section">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.targetingEnabled}
                  onChange={(e) => handleInputChange('targetingEnabled', e.target.checked)}
                />
                Enable Membership Targeting
              </label>
            </div>

            {formData.targetingEnabled && (
              <div className="form-group">
                <label>Show to:</label>
                <div className="membership-toggles">
                  {membershipOptions.map(option => (
                    <label key={option.value} className="membership-toggle">
                      <input
                        type="checkbox"
                        checked={formData.membershipTiers.includes(option.value)}
                        onChange={() => handleMembershipToggle(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="editor-actions">
            <button onClick={resetForm} className="action-button secondary">
              Reset
            </button>
            <button onClick={() => setPreview(!preview)} className="action-button secondary">
              {preview ? 'Hide Preview' : 'Show Preview'}
            </button>
            {onCancel && (
              <button onClick={onCancel} className="action-button secondary">
                Cancel
              </button>
            )}
            <button onClick={handleSave} className="action-button primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {preview && (
          <div className="editor-preview">
            <h2>Preview</h2>
            <div className="preview-container">
              <div className="preview-banner">
                {formData.badgeText && (
                  <span className="preview-badge">{formData.badgeText}</span>
                )}
                {formData.title && <h3>{formData.title}</h3>}
                {formData.subtitle && <p className="preview-subtitle">{formData.subtitle}</p>}
                {formData.description && <p className="preview-description">{formData.description}</p>}
                {formData.ctaText && formData.ctaUrl && (
                  <a href={formData.ctaUrl} className="preview-cta">{formData.ctaText}</a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .content-editor {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .editor-header {
          margin-bottom: 30px;
        }

        .editor-header h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          color: #333;
        }

        .editor-header p {
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

        .editor-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
        }

        .editor-form {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .editor-preview {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .form-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #333;
        }

        .content-type-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .type-button {
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .type-button:hover {
          border-color: #667eea;
        }

        .type-button.active {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .type-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }

        .type-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group small {
          display: block;
          margin-top: 4px;
          color: #666;
          font-size: 12px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .membership-toggles {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .membership-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-button.primary {
          background: #667eea;
          color: white;
        }

        .action-button.primary:hover {
          background: #5568d3;
        }

        .action-button.primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .action-button.secondary {
          background: #f0f0f0;
          color: #333;
        }

        .action-button.secondary:hover {
          background: #e0e0e0;
        }

        .preview-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          padding: 20px;
          min-height: 200px;
        }

        .preview-banner {
          text-align: center;
          color: white;
        }

        .preview-badge {
          display: inline-block;
          background: #ff6b35;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .preview-banner h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        .preview-subtitle {
          margin: 0 0 12px 0;
          font-size: 16px;
          opacity: 0.95;
        }

        .preview-description {
          margin: 0 0 20px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .preview-cta {
          display: inline-block;
          background: #ff6b35;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .editor-layout {
            grid-template-columns: 1fr;
          }

          .editor-preview {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .content-editor {
            padding: 16px;
          }

          .content-type-selector {
            grid-template-columns: 1fr;
          }

          .editor-actions {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentEditor;
