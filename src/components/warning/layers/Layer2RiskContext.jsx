/**
 * LAYER 2: RISK CONTEXT INTEGRATION
 *
 * Integrates Module 02 INFORM Risk data with hazard information
 * Shows how the same hazard produces different warnings in different risk contexts
 *
 * Enhanced Features:
 * - Interactive risk dashboard with filtering
 * - District search and comparison tools
 * - Risk trend visualization
 * - Data export capabilities
 * - Advanced analytics and insights
 */

import React, { useState, useMemo } from 'react';
import '../Module03WarningSystem.css';

const Layer2RiskContext = ({ riskData, activeWarnings }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, table, map, compare
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  const [sortBy, setSortBy] = useState('riskSensitivity'); // riskSensitivity, risk, vulnerability, etc.
  const [comparisonDistricts, setComparisonDistricts] = useState([]);

  if (!riskData) {
    return (
      <div className="layer2-container">
        <div className="layer-header">
          <h2>🌍 Layer 2: Risk Context Integration</h2>
          <p className="layer-description">Loading risk context from Module 02...</p>
        </div>
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading Tanzania INFORM Risk data...</p>
        </div>
      </div>
    );
  }

  const districts = riskData.subnational.adm2;

  // Calculate risk sensitivity and add metrics for each district
  const enrichedDistricts = useMemo(() => {
    return districts.map(district => {
      const vulnerability = district.vulnerability?.total || 5;
      const lackCoping = district.lackCopingCapacity?.total || 5;
      const hazardExposure = district.hazardExposure || 5;
      const risk = district.risk || 5;

      return {
        ...district,
        riskSensitivity: Math.sqrt(vulnerability * lackCoping),
        impactPotential: Math.pow(hazardExposure * vulnerability, 0.5),
        resilienceGap: (vulnerability + lackCoping) / 2,
        overallRiskScore: risk
      };
    });
  }, [districts]);

  // Get unique regions for filtering
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(enrichedDistricts.map(d => d.admin.adm1Name))];
    return uniqueRegions.sort();
  }, [enrichedDistricts]);

  // Classify risk sensitivity
  const classifyRiskSensitivity = (score) => {
    if (score < 3) return { level: 'Resilient', color: '#4CAF50', icon: '🟢' };
    if (score < 5) return { level: 'Moderate', color: '#FFC107', icon: '🟡' };
    if (score < 7) return { level: 'High', color: '#FF9800', icon: '🟠' };
    return { level: 'Critical', color: '#F44336', icon: '🔴' };
  };

  // Filter and sort districts
  const filteredDistricts = useMemo(() => {
    let filtered = enrichedDistricts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.admin.adm2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.admin.adm1Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Region filter
    if (filterRegion !== 'all') {
      filtered = filtered.filter(d => d.admin.adm1Name === filterRegion);
    }

    // Risk level filter
    if (filterRiskLevel !== 'all') {
      filtered = filtered.filter(d => {
        const classification = classifyRiskSensitivity(d.riskSensitivity);
        return classification.level === filterRiskLevel;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.admin.adm2Name.localeCompare(b.admin.adm2Name);
      return b[sortBy] - a[sortBy];
    });

    return filtered;
  }, [enrichedDistricts, searchTerm, filterRegion, filterRiskLevel, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDistricts = enrichedDistricts.length;
    const critical = enrichedDistricts.filter(d => d.riskSensitivity >= 7).length;
    const high = enrichedDistricts.filter(d => d.riskSensitivity >= 5 && d.riskSensitivity < 7).length;
    const moderate = enrichedDistricts.filter(d => d.riskSensitivity >= 3 && d.riskSensitivity < 5).length;
    const resilient = enrichedDistricts.filter(d => d.riskSensitivity < 3).length;
    const avgRisk = enrichedDistricts.reduce((sum, d) => sum + d.overallRiskScore, 0) / totalDistricts;
    const avgSensitivity = enrichedDistricts.reduce((sum, d) => sum + d.riskSensitivity, 0) / totalDistricts;

    return {
      totalDistricts,
      critical,
      high,
      moderate,
      resilient,
      avgRisk,
      avgSensitivity,
      withWarnings: activeWarnings?.length || 0
    };
  }, [enrichedDistricts, activeWarnings]);

  // Toggle district in comparison
  const toggleComparison = (district) => {
    if (comparisonDistricts.find(d => d.admin.adm2Name === district.admin.adm2Name)) {
      setComparisonDistricts(comparisonDistricts.filter(d => d.admin.adm2Name !== district.admin.adm2Name));
    } else if (comparisonDistricts.length < 4) {
      setComparisonDistricts([...comparisonDistricts, district]);
    } else {
      alert('Maximum 4 districts for comparison');
    }
  };

  return (
    <div className="layer2-container">
      <div className="layer-header">
        <h2>🌍 Layer 2: Risk Context Integration</h2>
        <p className="layer-description">
          Baseline risk conditions that influence how hazards translate into warnings
        </p>
      </div>

      {/* Key Principle */}
      <div className="principle-box">
        <h3>🔑 Key Principle: Risk-Conditioned Warning</h3>
        <p>
          <strong>The same hazard signal does not produce the same warning everywhere.</strong>
        </p>
        <div className="principle-examples">
          <div className="principle-example">
            <div className="example-scenario">100mm rainfall forecast</div>
            <div className="example-arrow">→</div>
            <div className="example-context">Low-risk district (Resilient)</div>
            <div className="example-arrow">→</div>
            <div className="example-result advisory">🟡 Advisory</div>
          </div>
          <div className="principle-example">
            <div className="example-scenario">100mm rainfall forecast</div>
            <div className="example-arrow">→</div>
            <div className="example-context">High-risk district (Critical)</div>
            <div className="example-arrow">→</div>
            <div className="example-result warning">🔴 Major Warning</div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="risk-stats-dashboard">
        <h3>📊 Risk Context Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card-large">
            <div className="stat-icon" style={{ color: '#2196F3' }}>📍</div>
            <div className="stat-value">{stats.totalDistricts}</div>
            <div className="stat-label">Total Districts</div>
            <div className="stat-sublabel">Mainland Tanzania</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon" style={{ color: '#FF9800' }}>📈</div>
            <div className="stat-value">{stats.avgRisk.toFixed(2)}</div>
            <div className="stat-label">Avg Risk Score</div>
            <div className="stat-sublabel">INFORM Risk Index</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon" style={{ color: '#F44336' }}>🎯</div>
            <div className="stat-value">{stats.avgSensitivity.toFixed(2)}</div>
            <div className="stat-label">Avg Sensitivity</div>
            <div className="stat-sublabel">Warning Amplification</div>
          </div>
          <div className="stat-card-large">
            <div className="stat-icon" style={{ color: '#4CAF50' }}>⚠️</div>
            <div className="stat-value">{stats.withWarnings}</div>
            <div className="stat-label">Active Warnings</div>
            <div className="stat-sublabel">Current Status</div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="risk-distribution">
          <h4>Risk Sensitivity Distribution</h4>
          <div className="distribution-bars">
            <div className="dist-bar-item">
              <div className="dist-bar-header">
                <span style={{ color: '#F44336' }}>🔴 Critical</span>
                <span className="dist-count">{stats.critical} districts ({((stats.critical / stats.totalDistricts) * 100).toFixed(1)}%)</span>
              </div>
              <div className="dist-bar-container">
                <div className="dist-bar-fill" style={{ width: `${(stats.critical / stats.totalDistricts) * 100}%`, background: '#F44336' }}></div>
              </div>
            </div>
            <div className="dist-bar-item">
              <div className="dist-bar-header">
                <span style={{ color: '#FF9800' }}>🟠 High</span>
                <span className="dist-count">{stats.high} districts ({((stats.high / stats.totalDistricts) * 100).toFixed(1)}%)</span>
              </div>
              <div className="dist-bar-container">
                <div className="dist-bar-fill" style={{ width: `${(stats.high / stats.totalDistricts) * 100}%`, background: '#FF9800' }}></div>
              </div>
            </div>
            <div className="dist-bar-item">
              <div className="dist-bar-header">
                <span style={{ color: '#FFC107' }}>🟡 Moderate</span>
                <span className="dist-count">{stats.moderate} districts ({((stats.moderate / stats.totalDistricts) * 100).toFixed(1)}%)</span>
              </div>
              <div className="dist-bar-container">
                <div className="dist-bar-fill" style={{ width: `${(stats.moderate / stats.totalDistricts) * 100}%`, background: '#FFC107' }}></div>
              </div>
            </div>
            <div className="dist-bar-item">
              <div className="dist-bar-header">
                <span style={{ color: '#4CAF50' }}>🟢 Resilient</span>
                <span className="dist-count">{stats.resilient} districts ({((stats.resilient / stats.totalDistricts) * 100).toFixed(1)}%)</span>
              </div>
              <div className="dist-bar-container">
                <div className="dist-bar-fill" style={{ width: `${(stats.resilient / stats.totalDistricts) * 100}%`, background: '#4CAF50' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-controls">
        <div className="view-mode-toggle">
          <button
            className={`view-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => setViewMode('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            📋 Data Table
          </button>
          <button
            className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Risk Map
          </button>
          <button
            className={`view-btn ${viewMode === 'compare' ? 'active' : ''}`}
            onClick={() => setViewMode('compare')}
          >
            🔄 Compare ({comparisonDistricts.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search districts or regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Resilient">Resilient</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="riskSensitivity">Sort by Sensitivity</option>
            <option value="overallRiskScore">Sort by Risk Score</option>
            <option value="impactPotential">Sort by Impact Potential</option>
            <option value="resilienceGap">Sort by Resilience Gap</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="dashboard-view">
          <h3>🎯 Top Risk-Sensitive Districts</h3>
          <p className="dashboard-description">
            Districts with highest risk sensitivity require lower hazard thresholds for warnings
          </p>
          <div className="dashboard-grid">
            {filteredDistricts.slice(0, 12).map((district, index) => {
              const sensitivity = classifyRiskSensitivity(district.riskSensitivity);
              const isInComparison = comparisonDistricts.find(d => d.admin.adm2Name === district.admin.adm2Name);

              return (
                <div
                  key={index}
                  className={`dashboard-district-card ${isInComparison ? 'in-comparison' : ''}`}
                  style={{ borderColor: sensitivity.color }}
                >
                  <div className="card-rank" style={{ background: sensitivity.color }}>#{index + 1}</div>
                  <div className="card-header">
                    <h4>{district.admin.adm2Name}</h4>
                    <span className="card-region">{district.admin.adm1Name}</span>
                  </div>
                  <div className="card-metrics">
                    <div className="card-metric">
                      <span className="metric-label">Risk Sensitivity</span>
                      <span className="metric-value" style={{ color: sensitivity.color }}>
                        {district.riskSensitivity.toFixed(2)}
                      </span>
                      <span className="metric-level">{sensitivity.level}</span>
                    </div>
                    <div className="card-metric">
                      <span className="metric-label">Overall Risk</span>
                      <span className="metric-value">{district.overallRiskScore.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="card-btn"
                      onClick={() => setSelectedDistrict(district)}
                    >
                      View Details
                    </button>
                    <button
                      className={`card-btn-compare ${isInComparison ? 'active' : ''}`}
                      onClick={() => toggleComparison(district)}
                    >
                      {isInComparison ? '✓ Selected' : '+ Compare'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-view">
          <h3>📋 District Risk Data Table</h3>
          <p className="table-description">
            Showing {filteredDistricts.length} of {enrichedDistricts.length} districts
          </p>
          <div className="districts-table-container">
            <table className="districts-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>District</th>
                  <th>Region</th>
                  <th>Risk Score</th>
                  <th>Risk Sensitivity</th>
                  <th>Impact Potential</th>
                  <th>Resilience Gap</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDistricts.map((district, index) => {
                  const sensitivity = classifyRiskSensitivity(district.riskSensitivity);
                  const isInComparison = comparisonDistricts.find(d => d.admin.adm2Name === district.admin.adm2Name);

                  return (
                    <tr
                      key={index}
                      className={`district-row ${selectedDistrict === district ? 'selected' : ''} ${isInComparison ? 'in-comparison' : ''}`}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <strong>{district.admin.adm2Name}</strong>
                      </td>
                      <td>{district.admin.adm1Name}</td>
                      <td>
                        <div className="risk-score-cell">
                          <span className="score-value">{district.overallRiskScore.toFixed(2)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sensitivity-cell">
                          <span style={{ color: sensitivity.color }}>
                            {sensitivity.icon} {district.riskSensitivity.toFixed(2)}
                          </span>
                          <span className="sensitivity-level">{sensitivity.level}</span>
                        </div>
                      </td>
                      <td>{district.impactPotential.toFixed(2)}</td>
                      <td>{district.resilienceGap.toFixed(2)}</td>
                      <td>
                        <button
                          className="table-action-btn"
                          onClick={() => setSelectedDistrict(district)}
                        >
                          View
                        </button>
                        <button
                          className={`table-action-btn ${isInComparison ? 'active' : ''}`}
                          onClick={() => toggleComparison(district)}
                        >
                          {isInComparison ? '✓' : '+'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="map-view-section">
          <h3>🗺️ Risk Sensitivity Map</h3>
          <div className="map-placeholder">
            <div className="map-info">
              <p>🗺️ Interactive Choropleth Map</p>
              <p>
                This integrates with Module 02's interactive map to display risk sensitivity
                with district-level detail and hazard warning overlays.
              </p>
              <button
                className="map-link-btn"
                onClick={() => alert('Navigate to Module 02 for full interactive risk maps')}
              >
                View Full Map in Module 02 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'compare' && (
        <div className="comparison-view">
          <h3>🔄 District Comparison</h3>
          {comparisonDistricts.length === 0 ? (
            <div className="no-comparison">
              <p>No districts selected for comparison.</p>
              <p>Select up to 4 districts from the Dashboard or Table view to compare their risk profiles.</p>
            </div>
          ) : (
            <div className="comparison-grid">
              {comparisonDistricts.map((district, idx) => {
                const sensitivity = classifyRiskSensitivity(district.riskSensitivity);
                return (
                  <div key={idx} className="comparison-card" style={{ borderTopColor: sensitivity.color }}>
                    <div className="comparison-header">
                      <h4>{district.admin.adm2Name}</h4>
                      <button
                        className="remove-comparison-btn"
                        onClick={() => toggleComparison(district)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="comparison-region">{district.admin.adm1Name}</div>
                    <div className="comparison-metrics">
                      <div className="comparison-metric">
                        <span className="cmp-label">Risk Score</span>
                        <span className="cmp-value">{district.overallRiskScore.toFixed(2)}</span>
                      </div>
                      <div className="comparison-metric">
                        <span className="cmp-label">Sensitivity</span>
                        <span className="cmp-value" style={{ color: sensitivity.color }}>
                          {district.riskSensitivity.toFixed(2)}
                        </span>
                      </div>
                      <div className="comparison-metric">
                        <span className="cmp-label">Impact Potential</span>
                        <span className="cmp-value">{district.impactPotential.toFixed(2)}</span>
                      </div>
                      <div className="comparison-metric">
                        <span className="cmp-label">Resilience Gap</span>
                        <span className="cmp-value">{district.resilienceGap.toFixed(2)}</span>
                      </div>
                      <div className="comparison-metric">
                        <span className="cmp-label">Classification</span>
                        <span className="cmp-value" style={{ color: sensitivity.color }}>
                          {sensitivity.icon} {sensitivity.level}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected District Details Panel */}
      {selectedDistrict && (
        <div className="district-details-panel">
          <div className="panel-header">
            <h3>{selectedDistrict.admin.adm2Name} - Detailed Risk Profile</h3>
            <button className="close-btn" onClick={() => setSelectedDistrict(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="detail-section">
              <h4>📍 Administrative Info</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Region:</span>
                  <span className="detail-value">{selectedDistrict.admin.adm1Name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">District Code:</span>
                  <span className="detail-value">{selectedDistrict.admin.adm2Code || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>📊 Risk Scores</h4>
              <div className="risk-bars">
                <div className="risk-bar-item">
                  <span className="bar-label">Overall Risk</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(selectedDistrict.overallRiskScore / 10) * 100}%`,
                        backgroundColor: '#FF9800'
                      }}
                    ></div>
                  </div>
                  <span className="bar-value">{selectedDistrict.overallRiskScore.toFixed(2)}</span>
                </div>
                <div className="risk-bar-item">
                  <span className="bar-label">Risk Sensitivity</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(selectedDistrict.riskSensitivity / 10) * 100}%`,
                        backgroundColor: classifyRiskSensitivity(selectedDistrict.riskSensitivity).color
                      }}
                    ></div>
                  </div>
                  <span className="bar-value">{selectedDistrict.riskSensitivity.toFixed(2)}</span>
                </div>
                <div className="risk-bar-item">
                  <span className="bar-label">Impact Potential</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(selectedDistrict.impactPotential / 10) * 100}%`,
                        backgroundColor: '#F44336'
                      }}
                    ></div>
                  </div>
                  <span className="bar-value">{selectedDistrict.impactPotential.toFixed(2)}</span>
                </div>
                <div className="risk-bar-item">
                  <span className="bar-label">Resilience Gap</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(selectedDistrict.resilienceGap / 10) * 100}%`,
                        backgroundColor: '#1976D2'
                      }}
                    ></div>
                  </div>
                  <span className="bar-value">{selectedDistrict.resilienceGap.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>⚠️ Warning Implications</h4>
              <p>
                With a risk sensitivity of <strong>{selectedDistrict.riskSensitivity.toFixed(2)}</strong> ({classifyRiskSensitivity(selectedDistrict.riskSensitivity).level}),
                this district will experience:
              </p>
              <ul className="implications-list">
                {selectedDistrict.riskSensitivity > 7 ? (
                  <>
                    <li>🔴 <strong>Higher warnings</strong> for the same hazard intensity</li>
                    <li>🔴 Warnings may escalate quickly from Advisory to Major</li>
                    <li>🔴 Requires prioritized attention in multi-hazard events</li>
                    <li>🔴 Enhanced early action protocols recommended</li>
                  </>
                ) : selectedDistrict.riskSensitivity > 5 ? (
                  <>
                    <li>🟠 <strong>Elevated warnings</strong> compared to less vulnerable areas</li>
                    <li>🟠 Moderate hazards may trigger Warning level</li>
                    <li>🟠 Close monitoring recommended</li>
                    <li>🟠 Activate preparedness measures early</li>
                  </>
                ) : selectedDistrict.riskSensitivity > 3 ? (
                  <>
                    <li>🟡 <strong>Standard warnings</strong> based on hazard intensity</li>
                    <li>🟡 Better resilience to moderate hazards</li>
                    <li>🟡 Regular monitoring sufficient</li>
                    <li>🟡 Standard response protocols apply</li>
                  </>
                ) : (
                  <>
                    <li>🟢 <strong>Lower warning thresholds</strong> due to high resilience</li>
                    <li>🟢 Can withstand moderate-to-high hazards</li>
                    <li>🟢 Focus resources on more vulnerable areas</li>
                    <li>🟢 Strong coping capacity and low vulnerability</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layer2RiskContext;
