/**
 * The institutional data workflow, as pure functions: which indicators exist and who should own them,
 * where each stands (owner, open request, last update, coverage by level), the rows of the entry sheet
 * (national, regions and their councils, each with the value that applies today and where it comes
 * from), and pasting measured values straight from a spreadsheet.
 */
import type { Assignment, DataRequest, RawEntry, RawSubmission, Validation } from '@/data-layer/types';
import { isOverdue } from '@/data-layer/types';
import { findIndicator } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { buildModel } from '@/engine/risk/model';
import {
  baselineValue,
  councilInput,
  deriveRawOverrides,
  leafOfSpec,
  mergeOverrides,
  NATIONAL_ID,
  regionIdOf,
  scoreable,
  scoreRaw,
  type BaselineRaw,
  type RawIndex,
  type RawLevel,
  type RawValue,
} from '@/engine/risk/rawValues';
import { AUTHORITIES, sourceFor } from '@/engine/risk/sources';
import { ADVANCED_SPECS, SPECS, usedSpecs, type IndicatorSpec } from '@/engine/risk/standardise';
import type { EditRef, Overrides, RiskModel, Unit, ValueLevel } from '@/engine/risk/types';
import { buildCouncilIndex, buildRegionIndex, normaliseName } from './names';
import { isNoDataToken, splitLine } from './paste';
import { naturalRange, parseRawNumber, specKey } from './raw';
import { summarise, type AffectedImpact } from './targets';

/* ------------------------------------------------------------------------------------------------ */
/* The indicators                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export interface WorkflowIndicator {
  spec: IndicatorSpec;
  /** True for the 53 INFORM indicators that feed the score; false for the advanced benchmark set. */
  core: boolean;
  /** The model leaf (indicator group) it feeds, if any. */
  leaf: EditRef | null;
  /** Whether a measured value can be turned into a 0–10 score. */
  scoreable: boolean;
}

const SPEC_ID_RE = /^[A-Z]{2}\.[A-Z]{2,3}\.[A-Za-z0-9-]+$/;
export const isSpecId = (s: string | null | undefined): s is string => !!s && SPEC_ID_RE.test(s);

/** Every indicator in the workflow: the INFORM ones in model order, then the advanced benchmark set. */
export const WORKFLOW_INDICATORS: readonly WorkflowIndicator[] = [
  ...usedSpecs().map((spec) => ({ spec, core: true, leaf: leafOfSpec(spec.id), scoreable: scoreable(spec) })),
  ...Object.values(ADVANCED_SPECS).map((spec) => ({ spec, core: false, leaf: null, scoreable: scoreable(spec) })),
];
const BY_ID = new Map(WORKFLOW_INDICATORS.map((w) => [w.spec.id, w]));
export const workflowIndicator = (specId: string): WorkflowIndicator | null => BY_ID.get(specId) ?? null;

type T = (key: string, opts?: Record<string, unknown>) => string;

/** Translated name of a workbook indicator (falls back to the workbook's English name). */
export function specLabel(t: T, specId: string): string {
  const spec = SPECS[specId] ?? ADVANCED_SPECS[specId];
  return t(`data:specs.${specKey(specId)}`, { defaultValue: spec?.name ?? specId });
}

/** The dimension key of a workflow indicator. */
export function dimensionOf(w: WorkflowIndicator): 'hazard' | 'vulnerability' | 'coping' {
  if (w.leaf) return w.leaf.split(':')[0] as 'hazard' | 'vulnerability' | 'coping';
  const d = String(w.spec.dimension ?? '').toLowerCase();
  return d.includes('vulner') ? 'vulnerability' : d.includes('coping') ? 'coping' : 'hazard';
}

/** The i18n key of the indicator group a workflow indicator belongs to. */
export function groupKey(w: WorkflowIndicator): string | null {
  if (w.leaf) return findIndicator(w.leaf)?.indicator.key ?? null;
  const comp = String(w.spec.component ?? '').toLowerCase();
  const hit = usedSpecs().find((s) => String(s.component ?? '').toLowerCase() === comp);
  const ref = hit ? leafOfSpec(hit.id) : null;
  return ref ? (findIndicator(ref)?.indicator.key ?? null) : null;
}

/**
 * The institution that should own an indicator: the sector named in the advanced specification,
 * else the usual source of the indicator group it feeds (the site's source register).
 */
export function suggestedOwner(w: WorkflowIndicator): string | null {
  const sector = String(w.spec.sector ?? '').trim().toUpperCase();
  if (sector && sector in AUTHORITIES) return sector;
  const leaf = w.leaf ?? (groupKey(w) ? `${dimensionOf(w)}:${groupKey(w)}` : null);
  if (!leaf) return null;
  const [dim, key] = leaf.split(':') as ['hazard' | 'vulnerability' | 'coping', string];
  const by = sourceFor(dim, key).by;
  return by === 'INFORM' ? null : by;
}

