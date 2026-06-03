/**
 * refill-real-hazards.mjs — overlay DOCUMENTED, REPORTED Tanzania data onto the
 * INFORM SADC 2024 baseline, then recompute each edited dimension's aggregates
 * (mean) → total (mean of components) → risk (∛H·V·LCC). Hazards/vulnerability are
 * only RAISED (max); coping is only IMPROVED (min "lack"). National figures stay at
 * the official INFORM values. Run: node scripts/refill-real-hazards.mjs
 *
 * Sources (web-verified): NBS 2022 census; flood basins (Rufiji, Kilombero, Kilosa,
 * Kyela, Kigoma, Dar urban); landslide highlands (Rungwe/Mbeya, Hanang/Mbulu,
 * Lushoto/Usambara, Kilimanjaro/Pare); Indian Ocean coastal strip; central+pastoral
 * drought (Dodoma/Singida/Shinyanga/Simiyu, Monduli/Longido/Ngorongoro/Kiteto/Simanjiro);
 * Rift seismicity (Kagera 2016 Bukoba M5.9). Poverty — HBS 2017-18 (Geita ~40%,
 * Shinyanga/Lindi >90% poor households, Kagera/Kigoma high). Stunting — TDHS 2022
 * (Iringa 56.9%, Njombe 50.4%, Rukwa 49.8%, Southern Highlands). DRM coping — PMO-DMD
 * EW4ALL regional EOCC + ERT (Mwanza, Arusha, Dodoma, Mbeya).
 */
import { readFile, writeFile } from 'fs/promises';

