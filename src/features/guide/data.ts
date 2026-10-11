/**
 * The Risk Action Guide Book on the site: what people should do about the hazards where they live.
 *
 * Built from data-source/RISK_ACTION_GUIDE_BOOK_0222.docx by scripts/build-action-guide.py, in English and
 * Kiswahili as the guide publishes them, and loaded on demand (one small file per region and per hazard):
 *  • per council: the hazards the guide documents there and its "Know your risk" statements (the risk
 *    and what helps), plus, for Tabora's councils, their own actions at each alert level;
 *  • per hazard: what to expect and what to do at each of the three alert levels;
 *  • the incident and accident rapid-response guide.
 */
import { useQueries, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useCommitteeRecords, useModel } from '@/data-layer/DataProvider';
import { activeWarnings, type CommitteeRecord, type EventPayload, type GuidancePayload } from '@/data-layer/types';
import { placeKey } from '@/engine/risk/model';
import type { RiskModel, Unit } from '@/engine/risk/types';

export interface Text {
  en: string;
  sw: string;
}
export interface TextList {
  en: string[];
  sw: string[];
}
/** One line of an alert-level table: what people may see, and what to do. */
export interface GuideRow {
  impact: Text;
  actions: TextList;
}
export type AlertLevel = 1 | 2 | 3;
export const ALERT_LEVELS: readonly AlertLevel[] = [1, 2, 3];
export type GuideLevels = Partial<Record<'1' | '2' | '3', GuideRow[]>>;

/** A "Know your risk" statement for one area of a council. */
export interface KnowRow {
  area: Text;
  risk: Text;
  advice: Text;
}
export interface CouncilGuide {
  /** The council's name in the guide. */
  name: string;
  /** The hazards the guide documents for the council, most important first. */
  hazards: HazardKey[];
  know: KnowRow[];
  /** Council-specific actions at each alert level (Tabora's councils). */
  levels?: GuideLevels;
}
export interface RegionGuide {
  region: Text;
  /** By site council id. */
  councils: Record<string, CouncilGuide>;
}
export interface IncidentGroup {
  name: Text;
  rows: Array<{ incident: Text; actions: TextList }>;
}

export const HAZARD_KEYS = ['heavyRainfall', 'floods', 'landslide', 'strongWinds', 'largeWaves', 'wildfire', 'drought', 'earthquake', 'publicHealth'] as const;
export type HazardKey = (typeof HAZARD_KEYS)[number];

/** The guide's text in the reader's language (English when a Kiswahili line is missing, and back). */
export function pick(t: Text, lang: string): string {
  return lang.startsWith('sw') ? t.sw || t.en : t.en || t.sw;
}
export function pickList(t: TextList, lang: string): string[] {
  return lang.startsWith('sw') ? (t.sw.length ? t.sw : t.en) : t.en.length ? t.en : t.sw;
}

/** Rows that close an alert level ("Warning status": keep following official updates) are shown as a note. */
export const isStatusRow = (r: GuideRow) => /^warning status$/i.test(r.impact.en.trim());

const regionFiles = import.meta.glob<RegionGuide>('../../data/action-guide/regions/*.json', { import: 'default' });
const hazardFiles = import.meta.glob<{ levels: GuideLevels }>('../../data/action-guide/hazards/*.json', { import: 'default' });

export function loadRegionGuide(regionKey: string): Promise<RegionGuide | null> {
  const load = regionFiles[`../../data/action-guide/regions/${regionKey}.json`];
  return load ? load() : Promise.resolve(null);
}
export function loadHazardGuide(key: HazardKey): Promise<GuideLevels> {
  const load = hazardFiles[`../../data/action-guide/hazards/${key}.json`];
  return load ? load().then((h) => h.levels) : Promise.resolve({});
}
export const loadIncidentGuide = (): Promise<IncidentGroup[]> => import('../../data/action-guide/incidents.json').then((m) => m.default as IncidentGroup[]);

/**
 * The councils whose guidance applies to a unit: the council itself; the councils of a region, or of an
 * INFORM source unit; none for the country as a whole. They always share one region.
 */
