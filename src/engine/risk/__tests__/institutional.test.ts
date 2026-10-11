/**
 * The two Tanzanian institutional indicators (institutional.ts): how the councils' arrangements and committee
 * criteria become scores, how the published lists seed them through the Benchmark 2026, and how an approved
 * committee record supersedes them.
 */
import { describe, expect, it } from 'vitest';
import { BENCHMARK_DATASETS, BENCHMARK_VALUES } from '../benchmark';
import { arrangementsDetail, arrangementsShare, committeeDetail, committeeShare, DRR_ARR, GOV_DMC, institutionalRawValues, institutionalRecordValues, parseArrangementsDetail, parseCommitteeDetail } from '../institutional';
import { buildModel, drrFor, indicatorValue } from '../model';
import { deriveRawOverrides, regionIdOf } from '../rawValues';
import { ACTIVE_SPECS, standardise } from '../standardise';
import baselineJson from '@/data/inform-baseline-raw.json';
import type { BaselineRaw } from '../rawValues';

const baseline = baselineJson as unknown as BaselineRaw;

const model = buildModel();

describe('scores', () => {
  it('counts the five arrangements, an unrecorded one as not in place, on a fixed scale that decreases risk', () => {
    expect(arrangementsShare({ eprp: true, rvca: true, ert: true, eocc: true, training: true })).toBe(100);
    expect(arrangementsShare({ eprp: true, aa: true })).toBe(20); // anticipatory action is recorded but not among the five
    expect(arrangementsShare(undefined)).toBe(0);
    expect(standardise(100, ACTIVE_SPECS[DRR_ARR])).toBe(0);
    expect(standardise(0, ACTIVE_SPECS[DRR_ARR])).toBe(10);
    expect(ACTIVE_SPECS[DRR_ARR]).toMatchObject({ component: 'DRR implementation', category: 'Institutional', sign: 'Decrease Risk', resolved_min: 0, resolved_max: 100 });
  });

  it('scores the committee over the assessed criteria only', () => {
    expect(committeeShare({ committee: true, stakeholders: false, involvement: true })).toBe(66.7);
    expect(committeeShare({ stakeholders: true })).toBe(100);
    expect(committeeShare({ eprp: true })).toBeNull();
    expect(ACTIVE_SPECS[GOV_DMC]).toMatchObject({ component: 'Governance', category: 'Institutional', resolved_max: 100 });
  });

  it('writes and reads the compact detail codes', () => {
    const drr = { eprp: true, eprpYear: 2023, rvca: true, rvcaYear: 2023, ert: true, training: true, committee: true, stakeholders: false };
    expect(arrangementsDetail(drr)).toBe('drr:e2023r2023tg');
    expect(parseArrangementsDetail('drr:e2023r2023tg')).toEqual({ met: [{ key: 'eprp', year: 2023 }, { key: 'rvca', year: 2023 }, { key: 'ert', year: null }, { key: 'training', year: null }], not: ['eocc'] });
    expect(committeeDetail(drr)).toBe('gov:Cs');
    expect(parseCommitteeDetail('gov:Cs')).toEqual({ met: ['committee'], not: ['stakeholders'] });
    expect(parseArrangementsDetail('drr:').met).toEqual([]);
  });
});

