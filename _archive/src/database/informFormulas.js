/**
 * INFORM RISK FORMULA CALCULATOR - ENHANCED VERSION
 *
 * Implements the complete INFORM methodology for Tanzania
 * Based on: INFORM Risk Index Methodology v2024
 *
 * CORE FORMULA:
 * Risk = (Hazard and Exposure)^(1/3) x (Vulnerability)^(1/3) x (Lack of Coping Capacity)^(1/3)
 *
 * This is equivalent to the geometric mean of the three dimensions:
 * Risk = ∛(H×E × V × LCC)
 *
 * ENHANCED FEATURES:
 * - Precision calculation with configurable decimal places
 * - Uncertainty quantification with confidence intervals
 * - Calculation tracing for debugging and audit
 * - Statistical analysis functions
 * - Trend analysis over time series
 * - Scenario modeling and projections
 * - Sensitivity analysis
 * - Monte Carlo simulation support
 * - Batch calculation optimization
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FORMULA_CONFIG = {
  // Precision settings
  precision: {
    default: 2,
    calculation: 6,
    display: 2,
    intermediate: 4
  },

  // Value bounds
  bounds: {
    min: 0,
    max: 10,
    epsilon: 0.0001 // For floating point comparisons
  },

  // Uncertainty settings
  uncertainty: {
    defaultConfidence: 0.95,
    defaultErrorMargin: 0.1,
    minSamples: 100,
    maxSamples: 10000
  },

  // Tracing
  tracing: {
    enabled: false,
    maxTraceLength: 100,
    includeTimestamps: true
  },

  // Monte Carlo
  monteCarlo: {
    defaultIterations: 1000,
    maxIterations: 100000,
    seed: null // null for random
  }
};

// ============================================================================
// RISK CLASSIFICATION THRESHOLDS (INFORM Standard)
// ============================================================================

export const RISK_THRESHOLDS = {
  VERY_LOW: { min: 0, max: 2.0, label: 'Very Low', color: '#2E7D32', labelSwahili: 'Hatari Ndogo Sana' },
  LOW: { min: 2.0, max: 3.5, label: 'Low', color: '#8BC34A', labelSwahili: 'Hatari Ndogo' },
  MEDIUM: { min: 3.5, max: 5.0, label: 'Medium', color: '#FFC107', labelSwahili: 'Hatari ya Wastani' },
  HIGH: { min: 5.0, max: 6.5, label: 'High', color: '#FF9800', labelSwahili: 'Hatari Kubwa' },
  VERY_HIGH: { min: 6.5, max: 10.0, label: 'Very High', color: '#D32F2F', labelSwahili: 'Hatari Kubwa Sana' }
};

// ============================================================================
// WARNING LEVEL THRESHOLDS
// ============================================================================

export const WARNING_THRESHOLDS = {
  MONITOR: { min: 0, max: 2.5, label: 'Monitor', color: '#4CAF50', icon: '🟢', labelSwahili: 'Fuatilia' },
  ADVISORY: { min: 2.5, max: 5.0, label: 'Advisory', color: '#FFC107', icon: '🟡', labelSwahili: 'Ushauri' },
  WARNING: { min: 5.0, max: 7.5, label: 'Warning', color: '#FF9800', icon: '🟠', labelSwahili: 'Onyo' },
  MAJOR_WARNING: { min: 7.5, max: 10.0, label: 'Major Warning', color: '#F44336', icon: '🔴', labelSwahili: 'Onyo Kuu' }
};

// ============================================================================
// SEVERITY THRESHOLDS
// ============================================================================

export const SEVERITY_THRESHOLDS = {
  MINOR: { min: 0, max: 3, label: 'Minor', color: '#4CAF50', labelSwahili: 'Kidogo' },
  MODERATE: { min: 3, max: 5, label: 'Moderate', color: '#FFC107', labelSwahili: 'Wastani' },
  SEVERE: { min: 5, max: 7, label: 'Severe', color: '#FF9800', labelSwahili: 'Kali' },
  CRITICAL: { min: 7, max: 9, label: 'Critical', color: '#F44336', labelSwahili: 'Mbaya Sana' },
  CATASTROPHIC: { min: 9, max: 10, label: 'Catastrophic', color: '#9C27B0', labelSwahili: 'Majanga' }
};

// ============================================================================
// CALCULATION TRACER
// ============================================================================

class CalculationTracer {
  constructor(enabled = FORMULA_CONFIG.tracing.enabled) {
    this.enabled = enabled;
    this.traces = [];
    this.currentContext = null;
  }

  startContext(name, inputs) {
    if (!this.enabled) return;
    this.currentContext = {
      name,
      inputs: { ...inputs },
      steps: [],
      startTime: Date.now(),
      endTime: null,
      result: null
    };
  }

  addStep(operation, values, result) {
    if (!this.enabled || !this.currentContext) return;
    this.currentContext.steps.push({
      operation,
      values: Array.isArray(values) ? [...values] : values,
      result,
      timestamp: FORMULA_CONFIG.tracing.includeTimestamps ? Date.now() : undefined
    });
  }

  endContext(result) {
    if (!this.enabled || !this.currentContext) return;
    this.currentContext.endTime = Date.now();
    this.currentContext.result = result;
    this.currentContext.duration = this.currentContext.endTime - this.currentContext.startTime;

    this.traces.push({ ...this.currentContext });

    // Limit trace history
    if (this.traces.length > FORMULA_CONFIG.tracing.maxTraceLength) {
      this.traces.shift();
    }

    const trace = this.currentContext;
    this.currentContext = null;
    return trace;
  }

  getTraces() {
    return [...this.traces];
  }

  clear() {
    this.traces = [];
    this.currentContext = null;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Global tracer instance
export const tracer = new CalculationTracer();

// ============================================================================
// PRECISION UTILITIES
// ============================================================================

/**
 * Round to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Rounded value
 */
export function roundTo(value, decimals = FORMULA_CONFIG.precision.default) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamp value to bounds
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} - Clamped value
 */
export function clamp(value, min = FORMULA_CONFIG.bounds.min, max = FORMULA_CONFIG.bounds.max) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

/**
 * Check if two numbers are approximately equal
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {number} epsilon - Tolerance
 * @returns {boolean}
 */
