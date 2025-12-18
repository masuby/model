/**
 * ADMINISTRATIVE DATA - Tanzania Regions and Districts Entry Point
 *
 * All Tanzania administrative unit data, zones, regions, and districts.
 * This is the primary entry point for administrative data imports.
 */

// ============================================================================
// TANZANIA DISTRICTS DATA (Complete database)
// ============================================================================

export {
  // Zone definitions
  TANZANIA_ZONES,

  // Complete region data
  TANZANIA_REGIONS_COMPLETE,

  // Complete district data
  TANZANIA_DISTRICTS_COMPLETE,

  // Query functions
  getAllRegions,
  getRegionByCode,
  getAllDistricts,
  getDistrictByCode,
  getDistrictsByRegionCode,
  getRegionsByZone,

  // Statistics
  getTotalPopulation,
  getTanzaniaStats
} from './tanzaniaDistrictsData.js';

// ============================================================================
// SEED DATA (Initial data for database)
// ============================================================================

export {
  TANZANIA_REGIONS,
  TANZANIA_DISTRICTS,
  TANZANIA_NATIONAL_RISK,
  DISTRICT_RISK_SAMPLES,
  DEFAULT_USERS,
  INFRASTRUCTURE_SAMPLES
} from './seedData.js';

// ============================================================================
// DATA COLLECTION FRAMEWORK
// ============================================================================

export {
  // Configuration
  FRAMEWORK_CONFIG,
  TANZANIA_STATS,

  // Validation rules
  VALIDATION_RULES,
  CROSS_VALIDATION_RULES,
  TEMPORAL_VALIDATION_RULES,

  // Templates
  DATA_COLLECTION_TEMPLATES,

  // Validation functions
  validateIndicatorValue,
  validateDataSubmission,
  validateTemporalChanges,

  // Quality metrics
  calculateDataQuality,
  calculateDataCompleteness,
  calculateDataFreshness,
  calculateDataAccuracy,
  calculateDataConsistency,
  calculateDataReliability,

  // Scheduling
  generateCollectionSchedule,

  // Data parsing
  parseCSV,
  csvRowToIndicatorData,

  // Export functions
  exportToCSV,
  exportToJSON,

  // Reporting
  generateCollectionReport,

  // Utilities
  getRegion,
  getRegionsByZone as getCollectionRegionsByZone,
  getLocalizedTemplate,
  calculateCollectionPriority
} from './dataCollectionFramework.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import tanzaniaDistricts from './tanzaniaDistrictsData.js';
import seedData from './seedData.js';
import dataCollection from './dataCollectionFramework.js';

export default {
  districts: tanzaniaDistricts,
  seed: seedData,
  collection: dataCollection
};
