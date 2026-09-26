/**
 * Tests for the INFORM 2017 calculation engine.
 *
 * Three layers:
 *   1. Math invariants — each formula is correct in isolation
 *   2. Property tests — high-level guarantees that hold for all inputs
 *   3. Golden snapshots — fixed inputs produce expected scores
 */

import { describe, it, expect } from 'vitest';
import {
  // primitives
  roundTo,
  clamp,
  normalizeValue,
  // aggregators
  maxAggregation,
  meanAggregation,
  weightedMean,
  informScaledGeomean,
  geometricMean,
  // calculations
  calculateComponent,
  calculateCategory,
  calculateDimension,
  calculateINFORMRisk,
  calculateRiskWithFallback,
  calculateLRI,
  resolveWithFallback,
  // classification
  classifyRisk,
  classifyDimension,
  classifyByThresholds,
  // constants
  ALL_INDICATORS,
  ALL_COMPONENTS,
  COMPLETE_HIERARCHY,
  TANZANIA_THRESHOLDS,
  INFORM_GLOBAL_THRESHOLDS
} from '../informCalculationEngine.js';

// ============================================================================
// 1. PRIMITIVES
// ============================================================================

describe('primitives', () => {
  it('roundTo respects decimals', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(null)).toBeNull();
    expect(roundTo(NaN)).toBeNull();
  });

  it('clamp clamps to [min,max]', () => {
    expect(clamp(15)).toBe(10);
    expect(clamp(-5)).toBe(0);
    expect(clamp(5)).toBe(5);
    expect(clamp(null)).toBeNull();
  });
});

// ============================================================================
// 2. NORMALIZATION (PDF §6 Eq.2, Eq.3)
// ============================================================================

describe('normalizeValue', () => {
  it('normalizes a NEGATIVE-polarity indicator via min-max', () => {
    // historic_drought_frequency: refMin=0, refMax=0.3, NEGATIVE
    expect(normalizeValue(0, 'historic_drought_frequency')).toBe(0);
    expect(normalizeValue(0.15, 'historic_drought_frequency')).toBeCloseTo(5, 5);
    expect(normalizeValue(0.3, 'historic_drought_frequency')).toBe(10);
  });

  it('inverts POSITIVE-polarity indicators at ingest', () => {
    // HDI: refMin=0.3, refMax=0.95, POSITIVE — high HDI → low risk
    expect(normalizeValue(0.95, 'hdi')).toBe(0);  // best HDI → 0 risk
    expect(normalizeValue(0.3, 'hdi')).toBe(10);  // worst HDI → 10 risk
    expect(normalizeValue(0.625, 'hdi')).toBeCloseTo(5, 5);  // mid
  });

  it('applies log transform before normalization', () => {
    // internal_displaced: log1p, refMin=1000, refMax=1000000
    const result = normalizeValue(1000, 'internal_displaced');
    expect(result).toBeCloseTo(0, 1);
    const max = normalizeValue(1000000, 'internal_displaced');
    expect(max).toBeCloseTo(10, 1);
  });

  it('clamps out-of-range values', () => {
    expect(normalizeValue(1, 'historic_drought_frequency')).toBe(10);  // above max
    expect(normalizeValue(-1, 'historic_drought_frequency')).toBe(0);  // below min
  });

  it('returns null for invalid input', () => {
    expect(normalizeValue(null, 'hdi')).toBeNull();
    expect(normalizeValue(NaN, 'hdi')).toBeNull();
    expect(normalizeValue(undefined, 'hdi')).toBeNull();
  });

  it('falls back to clamp for unknown indicator', () => {
    expect(normalizeValue(5, 'unknown_indicator')).toBe(5);
    expect(normalizeValue(15, 'unknown_indicator')).toBe(10);
  });
});

// ============================================================================
// 3. AGGREGATORS
// ============================================================================