export function approximatelyEqual(a, b, epsilon = FORMULA_CONFIG.bounds.epsilon) {
  if (a === null || b === null) return a === b;
  return Math.abs(a - b) < epsilon;
}

/**
 * Format number for display
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string}
 */
export function formatNumber(value, decimals = FORMULA_CONFIG.precision.display) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

// ============================================================================
// AGGREGATION METHODS
// ============================================================================

/**
 * Filter valid numeric values
 * @param {number[]} values - Array of values
 * @returns {number[]} - Valid numeric values
 */
export function filterValidValues(values) {
  return values.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
}

/**
 * Calculate Arithmetic Mean
 * Used for: Vulnerability, Lack of Coping Capacity
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {number|null} - Mean value or null if no valid values
 */
export function arithmeticMean(values, options = {}) {
  const { trace = false, precision = FORMULA_CONFIG.precision.intermediate } = options;

  const validValues = filterValidValues(values);
  if (validValues.length === 0) return null;

  if (trace) tracer.addStep('arithmeticMean', validValues, null);

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  const result = roundTo(sum / validValues.length, precision);

  if (trace) tracer.addStep('result', { sum, count: validValues.length }, result);

  return result;
}

/**
 * Calculate Geometric Mean
 * Used for: Final Risk Index calculation
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {number|null} - Geometric mean or null if no valid values
 */
export function geometricMean(values, options = {}) {
  const { trace = false, precision = FORMULA_CONFIG.precision.intermediate, handleZero = true } = options;

  let validValues = filterValidValues(values);
  if (validValues.length === 0) return null;

  // Handle zero values (can't use log of zero)
  if (handleZero) {
    validValues = validValues.map(v => v <= 0 ? FORMULA_CONFIG.bounds.epsilon : v);
  } else {
    validValues = validValues.filter(v => v > 0);
    if (validValues.length === 0) return null;
  }

  if (trace) tracer.addStep('geometricMean', validValues, null);

  // Use log method for numerical stability
  const logSum = validValues.reduce((acc, val) => acc + Math.log(val), 0);
  const result = roundTo(Math.exp(logSum / validValues.length), precision);

  if (trace) tracer.addStep('result', { logSum, count: validValues.length }, result);

  return clamp(result);
}

/**
 * Calculate Maximum
 * Used for: Hazard and Exposure (max of Natural and Human)
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {number|null} - Maximum value or null if no valid values
 */
export function maximum(values, options = {}) {
  const { trace = false, precision = FORMULA_CONFIG.precision.intermediate } = options;

  const validValues = filterValidValues(values);
  if (validValues.length === 0) return null;

  if (trace) tracer.addStep('maximum', validValues, null);

  const result = roundTo(Math.max(...validValues), precision);

  if (trace) tracer.addStep('result', validValues, result);

  return result;
}

/**
 * Calculate Minimum
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function minimum(values, options = {}) {
  const { precision = FORMULA_CONFIG.precision.intermediate } = options;
  const validValues = filterValidValues(values);
  if (validValues.length === 0) return null;
  return roundTo(Math.min(...validValues), precision);
}

/**
 * Calculate Weighted Mean
 * @param {Array<{value: number, weight: number}>} weightedValues
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function weightedMean(weightedValues, options = {}) {
  const { trace = false, precision = FORMULA_CONFIG.precision.intermediate, normalizeWeights = true } = options;

  const valid = weightedValues.filter(wv =>
    wv.value !== null && wv.value !== undefined && !isNaN(wv.value) &&
    wv.weight !== null && wv.weight !== undefined && !isNaN(wv.weight) && wv.weight > 0
  );

  if (valid.length === 0) return null;

  if (trace) tracer.addStep('weightedMean', valid, null);

  const totalWeight = valid.reduce((sum, wv) => sum + wv.weight, 0);
  const weightedSum = valid.reduce((sum, wv) => sum + (wv.value * wv.weight), 0);
  const result = roundTo(weightedSum / totalWeight, precision);

  if (trace) tracer.addStep('result', { weightedSum, totalWeight }, result);

  return result;
}

/**
 * Calculate Median
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function median(values, options = {}) {
  const { precision = FORMULA_CONFIG.precision.intermediate } = options;
  const validValues = filterValidValues(values).sort((a, b) => a - b);
  if (validValues.length === 0) return null;

  const mid = Math.floor(validValues.length / 2);
  const result = validValues.length % 2 === 0
    ? (validValues[mid - 1] + validValues[mid]) / 2
    : validValues[mid];

  return roundTo(result, precision);
}

/**
 * Calculate Standard Deviation
 * @param {number[]} values - Array of numeric values
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function standardDeviation(values, options = {}) {
  const { precision = FORMULA_CONFIG.precision.intermediate, population = false } = options;
  const validValues = filterValidValues(values);
  if (validValues.length < 2) return population ? 0 : null;

  const mean = arithmeticMean(validValues);
  const squaredDiffs = validValues.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (population ? validValues.length : validValues.length - 1);

  return roundTo(Math.sqrt(variance), precision);
}

/**
 * Calculate Coefficient of Variation
 * @param {number[]} values - Array of numeric values
 * @returns {number|null}
 */
export function coefficientOfVariation(values) {
  const mean = arithmeticMean(values);
  const stdDev = standardDeviation(values);
  if (mean === null || stdDev === null || mean === 0) return null;
  return roundTo((stdDev / mean) * 100, 2);
}

/**
 * Calculate Percentile
 * @param {number[]} values - Array of numeric values
 * @param {number} percentile - Percentile (0-100)
 * @returns {number|null}
 */
