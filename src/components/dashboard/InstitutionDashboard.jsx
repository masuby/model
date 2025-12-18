/**
 * INSTITUTION DASHBOARD
 * Dashboard for institution users (TMA, MoW, MoH, MoA, GST)
 * Features: Hazard input, PMO requests, Rollback handling
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { INSTITUTIONS } from '../../services/authService';
import Layer1HazardInput from '../warning/layers/Layer1HazardInput';
import './Dashboard.css';

const InstitutionDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pmoRequests, setPmoRequests] = useState([]);
  const [pendingRollbacks, setPendingRollbacks] = useState([]);
  const [hazardSubmissions, setHazardSubmissions] = useState([]);

  // Get institution details
  const institutionKey = user?.institution;
  const institution = institutionKey ? INSTITUTIONS[institutionKey] : null;

  // Mock data for demonstration - filtered by institution
  useEffect(() => {
    if (!institution || !institutionKey) return;

    // Institution-specific mock requests from PMO
    const institutionRequests = {
      TMA: [
        {
          id: 'REQ-TMA-001',
          type: 'hazard_input_request',
          title: 'Urgent: Heavy Rainfall Forecast Required',
          description: 'PMO-DMD requires updated rainfall forecast for Dar es Salaam and Coast regions for the next 72 hours.',
          priority: 'high',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 'REQ-TMA-002',
          type: 'data_verification',
          title: 'Verify Cyclone Track Data',
          description: 'Please verify the cyclone track prediction submitted earlier for Tropical Storm HIDAYA.',
          priority: 'medium',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ],
      MOW: [
        {
          id: 'REQ-MOW-001',
          type: 'hazard_input_request',
          title: 'River Level Update Required',
          description: 'PMO-DMD needs current water levels for Rufiji and Wami rivers.',
          priority: 'high',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ],
      MOH: [
        {
          id: 'REQ-MOH-001',
          type: 'hazard_input_request',
          title: 'Cholera Outbreak Status Update',
          description: 'PMO-DMD requires current cholera case numbers and affected areas.',
          priority: 'critical',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ],
      MOA: [
        {
          id: 'REQ-MOA-001',
          type: 'hazard_input_request',
          title: 'Crop Condition Assessment',
          description: 'PMO-DMD needs drought impact assessment on food crops in central regions.',
          priority: 'medium',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ],
      GST: [
        {
          id: 'REQ-GST-001',
          type: 'hazard_input_request',
          title: 'Seismic Activity Report',
          description: 'PMO-DMD requires assessment of recent tremors in Kigoma region.',
          priority: 'high',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ]
    };

    // Institution-specific mock rollbacks
    const institutionRollbacks = {
      TMA: [
        {
          id: 'RB-TMA-001',
          warningId: 'WRN-2024-0156',
          title: 'Rollback Request: Rainfall Forecast Adjustment',
          reason: 'Updated satellite data indicates lower precipitation than initially forecasted.',
          requestedBy: 'Emmanuel Lymo (PMO-DMD)',
          requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          originalData: { severity: 'severe', affectedDistricts: ['Ilala', 'Kinondoni', 'Temeke'] },
          proposedData: { severity: 'moderate', affectedDistricts: ['Ilala'] },
          status: 'pending_approval'
        }
      ],
      MOW: [],
      MOH: [],
      MOA: [],
      GST: []
    };

    // Institution-specific mock submissions
    const institutionSubmissions = {
      TMA: [
        { id: 'HZD-TMA-001', hazardType: 'heavy_rain', title: 'Heavy Rainfall Warning - Coastal Regions', submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), severity: 'moderate', status: 'published', warningId: 'WRN-2024-0155' },
        { id: 'HZD-TMA-002', hazardType: 'strong_wind', title: 'Strong Wind Advisory - Lake Victoria', submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), severity: 'minor', status: 'expired', warningId: 'WRN-2024-0150' }
      ],
      MOW: [
        { id: 'HZD-MOW-001', hazardType: 'flood', title: 'River Flooding Alert - Rufiji Basin', submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), severity: 'severe', status: 'published', warningId: 'WRN-2024-0154' }
      ],
      MOH: [
        { id: 'HZD-MOH-001', hazardType: 'disease_outbreak', title: 'Cholera Alert - Mwanza Region', submittedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), severity: 'moderate', status: 'published', warningId: 'WRN-2024-0153' }
      ],
      MOA: [
        { id: 'HZD-MOA-001', hazardType: 'drought', title: 'Agricultural Drought - Dodoma', submittedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), severity: 'moderate', status: 'published', warningId: 'WRN-2024-0148' }
      ],
      GST: [
        { id: 'HZD-GST-001', hazardType: 'earthquake', title: 'Seismic Activity - Kigoma', submittedAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(), severity: 'minor', status: 'published', warningId: 'WRN-2024-0140' }
      ]
    };

    // Set data filtered for this institution only
    setPmoRequests(institutionRequests[institutionKey] || []);
    setPendingRollbacks(institutionRollbacks[institutionKey] || []);
    setHazardSubmissions(institutionSubmissions[institutionKey] || []);

  }, [institution, institutionKey]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewHazardInput = () => {
    // Stay within institution dashboard - switch to hazard input tab
    setActiveTab('hazard_input');
  };

  const handleRespondToRequest = (requestId) => {
    // Switch to hazard input tab (could pre-fill data based on request in future)
    setActiveTab('hazard_input');
  };

  // Handle hazard submission from Layer1HazardInput
  const handleHazardSubmit = (hazardData) => {
    console.log('📤 Hazard submitted from institution dashboard:', hazardData);

    // Add to submissions list
    const newSubmission = {
      id: `HZD-${institutionKey}-${Date.now()}`,
      hazardType: hazardData.hazardType,
      title: `${hazardData.hazardType} - ${hazardData.spatialExtent?.length || 0} districts`,
      submittedAt: new Date().toISOString(),
      severity: hazardData.warningLevel?.toLowerCase() || 'moderate',
      status: 'pending_review',
      warningId: null
    };

    setHazardSubmissions(prev => [newSubmission, ...prev]);

    // Show success and switch to submissions tab
    alert(`✅ Hazard data submitted successfully!\n\nType: ${hazardData.hazardType}\nDistricts: ${hazardData.spatialExtent?.length || 0}\n\nYour submission has been sent to PMO-DMD for review.`);
    setActiveTab('submissions');
  };

  const handleRollbackAction = (rollbackId, action) => {
    // Process rollback approval/rejection
    setPendingRollbacks(prev =>
      prev.map(rb =>
        rb.id === rollbackId
          ? { ...rb, status: action === 'approve' ? 'approved' : 'rejected' }
          : rb
      )
    );
    alert(`Rollback ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-TZ', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getTimeRemaining = (deadline) => {
    const remaining = new Date(deadline) - new Date();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours < 0) return 'Overdue';
    if (hours < 24) return `${hours}h remaining`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#fd7e14';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return '#dc3545';
      case 'moderate': return '#fd7e14';
      case 'minor': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: { bg: '#d4edda', color: '#155724', label: 'Published' },
      pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
      expired: { bg: '#e2e3e5', color: '#383d41', label: 'Expired' },
      pending_approval: { bg: '#cce5ff', color: '#004085', label: 'Awaiting Approval' },
      approved: { bg: '#d4edda', color: '#155724', label: 'Approved' },
      rejected: { bg: '#f8d7da', color: '#721c24', label: 'Rejected' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  if (!user || !institution) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Please login with an institution account to access this dashboard.</p>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
        padding: '20px 30px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '40px' }}>{institution.icon}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{institution.name}</h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              {user.name} | {user.department}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={handleNewHazardInput}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
            }}
          >
            <span>+</span> New Hazard Input
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        padding: '0 30px',
        borderBottom: '2px solid #E0E0E0',
        display: 'flex',
        gap: '5px'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'hazard_input', label: 'Submit Hazard', icon: '⚠️' },
          { id: 'requests', label: 'PMO Requests', icon: '📨', count: pmoRequests.filter(r => r.status === 'pending').length },
          { id: 'rollbacks', label: 'Rollbacks', icon: '↩️', count: pendingRollbacks.filter(r => r.status === 'pending_approval').length },
          { id: 'submissions', label: 'My Submissions', icon: '📝' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #1976D2' : '3px solid transparent',
              color: activeTab === tab.id ? '#1976D2' : '#666',
              fontWeight: activeTab === tab.id ? '700' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: '#dc3545',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                borderLeft: '4px solid #1976D2'
              }}>
                <div style={{ color: '#666', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>PENDING REQUESTS</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#1976D2' }}>{pmoRequests.filter(r => r.status === 'pending').length}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>From PMO-DMD</div>
              </div>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                borderLeft: '4px solid #FF9800'
              }}>
                <div style={{ color: '#666', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>PENDING ROLLBACKS</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#FF9800' }}>{pendingRollbacks.filter(r => r.status === 'pending_approval').length}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Awaiting your action</div>
              </div>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                borderLeft: '4px solid #4CAF50'
              }}>
                <div style={{ color: '#666', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>SUBMISSIONS THIS MONTH</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#4CAF50' }}>{hazardSubmissions.length}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Hazard inputs submitted</div>
              </div>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                borderLeft: '4px solid #9C27B0'
              }}>
                <div style={{ color: '#666', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>HAZARD TYPES</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#9C27B0' }}>{institution.hazardTypes.length}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>You can submit</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              marginBottom: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <button
                  onClick={handleNewHazardInput}
                  style={{
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>+</span>
                  Submit New Hazard Data
                </button>
                {pmoRequests.filter(r => r.status === 'pending').length > 0 && (
                  <button
                    onClick={() => setActiveTab('requests')}
                    style={{
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📨</span>
                    View PMO Requests ({pmoRequests.filter(r => r.status === 'pending').length})
                  </button>
                )}
              </div>
            </div>

            {/* Allowed Hazard Types */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Your Hazard Types</h3>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                As a {institution.shortName} officer, you can submit data for the following hazard types:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {institution.hazardTypes.map(type => (
                  <span
                    key={type}
                    style={{
                      padding: '10px 20px',
                      background: '#E3F2FD',
                      color: '#1565C0',
                      borderRadius: '20px',
                      fontWeight: '600',
                      fontSize: '13px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hazard Input Tab - Embedded Layer1HazardInput */}
        {activeTab === 'hazard_input' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              padding: '20px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px solid #4CAF50'
            }}>
              <h2 style={{ margin: '0 0 8px 0', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⚠️ Submit Hazard Data to PMO-DMD
              </h2>
              <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                As {institution?.name}, you can submit hazard forecasts for: {institution?.hazardTypes?.map(t => t.replace(/_/g, ' ')).join(', ')}
              </p>
            </div>

            {/* Embedded Hazard Input Form */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <Layer1HazardInput
                selectedInstitution={institutionKey}
                onHazardSubmit={handleHazardSubmit}
                simulationMode={false}
              />
            </div>
          </div>
        )}

        {/* PMO Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>PMO-DMD Requests</h2>
            {pmoRequests.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '60px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#666'
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>📭</span>
                <p>No pending requests from PMO-DMD</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pmoRequests.map(request => (
                  <div
                    key={request.id}
                    style={{
                      background: 'white',
                      padding: '24px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      borderLeft: `4px solid ${getPriorityColor(request.priority)}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{
                            padding: '4px 10px',
                            background: getPriorityColor(request.priority),
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            {request.priority} priority
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <h3 style={{ margin: 0, color: '#333' }}>{request.title}</h3>
                      </div>
                      <span style={{ color: '#999', fontSize: '12px' }}>{request.id}</span>
                    </div>
                    <p style={{ color: '#666', margin: '0 0 15px 0', lineHeight: '1.6' }}>{request.description}</p>
                    <div style={{ display: 'flex', gap: '30px', fontSize: '13px', color: '#888', marginBottom: '20px' }}>
                      <span>Requested by: <strong>{request.requestedBy}</strong></span>
                      <span>Requested: {formatDate(request.requestedAt)}</span>
                      <span style={{ color: getPriorityColor(request.priority), fontWeight: '600' }}>
                        Deadline: {getTimeRemaining(request.deadline)}
                      </span>
                    </div>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleRespondToRequest(request.id)}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Respond with Hazard Data
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rollbacks Tab */}
        {activeTab === 'rollbacks' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Rollback Requests</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Review and approve/reject rollback requests from PMO-DMD for warnings based on your hazard data.
            </p>
            {pendingRollbacks.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '60px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#666'
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>✅</span>
                <p>No pending rollback requests</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingRollbacks.map(rollback => (
                  <div
                    key={rollback.id}
                    style={{
                      background: 'white',
                      padding: '24px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      borderLeft: '4px solid #FF9800'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          {getStatusBadge(rollback.status)}
                        </div>
                        <h3 style={{ margin: 0, color: '#333' }}>{rollback.title}</h3>
                      </div>
                      <span style={{ color: '#999', fontSize: '12px' }}>{rollback.warningId}</span>
                    </div>
                    <p style={{ color: '#666', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                      <strong>Reason:</strong> {rollback.reason}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ padding: '15px', background: '#FFF3E0', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '700', color: '#E65100', marginBottom: '10px', fontSize: '13px' }}>ORIGINAL DATA</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          <div>Severity: <strong style={{ color: getSeverityColor(rollback.originalData.severity) }}>{rollback.originalData.severity}</strong></div>
                          <div>Districts: {rollback.originalData.affectedDistricts.join(', ')}</div>
                        </div>
                      </div>
                      <div style={{ padding: '15px', background: '#E8F5E9', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '700', color: '#2E7D32', marginBottom: '10px', fontSize: '13px' }}>PROPOSED CHANGE</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          <div>Severity: <strong style={{ color: getSeverityColor(rollback.proposedData.severity) }}>{rollback.proposedData.severity}</strong></div>
                          <div>Districts: {rollback.proposedData.affectedDistricts.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
                      Requested by: <strong>{rollback.requestedBy}</strong> | {formatDate(rollback.requestedAt)}
                    </div>
                    {rollback.status === 'pending_approval' && (
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                          onClick={() => handleRollbackAction(rollback.id, 'approve')}
                          style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Approve Rollback
                        </button>
                        <button
                          onClick={() => handleRollbackAction(rollback.id, 'reject')}
                          style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>My Hazard Submissions</h2>
            {hazardSubmissions.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '60px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#666'
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>📝</span>
                <p>No submissions yet</p>
                <button
                  onClick={handleNewHazardInput}
                  style={{
                    marginTop: '20px',
                    padding: '12px 24px',
                    background: '#1976D2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Submit Your First Hazard Data
                </button>
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F5F5' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>HAZARD TYPE</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>TITLE</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>SEVERITY</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>SUBMITTED</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>STATUS</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>WARNING ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hazardSubmissions.map((submission, index) => (
                      <tr
                        key={submission.id}
                        style={{
                          borderBottom: index < hazardSubmissions.length - 1 ? '1px solid #E0E0E0' : 'none',
                          background: index % 2 === 0 ? 'white' : '#FAFAFA'
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            background: '#E3F2FD',
                            color: '#1565C0',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {submission.hazardType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: '500', color: '#333' }}>{submission.title}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            background: getSeverityColor(submission.severity) + '20',
                            color: getSeverityColor(submission.severity),
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {submission.severity}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>{formatDate(submission.submittedAt)}</td>
                        <td style={{ padding: '16px' }}>{getStatusBadge(submission.status)}</td>
                        <td style={{ padding: '16px', color: '#1976D2', fontWeight: '500', fontSize: '13px' }}>{submission.warningId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionDashboard;
