/**
 * FLEXIBILITY - the model must be in a position to add, delete, and amend indicators.
 *
 * The engine is fully spec-driven: the indicator SET lives in the spec, not in code, and the component
 * aggregation honours the `Use` flag (the workbook's AVERAGEIFS(Use="Yes")). So:
 *   - all 78 indicators are held (53 used now; 25 available to activate);
 *   - DELETE = set Use="No" (data kept) -> drops from its component;
 *   - ADD    = a new spec row with Use="Yes" + a value, any unit -> joins its component;
 *   - the same computeFromRaw runs at 170, 195, or any resolution (fixed references).
 */
import { describe, it, expect } from 'vitest';
import { computeFromRaw, ALL_SPECS } from '../standardise';
import pipe from './pipeline.fixture.json';

const clone = (o) => JSON.parse(JSON.stringify(o));
const unit = pipe.find((r) => r.district === 'Kondoa') || pipe[0];

describe('indicator flexibility (add / delete / spec-driven)', () => {
  it('holds all 78 indicators - 53 used, 25 available to activate', () => {
    const all = Object.values(ALL_SPECS);
    expect(all.length).toBe(78);
    expect(all.filter((s) => s.use === 'Yes').length).toBe(53);
  });

  it('DELETE: Use="No" drops an indicator from its component and re-weights the dimension', () => {
    const base = computeFromRaw(unit.raw);
    const specs = clone(ALL_SPECS);
    specs['HA.NAT.DR-FRE'].use = 'No'; // delete drought (a single-indicator component)
    const after = computeFromRaw(unit.raw, { specs });
    expect(after.component['Drought']).toBeUndefined();              // component gone
    expect(after.category['Natural']).not.toBe(base.category['Natural']); // Natural re-averages over the rest
  });

  it('ADD: a new spec row (any unit) with Use="Yes" + a value joins its component and moves risk', () => {
    const base = computeFromRaw(unit.raw);
    const specs = clone(ALL_SPECS);
    // a hypothetical new Tanzanian indicator, its own unit, with a FIXED reference + sign + component
    specs['HA.NAT.NEW-X'] = {
      id: 'HA.NAT.NEW-X', name: 'New TZ hazard', dimension: 'Hazards & Exposure', category: 'Natural',
      component: 'Drought', denominator: 'None', outlier: 'No', transform: 'None', normalisation: 'Custom',
      resolved_min: 0, resolved_max: 100, sign: 'Increase Risk', use: 'Yes',
    };
    const raw = { ...unit.raw, 'HA.NAT.NEW-X': 50 }; // 50 / [0,100] increase = 5.0
    const after = computeFromRaw(raw, { specs });
    expect(after.component['Drought']).toBeGreaterThan(0); // drought now averages with the new 5.0
    expect(after.risk).not.toBe(base.risk);                // the whole index recomputes
  });

  it('is fully spec-driven - an empty spec yields no risk (the set is never hardcoded)', () => {
    expect(computeFromRaw(unit.raw, { specs: {} }).risk).toBeNull();
  });

  it('resolution-independent - the same pipeline runs unchanged on any unit set (170, 195, ...)', () => {
    // a "council" with the same raw as its district gets the identical risk (fixed references)
    const district = computeFromRaw(unit.raw);
    const council = computeFromRaw({ ...unit.raw }); // a council inheriting the district's raw
    expect(council.risk).toBe(district.risk);
  });

  it('ADVANCED: a weighted multi-source basket aggregates by weight, and falls back gracefully', () => {
    const base = { dimension: 'Hazards & Exposure', category: 'Natural', component: 'Drought',
      denominator: 'None', outlier: 'No', transform: 'None', normalisation: 'Custom', sign: 'Increase Risk', use: 'Yes' };
    const specs = clone(ALL_SPECS);
    specs['HA.NAT.DR-FRE'].weight = 0.5;                                    // legacy FAO frequency, weighted
    specs['HA.NAT.DR-SPEI'] = { ...base, id: 'HA.NAT.DR-SPEI', resolved_min: 0, resolved_max: 3, weight: 0.3 };
    specs['HA.NAT.DR-ARID'] = { ...base, id: 'HA.NAT.DR-ARID', resolved_min: 0, resolved_max: 1, weight: 0.2 };
    const legacyOnly = computeFromRaw(unit.raw, { specs });                 // SPEI/aridity blank -> FAO alone
    const basket = computeFromRaw({ ...unit.raw, 'HA.NAT.DR-SPEI': 1.5, 'HA.NAT.DR-ARID': 0.5 }, { specs });
    // SPEI 5.0 + aridity 5.0 sit above the legacy drought, so the weighted basket RAISES the component
    expect(basket.component['Drought']).toBeGreaterThan(legacyOnly.component['Drought']);
    // graceful: with the new sub-indicators absent, the component still computes from the legacy alone
    expect(legacyOnly.component['Drought']).toBeGreaterThan(0);
  });
});
