/**
 * The audit trail shows the server's short English details in the reader's language. The formats below
 * are exactly what migration 0004 (and the local demo repository) write.
 */
import { APPLIED_DIRECTLY_NOTE } from '@/data-layer/types';
import { localiseDetail } from '../lib/activity';

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key);

describe('localiseDetail', () => {
  it.each([
    [{ action: 'assigned', detail: '3 indicator(s): NBS' }, 'activity.detail.assigned {"count":3,"institution":"NBS"}'],
    [{ action: 'assigned', detail: '2 indicator(s): unassigned' }, 'activity.detail.unassigned {"count":2}'],
    [{ action: 'requested', detail: '5 update request(s)' }, 'activity.detail.requested.update {"count":5}'],
    [{ action: 'requested', detail: '1 validate request(s)' }, 'activity.detail.requested.validate {"count":1}'],
    [{ action: 'submitted', detail: '12 value(s) · TDHS-MIS 2022' }, 'activity.detail.values {"count":12,"dataset":"TDHS-MIS 2022"}'],
    [{ action: 'submitted', detail: '2 change(s) · TMA' }, 'activity.detail.changes {"count":2,"authority":"TMA"}'],
    [{ action: 'closed', detail: 'cancelled' }, 'activity.detail.closed.cancelled'],
    [{ action: 'approved', detail: APPLIED_DIRECTLY_NOTE }, 'mine.appliedDirectly'],
  ] as const)('%o', (entry, expected) => {
    expect(localiseDetail(entry, t)).toBe(expected);
  });

  it('names an indicator by its label and leaves free text (reviewer notes) alone', () => {
    expect(localiseDetail({ action: 'reverted', detail: 'VU.VG.CH-UW' }, t)).toMatch(/^data:specs\.VU_VG_CH-UW /);
    expect(localiseDetail({ action: 'rejected', detail: 'Wrong survey round' }, t)).toBe('Wrong survey round');
    expect(localiseDetail({ action: 'validated' }, t)).toBeUndefined();
  });
});
