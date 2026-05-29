/**
 * INFORM TANZANIA DATABASE
 *
 * Main entry point for the database module.
 * Re-exports from organized sub-modules for clean imports.
 *
 * Module Structure:
 * - schemas: Schema definitions and validators
 * - formulas: Calculation and aggregation functions
 * - services: CRUD operations and entity services
 * - init: Database initialization and migrations
 * - admin: Tanzania administrative data
 * - workflow: Data submission and approval
 * - api: External API integrations
 * - sync: Data synchronization
 * - import: CSV/Excel data import
 * - backup: Data export and backup
 * - reports: Analytics and reporting
 * - hooks: Real-time calculation events
 *
 * Usage:
 *   // Import specific functions from focused modules
 *   import { calculateRiskIndex } from '../database/formulas.js';
 *   import { AdminUnits, Warnings } from '../database/services.js';
 *   import { initAndSeedDatabase } from '../database/init.js';
 *
 *   // Or import from main index for convenience
 *   import { AdminUnits, calculateRiskIndex } from '../database/index.js';
 */

// ============================================================================
// SCHEMAS
// ============================================================================
export * from './schemas.js';

// ============================================================================
// FORMULAS
// ============================================================================
export * from './formulas.js';

// ============================================================================
// DATABASE SERVICES
// ============================================================================
export * from './services.js';

// ============================================================================
// INITIALIZATION
// ============================================================================
export * from './init.js';

// ============================================================================
// ADMINISTRATIVE DATA
// ============================================================================
export * from './admin.js';

// ============================================================================
// WORKFLOW
// ============================================================================
export * from './workflow.js';

// ============================================================================
// API INTEGRATIONS
// ============================================================================
export * from './api.js';

// ============================================================================
// SYNCHRONIZATION
// ============================================================================
export * from './sync.js';

// ============================================================================
// DATA IMPORT
// ============================================================================
export * from './import.js';

// ============================================================================
// EXPORT & BACKUP
// ============================================================================
export * from './backup.js';

// ============================================================================
// REPORTING
// ============================================================================
export * from './reports.js';

// ============================================================================
// CALCULATION HOOKS
// ============================================================================
export * from './hooks.js';

// ============================================================================
// DEFAULT EXPORT - All modules combined
// ============================================================================

import schemas from './schemas.js';
import formulas from './formulas.js';
import services from './services.js';
import init from './init.js';
import admin from './admin.js';
import workflow from './workflow.js';
import api from './api.js';
import sync from './sync.js';
import dataImport from './import.js';
import backup from './backup.js';
import reports from './reports.js';
import hooks from './hooks.js';

export default {
  schemas,
  formulas,
  services,
  init,
  admin,
  workflow,
  api,
  sync,
  import: dataImport,
  backup,
  reports,
  hooks
};
