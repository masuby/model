/**
 * refill-real-hazards.mjs — overlay DOCUMENTED Tanzania hazard geography and DRM
 * coping investments onto the INFORM SADC 2024 baseline, then recompute category
 * aggregates (mean) → dimension totals (mean) → risk (∛H·V·LCC).
 *
 * Grounded in: NBS 2022 census admin units; documented flood basins (Rufiji,
 * Kilombero, Kilosa, Kyela, Kigoma, Dar urban); landslide highlands (Rungwe/Mbeya,
 * Hanang/Mbulu, Lushoto/Usambara, Kilimanjaro/Pare); the Indian Ocean coastal strip;
 * central semi-arid drought belt (Dodoma, Singida, Shinyanga, Simiyu, pastoral
 * Arusha/Manyara); Rift Valley seismicity (Kagera 2016 Bukoba M5.9, SW highlands);
 * and PMO-DMD / EW4ALL DRM build-out (national EOCC Dodoma; regional EOCC + ERT in
 * Mwanza, Arusha, Dodoma, Mbeya). Hazards are only RAISED (max), coping only IMPROVED.
 * Run: node scripts/refill-real-hazards.mjs
 */
import { readFile, writeFile } from 'fs/promises';

const FILE = 'src/data/tanzania-inform-risk.json';
const r1 = (v) => Math.round(v * 10) / 10;
const mean = (xs) => { const a = xs.filter((x) => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const compMean = (obj) => mean(Object.entries(obj).filter(([k]) => k !== 'aggregate').map(([, v]) => v));

const data = JSON.parse(await readFile(FILE, 'utf8'));
const D = data.subnational.adm2;
const touched = new Set();
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const inReg = (u, regs) => regs.map(norm).includes(norm(u.admin.adm1Name));
const isDist = (u, names) => names.map(norm).includes(norm(u.admin.adm2Name));

// raise a natural-hazard indicator (only upward) for matching districts
function raise(key, val, { regions = [], names = [] }) {
  D.forEach((u) => {
    if (inReg(u, regions) || isDist(u, names)) {
      const n = u.hazardExposure?.natural; if (!n || !(key in n)) return;
      const cur = typeof n[key] === 'number' ? n[key] : 0;
      if (val > cur) { n[key] = val; touched.add(u); }
    }
  });
}
// improve coping (lower the institutional "lack" indicators) for DRM regions
function drm(regions, { drr, gov }) {
  D.forEach((u) => {
    if (!inReg(u, regions)) return;
    const inst = u.lackCopingCapacity?.institutional; if (!inst) return;
    if (typeof inst.drrImplementation === 'number') inst.drrImplementation = Math.min(inst.drrImplementation, drr);
    if (typeof inst.governance === 'number') inst.governance = Math.min(inst.governance, gov);
    touched.add(u);
  });
}

// ---- FLOOD (riverine/urban) ----
raise('flood', 8.5, { names: ['Kilosa', 'Kilombero', 'Ulanga', 'Rufiji', 'Kyela'] });
raise('flood', 8.0, { regions: ['Dar-es-salaam'] });
raise('flood', 7.5, { regions: ['Kigoma'] });
raise('flood', 7.0, { names: ['Bagamoyo', 'Mkuranga', 'Mvomero', 'Gairo', 'Morogoro', 'Mbarali', 'Sumbawanga', 'Liwale', 'Kilwa', 'Malinyi'] });

// ---- LANDSLIDE (highlands) ----
raise('landslide', 8.5, { names: ['Rungwe', 'Mbeya', 'Hanang'] });
raise('landslide', 8.0, { names: ['Mbulu', 'Babati', 'Lushoto', 'Korogwe', 'Muheza'] });
raise('landslide', 7.0, { names: ['Rombo', 'Same', 'Moshi', 'Hai', 'Mwanga', 'Makete', 'Ludewa', 'Muleba'] });

// ---- COASTAL HAZARDS (Indian Ocean strip) ----
raise('coastalHazards', 7.5, { regions: ['Dar-es-salaam'] });
raise('coastalHazards', 7.5, { names: ['Bagamoyo', 'Mkuranga', 'Rufiji', 'Mafia'] });
raise('coastalHazards', 7.0, { names: ['Tanga Urban', 'Pangani', 'Mkinga', 'Muheza', 'Kilwa', 'Lindi', 'Lindi Urban', 'Mtwara', 'Mtwara Urban'] });
raise('coastalHazards', 6.5, { regions: ['Mjini Magharibi', 'Kaskazini Unguja', 'Kusini Unguja', 'Kaskazini Pemba', 'Kusini Pemba'] });

// ---- DROUGHT (central semi-arid + pastoral) ----
raise('drought', 7.0, { regions: ['Dodoma', 'Singida', 'Shinyanga', 'Simiyu'] });
raise('drought', 7.0, { names: ['Simanjiro', 'Kiteto'] });
raise('drought', 6.5, { names: ['Monduli', 'Longido', 'Ngorongoro', 'Igunga', 'Nzega'] });

// ---- EARTHQUAKE (Rift Valley) ----
raise('earthquake', 7.0, { names: ['Bukoba', 'Bukoba Urban', 'Missenyi', 'Muleba'] });
raise('earthquake', 6.0, { regions: ['Mbeya', 'Rukwa', 'Songwe', 'Katavi', 'Kigoma'] });

// ---- DRM coping investments (regional EOCC + ERT) ----
drm(['Mwanza', 'Arusha', 'Dodoma', 'Mbeya'], { drr: 3.0, gov: 3.5 });

// ---- recompute aggregates → totals → risk for every touched unit ----
touched.forEach((u) => {
  u.hazardExposure.natural.aggregate = r1(compMean(u.hazardExposure.natural));
  u.hazardExposure.human.aggregate = r1(compMean(u.hazardExposure.human));
  u.hazardExposure.total = r1(mean([u.hazardExposure.natural.aggregate, u.hazardExposure.human.aggregate]));
  u.lackCopingCapacity.infrastructure.aggregate = r1(compMean(u.lackCopingCapacity.infrastructure));
  u.lackCopingCapacity.institutional.aggregate = r1(compMean(u.lackCopingCapacity.institutional));
  u.lackCopingCapacity.total = r1(mean([u.lackCopingCapacity.infrastructure.aggregate, u.lackCopingCapacity.institutional.aggregate]));
  const h = u.hazardExposure.total, v = u.vulnerability.total, c = u.lackCopingCapacity.total;
  if ([h, v, c].every((x) => typeof x === 'number')) u.risk = r1(Math.cbrt(h * v * c));
});

// NOTE: national figures stay at the official INFORM values (not a plain district
// mean — INFORM national uses its own weighting). The explorer's national level is
// aggregated from districts separately in riskModel.

data.metadata = { ...(data.metadata || {}), refilled: 'documented TZ hazard hotspots + DRM coping (EOCC/ERT)' };
await writeFile(FILE, JSON.stringify(data));
console.log(`✓ refilled ${touched.size} districts (national figures left at official INFORM values).`);