export function calculatePercentile(values, percentile) {
  const validValues = filterValidValues(values).sort((a, b) => a - b);
  if (validValues.length === 0) return null;

  const index = (percentile / 100) * (validValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return validValues[lower];

  const fraction = index - lower;
  return roundTo(validValues[lower] * (1 - fraction) + validValues[upper] * fraction, 4);
}

// ============================================================================
// NATURAL HAZARD INDICATORS
// ============================================================================

export const NATURAL_HAZARD_INDICATORS = [
  'coastal_hazards',
  'drought',
  'earthquake',
  'environmental_degradation',
  'flood',
  'heatwave',
  'landslide',
  'lightning',
  'storms_cyclone',
  'volcano',
  'wildfire',
  'zoonoses'
];

// ============================================================================
// HUMAN HAZARD INDICATORS
// ============================================================================

export const HUMAN_HAZARD_INDICATORS = [
  'conflict_intensity',
  'conflict_risk',
  'hazardous_material',
  'internal_violence',
  'vehicle_accidents'
];

// ============================================================================
// HAZARD AND EXPOSURE CALCULATIONS
// ============================================================================

/**
 * Calculate Natural Hazard Aggregate
 * Method: Arithmetic Mean of all natural hazard components (per Excel template =AVERAGE(G4:R4))
 * @param {Object} indicators - Natural hazard indicators
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateNaturalHazard(indicators, options = {}) {
  const { trace = false, includeBreakdown = false } = options;

  if (trace) tracer.startContext('calculateNaturalHazard', indicators);

  const values = NATURAL_HAZARD_INDICATORS.map(key => indicators[key]);
  const result = arithmeticMean(values, { trace }); // Changed from maximum to arithmeticMean per Excel

  if (trace) tracer.endContext(result);

  if (includeBreakdown) {
    const breakdown = {};
    NATURAL_HAZARD_INDICATORS.forEach((key, i) => {
      breakdown[key] = values[i];
    });
    return { value: result, breakdown };
  }

  return result;
}

/**
 * Calculate Human Hazard Aggregate
 * Method: Arithmetic Mean of all human hazard components (per Excel template =AVERAGE(T4:X4))
 * @param {Object} indicators - Human hazard indicators
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateHumanHazard(indicators, options = {}) {
  const { trace = false, includeBreakdown = false } = options;

  if (trace) tracer.startContext('calculateHumanHazard', indicators);

  const values = HUMAN_HAZARD_INDICATORS.map(key => indicators[key]);
  const result = arithmeticMean(values, { trace }); // Changed from maximum to arithmeticMean per Excel

  if (trace) tracer.endContext(result);

  if (includeBreakdown) {
    const breakdown = {};
    HUMAN_HAZARD_INDICATORS.forEach((key, i) => {
      breakdown[key] = values[i];
    });
    return { value: result, breakdown };
  }

  return result;
}

/**
 * Find the indicator with maximum value
 * @param {Object} indicators - Indicator values
 * @param {string[]} keys - Indicator keys to check
 * @returns {string|null}
 */
function findMaxIndicator(indicators, keys) {
  let maxKey = null;
  let maxValue = -Infinity;

  for (const key of keys) {
    const value = indicators[key];
    if (value !== null && value !== undefined && !isNaN(value) && value > maxValue) {
      maxValue = value;
      maxKey = key;
    }
  }

  return maxKey;
}

/**
 * Calculate Hazard and Exposure Total (Dimension Score)
 * Method: Scaled Geometric Mean of Natural and Human categories
 * Excel formula: =(10-GEOMEAN(((10-S4)/10*9+1),((10-Y4)/10*9+1)))/9*10
 * @param {number} naturalHazard - Natural hazard category score
 * @param {number} humanHazard - Human hazard category score
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateHazardExposure(naturalHazard, humanHazard, options = {}) {
  const { trace = false, includeComponents = false } = options;

  if (trace) tracer.startContext('calculateHazardExposure', { naturalHazard, humanHazard });

  // Scaled Geometric Mean formula (per Excel template)
  // =(10-GEOMEAN(((10-val1)/10*9+1),((10-val2)/10*9+1)))/9*10
  let result = null;
  if (naturalHazard !== null && humanHazard !== null &&
      !isNaN(naturalHazard) && !isNaN(humanHazard)) {
    const adj1 = ((10 - naturalHazard) / 10 * 9) + 1;
    const adj2 = ((10 - humanHazard) / 10 * 9) + 1;
    const geomean = Math.sqrt(adj1 * adj2);
    result = roundTo((10 - geomean) / 9 * 10, FORMULA_CONFIG.precision.default);
  }

  if (trace) tracer.endContext(result);

  if (includeComponents) {
    return {
      value: result,
      naturalHazard,
      humanHazard,
      formula: `=(10-GEOMEAN(((10-${naturalHazard})/10*9+1),((10-${humanHazard})/10*9+1)))/9*10`
    };
  }

  return result;
}

// ============================================================================
// VULNERABILITY CALCULATIONS
// ============================================================================

export const SOCIO_ECONOMIC_INDICATORS = [
  'development_poverty',
  'economic_dependency',
  'habitat',
  'livelihoods'
];

export const VULNERABLE_GROUPS_INDICATORS = [
  'displaced_people',
  'health_conditions',
  'children_health_nutrition',
  'economic_vulnerability'
];

/**
 * Calculate Socio-Economic Vulnerability
 * Method: Arithmetic mean of socio-economic indicators
 * @param {Object} indicators
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateSocioEconomicVulnerability(indicators, options = {}) {
  const { trace = false, includeBreakdown = false } = options;

  if (trace) tracer.startContext('calculateSocioEconomicVulnerability', indicators);

  const values = SOCIO_ECONOMIC_INDICATORS.map(key => indicators[key]);
  const result = arithmeticMean(values, { trace });

  if (trace) tracer.endContext(result);

  if (includeBreakdown) {
    const breakdown = {};
    SOCIO_ECONOMIC_INDICATORS.forEach((key, i) => {
      breakdown[key] = values[i];
    });
    return { value: result, breakdown };
  }

  return result;
}

/**
 * Calculate Vulnerable Groups
 * Method: Arithmetic mean of vulnerable groups indicators
 * @param {Object} indicators
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateVulnerableGroups(indicators, options = {}) {
  const { trace = false, includeBreakdown = false } = options;

  if (trace) tracer.startContext('calculateVulnerableGroups', indicators);

  const values = VULNERABLE_GROUPS_INDICATORS.map(key => indicators[key]);
  const result = arithmeticMean(values, { trace });

  if (trace) tracer.endContext(result);

  if (includeBreakdown) {
    const breakdown = {};
    VULNERABLE_GROUPS_INDICATORS.forEach((key, i) => {
      breakdown[key] = values[i];
    });
    return { value: result, breakdown };
  }

  return result;
}

/**
 * Calculate Vulnerability Total
 * Method: Arithmetic mean of Socio-Economic and Vulnerable Groups
 * @param {number} socioEconomic
 * @param {number} vulnerableGroups
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateVulnerability(socioEconomic, vulnerableGroups, options = {}) {
  const { trace = false } = options;

  if (trace) tracer.startContext('calculateVulnerability', { socioEconomic, vulnerableGroups });

  const result = arithmeticMean([socioEconomic, vulnerableGroups], { trace });

  if (trace) tracer.endContext(result);

  return result;
}

// ============================================================================
// LACK OF COPING CAPACITY CALCULATIONS
// ============================================================================

export const INFRASTRUCTURE_INDICATORS = [
  'access_health',
  'economic_capacity',
  'wash',
  'communication',
  'education'
];

export const INSTITUTIONAL_INDICATORS = [
  'drr_implementation',
  'governance'
];

/**
 * Calculate Infrastructure Coping Capacity
 * Method: Arithmetic mean of infrastructure indicators
 * @param {Object} indicators
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateInfrastructure(indicators, options = {}) {
  const { trace = false, includeBreakdown = false } = options;

  if (trace) tracer.startContext('calculateInfrastructure', indicators);

  const values = INFRASTRUCTURE_INDICATORS.map(key => indicators[key]);
  const result = arithmeticMean(values, { trace });

  if (trace) tracer.endContext(result);

  if (includeBreakdown) {
    const breakdown = {};
    INFRASTRUCTURE_INDICATORS.forEach((key, i) => {
      breakdown[key] = values[i];
    });
    return { value: result, breakdown };
  }

  return result;
}

/**
 * Calculate Institutional Coping Capacity
 * Method: Arithmetic mean of institutional indicators
 * @param {Object} indicators
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateInstitutional(indicators, options = {}) {
  const { trace = false, includeBreakdown = false } = options;

  if (trace) tracer.startContext('calculateInstitutional', indicators);

  const values = INSTITUTIONAL_INDICATORS.map(key => indicators[key]);
  const result = arithmeticMean(values, { trace });

  if (trace) tracer.endContext(result);

  if (includeBreakdown) {
    const breakdown = {};
    INSTITUTIONAL_INDICATORS.forEach((key, i) => {
      breakdown[key] = values[i];
    });
    return { value: result, breakdown };
  }

  return result;
}

/**
 * Calculate Lack of Coping Capacity Total
 * Method: Arithmetic mean of Infrastructure and Institutional
 * @param {number} infrastructure
 * @param {number} institutional
 * @param {Object} options - Calculation options
 * @returns {number|null}
 */
export function calculateLackCopingCapacity(infrastructure, institutional, options = {}) {
  const { trace = false } = options;

  if (trace) tracer.startContext('calculateLackCopingCapacity', { infrastructure, institutional });

  const result = arithmeticMean([infrastructure, institutional], { trace });

  if (trace) tracer.endContext(result);

  return result;
}

// ============================================================================
// FINAL RISK INDEX CALCULATION
// ============================================================================

/**
 * Calculate INFORM Risk Index
 * Formula: Risk = ∛(H×E × V × LCC)
 * This is the geometric mean of the three dimensions
 *
 * @param {number} hazardExposure - Hazard and Exposure score (0-10)
 * @param {number} vulnerability - Vulnerability score (0-10)
 * @param {number} lackCopingCapacity - Lack of Coping Capacity score (0-10)
 * @param {Object} options - Calculation options
 * @returns {number|null} - Risk index (0-10)
 */
export function calculateRiskIndex(hazardExposure, vulnerability, lackCopingCapacity, options = {}) {
  const { trace = false, includeComponents = false, precision = FORMULA_CONFIG.precision.default } = options;

  if (trace) tracer.startContext('calculateRiskIndex', { hazardExposure, vulnerability, lackCopingCapacity });

  const result = geometricMean([hazardExposure, vulnerability, lackCopingCapacity], { trace, precision });

  if (trace) tracer.endContext(result);

  if (includeComponents) {
    return {
      value: result,
      components: {
        hazardExposure,
        vulnerability,
        lackCopingCapacity
      },
      classification: classifyRisk(result),
      formula: `∛(${formatNumber(hazardExposure)} × ${formatNumber(vulnerability)} × ${formatNumber(lackCopingCapacity)}) = ${formatNumber(result)}`
    };
  }

  return result;
}

/**
 * Calculate all aggregates from raw indicators
 * @param {Object} indicators - All raw indicator values
 * @param {Object} options - Calculation options
 * @returns {Object} - Calculated aggregates and final risk
 */
export function calculateAllAggregates(indicators, options = {}) {
  const { trace = false, includeBreakdown = false, precision = FORMULA_CONFIG.precision.default } = options;

  if (trace) tracer.startContext('calculateAllAggregates', { indicatorCount: Object.keys(indicators).length });

  // Natural Hazards
  const naturalHazardResult = calculateNaturalHazard(indicators, { trace, includeBreakdown });
  const naturalHazard = includeBreakdown ? naturalHazardResult.value : naturalHazardResult;

  // Human Hazards
  const humanHazardResult = calculateHumanHazard(indicators, { trace, includeBreakdown });
  const humanHazard = includeBreakdown ? humanHazardResult.value : humanHazardResult;

  // Hazard and Exposure Total
  const hazardExposureResult = calculateHazardExposure(naturalHazard, humanHazard, { trace, includeDominant: includeBreakdown });
  const hazardExposure = includeBreakdown ? hazardExposureResult.value : hazardExposureResult;

  // Socio-Economic Vulnerability
  const socioEconomicResult = calculateSocioEconomicVulnerability(indicators, { trace, includeBreakdown });
  const socioEconomic = includeBreakdown ? socioEconomicResult.value : socioEconomicResult;

  // Vulnerable Groups
  const vulnerableGroupsResult = calculateVulnerableGroups(indicators, { trace, includeBreakdown });
  const vulnerableGroups = includeBreakdown ? vulnerableGroupsResult.value : vulnerableGroupsResult;

  // Vulnerability Total
  const vulnerability = calculateVulnerability(socioEconomic, vulnerableGroups, { trace });

  // Infrastructure
  const infrastructureResult = calculateInfrastructure(indicators, { trace, includeBreakdown });
  const infrastructure = includeBreakdown ? infrastructureResult.value : infrastructureResult;

  // Institutional
  const institutionalResult = calculateInstitutional(indicators, { trace, includeBreakdown });
  const institutional = includeBreakdown ? institutionalResult.value : institutionalResult;

  // Lack of Coping Capacity Total
  const lackCopingCapacity = calculateLackCopingCapacity(infrastructure, institutional, { trace });

  // Final Risk Index
  const riskIndex = calculateRiskIndex(hazardExposure, vulnerability, lackCopingCapacity, { trace, precision });

  // Risk Classification
  const riskClass = classifyRisk(riskIndex);

  if (trace) tracer.endContext({ riskIndex, riskClass: riskClass.label });

  const result = {
    // Aggregates
    natural_hazard_aggregate: roundTo(naturalHazard, precision),
    human_hazard_aggregate: roundTo(humanHazard, precision),
    hazard_exposure_total: roundTo(hazardExposure, precision),
    socio_economic_aggregate: roundTo(socioEconomic, precision),
    vulnerable_groups_aggregate: roundTo(vulnerableGroups, precision),
    vulnerability_total: roundTo(vulnerability, precision),
    infrastructure_aggregate: roundTo(infrastructure, precision),
    institutional_aggregate: roundTo(institutional, precision),
    lack_coping_capacity_total: roundTo(lackCopingCapacity, precision),
    // Final
    risk_index: roundTo(riskIndex, precision),
    risk_class: riskClass.label,
    risk_color: riskClass.color
  };

  if (includeBreakdown) {
    result.breakdown = {
      naturalHazard: naturalHazardResult,
      humanHazard: humanHazardResult,
      hazardExposure: hazardExposureResult,
      socioEconomic: socioEconomicResult,
      vulnerableGroups: vulnerableGroupsResult,
      infrastructure: infrastructureResult,
      institutional: institutionalResult
    };
  }

  return result;
}

// ============================================================================
// BATCH CALCULATION
// ============================================================================

/**
 * Calculate risk for multiple units in batch
 * @param {Object[]} units - Array of { id, indicators } objects
 * @param {Object} options - Calculation options
 * @returns {Object[]} - Array of calculated results
 */
export function calculateBatch(units, options = {}) {
  const { parallel = false, progressCallback = null } = options;

  const results = [];
  const total = units.length;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    try {
      const aggregates = calculateAllAggregates(unit.indicators, options);
      results.push({
        id: unit.id,
        success: true,
        ...aggregates
      });
    } catch (error) {
      results.push({
        id: unit.id,
        success: false,
        error: error.message
      });
    }

    if (progressCallback) {
      progressCallback({ current: i + 1, total, percent: ((i + 1) / total) * 100 });
    }
  }

  return results;
}

