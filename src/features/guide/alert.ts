/**
 * Alert categories from the assessed risk level, the programme's rule:
 *
 *   INFORM risk class      colour   alert category (Risk Action Guide Book level)
 *   Very low, Low          yellow   Advisory       (Level 1)
 *   Medium                 orange   Warning        (Level 2)
 *   High, Very high        red      Major warning  (Level 3)
 *
 * The colours are the standard warning yellow, orange and red, not the INFORM class ramp (whose pale
 * yellow means "medium" and barely shows on a light page).
 */
import { classify, type ClassKey } from '@/engine/risk/classes';
import type { AlertLevel } from './data';

export const ALERT_BY_CLASS: Record<ClassKey, AlertLevel> = { veryLow: 1, low: 1, medium: 2, high: 3, veryHigh: 3 };

export const ALERT_COLOR: Record<AlertLevel, string> = { 1: '#facc15', 2: '#f97316', 3: '#dc2626' };

/** Readable text on an alert fill (WCAG AA): near-black on yellow and orange, white on red. */
export const onAlertColor = (level: AlertLevel) => (level === 3 ? '#ffffff' : '#0b1324');

export interface AreaAlert {
  level: AlertLevel;
  /** The risk class it comes from. */
  cls: ClassKey;
  /** The risk score it comes from. */
  score: number;
}

/** The alert category for an INFORM risk score; null when the score is missing. */
export function alertFor(risk: number | null | undefined): AreaAlert | null {
  const c = classify(risk, 'risk');
  return c && typeof risk === 'number' ? { level: ALERT_BY_CLASS[c.key], cls: c.key, score: risk } : null;
}
