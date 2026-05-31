/**
 * DATA EXPORT & BACKUP - Export and Backup Entry Point
 *
 * Data export, backup creation, and restoration utilities.
 * This is the primary entry point for export/backup operations.
 */

// ============================================================================
// DATA EXPORT & BACKUP
// ============================================================================

export {
  // Configuration
  BACKUP_CONFIG,
  EXPORT_FORMATS,
  EXPORT_TEMPLATES,

  // Error classes
  ExportBackupError,
  BackupNotFoundError,
  IntegrityError,
  RestoreError,

  // Translation
  t,

  // Data export functions
  exportRiskData,
  exportIndicators,
  exportFullDatabase,
  exportAuditLog,

  // Backup management
  createBackup,
  getBackups,
  getBackup,
  deleteBackup,
  restoreFromBackup,
  verifyBackupIntegrity,

  // Scheduled backups
  scheduleBackups,
  getBackupSchedule,
  disableScheduledBackups,
  triggerScheduledBackup,

  // History and statistics
  getExportHistory,
  getBackupStats,
  clearExportHistory,

  // Change logging
  logChange,
  getChangeLog
} from './dataExportBackup.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import dataExportBackup from './dataExportBackup.js';

export default dataExportBackup;
