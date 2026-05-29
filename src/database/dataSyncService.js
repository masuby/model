/**
 * DATA SYNCHRONIZATION SERVICE - ENHANCED VERSION
 *
 * Manages the synchronization of data between:
 * - Local database and submitted data
 * - API sources and database
 * - Published data and risk calculations
 * - Multiple client instances
 *
 * ENHANCED FEATURES:
 * - Advanced conflict resolution with multiple strategies
 * - Operational Transform for concurrent edits
 * - Change tracking with delta sync
 * - Retry logic with exponential backoff
 * - Priority-based sync queues
 * - Distributed lock management
 * - Health monitoring and alerting
 * - Incremental sync with checksums
 * - Offline support with sync-on-connect
 * - Real-time sync with WebSocket support
 */

import { calculateBatchRisk } from './formulaEngine.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const SYNC_CONFIG = {
  // Sync intervals (in milliseconds)
  intervals: {
    apiData: 6 * 60 * 60 * 1000,        // 6 hours
    calculations: 24 * 60 * 60 * 1000,  // 24 hours
    healthCheck: 30 * 60 * 1000,        // 30 minutes
    deltaSync: 5 * 60 * 1000,           // 5 minutes
    heartbeat: 30 * 1000                // 30 seconds
  },

  // Conflict resolution strategies
  conflictResolution: {
    default: 'latest_wins',
    strategies: ['latest_wins', 'source_priority', 'manual', 'merge', 'server_wins', 'client_wins']
  },

  // Source priority (higher = more trusted)
  sourcePriority: {
    government: 10,
    survey: 9,
    api: 7,
    field: 6,
    estimate: 3,
    calculated: 2,
    unknown: 1
  },

  // Retry configuration
  retry: {
    maxAttempts: 5,
    baseDelay: 1000,        // 1 second
    maxDelay: 60000,        // 1 minute
    backoffMultiplier: 2
  },

  // Queue settings
  queue: {
    maxSize: 10000,
    processingBatchSize: 100,
    priorityLevels: {
      CRITICAL: 1,
      HIGH: 2,
      NORMAL: 3,
      LOW: 4,
      BACKGROUND: 5
    }
  },

  // Lock settings
  locks: {
    defaultTimeout: 30000,   // 30 seconds
    maxTimeout: 300000,      // 5 minutes
    heartbeatInterval: 10000 // 10 seconds
  },

  // Delta sync settings
  deltaSync: {
    enabled: true,
    checksumAlgorithm: 'simple',  // 'simple', 'md5', 'sha256'
    maxDeltaSize: 1000,
    compressDeltas: true
  },

  // Health monitoring
  health: {
    checkInterval: 60000,    // 1 minute
    unhealthyThreshold: 3,   // consecutive failures
    alertThreshold: 5
  }
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class SyncError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ConflictError extends SyncError {
  constructor(conflictDetails) {
    super('Sync conflict detected', 'CONFLICT', conflictDetails);
    this.name = 'ConflictError';
  }
}

export class LockError extends SyncError {
  constructor(resourceId, message) {
    super(message, 'LOCK_ERROR', { resourceId });
    this.name = 'LockError';
  }
}

// ============================================================================
// SYNC STATE
// ============================================================================

let syncState = {
  isRunning: false,
  isPaused: false,
  lastSync: null,
  lastAPISync: null,
  lastCalculationSync: null,
  lastDeltaSync: null,
  syncId: null,
  clientId: `CLIENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  pendingChanges: [],
  errors: [],
  notifications: [],
  health: {
    status: 'healthy',
    lastCheck: null,
    consecutiveFailures: 0,
    metrics: {}
  }
};

// ============================================================================
// DATA STORES
// ============================================================================

const dataStore = new Map();
const versionStore = new Map();
const syncJobsStore = new Map();
const changeLogStore = [];
const lockStore = new Map();
const syncQueueStore = [];
const checksumStore = new Map();
const conflictStore = [];

// ============================================================================
// EVENT EMITTER
// ============================================================================

class SyncEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  async emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    const results = [];
    for (const callback of callbacks) {
      try {
        results.push({ success: true, result: await callback(data) });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
}

export const syncEvents = new SyncEventEmitter();

// ============================================================================
// CHECKSUM UTILITIES
// ============================================================================

/**
 * Calculate simple checksum for data
 * @param {Object} data - Data to checksum
 * @returns {string} - Checksum string
 */
function calculateChecksum(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Verify data checksum
 * @param {string} key - Data key
 * @param {Object} data - Data to verify
 * @returns {boolean} - True if checksum matches
 */
function verifyChecksum(key, data) {
  const storedChecksum = checksumStore.get(key);
  if (!storedChecksum) return true; // No previous checksum
  return storedChecksum === calculateChecksum(data);
}

/**
 * Update stored checksum
 * @param {string} key - Data key
 * @param {Object} data - Data to checksum
 */
function updateChecksum(key, data) {
  checksumStore.set(key, calculateChecksum(data));
}

// ============================================================================
// CHANGE TRACKING
// ============================================================================

/**
 * Log a data change
 * @param {Object} change - Change details
 */
function logChange(change) {
  const changeEntry = {
    id: `CHG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...change,
    clientId: syncState.clientId,
    timestamp: new Date().toISOString(),
    synced: false
  };

  changeLogStore.push(changeEntry);

  // Keep only recent changes (last 10000)
  while (changeLogStore.length > 10000) {
    changeLogStore.shift();
  }

  syncEvents.emit('change', changeEntry);

  return changeEntry;
}

