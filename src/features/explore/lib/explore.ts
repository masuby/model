/**
 * Risk Explorer - pure helpers (no React, no i18n) so they are unit-testable:
 *   • URL state  ⇄ ExploreState (every view is shareable)
 *   • statistics, ranks, sorting, search and class filtering over a level's units
 *   • carrying a selection across levels (council → its region / INFORM source unit)
 */
import { CLASS_KEYS, type ClassKey } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSION_KEYS, type DimensionKey } from '@/engine/risk/hierarchy';
import { parseMetric, type Metric, type MetricKey } from '@/engine/risk/metrics';
import { placeKey } from '@/engine/risk/model';
import type { Level, RiskModel, Unit } from '@/engine/risk/types';

/* ------------------------------------------------------------------------------------------------ */
/* State                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export type ExploreLevel = Exclude<Level, 'national'>;
export const EXPLORE_LEVELS: readonly ExploreLevel[] = ['council', 'region', 'source'];
export type ExploreView = 'map' | 'table';
export type Basemap = 'none' | 'streets';
export type SortKey = 'name' | 'region' | 'metric' | 'risk' | DimensionKey;
export const SORT_KEYS: readonly SortKey[] = ['name', 'region', 'metric', 'risk', ...DIMENSION_KEYS];
export type SortDir = 'asc' | 'desc';
export const MAX_COMPARE = 3;

export interface ExploreState {
  level: ExploreLevel;
  metric: MetricKey;
  /** Selected unit id (any explorable level). */
  id: string | null;
  /** Class filter - only meaningful for class metrics (risk and dimensions). */
  cls: ClassKey | null;
  view: ExploreView;
  /** Pinned units for the comparison tray (max 3, any level). */
  cmp: string[];
  basemap: Basemap;
  sort: SortKey;
  dir: SortDir;
}

export const DEFAULT_STATE: ExploreState = {
  level: 'council',
  metric: 'risk',
  id: null,
  cls: null,
  view: 'map',
  cmp: [],
  basemap: 'none',
  sort: 'metric',
  dir: 'desc',
};

const isLevel = (v: unknown): v is ExploreLevel => EXPLORE_LEVELS.includes(v as ExploreLevel);
const isClass = (v: unknown): v is ClassKey => CLASS_KEYS.includes(v as ClassKey);
const isSortKey = (v: unknown): v is SortKey => SORT_KEYS.includes(v as SortKey);

/**
 * Read the explorer state from the query string. `lookup` validates unit ids against the model;
 * when `level` is absent it is inferred from the selected unit (so `?id=R-dodoma` opens the region map).
 */
export function readExploreState(params: URLSearchParams, lookup?: (id: string) => Unit | undefined): ExploreState {
  const metric = parseMetric(params.get('metric')).key;
  const valid = (id: string) => {
    if (!lookup) return true;
    const u = lookup(id);
    return !!u && isLevel(u.level);
  };

  const rawId = params.get('id');
  const id = rawId && valid(rawId) ? rawId : null;
  const rawLevel = params.get('level');
  const inferred = id && lookup ? lookup(id)?.level : undefined;
  const level: ExploreLevel = isLevel(rawLevel) ? rawLevel : isLevel(inferred) ? inferred : DEFAULT_STATE.level;

  const rawClass = params.get('class');
  const cls = parseMetric(metric).kind !== 'indicator' && isClass(rawClass) ? rawClass : null;

  const cmp = [...new Set((params.get('cmp') ?? '').split(',').map((s) => s.trim()))].filter((s) => s && valid(s)).slice(0, MAX_COMPARE);
  const rawSort = params.get('sort');

  return {
    level,
    metric,
    id,
    cls,
    view: params.get('view') === 'table' ? 'table' : 'map',
    cmp,
    basemap: params.get('basemap') === 'streets' ? 'streets' : 'none',
    sort: isSortKey(rawSort) ? rawSort : DEFAULT_STATE.sort,
    dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
  };
}

/** Serialise the state; defaults are omitted to keep links short (the level is always explicit). */
export function writeExploreState(s: ExploreState): URLSearchParams {
  const p = new URLSearchParams();
  p.set('level', s.level);
  if (s.metric !== DEFAULT_STATE.metric) p.set('metric', s.metric);
  if (s.id) p.set('id', s.id);
  if (s.cls && parseMetric(s.metric).kind !== 'indicator') p.set('class', s.cls);
  if (s.view !== DEFAULT_STATE.view) p.set('view', s.view);
  if (s.cmp.length) p.set('cmp', s.cmp.slice(0, MAX_COMPARE).join(','));
  if (s.basemap !== DEFAULT_STATE.basemap) p.set('basemap', s.basemap);
  if (s.sort !== DEFAULT_STATE.sort) p.set('sort', s.sort);
  if (s.dir !== DEFAULT_STATE.dir) p.set('dir', s.dir);
  return p;
}

/** Carry a selection to another level: a council maps to its region or its INFORM source unit. */
export function translateSelection(model: RiskModel, id: string | null, to: ExploreLevel): string | null {
  if (!id) return null;
  const u = model.byId.get(id);
  if (!u) return null;
  if (u.level === to) return id;
  if (to === 'region') return model.byId.get(`R-${placeKey(u.region)}`)?.id ?? null;
  if (to === 'source' && u.level === 'council') return u.sourceId && model.byId.has(u.sourceId) ? u.sourceId : null;
  return null;
}

/** The unit an area is compared against: a council's region, otherwise the official national figure. */
export function referenceUnit(model: RiskModel, u: Unit): Unit {
  if (u.level === 'council') return model.byId.get(`R-${placeKey(u.region)}`) ?? model.national;
  return model.national;
}