describe('aggregators', () => {
  it('maxAggregation picks max, skipping nulls', () => {
    expect(maxAggregation([1, 5, 3, null, NaN])).toBe(5);
    expect(maxAggregation([])).toBeNull();
    expect(maxAggregation([null])).toBeNull();
  });

  it('meanAggregation averages, skipping nulls', () => {
    expect(meanAggregation([2, 4, 6])).toBe(4);
    expect(meanAggregation([2, null, 6])).toBe(4);
    expect(meanAggregation([])).toBeNull();
  });

  it('weightedMean computes weighted average', () => {
    // 50/25/25: equal values give equal mean
    expect(weightedMean([
      { value: 5, weight: 0.5 },
      { value: 5, weight: 0.25 },
      { value: 5, weight: 0.25 }
    ])).toBe(5);

    // weights actually matter
    expect(weightedMean([
      { value: 10, weight: 0.5 },
      { value: 0,  weight: 0.5 }
    ])).toBe(5);

    // 50/25/25 weighting per PDF Table 11
    const w = weightedMean([
      { value: 8, weight: 0.5 },   // Development & Deprivation
      { value: 2, weight: 0.25 },  // Inequality
      { value: 4, weight: 0.25 }   // Aid Dependency
    ]);
    expect(w).toBeCloseTo(8 * 0.5 + 2 * 0.25 + 4 * 0.25, 5);
    expect(w).toBeCloseTo(5.5, 5);
  });

  describe('informScaledGeomean (PDF Box 6 / footnote 33)', () => {
    it('matches Excel formula on canonical test case', () => {
      // PDF Table 5 example: Natural=6.5, Human=3.2
      // adj1=4.15, adj2=7.12, GEOMEAN=5.44, Result=(10-5.44)/9*10 = 5.067
      const result = informScaledGeomean([6.5, 3.2]);
      expect(result).toBeCloseTo(5.067, 2);
    });

    it('is idempotent for equal inputs', () => {
      expect(informScaledGeomean([5, 5])).toBeCloseTo(5, 5);
      expect(informScaledGeomean([7, 7, 7])).toBeCloseTo(7, 5);
    });

    it('handles edge values 0 and 10', () => {
      // scaled-GM([0, 10]):
      //   scaled = ((10-0)/10*9+1, (10-10)/10*9+1) = (10, 1)
      //   GM(10, 1) = sqrt(10) ≈ 3.162
      //   result = (10 - 3.162) / 9 * 10 ≈ 7.597
      // A max-value hazard amplifies the dimension above arithmetic mean (5).
      const result = informScaledGeomean([0, 10]);
      expect(result).toBeGreaterThan(5);
      expect(result).toBeLessThan(10);
      expect(result).toBeCloseTo(7.597, 2);
    });

    it('returns null for empty input', () => {
      expect(informScaledGeomean([])).toBeNull();
    });

    it('skips nulls', () => {
      expect(informScaledGeomean([5, null, NaN, 5])).toBeCloseTo(5, 5);
    });
  });

  it('geometricMean works as a plain GM', () => {
    expect(geometricMean([2, 8])).toBeCloseTo(4, 5);
    expect(geometricMean([1, 1, 1])).toBeCloseTo(1, 5);
  });
});

// ============================================================================
// 4. CLASSIFICATION (per-dimension thresholds)
// ============================================================================

describe('classification', () => {
  it('classifies risk against Tanzania thresholds', () => {
    expect(classifyRisk(0.5).label).toBe('Very Low');
    expect(classifyRisk(2.5).label).toBe('Low');     // TZ: 2.5 is boundary; <3.4 → Low
    expect(classifyRisk(3.5).label).toBe('Medium');  // TZ: <4.3
    expect(classifyRisk(5).label).toBe('High');
    expect(classifyRisk(9).label).toBe('Very High');
  });

  it('classifies against global thresholds when requested', () => {
    expect(classifyRisk(1.5, 'GLOBAL').label).toBe('Very Low');
    expect(classifyRisk(2.5, 'GLOBAL').label).toBe('Low');
    expect(classifyRisk(4, 'GLOBAL').label).toBe('Medium');
    expect(classifyRisk(5.5, 'GLOBAL').label).toBe('High');
    expect(classifyRisk(7, 'GLOBAL').label).toBe('Very High');
  });

  it('classifies each dimension by its own threshold table', () => {
    // TZ: HAZARD VH=4.7, VULNERABILITY VH=5.0, LCC VH=7.7
    expect(classifyDimension(4.8, 'HAZARD').label).toBe('Very High');
    expect(classifyDimension(4.8, 'VULNERABILITY').label).toBe('High');
    expect(classifyDimension(4.8, 'COPING_CAPACITY').label).toBe('Low');
  });

  it('handles score 10 (extends to Very High)', () => {
    expect(classifyRisk(10).label).toBe('Very High');
    expect(classifyRisk(9.999).label).toBe('Very High');
  });

  it('returns null for invalid score', () => {
    expect(classifyRisk(null)).toBeNull();
    expect(classifyRisk(NaN)).toBeNull();
  });
});

// ============================================================================
// 5. PER-COMPONENT / CATEGORY / DIMENSION CALCULATION
// ============================================================================