// ============================================================================
// RISK CLASSIFICATION
// ============================================================================

/**
 * Classify risk score into risk class
 * @param {number} score - Risk score (0-10)
 * @param {string} language - Language for label ('en' or 'sw')
 * @returns {Object} - Risk classification object
 */
export function classifyRisk(score, language = 'en') {
  if (score === null || score === undefined || isNaN(score)) {
    return { label: 'Unknown', labelSwahili: 'Haijulikani', color: '#9E9E9E', min: null, max: null };
  }

  const threshold = score < 2.0 ? RISK_THRESHOLDS.VERY_LOW
    : score < 3.5 ? RISK_THRESHOLDS.LOW
    : score < 5.0 ? RISK_THRESHOLDS.MEDIUM
    : score < 6.5 ? RISK_THRESHOLDS.HIGH
    : RISK_THRESHOLDS.VERY_HIGH;

  return {
    ...threshold,
    label: language === 'sw' ? threshold.labelSwahili : threshold.label
  };
}

/**
 * Get color for risk score
 * @param {number} score
 * @returns {string} - Hex color code
 */
export function getRiskColor(score) {
  return classifyRisk(score).color;
}

/**
 * Get risk level as number (1-5)
 * @param {number} score
 * @returns {number}
 */
export function getRiskLevel(score) {
  if (score === null || isNaN(score)) return 0;
  if (score < 2.0) return 1;
  if (score < 3.5) return 2;
  if (score < 5.0) return 3;
  if (score < 6.5) return 4;
  return 5;
}

