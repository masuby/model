/**
 * GOLDEN - standardise() reproduces the Tanzania workbook's 0–10 byte-for-byte.
 * Fixture rows are [indicator_id, raw_value, expected_0-10] for every USED, denominator-free indicator ×
 * every district, read from the workbook (`Indicator Data` raw → `Indicator - processed` 0–10).
 */
import { describe, expect, it } from 'vitest';
import { indicatorSpec, standardise, type IndicatorSpec } from '../standardise';
import fixtureJson from './fixtures/standardise.fixture.json';

const fixture = fixtureJson as Array<[string, number | string, number]>;

describe('standardise() reproduces the Tanzania workbook 0–10', () => {
  it(`matches all ${fixture.length} keyed values (every used indicator × every district)`, () => {
    const mismatches: unknown[] = [];
    for (const [id, raw, expected] of fixture) {
      const got = standardise(raw, indicatorSpec(id));
      if (got === null || Math.abs(got - expected) > 0.001) mismatches.push({ id, raw, got, expected });
    }
    expect(mismatches.slice(0, 8)).toEqual([]);
  });

  it('the fixture is comprehensive (guards against silent shrinkage)', () => {
    expect(fixture.length).toBeGreaterThan(8000);
    expect(new Set(fixture.map((r) => r[0])).size).toBeGreaterThanOrEqual(45);
  });

  it('covers every variation: data-range, custom, log, increase, decrease', () => {
    const specs = [...new Set(fixture.map((r) => r[0]))].map(indicatorSpec).filter((s): s is IndicatorSpec => !!s);
    expect(specs.some((s) => String(s.normalisation).startsWith('Data'))).toBe(true);
    expect(specs.some((s) => String(s.normalisation).startsWith('Custom'))).toBe(true);
    expect(specs.some((s) => s.transform === 'Logarithm')).toBe(true);
    expect(specs.some((s) => String(s.sign).startsWith('Increase'))).toBe(true);
    expect(specs.some((s) => String(s.sign).startsWith('Decrease'))).toBe(true);
  });

  it('treats "No data", empty and non-numeric input as missing (never as zero)', () => {
    const spec = indicatorSpec('HA.NAT.DR-FRE');
    expect(standardise('No data', spec)).toBeNull();
    expect(standardise('', spec)).toBeNull();
    expect(standardise('abc', spec)).toBeNull();
    expect(standardise(null, spec)).toBeNull();
  });
});
