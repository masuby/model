import { isOwnSubmission } from '../hooks';

const me = { id: 'u1', fullName: 'Asha Mushi' };

describe('isOwnSubmission (security: sector users only ever see their own work)', () => {
  it('matches on author id in the shared database', () => {
    expect(isOwnSubmission({ authorId: 'u1', authorName: 'Renamed' }, me, 'supabase')).toBe(true);
    expect(isOwnSubmission({ authorId: 'u2', authorName: 'Asha Mushi' }, me, 'supabase')).toBe(false);
    expect(isOwnSubmission({ authorId: null, authorName: 'Asha Mushi' }, me, 'supabase')).toBe(false);
  });
  it('also requires the (role-specific) demo name in local mode, where demo roles share one id', () => {
    const officer = { id: 'local-demo', fullName: 'Demo sector officer' };
    const pmo = { id: 'local-demo', fullName: 'Demo PMO reviewer' };
    const s = { authorId: 'local-demo', authorName: 'Demo sector officer' };
    expect(isOwnSubmission(s, officer, 'local')).toBe(true);
    expect(isOwnSubmission(s, pmo, 'local')).toBe(false);
  });
});