// ============================================================================
// WARNING CALCULATIONS
// ============================================================================

/**
 * Calculate Warning Score
 * Formula: Warning = √(Hazard Intensity × Risk Sensitivity)
 * where Risk Sensitivity = √(V × LCC)
 *
 * @param {number} hazardIntensity - Current hazard intensity (0-10)
 * @param {number} vulnerability - District vulnerability score (0-10)
 * @param {number} lackCopingCapacity - District LCC score (0-10)
 * @param {Object} options - Calculation options
 * @returns {number} - Warning score (0-10)
 */
export function calculateWarningScore(hazardIntensity, vulnerability, lackCopingCapacity, options = {}) {
  const { trace = false, includeComponents = false } = options;

  if (trace) tracer.startContext('calculateWarningScore', { hazardIntensity, vulnerability, lackCopingCapacity });

  // Risk Sensitivity = √(V × LCC)
  const riskSensitivity = Math.sqrt((vulnerability || 0) * (lackCopingCapacity || 0));

  // Warning Score = √(Hazard × Risk Sensitivity)
  const warningScore = Math.sqrt((hazardIntensity || 0) * riskSensitivity);

  const result = clamp(roundTo(warningScore, FORMULA_CONFIG.precision.default));

  if (trace) tracer.endContext(result);

  if (includeComponents) {
    return {
      value: result,
      riskSensitivity: roundTo(riskSensitivity, 2),
      components: { hazardIntensity, vulnerability, lackCopingCapacity },
      classification: classifyWarning(result)
    };
  }

  return result;
}

/**
 * Classify warning level
 * @param {number} score - Warning score (0-10)
 * @param {string} language - Language for label
 * @returns {Object} - Warning classification
 */
export function classifyWarning(score, language = 'en') {
  if (score === null || score === undefined || isNaN(score)) {
    return { label: 'Unknown', color: '#9E9E9E', icon: '⚪' };
  }

  const threshold = score < 2.5 ? WARNING_THRESHOLDS.MONITOR
    : score < 5.0 ? WARNING_THRESHOLDS.ADVISORY
    : score < 7.5 ? WARNING_THRESHOLDS.WARNING
    : WARNING_THRESHOLDS.MAJOR_WARNING;

  return {
    ...threshold,
    label: language === 'sw' ? threshold.labelSwahili : threshold.label
  };
}

