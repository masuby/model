/**
 * structureConsistency.test.js — guards that the model speaks the REAL NBS-2022
 * administrative structure consistently, and never silently regresses to "170":
 *   • the canonical/default level is the 195 councils (LGAs);
 *   • all 195 councils carry data, each tracing to an INFORM source (170) unit;
 *   • the 28 new/split councils inherit a parent (flagged, never fabricated);
 *   • regions aggregate to the 31 NBS regions;
 *   • the national value is the OFFICIAL INFORM country figure (4.1), not a unit-mean.
 * The 170 INFORM units remain only as a labelled "source/reference" level (the
 * country-model workbook the councils are built from).
 */
import { describe, it, expect } from 'vitest';
import { LEVELS, COUNCIL_UNITS, DISTRICTS, REGION_UNITS, NATIONAL_UNIT, NATIONAL, unitsForLevel } from '../riskModel';
import councilsGeo from '../../../data/tanzania-councils.json';

describe('Real NBS-2022 structure is canonical (195 councils → 31 regions → official national)', () => {
  it('council is the first/default level; the 170 INFORM units survive only as a reference', () => {
    expect(LEVELS[0].key).toBe('council');
    const keys = LEVELS.map((l) => l.key);
    expect(keys).toEqual(expect.arrayContaining(['council', 'region', 'national', 'district']));
    // the 170 level must be clearly marked as source/reference, not a headline
    expect(LEVELS.find((l) => l.key === 'district').label).toMatch(/reference|source/i);
  });

  it('all 195 NBS councils carry data and expose their underlying INFORM source unit', () => {
    expect(COUNCIL_UNITS.length).toBe(councilsGeo.features.length);
    expect(COUNCIL_UNITS.length).toBeGreaterThanOrEqual(195);
    for (const c of COUNCIL_UNITS) {
      expect(typeof c.risk).toBe('number');
      expect(c._srcCode).toBeTruthy();   // override key — edits flow through the 170 backbone
      expect(c._srcName).toBeTruthy();
    }
  });

  it('28 councils inherit their parent district (flagged), never fabricated', () => {
    const inherited = COUNCIL_UNITS.filter((c) => c._inherited);
    expect(inherited.length).toBe(28);
    for (const c of inherited) expect(typeof c._inherited).toBe('string');
  });

  it('a Data-Entry edit on a council is keyed by a single source unit shared by its siblings', () => {
    // some INFORM units back >1 council (e.g. Mtwara → 3 councils); editing one must
    // resolve to the same _srcCode for all of them, so the edit reaches every sibling.
    const bySrc = {};
    COUNCIL_UNITS.forEach((c) => (bySrc[c._srcCode] = bySrc[c._srcCode] || []).push(c));
    const shared = Object.values(bySrc).filter((g) => g.length > 1);
    expect(shared.length).toBeGreaterThan(0);
    for (const group of shared) {
      const codes = new Set(group.map((c) => c._srcCode));
      expect(codes.size).toBe(1);   // one source unit for the whole sibling group
    }
  });

  it('the national value is the OFFICIAL INFORM country figure, not a re-aggregation', () => {
    expect(NATIONAL_UNIT.risk).toBe(NATIONAL.risk);
    expect(NATIONAL_UNIT.hazardExposure.total).toBe(NATIONAL.dimensions.hazardExposure.total);
    expect(NATIONAL_UNIT.vulnerability.total).toBe(NATIONAL.dimensions.vulnerability.total);
    expect(NATIONAL_UNIT.lackCopingCapacity.total).toBe(NATIONAL.dimensions.lackCopingCapacity.total);
  });

  it('regions aggregate to the 31 NBS regions; unitsForLevel wires every level', () => {
    expect(REGION_UNITS.length).toBe(31);
    expect(unitsForLevel('council').length).toBe(COUNCIL_UNITS.length);
    expect(unitsForLevel('region').length).toBe(31);
    expect(unitsForLevel('national').length).toBe(1);
    expect(unitsForLevel('district').length).toBe(DISTRICTS.length);
  });
});
