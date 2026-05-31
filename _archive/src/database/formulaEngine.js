/**
 * INFORM FORMULA ENGINE v2.0
 *
 * Complete calculation engine that implements the INFORM methodology
 * exactly as defined in the Tanzania Country Model Template Excel.
 *
 * Calculation Flow:
 * RAW_INDICATORS → validate → normalize → COMPONENTS → CATEGORIES → DIMENSIONS → RISK_INDEX
 *
 * Aggregation Methods:
 * - Hazards: MAX (worst case scenario)
 * - Vulnerability: Arithmetic Mean
 * - Lack of Coping Capacity: Arithmetic Mean
 * - Final Risk: Geometric Mean (cube root of product)
 *
 * Features:
 * - Multiple normalization methods (min-max, z-score, percentile, log)
 * - Weighted aggregation support
 * - Sensitivity analysis
 * - Confidence scoring
 * - Trend analysis
 * - Scenario modeling
 * - Statistical utilities
 *
 * @version 2.0.0
 * @author INFORM Tanzania Team
 */

import {
  INDICATOR_DEFINITIONS,
  COMPONENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
  DIMENSION_DEFINITIONS,
  ADVANCED_SCHEMA_CONFIG,
  POLARITY,
  AGGREGATION_METHODS,
  normalizeValue as schemaNormalizeValue,
  validateIndicatorValue
} from './advancedSchema.js';

// ============================================================================
// ENGINE CONFIGURATION
// ============================================================================

export const ENGINE_CONFIG = {
  version: '2.0.0',

  // Default normalization settings
  normalization: {
    defaultMethod: 'min_max',
    scoreRange: { min: 0, max: 10 },
    precision: 4
  },

  // Minimum data requirements
  dataRequirements: {
    minIndicatorsPerComponent: 1,
    minComponentsPerCategory: 1,
    minCategoriesPerDimension: 1,
    minDimensionsForRisk: 2  // At least 2 of 3 dimensions needed
  },

  // Confidence thresholds
  confidence: {
    high: 80,     // >= 80% data completeness
    medium: 50,   // >= 50% data completeness
    low: 20       // >= 20% data completeness
  },

  // Caching settings
  caching: {
    enabled: true,
    maxAge: 3600000,  // 1 hour in ms
    maxEntries: 1000
  }
};

// ============================================================================
// CALCULATION CACHE
// ============================================================================

const calculationCache = new Map();