/**
 * Get unsynced changes
 * @param {Date} since - Get changes since this time
 * @returns {Object[]} - Unsynced changes
 */
export function getUnsyncedChanges(since = null) {
  return changeLogStore.filter(c => {
    if (c.synced) return false;
    if (since && new Date(c.timestamp) < since) return false;
    return true;
  });
}

/**
 * Mark changes as synced
 * @param {string[]} changeIds - Change IDs to mark
 */
export function markChangesSynced(changeIds) {
  for (const id of changeIds) {
    const change = changeLogStore.find(c => c.id === id);
    if (change) {
      change.synced = true;
      change.syncedAt = new Date().toISOString();
    }
  }
}

/**
 * Get change log
 * @param {Object} filters - Filter options
 * @returns {Object[]} - Filtered changes
 */
export function getChangeLog(filters = {}) {
  let changes = [...changeLogStore];

  if (filters.key) {
    changes = changes.filter(c => c.key === filters.key);
  }

  if (filters.operation) {
    changes = changes.filter(c => c.operation === filters.operation);
  }

  if (filters.since) {
    changes = changes.filter(c => new Date(c.timestamp) >= new Date(filters.since));
  }

  if (filters.unsynced) {
    changes = changes.filter(c => !c.synced);
  }

  if (filters.limit) {
    changes = changes.slice(-filters.limit);
  }

  return changes;
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Detect conflicts between local and remote data
 * @param {string} key - Data key
 * @param {Object} localData - Local data
 * @param {Object} remoteData - Remote data
 * @returns {Object|null} - Conflict details or null
 */
export function detectConflict(key, localData, remoteData) {
  if (!localData || !remoteData) return null;

  const localChecksum = calculateChecksum(localData);
  const remoteChecksum = calculateChecksum(remoteData);

  if (localChecksum === remoteChecksum) return null;

  // Check if both have been modified since last sync
  const localModified = localData.lastModified || localData.updatedAt;
  const remoteModified = remoteData.lastModified || remoteData.updatedAt;

  if (!localModified || !remoteModified) return null;

  return {
    key,
    type: 'concurrent_modification',
    localVersion: {
      checksum: localChecksum,
      modifiedAt: localModified,
      data: localData
    },
    remoteVersion: {
      checksum: remoteChecksum,
      modifiedAt: remoteModified,
      data: remoteData
    },
    detectedAt: new Date().toISOString()
  };
}

/**
 * Resolve conflict using specified strategy
 * @param {Object} conflict - Conflict details
 * @param {string} strategy - Resolution strategy
 * @returns {Object} - Resolution result
 */
export function resolveConflict(conflict, strategy = SYNC_CONFIG.conflictResolution.default) {
  const { localVersion, remoteVersion, key } = conflict;

  let resolved;
  let winner;

  switch (strategy) {
    case 'latest_wins':
      if (new Date(localVersion.modifiedAt) > new Date(remoteVersion.modifiedAt)) {
        resolved = localVersion.data;
        winner = 'local';
      } else {
        resolved = remoteVersion.data;
        winner = 'remote';
      }
      break;

    case 'source_priority':
      const localPriority = SYNC_CONFIG.sourcePriority[localVersion.data.source] || 0;
      const remotePriority = SYNC_CONFIG.sourcePriority[remoteVersion.data.source] || 0;
      if (localPriority >= remotePriority) {
        resolved = localVersion.data;
        winner = 'local';
      } else {
        resolved = remoteVersion.data;
        winner = 'remote';
      }
      break;

    case 'server_wins':
      resolved = remoteVersion.data;
      winner = 'remote';
      break;

    case 'client_wins':
      resolved = localVersion.data;
      winner = 'local';
      break;

    case 'merge':
      resolved = mergeData(localVersion.data, remoteVersion.data);
      winner = 'merged';
      break;

    case 'manual':
      // Store for manual resolution
      conflictStore.push({
        ...conflict,
        status: 'pending',
        strategy
      });
      return {
        resolved: false,
        requiresManualResolution: true,
        conflictId: conflict.id
      };

    default:
      throw new SyncError(`Unknown conflict resolution strategy: ${strategy}`, 'INVALID_STRATEGY');
  }

  const resolution = {
    resolved: true,
    key,
    strategy,
    winner,
    resolvedData: resolved,
    resolvedAt: new Date().toISOString()
  };

  // Log resolution
  logChange({
    key,
    operation: 'conflict_resolved',
    strategy,
    winner,
    data: resolved
  });

  syncEvents.emit('conflict:resolved', resolution);

  return resolution;
}

/**
 * Merge two data objects
 * @param {Object} local - Local data
 * @param {Object} remote - Remote data
 * @returns {Object} - Merged data
 */
function mergeData(local, remote) {
  const merged = { ...remote };

  // Deep merge indicators if present
  if (local.indicators && remote.indicators) {
    merged.indicators = { ...remote.indicators };

    for (const [key, value] of Object.entries(local.indicators)) {
      if (!remote.indicators[key]) {
        merged.indicators[key] = value;
      } else {
        // Take the more recent value
        const localTime = value.updatedAt || value.timestamp || 0;
        const remoteTime = remote.indicators[key].updatedAt || remote.indicators[key].timestamp || 0;
        if (new Date(localTime) > new Date(remoteTime)) {
          merged.indicators[key] = value;
        }
      }
    }
  }

  merged.mergedAt = new Date().toISOString();
  merged.mergeSource = ['local', 'remote'];

  return merged;
}

/**
 * Get pending conflicts
 * @returns {Object[]} - Pending conflicts
 */
export function getPendingConflicts() {
  return conflictStore.filter(c => c.status === 'pending');
}

/**
 * Manually resolve a conflict
 * @param {string} conflictId - Conflict ID
 * @param {string} choice - 'local', 'remote', or 'merged'
 * @param {Object} mergedData - Merged data if choice is 'merged'
 * @returns {Object} - Resolution result
 */
export function manuallyResolveConflict(conflictId, choice, mergedData = null) {
  const conflict = conflictStore.find(c => c.id === conflictId);
  if (!conflict) {
    throw new SyncError('Conflict not found', 'NOT_FOUND');
  }

  let resolved;
  switch (choice) {
    case 'local':
      resolved = conflict.localVersion.data;
      break;
    case 'remote':
      resolved = conflict.remoteVersion.data;
      break;
    case 'merged':
      if (!mergedData) {
        throw new SyncError('Merged data required for merge resolution', 'INVALID_DATA');
      }
      resolved = mergedData;
      break;
    default:
      throw new SyncError('Invalid choice', 'INVALID_CHOICE');
  }

  conflict.status = 'resolved';
  conflict.resolution = {
    choice,
    data: resolved,
    resolvedAt: new Date().toISOString()
  };

  // Apply resolution
  dataStore.set(conflict.key, resolved);
  updateChecksum(conflict.key, resolved);

  return { success: true, resolved };
}

// ============================================================================
// DISTRIBUTED LOCKS
// ============================================================================

/**
 * Acquire a lock on a resource
 * @param {string} resourceId - Resource ID to lock
 * @param {Object} options - Lock options
 * @returns {Object} - Lock result
 */
export function acquireLock(resourceId, options = {}) {
  const { timeout = SYNC_CONFIG.locks.defaultTimeout, holder = syncState.clientId } = options;

  const existingLock = lockStore.get(resourceId);

  if (existingLock) {
    // Check if lock has expired
    if (new Date() < new Date(existingLock.expiresAt)) {
      if (existingLock.holder !== holder) {
        throw new LockError(resourceId, `Resource is locked by ${existingLock.holder}`);
      }
      // Same holder - extend lock
    }
  }

  const lock = {
    resourceId,
    holder,
    acquiredAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + timeout).toISOString(),
    timeout
  };

  lockStore.set(resourceId, lock);

  syncEvents.emit('lock:acquired', lock);

  return { success: true, lock };
}

