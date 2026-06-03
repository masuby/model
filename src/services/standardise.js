/**
 * standardise.js - INFORM standardisation, stages 2-5, EXACTLY as the Tanzania workbook.
 *
 * This is the layer the live app is missing: it turns a sector's RAW value (in its natural unit -
 * 18 for 18% underweight, 11 for an 11-year drought frequency, a count of displaced people) into the
 * 0-10 score the engine consumes. The engine itself (component AVERAGE -> dimension scaled GEOMEAN ->
 * risk cube-root) is unchanged and stays verified 0/195.
 *
 * The pipeline (workbook hidden sheets `Indicator processing -12/-22` and `Indicator - processed`):
 *   (2) denominator   value = raw / denominator          (per-capita/area; "None" -> /1)
 *   (3) outlier cap    if Outlier=Yes: clamp to the Tukey fence [Q1-1.5IQR, Q3+1.5IQR]
 *   (4) transform      None | Logarithm LN(0.001+x) | Exponential EXP(x)
 *   (5) min-max -> 0-10  MAX(0, MIN(10, ROUND(
 *                          Increase: 10*(x-Min)/(Max-Min)
 *                          Decrease: 10 - 10*(x-Min)/(Max-Min), 1)))
 *      Min/Max = the indicator's FROZEN reference (resolved_min/resolved_max): the data range for
 *      "Data range" indicators (e.g. drought [5,19]) or the fixed pair for "Custom" ones. Frozen so a
 *      value standardises identically at 170, 195, or any resolution.
 *
 * Proven: standardise(raw, spec) reproduces the workbook 0-10 at 8664/8664 = 100%
 * (src/services/__tests__/standardise.golden.test.js).
 */
import SPEC from '../data/inform-indicator-spec.json';

/** The full standardisation spec for an indicator id (e.g. 'HA.NAT.DR-FRE'), or null. */
export const indicatorSpec = (id) => SPEC[id] || null;

/** Every indicator spec, keyed by id. */
export const ALL_SPECS = SPEC;

const isNum = (x) => typeof x === 'number' && isFinite(x);

// Excel ROUND(x, 1) = round half away from zero. Our scores are clamped to [0,10] (non-negative),
// so this is round-half-up: floor(x*10 + 0.5)/10 - matching the workbook (and JS Math.round) exactly.
const round1 = (x) => Math.floor(x * 10 + 0.5) / 10;

/**
 * Standardise one raw value to its 0-10 score, exactly as the workbook.
 * @param raw        the actual keyed value, in the indicator's natural unit (number, or "No data"/null)
 * @param spec       the indicator spec (from indicatorSpec / inform-indicator-spec.json)
 * @param denomValue the denominator (e.g. population) when spec.denominator != 'None'; else ignored
 * @returns the 0-10 score, or null for "No data" / not-computable
 */
export function standardise(raw, spec, denomValue = null) {
  if (raw == null || raw === 'No data' || !spec) return null;
  let x = Number(raw);
  if (!isNum(x)) return null;

  // (2) denominator
  if (spec.denominator && spec.denominator !== 'None') {
    if (!isNum(denomValue) || denomValue === 0) return null;
    x = x / denomValue;
  }
  // (3) outlier cap (Tukey fence), only when outlier detection is on for this indicator
  if (spec.outlier === 'Yes' && isNum(spec.fence_lo) && isNum(spec.fence_hi)) {
    x = Math.max(Math.min(x, spec.fence_hi), spec.fence_lo);
  }
  // (4) transform
  if (spec.transform === 'Logarithm') x = Math.log(0.001 + x);
  else if (spec.transform === 'Exponential') x = Math.exp(x);

  // (5) min-max to 0-10 against the FROZEN reference, with Decrease-Risk inversion
  const mn = spec.resolved_min, mx = spec.resolved_max;
  if (!isNum(mn) || !isNum(mx) || mx === mn) return null;
  let s = (10 * (x - mn)) / (mx - mn);
  if (String(spec.sign).startsWith('Decrease')) s = 10 - s;
  s = Math.max(0, Math.min(10, s));
  return round1(s);
}

/** Convenience: standardise by indicator id. */
export const standardiseById = (id, raw, denomValue = null) =>
  standardise(raw, indicatorSpec(id), denomValue);

// ---- the full pipeline: raw values -> risk, exactly as the workbook -------------------------------
const mean = (a) => { const v = a.filter(isNum); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
// scaled geometric mean (the workbook dimension formula), product form
const sgm = (a) => {
  const xs = a.filter(isNum); if (!xs.length) return null;
  const sc = xs.map((x) => ((10 - x) / 10 * 9) + 1);
  return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10;
};
const r1 = (x) => round1(x);
const kind = (label) => {
  const l = String(label).toLowerCase();
  return l.includes('hazard') ? 'H' : l.includes('vulner') ? 'V' : l.includes('coping') ? 'C' : null;
};

/**
 * Compute the full INFORM hierarchy from RAW values, exactly as the workbook:
 *   raw -> standardise (per spec) -> component AVERAGEIFS(Use=Yes) -> category AVERAGE ->
 *   dimension scaled GEOMEAN -> risk cube-root.
 * @param rawById   { [indicatorId]: rawValue }  (sector-keyed actual values, natural units)
 * @param denomById { [indicatorId]: denominator } for the indicators with a denominator
 * @returns { score, component, category, dimension:{H,V,C}, risk }
 */
export function computeFromRaw(rawById, denomById = {}) {
  // (5) standardise every used indicator that has a raw value
  const score = {};
  for (const id of Object.keys(SPEC)) {
    const s = SPEC[id];
    if (s.use !== 'Yes' || !(id in rawById)) continue;
    const v = standardise(rawById[id], s, denomById[id]);
    if (v != null) score[id] = v;
  }
  // (6) component = AVERAGE of its standardised indicators
  const compVals = {}, compMeta = {};
  for (const id of Object.keys(score)) {
    const s = SPEC[id];
    (compVals[s.component] = compVals[s.component] || []).push(score[id]);
    compMeta[s.component] = { category: s.category, dimension: s.dimension };
  }
  const component = {};
  for (const c of Object.keys(compVals)) component[c] = mean(compVals[c]);
  // (7) category = AVERAGE of its components
  const catVals = {}, catDim = {};
  for (const c of Object.keys(component)) {
    const m = compMeta[c];
    (catVals[m.category] = catVals[m.category] || []).push(component[c]);
    catDim[m.category] = m.dimension;
  }
  const category = {};
  for (const cat of Object.keys(catVals)) category[cat] = mean(catVals[cat]);
  // (8) dimension = scaled GEOMEAN of its categories
  const dimVals = {};
  for (const cat of Object.keys(category)) (dimVals[catDim[cat]] = dimVals[catDim[cat]] || []).push(category[cat]);
  const dimension = {};
  for (const dim of Object.keys(dimVals)) { const k = kind(dim); if (k) dimension[k] = r1(sgm(dimVals[dim])); }
  // (9) risk = cube-root of the three dimensions
  const { H, V, C } = dimension;
  const risk = [H, V, C].every(isNum) ? r1(Math.pow(H, 1 / 3) * Math.pow(V, 1 / 3) * Math.pow(C, 1 / 3)) : null;
  return { score, component, category, dimension, risk };
}
