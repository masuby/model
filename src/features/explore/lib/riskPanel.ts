/**
 * The risk communication panel's content, as pure functions over the model (no React, testable):
 *
 *   dimensionGroups the indicator groups of a dimension with a value, highest first, each with a mark
 *                  when the value is a regional or national figure repeated on every council;
 *   evidenceFor    the measured values behind one indicator group of an area, each with its unit,
 *                  period, source, institution and origin (workbook, Benchmark 2026, portal update,
 *                  Advancement), and the short detail its source gives;
 *   memberSpread   for a region or the nation, how the group's value spreads over the members;
 *   groupRanks     where the area sits on the group, among its level and within its region;
 *   guideKeysFor   the Guide Book hazards that map onto an INFORM group (the hazard crosswalk).
 *
 * Standing risk only: no warning level is ever derived here.
 */
import { benchmarkDatasetFor } from '@/engine/risk/benchmark';
import { ALL_INDICATORS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { indicatorValue, placeKey, unitsAt, WORKBOOK_RAW } from '@/engine/risk/model';
import { noteById, noteIndicators } from '@/engine/risk/notes';
import { leafSpecs } from '@/engine/risk/rawValues';
import { sourceFor, workbookIndicatorsFor } from '@/engine/risk/sources';
import { ADVANCED_SPECS, ACTIVE_SPECS, SPECS, standardise } from '@/engine/risk/standardise';
import { ADVANCEMENT_AUTHORITY } from '@/engine/risk/stamps';
import type { EditRef, LeafInput, RiskModel, Unit } from '@/engine/risk/types';
import { CROSSWALK } from '@/features/guide/crosswalk';
import type { HazardKey } from '@/features/guide/data';

/* ------------------------------------------------------------------------------------------------ */
/* The highest-scoring groups of each dimension                                                      */
/* ------------------------------------------------------------------------------------------------ */

export interface TopGroup {
  dim: DimensionKey;
  key: string;
  score: number;
  /** The value is a regional or national figure repeated on every council of the area. */
  coarse: 'region' | 'national' | null;
  /** The map lens that shows this group. */
  metricKey: `ind:${DimensionKey}:${string}`;
}

/** Whether the live value of a group on this unit is a regional or national figure (a council reads it as its own otherwise). */
export function coarseOf(unit: Unit, ref: string): 'region' | 'national' | null {
  if (unit.level === 'national') return null;
  const [dim, key] = ref.split(':') as [DimensionKey, string];
  const stamp = unit.edits[ref as EditRef];
  let resolution: string | null = null;
  if (stamp?.inputs?.length) {
    const measured = stamp.inputs.filter((i) => i.level !== 'baseline');
    const levels = new Set(measured.map((i) => (i.release ? (benchmarkDatasetFor(i.specId)?.resolution ?? i.level) : i.level)));
    resolution = [...levels].some((l) => /^national/.test(String(l))) ? 'national' : [...levels].some((l) => /^(region|police region)/.test(String(l))) ? 'region' : null;
    if (!measured.length) resolution = sourceFor(dim, key).resolution;
  } else resolution = sourceFor(dim, key).resolution;
  if (resolution === 'national') return 'national';
  if (resolution === 'region' && unit.level !== 'region') return 'region';
  return null;
}

/**
 * The groups of a dimension with a value on the area, highest first: the risk profile beside the map and
 * the panel's highest-scoring groups read it. A hazard group at 0 is left out (no hazard here); a
 * vulnerability or coping group keeps its 0 (it is a measured value).
 */
export function dimensionGroups(unit: Unit, dim: DimensionKey): TopGroup[] {
  return ALL_INDICATORS.filter((l) => l.dimension.key === dim)
    .map((l) => ({ key: l.indicator.key, score: indicatorValue(unit, dim, l.indicator.key) }))
    .filter((g): g is { key: string; score: number } => isNum(g.score) && (dim !== 'hazard' || g.score > 0))
    .sort((a, b) => b.score - a.score)
    .map((g) => ({ dim, key: g.key, score: g.score, coarse: coarseOf(unit, `${dim}:${g.key}`), metricKey: `ind:${dim}:${g.key}` as const }));
}

export function guideKeysFor(ref: string): HazardKey[] {
  return CROSSWALK.filter((e) => e.guide && e.groups.includes(ref as never)).map((e) => e.guide as HazardKey);
}

/* ------------------------------------------------------------------------------------------------ */
/* Evidence                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

export type EvidenceOrigin = 'workbook' | 'benchmark' | 'portal' | 'advancement';

export interface EvidenceLine {
  specId: string;
  /** Measured value in the indicator's unit, or null (no data, or withheld). */
  raw: number | null;
  /** Its 0-10 score with the workbook's method, when it can be scored. */
  score: number | null;
  /** The indicator's unit as its specification records it. */
  unit: string | null;
  period: string | null;
  /** The dataset or the source the value comes from. */
  source: string | null;
  institution: string | null;
  /** The level the value was recorded at: council, region, national, or the workbook unit. */
  level: string | null;
  origin: EvidenceOrigin;
  /** Short evidence the source gives (the storms behind a swath, the IPC district…). */
  detail: string | null;
  /** The data note that withholds the workbook value, if any. */
  withheld: string | null;
}

const specOf = (id: string) => ACTIVE_SPECS[id] ?? ADVANCED_SPECS[id] ?? SPECS[id] ?? null;

