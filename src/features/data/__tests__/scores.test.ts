import { parseDecimal, parseScoreInput, sameScore, scoreDelta } from '../lib/scores';

describe('parseDecimal', () => {
  it('reads dots and decimal commas', () => {
    expect(parseDecimal('6.5')).toBe(6.5);
    expect(parseDecimal(' 6,5 ')).toBe(6.5);
    expect(parseDecimal('.5')).toBe(0.5);
    expect(parseDecimal('7.')).toBe(7);
  });
  it('rejects non-numbers', () => {
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('6.5.1')).toBeNaN();
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('1e3')).toBeNaN();
  });
});

describe('parseScoreInput', () => {
  it('treats blank as empty', () => {
    expect(parseScoreInput('')).toEqual({ kind: 'empty' });
    expect(parseScoreInput('   ')).toEqual({ kind: 'empty' });
    expect(parseScoreInput(undefined)).toEqual({ kind: 'empty' });
  });
  it('accepts 0–10 with one decimal', () => {
    expect(parseScoreInput('0')).toEqual({ kind: 'ok', value: 0, rounded: false });
    expect(parseScoreInput('10')).toEqual({ kind: 'ok', value: 10, rounded: false });
    expect(parseScoreInput('6,3')).toEqual({ kind: 'ok', value: 6.3, rounded: false });
  });
  it('flags out-of-range and non-numeric input', () => {
    expect(parseScoreInput('10.1')).toEqual({ kind: 'error', code: 'range' });
    expect(parseScoreInput('-1')).toEqual({ kind: 'error', code: 'range' });
    expect(parseScoreInput('high')).toEqual({ kind: 'error', code: 'notNumber' });
  });
  it('rejects extra decimals unless rounding is allowed', () => {
    expect(parseScoreInput('6.55')).toEqual({ kind: 'error', code: 'decimals' });
    const r = parseScoreInput('6.46', { allowRounding: true });
    expect(r).toEqual({ kind: 'ok', value: 6.5, rounded: true });
  });
});

describe('sameScore / scoreDelta', () => {
  it('compares at one decimal and treats null as its own value', () => {
    expect(sameScore(6.53, 6.5)).toBe(true);
    expect(sameScore(6.56, 6.5)).toBe(false);
    expect(sameScore(null, null)).toBe(true);
    expect(sameScore(null, 0)).toBe(false);
  });
  it('rounds deltas to one decimal', () => {
    expect(scoreDelta(4.5, 4.8)).toBe(0.3);
    expect(scoreDelta(4.8, 4.5)).toBe(-0.3);
    expect(scoreDelta(null, 4.5)).toBeNull();
  });
});
