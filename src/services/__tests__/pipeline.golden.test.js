/**
 * GOLDEN TEST - the FULL pipeline (raw -> risk) reproduces the Tanzania workbook.
 *
 * The fixture is, per district: the raw keyed values by indicator id, plus the workbook's own stored
 * HAZARD / VULNERABILITY / LACK-OF-COPING dimension totals and RISK (from INFORM SADC 2024). This proves
 * the pieces COMPOSE: standardise -> component AVERAGEIFS -> category AVERAGE -> dimension scaled GEOMEAN
 * -> risk cube-root, end to end, equals the workbook - the link the two unit golden tests don't cover.
 */
import { describe, it, expect } from 'vitest';
import { computeFromRaw } from '../standardise';
import pipe from './pipeline.fixture.json';

describe('full pipeline raw -> risk reproduces the workbook', () => {
  it(`matches stored Hazard/Vulnerability/Coping/Risk for all ${pipe.length} districts`, () => {
    const bad = [];
    for (const row of pipe) {
      const r = computeFromRaw(row.raw);
      const off = (got, exp) => got == null || Math.abs(got - exp) > 0.051; // within a 0.1 rounding step
      if (off(r.dimension.H, row.hazard) || off(r.dimension.V, row.vulnerability) ||
          off(r.dimension.C, row.coping) || off(r.risk, row.risk)) {
        bad.push({ d: row.district, got: { ...r.dimension, risk: r.risk },
                   exp: { H: row.hazard, V: row.vulnerability, C: row.coping, risk: row.risk } });
      }
    }
    if (bad.length) console.error('first pipeline mismatches:', bad.slice(0, 8));
    expect(bad.length).toBe(0);
  });

  it('is comprehensive (all 170 districts, real raw)', () => {
    expect(pipe.length).toBeGreaterThanOrEqual(170);
    expect(Object.keys(pipe[0].raw).length).toBeGreaterThan(15);
  });
});
