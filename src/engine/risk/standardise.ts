/**
 * INFORM standardisation - raw value in its natural unit → 0–10 score, exactly as the Tanzania
 * workbook's hidden sheets `Indicator processing -12/-22` and `Indicator - processed`:
 *
 *   (2) denominator   x = raw / denominator                       ("None" → unchanged)
 *   (3) outlier cap   if Outlier = Yes: clamp to Tukey fence [Q1 − 1.5·IQR, Q3 + 1.5·IQR]
 *   (4) transform     None | Logarithm LN(0.001 + x) | Exponential EXP(x)
 *   (5) min–max       ROUND(10·(x − min)/(max − min), 1), inverted for "Decrease Risk", clamped 0–10
 *
 * The min/max are FROZEN per indicator (resolved_min/resolved_max) so a value standardises identically
 * at any resolution (170 source units, 195 councils, …).
 *
 * Proven: reproduces the workbook 0–10 at 8664/8664 values (`standardise.golden.test.ts`) and the full
 * raw → risk pipeline for all 170 units (`pipeline.golden.test.ts`).
 */
import SPEC_JSON from '@/data/inform-indicator-spec.json';
import ADV_JSON from '@/data/inform-advanced-spec.json';
import { clamp10, dimensionScore, isNum, mean, riskScore, round1, weightedMean } from './math';

export interface IndicatorSpec {
  id: string;
  name: string | null;
  dimension: string | null;
  category: string | null;
  component: string | null;
  unit?: string | null;
  denominator?: string | null;
  outlier?: string | null;
  fence_lo?: number | null;
  fence_hi?: number | null;
  transform?: string | null;
  normalisation?: string | null;
  resolved_min: number | null;
  resolved_max: number | null;
  sign: string | null;
  use: string | null;
  weight?: number | string | null;
  sector?: string | null;
  basis?: string | null;
  keyed_at?: string | null;
  resolution?: string | null;
}
export type SpecTable = Record<string, IndicatorSpec>;

export const SPECS = SPEC_JSON as unknown as SpecTable;
export const ADVANCED_SPECS = ADV_JSON as unknown as SpecTable;
/** Genuine INFORM spec merged with the exploded multi-source sub-indicators (no id collisions). */
export const ADVANCED_MERGED: SpecTable = { ...SPECS, ...ADVANCED_SPECS };

export const indicatorSpec = (id: string): IndicatorSpec | null => SPECS[id] ?? null;
export const usedSpecs = (specs: SpecTable = SPECS): IndicatorSpec[] => Object.values(specs).filter((s) => s.use === 'Yes');

type Raw = number | string | null | undefined;

/** Standardise one raw value to its 0–10 score; null for "No data" / not computable. */
export function standardise(raw: Raw, spec: IndicatorSpec | null | undefined, denomValue: number | null = null): number | null {
  if (raw == null || raw === '' || raw === 'No data' || !spec) return null;
  let x = Number(raw);
  if (!isNum(x)) return null;

  if (spec.denominator && spec.denominator !== 'None') {
    if (!isNum(denomValue) || denomValue === 0) return null;
    x = x / denomValue;
  }
  if (spec.outlier === 'Yes' && isNum(spec.fence_lo) && isNum(spec.fence_hi)) {
    x = Math.max(Math.min(x, spec.fence_hi), spec.fence_lo);
  }
  if (spec.transform === 'Logarithm') x = Math.log(0.001 + x);
  else if (spec.transform === 'Exponential') x = Math.exp(x);

  const mn = spec.resolved_min;
  const mx = spec.resolved_max;
  if (!isNum(mn) || !isNum(mx) || mx === mn) return null;
  let s = (10 * (x - mn)) / (mx - mn);
  if (String(spec.sign).startsWith('Decrease')) s = 10 - s;
  return round1(clamp10(s));
}

export const standardiseById = (id: string, raw: Raw, denomValue: number | null = null) =>
  standardise(raw, indicatorSpec(id), denomValue);

export interface PipelineResult {
  /** Standardised 0–10 score per indicator id. */
  score: Record<string, number>;
  /** Indicator-group (workbook "component") score. */
  component: Record<string, number | null>;
  /** Category score (e.g. "Natural"). */
  category: Record<string, number | null>;
  /** Dimension score keyed H / V / C. */
  dimension: Partial<Record<'H' | 'V' | 'C', number | null>>;
  risk: number | null;
}

const dimKind = (label: string | null): 'H' | 'V' | 'C' | null => {
  const l = String(label).toLowerCase();
  return l.includes('hazard') ? 'H' : l.includes('vulner') ? 'V' : l.includes('coping') ? 'C' : null;
};

/**
 * Full INFORM hierarchy from RAW values:
 * raw → standardise → component (weighted) AVERAGE of indicators present → category AVERAGE →
 * dimension scaled GEOMEAN → risk cube-root. The indicator set IS the spec: add a row (Use = Yes) to
 * add an indicator, set Use = No to remove it - the engine never hard-codes the list.
 */
export function computeFromRaw(
  rawById: Record<string, Raw>,
  { specs = SPECS, denomById = {} }: { specs?: SpecTable; denomById?: Record<string, number | null> } = {},
): PipelineResult {
  const score: Record<string, number> = {};
  for (const id of Object.keys(specs)) {
    const s = specs[id];
    if (s.use !== 'Yes' || !(id in rawById)) continue;
    const v = standardise(rawById[id], s, denomById[id] ?? null);
    if (v != null) score[id] = v;
  }

  const compVals: Record<string, Array<readonly [number, number]>> = {};
  const compMeta: Record<string, { category: string; dimension: string }> = {};
  for (const id of Object.keys(score)) {
    const s = specs[id];
    const comp = String(s.component);
    const w = Number(s.weight);
    (compVals[comp] ??= []).push([score[id], isNum(w) ? w : 1] as const);
    compMeta[comp] = { category: String(s.category), dimension: String(s.dimension) };
  }
  const component: Record<string, number | null> = {};
  for (const c of Object.keys(compVals)) component[c] = weightedMean(compVals[c]);

  const catVals: Record<string, Array<number | null>> = {};
  const catDim: Record<string, string> = {};
  for (const c of Object.keys(component)) {
    const m = compMeta[c];
    (catVals[m.category] ??= []).push(component[c]);
    catDim[m.category] = m.dimension;
  }
  const category: Record<string, number | null> = {};
  for (const cat of Object.keys(catVals)) category[cat] = mean(catVals[cat]);

  const dimVals: Record<string, Array<number | null>> = {};
  for (const cat of Object.keys(category)) (dimVals[catDim[cat]] ??= []).push(category[cat]);
  const dimension: PipelineResult['dimension'] = {};
  for (const dim of Object.keys(dimVals)) {
    const k = dimKind(dim);
    if (k) dimension[k] = dimensionScore(dimVals[dim]);
  }
  return { score, component, category, dimension, risk: riskScore(dimension.H, dimension.V, dimension.C) };
}

/**
 * ADVANCED mode - the same engine over the merged spec. Inside an exploded component the INFORM
 * indicator and the extra sub-indicators aggregate together (weighted); blanks drop out, so with no
 * advanced data the result is byte-identical to standard INFORM.
 */
export function computeAdvanced(rawById: Record<string, Raw>, { denomById = {} }: { denomById?: Record<string, number | null> } = {}) {
  return computeFromRaw(rawById, { specs: ADVANCED_MERGED, denomById });
}