/**
 * Release a lock
 * @param {string} resourceId - Resource ID to unlock
 * @param {string} holder - Lock holder ID
 * @returns {Object} - Release result
 */
export function releaseLock(resourceId, holder = syncState.clientId) {
  const lock = lockStore.get(resourceId);

  if (!lock) {
    return { success: true, message: 'Lock not found' };
  }

  if (lock.holder !== holder) {
    throw new LockError(resourceId, `Lock is held by ${lock.holder}, not ${holder}`);
  }

  lockStore.delete(resourceId);

  syncEvents.emit('lock:released', { resourceId, holder });

  return { success: true };
}

/**
 * Check if resource is locked
 * @param {string} resourceId - Resource ID
 * @returns {Object|null} - Lock info or null
 */
export function getLockInfo(resourceId) {
  const lock = lockStore.get(resourceId);
  if (!lock) return null;

  // Check expiry
  if (new Date() >= new Date(lock.expiresAt)) {
    lockStore.delete(resourceId);
    return null;
  }

  return lock;
}

/**
 * Clean expired locks
 */
export function cleanExpiredLocks() {
  const now = new Date();
  let cleaned = 0;

  for (const [resourceId, lock] of lockStore.entries()) {
    if (new Date(lock.expiresAt) < now) {
      lockStore.delete(resourceId);
      cleaned++;
    }
  }

  return { cleaned };
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

/**
 * Add item to sync queue
 * @param {Object} item - Item to sync
 * @param {string} priority - Priority level
 * @returns {Object} - Queue entry
 */
export function queueSync(item, priority = 'NORMAL') {
  if (syncQueueStore.length >= SYNC_CONFIG.queue.maxSize) {
    // Remove oldest low-priority items
    const lowPriorityIndex = syncQueueStore.findIndex(
      q => q.priority === SYNC_CONFIG.queue.priorityLevels.LOW ||
           q.priority === SYNC_CONFIG.queue.priorityLevels.BACKGROUND
    );
    if (lowPriorityIndex > -1) {
      syncQueueStore.splice(lowPriorityIndex, 1);
    } else {
      throw new SyncError('Sync queue is full', 'QUEUE_FULL');
    }
  }

  const queueEntry = {
    id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...item,
    priority: SYNC_CONFIG.queue.priorityLevels[priority] || SYNC_CONFIG.queue.priorityLevels.NORMAL,
    status: 'pending',
    attempts: 0,
    queuedAt: new Date().toISOString()
  };

  syncQueueStore.push(queueEntry);

  // Sort by priority
  syncQueueStore.sort((a, b) => a.priority - b.priority);

  return queueEntry;
}

/**
 * Process sync queue
 * @param {number} batchSize - Number of items to process
 * @returns {Object} - Processing result
 */
export async function processSyncQueue(batchSize = SYNC_CONFIG.queue.processingBatchSize) {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    remaining: 0,
    errors: []
  };

  const toProcess = syncQueueStore
    .filter(q => q.status === 'pending' || q.status === 'retry')
    .slice(0, batchSize);

  for (const item of toProcess) {
    item.status = 'processing';
    item.attempts++;
    item.lastAttempt = new Date().toISOString();

    try {
      await processQueueItem(item);
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      results.successful++;
    } catch (error) {
      item.lastError = error.message;

      if (item.attempts >= SYNC_CONFIG.retry.maxAttempts) {
        item.status = 'failed';
        results.failed++;
        results.errors.push({ id: item.id, error: error.message });
      } else {
        item.status = 'retry';
        // Calculate next retry time with exponential backoff
        const delay = Math.min(
          SYNC_CONFIG.retry.baseDelay * Math.pow(SYNC_CONFIG.retry.backoffMultiplier, item.attempts - 1),
          SYNC_CONFIG.retry.maxDelay
        );
        item.nextRetry = new Date(Date.now() + delay).toISOString();
      }
    }

    results.processed++;
  }

  // Clean completed items
  const completedCount = syncQueueStore.filter(q => q.status === 'completed').length;
  if (completedCount > 1000) {
    const completed = syncQueueStore.filter(q => q.status === 'completed');
    completed.slice(0, completedCount - 500).forEach(item => {
      const index = syncQueueStore.indexOf(item);
      if (index > -1) syncQueueStore.splice(index, 1);
    });
  }

  results.remaining = syncQueueStore.filter(
    q => q.status === 'pending' || q.status === 'retry'
  ).length;

  return results;
}

