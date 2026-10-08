/**
 * The alert category follows the assessed risk level: very low and low risk are an Advisory (yellow),
 * medium a Warning (orange), high and very high a Major warning (red).
 */
import { describe, expect, it } from 'vitest';
import { CLASS_KEYS, THRESHOLDS } from '@/engine/risk/classes';
import { buildModel } from '@/engine/risk/model';
import { ALERT_BY_CLASS, ALERT_COLOR, alertFor, onAlertColor } from '../alert';

/** WCAG 2 contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('alert category from the risk level', () => {
  it('follows the rule for every risk class', () => {
    expect(ALERT_BY_CLASS).toEqual({ veryLow: 1, low: 1, medium: 2, high: 3, veryHigh: 3 });
    for (const k of CLASS_KEYS) expect(ALERT_BY_CLASS[k]).toBeDefined();
  });

  it('reads the risk thresholds, each the start of the next class', () => {
    const [lowFrom, mediumFrom, highFrom, veryHighFrom] = THRESHOLDS.risk;
    expect(alertFor(0)).toMatchObject({ level: 1, cls: 'veryLow' });
    expect(alertFor(lowFrom - 0.01)).toMatchObject({ level: 1, cls: 'veryLow' });
    expect(alertFor(lowFrom)).toMatchObject({ level: 1, cls: 'low' });
    expect(alertFor(mediumFrom - 0.01)).toMatchObject({ level: 1, cls: 'low' });
    expect(alertFor(mediumFrom)).toMatchObject({ level: 2, cls: 'medium' });
    expect(alertFor(highFrom - 0.01)).toMatchObject({ level: 2, cls: 'medium' });
    expect(alertFor(highFrom)).toMatchObject({ level: 3, cls: 'high' });
    expect(alertFor(veryHighFrom)).toMatchObject({ level: 3, cls: 'veryHigh' });
    expect(alertFor(10)).toMatchObject({ level: 3, cls: 'veryHigh', score: 10 });
  });

  it('has no category without a score', () => {
    expect(alertFor(null)).toBeNull();
    expect(alertFor(undefined)).toBeNull();
    expect(alertFor(Number.NaN)).toBeNull();
  });

  it('gives every area with a score its category', () => {
    const model = buildModel();
    for (const u of [...model.councils, ...model.regions, ...model.sources, model.national]) {
      if (u.risk == null) continue;
      expect(alertFor(u.risk), u.name).not.toBeNull();
    }
  });

  it('uses distinct colours, with legible text on each (WCAG AA)', () => {
    expect(new Set(Object.values(ALERT_COLOR)).size).toBe(3);
    for (const level of [1, 2, 3] as const) expect(contrast(ALERT_COLOR[level], onAlertColor(level))).toBeGreaterThanOrEqual(4.5);
  });
});
