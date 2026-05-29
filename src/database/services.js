/**
 * DATABASE SERVICES - CRUD Operations Entry Point
 *
 * All database CRUD operations, entity services, and query utilities.
 * This is the primary entry point for data access.
 */

// ============================================================================
// CORE DATABASE SERVICE
// ============================================================================

export {
  // Configuration
  DB_CONFIG,

  // Error classes
  DatabaseError,
  ValidationError,
  NotFoundError,
  TransactionError,
  ConstraintError,

  // Event system
  dbEvents,
  DB_EVENTS,

  // Query builder
  QueryBuilder,
  query,

  // Initialization
  initializeDatabase,

  // Validation
  validateRecord,

  // CRUD operations
  create,
  read,
  readById,
  update,
  remove,
  count,
  exists,

  // Bulk operations
  bulkCreate,
  bulkUpdate,
  upsert,
  clearTable,

  // Transaction support
  Transaction,

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

  // Database utilities
  exportDatabase,
  importDatabase,
  resetDatabase,
  getDatabaseStats,

  // Cache management
  getCacheStats,
  clearCache,

  // Index management
  getIndexStats,
  rebuildIndexes,

  // Performance monitoring
  getQueryMetrics,
  getSlowQueries,
  clearMetrics,

  // Health check
  healthCheck
} from './databaseService.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import databaseService from './databaseService.js';

export default databaseService;
