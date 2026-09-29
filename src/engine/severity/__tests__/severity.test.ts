/**
 * INFORM Severity Index - methodology conformance (JRC 2020 concept & methodology).
 */
import { describe, expect, it } from 'vitest';
import { SEVERITY_WEIGHTS } from '../definitions';
import { computeSeverity, deriveIndicators, informGeometric, normalise, severityCategory } from '../engine';
import { SEVERITY_SCENARIOS, STRUCTURAL_DEFAULTS } from '../scenarios';
import { SEVERITY_INDICATOR_BY_ID as DEF } from '../definitions';

describe('aggregation primitives', () => {
  it('INFORM geometric average: fixed points 0 → 0 and 5 → 5', () => {
    expect(informGeometric([0, 0])).toBeCloseTo(0, 10);
    expect(informGeometric([5, 5])).toBeCloseTo(5, 10);
    expect(informGeometric([3, 3])).toBeCloseTo(3, 10);
  });
  it('rewards high scores: result ≥ arithmetic mean for mixed inputs (footnote 17)', () => {
    for (const [a, b] of [[1, 4], [0.5, 4.5], [2, 3]]) expect(informGeometric([a, b])!).toBeGreaterThanOrEqual((a + b) / 2 - 1e-9);
  });
  it('weights shift the result toward the heavier member', () => {
    const w = SEVERITY_WEIGHTS.impactVsConditions;
    expect(informGeometric([1, 4], [w.impact, w.conditions])!).toBeGreaterThan(informGeometric([4, 1], [w.impact, w.conditions])!);
  });
  it('missing members are skipped', () => {
    expect(informGeometric([null, 3])).toBeCloseTo(3, 10);
    expect(informGeometric([null, null])).toBeNull();
  });
  it('normalisation: log scale for absolute counts, clamped to 0–5, inverse where needed', () => {
    expect(normalise(DEF.peopleAffected, 1_000)).toBeCloseTo(0, 6);
    expect(normalise(DEF.peopleAffected, 5_000_000)).toBeCloseTo(5, 6);
    expect(normalise(DEF.peopleAffected, 1e9)).toBe(5);
    expect(normalise(DEF.corruptionPerception, 100)).toBeCloseTo(0, 6); // clean → least severe
    expect(normalise(DEF.corruptionPerception, null)).toBeNull();
  });
});

describe('category = ROUNDUP of the score (Table 9)', () => {
  it('3.1 → 4 (high), 3.9 → 4, 3.0 → 3 (medium), 0.2 → 1 (very low)', () => {
    expect(severityCategory(3.1)).toMatchObject({ level: 4, key: 'high' });
    expect(severityCategory(3.9)).toMatchObject({ level: 4, key: 'high' });
    expect(severityCategory(3.0)).toMatchObject({ level: 3, key: 'medium' });
    expect(severityCategory(3.04)).toMatchObject({ level: 3, key: 'medium' }); // rounded to 1 dp first
    expect(severityCategory(0.2)).toMatchObject({ level: 1, key: 'veryLow' });
    expect(severityCategory(5)).toMatchObject({ level: 5, key: 'veryHigh' });
  });
  it('the five categories include Medium (the old app had none)', () => {
    expect([1, 2, 3, 4, 5].map((l) => severityCategory(l)!.key)).toEqual(['veryLow', 'low', 'medium', 'high', 'veryHigh']);
  });
});

