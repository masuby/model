/**
 * The Tanzania INFORM Risk model: builds every administrative level from the shipped dataset and
 * applies approved edits as a PURE function (`buildModel(overrides)`), so the map, tables, charts and
 * area profiles always agree - including after data entry.
 *
 * Resolution design (documented in docs/METHODOLOGY.md):
 *   • 170 INFORM source units - the country-workbook backbone (reference level).
 *   • 195 NBS-2022 councils - the headline level. Each council has its OWN Hazard & Exposure (computed
 *     on its own polygon); Vulnerability & Coping come from its source unit (survey data has no council
 *     breakdown). Council risk is computed live = ∛(H × V × LCC).
 *   • 31 regions - aggregated from their councils the INFORM way: indicator means → category means →
 *     scaled geometric mean → cube root (not a mean of risk scores).
 *   • National - the OFFICIAL INFORM Tanzania country figure (4.1), never a re-aggregation.
 */
import riskDataset from '@/data/tanzania-inform-risk.json';
import councilIndex from '@/data/tanzania-councils-index.json';
import councilHazardData from '@/data/tanzania-councils-data.json';
import { DIMENSIONS, DIMENSION_KEYS, type DimensionKey } from './hierarchy';
import { dimensionScore, isNum, mean, riskScore, round1 } from './math';
import type { CategoryValues, DimensionValues, EditRef, EditStamp, Exposure, Level, Overrides, RiskModel, Unit } from './types';

/* ------------------------------------------------------------------------------------------------ */
/* Raw dataset typing                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

type RawCategory = Record<string, number | null | undefined> & { aggregate?: number | null };
interface RawDimension {
  total?: number | null;
  [category: string]: RawCategory | number | null | undefined | object;
}
interface RawUnit {
  admin: { adm1Name: string; adm2Name: string; adm2Code: string; adm1Code?: string };
  hazardExposure: RawDimension & {
    exposure?: { index?: number; population?: number; density?: number; areaKm2?: number; _src?: string };
    hazardFreq?: Record<string, number>;
    events?: { flood?: number[] };
  };
  vulnerability: RawDimension;
  lackCopingCapacity: RawDimension;
  risk: number | null;
  facilities?: Unit['facilities'];
  drr?: Unit['drr'];
}
interface RawNational {
  risk: number;
  dimensions: { hazardExposure: RawDimension; vulnerability: RawDimension; lackCopingCapacity: RawDimension };
}
interface CouncilFeatureProps {
  code: string;
  name: string;
  reg: string;
  src: string;
  isNew?: boolean;
  parent?: string;
}

const DATASET = riskDataset as unknown as {
  national: RawNational;
  subnational: { adm2: RawUnit[] };
  metadata: { asOf?: string; lastUpdated?: string };
};
const COUNCIL_HAZARD = councilHazardData as unknown as Record<string, { hazardExposure: RawUnit['hazardExposure']; risk: number }>;
/** Council attributes without geometry (scripts/build-council-index.mjs) - keeps boundaries out of the app shell. */
const COUNCIL_FEATURES = (councilIndex as unknown as CouncilFeatureProps[]).map((properties) => ({ properties }));

/** Normalise a place name for joins ("Dar-es-salaam" ≡ "Dar es Salaam"). */
export const placeKey = (name: string | null | undefined): string => String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Canonical region display names (from the NBS-2022 council file), keyed by placeKey. */
const REGION_NAMES = new Map<string, string>();
for (const f of COUNCIL_FEATURES) REGION_NAMES.set(placeKey(f.properties.reg), f.properties.reg);
export const regionDisplayName = (name: string): string => REGION_NAMES.get(placeKey(name)) ?? name;

/* ------------------------------------------------------------------------------------------------ */
/* Normalisation: raw dataset → clean Unit shape                                                     */
/* ------------------------------------------------------------------------------------------------ */

function readDimension(raw: RawDimension | undefined, dimKey: DimensionKey): DimensionValues {
  const def = DIMENSIONS.find((d) => d.key === dimKey)!;
  const categories: Record<string, CategoryValues> = {};
  for (const cat of def.categories) {
    const rc = (raw?.[cat.key] ?? {}) as RawCategory;
    const indicators: Record<string, number | null> = {};
    for (const ind of cat.indicators) {
      const v = rc[ind.key];
      indicators[ind.key] = isNum(v) ? v : null;
    }
    categories[cat.key] = {
      score: isNum(rc.aggregate) ? rc.aggregate : mean(Object.values(indicators)),
      indicators,
    };
  }
  const total = raw?.total;
  return { score: isNum(total) ? total : dimensionScore(Object.values(categories).map((c) => c.score)), categories };
}