const FILE = 'src/data/tanzania-inform-risk.json';
const r1 = (v) => Math.round(v * 10) / 10;
const mean = (xs) => { const a = xs.filter((x) => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
// INFORM category→dimension is the scaled GEOMEAN (Excel Box 6), NOT the arithmetic mean.
const sgm = (xs) => { const a = xs.filter((x) => typeof x === 'number' && isFinite(x)); if (!a.length) return null; const sc = a.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10; };
const compMean = (o) => mean(Object.entries(o).filter(([k]) => k !== 'aggregate').map(([, v]) => v));
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const data = JSON.parse(await readFile(FILE, 'utf8'));
const D = data.subnational.adm2;
const tH = new Set(), tV = new Set(), tC = new Set();
const inReg = (u, regs) => regs.map(norm).includes(norm(u.admin.adm1Name));
const isDist = (u, names) => names.map(norm).includes(norm(u.admin.adm2Name));
const match = (u, { regions = [], names = [] }) => inReg(u, regions) || isDist(u, names);

const raiseH = (key, val, m) => D.forEach((u) => { if (match(u, m)) { const o = u.hazardExposure?.natural; if (o && key in o && val > (o[key] || 0)) { o[key] = val; tH.add(u); } } });
const raiseV = (comp, key, val, m) => D.forEach((u) => { if (match(u, m)) { const o = u.vulnerability?.[comp]; if (o && key in o && val > (o[key] || 0)) { o[key] = val; tV.add(u); } } });
const improveCoping = (u, drr, gov) => { const o = u.lackCopingCapacity?.institutional; if (!o) return; if (typeof o.drrImplementation === 'number') o.drrImplementation = Math.min(o.drrImplementation, drr); if (typeof o.governance === 'number') o.governance = Math.min(o.governance, gov); tC.add(u); };
const drm = (regions, v) => D.forEach((u) => { if (inReg(u, regions)) improveCoping(u, v.drr, v.gov); });
const drmDistricts = (names, v) => D.forEach((u) => { if (isDist(u, names)) improveCoping(u, v.drr, v.gov); });

// FLOOD
raiseH('flood', 8.5, { names: ['Kilosa', 'Kilombero', 'Ulanga', 'Rufiji', 'Kyela'] });
raiseH('flood', 8.0, { regions: ['Dar-es-salaam'] });
raiseH('flood', 7.5, { regions: ['Kigoma'] });
raiseH('flood', 7.0, { names: ['Bagamoyo', 'Mkuranga', 'Mvomero', 'Gairo', 'Morogoro', 'Mbarali', 'Sumbawanga', 'Liwale', 'Kilwa', 'Malinyi'] });
// LANDSLIDE
raiseH('landslide', 8.5, { names: ['Rungwe', 'Mbeya', 'Hanang'] });
raiseH('landslide', 8.0, { names: ['Mbulu', 'Babati', 'Lushoto', 'Korogwe', 'Muheza'] });
raiseH('landslide', 7.0, { names: ['Rombo', 'Same', 'Moshi', 'Hai', 'Mwanga', 'Makete', 'Ludewa', 'Muleba'] });
// COASTAL
raiseH('coastalHazards', 7.5, { regions: ['Dar-es-salaam'], names: ['Bagamoyo', 'Mkuranga', 'Rufiji', 'Mafia'] });
raiseH('coastalHazards', 7.0, { names: ['Tanga Urban', 'Pangani', 'Mkinga', 'Muheza', 'Kilwa', 'Lindi', 'Lindi Urban', 'Mtwara', 'Mtwara Urban'] });
raiseH('coastalHazards', 6.5, { regions: ['Mjini Magharibi', 'Kaskazini Unguja', 'Kusini Unguja', 'Kaskazini Pemba', 'Kusini Pemba'] });
// DROUGHT
raiseH('drought', 7.0, { regions: ['Dodoma', 'Singida', 'Shinyanga', 'Simiyu'], names: ['Simanjiro', 'Kiteto'] });
raiseH('drought', 6.5, { names: ['Monduli', 'Longido', 'Ngorongoro', 'Igunga', 'Nzega'] });
// EARTHQUAKE
raiseH('earthquake', 7.0, { names: ['Bukoba', 'Bukoba Urban', 'Missenyi', 'Muleba'] });
raiseH('earthquake', 6.0, { regions: ['Mbeya', 'Rukwa', 'Songwe', 'Katavi', 'Kigoma'] });

// VULNERABILITY — development & poverty (HBS 2017-18)
raiseV('socioEconomic', 'developmentPoverty', 8.5, { regions: ['Geita'] });
raiseV('socioEconomic', 'developmentPoverty', 8.0, { regions: ['Kagera', 'Shinyanga', 'Lindi'] });
raiseV('socioEconomic', 'developmentPoverty', 7.5, { regions: ['Kigoma', 'Mtwara', 'Rukwa', 'Katavi'] });
raiseV('socioEconomic', 'developmentPoverty', 7.0, { regions: ['Tabora', 'Singida', 'Simiyu', 'Dodoma'] });
// VULNERABILITY — children health & nutrition (TDHS 2022 stunting)
raiseV('vulnerableGroups', 'childrenHealthNutrition', 9.0, { regions: ['Iringa'] });
raiseV('vulnerableGroups', 'childrenHealthNutrition', 8.5, { regions: ['Njombe', 'Rukwa'] });
raiseV('vulnerableGroups', 'childrenHealthNutrition', 8.0, { regions: ['Songwe'] });
raiseV('vulnerableGroups', 'childrenHealthNutrition', 7.5, { regions: ['Mbeya', 'Kigoma', 'Ruvuma', 'Katavi', 'Geita'] });

// DRM coping — improves the INSTITUTIONAL (DRR/governance) component only, MODERATELY.
// Risk still = ∛(H×V×LCC): a district with an EPRP but high hazard + vulnerability stays
// high-risk. Strength: full regional EOCC+ERT (strongest) > drought Anticipatory Action +
// EPRP > EPRP alone. min() means overlaps keep the strongest improvement.
drm(['Mwanza', 'Arusha', 'Dodoma', 'Mbeya'], { drr: 3.0, gov: 3.5 }); // regional EOCC + ERT
const EPRP = ['Nkasi', 'Sumbawanga', 'Hai', 'Kinondoni', 'Ilemela', 'Rufiji', 'Kyela', 'Handeni', 'Kishapu', 'Mwanga', 'Monduli', 'Longido', 'Simanjiro', 'Same', 'Micheweni', 'Kiteto', 'Kondoa', 'Mkalama', 'Meatu'];
const AA_DROUGHT = ['Monduli', 'Longido', 'Simanjiro', 'Same', 'Micheweni', 'Kiteto', 'Kondoa', 'Handeni', 'Mkalama', 'Meatu'];
drmDistricts(EPRP, { drr: 4.5, gov: 5.0 });        // Emergency Preparedness & Response Plan (moderate)
drmDistricts(AA_DROUGHT, { drr: 3.8, gov: 4.5 });  // + drought Anticipatory Action plan (more)

// recompute only the edited dimension per unit, then risk for any edited unit
tH.forEach((u) => {
  u.hazardExposure.natural.aggregate = r1(compMean(u.hazardExposure.natural));
  u.hazardExposure.human.aggregate = r1(compMean(u.hazardExposure.human));
  u.hazardExposure.total = r1(sgm([u.hazardExposure.natural.aggregate, u.hazardExposure.human.aggregate]));
});
tV.forEach((u) => {
  u.vulnerability.socioEconomic.aggregate = r1(compMean(u.vulnerability.socioEconomic));
  u.vulnerability.vulnerableGroups.aggregate = r1(compMean(u.vulnerability.vulnerableGroups));
  u.vulnerability.total = r1(sgm([u.vulnerability.socioEconomic.aggregate, u.vulnerability.vulnerableGroups.aggregate]));
});
tC.forEach((u) => {
  u.lackCopingCapacity.infrastructure.aggregate = r1(compMean(u.lackCopingCapacity.infrastructure));
  u.lackCopingCapacity.institutional.aggregate = r1(compMean(u.lackCopingCapacity.institutional));
  u.lackCopingCapacity.total = r1(sgm([u.lackCopingCapacity.infrastructure.aggregate, u.lackCopingCapacity.institutional.aggregate]));
});
const all = new Set([...tH, ...tV, ...tC]);
all.forEach((u) => {
  const h = u.hazardExposure.total, v = u.vulnerability.total, c = u.lackCopingCapacity.total;
  if ([h, v, c].every((x) => typeof x === 'number')) u.risk = r1(Math.pow(h, 1 / 3) * Math.pow(v, 1 / 3) * Math.pow(c, 1 / 3));
});

data.metadata = { ...(data.metadata || {}), refilled: 'documented TZ hazards + poverty/stunting vulnerability + DRM coping' };
await writeFile(FILE, JSON.stringify(data));
console.log(`✓ refilled — hazards:${tH.size} vulnerability:${tV.size} coping:${tC.size} (union ${all.size} of ${D.length}). National kept official.`);
