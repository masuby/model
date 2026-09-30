/**
 * build-baseline-raw.mjs: the INFORM baseline MEASURED values (natural units) for every district, per
 * workbook indicator, so institutions see today's figure next to the one they enter, and so an
 * indicator group can be recomputed when only some of its indicators receive new data.
 *
 * Source: the Tanzania INFORM country-model workbook (INFORM Sub-national SADC 2024), extracted to
 * src/engine/risk/__tests__/fixtures/pipeline.fixture.json (170 districts × every used indicator; the
 * golden tests prove these values reproduce the workbook's scores). Output is compact: one array per
 * indicator, in the order of `units` (district codes, TZxxxx).
 *
 *   node scripts/build-baseline-raw.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const fixture = read('src/engine/risk/__tests__/fixtures/pipeline.fixture.json');
const dataset = read('src/data/tanzania-inform-risk.json');
const spec = read('src/data/inform-indicator-spec.json');

const key = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
// The workbook truncates one district name.
const ALIASES = { butiam: 'butiama' };
const codeByName = new Map(dataset.subnational.adm2.map((u) => [key(u.admin.adm2Name), u.admin.adm2Code]));

const used = Object.values(spec)
  .filter((s) => s.use === 'Yes')
  .map((s) => s.id);

const units = [];
const values = Object.fromEntries(used.map((id) => [id, []]));
for (const entry of fixture) {
  const k = key(entry.district);
  const code = codeByName.get(ALIASES[k] ?? k);
  if (!code) throw new Error(`No district code for "${entry.district}"`);
  units.push(code);
  for (const id of used) {
    const v = entry.raw[id];
    values[id].push(typeof v === 'number' && Number.isFinite(v) ? v : null);
  }
}
if (new Set(units).size !== units.length) throw new Error('Duplicate district codes');

const out = {
  source: 'INFORM Sub-national SADC 2024, Tanzania country-model workbook (measured values per district)',
  units,
  values,
};
const file = path.join(root, 'src/data/inform-baseline-raw.json');
fs.writeFileSync(file, JSON.stringify(out) + '\n');
console.log(`${path.relative(root, file)}: ${units.length} districts × ${used.length} indicators, ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
