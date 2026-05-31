/**
 * DATA IMPORT - CSV/Excel Import Entry Point
 *
 * Data import, parsing, and validation for INFORM data files.
 * This is the primary entry point for import-related operations.
 */

// ============================================================================
// DATA IMPORTER
// ============================================================================

export {
  // Configuration
  IMPORT_CONFIG,

  // Error classes
  ImportError,
  ParseError,
  ValidationError,

  // Session management
  createImportSession,
  getImportSession,

  // Parsing utilities
  detectDelimiter,
  parseCSVLine,
  parseCSV,
  parseValue,

  // Validation
  validateIndicatorValue,
  validateRow,

  // Column mapping
  autoDetectColumnMapping,
  getImportTemplate,

  // Duplicate detection
  detectDuplicates,

  // INFORM-specific imports
  importINFORMCSV,
  importIndicatorCSV,
  importMetadataCSV,
  importAllSheets,

  // Preview
  previewImport,

  // Imported data access
  getImportedAdminUnits,
  getAdminUnit,
  getImportedRegions,
  getDistrictsByRegion,
  getImportedRiskData,
  getAllImportedRiskData,
  getImportedIndicators,
  getIndicatorMetadata,
  getAllIndicatorMetadata,

  // History and statistics
  getImportHistory,
  getImportStats,

  // Cleanup
  clearImportedData,

  // Recalculation
  recalculateFromImportedData
} from './dataImporter.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import dataImporter from './dataImporter.js';

export default dataImporter;
