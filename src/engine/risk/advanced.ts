/**
 * The Advancement layer: Tanzanian sub-indicators added to the Core's indicator groups (hazards, and
 * since October 2026 displaced people, health and education facilities and DRM arrangements), computed
 * beside the Core and shown apart from it. One member, the council's recorded DRM arrangements, is
 * counted by the engine from the council's record (the PMO-DMD list plus the committees' approved
 * records) rather than read from the inputs file. The Core (the INFORM SADC 2024 workbook plus approved institutional
 * values) is never changed by anything here.
 *
 * Inputs: src/data/tanzania-advanced-inputs.json (scripts/build-advanced-inputs.py; loaded lazily by the
 * data layer): per council the raw values of the basket members that exist in data-source/, each with its
 * source, method, period and resolution. Method, for one council and one basket (an exploded workbook
 * component):
 *
 *   leaf = ( k · core + Σ wᵢ sᵢ ) / ( k + Σ wᵢ )   over the sub-indicators i with data
 *
 * where `core` is the council's Core value of the group (its workbook indicators averaged, weight 1 each,
 * k = how many are in use), sᵢ the sub-indicator standardised ONCE with its own reference range
 * (standardise.ts, exactly as the workbook does) and wᵢ its basket weight. Blank members drop out and
 * the weights renormalise, so with no advanced data the layer equals the Core exactly. The new leaf
 * values enter the engine as stamped overrides, so dimensions, risk, regions and the nation are rebuilt
 * the INFORM way and every value carries its lineage (`EditStamp.inputs`).
 */
import { type DimensionKey, leafForWorkbookComponent } from './hierarchy';
import { isNum, round1, weightedMean } from './math';
import { buildModel, indicatorValue } from './model';
import { ADVANCED_SPECS, standardise, usedSpecs, type IndicatorSpec } from './standardise';
import type { EditRef, EditStamp, LeafInput, Overrides, RiskModel, Unit } from './types';

export interface AdvancedInputMeta {
  source: string;
  method: string;
  period: string;
  resolution: 'council' | 'district';
  file: string;
  column: string;
  filled: number;
  institution: string;
  unit?: string | null;
  min?: number | null;
  max?: number | null;
  weight?: number | null;
}
export interface AdvancedInputs {
  release: string;
  layer: string;
  built: string;
  note: string;
  rangeNote: string;
  exposureNote: string;
  inputs: Record<string, AdvancedInputMeta>;
  withheld: Record<string, { reason: string; file?: string }>;
  candidates: Record<string, { note: string; file?: string }>;
  unavailable: string[];
  values: Record<string, Record<string, number>>;
}

import { ADVANCEMENT_AUTHORITY } from './stamps';
/** Institution key stamped on an Advancement value: defined in stamps.ts, re-exported for existing imports. */
export { ADVANCEMENT_AUTHORITY };

/** The one member the engine computes itself: the council's recorded DRM arrangements, counted 0 to 5. */
export const DRR_MEMBER = 'CC.INS.DRR-STAT';
const DRR_FLAGS = ['eprp', 'aa', 'eocc', 'ert', 'rvca'] as const;
/** How many of the five arrangements a council has recorded (null when nothing is recorded for it). */
export function drrArrangements(council: Unit): number | null {
  if (!council.drr) return null;
  return DRR_FLAGS.filter((k) => council.drr?.[k] === true).length;
}

/** Basket weights by sub-indicator id; the specification's weights unless a sensitivity run overrides them. */
export type BasketWeights = Readonly<Record<string, number>>;

export interface AdvancementBasket {
  component: string;
  ref: EditRef;
  dim: DimensionKey;
  key: string;
  /** The basket's sub-indicators, heaviest first. */
  members: IndicatorSpec[];
  /** The workbook indicators in use in this component (weight 1 each). */
  workbook: IndicatorSpec[];
}

export const weightOf = (s: IndicatorSpec): number => {
  const w = Number(s.weight);
  return isNum(w) && w > 0 ? w : 1;
};

/** The baskets that map onto a model leaf, in model order. */
export const ADVANCEMENT_BASKETS: readonly AdvancementBasket[] = (() => {
  const groups = new Map<string, IndicatorSpec[]>();
  for (const s of Object.values(ADVANCED_SPECS)) {
    const c = String(s.component);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(s);
  }
  const used = usedSpecs();
  const out: AdvancementBasket[] = [];
  for (const [component, members] of groups) {
    const leaf = leafForWorkbookComponent(component);
    if (!leaf) continue;
    out.push({
      component,
      ref: `${leaf.dimension.key}:${leaf.indicator.key}` as EditRef,
      dim: leaf.dimension.key,
      key: leaf.indicator.key,
      members: [...members].sort((a, b) => weightOf(b) - weightOf(a)),
      workbook: used.filter((s) => s.component === component),
    });
  }
  return out;
})();

export const basketFor = (ref: string): AdvancementBasket | null => ADVANCEMENT_BASKETS.find((b) => b.ref === ref) ?? null;

/** How many sub-indicators have data, over all baskets. */
export function advancementCoverage(inputs: AdvancedInputs): { filled: number; total: number; withheld: number; unavailable: number; councils: number } {
  const total = Object.keys(ADVANCED_SPECS).length;
  const filled = Object.keys(ADVANCED_SPECS).filter((id) => (inputs.inputs[id]?.filled ?? 0) > 0).length;
  return { filled, total, withheld: Object.keys(inputs.withheld).length, unavailable: inputs.unavailable.length, councils: Object.keys(inputs.values).length };
}

