/**
 * Pure helpers behind the Area Profile page: unit resolution, peers and ranks, the indicator rows
 * shown in the table/charts, a deterministic beeswarm layout, and facilities/DRR roll-ups.
 * Everything here is UI-free so it can be unit-tested against the real model.
 */
import { classify, type ClassInfo } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum, mean } from '@/engine/risk/math';
import { placeKey, unitsAt } from '@/engine/risk/model';
import { sourceFor, type SourceInfo } from '@/engine/risk/sources';
import type { EditRef, EditStamp, Facilities, Level, RiskModel, Unit } from '@/engine/risk/types';
import { NO_VALUE } from '@/lib/utils';

/* ------------------------------------------------------------------------------------------------ */
/* Resolution                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Find the unit behind a route id. Accepts canonical ids (C001, R-dodoma, TZ0101, TZ), case-insensitive
 * variants (c001, R-Dodoma, tz0101) and, as a courtesy for hand-typed links, an exact council/region name.
 */
export function resolveUnit(model: RiskModel, raw: string | null | undefined): Unit | null {
  if (!raw) return null;
  let id = raw.trim();
  try {
    id = decodeURIComponent(id);
  } catch {
    /* keep as-is */
  }
  if (!id) return null;
  const direct = model.byId.get(id) ?? model.byId.get(id.toUpperCase());
  if (direct) return direct;
  const region = /^r-(.+)$/i.exec(id);
  if (region) {
    const r = model.byId.get(`R-${placeKey(region[1])}`);
    if (r) return r;
  }
  const k = placeKey(id);
  if (!k) return null;
  if (k === 'tanzania') return model.national;
  return model.councils.find((c) => placeKey(c.name) === k) ?? model.regions.find((r) => placeKey(r.name) === k) ?? null;
}

/** The region a council or source unit belongs to (null for regions and the nation). */
export function regionOf(model: RiskModel, unit: Unit): Unit | null {
  if (unit.level !== 'council' && unit.level !== 'source') return null;
  return model.byId.get(`R-${placeKey(unit.region)}`) ?? null;
}

/** Units at the same administrative level (empty for the nation, which has no peers). */
export function peersOf(model: RiskModel, unit: Unit): Unit[] {
  return unit.level === 'national' ? [] : unitsAt(model, unit.level);
}

/** Councils of a region unit. */
export function membersOfRegion(model: RiskModel, region: Unit): Unit[] {
  return model.councilsByRegion.get(region.id.replace(/^R-/, '')) ?? [];
}

/** Sort by risk, highest first; units without a score go last. */
export const byRiskDesc = (a: Unit, b: Unit): number => (b.risk ?? -1) - (a.risk ?? -1) || a.name.localeCompare(b.name);

export type PlaceListKind = 'siblings' | 'members' | 'sourceCouncils' | 'sourceSiblings' | 'regions';
export interface PlaceList {
  kind: PlaceListKind;
  units: Unit[];
}

