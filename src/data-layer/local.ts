/**
 * Local (browser-only) repository: demo mode when no Supabase project is configured. Everything is
 * stored in this browser's localStorage and is clearly labelled as such in the UI. It enforces the same
 * permission rules as the database functions, so the demo behaves like the real portal.
 * Also migrates edits saved by the previous app (`inform_overrides_v1`) into the new format once.
 */
import type { RawValue } from '@/engine/risk/rawValues';
import { AUTHORITIES, AUTHORITY_KEYS, authorityKind } from '@/engine/risk/sources';
import type { EditRef, EditStamp, Overrides } from '@/engine/risk/types';
import {
  canEnterIndicator,
  canReview,
  type Assignment,
  type AuditEntry,
  type DataRequest,
  type Institution,
  type NewRawSubmission,
  type NewSubmission,
  type Profile,
  type RawSubmission,
  type Repository,
  type Role,
  type Submission,
  type Validation,
} from './types';

const K = {
  values: 'inform.v2.values',
  submissions: 'inform.v2.submissions',
  audit: 'inform.v2.audit',
  assignments: 'inform.v2.assignments',
  requests: 'inform.v2.requests',
  rawSubmissions: 'inform.v2.rawSubmissions',
  rawValues: 'inform.v2.rawValues',
  validations: 'inform.v2.validations',
  demoProfiles: 'inform.v2.demoProfiles',
  legacyOverrides: 'inform_overrides_v1',
  legacyPending: 'inform_pending_v1',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode: edits simply won't persist */
  }
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const now = () => new Date().toISOString();

/** One-time migration of the old app's edits (indicator leaves + exposure; dimension-total overrides are dropped by design). */
function migrateLegacy(): void {
  const legacy = read<Record<string, { ind?: Record<string, number | null>; exposure?: number; indSrc?: Record<string, { by?: string; dataset?: string }>; _by?: string; _ts?: number }> | null>(K.legacyOverrides, null);
  if (!legacy) return;
  const values = read<Overrides>(K.values, {});
  let n = 0;
  for (const [unitId, o] of Object.entries(legacy)) {
    const at = o._ts ? new Date(o._ts).toISOString() : now();
    const target = (values[unitId] ??= {});
    for (const [ref, value] of Object.entries(o.ind ?? {})) {
      const src = o.indSrc?.[ref];
      target[ref as EditRef] = { value, authority: src?.by, dataset: src?.dataset, author: o._by ?? 'Migrated', at };
      n++;
    }
    if (typeof o.exposure === 'number') {
      target['hazard:exposure'] = { value: o.exposure, author: o._by ?? 'Migrated', at };
      n++;
    }
  }
  write(K.values, values);
  if (n) {
    const audit = read<AuditEntry[]>(K.audit, []);
    audit.unshift({ id: uid(), at: now(), actor: 'System', action: 'imported', detail: `${n} edits migrated from the previous version` });
    write(K.audit, audit);
  }
  localStorage.removeItem(K.legacyOverrides);
  localStorage.removeItem(K.legacyPending);
}

/** Demo identities (one per role). The officer works for NBS unless an administrator changed it. */
const DEMO_ROLES: readonly Role[] = ['viewer', 'sector', 'pmo', 'admin'];
const DEMO_NAMES: Record<Role, string> = { viewer: 'Visitor', sector: 'Demo sector officer', pmo: 'Demo PMO reviewer', admin: 'Demo administrator' };

export function demoProfile(role: Role): Profile {
  const custom = read<Record<string, { institutionKey?: string | null }>>(K.demoProfiles, {})[`local-demo-${role}`];
  const institutionKey = custom && 'institutionKey' in custom ? (custom.institutionKey ?? null) : role === 'sector' ? 'NBS' : null;
  return {
    // One identity per demo role, so a demo reviewer never sees the demo officer's work as their own.
    id: `local-demo-${role}`,
    fullName: DEMO_NAMES[role],
    institution: institutionKey ? ((AUTHORITIES as Record<string, { label: string }>)[institutionKey]?.label ?? institutionKey) : 'Demo',
    institutionKey,
    role,
  };
}

