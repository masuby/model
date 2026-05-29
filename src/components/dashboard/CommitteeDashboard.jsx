/**
 * COMMITTEE DASHBOARD
 * Dashboard for Regional and District/Ward Committee users
 * Shows committee-specific data entry, submissions, and status
 *
 * Uses complete 84 indicators from INFORM Tanzania Country Model
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../services/authService';
import CommitteeDataEntry from './CommitteeDataEntry';
import { ALL_INDICATORS, COMPLETE_HIERARCHY } from '../../services/informIndicatorDefinitions';
import './CommitteeDashboard.css';

const CommitteeDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0
  });

  // Check if user is committee member
  const isRegionalCommittee = user?.role === USER_ROLES.REGIONAL_COMMITTEE;
  const isWardCommittee = user?.role === USER_ROLES.WARD_COMMITTEE;
  const committeeType = isRegionalCommittee ? 'Regional' : 'District/Ward';

  useEffect(() => {
    loadCommitteeData();
  }, [user]);

  const loadCommitteeData = () => {
    // Load submissions from localStorage (mock data)
    const storedSubmissions = localStorage.getItem(`committee_submissions_${user?.committeeId}`);
    if (storedSubmissions) {
      const parsed = JSON.parse(storedSubmissions);
      setSubmissions(parsed);

      // Calculate stats
      setStats({
        totalSubmissions: parsed.length,
        pendingReview: parsed.filter(s => s.status === 'pending').length,
        approved: parsed.filter(s => s.status === 'approved').length,
        rejected: parsed.filter(s => s.status === 'rejected').length
      });
    }
  };

  // Build complete indicators array from ALL_INDICATORS (84 indicators total)
  const indicators = useMemo(() => {
    return Object.values(ALL_INDICATORS).map(ind => ({
      id: ind.id,
      name: ind.name,
      dimension: ind.dimension,
      category: ind.category,
      component: ind.component,
      unit: ind.unit,
      polarity: ind.polarity
    }));
  }, []);

  // Get indicator count by dimension for display
  const indicatorCounts = useMemo(() => ({
    HAZARD: indicators.filter(i => i.dimension === 'HAZARD').length,
    VULNERABILITY: indicators.filter(i => i.dimension === 'VULNERABILITY').length,
    COPING_CAPACITY: indicators.filter(i => i.dimension === 'COPING_CAPACITY').length,
    total: indicators.length
  }), [indicators]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'data-entry', label: 'Data Entry', icon: '✏️' },
    { id: 'submissions', label: 'My Submissions', icon: '📋' },
    { id: 'indicators', label: 'Indicators', icon: '📈' },
  ];

  const renderOverview = () => (
    <div className="committee-overview">
      {/* Committee Info Card */}
      <div className="committee-info-card">
        <div className="committee-header">
          <span className="committee-icon">{isRegionalCommittee ? '🏛️' : '🏘️'}</span>
          <div>
            <h2>{user?.committeeName || 'Committee Dashboard'}</h2>
            <p>{committeeType} Committee • {user?.adm1Name}{user?.adm2Name ? ` → ${user.adm2Name}` : ''}</p>
          </div>
        </div>
        <div className="committee-details">
          <div className="detail-item">
            <span className="label">Committee ID:</span>
            <span className="value">{user?.committeeId}</span>
          </div>
          <div className="detail-item">
            <span className="label">Region Code:</span>
            <span className="value">{user?.adm1Code}</span>
          </div>
          {user?.adm2Code && (
            <div className="detail-item">
              <span className="label">District Code:</span>
              <span className="value">{user?.adm2Code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <span className="stat-icon">📝</span>
          <div className="stat-content">
            <span className="stat-value">{stats.totalSubmissions}</span>
            <span className="stat-label">Total Submissions</span>
          </div>
        </div>
        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingReview}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
        <div className="stat-card approved">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="stat-card rejected">
          <span className="stat-icon">❌</span>
          <div className="stat-content">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Needs Revision</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary" onClick={() => setActiveTab('data-entry')}>
            <span className="action-icon">✏️</span>
            <span>Submit New Data</span>
          </button>
          <button className="action-btn secondary" onClick={() => setActiveTab('submissions')}>
            <span className="action-icon">📋</span>
            <span>View Submissions</span>
          </button>
          <button className="action-btn secondary" onClick={() => setActiveTab('indicators')}>
            <span className="action-icon">📈</span>
            <span>View Indicators</span>
          </button>
        </div>
      </div>

      {/* Recent Submissions */}
      {submissions.length > 0 && (
        <div className="recent-submissions">
          <h3>Recent Submissions</h3>
          <div className="submissions-list">
            {submissions.slice(0, 5).map((sub, index) => (
              <div key={index} className={`submission-item ${sub.status}`}>
                <div className="submission-info">
                  <span className="submission-date">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                  <span className="submission-indicators">{sub.indicatorCount} indicators</span>
                </div>
                <span className={`status-badge ${sub.status}`}>
                  {sub.status === 'pending' ? '⏳ Pending' :
                   sub.status === 'approved' ? '✅ Approved' : '❌ Needs Revision'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <div className="submissions-view">
      <h3>My Submissions</h3>
      {submissions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No submissions yet. Start by entering data for your {committeeType.toLowerCase()} indicators.</p>
          <button className="action-btn primary" onClick={() => setActiveTab('data-entry')}>
            Submit Data
          </button>
        </div>
      ) : (
        <div className="submissions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Indicators</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, index) => (
                <tr key={index} className={sub.status}>
                  <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                  <td>{sub.indicatorCount} indicators</td>
                  <td>
                    <span className={`status-badge ${sub.status}`}>
                      {sub.status === 'pending' ? '⏳ Pending Review' :
                       sub.status === 'approved' ? '✅ Approved' : '❌ Needs Revision'}
                    </span>
                  </td>
                  <td>{sub.reviewedBy || '-'}</td>
                  <td>{sub.reviewNotes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderIndicators = () => (
    <div className="indicators-view">
      <h3>INFORM Indicators for {user?.adm1Name}{user?.adm2Name ? ` - ${user.adm2Name}` : ''}</h3>
      <p className="indicators-description">
        Complete INFORM Tanzania indicator set: <strong>{indicatorCounts.total} indicators</strong> across 3 dimensions.
        Click on "Data Entry" to submit values for your area.
      </p>

      <div className="indicator-summary-cards">
        <div className="summary-card hazard">
          <span className="summary-icon">⚠️</span>
          <span className="summary-count">{indicatorCounts.HAZARD}</span>
          <span className="summary-label">Hazard Indicators</span>
        </div>
        <div className="summary-card vulnerability">
          <span className="summary-icon">👥</span>
          <span className="summary-count">{indicatorCounts.VULNERABILITY}</span>
          <span className="summary-label">Vulnerability Indicators</span>
        </div>
        <div className="summary-card coping">
          <span className="summary-icon">🛡️</span>
          <span className="summary-count">{indicatorCounts.COPING_CAPACITY}</span>
          <span className="summary-label">Coping Capacity Indicators</span>
        </div>
      </div>

      <div className="indicators-by-dimension">
        {['HAZARD', 'VULNERABILITY', 'COPING_CAPACITY'].map(dimension => (
          <div key={dimension} className="dimension-section">
            <h4 className={`dimension-header ${dimension.toLowerCase()}`}>
              {dimension === 'HAZARD' ? '⚠️ Hazard & Exposure' :
               dimension === 'VULNERABILITY' ? '👥 Vulnerability' : '🛡️ Coping Capacity'}
              <span className="indicator-count-badge">
                {indicatorCounts[dimension]} indicators
              </span>
            </h4>
            <div className="indicators-list">
              {indicators.filter(i => i.dimension === dimension).map(indicator => (
                <div key={indicator.id} className="indicator-item">
                  <span className="indicator-name">{indicator.name}</span>
                  <span className="indicator-category">{indicator.category}</span>
                  {indicator.unit && <span className="indicator-unit">{indicator.unit}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="committee-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>{isRegionalCommittee ? '🏛️' : '🏘️'} Committee Dashboard</h1>
        <p>Manage disaster risk data for {user?.adm1Name}{user?.adm2Name ? ` - ${user.adm2Name}` : ''}</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'data-entry' && (
          <CommitteeDataEntry
            user={user}
            indicators={indicators}
            onSubmissionComplete={() => {
              loadCommitteeData();
              setActiveTab('submissions');
            }}
          />
        )}
        {activeTab === 'submissions' && renderSubmissions()}
        {activeTab === 'indicators' && renderIndicators()}
      </div>
    </div>
  );
};

export default CommitteeDashboard;
