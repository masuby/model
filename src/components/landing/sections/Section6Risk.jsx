import React, { useState } from 'react';
import './Section6Risk.css';

function Section6Risk() {
  const [showCompleteFormula, setShowCompleteFormula] = useState(false);
  const [scenarioValues, setScenarioValues] = useState({
    hazardExposure: 3.8,
    vulnerability: 5.1,
    lackCoping: 3.9
  });
  const [selectedComparison, setSelectedComparison] = useState('regional');

  // Tanzania's INFORM Risk Score
  const TANZANIA_RISK = {
    overall: 4.2,
    classification: 'Medium-High Risk',
    classificationColor: '#FF9800',
    dimensions: {
      hazardExposure: 3.8,
      vulnerability: 5.1,
      lackCoping: 3.9
    },
    rank: '78 out of 191 countries',
    context: 'Tanzania faces medium-high disaster risk due to elevated vulnerability despite moderate hazard exposure'
  };

  // Risk Classification Levels
  const RISK_LEVELS = [
    { level: 'Very Low', range: '0.0 - 2.0', color: '#4CAF50', description: 'Minimal disaster risk' },
    { level: 'Low', range: '2.0 - 3.5', color: '#8BC34A', description: 'Limited disaster risk' },
    { level: 'Medium', range: '3.5 - 5.0', color: '#FFC107', description: 'Moderate disaster risk' },
    { level: 'High', range: '5.0 - 6.5', color: '#FF9800', description: 'Significant disaster risk' },
    { level: 'Very High', range: '6.5 - 10.0', color: '#D32F2F', description: 'Severe disaster risk' }
  ];

  // Regional Comparisons
  const REGIONAL_COMPARISONS = [
    { region: 'Tanzania', score: 4.2, color: '#FF9800' },
    { region: 'East Africa Average', score: 4.8, color: '#FF5722' },
    { region: 'Southern Africa Average', score: 3.6, color: '#FFC107' },
    { region: 'Global Average', score: 3.9, color: '#9E9E9E' }
  ];

  const DIMENSION_COMPARISONS = [
    {
      dimension: 'Hazard and Exposure',
      tanzania: 3.8,
      eastAfrica: 4.1,
      global: 3.5,
      color: '#D32F2F'
    },
    {
      dimension: 'Vulnerability',
      tanzania: 5.1,
      eastAfrica: 5.5,
      global: 4.2,
      color: '#E65100'
    },
    {
      dimension: 'Lack of Coping Capacity',
      tanzania: 3.9,
      eastAfrica: 4.6,
      global: 3.8,
      color: '#1976D2'
    }
  ];

  // Calculate scenario risk
  const calculateRisk = (he, v, lcc) => {
    return Math.pow(he * v * lcc, 1/3).toFixed(2);
  };

  const scenarioRisk = calculateRisk(
    scenarioValues.hazardExposure,
    scenarioValues.vulnerability,
    scenarioValues.lackCoping
  );

  const getRiskLevel = (score) => {
    const numScore = parseFloat(score);
    if (numScore < 2.0) return RISK_LEVELS[0];
    if (numScore < 3.5) return RISK_LEVELS[1];
    if (numScore < 5.0) return RISK_LEVELS[2];
    if (numScore < 6.5) return RISK_LEVELS[3];
    return RISK_LEVELS[4];
  };

  const scenarioLevel = getRiskLevel(scenarioRisk);

  return (
    <div className="section6-risk">
      {/* Header */}
      <div className="section-header">
        <h1>Section 6: Risk</h1>
        <p className="section-subtitle">Putting It All Together</p>
      </div>

      {/* INFORM Definition Box */}
      <div className="definition-box risk-definition">
        <div className="definition-icon">🎲</div>
        <div className="definition-content">
          <h3>What is Risk?</h3>
          <p className="inform-definition">
            <strong>INFORM Definition:</strong> Risk is the combination of hazard, exposure,
            vulnerability, and lack of coping capacity. It represents the potential for humanitarian
            crises requiring international assistance.
          </p>
          <p className="definition-explanation">
            Risk is NOT random or unpredictable — it can be <strong>measured, compared, and reduced</strong>.
            The INFORM Risk Index provides a scientific framework for understanding and addressing disaster risk.
          </p>
          <div className="risk-emphasis">
            <strong>Critical Point:</strong> Risk is calculable and manageable. By addressing its components
            (reducing vulnerability, strengthening coping capacity), we can prevent future disasters.
          </div>
        </div>
      </div>

      {/* Complete Formula Reveal */}
      <div className="formula-reveal-section complete">
        <div className="reveal-intro">
          <h2>🔓 The Complete INFORM Risk Equation</h2>
          <p>
            You've learned about <strong>Hazard and Exposure</strong>, <strong>Vulnerability</strong>,
            and <strong>Coping Capacity</strong>. Now see how INFORM combines all three dimensions
            into a single, comparable risk score.
          </p>
          <button
            className="reveal-button"
            onClick={() => setShowCompleteFormula(!showCompleteFormula)}
            style={{ backgroundColor: showCompleteFormula ? '#43A047' : '#1976D2' }}
          >
            {showCompleteFormula ? '✓ Complete Formula Revealed' : '🔓 Click to Reveal Complete INFORM Formula'}
          </button>
        </div>

        {showCompleteFormula && (
          <div className="formula-box complete-formula">
            <div className="formula-title">THE COMPLETE INFORM RISK EQUATION</div>
            <div className="formula-equation large">
              <div className="formula-text">
                Risk = (H and E)<sup>1/3</sup> × (V)<sup>1/3</sup> × (LCC)<sup>1/3</sup>
              </div>
            </div>
            <div className="formula-highlights-complete">
              <div className="formula-highlight hazard">
                <div className="highlight-arrow">↑</div>
                <div className="highlight-label">HAZARD & EXPOSURE</div>
                <div className="highlight-description">What hazards + Who is exposed</div>
              </div>
              <div className="formula-highlight vulnerability">
                <div className="highlight-arrow">↑</div>
                <div className="highlight-label">VULNERABILITY</div>
                <div className="highlight-description">Pre-existing susceptibility</div>
              </div>
              <div className="formula-highlight capacity">
                <div className="highlight-arrow">↑</div>
                <div className="highlight-label">LACK OF COPING CAPACITY</div>
                <div className="highlight-description">Inability to manage disasters</div>
              </div>
            </div>
            <div className="formula-explanation complete">
              <h4>Why the Geometric Mean (Cube Root)?</h4>
              <div className="geometric-comparison">
                <div className="comparison-col">
                  <div className="comparison-title">❌ Arithmetic Mean (Average)</div>
                  <div className="comparison-formula">Risk = (H and E + V + LCC) ÷ 3</div>
                  <div className="comparison-problem">
                    <strong>Problem:</strong> High score in one dimension can be "cancelled out" by low scores in others
                  </div>
                  <div className="comparison-example">
                    Example: H and E=9, V=1, LCC=1 → Risk = 3.7 (appears moderate, but high hazard!)
                  </div>
                </div>
                <div className="comparison-col">
                  <div className="comparison-title">✓ Geometric Mean (Cube Root)</div>
                  <div className="comparison-formula">Risk = (H and E × V × LCC)<sup>1/3</sup></div>
                  <div className="comparison-benefit">
                    <strong>Benefit:</strong> ALL dimensions matter equally — a high score in any dimension raises overall risk
                  </div>
                  <div className="comparison-example">
                    Same example: H and E=9, V=1, LCC=1 → Risk = 2.1 (low, accurately reflects low V and LCC)
                  </div>
                </div>
              </div>
              <div className="geometric-insight">
                <strong>Key Insight:</strong> The geometric mean ensures that reducing risk requires addressing
                ALL dimensions. You cannot have low risk if vulnerability is high, even if coping capacity is strong.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tanzania's Risk Score */}
      <div className="tanzania-risk-section">
        <h2>Tanzania's INFORM Risk Score</h2>
        <p className="section-intro">
          Based on the INFORM methodology, here is Tanzania's current disaster risk profile:
        </p>

        <div className="risk-score-card">
          <div className="score-main" style={{ borderColor: TANZANIA_RISK.classificationColor }}>
            <div className="score-label">Tanzania INFORM Risk Score</div>
            <div className="score-value" style={{ color: TANZANIA_RISK.classificationColor }}>
              {TANZANIA_RISK.overall}
            </div>
            <div className="score-classification" style={{ backgroundColor: TANZANIA_RISK.classificationColor }}>
              {TANZANIA_RISK.classification}
            </div>
            <div className="score-rank">{TANZANIA_RISK.rank}</div>
          </div>

          <div className="dimensions-breakdown">
            <h4>Dimension Breakdown</h4>
            <div className="dimension-bars">
              <div className="dimension-bar">
                <div className="dimension-label">
                  <span className="dimension-icon">⚠️</span>
                  <span>Hazard and Exposure</span>
                </div>
                <div className="dimension-value-bar">
                  <div
                    className="dimension-fill hazard"
                    style={{ width: `${(TANZANIA_RISK.dimensions.hazardExposure / 10) * 100}%` }}
                  >
                    <span className="dimension-score">{TANZANIA_RISK.dimensions.hazardExposure}</span>
                  </div>
                </div>
              </div>
              <div className="dimension-bar">
                <div className="dimension-label">
                  <span className="dimension-icon">🎯</span>
                  <span>Vulnerability</span>
                </div>
                <div className="dimension-value-bar">
                  <div
                    className="dimension-fill vulnerability"
                    style={{ width: `${(TANZANIA_RISK.dimensions.vulnerability / 10) * 100}%` }}
                  >
                    <span className="dimension-score">{TANZANIA_RISK.dimensions.vulnerability}</span>
                  </div>
                </div>
              </div>
              <div className="dimension-bar">
                <div className="dimension-label">
                  <span className="dimension-icon">🛡️</span>
                  <span>Lack of Coping Capacity</span>
                </div>
                <div className="dimension-value-bar">
                  <div
                    className="dimension-fill capacity"
                    style={{ width: `${(TANZANIA_RISK.dimensions.lackCoping / 10) * 100}%` }}
                  >
                    <span className="dimension-score">{TANZANIA_RISK.dimensions.lackCoping}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="calculation-display">
              <div className="calculation-formula">
                Risk = ({TANZANIA_RISK.dimensions.hazardExposure} × {TANZANIA_RISK.dimensions.vulnerability} × {TANZANIA_RISK.dimensions.lackCoping})<sup>1/3</sup> = <strong>{TANZANIA_RISK.overall}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="context-box">
          <div className="context-icon">💡</div>
          <div className="context-text">
            <strong>What This Means:</strong> {TANZANIA_RISK.context}
          </div>
        </div>
      </div>

      {/* Risk Classification Levels */}
      <div className="classification-section">
        <h2>INFORM Risk Classification</h2>
        <p className="section-intro">
          INFORM scores range from 0 (no risk) to 10 (maximum risk), divided into five levels:
        </p>

        <div className="risk-levels-table">
          {RISK_LEVELS.map((level, idx) => (
            <div
              key={idx}
              className={`risk-level-row ${TANZANIA_RISK.classification === level.level ? 'current' : ''}`}
              style={{ borderColor: level.color }}
            >
              <div className="level-color" style={{ backgroundColor: level.color }}></div>
              <div className="level-info">
                <div className="level-name">{level.level}</div>
                <div className="level-range">{level.range}</div>
              </div>
              <div className="level-description">{level.description}</div>
              {TANZANIA_RISK.classification.includes(level.level) && (
                <div className="current-indicator">← Tanzania is here</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Section */}
      <div className="comparison-section">
        <h2>How Does Tanzania Compare?</h2>
        <div className="comparison-controls">
          <button
            className={`comparison-tab ${selectedComparison === 'regional' ? 'active' : ''}`}
            onClick={() => setSelectedComparison('regional')}
          >
            Regional Comparison
          </button>
          <button
            className={`comparison-tab ${selectedComparison === 'dimensional' ? 'active' : ''}`}
            onClick={() => setSelectedComparison('dimensional')}
          >
            Dimension Comparison
          </button>
        </div>

        {selectedComparison === 'regional' && (
          <div className="comparison-content">
            <div className="comparison-bars">
              {REGIONAL_COMPARISONS.map((item, idx) => (
                <div key={idx} className="comparison-bar-row">
                  <div className="comparison-label">{item.region}</div>
                  <div className="comparison-bar-container">
                    <div
                      className="comparison-bar-fill"
                      style={{
                        width: `${(item.score / 10) * 100}%`,
                        backgroundColor: item.color
                      }}
                    >
                      <span className="comparison-score">{item.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="comparison-insight">
              <strong>Insight:</strong> Tanzania's risk (4.2) is below the East Africa average (4.8)
              but above the Southern Africa and global averages. This reflects moderate hazard exposure
              but elevated vulnerability relative to coping capacity.
            </div>
          </div>
        )}

        {selectedComparison === 'dimensional' && (
          <div className="comparison-content">
            <div className="dimension-comparison-grid">
              {DIMENSION_COMPARISONS.map((item, idx) => (
                <div key={idx} className="dimension-comparison-card">
                  <div className="dimension-card-header" style={{ backgroundColor: item.color }}>
                    {item.dimension}
                  </div>
                  <div className="dimension-card-body">
                    <div className="dimension-score-row">
                      <span className="score-label">Tanzania:</span>
                      <span className="score-value" style={{ color: item.color }}>{item.tanzania}</span>
                    </div>
                    <div className="dimension-score-row">
                      <span className="score-label">East Africa:</span>
                      <span className="score-value">{item.eastAfrica}</span>
                    </div>
                    <div className="dimension-score-row">
                      <span className="score-label">Global:</span>
                      <span className="score-value">{item.global}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="comparison-insight">
              <strong>Key Finding:</strong> Tanzania's vulnerability (5.1) is the highest dimension,
              exceeding both regional and global averages. This indicates that addressing socio-economic
              factors and vulnerable populations should be a priority for risk reduction.
            </div>
          </div>
        )}
      </div>

      {/* Interactive Scenario Analysis */}
      <div className="scenario-section">
        <h2>🔬 Scenario Analysis: "What If?"</h2>
        <p className="section-intro">
          Explore how changes to each dimension affect overall risk. Adjust the sliders to see
          how interventions in different areas could reduce Tanzania's risk score.
        </p>

        <div className="scenario-tool">
          <div className="scenario-controls">
            <div className="scenario-slider">
              <label>
                <span className="slider-icon">⚠️</span>
                <span className="slider-label">Hazard and Exposure</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={scenarioValues.hazardExposure}
                onChange={(e) => setScenarioValues({
                  ...scenarioValues,
                  hazardExposure: parseFloat(e.target.value)
                })}
                className="slider hazard"
              />
              <span className="slider-value">{scenarioValues.hazardExposure.toFixed(1)}</span>
            </div>

            <div className="scenario-slider">
              <label>
                <span className="slider-icon">🎯</span>
                <span className="slider-label">Vulnerability</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={scenarioValues.vulnerability}
                onChange={(e) => setScenarioValues({
                  ...scenarioValues,
                  vulnerability: parseFloat(e.target.value)
                })}
                className="slider vulnerability"
              />
              <span className="slider-value">{scenarioValues.vulnerability.toFixed(1)}</span>
            </div>

            <div className="scenario-slider">
              <label>
                <span className="slider-icon">🛡️</span>
                <span className="slider-label">Lack of Coping Capacity</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={scenarioValues.lackCoping}
                onChange={(e) => setScenarioValues({
                  ...scenarioValues,
                  lackCoping: parseFloat(e.target.value)
                })}
                className="slider capacity"
              />
              <span className="slider-value">{scenarioValues.lackCoping.toFixed(1)}</span>
            </div>
          </div>

          <div className="scenario-result">
            <div className="scenario-calculation">
              <div className="scenario-formula">
                ({scenarioValues.hazardExposure.toFixed(1)} × {scenarioValues.vulnerability.toFixed(1)} × {scenarioValues.lackCoping.toFixed(1)})<sup>1/3</sup>
              </div>
              <div className="scenario-equals">=</div>
              <div
                className="scenario-risk-score"
                style={{
                  backgroundColor: scenarioLevel.color,
                  color: 'white'
                }}
              >
                {scenarioRisk}
              </div>
            </div>
            <div className="scenario-classification" style={{ color: scenarioLevel.color }}>
              {scenarioLevel.level} Risk
            </div>
            <div className="scenario-description">{scenarioLevel.description}</div>
          </div>

          <div className="scenario-examples">
            <h4>Try These Scenarios:</h4>
            <div className="scenario-buttons">
              <button
                className="scenario-preset-btn"
                onClick={() => setScenarioValues({
                  hazardExposure: 3.8,
                  vulnerability: 3.0,
                  lackCoping: 3.9
                })}
              >
                📉 Reduce Vulnerability
                <span className="preset-hint">(V: 5.1 → 3.0)</span>
              </button>
              <button
                className="scenario-preset-btn"
                onClick={() => setScenarioValues({
                  hazardExposure: 3.8,
                  vulnerability: 5.1,
                  lackCoping: 2.5
                })}
              >
                🛡️ Strengthen Coping
                <span className="preset-hint">(LCC: 3.9 → 2.5)</span>
              </button>
              <button
                className="scenario-preset-btn"
                onClick={() => setScenarioValues({
                  hazardExposure: 3.8,
                  vulnerability: 3.0,
                  lackCoping: 2.5
                })}
              >
                ✅ Combined Interventions
                <span className="preset-hint">(V & LCC both reduced)</span>
              </button>
              <button
                className="scenario-preset-btn reset"
                onClick={() => setScenarioValues({
                  hazardExposure: 3.8,
                  vulnerability: 5.1,
                  lackCoping: 3.9
                })}
              >
                🔄 Reset to Tanzania Current
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Box: Risk is Manageable */}
      <div className="teaching-box risk-manageable">
        <div className="teaching-icon">🎯</div>
        <div className="teaching-content">
          <h3>KEY EMPHASIS: Risk is MANAGEABLE, Not Fixed</h3>
          <div className="manageable-grid">
            <div className="manageable-item">
              <div className="manageable-icon">📊</div>
              <div className="manageable-text">
                <strong>Risk is Measurable</strong>
                <p>The INFORM formula provides a scientific, comparable way to quantify disaster risk</p>
              </div>
            </div>
            <div className="manageable-item">
              <div className="manageable-icon">🔍</div>
              <div className="manageable-text">
                <strong>Risk is Transparent</strong>
                <p>Every component is based on observable, verifiable indicators</p>
              </div>
            </div>
            <div className="manageable-item">
              <div className="manageable-icon">📉</div>
              <div className="manageable-text">
                <strong>Risk is Reducible</strong>
                <p>We can lower risk by addressing vulnerability and strengthening coping capacity</p>
              </div>
            </div>
            <div className="manageable-item">
              <div className="manageable-icon">🎯</div>
              <div className="manageable-text">
                <strong>Risk Guides Action</strong>
                <p>Knowing the risk score helps prioritize where to invest in disaster prevention</p>
              </div>
            </div>
          </div>
          <div className="action-pathways">
            <h4>Pathways to Reduce Tanzania's Risk:</h4>
            <div className="pathway-grid">
              <div className="pathway">
                <div className="pathway-icon">🏥</div>
                <strong>Strengthen Health Systems</strong>
                <p>Reduce vulnerability by improving maternal health, nutrition, and disease prevention</p>
              </div>
              <div className="pathway">
                <div className="pathway-icon">🏫</div>
                <strong>Expand Education</strong>
                <p>Reduce vulnerability through literacy, awareness, and understanding of risks</p>
              </div>
              <div className="pathway">
                <div className="pathway-icon">🔔</div>
                <strong>Build Early Warning</strong>
                <p>Reduce lack of coping by implementing multi-hazard early warning systems</p>
              </div>
              <div className="pathway">
                <div className="pathway-icon">🚨</div>
                <strong>Invest in Response</strong>
                <p>Reduce lack of coping through trained emergency services and infrastructure</p>
              </div>
            </div>
          </div>
          <div className="manageable-conclusion">
            <strong>Bottom Line:</strong> Disasters are NOT inevitable. By understanding and addressing
            the components of risk, Tanzania can build a safer, more resilient future. Every improvement
            in vulnerability or coping capacity directly reduces future disaster impacts.
          </div>
        </div>
      </div>

      {/* Section Summary */}
      <div className="section-summary risk-summary">
        <h3>📚 Section 6 Summary: Key Learnings</h3>
        <div className="summary-points">
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              <strong>Risk</strong> is the combination of hazard, exposure, vulnerability, and lack of coping capacity
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              The <strong>INFORM formula</strong> uses a geometric mean to ensure all dimensions matter equally
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              Tanzania's risk score is <strong>4.2 (Medium-High)</strong>, driven primarily by elevated vulnerability
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              Risk is <strong>measurable, transparent, and reducible</strong> — not random or inevitable
            </span>
          </div>
          <div className="summary-point">
            <span className="check-icon">✓</span>
            <span className="point-text">
              Scenario analysis shows how <strong>targeted interventions</strong> in vulnerability or coping capacity can significantly reduce overall risk
            </span>
          </div>
        </div>

        <div className="module-completion">
          <div className="completion-icon">🎓</div>
          <h3>Congratulations! You've Completed Module 01</h3>
          <p className="completion-message">
            You now understand the INFORM Risk Framework and how it applies to Tanzania.
            You've learned that disasters are not natural — they result from measurable,
            addressable conditions. Armed with this knowledge, you're ready to explore
            Tanzania's specific risk profile and early warning systems.
          </p>
          <div className="next-module-preview">
            <h4>🔜 What's Next?</h4>
            <p>
              <strong>Module 02: INFORM Risk Assessment</strong> — Dive into Tanzania's district-level
              risk data, explore hazard maps, and analyze vulnerability and coping capacity indicators
              across all regions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section6Risk;
