/**
 * Bulk paste: parse "name <TAB , ; |> value" lines (or values only, in template order) copied from a
 * spreadsheet, match the names against the model's councils/regions, and resolve every value onto the
 * unit that must receive it - councils for Hazard & exposure, their distinct INFORM source units for
 * Vulnerability & Coping (deduplicated; disagreeing values for one source unit are a conflict).
 */
import type { EditRef, RiskModel, Unit } from '@/engine/risk/types';
import { buildCouncilIndex, buildRegionIndex, type MatchResult, type NameIndex } from './names';
import { parseScoreInput, sameScore } from './scores';
import { currentValue, EXPOSURE_REF, targetKind } from './targets';

export type PasteLevel = 'council' | 'region' | 'nation';
export type RowError = 'empty' | 'notNumber' | 'range';

export interface PasteRow {
  /** 1-based line number in the pasted text. */
  lineNo: number;
  text: string;
  /** Name columns (empty for a values-only line). */
  names: string[];
  /** 0–10 score, or null for "no data". */
  value: number | null;
  rounded: boolean;
  error?: RowError;
}

export interface ParsedPaste {
  rows: PasteRow[];
  /** Line number of a detected header row (skipped), if any. */
  headerLine: number | null;
}

const VALUE_ONLY_RE = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
const DIGITS_RE = /^\d+$/;
const NO_DATA = new Set(['na', 'n/a', 'n.a.', 'nodata', 'no-data', 'null', 'none', '-', '—', '–', 'hakunadata', 'nd']);
export const isNoDataToken = (s: string) => NO_DATA.has(s.trim().toLowerCase().replace(/\s+/g, ''));

/** Split cells; trailing empty cells (spreadsheet padding) are dropped - a lone name means "no value". */
function splitCells(line: string, sep: RegExp): { names: string[]; token: string } {
  const parts = line.split(sep).map((s) => s.trim());
  let end = parts.length;
  while (end > 0 && parts[end - 1] === '') end--;
  const cells = parts.slice(0, end);
  if (cells.length <= 1) return { names: cells.filter(Boolean), token: '' };
  return { names: cells.slice(0, -1).filter(Boolean), token: cells[cells.length - 1] };
}

/** Split one line into its name cell(s) and the value token. */
export function splitLine(line: string): { names: string[]; token: string } {
  const s = line.trim();
  if (VALUE_ONLY_RE.test(s) || isNoDataToken(s)) return { names: [], token: s };
  if (line.includes('\t')) return splitCells(line.replace(/[\r\n]/g, ''), /\t/);
  if (/[;|]/.test(s)) return splitCells(s, /[;|]/);
  if (s.includes(',')) {
    const raw = s.split(',');
    const n = raw.length;
    // "Kondoa, 6,5" - a decimal comma after a separator comma.
    if (n >= 3 && DIGITS_RE.test(raw[n - 2].trim()) && DIGITS_RE.test(raw[n - 1]) && !/^\s/.test(raw[n - 1])) {
      return { names: raw.slice(0, n - 2).map((x) => x.trim()).filter(Boolean), token: `${raw[n - 2].trim()},${raw[n - 1]}` };
    }
    return splitCells(s, /,/);
  }
  const ws = s.match(/^(.*\S)\s+(\S+)$/);
  if (ws) return { names: [ws[1].trim()], token: ws[2] };
  return { names: [], token: s };
}

