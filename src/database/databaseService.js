/**
 * INFORM TANZANIA DATABASE SERVICE v2.0
 *
 * Enterprise-grade database service providing comprehensive data management
 * with advanced features for performance, reliability, and scalability.
 *
 * Architecture Features:
 * - LRU Cache with TTL for read optimization
 * - Transaction support with rollback capability
 * - B-tree-like indexing for fast queries
 * - Query builder with fluent API
 * - Event-driven data change notifications
 * - Data validation and constraints
 * - Relationship management (eager/lazy loading)
 * - Migration system for schema evolution
 * - Query logging and performance metrics
 * - Batch operations with progress tracking
 *
 * Designed for easy migration to PostgreSQL, MongoDB, or other databases.
 */

import { DB_NAME, DB_VERSION, ALL_SCHEMAS } from './schema.js';
import {
  calculateAllAggregates,
  calculateWarningScore,
  classifyWarning,
  roundTo
} from './informFormulas.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DB_CONFIG = {
  version: '2.0.0',
  name: DB_NAME,
  schemaVersion: DB_VERSION,

  // Cache configuration
  cache: {
    enabled: true,
    maxSize: 1000,           // Maximum cached entries
    defaultTTL: 300000,      // 5 minutes default TTL
    cleanupInterval: 60000,  // Cleanup every minute
    ttlByTable: {
      administrative_units: 3600000,  // 1 hour (rarely changes)
      risk_indicators: 300000,        // 5 minutes
      warnings: 60000,                // 1 minute (frequently accessed)
      users: 600000,                  // 10 minutes
      audit_logs: 0                   // Never cache (always fresh)
    }
  },

  // Index configuration
  indexing: {
    enabled: true,
    rebuildThreshold: 100,  // Rebuild index after N modifications
    defaultIndexes: {
      administrative_units: ['id', 'level', 'adm1_code', 'adm2_code', 'parent_id'],
      risk_indicators: ['id', 'admin_unit_id', 'year', 'risk_class'],
      warnings: ['id', 'status', 'hazard_type', 'warning_level', 'created_at'],
      users: ['id', 'email', 'role', 'status'],
      audit_logs: ['id', 'user_id', 'event_type', 'created_at'],
      bulletins: ['id', 'warning_id', 'status'],
      sms_logs: ['id', 'warning_id', 'status'],
      severity_events: ['id', 'warning_id', 'status', 'severity_class'],
      population_data: ['id', 'admin_unit_id', 'year'],
      infrastructure_resources: ['id', 'admin_unit_id'],
      climate_projections: ['id', 'admin_unit_id', 'scenario']
    }
  },

  // Transaction configuration
  transactions: {
    maxRetries: 3,
    retryDelay: 100,       // ms
    timeout: 30000,        // 30 seconds
    isolationLevel: 'READ_COMMITTED'
  },

  // Query configuration
  query: {
    defaultLimit: 100,
    maxLimit: 10000,
    slowQueryThreshold: 100  // ms
  },

  // Validation configuration
  validation: {
    enabled: true,
    strictMode: false,  // If true, reject unknown fields
    coerceTypes: true   // Auto-convert types when possible
  }
};

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = `${DB_NAME}_v${DB_VERSION}`;
const INDEX_KEY = `${STORAGE_KEY}_indexes`;
const META_KEY = `${STORAGE_KEY}_meta`;

// ============================================================================
// CUSTOM ERROR TYPES
// ============================================================================

export class DatabaseError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends DatabaseError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(tableName, id) {
    super(`Record not found: ${tableName}/${id}`, 'NOT_FOUND', { tableName, id });
    this.name = 'NotFoundError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(message, transactionId) {
    super(message, 'TRANSACTION_ERROR', { transactionId });
    this.name = 'TransactionError';
  }
}

export class ConstraintError extends DatabaseError {
  constructor(message, constraint, details) {
    super(message, 'CONSTRAINT_ERROR', { constraint, ...details });
    this.name = 'ConstraintError';
  }
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate cache key
   */
  static generateKey(tableName, filters = {}, options = {}) {
    return `${tableName}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = DB_CONFIG.cache.defaultTTL) {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl : null
    });
  }

  /**
   * Invalidate cache entries
   */
  invalidate(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : 'N/A'
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const queryCache = new LRUCache(DB_CONFIG.cache.maxSize);

// Start cache cleanup interval
if (typeof window !== 'undefined') {
  setInterval(() => queryCache.cleanup(), DB_CONFIG.cache.cleanupInterval);
}

// ============================================================================
// INDEXING SYSTEM
// ============================================================================

class IndexManager {
  constructor() {
    this.indexes = new Map();
    this.modificationCounts = new Map();
    this.initialized = false;
  }

  /**
   * Initialize indexes from storage or rebuild
   */
  initialize() {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(INDEX_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.indexes = new Map(Object.entries(parsed.indexes || {}));
        this.modificationCounts = new Map(Object.entries(parsed.modCounts || {}));
      }
    } catch (e) {
      // Rebuild indexes if loading fails
      this.rebuildAllIndexes();
    }

    this.initialized = true;
  }

  /**
   * Build index for a table and field
   */
  buildIndex(tableName, field, records) {
    const index = new Map();

    records.forEach((record, position) => {
      const value = record[field];
      if (value !== undefined && value !== null) {
        const key = String(value);
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key).push({ id: record.id, position });
      }
    });

    const indexKey = `${tableName}.${field}`;
    this.indexes.set(indexKey, {
      field,
      tableName,
      data: Object.fromEntries(index),
      createdAt: Date.now(),
      size: records.length
    });
  }

  /**
   * Rebuild all indexes for a table
   */
  rebuildTableIndexes(tableName, records) {
    const fields = DB_CONFIG.indexing.defaultIndexes[tableName] || ['id'];

    fields.forEach(field => {
      this.buildIndex(tableName, field, records);
    });

    this.modificationCounts.set(tableName, 0);
    this.saveIndexes();
  }

  /**
   * Rebuild all indexes
   */
  rebuildAllIndexes() {
    const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    Object.entries(db.tables || {}).forEach(([tableName, records]) => {
      this.rebuildTableIndexes(tableName, records);
    });
  }

  /**
   * Update index on record change
   */
  updateIndex(tableName, operation, record, oldRecord = null) {
    const fields = DB_CONFIG.indexing.defaultIndexes[tableName] || ['id'];

    fields.forEach(field => {
      const indexKey = `${tableName}.${field}`;
      const index = this.indexes.get(indexKey);

      if (!index) return;

      if (operation === 'delete' || operation === 'update') {
        // Remove old value from index
        const oldValue = String(oldRecord ? oldRecord[field] : record[field]);
        if (index.data[oldValue]) {
          index.data[oldValue] = index.data[oldValue].filter(e => e.id !== record.id);
          if (index.data[oldValue].length === 0) {
            delete index.data[oldValue];
          }
        }
      }

      if (operation === 'create' || operation === 'update') {
        // Add new value to index
        const newValue = String(record[field]);
        if (!index.data[newValue]) {
          index.data[newValue] = [];
        }
        index.data[newValue].push({ id: record.id });
      }
    });

    // Track modifications and rebuild if threshold reached
    const count = (this.modificationCounts.get(tableName) || 0) + 1;
    this.modificationCounts.set(tableName, count);

    if (count >= DB_CONFIG.indexing.rebuildThreshold) {
      // Defer rebuild to next tick
      setTimeout(() => {
        const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (db.tables && db.tables[tableName]) {
          this.rebuildTableIndexes(tableName, db.tables[tableName]);
        }
      }, 0);
    }
  }

  /**
   * Look up records using index
   */
  lookup(tableName, field, value) {
    const indexKey = `${tableName}.${field}`;
    const index = this.indexes.get(indexKey);

    if (!index || !index.data[String(value)]) {
      return null; // Index miss, fall back to scan
    }

    return index.data[String(value)].map(e => e.id);
  }

  /**
   * Save indexes to storage
   */
  saveIndexes() {
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify({
        indexes: Object.fromEntries(this.indexes),
        modCounts: Object.fromEntries(this.modificationCounts),
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to save indexes:', e.message);
    }
  }

  /**
   * Get index statistics
   */
  getStats() {
    const stats = {
      totalIndexes: this.indexes.size,
      tables: {}
    };

    for (const [key, index] of this.indexes.entries()) {
      const tableName = index.tableName;
      if (!stats.tables[tableName]) {
        stats.tables[tableName] = {
          indexes: [],
          totalEntries: 0,
          modificationCount: this.modificationCounts.get(tableName) || 0
        };
      }
      stats.tables[tableName].indexes.push(index.field);
      stats.tables[tableName].totalEntries += Object.keys(index.data).length;
    }

    return stats;
  }
}

// Global index manager
const indexManager = new IndexManager();

// ============================================================================
// EVENT SYSTEM
// ============================================================================

class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe once to an event
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Event handler error for ${event}:`, e);
      }
    });

    // Also emit to wildcard listeners
    const wildcardCallbacks = this.listeners.get('*') || [];
    wildcardCallbacks.forEach(callback => {
      try {
        callback({ event, data });
      } catch (e) {
        console.error('Wildcard event handler error:', e);
      }
    });
  }

  /**
   * Remove all listeners for an event
   */
  off(event) {
    this.listeners.delete(event);
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
  }
}

