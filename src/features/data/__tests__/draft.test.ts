import { buildModel } from '@/engine/risk/model';
import { countDirty, evaluateRow, isRowDirty } from '../lib/draft';
import { currentValue, EDITABLE_FIELDS, EXPOSURE_REF, fieldFor } from '../lib/targets';

const council = buildModel().byId.get('C001')!;
const flood = fieldFor('hazard:flood')!;
const exposure = fieldFor(EXPOSURE_REF)!;

describe('evaluateRow', () => {
  it('is a no-op without a draft or with a blank / unchanged value', () => {
    expect(evaluateRow(flood, council, undefined).change).toBeNull();
    expect(evaluateRow(flood, council, { text: '  ', noData: false }).change).toBeNull();
    const cur = currentValue(council, 'hazard:flood')!;
    expect(evaluateRow(flood, council, { text: cur.toFixed(1), noData: false }).change).toBeNull();
  });
  it('produces a change for a valid new value (decimal comma accepted)', () => {
    const e = evaluateRow(flood, council, { text: '9,9', noData: false });
    expect(e.error).toBeNull();
    expect(e.change).toEqual({ ref: 'hazard:flood', value: 9.9 });
  });
  it('reports validation errors', () => {
    expect(evaluateRow(flood, council, { text: '11', noData: false }).error).toBe('range');
    expect(evaluateRow(flood, council, { text: '6.55', noData: false }).error).toBe('decimals');
    expect(evaluateRow(flood, council, { text: 'x', noData: false }).error).toBe('notNumber');
  });
  it('marks no data as a null change, but never for exposure', () => {
    expect(evaluateRow(flood, council, { text: '', noData: true }).change).toEqual({ ref: 'hazard:flood', value: null });
    expect(evaluateRow(exposure, council, { text: '', noData: true }).change).toBeNull();
  });
  it('counts dirty rows', () => {
    expect(isRowDirty({ text: '', noData: false })).toBe(false);
    expect(countDirty({ a: { text: '1', noData: false }, b: { text: '', noData: true }, c: { text: '', noData: false } })).toBe(2);
    expect(EDITABLE_FIELDS.every((f) => evaluateRow(f, council, undefined).change === null)).toBe(true);
  });
});