describe('the published lists in the model', () => {
  it('seed every council through the Benchmark 2026, and the committee where a criterion is assessed', () => {
    expect(BENCHMARK_DATASETS['drr-arrangements']).toMatchObject({ indicator: DRR_ARR, values: 195, level: 'council', institution: 'PMO' });
    expect(BENCHMARK_DATASETS['committee-functioning']).toMatchObject({ indicator: GOV_DMC, level: 'council' });
    expect(BENCHMARK_VALUES.filter((v) => v.specId === DRR_ARR)).toHaveLength(195);
    const ilemela = model.byId.get('C139')!; // Mwanza: a plan with its assessment, the region's team, centre and training
    expect(ilemela.drr).toMatchObject({ eprp: true, rvca: true, ert: true, eocc: true, training: true, committee: true, stakeholders: true, involvement: true });
    expect(indicatorValue(ilemela, 'coping', 'drrImplementation')).toBe(4.3); // mean of the Sendai score 3, early warning 10 and the arrangements 0
    expect(ilemela.edits['coping:drrImplementation']?.release).toBe('bm-2026.10');
    const sikonge = model.byId.get('C104')!; // Tabora: nothing on the lists
    expect(arrangementsShare(sikonge.drr)).toBe(0);
    expect(indicatorValue(sikonge, 'coping', 'drrImplementation')).toBe(7.7);
    expect(committeeShare(sikonge.drr)).toBeNull();
    expect(sikonge.edits['coping:governance']).toBeUndefined();
    // Kinondoni: the plan and its assessment of 2023 carry their year.
    expect(model.byId.get('C052')!.drr).toMatchObject({ eprp: true, eprpYear: 2023, rvcaYear: 2023 });
  });

  it('lowers a region and the country in proportion to the councils covered', () => {
    const mwanza = model.byId.get('R-mwanza')!;
    const tabora = model.byId.get('R-tabora')!;
    expect(indicatorValue(mwanza, 'coping', 'drrImplementation')!).toBeLessThan(indicatorValue(tabora, 'coping', 'drrImplementation')!);
    expect(indicatorValue(tabora, 'coping', 'drrImplementation')!).toBeCloseTo(7.7, 6);
    expect(indicatorValue(model.national, 'coping', 'drrImplementation')!).toBeGreaterThan(6.5); // high while the registers are incomplete
    expect(indicatorValue(model.national, 'coping', 'drrImplementation')!).toBeLessThan(7.7);
  });
});

describe('an approved committee record', () => {
  it('supersedes the published value of its council on its date, and a regional record speaks for the region', () => {
    const approved = [
      { unitId: 'C104', level: 'council' as const, regionId: 'R-tabora', payload: { eprp: true, rvca: true, training: true, committee: true, stakeholders: false }, source: 'DEPRP approved 2026 (DDRRC minutes)', at: '2026-11-02T09:00:00Z', authorRole: 'ddrrc' },
      { unitId: 'R-tabora', level: 'region' as const, regionId: 'R-tabora', payload: { eocc: true, ert: true }, source: 'Regional centre commissioned (PMO-DMD letter)', at: '2026-11-05T09:00:00Z', authorRole: 'rdrrc' },
    ];
    const values = institutionalRecordValues(approved, model.councils, drrFor, regionIdOf);
    const sikonge = values.filter((v) => v.unitId === 'C104');
    expect(sikonge.map((v) => [v.specId, v.value, v.detail, v.institution, v.at])).toEqual([
      [DRR_ARR, 100, 'drr:ertog', 'DRRC', '2026-11-05T09:00:00Z'],
      [GOV_DMC, 50, 'gov:Cs', 'DRRC', '2026-11-05T09:00:00Z'],
    ]);
    // Every Tabora council gets the region's centre and team; only Sikonge its own plan.
    const uyui = values.find((v) => v.unitId === 'C103' && v.specId === DRR_ARR)!;
    expect(uyui.value).toBe(40);
    expect(values.filter((v) => v.unitId === 'C103' && v.specId === GOV_DMC)).toHaveLength(0);
    // Through the measured-value engine the record wins over the benchmark and counts as an update.
    const overrides = deriveRawOverrides([...BENCHMARK_VALUES, ...values], model, baseline);
    const stamp = overrides.C104!['coping:drrImplementation']!;
    expect(stamp.release).toBeUndefined();
    expect(stamp.authority).toBe('DRRC');
    expect(stamp.value).toBe(4.3);
    const updated = buildModel(overrides, { drr: { C104: approved[0].payload, 'R-tabora': approved[1].payload } });
    expect(indicatorValue(updated.byId.get('C104')!, 'coping', 'drrImplementation')).toBe(4.3);
    expect(updated.byId.get('C104')!.drr).toMatchObject({ eprp: true, eocc: true, ert: true, training: true, committee: true, stakeholders: false });
    expect(institutionalRawValues([])).toEqual([]);
  });
});
