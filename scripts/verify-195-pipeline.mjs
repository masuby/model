/**
 * verify-195-pipeline.mjs - run the PROVEN computeFromRaw pipeline at the 195-council level and diff it
 * against the current (advanced) council data. Changes nothing - it reports, so we decide with eyes open.
 *
 * For each council: take its parent district's RAW (the workbook's keyed values), run the same pipeline
 * proven at 170 (standardise -> AVERAGEIFS -> category -> scaled geomean -> cube-root) with the FROZEN
 * references -> the council's PURE-INFORM risk. Compare to the live council risk (which carries the
 * CHIRPS/ERA5 advancements). The gap is the advancement footprint at 195.
 */
import fs from 'fs';
const R = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url)));
const SPEC = R('src/data/inform-indicator-spec.json');
const fixture = R('src/services/__tests__/pipeline.fixture.json');       // [{district, raw, risk}]
const councils = R('src/data/tanzania-councils.json');
const councilData = R('src/data/tanzania-councils-data.json');

const isNum = (x) => typeof x === 'number' && isFinite(x);
const round1 = (x) => Math.floor(x * 10 + 0.5) / 10;
const mean = (a) => { const v = a.filter(isNum); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const sgm = (a) => { const xs = a.filter(isNum); if (!xs.length) return null; const sc = xs.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.pow(sc.reduce((p, x) => p * x, 1), 1 / sc.length)) / 9 * 10; };
const kindOf = (l) => { l = String(l).toLowerCase(); return l.includes('hazard') ? 'H' : l.includes('vulner') ? 'V' : l.includes('coping') ? 'C' : null; };
function standardise(raw, s) {
  if (raw == null || raw === 'No data' || !s) return null;
  let x = Number(raw); if (!isNum(x)) return null;
  if (s.denominator && s.denominator !== 'None') return null;
  if (s.outlier === 'Yes' && isNum(s.fence_lo) && isNum(s.fence_hi)) x = Math.max(Math.min(x, s.fence_hi), s.fence_lo);
  if (s.transform === 'Logarithm') x = Math.log(0.001 + x); else if (s.transform === 'Exponential') x = Math.exp(x);
  const mn = s.resolved_min, mx = s.resolved_max; if (!isNum(mn) || !isNum(mx) || mx === mn) return null;
  let v = (10 * (x - mn)) / (mx - mn); if (String(s.sign).startsWith('Decrease')) v = 10 - v;
  return round1(Math.max(0, Math.min(10, v)));
}
function computeFromRaw(rawById) {
  const score = {};
  for (const id of Object.keys(SPEC)) { const s = SPEC[id]; if (s.use !== 'Yes' || !(id in rawById)) continue; const v = standardise(rawById[id], s); if (v != null) score[id] = v; }
  const compVals = {}, compMeta = {};
  for (const id of Object.keys(score)) { const s = SPEC[id]; (compVals[s.component] = compVals[s.component] || []).push(score[id]); compMeta[s.component] = { cat: s.category, dim: s.dimension }; }
  const component = {}; for (const c of Object.keys(compVals)) component[c] = mean(compVals[c]);
  const catVals = {}, catDim = {}; for (const c of Object.keys(component)) { const m = compMeta[c]; (catVals[m.cat] = catVals[m.cat] || []).push(component[c]); catDim[m.cat] = m.dim; }
  const category = {}; for (const cat of Object.keys(catVals)) category[cat] = mean(catVals[cat]);
  const dimVals = {}; for (const cat of Object.keys(category)) (dimVals[catDim[cat]] = dimVals[catDim[cat]] || []).push(category[cat]);
  const dim = {}; for (const d of Object.keys(dimVals)) { const k = kindOf(d); if (k) dim[k] = round1(sgm(dimVals[d])); }
  const { H, V, C } = dim;
  return [H, V, C].every(isNum) ? round1(Math.pow(H, 1 / 3) * Math.pow(V, 1 / 3) * Math.pow(C, 1 / 3)) : null;
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const rawByDistrict = {}, riskByDistrict = {};
for (const r of fixture) { rawByDistrict[norm(r.district)] = r.raw; riskByDistrict[norm(r.district)] = r.risk; }

let mapped = 0, baselineOk = 0, advanced = 0, unmatched = 0;
const deltas = [], examples = [];
for (const f of councils.features) {
  const p = f.properties; const raw = rawByDistrict[norm(p.src)];
  if (!raw) { unmatched++; continue; }
  mapped++;
  const pure = computeFromRaw(raw);                 // pure-INFORM council risk (proven pipeline at 195)
  if (pure === riskByDistrict[norm(p.src)]) baselineOk++;
  const current = councilData[String(p.code)]?.risk;
  if (isNum(current) && isNum(pure) && Math.abs(current - pure) > 0.05) {
    advanced++; deltas.push(current - pure);
    if (examples.length < 8) examples.push(`${p.name} (<-${p.src}): INFORM ${pure} -> advanced ${current}  (+${(current - pure).toFixed(1)})`);
  }
}
const avg = deltas.length ? (deltas.reduce((s, x) => s + x, 0) / deltas.length) : 0;
console.log(`councils mapped to a district raw: ${mapped} / ${councils.features.length}  (unmatched: ${unmatched})`);
console.log(`pure-INFORM council risk == its district's risk (pipeline runs at 195): ${baselineOk} / ${mapped}`);
console.log(`councils whose LIVE value is ADVANCED above pure INFORM: ${advanced}`);
console.log(`advancement delta: min ${Math.min(...deltas).toFixed(1)}  max ${Math.max(...deltas).toFixed(1)}  mean +${avg.toFixed(2)}`);
console.log('examples:\n  ' + examples.join('\n  '));
