/**
 * REAL-TIME CALCULATION HOOKS
 *
 * Advanced event-driven calculation system for INFORM Risk Index.
 * Automatically triggers recalculations when data changes and
 * notifies subscribers of updates.
 *
 * Features:
 * - Priority-based calculation queue
 * - Middleware pipeline (before/after hooks)
 * - Dependency tracking and auto-recalculation
 * - Event-based data change detection
 * - Debounced batch processing
 * - Subscription system for UI updates
 * - Calculation caching with LRU eviction
 * - Retry logic with exponential backoff
 * - Progress tracking
 * - Performance monitoring
 * - Multi-language support (English/Swahili)
 *
 * @module calculationHooks
 */

import {
  calculateRiskIndex,
  calculateDimension,
  calculateCategory
} from './formulaEngine.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const HOOKS_CONFIG = {
  // Queue configuration
  queue: {
    debounceDelay: 500,
    maxQueueSize: 100,
    processBatchSize: 20,
    enablePriority: true
  },

  // Cache configuration
  cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000 // 1 minute
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },

  // Risk thresholds for alerts
  thresholds: {
    veryHigh: 6.5,
    high: 5.0,
    medium: 3.5,
    low: 2.0
  },

  // Performance settings
  performance: {
    enableMetrics: true,
    slowCalculationThreshold: 1000, // ms
    memoryWarningThreshold: 50 * 1024 * 1024 // 50MB
  },

  // Dependency tracking
  dependencies: {
    enabled: true,
    maxDepth: 5,
    autoRecalculate: true
  }
};

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

export const PRIORITY = {
  CRITICAL: 0,    // Immediate processing (e.g., emergency alerts)
  HIGH: 1,        // User-triggered calculations
  NORMAL: 2,      // Regular indicator updates
  LOW: 3,         // Background batch updates
  BACKGROUND: 4   // Scheduled maintenance
};

// ============================================================================
// EVENT TYPES
// ============================================================================

export const CALCULATION_EVENTS = {
  // Data change events
  INDICATOR_UPDATED: 'indicator_updated',
  INDICATOR_BATCH_UPDATED: 'indicator_batch_updated',
  ADMIN_UNIT_ADDED: 'admin_unit_added',
  ADMIN_UNIT_UPDATED: 'admin_unit_updated',
  ADMIN_UNIT_REMOVED: 'admin_unit_removed',
  DATA_IMPORTED: 'data_imported',
  DATA_SYNCHRONIZED: 'data_synchronized',

  // Calculation events
  CALCULATION_QUEUED: 'calculation_queued',
  CALCULATION_STARTED: 'calculation_started',
  CALCULATION_PROGRESS: 'calculation_progress',
  CALCULATION_COMPLETED: 'calculation_completed',
  CALCULATION_FAILED: 'calculation_failed',
  CALCULATION_RETRYING: 'calculation_retrying',
  CALCULATION_CANCELLED: 'calculation_cancelled',

  // Batch events
  BATCH_STARTED: 'batch_started',
  BATCH_PROGRESS: 'batch_progress',
  BATCH_COMPLETED: 'batch_completed',
  BATCH_FAILED: 'batch_failed',

  // Risk events
  RISK_CLASS_CHANGED: 'risk_class_changed',
  HIGH_RISK_DETECTED: 'high_risk_detected',
  RISK_DECREASED: 'risk_decreased',
  THRESHOLD_EXCEEDED: 'threshold_exceeded',

  // Dependency events
  DEPENDENCY_TRIGGERED: 'dependency_triggered',
  DEPENDENCY_CHAIN_STARTED: 'dependency_chain_started',
  DEPENDENCY_CHAIN_COMPLETED: 'dependency_chain_completed',

  // System events
  CACHE_CLEARED: 'cache_cleared',
  CACHE_EVICTION: 'cache_eviction',
  HOOK_REGISTERED: 'hook_registered',
  HOOK_REMOVED: 'hook_removed',
  MIDDLEWARE_REGISTERED: 'middleware_registered',
  QUEUE_OVERFLOW: 'queue_overflow',
  PERFORMANCE_WARNING: 'performance_warning',
  MEMORY_WARNING: 'memory_warning'
};

// ============================================================================
// TRANSLATIONS
// ============================================================================

const TRANSLATIONS = {
  en: {
    events: {
      calculation_started: 'Calculation started',
      calculation_completed: 'Calculation completed',
      calculation_failed: 'Calculation failed',
      high_risk_detected: 'High risk detected',
      risk_class_changed: 'Risk class changed',
      threshold_exceeded: 'Threshold exceeded'
    },
    priority: {
      [PRIORITY.CRITICAL]: 'Critical',
      [PRIORITY.HIGH]: 'High',
      [PRIORITY.NORMAL]: 'Normal',
      [PRIORITY.LOW]: 'Low',
      [PRIORITY.BACKGROUND]: 'Background'
    },
    status: {
      queued: 'Queued',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      retrying: 'Retrying'
    }
  },
  sw: {
    events: {
      calculation_started: 'Hesabu imeanza',
      calculation_completed: 'Hesabu imekamilika',
      calculation_failed: 'Hesabu imeshindwa',
      high_risk_detected: 'Hatari kubwa imegunduliwa',
      risk_class_changed: 'Daraja la hatari limebadilika',
      threshold_exceeded: 'Kiwango kimezidishwa'
    },
    priority: {
      [PRIORITY.CRITICAL]: 'Muhimu sana',
      [PRIORITY.HIGH]: 'Juu',
      [PRIORITY.NORMAL]: 'Kawaida',
      [PRIORITY.LOW]: 'Chini',
      [PRIORITY.BACKGROUND]: 'Nyuma'
    },
    status: {
      queued: 'Imepangwa',
      processing: 'Inafanywa',
      completed: 'Imekamilika',
      failed: 'Imeshindwa',
      retrying: 'Inajaribu tena'
    }
  }
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class CalculationHookError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'CalculationHookError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class QueueOverflowError extends CalculationHookError {
  constructor(queueSize, maxSize) {
    super(`Queue overflow: ${queueSize} exceeds max ${maxSize}`, 'QUEUE_OVERFLOW', {
      queueSize,
      maxSize
    });
    this.name = 'QueueOverflowError';
  }
}

export class DependencyCycleError extends CalculationHookError {
  constructor(cycle) {
    super(`Dependency cycle detected: ${cycle.join(' -> ')}`, 'DEPENDENCY_CYCLE', {
      cycle
    });
    this.name = 'DependencyCycleError';
  }
}

