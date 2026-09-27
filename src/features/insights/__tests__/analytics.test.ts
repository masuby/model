import { CLASS_KEYS, classify } from '@/engine/risk/classes';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { buildModel, dataCoverage, topDrivers } from '@/engine/risk/model';
import { sourceFor } from '@/engine/risk/sources';
import {
  classCounts,
  classDistributionByRegion,
  columnMaxima,
  correlationColor,
  correlationMatrix,
  coverageHistogram,
  hazardMatrix,
  headline,
  indicatorStats,
  inkOn,
  isHighOrAbove,
  MATRIX_HAZARDS,
  pearson,
  rankUnits,
  resolutionBreakdown,
  sortMatrix,
  strengthOf,
  needsPlate,
  topDriverCounts,
} from '../analytics';

const model = buildModel();

describe('headline', () => {
  const h = headline(model);

  it('uses the official national figure and counts High+ councils by the risk thresholds', () => {
    expect(h.nationalRisk).toBe(model.national.risk);
    expect(h.councils).toBe(model.councils.length);
    expect(h.highCount).toBe(model.councils.filter((u) => (classify(u.risk)?.index ?? -1) >= 3).length);
    expect(h.highShare).toBeCloseTo(h.highCount / h.councils, 10);
  });

  it('sums population of High+ councils and never exceeds the total', () => {
    const expected = model.councils.filter(isHighOrAbove).reduce((s, u) => s + (u.exposure?.population ?? 0), 0);
    expect(h.exposedPopulation).toBe(expected);
    expect(h.exposedPopulation).toBeLessThanOrEqual(h.totalPopulation);
    expect(h.exposedShare).toBeGreaterThanOrEqual(0);
    expect(h.exposedShare).toBeLessThanOrEqual(1);
  });

  it('picks the highest- and lowest-risk regions', () => {
    const risks = model.regions.map((r) => r.risk ?? -Infinity);
    expect(h.topRegion?.risk).toBe(Math.max(...risks));
    expect(h.bottomRegion?.risk).toBe(Math.min(...model.regions.map((r) => r.risk ?? Infinity)));
  });

  it('counts council + district indicators as local', () => {
    const local = ALL_INDICATORS.filter((l) => ['council', 'district'].includes(sourceFor(l.dimension.key, l.indicator.key).resolution)).length;
    expect(h.localIndicators).toBe(local);
    expect(h.indicatorTotal).toBe(ALL_INDICATORS.length);
  });
});

describe('rankings & distributions', () => {
  it('ranks regions by each lens, highest first', () => {
    for (const lens of ['risk', 'hazard', 'vulnerability', 'coping'] as const) {
      const rows = rankUnits(model.regions, lens);
      expect(rows).toHaveLength(model.regions.length);
      for (let i = 1; i < rows.length; i++) expect(rows[i - 1].value ?? -1).toBeGreaterThanOrEqual(rows[i].value ?? -1);
    }
  });

  it('class counts cover every council with a risk score', () => {
    const counts = classCounts(model.councils);
    const n = CLASS_KEYS.reduce((s, k) => s + counts[k], 0);
    expect(n).toBe(model.councils.filter((u) => typeof u.risk === 'number').length);
  });

  it('distribution by region accounts for every council exactly once', () => {
    const rows = classDistributionByRegion(model);
    expect(rows).toHaveLength(model.regions.length);
    expect(rows.reduce((s, r) => s + r.total, 0)).toBe(model.councils.length);
    for (const r of rows) {
      expect(r.highShare).toBeGreaterThanOrEqual(0);
      expect(r.highShare).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].highShare).toBeGreaterThanOrEqual(rows[i].highShare);
  });
});

describe('hazard matrix', () => {
  const rows = hazardMatrix(model.regions);

  it('has one row per region and one value per natural hazard', () => {
    expect(rows).toHaveLength(model.regions.length);
    for (const r of rows) expect(Object.keys(r.values).sort()).toEqual([...MATRIX_HAZARDS].sort());
  });

  it('sorts by a column in both directions with missing values last', () => {
    const desc = sortMatrix(rows, 'drought', 'desc');
    const asc = sortMatrix(rows, 'drought', 'asc');
    const vals = (xs: typeof rows) => xs.map((r) => r.values.drought).filter((v): v is number => typeof v === 'number');
    expect(vals(desc)).toEqual([...vals(desc)].sort((a, b) => b - a));
    expect(vals(asc)).toEqual([...vals(asc)].sort((a, b) => a - b));
    const byName = sortMatrix(rows, 'name', 'asc').map((r) => r.name);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));
  });

  it('finds the column maxima', () => {
    const max = columnMaxima(rows);
    const flood = rows.map((r) => r.values.flood).filter((v): v is number => typeof v === 'number');
    expect(max.flood).toBe(Math.max(...flood));
  });
});

