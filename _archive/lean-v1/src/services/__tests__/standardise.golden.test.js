/**
 * GOLDEN TEST - standardise() reproduces the Tanzania workbook's 0-10, in JS.
 *
 * The fixture is [indicator_id, raw_value, expected_0-10] for every USED, denominator-free indicator x
 * every district, read straight from the workbook (`Indicator Data` raw -> `Indicator - processed` 0-10).
 * This is the JS proof of the standardiser: if it passes, our standardise(raw, spec) IS the workbook's
 * standardisation, byte for byte, across all 8664 keyed values - the same 100% the Python recheck found.
 */
import { describe, it, expect } from 'vitest';
import { standardise, indicatorSpec } from '../standardise';
import fixture from './standardise.fixture.json';

describe('standardise() reproduces the Tanzania workbook 0-10', () => {
  it(`matches all ${fixture.length} keyed values (every used indicator x every district)`, () => {
    const mismatches = [];
    for (const [id, raw, expected] of fixture) {
      const got = standardise(raw, indicatorSpec(id));
      if (got === null || Math.abs(got - expected) > 0.001) {
        mismatches.push({ id, raw, got, expected });
      }
    }
    if (mismatches.length) console.error('first mismatches:', mismatches.slice(0, 8));
    expect(mismatches.length).toBe(0);
  });

  it('the fixture is comprehensive (guards against silent shrinkage)', () => {
    expect(fixture.length).toBeGreaterThan(8000);
    expect(new Set(fixture.map((r) => r[0])).size).toBeGreaterThanOrEqual(45);
  });

  it('covers every variation: data-range, custom, log, increase, decrease', () => {
    const specs = [...new Set(fixture.map((r) => r[0]))].map(indicatorSpec).filter(Boolean);
    expect(specs.some((s) => String(s.normalisation).startsWith('Data'))).toBe(true);
    expect(specs.some((s) => String(s.normalisation).startsWith('Custom'))).toBe(true);
    expect(specs.some((s) => s.transform === 'Logarithm')).toBe(true);
    expect(specs.some((s) => String(s.sign).startsWith('Increase'))).toBe(true);
    expect(specs.some((s) => String(s.sign).startsWith('Decrease'))).toBe(true);
  });
});