/* ------------------------------------------------------------------------------------------------ */
/* Statistics                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const round1 = (v: number) => Math.round(v * 10) / 10;

export interface MetricStats {
  total: number;
  withData: number;
  mean: number | null;
  median: number | null;
  min: { unit: Unit; value: number } | null;
  max: { unit: Unit; value: number } | null;
  /** Units per INFORM class (class metrics only). */
  classCounts: Record<ClassKey, number> | null;
  /** Five equal-width bins over 0–10 (used for continuous indicator lenses). */
  bins: number[];
}

export function computeStats(units: readonly Unit[], metric: Metric): MetricStats {
  const rows = units.map((u) => ({ u, v: metric.get(u) })).filter((r): r is { u: Unit; v: number } => isNum(r.v));
  const values = rows.map((r) => r.v).sort((a, b) => a - b);
  const n = values.length;
  let min: MetricStats['min'] = null;
  let max: MetricStats['max'] = null;
  for (const r of rows) {
    if (!min || r.v < min.value) min = { unit: r.u, value: r.v };
    if (!max || r.v > max.value) max = { unit: r.u, value: r.v };
  }
  const classCounts =
    metric.kind === 'indicator'
      ? null
      : rows.reduce(
          (acc, r) => {
            const k = metric.classOf(r.v)?.key;
            if (k) acc[k]++;
            return acc;
          },
          Object.fromEntries(CLASS_KEYS.map((k) => [k, 0])) as Record<ClassKey, number>,
        );
  const bins = [0, 0, 0, 0, 0];
  for (const v of values) bins[Math.min(4, Math.max(0, Math.floor(v / 2)))]++;
  return {
    total: units.length,
    withData: n,
    mean: n ? values.reduce((s, v) => s + v, 0) / n : null,
    median: n ? (n % 2 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2) : null,
    min,
    max,
    classCounts,
    bins,
  };
}

/** Competition ranking (1, 2, 2, 4 …), highest value first, on the displayed one-decimal value. */
export function rankUnits(units: readonly Unit[], metric: Pick<Metric, 'get'>): Map<string, number> {
  const rows = units
    .map((u) => ({ id: u.id, v: metric.get(u) }))
    .filter((r): r is { id: string; v: number } => isNum(r.v))
    .map((r) => ({ id: r.id, v: round1(r.v) }))
    .sort((a, b) => b.v - a.v);
  const out = new Map<string, number>();
  rows.forEach((r, i) => out.set(r.id, i > 0 && rows[i - 1].v === r.v ? out.get(rows[i - 1].id)! : i + 1));
  return out;
}

export function sortValue(u: Unit, key: SortKey, metric: Metric): string | number | null {
  switch (key) {
    case 'name':
      return u.name;
    case 'region':
      return u.region;
    case 'metric':
      return metric.get(u);
    case 'risk':
      return u.risk;
    default:
      return u.dims[key].score;
  }
}

/** Sort a copy of the units; missing values always go last, ties break by name. */
export function sortUnits(units: readonly Unit[], key: SortKey, dir: SortDir, metric: Metric, collator: Intl.Collator = new Intl.Collator('en')): Unit[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...units].sort((a, b) => {
    const va = sortValue(a, key, metric);
    const vb = sortValue(b, key, metric);
    const na = va == null || (typeof va === 'number' && !Number.isFinite(va));
    const nb = vb == null || (typeof vb === 'number' && !Number.isFinite(vb));
    if (na !== nb) return na ? 1 : -1;
    let c = 0;
    if (!na && !nb) c = typeof va === 'number' && typeof vb === 'number' ? (va - vb) * sign : collator.compare(String(va), String(vb)) * sign;
    return c || collator.compare(a.name, b.name);
  });
}

export function matchesClass(u: Unit, metric: Metric, cls: ClassKey | null): boolean {
  if (!cls || metric.kind === 'indicator') return true;
  return metric.classOf(metric.get(u))?.key === cls;
}

/* ------------------------------------------------------------------------------------------------ */
/* Search                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export const normalizeText = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Rank places by how well their name (or, for councils, their region) matches the query. */
export function searchUnits(pool: readonly Unit[], query: string, limit = 8): Unit[] {
  const q = normalizeText(query);
  if (!q) return [];
  const levelOrder: Record<Level, number> = { region: 0, council: 1, source: 2, national: 3 };
  const scored: Array<{ u: Unit; s: number }> = [];
  for (const u of pool) {
    const name = normalizeText(u.name);
    let s = -1;
    if (name === q) s = 0;
    else if (name.startsWith(q)) s = 1;
    else if (name.split(' ').some((w) => w.startsWith(q))) s = 2;
    else if (name.includes(q)) s = 3;
    else if (u.level !== 'region' && normalizeText(u.region).includes(q)) s = 4;
    if (s >= 0) scored.push({ u, s });
  }
  return scored
    .sort((a, b) => a.s - b.s || levelOrder[a.u.level] - levelOrder[b.u.level] || a.u.name.localeCompare(b.u.name))
    .slice(0, limit)
    .map((x) => x.u);
}

/* ------------------------------------------------------------------------------------------------ */
/* Area facts                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/** Leaf indicators with data vs. the total - the counts behind `dataCoverage`. */
export function coverageCounts(u: Unit): { have: number; total: number } {
  let have = 0;
  for (const l of ALL_INDICATORS) if (isNum(u.dims[l.dimension.key].categories[l.category.key]?.indicators[l.indicator.key])) have++;
  return { have, total: ALL_INDICATORS.length };
}

export const editCount = (u: Unit): number => Object.keys(u.edits).length;