/** Parse pasted text into rows. Blank lines and `#` comments are skipped; a non-numeric first line is a header. */
export function parsePasteText(text: string): ParsedPaste {
  const rows: PasteRow[] = [];
  let headerLine: number | null = null;
  const lines = String(text ?? '').split(/\r\n|\r|\n/);
  lines.forEach((line, i) => {
    const s = line.trim();
    if (!s || s.startsWith('#')) return;
    const { names, token } = splitLine(line);
    const lineNo = i + 1;
    if (!token) {
      rows.push({ lineNo, text: s, names, value: null, rounded: false, error: 'empty' });
      return;
    }
    if (isNoDataToken(token)) {
      rows.push({ lineNo, text: s, names, value: null, rounded: false });
      return;
    }
    const parsed = parseScoreInput(token, { allowRounding: true });
    if (parsed.kind === 'ok') {
      rows.push({ lineNo, text: s, names, value: parsed.value, rounded: parsed.rounded });
      return;
    }
    if (parsed.kind === 'error' && parsed.code === 'notNumber' && rows.length === 0 && headerLine == null) {
      headerLine = lineNo;
      return;
    }
    rows.push({ lineNo, text: s, names, value: null, rounded: false, error: parsed.kind === 'error' && parsed.code === 'range' ? 'range' : 'notNumber' });
  });
  return { rows, headerLine };
}

/* ------------------------------------------------------------------------------------------------ */
/* Plan                                                                                               */
/* ------------------------------------------------------------------------------------------------ */

export type PasteIssueKind = RowError | 'unmatched' | 'ambiguous' | 'missingName' | 'duplicate' | 'extraValue' | 'tooManyValues' | 'noDataNotAllowed';

export interface PasteIssue {
  lineNo: number;
  text: string;
  kind: PasteIssueKind;
  severity: 'error' | 'warning';
  suggestion?: string;
  candidates?: string[];
}

export type TargetStatus = 'ready' | 'unchanged' | 'conflict';

export interface PlanTarget {
  unitId: string;
  unitName: string;
  region: string;
  level: 'council' | 'source';
  value: number | null;
  previous: number | null;
  /** Councils whose pasted value resolved onto this target. */
  via: string[];
  lineNos: number[];
  status: TargetStatus;
  /** Matched by the bare base name only (e.g. "Mpwapwa" → Mpwapwa District). */
  loose: boolean;
  rounded: boolean;
  /** Disagreeing pasted values (conflict only). */
  conflictValues?: Array<number | null>;
}

export interface PastePlan {
  rowCount: number;
  headerLine: number | null;
  positional: boolean;
  targets: PlanTarget[];
  issues: PasteIssue[];
  /** Targets that will be submitted. */
  ready: PlanTarget[];
}

interface Assignment {
  council: Unit;
  value: number | null;
  lineNo: number;
  loose: boolean;
  rounded: boolean;
}

function matchRow(index: NameIndex, names: string[]): MatchResult {
  const tries = [names.join(' '), ...[...names].reverse()];
  let ambiguous: MatchResult | null = null;
  for (const n of tries) {
    if (!n.trim()) continue;
    const r = index.match(n);
    if (r.kind === 'match') return r;
    if (r.kind === 'ambiguous') ambiguous ??= r;
  }
  return ambiguous ?? index.match(names.join(' '));
}

