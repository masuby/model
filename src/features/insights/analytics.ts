/**
 * Pure analytics behind the national Insights page. Everything is derived from the live RiskModel
 * (approved edits included) — no INFORM number is hard-coded here. Kept free of React so it can be
 * unit-tested against the shipped dataset (see `__tests__/analytics.test.ts`).
 */
import { CLASS_KEYS, classify, type ClassKey, type Scale } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSION_BY_KEY, type DimensionKey, type IndicatorLocation } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { dataCoverage, indicatorValue, placeKey, topDrivers } from '@/engine/risk/model';
import { sourceFor, type SourceInfo } from '@/engine/risk/sources';
import type { RiskModel, Unit } from '@/engine/risk/types';

/* ------------------------------------------------------------------------------------------------ */
/* Lenses: overall risk or one of the three dimensions, each on its own class scale                  */
/* ------------------------------------------------------------------------------------------------ */

export type LensKey = 'risk' | DimensionKey;
export const LENSES: readonly LensKey[] = ['risk', 'hazard', 'vulnerability', 'coping'];

export const lensScale = (lens: LensKey): Scale => (lens === 'risk' ? 'risk' : DIMENSION_BY_KEY[lens].scale);
export const lensValue = (u: Unit, lens: LensKey): number | null => (lens === 'risk' ? u.risk : u.dims[lens].score);

/** Index of the "High" class (High and Very High are index ≥ 3). */
export const HIGH_INDEX = CLASS_KEYS.indexOf('high');

const sum = (xs: ReadonlyArray<number | null | undefined>) => xs.reduce<number>((s, x) => s + (isNum(x) ? x : 0), 0);

export function emptyClassCounts(): Record<ClassKey, number> {
  return Object.fromEntries(CLASS_KEYS.map((k) => [k, 0])) as Record<ClassKey, number>;
}

/** Number of units per INFORM class on the lens' own scale (units without a value are skipped). */
export function classCounts(units: readonly Unit[], lens: LensKey = 'risk'): Record<ClassKey, number> {
  const out = emptyClassCounts();
  const scale = lensScale(lens);
  for (const u of units) {
    const c = classify(lensValue(u, lens), scale);
    if (c) out[c.key]++;
  }
  return out;
}

export const isHighOrAbove = (u: Unit): boolean => (classify(u.risk, 'risk')?.index ?? -1) >= HIGH_INDEX;

/* ------------------------------------------------------------------------------------------------ */
/* Provenance: how local each indicator is                                                           */
/* ------------------------------------------------------------------------------------------------ */

export type Resolution = SourceInfo['resolution'];
/** Most local → least local; `overlay` = documented hazard overlay pending local measurement. */
export const RESOLUTIONS: readonly Resolution[] = ['council', 'district', 'region', 'national', 'overlay'];
export const LOCAL_RESOLUTIONS: readonly Resolution[] = ['council', 'district'];

export interface ResolutionGroup {
  resolution: Resolution;
  indicators: IndicatorLocation[];
  count: number;
}

