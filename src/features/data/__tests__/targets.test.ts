import { applyEdits, buildModel } from '@/engine/risk/model';
import type { EditRef, Overrides } from '@/engine/risk/types';
import {
  buildSubmissions,
  currentValue,
  EDITABLE_FIELDS,
  EXPOSURE_REF,
  impactOf,
  siblingsOf,
  simulate,
  submissionImpact,
  targetKind,
  targetUnitId,
} from '../lib/targets';

const model = buildModel();
const kondoa = model.byId.get('C001')!; // Kondoa District - shares TZ0101 with Kondoa Town (C002)
const meta = { authority: 'TMA', dataset: ' CHIRPS v3 ', note: '  checked  ' };

describe('edit targets', () => {
  it('lists the 32 indicators plus the exposure index', () => {
    expect(EDITABLE_FIELDS).toHaveLength(33);
    expect(EDITABLE_FIELDS.at(-1)!.ref).toBe(EXPOSURE_REF);
  });

  it('keeps hazard council-own and sends V/C to the source unit', () => {
    expect(targetKind('hazard:flood')).toBe('council');
    expect(targetKind(EXPOSURE_REF)).toBe('council');
    expect(targetKind('vulnerability:habitat')).toBe('source');
    expect(targetKind('coping:wash')).toBe('source');
    expect(targetUnitId(kondoa, 'hazard:drought')).toBe('C001');
    expect(targetUnitId(kondoa, 'coping:wash')).toBe('TZ0101');
  });

  it('finds sibling councils that share the source unit', () => {
    expect(siblingsOf(model, kondoa).map((c) => c.id)).toEqual(['C002']);
  });
});

describe('simulate / impact', () => {
  it('matches what buildModel produces after approval (hazard, council-own)', () => {
    const next = simulate(kondoa, { 'hazard:flood': 9 });
    const approved = buildModel({ C001: { 'hazard:flood': { value: 9, at: '' } } }).byId.get('C001')!;
    expect(next.dims.hazard.score).toBe(approved.dims.hazard.score);
    expect(next.risk).toBe(approved.risk);
    // the input unit is untouched
    expect(currentValue(kondoa, 'hazard:flood')).not.toBe(9);
  });

  it('matches buildModel for V/C edits applied to the source unit, for every sibling', () => {
    const approved = buildModel({ TZ0101: { 'coping:wash': { value: 9.5, at: '' } } });
    for (const id of ['C001', 'C002']) {
      const before = model.byId.get(id)!;
      expect(simulate(before, { 'coping:wash': 9.5 }).risk).toBe(approved.byId.get(id)!.risk);
    }
  });

  it('marks no data as null', () => {
    const next = simulate(kondoa, { 'vulnerability:habitat': null });
    expect(currentValue(next, 'vulnerability:habitat')).toBeNull();
  });

  it('amplifies flood with exposure like the engine, and not when flood was already edited', () => {
    const withExposure = buildModel({ C001: { 'hazard:exposure': { value: 10, at: '' } } }).byId.get('C001')!;
    expect(simulate(kondoa, { [EXPOSURE_REF]: 10 }).dims.hazard.score).toBe(withExposure.dims.hazard.score);

    const overrides: Overrides = { C001: { 'hazard:flood': { value: 2, at: '' } } };
    const floodEdited = buildModel(overrides).byId.get('C001')!;
    const expected = buildModel({ C001: { ...overrides.C001, 'hazard:exposure': { value: 10, at: '' } } }).byId.get('C001')!;
    const preview = simulate(floodEdited, { [EXPOSURE_REF]: 10 });
    expect(currentValue(preview, 'hazard:flood')).toBe(2);
    expect(preview.risk).toBe(expected.risk);
  });

  it('reports before/after summaries', () => {
    const imp = impactOf(kondoa, {});
    expect(imp.before).toEqual(imp.after);
    expect(imp.before.risk).toBe(kondoa.risk);
  });

  it('applyEdits stays a mutation on the clone only', () => {
    const clone = structuredClone(kondoa);
    applyEdits(clone, { 'hazard:drought': { value: 10, at: '' } });
    expect(currentValue(kondoa, 'hazard:drought')).not.toBe(10);
  });
});

describe('buildSubmissions', () => {
  it('splits council-own and source-unit changes into two submissions', () => {
    const subs = buildSubmissions(
      model,
      kondoa,
      [
        { ref: 'vulnerability:habitat', value: 7 },
        { ref: 'hazard:flood', value: 8.5 },
        { ref: EXPOSURE_REF, value: 6 },
        { ref: 'coping:wash', value: null },
      ],
      meta,
    );
    expect(subs).toHaveLength(2);
    const [own, shared] = subs;
    expect(own.unitId).toBe('C001');
    expect(own.unitName).toBe('Kondoa District');
    expect(own.changes.map((c) => c.ref)).toEqual(['hazard:flood', EXPOSURE_REF]);
    expect(shared.unitId).toBe('TZ0101');
    expect(shared.changes.map((c) => c.ref)).toEqual(['vulnerability:habitat', 'coping:wash']);
    expect(shared.changes[1].value).toBeNull();
    expect(shared.changes[0].previous).toBe(currentValue(model.byId.get('TZ0101')!, 'vulnerability:habitat'));
    expect(own.dataset).toBe('CHIRPS v3');
    expect(own.note).toBe('checked');
    expect(own.authority).toBe('TMA');
  });

  it('produces one submission when only one kind changes, and drops no-op changes', () => {
    const same = currentValue(kondoa, 'hazard:drought');
    const subs = buildSubmissions(model, kondoa, [{ ref: 'hazard:drought', value: same }, { ref: 'hazard:flood', value: 1 }], { authority: 'PMO' });
    expect(subs).toHaveLength(1);
    expect(subs[0].changes).toHaveLength(1);
    expect(subs[0].dataset).toBeUndefined();
    expect(buildSubmissions(model, kondoa, [{ ref: 'hazard:drought', value: same }], { authority: 'PMO' })).toHaveLength(0);
  });

  it('keeps raw provenance on changes', () => {
    const raw = { specId: 'VU.SE.POV-HDI', value: 0.5, unit: 'index' };
    const [s] = buildSubmissions(model, kondoa, [{ ref: 'vulnerability:developmentPoverty', value: 7.8, raw }], { authority: 'NBS' });
    expect(s.changes[0].raw).toEqual(raw);
  });
});

describe('submissionImpact', () => {
  it('reports every council sharing a source unit', () => {
    const imp = submissionImpact(model, 'TZ0101', [{ ref: 'coping:wash' as EditRef, value: 10 }]);
    expect(imp.map((i) => i.unit.id).sort()).toEqual(['C001', 'C002']);
    expect(imp.every((i) => (i.after.coping ?? 0) >= (i.before.coping ?? 0))).toBe(true);
  });
  it('reports the council for council submissions and nothing for unknown/aggregated units', () => {
    expect(submissionImpact(model, 'C001', [{ ref: 'hazard:flood', value: 10 }])).toHaveLength(1);
    expect(submissionImpact(model, 'nope', [])).toEqual([]);
    expect(submissionImpact(model, 'TZ', [{ ref: 'hazard:flood', value: 10 }])).toEqual([]);
  });
});
