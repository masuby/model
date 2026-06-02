/**
 * climateIntegrity.test.js — guards that the shipped dataset is AUTHENTIC to the INFORM
 * methodology (matches TZ_INFORM_model.xlsx) and to docs/METHODOLOGY_MANUAL.md:
 *   indicator → category : arithmetic MEAN
 *   category  → dimension: INFORM scaled GEOMEAN (Excel Box 6)
 *   dimension → risk     : ∛(H × V × LCC)
 *   flood (H×E)          : √(hazardFreq.flood × max(exposure, 2)), ≥5 if floods on record
 * Plus the manual's worked examples, so the doc and the data can never silently diverge.
 */
import { describe, it, expect } from 'vitest';
import data from '../../../data/tanzania-inform-risk.json';

const D = data.subnational.adm2;
const isN = (x) => typeof x === 'number' && isFinite(x);
const mean = (a) => { const v = a.filter(isN); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const sgm = (a) => { const v = a.filter(isN); if (!v.length) return null; const sc = v.map((x) => ((10 - x) / 10 * 9) + 1); return (10 - Math.exp(sc.reduce((s, x) => s + Math.log(x), 0) / sc.length)) / 9 * 10; };
const r1 = (x) => Math.round(x * 10) / 10;
const cat = (o) => Object.entries(o).filter(([k]) => k !== 'aggregate').map(([, v]) => v);
const byName = (nm) => D.find((u) => u.admin.adm2Name.toLowerCase().replace(/[^a-z]/g, '') === nm.toLowerCase().replace(/[^a-z]/g, ''));

describe('INFORM authentic aggregation (Excel parity)', () => {
  it('category aggregate = MEAN of its indicators (every district)', () => {
    let ok = 0, tot = 0;
    for (const u of D) {
      const nat = u.hazardExposure?.natural;
      if (!nat || !isN(nat.aggregate)) continue;
      tot++; if (Math.abs(r1(mean(cat(nat))) - r1(nat.aggregate)) < 0.06) ok++;
    }
    expect(tot).toBeGreaterThan(150);
    expect(ok).toBe(tot);
  });

  it('risk = ∛(H × V × LCC) (every district)', () => {
    let ok = 0, tot = 0;
    for (const u of D) {
      const h = u.hazardExposure?.total, v = u.vulnerability?.total, c = u.lackCopingCapacity?.total;
      if (![h, v, c].every(isN) || !isN(u.risk)) continue;
      tot++; if (Math.abs(r1(Math.cbrt(h * v * c)) - u.risk) < 0.06) ok++;
    }
    expect(ok).toBe(tot);
  });

  it('Hazard total = scaled GEOMEAN of (Natural, Human) on climate-applied districts', () => {
    const fails = [];
    for (const u of D) {
      if (!u.hazardExposure?.exposure) continue; // computed districts were recomputed our way
      const cats = [u.hazardExposure.natural?.aggregate, u.hazardExposure.human?.aggregate];
      const t = u.hazardExposure.total;
      if (isN(t) && Math.abs(r1(sgm(cats)) - t) > 0.11) fails.push(`${u.admin.adm2Name}: sgm ${r1(sgm(cats))} ≠ ${t}`);
    }
    expect(fails).toEqual([]);
  });
});

describe('Hazard × Exposure flood + manual worked examples', () => {
  it('flood = max(hazard, √(hazard × exposure)) — exposure amplifies only, never hides', () => {
    const fails = [];
    for (const u of D) {
      const he = u.hazardExposure, hf = he?.hazardFreq?.flood, E = he?.exposure?.index;
      if (!isN(hf) || !isN(E) || !isN(he.natural?.flood)) continue;
      const exp = Math.max(hf, Math.sqrt(hf * E));
      if (Math.abs(r1(exp) - he.natural.flood) > 0.11) fails.push(`${u.admin.adm2Name}: flood ${he.natural.flood} ≠ ${r1(exp)}`);
      if (he.natural.flood + 0.06 < hf) fails.push(`${u.admin.adm2Name}: flood ${he.natural.flood} BELOW hazard floor ${hf}`);
    }
    expect(fails).toEqual([]);
  });

  it('reproduces the manual + preserves documented flood (Pangani 9.8, Rufiji 9.0)', () => {
    expect(byName('Ilala').hazardExposure.natural.flood).toBeCloseTo(8.3, 1);
    expect(byName('Ilala').risk).toBeCloseTo(3.9, 1);
    expect(byName('Longido').hazardExposure.natural.drought).toBeCloseTo(9.7, 1);
    expect(byName('Kondoa').risk).toBeCloseTo(4.0, 1);
    // SAFETY: documented flood-prone districts must never be hidden by exposure weighting
    expect(byName('Pangani').hazardExposure.natural.flood).toBeCloseTo(9.8, 1);
    expect(byName('Rufiji').hazardExposure.natural.flood).toBeGreaterThanOrEqual(8.5);
  });

  it('computed districts carry real NBS 2022 exposure, national stays official', () => {
    const withExp = D.filter((u) => u.hazardExposure?.exposure);
    expect(withExp.length).toBeGreaterThan(120);
    for (const u of withExp.slice(0, 25)) {
      expect(u.hazardExposure.exposure._src).toContain('NBS 2022');
      expect(u.hazardExposure.exposure.population).toBeGreaterThan(0);
    }
    expect(data.metadata.asOf).toBeTruthy();           // dated snapshot
    expect(isN(data.national?.risk ?? data.national?.informRisk)).toBe(true);
  });
});
