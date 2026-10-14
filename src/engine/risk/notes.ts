/**
 * notes.ts - data notes: workbook values that the indicator integrity recheck found to contradict
 * documented events, other indicators of the same workbook or the indicator's own definition
 * (src/data/inform-data-notes.json; the register is docs/assessment/INFORM_TZ_Indicator_Integrity_*.md).
 *
 * A note never changes a value. The Core keeps the workbook's figure; the note travels with it to every
 * place the value is shown (profile table, drivers, explorer ranking, key findings), and the query is
 * raised with INFORM (JRC) and SADC. A note matches a unit by its region, by the workbook unit it carries
 * (name or code) or by the value itself, so a council carved from or sharing a workbook unit carries the
 * note of that unit.
 */
import notesJson from '@/data/inform-data-notes.json';
import type { DimensionKey } from './hierarchy';
import { isNum } from './math';
import type { RiskModel, Unit } from './types';

/** `decision`: the programme withholds a group it judges unfit to communicate (no data error is claimed). */
export type NoteStatus = 'queried' | 'artefact' | 'decision' | 'explained';
export type NoteLayer = 'core' | 'advancement';

export interface DataNoteWhere {
  /** Every unit. */
  all?: boolean;
  /** Region names (any spelling: matched like placeKey). */
  regions?: string[];
  /** Workbook unit names or codes; a council matches through the unit it carries. */
  units?: string[];
  /** The unit's own value on the note's indicator group. */
  valueAtLeast?: number;
  valueAtMost?: number;
}

export interface DataNote {
  id: string;
  layer: NoteLayer;
  /** `${dimension}:${indicatorGroup}` of the engine's hierarchy. */
  ref: string;
  /** The workbook indicator the note is about. */
  indicator: string;
  /** Every workbook indicator the note withholds when it quarantines (default: `indicator` alone). */
  indicators?: string[];
  status: NoteStatus;
  /** Withheld from the live model: the group is treated as missing for the units the note applies to (INFORM's rule for data that fails validation). */
  quarantine: boolean;
  where: DataNoteWhere;
  en: string;
  sw: string;
  evidence: string;
  raisedWith: string;
  issue: string;
}

const FILE = notesJson as { release: string; date: string; notes: DataNote[] };
export const DATA_NOTES: readonly DataNote[] = FILE.notes;
/** The notes whose values the live model withholds (see model.ts applyQuarantine). */
export const QUARANTINE_NOTES: readonly DataNote[] = FILE.notes.filter((n) => n.quarantine);
export const DATA_NOTES_RELEASE = FILE.release;
export const DATA_NOTES_DATE = FILE.date;

/** The order a page lists statuses in: a query before an explanation. */
export const NOTE_STATUS_ORDER: readonly NoteStatus[] = ['queried', 'artefact', 'decision', 'explained'];

/** The workbook indicators a note covers (a programme decision can withhold a whole group). */
export const noteIndicators = (note: DataNote): readonly string[] => note.indicators ?? [note.indicator];

/** A note by its id. */
export const noteById = (id: string | null | undefined): DataNote | undefined => (id ? DATA_NOTES.find((n) => n.id === id) : undefined);

/** Whether the note records a programme decision rather than a finding of the integrity recheck. */
export const isDecision = (note: DataNote | undefined): boolean => note?.status === 'decision';

const key = (s: string | null | undefined): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** The unit's value on an indicator group, whichever category holds it. */
function valueOf(unit: Unit, dim: DimensionKey, indicator: string): number | null {
  for (const cat of Object.values(unit.dims[dim].categories)) {
    if (cat && indicator in cat.indicators) {
      const v = cat.indicators[indicator];
      return isNum(v) ? v : null;
    }
  }
  return null;
}

/** Whether a note applies to a unit (the nation never carries one: it is an aggregate). */
export function noteApplies(note: DataNote, unit: Unit, value: number | null): boolean {
  if (unit.level === 'national') return false;
  const w = note.where;
  if (w.regions) {
    const region = key(unit.level === 'region' ? unit.name : unit.region);
    if (!w.regions.some((r) => key(r) === region)) return false;
  }
  if (w.units) {
    if (unit.level === 'region') return false;
    const names = new Set([unit.name, unit.sourceName, unit.id, unit.sourceId].filter(Boolean).map(key));
    if (!w.units.some((u) => names.has(key(u)))) return false;
  }
  if (w.valueAtLeast != null && !(isNum(value) && value >= w.valueAtLeast)) return false;
  if (w.valueAtMost != null && !(isNum(value) && value <= w.valueAtMost)) return false;
  return true;
}