export function resolutionBreakdown(): ResolutionGroup[] {
  return RESOLUTIONS.map((resolution) => {
    const indicators = ALL_INDICATORS.filter((l) => sourceFor(l.dimension.key, l.indicator.key).resolution === resolution);
    return { resolution, indicators, count: indicators.length };
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* Headline KPIs                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export interface Headline {
  nationalRisk: number | null;
  councils: number;
  highCount: number;
  highShare: number;
  exposedPopulation: number;
  totalPopulation: number;
  exposedShare: number;
  topRegion: Unit | null;
  bottomRegion: Unit | null;
  localIndicators: number;
  indicatorTotal: number;
  localShare: number;
}

export function headline(model: RiskModel): Headline {
  const high = model.councils.filter(isHighOrAbove);
  const exposedPopulation = sum(high.map((u) => u.exposure?.population));
  const totalPopulation = sum(model.councils.map((u) => u.exposure?.population));
  const ranked = rankUnits(model.regions, 'risk');
  const localIndicators = resolutionBreakdown()
    .filter((g) => LOCAL_RESOLUTIONS.includes(g.resolution))
    .reduce((s, g) => s + g.count, 0);
  return {
    nationalRisk: model.national.risk,
    councils: model.councils.length,
    highCount: high.length,
    highShare: model.councils.length ? high.length / model.councils.length : 0,
    exposedPopulation,
    totalPopulation,
    exposedShare: totalPopulation ? exposedPopulation / totalPopulation : 0,
    topRegion: ranked[0]?.unit ?? null,
    bottomRegion: ranked.filter((r) => isNum(r.value)).at(-1)?.unit ?? null,
    localIndicators,
    indicatorTotal: ALL_INDICATORS.length,
    localShare: ALL_INDICATORS.length ? localIndicators / ALL_INDICATORS.length : 0,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Rankings                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

export interface RankRow {
  id: string;
  name: string;
  value: number | null;
  classKey: ClassKey | null;
  color: string;
  unit: Unit;
}

/** Units sorted by the lens value, highest first (missing values last, ties by name). */
export function rankUnits(units: readonly Unit[], lens: LensKey): RankRow[] {
  const scale = lensScale(lens);
  return units
    .map((unit) => {
      const value = lensValue(unit, lens);
      const c = classify(value, scale);
      return { id: unit.id, name: unit.name, value, classKey: c?.key ?? null, color: c?.color ?? '#94a3b8', unit };
    })
    .sort((a, b) => {
      if (!isNum(a.value) && !isNum(b.value)) return a.name.localeCompare(b.name);
      if (!isNum(a.value)) return 1;
      if (!isNum(b.value)) return -1;
      return b.value - a.value || a.name.localeCompare(b.name);
    });
}

/* ------------------------------------------------------------------------------------------------ */
/* Hazard hot-spot matrix                                                                             */
/* ------------------------------------------------------------------------------------------------ */

/** Natural-hazard columns of the matrix, in reading order. */
export const MATRIX_HAZARDS = [
  'drought',
  'flood',
  'earthquake',
  'landslide',
  'heatwave',
  'lightning',
  'stormsCyclone',
  'coastalHazards',
  'wildfire',
  'volcano',
  'environmentalDegradation',
  'zoonoses',
] as const;
export type MatrixHazard = (typeof MATRIX_HAZARDS)[number];
/** Sortable columns: the region name, the natural-hazard category score, or one hazard. */
export type MatrixSortKey = 'name' | 'natural' | MatrixHazard;

export interface MatrixRow {
  id: string;
  name: string;
  /** Natural-hazard category score (mean of its indicators, as INFORM defines it). */
  natural: number | null;
  values: Record<MatrixHazard, number | null>;
}

export function hazardMatrix(regions: readonly Unit[]): MatrixRow[] {
  return regions.map((u) => ({
    id: u.id,
    name: u.name,
    natural: u.dims.hazard.categories.natural?.score ?? null,
    values: Object.fromEntries(MATRIX_HAZARDS.map((k) => [k, indicatorValue(u, 'hazard', k)])) as Record<MatrixHazard, number | null>,
  }));
}

export function sortMatrix(rows: readonly MatrixRow[], key: MatrixSortKey, dir: 'asc' | 'desc'): MatrixRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  const val = (r: MatrixRow) => (key === 'name' ? null : key === 'natural' ? r.natural : r.values[key]);
  return [...rows].sort((a, b) => {
    if (key === 'name') return sign * a.name.localeCompare(b.name);
    const va = val(a);
    const vb = val(b);
    if (!isNum(va) && !isNum(vb)) return a.name.localeCompare(b.name);
    if (!isNum(va)) return 1; // missing values always sink
    if (!isNum(vb)) return -1;
    return sign * (va - vb) || a.name.localeCompare(b.name);
  });
}

/** Highest value per column (for outlining the hot-spot), ignoring missing values. */
export function columnMaxima(rows: readonly MatrixRow[]): Record<MatrixHazard | 'natural', number | null> {
  const out = {} as Record<MatrixHazard | 'natural', number | null>;
  const max = (xs: Array<number | null>) => {
    const ns = xs.filter(isNum);
    return ns.length ? Math.max(...ns) : null;
  };
  out.natural = max(rows.map((r) => r.natural));
  for (const k of MATRIX_HAZARDS) out[k] = max(rows.map((r) => r.values[k]));
  return out;
}

/* ------------------------------------------------------------------------------------------------ */
/* Class distribution by region                                                                       */
/* ------------------------------------------------------------------------------------------------ */

export interface DistributionRow {
  id: string;
  name: string;
  total: number;
  counts: Record<ClassKey, number>;
  /** Share of the region's councils in High or Very High (0–1). */
  highShare: number;
  risk: number | null;
}

export function classDistributionByRegion(model: RiskModel): DistributionRow[] {
  const rows: DistributionRow[] = [];
  for (const region of model.regions) {
    const members = model.councilsByRegion.get(placeKey(region.name)) ?? model.councilsByRegion.get(region.id.replace(/^R-/, '')) ?? [];
    const counts = classCounts(members, 'risk');
    const total = CLASS_KEYS.reduce((s, k) => s + counts[k], 0);
    rows.push({
      id: region.id,
      name: region.name,
      total,
      counts,
      highShare: total ? (counts.high + counts.veryHigh) / total : 0,
      risk: region.risk,
    });
  }
  return rows.sort(
    (a, b) =>
      b.highShare - a.highShare ||
      (b.total ? b.counts.veryHigh / b.total : 0) - (a.total ? a.counts.veryHigh / a.total : 0) ||
      (b.risk ?? -1) - (a.risk ?? -1) ||
      a.name.localeCompare(b.name),
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Drivers                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export interface DriverCount {
  dim: DimensionKey;
  key: string;
  /** Councils where this indicator is the top (or joint-top) scoring indicator. */
  count: number;
  /** Councils where it is the sole top indicator. */
  sole: number;
}

/**
 * How often each indicator is a unit's top driver (`topDrivers(unit, 1)`). When several indicators
 * share the top score, each of them is counted — otherwise the hierarchy order would silently decide.
 */
export function topDriverCounts(units: readonly Unit[]): DriverCount[] {
  const map = new Map<string, DriverCount>();
  for (const u of units) {
    const [first] = topDrivers(u, 1);
    if (!first) continue;
    const tied = topDrivers(u, ALL_INDICATORS.length).filter((d) => Math.abs(d.value - first.value) < 1e-9);
    for (const d of tied) {
      const id = `${d.dim}:${d.key}`;
      const row = map.get(id) ?? { dim: d.dim, key: d.key, count: 0, sole: 0 };
      row.count++;
      if (tied.length === 1) row.sole++;
      map.set(id, row);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.sole - a.sole || a.key.localeCompare(b.key));
}

export interface IndicatorStat {
  dim: DimensionKey;
  category: string;
  key: string;
  mean: number | null;
  min: number | null;
  max: number | null;
  /** Units with a value for this indicator. */
  n: number;
}

/** Mean / min / max of every indicator across the given units, in canonical hierarchy order. */
export function indicatorStats(units: readonly Unit[]): IndicatorStat[] {
  return ALL_INDICATORS.map(({ dimension, category, indicator }) => {
    const xs = units.map((u) => indicatorValue(u, dimension.key, indicator.key)).filter(isNum);
    return {
      dim: dimension.key,
      category: category.key,
      key: indicator.key,
      mean: xs.length ? sum(xs) / xs.length : null,
      min: xs.length ? Math.min(...xs) : null,
      max: xs.length ? Math.max(...xs) : null,
      n: xs.length,
    };
  });
}

/* ------------------------------------------------------------------------------------------------ */
/* Data coverage                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export interface CoverageBin {
  coverage: number;
  count: number;
}

/** Councils per data-coverage value (share of the 32 leaves with data), ascending. */
export function coverageHistogram(units: readonly Unit[]): CoverageBin[] {
  const map = new Map<number, number>();
  for (const u of units) {
    const c = dataCoverage(u);
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()].map(([coverage, count]) => ({ coverage, count })).sort((a, b) => a.coverage - b.coverage);
}

/* ------------------------------------------------------------------------------------------------ */
/* Correlation                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** Pearson's r over the pairs where both values exist; null when undefined (n < 3 or zero variance). */
export function pearson(xs: ReadonlyArray<number | null | undefined>, ys: ReadonlyArray<number | null | undefined>): number | null {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    const x = xs[i];
    const y = ys[i];
    if (isNum(x) && isNum(y)) pairs.push([x, y]);
  }
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return null;
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}

export const CORRELATION_LENSES: readonly LensKey[] = ['hazard', 'vulnerability', 'coping', 'risk'];

export interface CorrelationMatrix {
  keys: readonly LensKey[];
  r: Array<Array<number | null>>;
  n: number;
}

export function correlationMatrix(units: readonly Unit[], keys: readonly LensKey[] = CORRELATION_LENSES): CorrelationMatrix {
  const cols = keys.map((k) => units.map((u) => lensValue(u, k)));
  return {
    keys,
    r: keys.map((_, i) => keys.map((__, j) => (i === j ? 1 : pearson(cols[i], cols[j])))),
    n: units.filter((u) => keys.every((k) => isNum(lensValue(u, k)))).length,
  };
}

/** Plain-language strength of a correlation, by |r| (conventional social-science cut-offs). */
export type Strength = 'none' | 'weak' | 'moderate' | 'strong' | 'veryStrong';
export function strengthOf(r: number): Strength {
  const a = Math.abs(r);
  if (a < 0.1) return 'none';
  if (a < 0.3) return 'weak';
  if (a < 0.5) return 'moderate';
  if (a < 0.7) return 'strong';
  return 'veryStrong';
}

/* ------------------------------------------------------------------------------------------------ */
/* Colour helpers                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** Relative luminance (0–1) of `#rrggbb` or `rgb(r, g, b)`. */
export function luminance(color: string): number {
  let rgb: number[];
  const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) rgb = [m[1], m[2], m[3]].map(Number);
  else {
    const h = color.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable ink on a fill: dark text on light fills, white on dark ones. */
/** Best WCAG contrast ratio achievable on a fill with white or near-black (#0b1324) text. */
export const bestContrast = (fill: string): { ink: string; ratio: number } => {
  const l = luminance(fill);
  const onWhite = 1.05 / (l + 0.05);
  const onDark = (l + 0.05) / (0.0074 + 0.05);
  return onWhite >= onDark ? { ink: '#ffffff', ratio: onWhite } : { ink: '#0b1324', ratio: onDark };
};

/** Text colour for a fill: whichever of white / near-black gives the higher WCAG contrast ratio. */
export const inkOn = (fill: string): string => bestContrast(fill).ink;

/** True when no plain text colour reaches WCAG AA (4.5:1) on this fill — put the text on a plate. */
export const needsPlate = (fill: string): boolean => bestContrast(fill).ratio < 4.5;

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((x, i) => Math.round(x + (pb[i] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

/** Diverging colour for a correlation r ∈ [-1, 1]: blue (negative) ← neutral → red (positive). */
export function correlationColor(r: number | null, neutral: string): string {
  if (!isNum(r)) return neutral;
  const t = Math.min(1, Math.abs(r));
  return mix(neutral, r >= 0 ? '#b2182b' : '#2166ac', t);
}
