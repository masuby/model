/**
 * A filled collection tool (xlsx) read without a spreadsheet library and turned into the template rows
 * the portal already reviews (xlsx-lite.ts + tool-import.ts). The fixture is a three-council tool made
 * with openpyxl (scripts: see fixtures/README) carried here as base64, so the test needs no file access.
 */
import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/risk/model';
import { ACTIVE_SPECS } from '@/engine/risk/standardise';
import { parseTemplate } from '../lib/template';
import { rowsToCsv, toolToTemplateRows } from '../lib/tool-import';
import { columnIndex, openXlsx } from '../lib/xlsx-lite';

const FIXTURE_B64 =
  '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';

const fixture = (): ArrayBuffer => {
  const bin = atob(FIXTURE_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

describe('xlsx-lite', () => {
  it('lists the sheets and reads cells by column', async () => {
    const book = await openXlsx(fixture());
    expect(book.sheets).toEqual(['How to use', 'Council Entry', 'Council 0-10']);
    const rows = await book.rows('Council Entry');
    expect(rows[0][2]).toBe('Indicator');
    expect(rows[0][3]).toBe('Coastal Erosion');
    expect(rows[9]).toEqual(['Region', 'Council', 'Code', 'Coastal Erosion', 'Heatwave days (runs of 3 or more days above the local 90th percentile), 2015-2024', 'Access to electricity', 'Not an indicator']);
    expect(rows[10][3]).toBe(-0.5);
    expect(rows[10][6]).toBe(1);
    expect(columnIndex('A')).toBe(0);
    expect(columnIndex('AB')).toBe(27);
  });
});

describe('tool import', () => {
  it('maps the indicator columns to specifications and the council rows to template rows', async () => {
    const book = await openXlsx(fixture());
    const imported = toolToTemplateRows(await book.rows('Council Entry'), ACTIVE_SPECS, null);
    expect(imported.indicators).toEqual(['HA.NAT.CH-ERO', 'HA.NAT.HW-EXP', 'CC.INF.COM-ELEC']);
    expect(imported.unknown).toEqual(['Not an indicator']);
    expect(imported.councils).toBe(3);
    expect(imported.values).toBe(5); // Kondoa Town is empty; the formula cell has no cached value
    const parsed = parseTemplate(rowsToCsv(imported.rows), buildModel(), ACTIVE_SPECS);
    expect(parsed.issues).toEqual([]);
    expect(parsed.submissions.map((s) => [s.specId, s.entries.length])).toEqual([
      ['HA.NAT.CH-ERO', 2],
      ['HA.NAT.HW-EXP', 2],
      ['CC.INF.COM-ELEC', 1],
    ]);
    expect(parsed.submissions[0].entries[0]).toMatchObject({ unitId: 'C001', level: 'council', value: -0.5 });
  });

  it("keeps only an institution's own indicators when restricted", async () => {
    const book = await openXlsx(fixture());
    const imported = toolToTemplateRows(await book.rows('Council Entry'), ACTIVE_SPECS, new Set(['CC.INF.COM-ELEC']));
    expect(imported.indicators).toEqual(['CC.INF.COM-ELEC']);
    expect(imported.skipped.sort()).toEqual(['HA.NAT.CH-ERO', 'HA.NAT.HW-EXP']);
    expect(imported.values).toBe(1);
  });
});
