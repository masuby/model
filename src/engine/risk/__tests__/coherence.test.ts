/**
 * The coherence check (MET-13): Pearson's r, the series, the uninformative groups, and the findings the
 * Limitations page quotes about the Core.
 */
import { describe, expect, it } from 'vitest';
import { coherenceMatrix, coherenceSummary, groupCoverage, pearson } from '../coherence';
import { ALL_INDICATORS } from '../hierarchy';
import { buildModel } from '../model';

const model = buildModel();

describe('pearson', () => {
  it('is 1 for a line, −1 for its reverse, 0 across, null without variance or with fewer than three pairs', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 9);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 9);
    expect(pearson([1, 2, 3, 4, 5], [2, 1, 3, 1, 2])).toBeCloseTo(0, 9);
    expect(pearson([1, 2, 3], [5, 5, 5])).toBeNull();
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([1, null, 3, 4], [1, 9, 3, 4])).toBeCloseTo(1, 9); // the pair with a gap is skipped
  });
});

describe('coherence of the Core', () => {
  it('correlates the six categories, the three dimensions and risk (10 series, symmetric matrix)', () => {
    const m = coherenceMatrix(model.sources);
    expect(m.keys).toEqual(['hazard:natural', 'hazard:human', 'vulnerability:socioEconomic', 'vulnerability:vulnerableGroups', 'coping:infrastructure', 'coping:institutional', 'hazard', 'vulnerability', 'coping', 'risk']);
    for (let i = 0; i < m.r.length; i++) {
      expect(m.r[i][i]).toBe(1);
      for (let j = 0; j < m.r.length; j++) expect(m.r[i][j]).toBe(m.r[j][i]);
    }
    // Each dimension moves with the risk it enters.
    const risk = m.keys.indexOf('risk');
    for (const d of ['hazard', 'vulnerability', 'coping']) expect(m.r[m.keys.indexOf(d)][risk]!).toBeGreaterThan(0.3);
  });

  it('finds what the assessment found on the workbook units: the two coping categories move against each other and the institutional category is unrelated to risk', () => {
    const s = coherenceSummary(model.sources);
    expect(s.n).toBe(170);
    expect(s.rows).toHaveLength(9);
    const infra = s.rows.find((r) => r.key === 'coping:infrastructure')!;
    const inst = s.rows.find((r) => r.key === 'coping:institutional')!;
    expect(infra.partner).toBe('institutional');
    expect(infra.withPartner).toBeLessThan(0); // -0.35: the workbook's institutional values are national and regional proxies
    expect(infra.withPartner).toBe(inst.withPartner);
    expect(Math.abs(inst.withRisk!)).toBeLessThan(0.25);
    expect(s.rows.find((r) => r.key === 'coping')!.withPartner).toBeNull();
  });

  it('on the councils the institutional category now carries their own arrangements, and no longer moves against infrastructure', () => {
    // The two Tanzanian institutional indicators (institutional.ts) give the cities and the prepared
    // districts both infrastructure and institutions: the negative correlation of the workbook (-0.38 on
    // the councils without the benchmark) becomes about zero, and the category stays unrelated to risk.
    const s = coherenceSummary(model.councils);
    const infra = s.rows.find((r) => r.key === 'coping:infrastructure')!;
    const inst = s.rows.find((r) => r.key === 'coping:institutional')!;
    expect(infra.withPartner!).toBeGreaterThan(-0.15);
    expect(infra.withPartner!).toBeLessThan(0.2);
    expect(Math.abs(inst.withRisk!)).toBeLessThan(0.25);
    const without = coherenceSummary(buildModel({}, { benchmark: false }).councils);
    expect(without.rows.find((r) => r.key === 'coping:infrastructure')!.withPartner!).toBeLessThan(-0.3);
  });

  it('names the groups with one value for the whole country and the groups empty in the workbook', () => {
    const s = coherenceSummary(model.sources);
    // Coastal erosion and food security are withheld by the quarantine, and internal violence by programme
    // decision (DN-12), so they are empty in the live model's workbook units; the Benchmark 2026 fills the
    // template groups for the councils, not for the workbook units.
    expect(s.constant.map((g) => g.indicator).sort()).toEqual(['conflictIntensity', 'conflictRisk', 'drrImplementation', 'wash'].sort());
    expect(s.empty.map((g) => g.indicator).sort()).toEqual(['coastalHazards', 'economic', 'hazardousMaterial', 'heatwave', 'internalViolence', 'lightning', 'livelihoods', 'vehicleAccidents', 'zoonoses'].sort());
    const cov = groupCoverage(model.sources);
    expect(cov).toHaveLength(ALL_INDICATORS.length);
    expect(cov.filter((g) => g.empty)).toHaveLength(9);
    expect(cov.filter((g) => !g.empty && !g.constant).every((g) => g.distinct > 1)).toBe(true);
  });
});
