/**
 * INFORM FORMULAS - Calculation Entry Point
 *
 * All risk calculation functions, aggregation methods, and classification utilities.
 * This is the primary entry point for formula-related imports.
 */

// ============================================================================
// BASIC INFORM FORMULAS (Primary implementation)
// ============================================================================

export {
  // Configuration
  FORMULA_CONFIG,
  RISK_THRESHOLDS,
  WARNING_THRESHOLDS,
  SEVERITY_THRESHOLDS,

  // Tracer for debugging calculations
  tracer,

  // Utility functions
  roundTo,
  clamp,
  approximatelyEqual,
  formatNumber,
  filterValidValues,

  // Aggregation methods
  arithmeticMean,
  geometricMean,
  maximum,
  minimum,
  weightedMean,
  median,
  standardDeviation,
  coefficientOfVariation,
  calculatePercentile,

  // Hazard indicators and calculations
  NATURAL_HAZARD_INDICATORS,
  HUMAN_HAZARD_INDICATORS,
  calculateNaturalHazard,
  calculateHumanHazard,
  calculateHazardExposure,

  // Vulnerability indicators and calculations
  SOCIO_ECONOMIC_INDICATORS,
  VULNERABLE_GROUPS_INDICATORS,
  calculateSocioEconomicVulnerability,
  calculateVulnerableGroups,
  calculateVulnerability,

  // Coping capacity indicators and calculations
  INFRASTRUCTURE_INDICATORS,
  INSTITUTIONAL_INDICATORS,
  calculateInfrastructure,
  calculateInstitutional,
  calculateLackCopingCapacity,

  // Risk index calculation
  calculateRiskIndex,
  calculateAllAggregates,
  calculateBatch,

  // Risk classification
  classifyRisk,
  getRiskColor,
  getRiskLevel,

  // Warning calculations
  calculateWarningScore,
  classifyWarning,
  warningLevelToIntensity,

  // Severity calculations
  calculateSeverityScore,
  classifySeverity,

  // Climate projections
  calculateProjectedRisk,

  // Statistical analysis
  calculateConfidenceInterval,
  monteCarloSimulation,
  sensitivityAnalysis,
  analyzeTrend,

  // Validation and verification
  verifyRiskCalculation,
  normalizeToScale,
  validateIndicatorValue,

  // Comparison utilities
  compareRisk,
  rankByRisk
} from './informFormulas.js';

// ============================================================================
// ADVANCED FORMULA ENGINE (Extended pipeline)
// ============================================================================

export {
  // Engine configuration
  ENGINE_CONFIG,

  // Cache management
  clearCache as clearFormulaCache,

  // Statistics
  calculateStatistics,
  calculateZScore,

  // Normalization methods
  normalizeMinMax,
  normalizeZScore,
  normalizePercentile,
  normalizeLog,
  normalizeValue,

  // Additional aggregation methods
  harmonicMean,
  sum,
  aggregate,

  // Processing pipeline
  processIndicator,
  processAllIndicators,

  // Component calculations
  calculateComponent,
  calculateAllComponents,

  // Category calculations
  calculateCategory,
  calculateAllCategories,

  // Dimension calculations
  calculateDimension,
  calculateAllDimensions,

  // Confidence calculation
  calculateConfidence,

  // Scenario modeling
  modelScenario,
  compareScenarios,

  // Complete risk calculation pipeline
  calculateCompleteRisk,
  calculateBatchRisk,

  // Formatting and comparison
  formatResults,
  compareAdminUnits,

  // Metadata lookups
  getIndicatorInfo,
  getComponentInfo,
  getComponentIndicators,
  getCategoryComponents
} from './formulaEngine.js';

// ============================================================================
// DEFAULT EXPORT - Combined formula modules
// ============================================================================

import informFormulas from './informFormulas.js';
import formulaEngine from './formulaEngine.js';

export default {
  ...informFormulas,
  engine: formulaEngine
};
