/**
 * Where an approved value comes from (stamps.ts): an institution's update through the portal, a
 * Benchmark 2026 value, or an Advancement value. Only the first is ever counted as an update.
 */
import { describe, expect, it } from 'vitest';
import benchmarkFile from '@/data/tanzania-benchmark-2026.json';
import { BENCHMARK_AT, BENCHMARK_RELEASE, BENCHMARK_VALUES } from '../benchmark';
import { BENCHMARK_OVERRIDES, buildModel } from '../model';
import { deriveRawOverrides, type RawValue } from '../rawValues';
import { ADVANCEMENT_AUTHORITY, isBenchmarkStamp, isPortalStamp, portalEditCount, stampCount, stampOrigin } from '../stamps';

describe('stamp origin', () => {
  it('tells the three kinds apart', () => {
    expect(stampOrigin({ authority: 'NBS' })).toBe('portal');
    expect(stampOrigin({ authority: 'NEMC', release: 'bm-2026.10' })).toBe('benchmark');
    expect(stampOrigin({ authority: ADVANCEMENT_AUTHORITY })).toBe('advancement');
    expect(isPortalStamp(null)).toBe(false);
  });

  it('every Benchmark 2026 value carries its release, and every benchmark stamp is a benchmark stamp', () => {
    expect(BENCHMARK_VALUES.every((v) => v.release === BENCHMARK_RELEASE && v.at === BENCHMARK_AT)).toBe(true);
    const stamps = Object.values(BENCHMARK_OVERRIDES).flatMap((o) => Object.values(o ?? {}));
    expect(stamps.length).toBeGreaterThan(1500);
    expect(stamps.every((s) => isBenchmarkStamp(s))).toBe(true);
  });

  it('the shipped model has no update: no council or region counts one, and the model counts none', () => {
    const model = buildModel();
    expect(model.councils.filter((c) => portalEditCount(c) > 0)).toHaveLength(0);
    expect(model.regions.filter((r) => portalEditCount(r) > 0)).toHaveLength(0);
    expect(model.editCount).toBe(0);
    expect(model.councils.every((c) => stampCount(c, 'benchmark') >= 8)).toBe(true);
  });

  it('a group recomputed from an institution’s value is an update, even with benchmark values beside it', () => {
    const model = buildModel({}, { benchmark: false });
    const portal: RawValue = { specId: 'VU.SE.LV-FS', unitId: 'C009', level: 'council', value: 55, at: '2026-11-01T00:00:00Z', institution: 'MUCHALI', dataset: 'IPC update' };
    const derived = deriveRawOverrides([...BENCHMARK_VALUES, portal], model, null);
    const monduli = derived.C009?.['vulnerability:livelihoods'];
    expect(monduli && isPortalStamp(monduli)).toBe(true);
    expect(monduli?.inputs?.some((i) => i.release === BENCHMARK_RELEASE)).toBe(true); // the IPC phase stays the benchmark's
    expect(isBenchmarkStamp(derived.C001?.['vulnerability:livelihoods'])).toBe(true);
    // With the update applied, the council counts one update.
    const updated = buildModel({ C009: { 'vulnerability:livelihoods': monduli! } });
    expect(portalEditCount(updated.byId.get('C009')!)).toBe(1);
    expect(updated.editCount).toBe(1);
  });
});

describe('the Benchmark 2026 file stays small', () => {
  it('is stored compactly: dataset metadata once, values as plain maps', () => {
    expect(JSON.stringify(benchmarkFile).length).toBeLessThan(100_000);
    expect(BENCHMARK_VALUES).toHaveLength(3205); // 2,815 of 10 October, plus the earthquake felt intensity and the drought index of 14 October (195 councils each)
  });
});
