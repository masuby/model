import { SPECS } from '@/engine/risk/standardise';
import { decodeRaw, encodeRaw, isComputable, naturalRange, parseRawNumber, specKey, unitKey } from '../lib/raw';

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
