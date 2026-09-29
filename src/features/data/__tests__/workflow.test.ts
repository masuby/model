import { describe, expect, it } from 'vitest';
import baselineJson from '@/data/inform-baseline-raw.json';
import type { DataRequest, RawSubmission } from '@/data-layer/types';
import { buildModel } from '@/engine/risk/model';
import { indexRawValues, regionIdOf, type BaselineRaw, type RawValue } from '@/engine/risk/rawValues';
import { SPECS } from '@/engine/risk/standardise';
import {
  buildSheet,
  councilsReached,
  draftEntries,
  indicatorStatuses,
  isSpecId,
  parseCell,
  parseRawPaste,
  rangeFlag,
  suggestedOwner,
  WORKFLOW_INDICATORS,
  workflowIndicator,
} from '../lib/workflow';

const model = buildModel();
const baseline = baselineJson as BaselineRaw;
const MPI = 'VU.SE.POV-MPI';
const kondoa = model.byId.get('C001')!;
const dodoma = model.regions.find((r) => r.name === 'Dodoma')!;

describe('indicators', () => {
  it('lists the 53 INFORM indicators and the 25 advanced ones', () => {
    expect(WORKFLOW_INDICATORS.filter((w) => w.core)).toHaveLength(53);
    expect(WORKFLOW_INDICATORS.filter((w) => !w.core)).toHaveLength(25);
    expect(workflowIndicator(MPI)).toMatchObject({ core: true, leaf: 'vulnerability:developmentPoverty', scoreable: true });
    expect(workflowIndicator('CC.INF.COM-INT')!.scoreable).toBe(false);
    expect(isSpecId(MPI)).toBe(true);
    expect(isSpecId('C001')).toBe(false);
  });

  it('suggests owners from the source register and the advanced specification', () => {
    expect(suggestedOwner(workflowIndicator(MPI)!)).toBe('NBS');
    expect(suggestedOwner(workflowIndicator('VU.VG.CH-UW')!)).toBe('MOH');
    expect(suggestedOwner(workflowIndicator('HA.NAT.DR-SPEI')!)).toBe('TMA');
  });
});

describe('status', () => {
  const at = '2026-09-01T00:00:00Z';
  const req = (over: Partial<DataRequest>): DataRequest => ({ id: 'r1', specId: MPI, institutionKey: 'NBS', kind: 'update', status: 'open', createdByName: 'PMO', createdAt: at, ...over });
  const sub = (over: Partial<RawSubmission>): RawSubmission => ({ id: 's1', specId: MPI, entries: [], dataset: 'HBS', authorName: 'NBS', status: 'pending', createdAt: at, ...over });

  it('summarises owner, open request, overdue, pending and coverage', () => {
    const values: RawValue[] = [
      { specId: MPI, unitId: 'TZ', level: 'national', value: 0.3, at: '2026-09-10T00:00:00Z' },
      { specId: MPI, unitId: dodoma.id, level: 'region', value: 0.4, at: '2026-09-11T00:00:00Z' },
      { specId: MPI, unitId: kondoa.id, level: 'council', value: 0.5, at: '2026-09-09T00:00:00Z' },
    ];
    const s = indicatorStatuses(
      {
        assignments: [{ specId: MPI, institutionKey: 'NBS', assignedAt: at }],
        requests: [req({ dueDate: '2026-09-20' }), req({ id: 'r0', status: 'done' })],
        rawValues: values,
        rawSubmissions: [sub({}), sub({ id: 's2', status: 'approved' })],
        validations: [],
      },
      new Date('2026-09-25T00:00:00Z'),
    ).get(MPI)!;
    expect(s.owner).toBe('NBS');
    expect(s.openRequest?.id).toBe('r1');
    expect(s.overdue).toBe(true);
    expect(s.pending).toBe(1);
    expect(s.lastUpdate).toBe('2026-09-11T00:00:00Z');
    expect(s.coverage).toEqual({ national: true, regions: 1, councils: 1 });
  });

  it('does not count a submitted request as overdue', () => {
    const s = indicatorStatuses(
      { assignments: [], requests: [req({ status: 'submitted', dueDate: '2026-01-01' })], rawValues: [], rawSubmissions: [], validations: [] },
      new Date('2026-09-25T00:00:00Z'),
    ).get(MPI)!;
    expect(s.overdue).toBe(false);
    expect(s.openRequest?.status).toBe('submitted');
  });
});