export function guideCouncils(model: RiskModel, unit: Unit): Unit[] {
  if (unit.level === 'council') return [unit];
  if (unit.level === 'region') return model.councilsByRegion.get(unit.id.replace(/^R-/, '')) ?? [];
  if (unit.level === 'source') return model.councils.filter((c) => c.sourceId === unit.id);
  return [];
}

/** Hazards across several councils: the most widely documented first, then by how early each is named. */
export function rankHazards(lists: readonly HazardKey[][]): HazardKey[] {
  const score = new Map<HazardKey, { n: number; pos: number }>();
  for (const list of lists)
    list.forEach((h, i) => {
      const s = score.get(h) ?? { n: 0, pos: 0 };
      s.n += 1;
      s.pos += i;
      score.set(h, s);
    });
  return [...score.entries()].sort((a, b) => b[1].n - a[1].n || a[1].pos / a[1].n - b[1].pos / b[1].n).map(([h]) => h);
}

export interface AreaGuide {
  loading: boolean;
  /** The councils with guidance, with their entries. */
  entries: Array<{ council: Unit; guide: CouncilGuide }>;
  /** The area's hazards, most relevant first (empty for the country). */
  hazards: HazardKey[];
}

/** The guidance for one area (any unit), loading its region's file on demand. */
export function useAreaGuide(unit: Unit | null): AreaGuide {
  const model = useModel();
  const councils = React.useMemo(() => (unit ? guideCouncils(model, unit) : []), [model, unit]);
  const regionKey = councils.length ? placeKey(councils[0].region) : null;
  const q = useQuery({ queryKey: ['guide', 'region', regionKey], queryFn: () => loadRegionGuide(regionKey!), enabled: !!regionKey, staleTime: Infinity });
  return React.useMemo(() => {
    const entries = councils.flatMap((c) => {
      const guide = q.data?.councils[c.id];
      return guide ? [{ council: c, guide }] : [];
    });
    return { loading: !!regionKey && q.isLoading, entries, hazards: rankHazards(entries.map((e) => e.guide.hazards)) };
  }, [councils, q.data, q.isLoading, regionKey]);
}

/** The region guides, combined: whether any is still loading, and the documented hazards by council id. */
const combineGuides = (results: Array<{ isLoading: boolean; data?: RegionGuide | null }>) => ({
  loading: results.some((r) => r.isLoading),
  guides: results.map((r) => r.data ?? null),
});

