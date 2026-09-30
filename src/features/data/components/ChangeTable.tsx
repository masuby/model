/** Diff table for a list of indicator changes: previous → proposed, with raw provenance and staleness. */
import { AlertTriangle, FlaskConical } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Change } from '@/data-layer/types';
import type { EditRef } from '@/engine/risk/types';
import { cn, formatScore, NO_VALUE } from '@/lib/utils';
import { decodeRaw, unitKey } from '../lib/raw';
import { sameScore, scoreDelta } from '../lib/scores';
import { fieldFor, isEditRef } from '../lib/targets';
import { Delta, ScoreValue } from './common';

/** Translated indicator name + dimension for an edit ref (unknown refs fall back to the raw ref). */
export function useRefLabel() {
  const { t } = useTranslation(['data', 'common', 'indicators']);
  return React.useCallback(
    (ref: string) => {
      const f = fieldFor(ref);
      if (!f) return { name: ref, dim: '' };
      return { name: t(`indicators:${f.key}`), dim: t(`common:dimensions.${f.dim}Short`) };
    },
    [t],
  );
}

/** "Measured: 18 % · 0.45 index" for a change entered as raw values. */
export function useRawText() {
  const { t } = useTranslation('data');
  return React.useCallback(
    (raw: Change['raw']) => {
      const parts = decodeRaw(raw).map((d) => [d.value, d.unit ? t(`units.${unitKey(d.unit)}`, { defaultValue: d.unit }) : ''].filter(Boolean).join(' '));
      return parts.length ? t('changes.measured', { values: parts.join(' · ') }) : '';
    },
    [t],
  );
}

export function ChangeTable({
  changes,
  currentOf,
  caption,
  className,
}: {
  changes: readonly Change[];
  /** Current value of a ref on the target unit - when given, changes made stale by later edits are flagged. */
  currentOf?: (ref: EditRef) => number | null;
  caption?: string;
  className?: string;
}) {
  const { t } = useTranslation('data');
  const label = useRefLabel();
  const rawText = useRawText();
  return (
    // `relative` keeps the sr-only caption (absolutely positioned) inside the scroll box on phones.
    <div className={cn('relative overflow-x-auto border-y border-border', className)}>
      <table className="w-full text-sm sm:min-w-[420px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-2 text-left font-medium sm:pr-3">
              {t('changes.indicator')}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">
              {t('changes.previous')}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium sm:px-3">
              {t('changes.proposed')}
            </th>
            <th scope="col" className="py-2 pl-2 text-right font-medium sm:pl-3">
              {t('changes.delta')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {changes.map((c) => {
            const l = label(c.ref);
            const raw = c.raw ? rawText(c.raw) : '';
            const current = currentOf && isEditRef(c.ref) ? currentOf(c.ref) : undefined;
            const stale = current !== undefined && c.previous !== undefined && !sameScore(current, c.previous);
            return (
              <tr key={c.ref} className="align-top">
                <td className="py-2.5 pr-2 sm:pr-3">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.dim}</div>
                  {raw && (
                    <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                      <FlaskConical className="mt-0.5 size-3 shrink-0" aria-hidden /> {raw}
                    </div>
                  )}
                  {stale && (
                    <div className="mt-1 flex items-start gap-1 text-xs font-medium text-warning">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden /> {t('changes.stale', { value: formatScore(current) })}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right text-muted-foreground sm:px-3">{c.previous === undefined ? NO_VALUE : <ScoreValue value={c.previous} />}</td>
                <td className="px-2 py-2.5 text-right sm:px-3">
                  <ScoreValue value={c.value} className="text-foreground" />
                </td>
                <td className="py-2.5 pl-2 text-right sm:pl-3">
                  <Delta value={c.previous === undefined ? null : scoreDelta(c.previous, c.value)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
