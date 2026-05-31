/**
 * PMO REVIEW PANEL
 * Professional approval interface for committee submissions
 * Uses Supabase for real database storage (falls back to localStorage if not configured)
 */

import React, { useState, useMemo } from 'react';
import {
  calculateINFORMRisk,
  validateIndicatorValues,
  INDICATOR_DEFINITIONS,
  DIMENSION_STRUCTURE,
  getRiskColor
} from '../../../services/informCalculationService';
import {
  approveSubmission,
  rejectSubmission,
  isUsingSupabase
} from '../../../services/supabaseDataService';
import './TabStyles.css';

function PMOReviewPanel({ user, submissions, onRefresh }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(false);

  // Filter submissions by status
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      if (filter === 'all') return true;
      return (sub.status || 'pending') === filter;
    });
  }, [submissions, filter]);

  // Calculate INFORM risk for selected submission
  const calculatedResult = useMemo(() => {
    if (!selectedSubmission?.indicators) return null;
    const validation = validateIndicatorValues(selectedSubmission.indicators);
    const calculation = calculateINFORMRisk(selectedSubmission.indicators);
    return { validation, calculation };
  }, [selectedSubmission]);

  const handleApprove = async () => {
    if (!selectedSubmission || !calculatedResult?.calculation) return;

    setProcessing(true);
    try {
      // Use Supabase service (falls back to localStorage)
      await approveSubmission(selectedSubmission.id, user);

      console.log(`✅ Submission approved ${isUsingSupabase() ? 'in Supabase' : 'in localStorage'}`);

      setSelectedSubmission(null);
      setReviewComment('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve submission: ' + error.message);
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!reviewComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setProcessing(true);
    try {
      // Use Supabase service (falls back to localStorage)
      await rejectSubmission(selectedSubmission.id, user, reviewComment);

      console.log(`✅ Submission rejected ${isUsingSupabase() ? 'in Supabase' : 'in localStorage'}`);

      setSelectedSubmission(null);
      setReviewComment('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Failed to reject submission: ' + error.message);
    }
    setProcessing(false);
  };

  const getStatusCounts = () => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    submissions.forEach(sub => {
      const status = sub.status || 'pending';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Render dimension score card
  const renderDimensionCard = (dimId, dimData) => {
    const config = DIMENSION_STRUCTURE[dimId];
    if (!dimData?.score) return null;

    return (
      <div key={dimId} style={{
        flex: 1,
        minWidth: '180px',
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${config.color}`
      }}>
        <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
          {config.name.toUpperCase()}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: config.color }}>
          {dimData.score?.toFixed(1)}
        </div>
        {dimData.categories && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
            {Object.entries(dimData.categories).map(([catName, catScore]) => (
              <div key={catName} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '4px'
              }}>
                <span style={{ color: '#666' }}>{catName}</span>
                <span style={{ fontWeight: '600' }}>{catScore?.toFixed(1) || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render indicator table
  const renderIndicatorTable = (indicators) => {
    if (!indicators) return null;

    // Group by dimension
    const grouped = { HAZARD: [], VULNERABILITY: [], COPING_CAPACITY: [] };
    Object.entries(indicators).forEach(([id, data]) => {
      const def = INDICATOR_DEFINITIONS[id];
      if (def) {
        grouped[def.dimension]?.push({ id, ...def, ...data });
      }
    });

    return (
      <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
        {Object.entries(grouped).map(([dimId, items]) => {
          if (items.length === 0) return null;
          const config = DIMENSION_STRUCTURE[dimId];
          return (
            <div key={dimId} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: config.color,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: config.color
                }}></span>
                {config.name}
              </div>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px 0', color: '#333' }}>{item.name}</td>
                      <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: '600', width: '60px' }}>
                        {item.value?.toFixed(1) || '-'}
                      </td>
                      <td style={{ padding: '8px 0', width: '80px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          background: item.confidence === 'high' ? '#c8e6c9' :
                                     item.confidence === 'medium' ? '#fff3e0' : '#ffebee',
                          color: item.confidence === 'high' ? '#2e7d32' :
                                 item.confidence === 'medium' ? '#ef6c00' : '#c62828'
                        }}>
                          {item.confidence || 'low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tab-content pmo-review-panel">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
          INFORM Risk Data Review & Approval
        </h3>
        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
          Review committee submissions, verify calculations, and approve for official risk profile
        </p>
      </div>

      {/* Status Filter Cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: 'Pending Review', color: '#ff9800', icon: '⏳' },
          { key: 'approved', label: 'Approved', color: '#4caf50', icon: '✓' },
          { key: 'rejected', label: 'Rejected', color: '#f44336', icon: '✕' },
          { key: 'all', label: 'All Submissions', color: '#607d8b', icon: '📋' }
        ].map(status => (
          <div
            key={status.key}
            onClick={() => setFilter(status.key)}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '16px',
              background: filter === status.key ? status.color : 'white',
              color: filter === status.key ? 'white' : '#333',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: filter === status.key ?
                `0 4px 12px ${status.color}40` :
                '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{status.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {status.key === 'all' ? submissions.length : statusCounts[status.key] || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>{status.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
        {/* Submissions List */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <h4 style={{ margin: '0 0 16px', color: '#333' }}>Submissions</h4>
          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            {filteredSubmissions.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#666',
                background: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <p>No submissions to review</p>
              </div>
            ) : (
              filteredSubmissions.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    background: selectedSubmission?.id === sub.id ? '#e3f2fd' : 'white',
                    border: selectedSubmission?.id === sub.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>
                      {sub.committeeName || 'Committee'}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      background: (sub.status || 'pending') === 'approved' ? '#c8e6c9' :
                                 (sub.status || 'pending') === 'rejected' ? '#ffcdd2' : '#fff3e0',
                      color: (sub.status || 'pending') === 'approved' ? '#2e7d32' :
                             (sub.status || 'pending') === 'rejected' ? '#c62828' : '#ef6c00'
                    }}>
                      {(sub.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    📍 {sub.adm1Name || '-'}{sub.adm2Name ? ` / ${sub.adm2Name}` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(sub.submittedAt).toLocaleDateString()} • {Object.keys(sub.indicators || {}).length} indicators
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Detail */}
        <div style={{ flex: 1 }}>
          {selectedSubmission ? (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              {/* Submission Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px', color: '#333', fontSize: '18px' }}>
                  {selectedSubmission.committeeName}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>REGION</div>
                    <div style={{ fontWeight: '600' }}>{selectedSubmission.adm1Name || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>DISTRICT</div>
                    <div style={{ fontWeight: '600' }}>{selectedSubmission.adm2Name || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>SUBMITTED</div>
                    <div style={{ fontWeight: '600' }}>{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* INFORM Risk Calculation */}
              {calculatedResult?.calculation && (
                <>
                  {/* Final Risk Score */}
                  <div style={{
                    background: getRiskColor(calculatedResult.calculation.risk),
                    color: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginBottom: '24px'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>
                      CALCULATED INFORM RISK INDEX
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
                      {calculatedResult.calculation.risk?.toFixed(2) || '-'}
                    </div>
                    <div style={{ fontSize: '16px', marginTop: '4px' }}>
                      {calculatedResult.calculation.classification?.label || '-'}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>
                      Formula: Risk = (H × V × LCC)^(1/3)
                    </div>
                  </div>

                  {/* Dimension Scores */}
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 16px', color: '#333' }}>Dimension Scores</h5>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {Object.entries(calculatedResult.calculation.dimensions).map(([dimId, dimData]) =>
                        renderDimensionCard(dimId, dimData)
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Validation Status */}
              {calculatedResult?.validation && (
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ margin: '0 0 12px', color: '#333' }}>Data Validation</h5>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: calculatedResult.validation.isValid ? '#e8f5e9' : '#fff3e0',
                    border: `1px solid ${calculatedResult.validation.isValid ? '#a5d6a7' : '#ffcc80'}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: calculatedResult.validation.isValid ? '#2e7d32' : '#ef6c00'
                    }}>
                      <span style={{ fontSize: '18px' }}>
                        {calculatedResult.validation.isValid ? '✓' : '⚠'}
                      </span>
                      <span style={{ fontWeight: '600' }}>
                        {calculatedResult.validation.isValid ?
                          'All required data present - Ready for approval' :
                          'Validation warnings detected'}
                      </span>
                    </div>
                    {calculatedResult.validation.warnings.length > 0 && (
                      <ul style={{ margin: '8px 0 0 24px', padding: 0, fontSize: '13px', color: '#666' }}>
                        {calculatedResult.validation.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Indicator Values */}
              <div style={{ marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px', color: '#333' }}>Submitted Indicator Values</h5>
                {renderIndicatorTable(selectedSubmission.indicators)}
              </div>

              {/* Review Actions */}
              {(selectedSubmission.status || 'pending') === 'pending' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      Review Notes (optional for approval, required for rejection)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add review notes or feedback..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleApprove}
                      disabled={processing || !calculatedResult?.validation?.isValid}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        background: processing ? '#ccc' : '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: processing ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {processing ? 'Processing...' : '✓ Approve & Publish to Risk Profile'}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={processing}
                      style={{
                        padding: '14px 24px',
                        background: processing ? '#ccc' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: processing ? 'wait' : 'pointer'
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </>
              )}

              {/* Already Reviewed */}
              {(selectedSubmission.status || 'pending') !== 'pending' && (
                <div style={{
                  padding: '16px',
                  background: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    {selectedSubmission.status === 'approved' ? '✓ Approved' : '✕ Rejected'} by {selectedSubmission.reviewedBy}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                  </div>
                  {selectedSubmission.reviewNotes && (
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      Notes: {selectedSubmission.reviewNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
                <p>Select a submission to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PMOReviewPanel;
