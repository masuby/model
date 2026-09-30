/**
 * Supabase repository - shared, multi-user persistence with row-level security.
 * Schema: supabase/migrations/0001_init.sql. Approvals run server-side in the `review_submission`
 * security-definer function, which checks the reviewer's role and writes the approved values
 * atomically with an audit entry.
 */
import type { SupabaseClient as BaseClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';
import type { EditRef, Overrides } from '@/engine/risk/types';
import type { AuditEntry, Change, NewSubmission, Profile, Repository, Submission, SubmissionStatus } from './types';
import { NO_VALUE } from '@/lib/utils';

export type SupabaseClient = BaseClient<Database>;

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabaseConfigured = Boolean(url && key);

/**
 * Create the client. The SDK (~60 KB gzipped) is imported dynamically, so visitors of a deployment
 * without Supabase (demo mode) never download it.
 */
export async function createSupabaseClient(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient<Database>(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'inform.auth' } });
}

type Tables = Database['public']['Tables'];
type SubmissionRow = Tables['submissions']['Row'];
type AuditRow = Tables['audit_log']['Row'];

const REF_RE = /^(hazard|vulnerability|coping):[A-Za-z]+$/;
const STATUSES: readonly SubmissionStatus[] = ['pending', 'approved', 'rejected'];
const ACTIONS: ReadonlyArray<AuditEntry['action']> = ['submitted', 'approved', 'rejected', 'reverted', 'imported', 'reset'];

/** Validate the JSON `changes` column instead of trusting its shape (it is written by clients). */
export function parseChanges(json: Json): Change[] {
  if (!Array.isArray(json)) return [];
  const out: Change[] = [];
  for (const item of json) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const ref = item.ref;
    const value = item.value;
    if (typeof ref !== 'string' || !REF_RE.test(ref)) continue;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) continue;
    const previous = typeof item.previous === 'number' ? item.previous : item.previous === null ? null : undefined;
    const raw = item.raw && typeof item.raw === 'object' && !Array.isArray(item.raw) ? item.raw : null;
    out.push({
      ref: ref as EditRef,
      value: value as number | null,
      ...(previous !== undefined ? { previous } : {}),
      ...(raw && typeof raw.specId === 'string' && (typeof raw.value === 'number' || typeof raw.value === 'string')
        ? { raw: { specId: raw.specId, value: raw.value, unit: typeof raw.unit === 'string' ? raw.unit : null } }
        : {}),
    });
  }
  return out;
}

const toSubmission = (r: SubmissionRow): Submission => ({
  id: r.id,
  unitId: r.unit_id,
  unitName: r.unit_name,
  region: r.region,
  changes: parseChanges(r.changes),
  authority: r.authority,
  dataset: r.dataset,
  note: r.note,
  authorId: r.author_id,
  authorName: r.author_name,
  status: STATUSES.includes(r.status as SubmissionStatus) ? (r.status as SubmissionStatus) : 'pending',
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
      const rows = must(await sb.from('indicator_values').select('unit_id, ref, value, authority, dataset, note, author_name, updated_at'));
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
      const rows = [...must(pending), ...must(decided)];
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
            changes: input.changes as unknown as Json,
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
      must(await sb.rpc('review_submission', { p_id: id, p_decision: decision, p_note: note }));
    },
    async revert(unitId, ref) {
      must(await sb.rpc('revert_value', { p_unit_id: unitId, p_ref: ref }));
    },
    async listAudit(limit = 100) {
      const rows: AuditRow[] = must(await sb.from('audit_log').select('*').order('at', { ascending: false }).limit(limit));
      return rows.map((r) => ({
        id: String(r.id),
        at: r.at,
        actor: r.actor_name ?? NO_VALUE,
        action: ACTIONS.includes(r.action as AuditEntry['action']) ? (r.action as AuditEntry['action']) : 'submitted',
        unitId: r.unit_id ?? undefined,
        unitName: r.unit_name ?? undefined,
        detail: r.detail ?? undefined,
      }));
    },
  };
}
