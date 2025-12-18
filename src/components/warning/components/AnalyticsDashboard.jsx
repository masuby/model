/**
 * ANALYTICS DASHBOARD COMPONENT
 * Displays charts, graphs, and statistics for warning system analytics
 */

import React, { useState, useEffect } from 'react';
import {
  getOverallStatistics,
  getWarningsByMonth,
  getWarningsByHazardType,
  getWarningsByLevel,
  getResponseTimeByHazard,
  getResponseTimeTrends,
  getDistrictCoverage,
  getHazardDistribution,
  getSMSAnalytics,
  exportAnalyticsData
} from '../../../services/analyticsService';
import { getSMSStatistics } from '../../../services/smsService';
import { getAuditStatistics } from '../../../services/auditService';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [warningsByMonth, setWarningsByMonth] = useState([]);
  const [warningsByHazard, setWarningsByHazard] = useState([]);
  const [warningsByLevel, setWarningsByLevel] = useState([]);
  const [responseByHazard, setResponseByHazard] = useState([]);
  const [responseTrends, setResponseTrends] = useState([]);
  const [districtCoverage, setDistrictCoverage] = useState(null);
  const [hazardDistribution, setHazardDistribution] = useState([]);
  const [smsStats, setSmsStats] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setStats(getOverallStatistics());
    setWarningsByMonth(getWarningsByMonth());
    setWarningsByHazard(getWarningsByHazardType());
    setWarningsByLevel(getWarningsByLevel());
    setResponseByHazard(getResponseTimeByHazard());
    setResponseTrends(getResponseTimeTrends());
    setDistrictCoverage(getDistrictCoverage());
    setHazardDistribution(getHazardDistribution());
    setSmsStats(getSMSStatistics());
    setAuditStats(getAuditStatistics());
  };

  const handleExport = () => {
    exportAnalyticsData();
  };

  // Simple bar chart using CSS
  const BarChart = ({ data, labelKey, valueKey, maxValue, color = '#2196F3' }) => {
    const max = maxValue || Math.max(...data.map(d => d[valueKey]));
    return (
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-label">{item[labelKey]}</div>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${(item[valueKey] / max) * 100}%`,
                  backgroundColor: item.color || color
                }}
              />
              <span className="bar-value">{item[valueKey]}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart using CSS
  const LineChart = ({ data, labelKey, valueKey, color = '#4CAF50' }) => {
    const max = Math.max(...data.map(d => d[valueKey]));
    const min = Math.min(...data.map(d => d[valueKey]));
    const range = max - min || 1;

    return (
      <div className="line-chart">
        <div className="line-chart-container">
          {data.map((item, index) => {
            const height = ((item[valueKey] - min) / range) * 100;
            return (
              <div key={index} className="line-point-wrapper">
                <div
                  className="line-point"
                  style={{
                    bottom: `${height}%`,
                    backgroundColor: color
                  }}
                  title={`${item[labelKey]}: ${item[valueKey]}`}
                />
                {index < data.length - 1 && (
                  <div
                    className="line-connector"
                    style={{
                      bottom: `${height}%`,
                      height: `${Math.abs(
                        ((data[index + 1][valueKey] - min) / range) * 100 - height
                      )}%`,
                      backgroundColor: color
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="line-chart-labels">
          {data.map((item, index) => (
            <span key={index} className="line-label">{item[labelKey]}</span>
          ))}
        </div>
      </div>
    );
  };

  // Pie chart using CSS
  const PieChart = ({ data }) => {
    let cumulativePercent = 0;

    return (
      <div className="pie-chart-container">
        <div className="pie-chart">
          {data.map((item, index) => {
            const startPercent = cumulativePercent;
            cumulativePercent += item.percentage;
            return (
              <div
                key={index}
                className="pie-segment"
                style={{
                  '--start': `${startPercent * 3.6}deg`,
                  '--end': `${cumulativePercent * 3.6}deg`,
                  '--color': item.color
                }}
              />
            );
          })}
        </div>
        <div className="pie-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: item.color }} />
              <span className="legend-text">{item.hazardType}: {item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!stats) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-dashboard">
      <style>{`
        .analytics-dashboard {
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .analytics-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .export-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          color: #666;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .tab:hover {
          background: #f0f0f0;
        }

        .tab.active {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .stat-card.warning {
          border-left: 4px solid #FF9800;
        }

        .stat-card.danger {
          border-left: 4px solid #F44336;
        }

        .stat-card.success {
          border-left: 4px solid #4CAF50;
        }

        .stat-card.info {
          border-left: 4px solid #2196F3;
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }

        .stat-change {
          font-size: 12px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-change.positive {
          color: #4CAF50;
        }

        .stat-change.negative {
          color: #F44336;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .chart-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .chart-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Bar Chart Styles */
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bar-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bar-label {
          width: 100px;
          font-size: 12px;
          color: #666;
          text-align: right;
          flex-shrink: 0;
        }

        .bar-container {
          flex: 1;
          height: 24px;
          background: #f0f0f0;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .bar-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }

        /* Line Chart Styles */
        .line-chart {
          padding: 20px 0;
        }

        .line-chart-container {
          display: flex;
          align-items: flex-end;
          height: 150px;
          border-bottom: 2px solid #e0e0e0;
          position: relative;
        }

        .line-point-wrapper {
          flex: 1;
          position: relative;
          height: 100%;
        }

        .line-point {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          cursor: pointer;
          z-index: 2;
        }

        .line-connector {
          position: absolute;
          width: 2px;
          left: calc(50% + 50%);
          transform: translateX(-50%);
        }

        .line-chart-labels {
          display: flex;
          justify-content: space-around;
          margin-top: 8px;
        }

        .line-label {
          font-size: 10px;
          color: #666;
        }

        /* Pie Chart Styles */
        .pie-chart-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .pie-chart {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #2196F3 0deg 90deg,
            #FF9800 90deg 180deg,
            #9C27B0 180deg 270deg,
            #4CAF50 270deg 360deg
          );
          position: relative;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .legend-text {
          font-size: 12px;
          color: #666;
        }

        /* Response Time Card */
        .response-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .response-item {
          text-align: center;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .response-value {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .response-unit {
          font-size: 14px;
          color: #666;
        }

        .response-label {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        /* Region Table */
        .region-table {
          width: 100%;
          border-collapse: collapse;
        }

        .region-table th,
        .region-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .region-table th {
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
        }

        .region-table tr:hover {
          background: #f8f9fa;
        }

        .analytics-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
          font-size: 18px;
          color: #666;
        }

        /* SMS Stats */
        .sms-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .sms-stat {
          text-align: center;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }

        .sms-stat-value {
          font-size: 28px;
          font-weight: 700;
        }

        .sms-stat-label {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
        }
      `}</style>

      <div className="analytics-header">
        <h1 className="analytics-title">
          <span>📊</span>
          Analytics Dashboard
        </h1>
        <button className="export-btn" onClick={handleExport}>
          <span>📥</span>
          Export Data
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'warnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('warnings')}
        >
          Warnings
        </button>
        <button
          className={`tab ${activeTab === 'response' ? 'active' : ''}`}
          onClick={() => setActiveTab('response')}
        >
          Response Time
        </button>
        <button
          className={`tab ${activeTab === 'sms' ? 'active' : ''}`}
          onClick={() => setActiveTab('sms')}
        >
          SMS & Alerts
        </button>
        <button
          className={`tab ${activeTab === 'coverage' ? 'active' : ''}`}
          onClick={() => setActiveTab('coverage')}
        >
          Coverage
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card info">
              <div className="stat-icon">📢</div>
              <div className="stat-value">{stats.totalWarnings}</div>
              <div className="stat-label">Total Warnings</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon">📅</div>
              <div className="stat-value">{stats.thisMonth}</div>
              <div className="stat-label">This Month</div>
              <div className={`stat-change ${stats.monthChange >= 0 ? 'positive' : 'negative'}`}>
                {stats.monthChange >= 0 ? '↑' : '↓'} {Math.abs(stats.monthChange)}% vs last month
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{stats.avgResponseTime}<span style={{fontSize: '16px'}}>min</span></div>
              <div className="stat-label">Avg Response Time</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-icon">🚨</div>
              <div className="stat-value">{stats.majorWarnings}</div>
              <div className="stat-label">Major Warnings</div>
              <div className="stat-change">{stats.majorWarningPercentage}% of total</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">
                <span>📈</span>
                Warnings by Month
              </h3>
              <BarChart
                data={warningsByMonth}
                labelKey="label"
                valueKey="count"
                color="#2196F3"
              />
            </div>

            <div className="chart-card">
              <h3 className="chart-title">
                <span>🌊</span>
                Warnings by Hazard Type
              </h3>
              <BarChart
                data={warningsByHazard.slice(0, 6)}
                labelKey="hazardType"
                valueKey="count"
                color="#FF9800"
              />
            </div>

            <div className="chart-card">
              <h3 className="chart-title">
                <span>⚠️</span>
                Warnings by Level
              </h3>
              <BarChart
                data={warningsByLevel}
                labelKey="level"
                valueKey="count"
              />
            </div>

            <div className="chart-card">
              <h3 className="chart-title">
                <span>🥧</span>
                Hazard Distribution
              </h3>
              <PieChart data={hazardDistribution.slice(0, 5)} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'warnings' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">
              <span>📊</span>
              Monthly Warning Trend
            </h3>
            <BarChart
              data={warningsByMonth}
              labelKey="label"
              valueKey="count"
              color="#4CAF50"
            />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span>🎯</span>
              Warnings by Severity Level
            </h3>
            <div className="stats-grid" style={{marginTop: '16px'}}>
              {warningsByLevel.map((level, index) => (
                <div
                  key={index}
                  className="stat-card"
                  style={{borderLeftColor: level.color}}
                >
                  <div className="stat-value">{level.count}</div>
                  <div className="stat-label">{level.level}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card" style={{gridColumn: 'span 2'}}>
            <h3 className="chart-title">
              <span>🌍</span>
              Hazard Type Analysis
            </h3>
            <BarChart
              data={warningsByHazard}
              labelKey="hazardType"
              valueKey="count"
              color="#9C27B0"
            />
          </div>
        </div>
      )}

      {activeTab === 'response' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">
              <span>⏱️</span>
              Response Time Overview
            </h3>
            <div className="response-grid">
              <div className="response-item">
                <div className="response-value" style={{color: '#4CAF50'}}>
                  {stats.fastestResponse}
                </div>
                <div className="response-unit">minutes</div>
                <div className="response-label">Fastest Response</div>
              </div>
              <div className="response-item">
                <div className="response-value" style={{color: '#2196F3'}}>
                  {stats.avgResponseTime}
                </div>
                <div className="response-unit">minutes</div>
                <div className="response-label">Average Response</div>
              </div>
              <div className="response-item">
                <div className="response-value" style={{color: '#F44336'}}>
                  {stats.slowestResponse}
                </div>
                <div className="response-unit">minutes</div>
                <div className="response-label">Slowest Response</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span>📉</span>
              Response Time Trend
            </h3>
            <BarChart
              data={responseTrends}
              labelKey="label"
              valueKey="avgResponseTime"
              color="#00BCD4"
            />
          </div>

          <div className="chart-card" style={{gridColumn: 'span 2'}}>
            <h3 className="chart-title">
              <span>🎯</span>
              Response Time by Hazard Type
            </h3>
            <BarChart
              data={responseByHazard}
              labelKey="hazardType"
              valueKey="avgResponseTime"
              color="#FF5722"
            />
          </div>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">
              <span>📱</span>
              SMS Statistics
            </h3>
            {smsStats && (
              <div className="sms-stats">
                <div className="sms-stat">
                  <div className="sms-stat-value">{smsStats.total}</div>
                  <div className="sms-stat-label">Total SMS Sent</div>
                </div>
                <div className="sms-stat">
                  <div className="sms-stat-value">{smsStats.last24Hours}</div>
                  <div className="sms-stat-label">Last 24 Hours</div>
                </div>
                <div className="sms-stat">
                  <div className="sms-stat-value">{smsStats.successRate}%</div>
                  <div className="sms-stat-label">Success Rate</div>
                </div>
              </div>
            )}
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span>📋</span>
              Audit Statistics
            </h3>
            {auditStats && (
              <div className="stats-grid">
                <div className="stat-card info">
                  <div className="stat-value">{auditStats.total}</div>
                  <div className="stat-label">Total Events</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-value">{auditStats.last24Hours}</div>
                  <div className="stat-label">Last 24 Hours</div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-value">{auditStats.warnings?.created || 0}</div>
                  <div className="stat-label">Warnings Created</div>
                </div>
                <div className="stat-card danger">
                  <div className="stat-value">{auditStats.errors || 0}</div>
                  <div className="stat-label">Errors Logged</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'coverage' && districtCoverage && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">
              <span>🗺️</span>
              District Coverage Overview
            </h3>
            <div className="stats-grid">
              <div className="stat-card info">
                <div className="stat-value">{districtCoverage.totalDistricts}</div>
                <div className="stat-label">Total Districts</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-value">{districtCoverage.totalAffected}</div>
                <div className="stat-label">District-Warnings</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{districtCoverage.avgDistrictsPerWarning}</div>
                <div className="stat-label">Avg Districts/Warning</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span>📍</span>
              Top Affected Regions
            </h3>
            <table className="region-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {districtCoverage.topRegions.map((region, index) => (
                  <tr key={index}>
                    <td>{region.region}</td>
                    <td>{region.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
