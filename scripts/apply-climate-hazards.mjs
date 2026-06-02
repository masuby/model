/**
 * apply-climate-hazards.mjs — fold the computed climate hazards + real exposure into
 * the INFORM dataset, the AUTHENTIC way (matches TZ_INFORM_model.xlsx / the engine):
 *
 *   indicator -> category : arithmetic MEAN
 *   category  -> dimension: INFORM scaled GEOMEAN  (Excel Box 6)
 *   dimension -> risk     : ∛(H × V × LCC)
 *
 * Hazard × Exposure:
 *   exposure.index  = NBS 2022 population density, log-min-max 0–10  (editable later)
 *   hazardFreq.flood= max(heavy-rain index, recorded-event index)   (physical hazard)
 *   natural.flood   = √(hazardFreq.flood × max(exposure,2))         (true H×E)
 *                     and ≥ 5 where floods are on record (never hide a known hotspot)
 *   natural.drought = computed drought_index (aridity + variability + SPEI depth +
 *                     growing-season failure). Drought exposure is agricultural, so
 *                     urban population is NOT multiplied in (noted; editable).
 * National figures are left official. Only the ~150 districts with polygons update.
 *
 * Run: node scripts/apply-climate-hazards.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const DATA = 'src/data/tanzania-inform-risk.json';
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const key = (d, r) => `${norm(d)}|${norm(r)}`;
const r1 = (v) => Math.round(v * 10) / 10;
const isN = (x) => typeof x === 'number' && isFinite(x);
const mean = (a) => { const v = a.filter(isN); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
// INFORM scaled geometric mean (Excel Box 6): (10 − GEOMEAN((10−v)/10·9+1…)) / 9 · 10
const sgm = (a) => { const v = a.filter(isN); if (!v.length) return null; const sc = v.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.exp(sc.reduce((s, x) => s + Math.log(x), 0) / sc.length)) / 9 * 10; };
const catVals = (o) => Object.entries(o).filter(([k]) => k !== 'aggregate').map(([, v]) => v);
function readCsv(p) {
  const lines = readFileSync(p, 'utf8').trim().split('\n');
  const cols = lines[0].split(',');
  return lines.slice(1).map((ln) => { const v = ln.split(','); return Object.fromEntries(cols.map((c, i) => [c, v[i]])); });
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const D = data.subnational.adm2;
const drought = Object.fromEntries(readCsv('data-source/chirps_drought_spi_spei.csv').map((x) => [key(x.dist_name, x.reg_name), x]));
const expo = Object.fromEntries(readCsv('data-source/exposure_nbs2022.csv').map((x) => [key(x.dist_name, x.reg_name), x]));
const heavy = Object.fromEntries(readCsv('data-source/chirps_heavy_rain_events.csv').map((x) => [key(x.dist_name, x.reg_name), x]));
const events = {};
readCsv('data-source/flood_events.csv').forEach((x) => { const k = key(x.dist_name, x.reg_name); (events[k] = events[k] || []).push(+x.year); });

let n = 0; const unmatched = [];
for (const u of D) {
  const k = key(u.admin.adm2Name, u.admin.adm1Name);
  const ex = expo[k], dr = drought[k], hv = heavy[k], ev = (events[k] || []).sort();
  if (!ex && !dr && !hv && !ev.length) { unmatched.push(u.admin.adm2Name); continue; }
  n++;
  const nat = u.hazardExposure.natural;
  const baseFlood = isN(nat.flood) ? nat.flood : 0;        // documented baseline = a FLOOR (never hide)
  const baseDrought = isN(nat.drought) ? nat.drought : 0;

  // Exposure (NBS 2022) — a hazard modifier, editable in Data Entry
  if (ex) u.hazardExposure.exposure = { index: +ex.exposure_index, population: +ex.pop2022, density: Math.round(+ex.density), areaKm2: +ex.area_km2, _src: 'NBS 2022 PHC' };
  const E = u.hazardExposure.exposure?.index;

  // Flood hazard = worst of DOCUMENTED + OBSERVED (heavy rain, recorded events). Exposure can
  // only AMPLIFY it (dense areas), never lower it — a known flood-prone area is never hidden.
  //   flood = max( hazard , √(hazard × exposure) )   → exposure raises only when E > hazard.
  const eventIdx = ev.length ? Math.min(10, 4 + 2 * ev.length) : 0;
  const heavyIdx = hv ? +hv.heavy_rain_index : 0;
  const hazardFlood = Math.max(baseFlood, heavyIdx, eventIdx);
  u.hazardExposure.hazardFreq = { ...(u.hazardExposure.hazardFreq || {}), flood: Math.round(hazardFlood * 100) / 100 };
  nat.flood = r1(Math.max(hazardFlood, isN(E) ? Math.sqrt(hazardFlood * E) : 0));
  if (ev.length) u.hazardExposure.events = { flood: ev };

  // Drought = computed climate hazard, floored at the documented baseline (never hide a known drought).
  if (dr) nat.drought = r1(Math.max(+dr.drought_index, baseDrought));

  // Recompute the AUTHENTIC way
  nat.aggregate = r1(mean(catVals(nat)));
  if (u.hazardExposure.human) u.hazardExposure.human.aggregate = r1(mean(catVals(u.hazardExposure.human)));
  u.hazardExposure.total = r1(sgm([nat.aggregate, u.hazardExposure.human?.aggregate]));
  const H = u.hazardExposure.total, V = u.vulnerability?.total, C = u.lackCopingCapacity?.total;
  if ([H, V, C].every(isN)) u.risk = r1(Math.cbrt(H * V * C));
}

data.metadata = {
  ...(data.metadata || {}),
  climateApplied: 'CHIRPS v3 drought (SPI/SPEI+aridity+season) + heavy-rain events + NBS2022 exposure; H×E flood; authentic mean→scaled-geomean→cbrt',
  asOf: new Date().toISOString().slice(0, 7),   // snapshot month (YYYY-MM) — risk is "as of" this time
  snapshot: 'baseline',                         // future updates create dated snapshots for trend/Δrisk
};
writeFileSync(DATA, JSON.stringify(data));

// Publish the per-indicator source table
const SRC = [
  ['indicator', 'authority', 'dataset', 'method'],
  ['hazard:drought', 'TMA / MoA', 'CHIRPS v3 1991-2024 + ERA5 t2m', 'aridity + variability + SPEI-12 depth + growing-season failure, min-max 0-10'],
  ['hazard:flood', 'PMO-DMD / TMA / MoW', 'CHIRPS v3 daily 2015-2024 + recorded floods', 'max(>50/>100mm count index, event index) x exposure (geom. mean)'],
  ['hazard:exposure', 'NBS', '2022 PHC population', 'population density, log min-max 0-10'],
  ['vulnerability:developmentPoverty', 'NBS', 'HBS 2017/18', 'poverty headcount'],
  ['vulnerability:childrenHealthNutrition', 'MoH', 'TDHS 2022', 'under-5 stunting'],
  ['vulnerability:livelihoods', 'MUCHALI / IPC', 'IPC food-insecurity rounds', 'food-insecurity phase'],
  ['coping:wash', 'MoW', '2022 PHC water points & boreholes', 'resource availability, rank 2-8'],
  ['coping:accessHealth', 'MoH', '2022 PHC health facilities', 'resource availability'],
  ['coping:drrImplementation', 'PMO-DMD / DRR Coordinator', 'EPRP / EOCC / Anticipatory-Action records', 'DRM investment overlay'],
].map((r) => r.join(',')).join('\n');
writeFileSync('data-source/indicator_sources.csv', SRC + '\n');

console.log(`applied climate H×E to ${n}/${D.length} districts; ${unmatched.length} without polygons kept as-is.`);
const show = (nm) => { const u = D.find((x) => norm(x.admin.adm2Name) === norm(nm)); return u ? `${nm}: flood ${u.hazardExposure.natural.flood} drought ${u.hazardExposure.natural.drought} exp ${u.hazardExposure.exposure?.index} H ${u.hazardExposure.total} risk ${u.risk}${u.hazardExposure.events ? ' floods:' + u.hazardExposure.events.flood.join('/') : ''}` : `${nm}: n/a`; };
['Rufiji', 'Kilombero', 'Ilala', 'Longido', 'Kondoa', 'Mafia', 'Rungwe'].forEach((nm) => console.log('  ' + show(nm)));
console.log('  NATIONAL risk (unchanged):', data.national?.risk ?? data.national?.informRisk ?? 'n/a');
