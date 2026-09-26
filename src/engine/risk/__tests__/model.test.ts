/**
 * The model speaks the real NBS-2022 structure (195 councils → 31 regions → official national), and
 * approved edits flow through EVERY level consistently (the old app froze council risk).
 */
import { describe, expect, it } from 'vitest';
import councilsGeo from '@/data/tanzania-councils.json';
import { classify, THRESHOLDS } from '../classes';
import { ALL_INDICATORS, leafForWorkbookComponent } from '../hierarchy';
import { riskScore } from '../math';
import { buildModel, dataCoverage, indicatorValue, placeKey, topDrivers, unitsAt } from '../model';
import { parseMetric } from '../metrics';
import { usedSpecs } from '../standardise';

const model = buildModel();
const featureCount = (councilsGeo as { features: unknown[] }).features.length;

describe('administrative structure', () => {
  it('195 councils, each with data and a source unit', () => {
    expect(model.councils.length).toBe(featureCount);
    expect(model.councils.length).toBe(195);
    for (const c of model.councils) {
      expect(typeof c.risk).toBe('number');
      expect(c.sourceId).toBeTruthy();
    }
  });
  it('council ids are unique', () => {
    expect(new Set(model.councils.map((c) => c.id)).size).toBe(195);
  });
  it('28 new/split councils are flagged as inheriting their parent', () => {
    expect(model.councils.filter((c) => c.inheritedFrom).length).toBe(28);
  });
  it('31 regions, every region has councils (incl. Dar es Salaam — name join fixed)', () => {
    expect(model.regions.length).toBe(31);
    for (const r of model.regions) expect(r.members).toBeGreaterThan(0);
    expect(model.regions.some((r) => placeKey(r.name) === 'daressalaam')).toBe(true);
  });
  it('national is the OFFICIAL INFORM figure', () => {
    expect(model.national.risk).toBe(4.1);
    expect(model.national.dims.hazard.score).toBe(2.2);
    expect(model.national.dims.vulnerability.score).toBe(5.5);
    expect(model.national.dims.coping.score).toBe(5.9);
  });
  it('unitsAt wires every level', () => {
    expect(unitsAt(model, 'council')).toHaveLength(195);
    expect(unitsAt(model, 'region')).toHaveLength(31);
    expect(unitsAt(model, 'national')).toHaveLength(1);
    expect(unitsAt(model, 'source')).toHaveLength(170);
  });
});

describe('council maths', () => {
  it('council risk is computed live and equals ∛(H × V × LCC)', () => {
    for (const c of model.councils) expect(c.risk).toBe(riskScore(c.dims.hazard.score, c.dims.vulnerability.score, c.dims.coping.score));
  });
  it('council hazard and risk are raise-only vs their source district', () => {
    const src = new Map(model.sources.map((s) => [s.id, s]));
    const fails = model.councils.filter((c) => {
      const s = src.get(c.sourceId!)!;
      return c.dims.hazard.score! < s.dims.hazard.score! - 0.06 || c.risk! < s.risk! - 0.06;
    });
    expect(fails.map((c) => c.name)).toEqual([]);
  });
  it('region scores are INFORM aggregates (not a mean of risk scores)', () => {
    for (const r of model.regions) expect(r.risk).toBe(riskScore(r.dims.hazard.score, r.dims.vulnerability.score, r.dims.coping.score));
  });
});

