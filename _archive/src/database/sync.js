/**
 * DATA SYNCHRONIZATION - Sync and Versioning Entry Point
 *
 * Data synchronization, conflict resolution, and version management.
 * This is the primary entry point for sync-related imports.
 */

// ============================================================================
// DATA SYNC SERVICE
// ============================================================================

export {
  // Configuration
  SYNC_CONFIG,

  // Error classes
  SyncError,
  ConflictError,
  LockError,

  // Event system
  syncEvents,

  // Change tracking
  getUnsyncedChanges,
  markChangesSynced,
  getChangeLog,

  // Conflict management
  detectConflict,
  resolveConflict,
  getPendingConflicts,
  manuallyResolveConflict,

  // Locking
  acquireLock,
  releaseLock,
  getLockInfo,
  cleanExpiredLocks,

  // Sync queue
  queueSync,
  getQueueStatus,

  // Version management
  createDataVersion,
  getVersionHistory,
  getLatestVersion,
  getVersion,
  rollbackToVersion,
  compareVersions,

  // Scheduled jobs
  createSyncJob,
  getSyncJobs,
  setSyncJobEnabled,
  deleteSyncJob,

  // Notifications
  getNotifications,
  markNotificationRead,
  clearNotifications,

  // State management
  getSyncState,
  getSyncSummary,
  pauseSync,
  resumeSync,
  clearSyncErrors,

  // Data access
  getAllSyncedData,
  getSyncedData,
  getAPISyncedData,
  setSyncedData
} from './dataSyncService.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import dataSyncService from './dataSyncService.js';

export default dataSyncService;
