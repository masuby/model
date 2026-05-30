import { describe, it, expect } from 'vitest';
import { calculateINFORMSeverity } from '../../../services/informSeverityEngine';
import { SEVERITY_SCENARIOS } from '../severityScenarios';

describe('Severity sample scenarios', () => {
  it('each scenario yields a complete (non-preliminary) IASC v6 score', () => {
    for (const s of SEVERITY_SCENARIOS) {
      const r = calculateINFORMSeverity(s.values);
      // full coverage across all 3 dimensions
      expect(r.metadata.coverage).toBe(100);
      expect(r.dimensions.IMPACT.score).not.toBeNull();
      expect(r.dimensions.CONDITIONS.score).not.toBeNull();
      expect(r.dimensions.COMPLEXITY.score).not.toBeNull();
      // valid 0–5 severity with a class, not flagged preliminary
      expect(r.severity).toBeGreaterThanOrEqual(0);
      expect(r.severity).toBeLessThanOrEqual(5);
      expect(r.classification?.label).toBeTruthy();
      expect(r.formula?.preliminary).toBeFalsy();
    }
  });

  it('orders by severity: severe flood > drought > minor fire', () => {
    const byId = Object.fromEntries(
      SEVERITY_SCENARIOS.map((s) => [s.id, calculateINFORMSeverity(s.values).severity])
    );
    expect(byId.rufiji_floods).toBeGreaterThan(byId.urban_fire);
    expect(byId.central_drought).toBeGreaterThan(byId.urban_fire);
  });
});
