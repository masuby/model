/**
 * What every file that leaves the site carries (issue EXP-01): the release of the data, the date the data
 * is as of, when the file was generated, what it covers, the lineage of its values and the disclaimer,
 * as the first rows of a CSV or the first fields of a JSON. File names carry the release.
 */
import type { TFunction } from 'i18next';
import { stampOrigin } from '@/engine/risk/stamps';
import { DATA_AS_OF, DATA_RELEASE } from '@/engine/risk/model';
import type { EditStamp, Unit } from '@/engine/risk/types';

export interface ExportStamp {
  /** The release of the dataset (the Core's, or the Advancement release when that layer is exported). */
  release: string;
  /** The month the data is as of. */
  asOf: string;
  /** When the file was generated. */
  generated: string;
  /** What the file covers (a unit, a level and lens, a scenario). */
  scope: string;
  /** Core or Advancement. */
  layer: 'core' | 'advancement';
}

export function exportStamp(scope: string, opts: { layer?: 'core' | 'advancement'; release?: string; now?: Date } = {}): ExportStamp {
  return { release: opts.release ?? DATA_RELEASE, asOf: DATA_AS_OF, generated: (opts.now ?? new Date()).toISOString(), scope, layer: opts.layer ?? 'core' };
}

/** The lineage of one value: where it came from. */
export type Lineage = 'workbook' | 'benchmark' | 'institution' | 'advancement' | 'inherited' | 'none';
export const LINEAGES: readonly Lineage[] = ['workbook', 'benchmark', 'institution', 'advancement', 'inherited', 'none'];

/** The lineage of a unit's value for one indicator group. */
export function lineageOf(stamp: EditStamp | undefined, unit: Pick<Unit, 'inheritedFrom'>, value: number | null | undefined): Lineage {
  if (stamp) {
    const origin = stampOrigin(stamp);
    return origin === 'advancement' ? 'advancement' : origin === 'benchmark' ? 'benchmark' : 'institution';
  }
  if (value == null) return 'none';
  return unit.inheritedFrom ? 'inherited' : 'workbook';
}

/** The rows that open every CSV export: label and value pairs, then an empty row. */
export function exportPreamble(t: TFunction, stamp: ExportStamp): string[][] {
  return [
    [t('common:export.title')],
    [t('common:export.release'), stamp.release],
    [t('common:export.layer'), t(`common:export.layers.${stamp.layer}`)],
    [t('common:export.asOf'), stamp.asOf],
    [t('common:export.generated'), stamp.generated],
    [t('common:export.scope'), stamp.scope],
    [t('common:export.lineage'), LINEAGES.map((l) => `${l} = ${t(`common:export.lineages.${l}`)}`).join('; ')],
    [t('common:export.disclaimer'), t('common:footer.disclaimer')],
    [],
  ];
}

/** The same stamp as the opening fields of a JSON export. */
export function exportMeta(t: TFunction, stamp: ExportStamp) {
  return {
    generator: t('common:export.title'),
    release: stamp.release,
    layer: stamp.layer,
    dataAsOf: stamp.asOf,
    generatedAt: stamp.generated,
    scope: stamp.scope,
    lineage: Object.fromEntries(LINEAGES.map((l) => [l, t(`common:export.lineages.${l}`)])),
    disclaimer: t('common:footer.disclaimer'),
  };
}

/** A file name that carries the release: inform-tz-<release>-<base>.<ext>. */
export const exportFileName = (base: string, stamp: Pick<ExportStamp, 'release'>, ext = 'csv'): string => `inform-tz-${stamp.release}-${base}.${ext}`;
