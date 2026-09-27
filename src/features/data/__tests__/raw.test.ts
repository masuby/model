import { standardise, usedSpecs, SPECS } from '@/engine/risk/standardise';
import { componentScores, decodeRaw, encodeRaw, isComputable, naturalRange, parseRawNumber, rawGroups, specKey, standardiseRaw, unitKey } from '../lib/raw';

describe('rawGroups (raw → leaf mapping)', () => {
  const groups = rawGroups();
  it('covers all 53 used workbook indicators, grouped in three dimensions', () => {
    expect(groups.map((g) => g.key)).toEqual(['hazard', 'vulnerability', 'coping']);
    const specs = groups.flatMap((g) => g.components.flatMap((c) => c.specs));
    expect(specs).toHaveLength(usedSpecs().length);
  });
  it('maps every workbook component onto a model leaf in its own dimension', () => {
    for (const g of groups)
      for (const c of g.components) {
        expect(c.ref, c.name).not.toBeNull();
        expect(c.ref!.startsWith(`${g.key}:`)).toBe(true);
      }
    const hazard = groups[0].components.map((c) => c.ref);
    expect(hazard).toContain('hazard:stormsCyclone');
    expect(hazard).toContain('hazard:environmentalDegradation');
  });
});

describe('spec helpers', () => {
  it('detects specs that cannot standardise yet', () => {
    expect(isComputable(SPECS['CC.INF.HC-FAC'])).toBe(false); // needs a denominator, no range
    expect(isComputable(SPECS['CC.INF.COM-INT'])).toBe(false); // min = max
    expect(isComputable(SPECS['VU.SE.POV-HDI'])).toBe(true);
  });
  it('shows reference ranges in natural units (inverting log transforms)', () => {
    expect(naturalRange(SPECS['VU.SE.POV-HDI'])).toEqual([0.45, 0.68]);
    const [lo, hi] = naturalRange(SPECS['HA.HUM.VIO-EVE'])!;
    expect(lo).toBeCloseTo(1, 3);
    expect(hi).toBeCloseTo(57, 0);
    expect(naturalRange(SPECS['CC.INF.COM-INT'])).toBeNull();
  });
  it('standardises exactly like the engine', () => {
    const spec = SPECS['VU.VG.CH-UW'];
    expect(standardiseRaw(spec, 18)).toBe(standardise(18, spec));
    expect(standardiseRaw(SPECS['CC.INF.COM-INT'], 50)).toBeNull();
  });
  it('builds i18n-safe keys', () => {
    expect(specKey('HA.NAT.FL-EXP')).toBe('HA_NAT_FL-EXP');
    expect(unitKey('per 1,000 live births ')).toBe('per_1_000_live_births');
    expect(unitKey('%')).toBe('pct');
    expect(unitKey('US$ per capita')).toBe('us_usd_per_capita');
  });
});

describe('parseRawNumber', () => {
  it.each([
    ['18', 18],
    ['0.52', 0.52],
    ['0,52', 0.52],
    ['989 030', 989030],
    ['989,030', 989030],
    ['1,234,567', 1234567],
    ['1.234.567', 1234567],
    ['1.234,5', 1234.5],
    ['1,234.5', 1234.5],
    ['-0.3', -0.3],
    ['2e3', 2000],
  ])('%s → %d', (input, expected) => {
    expect(parseRawNumber(input)).toBe(expected);
  });
  it.each(['', 'abc', '1..2', '12a'])('rejects %j', (input) => {
    expect(parseRawNumber(input)).toBeNaN();
  });
});

describe('componentScores', () => {
  it('computes one component from a single measured value', () => {
    const [c] = componentScores({ 'VU.VG.CH-UW': 18 });
    expect(c.ref).toBe('vulnerability:childrenHealthNutrition');
    expect(c.score).toBe(standardise(18, SPECS['VU.VG.CH-UW']));
    expect(c.inputs).toEqual([{ specId: 'VU.VG.CH-UW', raw: 18, score: c.score, unit: '%' }]);
  });
  it('averages the filled indicators of a component and ignores non-computable ones', () => {
    const out = componentScores({ 'VU.SE.POV-HDI': 0.45, 'VU.SE.POV-MPI': 0.39, 'CC.INF.COM-INT': 40 });
    expect(out).toHaveLength(1);
    expect(out[0].ref).toBe('vulnerability:developmentPoverty');
    expect(out[0].score).toBe(10);
    expect(out[0].inputs.map((i) => i.specId)).toEqual(['VU.SE.POV-HDI', 'VU.SE.POV-MPI']);
  });
  it('returns nothing for no input', () => {
    expect(componentScores({})).toEqual([]);
  });
});

describe('encodeRaw / decodeRaw', () => {
  it('round-trips one and several measured inputs', () => {
    const one = encodeRaw([{ specId: 'VU.VG.CH-UW', raw: 18, unit: '%' }]);
    expect(one).toEqual({ specId: 'VU.VG.CH-UW', value: 18, unit: '%' });
    expect(decodeRaw(one)).toEqual([{ specId: 'VU.VG.CH-UW', value: '18', unit: '%' }]);

    const many = encodeRaw([
      { specId: 'VU.SE.POV-HDI', raw: 0.45, unit: 'index' },
      { specId: 'VU.SE.POV-MPI', raw: 0.39, unit: null },
    ]);
    expect(decodeRaw(many)).toEqual([
      { specId: 'VU.SE.POV-HDI', value: '0.45', unit: 'index' },
      { specId: 'VU.SE.POV-MPI', value: '0.39', unit: null },
    ]);
    expect(encodeRaw([])).toBeNull();
    expect(decodeRaw(null)).toEqual([]);
  });
});
