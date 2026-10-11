/**
 * verify-advanced-tool.ts - compare the ADVANCED tool's component preview with the engine (issue
 * TOOL-02). The benchmark workbook is recalculated by LibreOffice (the runner does that) and its
 * 'Components' sheet is read cell by cell: for every council and every basket, the tool's component
 * value must equal the Advancement value the engine computes for that council
 * (buildAdvancedModel over src/data/tanzania-advanced-inputs.json), to one decimal.
 *
 * Bundled and run by scripts/verify-advanced-tool.mjs; the recalculated workbook path comes in RECALC.
 */
import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import inputsJson from '@/data/tanzania-advanced-inputs.json';
import { ADVANCEMENT_BASKETS, buildAdvancedModel, type AdvancedInputs } from '@/engine/risk/advanced';
import { buildModel, indicatorValue } from '@/engine/risk/model';

const path = process.env.RECALC;
if (!path) throw new Error('RECALC=<recalculated workbook> is required');
const inputs = inputsJson as unknown as AdvancedInputs;
const core = buildModel();
const advanced = buildAdvancedModel(core, inputs);

const wb = XLSX.read(readFileSync(path), { type: 'buffer' });
const ws = wb.Sheets['Components'];
const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(ws, { header: 1, blankrows: true });
// The column titles sit on the row that starts with Region, Council, Code (row 10 of the sheet).
const HEADR = rows.findIndex((r) => String(r[0] ?? '') === 'Region' && String(r[1] ?? '') === 'Council' && String(r[2] ?? '') === 'Code');
if (HEADR < 0) throw new Error("the 'Components' sheet has no title row (Region, Council, Code)");
const header = rows[HEADR].map((h) => String(h ?? ''));
const colOf = new Map<string, number>();
header.forEach((h, i) => colOf.set(h, i));

const byComponent = new Map(ADVANCEMENT_BASKETS.map((b) => [b.component, b]));
let compared = 0;
let agree = 0;
const mismatches: string[] = [];
for (const row of rows.slice(HEADR + 1)) {
  const code = String(row[2] ?? '');
  const unit = advanced.byId.get(code);
  if (!unit) continue;
  for (const [component, basket] of byComponent) {
    const col = colOf.get(component);
    if (col == null) {
      mismatches.push(`${component}: no column in the tool`);
      continue;
    }
    const cell = row[col];
    // The tool leaves the component blank when no sub-indicator has data: the engine then keeps the Core value.
    const stamp = unit.edits[basket.ref];
    const engine = stamp && stamp.authority === 'CHC' ? (indicatorValue(unit, basket.dim, basket.key) ?? null) : null;
    const tool = typeof cell === 'number' ? Math.round(cell * 10) / 10 : null;
    compared++;
    if (tool === engine || (tool != null && engine != null && Math.abs(tool - engine) < 0.051)) agree++;
    else mismatches.push(`${code} ${unit.name} · ${component}: tool ${tool} vs engine ${engine}`);
  }
}
console.log(`compared ${compared} component cells over ${advanced.councils.length} councils and ${byComponent.size} baskets: ${agree} agree, ${mismatches.length} differ`);
for (const m of mismatches.slice(0, 25)) console.log('  ' + m);
if (mismatches.length) process.exitCode = 1;
