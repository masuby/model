/**
 * Edit targets and live impact - the rules that decide WHICH unit receives an edit, and what the map
 * would show after approval.
 *
 *   • Hazard & Exposure indicators (and the exposure index) are council-own: edits target the council.
 *   • Vulnerability & Lack of Coping Capacity come from the council's INFORM source unit
 *     (`unit.sourceId`), shared by sibling councils - edits MUST target the source unit, so every
 *     council that shares it moves together (this is exactly how `buildModel` applies overrides).
 *
 * The preview runs the engine's own `applyEdits` on a `structuredClone` of the unit, so it is the same
 * arithmetic the model will run once the change is approved.
 */
import type { Change, NewSubmission } from '@/data-layer/types';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { applyEdits, indicatorValue } from '@/engine/risk/model';
import type { EditRef, EditStamp, RiskModel, Unit } from '@/engine/risk/types';
import { sameScore } from './scores';

export const EXPOSURE_REF = 'hazard:exposure' as const satisfies EditRef;

export interface EditableField {
  ref: EditRef;
  dim: DimensionKey;
  /** Category key, or 'exposure' for the population-exposure index. */
  category: string;
  key: string;
}

/** Every value a person can edit for a council: the 32 indicator leaves plus the exposure index. */
export const EDITABLE_FIELDS: readonly EditableField[] = [
  ...DIMENSIONS.flatMap((d) =>
    d.categories.flatMap((c) => c.indicators.map((i) => ({ ref: `${d.key}:${i.key}` as EditRef, dim: d.key, category: c.key, key: i.key }))),
  ),
  { ref: EXPOSURE_REF, dim: 'hazard', category: 'exposure', key: 'exposure' },
];

const FIELD_BY_REF = new Map(EDITABLE_FIELDS.map((f) => [f.ref, f]));
export const fieldFor = (ref: string): EditableField | null => FIELD_BY_REF.get(ref as EditRef) ?? null;
export const isEditRef = (ref: unknown): ref is EditRef => typeof ref === 'string' && FIELD_BY_REF.has(ref as EditRef);

export type TargetKind = 'council' | 'source';
/** Hazard (incl. exposure) is council-own; Vulnerability and Coping live on the shared source unit. */
export const targetKind = (ref: EditRef): TargetKind => (ref.startsWith('hazard:') ? 'council' : 'source');

/** The unit id that must receive an edit of `ref` entered for `council`. */
export function targetUnitId(council: Unit, ref: EditRef): string {
  return targetKind(ref) === 'source' && council.sourceId ? council.sourceId : council.id;
}

/** Current value of an editable field on a unit (exposure → exposure index). */
export function currentValue(unit: Unit, ref: EditRef): number | null {
  if (ref === EXPOSURE_REF) return unit.exposure?.index ?? null;
  const [dim, key] = ref.split(':') as [DimensionKey, string];
  return indicatorValue(unit, dim, key);
}

/** Councils that take their Vulnerability & Coping from `sourceId`. */
export function sharingCouncils(model: RiskModel, sourceId: string): Unit[] {
  return model.councils.filter((c) => c.sourceId === sourceId);
}

/** Other councils sharing this council's source unit. */
export function siblingsOf(model: RiskModel, council: Unit): Unit[] {
  return council.sourceId ? sharingCouncils(model, council.sourceId).filter((c) => c.id !== council.id) : [];
}

/* ------------------------------------------------------------------------------------------------ */
/* Live impact                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface DimSummary {
  hazard: number | null;
  vulnerability: number | null;
  coping: number | null;
  risk: number | null;
}
export const summarise = (u: Unit): DimSummary => ({
  hazard: u.dims.hazard.score,
  vulnerability: u.dims.vulnerability.score,
  coping: u.dims.coping.score,
  risk: u.risk,
});

export type ValueMap = Partial<Record<EditRef, number | null>>;

/**
 * The unit as it would be after the given values are approved. Uses the engine's `applyEdits` on a
 * deep clone. One subtlety is reproduced exactly: when flood was already edited (approved), a new
 * exposure value must NOT re-amplify flood - the real model skips amplification whenever flood is edited.
 */
