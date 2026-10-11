/**
 * Import of a filled collection tool (inform_sheets/INFORM_TZ_Collection_*.xlsx): the 'Council Entry'
 * sheet, one row per council (Region, Council, Code, then one column per indicator named in row 1),
 * becomes the rows of the CSV template the portal already reads (template.ts), so a filled tool enters
 * the review queue exactly as a filled template does: one pending submission per indicator, every
 * problem listed before anything is sent.
 */
import type { IndicatorSpec } from '@/engine/risk/standardise';
import type { Cell } from './xlsx-lite';
import { TEMPLATE_COLUMNS } from './template';

export interface ToolImport {
  /** CSV-shaped rows (header first) for parseTemplate. */
  rows: string[][];
  /** Indicator columns matched to a specification. */
  indicators: string[];
  /** Column headings that matched no indicator (ignored). */
  unknown: string[];
  /** Indicators found in the sheet but outside the allowed set (ignored). */
  skipped: string[];
  /** Council rows read. */
  councils: number;
  /** Cells with a value. */
  values: number;
}

const key = (s: unknown): string =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Convert the sheet's rows. `allowed` restricts the indicators (an institution's own); `defaultSource`
 * is written on every row so that deposited scores keep a citable source (measured values carry none).
 */
export function toolToTemplateRows(sheet: Cell[][], specs: Readonly<Record<string, IndicatorSpec>>, allowed: ReadonlySet<string> | null, defaultSource = ''): ToolImport {
  const byName = new Map<string, string>();
  for (const s of Object.values(specs)) if (s.use === 'Yes' && s.name) byName.set(key(s.name), s.id);
  const header = sheet.findIndex((r) => key(r[2]) === 'code' && key(r[1]) === 'council');
  if (header < 0 || !sheet.length) return { rows: [[...TEMPLATE_COLUMNS]], indicators: [], unknown: ['Council Entry'], skipped: [], councils: 0, values: 0 };
  // Indicator names are in row 1 (the tool's spec rows); the header row repeats them.
  const names = sheet[0] ?? [];
  const columns: Array<{ col: number; specId: string }> = [];
  const unknown: string[] = [];
  const skipped: string[] = [];
  for (let col = 3; col < Math.max(names.length, sheet[header].length); col++) {
    const name = names[col] ?? sheet[header][col];
    if (name == null || String(name).trim() === '') continue;
    const specId = byName.get(key(name));
    if (!specId) {
      unknown.push(String(name));
      continue;
    }
    if (allowed && !allowed.has(specId)) {
      skipped.push(specId);
      continue;
    }
    columns.push({ col, specId });
  }
  const rows: string[][] = [[...TEMPLATE_COLUMNS]];
  let councils = 0;
  let values = 0;
  for (let i = header + 1; i < sheet.length; i++) {
    const r = sheet[i];
    const code = String(r[2] ?? '').trim();
    if (!/^C\d{3}$/.test(code)) continue;
    councils++;
    for (const { col, specId } of columns) {
      const v = r[col];
      if (v == null || v === '') continue;
      const spec = specs[specId];
      rows.push([specId, spec?.name ?? specId, spec?.unit ?? '', code, String(r[1] ?? ''), 'council', '', '', typeof v === 'boolean' ? (v ? '1' : '0') : String(v), 'raw', defaultSource]);
      values++;
    }
  }
  return { rows, indicators: columns.map((c) => c.specId), unknown, skipped, councils, values };
}

/** Serialise rows back to CSV text for parseTemplate (which reads CSV). */
export function rowsToCsv(rows: string[][]): string {
  const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return rows.map((r) => r.map(cell).join(',')).join('\n');
}
