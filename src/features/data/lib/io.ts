/**
 * Export / import of portal data as JSON. Export is a faithful snapshot of what the current user may
 * see; import NEVER writes approved values directly - everything in a file is re-submitted as pending
 * submissions for a reviewer, after strict validation (known units and indicators, 0–10 values,
 * bounded text), with every value resolved onto the correct edit target.
 */
import type { AuditEntry, Change, NewSubmission, Submission } from '@/data-layer/types';
import { isNum, round1 } from '@/engine/risk/math';
import { sourceFor } from '@/engine/risk/sources';
import type { DimensionKey } from '@/engine/risk/hierarchy';
import type { EditRef, Overrides, RiskModel } from '@/engine/risk/types';
import { sameScore } from './scores';
import { currentValue, EXPOSURE_REF, isEditRef, MAX_CHANGES_PER_SUBMISSION, sharingCouncils, targetKind } from './targets';

export const EXPORT_FORMAT = 'inform-tanzania/data-export';
export const EXPORT_VERSION = 1;
/** Refuse files larger than this before parsing. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_NOTE = 2000;
const MAX_TEXT = 200;

export interface DataExport {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  mode: 'local' | 'supabase';
  exportedBy?: string;
  overrides: Overrides;
  submissions: Submission[];
  audit?: AuditEntry[];
}

export function buildExport(args: { mode: 'local' | 'supabase'; overrides: Overrides; submissions: Submission[]; audit?: AuditEntry[]; exportedBy?: string; now?: Date }): DataExport {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: (args.now ?? new Date()).toISOString(),
    mode: args.mode,
    ...(args.exportedBy ? { exportedBy: args.exportedBy } : {}),
    overrides: args.overrides,
    submissions: args.submissions,
    ...(args.audit ? { audit: args.audit } : {}),
  };
}

export const exportFileName = (now = new Date()) => `inform-tanzania-data-${now.toISOString().slice(0, 10)}.json`;

/* ------------------------------------------------------------------------------------------------ */
/* Reading                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export type ReadError = 'tooLarge' | 'json' | 'format' | 'version';

/** Loosely-typed content of a file after the envelope check (values are validated later). */
export interface ImportFile {
  exportedAt: string | null;
  overrides: Record<string, unknown>;
  submissions: unknown[];
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function readExportFile(text: string): { ok: true; file: ImportFile } | { ok: false; error: ReadError } {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'tooLarge' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  if (!isObj(data) || data.format !== EXPORT_FORMAT) return { ok: false, error: 'format' };
  if (data.version !== EXPORT_VERSION) return { ok: false, error: 'version' };
  const overrides = isObj(data.overrides) ? data.overrides : {};
  const submissions = Array.isArray(data.submissions) ? data.submissions : [];
  return { ok: true, file: { exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null, overrides, submissions } };
}

/* ------------------------------------------------------------------------------------------------ */
/* Planning the re-submission                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type ImportIssueKind = 'unknownUnit' | 'unknownIndicator' | 'badValue' | 'unsupportedUnit' | 'badSubmission';
export interface ImportIssue {
  where: string;
  kind: ImportIssueKind;
}

export interface ImportPlan {
  submissions: NewSubmission[];
  /** Counts found in the file (before validation). */
  found: { overrideValues: number; pendingSubmissions: number };
  /** Values that will be submitted. */
  values: number;
  /** Values skipped because they already equal the current value. */
  unchanged: number;
  issues: ImportIssue[];
}

const text = (x: unknown, max = MAX_TEXT): string | undefined => (typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : undefined);

function normaliseValue(v: unknown): { ok: true; value: number | null } | { ok: false } {
  if (v === null) return { ok: true, value: null };
  if (isNum(v) && v >= 0 && v <= 10) return { ok: true, value: round1(v) };
  return { ok: false };
}

/** Every unit that must receive (unitId, ref), following the portal's target rules. */
function resolveTargets(model: RiskModel, unitId: string, ref: EditRef): { ok: true; ids: string[] } | { ok: false; kind: ImportIssueKind } {
  const unit = model.byId.get(unitId);
  if (!unit) return { ok: false, kind: 'unknownUnit' };
  if (unit.level === 'council') return { ok: true, ids: [targetKind(ref) === 'source' && unit.sourceId ? unit.sourceId : unit.id] };
  if (unit.level === 'source') {
    if (targetKind(ref) === 'source') return { ok: true, ids: [unit.id] };
    const councils = sharingCouncils(model, unit.id);
    return councils.length ? { ok: true, ids: councils.map((c) => c.id) } : { ok: false, kind: 'unsupportedUnit' };
  }
  return { ok: false, kind: 'unsupportedUnit' };
}

