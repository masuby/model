/**
 * Approved changes: every value currently overriding the official baseline, grouped by unit, with
 * baseline → current, provenance, and (reviewers only) revert back to the baseline.
 */
import { ArrowUpRight, BadgeCheck, Download, Loader2, Search, Undo2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, Input, Tooltip } from '@/components/ui/primitives';
import { useModel, useOverrides, useRevert } from '@/data-layer/DataProvider';
import type { EditRef, EditStamp, Unit } from '@/engine/risk/types';
import { downloadText, formatScore, toCsv } from '@/lib/utils';
import { useRefLabel } from '../components/ChangeTable';
import { Delta, EmptyState, ErrorState, LevelBadge, ListSkeleton, ScoreValue } from '../components/common';
import { useAuthorityName } from '../components/SubmitPanel';
import { baseModel, usePermissions } from '../hooks';
import { errorMessage } from '../lib/batch';
import { dateTime, matchesQuery, relativeTime } from '../lib/format';
import { scoreDelta } from '../lib/scores';
import { currentValue, isEditRef, sharingCouncils } from '../lib/targets';

interface Row {
  ref: EditRef;
  stamp: EditStamp;
  baseline: number | null;
}
interface Group {
  unitId: string;
  unit: Unit | undefined;
  rows: Row[];
  latest: string;
}

