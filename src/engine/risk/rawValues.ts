/**
 * Measured values from institutions, and how they reach the model.
 *
 * An institution records an indicator in its natural unit (a poverty rate in %, years of schooling…)
 * for the whole country, for regions, or for councils, whichever its data allow. INFORM keys every
 * indicator at the finest level that exists, so for each council:
 *
 *   1. its own council value, else its region's value, else the national value (finest wins);
 *   2. any submitted value replaces the INFORM baseline (the workbook value of the council's district);
 *   3. an indicator group (a model leaf) is recomputed when at least one of its indicators has a
 *      submitted value: submitted scores where present, baseline scores for the rest, combined with the
 *      workbook weights exactly as `computeFromRaw` does. Groups with no submitted value are untouched.
 *
 * The result is a set of council-level overrides stamped with every input and its level, merged with
 * the direct 0–10 edits so that the most recent approved value wins.
 */
import { leafForWorkbookComponent } from './hierarchy';
import { isNum, round1, weightedMean } from './math';
import { placeKey } from './model';
import { SPECS, standardise, usedSpecs, type IndicatorSpec, type SpecTable } from './standardise';
import type { EditRef, EditStamp, LeafInput, Overrides, RiskModel, Unit } from './types';

export type RawLevel = 'national' | 'region' | 'council';

/** One approved measured value. */
export interface RawValue {
  specId: string;
  /** 'TZ', a region id ('R-arusha') or a council id ('C001'). */
  unitId: string;
  level: RawLevel;
  /** Natural-unit value; null records "no data" explicitly. */
  value: number | null;
  dataset?: string | null;
  period?: string | null;
  institution?: string | null;
  author?: string | null;
  at: string;
}

/** INFORM baseline measured values per district (src/data/inform-baseline-raw.json). */
export interface BaselineRaw {
  source: string;
  units: string[];
  values: Record<string, Array<number | null>>;
}

export const NATIONAL_ID = 'TZ';
export const regionIdOf = (unit: Pick<Unit, 'region'>): string => `R-${placeKey(unit.region)}`;

/** Whether a measured value of this indicator can be turned into a 0–10 score (it has a reference range). */
export function scoreable(spec: IndicatorSpec): boolean {
  if (spec.denominator && spec.denominator !== 'None') return false;
  return isNum(spec.resolved_min) && isNum(spec.resolved_max) && spec.resolved_min !== spec.resolved_max;
}

/** 0–10 score of a measured value, or null. */
export const scoreRaw = (spec: IndicatorSpec, raw: number | null | undefined): number | null =>
  isNum(raw) && scoreable(spec) ? standardise(raw, spec) : null;

export interface LeafSpecs {
  ref: EditRef;
  component: string;
  specs: IndicatorSpec[];
}

const leafCache = new WeakMap<SpecTable, LeafSpecs[]>();

/** The used workbook indicators grouped by the model leaf they feed (components without a leaf are skipped). */
export function leafSpecs(specs: SpecTable = SPECS): LeafSpecs[] {
  const hit = leafCache.get(specs);
  if (hit) return hit;
  const byRef = new Map<EditRef, LeafSpecs>();
  for (const s of usedSpecs(specs)) {
    const leaf = leafForWorkbookComponent(String(s.component ?? ''));
    if (!leaf) continue;
    const ref = `${leaf.dimension.key}:${leaf.indicator.key}` as EditRef;
    if (!byRef.has(ref)) byRef.set(ref, { ref, component: String(s.component), specs: [] });
    byRef.get(ref)!.specs.push(s);
  }
  const out = [...byRef.values()];
  leafCache.set(specs, out);
  return out;
}

/** The model leaf a workbook indicator feeds, if any. */
export function leafOfSpec(specId: string, specs: SpecTable = SPECS): EditRef | null {
  return leafSpecs(specs).find((l) => l.specs.some((s) => s.id === specId))?.ref ?? null;
}

export interface RawIndex {
  national: Map<string, RawValue>;
  region: Map<string, Map<string, RawValue>>;
  council: Map<string, Map<string, RawValue>>;
}

/** Index approved values by indicator and level. */
export function indexRawValues(values: readonly RawValue[]): RawIndex {
  const idx: RawIndex = { national: new Map(), region: new Map(), council: new Map() };
  for (const v of values) {
    if (v.level === 'national') idx.national.set(v.specId, v);
    else {
      const byUnit = v.level === 'region' ? idx.region : idx.council;
      if (!byUnit.has(v.specId)) byUnit.set(v.specId, new Map());
      byUnit.get(v.specId)!.set(v.unitId, v);
    }
  }
  return idx;
}

