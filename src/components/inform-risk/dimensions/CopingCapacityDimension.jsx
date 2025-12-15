/**
 * LACK OF COPING CAPACITY DIMENSION
 *
 * Shows coping capacity indicators across two sub-dimensions:
 * 1. Infrastructure
 * 2. Institutional
 *
 * Formula: LCC = (Infrastructure × Institutional)^(1/2)
 *
 * IMPORTANT: These are "Lack of" indicators
 * Higher score = LESS capacity = HIGHER risk
 *
 * Based on Tanzania Country Model Template structure
 */

import React, { useState } from 'react';
import './DimensionStyles.css';

const CopingCapacityDimension = ({ data }) => {
  const [expandedCategory, setExpandedCategory] = useState('infrastructure');

  // Infrastructure indicators from Excel template
  const infrastructureIndicators = [
    {
      id: 'accessHealth',
      name: 'Access to Health Care',
      value: data.infrastructure.accessHealth,
      description: 'Hospital beds, physicians, health facility coverage',
      unit: 'Index',
      interpretation: 'Lower access = higher lack of coping capacity'
    },
    {
      id: 'economicCapacity',
      name: 'Economic Capacity',
      value: data.infrastructure.economicCapacity,
      description: 'GDP per capita, economic resources for response',
      unit: 'Index',
      interpretation: 'Lower economic capacity = higher lack'
    },
    {
      id: 'wash',
      name: 'WASH (Water, Sanitation, Hygiene)',
      value: data.infrastructure.wash,
      description: 'Access to clean water, sanitation facilities',
      unit: 'Index',
      interpretation: 'Lower WASH access = higher lack'
    },
    {
      id: 'communication',
      name: 'Communication',
      value: data.infrastructure.communication,
      description: 'Phone, internet, communication infrastructure',
      unit: 'Index',
      interpretation: 'Lower communication = higher lack'
    },
    {
      id: 'education',
      name: 'Education',
      value: data.infrastructure.education,
      description: 'Literacy rates, school enrollment, education access',
      unit: 'Index',
      interpretation: 'Lower education = higher lack'
    }
  ];

  // Institutional indicators from Excel template
  const institutionalIndicators = [
    {
      id: 'drrImplementation',
      name: 'DRR Implementation',
      value: data.institutional.drrImplementation,
      description: 'Disaster Risk Reduction policies, early warning systems, preparedness',
      unit: 'Index',
      interpretation: 'Weaker DRR = higher lack of coping'
    },
    {
      id: 'governance',
      name: 'Governance',
      value: data.institutional.governance,
      description: 'Rule of law, government effectiveness, corruption control',
      unit: 'Index',
      interpretation: 'Weaker governance = higher lack'
    }
  ];

  return (
    <div className="dimension-detail">
      <div className="dimension-intro">
        <h2>Lack of Coping Capacity</h2>
        <p className="dimension-explanation">
          Lack of Coping Capacity reflects the <strong>absence</strong> of resources and capacities to manage
          and recover from shocks. It combines infrastructure (health, economic, WASH, communication, education)
          with institutional capacity (DRR implementation, governance).
        </p>

        <div className="important-notice lcc-notice">
          <div className="notice-icon">⚠️</div>
          <div className="notice-text">
            <strong>Important:</strong> This dimension measures <strong>LACK OF</strong> capacity.
            Higher scores indicate <strong>LESS</strong> capacity, which means <strong>HIGHER</strong> risk.
          </div>
        </div>

        <div className="dimension-score-banner lcc-banner">
          <div className="banner-left">
            <div className="score-display">
              <span className="score-label">LCC Score</span>
              <span className="score-value">{data.total.toFixed(2)}</span>
              <span className="score-scale">/ 10</span>
            </div>
            <div className="score-interpretation">
              Higher = Less Capacity = Higher Risk
            </div>
          </div>
          <div className="banner-right">
            <div className="sub-scores">
              <div className="sub-score">
                <span className="sub-label">Infrastructure</span>
                <span className="sub-value">{data.infrastructure.aggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Institutional</span>
                <span className="sub-value">{data.institutional.aggregate?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Framework: Prepare, Respond, Recover */}
      <div className="capacity-framework">
        <h3>Disaster Management Framework</h3>
        <div className="framework-phases">
          <div className="phase-box">
            <div className="phase-icon">🛡️</div>
            <div className="phase-name">PREPARE</div>
            <div className="phase-description">
              Before disaster: Early warning, planning, training, infrastructure
            </div>
            <div className="phase-indicators">
              DRR, Communication, Education
            </div>
          </div>
          <div className="phase-arrow">→</div>
          <div className="phase-box">
            <div className="phase-icon">🚨</div>
            <div className="phase-name">RESPOND</div>
            <div className="phase-description">
              During disaster: Emergency services, health care, coordination
            </div>
            <div className="phase-indicators">
              Health, Governance, Economic
            </div>
          </div>
          <div className="phase-arrow">→</div>
          <div className="phase-box">
            <div className="phase-icon">🔨</div>
            <div className="phase-name">RECOVER</div>
            <div className="phase-description">
              After disaster: Reconstruction, rehabilitation, livelihood restoration
            </div>
            <div className="phase-indicators">
              Economic, Infrastructure, WASH
            </div>
          </div>
        </div>
      </div>

      {/* Coping Capacity Categories */}
      <div className="coping-categories">
        {/* Infrastructure */}
        <div className="coping-category">
          <div
            className={`category-header ${expandedCategory === 'infrastructure' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'infrastructure' ? null : 'infrastructure')}
          >
            <div className="category-title">
              <span className="category-icon">🏗️</span>
              <h3>Infrastructure</h3>
              <span className="category-count">
                ({infrastructureIndicators.filter(i => i.value !== null).length} indicators)
              </span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{data.infrastructure.aggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'infrastructure' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'infrastructure' && (
            <div className="category-indicators">
              {infrastructureIndicators.map(indicator => (
                <LCCIndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          )}
        </div>

        {/* Institutional */}
        <div className="coping-category">
          <div
            className={`category-header ${expandedCategory === 'institutional' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'institutional' ? null : 'institutional')}
          >
            <div className="category-title">
              <span className="category-icon">🏛️</span>
              <h3>Institutional</h3>
              <span className="category-count">
                ({institutionalIndicators.filter(i => i.value !== null).length} indicators)
              </span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{data.institutional.aggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'institutional' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'institutional' && (
            <div className="category-indicators">
              {institutionalIndicators.map(indicator => (
                <LCCIndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Methodology Note */}
      <div className="methodology-note">
        <h4>📊 Aggregation Method</h4>
        <p>
          Lack of Coping Capacity uses geometric mean aggregation in two steps:
        </p>
        <ol>
          <li><strong>Step 1:</strong> Aggregate indicators within Infrastructure and Institutional sub-dimensions</li>
          <li><strong>Step 2:</strong> Combine the two sub-dimensions using geometric mean</li>
        </ol>
        <div className="formula-note">
          LCC = (Infrastructure × Institutional)^(1/2)
        </div>
        <p className="formula-explanation">
          <strong>Capacity Inversion:</strong> In the original data, higher capacity = better.
          INFORM inverts this: <code>LCC = 10 - Capacity</code>, so higher LCC scores mean LESS capacity,
          which correctly increases risk.
        </p>
      </div>

      {/* High vs Low Capacity Comparison */}
      <div className="capacity-comparison">
        <h3>Capacity Impact on Disaster Outcomes</h3>
        <div className="comparison-grid">
          <div className="comparison-card high-capacity">
            <div className="comparison-header">
              <span className="comparison-icon">✅</span>
              <h4>High Capacity (Low LCC Score)</h4>
            </div>
            <ul className="comparison-features">
              <li>Strong early warning systems detect threats</li>
              <li>Well-trained emergency responders mobilize quickly</li>
              <li>Robust health infrastructure treats injured</li>
              <li>Economic resources enable rapid recovery</li>
              <li>Good governance coordinates response effectively</li>
            </ul>
            <div className="comparison-result success">
              Result: Hazard managed, minimal disaster impact
            </div>
          </div>

          <div className="comparison-card low-capacity">
            <div className="comparison-header">
              <span className="comparison-icon">⚠️</span>
              <h4>Low Capacity (High LCC Score)</h4>
            </div>
            <ul className="comparison-features">
              <li>No early warning, communities surprised</li>
              <li>Limited emergency services, slow response</li>
              <li>Overwhelmed health system cannot cope</li>
              <li>Lack of resources delays recovery</li>
              <li>Weak governance hinders coordination</li>
            </ul>
            <div className="comparison-result danger">
              Result: Hazard becomes disaster, severe impact
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management Message */}
      <div className="critical-teaching-box">
        <div className="teaching-header">
          <span className="teaching-icon">💡</span>
          <h4>Coping Capacity is Manageable</h4>
        </div>
        <p>
          Unlike hazards (which are often beyond our control), <strong>coping capacity can be strengthened</strong>:
        </p>
        <ul className="management-pathways">
          <li><strong>Invest in infrastructure:</strong> Build hospitals, roads, communication networks, water systems</li>
          <li><strong>Strengthen institutions:</strong> Improve governance, implement DRR policies, train responders</li>
          <li><strong>Build resilience:</strong> Educate communities, create early warning systems, prepare contingency plans</li>
          <li><strong>Allocate resources:</strong> Dedicate budgets to disaster preparedness and response</li>
        </ul>
        <p className="teaching-emphasis">
          <strong>Strengthening coping capacity reduces risk</strong> - even if hazards and vulnerability remain unchanged.
        </p>
      </div>
    </div>
  );
};

/**
 * LCC Indicator Card (with capacity inversion explanation)
 */
const LCCIndicatorCard = ({ indicator }) => {
  const hasData = indicator.value !== null && indicator.value !== undefined;
  const classification = hasData ? getRiskClassification(indicator.value) : null;

  return (
    <div className={`indicator-card detailed lcc-card ${!hasData ? 'no-data' : ''}`}>
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

      {indicator.description && (
        <div className="indicator-description">{indicator.description}</div>
      )}

      {indicator.interpretation && (
        <div className="indicator-interpretation">
          <span className="interpretation-icon">ℹ️</span>
          {indicator.interpretation}
        </div>
      )}

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
            <span className="classification-level">{classification.level} Lack</span>
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

export default CopingCapacityDimension;