/** The ranked place lists shown for a unit (siblings for a council, members for a region, …). */
export function placeListsFor(model: RiskModel, unit: Unit): PlaceList[] {
  const key = placeKey(unit.region);
  switch (unit.level) {
    case 'council':
      return [{ kind: 'siblings', units: [...(model.councilsByRegion.get(key) ?? [])].sort(byRiskDesc) }];
    case 'region':
      return [{ kind: 'members', units: [...membersOfRegion(model, unit)].sort(byRiskDesc) }];
    case 'source': {
      const lists: PlaceList[] = [];
      const councils = model.councils.filter((c) => c.sourceId === unit.id).sort(byRiskDesc);
      if (councils.length) lists.push({ kind: 'sourceCouncils', units: councils });
      lists.push({ kind: 'sourceSiblings', units: model.sources.filter((s) => placeKey(s.region) === key).sort(byRiskDesc) });
      return lists;
    }
    case 'national':
      return [{ kind: 'regions', units: [...model.regions].sort(byRiskDesc) }];
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* Ranks                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export interface RankInfo {
  /** 1 = highest risk (competition ranking: ties share a rank). */
  rank: number;
  /** Peers that have a score. */
  total: number;
  /** Peers with a strictly lower score. */
  lower: number;
  /** Share (0–100) of the other peers with a lower score. */
  percentile: number;
}

export function rankAmong(unit: Unit, peers: readonly Unit[], get: (u: Unit) => number | null = (u) => u.risk): RankInfo | null {
  const v = get(unit);
  if (!isNum(v) || !peers.length) return null;
  const values = peers.map(get).filter(isNum);
  const higher = values.filter((x) => x > v).length;
  const lower = values.filter((x) => x < v).length;
  const total = values.length;
  return { rank: higher + 1, total, lower, percentile: total > 1 ? Math.round((lower / (total - 1)) * 100) : 100 };
}

/* ------------------------------------------------------------------------------------------------ */
/* Indicator rows                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export interface IndicatorRow {
  dim: DimensionKey;
  category: string;
  key: string;
  value: number | null;
  region: number | null;
  national: number | null;
  source: SourceInfo;
  /** Provenance of an approved edit on this unit (or, for regions, on one of its councils). */
  edit: EditStamp | null;
}

const leaf = (u: Unit | null | undefined, dim: DimensionKey, cat: string, key: string): number | null => {
  const v = u?.dims[dim].categories[cat]?.indicators[key];
  return isNum(v) ? v : null;
};

/** Every leaf indicator of a unit in canonical order, with its references and provenance. */
export function indicatorRows(unit: Unit, region: Unit | null, national: Unit | null): IndicatorRow[] {
  const rows: IndicatorRow[] = [];
  for (const def of DIMENSIONS)
    for (const cat of def.categories)
      for (const ind of cat.indicators)
        rows.push({
          dim: def.key,
          category: cat.key,
          key: ind.key,
          value: leaf(unit, def.key, cat.key, ind.key),
          region: leaf(region, def.key, cat.key, ind.key),
          national: national && national !== unit ? leaf(national, def.key, cat.key, ind.key) : null,
          source: sourceFor(def.key, ind.key),
          edit: unit.edits[`${def.key}:${ind.key}` as EditRef] ?? null,
        });
  return rows;
}

export interface CategoryRow {
  dim: DimensionKey;
  key: string;
  value: number | null;
  region: number | null;
  national: number | null;
}

const catScore = (u: Unit | null | undefined, dim: DimensionKey, cat: string): number | null => {
  const v = u?.dims[dim].categories[cat]?.score;
  return isNum(v) ? v : null;
};

/** The six INFORM categories of a unit, with region and national references. */
export function categoryRows(unit: Unit, region: Unit | null, national: Unit | null): CategoryRow[] {
  return DIMENSIONS.flatMap((def) =>
    def.categories.map((cat) => ({
      dim: def.key,
      key: cat.key,
      value: catScore(unit, def.key, cat.key),
      region: catScore(region, def.key, cat.key),
      national: national && national !== unit ? catScore(national, def.key, cat.key) : null,
    })),
  );
}

export function coverageCounts(unit: Unit): { have: number; total: number; pct: number } {
  const rows = indicatorRows(unit, null, null);
  const have = rows.filter((r) => r.value != null).length;
  return { have, total: rows.length, pct: rows.length ? Math.round((have / rows.length) * 100) : 0 };
}

/** Difference a − b rounded to one decimal (null when either side is missing). */
export function delta(a: number | null | undefined, b: number | null | undefined): number | null {
  if (!isNum(a) || !isNum(b)) return null;
  return Math.round((a - b) * 10) / 10;
}

/** "+0.8", "−0.3", "0.0" - with a true minus sign. */
export function formatDelta(d: number | null | undefined): string {
  if (!isNum(d)) return NO_VALUE;
  if (d === 0) return '0.0';
  return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`;
}

/**
 * The dimension that is worst on its OWN INFORM scale: highest class, then furthest into that class.
 * (Comparing raw scores across dimensions would be wrong - each has its own thresholds.)
 */
export function weakestDimension(unit: Unit): { key: DimensionKey; score: number; cls: ClassInfo } | null {
  let best: { key: DimensionKey; score: number; cls: ClassInfo; rankKey: number } | null = null;
  for (const def of DIMENSIONS) {
    const score = unit.dims[def.key].score;
    const cls = classify(score, def.scale);
    if (!isNum(score) || !cls) continue;
    const rankKey = cls.index * 100 + score;
    if (!best || rankKey > best.rankKey) best = { key: def.key, score, cls, rankKey };
  }
  return best ? { key: best.key, score: best.score, cls: best.cls } : null;
}

/* ------------------------------------------------------------------------------------------------ */
/* Beeswarm                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

export interface SwarmPoint<T> {
  item: T;
  x: number;
  /** Integer lane: 0 on the axis, ±1, ±2 … stacked outwards. */
  y: number;
}

/**
 * Deterministic beeswarm: points keep their exact x, and are stacked into the nearest free lane
 * (0, +1, −1, +2, …) so that no two points in a lane are closer than `minDx`.
 */
export function beeswarm<T>(items: readonly T[], value: (t: T) => number | null | undefined, minDx = 0.2): { points: Array<SwarmPoint<T>>; maxLane: number } {
  const sorted = items
    .map((item, i) => ({ item, x: value(item), i }))
    .filter((p): p is { item: T; x: number; i: number } => isNum(p.x))
    .sort((a, b) => a.x - b.x || a.i - b.i);
  const lanes = new Map<number, number[]>();
  const points: Array<SwarmPoint<T>> = [];
  let maxLane = 0;
  for (const p of sorted) {
    for (let k = 0; ; k++) {
      const lane = k === 0 ? 0 : k % 2 === 1 ? Math.ceil(k / 2) : -Math.ceil(k / 2);
      const xs = lanes.get(lane) ?? [];
      // Points are placed in increasing x, so only the last one in a lane can collide.
      if (!xs.length || p.x - xs[xs.length - 1] >= minDx - 1e-9) {
        xs.push(p.x);
        lanes.set(lane, xs);
        points.push({ item: p.item, x: p.x, y: lane });
        maxLane = Math.max(maxLane, Math.abs(lane));
        break;
      }
    }
  }
  return { points, maxLane };
}

/* ------------------------------------------------------------------------------------------------ */
/* Edits                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export function editList(unit: Unit): Array<{ ref: EditRef; stamp: EditStamp }> {
  return (Object.entries(unit.edits) as Array<[EditRef, EditStamp | undefined]>)
    .filter((e): e is [EditRef, EditStamp] => !!e[1])
    .map(([ref, stamp]) => ({ ref, stamp }))
    .sort((a, b) => String(b.stamp.at).localeCompare(String(a.stamp.at)));
}

/* ------------------------------------------------------------------------------------------------ */
/* Exposure, facilities & DRR                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/** Area in km² - stored for some units, otherwise recovered as population ÷ density. */
export function unitArea(unit: Unit): number | null {
  const e = unit.exposure;
  if (isNum(e?.areaKm2) && e.areaKm2 > 0) return e.areaKm2;
  if (isNum(e?.population) && isNum(e?.density) && e.density > 0) return e.population / e.density;
  return null;
}

export interface ServicesInfo {
  /** How the figures relate to the unit: its own, its source unit's, or summed over districts. */
  basis: 'self' | 'source' | 'aggregate';
  facilities: Facilities | null;
  /** Population of the same district(s) the facilities belong to (for per-capita rates). */
  population: number | null;
  /** Districts (INFORM source units) the figures cover, and how many carry facility / DRR records. */
  districts: number;
  withFacilities: number;
  drr: { eprp: number; aa: number; eocc: number; recorded: number };
  sourceId?: string;
  sourceName?: string;
  /** Councils sharing the source unit (council basis only). */
  sharedBy?: number;
}

/**
 * Facilities and DRR status come from the INFORM source units (districts). Councils show their source
 * unit's figures; regions and the nation sum over their DISTINCT source units, so a district split into
 * two councils is not counted twice.
 */
export function servicesFor(model: RiskModel, unit: Unit): ServicesInfo {
  let sources: Unit[];
  let basis: ServicesInfo['basis'];
  let src: Unit | undefined;
  if (unit.level === 'source') {
    sources = [unit];
    basis = 'self';
  } else if (unit.level === 'council') {
    src = unit.sourceId ? model.byId.get(unit.sourceId) : undefined;
    sources = src ? [src] : [];
    basis = 'source';
  } else {
    const members = unit.level === 'region' ? membersOfRegion(model, unit) : model.councils;
    const ids = new Set(members.map((c) => c.sourceId).filter((x): x is string => !!x));
    sources = [...ids].map((id) => model.byId.get(id)).filter((u): u is Unit => !!u);
    basis = 'aggregate';
  }
  const withFac = sources.filter((s) => s.facilities);
  const facilities: Facilities | null = withFac.length
    ? {
        health: withFac.reduce((a, s) => a + (s.facilities?.health ?? 0), 0),
        education: withFac.reduce((a, s) => a + (s.facilities?.education ?? 0), 0),
        water: withFac.reduce((a, s) => a + (s.facilities?.water ?? 0), 0),
        boreholes: withFac.reduce((a, s) => a + (s.facilities?.boreholes ?? 0), 0),
      }
    : null;
  const pop = withFac.reduce((a, s) => a + (s.exposure?.population ?? 0), 0);
  const drrUnits = sources.filter((s) => s.drr);
  const drr = {
    eprp: drrUnits.filter((s) => s.drr?.eprp).length,
    aa: drrUnits.filter((s) => s.drr?.aa).length,
    eocc: drrUnits.filter((s) => s.drr?.eocc).length,
    recorded: drrUnits.length,
  };
  return {
    basis,
    facilities,
    population: pop > 0 ? pop : null,
    districts: sources.length,
    withFacilities: withFac.length,
    drr,
    sourceId: src?.id,
    sourceName: src?.name,
    sharedBy: src ? model.councils.filter((c) => c.sourceId === src.id).length : undefined,
  };
}

/** Facilities per 10,000 people (one decimal), or null without a population. */
export function per10k(n: number | null | undefined, population: number | null | undefined): number | null {
  if (!isNum(n) || !isNum(population) || population <= 0) return null;
  return Math.round((n / population) * 100_000) / 10;
}

/* ------------------------------------------------------------------------------------------------ */
/* Links                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export const explorerLevel = (level: Level): Exclude<Level, 'national'> | null => (level === 'national' ? null : level);

export function explorerHref(unit: Unit): string {
  const lvl = explorerLevel(unit.level);
  return lvl ? `/explore?level=${lvl}&id=${encodeURIComponent(unit.id)}` : '/explore';
}

export function compareHref(unit: Unit): string {
  const lvl = explorerLevel(unit.level) ?? 'region';
  // The explorer pins compared areas with `cmp` (comma-separated ids) and selects with `id`.
  return unit.level === 'national' ? `/explore?level=${lvl}` : `/explore?level=${lvl}&id=${encodeURIComponent(unit.id)}&cmp=${encodeURIComponent(unit.id)}`;
}

/** Mean of a dimension score across units - used for "council average" context lines. */
export const meanOf = (units: readonly Unit[], get: (u: Unit) => number | null): number | null => mean(units.map(get));

/* ------------------------------------------------------------------------------------------------ */
/* The page's view model                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export interface AreaView {
  model: RiskModel;
  unit: Unit;
  /** Parent region (councils and source units only). */
  region: Unit | null;
  national: Unit;
  peers: Unit[];
  rank: RankInfo | null;
  rows: IndicatorRow[];
  categories: CategoryRow[];
  coverage: { have: number; total: number; pct: number };
  population: number | null;
  area: number | null;
  density: number | null;
}

export function buildAreaView(model: RiskModel, unit: Unit): AreaView {
  const region = regionOf(model, unit);
  const peers = peersOf(model, unit);
  const national = model.national;
  let population = unit.exposure?.population ?? null;
  let area = unitArea(unit);
  if (unit.level === 'national') {
    population = model.councils.reduce((a, c) => a + (c.exposure?.population ?? 0), 0) || null;
    area = model.councils.reduce((a, c) => a + (unitArea(c) ?? 0), 0) || null;
  }
  const density = isNum(population) && isNum(area) && area > 0 ? population / area : (unit.exposure?.density ?? null);
  return {
    model,
    unit,
    region,
    national,
    peers,
    rank: rankAmong(unit, peers),
    rows: indicatorRows(unit, region, national),
    categories: categoryRows(unit, region, national),
    coverage: coverageCounts(unit),
    population,
    area,
    density,
  };
}
