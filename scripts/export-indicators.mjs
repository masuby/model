/**
 * export-indicators.mjs — flatten the INFORM model into reusable per-indicator CSVs, so the
 * data layer is transparent, auditable and easy to extend/update for future advancements.
 *
 * Writes two views of every district × indicator (value on the 0–10 INFORM scale + its source):
 *   data-source/inform_indicators_long.csv   tidy: one row per (district, indicator) — best for
 *                                             adding/updating indicators and tracking provenance.
 *   data-source/inform_indicators_wide.csv    one row per district, every indicator as a column.
 *
 * Run: node scripts/export-indicators.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('src/data/tanzania-inform-risk.json', 'utf8'));
const D = data.subnational.adm2;

// dimension/category for each nested section of the model
const SECTIONS = [
  { path: ['hazardExposure', 'natural'], dim: 'hazard', dimension: 'Hazard & Exposure', category: 'Natural hazards' },
  { path: ['hazardExposure', 'human'], dim: 'hazard', dimension: 'Hazard & Exposure', category: 'Human hazards' },
  { path: ['vulnerability', 'socioEconomic'], dim: 'vulnerability', dimension: 'Vulnerability', category: 'Socio-economic' },
  { path: ['vulnerability', 'vulnerableGroups'], dim: 'vulnerability', dimension: 'Vulnerability', category: 'Vulnerable groups' },
  { path: ['lackCopingCapacity', 'infrastructure'], dim: 'coping', dimension: 'Lack of Coping Capacity', category: 'Infrastructure' },
  { path: ['lackCopingCapacity', 'institutional'], dim: 'coping', dimension: 'Lack of Coping Capacity', category: 'Institutional' },
];

// per-indicator source (authority · dataset · method); fallback = INFORM SADC baseline
const SRC = {
  'hazard:drought': ['TMA / MoA', 'CHIRPS v3 1991-2024 + ERA5 t2m', 'aridity+variability+SPEI+growing-season, min-max'],
  'hazard:flood': ['PMO-DMD / TMA / MoW', 'CHIRPS v3 daily + recorded floods', 'max(hazard, sqrt(hazard×exposure))'],
  'hazard:exposure': ['NBS', '2022 PHC population', 'population density, log min-max'],
  'hazard:landslide': ['TMA / PMO-DMD', 'documented rainfall-triggered events', 'documented overlay'],
  'hazard:coastalHazards': ['TMA / PMO-DMD', 'coastal strip', 'documented overlay'],
  'hazard:stormsCyclone': ['TMA / PMO-DMD', 'Cyclone Hidaya 2024 + Lindi 1952 + Zanzibar 1872', 'documented cyclone/storm exposure overlay'],
  'hazard:earthquake': ['INFORM SADC', 'INFORM seismic', 'baseline'],
  'vulnerability:developmentPoverty': ['NBS', 'Household Budget Survey 2017/18', 'poverty headcount'],
  'vulnerability:childrenHealthNutrition': ['MoH', 'TDHS 2022', 'under-5 stunting'],
  'vulnerability:livelihoods': ['MUCHALI / IPC (MoA)', 'IPC acute food-insecurity rounds', 'food-insecurity phase'],
  'coping:wash': ['MoW', '2022 PHC water points & boreholes', 'resource availability, rank 2-8'],
  'coping:accessHealth': ['MoH', '2022 PHC health facilities', 'resource availability'],
  'coping:education': ['NBS / MoH', '2022 PHC schools', 'resource availability'],
  'coping:drrImplementation': ['PMO-DMD / DRR Coordinator', 'EPRP / EOCC / Anticipatory-Action records', 'DRM investment overlay'],
  'coping:governance': ['PMO-DMD', 'INFORM SADC governance', 'baseline'],
};
const DEFAULT_SRC = ['INFORM SADC 2024', 'INFORM Sub-national SADC 2024', 'baseline'];
const srcFor = (dim, k) => SRC[`${dim}:${k}`] || DEFAULT_SRC;

const title = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
const q = (s) => { const v = String(s ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };

const longRows = [['adm1_code', 'adm1_name', 'adm2_code', 'adm2_name', 'dimension', 'category', 'indicator_key', 'indicator', 'value', 'authority', 'dataset', 'method']];
const wideCols = new Set();
const wide = {};

for (const u of D) {
  const a = u.admin;
  const w = wide[a.adm2Code] = { adm2_code: a.adm2Code, adm1_name: a.adm1Name, adm2_name: a.adm2Name,
    population: u.hazardExposure?.exposure?.population ?? '', density: u.hazardExposure?.exposure?.density ?? '' };

  // exposure (the population term that drives flood H×E)
  const ex = u.hazardExposure?.exposure;
  if (ex && typeof ex.index === 'number') {
    const [auth, ds, m] = srcFor('hazard', 'exposure');
    longRows.push([a.adm1Code, a.adm1Name, a.adm2Code, a.adm2Name, 'Hazard & Exposure', 'Exposure', 'hazard:exposure', 'Population Exposure', ex.index, auth, ds, m]);
    w['hazard:exposure'] = ex.index; wideCols.add('hazard:exposure');
  }

  for (const s of SECTIONS) {
    const obj = s.path.reduce((o, p) => o?.[p], u);
    if (!obj) continue;
    for (const [k, val] of Object.entries(obj)) {
      if (k === 'aggregate' || typeof val !== 'number') continue;
      const key = `${s.dim}:${k}`;
      const [auth, ds, m] = srcFor(s.dim, k);
      longRows.push([a.adm1Code, a.adm1Name, a.adm2Code, a.adm2Name, s.dimension, s.category, key, title(k), val, auth, ds, m]);
      w[key] = val; wideCols.add(key);
    }
  }
  w.hazard_total = u.hazardExposure?.total ?? '';
  w.vulnerability_total = u.vulnerability?.total ?? '';
  w.coping_total = u.lackCopingCapacity?.total ?? '';
  w.risk = u.risk ?? '';
}

writeFileSync('data-source/inform_indicators_long.csv', longRows.map((r) => r.map(q).join(',')).join('\n') + '\n');

const cols = [...wideCols].sort();
const head = ['adm2_code', 'adm1_name', 'adm2_name', 'population', 'density', ...cols, 'hazard_total', 'vulnerability_total', 'coping_total', 'risk'];
const wideRows = [head, ...Object.values(wide).map((w) => head.map((c) => w[c] ?? ''))];
writeFileSync('data-source/inform_indicators_wide.csv', wideRows.map((r) => r.map(q).join(',')).join('\n') + '\n');

console.log(`wrote inform_indicators_long.csv (${longRows.length - 1} rows) + inform_indicators_wide.csv (${D.length} districts × ${cols.length} indicators)`);
