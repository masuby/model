/**
 * REPORTING ENGINE - Analytics and Reports Entry Point
 *
 * Report generation, analytics, and data visualization utilities.
 * This is the primary entry point for reporting operations.
 */

// ============================================================================
// REPORTING ENGINE
// ============================================================================

export {
  // Configuration
  REPORTING_CONFIG,
  TRANSLATIONS,
  REPORT_TYPES,

  // Statistical analysis
  calculateStatistics,
  calculateCorrelation,
  detectOutliers,

  // Chart data generation
  generateDistributionChartData,
  generateDimensionRadarData,
  generateTrendChartData,
  generateHeatmapData,

  // Report generation
  generateRiskOverviewReport,
  generateRegionalProfileReport,
  generateTrendAnalysisReport,
  generateComparativeReport,
  generateDataQualityReport,
  generateExecutiveSummary,

  // Report management
  getReport,
  getReports,
  deleteReport,

  // Export functions
  exportReportToJSON,
  exportReportToCSV,
  exportReportForPDF
} from './reportingEngine.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import reportingEngine from './reportingEngine.js';

export default reportingEngine;
