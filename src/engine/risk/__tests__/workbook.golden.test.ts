/**
 * GOLDEN - the aggregation maths vs the workbook's own cached cells (INFORM SADC 2024, data_only):
 * six category means (S,Y / AE,AJ / AQ,AT), the dimensions (Z, AK, AU) and RISK (AV). Also checks the
 * formulas against an independent reference written straight from the Excel strings.
 *
 *   Dimension = ROUND((10 − GEOMEAN((10−c1)/10·9+1, (10−c2)/10·9+1)) / 9 · 10, 1)
 *   Risk      = ROUND(Z^(1/3) · AK^(1/3) · AU^(1/3), 1)
 */
import { describe, expect, it } from 'vitest';
import { dimensionScore, mean, riskScore, round1, scaledGeomean, weightedMean } from '../math';
import rowsJson from './fixtures/workbook_rows.fixture.json';

interface Row {
  name: string;
  S: number; Y: number; AE: number; AJ: number; AQ: number; AT: number;
  Z: number; AK: number; AU: number; AV: number;
}
const rows = rowsJson as Row[];

// Independent reference - the literal Excel expressions.
const excelScaledGeomean = (a: number, b: number) => {
  const geo = Math.sqrt(((10 - a) / 10 * 9 + 1) * ((10 - b) / 10 * 9 + 1));
  return Math.round(((10 - geo) / 9) * 10 * 10) / 10;
};
const excelRisk = (h: number, v: number, c: number) => Math.round(Math.pow(h, 1 / 3) * Math.pow(v, 1 / 3) * Math.pow(c, 1 / 3) * 10) / 10;

describe('engine reproduces the Tanzania workbook (INFORM SADC 2024)', () => {
  for (const r of rows) {
    it(`${r.name}: dimensions match Excel`, () => {
      expect(dimensionScore([r.S, r.Y])).toBe(r.Z);
      expect(dimensionScore([r.AE, r.AJ])).toBe(r.AK);
      expect(dimensionScore([r.AQ, r.AT])).toBe(r.AU);
    });
    it(`${r.name}: cube-root risk matches Excel`, () => {
      expect(riskScore(r.Z, r.AK, r.AU)).toBe(r.AV);
    });
  }
});

describe('formula parity with the literal Excel expressions', () => {
  it('scaled geometric mean', () => {
    for (const [a, b] of [[5, 5], [6.5, 3.2], [0, 10], [10, 0], [2, 8], [7.3, 4.1]]) {
      expect(dimensionScore([a, b])).toBe(excelScaledGeomean(a, b));
    }
  });
  it('risk', () => {
    for (const [h, v, c] of [[5, 5, 5], [6.5, 3.2, 4.8], [4.1, 4.2, 5.3], [7, 6.5, 8], [2, 3, 5]]) {
      expect(riskScore(h, v, c)).toBe(excelRisk(h, v, c));
    }
  });
  it('risk is always rounded to exactly one decimal', () => {
    for (let i = 0; i < 200; i++) {
      const r = riskScore(Math.random() * 10, Math.random() * 10, Math.random() * 10)!;
      expect(Math.abs(r * 10 - Math.round(r * 10))).toBeLessThan(1e-9);
    }
  });
});

describe('edge cases (locked in)', () => {
  it('national 2.2 / 5.5 / 5.9 → 4.1', () => expect(riskScore(2.2, 5.5, 5.9)).toBe(4.1));
  it('a zero dimension yields 0, not null (Excel: 0^(1/3) = 0)', () => expect(riskScore(0, 5.5, 5.9)).toBe(0));
  it('a missing dimension yields null', () => expect(riskScore(null, 5.5, 5.9)).toBeNull());
  it('a single category passes through unchanged', () => expect(dimensionScore([4])).toBe(4));
  it('missing values are skipped, never treated as zero', () => {
    expect(mean([4, null, 6, undefined])).toBe(5);
    expect(scaledGeomean([])).toBeNull();
    expect(weightedMean([[4, 1], [null, 5], [8, 1]])).toBe(6);
  });
  it('round1 is round-half-up on the 0–10 scale', () => {
    expect(round1(4.25)).toBe(4.3);
    expect(round1(4.249)).toBe(4.2);
  });
  it('more hazard never lowers risk; more coping capacity never raises it (monotonic)', () => {
    for (let i = 0; i < 100; i++) {
      const h = Math.random() * 9, v = Math.random() * 10, c = Math.random() * 10;
      expect(riskScore(h + 1, v, c)!).toBeGreaterThanOrEqual(riskScore(h, v, c)!);
      expect(riskScore(v, h, c + 0)!).toBeGreaterThanOrEqual(riskScore(v, h, Math.max(0, c - 1))!);
    }
  });
});
