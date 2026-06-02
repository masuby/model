/**
 * apply-council-hazards.mjs — build REAL council-level (195) data from the council climate
 * computation, so every council carries its OWN Hazard & Exposure instead of inheriting the
 * parent district's. Vulnerability & Coping stay district-level (those come from district-
 * representative surveys: HBS/TDHS/IPC — no council resolution exists, so inheriting is honest).
 *
 * Per council (raise-only — never below the district's documented level):
 *   drought  = max(council CHIRPS/SPEI drought, district drought floor)
 *   heatwave = max(council ERA5 heat,            district heat floor)
 *   flood    = max( max(district flood hazard [documented events], council heavy-rain)  ×  council exposure )
 *   exposure = council NBS-2022 population ÷ council area (the H×E amplifier — council-specific)
 *   other natural/human hazards = inherited from the district (no council source yet)
 * Then: natural.aggregate = mean, hazard.total = scaled geomean(natural,human),
 *       risk = cbrt(councilHazard × districtVuln × districtCoping).
 *
 * out: src/data/tanzania-councils-data.json  ({ [counc_code]: {hazardExposure, vulnerability,
 *      lackCopingCapacity, risk, _councilHazard:true} })
 */
import fs from 'fs';
const ROOT = new URL('..', import.meta.url).pathname;
const risk = JSON.parse(fs.readFileSync(ROOT + 'src/data/tanzania-inform-risk.json', 'utf8'));
const councils = JSON.parse(fs.readFileSync(ROOT + 'src/data/tanzania-councils.json', 'utf8'));
const csv = fs.readFileSync(ROOT + 'data-source/council_climate.csv', 'utf8').trim().split('\n');
const head = csv[0].split(',');
const CC = csv.slice(1).map((l) => { const c = l.split(','); const o = {}; head.forEach((h, i) => (o[h] = c[i])); return o; });
const climateByCode = Object.fromEntries(CC.map((r) => [String(r.counc_code), r]));

const isN = (x) => typeof x === 'number' && isFinite(x);
const r1 = (x) => Math.round(x * 10) / 10;
const num = (x) => { const v = +x; return isFinite(v) ? v : null; };
const mean = (a) => { const v = a.filter(isN); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const sgm = (a) => { const v = a.filter(isN); if (!v.length) return null; const sc = v.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.exp(sc.reduce((s, x) => s + Math.log(x), 0) / sc.length)) / 9 * 10; };
const normR = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const clone = (o) => JSON.parse(JSON.stringify(o));

const D = risk.subnational.adm2;
const ADM2 = {}; for (const d of D) ADM2[normR(d.admin.adm2Name)] = d;
const NAT_KEYS = ['drought', 'flood', 'earthquake', 'landslide', 'wildfire', 'stormsCyclone', 'coastalHazards', 'heatwave', 'lightning', 'environmentalDegradation', 'volcano', 'zoonoses'];

const out = {};
let made = 0, raised = 0, missing = 0; const samples = [];
for (const f of councils.features) {
  const p = f.properties; const code = String(p.code);
  const src = ADM2[normR(p.src)]; const cl = climateByCode[code];
  if (!src || !cl) { missing++; continue; }
  const he = clone(src.hazardExposure);
  const nat = he.natural || (he.natural = {});
  const E = num(cl.exposure_index);
  const cDrought = num(cl.drought_index), cHeat = num(cl.heatwave_index), cHeavy = num(cl.heavy_rain_index);

  // drought / heatwave — council's own, but ONLY refine an indicator the district already had,
  // floored at the district level (raise-only). Adding a NEW indicator the district lacked (e.g.
  // heatwave where it was null) would change the indicator set and could LOWER the mean below the
  // district — so we keep the set identical: the aggregate can then only rise.
  if (isN(cDrought) && isN(nat.drought)) nat.drought = r1(Math.max(cDrought, nat.drought));
  if (isN(cHeat) && isN(nat.heatwave)) nat.heatwave = r1(Math.max(cHeat, nat.heatwave));

  // flood — the district's FINAL flood (documented events + district H×E) is the floor so a
  // flood-prone council is never shown safer; council heavy-rain + council exposure can only raise it.
  const distFlood = isN(nat.flood) ? nat.flood : 0;
  const hazardFlood = Math.max(distFlood, isN(cHeavy) ? cHeavy : 0);
  nat.flood = r1(Math.max(distFlood, isN(E) ? Math.sqrt(hazardFlood * Math.max(E, 0)) : 0));
  he.hazardFreq = { ...(he.hazardFreq || {}), flood: r1(hazardFlood), heavyRain: isN(cHeavy) ? cHeavy : null };

  // council-specific exposure (real NBS-2022 council population ÷ council area)
  he.exposure = { population: num(cl.pop2022), density: num(cl.density), index: isN(E) ? r1(E) : null, _src: 'NBS 2022 PHC council (citypopulation.de) ÷ council polygon' };

  // recompute hazard the authentic way
  const natVals = NAT_KEYS.map((k) => nat[k]).filter(isN);
  if (natVals.length) nat.aggregate = r1(mean(natVals));
  const humanAgg = he.human?.aggregate;
  he.total = r1(sgm([nat.aggregate, humanAgg]));

  // Vulnerability & Coping are the district's (survey resolution) — riskModel references the live
  // district object so Data-Entry edits flow through; we store only the council-specific hazard + risk.
  const h = he.total, v = src.vulnerability?.total, c = src.lackCopingCapacity?.total;
  const cRisk = [h, v, c].every(isN) ? r1(Math.cbrt(h * v * c)) : src.risk;

  out[code] = { hazardExposure: he, risk: cRisk };
  made++;
  if (isN(cRisk) && isN(src.risk) && cRisk > src.risk + 0.05) raised++;
  if (p.isNew && samples.length < 8) samples.push(`${p.name} (←${p.src}): risk ${src.risk}→${cRisk} | drought ${src.hazardExposure?.natural?.drought}→${nat.drought} | flood ${r1(src.hazardExposure?.natural?.flood)}→${nat.flood} | E ${he.exposure.index}`);
}

fs.writeFileSync(ROOT + 'src/data/tanzania-councils-data.json', JSON.stringify(out));
console.log(`built council hazard data: ${made}/195  (missing src/climate: ${missing})`);
console.log(`councils whose risk rose vs their district floor: ${raised}`);
console.log('split-council samples:\n  ' + samples.join('\n  '));
