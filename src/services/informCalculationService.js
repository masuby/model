/**
 * INFORM CALCULATION SERVICE - BACKWARD COMPATIBILITY LAYER
 *
 * This file re-exports from the complete informCalculationEngine.js
 * which implements the full INFORM methodology with all 84 indicators.
 *
 * For new code, import directly from './informCalculationEngine'
 *
 * Formula: Risk = (Hazard × Vulnerability × Lack of Coping Capacity)^(1/3)
 */

// Re-export everything from the complete engine for backward compatibility
export {
  calculateINFORMRisk,
  classifyRisk,
  getRiskColor,
  validateIndicatorValues,
  roundTo,
  clamp,
  aggregate,
  geometricMean,
  calculateDimension as calculateDimensionScore,
  calculateCategory as calculateCategoryScore,
  RISK_CLASSES as RISK_CLASSIFICATION
} from './informCalculationEngine';

// Re-export indicator and structure definitions
export {
  ALL_INDICATORS as INDICATOR_DEFINITIONS,
  COMPLETE_HIERARCHY as DIMENSION_STRUCTURE,
  ALL_COMPONENTS
} from './informIndicatorDefinitions';

// ============================================================================
// LEGACY FUNCTIONS - For backward compatibility with existing code
// ============================================================================

/**
 * Arithmetic mean of values
 */
export function arithmeticMean(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Max value aggregation (for hazards)
 */
export function maxValue(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return Math.max(...valid);
}

/**
 * Format calculation result for display
 */
export function formatCalculationResult(result) {
  if (!result) return null;

  return {
    summary: {
      riskScore: result.risk,
      riskClass: result.classification?.label,
      riskColor: result.classification?.color,
      hazardScore: result.dimensions?.HAZARD?.score,
      vulnerabilityScore: result.dimensions?.VULNERABILITY?.score,
      lackOfCopingScore: result.dimensions?.COPING_CAPACITY?.score
    },
    dimensions: result.dimensions,
    formula: result.formula,
    metadata: result.metadata
  };
}

// ============================================================================
// APPROVED DATA MANAGEMENT - localStorage functions for fallback
// ============================================================================

const APPROVED_DATA_KEY = 'inform_approved_risk_data';

/**
 * Store approved risk data for a region/district
 */
export function storeApprovedRiskData(submission, calculatedResult, approver) {
  const existing = getApprovedRiskData();

  const approvedEntry = {
    id: submission.id,
    committeeId: submission.committeeId,
    committeeName: submission.committeeName,
    adm1Code: submission.adm1Code,
    adm1Name: submission.adm1Name,
    adm2Code: submission.adm2Code,
    adm2Name: submission.adm2Name,
    indicators: submission.indicators,
    calculated: {
      hazardScore: calculatedResult.dimensions?.HAZARD?.score,
      vulnerabilityScore: calculatedResult.dimensions?.VULNERABILITY?.score,
      lackOfCopingScore: calculatedResult.dimensions?.COPING_CAPACITY?.score,
      riskScore: calculatedResult.risk,
      riskClass: calculatedResult.classification?.label,
      riskColor: calculatedResult.classification?.color,
      dimensions: calculatedResult.dimensions
    },
    submittedBy: submission.submittedBy,
    submittedAt: submission.submittedAt,
    approvedBy: approver?.name || approver?.email,
    approvedAt: new Date().toISOString(),
    methodology: 'INFORM 2024',
    status: 'approved'
  };

  const filtered = existing.filter(d =>
    !(d.adm1Code === submission.adm1Code && d.adm2Code === submission.adm2Code)
  );

  filtered.push(approvedEntry);
  localStorage.setItem(APPROVED_DATA_KEY, JSON.stringify(filtered));

  return approvedEntry;
}

/**
 * Get all approved risk data
 */
export function getApprovedRiskData() {
  try {
    return JSON.parse(localStorage.getItem(APPROVED_DATA_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Get approved data for a specific region
 */
export function getApprovedDataForRegion(adm1Name, adm2Name = null) {
  const all = getApprovedRiskData();
  return all.filter(d =>
    d.adm1Name === adm1Name &&
    (adm2Name === null || d.adm2Name === adm2Name)
  );
}

/**
 * Convert approved data to Module02InformRisk format
 */
export function convertToRiskModuleFormat(approvedData) {
  return approvedData.map(d => ({
    admin: {
      country: 'United Republic of Tanzania',
      adm1Name: d.adm1Name,
      adm2Name: d.adm2Name || d.adm1Name,
      iso3: 'TZA',
      adm1Code: d.adm1Code,
      adm2Code: d.adm2Code
    },
    hazardExposure: {
      total: d.calculated?.hazardScore,
      natural: d.calculated?.dimensions?.HAZARD?.categories?.NATURAL?.score,
      human: d.calculated?.dimensions?.HAZARD?.categories?.HUMAN?.score
    },
    vulnerability: {
      total: d.calculated?.vulnerabilityScore,
      socioEconomic: d.calculated?.dimensions?.VULNERABILITY?.categories?.SOCIO_ECONOMIC?.score,
      vulnerableGroups: d.calculated?.dimensions?.VULNERABILITY?.categories?.VULNERABLE_GROUPS?.score
    },
    lackCopingCapacity: {
      total: d.calculated?.lackOfCopingScore,
      institutional: d.calculated?.dimensions?.COPING_CAPACITY?.categories?.INSTITUTIONAL?.score,
      infrastructure: d.calculated?.dimensions?.COPING_CAPACITY?.categories?.INFRASTRUCTURE?.score
    },
    risk: d.calculated?.riskScore,
    classification: d.calculated?.riskClass,
    _committeeSource: {
      committeeName: d.committeeName,
      submittedAt: d.submittedAt,
      approvedAt: d.approvedAt,
      approvedBy: d.approvedBy,
      methodology: d.methodology
    }
  }));
}

// Default export for compatibility
export default {
  calculateINFORMRisk: async (...args) => {
    const { calculateINFORMRisk } = await import('./informCalculationEngine');
    return calculateINFORMRisk(...args);
  },
  classifyRisk: async (...args) => {
    const { classifyRisk } = await import('./informCalculationEngine');
    return classifyRisk(...args);
  },
  storeApprovedRiskData,
  getApprovedRiskData,
  getApprovedDataForRegion,
  convertToRiskModuleFormat,
  formatCalculationResult,
  arithmeticMean,
  maxValue
};