function readExposure(raw: RawUnit['hazardExposure']['exposure']): Exposure | undefined {
  if (!raw) return undefined;
  return {
    index: isNum(raw.index) ? raw.index : null,
    population: isNum(raw.population) ? raw.population : null,
    density: isNum(raw.density) ? raw.density : null,
    areaKm2: isNum(raw.areaKm2) ? raw.areaKm2 : null,
    source: raw._src,
  };
}

function fromRawUnit(u: RawUnit, level: Level): Unit {
  return {
    id: u.admin.adm2Code,
    level,
    name: u.admin.adm2Name,
    region: regionDisplayName(u.admin.adm1Name),
    dims: {
      hazard: readDimension(u.hazardExposure, 'hazard'),
      vulnerability: readDimension(u.vulnerability, 'vulnerability'),
      coping: readDimension(u.lackCopingCapacity, 'coping'),
    },
    risk: isNum(u.risk) ? u.risk : null,
    exposure: readExposure(u.hazardExposure.exposure),
    floodHazard: u.hazardExposure.hazardFreq?.flood ?? null,
    floodEvents: u.hazardExposure.events?.flood,
    facilities: u.facilities,
    drr: u.drr,
    edits: {},
  };
}


/* ------------------------------------------------------------------------------------------------ */
/* Recalculation                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

/** Recompute one dimension from its indicators: category = mean, dimension = scaled geomean. */
export function recomputeDimension(dim: DimensionValues): DimensionValues {
  for (const cat of Object.values(dim.categories)) cat.score = mean(Object.values(cat.indicators));
  dim.score = dimensionScore(Object.values(dim.categories).map((c) => c.score));
  return dim;
}

function setIndicator(unit: Unit, dimKey: DimensionKey, key: string, value: number | null): boolean {
  for (const cat of Object.values(unit.dims[dimKey].categories)) {
    if (key in cat.indicators) {
      cat.indicators[key] = value;
      return true;
    }
  }
  return false;
}

/**
 * Apply a set of approved edits to a unit. Copy-on-write: a dimension is cloned only when one of its
 * indicators is edited, so unedited units can safely share the shipped (read-only) dimension objects.
 * Exposure edits amplify flood as INFORM's Hazard × Exposure term: flood = max(h, √(h × exposure)),
 * unless flood itself was edited. Edited dimensions are recomputed from their indicators.
 */
export function applyEdits(unit: Unit, edits: Partial<Record<EditRef, EditStamp>> | undefined): Unit {
  if (!edits || !Object.keys(edits).length) return unit;
  const touched = new Set<DimensionKey>();
  const own = new Set<DimensionKey>();
  const writable = (dim: DimensionKey) => {
    if (!own.has(dim)) {
      unit.dims = { ...unit.dims, [dim]: structuredClone(unit.dims[dim]) };
      own.add(dim);
    }
    return unit;
  };

  for (const [ref, stamp] of Object.entries(edits) as Array<[EditRef, EditStamp]>) {
    if (ref === 'hazard:exposure') continue;
    const [dim, key] = ref.split(':') as [DimensionKey, string];
    if (!DIMENSION_KEYS.includes(dim)) continue;
    const value = isNum(stamp.value) ? Math.max(0, Math.min(10, stamp.value)) : null;
    if (Object.values(unit.dims[dim].categories).some((c) => key in c.indicators)) {
      setIndicator(writable(dim), dim, key, value);
      touched.add(dim);
      unit.edits[ref] = stamp;
    }
  }

  const exp = edits['hazard:exposure'];
  if (exp && isNum(exp.value)) {
    unit.exposure = { ...(unit.exposure ?? { population: null, density: null }), index: exp.value };
    unit.edits['hazard:exposure'] = exp;
    const h = unit.floodHazard;
    if (isNum(h) && !edits['hazard:flood']) {
      setIndicator(writable('hazard'), 'hazard', 'flood', round1(Math.max(h, Math.sqrt(h * Math.max(exp.value, 0)))));
      touched.add('hazard');
    }
  }

  for (const d of touched) recomputeDimension(unit.dims[d]);
  if (touched.size) unit.risk = riskScore(unit.dims.hazard.score, unit.dims.vulnerability.score, unit.dims.coping.score);
  return unit;
}

