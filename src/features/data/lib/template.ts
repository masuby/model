/**
 * The per-institution template (DE-03): one CSV with a row for every indicator the institution keeps and
 * every area (the country, each region, each council), carrying the value that applies today, a column
 * for the new value, the value type (measured value or 0-10 score by the INFORM method) and the source.
 * The same file comes back by upload: `parseTemplate` reads it into one submission per indicator, with
 * every problem named by row, so an institution without connectivity can work offline and round-trip.
 */
import type { RawEntry, RawValueType } from '@/data-layer/types';
import type { RawLevel } from '@/engine/risk/rawValues';
import { scoreable } from '@/engine/risk/rawValues';
import type { IndicatorSpec } from '@/engine/risk/standardise';
import type { RiskModel } from '@/engine/risk/types';
import { isNoDataToken } from './paste';
import type { Sheet } from './workflow';

export const TEMPLATE_COLUMNS = ['indicator_id', 'indicator', 'unit_of_measure', 'area_id', 'area', 'level', 'current_value', 'current_level', 'new_value', 'value_type', 'source'] as const;
type Column = (typeof TEMPLATE_COLUMNS)[number];

export interface TemplateInput {
  spec: IndicatorSpec;
  sheet: Sheet;
}

const current = (row: Sheet['national']): [string, string] => {
  const c = row.current;
  if (!c) return ['', ''];
  if (c.valueType === 'score') return [c.score == null ? '' : String(c.score), `score · ${c.level}`];
  return [c.raw == null ? '' : String(c.raw), c.level];
};

/** The rows of the template: a header and one row per indicator and area (country, regions, councils). */
export function templateRows(inputs: readonly TemplateInput[], names: { national: string; region: string; council: string }): string[][] {
  const rows: string[][] = [[...TEMPLATE_COLUMNS]];
  for (const { spec, sheet } of inputs) {
    const base = [spec.id, spec.name ?? spec.id, spec.unit ?? ''];
    const push = (row: Sheet['national'], level: string) => {
      const [value, at] = current(row);
      rows.push([...base, row.unit.id, row.unit.name, level, value, at, '', 'raw', '']);
    };
    push(sheet.national, names.national);
    for (const r of sheet.regions) {
      push(r, names.region);
      for (const c of r.councils) push(c, names.council);
    }
  }
  return rows;
}

/** Parse RFC-4180 CSV (quotes, doubled quotes, newlines inside quotes, CRLF, a BOM). */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    out.push(row);
  }
  return out;
}

export type TemplateIssueKind = 'unknownIndicator' | 'unknownArea' | 'levelMismatch' | 'notNumber' | 'scoreRange' | 'mixedTypes' | 'sourceMissing' | 'duplicate' | 'notScoreable';
export interface TemplateIssue {
  /** 1-based line of the file. */
  line: number;
  kind: TemplateIssueKind;
  detail: string;
}
export interface TemplateSubmission {
  specId: string;
  valueType: RawValueType;
  source: string | null;
  entries: RawEntry[];
}
export interface ParsedTemplate {
  submissions: TemplateSubmission[];
  issues: TemplateIssue[];
  /** Data rows read (after the header). */
  rows: number;
  /** Rows with a new value. */
  filled: number;
}

const LEVEL_OF = (id: string): RawLevel | null => (id === 'TZ' ? 'national' : /^R-/.test(id) ? 'region' : /^C\d{3}$/.test(id) ? 'council' : null);

/**
 * Read a filled template back. Rows without a new value are skipped; "n/a" or "no data" records an
 * explicit no-data; every row of one indicator must carry the same value type, and a score needs a
 * source on at least one of its rows and an indicator the workbook can score.
 */
export function parseTemplate(text: string, model: RiskModel, specs: Readonly<Record<string, IndicatorSpec>>): ParsedTemplate {
  const table = parseCsv(text);
  const headerAt = table.findIndex((r) => r.map((c) => c.trim().toLowerCase()).includes('indicator_id'));
  const issues: TemplateIssue[] = [];
  if (headerAt < 0) return { submissions: [], issues: [{ line: 1, kind: 'unknownIndicator', detail: 'indicator_id' }], rows: 0, filled: 0 };
  const header = table[headerAt].map((c) => c.trim().toLowerCase());
  const col = (name: Column) => header.indexOf(name);
  const get = (row: string[], name: Column) => (col(name) >= 0 ? (row[col(name)] ?? '').trim() : '');

  const bySpec = new Map<string, { types: Set<RawValueType>; sources: Set<string>; entries: Map<string, RawEntry> }>();
  let rows = 0;
  let filled = 0;
  for (let i = headerAt + 1; i < table.length; i++) {
    const row = table[i];
    if (!row.some((c) => c.trim())) continue;
    rows++;
    const line = i + 1;
    const specId = get(row, 'indicator_id');
    const spec = specs[specId];
    if (!spec) {
      issues.push({ line, kind: 'unknownIndicator', detail: specId });
      continue;
    }
    const raw = get(row, 'new_value');
    if (!raw) continue;
    const areaId = get(row, 'area_id');
    const unit = model.byId.get(areaId);
    const level = LEVEL_OF(areaId);
    if (!unit || !level || (level === 'national' ? unit.level !== 'national' : unit.level !== level)) {
      issues.push({ line, kind: 'unknownArea', detail: areaId || get(row, 'area') });
      continue;
    }
    const type: RawValueType = get(row, 'value_type').toLowerCase() === 'score' ? 'score' : 'raw';
    let value: number | null;
    if (isNoDataToken(raw)) value = null;
    else {
      const n = Number(raw.replace(/\s/g, '').replace(/,/g, ''));
      if (!Number.isFinite(n)) {
        issues.push({ line, kind: 'notNumber', detail: raw });
        continue;
      }
      if (type === 'score' && (n < 0 || n > 10)) {
        issues.push({ line, kind: 'scoreRange', detail: raw });
        continue;
      }
      value = type === 'score' ? Math.round(n * 10) / 10 : n;
    }
    const acc = bySpec.get(specId) ?? { types: new Set<RawValueType>(), sources: new Set<string>(), entries: new Map<string, RawEntry>() };
    if (acc.entries.has(areaId)) {
      issues.push({ line, kind: 'duplicate', detail: `${specId} ${areaId}` });
      continue;
    }
    acc.types.add(type);
    const source = get(row, 'source');
    if (source) acc.sources.add(source);
    acc.entries.set(areaId, { unitId: areaId, level, value });
    bySpec.set(specId, acc);
    filled++;
  }

  const submissions: TemplateSubmission[] = [];
  for (const [specId, acc] of bySpec) {
    if (acc.types.size > 1) {
      issues.push({ line: 0, kind: 'mixedTypes', detail: specId });
      continue;
    }
    const valueType = [...acc.types][0] ?? 'raw';
    const source = [...acc.sources].join('; ') || null;
    if (valueType === 'score') {
      if (!scoreable(specs[specId])) {
        issues.push({ line: 0, kind: 'notScoreable', detail: specId });
        continue;
      }
      if (!source) {
        issues.push({ line: 0, kind: 'sourceMissing', detail: specId });
        continue;
      }
    }
    submissions.push({ specId, valueType, source, entries: [...acc.entries.values()] });
  }
  return { submissions, issues, rows, filled };
}
