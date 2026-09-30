/**
 * Helpers for measured values in their natural unit (18 for 18 % underweight, 11 for an 11-year drought
 * frequency…): which indicators can be standardised, their reference range, number parsing as people
 * type it, the measured provenance older score submissions carry, and i18n-safe keys. Turning measured
 * values into scores lives in `@/engine/risk/rawValues`.
 */
import type { Change } from '@/data-layer/types';
import { isNum } from '@/engine/risk/math';
import type { IndicatorSpec } from '@/engine/risk/standardise';

/** Whether the spec can standardise a value today (needs a real reference range and no denominator). */
export function isComputable(spec: IndicatorSpec): boolean {
  if (spec.denominator && spec.denominator !== 'None') return false;
  return isNum(spec.resolved_min) && isNum(spec.resolved_max) && spec.resolved_min !== spec.resolved_max;
}

const invertTransform = (v: number, transform: string | null | undefined) =>
  transform === 'Logarithm' ? Math.max(0, Math.exp(v) - 0.001) : transform === 'Exponential' ? Math.log(v) : v;

/** Reference range in the indicator's NATURAL unit (min/max are stored after the transform). */
export function naturalRange(spec: IndicatorSpec): [number, number] | null {
  if (!isComputable(spec)) return null;
  const a = invertTransform(spec.resolved_min as number, spec.transform);
  const b = invertTransform(spec.resolved_max as number, spec.transform);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a <= b ? [a, b] : [b, a];
}

export const increasesRisk = (spec: IndicatorSpec) => !String(spec.sign).startsWith('Decrease');

/**
 * Parse a measured value as people type it: spaces as thousands separators ("989 030"), "1,234,567",
 * "1.234,5" / "1,234.5", and a decimal comma ("0,52"). NaN when it is not a number.
 */
export function parseRawNumber(input: string | null | undefined): number {
  let s = String(input ?? '')
    .trim()
    .replace(/[\s\u00a0\u202f']/g, '');
  if (!s) return Number.NaN;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    const decimal = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    s = decimal === '.' ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    s = /^[+-]?[1-9]\d{0,2}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (hasDot && /^[+-]?[1-9]\d{0,2}(\.\d{3}){2,}$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return Number.NaN;
  return Number(s);
}

/* ------------------------------------------------------------------------------------------------ */
/* Raw provenance on a Change                                                                         */
/* ------------------------------------------------------------------------------------------------ */

const ID_SEP = ' + ';
const VAL_SEP = ' ; ';

/**
 * `Change.raw` holds ONE {specId, value, unit}. A component fed by several measured indicators was
 * encoded losslessly as "ID1 + ID2" / "v1 ; v2" / "u1 ; u2"; `decodeRaw` reads it back for the change
 * tables of older submissions.
 */
export function encodeRaw(inputs: ReadonlyArray<{ specId: string; raw: number; unit: string | null }>): Change['raw'] {
  if (!inputs.length) return null;
  if (inputs.length === 1) return { specId: inputs[0].specId, value: inputs[0].raw, unit: inputs[0].unit };
  return {
    specId: inputs.map((i) => i.specId).join(ID_SEP),
    value: inputs.map((i) => String(i.raw)).join(VAL_SEP),
    unit: inputs.map((i) => i.unit ?? '').join(VAL_SEP),
  };
}

export interface DecodedRaw {
  specId: string;
  value: string;
  unit: string | null;
}

export function decodeRaw(raw: Change['raw']): DecodedRaw[] {
  if (!raw || typeof raw.specId !== 'string') return [];
  const ids = raw.specId.split(ID_SEP);
  if (ids.length === 1) return [{ specId: ids[0], value: String(raw.value), unit: raw.unit ?? null }];
  const values = String(raw.value).split(VAL_SEP);
  const units = String(raw.unit ?? '').split(VAL_SEP);
  return ids.map((specId, i) => ({ specId, value: values[i] ?? '', unit: units[i] || null }));
}

/** i18n-safe keys for workbook ids and unit strings ("HA.NAT.FL-EXP" → "HA_NAT_FL-EXP"). */
export const specKey = (id: string) => id.replace(/\./g, '_');
export const unitKey = (unit: string | null | undefined) =>
  String(unit ?? '')
    .trim()
    .toLowerCase()
    .replace(/%/g, ' pct ')
    .replace(/\$/g, ' usd ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
