/**
 * Tests for the INFORM Severity Index engine (IASC v6).
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeSeverityIndicator,
  meanAggregation,
  maxAggregation,
  classifySeverity,
  classifySeverityDimension,
  calculateSeverityComponent,
  calculateSeverityDimension,
  calculateINFORMSeverity,
  calculateQualityIndex,
  validateSeverityValues,
  SEVERITY_HIERARCHY,
  SEVERITY_INDICATORS,
  SEVERITY_COMPONENTS,
  SEVERITY_THRESHOLDS,
  SEVERITY_CLASS_LABELS
} from '../informSeverityEngine.js';

// ============================================================================
// 1. NORMALIZATION (to 0–5 scale)
// ============================================================================

describe('normalizeSeverityIndicator (0–5 scale)', () => {
  it('NEGATIVE polarity: 0% affected = 0 severity, 100% = 5', () => {
    expect(normalizeSeverityIndicator(0, 'people_affected_pct')).toBe(0);
    expect(normalizeSeverityIndicator(100, 'people_affected_pct')).toBe(5);
    expect(normalizeSeverityIndicator(50, 'people_affected_pct')).toBeCloseTo(2.5, 5);
  });

  it('POSITIVE polarity: high access_to_affected_pct → low severity', () => {
    expect(normalizeSeverityIndicator(100, 'access_to_affected_pct')).toBe(0);
    expect(normalizeSeverityIndicator(0, 'access_to_affected_pct')).toBe(5);
    expect(normalizeSeverityIndicator(50, 'access_to_affected_pct')).toBeCloseTo(2.5, 5);
  });

  it('log1p transform: small counts produce small severity, large counts → saturation', () => {
    expect(normalizeSeverityIndicator(0, 'deaths')).toBe(0);
    const max = normalizeSeverityIndicator(10000, 'deaths');
    expect(max).toBeCloseTo(5, 1);
  });

  it('IPC phase 1 = 0 severity, phase 5 = max severity', () => {
    expect(normalizeSeverityIndicator(1, 'food_insecurity_ipc')).toBe(0);
    expect(normalizeSeverityIndicator(5, 'food_insecurity_ipc')).toBe(5);
    expect(normalizeSeverityIndicator(3, 'food_insecurity_ipc')).toBeCloseTo(2.5, 5);
  });

  it('baseline_inform_risk: rescales 0-10 Risk to 0-5 Severity', () => {
    expect(normalizeSeverityIndicator(0, 'baseline_inform_risk')).toBe(0);
    expect(normalizeSeverityIndicator(10, 'baseline_inform_risk')).toBe(5);
    expect(normalizeSeverityIndicator(5, 'baseline_inform_risk')).toBeCloseTo(2.5, 5);
  });

  it('clamps out-of-range values', () => {
    expect(normalizeSeverityIndicator(150, 'people_affected_pct')).toBe(5);
    expect(normalizeSeverityIndicator(-10, 'people_affected_pct')).toBe(0);
  });

  it('returns null for invalid input', () => {
    expect(normalizeSeverityIndicator(null, 'deaths')).toBeNull();
    expect(normalizeSeverityIndicator(NaN, 'deaths')).toBeNull();
  });
});

// ============================================================================
// 2. AGGREGATORS
// ============================================================================

describe('severity aggregators', () => {
  it('meanAggregation skips nulls', () => {
    expect(meanAggregation([1, 2, 3, null, NaN])).toBe(2);
    expect(meanAggregation([])).toBeNull();
  });
  it('maxAggregation picks max', () => {
    expect(maxAggregation([1, 5, null, 3])).toBe(5);
    expect(maxAggregation([])).toBeNull();
  });
});

// ============================================================================
// 3. CLASSIFICATION (5 IASC severity classes)
// ============================================================================

describe('classifySeverity', () => {
  it('1 Very Low / 2 Low / 3 High / 4 Very High / 5 Extreme', () => {
    expect(classifySeverity(0.5).label).toBe('Very Low');
    expect(classifySeverity(1.5).label).toBe('Low');
    expect(classifySeverity(2.5).label).toBe('High');
    expect(classifySeverity(3.5).label).toBe('Very High');
    expect(classifySeverity(4.5).label).toBe('Extreme');
  });
  it('boundaries exclusive on upper end', () => {
    expect(classifySeverity(1.0).label).toBe('Low');     // not Very Low
    expect(classifySeverity(2.0).label).toBe('High');
    expect(classifySeverity(0.999).label).toBe('Very Low');
  });
  it('returns null for invalid score', () => {
    expect(classifySeverity(null)).toBeNull();
    expect(classifySeverity(NaN)).toBeNull();
  });
  it('classifySeverityDimension uses dimension-specific thresholds', () => {
    expect(classifySeverityDimension(3.5, 'IMPACT').label).toBe('Very High');
    expect(classifySeverityDimension(3.5, 'COMPLEXITY').label).toBe('Very High');
  });
});

// ============================================================================
// 4. COMPONENT / DIMENSION CALCULATION
// ============================================================================

describe('calculateSeverityComponent', () => {
  it('handles a single-indicator component', () => {
    const r = calculateSeverityComponent('magnitude', {
      people_affected_pct: 80
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.indicatorCount).toBe(1);
  });

  it('averages multiple indicators, skipping missing', () => {
    const r = calculateSeverityComponent('living_conditions', {
      food_insecurity_ipc: 4,
      water_access_loss: 60,
      shelter_damage: 30
      // sanitation_access_loss, health_service_loss, education_disruption missing
    });
    expect(r.score).not.toBeNull();
    expect(r.indicatorCount).toBe(3);
    expect(r.coverage).toBe(50); // 3 of 6
  });

  it('returns null for empty input', () => {
    expect(calculateSeverityComponent('access', {}).score).toBeNull();
  });
});

describe('calculateSeverityDimension', () => {
  it('IMPACT dimension with balanced inputs', () => {
    const r = calculateSeverityDimension('IMPACT', {
      people_affected_pct: 60,
      deaths: 50,
      displaced_pct: 30
    });
    expect(r.score).not.toBeNull();
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(5);
    expect(r.classification).not.toBeNull();
  });

  it('COMPLEXITY: high access (POSITIVE inverted) lowers severity', () => {
    const high = calculateSeverityDimension('COMPLEXITY', {
      access_to_affected_pct: 90,
      physical_access_constraint: 1
    });
    const low = calculateSeverityDimension('COMPLEXITY', {
      access_to_affected_pct: 10,
      physical_access_constraint: 4
    });
    expect(high.score).toBeLessThan(low.score);
  });
});

// ============================================================================
// 5. END-TO-END
// ============================================================================

describe('calculateINFORMSeverity', () => {
  it('produces null severity when any dimension is empty', () => {
    const r = calculateINFORMSeverity({ deaths: 100 });
    expect(r.severity).not.toBeNull(); // preliminary partial
    expect(r.formula?.preliminary).toBe(true);
  });

  it('three-dimension calculation matches arithmetic mean (per IASC spec)', () => {
    const r = calculateINFORMSeverity({
      // Impact
      people_affected_pct: 50, deaths: 100,
      // Conditions
      food_insecurity_ipc: 3, baseline_inform_risk: 5,
      // Complexity
      physical_access_constraint: 2, data_availability: 3
    });
    expect(r.severity).not.toBeNull();
    expect(r.formula.preliminary).toBeUndefined();
    const expected = (r.formula.Impact + r.formula.Conditions + r.formula.Complexity) / 3;
    expect(r.severity).toBeCloseTo(expected, 1);
  });

  it('integrates baselineInformRisk option', () => {
    const r1 = calculateINFORMSeverity({
      people_affected_pct: 50, deaths: 100,
      food_insecurity_ipc: 3,
      physical_access_constraint: 2
    });
    const r2 = calculateINFORMSeverity({
      people_affected_pct: 50, deaths: 100,
      food_insecurity_ipc: 3,
      physical_access_constraint: 2
    }, { baselineInformRisk: 9 }); // very high risk area
    expect(r2.dimensions.CONDITIONS.score).toBeGreaterThan(r1.dimensions.CONDITIONS.score);
    expect(r2.severity).toBeGreaterThan(r1.severity);
  });

  it('explicit baseline_inform_risk takes precedence over opts', () => {
    const r = calculateINFORMSeverity(
      { baseline_inform_risk: 2, food_insecurity_ipc: 2 },
      { baselineInformRisk: 9 }
    );
    // Should use the explicit 2, not the option's 9
    expect(r.dimensions.CONDITIONS.components.vulnerability_baseline.indicatorScores.baseline_inform_risk).toBeCloseTo(1, 1);
  });

  it('output is bounded [0, 5] for any input combination', () => {
    for (let i = 0; i < 30; i++) {
      const inputs = {};
      for (const id of Object.keys(SEVERITY_INDICATORS)) {
        if (Math.random() < 0.7) {
          const def = SEVERITY_INDICATORS[id];
          inputs[id] = (def.refMin ?? 0) + Math.random() * ((def.refMax ?? 5) - (def.refMin ?? 0));
        }
      }
      const r = calculateINFORMSeverity(inputs);
      if (r.severity !== null) {
        expect(r.severity).toBeGreaterThanOrEqual(0);
        expect(r.severity).toBeLessThanOrEqual(5);
      }
      for (const dim of Object.values(r.dimensions)) {
        if (dim.score !== null) {
          expect(dim.score).toBeGreaterThanOrEqual(0);
          expect(dim.score).toBeLessThanOrEqual(5);
        }
      }
    }
  });
});

// ============================================================================
// 6. PROPERTY TESTS
// ============================================================================

describe('property: severity monotonicity', () => {
  it('worsening Impact cannot decrease severity', () => {
    const base = {
      people_affected_pct: 20, deaths: 10,
      food_insecurity_ipc: 2, baseline_inform_risk: 4,
      physical_access_constraint: 1, data_availability: 4
    };
    const r1 = calculateINFORMSeverity(base);
    const r2 = calculateINFORMSeverity({ ...base, people_affected_pct: 90, deaths: 1000 });
    expect(r2.severity).toBeGreaterThanOrEqual(r1.severity);
  });

  it('improving access (POSITIVE polarity) cannot increase severity', () => {
    const base = {
      people_affected_pct: 50, deaths: 100,
      food_insecurity_ipc: 3, baseline_inform_risk: 5,
      access_to_affected_pct: 30, physical_access_constraint: 3
    };
    const r1 = calculateINFORMSeverity(base);
    const r2 = calculateINFORMSeverity({ ...base, access_to_affected_pct: 95 });
    expect(r2.severity).toBeLessThanOrEqual(r1.severity);
  });
});

// ============================================================================
// 7. QUALITY INDEX
// ============================================================================

describe('calculateQualityIndex', () => {
  it('high data availability + recent + high reporting → low LRI', () => {
    const q = calculateQualityIndex({
      data_availability: 5,
      assessment_recency: 7,
      reporting_quality: 5
    });
    expect(q.score).toBeLessThan(3);
    expect(q.classification).toMatch(/Very Low|Low/);
  });

  it('no data availability + old assessment + low reporting → high LRI', () => {
    const q = calculateQualityIndex({
      data_availability: 0,
      assessment_recency: 180,
      reporting_quality: 0
    });
    expect(q.score).toBeGreaterThan(7);
    expect(q.classification).toMatch(/High|Very High/);
  });
});

// ============================================================================
// 8. VALIDATION
// ============================================================================

describe('validateSeverityValues', () => {
  it('reports missing dimensions', () => {
    const v = validateSeverityValues({ deaths: 100 });
    expect(v.canCalculate).toBe(false);
    expect(v.warnings.some(w => /Conditions/.test(w))).toBe(true);
  });

  it('accepts a complete input set', () => {
    const v = validateSeverityValues({
      people_affected_pct: 50,
      food_insecurity_ipc: 3,
      physical_access_constraint: 2
    });
    expect(v.canCalculate).toBe(true);
  });

  it('flags unknown indicators as warnings', () => {
    const v = validateSeverityValues({ flubber: 5 });
    expect(v.warnings.some(w => /Unknown/.test(w))).toBe(true);
  });
});

// ============================================================================
// 9. HIERARCHY INTEGRITY
// ============================================================================

describe('hierarchy integrity', () => {
  it('every indicator in SEVERITY_HIERARCHY exists in SEVERITY_INDICATORS', () => {
    for (const dim of Object.values(SEVERITY_HIERARCHY)) {
      for (const comp of Object.values(dim.components)) {
        for (const indId of comp.indicators) {
          expect(SEVERITY_INDICATORS[indId], `missing indicator ${indId}`).toBeDefined();
        }
      }
    }
  });

  it('every indicator appears in exactly one component', () => {
    const seen = new Set();
    for (const dim of Object.values(SEVERITY_HIERARCHY)) {
      for (const comp of Object.values(dim.components)) {
        for (const indId of comp.indicators) seen.add(indId);
      }
    }
    for (const indId of Object.keys(SEVERITY_INDICATORS)) {
      expect(seen.has(indId), `orphan indicator ${indId}`).toBe(true);
    }
  });

  it('threshold table is monotonically increasing', () => {
    for (const [k, t] of Object.entries(SEVERITY_THRESHOLDS)) {
      for (let i = 1; i < t.length; i++) {
        expect(t[i], `${k} non-monotonic at ${i}`).toBeGreaterThan(t[i - 1]);
      }
    }
  });

  it('SEVERITY_CLASS_LABELS has 5 levels', () => {
    expect(SEVERITY_CLASS_LABELS.length).toBe(5);
    expect(SEVERITY_CLASS_LABELS[0].label).toBe('Very Low');
    expect(SEVERITY_CLASS_LABELS[4].label).toBe('Extreme');
  });
});
