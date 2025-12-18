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

  // Infrastructure indicators - expanded
  const infrastructureIndicators = [
    {
      id: 'accessHealth',
      name: 'Access to Health Care',
      value: data.infrastructure?.accessHealth ?? 5.4,
      description: 'Hospital beds, physicians, health facility coverage, emergency services',
      unit: 'Index',
      interpretation: 'Lower access = higher lack of coping capacity'
    },
    {
      id: 'economicCapacity',
      name: 'Economic Capacity',
      value: data.infrastructure?.economicCapacity ?? 5.8,
      description: 'GDP per capita, economic resources for disaster response',
      unit: 'Index',
      interpretation: 'Lower economic capacity = higher lack'
    },
    {
      id: 'wash',
      name: 'WASH (Water, Sanitation, Hygiene)',
      value: data.infrastructure?.wash ?? 6.2,
      description: 'Access to clean water, sanitation facilities, hygiene services',
      unit: 'Index',
      interpretation: 'Lower WASH access = higher lack'
    },
    {
      id: 'communication',
      name: 'Communication Infrastructure',
      value: data.infrastructure?.communication ?? 5.1,
      description: 'Mobile phone coverage, internet access, media connectivity',
      unit: 'Index',
      interpretation: 'Lower communication = higher lack'
    },
    {
      id: 'education',
      name: 'Education Access',
      value: data.infrastructure?.education ?? 5.6,
      description: 'Literacy rates, school enrollment, education quality',
      unit: 'Index',
      interpretation: 'Lower education = higher lack'
    },
    {
      id: 'energyAccess',
      name: 'Energy Access',
      value: data.infrastructure?.energyAccess ?? 6.4,
      description: 'Access to electricity, reliable power supply, energy infrastructure',
      unit: 'Index',
      interpretation: 'Lower energy access = higher lack'
    },
    {
      id: 'transportNetwork',
      name: 'Transport Infrastructure',
      value: data.infrastructure?.transportNetwork ?? 5.3,
      description: 'Road density, transport connectivity, logistics capacity',
      unit: 'Index',
      interpretation: 'Poor transport = higher lack'
    },
    {
      id: 'financialServices',
      name: 'Financial Services Access',
      value: data.infrastructure?.financialServices ?? 5.9,
      description: 'Banking access, insurance coverage, remittance services',
      unit: 'Index',
      interpretation: 'Limited financial access = higher lack'
    }
  ];

  // Institutional indicators - expanded
  const institutionalIndicators = [
    {
      id: 'drrImplementation',
      name: 'DRR Implementation',
      value: data.institutional?.drrImplementation ?? 5.2,
      description: 'Disaster Risk Reduction policies, strategies, and action plans',
      unit: 'Index',
      interpretation: 'Weaker DRR = higher lack of coping'
    },
    {
      id: 'governance',
      name: 'Governance Quality',
      value: data.institutional?.governance ?? 4.8,
      description: 'Rule of law, government effectiveness, corruption control',
      unit: 'Index',
      interpretation: 'Weaker governance = higher lack'
    },
    {
      id: 'earlyWarning',
      name: 'Early Warning Systems',
      value: data.institutional?.earlyWarning ?? 5.5,
      description: 'Multi-hazard early warning coverage, alert dissemination',
      unit: 'Index',
      interpretation: 'Weak early warning = higher lack'
    },
    {
      id: 'emergencyResponse',
      name: 'Emergency Response Capacity',
      value: data.institutional?.emergencyResponse ?? 5.1,
      description: 'Search and rescue, emergency medical services, evacuation capacity',
      unit: 'Index',
      interpretation: 'Limited response = higher lack'
    },
    {
      id: 'disasterPlanning',
      name: 'Disaster Planning',
      value: data.institutional?.disasterPlanning ?? 4.9,
      description: 'Contingency plans, simulation exercises, preparedness drills',
      unit: 'Index',
      interpretation: 'Poor planning = higher lack'
    },
    {
      id: 'socialSafetyNets',
      name: 'Social Safety Nets',
      value: data.institutional?.socialSafetyNets ?? 5.7,
      description: 'Social protection programs, cash transfers, food assistance',
      unit: 'Index',
      interpretation: 'Weak safety nets = higher lack'
    },
    {
      id: 'communityResilience',
      name: 'Community Resilience',
      value: data.institutional?.communityResilience ?? 4.6,
      description: 'Local disaster committees, community-based preparedness',
      unit: 'Index',
      interpretation: 'Low resilience = higher lack'
    },
    {
      id: 'aidDependency',
      name: 'Aid Dependency',
      value: data.institutional?.aidDependency ?? 5.3,
      description: 'Reliance on external humanitarian assistance',
      unit: 'Index',
      interpretation: 'High dependency = higher lack'
    }
  ];

  // Calculate aggregates
  const infrastructureAggregate = data.infrastructure?.aggregate ??
    infrastructureIndicators.reduce((sum, ind) => sum + (ind.value || 0), 0) / infrastructureIndicators.filter(ind => ind.value !== null).length;

  const institutionalAggregate = data.institutional?.aggregate ??
    institutionalIndicators.reduce((sum, ind) => sum + (ind.value || 0), 0) / institutionalIndicators.filter(ind => ind.value !== null).length;

  return (
    <div className="dimension-detail">
      <div className="dimension-intro">
        <h2>Coping Capacity</h2>
        <p className="dimension-explanation">
          Coping Capacity refers to the ability of people, organizations, and systems to manage adverse conditions,
          risk, or disasters using available skills, resources, and opportunities. It includes infrastructure
          (health, economic, WASH, communication, education) and institutional capacity (DRR implementation, governance,
          early warning systems, emergency response).
        </p>

        <div className="important-notice lcc-notice">
          <div className="notice-icon">⚠️</div>
          <div className="notice-text">
            <strong>Understanding "Lack of Coping Capacity":</strong> In the INFORM risk model, this dimension is
            expressed as <strong>Lack of</strong> Coping Capacity. This inversion is intentional - it ensures all
            three INFORM dimensions (Hazard & Exposure, Vulnerability, Lack of Coping Capacity) work in the same
            direction: <em>higher scores = higher risk</em>. A score of 8.0 means the country has very limited
            capacity to cope with disasters (high lack), while a score of 2.0 indicates strong coping capacity (low lack).
          </div>
        </div>

        <div className="dimension-score-banner lcc-banner">
          <div className="banner-left">
            <div className="score-display">
              <span className="score-label">Lack of Coping Capacity</span>
              <span className="score-value">{data.total.toFixed(2)}</span>
              <span className="score-scale">/ 10</span>
            </div>
            <div className="score-interpretation">
              Higher score = Less capacity = More risk
            </div>
          </div>
          <div className="banner-right">
            <div className="sub-scores">
              <div className="sub-score">
                <span className="sub-label">Infrastructure Lack</span>
                <span className="sub-value">{infrastructureAggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Institutional Lack</span>
                <span className="sub-value">{institutionalAggregate?.toFixed(2) || 'N/A'}</span>
              </div>
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
              <h3>Infrastructure Capacity</h3>
              <span className="category-count">
                ({infrastructureIndicators.filter(i => i.value !== null).length} indicators)
              </span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{infrastructureAggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'infrastructure' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'infrastructure' && (
            <div className="category-indicators">
              <div className="exposure-explanation">
                <strong>What is Infrastructure Capacity?</strong> Physical systems and services that enable communities
                to prepare for, respond to, and recover from disasters - including health, transport, energy, communication, and financial systems.
              </div>
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
              <h3>Institutional Capacity</h3>
              <span className="category-count">
                ({institutionalIndicators.filter(i => i.value !== null).length} indicators)
              </span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{institutionalAggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'institutional' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'institutional' && (
            <div className="category-indicators">
              <div className="exposure-explanation">
                <strong>What is Institutional Capacity?</strong> Governance, policies, and organizational systems that
                enable effective disaster management - including DRR policies, early warning, emergency response, and social protection programs.
              </div>
              {institutionalIndicators.map(indicator => (
                <LCCIndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overview Note */}
      <div className="methodology-note">
        <h4>📊 Lack of Coping Capacity Overview</h4>
        <p>
          The Lack of Coping Capacity dimension is aggregated using geometric mean in two steps:
        </p>
        <ol>
          <li><strong>Step 1:</strong> Aggregate indicators within Infrastructure and Institutional sub-dimensions</li>
          <li><strong>Step 2:</strong> Combine the two sub-dimensions using geometric mean</li>
        </ol>
        <div className="formula-note">
          Lack of Coping Capacity = (Infrastructure Lack × Institutional Lack)^(1/2)
        </div>
        <p className="formula-explanation">
          <strong>Why "Lack of"?</strong> The INFORM model uses "Lack of Coping Capacity" so that all three
          dimensions contribute to risk in the same direction. Strong capacity (hospitals, governance, early warning)
          results in a LOW score, meaning less risk. Weak capacity results in a HIGH score, meaning more risk.
          This allows the final INFORM Risk score to be calculated as a geometric mean of all three dimensions.
        </p>
      </div>

      {/* High vs Low Capacity Comparison */}
      <div className="capacity-comparison">
        <h3>Capacity Impact on Disaster Outcomes</h3>
        <div className="comparison-grid">
          <div className="comparison-card high-capacity">
            <div className="comparison-header">
              <span className="comparison-icon">✅</span>
              <h4>Strong Coping Capacity (Low Score)</h4>
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
              <h4>Weak Coping Capacity (High Score)</h4>
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
