/**
 * AUDIT TRAIL SERVICE
 * Tracks all warning actions, user activities, and system events
 * Provides comprehensive logging for accountability and compliance
 */

// Audit Event Types
export const AUDIT_EVENTS = {
  // Warning Events
  WARNING_CREATED: 'WARNING_CREATED',
  WARNING_UPDATED: 'WARNING_UPDATED',
  WARNING_APPROVED: 'WARNING_APPROVED',
  WARNING_REJECTED: 'WARNING_REJECTED',
  WARNING_PUBLISHED: 'WARNING_PUBLISHED',
  WARNING_CANCELLED: 'WARNING_CANCELLED',
  WARNING_ESCALATED: 'WARNING_ESCALATED',
  WARNING_DOWNGRADED: 'WARNING_DOWNGRADED',

  // Bulletin Events
  BULLETIN_GENERATED: 'BULLETIN_GENERATED',
  BULLETIN_DOWNLOADED: 'BULLETIN_DOWNLOADED',
  BULLETIN_SHARED: 'BULLETIN_SHARED',
  BULLETIN_PRINTED: 'BULLETIN_PRINTED',

  // SMS Events
  SMS_SENT: 'SMS_SENT',
  SMS_FAILED: 'SMS_FAILED',
  SMS_DELIVERED: 'SMS_DELIVERED',

  // User Events
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Data Events
  DATA_IMPORTED: 'DATA_IMPORTED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_MODIFIED: 'DATA_MODIFIED',
  DATA_DELETED: 'DATA_DELETED',

  // Risk Assessment Events
  RISK_CALCULATED: 'RISK_CALCULATED',
  RISK_UPDATED: 'RISK_UPDATED',
  RISK_REPORT_GENERATED: 'RISK_REPORT_GENERATED',

  // System Events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_RESTORE: 'SYSTEM_RESTORE'
};

// Severity Levels
export const SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Audit Log Storage
let auditLog = [];
const MAX_LOG_SIZE = 10000;

/**
 * Get current user from auth context
 */
const getCurrentUser = () => {
  try {
    const authData = localStorage.getItem('authUser');
    if (authData) {
      const user = JSON.parse(authData);
      return {
        userId: user.id || user.username,
        username: user.username,
        role: user.role,
        department: user.department || 'Unknown'
      };
    }
  } catch (e) {
    console.error('Failed to get current user:', e);
  }
  return {
    userId: 'system',
    username: 'System',
    role: 'system',
    department: 'System'
  };
};

/**
 * Get client information
 */
const getClientInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate unique audit ID
 */
