/**
 * Dated versions of the approved data (DE-06). A version is the state of the approved values at the end
 * of a day on which something was approved: every stamp carries the moment it was applied, so the model
 * of any date is rebuilt by keeping the stamps up to that date. The list of versions is the list of
 * days with approvals, newest first.
 */
import type { RawValue } from '@/engine/risk/rawValues';
import type { EditStamp, Overrides } from '@/engine/risk/types';

export interface Version {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Approved values applied on that day. */
  count: number;
  /** Who applied them (authors as recorded on the stamps). */
  authors: string[];
}

const day = (iso: string) => iso.slice(0, 10);

/** The days on which approved values were applied, newest first, with their counts and authors. */
export function versionsOf(overrides: Overrides, raw: readonly RawValue[]): Version[] {
  const byDay = new Map<string, { count: number; authors: Set<string> }>();
  const add = (at: string | undefined, author: string | null | undefined) => {
    if (!at) return;
    const d = day(at);
    const v = byDay.get(d) ?? { count: 0, authors: new Set<string>() };
    v.count++;
    if (author) v.authors.add(author.split(' · ')[0]);
    byDay.set(d, v);
  };
  for (const refs of Object.values(overrides)) for (const stamp of Object.values(refs ?? {})) if (stamp) add(stamp.at, stamp.author);
  for (const r of raw) add(r.at, r.author);
  return [...byDay.entries()]
    .map(([date, v]) => ({ date, count: v.count, authors: [...v.authors].sort() }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** True when the stamp was applied on or before the end of `date` (yyyy-mm-dd). */
export const appliedBy = (at: string | undefined, date: string): boolean => !!at && day(at) <= date;

/** The approved direct values as they stood at the end of `date`. */
export function overridesAsOf(overrides: Overrides, date: string): Overrides {
  const out: Overrides = {};
  for (const [unitId, refs] of Object.entries(overrides)) {
    const kept: Partial<Record<string, EditStamp>> = {};
    for (const [ref, stamp] of Object.entries(refs ?? {})) if (stamp && appliedBy(stamp.at, date)) kept[ref] = stamp;
    if (Object.keys(kept).length) out[unitId] = kept as Overrides[string];
  }
  return out;
}

/** The approved measured values as they stood at the end of `date`. */
export const rawAsOf = (raw: readonly RawValue[], date: string): RawValue[] => raw.filter((r) => appliedBy(r.at, date));
