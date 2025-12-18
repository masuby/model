/**
 * USER PROFILE COMPONENT
 * Display and edit user profile information
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../services/authService';
import './Auth.css';

const UserProfile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await updateProfile(user.id, formData);

    if (result.success) {
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || ''
    });
    setIsEditing(false);
    setError('');
  };

  const getRoleBadge = (role) => {
    const badges = {
      [USER_ROLES.ADMIN]: { icon: '👨‍💼', label: 'Administrator', color: '#9C27B0' },
      [USER_ROLES.PMO_OFFICER]: { icon: '🏛️', label: 'PMO Officer', color: '#2196F3' },
      [USER_ROLES.REGIONAL_OFFICER]: { icon: '📍', label: 'Regional Officer', color: '#FF9800' },
      [USER_ROLES.PUBLIC_USER]: { icon: '👤', label: 'Public User', color: '#4CAF50' }
    };
    return badges[role] || { icon: '👤', label: 'User', color: '#666' };
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="profile-info">
          <h1>{user?.name || 'User'}</h1>
          <div className="profile-role" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          <p className="profile-email">{user?.email}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={logout}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#2196F3';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.color = 'white';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {success && (
        <div className="auth-success">
          <span className="error-icon">✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="auth-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="profile-content">
        {/* Personal Information */}
        <div className="profile-section">
          <h2>
            <span>👤</span> Personal Information
          </h2>

          {!isEditing ? (
            <>
              <div className="info-item">
                <div className="info-label">Full Name</div>
                <div className="info-value">{user?.name || 'Not set'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Email Address</div>
                <div className="info-value">{user?.email || 'Not set'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Phone Number</div>
                <div className="info-value">{user?.phone || 'Not set'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Department</div>
                <div className="info-value">{user?.department || 'Not set'}</div>
              </div>

              {user?.region && (
                <div className="info-item">
                  <div className="info-label">Region</div>
                  <div className="info-value">{user.region}</div>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="btn-auth-primary"
                style={{ marginTop: '20px' }}
              >
                ✏️ Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn-auth-primary"
                  style={{ flex: 1 }}
                >
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: '#E0E0E0',
                    color: '#666',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Details */}
        <div className="profile-section">
          <h2>
            <span>🔐</span> Account Details
          </h2>

          <div className="info-item">
            <div className="info-label">User ID</div>
            <div className="info-value">{user?.id}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Role</div>
            <div className="info-value" style={{ color: badge.color }}>
              {badge.icon} {badge.label}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Account Created</div>
            <div className="info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A'}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Account Status</div>
            <div className="info-value" style={{ color: '#4CAF50' }}>
              ✅ Active
            </div>
          </div>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#F5F5F5',
            borderRadius: '10px',
            border: '2px solid #E0E0E0'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '14px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Permissions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user?.role === USER_ROLES.ADMIN && (
                <>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Full system access</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ User management</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Issue warnings</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Export reports</div>
                </>
              )}
              {user?.role === USER_ROLES.PMO_OFFICER && (
                <>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Issue warnings</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ View all data</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Export reports</div>
                </>
              )}
              {user?.role === USER_ROLES.REGIONAL_OFFICER && (
                <>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ View regional data</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Export reports</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>❌ Issue warnings</div>
                </>
              )}
              {user?.role === USER_ROLES.PUBLIC_USER && (
                <>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ View public data</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>✅ Educational content</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>❌ Export reports</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