/** The submitted value that applies to a council: its own, else its region's, else the national one. */
export function resolveForCouncil(idx: RawIndex, specId: string, council: Unit): RawValue | null {
  return idx.council.get(specId)?.get(council.id) ?? idx.region.get(specId)?.get(regionIdOf(council)) ?? idx.national.get(specId) ?? null;
}

/** Baseline measured value of an indicator for an INFORM district (source unit), or null. */
export function baselineValue(baseline: BaselineRaw | null | undefined, specId: string, sourceId: string | null | undefined): number | null {
  if (!baseline || !sourceId) return null;
  const i = baseline.units.indexOf(sourceId);
  const v = i >= 0 ? baseline.values[specId]?.[i] : null;
  return isNum(v) ? v : null;
}

/** The value a council currently has for one indicator, with its level (submitted, else baseline). */
export function councilInput(idx: RawIndex, spec: IndicatorSpec, council: Unit, baseline: BaselineRaw | null): LeafInput {
  const r = resolveForCouncil(idx, spec.id, council);
  if (r)
    return {
      specId: spec.id,
      raw: r.value,
      score: scoreRaw(spec, r.value),
      level: r.level,
      unitId: r.unitId,
      dataset: r.dataset ?? null,
      period: r.period ?? null,
      institution: r.institution ?? null,
      at: r.at,
    };
  const raw = baselineValue(baseline, spec.id, council.sourceId);
  return { specId: spec.id, raw, score: scoreRaw(spec, raw), level: 'baseline', unitId: council.sourceId };
}

/**
 * Council-level leaf overrides from the approved measured values. Only leaves with at least one
 * submitted indicator value (at any level that applies to the council) are produced.
 */
export function deriveRawOverrides(values: readonly RawValue[], model: RiskModel, baseline: BaselineRaw | null, specs: SpecTable = SPECS): Overrides {
  if (!values.length) return {};
  const idx = indexRawValues(values);
  const submittedSpecs = new Set(values.map((v) => v.specId));
  const out: Overrides = {};
  for (const leaf of leafSpecs(specs)) {
    if (!leaf.specs.some((s) => submittedSpecs.has(s.id))) continue;
    for (const council of model.councils) {
      const inputs = leaf.specs.map((s) => councilInput(idx, s, council, baseline));
      const submitted = inputs.filter((i) => i.level !== 'baseline');
      if (!submitted.length) continue;
      const mean = weightedMean(inputs.map((i) => [i.score, weightOf(specs[i.specId])] as const));
      const newest = submitted.reduce((a, b) => ((b.at ?? '') > (a.at ?? '') ? b : a));
      const stamp: EditStamp = {
        value: isNum(mean) ? round1(mean) : null,
        authority: newest.institution ?? undefined,
        dataset: newest.dataset ?? undefined,
        at: newest.at ?? new Date(0).toISOString(),
        inputs,
      };
      (out[council.id] ??= {})[leaf.ref] = stamp;
    }
  }
  return out;
}

const weightOf = (spec: IndicatorSpec | undefined): number => {
  const w = Number(spec?.weight);
  return isNum(w) ? w : 1;
};

/**
 * Combine direct 0–10 edits with the recomputed council leaves. For each council and leaf the most
 * recent approved value wins; a direct edit counts whether it was made on the council or (for
 * Vulnerability and Coping, and bulk hazard entry) on its INFORM district.
 */
export function mergeOverrides(explicit: Overrides, derived: Overrides, model: RiskModel): Overrides {
  const out: Overrides = { ...explicit };
  for (const [unitId, refs] of Object.entries(derived)) {
    const unit = model.byId.get(unitId);
    for (const [ref, stamp] of Object.entries(refs ?? {}) as Array<[EditRef, EditStamp]>) {
      const direct = explicit[unitId]?.[ref] ?? (unit?.sourceId ? explicit[unit.sourceId]?.[ref] : undefined);
      if (direct && Date.parse(direct.at) > Date.parse(stamp.at)) continue;
      out[unitId] = { ...out[unitId], [ref]: stamp };
    }
  }
  return out;
}
