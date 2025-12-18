/**
 * PMO REVIEW PANEL TAB
 * Allows PMO and Admin to review and approve/reject submissions
 */

import React, { useState } from 'react';
import { INSTITUTIONS } from '../../../services/authService';
import './TabStyles.css';

function PMOReviewPanel({ user, submissions, onRefresh }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [filter, setFilter] = useState('pending');

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const handleApprove = (submissionId) => {
    alert(`Submission ${submissionId} approved!`);
    setSelectedSubmission(null);
    setReviewComment('');
    if (onRefresh) onRefresh();
  };

  const handleReject = (submissionId) => {
    if (!reviewComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    alert(`Submission ${submissionId} rejected. Reason: ${reviewComment}`);
    setSelectedSubmission(null);
    setReviewComment('');
    if (onRefresh) onRefresh();
  };

  const handleRequestRevision = (submissionId) => {
    if (!reviewComment.trim()) {
      alert('Please provide revision instructions');
      return;
    }
    alert(`Revision requested for ${submissionId}. Instructions: ${reviewComment}`);
    setSelectedSubmission(null);
    setReviewComment('');
    if (onRefresh) onRefresh();
  };

  const handlePublish = (submissionId) => {
    alert(`Submission ${submissionId} published to live system!`);
    if (onRefresh) onRefresh();
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };
    submissions.forEach(sub => {
      if (counts[sub.status] !== undefined) {
        counts[sub.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="tab-content pmo-review-panel">
      <div className="tab-header">
        <h3>Review & Approve Submissions</h3>
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
            className={`summary-card ${filter === 'under_review' ? 'active' : ''}`}
            onClick={() => setFilter('under_review')}
          >
            <span className="card-count review">{statusCounts.under_review}</span>
            <span className="card-label">Under Review</span>
          </div>
          <div
            className={`summary-card ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            <span className="card-count approved">{statusCounts.approved}</span>
            <span className="card-label">Approved</span>
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
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div
                key={sub.id}
                className={`submission-card ${selectedSubmission?.id === sub.id ? 'selected' : ''}`}
                onClick={() => setSelectedSubmission(sub)}
              >
                <div className="submission-header">
                  <span className="submission-id">{sub.id}</span>
                  <span className={`status-badge ${sub.status}`}>
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="submission-body">
                  <div className="submission-institution">
                    {INSTITUTIONS[sub.institution]?.icon || '📌'} {sub.institution}
                  </div>
                  <div className="submission-type">{sub.type}</div>
                  <div className="submission-region">📍 {sub.region}</div>
                </div>
                <div className="submission-footer">
                  <span className="submission-date">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </span>
                  <span className="submission-author">{sub.submittedBy}</span>
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
                <h5>Submission Details</h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">ID</span>
                    <span className="detail-value">{selectedSubmission.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Institution</span>
                    <span className="detail-value">
                      {INSTITUTIONS[selectedSubmission.institution]?.name || selectedSubmission.institution}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{selectedSubmission.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Region</span>
                    <span className="detail-value">{selectedSubmission.region}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted By</span>
                    <span className="detail-value">{selectedSubmission.submittedBy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted At</span>
                    <span className="detail-value">
                      {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5>Data Preview</h5>
                <div className="data-preview">
                  <p className="preview-placeholder">
                    [Submitted data would be displayed here with full details, charts, and validations]
                  </p>
                </div>
              </div>

              <div className="detail-section">
                <h5>Quality Check</h5>
                <div className="quality-checks">
                  <div className="check-item passed">
                    <span className="check-icon">✓</span>
                    <span>Data format valid</span>
                  </div>
                  <div className="check-item passed">
                    <span className="check-icon">✓</span>
                    <span>Required fields complete</span>
                  </div>
                  <div className="check-item passed">
                    <span className="check-icon">✓</span>
                    <span>Values within expected range</span>
                  </div>
                  <div className="check-item warning">
                    <span className="check-icon">!</span>
                    <span>Large variance from previous data</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5>Review Comment</h5>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add comments for the submitter..."
                  rows={3}
                />
              </div>

              <div className="review-actions">
                {selectedSubmission.status === 'pending' && (
                  <>
                    <button
                      className="action-btn approve"
                      onClick={() => handleApprove(selectedSubmission.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="action-btn revision"
                      onClick={() => handleRequestRevision(selectedSubmission.id)}
                    >
                      ↺ Request Revision
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => handleReject(selectedSubmission.id)}
                    >
                      ✕ Reject
                    </button>
                  </>
                )}
                {selectedSubmission.status === 'approved' && (
                  <button
                    className="action-btn publish"
                    onClick={() => handlePublish(selectedSubmission.id)}
                  >
                    🚀 Publish to Live System
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PMOReviewPanel;
