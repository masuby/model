/**
 * What to do here: the Risk Action Guide Book's rows for an area, assembled per hazard and per vulnerability
 * or coping group at the level the model puts them (docs/RISK_COMMUNICATION_DESIGN.md).
 *
 *  • A hazard takes its level from its own score (levelForScore), or the area's level when the guide
 *    documents it without a score; its rows are the council's own (Tabora) or the guide's at that level.
 *  • A vulnerability or coping group shows at Level 2 or 3 by its score, with the guide's rows, which hold
 *    at every level.
 *  • The committees' approved 'action' records (national, the region's, the council's) stand in place of a
 *    guide row or follow the guide's rows; the most specific first.
 */
import * as React from 'react';
import type { CommitteeRecord, GuidancePayload } from '@/data-layer/types';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { indicatorValue, placeKey } from '@/engine/risk/model';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import { levelForScore, riskBandFor, type AreaRisk } from './alert';
import type { HazardItem } from './crosswalk';
import { isStatusRow, useAreaRecords, useHazardGuides, useIndicatorGuides, type AlertLevel, type AreaGuide, type CouncilGuide, type GuideLevels, type GuideRow, type HazardKey, type IndicatorGuide } from './data';

export interface ActionRow extends GuideRow {
  /** The guide's row, the council's own row, or a committee's. */
  from: 'guide' | 'council' | 'committee';
  record?: CommitteeRecord;
}

export interface ActionScope {
  councilId?: string | null;
  regionId?: string | null;
}

const when = (r: CommitteeRecord) => r.reviewedAt ?? r.createdAt;

/**
 * The approved 'action' rows that apply to a hazard or a group at a level: the council's, then the region's,
 * then the national ones; a row without a level holds at every level.
 */
export function actionRecords(records: readonly CommitteeRecord[], target: { hazard?: HazardKey | null; group?: string | null }, level: AlertLevel, scope: ActionScope): CommitteeRecord[] {
  const rank = (r: CommitteeRecord) => (r.unitId === scope.councilId ? 0 : r.unitId === scope.regionId ? 1 : r.unitId === 'TZ' ? 2 : -1);
  return records
    .filter((r) => {
      if (r.kind !== 'guidance' || r.status !== 'approved' || rank(r) < 0) return false;
      const p = r.payload as GuidancePayload;
      if (p.topic !== 'action') return false;
      if (target.hazard ? r.hazard !== target.hazard : !target.group || p.group !== target.group) return false;
      return p.level == null || p.level === level;
    })
    .sort((a, b) => rank(a) - rank(b) || when(a).localeCompare(when(b)));
}

/** The guide's rows with the committees' rows applied: a row that replaces row i stands in its place (the most specific, latest wins); the others follow. */
export function applyActions(base: readonly GuideRow[], from: 'guide' | 'council', records: readonly CommitteeRecord[]): ActionRow[] {
  const replaced = new Map<number, CommitteeRecord>();
  const added: CommitteeRecord[] = [];
  // Least specific first, so that the council's row overwrites the national one for the same guide row.
  for (const r of [...records].reverse()) {
    const p = r.payload as GuidancePayload;
    if (p.replaces != null && Number.isInteger(p.replaces) && p.replaces >= 0 && p.replaces < base.length) replaced.set(p.replaces, r);
    else added.unshift(r);
  }
  const view = (r: CommitteeRecord): ActionRow => {
    const p = r.payload as GuidancePayload;
    return { impact: p.impact ?? { en: '', sw: '' }, actions: p.actions ?? { en: [], sw: [] }, from: 'committee', record: r };
  };
  return [...base.map((row, i) => (replaced.has(i) ? view(replaced.get(i)!) : { ...row, from })), ...added.map(view)];
}

/** The rows of a hazard at a level: the council's own rows when the guide has them, else the hazard's; the rows that only say "keep following updates" left out. */
export function hazardActionRows(level: AlertLevel, hazard: GuideLevels | null | undefined, council: CouncilGuide | null | undefined, hazardKey: HazardKey, records: readonly CommitteeRecord[], scope: ActionScope): ActionRow[] {
  const own = council?.levels?.[String(level) as '1' | '2' | '3'];
  const base = (own?.length ? own : (hazard?.[String(level) as '1' | '2' | '3'] ?? [])).filter((r) => !isStatusRow(r));
  return applyActions(base, own?.length ? 'council' : 'guide', actionRecords(records, { hazard: hazardKey }, level, scope));
}

