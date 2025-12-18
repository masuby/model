/**
 * REGIONAL DATA VIEW TAB
 * Shows regional data for Admin, PMO, and Regional Officers
 */

import React, { useState, useEffect } from 'react';
import { USER_ROLES, REGIONS } from '../../../services/authService';
import './TabStyles.css';

function RegionalDataView({ user, regions: regionList, districts }) {
  const [selectedRegion, setSelectedRegion] = useState(user?.region || '');
  const [regionData, setRegionData] = useState(null);
  const [districtData, setDistrictData] = useState([]);
  const [activeView, setActiveView] = useState('overview');

  // Filter regions based on user role
  const getAccessibleRegions = () => {
    if (user?.role === USER_ROLES.REGIONAL_OFFICER && user.region) {
      return [user.region];
    }
    return REGIONS;
  };

  useEffect(() => {
    if (selectedRegion) {
      loadRegionData(selectedRegion);
    }
  }, [selectedRegion]);

  const loadRegionData = (region) => {
    // Mock regional data
    const mockData = {
      name: region,
      population: Math.floor(Math.random() * 2000000) + 500000,
      area: Math.floor(Math.random() * 50000) + 10000,
      districts: Math.floor(Math.random() * 10) + 4,
      riskLevel: ['Low', 'Medium', 'High', 'Very High'][Math.floor(Math.random() * 4)],
      indicators: {
        hazardExposure: (Math.random() * 8 + 2).toFixed(2),
        vulnerability: (Math.random() * 8 + 2).toFixed(2),
        copingCapacity: (Math.random() * 8 + 2).toFixed(2),
        overallRisk: (Math.random() * 8 + 2).toFixed(2)
      },
      recentSubmissions: 5,
      activeWarnings: Math.floor(Math.random() * 3),
      lastUpdated: new Date().toISOString()
    };
    setRegionData(mockData);

    // Mock district data
    const mockDistricts = [
      { name: 'District A', population: 150000, riskLevel: 'Medium', lastUpdate: new Date().toISOString() },
      { name: 'District B', population: 220000, riskLevel: 'High', lastUpdate: new Date().toISOString() },
      { name: 'District C', population: 180000, riskLevel: 'Low', lastUpdate: new Date().toISOString() },
      { name: 'District D', population: 95000, riskLevel: 'Medium', lastUpdate: new Date().toISOString() }
    ];
    setDistrictData(mockDistricts);
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'very low': return '#22c55e';
      case 'low': return '#84cc16';
      case 'medium': return '#eab308';
      case 'high': return '#f97316';
      case 'very high': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="tab-content regional-data-view">
      <div className="tab-header">
        <h3>Regional Data</h3>
        <div className="region-selector">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            disabled={user?.role === USER_ROLES.REGIONAL_OFFICER && user.region}
          >
            <option value="">Select a region...</option>
            {getAccessibleRegions().map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedRegion ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <p>Select a region to view data</p>
        </div>
      ) : (
        <>
          <div className="view-tabs">
            <button
              className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
            <button
              className={`view-tab ${activeView === 'districts' ? 'active' : ''}`}
              onClick={() => setActiveView('districts')}
            >
              Districts
            </button>
            <button
              className={`view-tab ${activeView === 'indicators' ? 'active' : ''}`}
              onClick={() => setActiveView('indicators')}
            >
              Risk Indicators
            </button>
            <button
              className={`view-tab ${activeView === 'trends' ? 'active' : ''}`}
              onClick={() => setActiveView('trends')}
            >
              Trends
            </button>
          </div>

          {activeView === 'overview' && regionData && (
            <div className="region-overview">
              <div className="region-header">
                <h4>{regionData.name} Region</h4>
                <span
                  className="risk-indicator"
                  style={{ backgroundColor: getRiskColor(regionData.riskLevel) }}
                >
                  {regionData.riskLevel} Risk
                </span>
              </div>

              <div className="region-stats-grid">
                <div className="region-stat">
                  <span className="stat-icon">👥</span>
                  <span className="stat-value">{regionData.population?.toLocaleString()}</span>
                  <span className="stat-label">Population</span>
                </div>
                <div className="region-stat">
                  <span className="stat-icon">📍</span>
                  <span className="stat-value">{regionData.districts}</span>
                  <span className="stat-label">Districts</span>
                </div>
                <div className="region-stat">
                  <span className="stat-icon">📐</span>
                  <span className="stat-value">{regionData.area?.toLocaleString()} km²</span>
                  <span className="stat-label">Area</span>
                </div>
                <div className="region-stat">
                  <span className="stat-icon">⚠️</span>
                  <span className="stat-value">{regionData.activeWarnings}</span>
                  <span className="stat-label">Active Warnings</span>
                </div>
              </div>

              <div className="risk-summary">
                <h5>INFORM Risk Summary</h5>
                <div className="risk-bars">
                  <div className="risk-bar-item">
                    <span className="bar-label">Hazard & Exposure</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill hazard"
                        style={{ width: `${regionData.indicators.hazardExposure * 10}%` }}
                      />
                    </div>
                    <span className="bar-value">{regionData.indicators.hazardExposure}</span>
                  </div>
                  <div className="risk-bar-item">
                    <span className="bar-label">Vulnerability</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill vulnerability"
                        style={{ width: `${regionData.indicators.vulnerability * 10}%` }}
                      />
                    </div>
                    <span className="bar-value">{regionData.indicators.vulnerability}</span>
                  </div>
                  <div className="risk-bar-item">
                    <span className="bar-label">Lack of Coping Capacity</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill coping"
                        style={{ width: `${regionData.indicators.copingCapacity * 10}%` }}
                      />
                    </div>
                    <span className="bar-value">{regionData.indicators.copingCapacity}</span>
                  </div>
                  <div className="risk-bar-item overall">
                    <span className="bar-label">Overall Risk Index</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill overall"
                        style={{ width: `${regionData.indicators.overallRisk * 10}%` }}
                      />
                    </div>
                    <span className="bar-value">{regionData.indicators.overallRisk}</span>
                  </div>
                </div>
              </div>

              <div className="region-meta">
                <p>Last Updated: {new Date(regionData.lastUpdated).toLocaleString()}</p>
                <p>Recent Submissions: {regionData.recentSubmissions}</p>
              </div>
            </div>
          )}

          {activeView === 'districts' && (
            <div className="districts-view">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Population</th>
                    <th>Risk Level</th>
                    <th>Last Update</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {districtData.map((district, idx) => (
                    <tr key={idx}>
                      <td>{district.name}</td>
                      <td>{district.population?.toLocaleString()}</td>
                      <td>
                        <span
                          className="risk-badge"
                          style={{ backgroundColor: getRiskColor(district.riskLevel), color: 'white' }}
                        >
                          {district.riskLevel}
                        </span>
                      </td>
                      <td>{new Date(district.lastUpdate).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-small">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'indicators' && regionData && (
            <div className="indicators-view">
              <div className="indicator-category">
                <h5>Hazard & Exposure</h5>
                <div className="indicator-list">
                  <div className="indicator-item">
                    <span>Natural Hazards</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                  <div className="indicator-item">
                    <span>Human Hazards</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                  <div className="indicator-item">
                    <span>Exposure</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="indicator-category">
                <h5>Vulnerability</h5>
                <div className="indicator-list">
                  <div className="indicator-item">
                    <span>Socio-Economic</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                  <div className="indicator-item">
                    <span>Vulnerable Groups</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="indicator-category">
                <h5>Lack of Coping Capacity</h5>
                <div className="indicator-list">
                  <div className="indicator-item">
                    <span>Infrastructure</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                  <div className="indicator-item">
                    <span>Institutional</span>
                    <span className="indicator-value">{(Math.random() * 8 + 2).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'trends' && (
            <div className="trends-view">
              <div className="trend-placeholder">
                <div className="trend-icon">📈</div>
                <h5>Risk Trend Analysis</h5>
                <p>Historical trends for {selectedRegion} Region</p>
                <div className="mock-chart">
                  <div className="chart-bars">
                    {[65, 72, 68, 75, 70, 78, 82, 79, 85, 80, 88, 84].map((val, idx) => (
                      <div
                        key={idx}
                        className="chart-bar"
                        style={{ height: `${val}%` }}
                        title={`Month ${idx + 1}: ${val}%`}
                      />
                    ))}
                  </div>
                  <div className="chart-labels">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                    <span>Nov</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RegionalDataView;
