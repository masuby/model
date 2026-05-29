/**
 * SUB-MODULE 5.3: FUTURE INFORM RISK SCENARIOS
 *
 * CORE INNOVATION: Modifies INFORM inputs under future climate scenarios
 * while preserving the original INFORM methodology and formula
 *
 * CRITICAL PRINCIPLE: We do NOT forecast INFORM risk directly.
 * We REPLACE selected indicators in the Country Model Template.
 */

import React, { useState } from 'react';
import './SubModule53FutureRisk.css';
import { CLIMATE_SCENARIOS, TIME_HORIZONS, calculateClimateRisk } from '../data/climateData';

const SubModule53FutureRisk = ({ riskData }) => {
  const [selectedScenario, setSelectedScenario] = useState('SSP2_45');
  const [selectedHorizon, setSelectedHorizon] = useState('MID_TERM');
  const [policyScenario, setPolicyScenario] = useState('baseline'); // baseline, improved, optimal

  const scenario = CLIMATE_SCENARIOS[selectedScenario];
  const horizon = TIME_HORIZONS[selectedHorizon];

  // Sample district for demonstration
  const sampleDistrict = {
    name: 'Dar es Salaam - Kinondoni',
    baseline: {
      hazardExposure: 6.5,
      vulnerability: 5.2,
      copingCapacity: 4.8,
      risk: 5.5 // (6.5 × 5.2 × 4.8)^(1/3) = 5.5
    }
  };

  // Calculate future hazard based on climate scenario
  const getFutureHazard = () => {
    const scenarioMultipliers = {
      'SSP1-2.6': { '2020-2040': 1.15, '2040-2060': 1.25, '2080-2100': 1.35 },
      'SSP2-4.5': { '2020-2040': 1.25, '2040-2060': 1.50, '2080-2100': 1.75 },
      'SSP5-8.5': { '2020-2040': 1.35, '2040-2060': 1.80, '2080-2100': 2.20 }
    };

    const multiplier = scenarioMultipliers[scenario.id][horizon.period] || 1.5;
    return sampleDistrict.baseline.hazardExposure * multiplier;
  };

  // Calculate future coping capacity based on policy scenario
  const getFutureCoping = () => {
    const policyImprovements = {
      'baseline': 1.0,     // No change
      'improved': 1.15,    // Moderate improvement
      'optimal': 1.30      // Strong improvement
    };

    return sampleDistrict.baseline.copingCapacity * policyImprovements[policyScenario];
  };

  // Calculate future INFORM risk using SAME formula
  const futureHazard = getFutureHazard();
  const futureVulnerability = sampleDistrict.baseline.vulnerability; // KEPT CONSTANT
  const futureCoping = getFutureCoping();
  const futureRisk = Math.pow(futureHazard * futureVulnerability * futureCoping, 1/3);

  // Determine risk class transition
  const getRiskClass = (score) => {
    if (score >= 8.0) return { class: 'Very High', color: '#B71C1C' };
    if (score >= 6.5) return { class: 'High', color: '#F44336' };
    if (score >= 5.0) return { class: 'Medium', color: '#FF9800' };
    if (score >= 3.5) return { class: 'Low', color: '#FDD835' };
    return { class: 'Very Low', color: '#4CAF50' };
  };

  const baselineClass = getRiskClass(sampleDistrict.baseline.risk);
  const futureClass = getRiskClass(futureRisk);

  return (
    <div className="submodule53-container">
      {/* Critical Principle Banner */}
      <div className="principle-banner">
        <div className="principle-icon">⚠️</div>
        <div className="principle-content">
          <strong>INFORM Scientific Principle Respected</strong>
          <p>
            We do <strong>NOT</strong> forecast INFORM risk directly. We <strong>REPLACE</strong> selected
            indicators in the Country Model Template while preserving the original INFORM methodology,
            formula, weights, and aggregation.
          </p>
        </div>
      </div>

      {/* Scenario Modification Panel */}
      <div className="modification-panel">
        <h3>🔧 Scenario Configuration</h3>

        {/* Climate Scenario */}
        <div className="config-section">
          <label>Climate Scenario (IPCC AR6)</label>
          <div className="scenario-selector">
            {Object.entries(CLIMATE_SCENARIOS).map(([key, scen]) => (
              <button
                key={key}
                className={`scenario-option ${selectedScenario === key ? 'active' : ''}`}
                onClick={() => setSelectedScenario(key)}
                style={{
                  borderColor: selectedScenario === key ? scen.color : '#E0E0E0',
                  background: selectedScenario === key ? `${scen.color}20` : 'white'
                }}
              >
                {scen.icon} {scen.id}
              </button>
            ))}
          </div>
        </div>

        {/* Time Horizon */}
        <div className="config-section">
          <label>Time Horizon</label>
          <div className="horizon-selector">
            {Object.entries(TIME_HORIZONS).filter(([k, v]) => v.type === 'projection').map(([key, hor]) => (
              <button
                key={key}
                className={`horizon-option ${selectedHorizon === key ? 'active' : ''}`}
                onClick={() => setSelectedHorizon(key)}
                style={{
                  borderColor: selectedHorizon === key ? hor.color : '#E0E0E0',
                  background: selectedHorizon === key ? `${hor.color}20` : 'white'
                }}
              >
                {hor.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Scenario (Coping Capacity) */}
        <div className="config-section">
          <label>Policy Scenario (Affects Coping Capacity)</label>
          <div className="policy-selector">
            <button
              className={`policy-option ${policyScenario === 'baseline' ? 'active' : ''}`}
              onClick={() => setPolicyScenario('baseline')}
            >
              <div className="policy-name">Baseline</div>
              <div className="policy-desc">No additional improvement</div>
            </button>
            <button
              className={`policy-option ${policyScenario === 'improved' ? 'active' : ''}`}
              onClick={() => setPolicyScenario('improved')}
            >
              <div className="policy-name">Improved (+15%)</div>
              <div className="policy-desc">Moderate adaptation investment</div>
            </button>
            <button
              className={`policy-option ${policyScenario === 'optimal' ? 'active' : ''}`}
              onClick={() => setPolicyScenario('optimal')}
            >
              <div className="policy-name">Optimal (+30%)</div>
              <div className="policy-desc">Strong adaptation measures</div>
            </button>
          </div>
        </div>
      </div>

      {/* INFORM Dimension Changes */}
      <div className="dimension-changes">
        <h3>📊 INFORM Dimension Modifications</h3>
        <div className="dimensions-grid">
          {/* Hazard and Exposure */}
          <div className="dimension-card modified">
            <div className="dimension-header">
              <span className="dimension-icon">🌊</span>
              <div className="dimension-info">
                <div className="dimension-name">Hazard and Exposure</div>
                <div className="modification-status">✏️ Modified by Climate Scenario</div>
              </div>
            </div>
            <div className="dimension-values">
              <div className="value-row">
                <span className="value-label">Baseline (Current):</span>
                <span className="value-number">{sampleDistrict.baseline.hazardExposure.toFixed(2)}</span>
              </div>
              <div className="value-row future">
                <span className="value-label">Future ({horizon.period}):</span>
                <span className="value-number">{futureHazard.toFixed(2)}</span>
                <span className="value-change">
                  +{((futureHazard / sampleDistrict.baseline.hazardExposure - 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="dimension-explanation">
              Increased frequency and intensity of climate-related hazards under {scenario.name}
            </div>
          </div>

          {/* Vulnerability */}
          <div className="dimension-card constant">
            <div className="dimension-header">
              <span className="dimension-icon">🛡️</span>
              <div className="dimension-info">
                <div className="dimension-name">Vulnerability</div>
                <div className="modification-status">🔒 Kept Constant (Baseline)</div>
              </div>
            </div>
            <div className="dimension-values">
              <div className="value-row">
                <span className="value-label">Baseline (Current):</span>
                <span className="value-number">{sampleDistrict.baseline.vulnerability.toFixed(2)}</span>
              </div>
              <div className="value-row">
                <span className="value-label">Future ({horizon.period}):</span>
                <span className="value-number">{futureVulnerability.toFixed(2)}</span>
                <span className="value-change">No change</span>
              </div>
            </div>
            <div className="dimension-explanation">
              Vulnerability held constant for conservative risk estimation (can be modified separately)
            </div>
          </div>

          {/* Coping Capacity */}
          <div className="dimension-card policy">
            <div className="dimension-header">
              <span className="dimension-icon">🏥</span>
              <div className="dimension-info">
                <div className="dimension-name">Lack of Coping Capacity</div>
                <div className="modification-status">⚙️ Policy-Dependent Scenario</div>
              </div>
            </div>
            <div className="dimension-values">
              <div className="value-row">
                <span className="value-label">Baseline (Current):</span>
                <span className="value-number">{sampleDistrict.baseline.copingCapacity.toFixed(2)}</span>
              </div>
              <div className="value-row future">
                <span className="value-label">Future ({policyScenario}):</span>
                <span className="value-number">{futureCoping.toFixed(2)}</span>
                <span className="value-change">
                  {policyScenario === 'baseline' ? 'No change' :
                   policyScenario === 'improved' ? '+15%' : '+30%'}
                </span>
              </div>
            </div>
            <div className="dimension-explanation">
              Improved through adaptation investments: early warning, infrastructure, health systems
            </div>
          </div>
        </div>
      </div>

      {/* INFORM Risk Calculation */}
      <div className="risk-calculation-panel">
        <h3>🧮 INFORM Risk Calculation (SAME FORMULA)</h3>
        <div className="formula-display">
          <div className="formula-section">
            <div className="formula-label">Current Risk</div>
            <div className="formula-equation">
              Risk = (H and E × V × LCC)^(1/3)
            </div>
            <div className="formula-substitution">
              = ({sampleDistrict.baseline.hazardExposure.toFixed(2)} × {sampleDistrict.baseline.vulnerability.toFixed(2)} × {sampleDistrict.baseline.copingCapacity.toFixed(2)})^(1/3)
            </div>
            <div className="formula-result baseline">
              = {sampleDistrict.baseline.risk.toFixed(2)}
            </div>
          </div>

          <div className="formula-arrow">→</div>

          <div className="formula-section">
            <div className="formula-label">Future Risk ({scenario.id}, {horizon.period})</div>
            <div className="formula-equation">
              Risk = (H and E_future × V_baseline × LCC_{policyScenario})^(1/3)
            </div>
            <div className="formula-substitution">
              = ({futureHazard.toFixed(2)} × {futureVulnerability.toFixed(2)} × {futureCoping.toFixed(2)})^(1/3)
            </div>
            <div className="formula-result future">
              = {futureRisk.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="formula-note">
          <strong>✓ Same structure</strong> · <strong>✓ Same weights</strong> · <strong>✓ Same aggregation</strong>
          <br/>
          This preserves INFORM integrity while allowing climate scenario analysis
        </div>
      </div>

      {/* Risk Class Transition */}
      <div className="risk-transition-panel">
        <h3>📈 Risk Class Transition</h3>
        <div className="transition-display">
          <div className="transition-from">
            <div className="transition-label">Current Risk Class</div>
            <div
              className="risk-class-badge"
              style={{ backgroundColor: baselineClass.color }}
            >
              {baselineClass.class}
            </div>
            <div className="risk-score">{sampleDistrict.baseline.risk.toFixed(2)}</div>
          </div>

          <div className="transition-arrow-large">
            →
          </div>

          <div className="transition-to">
            <div className="transition-label">Future Risk Class</div>
            <div
              className="risk-class-badge"
              style={{ backgroundColor: futureClass.color }}
            >
              {futureClass.class}
            </div>
            <div className="risk-score">{futureRisk.toFixed(2)}</div>
          </div>
        </div>

        {futureClass.class !== baselineClass.class && (
          <div className="transition-warning">
            <span className="warning-icon">⚠️</span>
            <div className="warning-text">
              <strong>Risk Class Escalation Detected</strong>
              <p>
                Under {scenario.name} by {horizon.period}, this district is projected to
                transition from <strong>{baselineClass.class}</strong> to <strong>{futureClass.class}</strong> risk.
                Priority adaptation measures required.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Future Risk Map (Conceptual) */}
      <div className="future-risk-map">
        <h3>🗺️ Future Risk Map (Conceptual)</h3>
        <div className="map-description">
          <p>
            In full implementation, this would show a map of Tanzania with districts color-coded by
            future risk class, allowing identification of:
          </p>
          <ul>
            <li><strong>Emerging hotspots:</strong> Districts transitioning to higher risk</li>
            <li><strong>Persistent high-risk areas:</strong> Already high-risk districts facing further escalation</li>
            <li><strong>Adaptation priorities:</strong> Where interventions will have greatest impact</li>
          </ul>
        </div>
      </div>

      {/* Integration Note */}
      <div className="integration-note">
        <h4>🔗 Integration with Other Modules</h4>
        <div className="integration-items">
          <div className="integration-item">
            <strong>← Module 02:</strong> Provides baseline risk
          </div>
          <div className="integration-item">
            <strong>→ Module 03:</strong> Future thresholds for warnings
          </div>
          <div className="integration-item">
            <strong>← Module 04:</strong> Validates projections against observed trends
          </div>
          <div className="integration-item">
            <strong>→ Module 5.4:</strong> Identifies adaptation priorities
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubModule53FutureRisk;