describe('drivers', () => {
  it('counts every council at least once and includes each council’s topDrivers(unit, 1)', () => {
    const counts = topDriverCounts(model.councils);
    const total = counts.reduce((s, c) => s + c.count, 0);
    expect(total).toBeGreaterThanOrEqual(model.councils.length);
    const sole = counts.reduce((s, c) => s + c.sole, 0);
    expect(sole).toBeLessThanOrEqual(model.councils.length);
    for (const u of model.councils.slice(0, 20)) {
      const first = topDrivers(u, 1)[0];
      expect(counts.some((c) => c.dim === first.dim && c.key === first.key)).toBe(true);
    }
    for (let i = 1; i < counts.length; i++) expect(counts[i - 1].count).toBeGreaterThanOrEqual(counts[i].count);
  });

  it('indicator stats: mean between min and max, n ≤ councils', () => {
    const stats = indicatorStats(model.councils);
    expect(stats).toHaveLength(ALL_INDICATORS.length);
    for (const s of stats) {
      expect(s.n).toBeLessThanOrEqual(model.councils.length);
      if (s.mean !== null) {
        expect(s.mean).toBeGreaterThanOrEqual((s.min as number) - 1e-9);
        expect(s.mean).toBeLessThanOrEqual((s.max as number) + 1e-9);
      } else expect(s.n).toBe(0);
    }
  });

  it('reflects approved edits (nothing is hard-coded)', () => {
    const id = model.councils[0].id;
    const edited = buildModel({ [id]: { 'hazard:drought': { value: 10, at: '2026-01-01T00:00:00Z' } } });
    const before = indicatorStats(model.councils).find((s) => s.key === 'drought')!;
    const after = indicatorStats(edited.councils).find((s) => s.key === 'drought')!;
    const original = model.councils[0].dims.hazard.categories.natural.indicators.drought ?? 0;
    expect(after.mean!).toBeCloseTo(before.mean! + (10 - original) / model.councils.length, 6);
  });
});

describe('coverage & provenance', () => {
  it('histogram accounts for every council', () => {
    const bins = coverageHistogram(model.councils);
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(model.councils.length);
    expect(bins.map((b) => b.coverage)).toEqual([...new Set(model.councils.map(dataCoverage))].sort((a, b) => a - b));
  });

  it('resolution groups partition all indicators', () => {
    const groups = resolutionBreakdown();
    expect(groups.reduce((s, g) => s + g.count, 0)).toBe(ALL_INDICATORS.length);
  });
});

describe('correlation', () => {
  it('pearson handles perfect, inverse and degenerate cases', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 12);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 12);
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull();
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([1, null, 3, 4, 5], [2, 9, 6, 8, 10])).toBeCloseTo(1, 12);
  });

  it('matrix is symmetric with a unit diagonal and values in [-1, 1]', () => {
    const m = correlationMatrix(model.councils);
    expect(m.n).toBe(model.councils.length);
    for (let i = 0; i < m.keys.length; i++) {
      expect(m.r[i][i]).toBe(1);
      for (let j = 0; j < m.keys.length; j++) {
        expect(m.r[i][j]).toBeCloseTo(m.r[j][i] as number, 12);
        expect(Math.abs(m.r[i][j] as number)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('describes strength by |r|', () => {
    expect(strengthOf(0.05)).toBe('none');
    expect(strengthOf(-0.2)).toBe('weak');
    expect(strengthOf(0.4)).toBe('moderate');
    expect(strengthOf(-0.6)).toBe('strong');
    expect(strengthOf(0.9)).toBe('veryStrong');
  });
});

describe('colour helpers', () => {
  it('picks the ink with the higher WCAG contrast, and a plate when neither reaches AA', () => {
    expect(inkOn('#ffffff')).toBe('#0b1324');
    expect(inkOn('#000000')).toBe('#ffffff');
    expect(inkOn('rgb(127, 39, 4)')).toBe('#ffffff');
    expect(needsPlate('#ffffff')).toBe(false);
    expect(needsPlate('#7f2704')).toBe(false);
    expect(needsPlate('#d94801')).toBe(true); // mid-orange: 4.3:1 at best
  });

  it('diverging colour is neutral at 0 and a pole at ±1', () => {
    expect(correlationColor(0, '#eeeeee')).toBe('rgb(238, 238, 238)');
    expect(correlationColor(1, '#eeeeee')).toBe('rgb(178, 24, 43)');
    expect(correlationColor(-1, '#eeeeee')).toBe('rgb(33, 102, 172)');
    expect(correlationColor(null, '#eeeeee')).toBe('#eeeeee');
  });
});
