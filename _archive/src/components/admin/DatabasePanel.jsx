/**
 * DATABASE ADMIN PANEL
 *
 * Component for viewing database status, statistics,
 * and managing data within the INFORM Tanzania system.
 */

import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import './DatabasePanel.css';

function DatabasePanel() {
  const {
    isReady,
    isLoading,
    error,
    stats,
    getRegions,
    getDistricts,
    getAllRiskData,
    getWarningStats,
    getDatabaseHealth,
    refreshStats
  } = useDatabase();

  const [activeTab, setActiveTab] = useState('overview');
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [warningStats, setWarningStats] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);

  const loadData = () => {
    setRegions(getRegions());
    setDistricts(getDistricts());
    setRiskData(getAllRiskData(2024));
    setWarningStats(getWarningStats());
    setHealth(getDatabaseHealth());
    refreshStats();
  };

  if (isLoading) {
    return (
      <div className="database-panel loading">
        <div className="loading-spinner"></div>
        <p>Initializing database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="database-panel error">
        <div className="error-icon">Error</div>
        <h3>Database Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="panel-section overview-section">
      <h3>Database Overview</h3>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">Location</div>
          <div className="stat-value">{regions.length}</div>
          <div className="stat-label">Regions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Map</div>
          <div className="stat-value">{districts.length}</div>
          <div className="stat-label">Districts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Chart</div>
          <div className="stat-value">{riskData.length}</div>
          <div className="stat-label">Risk Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Alert</div>
          <div className="stat-value">{warningStats?.total || 0}</div>
          <div className="stat-label">Warnings</div>
        </div>
      </div>

      {health && (
        <div className="health-status">
          <h4>Database Health</h4>
          <div className={`status-badge ${health.status}`}>
            {health.status.toUpperCase()}
          </div>
          <div className="health-details">
            <p><strong>Version:</strong> {health.version}</p>
            <p><strong>Total Records:</strong> {health.totalRecords}</p>
            <p><strong>Created:</strong> {new Date(health.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="tables-overview">
        <h4>Table Statistics</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Records</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {health?.tables.map(table => (
              <tr key={table.name}>
                <td>{table.name.replace(/_/g, ' ')}</td>
                <td>{table.records}</td>
                <td>
                  <span className={`table-status ${table.status}`}>
                    {table.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRegions = () => (
    <div className="panel-section regions-section">
      <h3>Tanzania Regions ({regions.length})</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Region</th>
            <th>Code</th>
            <th>Population</th>
            <th>Area (km2)</th>
          </tr>
        </thead>
        <tbody>
          {regions.map(region => (
            <tr key={region.id}>
              <td>{region.adm1_name}</td>
              <td>{region.adm1_code}</td>
              <td>{region.population?.toLocaleString() || '-'}</td>
              <td>{region.area_km2?.toLocaleString() || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDistricts = () => (
    <div className="panel-section districts-section">
      <h3>Tanzania Districts ({districts.length})</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Region</th>
            <th>Code</th>
            <th>Population</th>
          </tr>
        </thead>
        <tbody>
          {districts.slice(0, 50).map(district => (
            <tr key={district.id}>
              <td>{district.adm2_name}</td>
              <td>{district.adm1_name}</td>
              <td>{district.adm2_code}</td>
              <td>{district.population?.toLocaleString() || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {districts.length > 50 && (
        <p className="more-records">Showing 50 of {districts.length} districts</p>
      )}
    </div>
  );

  const renderRiskData = () => (
    <div className="panel-section risk-section">
      <h3>Risk Indicators ({riskData.length})</h3>
      <div className="risk-summary">
        <div className="risk-class-summary">
          {['Very Low', 'Low', 'Medium', 'High', 'Very High'].map(riskClass => {
            const count = riskData.filter(r => r.risk_class === riskClass).length;
            return (
              <div key={riskClass} className={`risk-class-item ${riskClass.toLowerCase().replace(' ', '-')}`}>
                <span className="class-count">{count}</span>
                <span className="class-label">{riskClass}</span>
              </div>
            );
          })}
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Admin Unit</th>
            <th>Hazard</th>
            <th>Vulnerability</th>
            <th>LCC</th>
            <th>Risk Index</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {riskData.slice(0, 30).map(risk => (
            <tr key={risk.id}>
              <td>{risk.admin_unit_id}</td>
              <td>{risk.hazard_exposure_total?.toFixed(2) || '-'}</td>
              <td>{risk.vulnerability_total?.toFixed(2) || '-'}</td>
              <td>{risk.lack_coping_capacity_total?.toFixed(2) || '-'}</td>
              <td><strong>{risk.risk_index?.toFixed(2) || '-'}</strong></td>
              <td>
                <span className={`risk-badge ${risk.risk_class?.toLowerCase().replace(' ', '-')}`}>
                  {risk.risk_class || '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {riskData.length > 30 && (
        <p className="more-records">Showing 30 of {riskData.length} records</p>
      )}
    </div>
  );

  const renderFormulas = () => (
    <div className="panel-section formulas-section">
      <h3>INFORM Risk Formulas</h3>

      <div className="formula-card main-formula">
        <h4>Main INFORM Risk Formula</h4>
        <div className="formula-display">
          Risk = (H and E)^(1/3) x V^(1/3) x LCC^(1/3)
        </div>
        <p className="formula-description">
          The INFORM Risk Index is the geometric mean of three dimensions:
          Hazard and Exposure, Vulnerability, and Lack of Coping Capacity.
        </p>
      </div>

      <div className="formula-cards-grid">
        <div className="formula-card">
          <h4>Hazard and Exposure (H and E)</h4>
          <div className="formula-display">H and E = max(Natural, Human)</div>
          <ul>
            <li>Natural = max(Drought, Flood, Earthquake, ...)</li>
            <li>Human = max(Conflict, Violence, ...)</li>
          </ul>
        </div>

        <div className="formula-card">
          <h4>Vulnerability (V)</h4>
          <div className="formula-display">V = mean(SocioEcon, VulnGroups)</div>
          <ul>
            <li>SocioEcon = mean(Poverty, Dependency, Habitat, Livelihoods)</li>
            <li>VulnGroups = mean(Displaced, Health, Children, Economic)</li>
          </ul>
        </div>

        <div className="formula-card">
          <h4>Lack of Coping Capacity (LCC)</h4>
          <div className="formula-display">LCC = mean(Infrastructure, Institutional)</div>
          <ul>
            <li>Infrastructure = mean(Health, Economic, WASH, Comm, Edu)</li>
            <li>Institutional = mean(DRR, Governance)</li>
          </ul>
        </div>

        <div className="formula-card">
          <h4>Warning Score</h4>
          <div className="formula-display">Warning = sqrt(Hazard x RiskSensitivity)</div>
          <p>where RiskSensitivity = sqrt(V x LCC)</p>
        </div>
      </div>

      <div className="risk-thresholds">
        <h4>Risk Classification Thresholds</h4>
        <div className="thresholds-grid">
          <div className="threshold very-low">Very Low: 0.0 - 2.0</div>
          <div className="threshold low">Low: 2.0 - 3.5</div>
          <div className="threshold medium">Medium: 3.5 - 5.0</div>
          <div className="threshold high">High: 5.0 - 6.5</div>
          <div className="threshold very-high">Very High: 6.5 - 10.0</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="database-panel">
      <div className="panel-header">
        <h2>INFORM Tanzania Database</h2>
        <button className="refresh-btn" onClick={loadData}>
          Refresh Data
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'regions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regions')}
        >
          Regions
        </button>
        <button
          className={`tab ${activeTab === 'districts' ? 'active' : ''}`}
          onClick={() => setActiveTab('districts')}
        >
          Districts
        </button>
        <button
          className={`tab ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk Data
        </button>
        <button
          className={`tab ${activeTab === 'formulas' ? 'active' : ''}`}
          onClick={() => setActiveTab('formulas')}
        >
          Formulas
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'regions' && renderRegions()}
        {activeTab === 'districts' && renderDistricts()}
        {activeTab === 'risk' && renderRiskData()}
        {activeTab === 'formulas' && renderFormulas()}
      </div>
    </div>
  );
}

export default DatabasePanel;
