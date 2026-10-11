/**
 * The Advancement layer is computed beside the Core and never in its place: only the indicator groups
 * with a basket change (the eight exploded hazard groups and, since October 2026, displaced people,
 * health and education facilities and DRM arrangements), every other group stays the Core's, every
 * value carries its lineage, and with no inputs the layer equals the Core exactly.
 */
import { describe, expect, it } from 'vitest';
import inputsJson from '@/data/tanzania-advanced-inputs.json';
import {
  ADVANCEMENT_AUTHORITY,
  ADVANCEMENT_BASKETS,
  advancementCoverage,
  advancementDelta,
  advancementOverrides,
  buildAdvancedModel,
  DRR_MEMBER,
  drrArrangements,
  overridesOf,
  weightOf,
  type AdvancedInputs,
} from '../advanced';
import { riskScore, round1, weightedMean } from '../math';
import { buildModel, indicatorValue } from '../model';
import { ADVANCED_SPECS, standardise } from '../standardise';

const inputs = inputsJson as unknown as AdvancedInputs;
const core = buildModel();
const advanced = buildAdvancedModel(core, inputs);
const HAZARD_BASKETS = ['coastalHazards', 'drought', 'earthquake', 'flood', 'heatwave', 'landslide', 'lightning', 'stormsCyclone'];
const OTHER_BASKETS = ['accessHealth', 'displacedPeople', 'drrImplementation', 'education'];
const BASKET_REFS = new Set(ADVANCEMENT_BASKETS.map((b) => b.ref));

describe('Advancement inputs', () => {
  it('cover the 195 councils with advanced sub-indicators only, each with its provenance', () => {
    expect(Object.keys(inputs.values)).toHaveLength(195);
    for (const [id, meta] of Object.entries(inputs.inputs)) {
      expect(ADVANCED_SPECS[id], id).toBeTruthy();
      expect(meta.filled).toBeGreaterThan(0);
      expect(meta.source).not.toBe('');
      expect(['council', 'district']).toContain(meta.resolution);
    }
    for (const vals of Object.values(inputs.values)) for (const id of Object.keys(vals)) expect(inputs.inputs[id], id).toBeTruthy();
    // The DRM member is computed by the engine from each council's record, never read from the file.
    for (const vals of Object.values(inputs.values)) expect(vals[DRR_MEMBER]).toBeUndefined();
    const cov = advancementCoverage(inputs);
    expect(cov.total).toBe(30);
    expect(cov.filled).toBe(18);
    expect(cov.filled + cov.withheld + cov.unavailable).toBe(cov.total);
    expect(Object.keys(inputs.withheld)).toEqual(['HA.NAT.DR-SEAS']);
    // The drought and seismicity members are now computed on the council polygons (ADV-05).
    for (const id of ['HA.NAT.DR-SPEI', 'HA.NAT.DR-CV', 'HA.NAT.EQ-HIST']) expect(inputs.inputs[id].resolution, id).toBe('council');
  });

  it('the baskets map onto the eight exploded hazard groups and four vulnerability and coping groups', () => {
    expect(ADVANCEMENT_BASKETS.map((b) => b.key).sort()).toEqual([...HAZARD_BASKETS, ...OTHER_BASKETS].sort());
    for (const b of ADVANCEMENT_BASKETS) expect(HAZARD_BASKETS.includes(b.key) ? 'hazard' : b.dim).toBe(HAZARD_BASKETS.includes(b.key) ? 'hazard' : b.dim === 'vulnerability' ? 'vulnerability' : 'coping');
  });
});

