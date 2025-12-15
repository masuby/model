/**
 * HAZARD AND EXPOSURE DIMENSION
 *
 * Shows all hazard types (Natural + Human) with their exposure levels
 * Based on Tanzania Country Model Template structure
 */

import React, { useState } from 'react';
import './DimensionStyles.css';

const HazardExposureDimension = ({ data }) => {
  const [expandedCategory, setExpandedCategory] = useState('natural');

  // Natural Hazards from Excel template
  const naturalHazards = [
    { id: 'coastalHazards', name: 'Coastal Hazards', value: data.natural.coastalHazards, unit: 'Index' },
    { id: 'drought', name: 'Drought', value: data.natural.drought, unit: 'Index' },
    { id: 'earthquake', name: 'Earthquake', value: data.natural.earthquake, unit: 'Index' },
    { id: 'environmentalDegradation', name: 'Environmental Degradation', value: data.natural.environmentalDegradation, unit: 'Index' },
    { id: 'flood', name: 'Flood', value: data.natural.flood, unit: 'Index' },
    { id: 'heatwave', name: 'Heatwave', value: data.natural.heatwave, unit: 'Index' },
    { id: 'landslide', name: 'Landslide', value: data.natural.landslide, unit: 'Index' },
    { id: 'lightning', name: 'Lightning', value: data.natural.lightning, unit: 'Index' },
    { id: 'stormsCyclone', name: 'Storms and Cyclone', value: data.natural.stormsCyclone, unit: 'Index' },
    { id: 'volcano', name: 'Volcano', value: data.natural.volcano, unit: 'Index' },
    { id: 'wildfire', name: 'Wildfire', value: data.natural.wildfire, unit: 'Index' },
    { id: 'zoonoses', name: 'Zoonoses, Plants & Pests', value: data.natural.zoonoses, unit: 'Index' }
  ];

  // Human Hazards from Excel template
  const humanHazards = [
    { id: 'conflictIntensity', name: 'Conflict Intensity', value: data.human.conflictIntensity, unit: 'Index' },
    { id: 'conflictRisk', name: 'Conflict Risk', value: data.human.conflictRisk, unit: 'Index' },
    { id: 'hazardousMaterial', name: 'Hazardous Material', value: data.human.hazardousMaterial, unit: 'Index' },
    { id: 'internalViolence', name: 'Internal Violence', value: data.human.internalViolence, unit: 'Index' },
    { id: 'vehicleAccidents', name: 'Vehicle Accidents', value: data.human.vehicleAccidents, unit: 'Index' }
  ];

  return (
    <div className="dimension-detail">
      <div className="dimension-intro">
        <h2>Hazard and Exposure</h2>
        <p className="dimension-explanation">
          Hazard and Exposure represents the likelihood of hazardous events occurring combined with
          the population exposed to those events. This dimension combines natural hazards (geological,
          hydro-meteorological) and human-induced hazards (conflict, accidents, technological).
        </p>

        <div className="dimension-score-banner he-banner">
          <div className="banner-left">
            <div className="score-display">
              <span className="score-label">H and E Score</span>
              <span className="score-value">{data.total.toFixed(2)}</span>
              <span className="score-scale">/ 10</span>
            </div>
          </div>
          <div className="banner-right">
            <div className="sub-scores">
              <div className="sub-score">
                <span className="sub-label">Natural Hazards</span>
                <span className="sub-value">{data.natural.aggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Human Hazards</span>
                <span className="sub-value">{data.human.aggregate?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Categories */}
      <div className="hazard-categories">
        {/* Natural Hazards */}
        <div className="hazard-category">
          <div
            className={`category-header ${expandedCategory === 'natural' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'natural' ? null : 'natural')}
          >
            <div className="category-title">
              <span className="category-icon">🌍</span>
              <h3>Natural Hazards</h3>
              <span className="category-count">({naturalHazards.filter(h => h.value !== null).length} indicators)</span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{data.natural.aggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'natural' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'natural' && (
            <div className="category-indicators">
              {naturalHazards.map(hazard => (
                <IndicatorCard key={hazard.id} indicator={hazard} />
              ))}
            </div>
          )}
        </div>

        {/* Human Hazards */}
        <div className="hazard-category">
          <div
            className={`category-header ${expandedCategory === 'human' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'human' ? null : 'human')}
          >
            <div className="category-title">
              <span className="category-icon">👥</span>
              <h3>Human Hazards</h3>
              <span className="category-count">({humanHazards.filter(h => h.value !== null).length} indicators)</span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{data.human.aggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'human' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'human' && (
            <div className="category-indicators">
              {humanHazards.map(hazard => (
                <IndicatorCard key={hazard.id} indicator={hazard} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Methodology Note */}
      <div className="methodology-note">
        <h4>📊 Aggregation Method</h4>
        <p>
          Hazard and Exposure is calculated using geometric mean of all active hazard indicators.
          This ensures that high exposure to any single hazard type significantly affects the overall score,
          preventing compensation between hazards.
        </p>
        <div className="formula-note">
          H and E = (H₁ × H₂ × ... × Hₙ)^(1/n)
        </div>
      </div>
    </div>
  );
};

/**
 * Indicator Card Component
 */
const IndicatorCard = ({ indicator }) => {
  const hasData = indicator.value !== null && indicator.value !== undefined;
  const classification = hasData ? getRiskClassification(indicator.value) : null;

  return (
    <div className={`indicator-card ${!hasData ? 'no-data' : ''}`}>
      <div className="indicator-header">
        <div className="indicator-name">{indicator.name}</div>
        {hasData ? (
          <div className="indicator-score" style={{ color: classification.color }}>
            {indicator.value.toFixed(2)}
          </div>
        ) : (
          <div className="indicator-no-data">No Data</div>
        )}
      </div>

      {hasData && (
        <>
          <div className="indicator-bar">
            <div
              className="indicator-bar-fill"
              style={{
                width: `${(indicator.value / 10) * 100}%`,
                backgroundColor: classification.color
              }}
            />
          </div>

          <div className="indicator-classification">
            <span className="classification-level">{classification.level}</span>
            <span className="classification-range">{classification.range}</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Helper: Get risk classification
 */
function getRiskClassification(score) {
  if (score >= 0 && score < 2) return { level: 'Very Low', color: '#43A047', range: '0.0 - 1.9' };
  if (score >= 2 && score < 3.5) return { level: 'Low', color: '#8BC34A', range: '2.0 - 3.4' };
  if (score >= 3.5 && score < 5) return { level: 'Medium', color: '#FFC107', range: '3.5 - 4.9' };
  if (score >= 5 && score < 6.5) return { level: 'High', color: '#FF9800', range: '5.0 - 6.4' };
  return { level: 'Very High', color: '#F44336', range: '6.5 - 10.0' };
}

export default HazardExposureDimension;