/**
 * The Advancement value of every exploded hazard group, per council, as stamped overrides. Only councils
 * and baskets with at least one sub-indicator value produce a stamp; the stamp's inputs list the Core
 * member (the workbook value, level `baseline`) and every sub-indicator used, with its level.
 */
export function advancementOverrides(core: RiskModel, inputs: AdvancedInputs, weights?: BasketWeights): Overrides {
  const out: Overrides = {};
  const w = (s: IndicatorSpec) => weights?.[s.id] ?? weightOf(s);
  for (const council of core.councils) {
    const vals = inputs.values[council.id] ?? {};
    for (const b of ADVANCEMENT_BASKETS) {
      const members: LeafInput[] = [];
      for (const s of b.members) {
        const raw = s.id === DRR_MEMBER ? drrArrangements(council) : vals[s.id];
        if (!isNum(raw)) continue;
        const score = standardise(raw, s);
        if (score == null) continue;
        const meta = inputs.inputs[s.id];
        members.push({
          specId: s.id,
          raw,
          score,
          level: meta?.resolution ?? 'council',
          unitId: council.id,
          dataset: meta ? `${meta.source} (${meta.period})` : null,
          period: meta?.period ?? null,
          institution: meta?.institution ?? ADVANCEMENT_AUTHORITY,
          at: inputs.built,
        });
      }
      if (!members.length) continue;
      const coreValue = indicatorValue(council, b.dim, b.key);
      const k = b.workbook.length;
      const pairs: Array<readonly [number, number]> = members.map((m) => [m.score!, w(ADVANCED_SPECS[m.specId])] as const);
      if (isNum(coreValue) && k > 0) pairs.unshift([coreValue, k] as const);
      const value = weightedMean(pairs);
      if (!isNum(value)) continue;
      const coreInput: LeafInput[] =
        isNum(coreValue) && k > 0
          ? [{ specId: b.workbook.length === 1 ? b.workbook[0].id : b.component, raw: null, score: coreValue, level: 'baseline', unitId: council.sourceId ?? council.id, dataset: 'Core value of the group', at: inputs.built }]
          : [];
      const stamp: EditStamp = {
        value: round1(value),
        authority: ADVANCEMENT_AUTHORITY,
        dataset: `Advancement ${inputs.release}: ${members.length} of ${b.members.length} sub-indicators`,
        at: inputs.built,
        inputs: [...coreInput, ...members],
      };
      (out[council.id] ??= {})[b.ref] = stamp;
    }
  }
  return out;
}

/**
 * The approved values a Core model carries, as overrides that rebuild the same state: every stamp on a
 * workbook unit and on a council (a council's map already holds the stamps it took from its unit).
 */
export function overridesOf(model: RiskModel): Overrides {
  const out: Overrides = {};
  for (const u of [...model.sources, ...model.councils]) if (Object.keys(u.edits).length) out[u.id] = { ...u.edits };
  return out;
}

/**
 * The full model with the Advancement layer applied: the Core's own approved values plus the
 * Advancement stamps, which take the exploded hazard leaves of each council. Regions and the nation
 * are aggregated from the councils by the engine, the INFORM way.
 */
export function buildAdvancedModel(core: RiskModel, inputs: AdvancedInputs, weights?: BasketWeights): RiskModel {
  const merged = overridesOf(core);
  for (const [id, refs] of Object.entries(advancementOverrides(core, inputs, weights))) merged[id] = { ...merged[id], ...refs };
  return buildModel(merged, { drr: core.drrRecords });
}

export interface LeafDelta {
  basket: AdvancementBasket;
  core: number | null;
  advanced: number | null;
  /** The Advancement stamp (councils only; aggregates carry none). */
  stamp: EditStamp | null;
}
export interface AdvancementDelta {
  core: Unit;
  advanced: Unit;
  risk: { core: number | null; advanced: number | null };
  dims: Record<DimensionKey, { core: number | null; advanced: number | null }>;
  leaves: LeafDelta[];
  /** True when at least one leaf differs. */
  changed: boolean;
}

/** Core versus Advancement for one unit (council, region or nation). */
export function advancementDelta(core: RiskModel, advanced: RiskModel, unitId: string): AdvancementDelta | null {
  const c = core.byId.get(unitId);
  const a = advanced.byId.get(unitId);
  if (!c || !a) return null;
  // Aggregates merge their members' stamps for display; only a council's own stamp is its lineage.
  const leaves = ADVANCEMENT_BASKETS.map((basket) => {
    const stamp = a.level === 'council' ? a.edits[basket.ref] : undefined;
    return {
      basket,
      core: indicatorValue(c, basket.dim, basket.key),
      advanced: indicatorValue(a, basket.dim, basket.key),
      stamp: stamp && stamp.authority === ADVANCEMENT_AUTHORITY && stamp.inputs ? stamp : null,
    };
  });
  const dim = (k: DimensionKey) => ({ core: c.dims[k].score, advanced: a.dims[k].score });
  return {
    core: c,
    advanced: a,
    risk: { core: c.risk, advanced: a.risk },
    dims: { hazard: dim('hazard'), vulnerability: dim('vulnerability'), coping: dim('coping') },
    leaves,
    changed: leaves.some((l) => l.core !== l.advanced),
  };
}