export function ApprovedChanges() {
  const { t, i18n } = useTranslation(['data', 'common', 'indicators']);
  const ov = useOverrides();
  const model = useModel();
  const { canReview: reviewer } = usePermissions();
  const revert = useRevert();
  const label = useRefLabel();
  const authName = useAuthorityName();
  const [q, setQ] = React.useState('');
  const [pending, setPending] = React.useState<{ unitId: string; unitName: string; ref: EditRef } | null>(null);

  const groups = React.useMemo<Group[]>(() => {
    const base = baseModel();
    const out: Group[] = [];
    for (const [unitId, refs] of Object.entries(ov.data ?? {})) {
      const baseUnit = base.byId.get(unitId);
      const rows: Row[] = [];
      for (const [ref, stamp] of Object.entries(refs ?? {})) {
        if (!stamp) continue;
        rows.push({ ref: ref as EditRef, stamp, baseline: baseUnit && isEditRef(ref) ? currentValue(baseUnit, ref) : null });
      }
      if (!rows.length) continue;
      rows.sort((a, b) => b.stamp.at.localeCompare(a.stamp.at));
      out.push({ unitId, unit: model.byId.get(unitId), rows, latest: rows[0].stamp.at });
    }
    return out.sort((a, b) => b.latest.localeCompare(a.latest));
  }, [ov.data, model]);

  const filtered = React.useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          rows: g.rows.filter((r) => matchesQuery(q, g.unit?.name, g.unitId, g.unit?.region, label(r.ref).name, r.stamp.authority, r.stamp.dataset, r.stamp.author)),
        }))
        .filter((g) => g.rows.length),
    [groups, q, label],
  );
  const total = groups.reduce((s, g) => s + g.rows.length, 0);

  const exportCsv = () => {
    const rows: Array<Array<string | number | null>> = [
      [t('approved.csv.unitId'), t('approved.csv.unit'), t('common:labels.region'), t('changes.indicator'), t('approved.baseline'), t('approved.current'), t('meta.authority'), t('meta.dataset'), t('approved.csv.author'), t('approved.csv.at'), t('meta.note')],
    ];
    for (const g of groups)
      for (const r of g.rows)
        rows.push([g.unitId, g.unit?.name ?? g.unitId, g.unit?.region ?? '', label(r.ref).name, r.baseline, r.stamp.value, r.stamp.authority ?? '', r.stamp.dataset ?? '', r.stamp.author ?? '', r.stamp.at, r.stamp.note ?? '']);
    downloadText(`inform-approved-changes-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };

  const doRevert = async () => {
    if (!pending) return;
    try {
      await revert.mutateAsync({ unitId: pending.unitId, ref: pending.ref });
      toast.success(t('approved.revertedToast', { indicator: label(pending.ref).name, unit: pending.unitName }));
      setPending(null);
    } catch (e) {
      toast.error(t('approved.revertError'), { description: errorMessage(e) });
    }
  };

  if (ov.isLoading) return <ListSkeleton rows={2} />;
  if (ov.isError) return <ErrorState error={ov.error} onRetry={() => void ov.refetch()} />;
  if (!groups.length) return <EmptyState icon={<BadgeCheck />} title={t('approved.emptyTitle')} description={t('approved.emptyLead')} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('approved.search')} aria-label={t('approved.search')} className="pl-9" />
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download /> {t('common:actions.downloadCsv')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('approved.count', { count: total, units: groups.length })}
      </p>

      {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t('approved.noMatch')}</p>}

      {filtered.map((g) => {
        const sharing = g.unit?.level === 'source' ? sharingCouncils(model, g.unitId) : [];
        const unitName = g.unit?.name ?? g.unitId;
        return (
          <Card key={g.unitId} className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold">{unitName}</h3>
                  <LevelBadge unit={g.unit} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {g.unit?.region ?? '—'}
                  {sharing.length > 0 && ` · ${t('approved.sharedBy', { names: sharing.map((c) => c.name).join(', ') })}`}
                </p>
              </div>
              {g.unit && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/area/${g.unitId}`}>
                    {t('context.viewProfile')} <ArrowUpRight />
                  </Link>
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">{unitName}</caption>
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th scope="col" className="px-5 py-2 text-left font-medium">
                      {t('changes.indicator')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      {t('approved.baseline')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      {t('approved.current')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium">
                      {t('approved.provenance')}
                    </th>
                    {reviewer && (
                      <th scope="col" className="px-5 py-2 text-right font-medium">
                        <span className="sr-only">{t('approved.actions')}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {g.rows.map((r) => {
                    const l = label(r.ref);
                    return (
                      <tr key={r.ref} className="align-top">
                        <td className="px-5 py-3">
                          <div className="font-medium">{l.name}</div>
                          <div className="text-xs text-muted-foreground">{l.dim}</div>
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground">
                          <ScoreValue value={r.baseline} className="font-normal" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <ScoreValue value={r.stamp.value} />
                            <Delta value={scoreDelta(r.baseline, r.stamp.value)} />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{authName(r.stamp.authority)}</div>
                          <div className="text-xs text-muted-foreground">
                            {[r.stamp.dataset, r.stamp.author].filter(Boolean).join(' · ')}
                            {' · '}
                            <time dateTime={r.stamp.at} title={dateTime(r.stamp.at, i18n.language)}>
                              {relativeTime(r.stamp.at, i18n.language)}
                            </time>
                          </div>
                          {r.stamp.note && <p className="mt-1 line-clamp-2 text-xs whitespace-pre-wrap text-muted-foreground italic">“{r.stamp.note}”</p>}
                        </td>
                        {reviewer && (
                          <td className="px-5 py-3 text-right">
                            <Tooltip content={t('approved.revertTip', { value: formatScore(r.baseline) })}>
                              <Button variant="ghost" size="sm" onClick={() => setPending({ unitId: g.unitId, unitName, ref: r.ref })} aria-label={t('approved.revertAria', { indicator: l.name, unit: unitName })}>
                                <Undo2 /> {t('approved.revert')}
                              </Button>
                            </Tooltip>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      <Dialog open={pending != null} onOpenChange={(o) => !o && !revert.isPending && setPending(null)}>
        <DialogContent
          title={t('approved.revertTitle')}
          description={pending ? t('approved.revertLead', { indicator: label(pending.ref).name, unit: pending.unitName }) : undefined}
        >
          <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPending(null)} disabled={revert.isPending}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="danger" onClick={doRevert} disabled={revert.isPending}>
              {revert.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />} {t('approved.revertConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
