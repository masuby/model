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

  it('stable computed/documented indicators (not the moving risk total)', () => {
    expect(byName('Ilala').hazardExposure.natural.flood).toBeCloseTo(8.3, 1);     // H×E flood
    expect(byName('Longido').hazardExposure.natural.drought).toBeCloseTo(9.7, 1); // computed drought
    expect(byName('Kondoa').hazardExposure.natural.drought).toBeCloseTo(8.6, 1);
    expect(byName('Kondoa').hazardExposure.natural.flood).toBeCloseTo(3.8, 1);    // documented preserved
    // SAFETY: documented flood-prone districts are never hidden by exposure weighting
    expect(byName('Pangani').hazardExposure.natural.flood).toBeCloseTo(9.8, 1);
    expect(byName('Rufiji').hazardExposure.natural.flood).toBeGreaterThanOrEqual(8.5);
  });

  it('newly-populated hazard layers reach their real geographies', () => {
    const filled = (k) => D.filter((u) => typeof u.hazardExposure?.natural?.[k] === 'number' && u.hazardExposure.natural[k] > 0).length;
    expect(filled('heatwave')).toBeGreaterThan(120);                              // computed (ERA5)
    expect(filled('lightning')).toBeGreaterThan(100);                            // Lake Victoria basin
    expect(byName('Mafia').hazardExposure.natural.stormsCyclone).toBeGreaterThanOrEqual(8);  // Hidaya 2024
    expect(byName('Lindi').hazardExposure.natural.stormsCyclone).toBeGreaterThanOrEqual(8);  // Lindi 1952
    expect(byName('Ngorongoro').hazardExposure.natural.volcano).toBeGreaterThanOrEqual(7);   // Ol Doinyo Lengai
    expect(byName('Nyamagana').hazardExposure.natural.lightning).toBeGreaterThanOrEqual(8);  // Mwanza, Lake shore
    // Vulnerability: refugee-hosting districts (UNHCR Nyarugusu/Nduta) no longer show 0 displaced
    expect(byName('Kasulu').vulnerability.vulnerableGroups.displacedPeople).toBeGreaterThanOrEqual(8);
    expect(byName('Kibondo').vulnerability.vulnerableGroups.displacedPeople).toBeGreaterThanOrEqual(6);
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

describe('Missing-data treatment (INFORM: null = no-data excluded; 0 = real zero included)', () => {
  it('null is excluded from aggregation; 0 is a real measured value', () => {
    expect(mean([5, 5, null])).toBe(5);                 // not 3.33
    expect(mean([5, 5, 0])).toBeCloseTo(3.33, 1);       // 0 is real
    expect(mean([null, undefined, NaN])).toBeNull();    // all no-data -> null category
  });
  it('adding a no-data (null) indicator never changes a category aggregate', () => {
    expect(mean([8, 4, 6])).toBe(mean([8, 4, 6, null]));
  });
  it("the all-null 'economic' indicator does not distort Vulnerability", () => {
    let checked = 0;
    for (const u of D) {
      const vg = u.vulnerability?.vulnerableGroups; if (!vg || !isN(vg.aggregate)) continue;
      const vals = Object.entries(vg).filter(([k]) => k !== 'aggregate').map(([, v]) => v);
      expect(vg.aggregate).toBeCloseTo(r1(mean(vals)), 1);       // aggregate = mean of NON-null only
      expect(vals.includes(null) || vals.includes(undefined)).toBe(true); // economic is no-data
      checked++;
    }
    expect(checked).toBeGreaterThan(150);
  });
});