/** The documented hazards of every council in the country (all region files), for national findings. */
export function useAllGuides(enabled = true): { loading: boolean; hazardsByCouncil: Map<string, HazardKey[]> } {
  const model = useModel();
  const keys = React.useMemo(() => [...new Set(model.councils.map((c) => placeKey(c.region)))], [model]);
  const { loading, guides } = useQueries({
    queries: keys.map((k) => ({ queryKey: ['guide', 'region', k], queryFn: () => loadRegionGuide(k), staleTime: Infinity, enabled })),
    combine: combineGuides,
  });
  const loaded = guides.filter(Boolean).length;
  const hazardsByCouncil = React.useMemo(() => {
    const m = new Map<string, HazardKey[]>();
    for (const g of guides) if (g) for (const [id, cg] of Object.entries(g.councils)) m.set(id, cg.hazards);
    return m;
    // `guides` is a fresh array per render; the map is rebuilt only when another file has arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, keys]);
  return { loading, hazardsByCouncil };
}

/** A "Know your risk" row as shown: the guide book's, or a committee statement that replaced or added one. */
export interface KnowRowView extends KnowRow {
  from: 'guide' | 'committee';
  record?: CommitteeRecord;
}

/**
 * The guide book's rows for a council with the approved committee statements applied: a statement that
 * replaces row i stands in its place (the latest approved wins); new statements follow the rows.
 */
export function applyGuidance(rows: readonly KnowRow[], records: readonly CommitteeRecord[], councilId: string): KnowRowView[] {
  const approved = records
    .filter((r) => r.kind === 'guidance' && r.unitId === councilId && r.status === 'approved')
    .sort((a, b) => (a.reviewedAt ?? a.createdAt).localeCompare(b.reviewedAt ?? b.createdAt));
  const replaced = new Map<number, CommitteeRecord>();
  const added: CommitteeRecord[] = [];
  for (const r of approved) {
    const p = r.payload as GuidancePayload;
    if (p.replaces != null && Number.isInteger(p.replaces) && p.replaces >= 0 && p.replaces < rows.length) replaced.set(p.replaces, r);
    else added.push(r);
  }
  const view = (r: CommitteeRecord): KnowRowView => {
    const p = r.payload as GuidancePayload;
    return { area: p.area, risk: p.risk, advice: p.advice, from: 'committee', record: r };
  };
  return [...rows.map((row, i) => (replaced.has(i) ? view(replaced.get(i)!) : { ...row, from: 'guide' as const })), ...added.map(view)];
}

/** A vulnerability-and-coping action of the library, keyed by INFORM group ('coping:wash'). */
export interface VcAction {
  group: string;
  leadSector?: string | null;
  /** The lead sectors PMO-DMD chose for the group (sector keys). */
  leadSectors: string[];
  why: Text;
  actions: Text;
  record: CommitteeRecord;
}

/** The library: the latest approved national guidance of topic 'vc' per INFORM group (PMO-DMD writes, the NDRRC reviews). */
export function vcActions(records: readonly CommitteeRecord[]): Map<string, VcAction> {
  const out = new Map<string, VcAction>();
  const approved = records
    .filter((r) => r.kind === 'guidance' && r.level === 'national' && r.status === 'approved' && (r.payload as GuidancePayload).topic === 'vc')
    .sort((a, b) => (a.reviewedAt ?? a.createdAt).localeCompare(b.reviewedAt ?? b.createdAt));
  for (const r of approved) {
    const p = r.payload as GuidancePayload;
    if (!p.group) continue;
    out.set(p.group, { group: p.group, leadSector: p.leadSector ?? null, leadSectors: p.leadSectors ?? [], why: p.risk, actions: p.advice, record: r });
  }
  return out;
}

/** Approved event reports of these councils, newest first. */
export function reportedEvents(records: readonly CommitteeRecord[], councilIds: readonly string[], limit = 8): CommitteeRecord[] {
  const ids = new Set(councilIds);
  return records
    .filter((r) => r.kind === 'event' && r.status === 'approved' && ids.has(r.unitId))
    .sort((a, b) => ((b.payload as EventPayload).date ?? '').localeCompare((a.payload as EventPayload).date ?? ''))
    .slice(0, limit);
}

/** The committee records that concern an area: approved statements, events, and the warnings in force. */
export function useAreaRecords(unit: Unit | null) {
  const model = useModel();
  const q = useCommitteeRecords();
  return React.useMemo(() => {
    const records = q.data ?? [];
    if (!unit) return { records, warnings: [] as CommitteeRecord[], events: [] as CommitteeRecord[] };
    const councils = guideCouncils(model, unit);
    const scope =
      unit.level === 'national'
        ? { id: 'TZ', councilIds: [...model.regions.map((r) => r.id), ...model.councils.map((c) => c.id)] }
        : unit.level === 'region'
          ? { id: unit.id, councilIds: councils.map((c) => c.id) }
          : { id: unit.id, regionId: `R-${placeKey(unit.region)}`, councilIds: unit.level === 'source' ? councils.map((c) => c.id) : [] };
    return { records, warnings: activeWarnings(records, scope), events: reportedEvents(records, councils.map((c) => c.id)) };
  }, [q.data, model, unit]);
}

export function useHazardGuide(key: HazardKey | null) {
  return useQuery({ queryKey: ['guide', 'hazard', key], queryFn: () => loadHazardGuide(key!), enabled: !!key, staleTime: Infinity });
}

export function useIncidentGuide(enabled = true) {
  return useQuery({ queryKey: ['guide', 'incidents'], queryFn: loadIncidentGuide, enabled, staleTime: Infinity });
}
