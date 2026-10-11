/**
 * Dated versions (DE-06): the days with approvals, newest first, and the approved values as they stood
 * at the end of any day.
 */
import { describe, expect, it } from 'vitest';
import type { RawValue } from '@/engine/risk/rawValues';
import type { Overrides } from '@/engine/risk/types';
import { appliedBy, overridesAsOf, rawAsOf, versionsOf } from '../versions';

const overrides: Overrides = {
  C001: {
    'hazard:flood': { value: 7, at: '2026-10-01T10:00:00Z', author: 'Asha Mushi · approved by PMO' },
    'coping:wash': { value: 4, at: '2026-10-05T08:30:00Z', author: 'PMO reviewer' },
  },
  TZ0102: { 'vulnerability:habitat': { value: 5.5, at: '2026-10-05T09:00:00Z', author: 'PMO reviewer' } },
};
const raw: RawValue[] = [
  { specId: 'VU.VG.CH-UW', unitId: 'C001', level: 'council', value: 21.5, at: '2026-10-03T12:00:00Z', author: 'NBS officer' },
  { specId: 'VU.VG.CH-UW', unitId: 'C002', level: 'council', value: 19, at: '2026-10-05T12:00:00Z', author: 'NBS officer' },
];

describe('versions', () => {
  it('lists the days with approvals, newest first, with counts and authors', () => {
    expect(versionsOf(overrides, raw)).toEqual([
      { date: '2026-10-05', count: 3, authors: ['NBS officer', 'PMO reviewer'] },
      { date: '2026-10-03', count: 1, authors: ['NBS officer'] },
      { date: '2026-10-01', count: 1, authors: ['Asha Mushi'] },
    ]);
    expect(versionsOf({}, [])).toEqual([]);
  });

  it('keeps only what was applied by the end of the day asked for', () => {
    expect(appliedBy('2026-10-05T23:59:00Z', '2026-10-05')).toBe(true);
    expect(appliedBy('2026-10-06T00:00:01Z', '2026-10-05')).toBe(false);
    expect(overridesAsOf(overrides, '2026-10-03')).toEqual({ C001: { 'hazard:flood': overrides.C001['hazard:flood'] } });
    expect(overridesAsOf(overrides, '2026-09-30')).toEqual({});
    expect(rawAsOf(raw, '2026-10-04').map((r) => r.unitId)).toEqual(['C001']);
    expect(rawAsOf(raw, '2026-10-05')).toHaveLength(2);
  });
});
