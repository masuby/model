import { buildModel } from '@/engine/risk/model';
import { buildCouncilIndex, buildRegionIndex, councilKey, levenshtein, normaliseName, parseCouncilName, regionKey } from '../lib/names';
import { buildPastePlan, parsePasteText, splitLine } from '../lib/paste';
import { currentValue } from '../lib/targets';

const model = buildModel();

describe('name normalisation', () => {
  it('is case-, accent- and punctuation-insensitive', () => {
    expect(normaliseName('Dar-es-Salaam')).toBe('daressalaam');
    expect(normaliseName('  KÖNDOA  ')).toBe('kondoa');
  });
  it('understands council types in English and Kiswahili', () => {
    expect(councilKey('Kondoa DC')).toBe('kondoadistrict');
    expect(councilKey('Kondoa District Council')).toBe('kondoadistrict');
    expect(councilKey('Halmashauri ya Wilaya ya Kondoa')).toBe('kondoadistrict');
    expect(councilKey('Halmashauri ya Mji wa Kondoa')).toBe('kondoatown');
    expect(councilKey('Moshi MC')).toBe('moshimunicipal');
    expect(councilKey('Manispaa ya Moshi')).toBe('moshimunicipal');
    expect(councilKey('Jiji la Dodoma')).toBe('dodomacity');
    expect(parseCouncilName('Halmashuari Ya Wilaya Ya Mbogwe District')).toEqual({ base: 'mbogwe', type: 'district' });
  });
  it('normalises region names', () => {
    expect(regionKey('Mkoa wa Dar es Salaam')).toBe('daressalaam');
    expect(regionKey('Dodoma Region')).toBe('dodoma');
  });
  it('computes edit distance', () => {
    expect(levenshtein('kondoa', 'kondoa')).toBe(0);
    expect(levenshtein('kondao', 'kondoa')).toBe(2);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('council / region index', () => {
  const councils = buildCouncilIndex(model.councils);
  const regions = buildRegionIndex(model.regions);

  it('matches by id, canonical name and unique base name', () => {
    expect(councils.match('C001')).toMatchObject({ kind: 'match', how: 'id' });
    expect(councils.match('kondoa dc')).toMatchObject({ kind: 'match', how: 'exact' });
    expect(councils.match('Mpwapwa')).toMatchObject({ kind: 'match', how: 'base' });
  });
  it('reports ambiguity and suggests near misses', () => {
    const amb = councils.match('Kondoa');
    expect(amb.kind).toBe('ambiguous');
    if (amb.kind === 'ambiguous') expect(amb.candidates.map((c) => c.name).sort()).toEqual(['Kondoa District', 'Kondoa Town']);
    const miss = councils.match('Mpwapa District');
    expect(miss.kind).toBe('none');
    if (miss.kind === 'none') expect(miss.suggestion?.name).toBe('Mpwapwa District');
  });
  it('matches regions', () => {
    expect(regions.match('dar-es-salaam')).toMatchObject({ kind: 'match' });
    expect(regions.match('Mkoa wa Dodoma')).toMatchObject({ kind: 'match' });
    expect(regions.match('Atlantis').kind).toBe('none');
  });
});

describe('splitLine', () => {
  it('splits on tab, semicolon, pipe, comma and whitespace', () => {
    expect(splitLine('Kondoa District\t6.5')).toEqual({ names: ['Kondoa District'], token: '6.5' });
    expect(splitLine('Kondoa District; 6,5')).toEqual({ names: ['Kondoa District'], token: '6,5' });
    expect(splitLine('Kondoa District | 6.5')).toEqual({ names: ['Kondoa District'], token: '6.5' });
    expect(splitLine('Kondoa District, 6.5')).toEqual({ names: ['Kondoa District'], token: '6.5' });
    expect(splitLine('Kondoa District 6.5')).toEqual({ names: ['Kondoa District'], token: '6.5' });
  });
  it('keeps a decimal comma after a separator comma', () => {
    expect(splitLine('Kondoa District, 6,5')).toEqual({ names: ['Kondoa District'], token: '6,5' });
  });
  it('handles values-only lines and extra columns', () => {
    expect(splitLine('6,5')).toEqual({ names: [], token: '6,5' });
    expect(splitLine('Dodoma\tKondoa District\t6.5')).toEqual({ names: ['Dodoma', 'Kondoa District'], token: '6.5' });
    expect(splitLine('Kondoa District\t')).toEqual({ names: ['Kondoa District'], token: '' });
    expect(splitLine('Kondoa District\t6.5\t\t')).toEqual({ names: ['Kondoa District'], token: '6.5' });
    expect(splitLine('Kondoa District;')).toEqual({ names: ['Kondoa District'], token: '' });
  });
});

describe('parsePasteText', () => {
  it('skips blank lines, comments and a header row; parses no-data tokens', () => {
    const { rows, headerLine } = parsePasteText('Council\tScore\n\n# note\nKondoa District\t6,46\nKondoa Town\tn/a\nMpwapwa District\t11\nBahi District\tabc');
    expect(headerLine).toBe(1);
    expect(rows.map((r) => [r.lineNo, r.value, r.error ?? null, r.rounded])).toEqual([
      [4, 6.5, null, true],
      [5, null, null, false],
      [6, null, 'range', false],
      [7, null, 'notNumber', false],
    ]);
  });
});

describe('buildPastePlan', () => {
  it('resolves council names for a hazard indicator (council-own)', () => {
    const plan = buildPastePlan('Kondoa DC\t9.9\nKondoa Town\t9.8\nNowhere\t5', 'council', 'hazard:flood', model);
    expect(plan.targets.map((t) => [t.unitId, t.level, t.value])).toEqual([
      ['C001', 'council', 9.9],
      ['C002', 'council', 9.8],
    ]);
    expect(plan.issues.map((i) => i.kind)).toEqual(['unmatched']);
    expect(plan.ready).toHaveLength(2);
  });

  it('deduplicates V/C onto the shared source unit and flags disagreeing values', () => {
    const same = buildPastePlan('Kondoa District, 9.9\nKondoa Town, 9.9', 'council', 'coping:wash', model);
    expect(same.targets).toHaveLength(1);
    expect(same.targets[0]).toMatchObject({ unitId: 'TZ0101', level: 'source', status: 'ready', via: ['Kondoa District', 'Kondoa Town'] });

    const conflict = buildPastePlan('Kondoa District, 9.9\nKondoa Town, 1.0', 'council', 'coping:wash', model);
    expect(conflict.targets[0].status).toBe('conflict');
    expect(conflict.ready).toHaveLength(0);
  });

  it('matches values-only lines in council order', () => {
    const plan = buildPastePlan('9.1\n9.2', 'council', 'hazard:drought', model);
    expect(plan.positional).toBe(true);
    expect(plan.targets.map((t) => t.unitId)).toEqual([model.councils[0].id, model.councils[1].id]);
  });

  it('applies a region value to every member council (hazard) or its distinct source units (V/C)', () => {
    const region = model.regions.find((r) => r.name === 'Dodoma')!;
    const members = model.councils.filter((c) => c.region === 'Dodoma');
    const hazard = buildPastePlan('Dodoma\t9.9', 'region', 'hazard:drought', model);
    expect(hazard.targets).toHaveLength(members.length);
    const vc = buildPastePlan(`${region.name}\t9.9`, 'region', 'vulnerability:habitat', model);
    expect(vc.targets).toHaveLength(new Set(members.map((m) => m.sourceId)).size);
    expect(vc.targets.every((t) => t.level === 'source')).toBe(true);
  });

  it('applies a nation value everywhere and warns about extra lines', () => {
    const plan = buildPastePlan('9.9\n1', 'nation', 'hazard:drought', model);
    expect(plan.targets).toHaveLength(model.councils.length);
    expect(plan.issues.map((i) => i.kind)).toEqual(['extraValue']);
  });

  it('marks unchanged values and refuses no-data for exposure', () => {
    const cur = currentValue(model.byId.get('C001')!, 'hazard:drought');
    const plan = buildPastePlan(`C001\t${cur}`, 'council', 'hazard:drought', model);
    expect(plan.targets[0].status).toBe('unchanged');
    const exp = buildPastePlan('C001\tn/a', 'council', 'hazard:exposure', model);
    expect(exp.issues[0].kind).toBe('noDataNotAllowed');
  });

  it('flags duplicates, ambiguity and missing names', () => {
    const plan = buildPastePlan('Kondoa District\t5\nKondoa DC\t6\nKondoa\t7\n8', 'council', 'hazard:drought', model);
    expect(plan.issues.map((i) => i.kind)).toEqual(['duplicate', 'ambiguous', 'missingName']);
    expect(plan.targets).toHaveLength(1);
    expect(plan.targets[0].value).toBe(6);
  });
});
