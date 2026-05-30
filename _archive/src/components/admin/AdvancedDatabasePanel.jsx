/**
 * ADVANCED DATABASE ADMIN PANEL
 *
 * Comprehensive admin interface for:
 * - Data submission workflow
 * - Approval/rejection management
 * - API sync monitoring
 * - Version tracking
 * - System health monitoring
 */

import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import {
  SUBMISSION_STATUS,
  USER_ROLES,
  createSubmission,
  submitForReview,
  approveSubmission,
  rejectSubmission,
  publishSubmission,
  getPendingReviews,
  getPendingApproval,
  getSubmissionsByStatus,
  getWorkflowStats,
  getAuditLog
} from '../../database/dataSubmissionWorkflow';
import {
  getSyncState,
  getSyncSummary,
  getNotifications,
  syncAPIData,
  syncRiskCalculations,
  getAllSyncedData
} from '../../database/dataSyncService';
import { TANZANIA_REGIONS } from '../../database/dataCollectionFramework';
import { INDICATOR_DEFINITIONS, COMPONENT_DEFINITIONS } from '../../database/advancedSchema';
import {
  REPORT_TYPES,
  generateRiskOverviewReport,
  generateRegionalProfileReport,
  generateDataQualityReport,
  generateExecutiveSummary
} from '../../database/reportingEngine';
import {
  EXPORT_FORMATS,
  EXPORT_TEMPLATES,
  exportRiskData,
  exportIndicators,
  exportFullDatabase,
  exportAuditLog,
  createBackup,
  getBackups,
  restoreFromBackup,
  getBackupSchedule,
  scheduleBackups
} from '../../database/dataExportBackup';
import {
  CALCULATION_EVENTS,
  subscribe,
  getMetrics,
  watchHighRisk
} from '../../database/calculationHooks';
import './AdvancedDatabasePanel.css';

