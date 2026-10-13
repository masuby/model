/**
 * The data control view: the distribution of indicators across institutions and the lineage of every
 * live value, computed from the workflow data and the model.
 */
import { describe, expect, it } from 'vitest';
import type { Institution } from '@/data-layer/types';
import { AUTHORITIES, AUTHORITY_KEYS, authorityKind } from '@/engine/risk/sources';
import { buildModel } from '@/engine/risk/model';
import { distribution, valuesControl } from '../lib/control';
import { suggestedOwner, WORKFLOW_INDICATORS } from '../lib/workflow';

const institutions: Institution[] = AUTHORITY_KEYS.map((key) => ({ key, label: AUTHORITIES[key].label, fullName: AUTHORITIES[key].full, kind: authorityKind(key) }));
const empty = { assignments: [], requests: [], rawValues: [], rawSubmissions: [], validations: [] };

describe('distribution', () => {
  it('with nothing assigned, every indicator is unassigned and suggested to its usual source', () => {
    const d = distribution(empty, institutions);
    expect(d.unassigned).toHaveLength(WORKFLOW_INDICATORS.length);
    expect(d.totals.assigned).toBe(0);
    expect(d.totals.serving).toBe(0);
    const suggestedTotal = d.rows.reduce((n, r) => n + r.suggested.length, 0);
    expect(suggestedTotal).toBe(WORKFLOW_INDICATORS.filter((w) => suggestedOwner(w)).length);
  });

  it('counts each institution’s indicators, requests and submissions', () => {
    const w = WORKFLOW_INDICATORS.filter((x) => x.core).slice(0, 3);
    const d = distribution(
      {
        assignments: w.map((x) => ({ specId: x.spec.id, institutionKey: 'NBS', assignedAt: '2026-10-01T00:00:00Z' })),
        requests: [{ id: 'r1', specId: w[0].spec.id, institutionKey: 'NBS', kind: 'update', dueDate: '2020-01-01', status: 'open', createdByName: 'x', createdAt: '2026-10-01T00:00:00Z' }],
        rawValues: [{ specId: w[1].spec.id, unitId: 'C001', level: 'council', value: 3, at: '2026-10-02T00:00:00Z' }],
        rawSubmissions: [{ id: 's1', specId: w[2].spec.id, entries: [], dataset: 'd', authorName: 'a', status: 'pending', createdAt: '2026-10-03T00:00:00Z' }],
        validations: [],
      },
      institutions,
      new Date('2026-10-10T00:00:00Z'),
    );
    const nbs = d.rows.find((r) => r.key === 'NBS')!;
    expect(nbs.assigned).toHaveLength(3);
    expect(nbs.core).toBe(3);
    expect(nbs.openRequests).toBe(1);
    expect(nbs.overdue).toBe(1);
    expect(nbs.pending).toBe(1);
    expect(nbs.updated).toBe(1);
    expect(nbs.lastUpdate).toBe('2026-10-02T00:00:00Z');
    expect(d.rows[0].key).toBe('NBS'); // the institution with the most indicators leads
    expect(d.totals).toMatchObject({ assigned: 3, serving: 1, openRequests: 1, overdue: 1, pending: 1 });
  });
});

describe('valuesControl', () => {
  it('accounts for every council of every group: workbook, institutional, withheld or empty', () => {
    const model = buildModel();
    const rows = valuesControl(model);
    expect(rows).toHaveLength(32);
    for (const r of rows) expect(r.workbook + r.benchmark + r.institutional + r.withheld + r.empty).toBe(model.councils.length);
    // No institution has submitted anything yet: every stamped value is the Benchmark 2026.
    expect(rows.reduce((n, r) => n + r.institutional, 0)).toBe(0);
    const drought = rows.find((r) => r.key === 'drought')!;
    // Since 14 October 2026 the Benchmark 2026 drought index covers every council in place of the withheld workbook value.
    expect(drought.withheld).toBe(0);
    expect(drought.benchmark).toBe(model.councils.length);
    expect(drought.notes.map((n) => n.id)).toEqual(['DN-01', 'DN-02']);
    // The Benchmark 2026 supplies coastal erosion and the heatwave days for every council as institutional values.
    const coastal = rows.find((r) => r.key === 'coastalHazards')!;
    expect(coastal.benchmark).toBe(model.councils.length);
    expect(coastal.withheld).toBe(0);
    const heatwave = rows.find((r) => r.key === 'heatwave')!;
    expect(heatwave.benchmark).toBe(model.councils.length);
    expect(rows.find((r) => r.key === 'zoonoses')!.empty).toBe(model.councils.length);
    // Before the benchmark the hold covered every council, and an approved institutional value lifts it.
    expect(valuesControl(buildModel({}, { benchmark: false })).find((r) => r.key === 'coastalHazards')!.withheld).toBe(model.councils.length);
    // An approved institutional value shows as institutional, and lifts the hold.
    // Dated after the Benchmark 2026 (10 October): a newer approved value replaces the benchmark's; an older one would not.
    const edited = buildModel({ C053: { 'hazard:drought': { value: 4, at: '2026-10-15T00:00:00Z', authority: 'TMA' } } });
    const after = valuesControl(edited).find((r) => r.key === 'drought')!;
    expect(after.institutional).toBe(1);
    expect(after.benchmark).toBe(drought.benchmark - 1); // the newer institutional value takes the benchmark's place
  });
});