/**
 * Convert warning level string to hazard intensity
 * @param {string} warningLevel
 * @returns {number}
 */
export function warningLevelToIntensity(warningLevel) {
  const mapping = {
    'Advisory': 3.5,
    'Ushauri': 3.5,
    'Warning': 6.5,
    'Onyo': 6.5,
    'Major Warning': 9.0,
    'Onyo Kuu': 9.0,
    'Very Low': 2.0,
    'Low': 3.5,
    'Moderate': 5.0,
    'High': 7.0,
    'Very High': 9.0,
    'Monitor': 1.5,
    'Fuatilia': 1.5
  };
  return mapping[warningLevel] || 5.0;
}

// ============================================================================
// SEVERITY CALCULATIONS
// ============================================================================

/**
 * Calculate Severity Score
 * Formula: Severity = √(Warning Score × Vulnerability)
 *
 * @param {number} warningScore
 * @param {number} vulnerability
 * @param {Object} options - Calculation options
 * @returns {number}
 */
export function calculateSeverityScore(warningScore, vulnerability, options = {}) {
  const { includeComponents = false } = options;

  const severity = Math.sqrt((warningScore || 0) * (vulnerability || 0));
  const result = clamp(roundTo(severity, FORMULA_CONFIG.precision.default));

  if (includeComponents) {
    return {
      value: result,
      components: { warningScore, vulnerability },
      classification: classifySeverity(result)
    };
  }

  return result;
}

/**
 * Classify severity level
 * @param {number} score
 * @param {string} language
 * @returns {Object}
 */
export function classifySeverity(score, language = 'en') {
  if (score === null || isNaN(score)) {
    return { label: 'Unknown', color: '#9E9E9E' };
  }

  const threshold = score < 3 ? SEVERITY_THRESHOLDS.MINOR
    : score < 5 ? SEVERITY_THRESHOLDS.MODERATE
    : score < 7 ? SEVERITY_THRESHOLDS.SEVERE
    : score < 9 ? SEVERITY_THRESHOLDS.CRITICAL
    : SEVERITY_THRESHOLDS.CATASTROPHIC;

  return {
    ...threshold,
    label: language === 'sw' ? threshold.labelSwahili : threshold.label
  };
}

// ============================================================================
// CLIMATE CHANGE PROJECTIONS
// ============================================================================

/**
 * Calculate projected risk change due to climate change
 * @param {number} currentRisk
 * @param {Object} climateFactors - Climate change factors
 * @param {Object} options - Calculation options
 * @returns {number|Object} - Projected risk
 */
export function calculateProjectedRisk(currentRisk, climateFactors, options = {}) {
  const { includeDetails = false, scenario = 'moderate' } = options;

  const {
    tempChangePercent = 0,
    precipChangePercent = 0,
    extremeEventsIncrease = 0,
    seaLevelRise = 0
  } = climateFactors;

  // Scenario multipliers
  const scenarioMultipliers = {
    optimistic: 0.7,
    moderate: 1.0,
    pessimistic: 1.5
  };

  const multiplier = scenarioMultipliers[scenario] || 1.0;

  // Climate impact factors
  const tempImpact = (Math.abs(tempChangePercent) / 100) * 0.25;
  const precipImpact = (Math.abs(precipChangePercent) / 100) * 0.25;
  const eventsImpact = (extremeEventsIncrease / 100) * 0.35;
  const seaImpact = (seaLevelRise / 100) * 0.15;

  const totalImpact = (tempImpact + precipImpact + eventsImpact + seaImpact) * multiplier;
  const climateFactor = 1 + totalImpact;

  const projectedRisk = clamp(currentRisk * climateFactor);

  if (includeDetails) {
    return {
      currentRisk,
      projectedRisk: roundTo(projectedRisk, 2),
      absoluteChange: roundTo(projectedRisk - currentRisk, 2),
      percentChange: roundTo(((projectedRisk - currentRisk) / currentRisk) * 100, 1),
      climateFactor: roundTo(climateFactor, 3),
      impactBreakdown: {
        temperature: roundTo(tempImpact * 100, 1),
        precipitation: roundTo(precipImpact * 100, 1),
        extremeEvents: roundTo(eventsImpact * 100, 1),
        seaLevel: roundTo(seaImpact * 100, 1)
      },
      scenario,
      currentClassification: classifyRisk(currentRisk),
      projectedClassification: classifyRisk(projectedRisk)
    };
  }

  return roundTo(projectedRisk, 2);
}

// ============================================================================
// UNCERTAINTY QUANTIFICATION
// ============================================================================

/**
 * Calculate confidence interval for a value
 * @param {number} value - Point estimate
 * @param {number} standardError - Standard error
 * @param {number} confidence - Confidence level (0-1)
 * @returns {Object} - Confidence interval
 */
export function calculateConfidenceInterval(value, standardError, confidence = 0.95) {
  if (value === null || standardError === null) return null;

  // Z-scores for common confidence levels
  const zScores = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };

  const z = zScores[confidence] || 1.96;
  const margin = z * standardError;

  return {
    value: roundTo(value, 2),
    lower: roundTo(Math.max(0, value - margin), 2),
    upper: roundTo(Math.min(10, value + margin), 2),
    margin: roundTo(margin, 3),
    confidence,
    standardError: roundTo(standardError, 3)
  };
}

/**
 * Monte Carlo simulation for uncertainty
 * @param {Function} calculator - Calculation function
 * @param {Object} inputRanges - Input parameter ranges { param: { mean, stdDev } }
 * @param {number} iterations - Number of iterations
 * @returns {Object} - Simulation results
 */