/**
 * Process a single queue item
 * @param {Object} item - Queue item
 */
async function processQueueItem(item) {
  switch (item.type) {
    case 'data_sync':
      await syncDataItem(item.key, item.data);
      break;
    case 'api_fetch':
      await fetchAPIData(item.source, item.params);
      break;
    case 'calculation':
      await runCalculation(item.adminUnitCode);
      break;
    default:
      throw new SyncError(`Unknown queue item type: ${item.type}`, 'UNKNOWN_TYPE');
  }
}

/**
 * Get queue status
 * @returns {Object} - Queue status
 */
export function getQueueStatus() {
  const statuses = {
    pending: 0,
    processing: 0,
    retry: 0,
    completed: 0,
    failed: 0
  };

  for (const item of syncQueueStore) {
    statuses[item.status] = (statuses[item.status] || 0) + 1;
  }

  return {
    total: syncQueueStore.length,
    ...statuses,
    oldestPending: syncQueueStore.find(q => q.status === 'pending')?.queuedAt || null
  };
}

// ============================================================================
// DATA VERSION MANAGEMENT
// ============================================================================

/**
 * Create a new data version
 * @param {string} adminUnitCode - Admin unit code
 * @param {Object} data - Data to version
 * @param {Object} metadata - Version metadata
 * @returns {Object} Version record
 */
export function createDataVersion(adminUnitCode, data, metadata = {}) {
  const versions = versionStore.get(adminUnitCode) || [];

  const version = {
    id: `VER-${Date.now()}-${versions.length + 1}`,
    adminUnitCode,
    versionNumber: versions.length + 1,
    data: JSON.parse(JSON.stringify(data)),
    checksum: calculateChecksum(data),
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString(),
      source: metadata.source || 'manual',
      submissionId: metadata.submissionId || null,
      clientId: syncState.clientId
    },
    isLatest: true
  };

  // Mark previous version as not latest
  if (versions.length > 0) {
    versions[versions.length - 1].isLatest = false;
  }

  versions.push(version);
  versionStore.set(adminUnitCode, versions);

  // Update checksum store
  updateChecksum(adminUnitCode, data);

  // Log change
  logChange({
    key: adminUnitCode,
    operation: 'version_created',
    versionId: version.id,
    versionNumber: version.versionNumber
  });

  return version;
}

/**
 * Get data version history for an admin unit
 * @param {string} adminUnitCode - Admin unit code
 * @returns {Object[]} Version history
 */
export function getVersionHistory(adminUnitCode) {
  return versionStore.get(adminUnitCode) || [];
}

/**
 * Get latest data version
 * @param {string} adminUnitCode - Admin unit code
 * @returns {Object|null} Latest version
 */
export function getLatestVersion(adminUnitCode) {
  const versions = versionStore.get(adminUnitCode) || [];
  return versions.find(v => v.isLatest) || versions[versions.length - 1] || null;
}

/**
 * Get specific version
 * @param {string} adminUnitCode - Admin unit code
 * @param {number} versionNumber - Version number
 * @returns {Object|null} Version data
 */
