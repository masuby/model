/**
 * Area statements (statements.ts): generated from the model only, in reading order, with the numbers they
 * rest on; never a warning level.
 */
import { describe, expect, it } from 'vitest';
import pwani from '@/data/action-guide/regions/pwani.json';
import { buildModel, indicatorValue } from '@/engine/risk/model';
import { joinList } from '../AreaStatements';
import type { HazardKey } from '../data';
import { areaStatements, STATEMENT_HAZARD_MIN, STATEMENT_HUMAN_MIN } from '../statements';

const model = buildModel();
const guideOf = (code: string) => ((pwani as unknown as { councils: Record<string, { hazards: HazardKey[] }> }).councils[code]?.hazards ?? []) as HazardKey[];

describe('area statements', () => {
  it('Kibiti: its rank, what weighs most, its hazards, vulnerability, coping gaps and people, in that order', () => {
    const kibiti = model.byId.get('C051')!;
    const s = areaStatements(model, kibiti, guideOf('C051'));
    expect(s.map((x) => x.kind)).toEqual(['overall', 'driver', 'hazards', 'vulnerability', 'coping', 'people']);
    const overall = s[0] as Extract<(typeof s)[number], { kind: 'overall' }>;
    expect(overall).toMatchObject({ cls: 'high', score: kibiti.risk, of: 195, regionOf: 9 });
    expect(overall.rank).toBe(1 + model.councils.filter((c) => (c.risk ?? -1) > (kibiti.risk ?? 0)).length);
    const hazards = s[2] as Extract<(typeof s)[number], { kind: 'hazards' }>;
    expect(hazards.items.map((h) => h.guide ?? h.key)).toEqual(['strongWinds', 'heavyRainfall', 'floods']);
    expect(hazards.items.every((h) => (h.score ?? 0) >= STATEMENT_HAZARD_MIN)).toBe(true);
    const driver = s[1] as Extract<(typeof s)[number], { kind: 'driver' }>;
    expect(driver.dim).toBe('coping');
    expect(driver.national).toBe(model.national.dims.coping.score);
  });

  it('names road crashes and hazardous-material sites where they score high: Temeke', () => {
    const temeke = model.byId.get('C054')!;
    const human = areaStatements(model, temeke).find((x) => x.kind === 'human') as { kind: 'human'; items: Array<{ key: string; score: number }> };
    expect(human.items.map((i) => i.key).sort()).toEqual(['hazardousMaterial', 'vehicleAccidents']);
    for (const i of human.items) expect(i.score).toBe(indicatorValue(temeke, 'hazard', i.key));
    expect(human.items.every((i) => i.score >= STATEMENT_HUMAN_MIN)).toBe(true);
  });

  it('says so when no natural hazard scores 5 or more, and speaks of Tanzania as a whole', () => {
    const quiet = model.councils.find((c) => areaStatements(model, c).some((x) => x.kind === 'hazardsLow'));
    expect(quiet).toBeTruthy();
    const nation = areaStatements(model, model.national);
    expect(nation[0]).toMatchObject({ kind: 'overall', level: 'national', rank: null });
    expect(nation.find((x) => x.kind === 'driver')).toMatchObject({ national: null });
    expect(nation.find((x) => x.kind === 'people')).toMatchObject({ kind: 'people', density: null });
  });

  it('joins lists in each language', () => {
    expect(joinList(['a', 'b', 'c'], 'and')).toBe('a, b and c');
    expect(joinList(['a', 'b'], 'na')).toBe('a na b');
    expect(joinList(['a'], 'and')).toBe('a');
  });
});