export class CalculationTimeoutError extends CalculationHookError {
  constructor(calculationId, timeout) {
    super(`Calculation ${calculationId} timed out after ${timeout}ms`, 'CALCULATION_TIMEOUT', {
      calculationId,
      timeout
    });
    this.name = 'CalculationTimeoutError';
  }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const createInitialState = () => ({
  // Event subscribers
  subscribers: new Map(),

  // Middleware pipeline
  middleware: {
    before: [],
    after: [],
    error: []
  },

  // Priority queue (min-heap by priority)
  calculationQueue: [],

  // Active calculations
  activeCalculations: new Map(),

  // Calculation history for retry
  calculationHistory: new Map(),

  // Debounce timer
  debounceTimer: null,

  // Processing flag
  isProcessing: false,

  // LRU Cache
  cache: new Map(),
  cacheOrder: [],

  // Dependency graph
  dependencies: new Map(),
  reverseDependencies: new Map(),

  // Previous risk values for change detection
  previousRiskValues: new Map(),

  // Performance metrics
  metrics: {
    totalCalculations: 0,
    successfulCalculations: 0,
    failedCalculations: 0,
    retriedCalculations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheEvictions: 0,
    averageCalculationTime: 0,
    maxCalculationTime: 0,
    minCalculationTime: Infinity,
    lastCalculationTime: null,
    queueHighWaterMark: 0,
    dependencyTriggeredCalculations: 0,
    startTime: Date.now()
  },

  // Cache cleanup interval
  cleanupInterval: null,

  // Configuration (mutable copy)
  config: { ...HOOKS_CONFIG }
});

let state = createInitialState();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for calculations
 */
function generateId(prefix = 'CALC') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get translation
 */
export function t(key, lang = 'en') {
  const keys = key.split('.');
  let value = TRANSLATIONS[lang] || TRANSLATIONS.en;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English
      value = TRANSLATIONS.en;
      for (const k2 of keys) {
        value = value?.[k2];
        if (value === undefined) return key;
      }
      break;
    }
  }

  return value || key;
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt) {
  const { baseDelay, maxDelay, backoffMultiplier } = state.config.retry;
  const delay = Math.min(
    baseDelay * Math.pow(backoffMultiplier, attempt),
    maxDelay
  );
  // Add jitter (±25%)
  return delay * (0.75 + Math.random() * 0.5);
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/**
 * Subscribe to calculation events
 * @param {string|string[]} eventTypes - Event type(s) to subscribe to
 * @param {Function} callback - Callback function
 * @param {Object} options - Subscription options
 * @returns {string} Subscription ID
 */
export function subscribe(eventTypes, callback, options = {}) {
  const {
    once = false,
    filter = null,
    priority = PRIORITY.NORMAL
  } = options;

  const events = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
  const subscriptionId = generateId('SUB');

  const subscription = {
    id: subscriptionId,
    callback,
    once,
    filter,
    priority,
    createdAt: new Date().toISOString()
  };

  for (const eventType of events) {
    if (!state.subscribers.has(eventType)) {
      state.subscribers.set(eventType, []);
    }
    state.subscribers.get(eventType).push(subscription);

    // Sort by priority
    state.subscribers.get(eventType).sort((a, b) => a.priority - b.priority);
  }

  emit(CALCULATION_EVENTS.HOOK_REGISTERED, {
    eventTypes: events,
    subscriptionId,
    options
  });

  return subscriptionId;
}

/**
 * Unsubscribe from calculation events
 * @param {string} subscriptionId - Subscription ID
 * @returns {boolean} Success
 */
export function unsubscribe(subscriptionId) {
  let removed = false;

  for (const [eventType, subscriptions] of state.subscribers.entries()) {
    const index = subscriptions.findIndex(s => s.id === subscriptionId);
    if (index >= 0) {
      subscriptions.splice(index, 1);
      removed = true;
    }
  }

  if (removed) {
    emit(CALCULATION_EVENTS.HOOK_REMOVED, { subscriptionId });
  }

  return removed;
}

/**
 * Subscribe to all events
 * @param {Function} callback - Callback function
 * @returns {string} Subscription ID
 */
export function subscribeAll(callback) {
  return subscribe(Object.values(CALCULATION_EVENTS), callback);
}

/**
 * Emit an event to all subscribers
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 */
function emit(eventType, data) {
  const eventData = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ...data
  };

  const subscriptions = state.subscribers.get(eventType) || [];
  const toRemove = [];

  for (const subscription of subscriptions) {
    // Apply filter if present
    if (subscription.filter && !subscription.filter(eventData)) {
      continue;
    }

    try {
      subscription.callback(eventData);
    } catch (error) {
      console.error(`Hook callback error [${subscription.id}]:`, error);
    }

    if (subscription.once) {
      toRemove.push(subscription.id);
    }
  }

  // Remove one-time subscriptions
  for (const id of toRemove) {
    unsubscribe(id);
  }
}

// ============================================================================
// MIDDLEWARE SYSTEM
// ============================================================================

/**
 * Register middleware
 * @param {string} type - 'before', 'after', or 'error'
 * @param {Function} handler - Middleware handler
 * @param {Object} options - Middleware options
 * @returns {string} Middleware ID
 */
export function useMiddleware(type, handler, options = {}) {
  const { priority = PRIORITY.NORMAL, name = 'anonymous' } = options;

  const middlewareId = generateId('MW');
  const middleware = {
    id: middlewareId,
    name,
    handler,
    priority,
    createdAt: new Date().toISOString()
  };

  state.middleware[type].push(middleware);
  state.middleware[type].sort((a, b) => a.priority - b.priority);

  emit(CALCULATION_EVENTS.MIDDLEWARE_REGISTERED, {
    middlewareId,
    type,
    name
  });

  return middlewareId;
}

/**
 * Remove middleware
 * @param {string} middlewareId - Middleware ID
 * @returns {boolean} Success
 */
export function removeMiddleware(middlewareId) {
  for (const type of ['before', 'after', 'error']) {
    const index = state.middleware[type].findIndex(m => m.id === middlewareId);
    if (index >= 0) {
      state.middleware[type].splice(index, 1);
      return true;
    }
  }
  return false;
}

/**
 * Run middleware pipeline
 * @param {string} type - 'before', 'after', or 'error'
 * @param {Object} context - Calculation context
 * @returns {Object} Modified context
 */
