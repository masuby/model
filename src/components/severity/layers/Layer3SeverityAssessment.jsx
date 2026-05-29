/**
 * LAYER 3: SEVERITY ASSESSMENT & VALIDATION
 *
 * Calculates severity scores, spatial/temporal analysis,
 * and validates against risk predictions and warnings
 */

import React, { useState, useEffect } from 'react';
import '../Module04Severity.css';
import './Layer3SeverityAssessment.css';
import {
  SEVERITY_INDICATORS,
  SEVERITY_LEVELS,
  calculateSeverityScore,
  classifySeverity,
  normalizeIndicator,
  EVENT_PHASES,
  RESPONSE_STATUS,
  RESPONSE_ACTIONS
} from '../data/severityData';

const Layer3SeverityAssessment = ({
  selectedEvent,
  impactReports,
  riskData,
  activeWarnings
}) => {
  const [severityAnalysis, setSeverityAnalysis] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, spatial, temporal, validation

  useEffect(() => {
    if (impactReports.length > 0) {
      calculateSeverity();
    }
  }, [impactReports]);

  const calculateSeverity = () => {
    // Aggregate impact data from all reports
    const aggregated = {
      HUMAN_IMPACT: {},
      INFRASTRUCTURE_IMPACT: {},
      LIVELIHOOD_IMPACT: {}
    };

    impactReports.forEach(report => {
      Object.entries(report.impactData).forEach(([key, value]) => {
        const [category, indicator] = key.split('.');
        if (!aggregated[category][indicator]) {
          aggregated[category][indicator] = 0;
        }
        aggregated[category][indicator] += value;
      });
    });

    // Calculate normalized scores for each category
    const categoryScores = {};

    Object.entries(SEVERITY_INDICATORS).forEach(([categoryKey, category]) => {
      const indicators = category.indicators;
      let totalScore = 0;
      let count = 0;

      indicators.forEach(indicator => {
        const rawValue = aggregated[categoryKey][indicator.id] || 0;
        if (rawValue > 0) {
          const normalized = normalizeIndicator(rawValue, indicator.threshold);
          totalScore += normalized;
          count++;
        }
      });

      categoryScores[categoryKey] = count > 0 ? totalScore / count : 0;
    });

    // Calculate overall severity using geometric mean
    const overallScore = calculateSeverityScore(
      categoryScores.HUMAN_IMPACT || 0,
      categoryScores.INFRASTRUCTURE_IMPACT || 0,
      categoryScores.LIVELIHOOD_IMPACT || 0
    );

    const severity = classifySeverity(overallScore);

    setSeverityAnalysis({
      overallScore,
      severity,
      categoryScores,
      aggregatedData: aggregated
    });
  };

  // Get related warning for validation
  const getRelatedWarning = () => {
    if (!activeWarnings || !selectedEvent.warningId) return null;
    return activeWarnings.find(w => w.id === selectedEvent.warningId);
  };

  const relatedWarning = getRelatedWarning();

  return (
    <div className="layer3-container">
      {/* Layer Header */}
      <div className="layer-header">
        <h2>Layer 3: Severity Assessment & Validation</h2>
        <p className="layer-description">
          Evidence-based severity scoring and validation against risk predictions
        </p>
      </div>

      {/* Impact Reports Status */}
      <div className="reports-status-banner">
        <div className="status-item">
          <span className="status-icon">📊</span>
          <div className="status-info">
            <div className="status-value">{impactReports.length}</div>
            <div className="status-label">Impact Reports Received</div>
          </div>
        </div>
        <div className="status-item">
          <span className="status-icon">🏛️</span>
          <div className="status-info">
            <div className="status-value">
              {new Set(impactReports.map(r => r.institution)).size}
            </div>
            <div className="status-label">Institutions Reporting</div>
          </div>
        </div>
        <div className="status-item">
          <span className="status-icon">📍</span>
          <div className="status-info">
            <div className="status-value">{selectedEvent.affectedRegions.length}</div>
            <div className="status-label">Regions Affected</div>
          </div>
        </div>
      </div>

      {impactReports.length === 0 ? (
        <div className="no-data-message">
          <div className="message-icon">📋</div>
          <h3>No Impact Data Available</h3>
          <p>Impact reports must be submitted (Layer 2) before severity can be assessed</p>
          <small>Please switch to Layer 2 to submit impact data</small>
        </div>
      ) : (
        <>
          {/* View Tabs */}
          <div className="view-tabs">
            <button
              className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <span className="tab-icon">📈</span>
              <span>Severity Overview</span>
            </button>
            <button
              className={`view-tab ${activeView === 'validation' ? 'active' : ''}`}
              onClick={() => setActiveView('validation')}
            >
              <span className="tab-icon">✅</span>
              <span>Risk & Warning Validation</span>
            </button>
            <button
              className={`view-tab ${activeView === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveView('timeline')}
            >
              <span className="tab-icon">⏱️</span>
              <span>Event Timeline</span>
            </button>
            <button
              className={`view-tab ${activeView === 'response' ? 'active' : ''}`}
              onClick={() => setActiveView('response')}
            >
              <span className="tab-icon">🚨</span>
              <span>Response Tracking</span>
            </button>
          </div>

          {/* Severity Overview */}
          {activeView === 'overview' && severityAnalysis && (
            <div className="severity-overview">
              {/* Overall Severity Score */}
              <div className="severity-score-card">
                <h3>Overall Severity Score</h3>
                <div className="score-display">
                  <div
                    className="score-circle"
                    style={{
                      background: `conic-gradient(${severityAnalysis.severity.color} ${severityAnalysis.overallScore * 10}%, #F5F5F5 0)`
                    }}
                  >
                    <div className="score-inner">
                      <div className="score-value">{severityAnalysis.overallScore.toFixed(2)}</div>
                      <div className="score-max">/ 10</div>
                    </div>
                  </div>
                  <div className="severity-classification">
                    <div className="classification-icon" style={{ fontSize: '48px' }}>
                      {severityAnalysis.severity.icon}
                    </div>
                    <div
                      className="classification-level"
                      style={{ color: severityAnalysis.severity.color }}
                    >
                      {severityAnalysis.severity.value}
                    </div>
                    <div className="classification-description">
                      {severityAnalysis.severity.description}
                    </div>
                  </div>
                </div>

                {/* Calculation Formula */}
                <div className="formula-explanation">
                  <h4>📐 Calculation Method (INFORM Approach)</h4>
                  <div className="formula-box">
                    <div className="formula-text">
                      Severity = (Human Impact × Infrastructure Impact × Livelihood Impact)^(1/3)
                    </div>
                    <div className="formula-values">
                      <span>= ({severityAnalysis.categoryScores.HUMAN_IMPACT.toFixed(2)} × {severityAnalysis.categoryScores.INFRASTRUCTURE_IMPACT.toFixed(2)} × {severityAnalysis.categoryScores.LIVELIHOOD_IMPACT.toFixed(2)})^(1/3)</span>
                    </div>
                    <div className="formula-result">
                      = {severityAnalysis.overallScore.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Component Scores */}
              <div className="component-scores">
                <h3>Severity Components</h3>
                <div className="components-grid">
                  {Object.entries(SEVERITY_INDICATORS).map(([key, category]) => {
                    const score = severityAnalysis.categoryScores[key];
                    return (
                      <div key={key} className="component-card">
                        <div className="component-header">
                          <span className="component-icon">{category.icon}</span>
                          <div className="component-info">
                            <div className="component-name">{category.name}</div>
                            <div className="component-weight">Weight: {(category.weight * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="component-score">
                          <div className="score-bar">
                            <div
                              className="score-fill"
                              style={{
                                width: `${(score / 10) * 100}%`,
                                backgroundColor: category.color
                              }}
                            ></div>
                          </div>
                          <div className="score-number">{score.toFixed(2)} / 10</div>
                        </div>

                        {/* Indicator Breakdown */}
                        <div className="indicators-breakdown">
                          {category.indicators.map(indicator => {
                            const rawValue = severityAnalysis.aggregatedData[key][indicator.id] || 0;
                            if (rawValue > 0) {
                              return (
                                <div key={indicator.id} className="indicator-item">
                                  <span className="indicator-label">{indicator.label}:</span>
                                  <span className="indicator-value">
                                    {rawValue.toLocaleString()} {indicator.unit}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Risk & Warning Validation */}
          {activeView === 'validation' && severityAnalysis && (
            <div className="validation-view">
              <h3>🔄 Closing the Loop: Validation & Learning</h3>

              {/* Warning Validation */}
              {relatedWarning && (
                <div className="validation-card">
                  <h4>📢 Warning Validation (Module 03)</h4>
                  <div className="validation-comparison">
                    <div className="comparison-item">
                      <div className="comparison-label">Warning Level (Anticipated)</div>
                      <div className="comparison-value warning-level">
                        {relatedWarning.warningLevel}
                      </div>
                    </div>
                    <div className="comparison-arrow">vs</div>
                    <div className="comparison-item">
                      <div className="comparison-label">Severity Level (Observed)</div>
                      <div className="comparison-value severity-level">
                        {severityAnalysis.severity.value}
                      </div>
                    </div>
                  </div>

                  <div className="validation-assessment">
                    {relatedWarning.warningLevel === severityAnalysis.severity.value ? (
                      <div className="assessment accurate">
                        <span className="assessment-icon">✅</span>
                        <div className="assessment-text">
                          <strong>Warning Accurate</strong>
                          <p>The warning level matched the observed severity. No adjustment needed.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="assessment mismatch">
                        <span className="assessment-icon">⚠️</span>
                        <div className="assessment-text">
                          <strong>Warning Mismatch Detected</strong>
                          <p>
                            Warning suggested <strong>{relatedWarning.warningLevel}</strong> but
                            observed severity was <strong>{severityAnalysis.severity.value}</strong>.
                            Review thresholds and risk factors.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Risk Validation */}
              <div className="validation-card">
                <h4>📊 Risk Validation (Module 02)</h4>
                <p>Compare expected impact (risk level) with observed severity</p>
                <div className="risk-severity-comparison">
                  <div className="comparison-note">
                    <strong>Purpose:</strong> Validate that Module 02 risk estimates align with real-world events.
                    High-risk areas should experience higher severity when hazards occur.
                  </div>
                  <div className="comparison-note">
                    <strong>Action:</strong> If mismatches are consistent, review vulnerability and coping capacity
                    indicators in Module 02.
                  </div>
                </div>
              </div>

              {/* Feedback Recommendations */}
              <div className="feedback-recommendations">
                <h4>💡 Recommended Actions</h4>
                <ul>
                  <li>
                    <strong>Update Risk Thresholds:</strong> If severity consistently differs from risk predictions,
                    adjust vulnerability or hazard intensity thresholds
                  </li>
                  <li>
                    <strong>Refine Warning Logic:</strong> Update warning classification thresholds in Module 03
                    based on observed severity patterns
                  </li>
                  <li>
                    <strong>Institutional Capacity:</strong> If response gaps are identified, strengthen early
                    warning dissemination or response coordination
                  </li>
                  <li>
                    <strong>Data Quality:</strong> Improve impact reporting standardization across institutions
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Event Timeline */}
          {activeView === 'timeline' && (
            <div className="timeline-view">
              <h3>⏱️ Event Timeline Analysis</h3>
              <div className="event-timeline">
                <div className="timeline-phase completed">
                  <div className="phase-icon">{EVENT_PHASES.WARNING_ISSUED.icon}</div>
                  <div className="phase-info">
                    <div className="phase-label">{EVENT_PHASES.WARNING_ISSUED.label}</div>
                    <div className="phase-time">
                      {selectedEvent.warningId ? new Date(selectedEvent.dateStart).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="timeline-phase completed">
                  <div className="phase-icon">{EVENT_PHASES.HAZARD_ONSET.icon}</div>
                  <div className="phase-info">
                    <div className="phase-label">{EVENT_PHASES.HAZARD_ONSET.label}</div>
                    <div className="phase-time">{new Date(selectedEvent.dateStart).toLocaleString()}</div>
                  </div>
                </div>
                <div className="timeline-phase active">
                  <div className="phase-icon">{EVENT_PHASES.PEAK_IMPACT.icon}</div>
                  <div className="phase-info">
                    <div className="phase-label">{EVENT_PHASES.PEAK_IMPACT.label}</div>
                    <div className="phase-time">Current Phase</div>
                  </div>
                </div>
                <div className="timeline-phase">
                  <div className="phase-icon">{EVENT_PHASES.RESPONSE_ACTIVE.icon}</div>
                  <div className="phase-info">
                    <div className="phase-label">{EVENT_PHASES.RESPONSE_ACTIVE.label}</div>
                    <div className="phase-time">Ongoing</div>
                  </div>
                </div>
                <div className="timeline-phase">
                  <div className="phase-icon">{EVENT_PHASES.RECOVERY_PHASE.icon}</div>
                  <div className="phase-info">
                    <div className="phase-label">{EVENT_PHASES.RECOVERY_PHASE.label}</div>
                    <div className="phase-time">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Response Tracking */}
          {activeView === 'response' && (
            <div className="response-view">
              <h3>🚨 Response Tracking</h3>
              <p className="response-note">
                Track response actions, resources deployed, and identify gaps
              </p>

              <div className="response-actions-grid">
                {RESPONSE_ACTIONS.map(action => (
                  <div key={action.id} className="response-action-card">
                    <div className="action-icon">{action.icon}</div>
                    <div className="action-name">{action.name}</div>
                    <div className="action-category">{action.category}</div>
                    <div className="action-status">
                      <select className="status-select">
                        <option value="not_started">Not Started</option>
                        <option value="mobilizing">Mobilizing</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="gaps">Gaps Identified</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* INFORM Learning Loop */}
      <div className="learning-loop-panel">
        <h3>🔄 INFORM Learning Loop</h3>
        <div className="loop-diagram">
          <div className="loop-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <strong>Risk Assessment</strong>
              <small>Module 02: Predict potential impact</small>
            </div>
          </div>
          <div className="loop-arrow">→</div>
          <div className="loop-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <strong>Early Warning</strong>
              <small>Module 03: Issue impact-based warnings</small>
            </div>
          </div>
          <div className="loop-arrow">→</div>
          <div className="loop-step active">
            <div className="step-number">3</div>
            <div className="step-content">
              <strong>Observe Impact</strong>
              <small>Module 04: Measure actual severity</small>
            </div>
          </div>
          <div className="loop-arrow">→</div>
          <div className="loop-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <strong>Learn & Improve</strong>
              <small>Refine risk models & warning logic</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layer3SeverityAssessment;
