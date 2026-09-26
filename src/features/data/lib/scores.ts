/**
 * Parsing and validation of typed 0–10 INFORM scores (and plain decimals) for the Data Portal.
 * Everything here is pure and unit-tested (`__tests__/scores.test.ts`).
 */
import { round1 } from '@/engine/risk/math';

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

export type ScoreError = 'notNumber' | 'range' | 'decimals';
export type ScoreParse = { kind: 'empty' } | { kind: 'ok'; value: number; rounded: boolean } | { kind: 'error'; code: ScoreError };

const DECIMAL_RE = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

/** Parse a plain decimal typed by a person: trims, accepts a decimal comma ("6,5"). NaN when not a number. */
export function parseDecimal(input: string | null | undefined): number {
  const s = String(input ?? '').trim();
  if (!DECIMAL_RE.test(s)) return Number.NaN;
  return Number(s.replace(',', '.'));
}

/**
 * Parse a typed 0–10 score. Scores carry at most one decimal (the database stores numeric(4,1)):
 * by default more decimals are an error; with `allowRounding` they are rounded and flagged.
 */
export function parseScoreInput(input: string | null | undefined, { allowRounding = false }: { allowRounding?: boolean } = {}): ScoreParse {
  const s = String(input ?? '').trim();
  if (!s) return { kind: 'empty' };
  const n = parseDecimal(s);
  if (!Number.isFinite(n)) return { kind: 'error', code: 'notNumber' };
  if (n < SCORE_MIN || n > SCORE_MAX) return { kind: 'error', code: 'range' };
  const r = round1(n);
  const hasMoreDecimals = Math.abs(n - r) > 1e-9;
  if (hasMoreDecimals && !allowRounding) return { kind: 'error', code: 'decimals' };
  return { kind: 'ok', value: r, rounded: hasMoreDecimals };
}

/** Two scores are "the same" when they agree at one decimal (null only equals null). */
export function sameScore(a: number | null | undefined, b: number | null | undefined): boolean {
  const an = typeof a === 'number' && Number.isFinite(a);
  const bn = typeof b === 'number' && Number.isFinite(b);
  if (!an || !bn) return !an && !bn;
  return Math.abs(round1(a) - round1(b)) < 1e-9;
}

/** Rounded difference `after − before` (one decimal), or null when either side is missing. */
export function scoreDelta(before: number | null | undefined, after: number | null | undefined): number | null {
  if (typeof before !== 'number' || typeof after !== 'number' || !Number.isFinite(before) || !Number.isFinite(after)) return null;
  return Math.round((after - before) * 10) / 10;
}
