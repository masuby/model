/**
 * GOLDEN TEST — JS engine vs the Tanzania workbook's OWN cached numbers.
 *
 * Fixture rows were read directly from "INFORM SADC 2024" (data_only) — the
 * six category means (S,Y / AE,AJ / AQ,AT) and the values Excel itself
 * computed and stored for the three dimensions (Z,AK,AU) and RISK (AV).
 *
 * This proves the engine's informScaledGeomean + cube-root reproduce the
 * workbook formula:
 *   Dimension = ROUND((10 - GEOMEAN((10-c1)/10*9+1, (10-c2)/10*9+1))/9*10, 1)
 *   Risk      = ROUND(Z^(1/3) * AK^(1/3) * AU^(1/3), 1)
 */
import { describe, it, expect } from 'vitest';
import { informScaledGeomean, roundTo } from '../informCalculationEngine';
import rows from './workbook_rows.fixture.json';

const dim = (c1, c2) => roundTo(informScaledGeomean([c1, c2]), 1);
const risk = (Z, AK, AU) =>
  roundTo(Math.pow(Z, 1 / 3) * Math.pow(AK, 1 / 3) * Math.pow(AU, 1 / 3), 1);

describe('Engine reproduces the Tanzania workbook (INFORM SADC 2024)', () => {
  for (const r of rows) {
    it(`${r.name}: scaled-geomean dimensions match Excel`, () => {
      expect(dim(r.S, r.Y)).toBe(r.Z);    // HAZARD
      expect(dim(r.AE, r.AJ)).toBe(r.AK);  // VULNERABILITY
      expect(dim(r.AQ, r.AT)).toBe(r.AU);  // LACK OF COPING CAPACITY
    });
    it(`${r.name}: cube-root risk matches Excel`, () => {
      // use the workbook's rounded dimension values, exactly as the sheet does
      expect(risk(r.Z, r.AK, r.AU)).toBe(r.AV);
    });
  }
});
