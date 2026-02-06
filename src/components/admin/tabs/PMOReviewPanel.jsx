/**
 * PMO REVIEW PANEL TAB
 * Allows PMO and Admin to review and approve/reject committee submissions
 */

import React, { useState } from 'react';
import './TabStyles.css';

// Indicator names for display
const INDICATOR_NAMES = {
  flood_exposure: 'Flood Exposure',
  drought_exposure: 'Drought Exposure',
  earthquake_exposure: 'Earthquake Exposure',
  conflict_intensity: 'Conflict Intensity',
  development_deprivation: 'Development & Deprivation',
  inequality: 'Inequality',
  food_security: 'Food Security',
  health_conditions: 'Health Conditions',
  drr_capacity: 'DRR Capacity',
  governance: 'Governance',
  communication: 'Communication',
  physical_infrastructure: 'Physical Infrastructure'
};

// Get risk class color
const getRiskColor = (riskClass) => {
  const colors = {
    'Very Low': '#4CAF50',
    'Low': '#8BC34A',
    'Medium': '#FFC107',
    'High': '#FF9800',
    'Very High': '#F44336'
  };
  return colors[riskClass] || '#666';
};

function PMOReviewPanel({ user, submissions, onRefresh }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(false);

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  // Store approved data for risk profile
  const storeApprovedDataForRiskProfile = (approvedSubmission) => {
    const existing = JSON.parse(localStorage.getItem('approved_risk_data') || '[]');

    // Remove previous approval for same committee/region
    const filtered = existing.filter(d =>
      !(d.adm1Code === approvedSubmission.adm1Code &&
        d.adm2Code === approvedSubmission.adm2Code &&
        d.committeeId === approvedSubmission.committeeId)
    );

    filtered.push({
      id: approvedSubmission.id,
      committeeId: approvedSubmission.committeeId,
      committeeName: approvedSubmission.committeeName,
      adm1Code: approvedSubmission.adm1Code,
      adm1Name: approvedSubmission.adm1Name,
      adm2Code: approvedSubmission.adm2Code,
      adm2Name: approvedSubmission.adm2Name,
      indicators: approvedSubmission.indicators,
      scores: approvedSubmission.scores,
      approvedAt: new Date().toISOString(),
      approvedBy: user?.name || user?.email
    });

    localStorage.setItem('approved_risk_data', JSON.stringify(filtered));
  };

  // Update submission status in localStorage
  const updateSubmissionStatus = (submissionId, newStatus, notes) => {
    // Update in committee_submissions_*
    Object.keys(localStorage)
      .filter(k => k.startsWith('committee_submissions_'))
      .forEach(key => {
        const subs = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = subs.findIndex(s => s.id === submissionId);
        if (idx !== -1) {
          subs[idx].status = newStatus;
          subs[idx].reviewedBy = user?.name || user?.email;
          subs[idx].reviewedAt = new Date().toISOString();
          subs[idx].reviewNotes = notes;
          localStorage.setItem(key, JSON.stringify(subs));
        }
      });

    // Also update in all_pending_submissions
    const allPending = JSON.parse(localStorage.getItem('all_pending_submissions') || '[]');
    const pendingIdx = allPending.findIndex(s => s.id === submissionId);
    if (pendingIdx !== -1) {
      allPending[pendingIdx].status = newStatus;
      allPending[pendingIdx].reviewedBy = user?.name || user?.email;
      allPending[pendingIdx].reviewedAt = new Date().toISOString();
      allPending[pendingIdx].reviewNotes = notes;
      localStorage.setItem('all_pending_submissions', JSON.stringify(allPending));
    }
  };

  const handleApprove = async (submission) => {
    setProcessing(true);
    try {
      // Update status
      updateSubmissionStatus(submission.id, 'approved', reviewComment);

      // Store for risk profile
      storeApprovedDataForRiskProfile(submission);

      setSelectedSubmission(null);
      setReviewComment('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve submission');
    }
    setProcessing(false);
  };

  const handleReject = async (submission) => {
    if (!reviewComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setProcessing(true);
    try {
      updateSubmissionStatus(submission.id, 'rejected', reviewComment);
      setSelectedSubmission(null);
      setReviewComment('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Failed to reject submission');
    }
    setProcessing(false);
  };

  const getStatusCounts = () => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    submissions.forEach(sub => {
      const status = sub.status || 'pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Render indicator data table
  const renderIndicatorsTable = (indicators) => {
    if (!indicators || Object.keys(indicators).length === 0) {
      return <p style={{ color: '#666', fontStyle: 'italic' }}>No indicator data available</p>;
    }

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Indicator</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Value</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Confidence</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Source</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(indicators).map(([key, data]) => (
            <tr key={key}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                {INDICATOR_NAMES[key] || key}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                {data.value?.toFixed(1) || '-'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  background: data.confidence === 'high' ? '#c8e6c9' : data.confidence === 'medium' ? '#fff3e0' : '#ffcdd2'
                }}>
                  {data.confidence || '-'}
                </span>
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#666', fontSize: '12px' }}>
                {data.source || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Render dimension scores
  const renderScores = (scores) => {
    if (!scores) return null;

    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#e65100', marginBottom: '4px' }}>HAZARD</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e65100' }}>{scores.hazardScore?.toFixed(1) || '-'}</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#1565c0', marginBottom: '4px' }}>VULNERABILITY</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1565c0' }}>{scores.vulnScore?.toFixed(1) || '-'}</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginBottom: '4px' }}>LACK OF COPING</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>{scores.ccScore?.toFixed(1) || '-'}</div>
        </div>
        <div style={{
          flex: 1,
          minWidth: '140px',
          padding: '12px',
          background: getRiskColor(scores.riskClass),
          borderRadius: '8px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.9 }}>RISK INDEX</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{scores.riskScore?.toFixed(2) || '-'}</div>
          <div style={{ fontSize: '12px', marginTop: '2px' }}>{scores.riskClass || '-'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="tab-content pmo-review-panel">
      <div className="tab-header">
        <h3>Review & Approve Committee Submissions</h3>
      </div>

      <div className="review-summary">
        <div className="summary-cards">
          <div
            className={`summary-card ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span className="card-count pending">{statusCounts.pending}</span>
            <span className="card-label">Pending</span>
          </div>
          <div
            className={`summary-card ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            <span className="card-count approved">{statusCounts.approved}</span>
            <span className="card-label">Approved</span>
          </div>
          <div
            className={`summary-card ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            <span className="card-count rejected">{statusCounts.rejected}</span>
            <span className="card-label">Rejected</span>
          </div>
          <div
            className={`summary-card ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="card-count">{submissions.length}</span>
            <span className="card-label">All</span>
          </div>
        </div>
      </div>

      <div className="review-content">
        <div className="submissions-list">
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No submissions to review</p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                Committee submissions will appear here when submitted
              </p>
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div
                key={sub.id}
                className={`submission-card ${selectedSubmission?.id === sub.id ? 'selected' : ''}`}
                onClick={() => setSelectedSubmission(sub)}
              >
                <div className="submission-header">
                  <span className="submission-id" style={{ fontSize: '11px', color: '#999' }}>
                    #{sub.id?.slice(-8) || sub.id}
                  </span>
                  <span className={`status-badge ${sub.status || 'pending'}`}>
                    {(sub.status || 'pending').replace('_', ' ')}
                  </span>
                </div>
                <div className="submission-body">
                  <div className="submission-institution" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {sub.committeeName || 'Committee'}
                  </div>
                  <div className="submission-region" style={{ color: '#666', fontSize: '13px' }}>
                    📍 {sub.adm1Name || '-'}{sub.adm2Name ? ` / ${sub.adm2Name}` : ''}
                  </div>
                  {sub.scores?.riskScore != null && (
                    <div style={{
                      marginTop: '8px',
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: getRiskColor(sub.scores.riskClass),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Risk: {sub.scores.riskScore.toFixed(1)} ({sub.scores.riskClass})
                    </div>
                  )}
                </div>
                <div className="submission-footer">
                  <span className="submission-date">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </span>
                  <span className="submission-author">{sub.submittedBy || '-'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedSubmission && (
          <div className="review-detail">
            <div className="detail-header">
              <h4>Review Submission</h4>
              <button
                className="close-btn"
                onClick={() => setSelectedSubmission(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h5>Committee Details</h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Committee</span>
                    <span className="detail-value">{selectedSubmission.committeeName || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Region</span>
                    <span className="detail-value">{selectedSubmission.adm1Name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">District</span>
                    <span className="detail-value">{selectedSubmission.adm2Name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted By</span>
                    <span className="detail-value">{selectedSubmission.submittedBy || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted At</span>
                    <span className="detail-value">
                      {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Indicators</span>
                    <span className="detail-value">
                      {selectedSubmission.indicatorCount || Object.keys(selectedSubmission.indicators || {}).length} submitted
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5>Risk Scores</h5>
                {renderScores(selectedSubmission.scores)}
              </div>

              <div className="detail-section">
                <h5>Indicator Values</h5>
                <div style={{ maxHeight: '250px', overflow: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                  {renderIndicatorsTable(selectedSubmission.indicators)}
                </div>
              </div>

              {selectedSubmission.status !== 'pending' && (
                <div className="detail-section">
                  <h5>Review Information</h5>
                  <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                    <p><strong>Reviewed By:</strong> {selectedSubmission.reviewedBy || '-'}</p>
                    <p><strong>Reviewed At:</strong> {selectedSubmission.reviewedAt ? new Date(selectedSubmission.reviewedAt).toLocaleString() : '-'}</p>
                    {selectedSubmission.reviewNotes && (
                      <p><strong>Notes:</strong> {selectedSubmission.reviewNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedSubmission.status === 'pending' && (
                <>
                  <div className="detail-section">
                    <h5>Review Comment</h5>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add comments (required for rejection)..."
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div className="review-actions">
                    <button
                      className="action-btn approve"
                      onClick={() => handleApprove(selectedSubmission)}
                      disabled={processing}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: processing ? 'wait' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {processing ? 'Processing...' : '✓ Approve & Publish to Risk Profile'}
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => handleReject(selectedSubmission)}
                      disabled={processing}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: processing ? 'wait' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {processing ? 'Processing...' : '✕ Reject'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PMOReviewPanel;
