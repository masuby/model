/** Data Portal hooks: permissions, the current user's submissions, and batched repository work. */
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { refreshData, useData, useSubmissions } from '@/data-layer/DataProvider';
import { APPLIED_DIRECTLY_NOTE, canReview, canSubmit, type NewSubmission, type Profile, type Submission } from '@/data-layer/types';
import { runInBatches } from './lib/batch';

/** The shipped baseline (no approved edits), for "baseline → current". */
export { baseModel } from '@/data-layer/DataProvider';

/** Review note stored when a reviewer applies their own change directly. */
export { APPLIED_DIRECTLY_NOTE };

export function usePermissions() {
  const { profile, mode, authLoading } = useData();
  const role = profile?.role ?? null;
  return { role, profile, mode, authLoading, signedIn: !!profile, canSubmit: canSubmit(role), canReview: canReview(role) };
}

/**
 * Submissions the signed-in person authored. The Supabase repository already restricts sector users to
 * their own rows (RLS); in local mode everything is in one browser, so we filter by author id here too.
 */
export function useMySubmissions() {
  const query = useSubmissions();
  const { profile, mode } = useData();
  const mine = React.useMemo<Submission[]>(() => (profile ? (query.data ?? []).filter((s) => isOwnSubmission(s, profile, mode)) : []), [query.data, profile, mode]);
  return { query, mine };
}

/**
 * Authorship check. In local demo mode every demo role shares one profile id, so the (role-specific)
 * demo name is compared too - otherwise a demo PMO would see the demo officer's work as their own.
 */
export function isOwnSubmission(s: Pick<Submission, 'authorId' | 'authorName'>, profile: Pick<Profile, 'id' | 'fullName'>, mode: 'local' | 'supabase'): boolean {
  if (!s.authorId || s.authorId !== profile.id) return false;
  return mode === 'supabase' || s.authorName === profile.fullName;
}

/** Pending submissions, oldest first (reviewers only - others get an empty list). */
export function usePendingQueue() {
  const query = useSubmissions();
  const { canReview: reviewer } = usePermissions();
  const pending = React.useMemo<Submission[]>(
    () => (reviewer ? (query.data ?? []).filter((s) => s.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []),
    [query.data, reviewer],
  );
  return { query, pending };
}

export interface BatchProgress {
  done: number;
  total: number;
}

/**
 * Many submissions / reviews in one go (bulk paste, import, "approve selected"): calls the repository
 * with bounded concurrency and refreshes the model ONCE at the end instead of after every item.
 * Approval still runs server-side (the `review_submission` RPC re-checks the reviewer's role).
 */
export function useBatchOps() {
  const { repo, profile } = useData();
  const qc = useQueryClient();
  const [progress, setProgress] = React.useState<BatchProgress | null>(null);
  const concurrency = repo.mode === 'local' ? 1 : 4;

  const finish = React.useCallback(async () => {
    setProgress(null);
    await refreshData(qc);
  }, [qc]);

  const submitMany = React.useCallback(
    async (inputs: readonly NewSubmission[], applyNow: boolean) => {
      if (!profile) throw new Error('Not signed in');
      setProgress({ done: 0, total: inputs.length });
      try {
        return await runInBatches(
          inputs,
          async (input) => {
            const s = await repo.submit(input, profile);
            if (applyNow) await repo.review(s.id, 'approved', profile, APPLIED_DIRECTLY_NOTE);
            return s;
          },
          { concurrency, onProgress: (done, total) => setProgress({ done, total }) },
        );
      } finally {
        await finish();
      }
    },
    [repo, profile, concurrency, finish],
  );

  const reviewMany = React.useCallback(
    async (ids: readonly string[], decision: 'approved' | 'rejected', note?: string) => {
      if (!profile) throw new Error('Not signed in');
      setProgress({ done: 0, total: ids.length });
      try {
        return await runInBatches(ids, (id) => repo.review(id, decision, profile, note), {
          concurrency,
          onProgress: (done, total) => setProgress({ done, total }),
        });
      } finally {
        await finish();
      }
    },
    [repo, profile, concurrency, finish],
  );

  return { submitMany, reviewMany, progress };
}
