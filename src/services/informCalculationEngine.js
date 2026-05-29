/**
 * INFORM CALCULATION ENGINE — Tanzania Subnational Model
 *
 * Implements INFORM Concept and Methodology v2017 (JRC, Vernaccini).
 *
 * Pipeline (PDF §6):
 *   1. Per-indicator transform (log / sqrt / sqr) if declared
 *   2. Min-max normalization to 0–10 using refMin/refMax
 *   3. Polarity inversion at INDICATOR level — POSITIVE indicators (HDI,
 *      capacity, etc.) become 10 - x so that "higher = more risk" semantics
 *      hold throughout aggregation. (PDF Eq. 3, applied at ingest, NOT at
 *      dimension level — fixes the historic double-inversion bug.)
 *   4. Indicator → Component via MAX / MEAN
 *   5. Component → Category via MAX / MEAN / WMEAN / GEOMEAN (scaled)
 *      per PDF Tables 5, 7, 11, 13, 16, 18
 *   6. Category → Dimension via INFORM scaled geometric mean (Box 6 /
 *      footnote 33)
 *   7. Risk = (HAZARD × VULNERABILITY × LCC)^(1/3)  (PDF Eq. 1)
 *
 * Coping Capacity dimension is named "Lack of Coping Capacity" in the risk
 * formula — its indicators are POSITIVE polarity (higher capacity = lower
 * risk), so they are inverted at ingest. The dimension score IS LCC; no
 * second inversion happens.
 *
 * Also implements:
 *   - Lack of Reliability Index (LRI) per PDF §3.6.1
 *   - Regional fallback for missing district indicators (with confidence
 *     penalty)
 *   - Per-dimension and per-category 5-class thresholds (Tanzania + global)
 */

import {
  COMPLETE_HIERARCHY,
  ALL_INDICATORS,
  ALL_COMPONENTS,
  TANZANIA_THRESHOLDS,
  INFORM_GLOBAL_THRESHOLDS,
  RISK_CLASS_LABELS
} from './informIndicatorDefinitions';

// ============================================================================
// PRIMITIVES
// ============================================================================

export function roundTo(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const m = Math.pow(10, decimals);
  return Math.round(value * m) / m;
}

export function clamp(value, min = 0, max = 10) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(v) {
  return v !== null && v !== undefined && !Number.isNaN(v) && Number.isFinite(v);
}

// ============================================================================
// NORMALIZATION (PDF §6, Equations 2 + 3)
// ============================================================================

/**
 * Apply pre-normalization transform (PDF §6.2).
 */
function applyTransform(value, transform) {
  switch (transform) {
    case 'log':    return value > 0 ? Math.log(value) : null;
    case 'log1p':  return value >= 0 ? Math.log1p(value) : null;
    case 'sqrt':   return value >= 0 ? Math.sqrt(value) : null;
    case 'sqr':    return value * value;
    case 'none':
    default:       return value;
  }
}

/**
 * Min-max normalize a raw indicator value to 0–10, then apply polarity
 * inversion if the indicator is POSITIVE polarity.
 *
 *   Equation 2: x_norm = (x - x_min) / (x_max - x_min) × 10
 *   Equation 3: x_norm_inv = 10 - x_norm  (applied if POSITIVE polarity)
 *
 * @returns number in [0, 10] OR null if input is invalid
 */
export function normalizeValue(rawValue, indicatorId) {
  if (!isFiniteNumber(rawValue)) return null;
  const def = ALL_INDICATORS[indicatorId];
  if (!def) {
    // Unknown indicator — assume already 0-10
    return clamp(rawValue);
  }

  const { refMin = 0, refMax = 10, transform = 'none', polarity = 'NEGATIVE' } = def;

  let v = applyTransform(rawValue, transform);
  if (!isFiniteNumber(v)) return null;
  const lo = applyTransform(refMin, transform);
  const hi = applyTransform(refMax, transform);
  if (!isFiniteNumber(lo) || !isFiniteNumber(hi) || hi === lo) {
    // Degenerate bounds — fall back to clamp
    return clamp(rawValue);
  }

  let norm = ((v - lo) / (hi - lo)) * 10;
  norm = clamp(norm);

  // Polarity: POSITIVE means "higher raw = lower risk", so invert.
  // Result is always a "higher = more risk" value.
  if (polarity === 'POSITIVE') {
    norm = 10 - norm;
  }

  return norm;
}

