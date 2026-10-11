/**
 * Risk communication colours. The site communicates standing risk for people to live and plan with,
 * not warnings: every area is named by its INFORM risk class, and the class carries one of three
 * colours so it reads at a glance on the profile, the explorer panel and the risk card:
 *
 *   INFORM risk class    colour          band
 *   Very low, Low        yellow          1
 *   Medium, High         orange          2
 *   Very high            red             3
 *
 * The band is a colour only. Warning levels (Advisory, Warning, Major warning: the three levels of the
 * Risk Action Guide Book) are never derived from the risk class and never shown with it; they exist only
 * on warnings the committees publish through the Data portal, which the banner shows while in force.
 */
import { classify, type ClassKey } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import type { AlertLevel } from './data';

/** 1 yellow, 2 orange, 3 red: the same three colours the published warnings use. */
export type RiskBand = AlertLevel;

export const BAND_BY_CLASS: Record<ClassKey, RiskBand> = { veryLow: 1, low: 1, medium: 2, high: 2, veryHigh: 3 };

/** The standard yellow, orange and red. */
export const ALERT_COLOR: Record<AlertLevel, string> = { 1: '#facc15', 2: '#f97316', 3: '#dc2626' };

/** Readable text on a band fill (WCAG AA): near-black on yellow and orange, white on red. */
export const onAlertColor = (level: AlertLevel) => (level === 3 ? '#ffffff' : '#0b1324');

export interface AreaRisk {
  /** The INFORM risk class. */
  cls: ClassKey;
  /** 0 (Very low) … 4 (Very high). */
  index: number;
  /** The colour band of the class. */
  band: RiskBand;
  /** The band's colour. */
  color: string;
  /** The risk score it comes from. */
  score: number;
}

/** The risk level of an area for communication: its INFORM class and the class's colour band; null without a score. */
export function riskBandFor(risk: number | null | undefined): AreaRisk | null {
  const c = classify(risk, 'risk');
  if (!c || typeof risk !== 'number') return null;
  const band = BAND_BY_CLASS[c.key];
  return { cls: c.key, index: c.index, band, color: ALERT_COLOR[band], score: risk };
}

/**
 * A natural hazard scoring this high (the top band of the hazard display rule) contradicts "few hazard
 * constraints", whatever the overall risk: risk is low where vulnerability and coping are good, not
 * necessarily where the hazard is (assessment of 10 October 2026: 8 of the 29 low-risk councils).
 */
export const PLAN_HAZARD_SCORE = 8;

/** The highest natural hazard of an area scoring PLAN_HAZARD_SCORE or more, if any. */
export function planningHazard(unit: Pick<Unit, 'dims'>): { key: string; score: number } | null {
  const natural = unit.dims.hazard.categories.natural?.indicators ?? {};
  let best: { key: string; score: number } | null = null;
  for (const [key, v] of Object.entries(natural)) if (isNum(v) && v >= PLAN_HAZARD_SCORE && (!best || v > best.score)) best = { key, score: v };
  return best;
}

/**
 * The planning message of an area (guide namespace key and the hazard it names): the band's message, or,
 * where overall risk is low or very low but a natural hazard is very high, the message that names it.
 */
export function planMessage(unit: Pick<Unit, 'dims'>, risk: Pick<AreaRisk, 'band'>): { key: string; hazard: { key: string; score: number } | null } {
  const hazard = risk.band === 1 ? planningHazard(unit) : null;
  return { key: hazard ? 'risk.band.1.planHazard' : `risk.band.${risk.band}.plan`, hazard };
}