/** The rows of a vulnerability or coping group at a level: the guide's rows, which hold at every level, with the committees' rows applied. */
export function groupActionRows(level: AlertLevel, guide: IndicatorGuide | null | undefined, ref: string, records: readonly CommitteeRecord[], scope: ActionScope): ActionRow[] {
  return applyActions(guide?.rows ?? [], 'guide', actionRecords(records, { group: ref }, level, scope));
}

export interface HazardCommunication {
  item: HazardItem;
  level: AlertLevel;
  /** Whether the level is the hazard's own (from its score) or the area's (a documented hazard without a score). */
  own: boolean;
  rows: ActionRow[];
}
export interface GroupCommunication {
  dim: DimensionKey;
  key: string;
  ref: string;
  score: number;
  level: AlertLevel;
  guide: IndicatorGuide | null;
  rows: ActionRow[];
}
export interface AreaCommunication {
  loading: boolean;
  risk: AreaRisk | null;
  hazards: HazardCommunication[];
  groups: GroupCommunication[];
}

/** The vulnerability and coping groups of a unit at Level 2 or 3, highest first. */
export function groupsAtLevel(unit: Unit, minLevel: AlertLevel = 2): Array<{ dim: DimensionKey; key: string; score: number; level: AlertLevel }> {
  const out: Array<{ dim: DimensionKey; key: string; score: number; level: AlertLevel }> = [];
  for (const d of DIMENSIONS) {
    if (d.key === 'hazard') continue;
    for (const c of d.categories)
      for (const i of c.indicators) {
        const score = indicatorValue(unit, d.key, i.key);
        const level = levelForScore(score);
        if (isNum(score) && level && level >= minLevel) out.push({ dim: d.key, key: i.key, score, level });
      }
  }
  return out.sort((a, b) => b.score - a.score);
}

export function scopeOf(unit: Unit): ActionScope {
  if (unit.level === 'council') return { councilId: unit.id, regionId: `R-${placeKey(unit.region)}` };
  if (unit.level === 'region') return { councilId: null, regionId: unit.id };
  return { councilId: null, regionId: null };
}

/** Everything the surfaces show for an area: its level, the rows per hazard at each hazard's level, and the groups at Level 2 or 3 with their rows. */
export function useAreaCommunication(unit: Unit, items: readonly HazardItem[], guide: AreaGuide): AreaCommunication {
  const risk = riskBandFor(unit.risk);
  const { records } = useAreaRecords(unit);
  const hazardKeys = React.useMemo(() => [...new Set(items.flatMap((i) => (i.guide && i.guidance === 'guide' ? [i.guide] : [])))], [items]);
  const groups = React.useMemo(() => groupsAtLevel(unit), [unit]);
  const groupKeys = React.useMemo(() => groups.map((g) => g.key), [groups]);
  const hazardGuides = useHazardGuides(hazardKeys);
  const indicatorGuides = useIndicatorGuides(groupKeys);
  const council = unit.level === 'council' ? (guide.entries.find((e) => e.council.id === unit.id)?.guide ?? null) : null;
  const scope = React.useMemo(() => scopeOf(unit), [unit]);
  return React.useMemo(() => {
    const hazards: HazardCommunication[] = items
      .filter((i) => i.guide && i.guidance === 'guide')
      .map((i) => {
        const ownLevel = levelForScore(i.score);
        const level = ownLevel ?? risk?.band ?? 1;
        return { item: i, level, own: ownLevel != null, rows: hazardActionRows(level, hazardGuides.byKey.get(i.guide!), council, i.guide!, records, scope) };
      });
    const groupRows: GroupCommunication[] = groups.map((g) => {
      const ref = `${g.dim}:${g.key}`;
      const ig = indicatorGuides.byKey.get(g.key) ?? null;
      return { ...g, ref, guide: ig, rows: groupActionRows(g.level, ig, ref, records, scope) };
    });
    return { loading: guide.loading || hazardGuides.loading || indicatorGuides.loading, risk, hazards, groups: groupRows };
  }, [items, groups, hazardGuides, indicatorGuides, council, records, scope, risk, guide.loading]);
}
