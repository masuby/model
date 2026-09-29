/**
 * Helpers for the "decision brief" (lesson 7) - pure, so they are unit-tested.
 * Dimensions are compared by where they sit inside their OWN class scale (a Hazard of 3.0 and a
 * Vulnerability of 3.0 are not the same level), never by their raw 0–10 numbers.
 */
import { classify, THRESHOLDS, type Scale } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';

/** Continuous class position: class index (0–4) plus the position inside that class band (0–1). */
export function classPosition(value: number, scale: Scale): number {
  const c = classify(value, scale);
  if (!c) return -1;
  const bounds = [0, ...THRESHOLDS[scale], 10];
  const lo = bounds[c.index];
  const hi = bounds[c.index + 1];
  const within = hi > lo ? Math.max(0, Math.min(1, (value - lo) / (hi - lo))) : 0;
  return c.index + Math.min(within, 0.999);
}

/** The dimension that sits highest on its own class scale - what "drives" this unit's risk. */
export function driverDimension(unit: Unit): DimensionKey | null {
  let best: DimensionKey | null = null;
  let bestPos = -Infinity;
  for (const d of DIMENSIONS) {
    const v = unit.dims[d.key].score;
    if (!isNum(v)) continue;
    const pos = classPosition(v, d.scale);
    if (pos > bestPos) {
      bestPos = pos;
      best = d.key;
    }
  }
  return best;
}

/** Highest-scoring category inside a dimension (null when none has data). */
export function driverCategory(unit: Unit, dim: DimensionKey): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const [key, cat] of Object.entries(unit.dims[dim].categories)) {
    if (isNum(cat.score) && cat.score > bestScore) {
      bestScore = cat.score;
      best = key;
    }
  }
  return best;
}

export type CoverageLevel = 'good' | 'fair' | 'low';
export const coverageLevel = (pct: number): CoverageLevel => (pct >= 90 ? 'good' : pct >= 75 ? 'fair' : 'low');

/**
 * Where a council's vulnerability & coping data really come from: its own INFORM source unit, a source
 * unit it shares with other councils, or its parent district (new/split councils).
 */
export type DataOrigin = 'own' | 'inherited' | 'shared';
export function dataOrigin(unit: Unit, councils: readonly Unit[]): DataOrigin {
  if (unit.inheritedFrom) return 'inherited';
  if (unit.sourceId && councils.filter((c) => c.sourceId === unit.sourceId).length > 1) return 'shared';
  return 'own';
}
