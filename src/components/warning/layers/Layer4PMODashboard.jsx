/**
 * LAYER 4: PMO-DMD CONSOLIDATION & VALIDATION DASHBOARD
 * Progressive Build - Adding workflow data, impact assessment, and actor selection
 */

import React, { useState } from 'react';
import '../Module03WarningSystem.css';
import {
  REGISTERED_ACTORS,
  PUBLIC_ACTIONS,
  IMPACT_LEVELS,
  ASSESSMENT_FACTORS
} from '../data/workflowData';
import ReportExportButton from '../components/ReportExportButton';

const Layer4PMODashboard = ({ activeWarnings, activeHazards, riskData, onApproveWarning }) => {
  console.log('🏛️ PMO-DMD Dashboard rendering...');
  console.log('  - activeHazards:', activeHazards?.length || 0);
  console.log('  - activeWarnings:', activeWarnings?.length || 0);
  console.log('  - riskData:', riskData ? 'Loaded' : 'Not loaded');

  const [selectedHazard, setSelectedHazard] = useState(null);
  const [impactLevel, setImpactLevel] = useState('MODERATE');
  const [finalStatement, setFinalStatement] = useState('WARNING');
  const [selectedActors, setSelectedActors] = useState([]);
  const [exposureNotes, setExposureNotes] = useState('');
  const [vulnerabilityNotes, setVulnerabilityNotes] = useState('');
  const [capacityNotes, setCapacityNotes] = useState('');

  // Calculate basic statistics
  const stats = {
    pendingReview: Array.isArray(activeHazards) ? activeHazards.length : 0,
    activeWarnings: Array.isArray(activeWarnings) ? activeWarnings.filter(w => w.status === 'active').length : 0,
    institutionsReporting: Array.isArray(activeHazards) ? new Set(activeHazards.map(h => h.institution)).size : 0,
    totalPopulationAtRisk: 0
  };

  // Toggle actor selection
  const toggleActor = (actorId) => {
    setSelectedActors(prev =>
      prev.includes(actorId)
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    );
  };

  // Handle warning issuance
  const handleIssueWarning = () => {
    if (!selectedHazard) {
      alert('⚠️ Please select a hazard to assess');
      return;
    }

    const assessment = {
      hazardId: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      institution: selectedHazard.institution,
      impactLevel: IMPACT_LEVELS[impactLevel],
      finalStatement,
      actorDirectives: REGISTERED_ACTORS
        .filter(actor => selectedActors.includes(actor.id))
        .map(actor => ({
          actor: actor.name,
          role: actor.role,
          actions: actor.actions
        })),
      publicActions: PUBLIC_ACTIONS[finalStatement] || [],
      assessmentFactors: {
        exposure: exposureNotes,
        vulnerability: vulnerabilityNotes,
        capacity: capacityNotes
      },
      issuedAt: new Date().toISOString(),
      issuedBy: 'PMO-DMD'
    };

    console.log('📢 Warning Issued:', assessment);
    alert(`✅ Warning Successfully Issued!\n\nHazard: ${selectedHazard.hazardType}\nStatement: ${finalStatement}\nImpact Level: ${IMPACT_LEVELS[impactLevel].value}\nActors Notified: ${selectedActors.length}`);

    if (onApproveWarning) {
      onApproveWarning(assessment);
    }
  };

  console.log('📊 Stats calculated:', stats);

  return (
    <div className="layer4-container" style={{ padding: '20px' }}>
      {/* Confirmation Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        border: '3px solid #2E7D32'
      }}>
        ✅ PMO-DMD Dashboard - National Consolidation & Validation Interface
      </div>

      <div className="layer-header" style={{ marginBottom: '20px' }}>
        <h2>🏛️ PMO-DMD: Consolidation & Validation Dashboard</h2>
        <p className="layer-description">
          National risk integration, impact assessment, and final warning issuance
        </p>
      </div>

      {/* Dashboard Statistics */}
      <div className="pmo-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976D2' }}>{stats.pendingReview}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Hazards Pending Review</div>
        </div>

        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>{stats.activeWarnings}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Active Warnings</div>
        </div>

        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏛️</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.institutionsReporting}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Institutions Reporting</div>
        </div>

        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F44336' }}>{stats.totalPopulationAtRisk.toLocaleString()}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Population At Risk</div>
        </div>
      </div>

      {/* Step 2.1: Multi-Agency Review */}
      <div className="pmo-section" style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #E0E0E0'
      }}>
        <h3 style={{ marginBottom: '12px', color: '#1976D2' }}>📥 Step 2.1: Multi-Agency Hazard Review</h3>
        <p style={{ marginBottom: '16px', color: '#666' }}>Select a hazard forecast from technical institutions for impact assessment</p>

        {!activeHazards || activeHazards.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#F5F5F5',
            borderRadius: '8px',
            border: '2px dashed #CCC'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>📭 No hazard forecasts available for review</p>
            <small style={{ color: '#666' }}>Hazards will appear here after institutions submit forecasts in Layer 1</small>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeHazards.map((hazard, index) => (
              <div
                key={index}
                onClick={() => {
                  console.log('🎯 Hazard selected:', hazard);
                  setSelectedHazard(hazard);
                }}
                className={`hazard-review-card ${selectedHazard === hazard ? 'selected' : ''}`}
                style={{
                  padding: '16px',
                  background: selectedHazard === hazard ? '#E3F2FD' : 'white',
                  border: selectedHazard === hazard ? '2px solid #1976D2' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{hazard.institution || 'Unknown Institution'}</span>
                  <span style={{ color: '#1976D2', fontWeight: 'bold' }}>{hazard.hazardType || 'Unknown Hazard'}</span>
                  <span className={`hazard-warning-level ${(hazard.warningLevel || '').toLowerCase().replace(' ', '-')}`} style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: hazard.warningLevel === 'Major Warning' ? '#FFEBEE' :
                               hazard.warningLevel === 'Warning' ? '#FFF3E0' : '#FFF9C4',
                    color: hazard.warningLevel === 'Major Warning' ? '#C62828' :
                          hazard.warningLevel === 'Warning' ? '#E65100' : '#F57F17'
                  }}>
                    {hazard.warningLevel || 'Advisory'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div><strong>Forecast Day:</strong> {hazard.forecastDay || 'N/A'}</div>
                  <div><strong>Districts Affected:</strong> {hazard.districtWarningLevels ? Object.keys(hazard.districtWarningLevels).length : 0}</div>
                  <div><strong>Likelihood:</strong> {hazard.likelihood || 'Medium'}</div>
                </div>
                {selectedHazard === hazard && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    ✓ Selected for Assessment
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2.2: Impact-Based Risk Assessment */}
      {selectedHazard && (
        <div className="pmo-section">
          <h3>📊 Step 2.2: Impact-Based Risk Assessment</h3>
          <p>Analyze factors from INFORM Risk (Module 02) to determine potential impact</p>

          <div className="assessment-factors">
            {/* Exposure */}
            <div className="factor-card">
              <div className="factor-header">
                <div className="factor-icon">⚠️</div>
                <div>
                  <h4>Hazard & Exposure</h4>
                  <p>Population and assets in hazard-prone areas</p>
                </div>
              </div>
              <div className="factor-components">
                <strong>Components (from INFORM):</strong>
                <ul>
                  <li>Population exposed to hazard</li>
                  <li>Physical exposure (buildings, infrastructure)</li>
                  <li>Economic exposure (assets, livelihoods)</li>
                </ul>
              </div>
              <div className="factor-input">
                <label>Assessment Notes:</label>
                <textarea
                  rows="3"
                  value={exposureNotes}
                  onChange={(e) => setExposureNotes(e.target.value)}
                  placeholder="e.g., High population density in flood-prone areas, critical infrastructure at risk..."
                />
              </div>
            </div>

            {/* Vulnerability */}
            <div className="factor-card">
              <div className="factor-header">
                <div className="factor-icon">🛡️</div>
                <div>
                  <h4>Vulnerability</h4>
                  <p>Susceptibility to harm from the hazard</p>
                </div>
              </div>
              <div className="factor-components">
                <strong>Components (from INFORM):</strong>
                <ul>
                  <li>Socio-economic vulnerability (poverty, inequality)</li>
                  <li>Vulnerable groups (children, elderly, disabled)</li>
                  <li>Quality of infrastructure (buildings, roads)</li>
                </ul>
              </div>
              <div className="factor-input">
                <label>Assessment Notes:</label>
                <textarea
                  rows="3"
                  value={vulnerabilityNotes}
                  onChange={(e) => setVulnerabilityNotes(e.target.value)}
                  placeholder="e.g., High poverty levels, informal settlements with weak structures..."
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="factor-card">
              <div className="factor-header">
                <div className="factor-icon">🏛️</div>
                <div>
                  <h4>Lack of Coping Capacity</h4>
                  <p>Inability to manage and recover from impacts</p>
                </div>
              </div>
              <div className="factor-components">
                <strong>Components (from INFORM):</strong>
                <ul>
                  <li>Infrastructure (roads, communications, health facilities)</li>
                  <li>Institutional capacity (DRR governance, early warning)</li>
                  <li>Emergency services availability</li>
                </ul>
              </div>
              <div className="factor-input">
                <label>Assessment Notes:</label>
                <textarea
                  rows="3"
                  value={capacityNotes}
                  onChange={(e) => setCapacityNotes(e.target.value)}
                  placeholder="e.g., Limited emergency services in remote areas, weak communication infrastructure..."
                />
              </div>
            </div>
          </div>

          {/* Impact Level Selector */}
          <div className="final-statement-selector" style={{ marginTop: '24px' }}>
            <label>💥 Assign Impact Level:</label>
            <select
              className="statement-select"
              value={impactLevel}
              onChange={(e) => setImpactLevel(e.target.value)}
            >
              {Object.entries(IMPACT_LEVELS).map(([key, level]) => (
                <option key={key} value={key}>
                  {level.value} - {level.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 3: Warning Issuance */}
      {selectedHazard && (
        <div className="pmo-section">
          <h3>📢 Step 3: Issuance of National-Level Warning</h3>

          {/* Final Statement Selector */}
          <div className="final-statement-selector">
            <label>🚨 Final Warning Statement:</label>
            <select
              className="statement-select"
              value={finalStatement}
              onChange={(e) => setFinalStatement(e.target.value)}
              style={{
                backgroundColor: finalStatement === 'MAJOR_WARNING' ? '#FFEBEE' :
                                 finalStatement === 'WARNING' ? '#FFF3E0' : '#FFF9C4',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              <option value="ADVISORY">🟡 ADVISORY - Please be prepared</option>
              <option value="WARNING">🟠 WARNING - Take Action</option>
              <option value="MAJOR_WARNING">🔴 MAJOR WARNING - Take Action Now</option>
            </select>
          </div>

          {/* Actor Selection */}
          <div className="actors-directive">
            <h4>🎯 Step 3.B: Directives to Registered Actors</h4>
            <p>Select actors who should receive directives and take preparedness actions</p>

            <div className="actors-grid">
              {REGISTERED_ACTORS.map(actor => (
                <label key={actor.id} className="actor-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedActors.includes(actor.id)}
                    onChange={() => toggleActor(actor.id)}
                  />
                  <div className="actor-info">
                    <div className="actor-name">{actor.name}</div>
                    <div className="actor-role">{actor.role}</div>
                    <div className="actor-category">{actor.category}</div>
                  </div>
                </label>
              ))}
            </div>

            {selectedActors.length > 0 && (
              <div className="selected-actors-summary">
                <h5>✅ Selected Actors Will Receive These Directives:</h5>
                <div className="actors-actions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Actor</th>
                        <th>Role</th>
                        <th>Actions to Take</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REGISTERED_ACTORS
                        .filter(actor => selectedActors.includes(actor.id))
                        .map(actor => (
                          <tr key={actor.id}>
                            <td><strong>{actor.name}</strong></td>
                            <td>{actor.role}</td>
                            <td>
                              <ul className="action-list">
                                {actor.actions.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Public Actions */}
          <div className="public-actions-section">
            <h4>📱 Step 3.C: Actions to be Taken by the Public</h4>
            <p>The following actions will be communicated to the public based on the warning level</p>

            {PUBLIC_ACTIONS[finalStatement] && (
              <div className="public-actions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Action Category</th>
                      <th>Public Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PUBLIC_ACTIONS[finalStatement].map((action, idx) => (
                      <tr key={idx}>
                        <td>{action.category}</td>
                        <td>{action.instruction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Issue Warning & Export Report Actions */}
          <div className="issue-warning-actions">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button className="btn-issue-warning" onClick={handleIssueWarning}>
                🚨 ISSUE NATIONAL WARNING
              </button>

              {/* Report Export Button */}
              {selectedHazard && (
                <ReportExportButton
                  reportType="warning"
                  reportData={{
                    hazardType: selectedHazard.hazardType,
                    institution: selectedHazard.institution,
                    severity: selectedHazard.severity,
                    affectedDistricts: selectedHazard.affectedDistricts || [],
                    finalStatement,
                    impactLevel: IMPACT_LEVELS[impactLevel],
                    actorDirectives: REGISTERED_ACTORS
                      .filter(actor => selectedActors.includes(actor.id))
                      .map(actor => ({
                        actor: actor.name,
                        role: actor.role,
                        actions: actor.actions
                      })),
                    publicActions: PUBLIC_ACTIONS[finalStatement] || [],
                    assessmentFactors: {
                      exposure: exposureNotes,
                      vulnerability: vulnerabilityNotes,
                      capacity: capacityNotes
                    }
                  }}
                  buttonStyle="secondary"
                  buttonText="Export Warning Bulletin"
                  disabled={!selectedHazard}
                  onExportComplete={(format) => {
                    console.log(`📄 Warning bulletin exported as ${format}`);
                  }}
                />
              )}
            </div>
            <p className="issue-note">
              Issue the warning to send directives to all selected actors and activate public communication channels.
              Export the bulletin as PDF or image for distribution.
            </p>
          </div>
        </div>
      )}

      {/* Active Warnings Summary */}
      {activeWarnings && activeWarnings.length > 0 && (
        <div className="pmo-section">
          <h3>⚠️ Active Warnings Summary</h3>
          <div className="active-warnings-list">
            {activeWarnings.slice(0, 5).map((warning, index) => (
              <div key={warning.id || index} className="active-warning-item">
                <div className="warning-meta">
                  <span className="warning-level-badge" style={{
                    backgroundColor: warning.warningLevel === 'Major Warning' ? '#F44336' :
                                    warning.warningLevel === 'Warning' ? '#FF9800' : '#FFC107'
                  }}>
                    {warning.warningLevel}
                  </span>
                  <span className="warning-district">{warning.district}</span>
                  <span className="warning-hazard">{warning.hazard?.hazardType || 'Unknown'}</span>
                </div>
                <div className="warning-timestamp">
                  Issued: {new Date(warning.issuedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layer4PMODashboard;
