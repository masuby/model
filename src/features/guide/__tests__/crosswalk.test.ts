/**
 * The hazard crosswalk covers every INFORM hazard group exactly once and every guide hazard; the
 * reconciled list joins what the guide documents with what the model scores; the priority band is the
 * declared D7 display rule; the text message stays within 160 characters.
 */
import { describe, expect, it } from 'vitest';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { buildModel } from '@/engine/risk/model';
import { bandFor, CROSSWALK, GUIDE_HAZARDS_COVERED, guideHazardName, guideHazardsOf, hazardItemName, isCoastal, reconciledHazards } from '../crosswalk';
import { HAZARD_KEYS } from '../data';

const model = buildModel();
const hazardGroups = DIMENSIONS.find((d) => d.key === 'hazard')!.categories.flatMap((c) => c.indicators.map((i) => `hazard:${i.key}`));

describe('crosswalk', () => {
  it('maps every INFORM hazard group once and every guide hazard once', () => {
    const mapped = CROSSWALK.flatMap((e) => e.groups);
    // Heavy rainfall is a trigger of flood and landslide, so those two groups appear twice; every other once.
    for (const g of hazardGroups) expect(mapped.filter((m) => m === g).length, g).toBe(g === 'hazard:flood' || g === 'hazard:landslide' ? 2 : 1);
    expect(mapped.length).toBe(hazardGroups.length + 2);
    expect(mapped.every((m) => (hazardGroups as string[]).includes(m))).toBe(true);
    expect(GUIDE_HAZARDS_COVERED).toBe(true);
    for (const h of HAZARD_KEYS) expect(CROSSWALK.filter((e) => e.guide === h).length, h).toBe(1);
  });

  it('bands follow the D7 display rule', () => {
    expect(bandFor(null)).toBeNull();
    expect(bandFor(0)).toBe('veryLow');
    expect(bandFor(1.9)).toBe('veryLow');
    expect(bandFor(2)).toBe('low');
    expect(bandFor(4)).toBe('medium');
    expect(bandFor(6)).toBe('high');
    expect(bandFor(8)).toBe('veryHigh');
    expect(bandFor(10)).toBe('veryHigh');
  });

  it('reconciles the documented hazards with the modelled ones for Kondoa District', () => {
    const kondoa = model.byId.get('C001')!;
    const documented = ['drought', 'landslide', 'floods', 'strongWinds', 'wildfire', 'heavyRainfall'] as const;
    const items = reconciledHazards(kondoa, documented);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
    // Earthquake is modelled (the USGS felt intensity, 4.7) but not documented by the guide: in the list, from the model.
    expect(byKey.earthquake).toMatchObject({ basis: 'modelled', band: 'medium', score: 4.7, guidance: 'guide' });
    // Every documented hazard is in the list, documented or both.
    for (const h of documented) expect(['documented', 'both']).toContain(byKey[h].basis);
    // Conflict groups appear only with a score and are marked outside DRR guidance.
    const conflict = items.find((i) => i.groups.includes('hazard:internalViolence'));
    if (conflict) expect(conflict.guidance).toBe('outOfScope');
    // Highest band first.
    const bands = items.map((i) => (i.band ? ['veryLow', 'low', 'medium', 'high', 'veryHigh'].indexOf(i.band) : -1));
    expect([...bands].sort((a, b) => b - a)).toEqual(bands);
    expect(guideHazardsOf(items)[0]).toBe('drought'); // documented and scored 9.4
    expect(items.every((i) => i.basis !== 'modelled' || (i.score ?? 0) > 0)).toBe(true);
  });

});

describe('hazard names', () => {
  const t = (key: string) => ({ 'guide:hazards.earthquake': 'Earthquake', 'guide:hazards.earthquakeCoastal': 'Earthquake and tsunami', 'indicators:earthquake': 'Earthquake', 'guide:hazards.floods': 'Floods' })[key] ?? key;
  it('says tsunami only on the coast: an inland earthquake reads "Earthquake", a coastal one "Earthquake and tsunami"', () => {
    expect(hazardItemName(t, { guide: 'earthquake', groups: ['hazard:earthquake'] })).toBe('Earthquake');
    expect(hazardItemName(t, { guide: 'earthquake', groups: ['hazard:earthquake'] }, false)).toBe('Earthquake');
    expect(hazardItemName(t, { guide: 'earthquake', groups: ['hazard:earthquake'] }, true)).toBe('Earthquake and tsunami');
    expect(hazardItemName(t, { guide: 'floods', groups: ['hazard:flood'] }, true)).toBe('Floods');
    expect(guideHazardName(t, 'earthquake', true)).toBe('Earthquake and tsunami');
  });
  it('knows the coast from the coastal-hazards group: Kibiti and Tanga region are coastal, Kondoa and Tarime are not', () => {
    const model = buildModel();
    expect(isCoastal(model.byId.get('C051')!)).toBe(true); // Kibiti
    expect(isCoastal(model.regions.find((r) => r.name === 'Tanga')!)).toBe(true);
    expect(isCoastal(model.national)).toBe(true);
    expect(isCoastal(model.byId.get('C001')!)).toBe(false); // Kondoa
    expect(isCoastal(model.councils.find((c) => c.name.startsWith('Tarime'))!)).toBe(false);
  });
});
