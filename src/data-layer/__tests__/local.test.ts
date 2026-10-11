// @vitest-environment jsdom
/**
 * The local repository tells an institution about the requests sent to it and the decisions on its
 * submissions (DE-07), the same way migration 0011's triggers do in the shared database: only the
 * institution concerned (and reviewers) see them, and reading marks them read.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalRepository, demoProfile } from '../local';

const SPEC = 'VU.VG.CH-UW';

describe('local repository notifications', () => {
  beforeEach(() => localStorage.clear());

  it('writes a request notification for the assigned institution and a decision notification after review', async () => {
    const repo = createLocalRepository();
    const admin = demoProfile('admin');
    const pmo = demoProfile('pmo');
    const officer = demoProfile('sector'); // works for NBS
    expect(officer.institutionKey).toBe('NBS');

    await repo.assign([SPEC], 'NBS', admin);
    expect(await repo.createRequests([SPEC], 'update', '2026-11-30', 'Please send the 2022 figures', pmo)).toBe(1);

    const inbox = await repo.listNotifications(officer);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({ institutionKey: 'NBS', kind: 'request', specId: SPEC, dueDate: '2026-11-30', body: 'Please send the 2022 figures', emailStatus: 'none' });
    expect(inbox[0].title).toMatch(/^Please update: /);
    expect(inbox[0].readAt).toBeFalsy();

    // Another institution sees nothing; a reviewer sees everything.
    const other = { ...officer, id: 'other', institutionKey: 'TMA' };
    expect(await repo.listNotifications(other)).toHaveLength(0);
    expect(await repo.listNotifications(pmo)).toHaveLength(1);

    const submission = await repo.submitRaw({ specId: SPEC, entries: [{ unitId: 'C001', level: 'council', value: 21.5 }], dataset: 'TDHS-MIS 2022', requestId: inbox[0].requestId }, officer);
    await repo.reviewRaw(submission.id, 'approved', pmo, 'Thank you');
    const after = await repo.listNotifications(officer);
    expect(after).toHaveLength(2);
    expect(after[0]).toMatchObject({ kind: 'decision', specId: SPEC, submissionId: submission.id, body: 'Thank you' });
    expect(after[0].title).toMatch(/: approved$/);

    await repo.markNotificationRead(after[0].id, officer);
    expect((await repo.listNotifications(officer))[0].readAt).toBeTruthy();
    await expect(repo.markNotificationRead(after[1].id, other)).rejects.toThrow();
  });
});
