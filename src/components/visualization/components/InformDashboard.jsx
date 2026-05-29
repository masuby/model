/**
 * INFORM Risk Profile Dashboard
 * Comprehensive dashboard showing all INFORM dimensions and visualizations
 * Following international humanitarian data visualization standards
 */
import React, { useState, useEffect, useMemo } from 'react';
import DimensionCards from './DimensionCards';
import InformSunburst from './InformSunburst';
import InformChoroplethMap from './InformChoroplethMap';
import InformRadarChart from './InformRadarChart';
import {
  INFORM_FRAMEWORK,
  getRiskClass,
  INFORM_COLORS,
  getDimensionSummary
} from '../../../config/informFramework';
import './InformDashboard.css';

// Risk ranking table component
const RiskRankingTable = ({ data, selectedColumn = 'RISK', onRowClick, limit = 10 }) => {
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data]
      .filter(row => row[selectedColumn] !== undefined && !isNaN(parseFloat(row[selectedColumn])))
      .sort((a, b) => parseFloat(b[selectedColumn]) - parseFloat(a[selectedColumn]))
      .slice(0, limit);
  }, [data, selectedColumn, limit]);

  return (
    <div className="risk-ranking-table">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>District</th>
            <th>Region</th>
            <th>Risk</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => {
            const value = parseFloat(row[selectedColumn]);
            const riskClass = getRiskClass(value);
            return (
              <tr
                key={row.ADM2_PCODE || index}
                onClick={() => onRowClick && onRowClick(row.ADM2_NAME)}
                className="clickable"
              >
                <td className="rank">{index + 1}</td>
                <td className="district">{row.ADM2_NAME}</td>
                <td className="region">{row.ADM1_NAME}</td>
                <td className="value" style={{ color: riskClass?.color }}>
                  {value.toFixed(2)}
                </td>
                <td>
                  <span
                    className="level-badge"
                    style={{ backgroundColor: riskClass?.color }}
                  >
                    {riskClass?.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Quick stats summary
const QuickStats = ({ data }) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const riskValues = data
      .map(row => parseFloat(row.RISK))
      .filter(v => !isNaN(v));

    if (riskValues.length === 0) return null;

    const avg = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;
    const max = Math.max(...riskValues);
    const min = Math.min(...riskValues);

    const highRiskCount = riskValues.filter(v => v >= 5.0).length;
    const veryHighRiskCount = riskValues.filter(v => v >= 6.5).length;

    const maxRow = data.find(row => parseFloat(row.RISK) === max);
    const minRow = data.find(row => parseFloat(row.RISK) === min);

    return {
      totalAreas: data.length,
      avgRisk: avg,
      maxRisk: max,
      minRisk: min,
      maxArea: maxRow?.ADM2_NAME,
      minArea: minRow?.ADM2_NAME,
      highRiskCount,
      veryHighRiskCount,
      highRiskPercent: ((highRiskCount / data.length) * 100).toFixed(1)
    };
  }, [data]);

  if (!stats) return null;

  return (
    <div className="quick-stats">
      <div className="stat-card">
        <span className="stat-number">{stats.totalAreas}</span>
        <span className="stat-label">Districts Analyzed</span>
      </div>
      <div className="stat-card">
        <span className="stat-number" style={{ color: getRiskClass(stats.avgRisk)?.color }}>
          {stats.avgRisk.toFixed(2)}
        </span>
        <span className="stat-label">Average Risk</span>
      </div>
      <div className="stat-card highlight-danger">
        <span className="stat-number">{stats.veryHighRiskCount}</span>
        <span className="stat-label">Very High Risk Areas</span>
      </div>
      <div className="stat-card highlight-warning">
        <span className="stat-number">{stats.highRiskPercent}%</span>
        <span className="stat-label">High+ Risk Coverage</span>
      </div>
      <div className="stat-card">
        <span className="stat-number" style={{ color: INFORM_COLORS.risk.veryHigh }}>
          {stats.maxRisk.toFixed(2)}
        </span>
        <span className="stat-label">Highest: {stats.maxArea}</span>
      </div>
      <div className="stat-card">
        <span className="stat-number" style={{ color: INFORM_COLORS.risk.veryLow }}>
          {stats.minRisk.toFixed(2)}
        </span>
        <span className="stat-label">Lowest: {stats.minArea}</span>
      </div>
    </div>
  );
};

function InformDashboard({
  data,
  adm1GeoJson,
  adm2GeoJson,
  isOpen,
  onClose
}) {
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [comparisonAreas, setComparisonAreas] = useState([]);

  // Handle area selection from map or table
  const handleAreaSelect = (areaName, areaData) => {
    setSelectedArea(areaName);
    if (!comparisonAreas.includes(areaName)) {
      setComparisonAreas(prev => [...prev, areaName].slice(-4));
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedArea(null);
  };

  if (!isOpen) return null;

  return (
    <div className="inform-dashboard-modal">
      <div className="inform-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1>INFORM Risk Profile Dashboard</h1>
              <p className="subtitle">Tanzania Subnational Risk Analysis - SADC 2024</p>
            </div>
            <div className="header-right">
              {selectedArea && (
                <div className="selected-area-indicator">
                  <span>Selected: <strong>{selectedArea}</strong></span>
                  <button onClick={handleClearSelection}>Clear</button>
                </div>
              )}
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>

          <nav className="dashboard-tabs">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={activeTab === 'map' ? 'active' : ''}
              onClick={() => setActiveTab('map')}
            >
              Map View
            </button>
            <button
              className={activeTab === 'compare' ? 'active' : ''}
              onClick={() => setActiveTab('compare')}
            >
              Compare
            </button>
            <button
              className={activeTab === 'framework' ? 'active' : ''}
              onClick={() => setActiveTab('framework')}
            >
              Framework
            </button>
            <button
              className={activeTab === 'ranking' ? 'active' : ''}
              onClick={() => setActiveTab('ranking')}
            >
              Rankings
            </button>
          </nav>
        </header>

        <main className="dashboard-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content overview-tab">
              <QuickStats data={data} />

              <div className="overview-grid">
                <div className="grid-item dimension-section">
                  <DimensionCards
                    data={data}
                    selectedArea={selectedArea}
                    onDimensionClick={(dim) => console.log('Dimension clicked:', dim)}
                  />
                </div>

                <div className="grid-item map-section">
                  <h3>Risk Distribution Map</h3>
                  <div className="map-container-preview">
                    <InformChoroplethMap
                      data={data}
                      adm1GeoJson={adm1GeoJson}
                      adm2GeoJson={adm2GeoJson}
                      onAreaSelect={handleAreaSelect}
                      isMiniature={true}
                    />
                  </div>
                  <button
                    className="view-full-btn"
                    onClick={() => setActiveTab('map')}
                  >
                    View Full Map
                  </button>
                </div>

                <div className="grid-item ranking-section">
                  <h3>Highest Risk Districts</h3>
                  <RiskRankingTable
                    data={data}
                    limit={5}
                    onRowClick={handleAreaSelect}
                  />
                  <button
                    className="view-full-btn"
                    onClick={() => setActiveTab('ranking')}
                  >
                    View All Rankings
                  </button>
                </div>

                <div className="grid-item radar-section">
                  <h3>Dimension Profile</h3>
                  <div className="radar-preview">
                    <InformRadarChart
                      data={data}
                      selectedAreas={selectedArea ? [selectedArea] : []}
                      isMiniature={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === 'map' && (
            <div className="tab-content map-tab">
              <InformChoroplethMap
                data={data}
                adm1GeoJson={adm1GeoJson}
                adm2GeoJson={adm2GeoJson}
                onAreaSelect={handleAreaSelect}
              />
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div className="tab-content compare-tab">
              <div className="compare-layout">
                <div className="radar-full">
                  <InformRadarChart
                    data={data}
                    selectedAreas={comparisonAreas}
                    onAreaChange={setComparisonAreas}
                  />
                </div>

                {comparisonAreas.length > 0 && (
                  <div className="comparison-cards">
                    {comparisonAreas.map(area => {
                      const areaData = data?.find(row => row.ADM2_NAME === area);
                      const summary = getDimensionSummary(areaData);
                      return (
                        <div key={area} className="comparison-card">
                          <h4>{area}</h4>
                          {summary && (
                            <div className="card-values">
                              <div className="value-row main">
                                <span>RISK</span>
                                <span style={{ color: summary.risk.class?.color }}>
                                  {summary.risk.value?.toFixed(2)}
                                </span>
                              </div>
                              <div className="value-row">
                                <span>Hazard</span>
                                <span>{summary.hazard.value?.toFixed(2)}</span>
                              </div>
                              <div className="value-row">
                                <span>Vulnerability</span>
                                <span>{summary.vulnerability.value?.toFixed(2)}</span>
                              </div>
                              <div className="value-row">
                                <span>Coping</span>
                                <span>{summary.copingCapacity.value?.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Framework Tab */}
          {activeTab === 'framework' && (
            <div className="tab-content framework-tab">
              <div className="framework-layout">
                <div className="sunburst-section">
                  <InformSunburst
                    data={data}
                    selectedArea={selectedArea}
                    onNodeClick={(node) => console.log('Node clicked:', node)}
                  />
                </div>

                <div className="framework-info">
                  <h3>INFORM Methodology</h3>
                  <p>
                    The INFORM Risk Index is a composite indicator that identifies
                    countries and subnational areas at risk of humanitarian crisis
                    and disaster.
                  </p>

                  <div className="formula-section">
                    <h4>Calculation Formula</h4>
                    <div className="formula">
                      RISK = (Hazard × Vulnerability × Lack of Coping Capacity)<sup>1/3</sup>
                    </div>
                    <p className="formula-note">
                      The geometric mean ensures that high values in one dimension
                      cannot fully compensate for low values in others.
                    </p>
                  </div>

                  <div className="dimensions-list">
                    <h4>Dimensions</h4>
                    <ul>
                      <li>
                        <strong style={{ color: INFORM_COLORS.dimensions.hazard }}>
                          Hazard and Exposure
                        </strong>
                        : Natural and human-induced events that may trigger a crisis
                      </li>
                      <li>
                        <strong style={{ color: INFORM_COLORS.dimensions.vulnerability }}>
                          Vulnerability
                        </strong>
                        : Conditions increasing susceptibility to crisis impacts
                      </li>
                      <li>
                        <strong style={{ color: INFORM_COLORS.dimensions.copingCapacity }}>
                          Lack of Coping Capacity
                        </strong>
                        : Insufficient ability to cope with and recover from crises
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings Tab */}
          {activeTab === 'ranking' && (
            <div className="tab-content ranking-tab">
              <div className="ranking-header">
                <h3>District Risk Rankings</h3>
                <p>Click on any row to view detailed profile</p>
              </div>
              <RiskRankingTable
                data={data}
                limit={50}
                onRowClick={handleAreaSelect}
              />
            </div>
          )}
        </main>

        <footer className="dashboard-footer">
          <div className="footer-left">
            <span>Data: INFORM SADC 2024</span>
            <span>|</span>
            <span>Methodology: INFORM Risk Index v2024</span>
          </div>
          <div className="footer-right">
            <span>Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default InformDashboard;
