/**
 * MODULE 05: INFORM CLIMATE CHANGE
 * "Extending INFORM into Long-Term Climate Risk and Adaptation"
 *
 * Strategic horizon: climate projections, risk amplification, and resilience
 */

import React, { useState } from 'react';
import './Module05Climate.css';
import {
  CLIMATE_SCENARIOS,
  TIME_HORIZONS,
  CLIMATE_HAZARDS,
  ADAPTATION_STRATEGIES
} from './data/climateData';

const Module05Climate = ({ riskData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScenario, setSelectedScenario] = useState('SSP2_45');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState('MID_TERM');

  const scenario = CLIMATE_SCENARIOS[selectedScenario];
  const timeHorizon = TIME_HORIZONS[selectedTimeHorizon];

  return (
    <div className="module05-container">
      {/* Module Header */}
      <div className="module05-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="module-title">
              <span className="module-number">MODULE 05</span>
              <span className="module-name">INFORM CLIMATE CHANGE</span>
            </h1>
            <p className="module-subtitle">
              Long-Term Climate Risk, Projections & Adaptation Planning
            </p>
          </div>
          <div className="climate-indicator">
            <div className="indicator-icon">🌍</div>
            <div className="indicator-text">
              <div className="indicator-value">Strategic Horizon</div>
              <div className="indicator-label">2020 - 2100</div>
            </div>
          </div>
        </div>
      </div>

      {/* INFORM Extension Notice */}
      <div className="inform-extension-banner">
        <div className="extension-icon">⚠️</div>
        <div className="extension-text">
          <strong>INFORM Methodology Extension</strong>
          <p>
            INFORM was not originally a climate model, but the 2017 methodology explicitly allows
            forward-looking risk analysis. This module extends INFORM scientifically by
            incorporating climate projections while respecting methodological limits.
          </p>
        </div>
      </div>

      {/* Scenario & Time Horizon Selection */}
      <div className="selection-panel">
        <div className="selection-section">
          <h3>🌐 Climate Scenario (IPCC AR6)</h3>
          <div className="scenario-cards">
            {Object.entries(CLIMATE_SCENARIOS).map(([key, scen]) => (
              <div
                key={key}
                className={`scenario-card ${selectedScenario === key ? 'active' : ''}`}
                onClick={() => setSelectedScenario(key)}
                style={{ borderColor: selectedScenario === key ? scen.color : '#E0E0E0' }}
              >
                <div className="scenario-icon">{scen.icon}</div>
                <div className="scenario-name">{scen.name}</div>
                <div className="scenario-description">{scen.description}</div>
                <div className="scenario-temp">
                  +{scen.tempIncrease2100}°C by 2100
                </div>
                {selectedScenario === key && <div className="selected-check">✓</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="selection-section">
          <h3>⏱️ Time Horizon</h3>
          <div className="horizon-buttons">
            {Object.entries(TIME_HORIZONS).map(([key, horizon]) => (
              <button
                key={key}
                className={`horizon-btn ${selectedTimeHorizon === key ? 'active' : ''}`}
                onClick={() => setSelectedTimeHorizon(key)}
                style={{
                  borderColor: selectedTimeHorizon === key ? horizon.color : '#E0E0E0',
                  background: selectedTimeHorizon === key ? `${horizon.color}20` : 'white'
                }}
              >
                <div className="horizon-label">{horizon.label}</div>
                <div className="horizon-period">{horizon.period}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="climate-tabs">
        <button
          className={`climate-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span>Overview</span>
        </button>
        <button
          className={`climate-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <span className="tab-icon">📈</span>
          <span>Historical Trends</span>
        </button>
        <button
          className={`climate-tab ${activeTab === 'projections' ? 'active' : ''}`}
          onClick={() => setActiveTab('projections')}
        >
          <span className="tab-icon">🔮</span>
          <span>Future Projections</span>
        </button>
        <button
          className={`climate-tab ${activeTab === 'adaptation' ? 'active' : ''}`}
          onClick={() => setActiveTab('adaptation')}
        >
          <span className="tab-icon">🛡️</span>
          <span>Adaptation Planning</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="climate-content">
        {activeTab === 'overview' && (
          <div className="overview-view">
            <h2>Climate Change & Risk Amplification</h2>
            <p className="overview-intro">
              Climate change amplifies disaster risk through three pathways:
            </p>

            <div className="amplification-pathways">
              <div className="pathway-card">
                <div className="pathway-icon">🌊</div>
                <h4>Hazard Intensification</h4>
                <p>Increased frequency and intensity of climate-related hazards</p>
                <ul>
                  <li>More extreme rainfall events</li>
                  <li>Prolonged drought periods</li>
                  <li>Heat waves & temperature extremes</li>
                  <li>Sea level rise (coastal areas)</li>
                </ul>
              </div>

              <div className="pathway-card">
                <div className="pathway-icon">👥</div>
                <h4>Exposure Growth</h4>
                <p>Population growth in climate-vulnerable areas</p>
                <ul>
                  <li>Urban expansion in flood zones</li>
                  <li>Agricultural intensification in drought-prone areas</li>
                  <li>Coastal settlement growth</li>
                </ul>
              </div>

              <div className="pathway-card">
                <div className="pathway-icon">📉</div>
                <h4>Vulnerability Amplification</h4>
                <p>Climate impacts on socio-economic conditions</p>
                <ul>
                  <li>Agricultural productivity decline</li>
                  <li>Water scarcity stress</li>
                  <li>Climate-induced poverty</li>
                  <li>Health system strain</li>
                </ul>
              </div>
            </div>

            {/* Climate Hazards Overview */}
            <div className="hazards-overview">
              <h3>Climate Hazards for Tanzania</h3>
              <div className="hazards-grid">
                {Object.entries(CLIMATE_HAZARDS).map(([key, hazard]) => (
                  <div key={key} className="hazard-overview-card">
                    <div className="hazard-header">
                      <span className="hazard-icon">{hazard.icon}</span>
                      <span className="hazard-name">{hazard.name}</span>
                    </div>
                    <div className="hazard-indicators">
                      <strong>Key Indicators:</strong>
                      <ul>
                        {hazard.indicators.map((ind, idx) => (
                          <li key={idx}>{ind}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="hazard-impacts">
                      <strong>Expected Impacts:</strong>
                      <ul>
                        {hazard.impacts.map((impact, idx) => (
                          <li key={idx}>{impact}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="trends-view">
            <h2>Historical Climate Trends (1980-2020)</h2>
            <p className="trends-intro">
              Observed changes in climate variables provide evidence of ongoing climate change
            </p>

            <div className="trend-notice">
              <span className="notice-icon">📊</span>
              <div className="notice-text">
                <strong>Data Source:</strong> Tanzania Meteorological Authority (TMA) historical records,
                supplemented by international climate datasets (CHIRPS, ERA5)
              </div>
            </div>

            <div className="trends-grid">
              <div className="trend-card">
                <h4>🌡️ Temperature Increase</h4>
                <div className="trend-value">+2.5°C</div>
                <div className="trend-label">Since 1980</div>
                <div className="trend-indicator increasing">
                  <span className="trend-arrow">↗️</span>
                  <span>Increasing Trend</span>
                </div>
                <p className="trend-description">
                  Annual mean temperature has risen from 22.5°C (1980) to 25.0°C (2020),
                  with accelerating warming after 2000.
                </p>
              </div>

              <div className="trend-card">
                <h4>🌧️ Precipitation Variability</h4>
                <div className="trend-value">-80mm</div>
                <div className="trend-label">Since 1980</div>
                <div className="trend-indicator decreasing">
                  <span className="trend-arrow">↘️</span>
                  <span>Decreasing Trend</span>
                </div>
                <p className="trend-description">
                  Annual rainfall has declined from 920mm to 840mm, with increased inter-annual
                  variability and more frequent dry spells.
                </p>
              </div>

              <div className="trend-card">
                <h4>⚠️ Extreme Events</h4>
                <div className="trend-value">+500%</div>
                <div className="trend-label">Since 1980</div>
                <div className="trend-indicator increasing">
                  <span className="trend-arrow">↗️</span>
                  <span>Rapidly Increasing</span>
                </div>
                <p className="trend-description">
                  Frequency of extreme climate events (floods, droughts) has increased from
                  3 events/year (1980) to 18 events/year (2020).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="projections-view">
            <h2>Climate Projections: {scenario.name}</h2>
            <p className="projections-intro">
              Future climate scenarios based on IPCC AR6 projections for Tanzania
            </p>

            <div className="projection-summary">
              <div className="summary-card">
                <div className="summary-label">Temperature Change by {timeHorizon.period.split('-')[1]}</div>
                <div className="summary-value" style={{ color: scenario.color }}>
                  +{scenario.tempIncrease2050}°C to +{scenario.tempIncrease2100}°C
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Precipitation Change</div>
                <div className="summary-value" style={{ color: '#2196F3' }}>
                  -10% to -25%
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Extreme Events</div>
                <div className="summary-value" style={{ color: '#FF9800' }}>
                  +100% to +300%
                </div>
              </div>
            </div>

            <div className="projection-implications">
              <h3>Implications for Risk Management</h3>
              <div className="implications-grid">
                <div className="implication-card">
                  <div className="implication-icon">🌊</div>
                  <h4>Flood Risk</h4>
                  <p>
                    More intense rainfall events will increase flash flooding and riverine flooding,
                    particularly in urban areas with inadequate drainage.
                  </p>
                </div>
                <div className="implication-card">
                  <div className="implication-icon">🏜️</div>
                  <h4>Drought Risk</h4>
                  <p>
                    Declining overall rainfall combined with increased temperature will intensify
                    drought severity and duration, impacting agriculture and water security.
                  </p>
                </div>
                <div className="implication-card">
                  <div className="implication-icon">🌾</div>
                  <h4>Agricultural Impact</h4>
                  <p>
                    Shifting rainfall patterns and temperature stress will reduce crop yields
                    and require adaptation in farming practices and crop selection.
                  </p>
                </div>
                <div className="implication-card">
                  <div className="implication-icon">💧</div>
                  <h4>Water Stress</h4>
                  <p>
                    Reduced precipitation and increased evaporation will strain water resources,
                    affecting domestic supply, agriculture, and hydropower generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'adaptation' && (
          <div className="adaptation-view">
            <h2>Adaptation & Resilience Planning</h2>
            <p className="adaptation-intro">
              Strategic adaptation measures to reduce climate risk and build long-term resilience
            </p>

            <div className="adaptation-strategies">
              {Object.entries(ADAPTATION_STRATEGIES).map(([key, strategy]) => (
                <div key={key} className="strategy-card">
                  <div className="strategy-header">
                    <span className="strategy-icon" style={{ fontSize: '40px' }}>{strategy.icon}</span>
                    <div className="strategy-title">
                      <h4>{strategy.name}</h4>
                      <div className="strategy-meta">
                        <span className="meta-item">⏱️ {strategy.timeframe}</span>
                        <span className="meta-item">💰 {strategy.cost}</span>
                        <span className="meta-item">✅ {strategy.effectiveness}</span>
                      </div>
                    </div>
                  </div>
                  <div className="strategy-actions">
                    <strong>Priority Actions:</strong>
                    <ul>
                      {strategy.actions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="adaptation-priorities">
              <h3>National Adaptation Priorities</h3>
              <div className="priorities-grid">
                <div className="priority-card urgent">
                  <div className="priority-label">Urgent (1-3 years)</div>
                  <ul>
                    <li>Strengthen early warning systems</li>
                    <li>Community-based climate information</li>
                    <li>Emergency drought/flood response capacity</li>
                  </ul>
                </div>
                <div className="priority-card medium">
                  <div className="priority-label">Medium-Term (3-10 years)</div>
                  <ul>
                    <li>Climate-resilient infrastructure investment</li>
                    <li>Agricultural transformation programs</li>
                    <li>Water security infrastructure</li>
                  </ul>
                </div>
                <div className="priority-card long">
                  <div className="priority-label">Long-Term (10+ years)</div>
                  <ul>
                    <li>Ecosystem-based adaptation at scale</li>
                    <li>Climate-resilient development pathways</li>
                    <li>Managed retreat from high-risk zones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration with Previous Modules */}
      <div className="integration-panel">
        <h3>🔗 Integration with INFORM System</h3>
        <div className="integration-flow">
          <div className="integration-step">
            <strong>Module 05 (Climate)</strong>
            <p>Provides long-term hazard projections</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="integration-step">
            <strong>Module 02 (Risk)</strong>
            <p>Updates risk estimates with climate scenarios</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="integration-step">
            <strong>Module 03 (Warning)</strong>
            <p>Adjusts warning thresholds for changing hazards</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="integration-step">
            <strong>Module 04 (Severity)</strong>
            <p>Validates projections with observed trends</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Module05Climate;