export function monteCarloSimulation(calculator, inputRanges, iterations = FORMULA_CONFIG.monteCarlo.defaultIterations) {
  const results = [];

  for (let i = 0; i < Math.min(iterations, FORMULA_CONFIG.monteCarlo.maxIterations); i++) {
    const sampledInputs = {};

    for (const [param, range] of Object.entries(inputRanges)) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const sample = clamp(range.mean + z * range.stdDev);
      sampledInputs[param] = sample;
    }

    try {
      const result = calculator(sampledInputs);
      if (result !== null && !isNaN(result)) {
        results.push(result);
      }
    } catch (e) {
      // Skip failed iterations
    }
  }

  if (results.length === 0) return null;

  results.sort((a, b) => a - b);

  return {
    iterations: results.length,
    mean: roundTo(arithmeticMean(results), 3),
    median: roundTo(median(results), 3),
    stdDev: roundTo(standardDeviation(results), 3),
    min: roundTo(Math.min(...results), 3),
    max: roundTo(Math.max(...results), 3),
    percentile5: roundTo(calculatePercentile(results, 5), 3),
    percentile25: roundTo(calculatePercentile(results, 25), 3),
    percentile75: roundTo(calculatePercentile(results, 75), 3),
    percentile95: roundTo(calculatePercentile(results, 95), 3),
    confidenceInterval90: {
      lower: roundTo(calculatePercentile(results, 5), 3),
      upper: roundTo(calculatePercentile(results, 95), 3)
    }
  };
}

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

/**
 * Perform sensitivity analysis
 * @param {Object} baseIndicators - Base indicator values
 * @param {string[]} indicatorsToAnalyze - Indicators to vary
 * @param {number} variationPercent - Percentage to vary (e.g., 10 for ±10%)
 * @returns {Object} - Sensitivity results
 */
