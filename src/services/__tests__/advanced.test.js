/**
 * ADVANCED engine - the exploded multi-source model run by the SAME standardise/aggregate engine.
 * Proves: (a) it holds the 25 exploded sub-indicators across 8 components; (b) with NO advanced data it
 * is byte-identical to the genuine INFORM (degrades exactly - "accommodates normal"); (c) with a basket
 * present it refines the component by WEIGHTED average over the members present (blank-skip, no bias).
 */
import { describe, it, expect } from 'vitest';
import { computeFromRaw, computeAdvanced, ADVANCED_SPECS, ADVANCED_MERGED, ALL_SPECS } from '../standardise';
import pipe from './pipeline.fixture.json';

const unit = pipe.find((r) => r.district === 'Kondoa') || pipe[0];

describe('advanced exploded engine', () => {
  it('holds 25 exploded sub-indicators across 8 components', () => {
    const all = Object.values(ADVANCED_SPECS);
    expect(all.length).toBe(25);
    expect(new Set(all.map((s) => s.component)).size).toBe(8);
    expect(all.every((s) => s.use === 'Yes')).toBe(true);
  });

  it('degrades EXACTLY to genuine INFORM when no advanced data is present', () => {
    // unit.raw holds only normal indicator ids; the exploded sub-indicators have no value -> drop out,
    // so every exploded component is carried by its legacy INFORM indicator alone.
    const normal = computeFromRaw(unit.raw);
    const advanced = computeAdvanced(unit.raw);
    expect(advanced.risk).toBe(normal.risk);
    expect(advanced.dimension).toEqual(normal.dimension);
  });

  it('refines the Drought component when its basket is filled (weighted blend, risk moves)', () => {
    const base = computeAdvanced(unit.raw);
    const withBasket = computeAdvanced({
      ...unit.raw,
      'HA.NAT.DR-SPEI': 1.5, 'HA.NAT.DR-ARID': 0.5, 'HA.NAT.DR-CV': 0.25,
    });
    // Drought now blends the legacy FAO frequency with the SPEI/aridity/CV basket -> the component changes
    expect(withBasket.component['Drought']).not.toBe(base.component['Drought']);
    expect(withBasket.risk).not.toBe(base.risk);
  });

  it('blank-skip / no-bias: a partial basket aggregates only the members present', () => {
    // a fresh "drought-only" unit with just two basket members and the legacy -> component is their
    // weighted average; the missing sub-indicators (NDVI, soil, season) do NOT drag it to zero.
    const only = computeAdvanced({ 'HA.NAT.DR-FRE': 11, 'HA.NAT.DR-SPEI': 1.5, 'HA.NAT.DR-ARID': 0.5 });
    expect(only.component['Drought']).toBeGreaterThan(0);
    // SPEI 1.5 over [0,3] increase = 5.0; aridity 0.5 over [0.5,2.8] decrease ~= 10; both present, no bias
    expect(only.component['Drought']).toBeLessThanOrEqual(10);
  });

  it('the merged spec keeps every normal indicator plus the exploded baskets (no id collisions)', () => {
    // merged size = normal + advanced (ids are disjoint)
    expect(Object.keys(ADVANCED_MERGED).length).toBe(Object.keys(ALL_SPECS).length + 25);
  });
});
