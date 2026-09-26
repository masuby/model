import { describe, expect, it } from 'vitest';
import { parseChanges } from '../supabase';

describe('parseChanges (validates client-written JSON from the submissions table)', () => {
  it('keeps well-formed changes, including null (= no data) and raw values', () => {
    expect(
      parseChanges([
        { ref: 'hazard:flood', value: 7.5, previous: 6.1 },
        { ref: 'vulnerability:habitat', value: null },
        { ref: 'coping:wash', value: 4, raw: { specId: 'CC.INF.WASH-W', value: 61, unit: '%' } },
      ]),
    ).toEqual([
      { ref: 'hazard:flood', value: 7.5, previous: 6.1 },
      { ref: 'vulnerability:habitat', value: null },
      { ref: 'coping:wash', value: 4, raw: { specId: 'CC.INF.WASH-W', value: 61, unit: '%' } },
    ]);
  });

  it('drops malformed entries instead of trusting them', () => {
    expect(
      parseChanges([
        { ref: 'hazard:flood; drop table', value: 1 },
        { ref: 'hazard:flood', value: '9' },
        { ref: 'hazard:flood', value: Number.NaN as unknown as number },
        'nonsense',
        null,
        [1, 2],
      ]),
    ).toEqual([]);
    expect(parseChanges({ ref: 'hazard:flood', value: 1 })).toEqual([]);
    expect(parseChanges(null)).toEqual([]);
  });
});