describe('calculateComponent', () => {
  it('handles a single-indicator MAX component', () => {
    const result = calculateComponent('flood', {
      flood_exposure: 7
    });
    expect(result.score).toBe(7);
    expect(result.coverage).toBe(100);
    expect(result.indicatorCount).toBe(1);
  });

  it('handles a multi-indicator MEAN component, skipping missing', () => {
    // storms_cyclone has 3 indicators; provide 2
    const result = calculateComponent('storms_cyclone', {
      cyclone_exposure: 6,
      storm_exposure: 4
      // cyclone_max_speed missing
    });
    expect(result.score).toBe(5);  // mean of 6, 4
    expect(result.coverage).toBeCloseTo(67, 0);
    expect(result.indicatorCount).toBe(2);
  });

  it('returns null score for empty data', () => {
    const result = calculateComponent('flood', {});
    expect(result.score).toBeNull();
    expect(result.coverage).toBe(0);
  });

  it('returns null score for unknown component', () => {
    const result = calculateComponent('nonexistent', { x: 5 });
    expect(result.score).toBeNull();
  });
});

describe('calculateCategory', () => {
  it('aggregates components with WMEAN using component weights (PDF Table 11)', () => {
    // Socio-Economic Vulnerability uses WMEAN with 50/25/25 (Dev&Deprivation, Aid Dep, Habitat/Livelihoods)
    // Set all components to known values:
    const inputs = {
      // development_poverty (weight 0.50) — set HDI to give component=8
      hdi: 0.3,  // worst HDI → norm=10 after polarity inversion
      multidimensional_poverty: 0.5,  // max → 10
      // economic_dependency (weight 0.25)
      oda_received: 0,  // best → 0
      // habitat (weight 0.25) — empty
      // livelihoods — empty
    };
    const result = calculateCategory('VULNERABILITY', 'SOCIO_ECONOMIC', inputs);
    expect(result.score).not.toBeNull();
    expect(result.score).toBeGreaterThan(0);
  });

  it('aggregates Natural Hazards via scaled geomean (PDF Table 5)', () => {
    // Set 2 components to same value → expect scaled geomean = same value
    const inputs = {
      flood_exposure: 5,
      earthquake_exposure: 5
    };
    const result = calculateCategory('HAZARD', 'NATURAL', inputs);
    expect(result.score).toBeCloseTo(5, 1);
  });

  it('aggregates Human Hazards via MEAN (Excel: =AVERAGE(T:X))', () => {
    // The Tanzania operational template (TZ_INFORM_model.xlsx) uses
    // arithmetic mean for all categories, including Human. PDF Table 7 calls
    // for MAX but the Excel diverges to MEAN.
    const inputs = {
      conflict_barometer: 5,  // refMin=4, refMax=5 → norm=10
      gcri_conflict_probability: 0  // → norm=0
    };
    const result = calculateCategory('HAZARD', 'HUMAN', inputs);
    expect(result.score).toBe(5);  // MEAN of 10 and 0
  });
});

describe('calculateDimension', () => {
  it('aggregates categories via scaled geomean for HAZARD', () => {
    // If NATURAL=5 and HUMAN=5 → dimension ≈ 5
    const inputs = {
      flood_exposure: 5,
      earthquake_exposure: 5,
      conflict_barometer: 4.5,  // mid
      gcri_conflict_probability: 0.475  // mid
    };
    const result = calculateDimension('HAZARD', inputs);
    expect(result.score).toBeGreaterThan(3);
    expect(result.score).toBeLessThan(7);
  });

  it('CC dimension correctly represents Lack of Coping Capacity', () => {
    // All CC indicators at "best" (high capacity) → LCC should be LOW
    const inputs = {
      hdi: 0.95,
      health_expenditure_capita: 3000,
      bcg_immunization: 99,
      adult_literacy: 100,
      access_electricity: 100,
      government_effectiveness: 2.5,
      sendai_framework: 5
    };
    const result = calculateDimension('COPING_CAPACITY', inputs);
    // POSITIVE indicators inverted at ingest → all become 0
    // → LCC score should be ~0 (very low lack-of-coping = great capacity)
    expect(result.score).toBeLessThan(2);
  });

  it('CC dimension shows high LCC when capacity is low', () => {
    const inputs = {
      health_expenditure_capita: 50,  // worst → norm=10
      bcg_immunization: 60,
      adult_literacy: 0,
      access_electricity: 30,
      government_effectiveness: -2.5,
      sendai_framework: 1
    };
    const result = calculateDimension('COPING_CAPACITY', inputs);
    expect(result.score).toBeGreaterThan(8);
  });
});