describe('Advancement model', () => {
  it('never changes the Core', () => {
    const before = JSON.stringify(core.councils.map((c) => [c.risk, c.dims.hazard.score, c.dims.coping.score]));
    buildAdvancedModel(core, inputs);
    expect(JSON.stringify(core.councils.map((c) => [c.risk, c.dims.hazard.score, c.dims.coping.score]))).toBe(before);
    expect(advanced).not.toBe(core);
  });

  it('with no inputs and no DRM record equals the Core exactly', () => {
    const bare = buildModel();
    for (const c of bare.councils) delete c.drr;
    const same = buildAdvancedModel(bare, { ...inputs, values: {} });
    for (const c of bare.councils) {
      const s = same.byId.get(c.id)!;
      expect(s.risk).toBe(c.risk);
      expect(s.dims.hazard.score).toBe(c.dims.hazard.score);
      expect(s.dims.coping.score).toBe(c.dims.coping.score);
    }
    expect(same.national.risk).toBe(bare.national.risk);
  });

  it('changes only the groups with a basket; every other group keeps the Core value', () => {
    let changed = 0;
    for (const c of core.councils) {
      const a = advanced.byId.get(c.id)!;
      for (const dim of ['hazard', 'vulnerability', 'coping'] as const)
        for (const cat of Object.values(c.dims[dim].categories))
          for (const leaf of Object.keys(cat.indicators)) {
            if (BASKET_REFS.has(`${dim}:${leaf}`)) continue;
            expect(indicatorValue(a, dim, leaf), `${c.id} ${dim}:${leaf}`).toBe(indicatorValue(c, dim, leaf));
          }
      if (a.risk !== c.risk) changed++;
    }
    expect(changed).toBeGreaterThan(100);
  });

  it('every Advancement value is the weighted mean of the Core member and the standardised sub-indicators, with lineage', () => {
    const overrides = advancementOverrides(core, inputs);
    expect(Object.keys(overrides)).toHaveLength(195);
    for (const c of core.councils) {
      for (const b of ADVANCEMENT_BASKETS) {
        const stamp = overrides[c.id]?.[b.ref];
        const raw: Record<string, number | null | undefined> = { ...(inputs.values[c.id] ?? {}) };
        raw[DRR_MEMBER] = drrArrangements(c);
        const members = b.members.filter((s) => typeof raw[s.id] === 'number');
        if (!members.length) {
          expect(stamp).toBeUndefined();
          continue;
        }
        expect(stamp!.authority).toBe(ADVANCEMENT_AUTHORITY);
        const pairs: Array<readonly [number | null, number]> = members.map((s) => [standardise(raw[s.id], s), weightOf(s)] as const);
        const coreValue = indicatorValue(c, b.dim, b.key);
        if (coreValue != null) pairs.unshift([coreValue, b.workbook.length] as const);
        expect(stamp!.value).toBe(round1(weightedMean(pairs)!));
        const ids = stamp!.inputs!.map((i) => i.specId);
        for (const s of members) expect(ids).toContain(s.id);
        for (const i of stamp!.inputs!) expect(['baseline', 'council', 'district']).toContain(i.level);
      }
    }
  });

  it('counts the DRM arrangements a council has recorded, and only where something is recorded', () => {
    const kondoa = core.byId.get('C001')!;
    // Kondoa District: EPRP with its assessment and a drought anticipatory-action plan on the PMO-DMD lists,
    // and Dodoma's national centre and trained team (the published council flags of the Benchmark 2026).
    expect(drrArrangements(kondoa)).toBe(5);
    const stamp = advancementOverrides(core, inputs).C001['coping:drrImplementation']!;
    expect(stamp.inputs!.map((i) => i.specId)).toContain(DRR_MEMBER);
    // Every council carries the published flags (the registers are complete): a council with nothing in
    // place counts 0; only a workbook unit outside the lists has no record.
    expect(drrArrangements(core.byId.get('C104')!)).toBe(0); // Sikonge
    const unrecorded = core.sources.find((u) => !u.drr)!;
    expect(drrArrangements(unrecorded)).toBeNull();
  });

  it('takes sensitivity weights: a member left out drops from the mean', () => {
    const noDrr = buildAdvancedModel(core, inputs, { [DRR_MEMBER]: 0 });
    const c = core.byId.get('C001')!;
    expect(indicatorValue(noDrr.byId.get('C001')!, 'coping', 'drrImplementation')).toBe(indicatorValue(c, 'coping', 'drrImplementation'));
    expect(indicatorValue(advanced.byId.get('C001')!, 'coping', 'drrImplementation')).not.toBe(indicatorValue(c, 'coping', 'drrImplementation'));
  });

  it('keeps every approved Core value: edits on a council and on a workbook unit survive the rebuild', () => {
    const at = new Date().toISOString();
    const edited = buildModel({ C001: { 'vulnerability:habitat': { value: 1, at } }, TZ0102: { 'coping:wash': { value: 9.5, at } } }, { benchmark: false });
    expect(Object.keys(overridesOf(edited)).sort()).toEqual(['C001', 'TZ0102', ...edited.councils.filter((c) => c.sourceId === 'TZ0102').map((c) => c.id)].sort());
    const adv = buildAdvancedModel(edited, inputs);
    for (const c of edited.councils) {
      const a = adv.byId.get(c.id)!;
      expect(indicatorValue(a, 'vulnerability', 'habitat')).toBe(indicatorValue(c, 'vulnerability', 'habitat'));
      expect(indicatorValue(a, 'coping', 'wash')).toBe(indicatorValue(c, 'coping', 'wash'));
    }
    expect(indicatorValue(adv.byId.get('C001')!, 'vulnerability', 'habitat')).toBe(1);
    expect(indicatorValue(adv.byId.get('TZ0102')!, 'coping', 'wash')).toBe(9.5);
  });

  it('regions and the nation are INFORM aggregates of the councils’ Advancement values', () => {
    expect(advanced.national.risk).toBe(riskScore(advanced.national.dims.hazard.score, advanced.national.dims.vulnerability.score, advanced.national.dims.coping.score));
    expect(advanced.national.members).toBe(195);
    for (const r of advanced.regions) expect(r.risk).toBe(riskScore(r.dims.hazard.score, r.dims.vulnerability.score, r.dims.coping.score));
  });

  it('the delta helper reports the twelve groups and the stamps for a council, aggregates for a region', () => {
    const kondoa = advancementDelta(core, advanced, 'C001')!;
    expect(kondoa.leaves).toHaveLength(12);
    expect(kondoa.leaves.find((l) => l.basket.key === 'drought')!.stamp).toBeTruthy();
    expect(kondoa.leaves.find((l) => l.basket.key === 'coastalHazards')!.stamp).toBeNull();
    expect(kondoa.leaves.find((l) => l.basket.key === 'drrImplementation')!.stamp).toBeTruthy();
    expect(kondoa.changed).toBe(true);
    const region = advancementDelta(core, advanced, core.regions[0].id)!;
    expect(region.leaves.every((l) => l.stamp === null)).toBe(true);
    expect(advancementDelta(core, advanced, 'nowhere')).toBeNull();
  });
});
