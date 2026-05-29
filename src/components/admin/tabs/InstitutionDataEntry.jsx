/**
 * INSTITUTION DATA ENTRY TAB
 * Allows institutions and regional officers to submit hazard/risk data
 */

import React, { useState, useEffect } from 'react';
import { INSTITUTIONS, USER_ROLES, REGIONS } from '../../../services/authService';
import './TabStyles.css';

function InstitutionDataEntry({ user }) {
  const [activeSection, setActiveSection] = useState('new-entry');
  const [formData, setFormData] = useState({
    hazardType: '',
    region: '',
    district: '',
    severity: 'moderate',
    probability: 50,
    startDate: '',
    endDate: '',
    description: '',
    dataSource: '',
    confidence: 'medium'
  });
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState([]);

  // Get hazard types based on user's institution
  const getHazardTypes = () => {
    if (user?.role === USER_ROLES.INSTITUTION_USER && user.institution) {
      const inst = INSTITUTIONS[user.institution];
      return inst?.hazardTypes || [];
    }
    // Regional officers can submit general hazard data
    return ['flood', 'drought', 'earthquake', 'disease_outbreak', 'other'];
  };

  // Get available regions
  const getAvailableRegions = () => {
    if (user?.role === USER_ROLES.REGIONAL_OFFICER && user.region) {
      return [user.region];
    }
    return REGIONS;
  };

  useEffect(() => {
    loadSubmissionHistory();
    loadDrafts();
  }, []);

  const loadSubmissionHistory = () => {
    // Mock submission history
    const mockHistory = [
      {
        id: 'ENT-001',
        hazardType: 'flood',
        region: 'Dar es Salaam',
        status: 'approved',
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        reviewedAt: new Date().toISOString()
      },
      {
        id: 'ENT-002',
        hazardType: 'drought',
        region: 'Dodoma',
        status: 'pending',
        submittedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'ENT-003',
        hazardType: 'heavy_rain',
        region: 'Mwanza',
        status: 'under_review',
        submittedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    setSubmissions(mockHistory);
  };

  const loadDrafts = () => {
    // Load saved drafts from localStorage
    const savedDrafts = localStorage.getItem(`drafts_${user?.id}`);
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = () => {
    const draft = {
      id: `DRAFT-${Date.now()}`,
      ...formData,
      savedAt: new Date().toISOString()
    };
    const newDrafts = [...drafts, draft];
    setDrafts(newDrafts);
    localStorage.setItem(`drafts_${user?.id}`, JSON.stringify(newDrafts));
    alert('Draft saved successfully!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form
    if (!formData.hazardType || !formData.region || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const submission = {
      id: `ENT-${Date.now()}`,
      ...formData,
      institution: user?.institution || 'REGIONAL',
      submittedBy: user?.name || 'User',
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    setSubmissions(prev => [submission, ...prev]);

    // Reset form
    setFormData({
      hazardType: '',
      region: '',
      district: '',
      severity: 'moderate',
      probability: 50,
      startDate: '',
      endDate: '',
      description: '',
      dataSource: '',
      confidence: 'medium'
    });

    alert('Data submitted successfully! It will be reviewed by PMO.');
  };

  const loadDraft = (draft) => {
    setFormData({
      hazardType: draft.hazardType || '',
      region: draft.region || '',
      district: draft.district || '',
      severity: draft.severity || 'moderate',
      probability: draft.probability || 50,
      startDate: draft.startDate || '',
      endDate: draft.endDate || '',
      description: draft.description || '',
      dataSource: draft.dataSource || '',
      confidence: draft.confidence || 'medium'
    });
    setActiveSection('new-entry');
  };

  const deleteDraft = (draftId) => {
    const newDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(newDrafts);
    localStorage.setItem(`drafts_${user?.id}`, JSON.stringify(newDrafts));
  };

  const getInstitutionLabel = () => {
    if (user?.role === USER_ROLES.INSTITUTION_USER && user.institution) {
      const inst = INSTITUTIONS[user.institution];
      return `${inst?.icon || ''} ${inst?.name || user.institution}`;
    }
    if (user?.role === USER_ROLES.REGIONAL_OFFICER) {
      return `Regional Officer - ${user.region || 'All Regions'}`;
    }
    return 'Data Entry';
  };

  return (
    <div className="tab-content institution-data-entry">
      <div className="tab-header">
        <h3>{getInstitutionLabel()}</h3>
        <div className="tab-nav">
          <button
            className={`tab-nav-btn ${activeSection === 'new-entry' ? 'active' : ''}`}
            onClick={() => setActiveSection('new-entry')}
          >
            New Entry
          </button>
          <button
            className={`tab-nav-btn ${activeSection === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveSection('drafts')}
          >
            Drafts ({drafts.length})
          </button>
          <button
            className={`tab-nav-btn ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            Submission History
          </button>
        </div>
      </div>

      {activeSection === 'new-entry' && (
        <form className="data-entry-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Hazard Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Hazard Type *</label>
                <select
                  name="hazardType"
                  value={formData.hazardType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select hazard type...</option>
                  {getHazardTypes().map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Severity Level</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="severe">Severe</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>

              <div className="form-group">
                <label>Probability (%)</label>
                <input
                  type="range"
                  name="probability"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleInputChange}
                />
                <span className="range-value">{formData.probability}%</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Location</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Region *</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select region...</option>
                  {getAvailableRegions().map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter district name"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Time Period</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Details</h4>
            <div className="form-group full-width">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed description of the hazard data..."
                rows={4}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Data Source</label>
                <input
                  type="text"
                  name="dataSource"
                  value={formData.dataSource}
                  onChange={handleInputChange}
                  placeholder="e.g., Field observation, Satellite data"
                />
              </div>

              <div className="form-group">
                <label>Confidence Level</label>
                <select
                  name="confidence"
                  value={formData.confidence}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleSaveDraft}>
              Save as Draft
            </button>
            <button type="submit" className="btn-primary">
              Submit for Review
            </button>
          </div>
        </form>
      )}

      {activeSection === 'drafts' && (
        <div className="drafts-section">
          {drafts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No drafts saved</p>
            </div>
          ) : (
            <div className="drafts-list">
              {drafts.map(draft => (
                <div key={draft.id} className="draft-card">
                  <div className="draft-info">
                    <span className="draft-type">
                      {draft.hazardType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Untitled'}
                    </span>
                    <span className="draft-region">{draft.region || 'No region'}</span>
                    <span className="draft-date">
                      Saved: {new Date(draft.savedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="draft-actions">
                    <button className="btn-small" onClick={() => loadDraft(draft)}>
                      Edit
                    </button>
                    <button className="btn-small danger" onClick={() => deleteDraft(draft.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'history' && (
        <div className="history-section">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hazard Type</th>
                <th>Region</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.id}</td>
                  <td>{sub.hazardType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                  <td>{sub.region}</td>
                  <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${sub.status}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="btn-small">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InstitutionDataEntry;
