/**
 * The planning message reads the hazard profile: where overall risk is low or very low but a natural
 * hazard scores 8 or more, "few hazard constraints" would be false, so the message names the hazard.
 */
import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/risk/model';
import { planMessage, planningHazard, riskBandFor } from '../alert';

const model = buildModel();

describe('planning message', () => {
  it('names the hazard in the low-risk councils with a very high natural hazard, and only there', () => {
    const named = model.councils.filter((c) => {
      const risk = riskBandFor(c.risk);
      return risk && planMessage(c, risk).key === 'risk.band.1.planHazard';
    });
    // The rule, not a list: exactly the low-band councils with a natural hazard at 8 or more (the list
    // moves with the data; with the Benchmark 2026 and the institutional indicators the earthquake councils
    // of Kilimanjaro and Singida are medium risk, so none remains).
    const expected = model.councils.filter((c) => riskBandFor(c.risk)?.band === 1 && planningHazard(c));
    expect(named.map((c) => c.name).sort()).toEqual(expected.map((c) => c.name).sort());
    for (const c of named) expect(planningHazard(c)!.score).toBeGreaterThanOrEqual(8);
    const moshi = model.councils.find((c) => c.name === 'Moshi Municipal')!;
    expect(planningHazard(moshi)).toEqual({ key: 'earthquake', score: 10 });
    expect(riskBandFor(moshi.risk)!.band).toBe(2);
    expect(planMessage(moshi, riskBandFor(moshi.risk)!).key).toBe('risk.band.2.plan');
  });

  it('keeps the band message elsewhere, including higher bands with very high hazards', () => {
    const kibiti = model.byId.get('C051')!;
    const risk = riskBandFor(kibiti.risk)!;
    expect(risk.band).toBe(2);
    expect(planMessage(kibiti, risk)).toEqual({ key: 'risk.band.2.plan', hazard: null });
  });
});
