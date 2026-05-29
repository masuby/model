/**
 * DATABASE SCHEMAS - Schema Definitions Entry Point
 *
 * All database schema definitions, validators, and type definitions.
 * This is the primary entry point for schema-related imports.
 */

// ============================================================================
// BASIC SCHEMA
// ============================================================================

export {
  // Configuration
  DB_CONFIG,
  DB_VERSION,
  DB_NAME,

  // Type definitions
  FIELD_TYPES,
  VALIDATORS,
  ENUMS,

  // Entity schemas
  ADMIN_UNIT_SCHEMA,
  RISK_INDICATOR_SCHEMA,
  WARNING_SCHEMA,
  BULLETIN_SCHEMA,
  USER_SCHEMA,
  AUDIT_LOG_SCHEMA,
  SMS_LOG_SCHEMA,
  SEVERITY_EVENT_SCHEMA,
  CLIMATE_PROJECTION_SCHEMA,
  POPULATION_SCHEMA,
  INFRASTRUCTURE_SCHEMA,

  // All schemas collection
  ALL_SCHEMAS,

  // Utility functions
  getTableNames,
  getSchema,
  validateRecord,
  applyDefaults,
  getIndexes,
  getRelations
} from './schema.js';

// ============================================================================
// ADVANCED SCHEMA (INFORM-specific)
// ============================================================================

export {
  // Configuration
  ADVANCED_SCHEMA_CONFIG,

  // Type definitions
  DIMENSION_TYPES,
  CATEGORY_TYPES,
  POLARITY,
  AGGREGATION_METHODS,
  RESOLUTION_LEVELS,
  DATA_COLLECTION_PRIORITY,

  // Validation and normalization
  validateIndicatorValue as validateAdvancedIndicator,
  normalizeValue as normalizeAdvancedValue,
  getRiskClass,

  // INFORM definitions
  INDICATOR_DEFINITIONS,
  COMPONENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
  DIMENSION_DEFINITIONS,
  INFORM_FORMULA,

  // API and data source definitions
  API_INTEGRATIONS,
  TANZANIA_DATA_SOURCES,

  // Query functions
  getComponentIndicators,
  getCategoryComponents,
  getDimensionCategories,
  getIndicatorHierarchy,
  getIndicatorsByPriority,
  getAPIIndicators,

  // Quality calculation
  calculateDataQuality,

  // Statistics
  getSchemaStats
} from './advancedSchema.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import schema from './schema.js';
import advancedSchema from './advancedSchema.js';

export default {
  basic: schema,
  advanced: advancedSchema
};