async function runMiddleware(type, context) {
  let currentContext = { ...context };

  for (const middleware of state.middleware[type]) {
    try {
      const result = await middleware.handler(currentContext);
      if (result === false) {
        // Middleware wants to abort
        currentContext._aborted = true;
        break;
      }
      if (result && typeof result === 'object') {
        currentContext = { ...currentContext, ...result };
      }
    } catch (error) {
      console.error(`Middleware error [${middleware.name}]:`, error);
      if (type !== 'error') {
        throw error;
      }
    }
  }

  return currentContext;
}

// ============================================================================
// DEPENDENCY TRACKING
// ============================================================================

/**
 * Register dependency between indicators/admin units
 * @param {string} sourceId - Source identifier
 * @param {string} targetId - Target identifier (depends on source)
 * @param {Object} options - Dependency options
 */
export function registerDependency(sourceId, targetId, options = {}) {
  const { type = 'indicator', weight = 1.0, metadata = {} } = options;

  // Check for cycles before adding
  if (wouldCreateCycle(sourceId, targetId)) {
    throw new DependencyCycleError([sourceId, targetId]);
  }

  // Add forward dependency
  if (!state.dependencies.has(sourceId)) {
    state.dependencies.set(sourceId, new Map());
  }
  state.dependencies.get(sourceId).set(targetId, { type, weight, metadata });

  // Add reverse dependency
  if (!state.reverseDependencies.has(targetId)) {
    state.reverseDependencies.set(targetId, new Set());
  }
  state.reverseDependencies.get(targetId).add(sourceId);
}

/**
 * Remove dependency
 * @param {string} sourceId - Source identifier
 * @param {string} targetId - Target identifier
 */
export function removeDependency(sourceId, targetId) {
  if (state.dependencies.has(sourceId)) {
    state.dependencies.get(sourceId).delete(targetId);
  }
  if (state.reverseDependencies.has(targetId)) {
    state.reverseDependencies.get(targetId).delete(sourceId);
  }
}

/**
 * Check if adding dependency would create a cycle
 */
function wouldCreateCycle(sourceId, targetId, visited = new Set()) {
  if (sourceId === targetId) return true;
  if (visited.has(targetId)) return false;

  visited.add(targetId);

  const deps = state.dependencies.get(targetId);
  if (!deps) return false;

  for (const [nextTarget] of deps) {
    if (wouldCreateCycle(sourceId, nextTarget, visited)) {
      return true;
    }
  }

  return false;
}

/**
 * Get all dependents of a source
 * @param {string} sourceId - Source identifier
 * @param {number} depth - Current depth
 * @returns {Set} Set of dependent IDs
 */
function getDependents(sourceId, depth = 0) {
  const dependents = new Set();

  if (depth >= state.config.dependencies.maxDepth) {
    return dependents;
  }

  const deps = state.dependencies.get(sourceId);
  if (!deps) return dependents;

  for (const [targetId] of deps) {
    dependents.add(targetId);
    // Recursively get dependents
    const subDeps = getDependents(targetId, depth + 1);
    for (const subDep of subDeps) {
      dependents.add(subDep);
    }
  }

  return dependents;
}

/**
 * Trigger recalculation for all dependents
 * @param {string} sourceId - Changed source
 * @param {Object} context - Change context
 */
function triggerDependentRecalculations(sourceId, context) {
  if (!state.config.dependencies.enabled || !state.config.dependencies.autoRecalculate) {
    return;
  }

  const dependents = getDependents(sourceId);
  if (dependents.size === 0) return;

  emit(CALCULATION_EVENTS.DEPENDENCY_CHAIN_STARTED, {
    sourceId,
    dependentCount: dependents.size,
    dependents: Array.from(dependents)
  });

  state.metrics.dependencyTriggeredCalculations += dependents.size;

  for (const dependentId of dependents) {
    emit(CALCULATION_EVENTS.DEPENDENCY_TRIGGERED, {
      sourceId,
      dependentId,
      context
    });

    // Queue recalculation for dependent
    queueCalculation({
      type: 'dependency',
      adminUnitId: dependentId,
      triggeredBy: `dependency:${sourceId}`,
      priority: PRIORITY.HIGH,
      context
    });
  }
}

// ============================================================================
// PRIORITY QUEUE IMPLEMENTATION
// ============================================================================

/**
 * Priority queue using heap
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;

    const item = this.heap[0];
    const last = this.heap.pop();

    if (!this.isEmpty()) {
      this.heap[0] = last;
      this._bubbleDown(0);
    }

    return item;
  }

  peek() {
    return this.heap[0] || null;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this._compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  _bubbleDown(index) {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.heap.length &&
          this._compare(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < this.heap.length &&
          this._compare(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  _compare(a, b) {
    // First compare by priority (lower is higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then by queue time (older first)
    return a.queuedAt - b.queuedAt;
  }

  toArray() {
    return [...this.heap].sort((a, b) => this._compare(a, b));
  }

  has(predicate) {
    return this.heap.some(predicate);
  }

  remove(predicate) {
    const index = this.heap.findIndex(predicate);
    if (index < 0) return false;

    const last = this.heap.pop();
    if (index < this.heap.length) {
      this.heap[index] = last;
      this._bubbleDown(index);
      this._bubbleUp(index);
    }
    return true;
  }
}

const priorityQueue = new PriorityQueue();

// ============================================================================
// CALCULATION QUEUE
// ============================================================================

/**
 * Queue a calculation for processing
 * @param {Object} request - Calculation request
 * @returns {string} Calculation ID
 */
export function queueCalculation(request) {
  const calculationId = generateId('CALC');
  const priority = request.priority ?? PRIORITY.NORMAL;

  const queuedRequest = {
    id: calculationId,
    ...request,
    priority,
    queuedAt: Date.now(),
    attempts: 0,
    status: 'queued'
  };

  // Check if same admin unit already in queue
  if (priorityQueue.has(r => r.adminUnitId === request.adminUnitId)) {
    // Update existing or skip if lower priority
    const existing = priorityQueue.heap.find(r => r.adminUnitId === request.adminUnitId);
    if (existing && priority < existing.priority) {
      // Replace with higher priority
      priorityQueue.remove(r => r.adminUnitId === request.adminUnitId);
    } else {
      return existing?.id;
    }
  }

  // Check queue overflow
  if (priorityQueue.size >= state.config.queue.maxQueueSize) {
    if (priority > PRIORITY.HIGH) {
      emit(CALCULATION_EVENTS.QUEUE_OVERFLOW, {
        queueSize: priorityQueue.size,
        rejected: calculationId
      });
      throw new QueueOverflowError(priorityQueue.size, state.config.queue.maxQueueSize);
    }
    // Force process for high priority items
    processQueueImmediate();
  }

  priorityQueue.push(queuedRequest);

  // Update high water mark
  if (priorityQueue.size > state.metrics.queueHighWaterMark) {
    state.metrics.queueHighWaterMark = priorityQueue.size;
  }

  emit(CALCULATION_EVENTS.CALCULATION_QUEUED, {
    calculationId,
    adminUnitId: request.adminUnitId,
    priority,
    queueSize: priorityQueue.size
  });

  // Schedule processing
  scheduleProcessing();

  return calculationId;
}

