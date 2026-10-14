/**
 * The colours of the classes (classes.ts) and the ramps (metrics.ts): one palette per scale, the risk
 * palette nested in the three colour bands of risk communication, the dimension palettes from the INFORM
 * SADC 2024 workbook, and readable text on every fill.
 */
import { describe, expect, it } from 'vitest';
import { ALERT_COLOR, BAND_BY_CLASS } from '@/features/guide/alert';
import { CLASS_KEYS, CLASS_PALETTES, classColor, classify, contrastRatio, NO_DATA_COLOR, readableOn, relativeLuminance, SCALES, CLASS_COLORS } from '../classes';
import { metricColor, parseMetric, rampColor, rampStops } from '../metrics';

/** Hue (degrees) of a `#rrggbb` colour, to name its family. */
function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
}

describe('the palettes', () => {
  it('give every scale five distinct colours ordered from light to dark', () => {
    for (const scale of SCALES) {
      const colours = CLASS_KEYS.map((k) => CLASS_PALETTES[scale][k]);
      expect(new Set(colours).size).toBe(5);
      const lum = colours.map(relativeLuminance);
      for (let i = 1; i < lum.length; i++) expect(lum[i]).toBeLessThan(lum[i - 1]);
    }
    expect(CLASS_COLORS).toBe(CLASS_PALETTES.risk);
  });

  it('run the risk classes from yellows through oranges to red, with no green', () => {
    const family = (h: number) => (h >= 45 && h <= 65 ? 'yellow' : h >= 15 && h < 45 ? 'orange' : h < 15 || h > 345 ? 'red' : 'other');
    const bandFamily = { 1: family(hue(ALERT_COLOR[1])), 2: family(hue(ALERT_COLOR[2])), 3: family(hue(ALERT_COLOR[3])) };
    expect(bandFamily).toEqual({ 1: 'yellow', 2: 'orange', 3: 'red' });
    // The map's five steps as PMO-DMD approved them on 11 October 2026: yellows, then oranges, then red. The
    // Guide Book band of a class (BAND_BY_CLASS) only selects the book's rows and is not a colour.
    const mapFamily = { veryLow: 'yellow', low: 'yellow', medium: 'orange', high: 'orange', veryHigh: 'red' } as const;
    for (const k of CLASS_KEYS) expect(family(hue(CLASS_PALETTES.risk[k]))).toBe(mapFamily[k]);
    for (const k of CLASS_KEYS) expect(hue(CLASS_PALETTES.risk[k])).not.toBeGreaterThan(70); // nothing green
  });

  it('take the dimension palettes from the workbook: hazard yellow to brown, vulnerability blue, lack of coping green', () => {
    expect(CLASS_PALETTES.hazard.veryLow).toBe('#f9ffc9');
    expect(CLASS_PALETTES.hazard.veryHigh).toBe('#a04121');
    expect(CLASS_PALETTES.vulnerability).toEqual({ veryLow: '#cfecf5', low: '#a2d8e6', medium: '#4ac0df', high: '#0092c8', veryHigh: '#133d73' });
    expect(CLASS_PALETTES.coping).toEqual({ veryLow: '#dfede0', low: '#bfe1c5', medium: '#70c396', high: '#00ab69', veryHigh: '#006853' });
    for (const k of CLASS_KEYS) expect(hue(CLASS_PALETTES.vulnerability[k])).toBeGreaterThan(180);
    for (const k of CLASS_KEYS) expect(hue(CLASS_PALETTES.coping[k])).toBeGreaterThan(100);
  });

  it('colour a classified score in the colours of its own scale', () => {
    expect(classify(4.0, 'risk')!.color).toBe(CLASS_PALETTES.risk.medium);
    expect(classify(4.0, 'hazard')!.color).toBe(CLASS_PALETTES.hazard.high);
    expect(classify(4.0, 'vulnerability')!.color).toBe(CLASS_PALETTES.vulnerability.medium);
    expect(classify(4.0, 'coping')!.color).toBe(CLASS_PALETTES.coping.veryLow);
    expect(classColor('veryHigh', 'coping')).toBe('#006853');
    expect(classColor('low')).toBe(CLASS_PALETTES.risk.low);
  });

  it('carry readable text on every fill (WCAG AA 4.5:1), including the no-data grey', () => {
    for (const scale of SCALES) for (const k of CLASS_KEYS) expect(contrastRatio(CLASS_PALETTES[scale][k], readableOn(CLASS_PALETTES[scale][k]))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(NO_DATA_COLOR, readableOn(NO_DATA_COLOR))).toBeGreaterThanOrEqual(4.5);
    expect(readableOn('#b91c1c')).toBe('#ffffff');
    expect(readableOn('#facc15')).toBe('#0b1324');
  });
});

describe('the ramps', () => {
  it('run through the five colours of their scale, in RGB', () => {
    for (const scale of SCALES) {
      expect(rampStops(scale)).toEqual(CLASS_KEYS.map((k) => CLASS_PALETTES[scale][k]));
      expect(rampColor(0, scale)).toBe(rgb(CLASS_PALETTES[scale].veryLow));
      expect(rampColor(10, scale)).toBe(rgb(CLASS_PALETTES[scale].veryHigh));
      expect(rampColor(5, scale)).toBe(rgb(CLASS_PALETTES[scale].medium));
    }
    expect(rampColor(null)).toBe(NO_DATA_COLOR);
    expect(rampColor(3)).toBe(rampColor(3, 'risk'));
  });

  it('paint an indicator in its dimension, a dimension in its classes', () => {
    const flood = parseMetric('ind:hazard:flood');
    expect(flood.palette).toBe('hazard');
    expect(metricColor(flood, 10)).toBe(rgb(CLASS_PALETTES.hazard.veryHigh));
    const poverty = parseMetric('ind:vulnerability:developmentPoverty');
    expect(poverty.palette).toBe('vulnerability');
    expect(parseMetric('dim:coping')).toMatchObject({ scale: 'coping', palette: 'coping' });
    expect(metricColor(parseMetric('dim:coping'), 8)).toBe(CLASS_PALETTES.coping.veryHigh);
    expect(parseMetric('risk')).toMatchObject({ scale: 'risk', palette: 'risk' });
    expect(metricColor(parseMetric('risk'), null)).toBe(NO_DATA_COLOR);
  });
});

const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
