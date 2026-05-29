import React, { useState } from 'react';
import './Section2Exposure.css';

function Section2Exposure() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [overlayStep, setOverlayStep] = useState(0); // 0: hazard, 1: population, 2: exposure

  // Tanzania districts with exposure data
  const EXPOSURE_DATA = [
    {
      id: 'dar',
      name: 'Dar es Salaam',
      hazardZone: 450,
      population: 1200000,
      totalPopulation: 1850000,
      relativeExposure: 65,
      hazardType: 'Flood',
      description: 'Coastal flooding and riverine flooding zones'
    },
    {
      id: 'dodoma',
      name: 'Dodoma',
      hazardZone: 200,
      population: 150000,
      totalPopulation: 600000,
      relativeExposure: 25,
      hazardType: 'Flood',
      description: 'Seasonal riverine flooding'
    },
    {
      id: 'mwanza',
      name: 'Mwanza',
      hazardZone: 320,
      population: 450000,
      totalPopulation: 900000,
      relativeExposure: 50,
      hazardType: 'Flood',
      description: 'Lake Victoria flooding zones'
    },
    {
      id: 'arusha',
      name: 'Arusha',
      hazardZone: 180,
      population: 280000,
      totalPopulation: 700000,
      relativeExposure: 40,
      hazardType: 'Volcanic',
      description: 'Mt. Meru volcanic hazard zone'
    },
    {
      id: 'morogoro',
      name: 'Morogoro',
      hazardZone: 290,
      population: 380000,
      totalPopulation: 950000,
      relativeExposure: 40,
      hazardType: 'Flood',
      description: 'Riverine and flash flooding'
    },
    {
      id: 'mbeya',
      name: 'Mbeya',
      hazardZone: 150,
      population: 210000,
      totalPopulation: 700000,
      relativeExposure: 30,
      hazardType: 'Landslide',
      description: 'Highland landslide zones'
    }
  ];

  const OVERLAY_STEPS = [
    {
      id: 0,
      title: 'Step 1: Hazard Zone',
      description: 'Areas where hazards can occur',
      icon: '🌊',
      color: '#D32F2F'
    },
    {
      id: 1,
      title: 'Step 2: Population',
      description: 'Where people live and work',
      icon: '👥',
      color: '#1976D2'
    },
    {
      id: 2,
      title: 'Step 3: Exposure',
      description: 'Overlap = People in hazard zones',
      icon: '📍',
      color: '#F57C00'
    }
  ];

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="section2-exposure">
      {/* Header */}
      <div className="section-header">
        <h1>Section 2: Exposure</h1>
        <p className="section-subtitle">Where Hazards Meet People</p>
      </div>

      {/* INFORM Definition Box */}
      <div className="definition-box exposure-definition">
        <div className="definition-icon">📍</div>
        <div className="definition-content">
          <h3>What is Exposure?</h3>
          <p className="inform-definition">
            <strong>INFORM Definition:</strong> Exposure is the presence of people, infrastructure,
            or livelihoods in hazard-prone areas.
          </p>
          <p className="definition-explanation">
            A hazard only creates risk when people, buildings, or economic activities are located
            where the hazard can occur. <strong>Exposure answers: "Who or what is in harm's way?"</strong>
          </p>
        </div>
      </div>

      {/* The Overlay Concept */}
      <div className="concept-section">
        <h2>The Overlay Concept</h2>
        <p className="concept-intro">
          Exposure is created when hazard zones and population overlap. Think of it as layering
          two maps on top of each other:
        </p>

        {/* Interactive Overlay Visualization */}
        <div className="overlay-visualization">
          <div className="overlay-controls">
            {OVERLAY_STEPS.map((step) => (
              <button
                key={step.id}
                className={`overlay-step-button ${overlayStep === step.id ? 'active' : ''}`}
                onClick={() => setOverlayStep(step.id)}
                style={{
                  borderColor: overlayStep === step.id ? step.color : '#ddd',
                  backgroundColor: overlayStep === step.id ? step.color : 'white',
                  color: overlayStep === step.id ? 'white' : '#333'
                }}
              >
                <span className="step-icon">{step.icon}</span>
                <span className="step-title">{step.title}</span>
              </button>
            ))}
          </div>

          <div className="overlay-display">
            <div className={`overlay-layer hazard-layer ${overlayStep >= 0 ? 'visible' : ''}`}>
              <div className="layer-label" style={{ backgroundColor: '#D32F2F' }}>
                🌊 Hazard Zone
              </div>
              <div className="layer-pattern hazard-pattern"></div>
            </div>

            <div className={`overlay-layer population-layer ${overlayStep >= 1 ? 'visible' : ''}`}>
              <div className="layer-label" style={{ backgroundColor: '#1976D2' }}>
                👥 Population
              </div>
              <div className="layer-pattern population-pattern"></div>
            </div>

            <div className={`overlay-layer exposure-layer ${overlayStep >= 2 ? 'visible' : ''}`}>
              <div className="layer-label" style={{ backgroundColor: '#F57C00' }}>
                📍 Exposure (Overlap)
              </div>
              <div className="layer-pattern exposure-pattern"></div>
            </div>
          </div>

          <div className="overlay-explanation">
            <p>{OVERLAY_STEPS[overlayStep].description}</p>
            {overlayStep === 2 && (
              <div className="overlay-formula">
                <strong>Hazard Zone + Population = Exposure</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Absolute vs Relative Exposure */}
      <div className="teaching-box exposure-types">
        <div className="teaching-icon">🧠</div>
        <div className="teaching-content">
          <h3>Two Ways to Measure Exposure</h3>
          <div className="exposure-comparison">
            <div className="exposure-type">
              <div className="exposure-type-header">
                <span className="exposure-icon">🔢</span>
                <h4>Absolute Exposure</h4>
              </div>
              <p><strong>Definition:</strong> The total number of people in hazard zones</p>
              <p className="example-text">
                <em>Example:</em> 1,200,000 people live in Dar es Salaam's flood zone
              </p>
              <p className="why-important">
                <strong>Why it matters:</strong> Shows the scale of potential impact
              </p>
            </div>

            <div className="divider-vertical"></div>

            <div className="exposure-type">
              <div className="exposure-type-header">
                <span className="exposure-icon">📊</span>
                <h4>Relative Exposure</h4>
              </div>
              <p><strong>Definition:</strong> The percentage of population in hazard zones</p>
              <p className="example-text">
                <em>Example:</em> 65% of Dar es Salaam's population lives in the flood zone
              </p>
              <p className="why-important">
                <strong>Why it matters:</strong> Shows the proportion of the community at risk
              </p>
            </div>
          </div>
          <div className="inform-note">
            <strong>INFORM uses both metrics</strong> to avoid bias toward large or small populations.
            A small district with 100% exposure needs as much attention as a large city with lower percentage.
          </div>
        </div>
      </div>

      {/* Tanzania Exposure Data */}
      <div className="exposure-data-section">
        <h2>Exposure in Tanzania: Real Data</h2>
        <p className="data-intro">
          Select a district below to see how many people live in hazard-prone areas:
        </p>

        <div className="districts-grid">
          {EXPOSURE_DATA.map((district) => (
            <div
              key={district.id}
              className={`district-card ${selectedDistrict?.id === district.id ? 'selected' : ''}`}
              onClick={() => setSelectedDistrict(district)}
            >
              <div className="district-header">
                <h4>{district.name}</h4>
                <span className="hazard-badge" style={{
                  backgroundColor: district.hazardType === 'Flood' ? '#D32F2F' :
                                   district.hazardType === 'Volcanic' ? '#795548' : '#FF9800'
                }}>
                  {district.hazardType}
                </span>
              </div>
              <div className="district-metric">
                <div className="metric-value">{formatNumber(district.population)}</div>
                <div className="metric-label">People in Hazard Zone</div>
              </div>
              <div className="district-percentage">
                <div className="percentage-bar">
                  <div
                    className="percentage-fill"
                    style={{
                      width: `${district.relativeExposure}%`,
                      backgroundColor: '#F57C00'
                    }}
                  ></div>
                </div>
                <div className="percentage-text">{district.relativeExposure}% Exposed</div>
              </div>
            </div>
          ))}
        </div>

        {selectedDistrict && (
          <div className="district-details">
            <h3>📍 {selectedDistrict.name} - Detailed Exposure</h3>
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Hazard Zone Area</div>
                <div className="detail-value">{formatNumber(selectedDistrict.hazardZone)} km²</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Population in Zone (Absolute)</div>
                <div className="detail-value">{formatNumber(selectedDistrict.population)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Total District Population</div>
                <div className="detail-value">{formatNumber(selectedDistrict.totalPopulation)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Exposure Rate (Relative)</div>
                <div className="detail-value">{selectedDistrict.relativeExposure}%</div>
              </div>
            </div>
            <div className="detail-description">
              <strong>Hazard Context:</strong> {selectedDistrict.description}
            </div>
          </div>
        )}
      </div>

      {/* Tanzania's Challenge Box */}
      <div className="teaching-box tanzania-challenge">
        <div className="teaching-icon">⚠️</div>
        <div className="teaching-content">
          <h3>Tanzania's Exposure Challenge</h3>
          <div className="challenge-formula">
            <div className="formula-part">Moderate to High Hazards</div>
            <div className="formula-operator">+</div>
            <div className="formula-part">High Population Exposure</div>
            <div className="formula-operator">=</div>
            <div className="formula-result">Significant Potential Impact</div>
          </div>
          <div className="challenge-example">
            <strong>Example: Dar es Salaam</strong>
            <ul>
              <li>Moderate flood hazard (coastal + riverine)</li>
              <li>65% of population in flood zone (1.2 million people)</li>
              <li>Result: Very high flood exposure</li>
            </ul>
          </div>
          <p className="challenge-note">
            <strong>Key Insight:</strong> Even moderate hazards create significant risk when
            large populations are exposed. This is why location planning and early warning systems
            are crucial for Tanzania.
          </p>
        </div>
      </div>

      {/* Important Notice: No Impact Yet */}
      <div className="notice-box exposure-notice">
        <div className="notice-icon">💡</div>
        <div className="notice-content">
          <h4>Still Learning Concepts - No Impact Assessment Yet</h4>
          <p>
            We've now covered <strong>Hazard</strong> (what can happen) and <strong>Exposure</strong> (who
            is in harm's way). But we still haven't mentioned:
          </p>
          <ul className="notice-list">
            <li>❌ <strong>Vulnerability</strong> (why some suffer more)</li>
            <li>❌ <strong>Impact severity</strong> (how bad it gets)</li>
            <li>❌ <strong>Risk calculation</strong> (combining all factors)</li>
          </ul>
          <p className="notice-emphasis">
            <strong>Being exposed doesn't automatically mean disaster.</strong> The next sections will
            show why some exposed populations are more vulnerable than others.
          </p>
        </div>
      </div>

      {/* Section Summary */}
      <div className="section-summary exposure-summary">
        <h3>📚 Section 2 Summary: Key Learnings</h3>
        <div className="summary-points">
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Exposure</strong> is created when people live or work in hazard-prone areas
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              We measure exposure in two ways: <strong>absolute</strong> (total people) and
              <strong> relative</strong> (percentage)
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              Tanzania has <strong>high exposure</strong> in many districts due to population
              concentration in hazard zones
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Location matters</strong> - the same hazard affects different numbers of
              people depending on where they live
            </span>
          </div>
        </div>
        <div className="next-section-preview">
          <h4>🔜 Next Section: Sensitivity</h4>
          <p>
            We know <em>what hazards exist</em> and <em>who is exposed</em>. But why do the same
            hazards cause different levels of impact? Section 3 explores <strong>sensitivity</strong> -
            how strongly people are affected when hazards occur.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Section2Exposure;
