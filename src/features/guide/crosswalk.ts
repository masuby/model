/**
 * One hazard picture per area (RC-03, RC-06): the hazards the Risk Action Guide Book documents for the
 * area and the INFORM hazard groups scored for it, reconciled through a crosswalk, each with a priority
 * band from the model's score. The band is a declared display rule (decision D7), not an INFORM class:
 * the workbook defines classes only for the dimensions and for risk.
 */
import type { IndicatorRef } from '@/engine/risk/hierarchy';
import { indicatorValue } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { isNum } from '@/engine/risk/math';
import { HAZARD_KEYS, type HazardKey } from './data';

export type GuidanceStatus = 'guide' | 'incidents' | 'needed' | 'outOfScope';

export interface CrosswalkEntry {
  /** The guide book's hazard, or null for an INFORM group the guide does not cover. */
  guide: HazardKey | null;
  /** The INFORM hazard groups behind it. */
  groups: IndicatorRef[];
  /** How the two relate. */
  relation: 'direct' | 'trigger' | 'partial' | 'incident' | 'none';
  guidance: GuidanceStatus;
  /** Who would write missing guidance. */
  owner?: string;
}

/** The crosswalk of the assessment (sheet 'Hazard crosswalk'), in the order the guide lists its hazards. */
export const CROSSWALK: readonly CrosswalkEntry[] = [
  { guide: 'heavyRainfall', groups: ['hazard:flood', 'hazard:landslide'], relation: 'trigger', guidance: 'guide' },
  { guide: 'floods', groups: ['hazard:flood'], relation: 'direct', guidance: 'guide' },
  { guide: 'landslide', groups: ['hazard:landslide'], relation: 'direct', guidance: 'guide' },
  { guide: 'strongWinds', groups: ['hazard:stormsCyclone'], relation: 'direct', guidance: 'guide' },
  { guide: 'largeWaves', groups: ['hazard:coastalHazards'], relation: 'direct', guidance: 'guide' },
  { guide: 'wildfire', groups: ['hazard:wildfire'], relation: 'direct', guidance: 'guide' },
  { guide: 'drought', groups: ['hazard:drought'], relation: 'direct', guidance: 'guide' },
  { guide: 'earthquake', groups: ['hazard:earthquake'], relation: 'direct', guidance: 'guide' },
  // Epidemics are not an INFORM SADC hazard group: health conditions sit under vulnerability.
  { guide: 'publicHealth', groups: ['hazard:zoonoses'], relation: 'partial', guidance: 'guide' },
  { guide: null, groups: ['hazard:heatwave'], relation: 'none', guidance: 'needed', owner: 'NDRRC with TMA and MoH' },
  { guide: null, groups: ['hazard:lightning'], relation: 'none', guidance: 'needed', owner: 'NDRRC with TMA' },
  { guide: null, groups: ['hazard:volcano'], relation: 'none', guidance: 'needed', owner: 'NDRRC with GST' },
  { guide: null, groups: ['hazard:environmentalDegradation'], relation: 'none', guidance: 'needed', owner: 'NEMC' },
  { guide: null, groups: ['hazard:vehicleAccidents'], relation: 'incident', guidance: 'incidents' },
  { guide: null, groups: ['hazard:hazardousMaterial'], relation: 'incident', guidance: 'incidents' },
  { guide: null, groups: ['hazard:conflictIntensity', 'hazard:conflictRisk', 'hazard:internalViolence'], relation: 'none', guidance: 'outOfScope' },
];

export type Band = 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh';
/** D7 display rule: under 2 very low, 2 to 4 low, 4 to 6 medium, 6 to 8 high, 8 and above very high. */
export const BAND_BOUNDS: readonly number[] = [2, 4, 6, 8];
export function bandFor(score: number | null | undefined): Band | null {
  if (!isNum(score)) return null;
  if (score < BAND_BOUNDS[0]) return 'veryLow';
  if (score < BAND_BOUNDS[1]) return 'low';
  if (score < BAND_BOUNDS[2]) return 'medium';
  if (score < BAND_BOUNDS[3]) return 'high';
  return 'veryHigh';
}
const BAND_ORDER: Record<Band, number> = { veryLow: 0, low: 1, medium: 2, high: 3, veryHigh: 4 };

export interface HazardItem {
  /** Stable key: the guide hazard, or the first INFORM group. */
  key: string;
  guide: HazardKey | null;
  groups: IndicatorRef[];
  /** The highest INFORM group score behind it for this area (null when no group has data). */
  score: number | null;
  band: Band | null;
  /** Where the hazard comes from: the guide, the model, or both. */
  basis: 'documented' | 'modelled' | 'both';
  guidance: GuidanceStatus;
  owner?: string;
}

const groupKey = (ref: IndicatorRef) => ref.split(':')[1];

/**
 * The reconciled hazard list of an area: every guide hazard documented there, every INFORM group with a
 * score above zero, joined through the crosswalk; highest priority first, documented before modelled.
 */
export function reconciledHazards(unit: Unit, documented: readonly HazardKey[]): HazardItem[] {
  const out: HazardItem[] = [];
  for (const e of CROSSWALK) {
    const scores = e.groups.map((g) => indicatorValue(unit, 'hazard', groupKey(g))).filter(isNum);
    const score = scores.length ? Math.max(...scores) : null;
    const modelled = isNum(score) && score > 0;
    const isDocumented = !!e.guide && documented.includes(e.guide);
    if (!modelled && !isDocumented) continue;
    out.push({
      key: e.guide ?? groupKey(e.groups[0]),
      guide: e.guide,
      groups: e.groups,
      score,
      band: bandFor(score),
      basis: isDocumented && modelled ? 'both' : isDocumented ? 'documented' : 'modelled',
      guidance: e.guidance,
      owner: e.owner,
    });
  }
  return out.sort((a, b) => (b.band ? BAND_ORDER[b.band] : -1) - (a.band ? BAND_ORDER[a.band] : -1) || (b.score ?? -1) - (a.score ?? -1) || Number(b.basis !== 'modelled') - Number(a.basis !== 'modelled'));
}

/**
 * The name of a reconciled hazard: the Guide Book's name when it documents the hazard, else the names of
 * the INFORM groups behind it. One function for every list (profile, explorer card, risk card), so the
 * same council never shows two different hazard lists.
 */
export function hazardItemName(t: (key: string) => string, item: Pick<HazardItem, 'guide' | 'groups'> & { basis?: HazardItem['basis'] }): string {
  // The Guide Book's "Earthquake and tsunami" names the hazard only where the guide documents it; a
  // council the model alone scores (an inland one by Lake Victoria, say) reads the INFORM group's name.
  const modelledOnly = item.guide === 'earthquake' && item.basis === 'modelled';
  return item.guide && !modelledOnly ? t(`guide:hazards.${item.guide}`) : item.groups.map((g) => t(`indicators:${g.split(':')[1]}`)).join(', ');
}

/** The guide hazards of the reconciled list, in its order (for the warning-level tables). */
export const guideHazardsOf = (items: readonly HazardItem[]): HazardKey[] => items.flatMap((i) => (i.guide ? [i.guide] : []));

/** Every guide hazard is in the crosswalk once (checked by the tests). */
export const GUIDE_HAZARDS_COVERED = HAZARD_KEYS.every((h) => CROSSWALK.some((e) => e.guide === h));

