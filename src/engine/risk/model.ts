/**
 * The Tanzania INFORM Risk model: builds every administrative level from the shipped dataset and
 * applies approved edits as a PURE function (`buildModel(overrides)`), so the map, tables, charts and
 * area profiles always agree - including after data entry.
 *
 * Resolution design (documented in docs/METHODOLOGY.md):
 *   • 170 INFORM source units - the country-workbook backbone (reference level).
 *   • 195 NBS-2022 councils - the headline level. In the Core every council carries the scores of its
 *     workbook unit (the Core adds nothing to the workbook); it has its own census population and area.
 *     Council risk is computed live = ∛(H × V × LCC), so approved edits propagate.
 *   • 31 regions - aggregated from their councils the INFORM way: indicator means → category means →
 *     scaled geometric mean → cube root (not a mean of risk scores).
 *   • National - the INFORM aggregate of the 195 councils, built exactly as the regions are. The
 *     Tanzania workbook publishes no national score, and INFORM Global's country score uses other
 *     indicators, so neither is shown as "the" national figure.
 *
 * Every category, dimension and risk score is derived at run time from the indicator values (the
 * leaves), with the workbook's rules: categories are unrounded means, dimensions ROUND(scaled
 * geomean, 1), risk ROUND(cube root, 1). Aggregates stored in the data files are never read.
 */
import baselineRawJson from '@/data/inform-baseline-raw.json';
import riskDataset from '@/data/tanzania-inform-risk.json';
import councilIndex from '@/data/tanzania-councils-index.json';
import councilDrr from '@/data/tanzania-councils-drr.json';
import councilExposure from '@/data/tanzania-councils-exposure.json';
import { DIMENSIONS, DIMENSION_KEYS, type DimensionKey } from './hierarchy';
import { dimensionScore, isNum, mean, riskScore, round1 } from './math';
import { BENCHMARK_VALUES } from './benchmark';
import { isPortalStamp } from './stamps';
import { noteApplies, noteIndicators, QUARANTINE_NOTES } from './notes';
import { deriveRawOverrides, type BaselineRaw } from './rawValues';
import { ACTIVE_SPECS, SPECS, standardise } from './standardise';
import type { CategoryValues, DimensionValues, DrrRecordsByUnit, DrrStatus, EditRef, EditStamp, Exposure, Level, Overrides, RiskModel, Unit } from './types';

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
  };
  vulnerability: RawDimension;
  lackCopingCapacity: RawDimension;
  risk: number | null;
  facilities?: Unit['facilities'];
  drr?: Unit['drr'];
}
interface CouncilFeatureProps {
  code: string;
  name: string;
  reg: string;
  src: string;
  isNew?: boolean;
  parent?: string;
  formerly?: string;
}

const DATASET = riskDataset as unknown as {
  subnational: { adm2: RawUnit[] };
  metadata: { asOf?: string; release?: string; lastUpdated?: string; boundaries?: { set: string; councils: number; regions: number; districts: number; registry: string; procedure: string } };
};
const COUNCIL_EXPOSURE = councilExposure as unknown as Record<string, { population: number | null; density: number | null; areaKm2: number | null; source: string }>;
/**
 * The councils' DRM arrangements and committee criteria from the published PMO-DMD lists, stored compactly
 * by scripts/build-benchmark.py: one token per flag (e eprp, r rvca, a aa, t ert, o eocc, g training, a year
 * after e or r; C/c S/s I/i the committee criteria met or not met, absent when not assessed).
 */
const DRR_LETTER: Record<string, 'eprp' | 'rvca' | 'aa' | 'ert' | 'eocc' | 'training'> = { e: 'eprp', r: 'rvca', a: 'aa', t: 'ert', o: 'eocc', g: 'training' };
const GOV_LETTER: Record<string, 'committee' | 'stakeholders' | 'involvement'> = { c: 'committee', s: 'stakeholders', i: 'involvement' };
function expandDrr(code: string): DrrStatus {
  const out: DrrStatus = { eprp: false, aa: false, eocc: false, ert: false, rvca: false, training: false };
  for (const m of code.matchAll(/([A-Za-z])(\d{4})?/g)) {
    const letter = m[1];
    const flag = DRR_LETTER[letter];
    if (flag) {
      out[flag] = true;
      const year = m[2] ? Number(m[2]) : 0;
      if (year && flag === 'eprp') out.eprpYear = year;
      if (year && flag === 'rvca') out.rvcaYear = year;
      continue;
    }
    const gov = GOV_LETTER[letter.toLowerCase()];
    if (gov) out[gov] = letter === letter.toUpperCase();
  }
  return out;
}
const COUNCIL_DRR: Record<string, DrrStatus> = Object.fromEntries(Object.entries(councilDrr as unknown as Record<string, string>).map(([code, s]) => [code, expandDrr(s)]));
/** Council attributes without geometry (scripts/build-council-index.mjs) - keeps boundaries out of the app shell. */
const COUNCIL_FEATURES = (councilIndex as unknown as CouncilFeatureProps[]).map((properties) => ({ properties }));

