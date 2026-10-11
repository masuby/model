/**
 * The collection tools' benchmark (issue TOOL-01): every council's row carries the raw values of its OWN
 * workbook unit, the unit the engine links it to, with no fallback to a neighbour. The sidecar
 * data-source/collection_benchmark_values.json is written by scripts/fill-collection-tool.py together with
 * the workbook, so this test guards what institutions receive.
 */
import { describe, expect, it } from 'vitest';
import sidecar from '../../../../data-source/collection_benchmark_values.json';
import baselineJson from '@/data/inform-baseline-raw.json';
import { buildModel } from '../model';
import type { BaselineRaw } from '../rawValues';
import { SPECS, usedSpecs } from '../standardise';

const baseline = baselineJson as unknown as BaselineRaw;
const model = buildModel();
const councils = (sidecar as { councils: Record<string, { name: string; unit: string; values: Record<string, number> }> }).councils;

/** The twelve urban councils the audit found linked to their rural district (ADM-01), with their own units. */
const URBAN: ReadonlyArray<[string, string]> = [
  ['Korogwe Town', 'Korogwe Township Authority'],
  ['Handeni Town', 'Handeni Mji'],
  ['Kibaha Town', 'Kibaha Urban'],
  ['Mtwara Mikindani Municipal', 'Mtwara Urban'],
  ['Masasi Town', 'Masasi Township Authority'],
  ['Mafinga Town', 'Mafinga Township Authority'],
  ['Kasulu Town', 'Kasulu Township Authority'],
  ['Kigoma Ujiji Municipal', 'Kigoma Urban'],
  ['Kahama Municipal', 'Kahama Township Authority'],
  ['Babati Town', 'Babati Urban'],
  ['Njombe Town', 'Njombe Urban'],
  ['Makambako Town', 'Makambako Township Authority'],
];

describe('collection tool benchmark', () => {
  it('covers the 195 councils, each with the unit the engine links it to', () => {
    expect(Object.keys(councils)).toHaveLength(195);
    for (const c of model.councils) {
      const row = councils[c.id];
      expect(row, c.id).toBeTruthy();
      expect(row.unit, c.name).toBe(c.sourceId);
    }
  });

  it("every value is the workbook's raw value of the council's own unit, for every indicator in use", () => {
    const used = usedSpecs(SPECS).map((s) => s.id);
    for (const c of model.councils) {
      const row = councils[c.id];
      const i = baseline.units.indexOf(row.unit);
      expect(i, row.unit).toBeGreaterThan(-1);
      for (const id of used) {
        const expected = baseline.values[id]?.[i];
        if (expected == null) expect(row.values[id], `${c.name} ${id}`).toBeUndefined();
        else expect(row.values[id], `${c.name} ${id}`).toBe(expected);
      }
    }
  });

  it('the twelve urban councils carry their own units, and Butiama its own values', () => {
    for (const [name, unit] of URBAN) {
      const c = model.councils.find((u) => u.name === name)!;
      expect(c, name).toBeTruthy();
      // The workbook writes one unit name with a double space; compare on collapsed whitespace.
      expect(c.sourceName?.replace(/\s+/g, ' '), name).toBe(unit);
      expect(councils[c.id].unit).toBe(c.sourceId);
    }
    const butiama = model.councils.find((u) => u.name.startsWith('Butiama'))!;
    const musoma = model.councils.find((u) => u.name === 'Musoma District')!;
    expect(councils[butiama.id].unit).not.toBe(councils[musoma.id].unit);
    expect(councils[butiama.id].values['HA.NAT.EQ-EXP']).not.toBe(councils[musoma.id].values['HA.NAT.EQ-EXP']);
  });
});