describe('edits flow through every level', () => {
  const council = model.councils.find((c) => c.name.startsWith('Kondoa'))!;
  const at = new Date().toISOString();

  it('a council hazard edit changes that council’s hazard, risk and its region', () => {
    const edited = buildModel({ [council.id]: { 'hazard:flood': { value: 10, at } } });
    const c2 = edited.byId.get(council.id)!;
    expect(indicatorValue(c2, 'hazard', 'flood')).toBe(10);
    expect(c2.dims.hazard.score!).toBeGreaterThan(council.dims.hazard.score!);
    expect(c2.risk!).toBeGreaterThanOrEqual(council.risk!);
    expect(c2.edits['hazard:flood']?.value).toBe(10);
    const r1 = model.regions.find((r) => r.name === council.region)!;
    const r2 = edited.regions.find((r) => r.name === council.region)!;
    expect(r2.dims.hazard.score!).toBeGreaterThanOrEqual(r1.dims.hazard.score!);
    // The shipped dataset is never mutated.
    expect(indicatorValue(buildModel().byId.get(council.id)!, 'hazard', 'flood')).toBe(indicatorValue(council, 'hazard', 'flood'));
  });

  it('a Vulnerability edit on the source unit reaches every sibling council', () => {
    const siblings = model.councils.filter((c) => c.sourceId === council.sourceId);
    const edited = buildModel({ [council.sourceId!]: { 'vulnerability:developmentPoverty': { value: 0, at } } });
    for (const s of siblings) {
      const e = edited.byId.get(s.id)!;
      expect(indicatorValue(e, 'vulnerability', 'developmentPoverty')).toBe(0);
      expect(e.dims.vulnerability.score!).toBeLessThanOrEqual(s.dims.vulnerability.score!);
      expect(e.edits['vulnerability:developmentPoverty']).toBeTruthy();
    }
  });

  it('an exposure edit amplifies flood as √(hazard × exposure), never below the hazard', () => {
    const edited = buildModel({ [council.id]: { 'hazard:exposure': { value: 10, at } } });
    const c2 = edited.byId.get(council.id)!;
    const h = council.floodHazard!;
    expect(indicatorValue(c2, 'hazard', 'flood')).toBe(Math.floor(Math.max(h, Math.sqrt(h * 10)) * 10 + 0.5) / 10);
  });

  it('clearing an indicator (null) excludes it from the mean rather than zeroing it', () => {
    const edited = buildModel({ [council.id]: { 'hazard:drought': { value: null, at } } });
    expect(indicatorValue(edited.byId.get(council.id)!, 'hazard', 'drought')).toBeNull();
    expect(edited.byId.get(council.id)!.dims.hazard.score).not.toBeNull();
  });

  it('edit count is reported', () => {
    expect(buildModel({ a: { 'hazard:flood': { value: 1, at } }, b: { 'hazard:drought': { value: 1, at }, 'hazard:flood': { value: 1, at } } }).editCount).toBe(3);
  });
});

describe('classification uses each scale’s own workbook thresholds', () => {
  it('risk thresholds', () => {
    expect(classify(2.4)?.key).toBe('veryLow');
    expect(classify(2.5)?.key).toBe('low');
    expect(classify(4.1)?.key).toBe('medium');
    expect(classify(4.3)?.key).toBe('high');
    expect(classify(5.9)?.key).toBe('veryHigh');
    expect(classify(null)).toBeNull();
  });
  it('dimension thresholds differ from risk', () => {
    expect(THRESHOLDS.hazard).toEqual([1.3, 2.0, 3.3, 4.7]);
    expect(classify(2.2, 'hazard')?.key).toBe('medium');
    expect(classify(2.2, 'risk')?.key).toBe('veryLow');
    expect(classify(5.9, 'coping')?.key).toBe('medium');
  });
  it('metric resolver applies the right scale', () => {
    expect(parseMetric('dim:hazard').scale).toBe('hazard');
    expect(parseMetric('ind:hazard:flood').kind).toBe('indicator');
    expect(parseMetric('nonsense').key).toBe('risk');
  });
});

describe('helpers', () => {
  it('every USED workbook component maps onto a model leaf (raw entry never drops data)', () => {
    const used = [...new Set(usedSpecs().map((s) => String(s.component)))];
    expect(used.filter((c) => !leafForWorkbookComponent(c))).toEqual([]);
    expect(used.length).toBe(26);
  });
  it('the hierarchy has 32 leaves in 6 categories', () => {
    expect(ALL_INDICATORS.length).toBe(32);
  });
  it('coverage and top drivers', () => {
    const c = model.councils[0];
    expect(dataCoverage(c)).toBeGreaterThan(50);
    const top = topDrivers(c, 3);
    expect(top).toHaveLength(3);
    expect(top[0].value).toBeGreaterThanOrEqual(top[1].value);
  });
});
