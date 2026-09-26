import { describe, expect, it } from 'vitest';
import { THRESHOLDS } from '@/engine/risk/classes';
import { buildModel } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS } from '@/engine/severity/scenarios';
import { parseBlock, parseLesson } from '../content';
import { classPosition, coverageLevel, dataOrigin, driverCategory, driverDimension } from '../decisions';
import { logSliderToValue, scaleScenario, valueToLogSlider } from '../sim';

const model = buildModel();

function unitWith(h: number, v: number, c: number): Unit {
  const base = structuredClone(model.councils[0]);
  base.dims.hazard.score = h;
  base.dims.vulnerability.score = v;
  base.dims.coping.score = c;
  return base;
}

describe('decision helpers', () => {
  it('places a value inside its own class band', () => {
    const [t1, t2] = THRESHOLDS.risk;
    expect(classPosition(0, 'risk')).toBe(0);
    expect(Math.floor(classPosition(t1, 'risk'))).toBe(1);
    expect(classPosition((t1 + t2) / 2, 'risk')).toBeCloseTo(1.5, 5);
    expect(classPosition(10, 'risk')).toBeLessThan(5);
  });

  it('compares dimensions on their own scales, not raw numbers', () => {
    // Hazard 4.8 is "Very high" on the hazard scale; LCC 6.0 is only "Medium" on the coping scale.
    const u = unitWith(4.8, 3.0, 6.0);
    expect(driverDimension(u)).toBe('hazard');
    const v = unitWith(1.0, 5.5, 6.0);
    expect(driverDimension(v)).toBe('vulnerability');
  });

  it('finds the highest category within a dimension', () => {
    const u = structuredClone(model.councils[0]);
    const cats = Object.entries(u.dims.hazard.categories).filter(([, c]) => typeof c.score === 'number');
    const best = cats.sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))[0][0];
    expect(driverCategory(u, 'hazard')).toBe(best);
  });

  it('grades data coverage', () => {
    expect(coverageLevel(95)).toBe('good');
    expect(coverageLevel(80)).toBe('fair');
    expect(coverageLevel(50)).toBe('low');
  });

  it('tells own, shared and inherited data apart', () => {
    const inherited = model.councils.find((c) => c.inheritedFrom);
    expect(inherited && dataOrigin(inherited, model.councils)).toBe('inherited');
    const counts = new Map<string, number>();
    for (const c of model.councils) if (c.sourceId) counts.set(c.sourceId, (counts.get(c.sourceId) ?? 0) + 1);
    const shared = model.councils.find((c) => !c.inheritedFrom && c.sourceId && (counts.get(c.sourceId) ?? 0) > 1);
    if (shared) expect(dataOrigin(shared, model.councils)).toBe('shared');
    const own = model.councils.find((c) => !c.inheritedFrom && c.sourceId && counts.get(c.sourceId) === 1);
    if (own) expect(dataOrigin(own, model.councils)).toBe('own');
  });
});

describe('severity scenario scaling', () => {
  const flood = SEVERITY_SCENARIOS.find((s) => s.id === 'riverineFlood')!.input;

  it('is the identity at the scenario’s own size', () => {
    const s = scaleScenario(flood, flood.peopleAffected!);
    expect(s.peopleAffected).toBe(flood.peopleAffected);
    expect(s.displaced).toBe(flood.displaced);
    expect(s.levels).toEqual(flood.levels);
    expect(computeSeverity(s).severity).toBe(computeSeverity(flood).severity);
  });

  it('scales the human figures in proportion, capped at the people in the area', () => {
    const half = scaleScenario(flood, flood.peopleAffected! / 2);
    expect(half.displaced).toBe(Math.round(flood.displaced! / 2));
    const huge = scaleScenario(flood, 1e9);
    expect(huge.peopleAffected).toBe(flood.peopleInArea);
  });

  it('a bigger crisis is never less severe', () => {
    const small = computeSeverity(scaleScenario(flood, 2_000)).severity!;
    const big = computeSeverity(scaleScenario(flood, 800_000)).severity!;
    expect(big).toBeGreaterThanOrEqual(small);
  });

  it('maps the log slider both ways', () => {
    expect(logSliderToValue(0, 1_000, 1_000_000, 1000)).toBe(1_000);
    expect(logSliderToValue(1000, 1_000, 1_000_000, 1000)).toBe(1_000_000);
    expect(logSliderToValue(500, 1_000, 1_000_000, 1000)).toBe(31_623);
    expect(valueToLogSlider(31_623, 1_000, 1_000_000, 1000)).toBe(500);
    expect(valueToLogSlider(10, 1_000, 1_000_000, 1000)).toBe(0);
  });
});

describe('content parser', () => {
  it('drops unknown or malformed blocks instead of crashing', () => {
    expect(parseBlock({ type: 'video', src: 'x' })).toBeNull();
    expect(parseBlock({ type: 'widget', id: 'nope' })).toBeNull();
    expect(parseBlock({ type: 'callout', tone: 'shout', text: 'x' })).toBeNull();
    expect(parseBlock({ type: 'list', items: ['a'] })).toEqual({ type: 'list', style: 'bullet', items: ['a'] });
    expect(parseLesson(null).sections).toEqual([]);
    expect(parseLesson('lessons.missing').quiz).toEqual([]);
  });
});
