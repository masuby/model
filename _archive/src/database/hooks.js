/**
 * CALCULATION HOOKS - Real-time Event System Entry Point
 *
 * Event-driven calculation system for reactive updates.
 * This is the primary entry point for hook-related operations.
 */

// ============================================================================
// CALCULATION HOOKS
// ============================================================================

export {
  // Configuration
  HOOKS_CONFIG,
  PRIORITY,
  CALCULATION_EVENTS,

  // Error classes
  CalculationHookError,
  QueueOverflowError,
  DependencyCycleError,
  CalculationTimeoutError,

  // Translation
  t,

  // Subscription management
  subscribe,
  unsubscribe,
  subscribeAll,

  // Middleware
  useMiddleware,
  removeMiddleware,

  // Dependencies
  registerDependency,
  removeDependency,

  // Calculation queue
  queueCalculation,

  // Event handlers
  onIndicatorUpdated,
  onIndicatorBatchUpdated,
  onAdminUnitAdded,
  onAdminUnitUpdated,
  onAdminUnitRemoved,
  onDataImported,

  // Cache management
  clearCache,

  // Metrics
  getMetrics,
  resetMetrics,

  // Calculation helpers
  calculateDimensionHook,
  calculateCategoryHook,

  // Watchers
  watchAdminUnit,
  watchHighRisk,
  watchRiskChanges,
  watchThresholds,
  watchProgress,

  // React integration
  createReactHook,

  // State inspection
  getHookState,
  getDebugState,

  // Configuration management
  updateConfig,
  getConfig,

  // Lifecycle
  initialize,
  reset,
  shutdown,

  // Calculation control
  cancelCalculation,
  cancelAdminUnitCalculations,
  getCalculationStatus
} from './calculationHooks.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import calculationHooks from './calculationHooks.js';

export default calculationHooks;
