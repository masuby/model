// Build-time: snapshot the authentic Tanzania INFORM Excel into a bundled JSON.
// Source of truth = the .xlsx; this JSON is a generated artifact (do not hand-edit).
// Run: node scripts/generate-risk-json.mjs
import { writeFile, readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import { transformWorkbook } from '../src/services/informRiskDataService.js';

const SRC = 'data-source/tanzania-inform-risk.xlsx';
const OUT = 'src/data/tanzania-inform-risk.json';

const buf = await readFile(SRC);
const workbook = XLSX.read(buf, { type: 'buffer' });
const data = transformWorkbook(workbook);
if (!data?.national?.risk) throw new Error('Parse produced no national.risk — aborting');
await writeFile(OUT, JSON.stringify(data));
console.log(`✓ ${OUT} — national risk ${data.national.risk}, units ${data.metadata?.totalUnits}`);
