/**
 * Supabase repository — shared, multi-user persistence with row-level security.
 * Schema: supabase/migrations/0001_init.sql. Approvals run server-side in the `review_submission`
 * security-definer function, which checks the reviewer's role and writes the approved values
 * atomically with an audit entry.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { EditRef, Overrides } from '@/engine/risk/types';
import type { AuditEntry, Change, NewSubmission, Profile, Repository, Submission, SubmissionStatus } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'inform.auth' } });
  return client;
}

interface ValueRow {
  unit_id: string;
  ref: string;
  value: number | null;
  authority: string | null;
  dataset: string | null;
  note: string | null;
  author_name: string | null;
  updated_at: string;
}
interface SubmissionRow {
  id: string;
  unit_id: string;
  unit_name: string;
  region: string;
  changes: Change[];
  authority: string;
  dataset: string | null;
  note: string | null;
  author_id: string | null;
  author_name: string;
  status: SubmissionStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewer_name: string | null;
  review_note: string | null;
}
interface AuditRow {
  id: number;
  at: string;
  actor_name: string | null;
  action: AuditEntry['action'];
  unit_id: string | null;
  unit_name: string | null;
  detail: string | null;
}

const toSubmission = (r: SubmissionRow): Submission => ({
  id: r.id,
  unitId: r.unit_id,
  unitName: r.unit_name,
  region: r.region,
  changes: r.changes,
  authority: r.authority,
  dataset: r.dataset,
  note: r.note,
  authorId: r.author_id,
  authorName: r.author_name,
  status: r.status,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  reviewerName: r.reviewer_name,
  reviewNote: r.review_note,
});

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function createSupabaseRepository(sb: SupabaseClient): Repository {
  return {
    mode: 'supabase',
    async getOverrides() {
      const rows = must(await sb.from('indicator_values').select('unit_id, ref, value, authority, dataset, note, author_name, updated_at')) as ValueRow[];
      const out: Overrides = {};
      for (const r of rows) {
        (out[r.unit_id] ??= {})[r.ref as EditRef] = {
          value: r.value == null ? null : Number(r.value),
          authority: r.authority ?? undefined,
          dataset: r.dataset ?? undefined,
          note: r.note ?? undefined,
          author: r.author_name ?? undefined,
          at: r.updated_at,
        };
      }
      return out;
    },
    async listSubmissions() {
      // Every pending submission (a reviewer must never lose one off the end of a page), plus the most
      // recent decided ones for history. RLS limits sector users to their own rows.
      const [pending, decided] = await Promise.all([
        sb.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
        sb.from('submissions').select('*').neq('status', 'pending').order('created_at', { ascending: false }).limit(500),
      ]);
      const rows = [...(must(pending) as SubmissionRow[]), ...(must(decided) as SubmissionRow[])];
      return rows.map(toSubmission).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async submit(input: NewSubmission, author: Profile) {
      const row = must(
        await sb
          .from('submissions')
          .insert({
            unit_id: input.unitId,
            unit_name: input.unitName,
            region: input.region,
            changes: input.changes,
            authority: input.authority,
            dataset: input.dataset ?? null,
            note: input.note ?? null,
            author_name: author.fullName,
          })
          .select('*')
          .single(),
      ) as SubmissionRow;
      return toSubmission(row);
    },
    async review(id, decision, _reviewer, note) {
      must(await sb.rpc('review_submission', { p_id: id, p_decision: decision, p_note: note ?? null }));
    },
    async revert(unitId, ref) {
      must(await sb.rpc('revert_value', { p_unit_id: unitId, p_ref: ref, p_unit_name: null }));
    },
    async listAudit(limit = 100) {
      const rows = must(await sb.from('audit_log').select('*').order('at', { ascending: false }).limit(limit)) as AuditRow[];
      return rows.map((r) => ({
        id: String(r.id),
        at: r.at,
        actor: r.actor_name ?? '—',
        action: r.action,
        unitId: r.unit_id ?? undefined,
        unitName: r.unit_name ?? undefined,
        detail: r.detail ?? undefined,
      }));
    },
  };
}