// ============================================================================
// AGGREGATORS
// ============================================================================

export function maxAggregation(values) {
  const v = values.filter(isFiniteNumber);
  return v.length === 0 ? null : Math.max(...v);
}

export function meanAggregation(values) {
  const v = values.filter(isFiniteNumber);
  return v.length === 0 ? null : v.reduce((s, x) => s + x, 0) / v.length;
}

export function weightedMean(pairs) {
  // pairs: Array<{ value, weight }>
  const valid = pairs.filter(p => isFiniteNumber(p.value) && isFiniteNumber(p.weight) && p.weight > 0);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return null;
  return valid.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
}

/**
 * INFORM scaled geometric mean (PDF Box 6, footnote 33; Excel formula
 * `=(10 - GEOMEAN(((10 - val1)/10*9 + 1), …)) / 9 * 10`).
 *
 * Inputs and outputs are on the 0–10 scale ("higher = more risk").
 * Behaviour: a low input drags the result downward (geometric), but the
 * dynamic range is preserved on the 0–10 scale.
 */
export function informScaledGeomean(values, weights = null) {
  const valid = [];
  const ws = [];
  values.forEach((v, i) => {
    if (isFiniteNumber(v)) {
      valid.push(v);
      ws.push(weights ? (weights[i] ?? 1) : 1);
    }
  });
  if (valid.length === 0) return null;

  // Step 1: rescale 0–10 → 1–10 via inversion
  const scaled = valid.map(v => ((10 - v) / 10 * 9) + 1);

  // Step 2: weighted geometric mean
  const totalW = ws.reduce((s, w) => s + w, 0);
  const logSum = scaled.reduce((acc, val, i) => acc + Math.log(val) * ws[i], 0);
  const geo = Math.exp(logSum / totalW);

  // Step 3: rescale back to 0–10
  return (10 - geo) / 9 * 10;
}

/** Plain (unscaled) geometric mean — used for diagnostic / extension code only. */
export function geometricMean(values) {
  const v = values.filter(x => isFiniteNumber(x) && x > 0);
  if (v.length === 0) return null;
  return Math.exp(v.reduce((s, x) => s + Math.log(x), 0) / v.length);
}

