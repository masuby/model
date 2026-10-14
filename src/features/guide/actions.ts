/**
 * What to always do here: the Risk Action Guide Book's standing actions for an area, assembled per hazard
 * and per vulnerability or coping group (docs/RISK_COMMUNICATION_DESIGN.md). Nothing here is a warning: the
 * rows say what to keep doing all year where a hazard or a condition is present.
 *
 *  • A hazard shows its standing rows (chapter 13.0); where its own score is high or very high (band 3),
 *    the rows that go further are added; rows for the coast show on the coast only.
 *  • A vulnerability or coping group shows at band 2 or 3 by its score, with the guide's statement and rows.
 *  • The committees' approved 'action' records (national, the region's, the council's) stand in place of a
 *    guide row or follow the guide's rows; a record holds for every band, or from the band it names up.
 */
import * as React from 'react';
import type { CommitteeRecord, GuidancePayload } from '@/data-layer/types';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { indicatorValue, placeKey } from '@/engine/risk/model';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import { levelForScore, riskBandFor, type AreaRisk } from './alert';
import type { HazardItem } from './crosswalk';
import { isCoastal } from './crosswalk';
import { useAreaRecords, useIndicatorGuides, useStandingGuides, type AlertLevel, type AreaGuide, type GuideRow, type HazardKey, type IndicatorGuide, type StandingGuide } from './data';

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
 * The approved 'action' rows that apply to a hazard or a group at a band: the council's, then the region's,
 * then the national ones; a row without a band holds everywhere, a row with one holds from that band up.
 */
export function actionRecords(records: readonly CommitteeRecord[], target: { hazard?: HazardKey | null; group?: string | null }, level: AlertLevel, scope: ActionScope): CommitteeRecord[] {
  const rank = (r: CommitteeRecord) => (r.unitId === scope.councilId ? 0 : r.unitId === scope.regionId ? 1 : r.unitId === 'TZ' ? 2 : -1);
  return records
    .filter((r) => {
      if (r.kind !== 'guidance' || r.status !== 'approved' || rank(r) < 0) return false;
      const p = r.payload as GuidancePayload;
      if (p.topic !== 'action') return false;
      if (target.hazard ? r.hazard !== target.hazard : !target.group || p.group !== target.group) return false;
      return p.level == null || level >= p.level;
    })
    .sort((a, b) => rank(a) - rank(b) || when(a).localeCompare(when(b)));
}

/** The guide's rows with the committees' rows applied: a row that replaces row i stands in its place (the most specific, latest wins); the others follow. */
export function applyActions(base: readonly GuideRow[], from: 'guide' | 'council', records: readonly CommitteeRecord[], keep: (i: number) => boolean = () => true): ActionRow[] {
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
  return [...base.flatMap((row, i) => (keep(i) ? [replaced.has(i) ? view(replaced.get(i)!) : { ...row, from }] : [])), ...added.map(view)];
}

/**
 * The standing rows of a hazard at a band: every row that holds everywhere, the rows that go further where the
 * band is 3 (high or very high), the coast's rows on the coast; the committees' rows applied. `replaces` counts
 * the guide's rows as the book lists them (the rows for high risk included).
 */
export function hazardActionRows(band: AlertLevel, standing: StandingGuide | null | undefined, coastal: boolean, hazardKey: HazardKey, records: readonly CommitteeRecord[], scope: ActionScope): ActionRow[] {
  const rows = standing?.rows ?? [];
  const base: GuideRow[] = rows.map((r) => ({ impact: r.who, actions: r.actions }));
  return applyActions(base, 'guide', actionRecords(records, { hazard: hazardKey }, band, scope), (i) => (!rows[i].high || band === 3) && (!rows[i].coastal || coastal));
}

/** The rows of a vulnerability or coping group at a level: the guide's rows, which hold at every level, with the committees' rows applied. */
export function groupActionRows(level: AlertLevel, guide: IndicatorGuide | null | undefined, ref: string, records: readonly CommitteeRecord[], scope: ActionScope): ActionRow[] {
  return applyActions(guide?.rows ?? [], 'guide', actionRecords(records, { group: ref }, level, scope));
}

export interface HazardCommunication {
  item: HazardItem;
  /** The band of the hazard's own score (1 under 4, 2 to under 6, 3 from 6), or the area's band where the guide documents it without a score. */
  level: AlertLevel;
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

/** Everything the surfaces show for an area: its class, the standing rows per hazard, and the groups scoring medium or above with their rows. */
export function useAreaCommunication(unit: Unit, items: readonly HazardItem[], guide: AreaGuide): AreaCommunication {
  const risk = riskBandFor(unit.risk);
  const { records } = useAreaRecords(unit);
  const hazardKeys = React.useMemo(() => [...new Set(items.flatMap((i) => (i.guide && i.guidance === 'guide' ? [i.guide] : [])))], [items]);
  const groups = React.useMemo(() => groupsAtLevel(unit), [unit]);
  const groupKeys = React.useMemo(() => groups.map((g) => g.key), [groups]);
  const standing = useStandingGuides(hazardKeys);
  const indicatorGuides = useIndicatorGuides(groupKeys);
  const coastal = isCoastal(unit);
  const scope = React.useMemo(() => scopeOf(unit), [unit]);
  return React.useMemo(() => {
    const hazards: HazardCommunication[] = items
      .filter((i) => i.guide && i.guidance === 'guide')
      .map((i) => {
        const level = levelForScore(i.score) ?? risk?.band ?? 1;
        return { item: i, level, rows: hazardActionRows(level, standing.byKey.get(i.guide!), coastal, i.guide!, records, scope) };
      });
    const groupRows: GroupCommunication[] = groups.map((g) => {
      const ref = `${g.dim}:${g.key}`;
      const ig = indicatorGuides.byKey.get(g.key) ?? null;
      return { ...g, ref, guide: ig, rows: groupActionRows(g.level, ig, ref, records, scope) };
    });
    return { loading: guide.loading || standing.loading || indicatorGuides.loading, risk, hazards, groups: groupRows };
  }, [items, groups, standing, indicatorGuides, coastal, records, scope, risk, guide.loading]);
}
