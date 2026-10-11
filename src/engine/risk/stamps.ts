/**
 * stamps.ts - where an approved value on a unit comes from.
 *
 * Every value that is not the workbook's own is an EditStamp on the unit's `edits`. Three kinds exist and
 * the interface must not confuse them:
 *
 *   portal       a value an institution submitted through the Data portal and PMO-DMD approved (or a
 *                group recomputed from such values): an update of the Core;
 *   benchmark    a value of a dated release prepared from public datasets (the Benchmark 2026,
 *                `release` set on the stamp): part of the Core as shipped, superseded by any newer
 *                portal value;
 *   advancement  a value of the Advancement layer (authority CHC), computed beside the Core.
 *
 * "Updated" badges, update counts and "edited" marks count portal stamps only.
 */
import type { EditStamp, Unit } from './types';

/** Institution key stamped on an Advancement value (see AUTHORITIES in sources.ts). */
export const ADVANCEMENT_AUTHORITY = 'CHC';

export type StampOrigin = 'portal' | 'benchmark' | 'advancement';

export function stampOrigin(stamp: Pick<EditStamp, 'authority' | 'release'>): StampOrigin {
  if (stamp.authority === ADVANCEMENT_AUTHORITY) return 'advancement';
  return stamp.release ? 'benchmark' : 'portal';
}

export const isPortalStamp = (stamp: Pick<EditStamp, 'authority' | 'release'> | null | undefined): boolean => !!stamp && stampOrigin(stamp) === 'portal';
export const isBenchmarkStamp = (stamp: Pick<EditStamp, 'authority' | 'release'> | null | undefined): boolean => !!stamp && stampOrigin(stamp) === 'benchmark';

/** How many of a unit's values carry a stamp of the given origin. */
export function stampCount(unit: Pick<Unit, 'edits'>, origin: StampOrigin): number {
  let n = 0;
  for (const stamp of Object.values(unit.edits)) if (stamp && stampOrigin(stamp) === origin) n++;
  return n;
}

/** Values updated through the Data portal (the only count shown as "updates"). */
export const portalEditCount = (unit: Pick<Unit, 'edits'>): number => stampCount(unit, 'portal');