import { placeKey } from './place';
export { placeKey };

/** Canonical region display names (from the NBS-2022 council file), keyed by placeKey. */
const REGION_NAMES = new Map<string, string>();
for (const f of COUNCIL_FEATURES) REGION_NAMES.set(placeKey(f.properties.reg), f.properties.reg);
export const regionDisplayName = (name: string): string => REGION_NAMES.get(placeKey(name)) ?? name;

/* ------------------------------------------------------------------------------------------------ */
/* Normalisation: raw dataset → clean Unit shape                                                     */
/* ------------------------------------------------------------------------------------------------ */

/**
 * A dimension from its indicator values. Category and dimension scores are always recomputed with the
 * workbook's rules (unrounded category means; ROUND(scaled geomean, 1)); the `aggregate` and `total`
 * fields that the data files carry are ignored, so a stored rounding can never change a class.
 */
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
    categories[cat.key] = { score: mean(Object.values(indicators)), indicators };
  }
  return { score: dimensionScore(Object.values(categories).map((c) => c.score)), categories };
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
  const dims = {
    hazard: readDimension(u.hazardExposure, 'hazard'),
    vulnerability: readDimension(u.vulnerability, 'vulnerability'),
    coping: readDimension(u.lackCopingCapacity, 'coping'),
  };
  return {
    id: u.admin.adm2Code,
    level,
    name: u.admin.adm2Name,
    region: regionDisplayName(u.admin.adm1Name),
    dims,
    risk: riskScore(dims.hazard.score, dims.vulnerability.score, dims.coping.score),
    exposure: readExposure(u.hazardExposure.exposure),
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
 * An exposure edit changes the exposure index shown; it never alters a score (the workbook's flood
 * indicator already measures exposed population). Edited dimensions are recomputed from their indicators.
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

/* ------------------------------------------------------------------------------------------------ */
/* Quarantine: workbook values that fail validation are withheld from the live model                  */
/* ------------------------------------------------------------------------------------------------ */

/** Workbook indicators behind each group, by the workbook component name (matched like sources.ts). */
const normName = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const LEAF_BY_COMPONENT = new Map<string, EditRef>();
for (const d of DIMENSIONS) for (const c of d.categories) for (const i of c.indicators) for (const n of [...i.workbook, i.en]) LEAF_BY_COMPONENT.set(normName(n), `${d.key}:${i.key}` as EditRef);
const BASELINE = baselineRawJson as { units: string[]; values: Record<string, Array<number | null>> };
/** The workbook's measured values per source unit (the evidence behind a workbook value). */
export const WORKBOOK_RAW: { units: string[]; values: Record<string, Array<number | null>> } = BASELINE;

/**
 * The group's value from its remaining workbook indicators once one is withheld: the mean of the
 * standardised indicators that have data (the workbook's own rule for a group), or null when none is left.
 */
function groupWithout(unitId: string, ref: EditRef, excluded: readonly string[]): number | null {
  const i = BASELINE.units.indexOf(unitId);
  if (i < 0) return null;
  const scores: number[] = [];
  for (const spec of Object.values(SPECS)) {
    if (spec.use !== 'Yes' || excluded.includes(spec.id) || LEAF_BY_COMPONENT.get(normName(spec.component ?? '')) !== ref) continue;
    const s = standardise(BASELINE.values[spec.id]?.[i] ?? null, spec);
    if (isNum(s)) scores.push(s);
  }
  return scores.length ? mean(scores) : null;
}

/**
 * Withhold the workbook values the integrity recheck quarantined (src/data/inform-data-notes.json,
 * `quarantine: true`): a value that contradicts documented events, the workbook's other indicators or
 * the indicator's own definition is treated as missing for the unit, as INFORM treats data that fails
 * validation, until an institution supplies the value through the Data portal (an approved edit on the
 * ref replaces it) or the workbook is corrected. A group with other indicators is recomputed from them.
 * The workbook itself is untouched: buildModel(…, { workbookOnly: true }) builds it exactly.
 */
function applyQuarantine(unit: Unit): Unit {
  const quarantined: NonNullable<Unit['quarantined']> = {};
  const dims = { ...unit.dims };
  for (const note of QUARANTINE_NOTES) {
    const [dim, key] = note.ref.split(':') as [DimensionKey, string];
    const current = Object.values(dims[dim].categories).find((c) => c && key in c.indicators)?.indicators[key];
    if (!noteApplies(note, unit, isNum(current) ? current : null)) continue;
    const catKey = Object.entries(dims[dim].categories).find(([, c]) => c && key in c.indicators)?.[0];
    if (!catKey) continue;
    const replacement = groupWithout(unit.id, note.ref as EditRef, noteIndicators(note));
    const cat = dims[dim].categories[catKey];
    dims[dim] = recomputeDimension({ score: null, categories: { ...dims[dim].categories, [catKey]: { ...cat, indicators: { ...cat.indicators, [key]: replacement } } } });
    quarantined[note.ref as EditRef] = note.id;
  }
  if (!Object.keys(quarantined).length) return unit;
  return { ...unit, dims, risk: riskScore(dims.hazard.score, dims.vulnerability.score, dims.coping.score), quarantined };
}

/** The 170 workbook units exactly as the workbook has them (the reference the tests prove). */
const BASE_SOURCES_WORKBOOK: Unit[] = DATASET.subnational.adm2.map((u) => fromRawUnit(u, 'source'));
/** The 170 workbook units as the live model carries them: the quarantined values withheld. */
const BASE_SOURCES: Unit[] = BASE_SOURCES_WORKBOOK.map(applyQuarantine);

export const DATA_AS_OF = DATASET.metadata.asOf ?? DATASET.metadata.lastUpdated?.slice(0, 7) ?? '';
/** The release of the Core dataset (metadata.release, e.g. core-2026.10), stamped on every export. */
export const DATA_RELEASE: string = DATASET.metadata.release ?? 'core';
/** The boundary set of the council level (metadata.boundaries), shown on the Methodology page (ADM-04). */
export const BOUNDARY_SET: { set: string; councils: number; regions: number; districts: number; registry: string; procedure: string } | null = DATASET.metadata.boundaries ?? null;

export interface ModelExtras {
  /** Approved DRR capacity records by council or region id; a region's record supplies the EOCC of its councils. */
  drr?: DrrRecordsByUnit;
  /** Build from the workbook exactly, with no value withheld and no benchmark value (the verification tests); the live model never does. */
  workbookOnly?: boolean;
  /**
   * Apply the Benchmark 2026 institutional values (benchmark.ts) as approved values under the given
   * overrides (the more recent value wins). Default true; false for a dated version before the benchmark
   * date and for the parity tests.
   */
  benchmark?: boolean;
}

/** The later of two approved stamps on the same leaf wins (a council's benchmark value against a newer approved edit). */
function mergeStamps(benchmark: Partial<Record<EditRef, EditStamp>> | undefined, own: Partial<Record<EditRef, EditStamp>> | undefined): Partial<Record<EditRef, EditStamp>> | undefined {
  if (!benchmark) return own;
  if (!own) return benchmark;
  const out: Partial<Record<EditRef, EditStamp>> = { ...benchmark };
  for (const [ref, stamp] of Object.entries(own) as Array<[EditRef, EditStamp]>) {
    const b = out[ref];
    if (!b || Date.parse(stamp.at) >= Date.parse(b.at)) out[ref] = stamp;
  }
  return out;
}

/**
 * A council's arrangements: its own approved record over the published flags; the region's centre, team,
 * training and committee criteria over its own only where its own record is silent (the regional record
 * speaks for the region's councils, a district record for the district).
 */
export function drrFor(published: DrrStatus | undefined, own: DrrRecordsByUnit[string] | undefined, region: DrrRecordsByUnit[string] | undefined): DrrStatus | undefined {
  if (!own && !region) return published;
  const out: DrrStatus = {
    eprp: own?.eprp ?? published?.eprp ?? false,
    aa: own?.aa ?? published?.aa ?? false,
    eocc: region?.eocc ?? own?.eocc ?? published?.eocc ?? false,
  };
  const ert = own?.ert ?? region?.ert ?? published?.ert;
  if (ert != null) out.ert = ert;
  const rvca = own?.rvca ?? published?.rvca;
  if (rvca != null) out.rvca = rvca;
  const training = own?.training ?? region?.training ?? published?.training;
  if (training != null) out.training = training;
  for (const k of ['committee', 'stakeholders', 'involvement'] as const) {
    const v = own?.[k] ?? region?.[k] ?? published?.[k];
    if (v != null) out[k] = v;
  }
  const eprpYear = own?.eprpYear ?? published?.eprpYear;
  if (eprpYear != null) out.eprpYear = eprpYear;
  const rvcaYear = own?.rvcaYear ?? published?.rvcaYear;
  if (rvcaYear != null) out.rvcaYear = rvcaYear;
  return out;
}

/** Build every level, applying the given approved edits (and records). Pure: the shipped dataset is never mutated. */
export function buildModel(overrides: Overrides = {}, extras: ModelExtras = {}): RiskModel {
  // 1. Source units (170) - Vulnerability & Coping backbone.
  const sources = (extras.workbookOnly ? BASE_SOURCES_WORKBOOK : BASE_SOURCES).map((s) => applyEdits({ ...s, dims: { ...s.dims }, edits: {} }, overrides[s.id]));
  const sourceByName = new Map(sources.map((s) => [placeKey(s.name), s]));

  // 2. Councils (195) - the (edited) scores of their workbook unit, their own population; risk live.
  const councils: Unit[] = [];
  for (const f of COUNCIL_FEATURES) {
    const p = f.properties;
    const src = sourceByName.get(placeKey(p.src));
    if (!src) continue;
    const ex = COUNCIL_EXPOSURE[String(p.code)];
    const council: Unit = {
      id: String(p.code),
      level: 'council',
      name: p.name,
      region: regionDisplayName(p.reg),
      // Shared, read-only dimension objects; applyEdits copies on write.
      dims: { hazard: src.dims.hazard, vulnerability: src.dims.vulnerability, coping: src.dims.coping },
      risk: null,
      exposure: ex ? { index: null, population: ex.population, density: ex.density, areaKm2: ex.areaKm2, source: ex.source } : src.exposure,
      facilities: src.facilities,
      // The council's own published arrangements (district plans, regional centres and teams); the
      // workbook unit's flags only for a council the lists do not cover.
      drr: COUNCIL_DRR[String(p.code)] ?? src.drr,
      sourceId: src.id,
      sourceName: src.name,
      inheritedFrom: p.isNew ? (p.parent ?? src.name) : null,
      formerly: p.formerly ?? null,
      // Edits made on the unit are visible on every council that shares it.
      edits: { ...src.edits },
      ...(src.quarantined ? { quarantined: src.quarantined } : {}),
    };
    // Values recorded for this council (measured values resolved per council, direct council edits)
    // take precedence over the unit's; the Benchmark 2026 values count as approved values of their date.
    const withBenchmark = !extras.workbookOnly && extras.benchmark !== false;
    applyEdits(council, withBenchmark ? mergeStamps(BENCHMARK_OVERRIDES?.[council.id], overrides[council.id]) : overrides[council.id]);
    council.risk = riskScore(council.dims.hazard.score, council.dims.vulnerability.score, council.dims.coping.score);
    if (extras.drr) council.drr = drrFor(council.drr, extras.drr[council.id], extras.drr[`R-${placeKey(council.region)}`]);
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

  // 4. National - the INFORM aggregate of every council (never a mean of risk scores, never a
  //    published figure: the workbook has none). Approved edits reach it through the councils.
  const national = aggregateUnits(councils, 'TZ', 'Tanzania', 'national');

  const byId = new Map<string, Unit>();
  for (const u of [...sources, ...councils, ...regions, national]) byId.set(u.id, u);

  // Updates approved through the Data portal only: benchmark and Advancement stamps are not updates (stamps.ts).
  const editCount = Object.values(overrides).reduce((s, e) => s + Object.values(e ?? {}).filter((st) => isPortalStamp(st)).length, 0);
  return { councils, regions, national, sources, byId, councilsByRegion, asOf: DATA_AS_OF, editCount, ...(extras.drr ? { drrRecords: extras.drr } : {}) };
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

/**
 * The Benchmark 2026 values as council leaf stamps (benchmark.ts): derived once, like the data
 * portal derives an institution's approved measured values, against the model without them, so that
 * every stamp lists its inputs (the benchmark value and the workbook baseline of the leaf's other
 * indicators). Built after `buildModel` is defined; `buildModel(…, { benchmark: false })` never reads it.
 */
export const BENCHMARK_OVERRIDES: Overrides = deriveRawOverrides(BENCHMARK_VALUES, buildModel({}, { benchmark: false }), BASELINE as unknown as BaselineRaw, ACTIVE_SPECS);
