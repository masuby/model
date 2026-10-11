/**
 * coherence.ts - the statistical coherence check the INFORM Subnational Guidance (II.7) asks for (issue
 * MET-13), read over any set of units without changing a value:
 *   • how the six categories and the three dimensions move with INFORM Risk and with each other
 *     (Pearson correlation; a category that moves against its partner, or not at all with risk, adds
 *     little or contradicts the dimension it belongs to);
 *   • the indicator groups with one value for every unit (they add no subnational information) and the
 *     groups empty for every unit (they enter no score).
 * The Methodology page's Quality section computes it live over the councils; scripts/coherence-report.mjs
 * writes the report of a release over the workbook units and the councils.
 */
import { ALL_INDICATORS, DIMENSIONS, type DimensionKey } from './hierarchy';
import { isNum } from './math';
import type { Unit } from './types';

/** Pearson's r over the pairs where both values exist; null with fewer than three pairs or no variance. */
export function pearson(xs: ReadonlyArray<number | null | undefined>, ys: ReadonlyArray<number | null | undefined>): number | null {
  const pairs: Array<readonly [number, number]> = [];
  xs.forEach((x, i) => {
    const y = ys[i];
    if (isNum(x) && isNum(y)) pairs.push([x, y]);
  });
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  return dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : null;
}

export interface CoherenceSeries {
  /** `${dimension}:${category}` for a category, the dimension key for a dimension, 'risk' for INFORM Risk. */
  key: string;
  dimension: DimensionKey | null;
  category: string | null;
  /** English label, for reports. */
  label: string;
  values: Array<number | null>;
}

/** The series the check correlates: six categories, three dimensions, INFORM Risk, in the hierarchy's order. */
export function coherenceSeries(units: readonly Unit[]): CoherenceSeries[] {
  const out: CoherenceSeries[] = [];
  for (const d of DIMENSIONS)
    for (const c of d.categories)
      out.push({ key: `${d.key}:${c.key}`, dimension: d.key, category: c.key, label: `${c.en} (${d.en})`, values: units.map((u) => u.dims[d.key].categories[c.key]?.score ?? null) });
  for (const d of DIMENSIONS) out.push({ key: d.key, dimension: d.key, category: null, label: d.en, values: units.map((u) => u.dims[d.key].score) });
  out.push({ key: 'risk', dimension: null, category: null, label: 'INFORM Risk', values: units.map((u) => u.risk) });
  return out;
}

export interface CoherenceMatrix {
  labels: string[];
  keys: string[];
  /** r[i][j] between series i and j (1 on the diagonal, null where undefined). */
  r: Array<Array<number | null>>;
}

export function coherenceMatrix(units: readonly Unit[]): CoherenceMatrix {
  const s = coherenceSeries(units);
  return { labels: s.map((x) => x.label), keys: s.map((x) => x.key), r: s.map((a) => s.map((b) => (a === b ? 1 : pearson(a.values, b.values)))) };
}

export interface GroupCoverage {
  ref: string;
  dimension: DimensionKey;
  category: string;
  indicator: string;
  /** English name, for reports. */
  name: string;
  missing: number;
  missingShare: number;
  distinct: number;
  /** Some units have a value and all of them the same one. */
  constant: boolean;
  /** No unit has a value. */
  empty: boolean;
}

/** Per indicator group: how many units lack a value and how many distinct values the others carry. */
export function groupCoverage(units: readonly Unit[]): GroupCoverage[] {
  return ALL_INDICATORS.map((l) => {
    const vals = units.map((u) => u.dims[l.dimension.key].categories[l.category.key]?.indicators[l.indicator.key]);
    const present = vals.filter(isNum);
    const distinct = new Set(present.map((v) => Math.round(v * 1000))).size;
    return {
      ref: `${l.dimension.key}:${l.indicator.key}`,
      dimension: l.dimension.key,
      category: l.category.key,
      indicator: l.indicator.key,
      name: l.indicator.en,
      missing: units.length - present.length,
      missingShare: units.length ? (units.length - present.length) / units.length : 0,
      distinct,
      constant: present.length > 0 && distinct === 1,
      empty: present.length === 0,
    };
  });
}

export interface CoherenceRow {
  key: string;
  dimension: DimensionKey;
  /** null for a dimension row. */
  category: string | null;
  withRisk: number | null;
  /** For a category: r with the other category of its dimension; for a dimension: null. */
  withPartner: number | null;
  partner: string | null;
}

export interface CoherenceSummary {
  n: number;
  rows: CoherenceRow[];
  constant: GroupCoverage[];
  empty: GroupCoverage[];
}

/** The figures a page shows: each category and dimension against risk and against its partner, and the uninformative groups. */
export function coherenceSummary(units: readonly Unit[]): CoherenceSummary {
  const series = coherenceSeries(units);
  const risk = series[series.length - 1];
  const rows: CoherenceRow[] = [];
  for (const s of series) {
    if (!s.dimension) continue;
    const partner = s.category ? series.find((o) => o.dimension === s.dimension && o.category && o.category !== s.category) : undefined;
    rows.push({ key: s.key, dimension: s.dimension, category: s.category, withRisk: pearson(s.values, risk.values), withPartner: partner ? pearson(s.values, partner.values) : null, partner: partner?.category ?? null });
  }
  const groups = groupCoverage(units);
  return { n: units.length, rows, constant: groups.filter((g) => g.constant), empty: groups.filter((g) => g.empty) };
}
