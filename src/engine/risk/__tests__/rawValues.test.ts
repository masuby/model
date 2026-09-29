/**
 * Measured values from institutions: level precedence (council > region > national > baseline), the
 * baseline reproduces the workbook, groups are recomputed only where data were submitted, and the most
 * recent approved value wins over a direct 0–10 edit.
 */
import { describe, expect, it } from 'vitest';
import baselineJson from '@/data/inform-baseline-raw.json';
import { buildModel, indicatorValue } from '../model';
import {
  councilInput,
  deriveRawOverrides,
  indexRawValues,
  leafOfSpec,
  leafSpecs,
  mergeOverrides,
  regionIdOf,
  scoreRaw,
  type BaselineRaw,
  type RawValue,
} from '../rawValues';
import { computeFromRaw, SPECS, usedSpecs } from '../standardise';
import pipeline from './fixtures/pipeline.fixture.json';

const baseline = baselineJson as BaselineRaw;
const model = buildModel();
const at = (d: string) => new Date(`2026-${d}T00:00:00Z`).toISOString();

const kondoa = model.byId.get('C001')!; // Kondoa District, INFORM district TZ0101
const kondoaTown = model.byId.get('C002')!; // shares TZ0101
const dodomaCouncils = model.councils.filter((c) => c.region === kondoa.region);
const otherRegion = model.councils.find((c) => c.region !== kondoa.region)!;

const MPI = 'VU.SE.POV-MPI'; // Development & Poverty, 4 indicators
const HDI = 'VU.SE.POV-HDI';

describe('indicator → leaf mapping', () => {
  it('maps every used workbook indicator onto exactly one model leaf', () => {
    const mapped = leafSpecs().flatMap((l) => l.specs.map((s) => s.id));
    expect(new Set(mapped).size).toBe(mapped.length);
    expect(mapped.sort()).toEqual(usedSpecs().map((s) => s.id).sort());
    expect(leafOfSpec(MPI)).toBe('vulnerability:developmentPoverty');
  });
});

describe('baseline', () => {
  it('covers all 170 INFORM districts', () => {
    expect(baseline.units).toHaveLength(170);
    expect(new Set(baseline.units).size).toBe(170);
  });

  it('reproduces the workbook component scores for every district', () => {
    const idx = indexRawValues([]);
    const fx = pipeline as Array<{ district: string; raw: Record<string, number> }>;
    let compared = 0;
    for (const [i, entry] of fx.entries()) {
      const sourceId = baseline.units[i];
      const council = model.councils.find((c) => c.sourceId === sourceId);
      if (!council) continue;
      const expected = computeFromRaw(entry.raw).component;
      for (const leaf of leafSpecs()) {
        const inputs = leaf.specs.map((s) => councilInput(idx, s, council, baseline));
        const scored = inputs.filter((x) => x.score != null);
        const got = scored.length ? scored.reduce((a, x) => a + x.score!, 0) / scored.length : null;
        const want = expected[leaf.component] ?? null;
        if (want == null) expect(got).toBeNull();
        else expect(got).toBeCloseTo(want, 6);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(3000);
  });
});

describe('level precedence', () => {
  const values: RawValue[] = [
    { specId: MPI, unitId: 'TZ', level: 'national', value: 0.2, at: at('01-01') },
    { specId: MPI, unitId: regionIdOf(kondoa), level: 'region', value: 0.5, institution: 'NBS', dataset: 'HBS 2024', at: at('02-01') },
    { specId: MPI, unitId: kondoa.id, level: 'council', value: 0.1, institution: 'NBS', dataset: 'HBS 2024', at: at('03-01') },
  ];
  const idx = indexRawValues(values);
  const spec = SPECS[MPI];

  it('uses the council value, else the region value, else the national value', () => {
    expect(councilInput(idx, spec, kondoa, baseline)).toMatchObject({ raw: 0.1, level: 'council' });
    expect(councilInput(idx, spec, kondoaTown, baseline)).toMatchObject({ raw: 0.5, level: 'region' });
    expect(councilInput(idx, spec, otherRegion, baseline)).toMatchObject({ raw: 0.2, level: 'national' });
  });

  it('falls back to the council’s INFORM district baseline for indicators with no submission', () => {
    expect(councilInput(indexRawValues([]), SPECS[HDI], kondoa, baseline)).toMatchObject({ level: 'baseline', unitId: 'TZ0101' });
  });
});

describe('recomputing a group', () => {
  it('replaces one indicator and keeps the baseline scores of the others', () => {
    const values: RawValue[] = [{ specId: MPI, unitId: regionIdOf(kondoa), level: 'region', value: 0.5, at: at('02-01') }];
    const derived = deriveRawOverrides(values, model, baseline);
    const stamp = derived[kondoaTown.id]!['vulnerability:developmentPoverty']!;
    const inputs = stamp.inputs!;
    expect(inputs.map((i) => i.level)).toEqual(inputs.map((i) => (i.specId === MPI ? 'region' : 'baseline')));
    const scores = inputs.map((i) => i.score).filter((s): s is number => s != null);
    expect(stamp.value).toBeCloseTo(Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10, 6);
    expect(inputs.find((i) => i.specId === MPI)!.score).toBe(scoreRaw(SPECS[MPI], 0.5));
    // Every council of the region is recomputed; no other region is touched.
    expect(Object.keys(derived).sort()).toEqual(dodomaCouncils.map((c) => c.id).sort());
  });

  it('leaves out an indicator recorded as no data (never zero)', () => {
    const values: RawValue[] = [{ specId: MPI, unitId: kondoa.id, level: 'council', value: null, at: at('02-01') }];
    const inputs = deriveRawOverrides(values, model, baseline)[kondoa.id]!['vulnerability:developmentPoverty']!.inputs!;
    expect(inputs.find((i) => i.specId === MPI)).toMatchObject({ raw: null, score: null, level: 'council' });
  });

  it('lets a council differ from the councils that share its INFORM district', () => {
    const values: RawValue[] = [{ specId: MPI, unitId: kondoa.id, level: 'council', value: 0.9, at: at('02-01') }];
    const m = buildModel(mergeOverrides({}, deriveRawOverrides(values, model, baseline), model));
    const a = indicatorValue(m.byId.get(kondoa.id)!, 'vulnerability', 'developmentPoverty');
    const b = indicatorValue(m.byId.get(kondoaTown.id)!, 'vulnerability', 'developmentPoverty');
    expect(a).not.toBe(b);
    expect(b).toBe(indicatorValue(kondoaTown, 'vulnerability', 'developmentPoverty'));
    expect(m.byId.get(kondoa.id)!.dims.vulnerability.score).not.toBe(kondoa.dims.vulnerability.score);
  });
});

describe('merging with direct 0–10 edits', () => {
  const ref = 'vulnerability:developmentPoverty' as const;
  const values: RawValue[] = [{ specId: MPI, unitId: kondoa.id, level: 'council', value: 0.9, at: at('05-01') }];
  const derived = deriveRawOverrides(values, model, baseline);

  it('keeps a newer direct edit made on the INFORM district', () => {
    const explicit = { TZ0101: { [ref]: { value: 1.1, at: at('06-01') } } };
    expect(mergeOverrides(explicit, derived, model)[kondoa.id]?.[ref]).toBeUndefined();
  });

  it('replaces an older direct edit with the newer measured value', () => {
    const explicit = { [kondoa.id]: { [ref]: { value: 1.1, at: at('04-01') } } };
    expect(mergeOverrides(explicit, derived, model)[kondoa.id]?.[ref]?.inputs).toBeDefined();
  });
});