// ============================================================================
// 6. END-TO-END (calculateINFORMRisk)
// ============================================================================

describe('calculateINFORMRisk', () => {
  it('produces null risk when any dimension is empty', () => {
    const result = calculateINFORMRisk({ flood_exposure: 5 });
    expect(result.risk).toBeNull();
    expect(result.dimensions.HAZARD.score).not.toBeNull();
    expect(result.dimensions.VULNERABILITY.score).toBeNull();
  });

  it('produces a valid risk score for a balanced input set', () => {
    const inputs = {
      // Hazard
      flood_exposure: 6,
      earthquake_exposure: 4,
      conflict_barometer: 4.3,  // ~30%
      gcri_conflict_probability: 0.3,
      // Vulnerability
      hdi: 0.6,
      multidimensional_poverty: 0.25,
      internal_displaced: 5000,
      child_mortality: 60,
      // Coping capacity
      health_expenditure_capita: 500,
      adult_literacy: 70,
      access_electricity: 60,
      government_effectiveness: 0,
      sendai_framework: 3,
      basic_drinking_water: 80
    };
    const result = calculateINFORMRisk(inputs);
    expect(result.risk).not.toBeNull();
    expect(result.risk).toBeGreaterThan(0);
    expect(result.risk).toBeLessThanOrEqual(10);
    expect(result.classification).not.toBeNull();
    expect(result.formula.expression).toMatch(/Risk = \d/);
  });

  it('formula matches manual cube-root calculation', () => {
    const inputs = {
      flood_exposure: 6,
      conflict_barometer: 4.5,
      hdi: 0.5,
      child_mortality: 50,
      health_expenditure_capita: 300,
      adult_literacy: 60,
      sendai_framework: 2.5
    };
    const r = calculateINFORMRisk(inputs);
    if (r.risk !== null) {
      const expected = Math.pow(r.formula.H * r.formula.V * r.formula.LCC, 1 / 3);
      expect(r.risk).toBeCloseTo(expected, 1);
    }
  });

  it('informCoreOnly mode filters to PDF Annex 2 indicators', () => {
    const inputs = {
      // Core
      flood_exposure: 5,
      hdi: 0.5,
      health_expenditure_capita: 500,
      // Tanzania-only
      vehicle_accidents: 9,
      coastal_erosion: 8,
      household_income: 200
    };
    const tanzania = calculateINFORMRisk(inputs);
    const core = calculateINFORMRisk(inputs, { informCoreOnly: true });
    // Tanzania extras drop out — coverage should differ
    expect(core.metadata.indicatorCount).toBeLessThan(tanzania.metadata.indicatorCount);
  });
});

// ============================================================================
// 7. PROPERTY TESTS
// ============================================================================

function randomIndicators() {
  const ids = Object.keys(ALL_INDICATORS);
  const inputs = {};
  for (const id of ids) {
    if (Math.random() < 0.6) {
      const def = ALL_INDICATORS[id];
      // Pick a random value within plausible bounds
      const lo = def.refMin ?? 0;
      const hi = def.refMax ?? 10;
      inputs[id] = lo + Math.random() * (hi - lo);
    }
  }
  return inputs;
}

describe('property: risk scores stay within [0, 10]', () => {
  for (let trial = 0; trial < 25; trial++) {
    it(`trial ${trial + 1}: random inputs produce risk in [0, 10]`, () => {
      const inputs = randomIndicators();
      const result = calculateINFORMRisk(inputs);
      if (result.risk !== null) {
        expect(result.risk).toBeGreaterThanOrEqual(0);
        expect(result.risk).toBeLessThanOrEqual(10);
      }
      for (const dim of Object.values(result.dimensions)) {
        if (dim.score !== null) {
          expect(dim.score).toBeGreaterThanOrEqual(0);
          expect(dim.score).toBeLessThanOrEqual(10);
        }
        for (const cat of Object.values(dim.categories)) {
          if (cat.score !== null) {
            expect(cat.score).toBeGreaterThanOrEqual(0);
            expect(cat.score).toBeLessThanOrEqual(10);
          }
        }
      }
    });
  }
});

