/**
 * apply-earthquake.mjs - two limitation fixes into the shipped dataset:
 *   #6 Earthquake: replace the rough rift-proximity OVERLAY with the USGS-catalogue computed hazard,
 *      applied raise-only (max with the current value) so no documented seismic zone is lowered, but
 *      the real catalogue raises any district the overlay under-rated. Source becomes USGS (computed).
 *   #4 Dar es Salaam drought artifact: Ilala/Temeke/Kinondoni carried a documented drought = 10 (clearly
 *      wrong for a coastal city). Replace with their CHIRPS-computed value - the one deliberate downward
 *      correction of an acknowledged artifact (the limitation flagged it for exactly this).
 * Then recompute natural.aggregate (mean), hazard.total (scaled geomean), risk (cbrt). National untouched.
 */
import fs from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const data = JSON.parse(fs.readFileSync(ROOT + 'src/data/tanzania-inform-risk.json', 'utf8'));
const readCsv = (p) => { const l = fs.readFileSync(ROOT + p, 'utf8').trim().split('\n'); const h = l[0].split(','); return l.slice(1).map((x) => { const c = x.split(','); const o = {}; h.forEach((k, i) => (o[k] = c[i])); return o; }); };
const isN = (x) => typeof x === 'number' && isFinite(x);
const r1 = (x) => Math.round(x * 10) / 10;
const mean = (a) => { const v = a.filter(isN); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const sgm = (a) => { const v = a.filter(isN); if (!v.length) return null; const sc = v.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10; };
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const NAT = ['drought', 'flood', 'earthquake', 'landslide', 'wildfire', 'stormsCyclone', 'coastalHazards', 'heatwave', 'lightning', 'environmentalDegradation', 'volcano', 'zoonoses'];

const eq = Object.fromEntries(readCsv('data-source/earthquake_usgs.csv').map((r) => [norm(r.dist_name), +r.earthquake_index]));
const drought = Object.fromEntries(readCsv('data-source/chirps_drought_spi_spei.csv').map((r) => [norm(r.dist_name), +r.drought_index]));
const DAR = { ilala: 1, temeke: 1, kinondoni: 1 };   // the documented drought-10 artifact

const D = data.subnational.adm2;
let eqRaised = 0, darFixed = 0;
for (const u of D) {
  const k = norm(u.admin.adm2Name); const nat = u.hazardExposure?.natural; if (!nat) continue;
  let changed = false;
  // #6 earthquake: raise-only refinement from the USGS catalogue
  if (isN(eq[k])) { const nv = r1(Math.max(eq[k], isN(nat.earthquake) ? nat.earthquake : 0)); if (nv > (isN(nat.earthquake) ? nat.earthquake : -1) + 0.05) { nat.earthquake = nv; eqRaised++; changed = true; } }
  // #4 Dar drought artifact correction
  if (DAR[k] && isN(drought[k]) && Math.abs(r1(drought[k]) - (nat.drought ?? -1)) >= 0.05) { nat.drought = r1(drought[k]); darFixed++; changed = true; }
  // Recompute ONLY the districts that actually changed (leave the rest byte-identical to avoid
  // re-rounding drift on unchanged units).
  if (changed) {
    const natVals = NAT.map((x) => nat[x]).filter(isN);
    if (natVals.length) nat.aggregate = r1(mean(natVals));
    if (u.hazardExposure.human) u.hazardExposure.total = r1(sgm([nat.aggregate, u.hazardExposure.human.aggregate]));
    const h = u.hazardExposure.total, v = u.vulnerability?.total, c = u.lackCopingCapacity?.total;
    if ([h, v, c].every(isN)) u.risk = r1(Math.pow(h, 1 / 3) * Math.pow(v, 1 / 3) * Math.pow(c, 1 / 3));
  }
}
fs.writeFileSync(ROOT + 'src/data/tanzania-inform-risk.json', JSON.stringify(data));
console.log(`earthquake raised by USGS catalogue: ${eqRaised} districts | Dar drought artifact corrected: ${darFixed}`);
const by = (n) => D.find((d) => norm(d.admin.adm2Name) === n);
console.log('Dar now:', ['ilala', 'temeke', 'kinondoni'].map((n) => `${n} drought ${by(n)?.hazardExposure.natural.drought} risk ${by(n)?.risk}`).join(' | '));
