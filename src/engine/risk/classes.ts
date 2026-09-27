/**
 * INFORM 5-class classification, read from the Tanzania workbook's `Thresholds` sheet
 * (data-source/tanzania-inform-risk.xlsx). The workbook rule is
 *   IF(x < t1, Very Low, IF(x < t2, Low, IF(x < t3, Medium, IF(x < t4, High, Very High))))
 * i.e. each threshold is an EXCLUSIVE upper bound. Each dimension has its OWN thresholds —
 * colouring a dimension map with the risk thresholds (as the old app did) misclassifies it.
 */

export type ClassKey = 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh';
export type Scale = 'risk' | 'hazard' | 'vulnerability' | 'coping';

export const CLASS_KEYS: readonly ClassKey[] = ['veryLow', 'low', 'medium', 'high', 'veryHigh'];

/** Exclusive upper bounds of Very Low, Low, Medium, High (Very High is everything ≥ the last). */
export const THRESHOLDS: Record<Scale, readonly [number, number, number, number]> = {
  risk: [2.5, 3.4, 4.3, 5.9],
  hazard: [1.3, 2.0, 3.3, 4.7],
  vulnerability: [2.5, 3.3, 4.1, 5.0],
  coping: [4.1, 5.3, 6.7, 7.7],
};

/**
 * Canonical class colours (colour-blind-safer sequential ramp, readable in light and dark themes).
 * Kept in sync with the `--class-*` CSS tokens in `src/styles/index.css`.
 */
export const CLASS_COLORS: Record<ClassKey, string> = {
  veryLow: '#1a9850',
  low: '#91cf60',
  medium: '#fee08b',
  high: '#fc8d59',
  veryHigh: '#d73027',
};
export const NO_DATA_COLOR = '#94a3b8';

export interface ClassInfo {
  key: ClassKey;
  index: number; // 0 (Very Low) … 4 (Very High)
  color: string;
}

/** Classify a 0–10 score on the given scale; null for missing values. */
export function classify(value: number | null | undefined, scale: Scale = 'risk'): ClassInfo | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const t = THRESHOLDS[scale];
  let index = 0;
  while (index < 4 && value >= t[index]) index++;
  const key = CLASS_KEYS[index];
  return { key, index, color: CLASS_COLORS[key] };
}

/** Human range strings for a legend, e.g. risk → ['0.0–2.4', '2.5–3.3', …]. */
export function classRanges(scale: Scale = 'risk'): string[] {
  const t = THRESHOLDS[scale];
  const lo = [0, ...t];
  const hi = [...t.map((x) => Math.round((x - 0.1) * 10) / 10), 10];
  return lo.map((l, i) => `${l.toFixed(1)}–${hi[i].toFixed(1)}`);
}
