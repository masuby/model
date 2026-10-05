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
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useModel } from '@/data-layer/DataProvider';
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

export function useHazardGuide(key: HazardKey | null) {
  return useQuery({ queryKey: ['guide', 'hazard', key], queryFn: () => loadHazardGuide(key!), enabled: !!key, staleTime: Infinity });
}

export function useIncidentGuide(enabled = true) {
  return useQuery({ queryKey: ['guide', 'incidents'], queryFn: loadIncidentGuide, enabled, staleTime: Infinity });
}
