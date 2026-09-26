/**
 * The shipped dataset is authentic to the INFORM methodology and to docs/METHODOLOGY.md:
 *   indicator → category : arithmetic MEAN (missing excluded, 0 included)
 *   category  → dimension: INFORM scaled GEOMEAN
 *   dimension → risk     : ∛(H × V × LCC)
 *   flood (H × E)        : max(hazard, √(hazard × exposure)) — exposure amplifies, never hides
 * plus the documented spot values, so the documentation and the data can never silently diverge.
 */
import { describe, expect, it } from 'vitest';
import data from '@/data/tanzania-inform-risk.json';
import { dimensionScore, isNum, mean, riskScore, round1 } from '../math';

type Cat = Record<string, number | null> & { aggregate?: number | null };
interface RawUnit {
  admin: { adm2Name: string };
  hazardExposure: { natural: Cat; human: Cat; total: number | null; exposure?: { population: number; _src: string; index: number }; hazardFreq?: { flood?: number } };
  vulnerability: { socioEconomic: Cat; vulnerableGroups: Cat; total: number | null };
  lackCopingCapacity: { infrastructure: Cat; institutional: Cat; total: number | null };
  risk: number | null;
}
const D = (data as unknown as { subnational: { adm2: RawUnit[] } }).subnational.adm2;
const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const byName = (n: string) => D.find((u) => key(u.admin.adm2Name) === key(n))!;
const values = (c: Cat) => Object.entries(c).filter(([k]) => k !== 'aggregate').map(([, v]) => v);

describe('INFORM authentic aggregation (every source unit)', () => {
  it('category aggregate = mean of its indicators', () => {
    const bad = D.filter((u) => isNum(u.hazardExposure.natural.aggregate) && Math.abs(round1(mean(values(u.hazardExposure.natural))!) - round1(u.hazardExposure.natural.aggregate!)) >= 0.06);
    expect(bad.map((u) => u.admin.adm2Name)).toEqual([]);
  });

  it('every dimension total = scaled geomean of its categories', () => {
    const fails: string[] = [];
    for (const u of D) {
      const pairs: Array<[string, number | null, Array<number | null | undefined>]> = [
        ['H', u.hazardExposure.total, [u.hazardExposure.natural.aggregate, u.hazardExposure.human.aggregate]],
        ['V', u.vulnerability.total, [u.vulnerability.socioEconomic.aggregate, u.vulnerability.vulnerableGroups.aggregate]],
        ['C', u.lackCopingCapacity.total, [u.lackCopingCapacity.infrastructure.aggregate, u.lackCopingCapacity.institutional.aggregate]],
      ];
      for (const [d, total, cats] of pairs) {
        const g = dimensionScore(cats);
        if (isNum(total) && isNum(g) && Math.abs(g - total) > 0.11) fails.push(`${u.admin.adm2Name} ${d}: ${g} ≠ ${total}`);
      }
    }
    expect(fails).toEqual([]);
  });

  it('risk = ∛(H × V × LCC)', () => {
    const bad = D.filter((u) => riskScore(u.hazardExposure.total, u.vulnerability.total, u.lackCopingCapacity.total) !== u.risk);
    expect(bad.map((u) => u.admin.adm2Name)).toEqual([]);
  });
});

describe('Hazard × Exposure flood and documented spot values', () => {
  it('flood = max(hazard, √(hazard × exposure)); never below the hazard floor', () => {
    const fails: string[] = [];
    for (const u of D) {
      const hf = u.hazardExposure.hazardFreq?.flood;
      const E = u.hazardExposure.exposure?.index;
      const f = u.hazardExposure.natural.flood;
      if (!isNum(hf) || !isNum(E) || !isNum(f)) continue;
      if (Math.abs(round1(Math.max(hf, Math.sqrt(hf * E))) - f) > 0.11) fails.push(`${u.admin.adm2Name}: ${f}`);
      if (f + 0.06 < hf) fails.push(`${u.admin.adm2Name}: below floor`);
    }
    expect(fails).toEqual([]);
  });

  it('matches the manual’s worked examples', () => {
    expect(byName('Ilala').hazardExposure.natural.flood).toBeCloseTo(8.3, 1);
    expect(byName('Longido').hazardExposure.natural.drought).toBeCloseTo(9.7, 1);
    expect(byName('Kondoa').hazardExposure.natural.drought).toBeCloseTo(8.6, 1);
    expect(byName('Pangani').hazardExposure.natural.flood).toBeCloseTo(9.8, 1);
    expect(byName('Rufiji').hazardExposure.natural.flood!).toBeGreaterThanOrEqual(8.5);
  });

  it('newly-populated hazard layers reach their real geographies', () => {
    const filled = (k: string) => D.filter((u) => (u.hazardExposure.natural[k] ?? 0) > 0).length;
    expect(filled('heatwave')).toBeGreaterThan(120);
    expect(filled('lightning')).toBeGreaterThan(100);
    expect(byName('Mafia').hazardExposure.natural.stormsCyclone!).toBeGreaterThanOrEqual(8);
    expect(byName('Ngorongoro').hazardExposure.natural.volcano!).toBeGreaterThanOrEqual(7);
    expect(byName('Kasulu').vulnerability.vulnerableGroups.displacedPeople!).toBeGreaterThanOrEqual(8);
  });

  it('computed units carry NBS 2022 exposure', () => {
    const withExp = D.filter((u) => u.hazardExposure.exposure);
    expect(withExp.length).toBeGreaterThan(120);
    for (const u of withExp.slice(0, 25)) {
      expect(u.hazardExposure.exposure!._src).toContain('NBS 2022');
      expect(u.hazardExposure.exposure!.population).toBeGreaterThan(0);
    }
  });
});

describe('missing-data treatment (null = excluded, 0 = real zero)', () => {
  it('null is excluded; 0 is included', () => {
    expect(mean([5, 5, null])).toBe(5);
    expect(mean([5, 5, 0])).toBeCloseTo(3.33, 1);
    expect(mean([null, undefined, NaN])).toBeNull();
  });
  it('the all-null "economic" leaf does not distort Vulnerability', () => {
    let checked = 0;
    for (const u of D) {
      const vg = u.vulnerability.vulnerableGroups;
      if (!isNum(vg.aggregate)) continue;
      expect(vg.aggregate).toBeCloseTo(round1(mean(values(vg))!), 1);
      checked++;
    }
    expect(checked).toBeGreaterThan(150);
  });
});