function getCacheKey(type, id, data) {
  const dataHash = JSON.stringify(data).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${type}:${id}:${dataHash}`;
}

function getCached(key) {
  if (!ENGINE_CONFIG.caching.enabled) return null;

  const cached = calculationCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > ENGINE_CONFIG.caching.maxAge) {
    calculationCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCache(key, value) {
  if (!ENGINE_CONFIG.caching.enabled) return;

  // Limit cache size
  if (calculationCache.size >= ENGINE_CONFIG.caching.maxEntries) {
    const oldestKey = calculationCache.keys().next().value;
    calculationCache.delete(oldestKey);
  }

  calculationCache.set(key, { value, timestamp: Date.now() });
}

export function clearCache() {
  calculationCache.clear();
}

// ============================================================================
// STATISTICAL UTILITIES
// ============================================================================

/**
 * Calculate basic statistics for an array of values
 */
export function calculateStatistics(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));

  if (validValues.length === 0) {
    return {
      count: 0,
      sum: null,
      mean: null,
      median: null,
      min: null,
      max: null,
      range: null,
      variance: null,
      stdDev: null,
      skewness: null,
      percentiles: {}
    };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Variance and standard deviation
  const squaredDiffs = sorted.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Skewness
  const cubedDiffs = sorted.map(v => Math.pow((v - mean) / (stdDev || 1), 3));
  const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / n;

  // Percentiles
  const getPercentile = (p) => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  };

  return {
    count: n,
    sum,
    mean,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    variance,
    stdDev,
    skewness,
    percentiles: {
      p5: getPercentile(5),
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: median,
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95)
    }
  };
}

/**
 * Calculate z-score for a value
 */
export function calculateZScore(value, mean, stdDev) {
  if (stdDev === 0 || stdDev === null) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate coefficient of variation
 */
export function coefficientOfVariation(values) {
  const stats = calculateStatistics(values);
  if (!stats.mean || stats.mean === 0) return null;
  return (stats.stdDev / Math.abs(stats.mean)) * 100;
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Min-max normalization to 0-10 scale
 */
export function normalizeMinMax(value, min, max, polarity = 'negative') {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  if (max === min) {
    return 5; // Middle value if no variance
  }

  let normalized = ((value - min) / (max - min)) * 10;

  // Invert if positive polarity (higher raw value = better = lower risk)
  if (polarity === POLARITY.POSITIVE || polarity === 'positive') {
    normalized = 10 - normalized;
  }

  return Math.max(0, Math.min(10, normalized));
}

/**
 * Z-score normalization then scaled to 0-10
 */
export function normalizeZScore(value, mean, stdDev, polarity = 'negative') {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const zScore = calculateZScore(value, mean, stdDev);

  // Convert z-score to 0-10 scale (assuming z ranges from -3 to +3)
  let normalized = ((zScore + 3) / 6) * 10;

  if (polarity === POLARITY.POSITIVE || polarity === 'positive') {
    normalized = 10 - normalized;
  }

  return Math.max(0, Math.min(10, normalized));
}

/**
 * Percentile-based normalization
 */
export function normalizePercentile(value, allValues, polarity = 'negative') {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const validValues = allValues.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;

  const sorted = [...validValues].sort((a, b) => a - b);
  let rank = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] <= value) rank = i + 1;
  }

  let normalized = (rank / sorted.length) * 10;

  if (polarity === POLARITY.POSITIVE || polarity === 'positive') {
    normalized = 10 - normalized;
  }

  return Math.max(0, Math.min(10, normalized));
}

/**
 * Logarithmic transformation then min-max normalization
 */
export function normalizeLog(value, min, max, polarity = 'negative') {
  if (value === null || value === undefined || isNaN(value) || value < 0) {
    return null;
  }

  const logValue = Math.log10(value + 1);
  const logMin = Math.log10((min || 0) + 1);
  const logMax = Math.log10((max || 100) + 1);

  return normalizeMinMax(logValue, logMin, logMax, polarity);
}

/**
 * Apply normalization based on method specified in indicator definition
 */
export function normalizeValue(indicatorId, rawValue, referenceValues = null) {
  const indicator = INDICATOR_DEFINITIONS[indicatorId];
  if (!indicator) {
    console.warn(`Unknown indicator: ${indicatorId}`);
    return null;
  }

  if (rawValue === null || rawValue === undefined || rawValue === '' || rawValue === '#DIV/0!') {
    return null;
  }

  const value = parseFloat(rawValue);
  if (isNaN(value)) {
    return null;
  }

  const { normalization, polarity } = indicator;
  const { method, refMin, refMax } = normalization;

  switch (method) {
    case 'z_score':
      if (referenceValues) {
        const stats = calculateStatistics(referenceValues);
        return normalizeZScore(value, stats.mean, stats.stdDev, polarity);
      }
      return normalizeMinMax(value, refMin, refMax, polarity);

    case 'percentile':
      if (referenceValues) {
        return normalizePercentile(value, referenceValues, polarity);
      }
      return normalizeMinMax(value, refMin, refMax, polarity);

    case 'log':
      return normalizeLog(value, refMin, refMax, polarity);

    case 'min_max':
    default:
      return normalizeMinMax(value, refMin, refMax, polarity);
  }
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Calculate arithmetic mean
 */
export function arithmeticMean(values, weights = null) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;

  if (weights && weights.length === values.length) {
    const validPairs = values.map((v, i) => ({ value: v, weight: weights[i] }))
      .filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value));

    if (validPairs.length === 0) return null;

    const totalWeight = validPairs.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return arithmeticMean(validValues);

    return validPairs.reduce((sum, p) => sum + p.value * p.weight, 0) / totalWeight;
  }

  return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
}

/**
 * Calculate geometric mean
 */
export function geometricMean(values, weights = null) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  if (validValues.length === 0) return null;
  if (validValues.length === 1) return validValues[0];

  if (weights && weights.length === values.length) {
    const validPairs = values.map((v, i) => ({ value: v, weight: weights[i] }))
      .filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value) && p.value > 0);

    if (validPairs.length === 0) return null;

    const totalWeight = validPairs.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return geometricMean(validValues);

    // Weighted geometric mean: exp(sum(w_i * ln(x_i)) / sum(w_i))
    const weightedLogSum = validPairs.reduce((sum, p) => sum + p.weight * Math.log(p.value), 0);
    return Math.exp(weightedLogSum / totalWeight);
  }

  const product = validValues.reduce((prod, v) => prod * v, 1);
  return Math.pow(product, 1 / validValues.length);
}

/**
 * Calculate harmonic mean
 */
export function harmonicMean(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  if (validValues.length === 0) return null;

  const reciprocalSum = validValues.reduce((sum, v) => sum + (1 / v), 0);
  return validValues.length / reciprocalSum;
}

/**
 * Get maximum value
 */
export function maximum(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;
  return Math.max(...validValues);
}

/**
 * Get minimum value
 */
export function minimum(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;
  return Math.min(...validValues);
}

/**
 * Get median value
 */
export function median(values) {
  const stats = calculateStatistics(values);
  return stats.median;
}

/**
 * Sum values
 */
export function sum(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;
  return validValues.reduce((a, b) => a + b, 0);
}

/**
 * Apply aggregation based on method type
 */
export function aggregate(values, method, weights = null) {
  switch (method) {
    case AGGREGATION_METHODS.ARITHMETIC_MEAN:
    case 'arithmetic_mean':
      return arithmeticMean(values, weights);

    case AGGREGATION_METHODS.GEOMETRIC_MEAN:
    case 'geometric_mean':
      return geometricMean(values, weights);

    case AGGREGATION_METHODS.WEIGHTED_MEAN:
    case 'weighted_mean':
      return arithmeticMean(values, weights);

    case AGGREGATION_METHODS.MAX:
    case 'max':
      return maximum(values);

    case AGGREGATION_METHODS.MIN:
    case 'min':
      return minimum(values);

    case AGGREGATION_METHODS.MEDIAN:
    case 'median':
      return median(values);

    case AGGREGATION_METHODS.SUM:
    case 'sum':
      return sum(values);

    default:
      return arithmeticMean(values, weights);
  }
}

// ============================================================================
// INDICATOR PROCESSING
// ============================================================================

/**
 * Process raw indicator data with validation
 */
export function processIndicator(indicatorId, rawValue, referenceValues = null) {
  // Validate the indicator exists
  const indicator = INDICATOR_DEFINITIONS[indicatorId];
  if (!indicator) {
    return { value: null, error: `Unknown indicator: ${indicatorId}` };
  }

  // Validate the value
  const validation = validateIndicatorValue(indicatorId, rawValue);
  if (!validation.valid) {
    return { value: null, error: validation.error, warning: validation.warning };
  }

  // Normalize the value
  const normalized = normalizeValue(indicatorId, rawValue, referenceValues);

  return {
    value: normalized,
    raw: rawValue,
    warning: validation.warning,
    indicator: {
      id: indicatorId,
      name: indicator.name,
      component: indicator.component,
      dimension: indicator.dimension
    }
  };
}

/**
 * Process all indicators for an admin unit
 */
export function processAllIndicators(rawIndicators, referenceData = {}) {
  const processed = {};
  const errors = [];
  const warnings = [];

  for (const [indicatorId, rawValue] of Object.entries(rawIndicators)) {
    const referenceValues = referenceData[indicatorId] || null;
    const result = processIndicator(indicatorId, rawValue, referenceValues);

    processed[indicatorId] = result.value;

    if (result.error) {
      errors.push({ indicatorId, error: result.error });
    }
    if (result.warning) {
      warnings.push({ indicatorId, warning: result.warning });
    }
  }

  return {
    indicators: processed,
    errors,
    warnings,
    completeness: calculateCompleteness(processed)
  };
}

/**
 * Calculate data completeness percentage
 */
function calculateCompleteness(indicators) {
  const totalIndicators = Object.keys(INDICATOR_DEFINITIONS).length;
  const providedIndicators = Object.values(indicators).filter(v => v !== null).length;
  return (providedIndicators / totalIndicators) * 100;
}

// ============================================================================
// COMPONENT CALCULATION
// ============================================================================

/**
 * Calculate component value from normalized indicators
 */
export function calculateComponent(componentId, normalizedIndicators, options = {}) {
  const definition = COMPONENT_DEFINITIONS[componentId];
  if (!definition) {
    return { value: null, error: `Unknown component: ${componentId}` };
  }

  // Check cache
  const cacheKey = getCacheKey('component', componentId, normalizedIndicators);
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  const indicatorValues = definition.indicators
    .map(indicatorId => ({
      id: indicatorId,
      value: normalizedIndicators[indicatorId],
      weight: options.weights?.[indicatorId] || 1.0
    }));

  const values = indicatorValues.map(iv => iv.value).filter(v => v !== null && v !== undefined);
  const weights = indicatorValues.filter(iv => iv.value !== null).map(iv => iv.weight);

  if (values.length < ENGINE_CONFIG.dataRequirements.minIndicatorsPerComponent) {
    return {
      value: null,
      dataCompleteness: (values.length / definition.indicators.length) * 100,
      missingIndicators: indicatorValues.filter(iv => iv.value === null).map(iv => iv.id)
    };
  }

  const value = aggregate(values, definition.aggregation, weights);

  const result = {
    value,
    indicatorCount: values.length,
    totalIndicators: definition.indicators.length,
    dataCompleteness: (values.length / definition.indicators.length) * 100,
    aggregationMethod: definition.aggregation,
    indicatorValues: indicatorValues.reduce((obj, iv) => {
      obj[iv.id] = iv.value;
      return obj;
    }, {})
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Calculate all components
 */
export function calculateAllComponents(normalizedIndicators, options = {}) {
  const components = {};
  const componentDetails = {};

  for (const componentId of Object.keys(COMPONENT_DEFINITIONS)) {
    const result = calculateComponent(componentId, normalizedIndicators, options);
    components[componentId] = result.value;
    componentDetails[componentId] = result;
  }

  return { components, details: componentDetails };
}

// ============================================================================
// CATEGORY CALCULATION
// ============================================================================

/**
 * Calculate category value from component values
 */
export function calculateCategory(categoryId, componentValues, options = {}) {
  const definition = CATEGORY_DEFINITIONS[categoryId];
  if (!definition) {
    return { value: null, error: `Unknown category: ${categoryId}` };
  }

  const componentData = definition.components
    .map(componentId => ({
      id: componentId,
      value: componentValues[componentId],
      weight: options.weights?.[componentId] || COMPONENT_DEFINITIONS[componentId]?.weight || 1.0
    }));

  const values = componentData.map(c => c.value).filter(v => v !== null && v !== undefined);
  const weights = componentData.filter(c => c.value !== null).map(c => c.weight);

  if (values.length < ENGINE_CONFIG.dataRequirements.minComponentsPerCategory) {
    return {
      value: null,
      dataCompleteness: (values.length / definition.components.length) * 100,
      missingComponents: componentData.filter(c => c.value === null).map(c => c.id)
    };
  }

  const value = aggregate(values, definition.aggregation, weights);

  return {
    value,
    componentCount: values.length,
    totalComponents: definition.components.length,
    dataCompleteness: (values.length / definition.components.length) * 100,
    aggregationMethod: definition.aggregation
  };
}

/**
 * Calculate all categories
 */
export function calculateAllCategories(componentValues, options = {}) {
  const categories = {};
  const categoryDetails = {};

  for (const categoryId of Object.keys(CATEGORY_DEFINITIONS)) {
    const result = calculateCategory(categoryId, componentValues, options);
    categories[categoryId] = result.value;
    categoryDetails[categoryId] = result;
  }

  return { categories, details: categoryDetails };
}

// ============================================================================
// DIMENSION CALCULATION
// ============================================================================

/**
 * Calculate dimension value from category values
 */
export function calculateDimension(dimensionId, categoryValues, options = {}) {
  const definition = DIMENSION_DEFINITIONS[dimensionId];
  if (!definition) {
    return { value: null, error: `Unknown dimension: ${dimensionId}` };
  }

  const categoryData = definition.categories
    .map(categoryId => ({
      id: categoryId,
      value: categoryValues[categoryId],
      weight: options.weights?.[categoryId] || CATEGORY_DEFINITIONS[categoryId]?.weight || 0.5
    }));

  const values = categoryData.map(c => c.value).filter(v => v !== null && v !== undefined);
  const weights = categoryData.filter(c => c.value !== null).map(c => c.weight);

  if (values.length < ENGINE_CONFIG.dataRequirements.minCategoriesPerDimension) {
    return {
      value: null,
      dataCompleteness: (values.length / definition.categories.length) * 100,
      missingCategories: categoryData.filter(c => c.value === null).map(c => c.id)
    };
  }

  const value = aggregate(values, definition.aggregation, weights);

  return {
    value,
    categoryCount: values.length,
    totalCategories: definition.categories.length,
    dataCompleteness: (values.length / definition.categories.length) * 100,
    aggregationMethod: definition.aggregation
  };
}

/**
 * Calculate all dimensions
 */
export function calculateAllDimensions(categoryValues, options = {}) {
  const dimensions = {};
  const dimensionDetails = {};

  for (const dimensionId of Object.keys(DIMENSION_DEFINITIONS)) {
    const result = calculateDimension(dimensionId, categoryValues, options);
    dimensions[dimensionId] = result.value;
    dimensionDetails[dimensionId] = result;
  }

  return { dimensions, details: dimensionDetails };
}

// ============================================================================
// RISK INDEX CALCULATION
// ============================================================================

/**
 * Calculate final INFORM Risk Index
 *
 * Formula: Risk = ∛(Hazard × Vulnerability × LackOfCopingCapacity)
 */
export function calculateRiskIndex(dimensionValues, options = {}) {
  const { HAZARD, VULNERABILITY, LACK_OF_COPING_CAPACITY } = dimensionValues;

  const values = [HAZARD, VULNERABILITY, LACK_OF_COPING_CAPACITY]
    .filter(v => v !== null && v !== undefined);

  if (values.length < ENGINE_CONFIG.dataRequirements.minDimensionsForRisk) {
    return {
      value: null,
      error: 'Insufficient dimension data',
      availableDimensions: values.length
    };
  }

  // Get weights from definitions or options
  const weights = [
    options.weights?.HAZARD || DIMENSION_DEFINITIONS.HAZARD?.weight || 1/3,
    options.weights?.VULNERABILITY || DIMENSION_DEFINITIONS.VULNERABILITY?.weight || 1/3,
    options.weights?.LACK_OF_COPING_CAPACITY || DIMENSION_DEFINITIONS.LACK_OF_COPING_CAPACITY?.weight || 1/3
  ].slice(0, values.length);

  // Use geometric mean for equal weights, weighted geometric mean otherwise
  const equalWeights = weights.every(w => Math.abs(w - weights[0]) < 0.001);
  const riskIndex = equalWeights
    ? geometricMean(values)
    : geometricMean(values, weights);

  return {
    value: roundTo(riskIndex, ENGINE_CONFIG.normalization.precision),
    dimensions: {
      hazard: HAZARD,
      vulnerability: VULNERABILITY,
      lackOfCopingCapacity: LACK_OF_COPING_CAPACITY
    },
    formula: values.length === 3
      ? 'Risk = ∛(H × V × CC)'
      : `Risk = geometric_mean(${values.length} dimensions)`,
    weights: equalWeights ? 'equal' : weights
  };
}

/**
 * Classify risk index into risk categories
 */
export function classifyRisk(riskIndex) {
  if (riskIndex === null || riskIndex === undefined) {
    return {
      class: 'unknown',
      label: 'Unknown',
      color: '#999999',
      description: 'Insufficient data for classification',
      priority: 0
    };
  }

  const classes = ADVANCED_SCHEMA_CONFIG.scoring.riskClasses;

  for (const riskClass of classes) {
    if (riskIndex >= riskClass.min && riskIndex < riskClass.max) {
      return {
        class: riskClass.class.toLowerCase().replace(' ', '_'),
        label: riskClass.class,
        color: riskClass.color,
        range: `${riskClass.min} - ${riskClass.max}`,
        priority: classes.indexOf(riskClass) + 1
      };
    }
  }

  // Default to highest risk class
  const highest = classes[classes.length - 1];
  return {
    class: highest.class.toLowerCase().replace(' ', '_'),
    label: highest.class,
    color: highest.color,
    range: `${highest.min} - ${highest.max}`,
    priority: classes.length
  };
}

// ============================================================================
// WARNING SCORE CALCULATION
// ============================================================================

/**
 * Calculate Warning/Crisis Score
 *
 * Formula: Warning = √(HazardIntensity × RiskSensitivity)
 * Where: RiskSensitivity = √(Vulnerability × LackOfCopingCapacity)
 */
export function calculateWarningScore(hazardIntensity, vulnerability, lackOfCopingCapacity) {
  if ([hazardIntensity, vulnerability, lackOfCopingCapacity].some(v => v === null || v === undefined)) {
    return { value: null, error: 'Missing dimension values' };
  }

  const riskSensitivity = Math.sqrt(vulnerability * lackOfCopingCapacity);
  const warningScore = Math.sqrt(hazardIntensity * riskSensitivity);

  return {
    value: Math.min(10, Math.max(0, warningScore)),
    riskSensitivity: roundTo(riskSensitivity, 2),
    formula: 'Warning = √(Hazard × √(V × CC))'
  };
}

/**
 * Classify warning score into alert levels
 */
export function classifyWarning(warningScore) {
  if (warningScore === null || warningScore === undefined) {
    return { level: 0, label: 'Unknown', color: '#999999', icon: '❓', actions: [] };
  }

  const levels = [
    {
      threshold: 0, level: 1, label: 'Advisory', color: '#22c55e', icon: '🟢',
      actions: ['Monitor situation', 'Prepare contingency plans']
    },
    {
      threshold: 2.5, level: 2, label: 'Watch', color: '#eab308', icon: '🟡',
      actions: ['Activate early warning', 'Alert response teams', 'Review resources']
    },
    {
      threshold: 5.0, level: 3, label: 'Warning', color: '#f97316', icon: '🟠',
      actions: ['Issue public warning', 'Mobilize response', 'Begin evacuations if needed']
    },
    {
      threshold: 7.5, level: 4, label: 'Emergency', color: '#dc2626', icon: '🔴',
      actions: ['Full emergency response', 'Immediate evacuations', 'Request external support']
    }
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (warningScore >= levels[i].threshold) {
      return { ...levels[i], score: warningScore };
    }
  }

  return levels[0];
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate confidence score based on data completeness
 */
export function calculateConfidence(calculationResult) {
  const { indicators, components, categories, dimensions } = calculationResult;

  // Indicator completeness
  const totalIndicators = Object.keys(INDICATOR_DEFINITIONS).length;
  const filledIndicators = Object.values(indicators || {}).filter(v => v !== null).length;
  const indicatorCompleteness = (filledIndicators / totalIndicators) * 100;

  // Component completeness
  const totalComponents = Object.keys(COMPONENT_DEFINITIONS).length;
  const filledComponents = Object.values(components || {}).filter(v => v !== null).length;
  const componentCompleteness = (filledComponents / totalComponents) * 100;

  // Dimension completeness
  const totalDimensions = 3;
  const filledDimensions = Object.values(dimensions || {}).filter(v => v !== null).length;
  const dimensionCompleteness = (filledDimensions / totalDimensions) * 100;

  // Overall confidence (weighted average)
  const overallConfidence = (
    indicatorCompleteness * 0.5 +
    componentCompleteness * 0.3 +
    dimensionCompleteness * 0.2
  );

  // Confidence level
  let level, label;
  if (overallConfidence >= ENGINE_CONFIG.confidence.high) {
    level = 'high';
    label = 'High Confidence';
  } else if (overallConfidence >= ENGINE_CONFIG.confidence.medium) {
    level = 'medium';
    label = 'Medium Confidence';
  } else if (overallConfidence >= ENGINE_CONFIG.confidence.low) {
    level = 'low';
    label = 'Low Confidence';
  } else {
    level = 'very_low';
    label = 'Very Low Confidence';
  }

  return {
    score: roundTo(overallConfidence, 1),
    level,
    label,
    breakdown: {
      indicators: roundTo(indicatorCompleteness, 1),
      components: roundTo(componentCompleteness, 1),
      dimensions: roundTo(dimensionCompleteness, 1)
    },
    missingData: {
      indicators: totalIndicators - filledIndicators,
      components: totalComponents - filledComponents,
      dimensions: totalDimensions - filledDimensions
    }
  };
}

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

/**
 * Perform sensitivity analysis on the risk calculation
 * Shows how changes in each dimension affect the final risk score
 */
export function sensitivityAnalysis(dimensionValues, options = {}) {
  const { perturbation = 0.5 } = options; // Default 0.5 point change

  const baseline = calculateRiskIndex(dimensionValues);
  if (baseline.value === null) {
    return { error: 'Cannot perform sensitivity analysis with incomplete data' };
  }

  const sensitivities = {};

  for (const [dimensionId, value] of Object.entries(dimensionValues)) {
    if (value === null) continue;

    // Calculate risk with increased dimension
    const increased = { ...dimensionValues, [dimensionId]: Math.min(10, value + perturbation) };
    const riskIncreased = calculateRiskIndex(increased);

    // Calculate risk with decreased dimension
    const decreased = { ...dimensionValues, [dimensionId]: Math.max(0, value - perturbation) };
    const riskDecreased = calculateRiskIndex(decreased);

    const changeUp = riskIncreased.value - baseline.value;
    const changeDown = baseline.value - riskDecreased.value;
    const avgSensitivity = (Math.abs(changeUp) + Math.abs(changeDown)) / 2;

    sensitivities[dimensionId] = {
      baselineValue: value,
      riskImpact: {
        increase: roundTo(changeUp, 4),
        decrease: roundTo(changeDown, 4)
      },
      sensitivity: roundTo(avgSensitivity / perturbation, 4),
      elasticity: roundTo((avgSensitivity / baseline.value) / (perturbation / value), 4)
    };
  }

  // Rank dimensions by sensitivity
  const ranked = Object.entries(sensitivities)
    .sort((a, b) => b[1].sensitivity - a[1].sensitivity)
    .map(([id, data], index) => ({
      rank: index + 1,
      dimension: id,
      ...data
    }));

  return {
    baselineRisk: baseline.value,
    perturbation,
    sensitivities,
    ranking: ranked,
    mostSensitive: ranked[0]?.dimension,
    recommendations: generateSensitivityRecommendations(ranked)
  };
}

function generateSensitivityRecommendations(ranked) {
  if (ranked.length === 0) return [];

  const recommendations = [];
  const most = ranked[0];

  recommendations.push({
    priority: 'high',
    dimension: most.dimension,
    message: `Focus interventions on ${most.dimension} - this has the highest impact on overall risk`
  });

  if (ranked.length > 1) {
    const least = ranked[ranked.length - 1];
    recommendations.push({
      priority: 'info',
      dimension: least.dimension,
      message: `${least.dimension} has the least impact - improvements here will have smaller effects on overall risk`
    });
  }

  return recommendations;
}

// ============================================================================
// SCENARIO MODELING
// ============================================================================

/**
 * Model different scenarios by adjusting indicator values
 */
export function modelScenario(baseIndicators, scenarioAdjustments, normalizationRanges = {}) {
  // Apply scenario adjustments
  const adjustedIndicators = { ...baseIndicators };

  for (const [indicatorId, adjustment] of Object.entries(scenarioAdjustments)) {
    const baseValue = baseIndicators[indicatorId];
    if (baseValue !== null && baseValue !== undefined) {
      if (typeof adjustment === 'number') {
        // Absolute value
        adjustedIndicators[indicatorId] = adjustment;
      } else if (adjustment.percentage) {
        // Percentage change
        adjustedIndicators[indicatorId] = baseValue * (1 + adjustment.percentage / 100);
      } else if (adjustment.delta) {
        // Delta change
        adjustedIndicators[indicatorId] = baseValue + adjustment.delta;
      }
    }
  }

  // Calculate baseline
  const baseline = calculateCompleteRisk(baseIndicators, normalizationRanges);

  // Calculate scenario
  const scenario = calculateCompleteRisk(adjustedIndicators, normalizationRanges);

  return {
    baseline: {
      riskIndex: baseline.riskIndex,
      riskClass: baseline.riskClass.label
    },
    scenario: {
      riskIndex: scenario.riskIndex,
      riskClass: scenario.riskClass.label
    },
    change: {
      absolute: roundTo(scenario.riskIndex - baseline.riskIndex, 4),
      percentage: roundTo(((scenario.riskIndex - baseline.riskIndex) / baseline.riskIndex) * 100, 2),
      classChange: baseline.riskClass.label !== scenario.riskClass.label
    },
    adjustments: scenarioAdjustments,
    timestamp: new Date().toISOString()
  };
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(baseIndicators, scenarios, normalizationRanges = {}) {
  const baseline = calculateCompleteRisk(baseIndicators, normalizationRanges);

  const comparisons = scenarios.map(scenario => ({
    name: scenario.name,
    ...modelScenario(baseIndicators, scenario.adjustments, normalizationRanges)
  }));

  // Rank scenarios by risk reduction
  const ranked = comparisons.sort((a, b) => a.scenario.riskIndex - b.scenario.riskIndex);

  return {
    baseline: {
      riskIndex: baseline.riskIndex,
      riskClass: baseline.riskClass.label
    },
    scenarios: comparisons,
    bestScenario: ranked[0]?.name,
    worstScenario: ranked[ranked.length - 1]?.name,
    ranking: ranked.map((s, i) => ({ rank: i + 1, name: s.name, riskIndex: s.scenario.riskIndex }))
  };
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Analyze trends in risk over time
 */
export function analyzeTrend(historicalResults) {
  if (!historicalResults || historicalResults.length < 2) {
    return { error: 'Insufficient data for trend analysis (need at least 2 periods)' };
  }

  const riskValues = historicalResults.map(r => r.riskIndex).filter(v => v !== null);
  const stats = calculateStatistics(riskValues);

  // Calculate trend direction
  const n = riskValues.length;
  const xMean = (n - 1) / 2;
  const yMean = stats.mean;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (riskValues[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Determine trend
  let direction, label;
  if (Math.abs(slope) < 0.05) {
    direction = 'stable';
    label = 'Stable';
  } else if (slope > 0) {
    direction = 'increasing';
    label = slope > 0.2 ? 'Rapidly Increasing' : 'Gradually Increasing';
  } else {
    direction = 'decreasing';
    label = slope < -0.2 ? 'Rapidly Decreasing' : 'Gradually Decreasing';
  }

  // Calculate period-over-period changes
  const changes = [];
  for (let i = 1; i < riskValues.length; i++) {
    changes.push({
      period: i,
      from: riskValues[i - 1],
      to: riskValues[i],
      change: riskValues[i] - riskValues[i - 1],
      percentageChange: ((riskValues[i] - riskValues[i - 1]) / riskValues[i - 1]) * 100
    });
  }

  return {
    periods: n,
    statistics: stats,
    trend: {
      direction,
      label,
      slope: roundTo(slope, 4),
      interpretation: slope > 0
        ? 'Risk is trending upward'
        : slope < 0
          ? 'Risk is trending downward'
          : 'Risk is relatively stable'
    },
    changes,
    forecast: {
      nextPeriod: roundTo(riskValues[n - 1] + slope, 2),
      confidence: 'Based on linear extrapolation'
    }
  };
}

// ============================================================================
// COMPLETE CALCULATION PIPELINE
// ============================================================================

/**
 * Complete calculation from raw indicators to final risk with full details
 */
export function calculateCompleteRisk(rawIndicators, normalizationRanges = {}, options = {}) {
  const startTime = Date.now();

  // Step 1: Process and normalize indicators
  const indicatorResult = processAllIndicators(rawIndicators, normalizationRanges);
  const normalizedIndicators = indicatorResult.indicators;

  // Step 2: Calculate components
  const componentResult = calculateAllComponents(normalizedIndicators, options);
  const components = componentResult.components;

  // Step 3: Calculate categories
  const categoryResult = calculateAllCategories(components, options);
  const categories = categoryResult.categories;

  // Step 4: Calculate dimensions
  const dimensionResult = calculateAllDimensions(categories, options);
  const dimensions = dimensionResult.dimensions;

  // Step 5: Calculate final risk index
  const riskResult = calculateRiskIndex(dimensions, options);
  const riskIndex = riskResult.value;
  const riskClass = classifyRisk(riskIndex);

  // Step 6: Calculate warning score
  const warningResult = calculateWarningScore(
    dimensions.HAZARD,
    dimensions.VULNERABILITY,
    dimensions.LACK_OF_COPING_CAPACITY
  );

  // Build complete result
  const result = {
    // Core results
    indicators: normalizedIndicators,
    components,
    categories,
    dimensions,
    riskIndex,
    riskClass,

    // Warning
    warningScore: warningResult.value,
    warningLevel: classifyWarning(warningResult.value),

    // Metadata
    calculatedAt: new Date().toISOString(),
    calculationTime: Date.now() - startTime,

    // Quality metrics
    dataCompleteness: indicatorResult.completeness,
    errors: indicatorResult.errors,
    warnings: indicatorResult.warnings
  };

  // Calculate confidence
  result.confidence = calculateConfidence(result);

  return result;
}

/**
 * Calculate risk for multiple admin units (batch processing)
 */
export function calculateBatchRisk(adminUnitData, options = {}) {
  const startTime = Date.now();

  // First pass: collect all values to determine normalization ranges
  const allValues = {};

  for (const unit of adminUnitData) {
    for (const [indicatorId, value] of Object.entries(unit.indicators || {})) {
      if (!allValues[indicatorId]) {
        allValues[indicatorId] = [];
      }
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        allValues[indicatorId].push(numValue);
      }
    }
  }

  // Calculate normalization reference values
  const referenceData = {};
  for (const [indicatorId, values] of Object.entries(allValues)) {
    referenceData[indicatorId] = values;
  }

  // Calculate risk for each admin unit
  const results = adminUnitData.map(unit => ({
    adminUnitId: unit.adminUnitId,
    adminUnitCode: unit.adminUnitCode,
    adminUnitName: unit.adminUnitName,
    ...calculateCompleteRisk(unit.indicators || {}, referenceData, options)
  }));

  // Calculate summary statistics
  const riskValues = results.map(r => r.riskIndex).filter(v => v !== null);
  const stats = calculateStatistics(riskValues);

  // Distribution by risk class
  const distribution = {
    veryLow: results.filter(r => r.riskClass?.class === 'very_low').length,
    low: results.filter(r => r.riskClass?.class === 'low').length,
    medium: results.filter(r => r.riskClass?.class === 'medium').length,
    high: results.filter(r => r.riskClass?.class === 'high').length,
    veryHigh: results.filter(r => r.riskClass?.class === 'very_high').length,
    unknown: results.filter(r => r.riskClass?.class === 'unknown').length
  };

  return {
    results,
    summary: {
      totalUnits: adminUnitData.length,
      calculatedUnits: results.filter(r => r.riskIndex !== null).length,
      statistics: stats,
      distribution
    },
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round value to specified decimal places
 */
export function roundTo(value, decimals = 2) {
  if (value === null || value === undefined) return null;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format calculation results for display
 */
export function formatResults(results, options = {}) {
  const { decimals = 2, includeDetails = false } = options;

  const format = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'number') return roundTo(obj, decimals);
    if (Array.isArray(obj)) return obj.map(format);
    if (typeof obj === 'object') {
      const formatted = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!includeDetails && (key === 'details' || key === 'indicatorValues')) continue;
        formatted[key] = format(value);
      }
      return formatted;
    }
    return obj;
  };

  return format(results);
}

/**
 * Compare two admin units
 */
export function compareAdminUnits(unit1Results, unit2Results) {
  const compare = (val1, val2) => {
    if (val1 === null || val2 === null) return null;
    return {
      unit1: val1,
      unit2: val2,
      difference: roundTo(val1 - val2, 4),
      percentageDiff: roundTo(((val1 - val2) / val2) * 100, 2)
    };
  };

  return {
    riskIndex: compare(unit1Results.riskIndex, unit2Results.riskIndex),
    dimensions: {
      hazard: compare(unit1Results.dimensions?.HAZARD, unit2Results.dimensions?.HAZARD),
      vulnerability: compare(unit1Results.dimensions?.VULNERABILITY, unit2Results.dimensions?.VULNERABILITY),
      lackOfCopingCapacity: compare(unit1Results.dimensions?.LACK_OF_COPING_CAPACITY, unit2Results.dimensions?.LACK_OF_COPING_CAPACITY)
    },
    confidence: compare(unit1Results.confidence?.score, unit2Results.confidence?.score),
    higherRisk: unit1Results.riskIndex > unit2Results.riskIndex ? 'unit1' : 'unit2'
  };
}

/**
 * Get metadata about an indicator
 */
export function getIndicatorInfo(indicatorId) {
  return INDICATOR_DEFINITIONS[indicatorId] || null;
}

/**
 * Get metadata about a component
 */
export function getComponentInfo(componentId) {
  return COMPONENT_DEFINITIONS[componentId] || null;
}

/**
 * Get all indicators for a component
 */
export function getComponentIndicators(componentId) {
  const component = COMPONENT_DEFINITIONS[componentId];
  if (!component) return [];
  return component.indicators.map(id => INDICATOR_DEFINITIONS[id]).filter(Boolean);
}

/**
 * Get all components for a category
 */
export function getCategoryComponents(categoryId) {
  const category = CATEGORY_DEFINITIONS[categoryId];
  if (!category) return [];
  return category.components.map(id => COMPONENT_DEFINITIONS[id]).filter(Boolean);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Configuration
  ENGINE_CONFIG,

  // Cache management
  clearCache,

  // Statistical utilities
  calculateStatistics,
  calculateZScore,
  coefficientOfVariation,

  // Normalization
  normalizeMinMax,
  normalizeZScore,
  normalizePercentile,
  normalizeLog,
  normalizeValue,

  // Aggregation
  arithmeticMean,
  geometricMean,
  harmonicMean,
  maximum,
  minimum,
  median,
  sum,
  aggregate,

  // Indicator Processing
  processIndicator,
  processAllIndicators,

  // Component Calculation
  calculateComponent,
  calculateAllComponents,

  // Category Calculation
  calculateCategory,
  calculateAllCategories,

  // Dimension Calculation
  calculateDimension,
  calculateAllDimensions,

  // Risk Calculation
  calculateRiskIndex,
  classifyRisk,

  // Warning Calculation
  calculateWarningScore,
  classifyWarning,

  // Confidence
  calculateConfidence,

  // Sensitivity Analysis
  sensitivityAnalysis,

  // Scenario Modeling
  modelScenario,
  compareScenarios,

  // Trend Analysis
  analyzeTrend,

  // Complete Pipeline
  calculateCompleteRisk,
  calculateBatchRisk,

  // Comparison
  compareAdminUnits,

  // Utilities
  roundTo,
  formatResults,
  getIndicatorInfo,
  getComponentInfo,
  getComponentIndicators,
  getCategoryComponents
};