export function aggregate(values, method, weights = null) {
  switch ((method || 'MEAN').toUpperCase()) {
    case 'MAX':     return maxAggregation(values);
    case 'GEOMEAN': return informScaledGeomean(values, weights);
    case 'WMEAN':   return weightedMean(values.map((v, i) => ({ value: v, weight: weights ? weights[i] : 1 })));
    case 'MEAN':
    case 'ARITHMETIC_MEAN':
    case 'AVG':
    default:        return meanAggregation(values);
  }
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

/**
 * Classify a 0–10 score using a per-level threshold array
 * [VLmax, Lmax, Mmax, Hmax, VHmax]. VH extends to the array's last value
 * (10 by convention). Returns the same shape as the historic API.
 */
export function classifyByThresholds(score, thresholds) {
  if (!isFiniteNumber(score)) return null;
  for (let i = 0; i < thresholds.length; i++) {
    if (score < thresholds[i]) {
      return { ...RISK_CLASS_LABELS[i], min: i === 0 ? 0 : thresholds[i - 1], max: thresholds[i] };
    }
  }
  // Score >= last threshold → Very High
  return { ...RISK_CLASS_LABELS[RISK_CLASS_LABELS.length - 1],
           min: thresholds[thresholds.length - 2] ?? 0, max: 10 };
}

export function classifyRisk(score, scheme = 'TANZANIA') {
  const table = scheme === 'GLOBAL' ? INFORM_GLOBAL_THRESHOLDS : TANZANIA_THRESHOLDS;
  return classifyByThresholds(score, table.RISK);
}

export function classifyDimension(score, dimension, scheme = 'TANZANIA') {
  const table = scheme === 'GLOBAL' ? INFORM_GLOBAL_THRESHOLDS : TANZANIA_THRESHOLDS;
  return classifyByThresholds(score, table[dimension] ?? table.RISK);
}

export function getRiskColor(score, scheme = 'TANZANIA') {
  return classifyRisk(score, scheme)?.color ?? '#666';
}

// Historic API: expose flat RISK_CLASSES (uses RISK thresholds)
export const RISK_CLASSES = TANZANIA_THRESHOLDS.RISK.map((max, i) => ({
  min: i === 0 ? 0 : TANZANIA_THRESHOLDS.RISK[i - 1],
  max,
  ...RISK_CLASS_LABELS[i]
}));

// ============================================================================
// COMPONENT / CATEGORY / DIMENSION CALCULATION
// ============================================================================

function getIndicatorValueRaw(indicatorValues, indId) {
  const data = indicatorValues[indId];
  if (data === undefined || data === null) return null;
  const v = (typeof data === 'object' && 'value' in data) ? data.value : data;
  return isFiniteNumber(v) ? Number(v) : null;
}

export function calculateComponent(componentId, indicatorValues) {
  const component = ALL_COMPONENTS[componentId];
  if (!component) return { score: null, indicatorScores: {}, coverage: 0, totalIndicators: 0, indicatorCount: 0 };

  const indicatorScores = {};
  const values = [];

  for (const indId of component.indicators) {
    const raw = getIndicatorValueRaw(indicatorValues, indId);
    if (raw === null) continue;
    const normalized = normalizeValue(raw, indId);
    if (normalized === null) continue;
    indicatorScores[indId] = roundTo(normalized, 3);
    values.push(normalized);
  }

  const score = aggregate(values, component.aggregation);
  const coverage = component.indicators.length > 0
    ? (values.length / component.indicators.length) * 100
    : 0;

  return {
    score: roundTo(score, 1),
    indicatorScores,
    coverage: roundTo(coverage, 0),
    indicatorCount: values.length,
    totalIndicators: component.indicators.length
  };
}

export function calculateCategory(dimensionId, categoryId, indicatorValues) {
  const dim = COMPLETE_HIERARCHY[dimensionId];
  const cat = dim?.categories?.[categoryId];
  if (!cat) return { score: null, components: {}, coverage: 0, componentCount: 0, totalComponents: 0 };

  const componentResults = {};
  const scoreValues = [];
  const scoreWeights = [];

  for (const [compId, comp] of Object.entries(cat.components)) {
    const result = calculateComponent(compId, indicatorValues);
    componentResults[compId] = { name: comp.name, code: comp.code, weight: comp.weight ?? null, ...result };
    if (result.score !== null) {
      scoreValues.push(result.score);
      scoreWeights.push(comp.weight ?? 1);
    }
  }

  // WMEAN consumes (value,weight) pairs; everything else just gets the values.
  let score;
  if ((cat.aggregation || '').toUpperCase() === 'WMEAN') {
    score = weightedMean(scoreValues.map((v, i) => ({ value: v, weight: scoreWeights[i] })));
  } else if ((cat.aggregation || '').toUpperCase() === 'GEOMEAN') {
    // GEOMEAN at category level uses the scaled formula; weights ignored
    // unless explicitly modeled (currently equal).
    score = informScaledGeomean(scoreValues);
  } else {
    score = aggregate(scoreValues, cat.aggregation);
  }

  const totalComponents = Object.keys(cat.components).length;
  return {
    score: roundTo(score, 1),
    name: cat.name,
    components: componentResults,
    coverage: totalComponents > 0 ? roundTo((scoreValues.length / totalComponents) * 100, 0) : 0,
    componentCount: scoreValues.length,
    totalComponents
  };
}

export function calculateDimension(dimensionId, indicatorValues) {
  const dim = COMPLETE_HIERARCHY[dimensionId];
  if (!dim) return { score: null, categories: {} };

  const categoryResults = {};
  const scoreValues = [];
  const scoreWeights = [];

  for (const [catId, cat] of Object.entries(dim.categories)) {
    const result = calculateCategory(dimensionId, catId, indicatorValues);
    categoryResults[catId] = result;
    if (result.score !== null) {
      scoreValues.push(result.score);
      scoreWeights.push(cat.weight ?? 0.5);
    }
  }

  let score;
  const method = (dim.aggregation || 'GEOMEAN').toUpperCase();
  if (scoreValues.length === 0) {
    score = null;
  } else if (scoreValues.length === 1) {
    score = scoreValues[0];
  } else if (method === 'MAX') {
    score = maxAggregation(scoreValues);
  } else if (method === 'MEAN') {
    score = meanAggregation(scoreValues);
  } else {
    // GEOMEAN — INFORM scaled, with category weights
    score = informScaledGeomean(scoreValues, scoreWeights);
  }

  return {
    score: roundTo(score, 1),
    name: dim.name,
    code: dim.code,
    color: dim.color,
    categories: categoryResults
  };
}

// ============================================================================
// LACK OF RELIABILITY INDEX (PDF §3.6.1)
//
// LRI scores data trust on a 0–10 scale. Three components:
//   1. Missing data — total number of indicators absent (incl. estimated)
//   2. Out-of-date data — average years older than reference year per indicator
//   3. Conflict status — country/region in HIIK level 4 or 5 → +30% aggravator
//
// First two are min-max normalized 0–10; conflict is multiplicative.
// ============================================================================

export function calculateLRI({
  totalIndicators,
  missingCount,
  yearGaps = [],
  inConflict = false,
  scheme = 'TANZANIA'
} = {}) {
  if (!isFiniteNumber(totalIndicators) || totalIndicators <= 0) {
    return { score: null, classification: null, components: {} };
  }

  // Component 1: missing-data — normalized against ranges seen in PDF Annex
  // (typical: 0–25% missing → 0–10 LRI). 50% missing pegs at 10.
  const missingPct = (missingCount / totalIndicators) * 100;
  const missingScore = clamp((missingPct / 50) * 10);

  // Component 2: out-of-date — avg years gap; 0 yrs = 0, 10+ yrs = 10
  const validGaps = yearGaps.filter(isFiniteNumber);
  const avgGap = validGaps.length > 0 ? validGaps.reduce((s, x) => s + x, 0) / validGaps.length : 0;
  const stalenessScore = clamp((avgGap / 10) * 10);

  // Combine first two with arithmetic mean (PDF leaves details open;
  // we treat both equally weighted per Figure 4 layout)
  let lri = (missingScore + stalenessScore) / 2;

  // Conflict aggravator: +30% (PDF §3.6.1 final paragraph)
  if (inConflict) {
    lri = clamp(lri * 1.3);
  }

  const labels = ['Very Low (most reliable)', 'Low', 'Medium', 'High', 'Very High (least reliable)'];
  const thresholds = [2, 4, 6, 8, 10];
  let classification = labels[labels.length - 1];
  for (let i = 0; i < thresholds.length; i++) {
    if (lri < thresholds[i]) { classification = labels[i]; break; }
  }

  return {
    score: roundTo(lri, 2),
    classification,
    components: {
      missingPct: roundTo(missingPct, 1),
      missingScore: roundTo(missingScore, 2),
      avgYearGap: roundTo(avgGap, 1),
      stalenessScore: roundTo(stalenessScore, 2),
      conflictAggravator: inConflict
    }
  };
}

// ============================================================================
// REGIONAL FALLBACK
//
// When district-level data is missing, substitute regional (ADM1) average,
// then national average. Each substitution lowers confidence.
// Returns: { resolvedValues, substitutionCount, substitutionLog }
// ============================================================================

export function resolveWithFallback(districtValues = {}, regionalValues = {}, nationalValues = {}) {
  const resolved = {};
  const log = [];

  for (const indId of Object.keys(ALL_INDICATORS)) {
    const districtRaw = getIndicatorValueRaw(districtValues, indId);
    if (districtRaw !== null) {
      resolved[indId] = { value: districtRaw, source: 'district', confidence: 1.0 };
      continue;
    }
    const regionalRaw = getIndicatorValueRaw(regionalValues, indId);
    if (regionalRaw !== null) {
      resolved[indId] = { value: regionalRaw, source: 'regional', confidence: 0.7 };
      log.push({ indId, source: 'regional' });
      continue;
    }
    const nationalRaw = getIndicatorValueRaw(nationalValues, indId);
    if (nationalRaw !== null) {
      resolved[indId] = { value: nationalRaw, source: 'national', confidence: 0.4 };
      log.push({ indId, source: 'national' });
    }
  }

  return {
    resolvedValues: resolved,
    substitutionCount: log.length,
    substitutionLog: log
  };
}

// ============================================================================
// MAIN: full INFORM Risk calculation
// ============================================================================

/**
 * Compute the full INFORM Risk for a single location.
 *
 * @param indicatorValues  { indId: number | {value, confidence?} }
 * @param opts             { scheme?: 'TANZANIA' | 'GLOBAL',
 *                           informCoreOnly?: boolean,
 *                           lriContext?: { yearGaps, inConflict } }
 */
export function calculateINFORMRisk(indicatorValues, opts = {}) {
  const { scheme = 'TANZANIA', informCoreOnly = false, lriContext = null } = opts;

  // If informCoreOnly, filter inputs to those flagged informCore
  const filteredValues = informCoreOnly
    ? Object.fromEntries(
        Object.entries(indicatorValues).filter(([id]) => ALL_INDICATORS[id]?.informCore)
      )
    : indicatorValues;

  const result = {
    dimensions: {},
    risk: null,
    classification: null,
    formula: null,
    lri: null,
    metadata: {
      calculatedAt: new Date().toISOString(),
      methodology: scheme === 'GLOBAL' ? 'INFORM 2017 (Global)' : 'INFORM 2017 — Tanzania Subnational',
      scheme,
      informCoreOnly,
      indicatorCount: 0,
      totalIndicators: 0,
      coverage: 0
    }
  };

  let totalIndicators = 0;
  let providedIndicators = 0;
  const dimensionScores = {};

  for (const dimId of Object.keys(COMPLETE_HIERARCHY)) {
    const dimResult = calculateDimension(dimId, filteredValues);
    dimResult.classification = dimResult.score !== null
      ? classifyDimension(dimResult.score, dimId, scheme)
      : null;
    result.dimensions[dimId] = dimResult;
    if (dimResult.score !== null) dimensionScores[dimId] = dimResult.score;

    for (const cat of Object.values(dimResult.categories)) {
      for (const comp of Object.values(cat.components)) {
        totalIndicators += comp.totalIndicators || 0;
        providedIndicators += comp.indicatorCount || 0;
      }
      cat.classification = cat.score !== null ? classifyDimension(cat.score, dimId, scheme) : null;
    }
  }

  result.metadata.indicatorCount = providedIndicators;
  result.metadata.totalIndicators = totalIndicators;
  result.metadata.coverage = totalIndicators > 0
    ? roundTo((providedIndicators / totalIndicators) * 100, 0)
    : 0;

  // Final RISK = ∛(H × V × LCC) — Excel: =ROUND(Z^(1/3) * AK^(1/3) * AU^(1/3), 1)
  const H = dimensionScores.HAZARD;
  const V = dimensionScores.VULNERABILITY;
  const LCC = dimensionScores.COPING_CAPACITY;
  if (isFiniteNumber(H) && isFiniteNumber(V) && isFiniteNumber(LCC) && H > 0 && V > 0 && LCC > 0) {
    const risk = Math.pow(H, 1 / 3) * Math.pow(V, 1 / 3) * Math.pow(LCC, 1 / 3);
    result.risk = roundTo(risk, 1);  // Excel rounds to 1 decimal
    result.classification = classifyRisk(result.risk, scheme);
    result.formula = {
      expression: `Risk = ${roundTo(H, 1)}^(1/3) × ${roundTo(V, 1)}^(1/3) × ${roundTo(LCC, 1)}^(1/3)`,
      H: roundTo(H, 1),
      V: roundTo(V, 1),
      LCC: roundTo(LCC, 1),
      result: result.risk
    };
  }

  // LRI
  if (lriContext) {
    result.lri = calculateLRI({
      totalIndicators,
      missingCount: totalIndicators - providedIndicators,
      yearGaps: lriContext.yearGaps,
      inConflict: lriContext.inConflict,
      scheme
    });
  }

  return result;
}

/**
 * Convenience: calculate risk for a district using regional + national
 * fallback for missing indicators.
 */
export function calculateRiskWithFallback(districtValues, regionalValues, nationalValues, opts = {}) {
  const { resolvedValues, substitutionCount, substitutionLog } = resolveWithFallback(
    districtValues, regionalValues, nationalValues
  );
  const result = calculateINFORMRisk(resolvedValues, opts);
  result.metadata.fallback = {
    substitutionCount,
    substitutionLog
  };
  return result;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateIndicatorValues(indicatorValues) {
  const errors = [];
  const warnings = [];
  const coverage = { HAZARD: 0, VULNERABILITY: 0, COPING_CAPACITY: 0 };

  for (const [indId, data] of Object.entries(indicatorValues)) {
    const def = ALL_INDICATORS[indId];
    const v = (typeof data === 'object' && data !== null && 'value' in data) ? data.value : data;
    if (!def) { warnings.push(`Unknown indicator: ${indId}`); continue; }
    if (v === null || v === undefined) continue;
    if (Number.isNaN(Number(v))) { errors.push(`Invalid value for ${def.name}: not a number`); continue; }
    coverage[def.dimension] = (coverage[def.dimension] || 0) + 1;
  }

  const hasH = coverage.HAZARD > 0;
  const hasV = coverage.VULNERABILITY > 0;
  const hasC = coverage.COPING_CAPACITY > 0;
  if (!hasH) warnings.push('No Hazard indicators provided');
  if (!hasV) warnings.push('No Vulnerability indicators provided');
  if (!hasC) warnings.push('No Coping Capacity indicators provided');

  return {
    isValid: errors.length === 0 && hasH && hasV && hasC,
    canCalculate: hasH && hasV && hasC,
    errors,
    warnings,
    coverage: {
      hazard: coverage.HAZARD,
      vulnerability: coverage.VULNERABILITY,
      copingCapacity: coverage.COPING_CAPACITY,
      total: Object.values(coverage).reduce((s, x) => s + x, 0)
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  COMPLETE_HIERARCHY,
  ALL_INDICATORS,
  ALL_COMPONENTS,
  TANZANIA_THRESHOLDS,
  INFORM_GLOBAL_THRESHOLDS,
  RISK_CLASS_LABELS
};

export default {
  calculateINFORMRisk,
  calculateRiskWithFallback,
  calculateDimension,
  calculateCategory,
  calculateComponent,
  calculateLRI,
  resolveWithFallback,
  validateIndicatorValues,
  normalizeValue,
  classifyRisk,
  classifyDimension,
  classifyByThresholds,
  getRiskColor,
  roundTo,
  clamp,
  maxAggregation,
  meanAggregation,
  weightedMean,
  informScaledGeomean,
  geometricMean,
  RISK_CLASSES,
  COMPLETE_HIERARCHY,
  ALL_INDICATORS,
  ALL_COMPONENTS,
  TANZANIA_THRESHOLDS,
  INFORM_GLOBAL_THRESHOLDS,
  RISK_CLASS_LABELS
};
