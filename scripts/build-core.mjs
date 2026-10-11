/**
 * build-core.mjs - the ONE deterministic build of the Core dataset.
 *
 *   Core = the authentic INFORM SADC 2024 workbook for Tanzania, nothing else. Every scoring value of the
 *   170 units is copied from the workbook's main sheet; no refill, overlay, grade, computed index or
 *   precautionary floor touches it. Tanzanian improvements belong to the Advancement layer, which is
 *   computed separately from its own inputs and shown as its own view.
 *
 * What this script attaches, for display only (never used in a score):
 *   • facilities   2022 census facility counts per unit            data-source/facilities_by_unit.json
 *   • exposure     2022 census population, density and area        data-source/exposure_by_unit.json
 *   • drr          DRM arrangements and committee criteria          data-source/drr_status.csv
 *                  (EPRP, RVCA, AA, ERT, EOCC, DRR training; committee active, stakeholder collaboration,
 *                  involvement in DRR), the PMO-DMD lists; the councils' values are in the Benchmark 2026
 * and, for the 195 councils, their census population and polygon area data-source/council_climate.csv.
 *
 * Outputs: src/data/tanzania-inform-risk.json, src/data/tanzania-councils-exposure.json
 * Run:     node scripts/build-core.mjs            (idempotent; the output depends only on the inputs)
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { transformWorkbook } from './lib/informRiskDataService.js';

const WORKBOOK = 'data-source/tanzania-inform-risk.xlsx';
const OUT = 'src/data/tanzania-inform-risk.json';
const OUT_COUNCILS = 'src/data/tanzania-councils-exposure.json';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const num = (x) => {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
};
/** One CSV line into fields: commas inside double quotes are kept, doubled quotes unescaped. */
function splitCsv(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
function readCsv(path) {
  const lines = readFileSync(path, 'utf8').trim().split('\n');
  const cols = splitCsv(lines[0]);
  return lines.slice(1).map((ln) => {
    const v = splitCsv(ln.replace(/\r$/, ''));
    return Object.fromEntries(cols.map((c, i) => [c, v[i]]));
  });
}

// 1. The workbook, exactly.
const buf = readFileSync(WORKBOOK);
const sha256 = createHash('sha256').update(buf).digest('hex');
const data = transformWorkbook(XLSX.read(buf, { type: 'buffer' }));
const units = data.subnational.adm2;
if (units.length !== 170) throw new Error(`expected 170 workbook units, parsed ${units.length}`);

// The workbook misspells one unit name ('Butiam' for Butiama District Council). The name is display
// metadata, not a score, so it is corrected here and recorded; the P-code and every value stay as they are.
const NAME_CORRECTIONS = { Butiam: 'Butiama' };
for (const u of units) if (NAME_CORRECTIONS[u.admin.adm2Name]) u.admin.adm2Name = NAME_CORRECTIONS[u.admin.adm2Name];

// 2. Display metadata from vendored files.
const facilities = JSON.parse(readFileSync('data-source/facilities_by_unit.json', 'utf8')).units;
const exposure = JSON.parse(readFileSync('data-source/exposure_by_unit.json', 'utf8')).units;
const drr = readCsv('data-source/drr_status.csv');
const drrDistrict = new Map(drr.filter((r) => r.level === 'district').map((r) => [`${norm(r.name)}|${norm(r.region)}`, r]));
const drrRegion = new Map(drr.filter((r) => r.level === 'region').map((r) => [norm(r.region), r]));

let nFac = 0, nExp = 0, nDrr = 0;
for (const u of units) {
  const code = u.admin.adm2Code;
  const f = facilities[code];
  if (f) {
    u.facilities = { health: f.health, education: f.education, water: f.water, boreholes: f.boreholes };
    nFac++;
  }
  const e = exposure[code];
  if (e) {
    u.hazardExposure.exposure = { population: e.population, density: e.density, areaKm2: e.areaKm2, _src: 'NBS 2022 PHC' };
    nExp++;
  }
  // Display flags of the workbook unit: the district's plan, assessment and anticipatory action, the
  // region's team, centre and training; a committee criterion only where it was assessed ('1' or '0').
  const d = drrDistrict.get(`${norm(u.admin.adm2Name)}|${norm(u.admin.adm1Name)}`);
  const r = drrRegion.get(norm(u.admin.adm1Name));
  const yes = (x) => x === '1';
  const assessed = (x) => (x === '1' ? true : x === '0' ? false : undefined);
  const flags = { eprp: yes(d?.eprp), aa: yes(d?.aa), eocc: yes(r?.eocc), ert: yes(r?.ert), rvca: yes(d?.rvca), training: yes(r?.training) || yes(d?.training) };
  if (d?.eprp_year) flags.eprpYear = Number(d.eprp_year);
  if (d?.rvca_year) flags.rvcaYear = Number(d.rvca_year);
  for (const k of ['committee', 'stakeholders', 'involvement']) {
    const v = assessed(d?.[k]) ?? assessed(r?.[k]);
    if (v !== undefined) flags[k] = v;
  }
  if (Object.values(flags).some((v) => v === true)) {
    u.drr = flags;
    nDrr++;
  }
}

// The boundary set the council level is built on (issue ADM-04): recorded in the data, shown on the
// Methodology page, changed only through data-source/BOUNDARIES.md.
const registry = readCsv('data-source/council_registry.csv');
const boundaries = {
  set: 'NBS 2022 Population and Housing Census administrative units (PO-RALG gazetted councils; OCGS for Zanzibar)',
  councils: registry.length,
  regions: new Set(registry.map((r) => r.reg_code)).size,
  districts: new Set(registry.map((r) => `${r.reg_code}|${r.dist_code}`)).size,
  registry: 'data-source/council_registry.csv',
  procedure: 'data-source/BOUNDARIES.md',
};

data.metadata = {
  release: 'core-2026.10',
  boundaries,
  layer: 'core',
  source: 'Tanzania - Country Model Template.xlsx (INFORM Sub-national SADC 2024, release December 2024 v1.0)',
  sourceSha256: sha256,
  totalUnits: units.length,
  asOf: '2024-12',
  built: new Date().toISOString(),
  nameCorrections: NAME_CORRECTIONS,
  note: 'Scoring values are the workbook values, unchanged. facilities, exposure and drr are display metadata from vendored census and PMO-DMD files. The national block is the INFORM aggregate of the 170 units, for reference; the app aggregates the 195 councils live.',
};
writeFileSync(OUT, JSON.stringify(data));

// 3. Council population, density and area (display; the Advancement layer carries the climate indices).
const climate = readCsv('data-source/council_climate.csv');
const councils = Object.fromEntries(
  climate.map((r) => [
    r.counc_code,
    { population: num(r.pop2022), density: num(r.density), areaKm2: num(r.area_km2), source: 'NBS 2022 PHC council population (transcribed via citypopulation.de) ÷ council polygon area' },
  ]),
);
writeFileSync(OUT_COUNCILS, JSON.stringify(councils));

console.log(`core built from workbook ${sha256.slice(0, 8)}: ${units.length} units; national aggregate ${data.national.risk}; facilities ${nFac}, exposure ${nExp}, drr ${nDrr}; councils with population ${Object.keys(councils).length}`);
