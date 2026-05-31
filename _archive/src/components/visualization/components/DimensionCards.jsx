/**
 * INFORM Dimension Cards
 * Displays the three core dimensions (Hazard, Vulnerability, Coping Capacity) + Risk
 * Following international INFORM visualization standards
 */
import React, { useState, useMemo } from 'react';
import {
  getDimensionSummary,
  getRiskClass,
  INFORM_COLORS,
  RISK_THRESHOLDS
} from '../../../config/informFramework';
import './DimensionCards.css';

// Circular gauge component for dimension values
const CircularGauge = ({ value, maxValue = 10, color, size = 80 }) => {
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 35; // radius = 35
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="circular-gauge">
      {/* Background circle */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="none"
        stroke="#e0e0e0"
        strokeWidth="6"
      />
      {/* Progress arc */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Value text */}
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="16"
        fontWeight="bold"
        fill={color}
      >
        {value?.toFixed(1) || 'N/A'}
      </text>
    </svg>
  );
};

// Mini bar chart for sub-categories
const MiniBarChart = ({ items, maxValue = 10 }) => (
  <div className="mini-bar-chart">
    {items.map((item, index) => {
      const percentage = ((item.value || 0) / maxValue) * 100;
      const riskClass = getRiskClass(item.value);
      return (
        <div key={index} className="bar-item">
          <div className="bar-label">{item.label}</div>
          <div className="bar-container">
            <div
              className="bar-fill"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: riskClass?.color || '#ccc'
              }}
            />
            <span className="bar-value">{item.value?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
      );
    })}
  </div>
);

// Single dimension card
const DimensionCard = ({ title, icon, value, color, subCategories, description, isRisk = false }) => {
  const [expanded, setExpanded] = useState(false);
  const riskClass = getRiskClass(value);

  return (
    <div className={`dimension-card ${isRisk ? 'risk-card' : ''}`} style={{ '--accent-color': color }}>
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        <div className="card-title">
          <h3>{title}</h3>
          {riskClass && (
            <span
              className="risk-level-badge"
              style={{ backgroundColor: riskClass.color }}
            >
              {riskClass.label}
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="gauge-section">
          <CircularGauge value={value} color={color} size={isRisk ? 100 : 80} />
        </div>

        {subCategories && subCategories.length > 0 && (
          <div className="subcategories">
            <MiniBarChart items={subCategories} />
          </div>
        )}
      </div>

      {description && (
        <div className="card-footer">
          <button
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          {expanded && (
            <p className="description">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

function DimensionCards({ data, selectedArea, onDimensionClick }) {
  // Get dimension summary for selected area or first row
  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;

    const row = selectedArea
      ? data.find(r => r.ADM2_NAME === selectedArea || r.ADM1_NAME === selectedArea)
      : data[0];

    return getDimensionSummary(row);
  }, [data, selectedArea]);

  if (!summary) {
    return (
      <div className="dimension-cards-container">
        <div className="no-data">
          <p>No data available. Please load INFORM data.</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'risk',
      title: 'INFORM Risk',
      icon: '⚠️',
      value: summary.risk.value,
      color: summary.risk.class?.color || INFORM_COLORS.dimensions.risk,
      isRisk: true,
      description: 'Composite index combining Hazard, Vulnerability, and Lack of Coping Capacity using geometric mean aggregation.',
      subCategories: [
        { label: 'Hazard', value: summary.hazard.value },
        { label: 'Vulnerability', value: summary.vulnerability.value },
        { label: 'Coping Capacity', value: summary.copingCapacity.value }
      ]
    },
    {
      id: 'hazard',
      title: 'Hazard and Exposure',
      icon: '🌋',
      value: summary.hazard.value,
      color: INFORM_COLORS.dimensions.hazard,
      description: 'Likelihood and impact of physical hazards. Combines natural hazards (earthquakes, floods, droughts) and human hazards (conflict, accidents).',
      subCategories: [
        { label: 'Natural', value: summary.hazard.natural },
        { label: 'Human', value: summary.hazard.human }
      ]
    },
    {
      id: 'vulnerability',
      title: 'Vulnerability',
      icon: '👥',
      value: summary.vulnerability.value,
      color: INFORM_COLORS.dimensions.vulnerability,
      description: 'Conditions that increase susceptibility to crisis impact. Includes socio-economic factors and vulnerable population groups.',
      subCategories: [
        { label: 'Socio-Economic', value: summary.vulnerability.socioEconomic },
        { label: 'Vulnerable Groups', value: summary.vulnerability.vulnerableGroups }
      ]
    },
    {
      id: 'copingCapacity',
      title: 'Lack of Coping Capacity',
      icon: '🏛️',
      value: summary.copingCapacity.value,
      color: INFORM_COLORS.dimensions.copingCapacity,
      description: 'Insufficient ability to cope with and recover from crises. Measures infrastructure and institutional capacity gaps.',
      subCategories: [
        { label: 'Infrastructure', value: summary.copingCapacity.infrastructure },
        { label: 'Institutional', value: summary.copingCapacity.institutional }
      ]
    }
  ];

  return (
    <div className="dimension-cards-container">
      <div className="cards-header">
        <h2>INFORM Dimensions</h2>
        {selectedArea && (
          <span className="selected-area">{selectedArea}</span>
        )}
      </div>

      <div className="risk-equation">
        <span className="equation-text">
          <strong>RISK</strong> =
          <span style={{ color: INFORM_COLORS.dimensions.hazard }}> Hazard</span>
          <sup>1/3</sup> ×
          <span style={{ color: INFORM_COLORS.dimensions.vulnerability }}> Vulnerability</span>
          <sup>1/3</sup> ×
          <span style={{ color: INFORM_COLORS.dimensions.copingCapacity }}> Lack of Coping Capacity</span>
          <sup>1/3</sup>
        </span>
      </div>

      <div className="cards-grid">
        {cards.map(card => (
          <DimensionCard
            key={card.id}
            {...card}
            onClick={() => onDimensionClick && onDimensionClick(card.id)}
          />
        ))}
      </div>

      <div className="risk-scale">
        <h4>Risk Classification Scale</h4>
        <div className="scale-bar">
          {Object.values(RISK_THRESHOLDS).map((threshold, index) => (
            <div
              key={threshold.label}
              className="scale-segment"
              style={{ backgroundColor: threshold.color }}
            >
              <span className="scale-label">{threshold.label}</span>
              <span className="scale-range">{threshold.min} - {threshold.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DimensionCards;
