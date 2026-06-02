/**
 * enrich-coping-facilities.mjs — coping capacity = RESOURCES AVAILABLE. Fixes the
 * uniform national modelled values (e.g. WASH = 7 everywhere → an "all red" lens) by
 * deriving them from the real 2022-census facilities: more water points/boreholes →
 * more WASH resource → lower "lack of coping". Also tags each district's DRR
 * initiatives (EPRP / drought Anticipatory Action / regional EOCC) for tooltips.
 * Recomputes infrastructure aggregate → coping total → risk (∛H·V·LCC).
 * Run: node scripts/enrich-coping-facilities.mjs
 */
import { readFile, writeFile } from 'fs/promises';

const FILE = 'src/data/tanzania-inform-risk.json';
const r1 = (v) => Math.round(v * 10) / 10;
const mean = (xs) => { const a = xs.filter((x) => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const compMean = (o) => mean(Object.entries(o).filter(([k]) => k !== 'aggregate').map(([, v]) => v));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const data = JSON.parse(await readFile(FILE, 'utf8'));
const D = data.subnational.adm2;

// --- DRR initiative flags (for tooltips + transparency) ---
const EPRP = new Set(['Nkasi', 'Sumbawanga', 'Hai', 'Kinondoni', 'Ilemela', 'Rufiji', 'Kyela', 'Handeni', 'Kishapu', 'Mwanga', 'Monduli', 'Longido', 'Simanjiro', 'Same', 'Micheweni', 'Kiteto', 'Kondoa', 'Mkalama', 'Meatu'].map(norm));
const AA = new Set(['Monduli', 'Longido', 'Simanjiro', 'Same', 'Micheweni', 'Kiteto', 'Kondoa', 'Handeni', 'Mkalama', 'Meatu'].map(norm));
const EOCC_REG = new Set(['Mwanza', 'Arusha', 'Dodoma', 'Mbeya'].map(norm));
D.forEach((u) => {
  const dn = norm(u.admin.adm2Name), rn = norm(u.admin.adm1Name);
  const f = { eprp: EPRP.has(dn), aa: AA.has(dn), eocc: EOCC_REG.has(rn) };
  if (f.eprp || f.aa || f.eocc) u.drr = f; else delete u.drr;
});

// --- WASH from real water resources (more resource → lower lack), rank-normalised 2..8 ---
const withWater = D.filter((u) => u.facilities).map((u) => ({ u, n: (u.facilities.water || 0) + (u.facilities.boreholes || 0) }));
withWater.sort((a, b) => a.n - b.n); // fewest resources first
const m = withWater.length;
withWater.forEach((x, i) => { const pct = m > 1 ? i / (m - 1) : 0.5; x.u.lackCopingCapacity.infrastructure.wash = r1(8 - 6 * pct); });

// recompute infrastructure → coping total → risk for the updated districts
withWater.forEach(({ u }) => {
  const infra = u.lackCopingCapacity.infrastructure;
  infra.aggregate = r1(compMean(infra));
  u.lackCopingCapacity.total = r1(mean([infra.aggregate, u.lackCopingCapacity.institutional.aggregate]));
  const h = u.hazardExposure.total, v = u.vulnerability.total, c = u.lackCopingCapacity.total;
  if ([h, v, c].every((x) => typeof x === 'number')) u.risk = r1(Math.cbrt(h * v * c));
});

await writeFile(FILE, JSON.stringify(data));
console.log(`enriched: DRR flags on ${D.filter((u) => u.drr).length} districts; WASH derived from water resources for ${m} districts.`);