function AdvancedDatabasePanel() {
  const { isReady, isLoading, error } = useDatabase();

  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workflowStats, setWorkflowStats] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [syncState, setSyncState] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Reports & Export state
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS.CSV);
  const [backups, setBackups] = useState([]);
  const [backupSchedule, setBackupScheduleState] = useState(null);
  const [calculationMetrics, setCalculationMetrics] = useState(null);
  const [highRiskAlerts, setHighRiskAlerts] = useState([]);

  // Current user (mock - replace with actual auth)
  const currentUser = {
    id: 'admin-001',
    name: 'System Admin',
    role: USER_ROLES.ADMIN
  };

  // Load data
  useEffect(() => {
    if (isReady) {
      refreshData();

      // Subscribe to high risk alerts
      const highRiskWatcher = watchHighRisk((event) => {
        setHighRiskAlerts(prev => [...prev.slice(-9), event]);
      });

      return () => highRiskWatcher.unwatch();
    }
  }, [isReady]);

  const refreshData = () => {
    setWorkflowStats(getWorkflowStats());
    setPendingSubmissions(getPendingReviews());
    setPendingApprovals(getPendingApproval());
    setSyncState(getSyncSummary());
    setNotifications(getNotifications());
    setAuditLogs(getAuditLog({}).slice(0, 20));
    setBackups(getBackups());
    setBackupScheduleState(getBackupSchedule());
    setCalculationMetrics(getMetrics());
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="adv-db-panel loading">
        <div className="loading-spinner"></div>
        <p>Initializing advanced database...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="adv-db-panel error">
        <div className="error-icon">Error</div>
        <h3>Database Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Handle approval
  const handleApprove = (submissionId) => {
    try {
      approveSubmission(submissionId, currentUser.id, currentUser.role, 'Approved by admin');
      refreshData();
      setSelectedSubmission(null);
    } catch (err) {
      alert('Approval failed: ' + err.message);
    }
  };

  // Handle rejection
  const handleReject = (submissionId, reason) => {
    try {
      rejectSubmission(submissionId, currentUser.id, currentUser.role, reason || 'Rejected by admin');
      refreshData();
      setSelectedSubmission(null);
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    }
  };

  // Handle publish
  const handlePublish = (submissionId) => {
    try {
      publishSubmission(submissionId, currentUser.id, currentUser.role);
      refreshData();
      setSelectedSubmission(null);
    } catch (err) {
      alert('Publishing failed: ' + err.message);
    }
  };

  // Handle API sync
  const handleAPISync = async () => {
    try {
      await syncAPIData({});
      refreshData();
      alert('API sync completed');
    } catch (err) {
      alert('API sync failed: ' + err.message);
    }
  };

  // Handle risk recalculation
  const handleRecalculate = () => {
    try {
      syncRiskCalculations();
      refreshData();
      alert('Risk calculations updated');
    } catch (err) {
      alert('Calculation failed: ' + err.message);
    }
  };

  // Handle report generation
  const handleGenerateReport = (reportType) => {
    try {
      const riskData = getAllSyncedData();
      let report;

      switch (reportType) {
        case REPORT_TYPES.RISK_OVERVIEW:
          report = generateRiskOverviewReport(riskData);
          break;
        case REPORT_TYPES.DATA_QUALITY:
          report = generateDataQualityReport(riskData);
          break;
        case REPORT_TYPES.EXECUTIVE_SUMMARY:
          report = generateExecutiveSummary(riskData);
          break;
        default:
          report = generateRiskOverviewReport(riskData);
      }

      setSelectedReport(reportType);
      setReportData(report);
    } catch (err) {
      alert('Report generation failed: ' + err.message);
    }
  };

  // Handle data export
  const handleExport = (exportType) => {
    try {
      let result;

      switch (exportType) {
        case 'risk_data':
          result = exportRiskData({ format: exportFormat });
          break;
        case 'indicators':
          result = exportIndicators({ format: exportFormat });
          break;
        case 'full_database':
          result = exportFullDatabase();
          break;
        case 'audit_log':
          result = exportAuditLog({ format: exportFormat });
          break;
        default:
          result = exportRiskData({ format: exportFormat });
      }

      if (result.success) {
        // Create downloadable file
        const blob = new Blob([result.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
        alert(`Exported ${result.recordCount} records to ${result.filename}`);
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // Handle backup creation
  const handleCreateBackup = () => {
    try {
      const result = createBackup({
        type: 'full',
        description: 'Manual backup from admin panel'
      });

      if (result.success) {
        refreshData();
        alert(`Backup created: ${result.backupId}`);
      }
    } catch (err) {
      alert('Backup failed: ' + err.message);
    }
  };

  // Handle backup restore
  const handleRestore = (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      return;
    }

    try {
      const result = restoreFromBackup(backupId, { createBackupFirst: true });

      if (result.success) {
        refreshData();
        alert('Backup restored successfully');
      } else {
        alert('Restore failed: ' + result.error);
      }
    } catch (err) {
      alert('Restore failed: ' + err.message);
    }
  };

  // Handle scheduled backups
  const handleScheduleBackup = (frequency) => {
    try {
      const result = scheduleBackups(frequency);
      if (result.success) {
        refreshData();
        alert(`${frequency} backups scheduled. Next backup: ${result.nextRun}`);
      }
    } catch (err) {
      alert('Failed to schedule backups: ' + err.message);
    }
  };

  // Render dashboard
  const renderDashboard = () => (
    <div className="dashboard-section">
      <h3>System Dashboard</h3>

      {/* Workflow Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{workflowStats?.byStatus?.draft || 0}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{workflowStats?.pendingActions?.awaitingReview || 0}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">👀</div>
          <div className="stat-value">{workflowStats?.pendingActions?.awaitingApproval || 0}</div>
          <div className="stat-label">Awaiting Approval</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✓</div>
          <div className="stat-value">{workflowStats?.byStatus?.published || 0}</div>
          <div className="stat-label">Published</div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="sync-status-section">
        <h4>Sync Status</h4>
        <div className="sync-info">
          <div className="sync-item">
            <span className="label">Status:</span>
            <span className={`status ${syncState?.status || 'idle'}`}>
              {syncState?.status || 'Idle'}
            </span>
          </div>
          <div className="sync-item">
            <span className="label">Last API Sync:</span>
            <span>{syncState?.lastAPISync ? new Date(syncState.lastAPISync).toLocaleString() : 'Never'}</span>
          </div>
          <div className="sync-item">
            <span className="label">Last Calculation:</span>
            <span>{syncState?.lastCalculationSync ? new Date(syncState.lastCalculationSync).toLocaleString() : 'Never'}</span>
          </div>
          <div className="sync-item">
            <span className="label">Data Records:</span>
            <span>{syncState?.dataRecords || 0}</span>
          </div>
        </div>
        <div className="sync-actions">
          <button className="btn-sync" onClick={handleAPISync}>
            🔄 Sync APIs
          </button>
          <button className="btn-calculate" onClick={handleRecalculate}>
            📊 Recalculate Risk
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h4>Recent Notifications ({notifications.length})</h4>
          <div className="notification-list">
            {notifications.slice(0, 5).map(notification => (
              <div key={notification.id} className="notification-item">
                <span className="notification-type">{notification.type}</span>
                <span className="notification-message">{notification.message}</span>
                <span className="notification-time">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render pending reviews
  const renderPendingReviews = () => (
    <div className="reviews-section">
      <h3>Pending Reviews ({pendingSubmissions.length})</h3>

      {pendingSubmissions.length === 0 ? (
        <div className="empty-state">
          <p>No submissions pending review</p>
        </div>
      ) : (
        <div className="submission-list">
          {pendingSubmissions.map(submission => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <h4>{submission.adminUnitName || submission.adminUnitCode}</h4>
                <span className={`status-badge ${submission.status}`}>
                  {submission.status}
                </span>
              </div>
              <div className="submission-meta">
                <span>Submitted by: {submission.submitterName}</span>
                <span>Year: {submission.dataYear}</span>
                <span>Indicators: {Object.keys(submission.indicators || {}).length}</span>
              </div>
              <div className="submission-actions">
                <button
                  className="btn-view"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  View Details
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(submission.id)}
                >
                  Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(submission.id, 'Insufficient data')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render pending approvals (ready to publish)
  const renderPendingApprovals = () => (
    <div className="approvals-section">
      <h3>Ready to Publish ({pendingApprovals.length})</h3>

      {pendingApprovals.length === 0 ? (
        <div className="empty-state">
          <p>No approved submissions waiting to publish</p>
        </div>
      ) : (
        <div className="submission-list">
          {pendingApprovals.map(submission => (
            <div key={submission.id} className="submission-card approved">
              <div className="submission-header">
                <h4>{submission.adminUnitName || submission.adminUnitCode}</h4>
                <span className="status-badge approved">Approved</span>
              </div>
              <div className="submission-meta">
                <span>Approved: {submission.workflow?.approvedAt ? new Date(submission.workflow.approvedAt).toLocaleString() : 'N/A'}</span>
                <span>Indicators: {Object.keys(submission.indicators || {}).length}</span>
              </div>
              <div className="submission-actions">
                <button
                  className="btn-publish"
                  onClick={() => handlePublish(submission.id)}
                >
                  📤 Publish to Database
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render data submission form
  const renderDataSubmission = () => (
    <div className="submission-form-section">
      <h3>Submit New Data</h3>

      <form className="data-submission-form" onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const submission = createSubmission({
          submitterId: currentUser.id,
          submitterName: currentUser.name,
          submitterRole: currentUser.role,
          adminUnitCode: formData.get('adminUnit'),
          adminUnitName: TANZANIA_REGIONS.find(r => r.code === formData.get('adminUnit'))?.name || formData.get('adminUnit'),
          adminLevel: 'region',
          dataYear: parseInt(formData.get('dataYear')),
          sourceType: formData.get('sourceType'),
          sourceName: formData.get('sourceName'),
          indicators: {} // Would be populated with actual indicator values
        });

        // Submit for review
        submitForReview(submission.id, currentUser.id, 'Initial submission');
        refreshData();
        alert('Submission created and sent for review');
        e.target.reset();
      }}>
        <div className="form-group">
          <label>Administrative Unit</label>
          <select name="adminUnit" required>
            <option value="">Select Region</option>
            {TANZANIA_REGIONS.map(region => (
              <option key={region.code} value={region.code}>
                {region.name} ({region.code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Data Year</label>
          <input
            type="number"
            name="dataYear"
            min="2020"
            max="2025"
            defaultValue="2024"
            required
          />
        </div>

        <div className="form-group">
          <label>Source Type</label>
          <select name="sourceType" required>
            <option value="government">Government Ministry</option>
            <option value="survey">Survey Data</option>
            <option value="field">Field Collection</option>
            <option value="api">API Source</option>
          </select>
        </div>

        <div className="form-group">
          <label>Source Name</label>
          <input type="text" name="sourceName" required placeholder="e.g., NBS, TMA, PMO-DMD" />
        </div>

        <div className="indicator-section">
          <h4>Indicators</h4>
          <p className="helper-text">
            Select indicators and enter values. Full indicator entry form would go here.
          </p>
          <div className="indicator-count">
            Available Indicators: {Object.keys(INDICATOR_DEFINITIONS).length}
          </div>
        </div>

        <button type="submit" className="btn-submit">
          Submit for Review
        </button>
      </form>
    </div>
  );

  // Render audit log
  const renderAuditLog = () => (
    <div className="audit-section">
      <h3>Audit Log</h3>

      <table className="audit-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Submission</th>
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
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td>{log.submissionId || '-'}</td>
              <td>{log.userId || '-'}</td>
              <td>
                {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {auditLogs.length === 0 && (
        <div className="empty-state">
          <p>No audit logs available</p>
        </div>
      )}
    </div>
  );

  // Render reports tab
  const renderReports = () => (
    <div className="reports-section">
      <h3>Reports & Analytics</h3>

      <div className="report-types">
        <div className="report-card" onClick={() => handleGenerateReport(REPORT_TYPES.RISK_OVERVIEW)}>
          <div className="report-icon">📊</div>
          <h4>Risk Overview Report</h4>
          <p>National risk summary with distribution analysis</p>
        </div>

        <div className="report-card" onClick={() => handleGenerateReport(REPORT_TYPES.DATA_QUALITY)}>
          <div className="report-icon">✓</div>
          <h4>Data Quality Report</h4>
          <p>Data completeness and validation status</p>
        </div>

        <div className="report-card" onClick={() => handleGenerateReport(REPORT_TYPES.EXECUTIVE_SUMMARY)}>
          <div className="report-icon">📋</div>
          <h4>Executive Summary</h4>
          <p>High-level summary for decision makers</p>
        </div>
      </div>

      {/* High Risk Alerts */}
      {highRiskAlerts.length > 0 && (
        <div className="alerts-section">
          <h4>High Risk Alerts</h4>
          <div className="alert-list">
            {highRiskAlerts.map((alert, index) => (
              <div key={index} className="alert-item high-risk">
                <span className="alert-icon">⚠️</span>
                <span className="alert-unit">{alert.adminUnitId}</span>
                <span className="alert-value">Risk: {alert.riskIndex?.toFixed(2)}</span>
                <span className="alert-class">{alert.riskClass}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculation Metrics */}
      {calculationMetrics && (
        <div className="metrics-section">
          <h4>Calculation Performance</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-value">{calculationMetrics.totalCalculations}</span>
              <span className="metric-label">Total Calculations</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">{calculationMetrics.cacheHitRate}%</span>
              <span className="metric-label">Cache Hit Rate</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">{calculationMetrics.averageCalculationTime?.toFixed(0) || 0}ms</span>
              <span className="metric-label">Avg Calculation Time</span>
            </div>
          </div>
        </div>
      )}

      {/* Report Display */}
      {reportData && (
        <div className="report-display">
          <div className="report-header">
            <h4>{reportData.metadata?.title || 'Report'}</h4>
            <span className="report-date">Generated: {new Date(reportData.metadata?.generatedAt).toLocaleString()}</span>
          </div>

          {reportData.summary && (
            <div className="report-summary">
              <h5>Summary</h5>
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="label">Total Areas:</span>
                  <span className="value">{reportData.summary.totalAdminUnits || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Avg Risk Index:</span>
                  <span className="value">{reportData.summary.averageRisk?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">High Risk Areas:</span>
                  <span className="value high-risk">
                    {(reportData.summary.distribution?.high || 0) + (reportData.summary.distribution?.veryHigh || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reportData.topRiskAreas && (
            <div className="top-risk-section">
              <h5>Top Risk Areas</h5>
              <table className="risk-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Admin Unit</th>
                    <th>Risk Index</th>
                    <th>Risk Class</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topRiskAreas.slice(0, 10).map((area, index) => (
                    <tr key={area.adminUnitCode}>
                      <td>{index + 1}</td>
                      <td>{area.adminUnitName || area.adminUnitCode}</td>
                      <td>{area.riskIndex?.toFixed(2) || 'N/A'}</td>
                      <td>
                        <span className={`risk-badge ${area.riskClass?.toLowerCase()}`}>
                          {area.riskClass}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button className="btn-close-report" onClick={() => setReportData(null)}>
            Close Report
          </button>
        </div>
      )}
    </div>
  );

  // Render export & backup tab
  const renderExportBackup = () => (
    <div className="export-backup-section">
      <h3>Export & Backup</h3>

      {/* Export Section */}
      <div className="export-section">
        <h4>Data Export</h4>

        <div className="export-format-selector">
          <label>Export Format:</label>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value={EXPORT_FORMATS.CSV}>CSV</option>
            <option value={EXPORT_FORMATS.JSON}>JSON</option>
            <option value={EXPORT_FORMATS.XLSX_COMPATIBLE}>Excel Compatible (TSV)</option>
            <option value={EXPORT_FORMATS.INFORM_TEMPLATE}>INFORM Template</option>
          </select>
        </div>

        <div className="export-buttons">
          <button className="btn-export" onClick={() => handleExport('risk_data')}>
            📊 Export Risk Data
          </button>
          <button className="btn-export" onClick={() => handleExport('indicators')}>
            📈 Export Indicators
          </button>
          <button className="btn-export" onClick={() => handleExport('full_database')}>
            💾 Export Full Database
          </button>
          <button className="btn-export" onClick={() => handleExport('audit_log')}>
            📋 Export Audit Log
          </button>
        </div>
      </div>

      {/* Backup Section */}
      <div className="backup-section">
        <h4>Backup Management</h4>

        <div className="backup-actions">
          <button className="btn-backup" onClick={handleCreateBackup}>
            💾 Create Backup Now
          </button>

          <div className="schedule-backup">
            <label>Schedule Automatic Backups:</label>
            <div className="schedule-buttons">
              <button
                className={`btn-schedule ${backupSchedule?.frequency === 'daily' ? 'active' : ''}`}
                onClick={() => handleScheduleBackup('daily')}
              >
                Daily
              </button>
              <button
                className={`btn-schedule ${backupSchedule?.frequency === 'weekly' ? 'active' : ''}`}
                onClick={() => handleScheduleBackup('weekly')}
              >
                Weekly
              </button>
              <button
                className={`btn-schedule ${backupSchedule?.frequency === 'monthly' ? 'active' : ''}`}
                onClick={() => handleScheduleBackup('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {backupSchedule?.enabled && (
          <div className="schedule-status">
            <p>
              <strong>Scheduled:</strong> {backupSchedule.frequency} backups
              {backupSchedule.nextRun && (
                <span> | Next: {new Date(backupSchedule.nextRun).toLocaleString()}</span>
              )}
            </p>
          </div>
        )}

        {/* Backup List */}
        <div className="backup-list">
          <h5>Available Backups ({backups.length})</h5>

          {backups.length === 0 ? (
            <div className="empty-state">
              <p>No backups available</p>
            </div>
          ) : (
            <table className="backup-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(backup => (
                  <tr key={backup.id}>
                    <td>{backup.id.slice(0, 15)}...</td>
                    <td>
                      <span className={`backup-type ${backup.type}`}>{backup.type}</span>
                    </td>
                    <td>{new Date(backup.createdAt).toLocaleString()}</td>
                    <td>{(backup.dataSize / 1024).toFixed(1)} KB</td>
                    <td>
                      <button
                        className="btn-restore"
                        onClick={() => handleRestore(backup.id)}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  // Render submission detail modal
  const renderSubmissionModal = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Submission Details</h3>
            <button className="close-btn" onClick={() => setSelectedSubmission(null)}>×</button>
          </div>

          <div className="modal-body">
            <div className="detail-group">
              <label>ID:</label>
              <span>{selectedSubmission.id}</span>
            </div>
            <div className="detail-group">
              <label>Admin Unit:</label>
              <span>{selectedSubmission.adminUnitName} ({selectedSubmission.adminUnitCode})</span>
            </div>
            <div className="detail-group">
              <label>Status:</label>
              <span className={`status-badge ${selectedSubmission.status}`}>
                {selectedSubmission.status}
              </span>
            </div>
            <div className="detail-group">
              <label>Submitted By:</label>
              <span>{selectedSubmission.submitterName}</span>
            </div>
            <div className="detail-group">
              <label>Data Year:</label>
              <span>{selectedSubmission.dataYear}</span>
            </div>
            <div className="detail-group">
              <label>Source:</label>
              <span>{selectedSubmission.sourceName} ({selectedSubmission.sourceType})</span>
            </div>

            <h4>Indicators ({Object.keys(selectedSubmission.indicators || {}).length})</h4>
            <div className="indicator-list">
              {Object.entries(selectedSubmission.indicators || {}).map(([id, data]) => (
                <div key={id} className="indicator-item">
                  <span className="indicator-id">{id}</span>
                  <span className="indicator-value">{data.value}</span>
                  <span className={`validation ${data.validationResult?.valid ? 'valid' : 'invalid'}`}>
                    {data.validationResult?.valid ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>

            {selectedSubmission.comments?.length > 0 && (
              <>
                <h4>Comments</h4>
                <div className="comments-list">
                  {selectedSubmission.comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <span className="comment-type">{comment.type}</span>
                      <span className="comment-message">{comment.message}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            {selectedSubmission.status === SUBMISSION_STATUS.SUBMITTED && (
              <>
                <button className="btn-approve" onClick={() => handleApprove(selectedSubmission.id)}>
                  Approve
                </button>
                <button className="btn-reject" onClick={() => handleReject(selectedSubmission.id, '')}>
                  Reject
                </button>
              </>
            )}
            {selectedSubmission.status === SUBMISSION_STATUS.APPROVED && (
              <button className="btn-publish" onClick={() => handlePublish(selectedSubmission.id)}>
                Publish
              </button>
            )}
            <button className="btn-cancel" onClick={() => setSelectedSubmission(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="adv-db-panel">
      <div className="panel-header">
        <h2>INFORM Tanzania - Advanced Database Admin</h2>
        <div className="header-actions">
          <span className="user-info">
            Logged in as: <strong>{currentUser.name}</strong> ({currentUser.role})
          </span>
          <button className="btn-refresh" onClick={refreshData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          👀 Pending Reviews
          {pendingSubmissions.length > 0 && (
            <span className="badge">{pendingSubmissions.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          ✓ Ready to Publish
          {pendingApprovals.length > 0 && (
            <span className="badge">{pendingApprovals.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          📝 Submit Data
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Log
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Reports
        </button>
        <button
          className={`tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          💾 Export & Backup
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'reviews' && renderPendingReviews()}
        {activeTab === 'approvals' && renderPendingApprovals()}
        {activeTab === 'submit' && renderDataSubmission()}
        {activeTab === 'audit' && renderAuditLog()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'export' && renderExportBackup()}
      </div>

      {renderSubmissionModal()}
    </div>
  );
}

export default AdvancedDatabasePanel;
