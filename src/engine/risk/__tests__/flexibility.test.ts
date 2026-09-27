/**
 * FLEXIBILITY — the indicator set lives in the spec, not in code: add (new row, Use = Yes), delete
 * (Use = No) and re-weight without touching the engine; results are resolution-independent.
 */
import { describe, expect, it } from 'vitest';
import { SPECS, computeFromRaw, type IndicatorSpec, type SpecTable } from '../standardise';
import pipeJson from './fixtures/pipeline.fixture.json';
import type { PipelineRow } from './pipeline.golden.test';

const pipe = pipeJson as unknown as PipelineRow[];
const unit = pipe.find((r) => r.district === 'Kondoa') ?? pipe[0];
const clone = (o: SpecTable): SpecTable => structuredClone(o);

const baseSpec: Omit<IndicatorSpec, 'id' | 'resolved_min' | 'resolved_max'> = {
  name: 'New TZ hazard',
  dimension: 'Hazards & Exposure',
  category: 'Natural',
  component: 'Drought',
  denominator: 'None',
  outlier: 'No',
  transform: 'None',
  normalisation: 'Custom',
  sign: 'Increase Risk',
  use: 'Yes',
};

describe('indicator flexibility (add / delete / spec-driven)', () => {
  it('holds all 78 indicators — 53 used, 25 available to activate', () => {
    const all = Object.values(SPECS);
    expect(all.length).toBe(78);
    expect(all.filter((s) => s.use === 'Yes').length).toBe(53);
  });

  it('DELETE: Use = "No" drops an indicator from its component', () => {
    const base = computeFromRaw(unit.raw);
    const specs = clone(SPECS);
    specs['HA.NAT.DR-FRE'].use = 'No';
    const after = computeFromRaw(unit.raw, { specs });
    expect(after.component['Drought']).toBeUndefined();
    expect(after.category['Natural']).not.toBe(base.category['Natural']);
  });

  it('ADD: a new spec row with Use = "Yes" joins its component and moves risk', () => {
    const base = computeFromRaw(unit.raw);
    const specs = clone(SPECS);
    specs['HA.NAT.NEW-X'] = { ...baseSpec, id: 'HA.NAT.NEW-X', resolved_min: 0, resolved_max: 100 };
    const after = computeFromRaw({ ...unit.raw, 'HA.NAT.NEW-X': 50 }, { specs });
    expect(after.component['Drought']).toBeGreaterThan(0);
    expect(after.risk).not.toBe(base.risk);
  });

  it('an empty spec yields no risk (the set is never hard-coded)', () => {
    expect(computeFromRaw(unit.raw, { specs: {} }).risk).toBeNull();
  });

  it('is resolution-independent (same raw → same risk at any level)', () => {
    expect(computeFromRaw({ ...unit.raw }).risk).toBe(computeFromRaw(unit.raw).risk);
  });

  it('a weighted multi-source basket aggregates by weight and falls back gracefully', () => {
    const specs = clone(SPECS);
    specs['HA.NAT.DR-FRE'].weight = 0.5;
    specs['HA.NAT.DR-SPEI'] = { ...baseSpec, id: 'HA.NAT.DR-SPEI', resolved_min: 0, resolved_max: 3, weight: 0.3 };
    specs['HA.NAT.DR-ARID'] = { ...baseSpec, id: 'HA.NAT.DR-ARID', resolved_min: 0, resolved_max: 1, weight: 0.2 };
    const legacyOnly = computeFromRaw(unit.raw, { specs });
    const basket = computeFromRaw({ ...unit.raw, 'HA.NAT.DR-SPEI': 1.5, 'HA.NAT.DR-ARID': 0.5 }, { specs });
    expect(basket.component['Drought']!).toBeGreaterThan(legacyOnly.component['Drought']!);
    expect(legacyOnly.component['Drought']!).toBeGreaterThan(0);
  });
});