/**
 * Schedule queue processing with debounce
 */
function scheduleProcessing() {
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }

  state.debounceTimer = setTimeout(() => {
    processQueue();
  }, state.config.queue.debounceDelay);
}

/**
 * Process queue immediately without debounce
 */
function processQueueImmediate() {
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }
  processQueue();
}

/**
 * Process queued calculations
 */
async function processQueue() {
  if (state.isProcessing || priorityQueue.isEmpty()) {
    return;
  }

  state.isProcessing = true;

  const batchSize = state.config.queue.processBatchSize;
  const batch = [];

  // Collect batch
  while (batch.length < batchSize && !priorityQueue.isEmpty()) {
    const request = priorityQueue.pop();
    if (request) {
      batch.push(request);
    }
  }

  if (batch.length === 0) {
    state.isProcessing = false;
    return;
  }

  emit(CALCULATION_EVENTS.BATCH_STARTED, {
    count: batch.length,
    adminUnits: batch.map(b => b.adminUnitId)
  });

  const startTime = Date.now();
  const results = [];
  const errors = [];

  for (let i = 0; i < batch.length; i++) {
    const request = batch[i];

    try {
      // Run before middleware
      const context = await runMiddleware('before', { request });
      if (context._aborted) {
        emit(CALCULATION_EVENTS.CALCULATION_CANCELLED, {
          calculationId: request.id,
          reason: 'middleware_abort'
        });
        continue;
      }

      const result = await performCalculation(request);
      results.push(result);

      // Run after middleware
      await runMiddleware('after', { request, result });

      // Emit progress
      emit(CALCULATION_EVENTS.BATCH_PROGRESS, {
        processed: i + 1,
        total: batch.length,
        current: request.adminUnitId,
        percentComplete: Math.round(((i + 1) / batch.length) * 100)
      });

    } catch (error) {
      errors.push({
        calculationId: request.id,
        adminUnitId: request.adminUnitId,
        error: error.message
      });

      // Run error middleware
      await runMiddleware('error', { request, error });

      // Handle retry
      await handleCalculationError(request, error);
    }
  }

  const duration = Date.now() - startTime;
  updateMetrics(results, errors, duration);

  emit(CALCULATION_EVENTS.BATCH_COMPLETED, {
    count: results.length,
    errors: errors.length,
    duration,
    results
  });

  state.isProcessing = false;

  // Continue processing if more in queue
  if (!priorityQueue.isEmpty()) {
    scheduleProcessing();
  }
}

/**
 * Handle calculation error with retry logic
 */
async function handleCalculationError(request, error) {
  const maxAttempts = state.config.retry.maxAttempts;

  if (request.attempts < maxAttempts) {
    request.attempts++;
    const delay = calculateBackoffDelay(request.attempts);

    emit(CALCULATION_EVENTS.CALCULATION_RETRYING, {
      calculationId: request.id,
      adminUnitId: request.adminUnitId,
      attempt: request.attempts,
      maxAttempts,
      nextRetryIn: delay
    });

    state.metrics.retriedCalculations++;

    // Re-queue with delay
    setTimeout(() => {
      priorityQueue.push(request);
      scheduleProcessing();
    }, delay);
  } else {
    emit(CALCULATION_EVENTS.CALCULATION_FAILED, {
      calculationId: request.id,
      adminUnitId: request.adminUnitId,
      error: error.message,
      attempts: request.attempts,
      permanent: true
    });

    state.metrics.failedCalculations++;
  }
}

/**
 * Perform a single calculation
 * @param {Object} request - Calculation request
 * @returns {Object} Calculation result
 */
async function performCalculation(request) {
  const { id, adminUnitId, indicators } = request;

  emit(CALCULATION_EVENTS.CALCULATION_STARTED, {
    calculationId: id,
    adminUnitId
  });

  // Check cache
  if (state.config.cache.enabled && indicators) {
    const cacheKey = generateCacheKey(adminUnitId, indicators);
    const cached = getFromCache(cacheKey);

    if (cached) {
      state.metrics.cacheHits++;
      emit(CALCULATION_EVENTS.CALCULATION_COMPLETED, {
        calculationId: id,
        adminUnitId,
        fromCache: true,
        result: cached
      });
      return cached;
    }

    state.metrics.cacheMisses++;
  }

  const calcStartTime = Date.now();

  // Perform calculation
  let result;
  if (indicators) {
    // Calculate risk from indicator values
    const hazard = indicators.hazard_exposure ?? indicators.hazardExposure ?? 5;
    const vulnerability = indicators.vulnerability ?? 5;
    const lackCoping = indicators.lack_coping_capacity ?? indicators.lackCopingCapacity ?? 5;

    const dimensionValues = { hazard, vulnerability, lack_of_coping_capacity: lackCoping };
    const riskResult = calculateRiskIndex(dimensionValues);

    result = {
      riskIndex: riskResult.riskIndex,
      riskClass: riskResult.riskClass,
      dimensions: dimensionValues,
      indicators
    };
  } else {
    // For dependency-triggered calculations, we need to fetch indicators
    result = { adminUnitId, requiresData: true };
  }

  const calcDuration = Date.now() - calcStartTime;

  // Check for slow calculation
  if (calcDuration > state.config.performance.slowCalculationThreshold) {
    emit(CALCULATION_EVENTS.PERFORMANCE_WARNING, {
      calculationId: id,
      adminUnitId,
      duration: calcDuration,
      threshold: state.config.performance.slowCalculationThreshold
    });
  }

  // Add metadata
  result.calculationId = id;
  result.adminUnitId = adminUnitId;
  result.calculatedAt = new Date().toISOString();
  result.duration = calcDuration;
  result.triggeredBy = request.triggeredBy;

  // Cache result
  if (state.config.cache.enabled && indicators) {
    const cacheKey = generateCacheKey(adminUnitId, indicators);
    setCache(cacheKey, result);
  }

  // Check for risk changes
  checkRiskChanges(adminUnitId, result);

  // Trigger dependent recalculations
  if (request.type !== 'dependency') {
    triggerDependentRecalculations(adminUnitId, { result });
  }

  emit(CALCULATION_EVENTS.CALCULATION_COMPLETED, {
    calculationId: id,
    adminUnitId,
    fromCache: false,
    duration: calcDuration,
    result
  });

  state.metrics.successfulCalculations++;

  return result;
}

