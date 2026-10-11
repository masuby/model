/**
 * Supabase repository: shared, multi-user persistence with row-level security.
 * Schema: supabase/migrations/0001–0004. Every write that changes what the public sees runs server-side
 * in a security-definer function (review_submission, submit_raw_values, review_raw_submission …),
 * which re-checks the caller's role and institution and writes an audit entry in the same transaction.
 */
import type { SupabaseClient as BaseClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';
import type { RawLevel, RawValue } from '@/engine/risk/rawValues';
import type { EditRef, Overrides } from '@/engine/risk/types';
import {
  ROLES,
  type Assignment,
  type AuditAction,
  type Change,
  type DataRequest,
  type CommitteeKind,
  type CommitteeLevel,
  type CommitteePayload,
  type CommitteeRecord,
  type Institution,
  type NewSubmission,
  type Profile,
  type RawEntry,
  type RawSubmission,
  type Repository,
  type RequestKind,
  type RequestStatus,
  type Role,
  type Submission,
  type SubmissionStatus,
  type Validation,
  type Notification,
} from './types';
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
type RequestRow = Tables['data_requests']['Row'];
type RawSubmissionRow = Tables['raw_submissions']['Row'];
type CommitteeRow = Tables['committee_records']['Row'];

const REF_RE = /^(hazard|vulnerability|coping):[A-Za-z]+$/;
const UNIT_RE = /^(TZ|R-[a-z0-9]{2,40}|C[0-9]{3})$/;
const STATUSES: readonly SubmissionStatus[] = ['pending', 'approved', 'rejected'];
const ACTIONS: readonly AuditAction[] = ['submitted', 'approved', 'rejected', 'reverted', 'imported', 'reset', 'assigned', 'requested', 'validated', 'closed'];
const LEVELS: readonly RawLevel[] = ['national', 'region', 'council'];
const REQUEST_STATUSES: readonly RequestStatus[] = ['open', 'submitted', 'done', 'cancelled'];

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

/** Validate the JSON `entries` column of a submission of measured values. */
export function parseEntries(json: Json): RawEntry[] {
  if (!Array.isArray(json)) return [];
  const out: RawEntry[] = [];
  for (const item of json) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const unitId = item.unit_id;
    const level = item.level;
    const value = item.value ?? null;
    if (typeof unitId !== 'string' || !UNIT_RE.test(unitId)) continue;
    if (typeof level !== 'string' || !LEVELS.includes(level as RawLevel)) continue;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) continue;
    const previous = typeof item.previous === 'number' && Number.isFinite(item.previous) ? item.previous : item.previous === null ? null : undefined;
    out.push({ unitId, level: level as RawLevel, value: value as number | null, ...(previous !== undefined ? { previous } : {}) });
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

const toRawSubmission = (r: RawSubmissionRow): RawSubmission => ({
  id: r.id,
  specId: r.spec_id,
  institutionKey: r.institution_key,
  requestId: r.request_id,
  entries: parseEntries(r.entries),
  valueType: r.value_type === 'score' ? 'score' : 'raw',
  method: r.method,
  source: r.source,
  dataset: r.dataset,
  period: r.period,
  note: r.note,
  authorId: r.author_id,
  authorName: r.author_name,
  status: STATUSES.includes(r.status as SubmissionStatus) ? (r.status as SubmissionStatus) : 'pending',
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  reviewerName: r.reviewer_name,
  reviewNote: r.review_note,
});

const COMMITTEE_KINDS: readonly CommitteeKind[] = ['drr', 'guidance', 'event', 'warning'];
const COMMITTEE_LEVELS: readonly CommitteeLevel[] = ['council', 'region', 'national'];
/** The JSON `payload` column is written by the submit function; it is still never trusted blindly. */
function parsePayload(json: Json): CommitteePayload {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {};
  return json as unknown as CommitteePayload;
}
const toCommitteeRecord = (r: CommitteeRow): CommitteeRecord => ({
  id: r.id,
  kind: COMMITTEE_KINDS.includes(r.kind as CommitteeKind) ? (r.kind as CommitteeKind) : 'drr',
  unitId: r.unit_id,
  level: COMMITTEE_LEVELS.includes(r.level as CommitteeLevel) ? (r.level as CommitteeLevel) : 'council',
  unitName: r.unit_name,
  region: r.region,
  regionId: r.region_id,
  hazard: r.hazard,
  payload: parsePayload(r.payload),
  source: r.source,
  note: r.note,
  validFrom: r.valid_from,
  validTo: r.valid_to,
  authorId: r.author_id,
  authorName: r.author_name,
  authorRole: ROLES.includes(r.author_role as Role) ? (r.author_role as Role) : null,
  status: STATUSES.includes(r.status as SubmissionStatus) ? (r.status as SubmissionStatus) : 'pending',
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  reviewerName: r.reviewer_name,
  reviewNote: r.review_note,
});

const toRequest = (r: RequestRow): DataRequest => ({
  id: r.id,
  specId: r.spec_id,
  institutionKey: r.institution_key,
  kind: (r.kind === 'validate' ? 'validate' : 'update') as RequestKind,
  message: r.message,
  dueDate: r.due_date,
  status: REQUEST_STATUSES.includes(r.status as RequestStatus) ? (r.status as RequestStatus) : 'open',
  createdByName: r.created_by_name,
  createdAt: r.created_at,
  closedAt: r.closed_at,
  responseNote: r.response_note,
});

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** PostgREST caps a response at 1000 rows; read a table page by page (the query must be ordered). */
const PAGE = 1000;
async function selectAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const rows = must(await page(from, from + PAGE - 1));
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

export function createSupabaseRepository(sb: SupabaseClient): Repository {
  /** Signed-in users read the tables (reviewers see who submitted); anonymous clients the views without names (SEC-02). */
  const signedIn = async () => !!(await sb.auth.getSession()).data.session;
  return {
    mode: 'supabase',
    async getOverrides() {
      const rows = (await signedIn())
        ? await selectAll((a, b) => sb.from('indicator_values').select('unit_id, ref, value, authority, dataset, note, author_name, updated_at').order('unit_id').order('ref').range(a, b))
        : (await selectAll((a, b) => sb.from('indicator_values_public').select('unit_id, ref, value, authority, dataset, note, updated_at').order('unit_id').order('ref').range(a, b))).map((r) => ({ ...r, author_name: null }));
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
        action: ACTIONS.includes(r.action as AuditAction) ? (r.action as AuditAction) : 'submitted',
        unitId: r.unit_id ?? undefined,
        unitName: r.unit_name ?? undefined,
        detail: r.detail ?? undefined,
      }));
    },

    /* -------------------------------------------------------------------------------------------- */
    /* Institutional workflow                                                                        */
    /* -------------------------------------------------------------------------------------------- */
    async listInstitutions(): Promise<Institution[]> {
      const rows = must(await sb.from('institutions').select('key, label, full_name, kind').order('label'));
      return rows.map((r) => ({ key: r.key, label: r.label, fullName: r.full_name, kind: r.kind === 'global' ? 'global' : 'national' }));
    },
    async listAssignments(): Promise<Assignment[]> {
      const rows = must(await sb.from('indicator_assignments').select('spec_id, institution_key, note, assigned_at'));
      return rows.map((r) => ({ specId: r.spec_id, institutionKey: r.institution_key, note: r.note, assignedAt: r.assigned_at }));
    },
    async assign(specIds, institutionKey, _actor, note) {
      // The function unassigns when the institution is null (Postgres parameters are always nullable).
      return must(await sb.rpc('assign_indicators', { p_spec_ids: specIds, p_institution_key: institutionKey as string, p_note: note }));
    },
    async listRequests() {
      const rows = must(await sb.from('data_requests').select('*').order('created_at', { ascending: false }).limit(1000));
      return rows.map(toRequest);
    },
    async createRequests(specIds, kind, dueDate, message) {
      return must(await sb.rpc('create_requests', { p_spec_ids: specIds, p_kind: kind, p_due: dueDate ?? undefined, p_message: message }));
    },
    async listNotifications() {
      const rows = must(await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(300));
      return rows.map((r) => ({
        id: r.id,
        institutionKey: r.institution_key,
        kind: r.kind as Notification['kind'],
        specId: r.spec_id,
        requestId: r.request_id,
        submissionId: r.submission_id,
        title: r.title,
        body: r.body,
        dueDate: r.due_date,
        createdAt: r.created_at,
        readAt: r.read_at,
        emailStatus: r.email_status as Notification['emailStatus'],
      }));
    },
    async markNotificationRead(id) {
      must(await sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id));
    },
    async closeRequest(id, status, _actor, note) {
      must(await sb.rpc('close_request', { p_id: id, p_status: status, p_note: note }));
    },
    async getRawValues(): Promise<RawValue[]> {
      const rows = (await signedIn())
        ? await selectAll((a, b) =>
            sb.from('raw_values').select('spec_id, unit_id, level, value, value_type, method, source, dataset, period, institution_key, author_name, updated_at').order('spec_id').order('unit_id').range(a, b),
          )
        : (
            await selectAll((a, b) =>
              sb.from('raw_values_public').select('spec_id, unit_id, level, value, value_type, method, source, dataset, period, institution_key, updated_at').order('spec_id').order('unit_id').range(a, b),
            )
          ).map((r) => ({ ...r, author_name: null }));
      return rows
        .filter((r) => LEVELS.includes(r.level as RawLevel))
        .map((r) => ({
          specId: r.spec_id,
          unitId: r.unit_id,
          level: r.level as RawLevel,
          value: r.value == null ? null : Number(r.value),
          valueType: r.value_type === 'score' ? ('score' as const) : ('raw' as const),
          method: r.method,
          source: r.source,
          dataset: r.dataset,
          period: r.period,
          institution: r.institution_key,
          author: r.author_name,
          at: r.updated_at,
        }));
    },
    async listRawSubmissions() {
      const [pending, decided] = await Promise.all([
        sb.from('raw_submissions').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
        sb.from('raw_submissions').select('*').neq('status', 'pending').order('created_at', { ascending: false }).limit(500),
      ]);
      return [...must(pending), ...must(decided)].map(toRawSubmission).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async submitRaw(input) {
      const id = must(
        await sb.rpc('submit_raw_values', {
          p_spec_id: input.specId,
          p_entries: input.entries.map((e) => ({ unit_id: e.unitId, level: e.level, value: e.value, previous: e.previous ?? null })) as unknown as Json,
          p_dataset: input.dataset,
          p_period: input.period,
          p_note: input.note,
          p_request_id: input.requestId ?? undefined,
          p_value_type: input.valueType ?? 'raw',
          p_method: input.valueType === 'score' ? (input.method ?? 'inform') : undefined,
          p_source: input.source,
        }),
      );
      return toRawSubmission(must(await sb.from('raw_submissions').select('*').eq('id', id).single()));
    },
    async reviewRaw(id, decision, _reviewer, note) {
      must(await sb.rpc('review_raw_submission', { p_id: id, p_decision: decision, p_note: note }));
    },
    async revertRaw(specId, unitId) {
      must(await sb.rpc('revert_raw_value', { p_spec_id: specId, p_unit_id: unitId }));
    },
    async listValidations(): Promise<Validation[]> {
      const rows = (await signedIn())
        ? must(await sb.from('indicator_validations').select('*').order('validated_at', { ascending: false }).limit(1000))
        : must(await sb.from('indicator_validations_public').select('*').order('validated_at', { ascending: false }).limit(1000)).map((r) => ({ ...r, validated_by_name: '', validated_by: null }));
      return rows.map((r) => ({
        id: String(r.id),
        specId: r.spec_id,
        institutionKey: r.institution_key,
        requestId: r.request_id,
        note: r.note,
        validatedByName: r.validated_by_name,
        validatedAt: r.validated_at,
      }));
    },
    async confirmValues(specId, requestId, _actor, note) {
      must(await sb.rpc('confirm_values', { p_spec_id: specId, p_request_id: requestId ?? undefined, p_note: note }));
    },
    async listProfiles(): Promise<Profile[]> {
      const rows = must(await sb.from('profiles').select('id, full_name, institution, institution_key, role, scope_unit_id').order('full_name'));
      return rows.map((r) => ({
        id: r.id,
        fullName: r.full_name || 'User',
        institution: r.institution,
        institutionKey: r.institution_key,
        role: ROLES.includes(r.role as Role) ? (r.role as Role) : 'viewer',
        scopeUnitId: r.scope_unit_id,
      }));
    },
    async updateProfile(id, patch) {
      const update: Tables['profiles']['Update'] = {};
      if (patch.role) update.role = patch.role;
      if ('institutionKey' in patch) update.institution_key = patch.institutionKey ?? null;
      if ('scopeUnitId' in patch) update.scope_unit_id = patch.scopeUnitId ?? null;
      must(await sb.from('profiles').update(update).eq('id', id));
    },
    async listCommitteeRecords(): Promise<CommitteeRecord[]> {
      const rows = must(await sb.from('committee_records').select('*').order('created_at', { ascending: false }).limit(3000));
      return rows.map(toCommitteeRecord);
    },
    async submitCommittee(input) {
      const id = must(
        await sb.rpc('submit_committee_record', {
          p_kind: input.kind,
          p_unit_id: input.unitId,
          p_level: input.level,
          p_unit_name: input.unitName,
          p_region: input.region,
          p_region_id: input.regionId ?? undefined,
          p_hazard: input.hazard ?? undefined,
          p_payload: input.payload as unknown as Json,
          p_source: input.source,
          p_note: input.note,
          p_valid_from: input.validFrom ?? undefined,
          p_valid_to: input.validTo ?? undefined,
        }),
      );
      return toCommitteeRecord(must(await sb.from('committee_records').select('*').eq('id', id).single()));
    },
    async reviewCommittee(id, decision, _reviewer, note) {
      must(await sb.rpc('review_committee_record', { p_id: id, p_decision: decision, p_note: note }));
    },
  };
}