describe('entry sheet', () => {
  const idx = indexRawValues([{ specId: MPI, unitId: dodoma.id, level: 'region', value: 0.45, at: '2026-09-11T00:00:00Z', institution: 'NBS' }]);
  const sheet = buildSheet(model, SPECS[MPI], idx, baseline);

  it('lists every region with its councils', () => {
    expect(sheet.regions).toHaveLength(31);
    expect(sheet.regions.reduce((n, r) => n + r.councils.length, 0)).toBe(model.councils.length);
  });

  it('shows the region value on the region and as inherited on its councils', () => {
    const row = sheet.regions.find((r) => r.unit.id === dodoma.id)!;
    expect(row.own?.value).toBe(0.45);
    expect(row.councils.find((c) => c.unit.id === kondoa.id)!.current).toMatchObject({ raw: 0.45, level: 'region' });
  });

  it('shows the baseline where nothing was submitted', () => {
    const other = sheet.regions.find((r) => r.unit.id !== dodoma.id)!;
    expect(other.councils[0].current?.level).toBe('baseline');
  });

  it('turns typed cells into entries, skipping blanks and unchanged values', () => {
    const drafts = new Map([
      [dodoma.id, '0.45'], // unchanged
      [kondoa.id, '0,5'], // decimal comma
      ['TZ', 'n/a'], // explicit no data
      [model.byId.get('C002')!.id, ''], // blank
      [model.byId.get('C003')!.id, 'abc'], // invalid
    ]);
    const { entries, invalid } = draftEntries(sheet, drafts);
    expect(entries).toEqual([
      { unitId: 'TZ', level: 'national', value: null, previous: null },
      { unitId: kondoa.id, level: 'council', value: 0.5, previous: null },
    ]);
    expect(invalid).toEqual(['C003']);
  });

  it('counts the councils a submission reaches', () => {
    expect(councilsReached(model, indexRawValues([]), MPI, [{ unitId: 'TZ', level: 'national', value: 1 }])).toBe(model.councils.length);
    const dodomaCouncils = model.councils.filter((c) => regionIdOf(c) === dodoma.id).length;
    // National reaches everyone except the councils that already follow Dodoma's region value.
    expect(councilsReached(model, idx, MPI, [{ unitId: 'TZ', level: 'national', value: 1 }])).toBe(model.councils.length - dodomaCouncils);
  });

  it('parses cells and flags values far outside the reference range', () => {
    expect(parseCell('1 234,5')).toEqual({ kind: 'value', value: 1234.5 });
    expect(parseCell('hakuna data')).toEqual({ kind: 'noData' });
    expect(parseCell('')).toEqual({ kind: 'empty' });
    expect(parseCell('x')).toEqual({ kind: 'invalid' });
    expect(rangeFlag(SPECS['VU.VG.CH-UW'], 500)).toBe('high');
    expect(rangeFlag(SPECS['VU.VG.CH-UW'], 20)).toBeNull();
  });
});

describe('paste', () => {
  it('matches regions, councils and the country, in English or Kiswahili', () => {
    const lines = parseRawPaste(
      ['Region\tValue', 'Dodoma\t0.41', 'Mkoa wa Arusha\t0,33', 'Kondoa District Council\t0.5', 'Halmashauri ya Wilaya ya Mpwapwa\t0.52', 'Tanzania\t0.3'].join('\n'),
      model,
    );
    expect(lines.map((l) => [l.unit?.name, l.level, l.cell, l.issue ?? null])).toEqual([
      ['Dodoma', 'region', '0.41', null],
      ['Arusha', 'region', '0,33', null],
      ['Kondoa District', 'council', '0.5', null],
      ['Mpwapwa District', 'council', '0.52', null],
      ['Tanzania', 'national', '0.3', null],
    ]);
  });

  it('reads a bare region name as a council when told the rows are councils', () => {
    const [line] = parseRawPaste('Mpwapwa\t0.5', model, 'council');
    expect(line).toMatchObject({ level: 'council' });
  });

  it('reports unmatched names, missing values, bad numbers and duplicates', () => {
    const lines = parseRawPaste(['Atlantis\t1', 'Dodoma\t', 'Arusha\tabc', 'Mbeya\t1', 'Mbeya\t2'].join('\n'), model);
    expect(lines.map((l) => l.issue ?? null)).toEqual(['unmatched', 'noValue', 'notNumber', 'duplicate', null]);
  });
});
