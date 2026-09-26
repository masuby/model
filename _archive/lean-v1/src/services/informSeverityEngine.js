/**
 * INFORM SEVERITY ENGINE — Tanzania Operational Model
 *
 * Authentic implementation of the IASC / JRC INFORM Severity Index v6 (2023)
 * methodology.
 *
 * Pipeline:
 *   1. Per-indicator transform (log1p for skewed counts)
 *   2. Min-max normalization to a 0–5 scale (NOT 0–10 like Risk) using
 *      refMin/refMax declared on each indicator
 *   3. Polarity inversion at indicator level for POSITIVE-polarity indicators
 *      (e.g. data_availability — higher raw = lower severity)
 *   4. Indicator → Component via arithmetic mean
 *   5. Component → Dimension via arithmetic mean
 *   6. Severity = arithmetic mean of (Impact, Conditions, Complexity)
 *      per the IASC spec (NOT geometric mean — that is Risk only).
 *   7. Classification: 1=Very Low ... 5=Extreme
 *
 * Connection to Module 02 INFORM Risk:
 *   The CONDITIONS dimension takes a `baseline_inform_risk` indicator. Pass
 *   the Risk score (0–10) for the affected area and the engine rescales it.
 */

import {
  SEVERITY_HIERARCHY,
  SEVERITY_INDICATORS,
  SEVERITY_COMPONENTS,
  SEVERITY_CLASS_LABELS,
  SEVERITY_THRESHOLDS
} from './informSeverityDefinitions';

const SEVERITY_SCALE_MAX = 5;

// ============================================================================
// PRIMITIVES
// ============================================================================

export function roundTo(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const m = Math.pow(10, decimals);
  return Math.round(value * m) / m;
}

function clampToScale(v, max = SEVERITY_SCALE_MAX) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return Math.min(max, Math.max(0, v));
}

function isFiniteNumber(v) {
  return v !== null && v !== undefined && !Number.isNaN(v) && Number.isFinite(v);
}

function applyTransform(value, transform) {
  switch (transform) {
    case 'log1p': return value >= 0 ? Math.log1p(value) : null;
    case 'log':   return value > 0 ? Math.log(value) : null;
    case 'sqrt':  return value >= 0 ? Math.sqrt(value) : null;
    case 'none':
    default:      return value;
  }
}

// ============================================================================
// NORMALIZATION TO 0–5
// ============================================================================

export function normalizeSeverityIndicator(rawValue, indicatorId) {
  if (!isFiniteNumber(rawValue)) return null;
  const def = SEVERITY_INDICATORS[indicatorId];
  if (!def) return clampToScale(rawValue);

  const { refMin = 0, refMax = SEVERITY_SCALE_MAX, transform = 'none', polarity = 'NEGATIVE' } = def;

  const v = applyTransform(rawValue, transform);
  if (!isFiniteNumber(v)) return null;
  const lo = applyTransform(refMin, transform);
  const hi = applyTransform(refMax, transform);
  if (!isFiniteNumber(lo) || !isFiniteNumber(hi) || hi === lo) {
    return clampToScale(rawValue);
  }

  let norm = ((v - lo) / (hi - lo)) * SEVERITY_SCALE_MAX;
  norm = clampToScale(norm);
  if (polarity === 'POSITIVE') norm = SEVERITY_SCALE_MAX - norm;
  return norm;
}

// ============================================================================
// AGGREGATORS
// ============================================================================

export function meanAggregation(values) {
  const v = values.filter(isFiniteNumber);
  return v.length === 0 ? null : v.reduce((s, x) => s + x, 0) / v.length;
}

export function maxAggregation(values) {
  const v = values.filter(isFiniteNumber);
  return v.length === 0 ? null : Math.max(...v);
}

// ============================================================================
// COMPONENT / DIMENSION / SEVERITY CALCULATION
// ============================================================================

function getIndicatorRaw(indicatorValues, indId) {
  const d = indicatorValues[indId];
  if (d === undefined || d === null) return null;
  const v = (typeof d === 'object' && 'value' in d) ? d.value : d;
  return isFiniteNumber(v) ? Number(v) : null;
}