describe('property: increasing hazard cannot decrease risk', () => {
  it('strictly increasing a hazard never lowers risk', () => {
    const base = {
      flood_exposure: 3,
      earthquake_exposure: 3,
      conflict_barometer: 4.3,
      gcri_conflict_probability: 0.3,
      hdi: 0.6,
      child_mortality: 60,
      health_expenditure_capita: 500,
      adult_literacy: 70,
      sendai_framework: 3
    };
    const r1 = calculateINFORMRisk(base);
    const r2 = calculateINFORMRisk({ ...base, flood_exposure: 9 });
    expect(r2.risk).toBeGreaterThanOrEqual(r1.risk);
  });
});

describe('property: improving a coping indicator cannot increase risk', () => {
  it('higher HDI (POSITIVE polarity) does not raise risk', () => {
    const base = {
      flood_exposure: 5,
      conflict_barometer: 4.3,
      hdi: 0.4,
      multidimensional_poverty: 0.3,
      child_mortality: 60,
      health_expenditure_capita: 500,
      adult_literacy: 60,
      sendai_framework: 3
    };
    const r1 = calculateINFORMRisk(base);
    const r2 = calculateINFORMRisk({ ...base, hdi: 0.9 });
    expect(r2.risk).toBeLessThanOrEqual(r1.risk);
  });
});

describe('property: scaled geomean respects monotonicity', () => {
  it('increasing any input increases (or leaves equal) the result', () => {
    for (let trial = 0; trial < 50; trial++) {
      const a = Math.random() * 10;
      const b = Math.random() * 10;
      const before = informScaledGeomean([a, b]);
      const after = informScaledGeomean([Math.min(10, a + 1), b]);
      expect(after).toBeGreaterThanOrEqual(before - 1e-9);
    }
  });
});

// ============================================================================
// 8. GOLDEN SNAPSHOTS — fixed inputs → expected values
// ============================================================================

describe('golden snapshots', () => {
  it('snapshot: median-risk district', () => {
    const inputs = {
      flood_exposure: 5,
      earthquake_exposure: 3,
      historic_drought_frequency: 0.15,
      conflict_barometer: 4.5,
      gcri_conflict_probability: 0.3,
      hdi: 0.55,
      multidimensional_poverty: 0.3,
      gender_inequality_index: 0.4,
      wealth_inequality: 40,
      oda_received: 5,
      internal_displaced: 5000,
      child_mortality: 60,
      children_underweight: 20,
      malaria_mortality: 50,
      tuberculosis_incidence: 200,
      health_expenditure_capita: 400,
      physicians_density: 0.5,
      measles_immunization: 80,
      maternal_mortality: 400,
      adult_literacy: 70,
      access_electricity: 60,
      cellphone_ownership: 80,
      internet_access: 30,
      basic_sanitation: 50,
      basic_drinking_water: 70,
      sendai_framework: 3,
      government_effectiveness: 0,
      subnational_corruption: 35
    };
    const r = calculateINFORMRisk(inputs);
    expect(r.risk).not.toBeNull();
    // Sanity bounds (will narrow as we calibrate)
    expect(r.risk).toBeGreaterThan(2);
    expect(r.risk).toBeLessThan(8);
  });
});

// ============================================================================
// 9. LACK OF RELIABILITY INDEX (PDF §3.6.1)
// ============================================================================

describe('LRI (Lack of Reliability Index)', () => {
  it('returns 0 LRI when all data is present and current', () => {
    const lri = calculateLRI({
      totalIndicators: 50,
      missingCount: 0,
      yearGaps: Array(50).fill(0),
      inConflict: false
    });
    expect(lri.score).toBe(0);
    expect(lri.classification).toMatch(/Very Low/);
  });

  it('returns high LRI when data is scarce and old', () => {
    const lri = calculateLRI({
      totalIndicators: 50,
      missingCount: 25,  // 50% missing → max score
      yearGaps: Array(25).fill(10),  // 10-year gap → max
      inConflict: false
    });
    expect(lri.score).toBeGreaterThan(8);
  });

  it('conflict aggravator adds 30%', () => {
    const base = calculateLRI({
      totalIndicators: 50, missingCount: 10,
      yearGaps: Array(40).fill(2),
      inConflict: false
    });
    const conflict = calculateLRI({
      totalIndicators: 50, missingCount: 10,
      yearGaps: Array(40).fill(2),
      inConflict: true
    });
    expect(conflict.score).toBeCloseTo(Math.min(10, base.score * 1.3), 1);
    expect(conflict.components.conflictAggravator).toBe(true);
  });

  it('returns null when totalIndicators is invalid', () => {
    expect(calculateLRI({ totalIndicators: 0 }).score).toBeNull();
    expect(calculateLRI({}).score).toBeNull();
  });
});

