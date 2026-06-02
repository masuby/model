/**
 * fix-dimension-aggregation.mjs — restore AUTHENTIC INFORM dimension aggregation in the shipped
 * dataset. Two earlier scripts (refill-real-hazards, enrich-coping-facilities) set dimension totals
 * with arithmetic MEAN; later scripts re-fixed Hazard & Vulnerability to the scaled GEOMEAN but never
 * re-fixed Lack of Coping Capacity, so ~69 coping totals drifted to the mean. This recomputes every
 * dimension total as the scaled geomean OF THE STORED CATEGORY AGGREGATES (so the total is exactly the
 * sgm of the category values shown in the UI) and risk as the cube root — the authentic INFORM/Excel
 * pipeline. Missing data (null) is excluded; National stays official (untouched); idempotent.
 */
import fs from 'fs';
const PATH = 'src/data/tanzania-inform-risk.json';
const data = JSON.parse(fs.readFileSync(PATH, 'utf8'));
const isN = (x) => typeof x === 'number' && isFinite(x);
const r1 = (x) => Math.round(x * 10) / 10;
const sgm = (a) => { const v = a.filter(isN); if (!v.length) return null; const sc = v.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.exp(sc.reduce((s, x) => s + Math.log(x), 0) / sc.length)) / 9 * 10; };
const DIMS = { hazardExposure: ['natural', 'human'], vulnerability: ['socioEconomic', 'vulnerableGroups'], lackCopingCapacity: ['infrastructure', 'institutional'] };
const agg = (co) => (isN(co?.aggregate) ? co.aggregate : null);

const D = data.subnational.adm2;
const perDim = { hazardExposure: 0, vulnerability: 0, lackCopingCapacity: 0 };
let riskUp = 0, riskDown = 0; const downs = [];
for (const u of D) {
  const oldRisk = u.risk;
  for (const [dim, cats] of Object.entries(DIMS)) {
    const dd = u[dim]; if (!dd) continue;
    const g = sgm(cats.map((c) => agg(dd[c])));
    const nt = g == null ? null : r1(g);
    if (isN(nt) && isN(dd.total) && Math.abs(nt - dd.total) >= 0.05) perDim[dim]++;
    if (nt != null) dd.total = nt;
  }
  const h = u.hazardExposure?.total, v = u.vulnerability?.total, c = u.lackCopingCapacity?.total;
  if ([h, v, c].every(isN)) {
    const nr = r1(Math.cbrt(h * v * c));
    if (isN(oldRisk) && Math.abs(nr - oldRisk) >= 0.05) { if (nr > oldRisk) riskUp++; else { riskDown++; if (downs.length < 12) downs.push(`${u.admin.adm2Name}: ${oldRisk} → ${nr}`); } }
    u.risk = nr;
  }
}
console.log('dimension totals changed by dimension:', JSON.stringify(perDim));
console.log(`risk: ${riskUp} up, ${riskDown} down`);
if (downs.length) console.log('DOWN cases:\n  ' + downs.join('\n  '));
if (process.argv.includes('--write')) { fs.writeFileSync(PATH, JSON.stringify(data)); console.log('\n✅ WROTE corrected dataset.'); }
else console.log('\n(dry run)');
