import React, { useState } from 'react';
import './Section3Sensitivity.css';

function Section3Sensitivity() {
  const [selectedDistrict, setSelectedDistrict] = useState('both');
  const [selectedFactor, setSelectedFactor] = useState(null);

  // Comparative case study: Two districts, same flood, different outcomes
  const CASE_STUDY = {
    districtA: {
      name: 'District A',
      flood: '100mm rainfall in 24 hours',
      housing: {
        type: 'Poor Housing',
        details: '75% mud/thatch construction, weak foundations',
        icon: '🏚️',
        sensitivity: 'high'
      },
      health: {
        type: 'Weak Health',
        details: '45% child malnutrition, limited healthcare access',
        icon: '🏥',
        sensitivity: 'high'
      },
      infrastructure: {
        type: 'No Drainage',
        details: 'No drainage system, dirt roads',
        icon: '🚧',
        sensitivity: 'high'
      },
      economic: {
        type: 'High Poverty',
        details: '60% below poverty line, low income diversity',
        icon: '💰',
        sensitivity: 'high'
      },
      outcome: 'HIGH IMPACT',
      outcomeType: 'Disaster',
      outcomeColor: '#D32F2F',
      outcomeDetails: '500 families displaced, 12 deaths, extensive property damage, disease outbreak'
    },
    districtB: {
      name: 'District B',
      flood: '100mm rainfall in 24 hours',
      housing: {
        type: 'Strong Housing',
        details: '80% concrete/permanent construction, proper foundations',
        icon: '🏘️',
        sensitivity: 'low'
      },
      health: {
        type: 'Good Health',
        details: '10% child malnutrition, good healthcare access',
        icon: '⚕️',
        sensitivity: 'low'
      },
      infrastructure: {
        type: 'Good Drainage',
        details: 'Modern drainage system, paved roads',
        icon: '🛣️',
        sensitivity: 'low'
      },
      economic: {
        type: 'Lower Poverty',
        details: '20% below poverty line, diverse livelihoods',
        icon: '💼',
        sensitivity: 'low'
      },
      outcome: 'LOW IMPACT',
      outcomeType: 'Manageable',
      outcomeColor: '#43A047',
      outcomeDetails: 'Minor flooding, no deaths, limited property damage, quick recovery'
    }
  };

  // Sensitivity factors for Tanzania
  const SENSITIVITY_FACTORS = [
    {
      id: 'housing',
      name: 'Housing Quality',
      icon: '🏠',
      color: '#FF9800',
      indicators: [
        { label: 'Mud/thatch housing', value: '45%', risk: 'high' },
        { label: 'Concrete/permanent housing', value: '35%', risk: 'medium' },
        { label: 'Improved housing', value: '20%', risk: 'low' }
      ],
      description: 'Poor housing collapses easily during floods, landslides, and earthquakes',
      tanzaniaNote: 'Rural areas have 65% traditional housing vs 20% in urban centers'
    },
    {
      id: 'health',
      name: 'Health Status',
      icon: '❤️',
      color: '#E91E63',
      indicators: [
        { label: 'Child malnutrition (under-5)', value: '31%', risk: 'high' },
        { label: 'Access to healthcare', value: '55%', risk: 'medium' },
        { label: 'Disease prevalence (malaria)', value: '40%', risk: 'high' }
      ],
      description: 'Malnourished and sick people are more likely to die during droughts and epidemics',
      tanzaniaNote: 'Coastal regions show higher disease prevalence due to climate conditions'
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: '🏗️',
      color: '#3F51B5',
      indicators: [
        { label: 'Drainage systems', value: '30%', risk: 'high' },
        { label: 'All-weather roads', value: '45%', risk: 'medium' },
        { label: 'Clean water access', value: '62%', risk: 'medium' }
      ],
      description: 'Poor drainage amplifies flood impacts; bad roads isolate communities during crises',
      tanzaniaNote: 'Infrastructure quality varies greatly between regions'
    },
    {
      id: 'economic',
      name: 'Economic Status',
      icon: '💵',
      color: '#4CAF50',
      indicators: [
        { label: 'Below poverty line', value: '26%', risk: 'high' },
        { label: 'Livelihood diversity', value: '40%', risk: 'medium' },
        { label: 'Savings/assets', value: '25%', risk: 'high' }
      ],
      description: 'Poor families cannot afford to evacuate, rebuild, or recover from disasters',
      tanzaniaNote: 'Agricultural dependency increases drought sensitivity'
    }
  ];

  const getDistrictColor = (district) => {
    return district === 'districtA' ? '#FFEBEE' : '#E8F5E9';
  };

  const getDistrictBorderColor = (district) => {
    return district === 'districtA' ? '#D32F2F' : '#43A047';
  };

  return (
    <div className="section3-sensitivity">
      {/* Header */}
      <div className="section-header">
        <h1>Section 3: Sensitivity</h1>
        <p className="section-subtitle">How Severely People Are Affected</p>
      </div>

      {/* Definition Box */}
      <div className="definition-box sensitivity-definition">
        <div className="definition-icon">🎯</div>
        <div className="definition-content">
          <h3>What is Sensitivity?</h3>
          <p className="inform-definition">
            <strong>Scientific Definition:</strong> Sensitivity is how strongly exposed people
            are affected when a hazard occurs.
          </p>
          <p className="definition-explanation">
            Two communities can face the <strong>same hazard</strong> with the <strong>same exposure</strong>,
            but experience <strong>vastly different impacts</strong>. Sensitivity explains why some
            communities suffer more than others.
          </p>
          <div className="inform-note-small">
            <strong>INFORM Note:</strong> INFORM embeds sensitivity within the Vulnerability dimension
            (socio-economic factors + vulnerable groups). We teach it separately for clarity.
          </div>
        </div>
      </div>

      {/* Same Hazard, Different Outcomes */}
      <div className="comparison-section">
        <h2>Same Hazard, Different Outcomes</h2>
        <p className="comparison-intro">
          Let's compare two districts that experienced the <strong>exact same flood</strong> but
          had <strong>very different results</strong>:
        </p>

        {/* Comparison Controls */}
        <div className="comparison-controls">
          <button
            className={`comparison-button ${selectedDistrict === 'districtA' ? 'active' : ''}`}
            onClick={() => setSelectedDistrict('districtA')}
            style={{
              borderColor: selectedDistrict === 'districtA' ? '#D32F2F' : '#ddd',
              backgroundColor: selectedDistrict === 'districtA' ? '#FFEBEE' : 'white'
            }}
          >
            <span className="district-icon">📍</span>
            District A (High Sensitivity)
          </button>
          <button
            className={`comparison-button ${selectedDistrict === 'both' ? 'active' : ''}`}
            onClick={() => setSelectedDistrict('both')}
            style={{
              borderColor: selectedDistrict === 'both' ? '#FF9800' : '#ddd',
              backgroundColor: selectedDistrict === 'both' ? '#FFF3E0' : 'white'
            }}
          >
            <span className="district-icon">⚖️</span>
            Compare Both
          </button>
          <button
            className={`comparison-button ${selectedDistrict === 'districtB' ? 'active' : ''}`}
            onClick={() => setSelectedDistrict('districtB')}
            style={{
              borderColor: selectedDistrict === 'districtB' ? '#43A047' : '#ddd',
              backgroundColor: selectedDistrict === 'districtB' ? '#E8F5E9' : 'white'
            }}
          >
            <span className="district-icon">📍</span>
            District B (Low Sensitivity)
          </button>
        </div>

        {/* Comparison Display */}
        <div className={`comparison-display ${selectedDistrict === 'both' ? 'side-by-side' : 'single'}`}>
          {(selectedDistrict === 'districtA' || selectedDistrict === 'both') && (
            <div className="district-column" style={{ borderColor: '#D32F2F' }}>
              <div className="district-title" style={{ backgroundColor: '#D32F2F' }}>
                {CASE_STUDY.districtA.name}
              </div>
              <div className="hazard-same">
                <strong>Same Flood:</strong> {CASE_STUDY.districtA.flood}
              </div>
              <div className="factors-list">
                <div className="factor-item high">
                  <span className="factor-icon">{CASE_STUDY.districtA.housing.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtA.housing.type}</strong>
                    <p>{CASE_STUDY.districtA.housing.details}</p>
                  </div>
                </div>
                <div className="factor-item high">
                  <span className="factor-icon">{CASE_STUDY.districtA.health.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtA.health.type}</strong>
                    <p>{CASE_STUDY.districtA.health.details}</p>
                  </div>
                </div>
                <div className="factor-item high">
                  <span className="factor-icon">{CASE_STUDY.districtA.infrastructure.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtA.infrastructure.type}</strong>
                    <p>{CASE_STUDY.districtA.infrastructure.details}</p>
                  </div>
                </div>
                <div className="factor-item high">
                  <span className="factor-icon">{CASE_STUDY.districtA.economic.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtA.economic.type}</strong>
                    <p>{CASE_STUDY.districtA.economic.details}</p>
                  </div>
                </div>
              </div>
              <div className="outcome-box" style={{ backgroundColor: CASE_STUDY.districtA.outcomeColor }}>
                <div className="outcome-label">{CASE_STUDY.districtA.outcome}</div>
                <div className="outcome-type">({CASE_STUDY.districtA.outcomeType})</div>
                <p className="outcome-details">{CASE_STUDY.districtA.outcomeDetails}</p>
              </div>
            </div>
          )}

          {selectedDistrict === 'both' && (
            <div className="comparison-arrow">→</div>
          )}

          {(selectedDistrict === 'districtB' || selectedDistrict === 'both') && (
            <div className="district-column" style={{ borderColor: '#43A047' }}>
              <div className="district-title" style={{ backgroundColor: '#43A047' }}>
                {CASE_STUDY.districtB.name}
              </div>
              <div className="hazard-same">
                <strong>Same Flood:</strong> {CASE_STUDY.districtB.flood}
              </div>
              <div className="factors-list">
                <div className="factor-item low">
                  <span className="factor-icon">{CASE_STUDY.districtB.housing.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtB.housing.type}</strong>
                    <p>{CASE_STUDY.districtB.housing.details}</p>
                  </div>
                </div>
                <div className="factor-item low">
                  <span className="factor-icon">{CASE_STUDY.districtB.health.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtB.health.type}</strong>
                    <p>{CASE_STUDY.districtB.health.details}</p>
                  </div>
                </div>
                <div className="factor-item low">
                  <span className="factor-icon">{CASE_STUDY.districtB.infrastructure.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtB.infrastructure.type}</strong>
                    <p>{CASE_STUDY.districtB.infrastructure.details}</p>
                  </div>
                </div>
                <div className="factor-item low">
                  <span className="factor-icon">{CASE_STUDY.districtB.economic.icon}</span>
                  <div className="factor-content">
                    <strong>{CASE_STUDY.districtB.economic.type}</strong>
                    <p>{CASE_STUDY.districtB.economic.details}</p>
                  </div>
                </div>
              </div>
              <div className="outcome-box" style={{ backgroundColor: CASE_STUDY.districtB.outcomeColor }}>
                <div className="outcome-label">{CASE_STUDY.districtB.outcome}</div>
                <div className="outcome-type">({CASE_STUDY.districtB.outcomeType})</div>
                <p className="outcome-details">{CASE_STUDY.districtB.outcomeDetails}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sensitivity Factors in Tanzania */}
      <div className="factors-section">
        <h2>Sensitivity Factors in Tanzania</h2>
        <p className="factors-intro">
          These are the key factors that determine how severely Tanzanian communities are affected by hazards:
        </p>

        <div className="factors-grid">
          {SENSITIVITY_FACTORS.map((factor) => (
            <div
              key={factor.id}
              className={`sensitivity-factor-card ${selectedFactor?.id === factor.id ? 'selected' : ''}`}
              onClick={() => setSelectedFactor(selectedFactor?.id === factor.id ? null : factor)}
              style={{ borderColor: selectedFactor?.id === factor.id ? factor.color : '#E0E0E0' }}
            >
              <div className="factor-header" style={{ backgroundColor: factor.color }}>
                <span className="factor-icon-large">{factor.icon}</span>
                <h4>{factor.name}</h4>
              </div>
              <div className="factor-body">
                <p className="factor-description">{factor.description}</p>
                <div className="indicators-list">
                  {factor.indicators.map((indicator, idx) => (
                    <div key={idx} className={`indicator-item risk-${indicator.risk}`}>
                      <div className="indicator-label">{indicator.label}</div>
                      <div className="indicator-value">{indicator.value}</div>
                    </div>
                  ))}
                </div>
                <div className="tanzania-note">
                  <strong>Tanzania:</strong> {factor.tanzaniaNote}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Teaching Box: Disasters Are Not Natural */}
      <div className="teaching-box disasters-not-natural">
        <div className="teaching-icon">💡</div>
        <div className="teaching-content">
          <h3>CRITICAL INSIGHT: "Disasters Are Not Natural"</h3>
          <div className="insight-explanation">
            <p className="insight-emphasis">
              <strong>Natural hazards are inevitable.</strong> Floods, droughts, and cyclones will always occur.
            </p>
            <p className="insight-main">
              But <strong>DISASTERS</strong> — the death, displacement, and suffering — are <strong>NOT natural</strong>.
              They are created by:
            </p>
            <div className="disaster-causes">
              <div className="cause-item">
                <span className="cause-icon">💰</span>
                <div className="cause-text">
                  <strong>Poverty</strong>
                  <p>Inability to build safe homes or evacuate</p>
                </div>
              </div>
              <div className="cause-item">
                <span className="cause-icon">🏚️</span>
                <div className="cause-text">
                  <strong>Poor Infrastructure</strong>
                  <p>Weak housing, no drainage, bad roads</p>
                </div>
              </div>
              <div className="cause-item">
                <span className="cause-icon">🏥</span>
                <div className="cause-text">
                  <strong>Weak Health Systems</strong>
                  <p>Malnutrition, disease, limited healthcare</p>
                </div>
              </div>
              <div className="cause-item">
                <span className="cause-icon">⚖️</span>
                <div className="cause-text">
                  <strong>Inequality</strong>
                  <p>Marginalized groups suffer disproportionately</p>
                </div>
              </div>
            </div>
            <div className="insight-conclusion">
              <strong>→ Reducing sensitivity reduces disaster impact</strong>
              <p>
                This is why development matters. Improving housing, health, infrastructure, and equality
                <strong> saves lives during hazards</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Summary */}
      <div className="section-summary sensitivity-summary">
        <h3>📚 Section 3 Summary: Key Learnings</h3>
        <div className="summary-points">
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Sensitivity</strong> determines how severely people are affected when hazards occur
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              The <strong>same hazard</strong> can cause a <strong>disaster</strong> in one place and be
              <strong> manageable</strong> in another — sensitivity makes the difference
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              Key sensitivity factors: <strong>housing quality, health status, infrastructure, economic status</strong>
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Disasters are NOT natural</strong> — they're created by poverty, inequality, and weak systems
            </span>
          </div>
        </div>
        <div className="next-section-preview">
          <h4>🔜 Next Section: Vulnerability</h4>
          <p>
            We've learned how sensitivity affects impact. Now we'll explore <strong>vulnerability</strong> —
            the broader concept that INFORM uses to assess which communities are most at risk. This is where
            we'll start to see the <strong>INFORM formula</strong> taking shape.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Section3Sensitivity;
