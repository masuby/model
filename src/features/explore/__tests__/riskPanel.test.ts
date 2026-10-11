/**
 * The risk communication panel's content (lib/riskPanel.ts): the groups of each dimension with their
 * resolution marks, the evidence behind a group, the spread over a region's councils, the ranks and
 * the guide's hazards for a group, on councils whose figures were checked by hand.
 */
import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/risk/model';
import { dimensionGroups, evidenceFor, groupRanks, guideKeysFor, memberSpread } from '../lib/riskPanel';

const model = buildModel();

describe('dimension groups', () => {
  it('Kibiti: the groups of each dimension highest first, hazard groups at 0 left out, with their resolution marks', () => {
    const unit = model.byId.get('C051')!;
    const hazard = dimensionGroups(unit, 'hazard');
    expect(hazard.slice(0, 3).map((g) => [g.key, g.score])).toEqual([
      ['stormsCyclone', 10],
      ['flood', 9],
      ['coastalHazards', 7.3],
    ]);
    expect(hazard[0].metricKey).toBe('ind:hazard:stormsCyclone');
    expect(hazard.find((g) => g.key === 'volcano')).toBeUndefined(); // 0: no hazard here
    expect(hazard.find((g) => g.key === 'drought')?.coarse).toBe('region');
    expect(hazard.find((g) => g.key === 'stormsCyclone')?.coarse).toBeNull();
    // Road crashes and hazardous-material sites are council values; conflict risk stays a national value.
    expect(hazard.filter((g) => ['vehicleAccidents', 'hazardousMaterial', 'conflictRisk'].includes(g.key)).map((g) => [g.key, g.coarse])).toEqual([
      ['vehicleAccidents', null],
      ['hazardousMaterial', null],
      ['conflictRisk', 'national'],
    ]);
    const vulnerability = dimensionGroups(unit, 'vulnerability');
    expect(vulnerability[0]).toMatchObject({ key: 'displacedPeople', score: 9.5, coarse: 'region', metricKey: 'ind:vulnerability:displacedPeople' });
    expect(vulnerability.find((g) => g.key === 'livelihoods')?.score).toBe(0); // a measured 0 stays
    const coping = dimensionGroups(unit, 'coping');
    expect(coping.slice(0, 2).map((g) => [g.key, g.coarse])).toEqual([
      ['economicCapacity', 'region'],
      ['wash', 'national'],
    ]);
  });

  it('the country: wildfire, floods and environmental degradation lead the hazards, with no resolution marks', () => {
    const hazard = dimensionGroups(model.national, 'hazard');
    expect(hazard.slice(0, 3).map((g) => g.key)).toEqual(['wildfire', 'flood', 'environmentalDegradation']);
    expect(hazard.every((g) => g.coarse === null)).toBe(true);
  });
});

describe('evidence', () => {
  it('a Benchmark 2026 value carries its source, period, institution and detail', () => {
    const [storms] = evidenceFor(model.byId.get('C051')!, 'hazard', 'stormsCyclone');
    expect(storms).toMatchObject({ specId: 'HA.NAT.ST-TC2', raw: 100, score: 10, unit: '%', period: '1980-2026', institution: 'TMA', origin: 'benchmark', detail: 'storms:Jobo 2021, Hidaya 2024', withheld: null });
    const coastal = evidenceFor(model.byId.get('C051')!, 'hazard', 'coastalHazards');
    expect(coastal.map((e) => e.specId)).toEqual(['HA.NAT.CH-ERO', 'HA.NAT.CH-SEA']);
    expect(coastal[0].detail).toBe('segments:92/458');
  });

  it('a workbook value carries the workbook source and year', () => {
    const [drought] = evidenceFor(model.byId.get('C051')!, 'hazard', 'drought');
    expect(drought).toMatchObject({ specId: 'HA.NAT.DR-FRE', raw: 9, origin: 'workbook', source: 'FAO', period: '1984-2023', institution: 'INFORM' });
  });

  it('a withheld workbook value says so, with its note', () => {
    const [drought] = evidenceFor(model.byId.get('C052')!, 'hazard', 'drought');
    expect(drought).toMatchObject({ raw: null, withheld: 'DN-01', origin: 'workbook' });
  });

  it('regions and the nation show the spread over their members instead', () => {
    const pw = model.byId.get('R-pwani')!;
    expect(evidenceFor(pw, 'hazard', 'stormsCyclone')).toEqual([]);
    const spread = memberSpread(model, pw, 'hazard', 'stormsCyclone');
    expect(spread.total).toBe(9);
    expect(spread.top.map((t) => [t.unit.name, t.value])).toEqual([
      ['Kibiti District', 10],
      ['Kisarawe District', 10],
      ['Mafia District', 10],
    ]);
    expect(memberSpread(model, model.national, 'hazard', 'stormsCyclone').total).toBe(31);
  });
});

describe('ranks and the guide', () => {
  it('ranks a council among all councils and within its region, ties sharing a rank', () => {
    expect(groupRanks(model, model.byId.get('C051')!, 'hazard', 'stormsCyclone')).toEqual({ level: { rank: 1, of: 195 }, region: { rank: 1, of: 9, name: 'Pwani' } });
    expect(groupRanks(model, model.national, 'hazard', 'flood')).toEqual({ level: null, region: null });
  });

  it('maps a group onto the guide hazards that describe it', () => {
    expect(guideKeysFor('hazard:flood')).toEqual(['heavyRainfall', 'floods']);
    expect(guideKeysFor('hazard:stormsCyclone')).toEqual(['strongWinds']);
    expect(guideKeysFor('hazard:heatwave')).toEqual([]);
  });
});