// ============================================================================
// CALCULATION HOOKS
// ============================================================================

/**
 * Hook: Indicator value updated
 * @param {string} adminUnitId - Admin unit ID
 * @param {string} indicatorId - Indicator ID
 * @param {number} oldValue - Previous value
 * @param {number} newValue - New value
 * @param {Object} indicators - All indicators for admin unit
 * @param {Object} options - Additional options
 */
export function onIndicatorUpdated(
  adminUnitId,
  indicatorId,
  oldValue,
  newValue,
  indicators,
  options = {}
) {
  const { priority = PRIORITY.NORMAL, immediate = false } = options;

  emit(CALCULATION_EVENTS.INDICATOR_UPDATED, {
    adminUnitId,
    indicatorId,
    oldValue,
    newValue,
    changeMagnitude: Math.abs(newValue - oldValue),
    changePercent: oldValue !== 0 ? ((newValue - oldValue) / oldValue * 100).toFixed(2) : null
  });

  const calculationId = queueCalculation({
    type: 'single',
    adminUnitId,
    indicators,
    triggeredBy: indicatorId,
    priority
  });

  if (immediate) {
    processQueueImmediate();
  }

  return calculationId;
}

/**
 * Hook: Multiple indicators updated
 * @param {string} adminUnitId - Admin unit ID
 * @param {Object[]} changes - Array of {indicatorId, oldValue, newValue}
 * @param {Object} indicators - All indicators for admin unit
 * @param {Object} options - Additional options
 */
export function onIndicatorBatchUpdated(adminUnitId, changes, indicators, options = {}) {
  const { priority = PRIORITY.NORMAL } = options;

  emit(CALCULATION_EVENTS.INDICATOR_BATCH_UPDATED, {
    adminUnitId,
    changeCount: changes.length,
    changes,
    affectedIndicators: changes.map(c => c.indicatorId)
  });

  return queueCalculation({
    type: 'batch',
    adminUnitId,
    indicators,
    triggeredBy: changes.map(c => c.indicatorId),
    priority
  });
}

/**
 * Hook: New admin unit added
 * @param {Object} adminUnit - Admin unit data
 * @param {Object} options - Additional options
 */
export function onAdminUnitAdded(adminUnit, options = {}) {
  const { priority = PRIORITY.NORMAL, calculateImmediately = true } = options;

  emit(CALCULATION_EVENTS.ADMIN_UNIT_ADDED, {
    adminUnitId: adminUnit.adminUnitId,
    adminUnitName: adminUnit.adminUnitName,
    hasIndicators: Object.keys(adminUnit.indicators || {}).length > 0
  });

  if (calculateImmediately && adminUnit.indicators && Object.keys(adminUnit.indicators).length > 0) {
    return queueCalculation({
      type: 'single',
      adminUnitId: adminUnit.adminUnitId,
      indicators: adminUnit.indicators,
      triggeredBy: 'admin_unit_added',
      priority
    });
  }

  return null;
}

/**
 * Hook: Admin unit updated
 * @param {Object} adminUnit - Updated admin unit data
 * @param {Object} previousData - Previous data
 * @param {Object} options - Additional options
 */
export function onAdminUnitUpdated(adminUnit, previousData, options = {}) {
  const { priority = PRIORITY.NORMAL } = options;

  emit(CALCULATION_EVENTS.ADMIN_UNIT_UPDATED, {
    adminUnitId: adminUnit.adminUnitId,
    adminUnitName: adminUnit.adminUnitName,
    changedFields: Object.keys(adminUnit).filter(
      key => JSON.stringify(adminUnit[key]) !== JSON.stringify(previousData?.[key])
    )
  });

  if (adminUnit.indicators) {
    return queueCalculation({
      type: 'update',
      adminUnitId: adminUnit.adminUnitId,
      indicators: adminUnit.indicators,
      triggeredBy: 'admin_unit_updated',
      priority
    });
  }

  return null;
}

/**
 * Hook: Admin unit removed
 * @param {string} adminUnitId - Admin unit ID
 */
export function onAdminUnitRemoved(adminUnitId) {
  emit(CALCULATION_EVENTS.ADMIN_UNIT_REMOVED, { adminUnitId });

  // Clear from cache
  clearCache(adminUnitId);

  // Remove from previous values
  state.previousRiskValues.delete(adminUnitId);

  // Remove dependencies
  state.dependencies.delete(adminUnitId);
  state.reverseDependencies.delete(adminUnitId);

  // Remove from queue
  priorityQueue.remove(r => r.adminUnitId === adminUnitId);
}

/**
 * Hook: Data imported
 * @param {Object[]} importedData - Array of imported admin units
 * @param {Object} options - Import options
 */
export function onDataImported(importedData, options = {}) {
  const { priority = PRIORITY.LOW, batchSize = 50 } = options;

  emit(CALCULATION_EVENTS.DATA_IMPORTED, {
    count: importedData.length,
    adminUnits: importedData.map(d => d.adminUnitId)
  });

  const calculationIds = [];

  // Queue calculations in batches
  for (let i = 0; i < importedData.length; i += batchSize) {
    const batch = importedData.slice(i, i + batchSize);
    for (const data of batch) {
      if (data.indicators && Object.keys(data.indicators).length > 0) {
        const id = queueCalculation({
          type: 'import',
          adminUnitId: data.adminUnitId,
          indicators: data.indicators,
          triggeredBy: 'data_import',
          priority
        });
        calculationIds.push(id);
      }
    }
  }

  return calculationIds;
}

// ============================================================================
// RISK CHANGE DETECTION
// ============================================================================

/**
 * Check for risk class changes and threshold exceedances
 */
