/** Score-entry draft rows: what the person typed, evaluated against the unit's current value. */
import type { Unit } from '@/engine/risk/types';
import { parseScoreInput, sameScore, type ScoreError } from './scores';
import { currentValue, EXPOSURE_REF, type DraftChange, type EditableField } from './targets';

export interface RowDraft {
  text: string;
  noData: boolean;
}
export type DraftRows = Readonly<Partial<Record<string, RowDraft>>>;

export interface RowEval {
  field: EditableField;
  current: number | null;
  draft: RowDraft | undefined;
  /** Next value when the row holds a valid change (null = no data). */
  next: number | null | undefined;
  error: ScoreError | null;
  change: DraftChange | null;
}

export const isRowDirty = (d: RowDraft | undefined) => !!d && (d.noData || d.text.trim() !== '');
export const countDirty = (rows: DraftRows) => Object.values(rows).filter(isRowDirty).length;

export function evaluateRow(field: EditableField, unit: Unit, draft: RowDraft | undefined): RowEval {
  const current = currentValue(unit, field.ref);
  const base: RowEval = { field, current, draft, next: undefined, error: null, change: null };
  if (!draft) return base;
  if (draft.noData && field.ref !== EXPOSURE_REF) {
    return current === null ? base : { ...base, next: null, change: { ref: field.ref, value: null } };
  }
  const parsed = parseScoreInput(draft.text);
  if (parsed.kind === 'error') return { ...base, error: parsed.code };
  if (parsed.kind === 'empty' || sameScore(parsed.value, current)) return base;
  return { ...base, next: parsed.value, change: { ref: field.ref, value: parsed.value } };
}
