/**
 * INFORM Risk arithmetic, written in the literal form of the Tanzania country workbook
 * ("INFORM SADC 2024" sheet, cells Z/AK/AU/AV). Every function here is guarded by golden tests
 * against the workbook's cached values (see `__tests__/workbook.golden.test.ts`).
 *
 *   category  = AVERAGE(indicators)                                   (Use = Yes, blanks skipped)
 *   dimension = ROUND((10 - GEOMEAN((10 - c)/10 * 9 + 1, ...)) / 9 * 10, 1)
 *   risk      = ROUND(H^(1/3) * V^(1/3) * LCC^(1/3), 1)
 */

export const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/**
 * Excel ROUND(x, 1). Values in the model are non-negative (0–10), so round-half-up
 * (`floor(x·10 + 0.5) / 10`) is identical to Excel's round-half-away-from-zero here.
 */
export const round1 = (x: number): number => Math.floor(x * 10 + 0.5) / 10;

/** Nullable variant for display code: returns null for anything that is not a finite number. */
export const round1OrNull = (x: unknown): number | null => (isNum(x) ? round1(x) : null);

/** Arithmetic mean of the finite values; null when there are none (INFORM: missing ≠ zero). */
export function mean(values: ReadonlyArray<number | null | undefined>): number | null {
  const xs = values.filter(isNum);
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}

/** Weighted arithmetic mean over the members that have data (weight defaults to 1). */
export function weightedMean(pairs: ReadonlyArray<readonly [number | null | undefined, number | null | undefined]>): number | null {
  let tw = 0;
  let acc = 0;
  for (const [v, w] of pairs) {
    const weight = isNum(w) ? w : 1;
    if (!isNum(v) || weight <= 0) continue;
    tw += weight;
    acc += v * weight;
  }
  return tw ? acc / tw : null;
}

/**
 * INFORM scaled geometric mean (unrounded). Each category c is mapped to (10 - c)/10·9 + 1 ∈ [1, 10],
 * the geometric mean is taken in product form (Excel GEOMEAN), then mapped back to 0–10.
 * Missing categories are skipped; a single category passes through unchanged.
 */
export function scaledGeomean(values: ReadonlyArray<number | null | undefined>): number | null {
  const xs = values.filter(isNum);
  if (!xs.length) return null;
  const scaled = xs.map((x) => ((10 - x) / 10) * 9 + 1);
  const geo = Math.pow(scaled.reduce((p, x) => p * x, 1), 1 / scaled.length);
  return ((10 - geo) / 9) * 10;
}

/** Dimension score = ROUND(scaledGeomean(categories), 1). */
export function dimensionScore(categories: ReadonlyArray<number | null | undefined>): number | null {
  const v = scaledGeomean(categories);
  return v == null ? null : round1(v);
}

/**
 * INFORM Risk = ROUND(H^(1/3) · V^(1/3) · LCC^(1/3), 1).
 * No `> 0` guard: a zero dimension yields 0, exactly as the workbook. Returns null if any input is missing.
 */
export function riskScore(h: number | null | undefined, v: number | null | undefined, c: number | null | undefined): number | null {
  if (!isNum(h) || !isNum(v) || !isNum(c)) return null;
  // Math.pow(x, 1/3) — not Math.cbrt — to mirror Excel's `^(1/3)` bit-for-bit at rounding boundaries.
  return round1(Math.pow(h, 1 / 3) * Math.pow(v, 1 / 3) * Math.pow(c, 1 / 3));
}

/** Clamp to the INFORM 0–10 scale. */
export const clamp10 = (x: number): number => Math.max(0, Math.min(10, x));
