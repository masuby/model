/**
 * GOLDEN TEST (LIVE engine) - riskModel's OWN sgm + riskScore vs the Tanzania workbook's cached numbers.
 *
 * This mirrors services/__tests__/workbook_golden.test.js, but exercises the engine the app actually
 * displays from (riskModel.js) - closing the audit gap where only the formal informCalculationEngine
 * carried a workbook-golden guard while the live engine did not. Same fixture, read directly from
 * "INFORM SADC 2024" (data_only): six category means (S,Y / AE,AJ / AQ,AT) and the workbook's own
 * cached dimensions (Z,AK,AU) and RISK (AV).
 *
 *   Dimension = ROUND((10 - GEOMEAN((10-c1)/10*9+1, (10-c2)/10*9+1))/9*10, 1)
 *   Risk      = ROUND(Z^(1/3) * AK^(1/3) * AU^(1/3), 1)
 */
import { describe, it, expect } from 'vitest';
import { sgm, riskScore, round1 } from '../riskModel';
import rows from '../../../services/__tests__/workbook_rows.fixture.json';

const dim = (c1, c2) => round1(sgm([c1, c2]));

describe('Live riskModel reproduces the Tanzania workbook (INFORM SADC 2024)', () => {
  for (const r of rows) {
    it(`${r.name}: live scaled-geomean dimensions match Excel`, () => {
      expect(dim(r.S, r.Y)).toBe(r.Z);     // HAZARD
      expect(dim(r.AE, r.AJ)).toBe(r.AK);  // VULNERABILITY
      expect(dim(r.AQ, r.AT)).toBe(r.AU);  // LACK OF COPING CAPACITY
    });
    it(`${r.name}: live cube-root risk matches Excel`, () => {
      // riskScore applies the workbook's ROUND(.,1) internally
      expect(riskScore(r.Z, r.AK, r.AU)).toBe(r.AV);
    });
  }
});

describe('Live engine edge cases (audit findings, locked in)', () => {
  it('reproduces the national risk 2.2/5.5/5.9 -> 4.1', () => {
    expect(riskScore(2.2, 5.5, 5.9)).toBe(4.1);
  });
  it('a 0 dimension yields risk 0, NOT null (matches Excel: 0^(1/3) = 0)', () => {
    expect(riskScore(0, 5.5, 5.9)).toBe(0);
  });
  it('single present category falls through unchanged (sparse-data fallback)', () => {
    expect(round1(sgm([4.0]))).toBe(4.0);
  });
});