export function simulate(unit: Unit, values: ValueMap): Unit {
  const clone = structuredClone(unit);
  const refs = Object.keys(values) as EditRef[];
  if (!refs.length) return clone;
  const at = new Date(0).toISOString();
  const edits: Partial<Record<EditRef, EditStamp>> = {};
  for (const ref of refs) edits[ref] = { value: values[ref] ?? null, at };
  if (EXPOSURE_REF in edits && !('hazard:flood' in edits) && unit.edits['hazard:flood']) {
    edits['hazard:flood'] = { value: currentValue(unit, 'hazard:flood'), at };
  }
  applyEdits(clone, edits);
  return clone;
}

export interface Impact {
  before: DimSummary;
  after: DimSummary;
}
export const impactOf = (unit: Unit, values: ValueMap): Impact => ({ before: summarise(unit), after: summarise(simulate(unit, values)) });

/** Keep only the refs that live on the shared source unit (Vulnerability & Coping). */
export function sourceValues(values: ValueMap): ValueMap {
  return Object.fromEntries(Object.entries(values).filter(([ref]) => targetKind(ref as EditRef) === 'source')) as ValueMap;
}

export interface AffectedImpact extends Impact {
  unit: Unit;
}

/**
 * Impact of a (pending) submission on the councils it affects: the council itself, or - for a source
 * unit - every council that shares it. Regions/national are not edit targets (they are aggregated).
 */
export function submissionImpact(model: RiskModel, unitId: string, changes: ReadonlyArray<Pick<Change, 'ref' | 'value'>>): AffectedImpact[] {
  const unit = model.byId.get(unitId);
  if (!unit) return [];
  const values: ValueMap = {};
  for (const c of changes) if (isEditRef(c.ref)) values[c.ref] = c.value;
  if (unit.level === 'council') return [{ unit, ...impactOf(unit, values) }];
  if (unit.level === 'source') {
    const vc = sourceValues(values);
    const councils = sharingCouncils(model, unit.id);
    if (!Object.keys(vc).length || !councils.length) return [{ unit, ...impactOf(unit, values) }];
    return councils.map((c) => ({ unit: c, ...impactOf(c, vc) }));
  }
  return [];
}

/* ------------------------------------------------------------------------------------------------ */
/* Building submissions                                                                               */
/* ------------------------------------------------------------------------------------------------ */

/** One change as drafted in the UI (value null = mark as no data). */
export interface DraftChange {
  ref: EditRef;
  value: number | null;
  raw?: Change['raw'];
}

export interface SubmissionMeta {
  authority: string;
  dataset?: string;
  note?: string;
}

/** Max changes per submission (enforced by the database: 1–64). */
export const MAX_CHANGES_PER_SUBMISSION = 64;

function chunk<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

/**
 * Turn the changes drafted for one council into submissions with the correct target unit:
 * council-own (Hazard, exposure) changes go to the council; Vulnerability & Coping changes go to the
 * council's source unit. When both kinds exist, two submissions are produced (council first).
 * Changes whose value equals the target's current value are dropped.
 */
export function buildSubmissions(model: RiskModel, council: Unit, changes: readonly DraftChange[], meta: SubmissionMeta): NewSubmission[] {
  const groups = new Map<string, Change[]>();
  for (const c of changes) {
    const targetId = targetUnitId(council, c.ref);
    const target = model.byId.get(targetId) ?? council;
    const previous = currentValue(target, c.ref);
    if (sameScore(previous, c.value)) continue;
    const change: Change = { ref: c.ref, value: c.value, previous };
    if (c.raw) change.raw = c.raw;
    if (!groups.has(targetId)) groups.set(targetId, []);
    groups.get(targetId)!.push(change);
  }
  const dataset = meta.dataset?.trim();
  const note = meta.note?.trim();
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === council.id ? -1 : b === council.id ? 1 : 0));
  return ordered.flatMap(([unitId, list]) => {
    const unit = model.byId.get(unitId) ?? council;
    return chunk(list, MAX_CHANGES_PER_SUBMISSION).map((part) => ({
      unitId,
      unitName: unit.name,
      region: unit.region || council.region,
      changes: part,
      authority: meta.authority,
      ...(dataset ? { dataset } : {}),
      ...(note ? { note } : {}),
    }));
  });
}