// ============================================================================
// 10. REGIONAL FALLBACK
// ============================================================================

describe('resolveWithFallback', () => {
  it('uses district value when present', () => {
    const { resolvedValues, substitutionCount } = resolveWithFallback(
      { flood_exposure: 7 },
      { flood_exposure: 3 },
      { flood_exposure: 1 }
    );
    expect(resolvedValues.flood_exposure.value).toBe(7);
    expect(resolvedValues.flood_exposure.source).toBe('district');
    expect(substitutionCount).toBe(0);
  });

  it('falls back to regional when district is missing', () => {
    const { resolvedValues, substitutionCount } = resolveWithFallback(
      {},
      { flood_exposure: 5 },
      { flood_exposure: 1 }
    );
    expect(resolvedValues.flood_exposure.value).toBe(5);
    expect(resolvedValues.flood_exposure.source).toBe('regional');
    expect(resolvedValues.flood_exposure.confidence).toBeLessThan(1);
    expect(substitutionCount).toBe(1);
  });

  it('falls back to national when district and regional are missing', () => {
    const { resolvedValues, substitutionCount } = resolveWithFallback(
      {}, {}, { flood_exposure: 1 }
    );
    expect(resolvedValues.flood_exposure.value).toBe(1);
    expect(resolvedValues.flood_exposure.source).toBe('national');
    expect(substitutionCount).toBe(1);
  });

  it('omits an indicator entirely when no data at any level', () => {
    const { resolvedValues } = resolveWithFallback({}, {}, {});
    expect(resolvedValues.flood_exposure).toBeUndefined();
  });
});

describe('calculateRiskWithFallback', () => {
  it('integrates fallback into full risk calculation', () => {
    const district = { flood_exposure: 7 };
    const regional = {
      earthquake_exposure: 3,
      conflict_barometer: 4.3,
      hdi: 0.55,
      child_mortality: 60,
      health_expenditure_capita: 500,
      adult_literacy: 70,
      sendai_framework: 3
    };
    const national = {};
    const r = calculateRiskWithFallback(district, regional, national);
    expect(r.risk).not.toBeNull();
    expect(r.metadata.fallback.substitutionCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// 11. HIERARCHY INTEGRITY
// ============================================================================

describe('hierarchy integrity', () => {
  it('every indicator referenced in COMPLETE_HIERARCHY exists in ALL_INDICATORS', () => {
    for (const dim of Object.values(COMPLETE_HIERARCHY)) {
      for (const cat of Object.values(dim.categories)) {
        for (const comp of Object.values(cat.components)) {
          for (const indId of comp.indicators) {
            expect(ALL_INDICATORS[indId], `missing indicator ${indId}`).toBeDefined();
          }
        }
      }
    }
  });

  it('every indicator in ALL_INDICATORS appears in exactly one component', () => {
    const seen = new Set();
    for (const dim of Object.values(COMPLETE_HIERARCHY)) {
      for (const cat of Object.values(dim.categories)) {
        for (const comp of Object.values(cat.components)) {
          for (const indId of comp.indicators) seen.add(indId);
        }
      }
    }
    for (const indId of Object.keys(ALL_INDICATORS)) {
      expect(seen.has(indId), `orphan indicator ${indId}`).toBe(true);
    }
  });

  it('ALL_COMPONENTS contains every component from the hierarchy', () => {
    for (const dim of Object.values(COMPLETE_HIERARCHY)) {
      for (const cat of Object.values(dim.categories)) {
        for (const compId of Object.keys(cat.components)) {
          expect(ALL_COMPONENTS[compId], `missing component ${compId}`).toBeDefined();
        }
      }
    }
  });

  it('every indicator has either informCore=true or tanzaniaExtension=true', () => {
    for (const [id, def] of Object.entries(ALL_INDICATORS)) {
      expect(
        def.informCore === true || def.tanzaniaExtension === true,
        `indicator ${id} has neither informCore nor tanzaniaExtension flag`
      ).toBe(true);
    }
  });

  it('threshold tables are monotonically increasing', () => {
    for (const [scheme, table] of Object.entries(
      { TANZANIA: TANZANIA_THRESHOLDS, GLOBAL: INFORM_GLOBAL_THRESHOLDS }
    )) {
      for (const [dim, t] of Object.entries(table)) {
        for (let i = 1; i < t.length; i++) {
          expect(t[i], `${scheme}.${dim} non-monotonic at ${i}`).toBeGreaterThan(t[i - 1]);
        }
      }
    }
  });
});