function checkRiskChanges(adminUnitId, result) {
  if (!result.riskIndex) return;

  const previousRisk = state.previousRiskValues.get(adminUnitId);

  // Update previous value
  state.previousRiskValues.set(adminUnitId, {
    riskIndex: result.riskIndex,
    riskClass: result.riskClass,
    timestamp: new Date().toISOString()
  });

  if (previousRisk) {
    // Check for risk class change
    if (previousRisk.riskClass !== result.riskClass) {
      const direction = result.riskIndex > previousRisk.riskIndex ? 'increased' : 'decreased';

      emit(CALCULATION_EVENTS.RISK_CLASS_CHANGED, {
        adminUnitId,
        previousClass: previousRisk.riskClass,
        newClass: result.riskClass,
        previousIndex: previousRisk.riskIndex,
        newIndex: result.riskIndex,
        direction,
        changeMagnitude: Math.abs(result.riskIndex - previousRisk.riskIndex)
      });

      if (direction === 'decreased') {
        emit(CALCULATION_EVENTS.RISK_DECREASED, {
          adminUnitId,
          previousClass: previousRisk.riskClass,
          newClass: result.riskClass,
          improvement: previousRisk.riskIndex - result.riskIndex
        });
      }
    }
  }

  // Check for high risk detection
  if (result.riskIndex >= state.config.thresholds.high) {
    emit(CALCULATION_EVENTS.HIGH_RISK_DETECTED, {
      adminUnitId,
      riskIndex: result.riskIndex,
      riskClass: result.riskClass,
      isVeryHigh: result.riskIndex >= state.config.thresholds.veryHigh,
      isNew: !previousRisk || previousRisk.riskIndex < state.config.thresholds.high
    });
  }

  // Check thresholds for each dimension
  checkDimensionThresholds(adminUnitId, result);
}

/**
 * Check dimension thresholds
 */
function checkDimensionThresholds(adminUnitId, result) {
  const dimensions = result.dimensions || {};

  for (const [dimensionId, value] of Object.entries(dimensions)) {
    if (typeof value !== 'number') continue;

    let severity = null;
    let threshold = null;

    if (value >= state.config.thresholds.veryHigh) {
      severity = 'very_high';
      threshold = state.config.thresholds.veryHigh;
    } else if (value >= state.config.thresholds.high) {
      severity = 'high';
      threshold = state.config.thresholds.high;
    }

    if (severity) {
      emit(CALCULATION_EVENTS.THRESHOLD_EXCEEDED, {
        adminUnitId,
        dimension: dimensionId,
        value,
        threshold,
        severity,
        exceededBy: value - threshold
      });
    }
  }
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

/**
 * Generate cache key
 */
function generateCacheKey(adminUnitId, indicators) {
  const indicatorHash = JSON.stringify(
    Object.entries(indicators || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, val]) => `${id}:${val}`)
  );
  return `${adminUnitId}:${indicatorHash}`;
}

/**
 * Get from cache with LRU update
 */
function getFromCache(key) {
  const cached = state.cache.get(key);
  if (!cached) return null;

  // Check TTL
  if (Date.now() - cached.timestamp > state.config.cache.ttl) {
    state.cache.delete(key);
    removeFromCacheOrder(key);
    return null;
  }

  // Move to end of LRU order
  removeFromCacheOrder(key);
  state.cacheOrder.push(key);

  return cached.value;
}

/**
 * Set cache value with LRU eviction
 */
function setCache(key, value) {
  // Check if need to evict
  while (state.cache.size >= state.config.cache.maxSize) {
    const oldestKey = state.cacheOrder.shift();
    if (oldestKey) {
      state.cache.delete(oldestKey);
      state.metrics.cacheEvictions++;

      emit(CALCULATION_EVENTS.CACHE_EVICTION, {
        evictedKey: oldestKey,
        cacheSize: state.cache.size
      });
    }
  }

  state.cache.set(key, {
    value,
    timestamp: Date.now()
  });

  // Add to LRU order
  removeFromCacheOrder(key);
  state.cacheOrder.push(key);
}

/**
 * Remove key from cache order
 */
function removeFromCacheOrder(key) {
  const index = state.cacheOrder.indexOf(key);
  if (index >= 0) {
    state.cacheOrder.splice(index, 1);
  }
}

/**
 * Clear calculation cache
 * @param {string} adminUnitId - Optional: clear only for specific admin unit
 */
export function clearCache(adminUnitId = null) {
  if (adminUnitId) {
    // Clear entries for specific admin unit
    for (const key of state.cache.keys()) {
      if (key.startsWith(adminUnitId)) {
        state.cache.delete(key);
        removeFromCacheOrder(key);
      }
    }
  } else {
    state.cache.clear();
    state.cacheOrder = [];
  }

  emit(CALCULATION_EVENTS.CACHE_CLEARED, {
    adminUnitId,
    remainingSize: state.cache.size
  });
}

/**
 * Start cache cleanup interval
 */
function startCacheCleanup() {
  if (state.cleanupInterval) {
    clearInterval(state.cleanupInterval);
  }

  state.cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of state.cache.entries()) {
      if (now - cached.timestamp > state.config.cache.ttl) {
        state.cache.delete(key);
        removeFromCacheOrder(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      emit(CALCULATION_EVENTS.CACHE_CLEARED, {
        type: 'ttl_cleanup',
        cleaned,
        remainingSize: state.cache.size
      });
    }
  }, state.config.cache.cleanupInterval);
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * Update performance metrics
 */
function updateMetrics(results, errors, duration) {
  state.metrics.totalCalculations += results.length + errors.length;

  if (duration > 0) {
    state.metrics.lastCalculationTime = duration;

    if (duration > state.metrics.maxCalculationTime) {
      state.metrics.maxCalculationTime = duration;
    }
    if (duration < state.metrics.minCalculationTime) {
      state.metrics.minCalculationTime = duration;
    }

    // Update running average
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    const totalCount = state.metrics.successfulCalculations + state.metrics.failedCalculations;
    state.metrics.averageCalculationTime =
      ((state.metrics.averageCalculationTime * (totalCount - results.length)) + (avgDuration * results.length)) / totalCount;
  }
}

/**
 * Get performance metrics
 * @returns {Object} Metrics
 */
export function getMetrics() {
  const cacheTotal = state.metrics.cacheHits + state.metrics.cacheMisses;

  return {
    ...state.metrics,
    minCalculationTime: state.metrics.minCalculationTime === Infinity ? 0 : state.metrics.minCalculationTime,
    cacheSize: state.cache.size,
    cacheMaxSize: state.config.cache.maxSize,
    queueSize: priorityQueue.size,
    queueMaxSize: state.config.queue.maxQueueSize,
    activeCalculations: state.activeCalculations.size,
    subscriberCount: Array.from(state.subscribers.values())
      .reduce((sum, subs) => sum + subs.length, 0),
    middlewareCount: {
      before: state.middleware.before.length,
      after: state.middleware.after.length,
      error: state.middleware.error.length
    },
    dependencyCount: state.dependencies.size,
    cacheHitRate: cacheTotal > 0
      ? (state.metrics.cacheHits / cacheTotal * 100).toFixed(2) + '%'
      : '0%',
    successRate: state.metrics.totalCalculations > 0
      ? (state.metrics.successfulCalculations / state.metrics.totalCalculations * 100).toFixed(2) + '%'
      : '0%',
    uptime: Date.now() - state.metrics.startTime
  };
}

