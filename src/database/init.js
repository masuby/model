/**
 * DATABASE INITIALIZATION - Setup and Migration Entry Point
 *
 * Database initialization, seeding, and migration management.
 * This is the primary entry point for initialization operations.
 */

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

export {
  // Configuration
  INIT_CONFIG,

  // Error classes
  InitializationError,
  MigrationError,
  ValidationError,
  RollbackError,

  // Translation
  t,

  // Migration management
  registerMigration,
  getPendingMigrations,

  // Checkpoint management
  createCheckpoint,
  getCheckpoints,
  deleteCheckpoint,

  // Status checks
  isDatabaseReady,
  getDatabaseHealth,
  getMigrationStatus,
  getInitState,

  // Subscription
  subscribe,

  // Main initialization function
  initAndSeedDatabase
} from './initDatabase.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import initDatabase from './initDatabase.js';

export default initDatabase;
