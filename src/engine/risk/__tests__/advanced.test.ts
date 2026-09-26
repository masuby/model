/**
 * ADVANCED — the exploded multi-source model runs on the SAME engine. With no advanced data it is
 * byte-identical to genuine INFORM; with a basket present it refines the component by a weighted average
 * over the members present (blank-skip, no bias).
 */
import { describe, expect, it } from 'vitest';
import { ADVANCED_MERGED, ADVANCED_SPECS, SPECS, computeAdvanced, computeFromRaw } from '../standardise';
import pipeJson from './fixtures/pipeline.fixture.json';
import type { PipelineRow } from './pipeline.golden.test';

const pipe = pipeJson as unknown as PipelineRow[];
const unit = pipe.find((r) => r.district === 'Kondoa') ?? pipe[0];

describe('advanced exploded engine', () => {
  it('holds 25 exploded sub-indicators across 8 components', () => {
    const all = Object.values(ADVANCED_SPECS);
    expect(all.length).toBe(25);
    expect(new Set(all.map((s) => s.component)).size).toBe(8);
    expect(all.every((s) => s.use === 'Yes')).toBe(true);
  });

  it('degrades EXACTLY to genuine INFORM when no advanced data is present', () => {
    const normal = computeFromRaw(unit.raw);
    const advanced = computeAdvanced(unit.raw);
    expect(advanced.risk).toBe(normal.risk);
    expect(advanced.dimension).toEqual(normal.dimension);
  });

  it('refines the Drought component when its basket is filled', () => {
    const base = computeAdvanced(unit.raw);
    const withBasket = computeAdvanced({ ...unit.raw, 'HA.NAT.DR-SPEI': 1.5, 'HA.NAT.DR-ARID': 0.5, 'HA.NAT.DR-CV': 0.25 });
    expect(withBasket.component['Drought']).not.toBe(base.component['Drought']);
    expect(withBasket.risk).not.toBe(base.risk);
  });

  it('blank-skip: a partial basket aggregates only the members present', () => {
    const only = computeAdvanced({ 'HA.NAT.DR-FRE': 11, 'HA.NAT.DR-SPEI': 1.5, 'HA.NAT.DR-ARID': 0.5 });
    expect(only.component['Drought']).toBeGreaterThan(0);
    expect(only.component['Drought']).toBeLessThanOrEqual(10);
  });

  it('the merged spec keeps every normal indicator plus the 25 exploded ones (no id collisions)', () => {
    expect(Object.keys(ADVANCED_MERGED).length).toBe(Object.keys(SPECS).length + 25);
  });
});