const denied = (what: string) => Object.assign(new Error(`You do not have permission to ${what}.`), { code: '42501' });

export function createLocalRepository(): Repository {
  if (typeof localStorage !== 'undefined') migrateLegacy();

  const log = (entry: Omit<AuditEntry, 'id' | 'at'>) => {
    const audit = read<AuditEntry[]>(K.audit, []);
    audit.unshift({ id: uid(), at: now(), ...entry });
    write(K.audit, audit.slice(0, 500));
  };

  const apply = (s: Submission, reviewer: string) => {
    const values = read<Overrides>(K.values, {});
    const target = (values[s.unitId] ??= {});
    for (const c of s.changes) {
      const stamp: EditStamp = { value: c.value, authority: s.authority, dataset: s.dataset ?? undefined, note: s.note ?? undefined, author: `${s.authorName}${reviewer !== s.authorName ? ` · approved by ${reviewer}` : ''}`, at: now() };
      target[c.ref] = stamp;
    }
    write(K.values, values);
  };

  const assignments = () => read<Assignment[]>(K.assignments, []);
  const requireReviewer = (p: Profile, what: string) => {
    if (!canReview(p.role)) throw denied(what);
  };
  const findRequest = (id: string) => read<DataRequest[]>(K.requests, []).find((x) => x.id === id);
  const updateRequest = (id: string, patch: Partial<DataRequest>) => {
    const list = read<DataRequest[]>(K.requests, []);
    const r = list.find((x) => x.id === id);
    if (r) Object.assign(r, patch);
    write(K.requests, list);
  };
  const ownerOf = (specId: string, fallback: string | null | undefined) => assignments().find((a) => a.specId === specId)?.institutionKey ?? fallback ?? null;

  return {
    mode: 'local',
    async getOverrides() {
      return read<Overrides>(K.values, {});
    },
    async listSubmissions() {
      return read<Submission[]>(K.submissions, []);
    },
    async submit(input: NewSubmission, author: Profile) {
      const s: Submission = { ...input, id: uid(), authorId: author.id, authorName: author.fullName, status: 'pending', createdAt: now() };
      const list = read<Submission[]>(K.submissions, []);
      list.unshift(s);
      write(K.submissions, list);
      log({ actor: author.fullName, action: 'submitted', unitId: s.unitId, unitName: s.unitName, detail: `${s.changes.length} change(s) · ${s.authority}` });
      return s;
    },
    async review(id, decision, reviewer, note) {
      const list = read<Submission[]>(K.submissions, []);
      const s = list.find((x) => x.id === id);
      if (!s || s.status !== 'pending') throw new Error('Submission not found or already reviewed');
      s.status = decision;
      s.reviewedAt = now();
      s.reviewerName = reviewer.fullName;
      s.reviewNote = note ?? null;
      if (decision === 'approved') apply(s, reviewer.fullName);
      write(K.submissions, list);
      log({ actor: reviewer.fullName, action: decision, unitId: s.unitId, unitName: s.unitName, detail: note });
    },
    async revert(unitId, ref, actor) {
      const values = read<Overrides>(K.values, {});
      if (values[unitId]) {
        delete values[unitId][ref];
        if (!Object.keys(values[unitId]).length) delete values[unitId];
      }
      write(K.values, values);
      log({ actor: actor.fullName, action: 'reverted', unitId, detail: ref });
    },
    async listAudit(limit = 100) {
      return read<AuditEntry[]>(K.audit, []).slice(0, limit);
    },
    async resetAll(actor) {
      for (const key of [K.submissions, K.audit, K.assignments, K.requests, K.rawSubmissions, K.rawValues, K.validations]) write(key, []);
      write(K.values, {});
      write(K.demoProfiles, {});
      log({ actor: actor.fullName, action: 'reset', detail: 'All local data cleared' });
    },

    /* -------------------------------------------------------------------------------------------- */
    /* Institutional workflow                                                                        */
    /* -------------------------------------------------------------------------------------------- */
    async listInstitutions(): Promise<Institution[]> {
      return AUTHORITY_KEYS.map((key) => ({ key, label: AUTHORITIES[key].label, fullName: AUTHORITIES[key].full, kind: authorityKind(key) }));
    },
    async listAssignments() {
      return assignments();
    },
    async assign(specIds, institutionKey, actor, note) {
      requireReviewer(actor, 'assign indicators');
      const byId = new Map(assignments().map((a) => [a.specId, a]));
      for (const id of specIds) {
        if (institutionKey) byId.set(id, { specId: id, institutionKey, note: note?.trim() || null, assignedAt: now() });
        else byId.delete(id);
      }
      write(K.assignments, [...byId.values()]);
      log({ actor: actor.fullName, action: 'assigned', detail: `${specIds.length} indicator(s): ${institutionKey ?? 'unassigned'}` });
      return specIds.length;
    },
    async listRequests() {
      return read<DataRequest[]>(K.requests, []);
    },
    async createRequests(specIds, kind, dueDate, message, actor) {
      requireReviewer(actor, 'send requests');
      const owner = new Map(assignments().map((a) => [a.specId, a.institutionKey]));
      const list = read<DataRequest[]>(K.requests, []);
      let n = 0;
      for (const specId of specIds) {
        const institutionKey = owner.get(specId);
        if (!institutionKey) continue;
        // A new request replaces the indicator's live request of the same kind (as in create_requests).
        for (const r of list)
          if (r.specId === specId && r.kind === kind && (r.status === 'open' || r.status === 'submitted'))
            Object.assign(r, { status: 'cancelled', closedAt: now(), responseNote: r.responseNote || 'Replaced by a newer request' });
        list.unshift({ id: uid(), specId, institutionKey, kind, message: message?.trim() || null, dueDate, status: 'open', createdByName: actor.fullName, createdAt: now() });
        n++;
      }
      write(K.requests, list);
      if (n) log({ actor: actor.fullName, action: 'requested', detail: `${n} ${kind} request(s)` });
      return n;
    },
    async closeRequest(id, status, actor, note) {
      requireReviewer(actor, 'close requests');
      const r = findRequest(id);
      if (!r || (r.status !== 'open' && r.status !== 'submitted')) throw new Error('Request not found or already closed');
      updateRequest(id, { status, closedAt: now(), responseNote: note?.trim() || r.responseNote || null });
      log({ actor: actor.fullName, action: 'closed', unitId: r.specId, detail: status });
    },
    async getRawValues() {
      return read<RawValue[]>(K.rawValues, []);
    },
    async listRawSubmissions() {
      return read<RawSubmission[]>(K.rawSubmissions, []);
    },
    async submitRaw(input: NewRawSubmission, author: Profile) {
      if (!canEnterIndicator(author, input.specId, assignments())) throw denied('enter this indicator');
      if (!input.entries.length) throw new Error('No values to submit');
      if (input.dataset.trim().length < 2) throw new Error('Name the dataset the values come from');
      const seen = new Set<string>();
      for (const e of input.entries) {
        if (seen.has(e.unitId)) throw new Error(`Unit ${e.unitId} appears twice`);
        seen.add(e.unitId);
      }
      if (input.requestId) {
        const r = findRequest(input.requestId);
        if (!r || r.specId !== input.specId) throw new Error('The request does not match this indicator');
        if (r.status !== 'open' && r.status !== 'submitted') throw new Error('The request is already closed');
        updateRequest(r.id, { status: 'submitted' });
      }
      const s: RawSubmission = {
        id: uid(),
        specId: input.specId,
        institutionKey: ownerOf(input.specId, author.institutionKey),
        requestId: input.requestId ?? null,
        entries: input.entries,
        dataset: input.dataset.trim(),
        period: input.period?.trim() || null,
        note: input.note?.trim() || null,
        authorId: author.id,
        authorName: author.fullName,
        status: 'pending',
        createdAt: now(),
      };
      const list = read<RawSubmission[]>(K.rawSubmissions, []);
      list.unshift(s);
      write(K.rawSubmissions, list);
      log({ actor: author.fullName, action: 'submitted', unitId: s.specId, detail: `${s.entries.length} value(s) · ${s.dataset}` });
      return s;
    },
    async reviewRaw(id, decision, reviewer, note) {
      requireReviewer(reviewer, 'review submissions');
      const list = read<RawSubmission[]>(K.rawSubmissions, []);
      const s = list.find((x) => x.id === id);
      if (!s || s.status !== 'pending') throw new Error('Submission not found or already reviewed');
      if (decision === 'approved') {
        const byKey = new Map(read<RawValue[]>(K.rawValues, []).map((v) => [`${v.specId}|${v.unitId}`, v]));
        const at = now();
        const author = `${s.authorName}${reviewer.id !== s.authorId ? ` · approved by ${reviewer.fullName}` : ''}`;
        for (const e of s.entries) {
          byKey.set(`${s.specId}|${e.unitId}`, { specId: s.specId, unitId: e.unitId, level: e.level, value: e.value, dataset: s.dataset, period: s.period, institution: s.institutionKey, author, at });
        }
        write(K.rawValues, [...byKey.values()]);
        if (s.requestId) updateRequest(s.requestId, { status: 'done', closedAt: at });
      } else if (s.requestId && findRequest(s.requestId)?.status === 'submitted') {
        updateRequest(s.requestId, { status: 'open' });
      }
      s.status = decision;
      s.reviewedAt = now();
      s.reviewerName = reviewer.fullName;
      s.reviewNote = note?.trim() || null;
      write(K.rawSubmissions, list);
      log({ actor: reviewer.fullName, action: decision, unitId: s.specId, detail: note });
    },
    async revertRaw(specId, unitId, actor) {
      requireReviewer(actor, 'revert values');
      write(
        K.rawValues,
        read<RawValue[]>(K.rawValues, []).filter((v) => !(v.specId === specId && v.unitId === unitId)),
      );
      log({ actor: actor.fullName, action: 'reverted', unitId, detail: specId });
    },
    async listValidations() {
      return read<Validation[]>(K.validations, []);
    },
    async confirmValues(specId, requestId, actor, note) {
      if (!canEnterIndicator(actor, specId, assignments())) throw denied('confirm this indicator');
      if (requestId) {
        const r = findRequest(requestId);
        if (!r || r.specId !== specId) throw new Error('The request does not match this indicator');
        if (r.status !== 'open' && r.status !== 'submitted') throw new Error('The request is already closed');
        updateRequest(requestId, { status: 'done', closedAt: now(), responseNote: note?.trim() || null });
      }
      const list = read<Validation[]>(K.validations, []);
      list.unshift({ id: uid(), specId, institutionKey: ownerOf(specId, actor.institutionKey), requestId, note: note?.trim() || null, validatedByName: actor.fullName, validatedAt: now() });
      write(K.validations, list);
      log({ actor: actor.fullName, action: 'validated', unitId: specId, detail: note });
    },
    async listProfiles() {
      return DEMO_ROLES.filter((r) => r !== 'viewer').map(demoProfile);
    },
    async updateProfile(id, patch) {
      if ('institutionKey' in patch) {
        const all = read<Record<string, { institutionKey?: string | null }>>(K.demoProfiles, {});
        all[id] = { ...all[id], institutionKey: patch.institutionKey ?? null };
        write(K.demoProfiles, all);
      }
    },
  };
}
