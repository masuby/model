/**
 * Measured-value entry: a sector officer keys the ACTUAL value in its natural unit (18 for 18 %
 * underweight, 11 for an 11-year drought frequency…) and the proven workbook standardiser turns it into
 * a 0–10 score. Workbook indicators roll up into workbook components (weighted mean of the indicators
 * that were filled - `computeFromRaw`), and each component maps onto one model leaf
 * (`leafForWorkbookComponent`), which becomes an ordinary Change carrying its raw provenance.
 */
import type { Change } from '@/data-layer/types';
import { ALL_INDICATORS, DIMENSION_KEYS, leafForWorkbookComponent, type DimensionKey, type IndicatorLocation } from '@/engine/risk/hierarchy';
import { isNum, round1 } from '@/engine/risk/math';
import { computeFromRaw, standardise, usedSpecs, type IndicatorSpec } from '@/engine/risk/standardise';
import type { EditRef } from '@/engine/risk/types';

export interface RawComponent {
  /** Workbook component name, e.g. "Development & Poverty". */
  name: string;
  leaf: IndicatorLocation | null;
  ref: EditRef | null;
  specs: IndicatorSpec[];
}
export interface RawDimensionGroup {
  key: DimensionKey;
  components: RawComponent[];
}

const dimFromLabel = (label: string | null): DimensionKey | null => {
  const l = String(label).toLowerCase();
  return l.includes('hazard') ? 'hazard' : l.includes('vulner') ? 'vulnerability' : l.includes('coping') ? 'coping' : null;
};
const leafOrder = (leaf: IndicatorLocation | null) => (leaf ? ALL_INDICATORS.indexOf(leaf) : Number.MAX_SAFE_INTEGER);

/** The used workbook indicators, grouped dimension → component (in the model's canonical order). */
export function rawGroups(specs: readonly IndicatorSpec[] = usedSpecs()): RawDimensionGroup[] {
  const comps = new Map<string, RawComponent & { dim: DimensionKey | null }>();
  for (const s of specs) {
    const name = String(s.component ?? '');
    if (!comps.has(name)) {
      const leaf = leafForWorkbookComponent(name);
      comps.set(name, {
        name,
        leaf,
        ref: leaf ? (`${leaf.dimension.key}:${leaf.indicator.key}` as EditRef) : null,
        specs: [],
        dim: leaf?.dimension.key ?? dimFromLabel(s.dimension),
      });
    }
    comps.get(name)!.specs.push(s);
  }
  return DIMENSION_KEYS.map((key) => ({
    key,
    components: [...comps.values()]
      .filter((c) => c.dim === key)
      .sort((a, b) => leafOrder(a.leaf) - leafOrder(b.leaf))
      .map(({ dim: _dim, ...c }) => c),
  })).filter((g) => g.components.length > 0);
}

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

/** Standardise one measured value to 0–10 with the workbook spec (null when not computable). */
export const standardiseRaw = (spec: IndicatorSpec, raw: number | null | undefined): number | null =>
  isNum(raw) && isComputable(spec) ? standardise(raw, spec) : null;

export interface RawInput {
  specId: string;
  raw: number;
  score: number;
  unit: string | null;
}
export interface ComponentScore {
  component: string;
  ref: EditRef;
  /** Component score (weighted mean of the filled indicators), one decimal. */
  score: number;
  inputs: RawInput[];
}

/**
 * Component scores from the measured values that were filled. Only components that map onto a model
 * leaf are returned; unfilled indicators of a component are simply not part of its mean.
 */
export function componentScores(rawById: Readonly<Record<string, number>>, groups: readonly RawDimensionGroup[] = rawGroups()): ComponentScore[] {
  const computable: Record<string, number> = {};
  const specById = new Map<string, IndicatorSpec>();
  for (const g of groups) for (const c of g.components) for (const s of c.specs) specById.set(s.id, s);
  for (const [id, v] of Object.entries(rawById)) {
    const spec = specById.get(id);
    if (spec && isComputable(spec) && isNum(v)) computable[id] = v;
  }
  const res = computeFromRaw(computable);
  const out: ComponentScore[] = [];
  for (const g of groups)
    for (const c of g.components) {
      const v = res.component[c.name];
      if (!c.ref || !isNum(v)) continue;
      const inputs = c.specs
        .filter((s) => isNum(res.score[s.id]))
        .map((s) => ({ specId: s.id, raw: computable[s.id], score: res.score[s.id], unit: s.unit?.trim() || null }));
      out.push({ component: c.name, ref: c.ref, score: round1(v), inputs });
    }
  return out;
}

/* ------------------------------------------------------------------------------------------------ */
/* Raw provenance on a Change                                                                         */
/* ------------------------------------------------------------------------------------------------ */

const ID_SEP = ' + ';
const VAL_SEP = ' ; ';

/**
 * `Change.raw` holds ONE {specId, value, unit}. A component fed by several measured indicators is
 * encoded losslessly as "ID1 + ID2" / "v1 ; v2" / "u1 ; u2" (decoded by `decodeRaw`).
 */
export function encodeRaw(inputs: ReadonlyArray<Pick<RawInput, 'specId' | 'raw' | 'unit'>>): Change['raw'] {
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