/** INFORM aggregation of several units into one (region): indicator means → categories → dimensions → risk. */
export function aggregateUnits(members: Unit[], id: string, name: string, level: Level = 'region'): Unit {
  const dims = {} as Unit['dims'];
  for (const def of DIMENSIONS) {
    const categories: Record<string, CategoryValues> = {};
    for (const cat of def.categories) {
      const indicators: Record<string, number | null> = {};
      for (const ind of cat.indicators) {
        indicators[ind.key] = mean(members.map((m) => m.dims[def.key].categories[cat.key]?.indicators[ind.key]));
      }
      categories[cat.key] = { score: null, indicators };
    }
    dims[def.key] = recomputeDimension({ score: null, categories });
  }
  const population = members.reduce((s, m) => s + (m.exposure?.population ?? 0), 0);
  // Area is not stored for every council; recover it as population ÷ density where needed.
  const areaOf = (m: Unit) =>
    m.exposure?.areaKm2 ?? (isNum(m.exposure?.population) && isNum(m.exposure?.density) && m.exposure.density > 0 ? m.exposure.population / m.exposure.density : 0);
  const area = members.reduce((s, m) => s + areaOf(m), 0);
  // Facilities are recorded per INFORM source unit and copied onto each council that shares it, so sum
  // over DISTINCT source units - otherwise districts split into several councils are counted twice.
  const facilityUnits = [...new Map(members.map((m) => [m.sourceId ?? m.id, m])).values()];
  const sumFac = (k: keyof NonNullable<Unit['facilities']>) => facilityUnits.reduce((s, m) => s + (m.facilities?.[k] ?? 0), 0);
  const edits: Unit['edits'] = {};
  for (const m of members) Object.assign(edits, m.edits);
  return {
    id,
    level,
    name,
    region: name,
    dims,
    risk: riskScore(dims.hazard.score, dims.vulnerability.score, dims.coping.score),
    exposure: {
      index: mean(members.map((m) => m.exposure?.index)),
      population: population || null,
      density: population && area ? round1(population / area) : mean(members.map((m) => m.exposure?.density)),
      areaKm2: area || null,
    },
    facilities: members.some((m) => m.facilities)
      ? { health: sumFac('health'), education: sumFac('education'), water: sumFac('water'), boreholes: sumFac('boreholes') }
      : undefined,
    members: members.length,
    edits,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Build                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

const BASE_SOURCES: Unit[] = DATASET.subnational.adm2.map((u) => fromRawUnit(u, 'source'));

const NATIONAL: Unit = {
  id: 'TZ',
  level: 'national',
  name: 'Tanzania',
  region: 'Tanzania',
  dims: {
    hazard: readDimension(DATASET.national.dimensions.hazardExposure, 'hazard'),
    vulnerability: readDimension(DATASET.national.dimensions.vulnerability, 'vulnerability'),
    coping: readDimension(DATASET.national.dimensions.lackCopingCapacity, 'coping'),
  },
  risk: DATASET.national.risk,
  edits: {},
};

/** Council-specific hazard dimensions, parsed once (read-only; applyEdits copies on write). */
const COUNCIL_HAZARD_DIMS = new Map<string, DimensionValues>();
function councilBaseHazard(code: string): DimensionValues | null {
  const ch = COUNCIL_HAZARD[code];
  if (!ch) return null;
  let d = COUNCIL_HAZARD_DIMS.get(code);
  if (!d) {
    d = readDimension(ch.hazardExposure, 'hazard');
    COUNCIL_HAZARD_DIMS.set(code, d);
  }
  return d;
}

export const OFFICIAL_NATIONAL_RISK = DATASET.national.risk;
export const DATA_AS_OF = DATASET.metadata.asOf ?? DATASET.metadata.lastUpdated?.slice(0, 7) ?? '';

/** Build every level, applying the given approved edits. Pure: the shipped dataset is never mutated. */
export function buildModel(overrides: Overrides = {}): RiskModel {
  // 1. Source units (170) - Vulnerability & Coping backbone.
  const sources = BASE_SOURCES.map((s) => applyEdits({ ...s, dims: { ...s.dims }, edits: {} }, overrides[s.id]));
  const sourceByName = new Map(sources.map((s) => [placeKey(s.name), s]));

  // 2. Councils (195) - own Hazard & Exposure; V & C from the (edited) source unit; risk live.
  const councils: Unit[] = [];
  for (const f of COUNCIL_FEATURES) {
    const p = f.properties;
    const src = sourceByName.get(placeKey(p.src));
    if (!src) continue;
    const ch = COUNCIL_HAZARD[String(p.code)];
    const hazard = councilBaseHazard(String(p.code)) ?? src.dims.hazard;
    const council: Unit = {
      id: String(p.code),
      level: 'council',
      name: p.name,
      region: regionDisplayName(p.reg),
      // Shared, read-only dimension objects; applyEdits copies on write.
      dims: { hazard, vulnerability: src.dims.vulnerability, coping: src.dims.coping },
      risk: null,
      exposure: ch ? readExposure(ch.hazardExposure.exposure) : src.exposure,
      floodHazard: ch?.hazardExposure.hazardFreq?.flood ?? src.floodHazard,
      floodEvents: src.floodEvents,
      facilities: src.facilities,
      drr: src.drr,
      sourceId: src.id,
      sourceName: src.name,
      inheritedFrom: p.isNew ? (p.parent ?? src.name) : null,
      // V & C edits made on the source unit are visible on every council that shares it.
      edits: Object.fromEntries(Object.entries(src.edits).filter(([k]) => !k.startsWith('hazard:'))),
    };
    // Hazard/exposure edits keyed on the SOURCE unit (region/nation bulk entry, edits migrated from the
    // previous app) apply to each of its councils first; the council's own edits then take precedence.
    const srcHazard = Object.fromEntries(Object.entries(overrides[src.id] ?? {}).filter(([k]) => k.startsWith('hazard:')));
    applyEdits(council, { ...srcHazard, ...overrides[council.id] });
    council.risk = riskScore(council.dims.hazard.score, council.dims.vulnerability.score, council.dims.coping.score);
    councils.push(council);
  }

  // 3. Regions (31) - INFORM aggregation over their councils.
  const councilsByRegion = new Map<string, Unit[]>();
  for (const c of councils) {
    const k = placeKey(c.region);
    if (!councilsByRegion.has(k)) councilsByRegion.set(k, []);
    councilsByRegion.get(k)!.push(c);
  }
  const regions = [...councilsByRegion.entries()].map(([k, list]) => aggregateUnits(list, `R-${k}`, list[0].region));

  // 4. National - official figure.
  const national: Unit = { ...NATIONAL, dims: { ...NATIONAL.dims }, edits: {} };

  const byId = new Map<string, Unit>();
  for (const u of [...sources, ...councils, ...regions, national]) byId.set(u.id, u);

  const editCount = Object.values(overrides).reduce((s, e) => s + Object.keys(e ?? {}).length, 0);
  return { councils, regions, national, sources, byId, councilsByRegion, asOf: DATA_AS_OF, editCount };
}

export function unitsAt(model: RiskModel, level: Level): Unit[] {
  switch (level) {
    case 'council':
      return model.councils;
    case 'region':
      return model.regions;
    case 'national':
      return [model.national];
    case 'source':
      return model.sources;
  }
}

/** Share (0–100) of a unit's leaf indicators that carry data - INFORM's reliability signal. */
export function dataCoverage(unit: Unit): number {
  let have = 0;
  let total = 0;
  for (const def of DIMENSIONS)
    for (const cat of def.categories)
      for (const ind of cat.indicators) {
        total++;
        if (isNum(unit.dims[def.key].categories[cat.key]?.indicators[ind.key])) have++;
      }
  return total ? Math.round((have / total) * 100) : 0;
}

/** Top-N indicators by score within a dimension (or across all), for "what drives risk here". */
export function topDrivers(unit: Unit, n = 5, dim?: DimensionKey): Array<{ dim: DimensionKey; category: string; key: string; value: number }> {
  const out: Array<{ dim: DimensionKey; category: string; key: string; value: number }> = [];
  for (const def of DIMENSIONS) {
    if (dim && def.key !== dim) continue;
    for (const cat of def.categories)
      for (const ind of cat.indicators) {
        const v = unit.dims[def.key].categories[cat.key]?.indicators[ind.key];
        if (isNum(v)) out.push({ dim: def.key, category: cat.key, key: ind.key, value: v });
      }
  }
  return out.sort((a, b) => b.value - a.value).slice(0, n);
}

/** Read any indicator value from a unit. */
export function indicatorValue(unit: Unit, dim: DimensionKey, key: string): number | null {
  for (const cat of Object.values(unit.dims[dim].categories)) if (key in cat.indicators) return cat.indicators[key];
  return null;
}