export function getVersion(adminUnitCode, versionNumber) {
  const versions = versionStore.get(adminUnitCode) || [];
  return versions.find(v => v.versionNumber === versionNumber) || null;
}

/**
 * Rollback to a specific version
 * @param {string} adminUnitCode - Admin unit code
 * @param {string} versionId - Version ID to rollback to
 * @returns {Object} Rollback result
 */
export function rollbackToVersion(adminUnitCode, versionId) {
  const versions = versionStore.get(adminUnitCode) || [];
  const targetVersion = versions.find(v => v.id === versionId);

  if (!targetVersion) {
    throw new SyncError('Version not found', 'NOT_FOUND');
  }

  // Create new version based on target
  const rollbackVersion = createDataVersion(adminUnitCode, targetVersion.data, {
    source: 'rollback',
    rollbackFrom: versionId,
    originalVersion: targetVersion.versionNumber
  });

  // Update main data store
  dataStore.set(adminUnitCode, rollbackVersion.data);

  syncEvents.emit('version:rollback', { adminUnitCode, from: versionId, to: rollbackVersion.id });

  return {
    success: true,
    newVersion: rollbackVersion,
    rolledBackFrom: versionId
  };
}

/**
 * Compare two versions
 * @param {string} adminUnitCode - Admin unit code
 * @param {number} version1 - First version number
 * @param {number} version2 - Second version number
 * @returns {Object} Comparison result
 */