/**
 * Reset metrics
 */
export function resetMetrics() {
  state.metrics = {
    totalCalculations: 0,
    successfulCalculations: 0,
    failedCalculations: 0,
    retriedCalculations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheEvictions: 0,
    averageCalculationTime: 0,
    maxCalculationTime: 0,
    minCalculationTime: Infinity,
    lastCalculationTime: null,
    queueHighWaterMark: 0,
    dependencyTriggeredCalculations: 0,
    startTime: Date.now()
  };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Recalculate all admin units
 * @param {Object[]} adminUnits - Array of admin units
 * @param {Object} options - Options
 * @returns {Object} Batch results
 */
export async function recalculateAll(adminUnits, options = {}) {
  const {
    priority = PRIORITY.BACKGROUND,
    onProgress = null,
    batchSize = 50
  } = options;

  emit(CALCULATION_EVENTS.BATCH_STARTED, {
    count: adminUnits.length,
    type: 'full_recalculation'
  });

  const startTime = Date.now();
  const results = [];
  const errors = [];

  // Process in batches
  for (let i = 0; i < adminUnits.length; i += batchSize) {
    const batch = adminUnits.slice(i, i + batchSize);

    try {
      // Process each unit in the batch
      const batchResults = batch.map(unit => {
        const indicators = unit.indicators || {};
        const hazard = indicators.hazard_exposure ?? indicators.hazardExposure ?? 5;
        const vulnerability = indicators.vulnerability ?? 5;
        const lackCoping = indicators.lack_coping_capacity ?? indicators.lackCopingCapacity ?? 5;

        const dimensionValues = { hazard, vulnerability, lack_of_coping_capacity: lackCoping };
        const riskResult = calculateRiskIndex(dimensionValues);

        return {
          adminUnitId: unit.adminUnitId,
          riskIndex: riskResult.riskIndex,
          riskClass: riskResult.riskClass,
          dimensions: dimensionValues
        };
      });

      for (const result of batchResults) {
        results.push(result);
        checkRiskChanges(result.adminUnitId, result);

        // Update cache
        const unit = adminUnits.find(au => au.adminUnitId === result.adminUnitId);
        if (unit?.indicators) {
          const cacheKey = generateCacheKey(result.adminUnitId, unit.indicators);
          setCache(cacheKey, result);
        }
      }
    } catch (error) {
      errors.push({
        batch: i / batchSize,
        error: error.message
      });
    }

    // Report progress
    const progress = {
      processed: Math.min(i + batchSize, adminUnits.length),
      total: adminUnits.length,
      percentComplete: Math.round((Math.min(i + batchSize, adminUnits.length) / adminUnits.length) * 100)
    };

    emit(CALCULATION_EVENTS.BATCH_PROGRESS, progress);

    if (onProgress) {
      onProgress(progress);
    }
  }

  const duration = Date.now() - startTime;

  emit(CALCULATION_EVENTS.BATCH_COMPLETED, {
    count: results.length,
    errors: errors.length,
    duration,
    type: 'full_recalculation'
  });

  return {
    success: errors.length === 0,
    count: results.length,
    errors,
    duration,
    results
  };
}

/**
 * Calculate specific dimension for admin unit
 */
export function calculateDimensionHook(adminUnitId, dimensionId, categoryValues) {
  const result = calculateDimension(dimensionId, categoryValues);

  return {
    adminUnitId,
    dimensionId,
    value: result,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Calculate specific category for admin unit
 */
export function calculateCategoryHook(adminUnitId, categoryId, componentValues) {
  const result = calculateCategory(categoryId, componentValues);

  return {
    adminUnitId,
    categoryId,
    value: result,
    calculatedAt: new Date().toISOString()
  };
}

// ============================================================================
// WATCHERS
// ============================================================================

/**
 * Create a watcher for specific admin unit
 * @param {string} adminUnitId - Admin unit ID to watch
 * @param {Function} callback - Callback for changes
 * @returns {Object} Watcher with unwatch function
 */
export function watchAdminUnit(adminUnitId, callback) {
  const filter = (event) => event.adminUnitId === adminUnitId;

  const subscriptionId = subscribe(
    [
      CALCULATION_EVENTS.CALCULATION_COMPLETED,
      CALCULATION_EVENTS.RISK_CLASS_CHANGED,
      CALCULATION_EVENTS.THRESHOLD_EXCEEDED
    ],
    callback,
    { filter }
  );

  return {
    adminUnitId,
    subscriptionId,
    unwatch: () => unsubscribe(subscriptionId)
  };
}

/**
 * Create a watcher for high risk alerts
 */
export function watchHighRisk(callback, options = {}) {
  const { veryHighOnly = false } = options;

  const filter = veryHighOnly
    ? (event) => event.isVeryHigh === true
    : null;

  const subscriptionId = subscribe(
    CALCULATION_EVENTS.HIGH_RISK_DETECTED,
    callback,
    { filter }
  );

  return {
    subscriptionId,
    unwatch: () => unsubscribe(subscriptionId)
  };
}

/**
 * Create a watcher for all risk class changes
 */
export function watchRiskChanges(callback, options = {}) {
  const { direction = null } = options;

  const filter = direction
    ? (event) => event.direction === direction
    : null;

  const subscriptionId = subscribe(
    CALCULATION_EVENTS.RISK_CLASS_CHANGED,
    callback,
    { filter }
  );

  return {
    subscriptionId,
    unwatch: () => unsubscribe(subscriptionId)
  };
}

/**
 * Create a watcher for threshold exceedances
 */
export function watchThresholds(callback, options = {}) {
  const { severity = null, dimensions = null } = options;

  const filter = (event) => {
    if (severity && event.severity !== severity) return false;
    if (dimensions && !dimensions.includes(event.dimension)) return false;
    return true;
  };

  const subscriptionId = subscribe(
    CALCULATION_EVENTS.THRESHOLD_EXCEEDED,
    callback,
    { filter: severity || dimensions ? filter : null }
  );

  return {
    subscriptionId,
    unwatch: () => unsubscribe(subscriptionId)
  };
}

/**
 * Create a progress watcher
 */
export function watchProgress(callback) {
  const subscriptionId = subscribe(
    [
      CALCULATION_EVENTS.BATCH_STARTED,
      CALCULATION_EVENTS.BATCH_PROGRESS,
      CALCULATION_EVENTS.BATCH_COMPLETED
    ],
    callback
  );

  return {
    subscriptionId,
    unwatch: () => unsubscribe(subscriptionId)
  };
}

// ============================================================================
// REACT HOOKS HELPERS
// ============================================================================

/**
 * Create hook-friendly subscription for useEffect
 * @param {string|string[]} eventTypes - Event type(s)
 * @param {Function} callback - Callback
 * @param {Object} options - Subscription options
 * @returns {Function} Cleanup function
 */
export function createReactHook(eventTypes, callback, options = {}) {
  const subscriptionId = subscribe(eventTypes, callback, options);
  return () => unsubscribe(subscriptionId);
}

/**
 * Get current state for React components
 * @returns {Object} Current hook state for UI
 */
export function getHookState() {
  return {
    isProcessing: state.isProcessing,
    queueSize: priorityQueue.size,
    cacheSize: state.cache.size,
    activeCalculations: state.activeCalculations.size,
    metrics: getMetrics()
  };
}

/**
 * Create a state snapshot for debugging
 */
export function getDebugState() {
  return {
    queue: priorityQueue.toArray().map(r => ({
      id: r.id,
      adminUnitId: r.adminUnitId,
      priority: r.priority,
      status: r.status,
      queuedAt: r.queuedAt
    })),
    cache: {
      size: state.cache.size,
      keys: Array.from(state.cache.keys())
    },
    subscribers: Object.fromEntries(
      Array.from(state.subscribers.entries()).map(([k, v]) => [k, v.length])
    ),
    middleware: {
      before: state.middleware.before.length,
      after: state.middleware.after.length,
      error: state.middleware.error.length
    },
    dependencies: state.dependencies.size,
    previousRiskValues: state.previousRiskValues.size,
    metrics: getMetrics()
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Update hook configuration
 * @param {Object} config - Configuration updates
 */
export function updateConfig(config) {
  state.config = deepMerge(state.config, config);

  // Restart cache cleanup if interval changed
  if (config.cache?.cleanupInterval) {
    startCacheCleanup();
  }
}

/**
 * Get current configuration
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return deepClone(state.config);
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// ============================================================================
// LIFECYCLE
// ============================================================================

/**
 * Initialize calculation hooks system
 */
export function initialize() {
  startCacheCleanup();

  // Check memory usage periodically
  if (typeof process !== 'undefined' && process.memoryUsage) {
    setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > state.config.performance.memoryWarningThreshold) {
        emit(CALCULATION_EVENTS.MEMORY_WARNING, {
          heapUsed: usage.heapUsed,
          threshold: state.config.performance.memoryWarningThreshold
        });
      }
    }, 60000);
  }
}

/**
 * Reset the entire hook system state
 */
export function reset() {
  // Clear timers
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }
  if (state.cleanupInterval) {
    clearInterval(state.cleanupInterval);
  }

  // Clear priority queue
  while (!priorityQueue.isEmpty()) {
    priorityQueue.pop();
  }

  // Reset state
  state = createInitialState();

  // Restart cache cleanup
  startCacheCleanup();
}

/**
 * Shutdown calculation hooks system
 */
export function shutdown() {
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }
  if (state.cleanupInterval) {
    clearInterval(state.cleanupInterval);
  }

  // Cancel any pending calculations
  while (!priorityQueue.isEmpty()) {
    const request = priorityQueue.pop();
    emit(CALCULATION_EVENTS.CALCULATION_CANCELLED, {
      calculationId: request.id,
      reason: 'shutdown'
    });
  }

  state.subscribers.clear();
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * Cancel a specific calculation
 */
export function cancelCalculation(calculationId) {
  const removed = priorityQueue.remove(r => r.id === calculationId);

  if (removed) {
    emit(CALCULATION_EVENTS.CALCULATION_CANCELLED, {
      calculationId,
      reason: 'manual'
    });
  }

  return removed;
}

/**
 * Cancel all calculations for an admin unit
 */
export function cancelAdminUnitCalculations(adminUnitId) {
  let cancelled = 0;

  while (priorityQueue.remove(r => r.adminUnitId === adminUnitId)) {
    cancelled++;
  }

  if (cancelled > 0) {
    emit(CALCULATION_EVENTS.CALCULATION_CANCELLED, {
      adminUnitId,
      count: cancelled,
      reason: 'manual'
    });
  }

  return cancelled;
}

/**
 * Get calculation status
 */
export function getCalculationStatus(calculationId) {
  const queued = priorityQueue.heap.find(r => r.id === calculationId);
  if (queued) {
    return {
      status: 'queued',
      position: priorityQueue.heap.indexOf(queued),
      ...queued
    };
  }

  const active = state.activeCalculations.get(calculationId);
  if (active) {
    return {
      status: 'processing',
      ...active
    };
  }

  const history = state.calculationHistory.get(calculationId);
  if (history) {
    return history;
  }

  return null;
}

// Auto-initialize (disabled - call initialize() manually when needed)
// initialize();

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Constants
  CALCULATION_EVENTS,
  PRIORITY,
  HOOKS_CONFIG,

  // Subscription
  subscribe,
  unsubscribe,
  subscribeAll,

  // Middleware
  useMiddleware,
  removeMiddleware,

  // Hooks
  onIndicatorUpdated,
  onIndicatorBatchUpdated,
  onAdminUnitAdded,
  onAdminUnitUpdated,
  onAdminUnitRemoved,
  onDataImported,

  // Queue
  queueCalculation,
  cancelCalculation,
  cancelAdminUnitCalculations,
  getCalculationStatus,

  // Calculations
  recalculateAll,
  calculateDimensionHook,
  calculateCategoryHook,

  // Dependencies
  registerDependency,
  removeDependency,

  // Watchers
  watchAdminUnit,
  watchHighRisk,
  watchRiskChanges,
  watchThresholds,
  watchProgress,

  // Cache
  clearCache,

  // Metrics
  getMetrics,
  resetMetrics,

  // React helpers
  createReactHook,
  getHookState,
  getDebugState,

  // Configuration
  updateConfig,
  getConfig,

  // Lifecycle
  initialize,
  reset,
  shutdown,

  // Translation
  t
};