export function calculateSeverityComponent(componentId, indicatorValues) {
  const component = SEVERITY_COMPONENTS[componentId];
  if (!component) return { score: null, indicatorScores: {}, coverage: 0, indicatorCount: 0, totalIndicators: 0 };

  const indicatorScores = {};
  const values = [];
  for (const indId of component.indicators) {
    const raw = getIndicatorRaw(indicatorValues, indId);
    if (raw === null) continue;
    const norm = normalizeSeverityIndicator(raw, indId);
    if (norm === null) continue;
    indicatorScores[indId] = roundTo(norm, 3);
    values.push(norm);
  }

  const score = component.aggregation === 'MAX'
    ? maxAggregation(values)
    : meanAggregation(values);

  return {
    score: roundTo(score, 2),
    indicatorScores,
    coverage: component.indicators.length > 0 ? roundTo((values.length / component.indicators.length) * 100, 0) : 0,
    indicatorCount: values.length,
    totalIndicators: component.indicators.length
  };
}

export function calculateSeverityDimension(dimensionId, indicatorValues) {
  const dim = SEVERITY_HIERARCHY[dimensionId];
  if (!dim) return { score: null, components: {} };

  const componentResults = {};
  const scores = [];
  for (const [compId, comp] of Object.entries(dim.components)) {
    const result = calculateSeverityComponent(compId, indicatorValues);
    componentResults[compId] = { name: comp.name, code: comp.code, ...result };
    if (result.score !== null) scores.push(result.score);
  }
  const totalComponents = Object.keys(dim.components).length;
  return {
    score: roundTo(meanAggregation(scores), 2),
    name: dim.name,
    code: dim.code,
    color: dim.color,
    components: componentResults,
    componentCount: scores.length,
    totalComponents,
    coverage: totalComponents > 0 ? roundTo((scores.length / totalComponents) * 100, 0) : 0
  };
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

export function classifyByThresholds(score, thresholds) {
  if (!isFiniteNumber(score)) return null;
  for (let i = 0; i < thresholds.length; i++) {
    if (score < thresholds[i]) {
      return { ...SEVERITY_CLASS_LABELS[i], min: i === 0 ? 0 : thresholds[i - 1], max: thresholds[i] };
    }
  }
  return { ...SEVERITY_CLASS_LABELS[SEVERITY_CLASS_LABELS.length - 1],
           min: thresholds[thresholds.length - 2] ?? 0, max: SEVERITY_SCALE_MAX };
}

export function classifySeverity(score) {
  return classifyByThresholds(score, SEVERITY_THRESHOLDS.SEVERITY);
}

export function classifySeverityDimension(score, dimension) {
  return classifyByThresholds(score, SEVERITY_THRESHOLDS[dimension] ?? SEVERITY_THRESHOLDS.SEVERITY);
}

// ============================================================================
// QUALITY INDEX (the Severity-side analogue of Risk's LRI)
//
// INFORM Severity's reliability is gauged by "Information availability"
// (the COMPLEXITY/information component). We surface it as a top-level
// Quality Index so consumers can show data trust alongside the severity
// score.
// ============================================================================

export function calculateQualityIndex(indicatorValues) {
  const info = calculateSeverityComponent('information', indicatorValues);
  if (info.score === null) {
    return { score: null, classification: 'Unknown', components: info };
  }
  // info.score is on the 0–5 severity scale where higher = worse information.
  // Express as a 0–10 "lack of information quality" index for consistency
  // with LRI's direction.
  const lri = clampToScale(info.score * 2, 10);
  let classification = 'Very High (least reliable)';
  if (lri < 2) classification = 'Very Low (most reliable)';
  else if (lri < 4) classification = 'Low';
  else if (lri < 6) classification = 'Medium';
  else if (lri < 8) classification = 'High';
  return {
    score: roundTo(lri, 2),
    classification,
    components: {
      dataAvailability: info.indicatorScores.data_availability,
      assessmentRecency: info.indicatorScores.assessment_recency,
      reportingQuality: info.indicatorScores.reporting_quality
    }
  };
}

// ============================================================================
// MAIN: full INFORM Severity calculation
// ============================================================================

/**
 * Compute INFORM Severity for a single crisis event.
 *
 * @param indicatorValues   { indId: number | {value} }
 * @param opts              { baselineInformRisk?: number — 0–10 from Module 02;
 *                            used to populate baseline_inform_risk indicator if missing }
 */
export function calculateINFORMSeverity(indicatorValues, opts = {}) {
  const filtered = { ...indicatorValues };

  // Convenience: auto-populate baseline_inform_risk from opts.baselineInformRisk
  // (the Risk score for the affected area, on 0–10) — only if the caller
  // hasn't already provided the indicator explicitly.
  if (opts.baselineInformRisk != null && filtered.baseline_inform_risk == null) {
    filtered.baseline_inform_risk = Number(opts.baselineInformRisk);
  }

  const result = {
    dimensions: {},
    severity: null,
    classification: null,
    formula: null,
    quality: null,
    metadata: {
      calculatedAt: new Date().toISOString(),
      methodology: 'INFORM Severity Index v6 (IASC/JRC 2023)',
      indicatorCount: 0,
      totalIndicators: 0,
      coverage: 0
    }
  };

  let totalInd = 0, providedInd = 0;
  const dimScores = {};

  for (const dimId of Object.keys(SEVERITY_HIERARCHY)) {
    const r = calculateSeverityDimension(dimId, filtered);
    r.classification = r.score !== null ? classifySeverityDimension(r.score, dimId) : null;
    result.dimensions[dimId] = r;
    if (r.score !== null) dimScores[dimId] = r.score;

    for (const comp of Object.values(r.components)) {
      totalInd += comp.totalIndicators || 0;
      providedInd += comp.indicatorCount || 0;
      comp.classification = comp.score !== null ? classifyByThresholds(comp.score, SEVERITY_THRESHOLDS.SEVERITY) : null;
    }
  }

  result.metadata.indicatorCount = providedInd;
  result.metadata.totalIndicators = totalInd;
  result.metadata.coverage = totalInd > 0 ? roundTo((providedInd / totalInd) * 100, 0) : 0;

  // Severity = arithmetic mean of the 3 dimensions (per IASC INFORM Severity spec)
  const I = dimScores.IMPACT;
  const C = dimScores.CONDITIONS;
  const X = dimScores.COMPLEXITY;
  const present = [I, C, X].filter(isFiniteNumber);
  if (present.length === 3) {
    const sev = (I + C + X) / 3;
    result.severity = roundTo(sev, 2);
    result.classification = classifySeverity(result.severity);
    result.formula = {
      expression: `Severity = (Impact + Conditions + Complexity) / 3 = (${I.toFixed(2)} + ${C.toFixed(2)} + ${X.toFixed(2)}) / 3`,
      Impact: roundTo(I, 2),
      Conditions: roundTo(C, 2),
      Complexity: roundTo(X, 2),
      result: result.severity
    };
  } else if (present.length > 0) {
    // Partial computation — still report a score but flag as preliminary
    const sev = present.reduce((s, x) => s + x, 0) / present.length;
    result.severity = roundTo(sev, 2);
    result.classification = classifySeverity(result.severity);
    result.formula = {
      expression: `Severity = MEAN of ${present.length}/3 dimensions (preliminary)`,
      Impact: I ?? null,
      Conditions: C ?? null,
      Complexity: X ?? null,
      result: result.severity,
      preliminary: true
    };
  }

  // Quality / Information reliability
  result.quality = calculateQualityIndex(filtered);

  return result;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateSeverityValues(indicatorValues) {
  const errors = [];
  const warnings = [];
  const coverage = { IMPACT: 0, CONDITIONS: 0, COMPLEXITY: 0 };

  for (const [indId, data] of Object.entries(indicatorValues)) {
    const def = SEVERITY_INDICATORS[indId];
    const v = (typeof data === 'object' && data !== null && 'value' in data) ? data.value : data;
    if (!def) { warnings.push(`Unknown severity indicator: ${indId}`); continue; }
    if (v === null || v === undefined) continue;
    if (Number.isNaN(Number(v))) { errors.push(`Invalid value for ${def.name}: not a number`); continue; }
    coverage[def.dimension] = (coverage[def.dimension] || 0) + 1;
  }

  const hasI = coverage.IMPACT > 0;
  const hasC = coverage.CONDITIONS > 0;
  const hasX = coverage.COMPLEXITY > 0;
  if (!hasI) warnings.push('No Impact indicators provided');
  if (!hasC) warnings.push('No Conditions indicators provided');
  if (!hasX) warnings.push('No Complexity indicators provided');

  return {
    isValid: errors.length === 0 && hasI && hasC && hasX,
    canCalculate: hasI && hasC && hasX,
    errors,
    warnings,
    coverage
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SEVERITY_HIERARCHY,
  SEVERITY_INDICATORS,
  SEVERITY_COMPONENTS,
  SEVERITY_CLASS_LABELS,
  SEVERITY_THRESHOLDS
};

export default {
  calculateINFORMSeverity,
  calculateSeverityDimension,
  calculateSeverityComponent,
  calculateQualityIndex,
  validateSeverityValues,
  normalizeSeverityIndicator,
  classifySeverity,
  classifySeverityDimension,
  classifyByThresholds,
  roundTo,
  meanAggregation,
  maxAggregation,
  SEVERITY_HIERARCHY,
  SEVERITY_INDICATORS,
  SEVERITY_COMPONENTS,
  SEVERITY_CLASS_LABELS,
  SEVERITY_THRESHOLDS
};