/** Workbook metadata of one indicator (source and year), when the workbook records it. */
function workbookMeta(dim: DimensionKey, key: string, specId: string): { source: string | null; period: string | null } {
  const m = workbookIndicatorsFor(dim, key).find((w) => w.id === specId);
  return { source: m?.source ?? null, period: m?.year ? String(m.year) : null };
}

function lineFromInput(i: LeafInput, dim: DimensionKey, key: string, stampAuthority: string | undefined, withheldNote: string | null): EvidenceLine {
  const spec = specOf(i.specId);
  const origin: EvidenceOrigin = i.level === 'baseline' ? 'workbook' : i.release ? 'benchmark' : stampAuthority === ADVANCEMENT_AUTHORITY ? 'advancement' : 'portal';
  const meta = origin === 'workbook' ? workbookMeta(dim, key, i.specId) : { source: i.dataset ?? i.source ?? null, period: i.period ?? null };
  return {
    specId: i.specId,
    raw: isNum(i.raw) ? i.raw : null,
    score: isNum(i.score) ? i.score : null,
    unit: spec?.unit?.trim() || null,
    period: meta.period,
    source: meta.source,
    institution: origin === 'workbook' ? 'INFORM' : (i.institution ?? null),
    level: i.level,
    origin,
    detail: i.detail ?? null,
    withheld: i.withheld ? withheldNote : null,
  };
}

/**
 * The measured values behind one indicator group of a council or a workbook unit. A value an
 * institution, the Benchmark 2026 or the Advancement layer supplied comes from the stamp's inputs; a
 * workbook value from the workbook's measured values. Regions and the nation have no values of their
 * own (see memberSpread).
 */
export function evidenceFor(unit: Unit, dim: DimensionKey, key: string): EvidenceLine[] {
  if (unit.level === 'region' || unit.level === 'national') return [];
  const ref = `${dim}:${key}` as EditRef;
  const withheldNote = unit.quarantined?.[ref] ?? null;
  const stamp = unit.edits[ref];
  if (stamp?.inputs?.length) {
    // The Advancement stamp lists the Core value of the group first; the members follow.
    return stamp.inputs.filter((i) => !(stamp.authority === ADVANCEMENT_AUTHORITY && i.level === 'baseline')).map((i) => lineFromInput(i, dim, key, stamp.authority, withheldNote));
  }
  const sourceId = unit.level === 'source' ? unit.id : unit.sourceId;
  const index = sourceId ? WORKBOOK_RAW.units.indexOf(sourceId) : -1;
  const leaf = leafSpecs(SPECS).find((l) => l.ref === ref);
  if (!leaf) return [];
  const withheldNoteDef = noteById(withheldNote);
  const withheldSpecs = withheldNoteDef ? noteIndicators(withheldNoteDef) : [];
  return leaf.specs.map((spec) => {
    const raw = index >= 0 ? WORKBOOK_RAW.values[spec.id]?.[index] : null;
    const withheld = withheldSpecs.includes(spec.id) ? withheldNote : null;
    const meta = workbookMeta(dim, key, spec.id);
    return {
      specId: spec.id,
      raw: withheld || !isNum(raw) ? null : raw,
      score: withheld || !isNum(raw) ? null : standardise(raw, spec),
      unit: spec.unit?.trim() || null,
      period: meta.period,
      source: meta.source,
      institution: 'INFORM',
      level: sourceId ?? null,
      origin: 'workbook' as const,
      detail: null,
      withheld,
    };
  });
}

export interface MemberSpread {
  /** Members with a value, and all members. */
  withData: number;
  total: number;
  /** The highest members, highest first. */
  top: Array<{ unit: Unit; value: number }>;
}

/** How a group's value spreads over the members of a region (its councils) or of the nation (its regions). */
export function memberSpread(model: RiskModel, unit: Unit, dim: DimensionKey, key: string, n = 3): MemberSpread {
  const members = unit.level === 'region' ? (model.councilsByRegion.get(placeKey(unit.name)) ?? []) : unit.level === 'national' ? model.regions : [];
  const valued = members.map((u) => ({ unit: u, value: indicatorValue(u, dim, key) })).filter((x): x is { unit: Unit; value: number } => isNum(x.value));
  valued.sort((a, b) => b.value - a.value || a.unit.name.localeCompare(b.unit.name));
  return { withData: valued.length, total: members.length, top: valued.slice(0, n) };
}

/* ------------------------------------------------------------------------------------------------ */
/* Ranks                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export interface GroupRanks {
  /** Among the units of the same level (councils, regions). */
  level: { rank: number; of: number } | null;
  /** Among the councils of the same region (councils only). */
  region: { rank: number; of: number; name: string } | null;
}

const rankIn = (units: readonly Unit[], unit: Unit, dim: DimensionKey, key: string): { rank: number; of: number } | null => {
  const own = indicatorValue(unit, dim, key);
  if (!isNum(own)) return null;
  const values = units.map((u) => indicatorValue(u, dim, key)).filter(isNum);
  return { rank: 1 + values.filter((v) => v > own).length, of: values.length };
};

/** Where an area sits on one group: among its level and, for a council, within its region (ties share a rank). */
export function groupRanks(model: RiskModel, unit: Unit, dim: DimensionKey, key: string): GroupRanks {
  if (unit.level === 'national') return { level: null, region: null };
  const level = rankIn(unitsAt(model, unit.level), unit, dim, key);
  if (unit.level !== 'council') return { level, region: null };
  const peers = model.councilsByRegion.get(placeKey(unit.region)) ?? [];
  const inRegion = rankIn(peers, unit, dim, key);
  return { level, region: inRegion ? { ...inRegion, name: unit.region } : null };
}
