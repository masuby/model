/**
 * PMO VALIDATION PANEL
 * Simplified Layer 4 for standalone system
 * Allows PMO-DMD to review, validate, and issue warnings
 */

import React, { useState } from 'react';
import { IMPACT_LEVELS, REGISTERED_ACTORS, PUBLIC_ACTIONS } from '../data/pmoConfig';
import StandaloneHazardMap from '../components/StandaloneHazardMap';
import { logWarningApproved, logWarningPublished } from '../../../services/auditService';

const PMOValidationPanel = ({ activeHazards = [], validatedWarnings = [], riskData = null, onWarningIssued, onHazardRollback }) => {
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [impactLevel, setImpactLevel] = useState('MODERATE');
  const [finalStatement, setFinalStatement] = useState('WARNING');
  const [selectedActors, setSelectedActors] = useState([]);
  const [exposureNotes, setExposureNotes] = useState('');
  const [vulnerabilityNotes, setVulnerabilityNotes] = useState('');
  const [capacityNotes, setCapacityNotes] = useState('');
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackNotes, setRollbackNotes] = useState('');

  const stats = {
    pendingReview: activeHazards.length,
    issued: validatedWarnings.length,
    institutions: new Set(activeHazards.map(h => h.institution)).size
  };

  // Helper functions
  const getRiskColor = (score) => {
    if (!score) return '#9E9E9E';
    if (score >= 6.5) return '#F44336';
    if (score >= 5.0) return '#FF9800';
    if (score >= 3.5) return '#FFC107';
    return '#4CAF50';
  };

  const getHazardScore = (hazard) => {
    const levelScores = { 'Major Warning': 9, 'Warning': 7, 'Advisory': 5, 'Monitor': 3 };
    return levelScores[hazard?.warningLevel] || 5;
  };

  const calculateWarningScore = (hazard, riskData) => {
    const H = getHazardScore(hazard);
    const E = riskData?.national?.hazardExposure || 5.0;
    const V = riskData?.national?.vulnerability || 4.5;
    const LCC = riskData?.national?.lackCopingCapacity || 4.7;
    return Math.pow(H * E * V * LCC, 0.25);
  };

  const getWarningLevelFromScore = (score) => {
    if (score >= 7.5) return 'MAJOR WARNING';
    if (score >= 5.0) return 'WARNING';
    if (score >= 2.5) return 'ADVISORY';
    return 'MONITOR';
  };

  const getFinalWarningLevel = (hazard, riskData) => {
    const calculatedScore = calculateWarningScore(hazard, riskData);
    return getWarningLevelFromScore(calculatedScore);
  };

  const getWarningColor = (level) => {
    const colors = {
      'MAJOR WARNING': '#F44336', 'Major Warning': '#F44336',
      'WARNING': '#FF9800', 'Warning': '#FF9800',
      'ADVISORY': '#FFC107', 'Advisory': '#FFC107',
      'MONITOR': '#4CAF50', 'Monitor': '#4CAF50'
    };
    return colors[level] || '#FFC107';
  };

  // Get final districts for map
  const getFinalDistrictsForMap = () => {
    if (!selectedHazard) return {};
    const finalLevel = getFinalWarningLevel(selectedHazard, riskData);
    const districts = {};
    if (selectedHazard.spatialExtent) {
      selectedHazard.spatialExtent.forEach(district => {
        districts[district] = finalLevel;
      });
    }
    return districts;
  };

  // Toggle actor selection
  const toggleActor = (actorId) => {
    setSelectedActors(prev =>
      prev.includes(actorId) ? prev.filter(id => id !== actorId) : [...prev, actorId]
    );
  };

  // Issue warning
  const handleIssueWarning = () => {
    if (!selectedHazard) {
      alert('⚠️ Please select a hazard to assess');
      return;
    }

    const finalLevel = getFinalWarningLevel(selectedHazard, riskData);
    const assessment = {
      hazardId: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      institution: selectedHazard.institution,
      impactLevel: IMPACT_LEVELS[impactLevel],
      finalStatement: finalLevel,
      actorDirectives: REGISTERED_ACTORS
        .filter(actor => selectedActors.includes(actor.id))
        .map(actor => ({ actor: actor.name, role: actor.role })),
      assessmentFactors: { exposure: exposureNotes, vulnerability: vulnerabilityNotes, capacity: capacityNotes },
      issuedAt: new Date().toISOString(),
      issuedBy: 'PMO-DMD'
    };

    logWarningApproved({
      id: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      warningLevel: finalLevel,
      spatialExtent: selectedHazard.spatialExtent || []
    }, `Impact Level: ${IMPACT_LEVELS[impactLevel].value}`);

    logWarningPublished({
      id: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      warningLevel: finalLevel,
      spatialExtent: selectedHazard.spatialExtent || []
    }, ['Dashboard', 'SMS', 'Bulletin']);

    alert(`✅ Warning Issued!\n\nHazard: ${selectedHazard.hazardType}\nLevel: ${finalLevel}\nActors Notified: ${selectedActors.length}`);

    onWarningIssued(assessment);
    setSelectedHazard(null);
    resetForm();
  };

  // Rollback hazard
  const handleRollbackSubmit = () => {
    if (!selectedHazard) return;

    if (!rollbackReason.trim() && !rollbackNotes.trim()) {
      alert('Please provide a reason or notes for the rollback.');
      return;
    }

    onHazardRollback(selectedHazard.id, rollbackReason || rollbackNotes);
    setShowRollbackModal(false);
    setSelectedHazard(null);
    resetRollbackForm();
  };

  const resetForm = () => {
    setImpactLevel('MODERATE');
    setFinalStatement('WARNING');
    setSelectedActors([]);
    setExposureNotes('');
    setVulnerabilityNotes('');
    setCapacityNotes('');
  };

  const resetRollbackForm = () => {
    setRollbackReason('');
    setRollbackNotes('');
  };

  return (
    <div className="pmo-validation-panel">
      <div className="panel-header">
        <h2>🏛️ PMO-DMD: Consolidation & Validation</h2>
        <p className="panel-description">
          Review, validate, and issue risk-informed early warnings
        </p>
      </div>

      {/* Dashboard Statistics */}
      <div className="pmo-stats">
        <div className="pmo-stat-card">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976D2' }}>{stats.pendingReview}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Hazards Pending</div>
        </div>
        <div className="pmo-stat-card">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📢</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.issued}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Warnings Issued</div>
        </div>
        <div className="pmo-stat-card">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏛️</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>{stats.institutions}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Institutions Reporting</div>
        </div>
      </div>

      {/* Main Content */}
      {activeHazards.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3>No Hazards Pending Review</h3>
          <p>All submitted hazards have been processed. Check the Hazard Input tab to submit new forecasts.</p>
        </div>
      ) : (
        <div className="pmo-content">
          {/* Hazards List */}
          <div className="hazards-list-container">
            <h3>Pending Hazard Reviews ({activeHazards.length})</h3>
            <div className="hazards-list">
              {activeHazards.map(hazard => {
                const finalLevel = getFinalWarningLevel(hazard, riskData);
                return (
                  <div
                    key={hazard.id}
                    className={`hazard-card ${selectedHazard?.id === hazard.id ? 'selected' : ''}`}
                    onClick={() => setSelectedHazard(hazard)}
                    style={{
                      borderLeft: `5px solid ${getWarningColor(finalLevel)}`
                    }}
                  >
                    <div className="hazard-header">
                      <span className="hazard-type">{hazard.hazardType}</span>
                      <span className="hazard-institution">{hazard.institution}</span>
                    </div>
                    <div className="hazard-info">
                      <span className="hazard-districts">{hazard.spatialExtent?.length || 0} districts affected</span>
                      <span className="hazard-level" style={{ background: getWarningColor(finalLevel) }}>
                        {finalLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment Panel */}
          {selectedHazard && (
            <div className="assessment-panel">
              <div className="assessment-header">
                <h3>Assessment: {selectedHazard.hazardType}</h3>
                <p className="assessment-institution">From: {selectedHazard.institutionName}</p>
              </div>

              {/* Risk Analysis */}
              <div className="assessment-section">
                <h4>🎯 Risk Analysis</h4>
                <div className="risk-factors">
                  <div className="factor">
                    <label>Hazard Level</label>
                    <select value={finalStatement} onChange={(e) => setFinalStatement(e.target.value)} className="factor-select">
                      <option>ADVISORY</option>
                      <option>WARNING</option>
                      <option>MAJOR WARNING</option>
                    </select>
                  </div>
                  <div className="factor">
                    <label>Impact Assessment</label>
                    <select value={impactLevel} onChange={(e) => setImpactLevel(e.target.value)} className="factor-select">
                      {Object.keys(IMPACT_LEVELS).map(key => (
                        <option key={key} value={key}>{IMPACT_LEVELS[key].value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Assessment Factors */}
              <div className="assessment-section">
                <h4>📊 Assessment Factors</h4>
                <div className="factor-notes">
                  <div className="note-group">
                    <label>Exposure Notes</label>
                    <textarea
                      value={exposureNotes}
                      onChange={(e) => setExposureNotes(e.target.value)}
                      placeholder="Document exposure considerations..."
                      rows={2}
                    />
                  </div>
                  <div className="note-group">
                    <label>Vulnerability Notes</label>
                    <textarea
                      value={vulnerabilityNotes}
                      onChange={(e) => setVulnerabilityNotes(e.target.value)}
                      placeholder="Document vulnerability factors..."
                      rows={2}
                    />
                  </div>
                  <div className="note-group">
                    <label>Coping Capacity Notes</label>
                    <textarea
                      value={capacityNotes}
                      onChange={(e) => setCapacityNotes(e.target.value)}
                      placeholder="Document coping capacity considerations..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Actor Selection */}
              <div className="assessment-section">
                <h4>👥 Responsible Actors</h4>
                <div className="actor-selection">
                  {REGISTERED_ACTORS.map(actor => (
                    <label key={actor.id} className="actor-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedActors.includes(actor.id)}
                        onChange={() => toggleActor(actor.id)}
                      />
                      <span className="actor-info">
                        <span className="actor-name">{actor.name}</span>
                        <span className="actor-role">{actor.role}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Map Preview */}
              <div className="assessment-section">
                <h4>🗺️ Affected Districts Preview</h4>
                <StandaloneHazardMap
                  selectedHazardType={selectedHazard.hazardType}
                  selectedDistricts={getFinalDistrictsForMap()}
                  onDistrictSelect={() => {}}
                  riskData={riskData}
                  warningLevel={getFinalWarningLevel(selectedHazard, riskData)}
                  readOnly={true}
                />
              </div>

              {/* Action Buttons */}
              <div className="assessment-actions">
                <button className="action-btn primary" onClick={handleIssueWarning}>
                  ✅ Issue Warning
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => setShowRollbackModal(true)}
                >
                  🔄 Request Revision
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rollback Modal */}
      {showRollbackModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Request Hazard Revision</h3>
              <button className="modal-close" onClick={() => setShowRollbackModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reason for Revision</label>
                <select
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Select Reason --</option>
                  <option value="incomplete_data">Incomplete Data</option>
                  <option value="unclear_spatial">Unclear Spatial Extent</option>
                  <option value="timing_issue">Temporal Validity Issue</option>
                  <option value="confidence">Low Confidence Level</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={rollbackNotes}
                  onChange={(e) => setRollbackNotes(e.target.value)}
                  placeholder="Explain what information or clarification is needed..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setShowRollbackModal(false)}>Cancel</button>
              <button className="btn danger" onClick={handleRollbackSubmit}>Send Revision Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Issued Warnings Preview */}
      {validatedWarnings.length > 0 && (
        <div className="issued-warnings-section">
          <h3>Recently Issued Warnings ({validatedWarnings.length})</h3>
          <div className="issued-list">
            {validatedWarnings.slice(0, 5).map(warning => (
              <div key={warning.id} className="issued-card">
                <div className="issued-header">
                  <span className="issued-type">{warning.hazardType}</span>
                  <span className="issued-level" style={{ background: getWarningColor(warning.finalStatement) }}>
                    {warning.finalStatement}
                  </span>
                </div>
                <div className="issued-time">{new Date(warning.issuedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PMOValidationPanel;
