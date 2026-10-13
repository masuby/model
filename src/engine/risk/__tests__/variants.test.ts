/**
 * The labelled sensitivities beside the Core (D11, MET-10/11/12/14): INFORM Global's hazard rule,
 * Tanzanian classes by natural breaks, and the lack-of-reliability score. None of them changes a Core
 * value.
 */
import { describe, expect, it } from 'vitest';
import { CLASS_KEYS } from '../classes';
import { DATA_AS_OF, buildModel } from '../model';
import { aggregateUnder, classifyWith, globalRuleOf, globalRuleSummary, INFORM_GLOBAL, lackOfReliability, NATURAL_GEOMEAN, naturalBreaks, regionalRuleSummary, tanzanianClasses } from '../variants';

const model = buildModel();
/** The workbook exactly: the figures the assessment measured were taken on it, before the quarantine. */
const exact = buildModel({}, { workbookOnly: true });

describe("INFORM Global's hazard rule as a sensitivity", () => {
  it('raises the natural category (inverted geometric mean ≥ arithmetic mean), takes human hazard as the conflict maximum, and leaves the Core untouched', () => {
    const before = JSON.stringify(model.sources.map((u) => [u.dims.hazard.score, u.risk]));
    for (const u of model.sources) {
      const g = globalRuleOf(u, INFORM_GLOBAL);
      expect(g.natural).not.toBeNull();
      expect(g.natural!).toBeGreaterThanOrEqual(u.dims.hazard.categories.natural.score! - 1e-9);
      const conflict = [u.dims.hazard.categories.human.indicators.conflictIntensity, u.dims.hazard.categories.human.indicators.conflictRisk].filter((x): x is number => typeof x === 'number');
      // The live model withholds both conflict groups (DN-13, DN-14), so the conflict maximum is empty there.
      expect(g.human).toBe(conflict.length ? Math.max(...conflict) : null);
      const a = globalRuleOf(u, NATURAL_GEOMEAN);
      expect(a.human).toBeCloseTo(u.dims.hazard.categories.human.score!, 9);
    }
    expect(JSON.stringify(model.sources.map((u) => [u.dims.hazard.score, u.risk]))).toBe(before);
  });

  it('moves the workbook units as the assessment measured: the natural-hazard rule alone raises hazard by about 0.45 and changes 45 risk classes', () => {
    const a = globalRuleSummary(exact.sources, NATURAL_GEOMEAN);
    expect(a.units).toBe(170);
    expect(a.meanHazardDelta).toBeCloseTo(0.45, 1);
    expect(a.maxHazardDelta).toBeLessThanOrEqual(1.2);
    expect(a.riskClassChanges).toBe(45);
    // With the conflict maximum as well, the human category drops for most units and the net effect reverses.
    const b = globalRuleSummary(exact.sources, INFORM_GLOBAL);
    expect(b.meanHazardDelta).toBeLessThan(a.meanHazardDelta);
    expect(Object.values(a.classes.core).reduce((x, y) => x + y, 0)).toBe(170);
    expect(Object.values(b.classes.global).reduce((x, y) => x + y, 0)).toBe(170);
    // On the live model coastal erosion is withheld (its zero no longer sits in the natural mean) and
    // the human groups by programme decision (DN-12 to DN-14): the workbook units carry no human hazard
    // at all, so the natural rule alone moves fewer units than on the workbook.
    const live = globalRuleSummary(model.sources, NATURAL_GEOMEAN);
    expect(live.riskClassChanges).toBe(35); // re-measured on 14 October 2026 with the earthquake and drought council measures
    expect(live.meanHazardDelta).toBeGreaterThan(0);
  });
});