/* ------------------------------------------------------------------------------------------------ */
/* Where each indicator stands                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface IndicatorStatus {
  owner: string | null;
  openRequest: DataRequest | null;
  overdue: boolean;
  /** Pending submissions waiting for review. */
  pending: number;
  /** Latest approved measured value. */
  lastUpdate: string | null;
  lastValidated: Validation | null;
  coverage: { national: boolean; regions: number; councils: number };
}

export interface WorkflowData {
  assignments: readonly Assignment[];
  requests: readonly DataRequest[];
  rawValues: readonly RawValue[];
  rawSubmissions: readonly RawSubmission[];
  validations: readonly Validation[];
}

export function indicatorStatuses(data: WorkflowData, today = new Date()): Map<string, IndicatorStatus> {
  const out = new Map<string, IndicatorStatus>();
  const get = (specId: string) => {
    let s = out.get(specId);
    if (!s) {
      s = { owner: null, openRequest: null, overdue: false, pending: 0, lastUpdate: null, lastValidated: null, coverage: { national: false, regions: 0, councils: 0 } };
      out.set(specId, s);
    }
    return s;
  };
  for (const w of WORKFLOW_INDICATORS) get(w.spec.id);
  for (const a of data.assignments) get(a.specId).owner = a.institutionKey;
  // The oldest request still waiting for the institution (or for review) is the one that matters.
  const live = [...data.requests].filter((r) => r.status === 'open' || r.status === 'submitted').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const r of live) {
    const s = get(r.specId);
    if (!s.openRequest) s.openRequest = r;
    if (isOverdue(r, today)) s.overdue = true;
  }
  for (const sub of data.rawSubmissions) if (sub.status === 'pending') get(sub.specId).pending++;
  for (const v of data.rawValues) {
    const s = get(v.specId);
    if (!s.lastUpdate || v.at > s.lastUpdate) s.lastUpdate = v.at;
    if (v.level === 'national') s.coverage.national = true;
    else if (v.level === 'region') s.coverage.regions++;
    else s.coverage.councils++;
  }
  for (const v of data.validations) {
    const s = get(v.specId);
    if (!s.lastValidated || v.validatedAt > s.lastValidated.validatedAt) s.lastValidated = v;
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------ */
/* The entry sheet                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

export interface CurrentValue {
  raw: number | null;
  level: ValueLevel;
  /** Where it was recorded (region/council id, 'TZ', or the INFORM district for the baseline). */
  unitId?: string;
  at?: string;
  dataset?: string | null;
  institution?: string | null;
}

export interface SheetRow {
  unit: Unit;
  level: RawLevel;
  /** Region id, for councils. */
  parentId?: string;
  /** The approved value recorded for exactly this unit, if any. */
  own: RawValue | null;
  /** What applies here today (own value, else inherited, else the baseline); null when it varies or is unknown. */
  current: CurrentValue | null;
  /** Regions only: the baseline differs between the region's INFORM districts. */
  varies?: boolean;
}

export interface Sheet {
  national: SheetRow;
  regions: Array<SheetRow & { councils: SheetRow[] }>;
}

const fromRaw = (v: RawValue): CurrentValue => ({ raw: v.value, level: v.level, unitId: v.unitId, at: v.at, dataset: v.dataset ?? null, institution: v.institution ?? null });

