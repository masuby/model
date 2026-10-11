/**
 * The risk level of an area for communication: its INFORM class in one of three colours (very low and
 * low yellow, medium and high orange, very high red). The class is named; no warning level is derived
 * from it.
 */
import { describe, expect, it } from 'vitest';
import { CLASS_KEYS, THRESHOLDS } from '@/engine/risk/classes';
import { buildModel } from '@/engine/risk/model';
import { ALERT_COLOR, BAND_BY_CLASS, onAlertColor, riskBandFor } from '../alert';

/** WCAG 2 contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('risk level and colour band from the risk class', () => {
  it('maps very low and low to yellow, medium and high to orange, very high to red', () => {
    expect(BAND_BY_CLASS).toEqual({ veryLow: 1, low: 1, medium: 2, high: 2, veryHigh: 3 });
    const [lowFrom, mediumFrom, highFrom, veryHighFrom] = THRESHOLDS.risk;
    expect(riskBandFor(0)).toMatchObject({ cls: 'veryLow', index: 0, band: 1, color: ALERT_COLOR[1] });
    expect(riskBandFor(lowFrom - 0.01)).toMatchObject({ cls: 'veryLow', band: 1 });
    expect(riskBandFor(lowFrom)).toMatchObject({ cls: 'low', index: 1, band: 1 });
    expect(riskBandFor(mediumFrom)).toMatchObject({ cls: 'medium', index: 2, band: 2, color: ALERT_COLOR[2] });
    expect(riskBandFor(highFrom - 0.01)).toMatchObject({ cls: 'medium', band: 2 });
    expect(riskBandFor(highFrom)).toMatchObject({ cls: 'high', index: 3, band: 2 });
    expect(riskBandFor(veryHighFrom)).toMatchObject({ cls: 'veryHigh', index: 4, band: 3, color: ALERT_COLOR[3] });
    expect(riskBandFor(10)).toMatchObject({ cls: 'veryHigh', score: 10, band: 3 });
    for (const k of CLASS_KEYS) expect([1, 2, 3]).toContain(BAND_BY_CLASS[k]);
  });

  it('has no level without a score', () => {
    expect(riskBandFor(null)).toBeNull();
    expect(riskBandFor(undefined)).toBeNull();
    expect(riskBandFor(Number.NaN)).toBeNull();
  });

  it('gives every area with a score its level', () => {
    const model = buildModel();
    for (const u of [...model.councils, ...model.regions, ...model.sources, model.national]) {
      if (u.risk == null) continue;
      expect(riskBandFor(u.risk), u.name).not.toBeNull();
    }
  });

  it('keeps the three colours distinct and legible, and names no warning level', () => {
    expect(new Set(Object.values(ALERT_COLOR)).size).toBe(3);
    for (const level of [1, 2, 3] as const) expect(contrast(ALERT_COLOR[level], onAlertColor(level))).toBeGreaterThanOrEqual(4.5);
    expect(Object.keys(riskBandFor(5)!).sort()).toEqual(['band', 'cls', 'color', 'index', 'score']);
  });
});
