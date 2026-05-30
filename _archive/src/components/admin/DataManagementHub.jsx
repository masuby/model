/**
 * DATA MANAGEMENT HUB
 * Central INFORM data management interface for all stakeholders
 * Provides role-based access to data entry, review, and management features
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { USER_ROLES, INSTITUTIONS } from '../../services/authService';
import { getSubmissions, isUsingSupabase } from '../../services/supabaseDataService';
import InstitutionDataEntry from './tabs/InstitutionDataEntry';
import RegionalDataView from './tabs/RegionalDataView';
import PMOReviewPanel from './tabs/PMOReviewPanel';
import INFORMIndicators from './tabs/INFORMIndicators';
import DataUploadWizard from './tabs/DataUploadWizard';
import './DataManagementHub.css';

function DataManagementHub() {
  const { user, hasPermission } = useAuth();
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
  const [submissions, setSubmissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Define tabs based on user role
  const getTabs = () => {
    const role = user?.role;
    const tabs = [];

    // Dashboard Overview - All roles
    tabs.push({
      id: 'overview',
      label: 'Dashboard',
      icon: '📊',
      access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER, USER_ROLES.REGIONAL_OFFICER, USER_ROLES.INSTITUTION_USER]
    });

    // My Data Entry - Institutions and Regional Officers
    if (role === USER_ROLES.INSTITUTION_USER || role === USER_ROLES.REGIONAL_OFFICER) {
      tabs.push({
        id: 'data-entry',
        label: 'My Data Entry',
        icon: '✏️',
        access: [USER_ROLES.INSTITUTION_USER, USER_ROLES.REGIONAL_OFFICER]
      });
    }

    // Regional Data - Admin, PMO, Regional Officers
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PMO_OFFICER || role === USER_ROLES.REGIONAL_OFFICER) {
      tabs.push({
        id: 'regional-data',
        label: 'Regional Data',
        icon: '🗺️',
        access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER, USER_ROLES.REGIONAL_OFFICER]
      });
    }

    // All Submissions - Admin, PMO only
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PMO_OFFICER) {
      tabs.push({
        id: 'submissions',
        label: 'All Submissions',
        icon: '📋',
        access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER]
      });
    }

    // Review & Approve - Admin, PMO only
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PMO_OFFICER) {
      tabs.push({
        id: 'review',
        label: 'Review & Approve',
        icon: '✅',
        access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER]
      });
    }

    // INFORM Indicators - All roles (read-only for some)
    tabs.push({
      id: 'indicators',
      label: 'INFORM Indicators',
      icon: '📈',
      access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER, USER_ROLES.REGIONAL_OFFICER, USER_ROLES.INSTITUTION_USER]
    });

    // Data Upload - Admin, PMO, Institutions
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PMO_OFFICER || role === USER_ROLES.INSTITUTION_USER) {
      tabs.push({
        id: 'upload',
        label: 'Data Upload',
        icon: '📤',
        access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER, USER_ROLES.INSTITUTION_USER]
      });
    }

    // Reports & Analytics - All roles
    tabs.push({
      id: 'reports',
      label: 'Reports',
      icon: '📑',
      access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER, USER_ROLES.REGIONAL_OFFICER, USER_ROLES.INSTITUTION_USER]
    });

    // Export & Backup - Admin, PMO
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PMO_OFFICER) {
      tabs.push({
        id: 'export',
        label: 'Export & Backup',
        icon: '💾',
        access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER]
      });
    }

    // Audit Log - Admin, PMO
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PMO_OFFICER) {
      tabs.push({
        id: 'audit',
        label: 'Audit Log',
        icon: '📜',
        access: [USER_ROLES.ADMIN, USER_ROLES.PMO_OFFICER]
      });
    }

    return tabs;
  };

  const tabs = getTabs();

  useEffect(() => {
    // Always load submissions from localStorage (doesn't need database)
    loadSubmissions();
    loadAuditLogs();

    // Only load database-dependent data if ready
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
    loadSubmissions();
    loadAuditLogs();
  };

  const loadSubmissions = async () => {
    try {
      // Use Supabase service (falls back to localStorage)
      const allSubmissions = await getSubmissions();
      console.log(`📋 Loaded ${allSubmissions.length} submissions ${isUsingSupabase() ? 'from Supabase' : 'from localStorage'}`);
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setSubmissions([]);
    }
  };

  const loadAuditLogs = () => {
    // Load mock audit logs
    const mockLogs = [
      {
        id: 1,
        action: 'DATA_SUBMITTED',
        user: 'TMA Officer',
        details: 'Submitted flood hazard data for Dar es Salaam',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        action: 'DATA_APPROVED',
        user: 'PMO Officer',
        details: 'Approved water level data for Dodoma',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        action: 'USER_LOGIN',
        user: 'System Administrator',
        details: 'Admin user logged in',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    setAuditLogs(mockLogs);
  };

  if (isLoading) {
    return (
      <div className="data-hub loading">
        <div className="loading-spinner"></div>
        <p>Loading Data Management Hub...</p>
      </div>
    );
  }

  // Note: Database errors don't block the UI - committee submissions use localStorage
  const hasDbError = Boolean(error);

  const getRoleLabel = () => {
    switch (user?.role) {
      case USER_ROLES.ADMIN: return 'Administrator';
      case USER_ROLES.PMO_OFFICER: return 'PMO Officer';
      case USER_ROLES.REGIONAL_OFFICER: return `Regional Officer (${user.region || 'All Regions'})`;
      case USER_ROLES.INSTITUTION_USER:
        const inst = INSTITUTIONS[user.institution];
        return inst ? inst.name : 'Institution User';
      default: return 'User';
    }
  };

  const getInstitutionInfo = () => {
    if (user?.role === USER_ROLES.INSTITUTION_USER && user.institution) {
      return INSTITUTIONS[user.institution];
    }
    return null;
  };

  // Render Dashboard Overview
  const renderOverview = () => (
    <div className="hub-section overview-section">
      <div className="section-header">
        <h3>Data Management Overview</h3>
        <button className="refresh-btn" onClick={loadData}>
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-value">{regions.length}</div>
          <div className="stat-label">Regions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{districts.length}</div>
          <div className="stat-label">Districts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{riskData.length}</div>
          <div className="stat-label">Risk Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{warningStats?.total || 0}</div>
          <div className="stat-label">Active Warnings</div>
        </div>
      </div>

      {/* Institution-specific stats */}
      {user?.role === USER_ROLES.INSTITUTION_USER && (
        <div className="institution-summary">
          <h4>Your Institution: {getInstitutionInfo()?.name || user.institution}</h4>
          <div className="institution-stats">
            <div className="inst-stat">
              <span className="inst-stat-value">5</span>
              <span className="inst-stat-label">Pending Submissions</span>
            </div>
            <div className="inst-stat">
              <span className="inst-stat-value">12</span>
              <span className="inst-stat-label">Approved This Month</span>
            </div>
            <div className="inst-stat">
              <span className="inst-stat-value">2</span>
              <span className="inst-stat-label">Pending Review</span>
            </div>
          </div>
        </div>
      )}

      {/* Regional Officer stats */}
      {user?.role === USER_ROLES.REGIONAL_OFFICER && (
        <div className="regional-summary">
          <h4>Your Region: {user.region || 'All Regions'}</h4>
          <div className="regional-stats">
            <div className="reg-stat">
              <span className="reg-stat-value">{districts.filter(d => d.adm1_name === user.region).length || 8}</span>
              <span className="reg-stat-label">Districts</span>
            </div>
            <div className="reg-stat">
              <span className="reg-stat-value">3</span>
              <span className="reg-stat-label">Active Alerts</span>
            </div>
            <div className="reg-stat">
              <span className="reg-stat-value">7</span>
              <span className="reg-stat-label">Data Updates This Week</span>
            </div>
          </div>
        </div>
      )}

      {/* PMO/Admin overview */}
      {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.PMO_OFFICER) && (
        <>
          <div className="submissions-overview">
            <h4>Recent Submissions</h4>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Committee</th>
                  <th>Region</th>
                  <th>Indicators</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 5).map(sub => (
                  <tr key={sub.id}>
                    <td>{sub.committeeName || sub.institution || 'Unknown'}</td>
                    <td>{sub.adm1Name || sub.region || '-'}{sub.adm2Name ? ` / ${sub.adm2Name}` : ''}</td>
                    <td>{sub.indicatorCount || Object.keys(sub.indicators || {}).length || '-'}</td>
                    <td>
                      {sub.scores?.riskScore != null ? (
                        <span className={`risk-badge ${(sub.scores.riskClass || '').toLowerCase().replace(' ', '-')}`}>
                          {sub.scores.riskScore.toFixed(1)} ({sub.scores.riskClass})
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${sub.status}`}>
                        {(sub.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {health && (
            <div className="health-status">
              <h4>Database Health</h4>
              <div className={`status-indicator ${health.status}`}>
                {health.status.toUpperCase()}
              </div>
              <div className="health-details">
                <p><strong>Version:</strong> {health.version}</p>
                <p><strong>Total Records:</strong> {health.totalRecords?.toLocaleString()}</p>
                <p><strong>Last Updated:</strong> {new Date(health.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render All Submissions (PMO/Admin)
  const renderSubmissions = () => (
    <div className="hub-section submissions-section">
      <div className="section-header">
        <h3>All Committee Submissions</h3>
        <div className="section-actions">
          <select className="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p>No submissions yet. Committee submissions will appear here when committees submit data.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Committee</th>
              <th>Region / District</th>
              <th>Indicators</th>
              <th>Risk Score</th>
              <th>Submitted By</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub.id}>
                <td>{sub.committeeName || 'Committee'}</td>
                <td>{sub.adm1Name || '-'}{sub.adm2Name ? ` / ${sub.adm2Name}` : ''}</td>
                <td>{sub.indicatorCount || Object.keys(sub.indicators || {}).length || '-'}</td>
                <td>
                  {sub.scores?.riskScore != null ? (
                    <span className={`risk-badge ${(sub.scores.riskClass || '').toLowerCase().replace(' ', '-')}`}>
                      {sub.scores.riskScore.toFixed(1)} ({sub.scores.riskClass})
                    </span>
                  ) : '-'}
                </td>
                <td>{sub.submittedBy || '-'}</td>
                <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${sub.status || 'pending'}`}>
                    {(sub.status || 'pending').replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Render Reports
  const renderReports = () => (
    <div className="hub-section reports-section">
      <div className="section-header">
        <h3>Reports & Analytics</h3>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon">📊</div>
          <h4>Risk Summary Report</h4>
          <p>Overview of risk indicators across all regions</p>
          <button className="generate-btn">Generate</button>
        </div>
        <div className="report-card">
          <div className="report-icon">📈</div>
          <h4>Trend Analysis</h4>
          <p>Historical trends in hazard and vulnerability data</p>
          <button className="generate-btn">Generate</button>
        </div>
        <div className="report-card">
          <div className="report-icon">🗺️</div>
          <h4>Regional Comparison</h4>
          <p>Compare risk levels across regions</p>
          <button className="generate-btn">Generate</button>
        </div>
        <div className="report-card">
          <div className="report-icon">📋</div>
          <h4>Submission Summary</h4>
          <p>Data submission statistics by institution</p>
          <button className="generate-btn">Generate</button>
        </div>
      </div>

      <div className="quick-stats">
        <h4>Quick Statistics</h4>
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <span className="qs-label">Regions at High Risk</span>
            <span className="qs-value high">5</span>
          </div>
          <div className="quick-stat">
            <span className="qs-label">Data Completeness</span>
            <span className="qs-value">87%</span>
          </div>
          <div className="quick-stat">
            <span className="qs-label">Active Alerts</span>
            <span className="qs-value warning">{warningStats?.active || 3}</span>
          </div>
          <div className="quick-stat">
            <span className="qs-label">Pending Reviews</span>
            <span className="qs-value pending">{submissions.filter(s => s.status === 'pending').length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Export & Backup
  const renderExport = () => (
    <div className="hub-section export-section">
      <div className="section-header">
        <h3>Export & Backup</h3>
      </div>

      <div className="export-options">
        <div className="export-card">
          <div className="export-icon">📄</div>
          <h4>Export to Excel</h4>
          <p>Download INFORM data in Excel format</p>
          <select className="export-select">
            <option value="all">All Data</option>
            <option value="risk">Risk Indicators</option>
            <option value="hazard">Hazard Data</option>
            <option value="vulnerability">Vulnerability Data</option>
          </select>
          <button className="export-btn">Download Excel</button>
        </div>
        <div className="export-card">
          <div className="export-icon">📋</div>
          <h4>Export to CSV</h4>
          <p>Download data in CSV format for analysis</p>
          <button className="export-btn">Download CSV</button>
        </div>
        <div className="export-card">
          <div className="export-icon">📦</div>
          <h4>INFORM Template</h4>
          <p>Export data in official INFORM template format</p>
          <button className="export-btn">Download Template</button>
        </div>
        <div className="export-card">
          <div className="export-icon">💾</div>
          <h4>Full Backup</h4>
          <p>Create complete database backup</p>
          <button className="export-btn backup">Create Backup</button>
        </div>
      </div>
    </div>
  );

  // Render Audit Log
  const renderAuditLog = () => (
    <div className="hub-section audit-section">
      <div className="section-header">
        <h3>Audit Log</h3>
        <div className="section-actions">
          <input type="date" className="date-filter" />
          <select className="filter-select">
            <option value="">All Actions</option>
            <option value="DATA_SUBMITTED">Data Submitted</option>
            <option value="DATA_APPROVED">Data Approved</option>
            <option value="DATA_REJECTED">Data Rejected</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="USER_LOGOUT">User Logout</option>
          </select>
        </div>
      </div>

      <table className="data-table audit-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>User</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>
                <span className={`action-badge ${log.action.toLowerCase()}`}>
                  {log.action.replace('_', ' ')}
                </span>
              </td>
              <td>{log.user}</td>
              <td>{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'data-entry':
        return <InstitutionDataEntry user={user} />;
      case 'regional-data':
        return <RegionalDataView user={user} regions={regions} districts={districts} />;
      case 'submissions':
        return renderSubmissions();
      case 'review':
        return <PMOReviewPanel user={user} submissions={submissions} onRefresh={loadSubmissions} />;
      case 'indicators':
        return <INFORMIndicators user={user} riskData={riskData} />;
      case 'upload':
        return <DataUploadWizard user={user} onUploadComplete={loadData} />;
      case 'reports':
        return renderReports();
      case 'export':
        return renderExport();
      case 'audit':
        return renderAuditLog();
      default:
        return renderOverview();
    }
  };

  // Count pending submissions for badge
  const pendingCount = submissions.filter(s => (s.status || 'pending') === 'pending').length;

  return (
    <div className="data-management-hub">
      <div className="hub-header">
        <div className="hub-title">
          <h2>INFORM Data Management Hub</h2>
          <span className="hub-role">{getRoleLabel()}</span>
        </div>
        {getInstitutionInfo() && (
          <div className="hub-institution">
            <span className="inst-icon">{getInstitutionInfo().icon}</span>
            <span className="inst-name">{getInstitutionInfo().shortName}</span>
          </div>
        )}
      </div>

      {/* Database warning banner (non-blocking) */}
      {hasDbError && (
        <div className="db-warning-banner">
          <span className="warning-icon">⚠️</span>
          <span>Some database features unavailable. Committee submissions workflow is fully operational.</span>
          <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="hub-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`hub-tab ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'review' ? 'review-tab' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {/* Show pending count badge on Review tab */}
            {tab.id === 'review' && pendingCount > 0 && (
              <span className="pending-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="hub-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default DataManagementHub;
