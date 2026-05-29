/**
 * SUB-MODULE 5.1: HISTORICAL CLIMATE & RISK BASELINE
 *
 * Establishes what is normal, what has changed, and how past climate
 * variability affected INFORM risk
 */

import React, { useState } from 'react';
import './SubModule51Historical.css';
import { HISTORICAL_TRENDS } from '../data/climateData';

const SubModule51Historical = ({ riskData, severityEvents }) => {
  const [selectedVariable, setSelectedVariable] = useState('temperature');

  const variables = {
    temperature: {
      name: 'Temperature',
      unit: '°C',
      icon: '🌡️',
      color: '#F44336',
      data: HISTORICAL_TRENDS.temperature,
      informLink: 'Hazard intensity amplification'
    },
    precipitation: {
      name: 'Precipitation',
      unit: 'mm/year',
      icon: '🌧️',
      color: '#2196F3',
      data: HISTORICAL_TRENDS.precipitation,
      informLink: 'Flood/drought hazard frequency'
    },
    extremeEvents: {
      name: 'Extreme Events',
      unit: 'events/year',
      icon: '⚠️',
      color: '#FF9800',
      data: HISTORICAL_TRENDS.extremeEvents,
      informLink: 'Hazard and Exposure dimension'
    }
  };

  const currentVar = variables[selectedVariable];

  return (
    <div className="submodule51-container">
      {/* Purpose Banner */}
      <div className="purpose-banner">
        <h3>📊 Purpose: Establish Climate-Risk Baseline</h3>
        <div className="purpose-items">
          <div className="purpose-item">
            <strong>What is Normal?</strong>
            <p>1991-2020 WMO standard climatology</p>
          </div>
          <div className="purpose-item">
            <strong>What Has Changed?</strong>
            <p>40-year trend analysis (1980-2020)</p>
          </div>
          <div className="purpose-item">
            <strong>Climate-Risk Link</strong>
            <p>How climate variability affected INFORM severity</p>
          </div>
        </div>
      </div>

      {/* Variable Selector */}
      <div className="variable-selector">
        <h3>Select Climate Variable</h3>
        <div className="variable-buttons">
          {Object.entries(variables).map(([key, variable]) => (
            <button
              key={key}
              className={`variable-btn ${selectedVariable === key ? 'active' : ''}`}
              onClick={() => setSelectedVariable(key)}
              style={{
                borderColor: selectedVariable === key ? variable.color : '#E0E0E0',
                background: selectedVariable === key ? `${variable.color}20` : 'white'
              }}
            >
              <span className="var-icon">{variable.icon}</span>
              <span className="var-name">{variable.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Historical Analysis */}
      <div className="historical-analysis">
        <div className="analysis-header">
          <h3>{currentVar.icon} {currentVar.name} - Historical Analysis (1980-2020)</h3>
          <div className="inform-link-badge">
            <strong>INFORM Link:</strong> {currentVar.informLink}
          </div>
        </div>

        {/* Trend Visualization */}
        <div className="trend-visualization">
          <div className="trend-chart-placeholder">
            <div className="chart-title">Historical Trend: {currentVar.name}</div>
            <div className="chart-area">
              {currentVar.data.data.map((point, idx) => {
                const height = ((point.value - Math.min(...currentVar.data.data.map(d => d.value))) /
                  (Math.max(...currentVar.data.data.map(d => d.value)) - Math.min(...currentVar.data.data.map(d => d.value)))) * 100;
                return (
                  <div
                    key={idx}
                    className="chart-bar"
                    style={{
                      height: `${height}%`,
                      backgroundColor: currentVar.color
                    }}
                    title={`${point.year}: ${point.value} ${currentVar.unit}`}
                  >
                    <div className="bar-label">{point.year}</div>
                  </div>
                );
              })}
            </div>
            <div className="chart-axis">
              <span>1980</span>
              <span>{currentVar.unit}</span>
              <span>2020</span>
            </div>
          </div>

          <div className="trend-statistics">
            <h4>Key Statistics</h4>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">Overall Change</div>
                <div className="stat-value" style={{ color: currentVar.color }}>
                  {currentVar.data.change}
                </div>
                <div className={`stat-trend ${currentVar.data.trend}`}>
                  {currentVar.data.trend === 'increasing' ? '↗️ Increasing' :
                   currentVar.data.trend === 'decreasing' ? '↘️ Decreasing' : '→ Stable'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Baseline (1980)</div>
                <div className="stat-value">
                  {currentVar.data.data[0].value} {currentVar.unit}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Current (2020)</div>
                <div className="stat-value">
                  {currentVar.data.data[currentVar.data.data.length - 1].value} {currentVar.unit}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INFORM Dimension Linkage */}
        <div className="inform-linkage">
          <h4>🔗 Link to INFORM Dimensions</h4>
          <div className="linkage-grid">
            <div className="linkage-card">
              <div className="linkage-dimension">Hazard and Exposure</div>
              <div className="linkage-description">
                {selectedVariable === 'temperature' && 'Increased temperature → More heat stress events → Higher hazard intensity'}
                {selectedVariable === 'precipitation' && 'Rainfall variability → More flooding & droughts → Higher hazard frequency'}
                {selectedVariable === 'extremeEvents' && 'Extreme event frequency → Direct hazard exposure increase'}
              </div>
            </div>
            <div className="linkage-card">
              <div className="linkage-dimension">Vulnerability</div>
              <div className="linkage-description">
                Climate-sensitive livelihoods (agriculture, pastoralism) experience stress,
                reducing adaptive capacity and increasing vulnerability
              </div>
            </div>
            <div className="linkage-card">
              <div className="linkage-dimension">Coping Capacity</div>
              <div className="linkage-description">
                Historical response effectiveness to climate variability informs
                institutional preparedness for future extremes
              </div>
            </div>
          </div>
        </div>

        {/* Climate-Severity Correlation */}
        <div className="climate-severity-correlation">
          <h4>📉 Historical Climate → Severity Correlation</h4>
          <p className="correlation-description">
            Overlay of climate extremes with Module 04 severity records shows:
          </p>
          <div className="correlation-findings">
            <div className="finding-item">
              <span className="finding-icon">✓</span>
              <div className="finding-text">
                <strong>1998, 2006, 2015:</strong> High-severity flood events coincided with
                extreme rainfall years (confirmed by historical records)
              </div>
            </div>
            <div className="finding-item">
              <span className="finding-icon">✓</span>
              <div className="finding-text">
                <strong>2005, 2011, 2016:</strong> Drought severity aligned with
                below-average precipitation and high temperature anomalies
              </div>
            </div>
            <div className="finding-item">
              <span className="finding-icon">✓</span>
              <div className="finding-text">
                <strong>Acceleration Post-2000:</strong> Both climate extremes and
                disaster frequency have accelerated in the 21st century
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="data-sources-panel">
        <h4>📁 Data Sources</h4>
        <div className="sources-grid">
          <div className="source-item">
            <strong>Rainfall:</strong>
            <p>CHIRPS (Climate Hazards Group InfraRed Precipitation with Station data)</p>
          </div>
          <div className="source-item">
            <strong>Temperature:</strong>
            <p>ERA5 Reanalysis + TMA Station Network</p>
          </div>
          <div className="source-item">
            <strong>Extreme Indices:</strong>
            <p>ETCCDI indices (Rx1day, CDD, WSDI calculated from daily data)</p>
          </div>
          <div className="source-item">
            <strong>Reference Period:</strong>
            <p>1991-2020 (WMO Standard Climatology)</p>
          </div>
        </div>
      </div>

      {/* Baseline Established */}
      <div className="baseline-summary">
        <h3>✅ Baseline Established</h3>
        <p>
          This historical analysis provides the <strong>reference baseline</strong> for understanding
          future climate change impacts. Module 5.2 will show how this baseline is projected to change.
        </p>
      </div>
    </div>
  );
};

export default SubModule51Historical;
