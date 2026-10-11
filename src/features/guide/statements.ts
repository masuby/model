/**
 * Area statements: plain sentences generated from the model for one area, for the explorer's risk
 * communication panel and the risk card. Each statement rests on values of the model (the area's risk
 * and rank, its three dimensions, its hazard groups reconciled with the Risk Action Guide Book, its
 * people) and carries the numbers it rests on; nothing is typed in, and no warning level is derived.
 *
 * The generator returns structured statements; AreaStatements.tsx turns them into English or Kiswahili.
 */
import { classify, type ClassKey } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { indicatorValue, placeKey } from '@/engine/risk/model';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { reconciledHazards, type HazardItem } from './crosswalk';
import type { HazardKey } from './data';

/** A natural hazard is named among "the hazards that score highest here" from this score up. */
export const STATEMENT_HAZARD_MIN = 5;
/** Road traffic crashes and hazardous-material sites are named from this score up. */
export const STATEMENT_HUMAN_MIN = 6;
/** The human groups measured council by council (conflict is regional and stays in the hazard rows). */
const HUMAN_STATED = ['vehicleAccidents', 'hazardousMaterial'] as const;
const HUMAN_GROUPS = new Set(['conflictIntensity', 'conflictRisk', 'hazardousMaterial', 'internalViolence', 'vehicleAccidents']);

export interface GroupScore {
  key: string;
  score: number;
}

export type AreaStatement =
  | { kind: 'overall'; level: Unit['level']; cls: ClassKey; score: number; rank: number | null; of: number | null; regionRank: number | null; regionOf: number | null }
  | { kind: 'driver'; dim: DimensionKey; score: number; national: number | null }
  | { kind: 'hazards'; items: HazardItem[] }
  | { kind: 'hazardsLow'; top: HazardItem | null }
  | { kind: 'human'; items: GroupScore[] }
  | { kind: 'vulnerability'; cls: ClassKey | null; score: number; groups: GroupScore[] }
  | { kind: 'coping'; cls: ClassKey | null; score: number; groups: GroupScore[] }
  | { kind: 'people'; population: number; density: number | null };

/** Rank among units by a value, highest first; ties share the better rank. */
function rankOf(units: readonly Unit[], unit: Unit, value: (u: Unit) => number | null): { rank: number; of: number } | null {
  const v = value(unit);
  if (!isNum(v)) return null;
  const scored = units.map(value).filter(isNum);
  return { rank: 1 + scored.filter((x) => x > v).length, of: scored.length };
}

/** The highest-scoring indicator groups of one dimension (at least `min`), highest first. */
function topGroups(unit: Unit, dim: DimensionKey, n: number, min: number): GroupScore[] {
  return ALL_INDICATORS.filter((l) => l.dimension.key === dim)
    .map((l) => ({ key: l.indicator.key, score: indicatorValue(unit, dim, l.indicator.key) }))
    .filter((g): g is GroupScore => isNum(g.score) && g.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * The statements for an area, in reading order. `documented` is the guide's hazard list for the area
 * (useAreaGuide); without it the hazards are the model's alone.
 */
export function areaStatements(model: RiskModel, unit: Unit, documented: readonly HazardKey[] = []): AreaStatement[] {
  const out: AreaStatement[] = [];
  const cls = classify(unit.risk, 'risk')?.key;
  if (isNum(unit.risk) && cls) {
    const peers = unit.level === 'council' ? model.councils : unit.level === 'region' ? model.regions : unit.level === 'source' ? model.sources : [];
    const overall = peers.length ? rankOf(peers, unit, (u) => u.risk) : null;
    const inRegion = unit.level === 'council' ? rankOf(model.councilsByRegion.get(placeKey(unit.region)) ?? [], unit, (u) => u.risk) : null;
    out.push({ kind: 'overall', level: unit.level, cls, score: unit.risk, rank: overall?.rank ?? null, of: overall?.of ?? null, regionRank: inRegion?.rank ?? null, regionOf: inRegion?.of ?? null });
  }
  // The dimension that weighs most: INFORM risk is the cube root of the product of the three.
  const dims = DIMENSIONS.map((d) => ({ dim: d.key, score: unit.dims[d.key].score })).filter((d): d is { dim: DimensionKey; score: number } => isNum(d.score));
  if (dims.length === 3) {
    const top = dims.reduce((a, b) => (b.score > a.score ? b : a));
    out.push({ kind: 'driver', dim: top.dim, score: top.score, national: unit.level === 'national' ? null : model.national.dims[top.dim].score });
  }
  const natural = reconciledHazards(unit, documented).filter((h) => !h.groups.every((g) => HUMAN_GROUPS.has(g.split(':')[1])));
  const strong = natural.filter((h) => isNum(h.score) && h.score >= STATEMENT_HAZARD_MIN).slice(0, 3);
  if (strong.length) out.push({ kind: 'hazards', items: strong });
  else out.push({ kind: 'hazardsLow', top: natural.find((h) => isNum(h.score)) ?? null });
  const human: GroupScore[] = HUMAN_STATED.map((key): { key: string; score: number | null } => ({ key, score: indicatorValue(unit, 'hazard', key) }))
    .filter((g): g is GroupScore => isNum(g.score) && g.score >= STATEMENT_HUMAN_MIN)
    .sort((a, b) => b.score - a.score);
  if (human.length) out.push({ kind: 'human', items: human });
  const v = unit.dims.vulnerability.score;
  if (isNum(v)) out.push({ kind: 'vulnerability', cls: classify(v, 'vulnerability')?.key ?? null, score: v, groups: topGroups(unit, 'vulnerability', 2, 5) });
  const c = unit.dims.coping.score;
  if (isNum(c)) out.push({ kind: 'coping', cls: classify(c, 'coping')?.key ?? null, score: c, groups: topGroups(unit, 'coping', 2, 5) });
  const population = unit.level === 'national' ? model.councils.reduce((a, x) => a + (x.exposure?.population ?? 0), 0) : unit.exposure?.population;
  if (isNum(population) && population > 0) out.push({ kind: 'people', population, density: unit.level === 'national' ? null : (unit.exposure?.density ?? null) });
  return out;
}