interface Group {
  unitId: string;
  authority: string;
  dataset?: string;
  note?: string;
  changes: Map<EditRef, Change>;
}

/**
 * Build the pending submissions for an import: approved values from the file's `overrides` and/or its
 * PENDING submissions (approved/rejected history is not replayed). Values are grouped per target unit
 * and provenance, deduplicated (last wins), and split into submissions of ≤ 64 changes.
 */
export function planImport(file: ImportFile, model: RiskModel, opts: { includeOverrides: boolean; includePending: boolean }): ImportPlan {
  const issues: ImportIssue[] = [];
  const groups = new Map<string, Group>();
  let overrideValues = 0;
  let pendingSubmissions = 0;
  let unchanged = 0;

  const add = (where: string, unitId: string, ref: unknown, value: unknown, meta: { authority?: string; dataset?: string; note?: string }, raw?: unknown): void => {
    if (!isEditRef(ref)) {
      issues.push({ where, kind: 'unknownIndicator' });
      return;
    }
    const v = normaliseValue(value);
    if (!v.ok || (ref === EXPOSURE_REF && v.value === null)) {
      issues.push({ where, kind: 'badValue' });
      return;
    }
    const t = resolveTargets(model, unitId, ref);
    if (!t.ok) {
      issues.push({ where, kind: t.kind });
      return;
    }
    const [dim, key] = ref.split(':') as [DimensionKey, string];
    const authority = meta.authority ?? sourceFor(dim, key).by;
    for (const id of t.ids) {
      const gk = JSON.stringify([id, authority, meta.dataset ?? '', meta.note ?? '']);
      if (!groups.has(gk)) groups.set(gk, { unitId: id, authority, dataset: meta.dataset, note: meta.note, changes: new Map() });
      const target = model.byId.get(id)!;
      const previous = currentValue(target, ref);
      if (sameScore(previous, v.value)) {
        unchanged++;
        continue;
      }
      const change: Change = { ref, value: v.value, previous };
      if (isObj(raw) && typeof raw.specId === 'string' && (typeof raw.value === 'number' || typeof raw.value === 'string')) {
        change.raw = { specId: raw.specId.slice(0, MAX_TEXT), value: typeof raw.value === 'string' ? raw.value.slice(0, MAX_TEXT) : raw.value, unit: text(raw.unit) ?? null };
      }
      groups.get(gk)!.changes.set(ref, change);
    }
  };

  if (opts.includeOverrides) {
    for (const [unitId, refs] of Object.entries(file.overrides)) {
      if (!isObj(refs)) {
        issues.push({ where: unitId, kind: 'badSubmission' });
        continue;
      }
      for (const [ref, stamp] of Object.entries(refs)) {
        overrideValues++;
        const where = `${unitId} · ${ref}`;
        if (!isObj(stamp)) {
          issues.push({ where, kind: 'badValue' });
          continue;
        }
        add(where, unitId, ref, stamp.value, { authority: text(stamp.authority), dataset: text(stamp.dataset), note: text(stamp.note, MAX_NOTE) });
      }
    }
  }

  if (opts.includePending) {
    file.submissions.forEach((s, i) => {
      if (!isObj(s) || s.status !== 'pending') return;
      pendingSubmissions++;
      const unitId = text(s.unitId, 32);
      const where = `#${i + 1}${unitId ? ` · ${unitId}` : ''}`;
      if (!unitId || !Array.isArray(s.changes) || !s.changes.length) {
        issues.push({ where, kind: 'badSubmission' });
        return;
      }
      const meta = { authority: text(s.authority), dataset: text(s.dataset), note: text(s.note, MAX_NOTE) };
      for (const c of s.changes) {
        if (!isObj(c)) {
          issues.push({ where, kind: 'badSubmission' });
          continue;
        }
        add(`${where} · ${String(c.ref)}`, unitId, c.ref, c.value, meta, c.raw);
      }
    });
  }

  const submissions: NewSubmission[] = [];
  let values = 0;
  for (const g of groups.values()) {
    const unit = model.byId.get(g.unitId)!;
    const list = [...g.changes.values()];
    values += list.length;
    for (let i = 0; i < list.length; i += MAX_CHANGES_PER_SUBMISSION) {
      submissions.push({
        unitId: g.unitId,
        unitName: unit.name,
        region: unit.region,
        changes: list.slice(i, i + MAX_CHANGES_PER_SUBMISSION),
        authority: g.authority,
        ...(g.dataset ? { dataset: g.dataset } : {}),
        ...(g.note ? { note: g.note } : {}),
      });
    }
  }
  return { submissions, found: { overrideValues, pendingSubmissions }, values, unchanged, issues };
}