export function buildSheet(model: RiskModel, spec: IndicatorSpec, idx: RawIndex, baseline: BaselineRaw | null): Sheet {
  const nationalOwn = idx.national.get(spec.id) ?? null;
  const national: SheetRow = { unit: model.national, level: 'national', own: nationalOwn, current: nationalOwn ? fromRaw(nationalOwn) : null };
  const regions = [...model.regions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((region) => {
      const own = idx.region.get(spec.id)?.get(region.id) ?? null;
      const members = (model.councilsByRegion.get(region.id.slice(2)) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
      const councils: SheetRow[] = members.map((c) => {
        const input = councilInput(idx, spec, c, baseline);
        const cOwn = idx.council.get(spec.id)?.get(c.id) ?? null;
        return {
          unit: c,
          level: 'council',
          parentId: region.id,
          own: cOwn,
          current: { raw: input.raw, level: input.level, unitId: input.unitId, at: input.at, dataset: input.dataset ?? null, institution: input.institution ?? null },
        };
      });
      let current: CurrentValue | null = own ? fromRaw(own) : nationalOwn ? fromRaw(nationalOwn) : null;
      let varies = false;
      if (!current) {
        const values = [...new Set(members.map((c) => baselineValue(baseline, spec.id, c.sourceId)))];
        if (values.length === 1 && isNum(values[0])) current = { raw: values[0], level: 'baseline' };
        else varies = values.some(isNum);
      }
      return { unit: region, level: 'region' as const, own, current, varies, councils };
    });
  return { national, regions };
}

/** Parse what someone typed in a sheet cell: a number, an explicit "no data", nothing, or garbage. */
export type CellParse = { kind: 'empty' } | { kind: 'value'; value: number } | { kind: 'noData' } | { kind: 'invalid' };
export function parseCell(text: string): CellParse {
  const s = text.trim();
  if (!s) return { kind: 'empty' };
  if (isNoDataToken(s)) return { kind: 'noData' };
  const v = parseRawNumber(s);
  return Number.isFinite(v) ? { kind: 'value', value: v } : { kind: 'invalid' };
}

/** Values far outside the indicator's reference range are allowed but flagged (a unit mistake is likely). */
export function rangeFlag(spec: IndicatorSpec, value: number | null): 'low' | 'high' | null {
  const range = naturalRange(spec);
  if (!range || !isNum(value)) return null;
  const [lo, hi] = range;
  const span = Math.max(hi - lo, Math.abs(hi) * 0.1, 1e-9);
  if (value < lo - span) return 'low';
  if (value > hi + span) return 'high';
  return null;
}

/** 0–10 preview of a measured value (null when it cannot be scored). */
export const previewScore = (spec: IndicatorSpec, value: number | null): number | null => scoreRaw(spec, value);

/** Entries to submit from the typed drafts (unit id → text). Unchanged and empty cells are skipped. */
export function draftEntries(sheet: Sheet, drafts: ReadonlyMap<string, string>): { entries: RawEntry[]; invalid: string[] } {
  const rows = new Map<string, SheetRow>([[sheet.national.unit.id, sheet.national]]);
  for (const r of sheet.regions) {
    rows.set(r.unit.id, r);
    for (const c of r.councils) rows.set(c.unit.id, c);
  }
  const entries: RawEntry[] = [];
  const invalid: string[] = [];
  for (const [unitId, text] of drafts) {
    const row = rows.get(unitId);
    if (!row) continue;
    const p = parseCell(text);
    if (p.kind === 'empty') continue;
    if (p.kind === 'invalid') {
      invalid.push(unitId);
      continue;
    }
    const value = p.kind === 'noData' ? null : p.value;
    const previous = row.own ? row.own.value : null;
    if (row.own && previous === value) continue;
    entries.push({ unitId, level: row.level, value, previous });
  }
  // National first, then regions, then councils: easy to read in review.
  const order: Record<RawLevel, number> = { national: 0, region: 1, council: 2 };
  entries.sort((a, b) => order[a.level] - order[b.level] || a.unitId.localeCompare(b.unitId));
  return { entries, invalid };
}

/** How many councils a set of entries reaches (a council's own value beats its region's, which beats national). */
export function councilsReached(model: RiskModel, idx: RawIndex, specId: string, entries: readonly RawEntry[]): number {
  const council = new Set(entries.filter((e) => e.level === 'council').map((e) => e.unitId));
  const region = new Set(entries.filter((e) => e.level === 'region').map((e) => e.unitId));
  const national = entries.some((e) => e.level === 'national');
  let n = 0;
  for (const c of model.councils) {
    if (council.has(c.id)) n++;
    else if (idx.council.get(specId)?.has(c.id)) continue;
    else if (region.has(regionIdOf(c))) n++;
    else if (idx.region.get(specId)?.has(regionIdOf(c))) continue;
    else if (national) n++;
  }
  return n;
}

/* ------------------------------------------------------------------------------------------------ */
/* What a submission would change                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export interface ImpactInputs {
  /** Direct 0–10 edits (approved). */
  explicit: Overrides;
  /** Approved measured values. */
  raw: readonly RawValue[];
  /** The model before any edit. */
  base: RiskModel;
  baseline: BaselineRaw | null;
  /** The model as it is now. */
  current: RiskModel;
}

/**
 * Councils whose scores would change if these measured values were approved, most-changed first. Runs
 * the real pipeline (measured values → groups → dimensions → risk) on the would-be data.
 */
export function rawImpact(inp: ImpactInputs, specId: string, entries: readonly RawEntry[], at = new Date().toISOString()): AffectedImpact[] {
  if (!entries.length) return [];
  const replaced = new Set(entries.map((e) => e.unitId));
  const nextRaw: RawValue[] = [
    ...inp.raw.filter((v) => !(v.specId === specId && replaced.has(v.unitId))),
    ...entries.map((e) => ({ specId, unitId: e.unitId, level: e.level, value: e.value, at })),
  ];
  const after = buildModel(mergeOverrides(inp.explicit, deriveRawOverrides(nextRaw, inp.base, inp.baseline), inp.base));
  const out: AffectedImpact[] = [];
  for (const c of inp.current.councils) {
    const next = after.byId.get(c.id);
    if (!next) continue;
    const before = summarise(c);
    const nextSummary = summarise(next);
    if (before.hazard !== nextSummary.hazard || before.vulnerability !== nextSummary.vulnerability || before.coping !== nextSummary.coping || before.risk !== nextSummary.risk)
      out.push({ unit: c, before, after: nextSummary });
  }
  return out.sort((a, b) => Math.abs((b.after.risk ?? 0) - (b.before.risk ?? 0)) - Math.abs((a.after.risk ?? 0) - (a.before.risk ?? 0)));
}

/* ------------------------------------------------------------------------------------------------ */
/* Paste from a spreadsheet                                                                           */
/* ------------------------------------------------------------------------------------------------ */

export type PasteMode = 'auto' | 'region' | 'council';
export type PasteIssue = 'unmatched' | 'ambiguous' | 'notNumber' | 'noValue' | 'duplicate';

export interface PasteLine {
  lineNo: number;
  text: string;
  unit: Unit | null;
  level: RawLevel | null;
  /** The cell text for the sheet (a number, or a no-data token). */
  cell: string;
  issue?: PasteIssue;
  suggestion?: Unit | null;
}

const NATIONAL_NAMES = new Set(['tanzania', 'unitedrepublicoftanzania', 'national', 'nationwide', 'taifa', 'kitaifa', 'nchinzima', 'tz']);
const HEADER_WORDS = /\b(region|mkoa|council|halmashauri|district|wilaya|value|thamani|name|jina|unit|area|eneo)\b/i;

/**
 * Parse "name <tab | ; , > value" lines. In auto mode a name that is exactly a region is a region, a
 * national name is the country, anything else is matched against councils ("Arusha City", "Jiji la
 * Arusha"…). With two name columns (region, council) the council is used.
 */
export function parseRawPaste(text: string, model: RiskModel, mode: PasteMode = 'auto'): PasteLine[] {
  const regionIdx = buildRegionIndex(model.regions);
  const councilIdx = buildCouncilIndex(model.councils);
  const lines = text.replace(/\r/g, '').split('\n');
  const out: PasteLine[] = [];
  const seen = new Map<string, PasteLine>();
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const { names, token } = splitLine(raw);
    // Skip a header row ("Region	Value").
    if (!out.length && names.length && !Number.isFinite(parseRawNumber(token)) && !isNoDataToken(token) && HEADER_WORDS.test(line)) return;
    const base: PasteLine = { lineNo: i + 1, text: line, unit: null, level: null, cell: token.trim() };
    if (!names.length) {
      out.push({ ...base, issue: 'unmatched' });
      return;
    }
    const last = names[names.length - 1];
    let unit: Unit | null = null;
    let level: RawLevel | null = null;
    let suggestion: Unit | null = null;
    let ambiguous = false;
    if (mode !== 'council' && names.length === 1 && NATIONAL_NAMES.has(normaliseName(last).replace(/\s+/g, ''))) {
      unit = model.national;
      level = 'national';
    } else if (mode === 'region' || (mode === 'auto' && names.length === 1)) {
      const m = regionIdx.match(last);
      if (m.kind === 'match') {
        unit = m.unit;
        level = 'region';
      } else if (mode === 'region') suggestion = m.kind === 'none' ? m.suggestion : null;
    }
    if (!unit && mode !== 'region') {
      const m = councilIdx.match(last);
      if (m.kind === 'match') {
        unit = m.unit;
        level = 'council';
      } else if (m.kind === 'ambiguous') ambiguous = true;
      else suggestion = suggestion ?? m.suggestion;
    }
    const line_: PasteLine = { ...base, unit, level, suggestion };
    if (!unit) line_.issue = ambiguous ? 'ambiguous' : 'unmatched';
    else if (!token.trim()) line_.issue = 'noValue';
    else if (!isNoDataToken(token) && !Number.isFinite(parseRawNumber(token))) line_.issue = 'notNumber';
    if (unit && !line_.issue) {
      const prev = seen.get(unit.id);
      if (prev) prev.issue = 'duplicate';
      seen.set(unit.id, line_);
    }
    out.push(line_);
  });
  return out;
}

/** The unit id a sheet uses for national rows. */
export const NATIONAL_UNIT_ID = NATIONAL_ID;
