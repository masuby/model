import React, { useState } from 'react';
import './Section5Coping.css';

function Section5Coping() {
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showFormula, setShowFormula] = useState(false);
  const [comparisonView, setComparisonView] = useState('both');

  // Coping Capacity Framework: Prepare, Respond, Recover
  const COPING_PHASES = {
    prepare: {
      id: 'prepare',
      name: 'PREPARE',
      icon: '🔔',
      color: '#1976D2',
      description: 'Actions taken before a disaster to reduce impact',
      activities: [
        'Early warning systems',
        'Hazard mapping and planning',
        'Community training and drills',
        'Emergency supply stockpiling',
        'Building codes and land-use planning'
      ]
    },
    respond: {
      id: 'respond',
      name: 'RESPOND',
      icon: '🚨',
      color: '#D32F2F',
      description: 'Actions during and immediately after a disaster',
      activities: [
        'Emergency services deployment',
        'Search and rescue operations',
        'Medical response and triage',
        'Relief distribution (food, water, shelter)',
        'Coordination and communication'
      ]
    },
    recover: {
      id: 'recover',
      name: 'RECOVER',
      icon: '🏗️',
      color: '#43A047',
      description: 'Actions to rebuild and strengthen after a disaster',
      activities: [
        'Reconstruction of infrastructure',
        'Livelihood restoration',
        'Psychosocial support',
        'Learning from the disaster',
        '"Build back better" improvements'
      ]
    }
  };

  // Coping Capacity Components for Tanzania
  const CAPACITY_COMPONENTS = [
    {
      id: 'institutional',
      name: 'Institutional Capacity',
      icon: '🏛️',
      color: '#3F51B5',
      description: 'Government systems and disaster management structures',
      indicators: [
        { name: 'National DRM Authority (PMO-DMD)', status: 'exists', level: 'good' },
        { name: 'District Disaster Committees', status: '154 districts', level: 'medium' },
        { name: 'DRR budget allocation', status: '0.8% of budget', level: 'low' },
        { name: 'Emergency response SOPs', status: 'Partial', level: 'medium' }
      ],
      tanzaniaNote: 'Strong frameworks exist but funding and implementation gaps persist'
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: '🛣️',
      color: '#FF9800',
      description: 'Physical systems for communication, transport, and services',
      indicators: [
        { name: 'Early warning system coverage', status: '45% of at-risk areas', level: 'medium' },
        { name: 'All-season road access', status: '55% of districts', level: 'medium' },
        { name: 'Mobile network coverage', status: '85% population', level: 'good' },
        { name: 'Emergency shelters', status: '120 facilities', level: 'low' }
      ],
      tanzaniaNote: 'Urban areas well-covered; rural and remote areas face significant gaps'
    },
    {
      id: 'health',
      name: 'Health Services',
      icon: '⚕️',
      color: '#E91E63',
      description: 'Medical capacity to handle mass casualties and epidemics',
      indicators: [
        { name: 'Hospitals per 100k people', status: '2.5', level: 'low' },
        { name: 'Ambulance availability', status: '1 per 50k people', level: 'low' },
        { name: 'Blood bank capacity', status: '60% of need', level: 'medium' },
        { name: 'Disease surveillance system', status: 'Active', level: 'good' }
      ],
      tanzaniaNote: 'Surveillance strong, but physical capacity (beds, equipment) is limited'
    }
  ];

  // Comparison scenarios
  const COMPARISON_SCENARIOS = {
    high: {
      title: 'District with HIGH Coping Capacity',
      color: '#43A047',
      examples: [
        {
          hazard: '🌊 Flood (100mm rainfall)',
          outcome: '✅ Managed Situation',
          details: [
            'Early warning issued 24h in advance',
            'Pre-positioned supplies distributed',
            'Vulnerable populations evacuated to shelters',
            'Minor damage, no deaths, quick recovery'
          ]
        },
        {
          hazard: '🦠 Disease Outbreak',
          outcome: '✅ Controlled Response',
          details: [
            'Surveillance detected outbreak early',
            'Isolation facilities activated',
            'Medical teams deployed within hours',
            'Outbreak contained in 2 weeks'
          ]
        }
      ]
    },
    low: {
      title: 'District with LOW Coping Capacity',
      color: '#D32F2F',
      examples: [
        {
          hazard: '🌊 Flood (100mm rainfall)',
          outcome: '❌ CRISIS',
          details: [
            'No warning system - people caught off guard',
            'No evacuation plan or shelters',
            'Roads cut off, no emergency access',
            'Major damage, deaths, prolonged displacement'
          ]
        },
        {
          hazard: '🦠 Disease Outbreak',
          outcome: '❌ CRISIS',
          details: [
            'Outbreak detected after widespread transmission',
            'No isolation capacity or treatment supplies',
            'Medical staff overwhelmed',
            'High mortality, prolonged epidemic'
          ]
        }
      ]
    }
  };

  return (
    <div className="section5-coping">
      {/* Header */}
      <div className="section-header">
        <h1>Section 5: Coping Capacity</h1>
        <p className="section-subtitle">Ability to Prepare, Respond, and Recover</p>
      </div>

      {/* INFORM Definition Box */}
      <div className="definition-box coping-definition">
        <div className="definition-icon">💪</div>
        <div className="definition-content">
          <h3>What is Coping Capacity?</h3>
          <p className="inform-definition">
            <strong>INFORM Definition:</strong> Coping capacity is the ability of systems, institutions,
            and communities to reduce disaster impact through preparedness, response, and recovery.
          </p>
          <p className="definition-explanation">
            <strong>Coping capacity counterbalances vulnerability.</strong> Even highly exposed and vulnerable
            populations may avoid crisis if coping capacity is strong. This is why investing in disaster management
            systems, infrastructure, and health services saves lives.
          </p>
          <div className="capacity-note">
            <strong>INFORM uses "Lack of Coping Capacity" (LCC):</strong> Strong capacity = Low LCC = Lower risk
          </div>
        </div>
      </div>

      {/* Coping Capacity Framework */}
      <div className="framework-section">
        <h2>The Coping Capacity Framework</h2>
        <p className="framework-intro">
          Coping capacity works across three phases of the disaster cycle:
        </p>

        <div className="phases-selector">
          {[
            { id: 'all', label: 'All Phases', icon: '🔄' },
            { id: 'prepare', label: 'Prepare', icon: '🔔' },
            { id: 'respond', label: 'Respond', icon: '🚨' },
            { id: 'recover', label: 'Recover', icon: '🏗️' }
          ].map(phase => (
            <button
              key={phase.id}
              className={`phase-button ${selectedPhase === phase.id ? 'active' : ''}`}
              onClick={() => setSelectedPhase(phase.id)}
            >
              <span className="phase-icon">{phase.icon}</span>
              <span>{phase.label}</span>
            </button>
          ))}
        </div>

        <div className="phases-display">
          {Object.values(COPING_PHASES).map(phase => (
            (selectedPhase === 'all' || selectedPhase === phase.id) && (
              <div key={phase.id} className="phase-card" style={{ borderColor: phase.color }}>
                <div className="phase-header" style={{ backgroundColor: phase.color }}>
                  <span className="phase-icon-large">{phase.icon}</span>
                  <h3>{phase.name}</h3>
                </div>
                <div className="phase-body">
                  <p className="phase-description">{phase.description}</p>
                  <div className="activities-list">
                    <strong>Key Activities:</strong>
                    <ul>
                      {phase.activities.map((activity, idx) => (
                        <li key={idx}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Coping Capacity Components */}
      <div className="components-section">
        <h2>Tanzania's Coping Capacity: Three Components</h2>
        <p className="components-intro">
          INFORM measures coping capacity through these three dimensions:
        </p>

        <div className="capacity-components-grid">
          {CAPACITY_COMPONENTS.map(component => (
            <div
              key={component.id}
              className={`capacity-component-card ${selectedComponent?.id === component.id ? 'selected' : ''}`}
              onClick={() => setSelectedComponent(selectedComponent?.id === component.id ? null : component)}
              style={{ borderColor: selectedComponent?.id === component.id ? component.color : '#E0E0E0' }}
            >
              <div className="component-header" style={{ backgroundColor: component.color }}>
                <span className="component-icon-large">{component.icon}</span>
                <h4>{component.name}</h4>
              </div>
              <div className="component-body">
                <p className="component-description">{component.description}</p>
                <div className="indicators-list">
                  {component.indicators.map((indicator, idx) => (
                    <div key={idx} className={`indicator-row level-${indicator.level}`}>
                      <span className="indicator-name">{indicator.name}</span>
                      <span className="indicator-status">{indicator.status}</span>
                    </div>
                  ))}
                </div>
                <div className="component-note">
                  <strong>Tanzania:</strong> {component.tanzaniaNote}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity vs Crisis Comparison */}
      <div className="comparison-section">
        <h2>Capacity Makes the Difference</h2>
        <p className="comparison-intro">
          <strong>Same hazard, same exposure, same vulnerability</strong> — but <strong>different coping capacity</strong> leads to vastly different outcomes:
        </p>

        <div className="comparison-controls">
          {[
            { id: 'both', label: 'Compare Both', icon: '⚖️' },
            { id: 'high', label: 'High Capacity', icon: '✅' },
            { id: 'low', label: 'Low Capacity', icon: '❌' }
          ].map(view => (
            <button
              key={view.id}
              className={`comparison-button ${comparisonView === view.id ? 'active' : ''}`}
              onClick={() => setComparisonView(view.id)}
            >
              <span className="view-icon">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        <div className={`comparison-display ${comparisonView === 'both' ? 'side-by-side' : 'single'}`}>
          {(comparisonView === 'both' || comparisonView === 'high') && (
            <div className="scenario-column high-capacity">
              <div className="scenario-title" style={{ backgroundColor: COMPARISON_SCENARIOS.high.color }}>
                {COMPARISON_SCENARIOS.high.title}
              </div>
              {COMPARISON_SCENARIOS.high.examples.map((example, idx) => (
                <div key={idx} className="scenario-example">
                  <div className="example-hazard">{example.hazard}</div>
                  <div className="example-outcome success">{example.outcome}</div>
                  <ul className="example-details">
                    {example.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {(comparisonView === 'both' || comparisonView === 'low') && (
            <div className="scenario-column low-capacity">
              <div className="scenario-title" style={{ backgroundColor: COMPARISON_SCENARIOS.low.color }}>
                {COMPARISON_SCENARIOS.low.title}
              </div>
              {COMPARISON_SCENARIOS.low.examples.map((example, idx) => (
                <div key={idx} className="scenario-example">
                  <div className="example-hazard">{example.hazard}</div>
                  <div className="example-outcome crisis">{example.outcome}</div>
                  <ul className="example-details">
                    {example.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* INFORM Formula - Second Dimension Reveal */}
      <div className="formula-reveal-section">
        <div className="reveal-intro">
          <h2>🔓 INFORM Formula: Second Dimension</h2>
          <p>
            You've seen how <strong>Vulnerability</strong> increases risk. Now see how <strong>Lack of Coping Capacity</strong>
            works alongside it in the INFORM equation.
          </p>
          <button
            className="reveal-button"
            onClick={() => setShowFormula(!showFormula)}
            style={{ backgroundColor: showFormula ? '#43A047' : '#1976D2' }}
          >
            {showFormula ? '✓ Second Dimension Revealed' : '🔓 Reveal Second Dimension'}
          </button>
        </div>

        {showFormula && (
          <div className="formula-box">
            <div className="formula-title">INFORM RISK EQUATION (2 of 3 Dimensions Revealed)</div>
            <div className="formula-equation">
              <div className="formula-text">
                Risk = (H and E)<sup>1/3</sup> × (V)<sup>1/3</sup> × (LCC)<sup>1/3</sup>
              </div>
            </div>
            <div className="formula-highlights">
              <div className="formula-highlight">
                <div className="highlight-arrow">↑</div>
                <div className="highlight-label vulnerability">V = Vulnerability</div>
              </div>
              <div className="formula-highlight">
                <div className="highlight-arrow">↑</div>
                <div className="highlight-label capacity">LCC = Lack of Coping Capacity</div>
              </div>
            </div>
            <div className="formula-explanation">
              <h4>What This Means:</h4>
              <div className="explanation-grid">
                <div className="explanation-item">
                  <div className="explanation-icon">🔄</div>
                  <div className="explanation-text">
                    <strong>LCC = "Lack" of Capacity</strong>
                    <p>INFORM uses the inverse: Strong capacity = Low LCC</p>
                  </div>
                </div>
                <div className="explanation-item">
                  <div className="explanation-icon">⚖️</div>
                  <div className="explanation-text">
                    <strong>Counterbalances Vulnerability</strong>
                    <p>High capacity can offset high vulnerability</p>
                  </div>
                </div>
                <div className="explanation-item">
                  <div className="explanation-icon">📈</div>
                  <div className="explanation-text">
                    <strong>Can Be Strengthened</strong>
                    <p>Investment in systems and infrastructure reduces LCC and risk</p>
                  </div>
                </div>
                <div className="explanation-item">
                  <div className="explanation-icon">🎯</div>
                  <div className="explanation-text">
                    <strong>Determines Crisis vs Management</strong>
                    <p>Capacity decides if a hazard overwhelms the country</p>
                  </div>
                </div>
              </div>
              <div className="formula-note">
                <strong>One more dimension to go!</strong> Section 6 will reveal (H and E) - Hazard and Exposure - completing the full INFORM Risk equation.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Teaching Box */}
      <div className="teaching-box capacity-teaching">
        <div className="teaching-icon">🧠</div>
        <div className="teaching-content">
          <h3>KEY INSIGHT: Coping Capacity Counterbalances Vulnerability</h3>
          <div className="teaching-scenario">
            <div className="scenario-title">Scenario: High Vulnerability District</div>
            <div className="scenario-comparison">
              <div className="scenario-side without">
                <h4>WITHOUT Strong Coping Capacity:</h4>
                <div className="scenario-outcomes">
                  <div className="outcome-item">
                    <span className="outcome-icon">☀️</span>
                    <span className="outcome-text">Drought → <strong>Famine</strong></span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-icon">🦠</span>
                    <span className="outcome-text">Epidemic → <strong>Mass Deaths</strong></span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-icon">🌊</span>
                    <span className="outcome-text">Flood → <strong>Displacement</strong></span>
                  </div>
                </div>
              </div>
              <div className="scenario-divider">→</div>
              <div className="scenario-side with">
                <h4>WITH Strong Coping Capacity:</h4>
                <div className="scenario-outcomes">
                  <div className="outcome-item">
                    <span className="outcome-icon">☀️</span>
                    <span className="outcome-text">Drought → <strong>Managed food distribution</strong></span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-icon">🦠</span>
                    <span className="outcome-text">Epidemic → <strong>Controlled outbreak</strong></span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-icon">🌊</span>
                    <span className="outcome-text">Flood → <strong>Safe evacuation</strong></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="scenario-conclusion">
              <strong>→ Investing in capacity = Risk reduction</strong>
              <p>
                This is why Tanzania's investments in early warning systems, emergency services,
                and health infrastructure directly reduce disaster risk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Summary */}
      <div className="section-summary coping-summary">
        <h3>📚 Section 5 Summary: Key Learnings</h3>
        <div className="summary-points">
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Coping capacity</strong> is the ability to prepare, respond, and recover from disasters
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              INFORM measures capacity through <strong>three components</strong>: institutional, infrastructure, and health
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Strong capacity counterbalances vulnerability</strong> — the same vulnerable population can avoid crisis with good coping systems
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              The INFORM formula uses <strong>Lack of Coping Capacity (LCC)</strong> as the second dimension of risk
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Investing in capacity = Risk reduction</strong> — every improvement in systems and infrastructure saves lives
            </span>
          </div>
        </div>
        <div className="next-section-preview">
          <h4>🔜 Final Section: Risk</h4>
          <p>
            You've learned about <strong>Hazard and Exposure</strong>, <strong>Vulnerability</strong>, and <strong>Coping Capacity</strong>.
            Section 6 brings it all together — the <strong>complete INFORM Risk formula</strong>, how to calculate risk scores,
            and how Tanzania uses this framework for decision-making.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Section5Coping;