/** Resolve pasted text for one indicator at one level into submission targets and issues. */
export function buildPastePlan(text: string, level: PasteLevel, ref: EditRef, model: RiskModel): PastePlan {
  const { rows, headerLine } = parsePasteText(text);
  const issues: PasteIssue[] = [];
  const valid: PasteRow[] = [];
  for (const r of rows) {
    if (r.error) issues.push({ lineNo: r.lineNo, text: r.text, kind: r.error, severity: 'error' });
    else if (r.value === null && ref === EXPOSURE_REF) issues.push({ lineNo: r.lineNo, text: r.text, kind: 'noDataNotAllowed', severity: 'error' });
    else valid.push(r);
  }

  const assign = new Map<string, Assignment>();
  const put = (councils: readonly Unit[], row: PasteRow, loose: boolean) => {
    for (const council of councils) assign.set(council.id, { council, value: row.value, lineNo: row.lineNo, loose, rounded: row.rounded });
  };
  const councilsOfRegion = (region: Unit) => model.councils.filter((c) => c.region === region.name);
  const positional = level !== 'nation' && valid.length > 0 && valid.every((r) => r.names.length === 0);

  if (level === 'nation') {
    const [first, ...rest] = valid;
    if (first) put(model.councils, first, false);
    for (const r of rest) issues.push({ lineNo: r.lineNo, text: r.text, kind: 'extraValue', severity: 'warning' });
  } else if (positional) {
    const list = level === 'council' ? model.councils : model.regions;
    valid.forEach((r, i) => {
      const unit = list[i];
      if (!unit) issues.push({ lineNo: r.lineNo, text: r.text, kind: 'tooManyValues', severity: 'error' });
      else put(level === 'council' ? [unit] : councilsOfRegion(unit), r, false);
    });
  } else {
    const index = level === 'council' ? buildCouncilIndex(model.councils) : buildRegionIndex(model.regions);
    const seen = new Map<string, number>();
    for (const r of valid) {
      if (!r.names.length) {
        issues.push({ lineNo: r.lineNo, text: r.text, kind: 'missingName', severity: 'error' });
        continue;
      }
      const m = matchRow(index, r.names);
      if (m.kind === 'ambiguous') {
        issues.push({ lineNo: r.lineNo, text: r.text, kind: 'ambiguous', severity: 'error', candidates: m.candidates.map((c) => c.name) });
        continue;
      }
      if (m.kind === 'none') {
        issues.push({ lineNo: r.lineNo, text: r.text, kind: 'unmatched', severity: 'error', suggestion: m.suggestion?.name });
        continue;
      }
      if (seen.has(m.unit.id)) issues.push({ lineNo: r.lineNo, text: r.text, kind: 'duplicate', severity: 'warning', suggestion: m.unit.name });
      seen.set(m.unit.id, r.lineNo);
      put(level === 'council' ? [m.unit] : councilsOfRegion(m.unit), r, m.how === 'base');
    }
  }

  // Resolve councils onto edit targets.
  const targets: PlanTarget[] = [];
  if (targetKind(ref) === 'council') {
    for (const a of assign.values()) {
      const previous = currentValue(a.council, ref);
      targets.push({
        unitId: a.council.id,
        unitName: a.council.name,
        region: a.council.region,
        level: 'council',
        value: a.value,
        previous,
        via: [a.council.name],
        lineNos: [a.lineNo],
        status: sameScore(previous, a.value) ? 'unchanged' : 'ready',
        loose: a.loose,
        rounded: a.rounded,
      });
    }
  } else {
    const bySource = new Map<string, Assignment[]>();
    for (const a of assign.values()) {
      const sid = a.council.sourceId ?? a.council.id;
      if (!bySource.has(sid)) bySource.set(sid, []);
      bySource.get(sid)!.push(a);
    }
    for (const [sid, list] of bySource) {
      const unit = model.byId.get(sid) ?? list[0].council;
      const distinct: Array<number | null> = [];
      for (const a of list) if (!distinct.some((d) => sameScore(d, a.value))) distinct.push(a.value);
      const value = list[list.length - 1].value;
      const previous = currentValue(unit, ref);
      targets.push({
        unitId: sid,
        unitName: unit.name,
        region: unit.region || list[0].council.region,
        level: 'source',
        value,
        previous,
        via: list.map((a) => a.council.name),
        lineNos: [...new Set(list.map((a) => a.lineNo))],
        status: distinct.length > 1 ? 'conflict' : sameScore(previous, value) ? 'unchanged' : 'ready',
        loose: list.some((a) => a.loose),
        rounded: list.some((a) => a.rounded),
        ...(distinct.length > 1 ? { conflictValues: distinct } : {}),
      });
    }
  }

  issues.sort((a, b) => a.lineNo - b.lineNo);
  return { rowCount: rows.length, headerLine, positional, targets, issues, ready: targets.filter((t) => t.status === 'ready') };
}
