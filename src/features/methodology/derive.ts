/**
 * Step-by-step derivation of a unit's INFORM scores, for the live worked example. It recomputes each
 * dimension from the unit's categories and the risk from those dimensions with the ENGINE's functions,
 * and keeps every intermediate value so the page can print the substituted formulas.
 */
import type { Scale } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { dimensionScore, isNum, mean, riskScore, scaledGeomean } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';

export interface CategoryStep {
  key: string;
  /** Category score as held by the model (what the dimension is computed from). */
  score: number | null;
  /** Arithmetic mean of the indicators with data. */
  mean: number | null;
  indicators: Array<{ key: string; value: number | null }>;
  withData: number;
  /** (10 − c)/10 · 9 + 1 - the category on INFORM's 1–10 "lack-of" scale. */
  scaled: number | null;
}

export interface DimensionStep {
  key: DimensionKey;
  scale: Scale;
  categories: CategoryStep[];
  /** Number of categories with data. */
  n: number;
  product: number | null;
  geomean: number | null;
  /** Unrounded dimension score. */
  raw: number | null;
  /** ROUND(raw, 1) - the engine's dimensionScore(). */
  result: number | null;
  model: number | null;
  matches: boolean;
}

export interface RiskStep {
  product: number | null;
  raw: number | null;
  result: number | null;
  model: number | null;
  matches: boolean;
}

export interface Derivation {
  dims: DimensionStep[];
  risk: RiskStep;
}

export const scaleCategory = (c: number): number => ((10 - c) / 10) * 9 + 1;

export function deriveUnit(unit: Unit): Derivation {
  const dims: DimensionStep[] = DIMENSIONS.map((def) => {
    const categories: CategoryStep[] = def.categories.map((cat) => {
      const cv = unit.dims[def.key].categories[cat.key];
      const indicators = cat.indicators.map((i) => ({ key: i.key, value: cv?.indicators[i.key] ?? null }));
      const score = cv?.score ?? null;
      return {
        key: cat.key,
        score,
        mean: mean(indicators.map((x) => x.value)),
        indicators,
        withData: indicators.filter((x) => isNum(x.value)).length,
        scaled: isNum(score) ? scaleCategory(score) : null,
      };
    });
    const scores = categories.map((c) => c.score);
    const scaled = categories.map((c) => c.scaled).filter(isNum);
    const product = scaled.length ? scaled.reduce((p, x) => p * x, 1) : null;
    const geomean = isNum(product) ? Math.pow(product, 1 / scaled.length) : null;
    const result = dimensionScore(scores);
    const model = unit.dims[def.key].score;
    return {
      key: def.key,
      scale: def.scale,
      categories,
      n: scaled.length,
      product,
      geomean,
      raw: scaledGeomean(scores),
      result,
      model,
      matches: result === model,
    };
  });

  const [h, v, c] = dims.map((d) => d.result);
  const all = isNum(h) && isNum(v) && isNum(c);
  const result = riskScore(h, v, c);
  return {
    dims,
    risk: {
      product: all ? h * v * c : null,
      raw: all ? Math.pow(h, 1 / 3) * Math.pow(v, 1 / 3) * Math.pow(c, 1 / 3) : null,
      result,
      model: unit.risk,
      matches: result === unit.risk,
    },
  };
}

/** Self-check over many units: how many dimension and risk scores re-derive exactly. */
export function consistency(units: readonly Unit[]): { dims: { ok: number; total: number }; risk: { ok: number; total: number } } {
  let dOk = 0;
  let dTotal = 0;
  let rOk = 0;
  let rTotal = 0;
  for (const u of units) {
    const d = deriveUnit(u);
    for (const x of d.dims) {
      dTotal++;
      if (x.matches) dOk++;
    }
    rTotal++;
    if (d.risk.matches) rOk++;
  }
  return { dims: { ok: dOk, total: dTotal }, risk: { ok: rOk, total: rTotal } };
}