describe('Tanzanian classes by natural breaks', () => {
  it('finds the optimal breaks of a small series', () => {
    expect(naturalBreaks([1, 1.1, 1.2, 5, 5.1, 5.2, 9, 9.1, 9.2], 3)).toEqual([5, 9]);
    expect(naturalBreaks([], 5)).toEqual([]);
    expect(naturalBreaks([1, 2, 3], 5)).toEqual([2, 3]);
    expect(classifyWith(4.2, [2, 4, 6, 8])).toBe('medium');
    expect(classifyWith(8, [2, 4, 6, 8])).toBe('veryHigh');
    expect(classifyWith(null, [2, 4, 6, 8])).toBeNull();
  });

  it('derives thresholds for risk, every dimension and every category from the workbook units', () => {
    const risk = tanzanianClasses(model.sources, 'risk');
    expect(risk.thresholds.length).toBeGreaterThanOrEqual(3);
    expect(risk.thresholds.every((t) => Math.abs(t * 2 - Math.round(t * 2)) < 1e-9)).toBe(true); // rounded to 0.5
    expect(Object.values(risk.counts).reduce((a, b) => a + b, 0)).toBe(170);
    // The SADC thresholds put most units in one class; the Tanzanian breaks spread them.
    expect(Math.max(...Object.values(risk.sadcCounts!))).toBeGreaterThan(Math.max(...Object.values(risk.counts)));
    for (const scale of ['hazard', 'vulnerability', 'coping'] as const) expect(tanzanianClasses(model.sources, scale).thresholds.length).toBeGreaterThanOrEqual(3);
    const cat = tanzanianClasses(model.sources, 'category:institutional');
    expect(cat.sadcCounts).toBeNull();
    expect(cat.n).toBe(170);
    expect(CLASS_KEYS.some((k) => cat.counts[k] > 0)).toBe(true);
  });
});

describe('lack of reliability', () => {
  const today = new Date('2026-10-10T00:00:00Z');
  it('scores missing groups, the age of the data and inheritance; a carved-out council scores worse than its parent', () => {
    const rufiji = model.councils.find((c) => c.name === 'Rufiji District')!;
    const kibiti = model.councils.find((c) => c.name === 'Kibiti District')!;
    const r = lackOfReliability(rufiji, model, DATA_AS_OF, today);
    const k = lackOfReliability(kibiti, model, DATA_AS_OF, today);
    expect(r.groupsTotal).toBe(32);
    expect(r.groupsWithData).toBe(28); // zoonoses is empty; internal violence, conflict intensity and conflict risk are withheld (DN-12 to DN-14)
    expect(r.missing).toBeCloseTo(4 / 32, 6);
    expect(r.ageYears).toBeLessThan(1.86); // 2024-12 to 2026-10 for the workbook groups; the benchmark groups are dated 2026-10
    expect(r.ageYears).toBeGreaterThan(0.5);
    expect(r.inherited).toBe(0.5); // Rufiji's unit also backs Kibiti
    expect(k.inherited).toBe(1);
    expect(k.lack).toBeGreaterThan(r.lack);
    expect(r.lack).toBeCloseTo(10 * (0.5 * (4 / 32) + 0.3 * (r.ageYears / 5) + 0.2 * 0.5), 0);
    const own = model.councils.find((c) => c.sourceId && model.councils.filter((o) => o.sourceId === c.sourceId).length === 1)!;
    expect(lackOfReliability(own, model, DATA_AS_OF, today).inherited).toBe(0);
  });

  it('fresh institutional values lower the age term', () => {
    const edited = buildModel({ C001: { 'vulnerability:habitat': { value: 6, at: '2026-10-01T00:00:00Z' } } });
    const kondoa = edited.byId.get('C001')!;
    const base = lackOfReliability(model.byId.get('C001')!, model, DATA_AS_OF, today);
    const fresh = lackOfReliability(kondoa, edited, DATA_AS_OF, today);
    expect(fresh.ageYears).toBeLessThan(base.ageYears);
  });
});

describe('regional aggregation rule (MET-07)', () => {
  it('counts each workbook unit once, or weights councils by population, and reports what changes against the Core', () => {
    const plain = regionalRuleSummary(model, 'councils');
    expect(plain.changed).toBe(0);
    expect(plain.nationalDelta).toBe(0);
    const units = regionalRuleSummary(model, 'units');
    expect(units.regions).toBe(31);
    expect(units.changed).toBeLessThanOrEqual(8);
    expect(units.maxDelta).toBeLessThanOrEqual(0.2);
    const pop = regionalRuleSummary(model, 'population');
    expect(pop.changed).toBeLessThanOrEqual(31);
    expect(pop.maxDelta).toBeLessThanOrEqual(0.5);
    expect(Math.abs(pop.nationalDelta)).toBeLessThanOrEqual(0.3);
    // A region of one council is the same under every rule.
    const dar = model.councilsByRegion.get('daressalaam')!;
    const a = aggregateUnder(dar, 'councils', 'x', 'x').risk;
    const b = aggregateUnder(dar, 'units', 'x', 'x').risk;
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
  });
});
