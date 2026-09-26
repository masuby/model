import { buildModel } from '@/engine/risk/model';
import type { Submission } from '@/data-layer/types';
import { buildExport, EXPORT_FORMAT, MAX_IMPORT_BYTES, planImport, readExportFile } from '../lib/io';
import { runInBatches } from '../lib/batch';

const model = buildModel();

const pending = (over: Partial<Submission> = {}): Submission => ({
  id: 's1',
  unitId: 'C001',
  unitName: 'Kondoa District',
  region: 'Dodoma',
  changes: [{ ref: 'hazard:flood', value: 9.1 }],
  authority: 'TMA',
  authorName: 'A',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('export', () => {
  it('writes a versioned envelope', () => {
    const e = buildExport({ mode: 'local', overrides: {}, submissions: [], now: new Date('2026-09-26T00:00:00Z') });
    expect(e).toMatchObject({ format: EXPORT_FORMAT, version: 1, exportedAt: '2026-09-26T00:00:00.000Z', mode: 'local' });
  });
});

describe('readExportFile', () => {
  it('rejects bad JSON, foreign formats, other versions and huge files', () => {
    expect(readExportFile('{')).toEqual({ ok: false, error: 'json' });
    expect(readExportFile('{"hello":1}')).toEqual({ ok: false, error: 'format' });
    expect(readExportFile(JSON.stringify({ format: EXPORT_FORMAT, version: 99 }))).toEqual({ ok: false, error: 'version' });
    expect(readExportFile(' '.repeat(MAX_IMPORT_BYTES + 1))).toEqual({ ok: false, error: 'tooLarge' });
  });
  it('accepts its own export', () => {
    const e = buildExport({ mode: 'local', overrides: { C001: { 'hazard:flood': { value: 9, at: 'x' } } }, submissions: [pending()] });
    const r = readExportFile(JSON.stringify(e));
    expect(r.ok).toBe(true);
  });
});

describe('planImport', () => {
  const file = (overrides: Record<string, unknown>, submissions: unknown[] = []) => ({ exportedAt: null, overrides, submissions });

  it('turns approved values into pending submissions on the right targets', () => {
    const plan = planImport(
      file({
        C001: { 'hazard:flood': { value: 9.14, authority: 'TMA', at: 'x' }, 'coping:wash': { value: 9.5, authority: 'MOW', at: 'x' } },
        TZ0101: { 'vulnerability:habitat': { value: null, at: 'x' } },
      }),
      model,
      { includeOverrides: true, includePending: false },
    );
    expect(plan.issues).toEqual([]);
    const byUnit = Object.fromEntries(plan.submissions.map((s) => [`${s.unitId}|${s.authority}`, s.changes.map((c) => [c.ref, c.value])]));
    expect(byUnit['C001|TMA']).toEqual([['hazard:flood', 9.1]]);
    expect(byUnit['TZ0101|MOW']).toEqual([['coping:wash', 9.5]]); // V/C on a council → its source unit
    expect(byUnit['TZ0101|NBS']).toEqual([['vulnerability:habitat', null]]); // default authority from the source table
    expect(plan.values).toBe(3);
  });

  it('expands a hazard value stored on a source unit to its councils', () => {
    const plan = planImport(file({ TZ0101: { 'hazard:drought': { value: 9.9, at: 'x' } } }), model, { includeOverrides: true, includePending: false });
    expect(plan.submissions.map((s) => s.unitId).sort()).toEqual(['C001', 'C002']);
  });

  it('validates units, indicators and values', () => {
    const plan = planImport(
      file({
        NOPE: { 'hazard:flood': { value: 1 } },
        C001: { 'hazard:bogus': { value: 1 }, 'hazard:flood': { value: 11 }, 'hazard:exposure': { value: null }, 'hazard:drought': 'x' },
        'R-dodoma': { 'hazard:flood': { value: 1 } },
      }),
      model,
      { includeOverrides: true, includePending: false },
    );
    expect(plan.submissions).toEqual([]);
    expect(plan.issues.map((i) => i.kind).sort()).toEqual(['badValue', 'badValue', 'badValue', 'unknownIndicator', 'unknownUnit', 'unsupportedUnit']);
  });

  it('replays only pending submissions and skips unchanged values', () => {
    const plan = planImport(
      file({}, [pending(), pending({ id: 's2', status: 'approved', changes: [{ ref: 'hazard:drought', value: 1 }] }), { junk: true }, pending({ id: 's3', changes: [] })]),
      model,
      { includeOverrides: false, includePending: true },
    );
    expect(plan.found.pendingSubmissions).toBe(2);
    expect(plan.submissions).toHaveLength(1);
    expect(plan.submissions[0].changes[0]).toMatchObject({ ref: 'hazard:flood', value: 9.1 });
    expect(plan.issues.map((i) => i.kind)).toEqual(['badSubmission']);

    const cur = model.byId.get('C001')!.dims.hazard.categories.natural.indicators.flood;
    const same = planImport(file({ C001: { 'hazard:flood': { value: cur } } }), model, { includeOverrides: true, includePending: false });
    expect(same.unchanged).toBe(1);
    expect(same.submissions).toEqual([]);
  });
});

describe('runInBatches', () => {
  it('keeps order, bounds concurrency and captures failures', async () => {
    let active = 0;
    let peak = 0;
    const progress: number[] = [];
    const out = await runInBatches(
      [1, 2, 3, 4, 5, 6],
      async (n) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
        if (n === 4) throw new Error('boom');
        return n * 10;
      },
      { concurrency: 2, onProgress: (d) => progress.push(d) },
    );
    expect(peak).toBeLessThanOrEqual(2);
    expect(out.map((o) => (o.ok ? o.value : 'x'))).toEqual([10, 20, 30, 'x', 50, 60]);
    expect(progress).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('handles an empty list', async () => {
    expect(await runInBatches([], async () => 1)).toEqual([]);
  });
});