const generateAuditId = () => {
  return `AUD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create audit entry
 * @param {string} eventType - Type of event from AUDIT_EVENTS
 * @param {string} severity - Severity level from SEVERITY
 * @param {string} description - Human-readable description
 * @param {object} details - Additional event details
 * @param {object} metadata - Extra metadata
 */
export const createAuditEntry = (
  eventType,
  severity = SEVERITY.INFO,
  description,
  details = {},
  metadata = {}
) => {
  const user = getCurrentUser();
  const client = getClientInfo();

  const entry = {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    description,
    user: {
      ...user
    },
    client: {
      ip: 'client-side', // Would be server-side in production
      ...client
    },
    details: {
      ...details
    },
    metadata: {
      version: '1.0.0',
      module: details.module || 'Unknown',
      ...metadata
    }
  };

  // Add to in-memory log
  auditLog.push(entry);

  // Trim log if too large
  if (auditLog.length > MAX_LOG_SIZE) {
    auditLog = auditLog.slice(-MAX_LOG_SIZE);
  }

  // Persist to localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('auditLog') || '[]');
    stored.push(entry);
    // Keep last 5000 entries in localStorage
    localStorage.setItem('auditLog', JSON.stringify(stored.slice(-5000)));
  } catch (e) {
    console.error('Failed to persist audit log:', e);
  }

  // Console output for debugging
  console.log(`[AUDIT] ${severity} - ${eventType}: ${description}`, details);

  return entry;
};

// Convenience methods for common events

/**
 * Log warning creation
 */
export const logWarningCreated = (warningData) => {
  return createAuditEntry(
    AUDIT_EVENTS.WARNING_CREATED,
    SEVERITY.INFO,
    `New ${warningData.warningLevel} created for ${warningData.hazardType}`,
    {
      module: 'Warning',
      warningId: warningData.id,
      hazardType: warningData.hazardType,
      warningLevel: warningData.warningLevel,
      affectedDistricts: warningData.spatialExtent,
      validFrom: warningData.validFrom,
      validTo: warningData.validTo
    }
  );
};

/**
 * Log warning approval
 */
export const logWarningApproved = (warningData, approverComments = '') => {
  return createAuditEntry(
    AUDIT_EVENTS.WARNING_APPROVED,
    SEVERITY.INFO,
    `${warningData.warningLevel} for ${warningData.hazardType} approved`,
    {
      module: 'Warning',
      warningId: warningData.id,
      hazardType: warningData.hazardType,
      warningLevel: warningData.warningLevel,
      approverComments,
      affectedDistricts: warningData.spatialExtent
    }
  );
};

/**
 * Log warning rejection
 */
export const logWarningRejected = (warningData, reason) => {
  return createAuditEntry(
    AUDIT_EVENTS.WARNING_REJECTED,
    SEVERITY.WARNING,
    `${warningData.warningLevel} for ${warningData.hazardType} rejected`,
    {
      module: 'Warning',
      warningId: warningData.id,
      hazardType: warningData.hazardType,
      warningLevel: warningData.warningLevel,
      rejectionReason: reason
    }
  );
};

/**
 * Log warning published
 */
export const logWarningPublished = (warningData, channels = []) => {
  return createAuditEntry(
    AUDIT_EVENTS.WARNING_PUBLISHED,
    SEVERITY.INFO,
    `${warningData.warningLevel} for ${warningData.hazardType} published`,
    {
      module: 'Warning',
      warningId: warningData.id,
      hazardType: warningData.hazardType,
      warningLevel: warningData.warningLevel,
      publishedChannels: channels,
      affectedDistricts: warningData.spatialExtent
    }
  );
};

/**
 * Log bulletin generation
 */
export const logBulletinGenerated = (warningData, format = 'PDF') => {
  return createAuditEntry(
    AUDIT_EVENTS.BULLETIN_GENERATED,
    SEVERITY.INFO,
    `${format} Bulletin generated for ${warningData.hazardType}`,
    {
      module: 'Reports',
      warningId: warningData.id,
      hazardType: warningData.hazardType,
      warningLevel: warningData.warningLevel,
      format,
      affectedDistricts: warningData.spatialExtent
    }
  );
};

/**
 * Log SMS sent
 */
export const logSMSSent = (smsData) => {
  return createAuditEntry(
    AUDIT_EVENTS.SMS_SENT,
    SEVERITY.INFO,
    `SMS sent to ${smsData.recipientCount} recipients in ${smsData.districts?.length || 0} districts`,
    {
      module: 'SMS',
      districts: smsData.districts,
      recipientCount: smsData.recipientCount,
      messageType: smsData.messageType,
      provider: smsData.provider,
      success: smsData.success
    }
  );
};

/**
 * Log user login
 */
export const logUserLogin = (username, success = true, reason = '') => {
  return createAuditEntry(
    success ? AUDIT_EVENTS.USER_LOGIN : AUDIT_EVENTS.USER_LOGIN_FAILED,
    success ? SEVERITY.INFO : SEVERITY.WARNING,
    success ? `User ${username} logged in successfully` : `Failed login attempt for ${username}`,
    {
      module: 'Auth',
      username,
      success,
      failureReason: reason
    }
  );
};

/**
 * Log user logout
 */
export const logUserLogout = (username) => {
  return createAuditEntry(
    AUDIT_EVENTS.USER_LOGOUT,
    SEVERITY.INFO,
    `User ${username} logged out`,
    {
      module: 'Auth',
      username
    }
  );
};

/**
 * Log data import
 */
export const logDataImport = (dataType, recordCount, source) => {
  return createAuditEntry(
    AUDIT_EVENTS.DATA_IMPORTED,
    SEVERITY.INFO,
    `${recordCount} ${dataType} records imported from ${source}`,
    {
      module: 'Data',
      dataType,
      recordCount,
      source
    }
  );
};

/**
 * Log data export
 */
export const logDataExport = (dataType, recordCount, format) => {
  return createAuditEntry(
    AUDIT_EVENTS.DATA_EXPORTED,
    SEVERITY.INFO,
    `${recordCount} ${dataType} records exported as ${format}`,
    {
      module: 'Data',
      dataType,
      recordCount,
      format
    }
  );
};

/**
 * Log risk calculation
 */
export const logRiskCalculated = (district, riskScore, components) => {
  return createAuditEntry(
    AUDIT_EVENTS.RISK_CALCULATED,
    SEVERITY.INFO,
    `Risk calculated for ${district}: ${riskScore.toFixed(2)}`,
    {
      module: 'Risk',
      district,
      riskScore,
      components
    }
  );
};

/**
 * Log system error
 */
export const logSystemError = (error, context = '') => {
  return createAuditEntry(
    AUDIT_EVENTS.SYSTEM_ERROR,
    SEVERITY.ERROR,
    `System error: ${error.message || error}`,
    {
      module: 'System',
      errorMessage: error.message || error,
      errorStack: error.stack,
      context
    }
  );
};

/**
 * Get audit log
 * @param {object} filters - Optional filters
 */
export const getAuditLog = (filters = {}) => {
  try {
    let log = JSON.parse(localStorage.getItem('auditLog') || '[]');

    // Apply filters
    if (filters.eventType) {
      log = log.filter(e => e.eventType === filters.eventType);
    }

    if (filters.severity) {
      log = log.filter(e => e.severity === filters.severity);
    }

    if (filters.userId) {
      log = log.filter(e => e.user.userId === filters.userId);
    }

    if (filters.username) {
      log = log.filter(e => e.user.username === filters.username);
    }

    if (filters.module) {
      log = log.filter(e => e.details.module === filters.module);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      log = log.filter(e => new Date(e.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      log = log.filter(e => new Date(e.timestamp) <= end);
    }

    // Sort by timestamp (newest first)
    log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    if (filters.limit) {
      log = log.slice(0, filters.limit);
    }

    return log;
  } catch (e) {
    console.error('Failed to get audit log:', e);
    return auditLog;
  }
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = () => {
  const log = getAuditLog();

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Count by event type
  const eventTypeCounts = {};
  const severityCounts = { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 };
  const moduleCounts = {};
  const userActivityCounts = {};

  log.forEach(entry => {
    // Event type counts
    eventTypeCounts[entry.eventType] = (eventTypeCounts[entry.eventType] || 0) + 1;

    // Severity counts
    severityCounts[entry.severity] = (severityCounts[entry.severity] || 0) + 1;

    // Module counts
    const module = entry.details?.module || 'Unknown';
    moduleCounts[module] = (moduleCounts[module] || 0) + 1;

    // User activity counts
    const username = entry.user?.username || 'Unknown';
    userActivityCounts[username] = (userActivityCounts[username] || 0) + 1;
  });

  return {
    total: log.length,
    last24Hours: log.filter(e => new Date(e.timestamp) >= last24h).length,
    last7Days: log.filter(e => new Date(e.timestamp) >= last7d).length,
    last30Days: log.filter(e => new Date(e.timestamp) >= last30d).length,
    byEventType: eventTypeCounts,
    bySeverity: severityCounts,
    byModule: moduleCounts,
    byUser: userActivityCounts,
    warnings: {
      created: eventTypeCounts[AUDIT_EVENTS.WARNING_CREATED] || 0,
      approved: eventTypeCounts[AUDIT_EVENTS.WARNING_APPROVED] || 0,
      rejected: eventTypeCounts[AUDIT_EVENTS.WARNING_REJECTED] || 0,
      published: eventTypeCounts[AUDIT_EVENTS.WARNING_PUBLISHED] || 0
    },
    sms: {
      sent: eventTypeCounts[AUDIT_EVENTS.SMS_SENT] || 0,
      failed: eventTypeCounts[AUDIT_EVENTS.SMS_FAILED] || 0
    },
    errors: severityCounts.ERROR + severityCounts.CRITICAL
  };
};

/**
 * Export audit log to CSV
 */
export const exportAuditLogCSV = (filters = {}) => {
  const log = getAuditLog(filters);

  const headers = [
    'ID',
    'Timestamp',
    'Event Type',
    'Severity',
    'Description',
    'User',
    'Role',
    'Module',
    'Details'
  ];

  const rows = log.map(entry => [
    entry.id,
    entry.timestamp,
    entry.eventType,
    entry.severity,
    entry.description,
    entry.user.username,
    entry.user.role,
    entry.details.module || '',
    JSON.stringify(entry.details)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  return true;
};

/**
 * Clear old audit entries
 */
export const clearOldAuditEntries = (daysOld = 90) => {
  try {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let log = JSON.parse(localStorage.getItem('auditLog') || '[]');

    const originalCount = log.length;
    log = log.filter(e => new Date(e.timestamp) >= cutoff);

    localStorage.setItem('auditLog', JSON.stringify(log));

    const deletedCount = originalCount - log.length;
    console.log(`Cleared ${deletedCount} audit entries older than ${daysOld} days`);

    return deletedCount;
  } catch (e) {
    console.error('Failed to clear old audit entries:', e);
    return 0;
  }
};

export default {
  AUDIT_EVENTS,
  SEVERITY,
  createAuditEntry,
  logWarningCreated,
  logWarningApproved,
  logWarningRejected,
  logWarningPublished,
  logBulletinGenerated,
  logSMSSent,
  logUserLogin,
  logUserLogout,
  logDataImport,
  logDataExport,
  logRiskCalculated,
  logSystemError,
  getAuditLog,
  getAuditStatistics,
  exportAuditLogCSV,
  clearOldAuditEntries
};