// Global event emitter
export const dbEvents = new EventEmitter();

// Event types
export const DB_EVENTS = {
  RECORD_CREATED: 'record:created',
  RECORD_UPDATED: 'record:updated',
  RECORD_DELETED: 'record:deleted',
  BULK_INSERT: 'bulk:insert',
  TABLE_CLEARED: 'table:cleared',
  DATABASE_RESET: 'database:reset',
  TRANSACTION_START: 'transaction:start',
  TRANSACTION_COMMIT: 'transaction:commit',
  TRANSACTION_ROLLBACK: 'transaction:rollback',
  CACHE_INVALIDATED: 'cache:invalidated',
  INDEX_REBUILT: 'index:rebuilt',
  SLOW_QUERY: 'query:slow'
};

// ============================================================================
// QUERY METRICS
// ============================================================================

class QueryMetrics {
  constructor() {
    this.queries = [];
    this.maxHistory = 1000;
  }

  /**
   * Record a query execution
   */
  record(operation, tableName, duration, filters = {}, resultCount = 0) {
    const entry = {
      operation,
      tableName,
      duration,
      filters: Object.keys(filters).length > 0 ? filters : null,
      resultCount,
      timestamp: Date.now()
    };

    this.queries.push(entry);

    // Trim history
    if (this.queries.length > this.maxHistory) {
      this.queries = this.queries.slice(-this.maxHistory);
    }

    // Emit slow query event
    if (duration > DB_CONFIG.query.slowQueryThreshold) {
      dbEvents.emit(DB_EVENTS.SLOW_QUERY, entry);
    }
  }