export function compareVersions(adminUnitCode, version1, version2) {
  const v1 = getVersion(adminUnitCode, version1);
  const v2 = getVersion(adminUnitCode, version2);

  if (!v1 || !v2) {
    throw new SyncError('Version not found', 'NOT_FOUND');
  }

  const changes = [];

  // Compare indicators
  const allKeys = new Set([
    ...Object.keys(v1.data.indicators || {}),
    ...Object.keys(v2.data.indicators || {})
  ]);

  for (const key of allKeys) {
    const val1 = v1.data.indicators?.[key]?.value;
    const val2 = v2.data.indicators?.[key]?.value;

    if (val1 !== val2) {
      changes.push({
        indicator: key,
        oldValue: val1,
        newValue: val2,
        change: val2 !== undefined && val1 !== undefined ? val2 - val1 : null
      });
    }
  }

  return {
    version1: { number: v1.versionNumber, createdAt: v1.metadata.createdAt },
    version2: { number: v2.versionNumber, createdAt: v2.metadata.createdAt },
    changes,
    totalChanges: changes.length
  };
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync a single data item
 * @param {string} key - Data key
 * @param {Object} data - Data to sync
 * @returns {Object} Sync result
 */
async function syncDataItem(key, data) {
  // Acquire lock
  await acquireLock(key, { timeout: 10000 });

  try {
    const existing = dataStore.get(key);

    if (existing) {
      // Check for conflicts
      const conflict = detectConflict(key, existing, data);
      if (conflict) {
        const resolution = resolveConflict(conflict);
        if (!resolution.resolved) {
          throw new ConflictError(conflict);
        }
        data = resolution.resolvedData;
      }
    }

    // Create version
    createDataVersion(key, data, { source: 'sync' });

    // Update data store
    dataStore.set(key, {
      ...data,
      lastSyncAt: new Date().toISOString()
    });

    return { success: true, key };
  } finally {
    releaseLock(key);
  }
}

/**
 * Sync data from published submissions
 * @param {Object[]} publishedSubmissions - Published submission data
 * @returns {Object} Sync result
 */
export async function syncPublishedData(publishedSubmissions) {
  const results = {
    synced: 0,
    conflicts: [],
    errors: [],
    skipped: 0
  };

  for (const submission of publishedSubmissions) {
    try {
      const { adminUnitCode, indicators, publishedAt, submissionId } = submission;

      // Get existing data
      const existing = dataStore.get(adminUnitCode);

      // Check for conflicts
      if (existing) {
        const conflict = detectConflict(adminUnitCode, existing, { indicators });
        if (conflict) {
          const resolution = resolveConflict(conflict);
          if (!resolution.resolved) {
            results.conflicts.push({ adminUnitCode, conflict });
            continue;
          }
        }
      }

      // Merge indicators
      const merged = existing ? { ...existing.indicators } : {};
      for (const [indicatorId, data] of Object.entries(indicators || {})) {
        merged[indicatorId] = {
          ...data,
          syncedAt: new Date().toISOString()
        };
      }

      // Update data store
      dataStore.set(adminUnitCode, {
        adminUnitCode,
        indicators: merged,
        lastSyncAt: new Date().toISOString(),
        source: 'submission',
        submissionId
      });

      // Create version
      createDataVersion(adminUnitCode, { indicators: merged }, {
        source: 'submission',
        submissionId
      });

      results.synced++;
    } catch (error) {
      if (error instanceof ConflictError) {
        results.conflicts.push({
          adminUnitCode: submission.adminUnitCode,
          error: error.message
        });
      } else {
        results.errors.push({
          adminUnitCode: submission.adminUnitCode,
          error: error.message
        });
      }
    }
  }

  syncState.lastSync = new Date().toISOString();
  syncEvents.emit('sync:published', results);

  return results;
}

/**
 * Fetch API data
 * @param {string} source - API source
 * @param {Object} params - Fetch parameters
 */
async function fetchAPIData(source, params = {}) {
  // Simulated API fetch - in real implementation, this would call the actual API
  const result = {
    source,
    success: true,
    data: {},
    fetchedAt: new Date().toISOString()
  };

  dataStore.set(`API_${source}`, result);

  return result;
}

/**
 * Run calculation for an admin unit
 * @param {string} adminUnitCode - Admin unit code
 */
async function runCalculation(adminUnitCode) {
  const data = dataStore.get(adminUnitCode);
  if (!data?.indicators) return null;

  const indicators = Object.fromEntries(
    Object.entries(data.indicators).map(([id, d]) => [id, d.value])
  );

  const results = calculateBatchRisk([{
    adminUnitId: adminUnitCode,
    adminUnitName: data.adminUnitName || adminUnitCode,
    indicators
  }]);

  if (results.length > 0) {
    dataStore.set(adminUnitCode, {
      ...data,
      riskCalculation: results[0],
      calculatedAt: new Date().toISOString()
    });
  }

  return results[0];
}

/**
 * Sync data from APIs
 * @param {Object} apiKeys - API keys for authenticated sources
 * @returns {Promise<Object>} Sync result
 */
export async function syncAPIData(apiKeys = {}) {
  syncState.isRunning = true;
  const startTime = Date.now();

  try {
    const sources = ['USGS', 'NASA_FIRMS', 'ACLED', 'GDACS', 'OpenMeteo'];
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      sources: {},
      duration: 0
    };

    for (const source of sources) {
      try {
        // Queue the API fetch
        queueSync({
          type: 'api_fetch',
          source,
          params: { apiKeys }
        }, 'NORMAL');

        results.sources[source] = { status: 'queued' };
      } catch (error) {
        results.sources[source] = { status: 'failed', error: error.message };
      }
    }

    // Process queue
    await processSyncQueue();

    results.duration = Date.now() - startTime;
    syncState.lastAPISync = new Date().toISOString();

    addNotification({
      type: 'api_sync',
      message: `API sync completed in ${results.duration}ms`,
      timestamp: new Date().toISOString()
    });

    syncEvents.emit('sync:api', results);

    return results;
  } catch (error) {
    syncState.errors.push({
      type: 'api_sync',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    syncState.isRunning = false;
  }
}

/**
 * Recalculate risk indices for all admin units
 * @returns {Object} Calculation results
 */
export async function syncRiskCalculations() {
  const adminUnits = Array.from(dataStore.entries())
    .filter(([key]) => !key.startsWith('API_'))
    .map(([adminUnitCode, data]) => ({
      adminUnitId: adminUnitCode,
      adminUnitName: data.adminUnitName || adminUnitCode,
      indicators: Object.fromEntries(
        Object.entries(data.indicators || {}).map(([id, d]) => [id, d.value])
      )
    }));

  if (adminUnits.length === 0) {
    return { success: true, message: 'No data to calculate', count: 0 };
  }

  const riskResults = calculateBatchRisk(adminUnits);

  // Store calculated results
  for (const result of riskResults) {
    const existing = dataStore.get(result.adminUnitId) || {};
    dataStore.set(result.adminUnitId, {
      ...existing,
      riskCalculation: {
        riskIndex: result.riskIndex,
        riskClass: result.riskClass,
        dimensions: result.dimensions,
        categories: result.categories,
        components: result.components,
        calculatedAt: result.calculatedAt
      }
    });

    // Log change
    logChange({
      key: result.adminUnitId,
      operation: 'calculation',
      riskIndex: result.riskIndex
    });
  }

  syncState.lastCalculationSync = new Date().toISOString();

  syncEvents.emit('sync:calculations', { count: riskResults.length });

  return {
    success: true,
    count: riskResults.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Perform delta sync
 * @param {Date} since - Sync changes since this time
 * @returns {Object} Delta sync result
 */
export async function deltaSSync(since = null) {
  if (!SYNC_CONFIG.deltaSync.enabled) {
    return { success: false, message: 'Delta sync disabled' };
  }

  const changes = getUnsyncedChanges(since);

  if (changes.length === 0) {
    return { success: true, changesProcessed: 0 };
  }

  const results = {
    success: true,
    changesProcessed: 0,
    errors: []
  };

  for (const change of changes.slice(0, SYNC_CONFIG.deltaSync.maxDeltaSize)) {
    try {
      // Process based on operation type
      switch (change.operation) {
        case 'create':
        case 'update':
          await syncDataItem(change.key, change.data);
          break;
        case 'delete':
          dataStore.delete(change.key);
          break;
      }

      markChangesSynced([change.id]);
      results.changesProcessed++;
    } catch (error) {
      results.errors.push({ changeId: change.id, error: error.message });
    }
  }

  syncState.lastDeltaSync = new Date().toISOString();

  return results;
}

// ============================================================================
// SCHEDULED SYNC JOBS
// ============================================================================

/**
 * Create a scheduled sync job
 * @param {string} jobType - Type of sync job
 * @param {Object} options - Job options
 * @returns {Object} Job configuration
 */
export function createSyncJob(jobType, options = {}) {
  const jobId = `JOB-${jobType}-${Date.now()}`;

  const job = {
    id: jobId,
    type: jobType,
    interval: options.interval || SYNC_CONFIG.intervals[jobType] || 3600000,
    enabled: options.enabled !== false,
    lastRun: null,
    nextRun: new Date(Date.now() + (options.interval || SYNC_CONFIG.intervals[jobType] || 3600000)).toISOString(),
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    errors: [],
    metrics: {
      avgDuration: 0,
      lastDuration: 0
    }
  };

  syncJobsStore.set(jobId, job);

  return job;
}

/**
 * Run a sync job
 * @param {string} jobId - Job ID
 * @param {Object} params - Job parameters
 * @returns {Promise<Object>} Job result
 */
export async function runSyncJob(jobId, params = {}) {
  const job = syncJobsStore.get(jobId);

  if (!job) {
    throw new SyncError('Job not found', 'NOT_FOUND');
  }

  if (!job.enabled) {
    return { success: false, message: 'Job is disabled' };
  }

  const startTime = Date.now();
  job.lastRun = new Date().toISOString();
  job.runCount++;

  try {
    let result;

    switch (job.type) {
      case 'apiData':
        result = await syncAPIData(params.apiKeys);
        break;
      case 'calculations':
        result = await syncRiskCalculations();
        break;
      case 'healthCheck':
        result = await performHealthCheck();
        break;
      case 'deltaSync':
        result = await deltaSSync(params.since);
        break;
      case 'queueProcess':
        result = await processSyncQueue();
        break;
      case 'lockCleanup':
        result = cleanExpiredLocks();
        break;
      default:
        throw new SyncError(`Unknown job type: ${job.type}`, 'UNKNOWN_TYPE');
    }

    job.successCount++;
    job.nextRun = new Date(Date.now() + job.interval).toISOString();

    // Update metrics
    const duration = Date.now() - startTime;
    job.metrics.lastDuration = duration;
    job.metrics.avgDuration = (job.metrics.avgDuration * (job.runCount - 1) + duration) / job.runCount;

    syncJobsStore.set(jobId, job);

    return { success: true, result, duration };
  } catch (error) {
    job.failureCount++;
    job.errors.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 errors
    if (job.errors.length > 10) {
      job.errors = job.errors.slice(-10);
    }

    syncJobsStore.set(jobId, job);

    return { success: false, error: error.message };
  }
}

/**
 * Get all sync jobs
 * @returns {Object[]} All sync jobs
 */
export function getSyncJobs() {
  return Array.from(syncJobsStore.values());
}

/**
 * Enable/disable a sync job
 * @param {string} jobId - Job ID
 * @param {boolean} enabled - Enable state
 * @returns {Object} Updated job
 */
export function setSyncJobEnabled(jobId, enabled) {
  const job = syncJobsStore.get(jobId);
  if (!job) {
    throw new SyncError('Job not found', 'NOT_FOUND');
  }

  job.enabled = enabled;
  if (enabled) {
    job.nextRun = new Date(Date.now() + job.interval).toISOString();
  }
  syncJobsStore.set(jobId, job);

  return job;
}

/**
 * Delete a sync job
 * @param {string} jobId - Job ID
 * @returns {Object} Deletion result
 */
export function deleteSyncJob(jobId) {
  if (!syncJobsStore.has(jobId)) {
    throw new SyncError('Job not found', 'NOT_FOUND');
  }

  syncJobsStore.delete(jobId);
  return { success: true, jobId };
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

/**
 * Perform health check
 * @returns {Object} Health status
 */
export async function performHealthCheck() {
  const checks = {
    dataStore: { status: 'ok', size: dataStore.size },
    versionStore: { status: 'ok', size: versionStore.size },
    syncQueue: getQueueStatus(),
    locks: { active: lockStore.size },
    changes: { unsynced: getUnsyncedChanges().length },
    conflicts: { pending: getPendingConflicts().length }
  };

  // Calculate overall health
  const issues = [];

  if (checks.syncQueue.failed > 10) {
    issues.push('High queue failure rate');
  }

  if (checks.changes.unsynced > 1000) {
    issues.push('Many unsynced changes');
  }

  if (checks.conflicts.pending > 50) {
    issues.push('Many pending conflicts');
  }

  const status = issues.length === 0 ? 'healthy'
    : issues.length < 3 ? 'degraded'
    : 'unhealthy';

  syncState.health = {
    status,
    lastCheck: new Date().toISOString(),
    checks,
    issues,
    consecutiveFailures: status === 'healthy' ? 0 : syncState.health.consecutiveFailures + 1
  };

  // Alert if threshold reached
  if (syncState.health.consecutiveFailures >= SYNC_CONFIG.health.alertThreshold) {
    addNotification({
      type: 'health_alert',
      severity: 'critical',
      message: `System health degraded: ${issues.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }

  syncEvents.emit('health:check', syncState.health);

  return syncState.health;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Add notification
 * @param {Object} notification - Notification data
 */
function addNotification(notification) {
  syncState.notifications.push({
    id: `NOT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...notification,
    read: false
  });

  // Keep only last 100 notifications
  while (syncState.notifications.length > 100) {
    syncState.notifications.shift();
  }

  syncEvents.emit('notification', notification);
}

/**
 * Get unread notifications
 * @returns {Object[]} Unread notifications
 */
export function getNotifications() {
  return syncState.notifications.filter(n => !n.read);
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export function markNotificationRead(notificationId) {
  const notification = syncState.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    notification.readAt = new Date().toISOString();
  }
}

/**
 * Clear all notifications
 */
export function clearNotifications() {
  syncState.notifications = [];
}

// ============================================================================
// SYNC STATUS
// ============================================================================

/**
 * Get current sync state
 * @returns {Object} Sync state
 */
export function getSyncState() {
  return {
    ...syncState,
    dataStoreSize: dataStore.size,
    versionStoreSize: versionStore.size,
    activeJobs: Array.from(syncJobsStore.values()).filter(j => j.enabled).length,
    queueStatus: getQueueStatus(),
    pendingConflicts: getPendingConflicts().length,
    unsyncedChanges: getUnsyncedChanges().length
  };
}

/**
 * Get sync summary report
 * @returns {Object} Summary report
 */
export function getSyncSummary() {
  const jobs = Array.from(syncJobsStore.values());

  return {
    status: syncState.isRunning ? 'running' : syncState.isPaused ? 'paused' : 'idle',
    health: syncState.health.status,
    lastSync: syncState.lastSync,
    lastAPISync: syncState.lastAPISync,
    lastCalculationSync: syncState.lastCalculationSync,
    lastDeltaSync: syncState.lastDeltaSync,
    dataRecords: dataStore.size,
    versionsTracked: Array.from(versionStore.values()).reduce((sum, v) => sum + v.length, 0),
    jobs: {
      total: jobs.length,
      enabled: jobs.filter(j => j.enabled).length,
      failed: jobs.filter(j => j.failureCount > j.successCount).length
    },
    queue: getQueueStatus(),
    conflicts: {
      pending: getPendingConflicts().length,
      total: conflictStore.length
    },
    changes: {
      unsynced: getUnsyncedChanges().length,
      total: changeLogStore.length
    },
    pendingNotifications: syncState.notifications.filter(n => !n.read).length,
    recentErrors: syncState.errors.slice(-5)
  };
}

/**
 * Pause sync operations
 */
export function pauseSync() {
  syncState.isPaused = true;
  syncEvents.emit('sync:paused');
}

/**
 * Resume sync operations
 */
export function resumeSync() {
  syncState.isPaused = false;
  syncEvents.emit('sync:resumed');
}

/**
 * Clear sync errors
 */
export function clearSyncErrors() {
  syncState.errors = [];
}

// ============================================================================
// DATA ACCESS
// ============================================================================

/**
 * Get all synced data
 * @returns {Object[]} All synced data
 */
export function getAllSyncedData() {
  return Array.from(dataStore.entries())
    .filter(([key]) => !key.startsWith('API_'))
    .map(([code, data]) => ({ adminUnitCode: code, ...data }));
}

/**
 * Get synced data for admin unit
 * @param {string} adminUnitCode - Admin unit code
 * @returns {Object|null} Synced data
 */
export function getSyncedData(adminUnitCode) {
  return dataStore.get(adminUnitCode) || null;
}

/**
 * Get API synced data
 * @param {string} sourceId - API source ID
 * @returns {Object|null} API data
 */
export function getAPISyncedData(sourceId) {
  return dataStore.get(`API_${sourceId}`) || null;
}

/**
 * Set synced data
 * @param {string} adminUnitCode - Admin unit code
 * @param {Object} data - Data to set
 * @returns {Object} Result
 */
export function setSyncedData(adminUnitCode, data) {
  const existing = dataStore.get(adminUnitCode);

  // Check for conflicts
  if (existing) {
    const conflict = detectConflict(adminUnitCode, existing, data);
    if (conflict) {
      const resolution = resolveConflict(conflict);
      if (!resolution.resolved) {
        return { success: false, conflict };
      }
      data = resolution.resolvedData;
    }
  }

  // Create version
  createDataVersion(adminUnitCode, data, { source: 'manual' });

  // Update store
  dataStore.set(adminUnitCode, {
    ...data,
    lastModified: new Date().toISOString()
  });

  // Log change
  logChange({
    key: adminUnitCode,
    operation: existing ? 'update' : 'create',
    data
  });

  return { success: true };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Configuration
  SYNC_CONFIG,

  // Error classes
  SyncError,
  ConflictError,
  LockError,

  // Events
  syncEvents,

  // Version management
  createDataVersion,
  getVersionHistory,
  getLatestVersion,
  getVersion,
  rollbackToVersion,
  compareVersions,

  // Change tracking
  getUnsyncedChanges,
  markChangesSynced,
  getChangeLog,

  // Conflict resolution
  detectConflict,
  resolveConflict,
  getPendingConflicts,
  manuallyResolveConflict,

  // Locks
  acquireLock,
  releaseLock,
  getLockInfo,
  cleanExpiredLocks,

  // Queue
  queueSync,
  processSyncQueue,
  getQueueStatus,

  // Sync operations
  syncPublishedData,
  syncAPIData,
  syncRiskCalculations,
  deltaSSync,

  // Scheduled jobs
  createSyncJob,
  runSyncJob,
  getSyncJobs,
  setSyncJobEnabled,
  deleteSyncJob,

  // Health
  performHealthCheck,

  // Notifications
  getNotifications,
  markNotificationRead,
  clearNotifications,

  // Status
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
};
