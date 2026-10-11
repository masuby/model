/**
 * The institution template round-trips (DE-03): the download lists every indicator and area with the
 * value that applies today; a filled copy is read back into one submission per indicator, and every
 * problem is named by row.
 */
import { describe, expect, it } from 'vitest';
import baselineJson from '@/data/inform-baseline-raw.json';
import { buildModel } from '@/engine/risk/model';
import { indexRawValues, type BaselineRaw } from '@/engine/risk/rawValues';
import { SPECS } from '@/engine/risk/standardise';
import { toCsv } from '@/lib/utils';
import { parseCsv, parseTemplate, TEMPLATE_COLUMNS, templateRows } from '../lib/template';
import { buildSheet } from '../lib/workflow';

const model = buildModel();
const baseline = baselineJson as unknown as BaselineRaw;
const NAMES = { national: 'National', region: 'Region', council: 'Council' };
const SPEC = 'VU.VG.CH-UW'; // children underweight, %

function template(specIds: string[]) {
  const idx = indexRawValues([]);
  return templateRows(
    specIds.map((id) => ({ spec: SPECS[id], sheet: buildSheet(model, SPECS[id], idx, baseline) })),
    NAMES,
  );
}

describe('template download', () => {
  it('lists every area for every indicator, with the current value and an empty new value', () => {
    const rows = template([SPEC, 'HA.NAT.DR-FRE']);
    expect(rows[0]).toEqual([...TEMPLATE_COLUMNS]);
    expect(rows).toHaveLength(1 + 2 * (1 + model.regions.length + model.councils.length));
    const kondoa = rows.find((r) => r[0] === SPEC && r[3] === 'C001')!;
    expect(kondoa.slice(0, 6)).toEqual([SPEC, 'Children Underweight', '%', 'C001', 'Kondoa District', 'Council']);
    expect(kondoa[6]).not.toBe(''); // the workbook value of its unit
    expect(kondoa[8]).toBe('');
    expect(kondoa[9]).toBe('raw');
    expect(rows.find((r) => r[3] === 'TZ')![5]).toBe('National');
  });
});

describe('template upload', () => {
  const header = [...TEMPLATE_COLUMNS];
  const row = (spec: string, area: string, value: string, type = 'raw', source = '') => [spec, '', '', area, '', '', '', '', value, type, source];

  it('reads a filled template into one submission per indicator, past a preamble and quoted cells', () => {
    const csv = toCsv([['INFORM Tanzania export'], ['Data release', 'core-2026.10'], [], header, row(SPEC, 'C001', '21.5'), row(SPEC, 'C002', ''), row(SPEC, 'R-dodoma', 'n/a'), row('HA.NAT.DR-FRE', 'TZ', '12')]);
    const p = parseTemplate(csv, model, SPECS);
    expect(p.issues).toEqual([]);
    expect(p.rows).toBe(4);
    expect(p.filled).toBe(3);
    expect(p.submissions).toHaveLength(2);
    const uw = p.submissions.find((s) => s.specId === SPEC)!;
    expect(uw.valueType).toBe('raw');
    expect(uw.entries).toEqual([
      { unitId: 'C001', level: 'council', value: 21.5 },
      { unitId: 'R-dodoma', level: 'region', value: null },
    ]);
    expect(p.submissions.find((s) => s.specId === 'HA.NAT.DR-FRE')!.entries).toEqual([{ unitId: 'TZ', level: 'national', value: 12 }]);
  });

  it('accepts scores by the INFORM method only with a source, on a scoreable indicator, within 0 to 10', () => {
    const ok = parseTemplate(toCsv([header, row(SPEC, 'C001', '6.25', 'score', 'TDHS-MIS 2022, table 11.3'), row(SPEC, 'C002', '7', 'score')]), model, SPECS);
    expect(ok.issues).toEqual([]);
    expect(ok.submissions[0]).toMatchObject({ valueType: 'score', source: 'TDHS-MIS 2022, table 11.3' });
    expect(ok.submissions[0].entries.map((e) => e.value)).toEqual([6.3, 7]);
    const noSource = parseTemplate(toCsv([header, row(SPEC, 'C001', '6', 'score')]), model, SPECS);
    expect(noSource.submissions).toEqual([]);
    expect(noSource.issues.map((i) => i.kind)).toEqual(['sourceMissing']);
    const range = parseTemplate(toCsv([header, row(SPEC, 'C001', '12', 'score', 'x')]), model, SPECS);
    expect(range.issues.map((i) => [i.kind, i.line])).toEqual([['scoreRange', 2]]);
    const mixed = parseTemplate(toCsv([header, row(SPEC, 'C001', '6', 'score', 'x'), row(SPEC, 'C002', '21', 'raw')]), model, SPECS);
    expect(mixed.issues.map((i) => i.kind)).toEqual(['mixedTypes']);
  });

  it('names unknown indicators and areas, non-numbers and duplicates by line', () => {
    const p = parseTemplate(toCsv([header, row('NO.SUCH', 'C001', '1'), row(SPEC, 'C999', '1'), row(SPEC, 'R-dodoma', 'twelve'), row(SPEC, 'C001', '1'), row(SPEC, 'C001', '2')]), model, SPECS);
    expect(p.issues.map((i) => [i.kind, i.line])).toEqual([
      ['unknownIndicator', 2],
      ['unknownArea', 3],
      ['notNumber', 4],
      ['duplicate', 6],
    ]);
    expect(p.submissions).toHaveLength(1);
    expect(p.submissions[0].entries).toEqual([{ unitId: 'C001', level: 'council', value: 1 }]);
  });

  it('parses CSV with quotes, embedded commas and CRLF', () => {
    expect(parseCsv('a,"b, c",d\r\n"x ""y""",,z\n')).toEqual([
      ['a', 'b, c', 'd'],
      ['x "y"', '', 'z'],
    ]);
    expect(parseTemplate('nothing here', model, SPECS).issues[0].kind).toBe('unknownIndicator');
  });
});