export function sensitivityAnalysis(baseIndicators, indicatorsToAnalyze = null, variationPercent = 10) {
  const baseResult = calculateAllAggregates(baseIndicators);
  const baseRisk = baseResult.risk_index;

  const indicators = indicatorsToAnalyze || Object.keys(baseIndicators);
  const sensitivity = {};

  for (const indicator of indicators) {
    if (baseIndicators[indicator] === null || baseIndicators[indicator] === undefined) continue;

    const baseValue = baseIndicators[indicator];
    const variation = (variationPercent / 100) * baseValue;

    // Calculate risk with increased value
    const increasedIndicators = { ...baseIndicators, [indicator]: clamp(baseValue + variation) };
    const increasedResult = calculateAllAggregates(increasedIndicators);

    // Calculate risk with decreased value
    const decreasedIndicators = { ...baseIndicators, [indicator]: clamp(baseValue - variation) };
    const decreasedResult = calculateAllAggregates(decreasedIndicators);

    const riskChange = increasedResult.risk_index - decreasedResult.risk_index;
    const elasticity = (riskChange / (2 * variation)) * (baseValue / baseRisk);

    sensitivity[indicator] = {
      baseValue: roundTo(baseValue, 2),
      riskWhenIncreased: roundTo(increasedResult.risk_index, 3),
      riskWhenDecreased: roundTo(decreasedResult.risk_index, 3),
      riskChange: roundTo(riskChange, 3),
      elasticity: roundTo(elasticity, 3),
      impact: Math.abs(elasticity) > 0.5 ? 'high' : Math.abs(elasticity) > 0.2 ? 'medium' : 'low'
    };
  }

  // Rank by impact
  const ranked = Object.entries(sensitivity)
    .sort((a, b) => Math.abs(b[1].elasticity) - Math.abs(a[1].elasticity))
    .map(([key, value], index) => ({ indicator: key, rank: index + 1, ...value }));

  return {
    baseRisk: roundTo(baseRisk, 2),
    variationPercent,
    sensitivity,
    rankedByImpact: ranked
  };
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Analyze risk trend over time
 * @param {Array<{date: string, indicators: Object}>} timeSeries - Time series data
 * @param {Object} options - Analysis options
 * @returns {Object} - Trend analysis results
 */
export function analyzeTrend(timeSeries, options = {}) {
  const { includeSeasonality = false, forecastPeriods = 0 } = options;

  if (!timeSeries || timeSeries.length < 2) {
    return { error: 'Insufficient data for trend analysis' };
  }

  // Calculate risk for each period
  const riskSeries = timeSeries.map(point => ({
    date: point.date,
    ...calculateAllAggregates(point.indicators)
  }));

  const riskValues = riskSeries.map(r => r.risk_index).filter(v => v !== null);

  if (riskValues.length < 2) {
    return { error: 'Insufficient valid risk values' };
  }

  // Linear regression for trend
  const n = riskValues.length;
  const xMean = (n - 1) / 2;
  const yMean = arithmeticMean(riskValues);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (riskValues[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Determine trend direction
  let trendDirection;
  if (Math.abs(slope) < 0.05) {
    trendDirection = 'stable';
  } else if (slope > 0) {
    trendDirection = 'increasing';
  } else {
    trendDirection = 'decreasing';
  }

  // Calculate volatility
  const volatility = coefficientOfVariation(riskValues);

  // Forecast
  const forecast = [];
  if (forecastPeriods > 0) {
    for (let i = 1; i <= forecastPeriods; i++) {
      const forecastValue = clamp(intercept + slope * (n - 1 + i));
      forecast.push({
        period: i,
        value: roundTo(forecastValue, 2),
        classification: classifyRisk(forecastValue)
      });
    }
  }

  return {
    periods: n,
    firstValue: roundTo(riskValues[0], 2),
    lastValue: roundTo(riskValues[n - 1], 2),
    mean: roundTo(yMean, 2),
    min: roundTo(Math.min(...riskValues), 2),
    max: roundTo(Math.max(...riskValues), 2),
    stdDev: roundTo(standardDeviation(riskValues), 3),
    volatility: roundTo(volatility, 1),
    trend: {
      direction: trendDirection,
      slope: roundTo(slope, 4),
      intercept: roundTo(intercept, 2),
      changePerPeriod: roundTo(slope, 3),
      totalChange: roundTo(slope * (n - 1), 2)
    },
    forecast,
    series: riskSeries
  };
}

// ============================================================================
// VALIDATION AND VERIFICATION
// ============================================================================

/**
 * Verify INFORM formula calculation
 * @param {number} he - Hazard and Exposure
 * @param {number} v - Vulnerability
 * @param {number} lcc - Lack of Coping Capacity
 * @param {number} expectedRisk - Expected risk value
 * @returns {Object} - Verification result
 */
export function verifyRiskCalculation(he, v, lcc, expectedRisk) {
  const calculated = calculateRiskIndex(he, v, lcc);
  const difference = calculated !== null ? Math.abs(calculated - expectedRisk) : null;

  return {
    calculated: formatNumber(calculated),
    expected: formatNumber(expectedRisk),
    difference: difference !== null ? difference.toFixed(3) : null,
    isValid: difference !== null && difference < 0.1,
    formula: `Risk = ∛(${formatNumber(he)} × ${formatNumber(v)} × ${formatNumber(lcc)}) = ${formatNumber(calculated)}`,
    methodologyCompliant: true
  };
}

/**
 * Normalize value to 0-10 scale
 * @param {number} value - Raw value
 * @param {number} min - Minimum of scale
 * @param {number} max - Maximum of scale
 * @param {Object} options - Normalization options
 * @returns {number} - Normalized value (0-10)
 */
export function normalizeToScale(value, min, max, options = {}) {
  const { invert = false, logarithmic = false } = options;

  if (value === null || value === undefined || isNaN(value)) return null;
  if (max === min) return 5;

  let normalized;

  if (logarithmic && value > 0 && min > 0 && max > 0) {
    const logValue = Math.log(value);
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    normalized = ((logValue - logMin) / (logMax - logMin)) * 10;
  } else {
    normalized = ((value - min) / (max - min)) * 10;
  }

  if (invert) {
    normalized = 10 - normalized;
  }

  return clamp(roundTo(normalized, 2));
}

/**
 * Validate indicator value
 * @param {string} indicatorId - Indicator identifier
 * @param {number} value - Value to validate
 * @returns {Object} - Validation result
 */
export function validateIndicatorValue(indicatorId, value) {
  const errors = [];
  const warnings = [];

  if (value === null || value === undefined) {
    return { valid: true, value: null, errors: [], warnings: ['Value is missing'] };
  }

  if (isNaN(value)) {
    errors.push('Value is not a number');
    return { valid: false, value, errors, warnings };
  }

  if (value < FORMULA_CONFIG.bounds.min) {
    errors.push(`Value ${value} is below minimum ${FORMULA_CONFIG.bounds.min}`);
  }

  if (value > FORMULA_CONFIG.bounds.max) {
    errors.push(`Value ${value} exceeds maximum ${FORMULA_CONFIG.bounds.max}`);
  }

  // Anomaly detection
  if (value === 0) {
    warnings.push('Zero value - verify this is intentional');
  }

  if (value === 10) {
    warnings.push('Maximum value - verify this is accurate');
  }

  return {
    valid: errors.length === 0,
    value: clamp(value),
    errors,
    warnings
  };
}

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

/**
 * Compare risk between two units
 * @param {Object} unit1 - First unit { id, indicators }
 * @param {Object} unit2 - Second unit { id, indicators }
 * @returns {Object} - Comparison result
 */
export function compareRisk(unit1, unit2) {
  const result1 = calculateAllAggregates(unit1.indicators);
  const result2 = calculateAllAggregates(unit2.indicators);

  const riskDiff = result1.risk_index - result2.risk_index;
  const heDiff = result1.hazard_exposure_total - result2.hazard_exposure_total;
  const vDiff = result1.vulnerability_total - result2.vulnerability_total;
  const lccDiff = result1.lack_coping_capacity_total - result2.lack_coping_capacity_total;

  return {
    unit1: { id: unit1.id, ...result1 },
    unit2: { id: unit2.id, ...result2 },
    differences: {
      risk_index: roundTo(riskDiff, 2),
      hazard_exposure: roundTo(heDiff, 2),
      vulnerability: roundTo(vDiff, 2),
      lack_coping_capacity: roundTo(lccDiff, 2)
    },
    higherRisk: riskDiff > 0 ? unit1.id : riskDiff < 0 ? unit2.id : 'equal',
    summary: `${unit1.id} risk is ${Math.abs(riskDiff).toFixed(2)} points ${riskDiff > 0 ? 'higher' : riskDiff < 0 ? 'lower' : 'equal to'} ${unit2.id}`
  };
}

/**
 * Rank units by risk
 * @param {Object[]} units - Array of { id, indicators }
 * @returns {Object[]} - Ranked results
 */
export function rankByRisk(units) {
  const results = units.map(unit => ({
    id: unit.id,
    ...calculateAllAggregates(unit.indicators)
  }));

  results.sort((a, b) => (b.risk_index || 0) - (a.risk_index || 0));

  return results.map((result, index) => ({
    rank: index + 1,
    ...result
  }));
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  // Configuration
  FORMULA_CONFIG,

  // Thresholds
  RISK_THRESHOLDS,
  WARNING_THRESHOLDS,
  SEVERITY_THRESHOLDS,

  // Indicator lists
  NATURAL_HAZARD_INDICATORS,
  HUMAN_HAZARD_INDICATORS,
  SOCIO_ECONOMIC_INDICATORS,
  VULNERABLE_GROUPS_INDICATORS,
  INFRASTRUCTURE_INDICATORS,
  INSTITUTIONAL_INDICATORS,

  // Tracer
  tracer,

  // Precision utilities
  roundTo,
  clamp,
  approximatelyEqual,
  formatNumber,

  // Aggregation methods
  filterValidValues,
  arithmeticMean,
  geometricMean,
  maximum,
  minimum,
  weightedMean,
  median,
  standardDeviation,
  coefficientOfVariation,
  calculatePercentile,

  // Hazard calculations
  calculateNaturalHazard,
  calculateHumanHazard,
  calculateHazardExposure,

  // Vulnerability calculations
  calculateSocioEconomicVulnerability,
  calculateVulnerableGroups,
  calculateVulnerability,

  // Coping capacity calculations
  calculateInfrastructure,
  calculateInstitutional,
  calculateLackCopingCapacity,

  // Risk calculations
  calculateRiskIndex,
  calculateAllAggregates,
  calculateBatch,
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

  // Uncertainty
  calculateConfidenceInterval,
  monteCarloSimulation,

  // Sensitivity analysis
  sensitivityAnalysis,

  // Trend analysis
  analyzeTrend,

  // Validation & utilities
  verifyRiskCalculation,
  normalizeToScale,
  validateIndicatorValue,

  // Comparison
  compareRisk,
  rankByRisk
};