describe('derived indicators', () => {
  it('relative indicators are computed from absolutes', () => {
    const d = deriveIndicators({ peopleInArea: 100_000, peopleAffected: 20_000, displaced: 2_000, fatalities: 10, levels: { 5: 0, 4: 1_000, 3: 5_000, 2: 10_000 } });
    expect(d.peopleAffectedPct).toBe(20);
    expect(d.displacedPct).toBe(10);
    expect(d.fatalitiesPer10k).toBe(5);
    expect(d.peopleInNeed).toBe(6_000);
  });
  it('concentration = level whose cumulative share (from level 5 down) first exceeds 5%', () => {
    expect(deriveIndicators({ peopleInArea: 100_000, levels: { 5: 6_000 } }).concentrationLevel).toBe(5);
    expect(deriveIndicators({ peopleInArea: 100_000, levels: { 5: 2_000, 4: 4_000 } }).concentrationLevel).toBe(4);
    expect(deriveIndicators({ peopleInArea: 100_000, levels: { 5: 0, 4: 0, 3: 1_000, 2: 3_000 } }).concentrationLevel).toBe(1);
  });
  it('diversity of groups is the number of distinct groups, max 5', () => {
    expect(deriveIndicators({ groups: ['idps', 'idps', 'refugees'] }).groupsAffected).toBe(2);
  });
});

describe('full index', () => {
  it('is only calculated when all three dimensions are present', () => {
    const r = computeSeverity({ ...STRUCTURAL_DEFAULTS });
    expect(r.complete).toBe(false);
    expect(r.severity).toBeNull();
    expect(r.missing.length).toBeGreaterThan(0);
  });
  it('equals 0.7 × G(impact 1/3, conditions 2/3) + 0.3 × complexity', () => {
    const r = computeSeverity(SEVERITY_SCENARIOS[0].input);
    const i = r.dimensions.impact.score!, c = r.dimensions.conditions.score!, x = r.dimensions.complexity.score!;
    const expected = 0.7 * informGeometric([i, c], [1 / 3, 2 / 3])! + 0.3 * x;
    expect(r.severity).toBe(Math.round(expected * 10) / 10);
  });
  it('scenarios are complete and span the scale (flood High > drought Medium > landslide Low)', () => {
    const [flood, drought, landslide] = SEVERITY_SCENARIOS.map((s) => computeSeverity(s.input));
    for (const r of [flood, drought, landslide]) {
      expect(r.complete).toBe(true);
      expect(r.severity!).toBeGreaterThan(0);
      expect(r.severity!).toBeLessThanOrEqual(5);
    }
    expect(flood.category).toBe('high');
    expect(drought.category).toBe('medium');
    expect(landslide.category).toBe('low');
    expect(flood.severity!).toBeGreaterThan(drought.severity!);
    expect(drought.severity!).toBeGreaterThan(landslide.severity!);
  });
  it('scenario areas are real councils whose census totals match the inputs', async () => {
    const { buildModel } = await import('@/engine/risk/model');
    const m = buildModel();
    for (const s of SEVERITY_SCENARIOS) {
      const units = s.councils.map((id) => m.byId.get(id)!);
      expect(units.every(Boolean)).toBe(true);
      const pop = units.reduce((a, u) => a + (u.exposure?.population ?? 0), 0);
      expect(pop).toBe(s.input.peopleInArea);
    }
  });
  it('a category with no data makes the index incomplete (not silently carried by the other)', () => {
    const r = computeSeverity({ ...SEVERITY_SCENARIOS[0].input, levels: {} });
    expect(r.complete).toBe(false);
    expect(r.severity).toBeNull();
  });
  it('missing reliability information scores as least reliable', () => {
    const r = computeSeverity({ ...SEVERITY_SCENARIOS[0].input, dataReliability: null, daysSinceUpdate: null });
    expect(r.reliability.score).toBeLessThanOrEqual(2);
  });
  it('more people in need never lowers severity (monotonic)', () => {
    const base = SEVERITY_SCENARIOS[0].input;
    const more = { ...base, levels: { ...base.levels, 4: (base.levels?.[4] ?? 0) * 4 } };
    expect(computeSeverity(more).severity!).toBeGreaterThanOrEqual(computeSeverity(base).severity!);
  });
  it('reliability reflects completeness, recency and source reliability', () => {
    const good = computeSeverity({ ...SEVERITY_SCENARIOS[0].input, dataReliability: 'high', daysSinceUpdate: 3 }).reliability;
    const poor = computeSeverity({ ...SEVERITY_SCENARIOS[0].input, dataReliability: 'low', daysSinceUpdate: 400 }).reliability;
    expect(good.score).toBeGreaterThan(poor.score);
  });
});
