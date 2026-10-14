/**
 * INFORM 5-class classification, read from the Tanzania workbook's `Thresholds` sheet
 * (data-source/tanzania-inform-risk.xlsx). The workbook rule is
 *   IF(x < t1, Very Low, IF(x < t2, Low, IF(x < t3, Medium, IF(x < t4, High, Very High))))
 * i.e. each threshold is an EXCLUSIVE upper bound. Each dimension has its OWN thresholds  -
 * colouring a dimension map with the risk thresholds (as the old app did) misclassifies it.
 */

export type ClassKey = 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh';
export type Scale = 'risk' | 'hazard' | 'vulnerability' | 'coping';

export const CLASS_KEYS: readonly ClassKey[] = ['veryLow', 'low', 'medium', 'high', 'veryHigh'];
export const SCALES: readonly Scale[] = ['risk', 'hazard', 'vulnerability', 'coping'];

/** Exclusive upper bounds of Very Low, Low, Medium, High (Very High is everything ≥ the last). */
export const THRESHOLDS: Record<Scale, readonly [number, number, number, number]> = {
  risk: [2.5, 3.4, 4.3, 5.9],
  hazard: [1.3, 2.0, 3.3, 4.7],
  vulnerability: [2.5, 3.3, 4.1, 5.0],
  coping: [4.1, 5.3, 6.7, 7.7],
};

/**
 * Class colours: one palette per scale, so a dimension is never read in the colours of risk.
 *
 *   risk           five steps from pale yellow to deep red (PMO-DMD, 11 October 2026). No area is a
 *                  "safe" green. The steps are not the colours of the Guide Book's levels: the site
 *                  communicates in INFORM's classes and never names a level or its colour.
 *   hazard, vulnerability, coping
 *                  the palettes of the INFORM SADC 2024 workbook's own class formatting (hazard yellow
 *                  to brown, vulnerability blue, lack of coping capacity green), the fourth hazard step
 *                  darkened a little (#D44E27 → #C94A25) so that text on it reaches WCAG AA.
 *
 * Each palette is ordered by luminance, so it also reads in greyscale and with colour-vision deficiency.
 * The risk palette is kept in sync with the `--color-class-*` tokens in `src/styles/index.css`.
 */
export const CLASS_PALETTES: Record<Scale, Record<ClassKey, string>> = {
  risk: { veryLow: '#fef08a', low: '#facc15', medium: '#fb923c', high: '#ea580c', veryHigh: '#b91c1c' },
  hazard: { veryLow: '#f9ffc9', low: '#ffaf79', medium: '#ff7900', high: '#c94a25', veryHigh: '#a04121' },
  vulnerability: { veryLow: '#cfecf5', low: '#a2d8e6', medium: '#4ac0df', high: '#0092c8', veryHigh: '#133d73' },
  coping: { veryLow: '#dfede0', low: '#bfe1c5', medium: '#70c396', high: '#00ab69', veryHigh: '#006853' },
};

/** The colours of overall INFORM risk (the risk palette). */
export const CLASS_COLORS: Record<ClassKey, string> = CLASS_PALETTES.risk;
export const NO_DATA_COLOR = '#94a3b8';

/** The colour of a class on a scale. */
export const classColor = (key: ClassKey, scale: Scale = 'risk'): string => CLASS_PALETTES[scale][key];

/** Relative luminance (0–1, WCAG) of a `#rrggbb` colour. */
export function relativeLuminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio of two `#rrggbb` colours. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Readable text on a class fill (WCAG AA, 4.5:1): white on the dark fills, near-black on the rest. The
 * threshold is the luminance below which white reaches 4.5:1; every palette colour is checked in the
 * tests to reach it on one side or the other.
 */
export const readableOn = (hex: string): string => (relativeLuminance(hex) <= 0.1833 ? '#ffffff' : '#0b1324');

export interface ClassInfo {
  key: ClassKey;
  index: number; // 0 (Very Low) … 4 (Very High)
  color: string;
}

/** Classify a 0–10 score on the given scale; null for missing values. The colour is the scale's. */
export function classify(value: number | null | undefined, scale: Scale = 'risk'): ClassInfo | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const t = THRESHOLDS[scale];
  let index = 0;
  while (index < 4 && value >= t[index]) index++;
  const key = CLASS_KEYS[index];
  return { key, index, color: CLASS_PALETTES[scale][key] };
}

/** Human range strings for a legend, e.g. risk → ['0.0–2.4', '2.5–3.3', …]. */
export function classRanges(scale: Scale = 'risk'): string[] {
  const t = THRESHOLDS[scale];
  const lo = [0, ...t];
  const hi = [...t.map((x) => Math.round((x - 0.1) * 10) / 10), 10];
  return lo.map((l, i) => `${l.toFixed(1)}–${hi[i].toFixed(1)}`);
}