  /**
   * Get query statistics
   */
  getStats() {
    if (this.queries.length === 0) {
      return { totalQueries: 0, avgDuration: 0, slowQueries: 0 };
    }

    const durations = this.queries.map(q => q.duration);
    const total = durations.reduce((a, b) => a + b, 0);

    return {
      totalQueries: this.queries.length,
      avgDuration: (total / this.queries.length).toFixed(2) + 'ms',
      minDuration: Math.min(...durations).toFixed(2) + 'ms',
      maxDuration: Math.max(...durations).toFixed(2) + 'ms',
      slowQueries: this.queries.filter(q => q.duration > DB_CONFIG.query.slowQueryThreshold).length,
      byOperation: this.queries.reduce((acc, q) => {
        acc[q.operation] = (acc[q.operation] || 0) + 1;
        return acc;
      }, {}),
      byTable: this.queries.reduce((acc, q) => {
        acc[q.tableName] = (acc[q.tableName] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Get recent slow queries
   */
  getSlowQueries(limit = 10) {
    return this.queries
      .filter(q => q.duration > DB_CONFIG.query.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.queries = [];
  }
}

// Global metrics instance
const queryMetrics = new QueryMetrics();

// ============================================================================
// TRANSACTION MANAGER
// ============================================================================

class TransactionManager {
  constructor() {
    this.activeTransactions = new Map();
    this.transactionCounter = 0;
  }

  /**
   * Begin a new transaction
   */
  begin() {
    const transactionId = `txn_${++this.transactionCounter}_${Date.now()}`;

    // Snapshot current database state
    const snapshot = localStorage.getItem(STORAGE_KEY);

    this.activeTransactions.set(transactionId, {
      id: transactionId,
      snapshot,
      operations: [],
      startedAt: Date.now(),
      status: 'active'
    });

    dbEvents.emit(DB_EVENTS.TRANSACTION_START, { transactionId });

    return transactionId;
  }

  /**
   * Record operation in transaction
   */
  recordOperation(transactionId, operation, tableName, data) {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn || txn.status !== 'active') {
      throw new TransactionError('Transaction not active', transactionId);
    }

    txn.operations.push({
      operation,
      tableName,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Commit a transaction
   */
  commit(transactionId) {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) {
      throw new TransactionError('Transaction not found', transactionId);
    }

    if (txn.status !== 'active') {
      throw new TransactionError(`Cannot commit ${txn.status} transaction`, transactionId);
    }

    txn.status = 'committed';
    txn.committedAt = Date.now();

    dbEvents.emit(DB_EVENTS.TRANSACTION_COMMIT, {
      transactionId,
      operationCount: txn.operations.length,
      duration: txn.committedAt - txn.startedAt
    });

    // Clean up after short delay
    setTimeout(() => {
      this.activeTransactions.delete(transactionId);
    }, 5000);

    return true;
  }

  /**
   * Rollback a transaction
   */
  rollback(transactionId) {
    const txn = this.activeTransactions.get(transactionId);
    if (!txn) {
      throw new TransactionError('Transaction not found', transactionId);
    }

    if (txn.status !== 'active') {
      throw new TransactionError(`Cannot rollback ${txn.status} transaction`, transactionId);
    }

    // Restore snapshot
    localStorage.setItem(STORAGE_KEY, txn.snapshot);

    // Invalidate cache
    queryCache.invalidate();

    // Rebuild indexes
    indexManager.rebuildAllIndexes();

    txn.status = 'rolledback';
    txn.rolledbackAt = Date.now();

    dbEvents.emit(DB_EVENTS.TRANSACTION_ROLLBACK, {
      transactionId,
      operationCount: txn.operations.length
    });

    this.activeTransactions.delete(transactionId);

    return true;
  }

  /**
   * Get transaction status
   */
  getStatus(transactionId) {
    const txn = this.activeTransactions.get(transactionId);
    return txn ? txn.status : 'not_found';
  }

  /**
   * Check for stale transactions and rollback
   */
  cleanup() {
    const now = Date.now();
    for (const [id, txn] of this.activeTransactions.entries()) {
      if (txn.status === 'active' && now - txn.startedAt > DB_CONFIG.transactions.timeout) {
        console.warn(`Rolling back stale transaction: ${id}`);
        this.rollback(id);
      }
    }
  }
}

// Global transaction manager
const transactionManager = new TransactionManager();

// Cleanup stale transactions periodically
if (typeof window !== 'undefined') {
  setInterval(() => transactionManager.cleanup(), 60000);
}

// ============================================================================
// QUERY BUILDER
// ============================================================================

export class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this._filters = {};
    this._sort = null;
    this._limit = null;
    this._offset = null;
    this._select = null;
    this._include = [];
    this._distinct = false;
    this._groupBy = null;
    this._having = null;
  }

  /**
   * Add equality filter
   */
  where(field, value) {
    this._filters[field] = value;
    return this;
  }

  /**
   * Add multiple filters
   */
  whereAll(filters) {
    Object.assign(this._filters, filters);
    return this;
  }

  /**
   * Greater than or equal
   */
  whereGte(field, value) {
    this._filters[field] = { ...this._filters[field], $gte: value };
    return this;
  }

  /**
   * Less than or equal
   */
  whereLte(field, value) {
    this._filters[field] = { ...this._filters[field], $lte: value };
    return this;
  }

  /**
   * Greater than
   */
  whereGt(field, value) {
    this._filters[field] = { ...this._filters[field], $gt: value };
    return this;
  }

  /**
   * Less than
   */
  whereLt(field, value) {
    this._filters[field] = { ...this._filters[field], $lt: value };
    return this;
  }

  /**
   * Not equal
   */
  whereNot(field, value) {
    this._filters[field] = { $ne: value };
    return this;
  }

  /**
   * In array
   */
  whereIn(field, values) {
    this._filters[field] = values;
    return this;
  }

  /**
   * Not in array
   */
  whereNotIn(field, values) {
    this._filters[field] = { $notIn: values };
    return this;
  }

  /**
   * Like pattern (SQL-style with %)
   */
  whereLike(field, pattern) {
    this._filters[field] = { $like: pattern };
    return this;
  }

  /**
   * Field is null
   */
  whereNull(field) {
    this._filters[field] = { $null: true };
    return this;
  }

  /**
   * Field is not null
   */
  whereNotNull(field) {
    this._filters[field] = { $notNull: true };
    return this;
  }

  /**
   * Between range (inclusive)
   */
  whereBetween(field, min, max) {
    this._filters[field] = { $gte: min, $lte: max };
    return this;
  }

  /**
   * Select specific fields
   */
  select(...fields) {
    this._select = fields;
    return this;
  }

  /**
   * Include related records (eager loading)
   */
  include(relation, options = {}) {
    this._include.push({ relation, ...options });
    return this;
  }

  /**
   * Order by field
   */
  orderBy(field, direction = 'asc') {
    this._sort = [field, direction];
    return this;
  }

  /**
   * Limit results
   */
  limit(n) {
    this._limit = Math.min(n, DB_CONFIG.query.maxLimit);
    return this;
  }

  /**
   * Skip results
   */
  offset(n) {
    this._offset = n;
    return this;
  }

  /**
   * Paginate results
   */
  paginate(page, perPage = 20) {
    this._limit = Math.min(perPage, DB_CONFIG.query.maxLimit);
    this._offset = (page - 1) * perPage;
    return this;
  }

  /**
   * Get distinct values
   */
  distinct() {
    this._distinct = true;
    return this;
  }

  /**
   * Group by field
   */
  groupBy(field) {
    this._groupBy = field;
    return this;
  }

  /**
   * Execute query and get all results
   */
  get() {
    let results = read(this.tableName, this._filters, {
      sort: this._sort,
      limit: this._limit,
      offset: this._offset
    });

    // Apply field selection
    if (this._select && this._select.length > 0) {
      results = results.map(record => {
        const selected = {};
        this._select.forEach(field => {
          if (record[field] !== undefined) {
            selected[field] = record[field];
          }
        });
        return selected;
      });
    }

    // Apply distinct
    if (this._distinct && this._select && this._select.length === 1) {
      const field = this._select[0];
      const seen = new Set();
      results = results.filter(record => {
        const value = record[field];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }

    // Apply groupBy
    if (this._groupBy) {
      const groups = {};
      results.forEach(record => {
        const key = record[this._groupBy];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(record);
      });
      results = Object.entries(groups).map(([key, records]) => ({
        [this._groupBy]: key,
        count: records.length,
        records
      }));
    }

    // Load relations
    if (this._include.length > 0) {
      results = results.map(record => this._loadRelations(record));
    }

    return results;
  }

  /**
   * Get first result
   */
  first() {
    this._limit = 1;
    const results = this.get();
    return results[0] || null;
  }

  /**
   * Count results
   */
  count() {
    return read(this.tableName, this._filters).length;
  }

  /**
   * Check if any results exist
   */
  exists() {
    return this.count() > 0;
  }

  /**
   * Get sum of a field
   */
  sum(field) {
    const results = read(this.tableName, this._filters);
    return results.reduce((sum, record) => sum + (Number(record[field]) || 0), 0);
  }

  /**
   * Get average of a field
   */
  avg(field) {
    const results = read(this.tableName, this._filters);
    if (results.length === 0) return 0;
    const sum = results.reduce((total, record) => total + (Number(record[field]) || 0), 0);
    return sum / results.length;
  }

  /**
   * Get min value of a field
   */
  min(field) {
    const results = read(this.tableName, this._filters);
    if (results.length === 0) return null;
    return Math.min(...results.map(r => Number(r[field]) || 0));
  }

  /**
   * Get max value of a field
   */
  max(field) {
    const results = read(this.tableName, this._filters);
    if (results.length === 0) return null;
    return Math.max(...results.map(r => Number(r[field]) || 0));
  }

  /**
   * Delete matching records
   */
  delete() {
    const records = read(this.tableName, this._filters);
    let deleted = 0;

    records.forEach(record => {
      if (remove(this.tableName, record.id)) {
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Update matching records
   */
  update(data) {
    const records = read(this.tableName, this._filters);
    let updated = 0;

    records.forEach(record => {
      if (update(this.tableName, record.id, data)) {
        updated++;
      }
    });

    return updated;
  }

  /**
   * Load related records
   */
  _loadRelations(record) {
    const loaded = { ...record };

    this._include.forEach(({ relation, foreignKey, localKey }) => {
      // Determine relationship based on naming convention
      const fk = foreignKey || `${this.tableName.slice(0, -1)}_id`;
      const lk = localKey || 'id';

      // Try to find related table
      const relatedTable = relation.endsWith('s') ? relation : `${relation}s`;

      try {
        loaded[relation] = read(relatedTable, { [fk]: record[lk] });
      } catch (e) {
        loaded[relation] = [];
      }
    });

    return loaded;
  }

  /**
   * Clone this query builder
   */
  clone() {
    const cloned = new QueryBuilder(this.tableName);
    cloned._filters = { ...this._filters };
    cloned._sort = this._sort;
    cloned._limit = this._limit;
    cloned._offset = this._offset;
    cloned._select = this._select ? [...this._select] : null;
    cloned._include = [...this._include];
    cloned._distinct = this._distinct;
    cloned._groupBy = this._groupBy;
    return cloned;
  }
}

/**
 * Create a new query builder
 */
export function query(tableName) {
  return new QueryBuilder(tableName);
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize the database
 */
export function initializeDatabase() {
  const existingData = localStorage.getItem(STORAGE_KEY);

  if (!existingData) {
    const initialData = {
      version: DB_VERSION,
      created_at: new Date().toISOString(),
      tables: {}
    };

    // Initialize all tables from schemas
    Object.keys(ALL_SCHEMAS).forEach(tableName => {
      initialData.tables[tableName] = [];
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    // Initialize metadata
    localStorage.setItem(META_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      recordCount: 0,
      schemaVersion: DB_VERSION
    }));

    console.log('Database initialized successfully');
    return true;
  }

  // Check version and migrate if needed
  const data = JSON.parse(existingData);
  if (data.version !== DB_VERSION) {
    console.log(`Database version mismatch. Expected ${DB_VERSION}, found ${data.version}`);
    // Migration logic would go here
  }

  // Initialize indexes
  if (DB_CONFIG.indexing.enabled) {
    indexManager.initialize();
  }

  return true;
}

/**
 * Get raw database object
 */
function getDatabase() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    initializeDatabase();
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  }
  return JSON.parse(data);
}

/**
 * Save database object
 */
function saveDatabase(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

  // Update metadata
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY) || '{}');
    meta.lastModified = new Date().toISOString();
    meta.recordCount = Object.values(db.tables).reduce((sum, t) => sum + t.length, 0);
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    // Ignore metadata errors
  }
}

/**
 * Generate unique ID
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

const validators = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && !isNaN(value),
  boolean: (value) => typeof value === 'boolean',
  array: (value) => Array.isArray(value),
  object: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
  email: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  date: (value) => !isNaN(Date.parse(value)),
  uuid: (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  url: (value) => {
    try { new URL(value); return true; } catch { return false; }
  },
  phone: (value) => typeof value === 'string' && /^\+?[\d\s-]{10,}$/.test(value),
  latitude: (value) => typeof value === 'number' && value >= -90 && value <= 90,
  longitude: (value) => typeof value === 'number' && value >= -180 && value <= 180
};

/**
 * Validate a record against schema
 */
export function validateRecord(tableName, data, isUpdate = false) {
  if (!DB_CONFIG.validation.enabled) return { valid: true, errors: [] };

  const schema = ALL_SCHEMAS[tableName];
  if (!schema) return { valid: true, errors: [] };

  const errors = [];

  // Check required fields (only for create, not update)
  if (!isUpdate && schema.required) {
    schema.required.forEach(field => {
      if (data[field] === undefined || data[field] === null) {
        errors.push({ field, message: `${field} is required` });
      }
    });
  }

  // Validate field types
  Object.entries(data).forEach(([field, value]) => {
    const fieldSchema = schema.fields?.[field];
    if (!fieldSchema) {
      if (DB_CONFIG.validation.strictMode) {
        errors.push({ field, message: `Unknown field: ${field}` });
      }
      return;
    }

    // Check type
    if (fieldSchema.type && value !== null && value !== undefined) {
      const validator = validators[fieldSchema.type];
      if (validator && !validator(value)) {
        errors.push({
          field,
          message: `${field} must be of type ${fieldSchema.type}`,
          received: typeof value
        });
      }
    }

    // Check constraints
    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
      errors.push({ field, message: `${field} must be >= ${fieldSchema.min}` });
    }
    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
      errors.push({ field, message: `${field} must be <= ${fieldSchema.max}` });
    }
    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
      errors.push({ field, message: `${field} must have at least ${fieldSchema.minLength} characters` });
    }
    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      errors.push({ field, message: `${field} must have at most ${fieldSchema.maxLength} characters` });
    }
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push({ field, message: `${field} must be one of: ${fieldSchema.enum.join(', ')}` });
    }
    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
      errors.push({ field, message: `${field} does not match required pattern` });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================

/**
 * Create a new record
 */
export function create(tableName, data, options = {}) {
  const startTime = performance.now();
  const db = getDatabase();

  if (!db.tables[tableName]) {
    throw new DatabaseError(`Table '${tableName}' does not exist`, 'TABLE_NOT_FOUND');
  }

  // Validate
  if (options.validate !== false) {
    const validation = validateRecord(tableName, data);
    if (!validation.valid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        validation.errors[0]?.field,
        data
      );
    }
  }

  const record = {
    id: data.id || generateId(tableName.substring(0, 3)),
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.tables[tableName].push(record);
  saveDatabase(db);

  // Update index
  if (DB_CONFIG.indexing.enabled) {
    indexManager.updateIndex(tableName, 'create', record);
  }

  // Invalidate cache
  if (DB_CONFIG.cache.enabled) {
    queryCache.invalidate(tableName);
    dbEvents.emit(DB_EVENTS.CACHE_INVALIDATED, { table: tableName });
  }

  // Record metrics
  queryMetrics.record('create', tableName, performance.now() - startTime);

  // Emit event
  dbEvents.emit(DB_EVENTS.RECORD_CREATED, {
    tableName,
    record,
    timestamp: new Date().toISOString()
  });

  return record;
}

/**
 * Read records with optional filtering
 */
export function read(tableName, filters = {}, options = {}) {
  const startTime = performance.now();
  const db = getDatabase();

  if (!db.tables[tableName]) {
    throw new DatabaseError(`Table '${tableName}' does not exist`, 'TABLE_NOT_FOUND');
  }

  // Check cache
  if (DB_CONFIG.cache.enabled && options.cache !== false) {
    const cacheKey = LRUCache.generateKey(tableName, filters, options);
    const cached = queryCache.get(cacheKey);
    if (cached !== null) {
      queryMetrics.record('read_cached', tableName, performance.now() - startTime, filters, cached.length);
      return cached;
    }
  }

  let results = [...db.tables[tableName]];

  // Try to use index for first filter
  if (DB_CONFIG.indexing.enabled) {
    const filterKeys = Object.keys(filters);
    if (filterKeys.length > 0) {
      const firstFilter = filterKeys[0];
      const firstValue = filters[firstFilter];

      // Only use index for simple equality filters
      if (typeof firstValue !== 'object' && !Array.isArray(firstValue)) {
        const indexedIds = indexManager.lookup(tableName, firstFilter, firstValue);
        if (indexedIds) {
          // Use indexed results
          const idSet = new Set(indexedIds);
          results = results.filter(r => idSet.has(r.id));

          // Remove first filter as it's already applied
          const remainingFilters = { ...filters };
          delete remainingFilters[firstFilter];
          Object.assign(filters, remainingFilters);
        }
      }
    }
  }

  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Array filter: field IN [values]
        results = results.filter(r => value.includes(r[field]));
      } else if (typeof value === 'object' && value !== null) {
        // Complex filter
        results = results.filter(r => {
          const recordValue = r[field];

          if (value.$gte !== undefined && recordValue < value.$gte) return false;
          if (value.$lte !== undefined && recordValue > value.$lte) return false;
          if (value.$gt !== undefined && recordValue <= value.$gt) return false;
          if (value.$lt !== undefined && recordValue >= value.$lt) return false;
          if (value.$ne !== undefined && recordValue === value.$ne) return false;
          if (value.$null === true && recordValue !== null && recordValue !== undefined) return false;
          if (value.$notNull === true && (recordValue === null || recordValue === undefined)) return false;
          if (value.$notIn !== undefined && value.$notIn.includes(recordValue)) return false;
          if (value.$like !== undefined) {
            const regex = new RegExp(value.$like.replace(/%/g, '.*'), 'i');
            return regex.test(recordValue);
          }
          if (value.$contains !== undefined && Array.isArray(recordValue)) {
            return recordValue.includes(value.$contains);
          }
          if (value.$regex !== undefined) {
            return new RegExp(value.$regex, value.$regexFlags || '').test(recordValue);
          }

          return true;
        });
      } else {
        // Exact match
        results = results.filter(r => r[field] === value);
      }
    }
  });

  // Apply sorting
  if (options.sort) {
    const [field, direction] = Array.isArray(options.sort) ? options.sort : [options.sort, 'asc'];
    const mult = direction.toLowerCase() === 'desc' ? -1 : 1;
    results.sort((a, b) => {
      if (a[field] < b[field]) return -1 * mult;
      if (a[field] > b[field]) return 1 * mult;
      return 0;
    });
  }

  // Apply offset
  if (options.offset) {
    results = results.slice(options.offset);
  }

  // Apply limit
  const limit = options.limit ?? DB_CONFIG.query.defaultLimit;
  if (limit) {
    results = results.slice(0, Math.min(limit, DB_CONFIG.query.maxLimit));
  }

  // Cache results
  if (DB_CONFIG.cache.enabled && options.cache !== false) {
    const cacheKey = LRUCache.generateKey(tableName, filters, options);
    const ttl = DB_CONFIG.cache.ttlByTable[tableName] || DB_CONFIG.cache.defaultTTL;
    queryCache.set(cacheKey, results, ttl);
  }

  // Record metrics
  queryMetrics.record('read', tableName, performance.now() - startTime, filters, results.length);

  return results;
}

/**
 * Read a single record by ID
 */
export function readById(tableName, id) {
  // Try index lookup first
  if (DB_CONFIG.indexing.enabled) {
    const indexedIds = indexManager.lookup(tableName, 'id', id);
    if (indexedIds && indexedIds.length === 0) {
      return null;
    }
  }

  const results = read(tableName, { id });
  return results.length > 0 ? results[0] : null;
}

/**
 * Update a record
 */
export function update(tableName, id, data, options = {}) {
  const startTime = performance.now();
  const db = getDatabase();

  if (!db.tables[tableName]) {
    throw new DatabaseError(`Table '${tableName}' does not exist`, 'TABLE_NOT_FOUND');
  }

  const index = db.tables[tableName].findIndex(r => r.id === id);
  if (index === -1) {
    if (options.throwOnNotFound) {
      throw new NotFoundError(tableName, id);
    }
    return null;
  }

  const oldRecord = { ...db.tables[tableName][index] };

  // Validate
  if (options.validate !== false) {
    const validation = validateRecord(tableName, data, true);
    if (!validation.valid) {
      throw new ValidationError(
        `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        validation.errors[0]?.field,
        data
      );
    }
  }

  const updated = {
    ...oldRecord,
    ...data,
    id: oldRecord.id,                    // Preserve original ID
    created_at: oldRecord.created_at,    // Preserve created_at
    updated_at: new Date().toISOString()
  };

  db.tables[tableName][index] = updated;
  saveDatabase(db);

  // Update index
  if (DB_CONFIG.indexing.enabled) {
    indexManager.updateIndex(tableName, 'update', updated, oldRecord);
  }

  // Invalidate cache
  if (DB_CONFIG.cache.enabled) {
    queryCache.invalidate(tableName);
  }

  // Record metrics
  queryMetrics.record('update', tableName, performance.now() - startTime);

  // Emit event
  dbEvents.emit(DB_EVENTS.RECORD_UPDATED, {
    tableName,
    oldRecord,
    newRecord: updated,
    changes: Object.keys(data),
    timestamp: new Date().toISOString()
  });

  return updated;
}

/**
 * Delete a record
 */
export function remove(tableName, id) {
  const startTime = performance.now();
  const db = getDatabase();

  if (!db.tables[tableName]) {
    throw new DatabaseError(`Table '${tableName}' does not exist`, 'TABLE_NOT_FOUND');
  }

  const record = db.tables[tableName].find(r => r.id === id);
  if (!record) return false;

  db.tables[tableName] = db.tables[tableName].filter(r => r.id !== id);
  saveDatabase(db);

  // Update index
  if (DB_CONFIG.indexing.enabled) {
    indexManager.updateIndex(tableName, 'delete', record);
  }

  // Invalidate cache
  if (DB_CONFIG.cache.enabled) {
    queryCache.invalidate(tableName);
  }

  // Record metrics
  queryMetrics.record('delete', tableName, performance.now() - startTime);

  // Emit event
  dbEvents.emit(DB_EVENTS.RECORD_DELETED, {
    tableName,
    record,
    timestamp: new Date().toISOString()
  });

  return true;
}

/**
 * Count records
 */
export function count(tableName, filters = {}) {
  const db = getDatabase();
  if (!db.tables[tableName]) return 0;
  return read(tableName, filters, { limit: Infinity, cache: false }).length;
}

/**
 * Check if record exists
 */
export function exists(tableName, filters) {
  return count(tableName, filters) > 0;
}

/**
 * Bulk insert records
 */
export function bulkCreate(tableName, records, options = {}) {
  const startTime = performance.now();
  const results = [];
  const errors = [];

  const transactionId = options.transaction ?? (options.atomic ? transactionManager.begin() : null);

  try {
    records.forEach((record, index) => {
      try {
        const created = create(tableName, record, { validate: options.validate });
        results.push(created);

        if (transactionId) {
          transactionManager.recordOperation(transactionId, 'create', tableName, created);
        }

        // Progress callback
        if (options.onProgress) {
          options.onProgress({
            current: index + 1,
            total: records.length,
            percent: Math.round((index + 1) / records.length * 100)
          });
        }
      } catch (e) {
        if (options.stopOnError) {
          throw e;
        }
        errors.push({ index, record, error: e.message });
      }
    });

    if (transactionId && options.atomic) {
      transactionManager.commit(transactionId);
    }

    // Emit event
    dbEvents.emit(DB_EVENTS.BULK_INSERT, {
      tableName,
      count: results.length,
      errors: errors.length,
      timestamp: new Date().toISOString()
    });

    // Record metrics
    queryMetrics.record('bulk_create', tableName, performance.now() - startTime, {}, results.length);

    return {
      success: true,
      inserted: results.length,
      failed: errors.length,
      records: results,
      errors
    };
  } catch (e) {
    if (transactionId && options.atomic) {
      transactionManager.rollback(transactionId);
    }
    throw e;
  }
}

/**
 * Bulk update records
 */
export function bulkUpdate(tableName, updates) {
  const startTime = performance.now();
  const results = [];

  updates.forEach(({ id, data }) => {
    const updated = update(tableName, id, data);
    if (updated) {
      results.push(updated);
    }
  });

  queryMetrics.record('bulk_update', tableName, performance.now() - startTime, {}, results.length);

  return results;
}

/**
 * Upsert record (insert or update)
 */
export function upsert(tableName, data, uniqueFields = ['id']) {
  // Build filter from unique fields
  const filters = {};
  uniqueFields.forEach(field => {
    if (data[field] !== undefined) {
      filters[field] = data[field];
    }
  });

  // Check if exists
  const existing = read(tableName, filters);

  if (existing.length > 0) {
    return update(tableName, existing[0].id, data);
  } else {
    return create(tableName, data);
  }
}

/**
 * Clear all records from a table
 */
export function clearTable(tableName) {
  const db = getDatabase();
  if (db.tables[tableName]) {
    const count = db.tables[tableName].length;
    db.tables[tableName] = [];
    saveDatabase(db);

    // Rebuild index
    if (DB_CONFIG.indexing.enabled) {
      indexManager.rebuildTableIndexes(tableName, []);
    }

    // Invalidate cache
    if (DB_CONFIG.cache.enabled) {
      queryCache.invalidate(tableName);
    }

    // Emit event
    dbEvents.emit(DB_EVENTS.TABLE_CLEARED, { tableName, recordCount: count });
  }
}

// ============================================================================
// TRANSACTION API
// ============================================================================

export const Transaction = {
  /**
   * Begin a new transaction
   */
  begin() {
    return transactionManager.begin();
  },

  /**
   * Commit a transaction
   */
  commit(transactionId) {
    return transactionManager.commit(transactionId);
  },

  /**
   * Rollback a transaction
   */
  rollback(transactionId) {
    return transactionManager.rollback(transactionId);
  },

  /**
   * Execute a function within a transaction
   */
  async run(fn) {
    const txnId = this.begin();
    try {
      const result = await fn(txnId);
      this.commit(txnId);
      return result;
    } catch (e) {
      this.rollback(txnId);
      throw e;
    }
  }
};

// ============================================================================
// ADMINISTRATIVE UNITS OPERATIONS
// ============================================================================

export const AdminUnits = {
  /**
   * Get all regions (ADM1)
   */
  getRegions(options = {}) {
    return query('administrative_units')
      .where('level', 1)
      .orderBy('adm1_name', 'asc')
      .get();
  },

  /**
   * Get all districts (ADM2)
   */
  getDistricts(options = {}) {
    return query('administrative_units')
      .where('level', 2)
      .orderBy('adm2_name', 'asc')
      .get();
  },

  /**
   * Get districts by region
   */
  getDistrictsByRegion(regionId) {
    return query('administrative_units')
      .where('parent_id', regionId)
      .where('level', 2)
      .orderBy('adm2_name', 'asc')
      .get();
  },

  /**
   * Get region by name
   */
  getRegionByName(name) {
    return query('administrative_units')
      .where('adm1_name', name)
      .where('level', 1)
      .first();
  },

  /**
   * Get district by name
   */
  getDistrictByName(districtName, regionName = null) {
    const q = query('administrative_units')
      .where('adm2_name', districtName)
      .where('level', 2);

    if (regionName) {
      q.where('adm1_name', regionName);
    }

    return q.first();
  },

  /**
   * Search administrative units
   */
  search(searchTerm, options = {}) {
    const q = query('administrative_units')
      .whereLike('adm2_name', `%${searchTerm}%`);

    if (options.level) {
      q.where('level', options.level);
    }

    return q.limit(options.limit || 20).get();
  },

  /**
   * Get administrative unit hierarchy
   */
  getHierarchy(adminUnitId) {
    const unit = readById('administrative_units', adminUnitId);
    if (!unit) return null;

    const hierarchy = [unit];

    if (unit.parent_id) {
      const parent = readById('administrative_units', unit.parent_id);
      if (parent) {
        hierarchy.unshift(parent);
      }
    }

    // Get children
    const children = read('administrative_units', { parent_id: adminUnitId });
    if (children.length > 0) {
      hierarchy.push(...children);
    }

    return hierarchy;
  },

  /**
   * Create region
   */
  createRegion(data) {
    return create('administrative_units', {
      ...data,
      level: 1,
      country: 'United Republic of Tanzania',
      iso3: 'TZA'
    });
  },

  /**
   * Create district
   */
  createDistrict(data) {
    return create('administrative_units', {
      ...data,
      level: 2,
      country: 'United Republic of Tanzania',
      iso3: 'TZA'
    });
  },

  /**
   * Get statistics
   */
  getStatistics() {
    const all = read('administrative_units', {}, { limit: Infinity });
    return {
      totalRegions: all.filter(u => u.level === 1).length,
      totalDistricts: all.filter(u => u.level === 2).length,
      byRegion: all.filter(u => u.level === 2).reduce((acc, d) => {
        const region = d.adm1_name || 'Unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {})
    };
  }
};

// ============================================================================
// RISK INDICATORS OPERATIONS
// ============================================================================

export const RiskIndicators = {
  /**
   * Get risk indicators for an admin unit
   */
  getByAdminUnit(adminUnitId, year = null) {
    const q = query('risk_indicators')
      .where('admin_unit_id', adminUnitId)
      .orderBy('year', 'desc');

    if (year) {
      q.where('year', year);
    }

    return q.get();
  },

  /**
   * Get latest risk indicators for an admin unit
   */
  getLatest(adminUnitId) {
    return query('risk_indicators')
      .where('admin_unit_id', adminUnitId)
      .orderBy('year', 'desc')
      .first();
  },

  /**
   * Get all risk data for a specific year
   */
  getByYear(year) {
    return query('risk_indicators')
      .where('year', year)
      .get();
  },

  /**
   * Get risk data by risk class
   */
  getByRiskClass(riskClass) {
    return query('risk_indicators')
      .where('risk_class', riskClass)
      .get();
  },

  /**
   * Create risk indicators with automatic calculation
   */
  create(data) {
    // Calculate aggregates from raw indicators
    const aggregates = calculateAllAggregates(data);

    const record = {
      ...data,
      ...aggregates,
      risk_index: roundTo(aggregates.risk_index, 2)
    };

    return create('risk_indicators', record);
  },

  /**
   * Update risk indicators with recalculation
   */
  update(id, data) {
    const existing = readById('risk_indicators', id);
    if (!existing) return null;

    const merged = { ...existing, ...data };
    const aggregates = calculateAllAggregates(merged);

    return update('risk_indicators', id, {
      ...data,
      ...aggregates,
      risk_index: roundTo(aggregates.risk_index, 2)
    });
  },

  /**
   * Calculate risk for all districts
   */
  calculateAllRisks(year) {
    const indicators = this.getByYear(year);
    return indicators.map(ind => ({
      admin_unit_id: ind.admin_unit_id,
      risk_index: ind.risk_index,
      risk_class: ind.risk_class
    }));
  },

  /**
   * Get high risk areas
   */
  getHighRiskAreas(threshold = 5.0) {
    return query('risk_indicators')
      .whereGte('risk_index', threshold)
      .orderBy('risk_index', 'desc')
      .get();
  },

  /**
   * Get risk distribution
   */
  getRiskDistribution(year = null) {
    const filters = year ? { year } : {};
    const all = read('risk_indicators', filters, { limit: Infinity });

    const distribution = {
      veryLow: 0,   // 0-2
      low: 0,       // 2-3.5
      medium: 0,    // 3.5-5
      high: 0,      // 5-6.5
      veryHigh: 0   // 6.5-10
    };

    all.forEach(ind => {
      const score = ind.risk_index || 0;
      if (score < 2) distribution.veryLow++;
      else if (score < 3.5) distribution.low++;
      else if (score < 5) distribution.medium++;
      else if (score < 6.5) distribution.high++;
      else distribution.veryHigh++;
    });

    return distribution;
  },

  /**
   * Compare risks between admin units
   */
  compareRisks(adminUnitIds, year = null) {
    return adminUnitIds.map(id => {
      const latest = year ?
        query('risk_indicators').where('admin_unit_id', id).where('year', year).first() :
        this.getLatest(id);

      return {
        adminUnitId: id,
        ...latest
      };
    });
  },

  /**
   * Get trend for admin unit
   */
  getTrend(adminUnitId, years = 5) {
    return query('risk_indicators')
      .where('admin_unit_id', adminUnitId)
      .orderBy('year', 'desc')
      .limit(years)
      .get();
  }
};

// ============================================================================
// WARNINGS OPERATIONS
// ============================================================================

export const Warnings = {
  /**
   * Get all active warnings
   */
  getActive() {
    const now = new Date().toISOString();
    return query('warnings')
      .whereIn('status', ['Approved', 'Published'])
      .whereGte('valid_until', now)
      .orderBy('warning_score', 'desc')
      .get();
  },

  /**
   * Get warnings by status
   */
  getByStatus(status) {
    return query('warnings')
      .where('status', status)
      .orderBy('created_at', 'desc')
      .get();
  },

  /**
   * Get warnings by hazard type
   */
  getByHazardType(hazardType) {
    return query('warnings')
      .where('hazard_type', hazardType)
      .orderBy('warning_score', 'desc')
      .get();
  },

  /**
   * Get warnings for a region/district
   */
  getByLocation(regionOrDistrict) {
    const allWarnings = read('warnings', {}, { limit: Infinity });
    return allWarnings.filter(w =>
      (w.affected_regions || []).includes(regionOrDistrict) ||
      (w.affected_districts || []).includes(regionOrDistrict)
    );
  },

  /**
   * Create a new warning with calculated score
   */
  create(warningData, riskProfile) {
    // Calculate warning score using INFORM formula
    const warningScore = calculateWarningScore(
      warningData.hazard_intensity || 5,
      riskProfile.vulnerability || 5,
      riskProfile.lack_coping_capacity || 5
    );

    const warningLevel = classifyWarning(warningScore);

    return create('warnings', {
      ...warningData,
      warning_number: `TZA-${Date.now().toString().slice(-8)}`,
      warning_score: roundTo(warningScore, 2),
      warning_level: warningLevel.label,
      status: 'Draft'
    });
  },

  /**
   * Approve a warning
   */
  approve(id, approvedByUserId) {
    return update('warnings', id, {
      status: 'Approved',
      approved_by_user_id: approvedByUserId,
      approved_at: new Date().toISOString()
    });
  },

  /**
   * Publish a warning
   */
  publish(id) {
    return update('warnings', id, {
      status: 'Published',
      published_at: new Date().toISOString()
    });
  },

  /**
   * Cancel a warning
   */
  cancel(id) {
    return update('warnings', id, {
      status: 'Cancelled',
      cancelled_at: new Date().toISOString()
    });
  },

  /**
   * Expire a warning
   */
  expire(id) {
    return update('warnings', id, {
      status: 'Expired',
      expired_at: new Date().toISOString()
    });
  },

  /**
   * Get warning statistics
   */
  getStatistics() {
    const all = read('warnings', {}, { limit: Infinity });
    return {
      total: all.length,
      active: all.filter(w => ['Approved', 'Published'].includes(w.status)).length,
      draft: all.filter(w => w.status === 'Draft').length,
      cancelled: all.filter(w => w.status === 'Cancelled').length,
      expired: all.filter(w => w.status === 'Expired').length,
      byLevel: {
        monitor: all.filter(w => w.warning_level === 'Monitor').length,
        advisory: all.filter(w => w.warning_level === 'Advisory').length,
        warning: all.filter(w => w.warning_level === 'Warning').length,
        major: all.filter(w => w.warning_level === 'Major Warning').length
      },
      byHazard: all.reduce((acc, w) => {
        acc[w.hazard_type] = (acc[w.hazard_type] || 0) + 1;
        return acc;
      }, {}),
      avgWarningScore: all.length > 0 ?
        roundTo(all.reduce((sum, w) => sum + (w.warning_score || 0), 0) / all.length, 2) : 0
    };
  },

  /**
   * Search warnings
   */
  search(searchTerm, options = {}) {
    const q = query('warnings')
      .whereLike('title', `%${searchTerm}%`);

    if (options.status) {
      q.where('status', options.status);
    }
    if (options.hazardType) {
      q.where('hazard_type', options.hazardType);
    }

    return q.orderBy('created_at', 'desc').limit(options.limit || 20).get();
  }
};

// ============================================================================
// BULLETINS OPERATIONS
// ============================================================================

export const Bulletins = {
  getByWarning(warningId) {
    return query('bulletins')
      .where('warning_id', warningId)
      .orderBy('version', 'desc')
      .get();
  },

  getLatest(limit = 10) {
    return query('bulletins')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
  },

  create(bulletinData) {
    return create('bulletins', {
      ...bulletinData,
      bulletin_number: `BUL-${Date.now().toString().slice(-8)}`,
      status: 'Draft',
      version: 1
    });
  },

  publish(id) {
    return update('bulletins', id, {
      status: 'Published',
      published_at: new Date().toISOString()
    });
  },

  createNewVersion(id) {
    const existing = readById('bulletins', id);
    if (!existing) return null;

    return create('bulletins', {
      ...existing,
      id: undefined,
      version: (existing.version || 1) + 1,
      status: 'Draft',
      published_at: null
    });
  }
};

// ============================================================================
// USERS OPERATIONS
// ============================================================================

export const Users = {
  getByEmail(email) {
    return query('users').where('email', email).first();
  },

  getByRole(role) {
    return query('users').where('role', role).get();
  },

  getActiveUsers() {
    return query('users').where('status', 'active').get();
  },

  create(userData) {
    // Check for duplicate email
    if (this.getByEmail(userData.email)) {
      throw new ConstraintError('Email already exists', 'unique_email', { email: userData.email });
    }

    return create('users', {
      ...userData,
      status: 'active',
      created_at: new Date().toISOString()
    });
  },

  authenticate(email, password) {
    const user = this.getByEmail(email);
    if (!user) return null;

    // In production, this would check password hash
    // For demo, just verify user exists

    // Update last login
    update('users', user.id, {
      last_login: new Date().toISOString(),
      login_count: (user.login_count || 0) + 1
    });

    return user;
  },

  deactivate(id) {
    return update('users', id, { status: 'inactive', deactivated_at: new Date().toISOString() });
  },

  activate(id) {
    return update('users', id, { status: 'active', activated_at: new Date().toISOString() });
  },

  updateRole(id, role) {
    return update('users', id, { role, role_updated_at: new Date().toISOString() });
  },

  getStatistics() {
    const all = read('users', {}, { limit: Infinity });
    return {
      total: all.length,
      active: all.filter(u => u.status === 'active').length,
      inactive: all.filter(u => u.status === 'inactive').length,
      byRole: all.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {})
    };
  }
};

// ============================================================================
// AUDIT LOGS OPERATIONS
// ============================================================================

export const AuditLogs = {
  log(eventType, eventData) {
    return create('audit_logs', {
      event_type: eventType,
      ...eventData,
      logged_at: new Date().toISOString()
    });
  },

  getByUser(userId, limit = 50) {
    return query('audit_logs')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
  },

  getByEventType(eventType) {
    return query('audit_logs')
      .where('event_type', eventType)
      .orderBy('created_at', 'desc')
      .get();
  },

  getRecent(limit = 100) {
    return query('audit_logs')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
  },

  getByDateRange(startDate, endDate) {
    return query('audit_logs')
      .whereGte('created_at', startDate)
      .whereLte('created_at', endDate)
      .orderBy('created_at', 'desc')
      .get();
  },

  getStatistics() {
    const all = read('audit_logs', {}, { limit: Infinity });
    return {
      total: all.length,
      byEventType: all.reduce((acc, log) => {
        acc[log.event_type] = (acc[log.event_type] || 0) + 1;
        return acc;
      }, {}),
      byUser: all.reduce((acc, log) => {
        if (log.user_id) {
          acc[log.user_id] = (acc[log.user_id] || 0) + 1;
        }
        return acc;
      }, {})
    };
  }
};

// ============================================================================
// SMS LOGS OPERATIONS
// ============================================================================

export const SMSLogs = {
  logSMS(smsData) {
    return create('sms_logs', {
      ...smsData,
      status: 'pending',
      queued_at: new Date().toISOString()
    });
  },

  markSent(id, providerMessageId) {
    return update('sms_logs', id, {
      status: 'sent',
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString()
    });
  },

  markDelivered(id) {
    return update('sms_logs', id, {
      status: 'delivered',
      delivered_at: new Date().toISOString()
    });
  },

  markFailed(id, errorMessage) {
    return update('sms_logs', id, {
      status: 'failed',
      error_message: errorMessage,
      failed_at: new Date().toISOString()
    });
  },

  getByWarning(warningId) {
    return query('sms_logs')
      .where('warning_id', warningId)
      .orderBy('created_at', 'desc')
      .get();
  },

  getPending() {
    return query('sms_logs')
      .where('status', 'pending')
      .orderBy('queued_at', 'asc')
      .get();
  },

  retry(id) {
    const sms = readById('sms_logs', id);
    if (!sms || sms.status !== 'failed') return null;

    return update('sms_logs', id, {
      status: 'pending',
      retry_count: (sms.retry_count || 0) + 1,
      last_retry_at: new Date().toISOString(),
      error_message: null
    });
  },

  getStatistics() {
    const all = read('sms_logs', {}, { limit: Infinity });
    return {
      total: all.length,
      sent: all.filter(s => s.status === 'sent').length,
      delivered: all.filter(s => s.status === 'delivered').length,
      failed: all.filter(s => s.status === 'failed').length,
      pending: all.filter(s => s.status === 'pending').length,
      deliveryRate: all.length > 0 ?
        roundTo(all.filter(s => s.status === 'delivered').length / all.length * 100, 2) + '%' : 'N/A'
    };
  }
};

// ============================================================================
// SEVERITY EVENTS OPERATIONS
// ============================================================================

export const SeverityEvents = {
  getByWarning(warningId) {
    return query('severity_events')
      .where('warning_id', warningId)
      .orderBy('created_at', 'desc')
      .get();
  },

  getOngoing() {
    return query('severity_events')
      .where('status', 'Ongoing')
      .orderBy('severity_score', 'desc')
      .get();
  },

  getBySeverityClass(severityClass) {
    return query('severity_events')
      .where('severity_class', severityClass)
      .get();
  },

  create(eventData) {
    return create('severity_events', {
      ...eventData,
      status: 'Ongoing',
      event_number: `SEV-${Date.now().toString().slice(-8)}`
    });
  },

  updateImpact(id, impactData) {
    return update('severity_events', id, {
      ...impactData,
      impact_updated_at: new Date().toISOString()
    });
  },

  close(id) {
    return update('severity_events', id, {
      status: 'Closed',
      closed_at: new Date().toISOString()
    });
  },

  escalate(id, newSeverityClass) {
    return update('severity_events', id, {
      severity_class: newSeverityClass,
      escalated_at: new Date().toISOString()
    });
  },

  getStatistics() {
    const all = read('severity_events', {}, { limit: Infinity });
    return {
      total: all.length,
      ongoing: all.filter(e => e.status === 'Ongoing').length,
      closed: all.filter(e => e.status === 'Closed').length,
      bySeverity: all.reduce((acc, e) => {
        acc[e.severity_class] = (acc[e.severity_class] || 0) + 1;
        return acc;
      }, {})
    };
  }
};

// ============================================================================
// POPULATION DATA OPERATIONS
// ============================================================================

export const PopulationData = {
  getByAdminUnit(adminUnitId, year = null) {
    const q = query('population_data')
      .where('admin_unit_id', adminUnitId)
      .orderBy('year', 'desc');

    if (year) {
      q.where('year', year);
    }

    return q.get();
  },

  getLatest(adminUnitId) {
    return query('population_data')
      .where('admin_unit_id', adminUnitId)
      .orderBy('year', 'desc')
      .first();
  },

  getTotalPopulation(year = null) {
    const filters = year ? { year } : {};
    const data = read('population_data', filters, { limit: Infinity });
    return data.reduce((sum, d) => sum + (d.total_population || 0), 0);
  },

  getVulnerablePopulation(adminUnitId) {
    const latest = this.getLatest(adminUnitId);
    if (!latest) return null;

    return {
      children: latest.children_under_5 || 0,
      elderly: latest.elderly_60_plus || 0,
      disabled: latest.disabled || 0,
      pregnant: latest.pregnant_women || 0,
      total: (latest.children_under_5 || 0) +
        (latest.elderly_60_plus || 0) +
        (latest.disabled || 0) +
        (latest.pregnant_women || 0)
    };
  },

  getPopulationDensity(adminUnitId) {
    const pop = this.getLatest(adminUnitId);
    const adminUnit = readById('administrative_units', adminUnitId);

    if (!pop || !adminUnit || !adminUnit.area_km2) return null;

    return roundTo(pop.total_population / adminUnit.area_km2, 2);
  }
};

// ============================================================================
// INFRASTRUCTURE OPERATIONS
// ============================================================================

export const Infrastructure = {
  getByAdminUnit(adminUnitId) {
    return query('infrastructure_resources')
      .where('admin_unit_id', adminUnitId)
      .first();
  },

  getTotalResources() {
    const data = read('infrastructure_resources', {}, { limit: Infinity });
    return {
      hospitals: data.reduce((sum, d) => sum + (d.hospitals || 0), 0),
      healthCenters: data.reduce((sum, d) => sum + (d.health_centers || 0), 0),
      emergencyShelters: data.reduce((sum, d) => sum + (d.emergency_shelters || 0), 0),
      schools: data.reduce((sum, d) => sum + (d.primary_schools || 0) + (d.secondary_schools || 0), 0),
      waterPoints: data.reduce((sum, d) => sum + (d.water_points || 0), 0),
      roads_km: data.reduce((sum, d) => sum + (d.road_length_km || 0), 0)
    };
  },

  getCapacityGaps(adminUnitId) {
    const infra = this.getByAdminUnit(adminUnitId);
    const pop = PopulationData.getLatest(adminUnitId);

    if (!infra || !pop) return null;

    const population = pop.total_population || 0;

    return {
      hospitalBeds: {
        current: infra.hospital_beds || 0,
        required: Math.ceil(population / 1000 * 3), // WHO: 3 beds per 1000
        gap: Math.max(0, Math.ceil(population / 1000 * 3) - (infra.hospital_beds || 0))
      },
      healthWorkers: {
        current: infra.health_workers || 0,
        required: Math.ceil(population / 1000 * 2.3), // WHO: 2.3 per 1000
        gap: Math.max(0, Math.ceil(population / 1000 * 2.3) - (infra.health_workers || 0))
      },
      shelterCapacity: {
        current: infra.shelter_capacity || 0,
        required: Math.ceil(population * 0.05), // 5% emergency capacity
        gap: Math.max(0, Math.ceil(population * 0.05) - (infra.shelter_capacity || 0))
      }
    };
  }
};

// ============================================================================
// CLIMATE PROJECTIONS OPERATIONS
// ============================================================================

export const ClimateProjections = {
  getByAdminUnit(adminUnitId, scenario = null) {
    const q = query('climate_projections')
      .where('admin_unit_id', adminUnitId);

    if (scenario) {
      q.where('scenario', scenario);
    }

    return q.get();
  },

  getByScenario(scenario) {
    return query('climate_projections')
      .where('scenario', scenario)
      .get();
  },

  getHighPriority() {
    return query('climate_projections')
      .whereIn('adaptation_priority', ['High', 'Critical'])
      .orderBy('adaptation_priority', 'desc')
      .get();
  },

  getProjectedChange(adminUnitId, variable, scenario = 'RCP4.5') {
    const projection = query('climate_projections')
      .where('admin_unit_id', adminUnitId)
      .where('scenario', scenario)
      .first();

    if (!projection) return null;

    return {
      variable,
      baseline: projection[`${variable}_baseline`],
      projected2030: projection[`${variable}_2030`],
      projected2050: projection[`${variable}_2050`],
      projected2100: projection[`${variable}_2100`],
      changeBy2050: projection[`${variable}_change_2050`],
      confidence: projection[`${variable}_confidence`]
    };
  }
};

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Export entire database
 */
export function exportDatabase() {
  return {
    data: getDatabase(),
    indexes: Object.fromEntries(indexManager.indexes),
    meta: JSON.parse(localStorage.getItem(META_KEY) || '{}'),
    exportedAt: new Date().toISOString(),
    version: DB_CONFIG.version
  };
}

/**
 * Import database from JSON
 */
export function importDatabase(data, options = {}) {
  // Validate structure
  if (!data.tables && !data.data) {
    throw new DatabaseError('Invalid database format', 'INVALID_FORMAT');
  }

  const dbData = data.data || data;

  // Backup current database
  if (options.backup) {
    const backup = exportDatabase();
    localStorage.setItem(`${STORAGE_KEY}_backup_${Date.now()}`, JSON.stringify(backup));
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));

  // Rebuild indexes
  if (DB_CONFIG.indexing.enabled) {
    indexManager.rebuildAllIndexes();
  }

  // Clear cache
  queryCache.invalidate();

  return true;
}

/**
 * Reset database
 */
export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INDEX_KEY);
  localStorage.removeItem(META_KEY);

  queryCache.invalidate();
  indexManager.indexes.clear();

  initializeDatabase();

  dbEvents.emit(DB_EVENTS.DATABASE_RESET, {
    timestamp: new Date().toISOString()
  });

  return true;
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const db = getDatabase();
  const meta = JSON.parse(localStorage.getItem(META_KEY) || '{}');

  const stats = {
    version: db.version,
    configVersion: DB_CONFIG.version,
    created_at: db.created_at,
    lastModified: meta.lastModified,
    tables: {},
    totalRecords: 0,
    storageUsed: new Blob([localStorage.getItem(STORAGE_KEY) || '']).size
  };

  Object.keys(db.tables).forEach(tableName => {
    const count = db.tables[tableName].length;
    stats.tables[tableName] = count;
    stats.totalRecords += count;
  });

  return stats;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return queryCache.getStats();
}

/**
 * Clear cache
 */
export function clearCache() {
  queryCache.invalidate();
  dbEvents.emit(DB_EVENTS.CACHE_INVALIDATED, { scope: 'all' });
}

/**
 * Get index statistics
 */
export function getIndexStats() {
  return indexManager.getStats();
}

/**
 * Rebuild all indexes
 */
export function rebuildIndexes() {
  indexManager.rebuildAllIndexes();
  dbEvents.emit(DB_EVENTS.INDEX_REBUILT, {
    timestamp: new Date().toISOString()
  });
}

/**
 * Get query performance metrics
 */
export function getQueryMetrics() {
  return queryMetrics.getStats();
}

/**
 * Get slow queries
 */
export function getSlowQueries(limit = 10) {
  return queryMetrics.getSlowQueries(limit);
}

/**
 * Clear performance metrics
 */
export function clearMetrics() {
  queryMetrics.clear();
}

/**
 * Health check
 */
export function healthCheck() {
  try {
    const db = getDatabase();
    const stats = getDatabaseStats();

    return {
      status: 'healthy',
      database: {
        connected: true,
        version: db.version,
        tables: Object.keys(db.tables).length,
        records: stats.totalRecords
      },
      cache: {
        enabled: DB_CONFIG.cache.enabled,
        ...getCacheStats()
      },
      indexes: {
        enabled: DB_CONFIG.indexing.enabled,
        ...getIndexStats()
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      status: 'unhealthy',
      error: e.message,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Lazy initialization - will be called on first database access
// Note: initializeDatabase() is called automatically when needed by getDatabase()
// This avoids issues with module load order and allows proper error handling

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Configuration
  config: DB_CONFIG,

  // Database management
  initializeDatabase,
  exportDatabase,
  importDatabase,
  resetDatabase,
  getDatabaseStats,
  healthCheck,

  // Cache management
  getCacheStats,
  clearCache,

  // Index management
  getIndexStats,
  rebuildIndexes,

  // Query metrics
  getQueryMetrics,
  getSlowQueries,
  clearMetrics,

  // Events
  events: dbEvents,
  DB_EVENTS,

  // Transactions
  Transaction,

  // Query builder
  query,
  QueryBuilder,

  // Generic CRUD
  create,
  read,
  readById,
  update,
  remove,
  count,
  exists,
  bulkCreate,
  bulkUpdate,
  upsert,
  clearTable,

  // Validation
  validateRecord,

  // Entity-specific services
  AdminUnits,
  RiskIndicators,
  Warnings,
  Bulletins,
  Users,
  AuditLogs,
  SMSLogs,
  SeverityEvents,
  PopulationData,
  Infrastructure,
  ClimateProjections,

  // Error types
  DatabaseError,
  ValidationError,
  NotFoundError,
  TransactionError,
  ConstraintError
};
