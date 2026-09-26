/**
 * Local (browser-only) repository — demo mode when no Supabase project is configured. Everything is
 * stored in this browser's localStorage and is clearly labelled as such in the UI.
 * Also migrates edits saved by the previous app (`inform_overrides_v1`) into the new format once.
 */
import type { EditRef, EditStamp, Overrides } from '@/engine/risk/types';
import type { AuditEntry, NewSubmission, Profile, Repository, Submission } from './types';

const K = {
  values: 'inform.v2.values',
  submissions: 'inform.v2.submissions',
  audit: 'inform.v2.audit',
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
    /* quota or privacy mode — edits simply won't persist */
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
      write(K.values, {});
      write(K.submissions, []);
      write(K.audit, []);
      log({ actor: actor.fullName, action: 'reset', detail: 'All local data cleared' });
    },
  };
}