/**
 * The notes that apply to a unit's value on an indicator group, queries first. A note that withholds the
 * workbook value is not among them once the group carries a value: the hold was lifted by an approved value
 * (the Benchmark 2026 or an institution's), and the figure shown is that value, not the one the note is about.
 * Where the group has no value the hold stands and the note is shown.
 */
export function dataNotesFor(unit: Unit, dim: DimensionKey, indicator: string, layer: NoteLayer = 'core'): DataNote[] {
  const ref = `${dim}:${indicator}`;
  const value = valueOf(unit, dim, indicator);
  const lifted = isNum(value);
  return DATA_NOTES.filter((n) => n.layer === layer && n.ref === ref && !(n.quarantine && lifted) && noteApplies(n, unit, value)).sort(
    (a, b) => NOTE_STATUS_ORDER.indexOf(a.status) - NOTE_STATUS_ORDER.indexOf(b.status),
  );
}

/** Every note on any group of a unit, with the group it concerns. */
export function unitDataNotes(unit: Unit, layer: NoteLayer = 'core'): Array<{ dim: DimensionKey; indicator: string; note: DataNote }> {
  const out: Array<{ dim: DimensionKey; indicator: string; note: DataNote }> = [];
  for (const n of DATA_NOTES) {
    if (n.layer !== layer) continue;
    const [dim, indicator] = n.ref.split(':') as [DimensionKey, string];
    if (!unit.dims[dim]) continue;
    if (noteApplies(n, unit, valueOf(unit, dim, indicator))) out.push({ dim, indicator, note: n });
  }
  return out;
}

/** The note's text in the page's language. */
export const noteText = (note: DataNote, language: string | undefined): string => (language?.toLowerCase().startsWith('sw') ? note.sw : note.en);

/** The strongest status among notes (a query outranks an explanation). */
export function worstStatus(notes: readonly DataNote[]): NoteStatus | null {
  let worst: NoteStatus | null = null;
  for (const n of notes) if (worst == null || NOTE_STATUS_ORDER.indexOf(n.status) < NOTE_STATUS_ORDER.indexOf(worst)) worst = n.status;
  return worst;
}

/**
 * How many notes, groups, councils and withheld values the register touches: for the Methodology page.
 * `withheld` counts the hold as it stands live: a council value that is quarantined and not replaced by
 * an approved value (the Benchmark 2026 or an institution's); `replaced` counts the quarantined council
 * values an approved value lifted; `withheldWorkbook` counts the workbook values quarantined before any
 * replacement (the queries raised with INFORM). Programme decisions are counted apart (`decisions`,
 * `decided`): they withhold a group by choice, not because a value failed validation.
 */
export function dataNotesSummary(model: RiskModel, layer: NoteLayer = 'core'): { notes: number; queried: number; groups: number; councils: number; withheld: number; replaced: number; withheldWorkbook: number; withheldUnits: number; withheldCouncils: number; decisions: number; decided: number } {
  const all = DATA_NOTES.filter((n) => n.layer === layer);
  const notes = all.filter((n) => !isDecision(n));
  const councils = model.councils.filter((c) => unitDataNotes(c, layer).some((x) => x.note.status !== 'explained' && !isDecision(x.note))).length;
  const decidedBy = (id: string | undefined) => isDecision(noteById(id));
  let withheld = 0;
  let replaced = 0;
  let decided = 0;
  const withheldCouncilIds = new Set<string>();
  const withheldUnitIds = new Set<string>();
  for (const c of model.councils) {
    for (const [ref, id] of Object.entries(c.quarantined ?? {})) {
      if (decidedBy(id)) {
        if (!c.edits[ref as keyof typeof c.edits]) decided++;
        continue;
      }
      if (c.edits[ref as keyof typeof c.edits]) replaced++;
      else {
        withheld++;
        withheldCouncilIds.add(c.id);
        if (c.sourceId) withheldUnitIds.add(c.sourceId);
      }
    }
  }
  return {
    notes: notes.length,
    queried: notes.filter((n) => n.status === 'queried').length,
    groups: new Set(notes.map((n) => n.ref)).size,
    councils,
    withheld,
    replaced,
    withheldWorkbook: model.sources.reduce((n, u) => n + Object.values(u.quarantined ?? {}).filter((id) => !decidedBy(id)).length, 0),
    withheldUnits: withheldUnitIds.size,
    withheldCouncils: withheldCouncilIds.size,
    decisions: all.length - notes.length,
    decided,
  };
}

/** Whether a unit's value on a group is withheld (quarantined and not replaced by an approved edit). */
export const isWithheld = (unit: Unit, dim: DimensionKey, indicator: string): boolean => {
  const ref = `${dim}:${indicator}` as keyof NonNullable<Unit['quarantined']>;
  return !!unit.quarantined?.[ref] && !unit.edits[ref];
};
