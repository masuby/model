/**
 * Local (browser-only) repository: demo mode when no Supabase project is configured. Everything is
 * stored in this browser's localStorage and is clearly labelled as such in the UI. It enforces the same
 * permission rules as the database functions, so the demo behaves like the real portal.
 * Also migrates edits saved by the previous app (`inform_overrides_v1`) into the new format once.
 */
import type { RawValue } from '@/engine/risk/rawValues';
import { AUTHORITIES, AUTHORITY_KEYS, authorityKind } from '@/engine/risk/sources';
import type { EditRef, EditStamp, Overrides } from '@/engine/risk/types';
import { ACTIVE_SPECS } from '@/engine/risk/standardise';
import {
  canEnterIndicator,
  canReview,
  canReviewCommittee,
  canSubmitCommittee,
  type Assignment,
  type AuditEntry,
  type DataRequest,
  type CommitteeRecord,
  type Institution,
  type NewCommitteeRecord,
  type NewRawSubmission,
  type NewSubmission,
  type Profile,
  type RawSubmission,
  type Notification,
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
  committeeRecords: 'inform.v2.committeeRecords',
  notifications: 'inform.v2.notifications',
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

/** Tell an institution about a request, a reminder or a decision (the local counterpart of migration 0011's triggers). */
function notify(n: Omit<Notification, 'id' | 'createdAt' | 'emailStatus'>): void {
  const list = read<Notification[]>(K.notifications, []);
  list.unshift({ ...n, id: uid(), createdAt: now(), emailStatus: 'none' });
  write(K.notifications, list.slice(0, 500));
}

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

/**
 * Demo identities (one per role). The officer works for NBS, the district committee for Kondoa District
 * and the regional committee for Dodoma Region unless an administrator changed it.
 */
const DEMO_ROLES: readonly Role[] = ['viewer', 'sector', 'ddrrc', 'rdrrc', 'ndrrc', 'pmo', 'admin'];
const DEMO_NAMES: Record<Role, string> = {
  viewer: 'Visitor',
  sector: 'Demo sector officer',
  ddrrc: 'Demo district committee (DDRRC)',
  rdrrc: 'Demo regional committee (RDRRC)',
  ndrrc: 'Demo national committee (NDRRC)',
  pmo: 'Demo PMO reviewer',
  admin: 'Demo administrator',
};
const DEMO_SCOPE: Partial<Record<Role, string>> = { ddrrc: 'C001', rdrrc: 'R-dodoma' };

export function demoProfile(role: Role): Profile {
  const custom = read<Record<string, { institutionKey?: string | null; scopeUnitId?: string | null }>>(K.demoProfiles, {})[`local-demo-${role}`];
  const institutionKey = custom && 'institutionKey' in custom ? (custom.institutionKey ?? null) : role === 'sector' ? 'NBS' : null;
  const scopeUnitId = custom && 'scopeUnitId' in custom ? (custom.scopeUnitId ?? null) : (DEMO_SCOPE[role] ?? null);
  return {
    // One identity per demo role, so a demo reviewer never sees the demo officer's work as their own.
    id: `local-demo-${role}`,
    fullName: DEMO_NAMES[role],
    institution: institutionKey ? ((AUTHORITIES as Record<string, { label: string }>)[institutionKey]?.label ?? institutionKey) : 'Demo',
    institutionKey,
    role,
    scopeUnitId,
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
      for (const key of [K.submissions, K.audit, K.assignments, K.requests, K.rawSubmissions, K.rawValues, K.validations, K.committeeRecords]) write(key, []);
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
        const id = uid();
        list.unshift({ id, specId, institutionKey, kind, message: message?.trim() || null, dueDate, status: 'open', createdByName: actor.fullName, createdAt: now() });
        notify({ institutionKey, kind: 'request', specId, requestId: id, title: `${kind === 'validate' ? 'Please confirm' : 'Please update'}: ${ACTIVE_SPECS[specId]?.name ?? specId}`, body: message?.trim() || null, dueDate });
        n++;
      }
      write(K.requests, list);
      if (n) log({ actor: actor.fullName, action: 'requested', detail: `${n} ${kind} request(s)` });
      return n;
    },
    async listNotifications(viewer) {
      const all = read<Notification[]>(K.notifications, []);
      return canReview(viewer.role) ? all : all.filter((n) => viewer.institutionKey && n.institutionKey === viewer.institutionKey);
    },
    async markNotificationRead(id, viewer) {
      const all = read<Notification[]>(K.notifications, []);
      const n = all.find((x) => x.id === id);
      if (!n) throw new Error('Notification not found');
      if (!canReview(viewer.role) && n.institutionKey !== viewer.institutionKey) throw denied('read this notification');
      n.readAt = now();
      write(K.notifications, all);
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
      const valueType = input.valueType ?? 'raw';
      if (valueType === 'score') {
        if ((input.source?.trim().length ?? 0) < 3) throw new Error('Cite the source the scores come from');
        if (input.entries.some((e) => e.value != null && (e.value < 0 || e.value > 10))) throw new Error('Scores must lie between 0 and 10');
      }
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
        valueType,
        method: valueType === 'score' ? (input.method ?? 'inform') : null,
        source: input.source?.trim() || null,
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
          byKey.set(`${s.specId}|${e.unitId}`, {
            specId: s.specId,
            unitId: e.unitId,
            level: e.level,
            value: e.value,
            valueType: s.valueType ?? 'raw',
            method: s.method ?? null,
            source: s.source ?? null,
            dataset: s.dataset,
            period: s.period,
            institution: s.institutionKey,
            author,
            at,
          });
        }
        write(K.rawValues, [...byKey.values()]);
        if (s.requestId) updateRequest(s.requestId, { status: 'done', closedAt: at });
      } else if (s.requestId && findRequest(s.requestId)?.status === 'submitted') {
        updateRequest(s.requestId, { status: 'open' });
      }
      s.status = decision;
      s.reviewedAt = now();
      s.reviewerName = reviewer.fullName;
      if (s.institutionKey) notify({ institutionKey: s.institutionKey, kind: 'decision', specId: s.specId, submissionId: s.id, title: `${ACTIVE_SPECS[s.specId]?.name ?? s.specId}: ${decision}`, body: note?.trim() || null });
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
      const all = read<Record<string, { institutionKey?: string | null; scopeUnitId?: string | null }>>(K.demoProfiles, {});
      if ('institutionKey' in patch) all[id] = { ...all[id], institutionKey: patch.institutionKey ?? null };
      if ('scopeUnitId' in patch) all[id] = { ...all[id], scopeUnitId: patch.scopeUnitId ?? null };
      write(K.demoProfiles, all);
    },
    async listCommitteeRecords() {
      return read<CommitteeRecord[]>(K.committeeRecords, []);
    },
    async submitCommittee(input: NewCommitteeRecord, author: Profile) {
      if (!canSubmitCommittee(author, input)) throw denied('record this for this area');
      if (input.source.trim().length < 3) throw new Error('Say what the record rests on');
      if (input.kind === 'warning') {
        const w = input.payload as { alertLevel?: number; areas?: string[] };
        if (!input.hazard || !Array.isArray(w.areas) || !w.areas.length || ![1, 2, 3].includes(Number(w.alertLevel))) throw new Error('A warning needs a hazard, a level and its areas');
      }
      const published = input.kind === 'warning';
      const at = now();
      const r: CommitteeRecord = {
        id: uid(),
        kind: input.kind,
        unitId: input.unitId,
        level: input.level,
        unitName: input.unitName,
        region: input.region,
        regionId: input.regionId,
        hazard: input.hazard ?? null,
        payload: { ...input.payload },
        source: input.source.trim(),
        note: input.note?.trim() || null,
        validFrom: input.validFrom ?? null,
        validTo: input.validTo ?? null,
        authorId: author.id,
        authorName: author.fullName,
        authorRole: author.role,
        status: published ? 'approved' : 'pending',
        createdAt: at,
        ...(published ? { reviewedAt: at, reviewerName: author.fullName } : {}),
      };
      const list = read<CommitteeRecord[]>(K.committeeRecords, []);
      list.unshift(r);
      write(K.committeeRecords, list);
      log({ actor: author.fullName, action: 'submitted', unitId: r.unitId, unitName: r.unitName, detail: `Committee record (${r.kind}) · ${r.source}` });
      return r;
    },
    async reviewCommittee(id, decision, reviewer, note) {
      const list = read<CommitteeRecord[]>(K.committeeRecords, []);
      const r = list.find((x) => x.id === id);
      if (!r) throw new Error('Record not found');
      if (r.kind === 'warning') {
        if (!(r.status === 'approved' && decision === 'rejected')) throw new Error('A warning can only be withdrawn');
      } else if (r.status !== 'pending') throw new Error('Record already reviewed');
      if (!canReviewCommittee(reviewer, r)) throw denied('decide on this record: it is decided by the next level of the committee chain');
      r.status = decision;
      r.reviewedAt = now();
      r.reviewerName = reviewer.fullName;
      r.reviewNote = note?.trim() || null;
      write(K.committeeRecords, list);
      log({ actor: reviewer.fullName, action: decision, unitId: r.unitId, unitName: r.unitName, detail: `Committee record (${r.kind})${note ? ` · ${note}` : ''}` });
    },
  };
}
