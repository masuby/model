/**
 * LAYER 3: WARNING CLASSIFICATION DISPLAY
 *
 * Shows active warnings with their classification logic explained
 * Displays how hazard + risk context = warning level
 */

import React, { useState } from 'react';
import '../Module03WarningSystem.css';
import { getWarningProperties } from '../services/warningLogic';

const Layer3WarningLogic = ({ activeWarnings, riskData }) => {
  const [selectedWarning, setSelectedWarning] = useState(null);
  const [showCalculation, setShowCalculation] = useState(false);

  if (!activeWarnings || activeWarnings.length === 0) {
    return (
      <div className="layer3-container">
        <div className="layer-header">
          <h2>Layer 3: Active Warnings & Classification</h2>
          <p className="layer-description">Impact-based warning levels</p>
        </div>
        <div className="no-warnings">
          <div className="no-warnings-icon">✅</div>
          <h3>No Active Warnings</h3>
          <p>All areas are currently under routine monitoring.</p>
          <p className="hint">Use the Hazard Input tab to simulate a warning scenario</p>
        </div>
      </div>
    );
  }

  // Group warnings by level
  const warningsByLevel = {
    monitor: activeWarnings.filter(w => w.warningLevel === 'Monitor'),
    advisory: activeWarnings.filter(w => w.warningLevel === 'Advisory'),
    warning: activeWarnings.filter(w => w.warningLevel === 'Warning'),
    major: activeWarnings.filter(w => w.warningLevel === 'Major Warning')
  };

  return (
    <div className="layer3-container">
      <div className="layer-header">
        <h2>Layer 3: Active Warnings & Classification Logic</h2>
        <p className="layer-description">
          Impact-based warnings derived from hazard intensity + risk context
        </p>
      </div>

      {/* Warning Summary */}
      <div className="warning-summary">
        <h3>Active Warnings Summary</h3>
        <div className="warning-level-counts">
          <div className="level-count monitor">
            <div className="count-icon">🟢</div>
            <div className="count-number">{warningsByLevel.monitor.length}</div>
            <div className="count-label">Monitor</div>
          </div>
          <div className="level-count advisory">
            <div className="count-icon">🟡</div>
            <div className="count-number">{warningsByLevel.advisory.length}</div>
            <div className="count-label">Advisory</div>
          </div>
          <div className="level-count warning">
            <div className="count-icon">🟠</div>
            <div className="count-number">{warningsByLevel.warning.length}</div>
            <div className="count-label">Warning</div>
          </div>
          <div className="level-count major">
            <div className="count-icon">🔴</div>
            <div className="count-number">{warningsByLevel.major.length}</div>
            <div className="count-label">Major Warning</div>
          </div>
        </div>
      </div>

      {/* Warnings List */}
      <div className="warnings-list-section">
        <h3>All Active Warnings</h3>
        <div className="warnings-grid">
          {activeWarnings.map(warning => {
            const properties = getWarningProperties(warning.warningLevel);

            return (
              <div
                key={warning.id}
                className={`warning-card ${selectedWarning === warning ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedWarning(warning);
                  setShowCalculation(true);
                }}
                style={{ borderLeftColor: properties.color, borderLeftWidth: '5px' }}
              >
                <div className="warning-card-header">
                  <span className="warning-icon">{properties.icon}</span>
                  <span className="warning-level-text" style={{ color: properties.color }}>
                    {warning.warningLevel}
                  </span>
                </div>
                <div className="warning-card-body">
                  <div className="warning-district-name">{warning.district}</div>
                  <div className="warning-hazard-type">{warning.hazard.hazardType}</div>
                  <div className="warning-institution">{warning.hazard.institution}</div>
                </div>
                <div className="warning-card-footer">
                  <div className="warning-score">
                    Score: <strong>{warning.warningScore.toFixed(2)}</strong>
                  </div>
                  <div className="warning-timestamp">
                    {new Date(warning.issuedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Warning Details */}
      {selectedWarning && showCalculation && (
        <div className="warning-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Warning Classification Logic</h3>
              <button className="modal-close" onClick={() => setShowCalculation(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* District Info */}
              <div className="detail-block">
                <h4>📍 Location</h4>
                <div className="detail-content">
                  <div className="detail-row">
                    <span className="detail-label">District:</span>
                    <span className="detail-value"><strong>{selectedWarning.district}</strong></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Region:</span>
                    <span className="detail-value">{selectedWarning.riskProfile.admin.adm1Name}</span>
                  </div>
                </div>
              </div>

              {/* Hazard Component */}
              <div className="detail-block">
                <h4>🌧️ Hazard Component</h4>
                <div className="detail-content">
                  <div className="detail-row">
                    <span className="detail-label">Hazard Type:</span>
                    <span className="detail-value">{selectedWarning.hazard.hazardType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Warning Level:</span>
                    <span className="detail-value"><strong>{selectedWarning.hazard.warningLevel}</strong></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Source:</span>
                    <span className="detail-value">{selectedWarning.hazard.institution}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Confidence:</span>
                    <span className="detail-value">{selectedWarning.hazard.confidence}</span>
                  </div>
                </div>
              </div>

              {/* Risk Context Component */}
              <div className="detail-block">
                <h4>📊 Risk Context (from Module 02)</h4>
                <div className="detail-content">
                  <div className="detail-row">
                    <span className="detail-label">Overall Risk:</span>
                    <span className="detail-value"><strong>{selectedWarning.riskProfile.risk?.toFixed(2) || 'N/A'}</strong></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Vulnerability:</span>
                    <span className="detail-value">{selectedWarning.riskProfile.vulnerability?.total.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Lack of Coping:</span>
                    <span className="detail-value">{selectedWarning.riskProfile.lackCopingCapacity?.total.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Risk Sensitivity:</span>
                    <span className="detail-value">
                      <strong>
                        {Math.sqrt(
                          (selectedWarning.riskProfile.vulnerability?.total || 5) *
                          (selectedWarning.riskProfile.lackCopingCapacity?.total || 5)
                        ).toFixed(2)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Calculation Formula */}
              <div className="detail-block formula-block">
                <h4>🧮 Warning Score Calculation</h4>
                <div className="formula-display">
                  <div className="formula-line">
                    <span className="formula-text">Warning Score = √(Hazard Score × Risk Sensitivity)</span>
                  </div>
                  <div className="formula-line">
                    <span className="formula-text">
                      = √(Hazard × √(Vulnerability × Lack of Coping))
                    </span>
                  </div>
                  <div className="formula-result">
                    <span className="result-label">Result:</span>
                    <span className="result-value">{selectedWarning.warningScore.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warning Classification */}
              <div className="detail-block classification-block">
                <h4>⚠️ Warning Classification</h4>
                <div className="classification-result">
                  <div className="classification-icon">
                    {getWarningProperties(selectedWarning.warningLevel).icon}
                  </div>
                  <div className="classification-info">
                    <div
                      className="classification-level"
                      style={{ color: getWarningProperties(selectedWarning.warningLevel).color }}
                    >
                      {selectedWarning.warningLevel}
                    </div>
                    <div className="classification-description">
                      {getWarningProperties(selectedWarning.warningLevel).description}
                    </div>
                  </div>
                </div>

                <div className="classification-thresholds">
                  <h5>Classification Thresholds:</h5>
                  <ul>
                    <li>🟢 <strong>Monitor:</strong> 0.0 - 2.5</li>
                    <li>🟡 <strong>Advisory:</strong> 2.5 - 5.0</li>
                    <li>🟠 <strong>Warning:</strong> 5.0 - 7.5</li>
                    <li>🔴 <strong>Major Warning:</strong> 7.5 - 10.0</li>
                  </ul>
                </div>
              </div>

              {/* Impact Estimate */}
              {selectedWarning.impact && (
                <div className="detail-block">
                  <h4>👥 Estimated Impact</h4>
                  <div className="detail-content">
                    <div className="detail-row">
                      <span className="detail-label">Population at Risk:</span>
                      <span className="detail-value">
                        <strong>{(selectedWarning.impact.totalPopulation || 0).toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Vulnerable Population:</span>
                      <span className="detail-value">
                        {(selectedWarning.impact.vulnerablePopulation || 0).toLocaleString()}
                        ({selectedWarning.impact.vulnerabilityPercentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowCalculation(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Panel */}
      <div className="explanation-panel">
        <h3>💡 Why This Approach?</h3>
        <div className="explanation-grid">
          <div className="explanation-card">
            <h4>Impact-Based, Not Hazard-Based</h4>
            <p>
              We don't just warn about the hazard (e.g., "100mm rain").
              We warn about the <strong>impact</strong> (e.g., "Major flooding expected in vulnerable areas").
            </p>
          </div>
          <div className="explanation-card">
            <h4>Risk-Conditioned</h4>
            <p>
              The same hazard produces different warnings in different places based on
              <strong> local vulnerability and coping capacity</strong>.
            </p>
          </div>
          <div className="explanation-card">
            <h4>Actionable</h4>
            <p>
              Each warning level has clear <strong>actions</strong> for authorities and the public,
              not just information.
            </p>
          </div>
          <div className="explanation-card">
            <h4>Validated</h4>
            <p>
              PMO-DMD reviews and validates all warnings before dissemination,
              adding <strong>local intelligence</strong> and context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layer3WarningLogic;
