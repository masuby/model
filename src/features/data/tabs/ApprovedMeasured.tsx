/**
 * Approved measured values, grouped by indicator: every area with a value from an institution, its
 * level, dataset and date, and (reviewers) revert, after which the area falls back to its region's,
 * the national, or the INFORM baseline value.
 */
import { Loader2, Search, Undo2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, Input } from '@/components/ui/primitives';
import { useModel, useRawValues, useRevertRaw } from '@/data-layer/DataProvider';
import { isNum } from '@/engine/risk/math';
import type { RawLevel, RawValue } from '@/engine/risk/rawValues';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '../hooks';
import { errorMessage } from '../lib/batch';
import { matchesQuery } from '../lib/format';
import { specLabel } from '../lib/workflow';
import { formatRaw, InstitutionLabel, LevelTag } from '../workflow/bits';

const ORDER: Record<RawLevel, number> = { national: 0, region: 1, council: 2 };
const SHOW = 10;

export function ApprovedMeasured() {
  const { t, i18n } = useTranslation(['data', 'common']);
  const lang = i18n.language;
  const raw = useRawValues();
  const model = useModel();
  const { canReview: reviewer } = usePermissions();
  const revert = useRevertRaw();
  const [q, setQ] = React.useState('');
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = React.useState<RawValue | null>(null);

  const groups = React.useMemo(() => {
    const m = new Map<string, RawValue[]>();
    for (const v of raw.data ?? []) {
      if (!m.has(v.specId)) m.set(v.specId, []);
      m.get(v.specId)!.push(v);
    }
    return [...m.entries()]
      .map(([specId, values]) => ({
        specId,
        name: specLabel(t, specId),
        latest: values.reduce((a, v) => (v.at > a ? v.at : a), ''),
        values: values.sort((a, b) => ORDER[a.level] - ORDER[b.level] || (model.byId.get(a.unitId)?.name ?? a.unitId).localeCompare(model.byId.get(b.unitId)?.name ?? b.unitId)),
      }))
      .filter((g) => !q || matchesQuery(q, g.name, g.specId, ...g.values.map((v) => model.byId.get(v.unitId)?.name)))
      .sort((a, b) => b.latest.localeCompare(a.latest));
  }, [raw.data, model, q, t]);

  const doRevert = async () => {
    if (!pending) return;
    try {
      await revert.mutateAsync({ specId: pending.specId, unitId: pending.unitId });
      toast.success(t('workflow.approved.reverted', { area: model.byId.get(pending.unitId)?.name ?? pending.unitId }));
      setPending(null);
    } catch (e) {
      toast.error(t('workflow.approved.revertError'), { description: errorMessage(e) });
    }
  };

  if (!raw.data?.length) return null;

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('workflow.approved.search')} aria-label={t('workflow.approved.search')} className="pl-9" />
      </div>
      <div className="mt-4 space-y-8">
        {groups.map((g) => {
          const open = expanded.has(g.specId);
          const shown = open ? g.values : g.values.slice(0, SHOW);
          return (
            <section key={g.specId} aria-labelledby={`approved-${g.specId}`}>
              <h4 id={`approved-${g.specId}`} className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
                {g.name}
                <span className="font-mono text-xs font-normal text-muted-foreground">{g.specId}</span>
                <span className="font-normal text-muted-foreground">({t('workflow.approved.count', { count: g.values.length })})</span>
              </h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <caption className="sr-only">{g.name}</caption>
                  <thead>
                    <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t('workflow.sheet.col.area')}
                      </th>
                      <th scope="col" className="py-2 pr-3 text-right font-medium">
                        {t('workflow.approved.value')}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t('meta.dataset')}
                      </th>
                      <th scope="col" className="py-2 pr-3 font-medium">
                        {t('workflow.owner')}
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        <span className="sr-only">{t('workflow.approved.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((v) => (
                      <tr key={v.unitId} className="border-b border-border">
                        <th scope="row" className="py-2 pr-3 text-left font-normal">
                          {model.byId.get(v.unitId)?.name ?? v.unitId} <LevelTag level={v.level} className="ml-1" />
                        </th>
                        <td className="num py-2 pr-3 text-right font-medium">{isNum(v.value) ? formatRaw(v.value, lang) : t('workflow.sheet.noDataShort')}</td>
                        <td className="py-2 pr-3">
                          {v.dataset}
                          {v.period && <span className="text-muted-foreground"> ({v.period})</span>}
                          <span className="block text-xs text-muted-foreground">{formatDate(v.at, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </td>
                        <td className="py-2 pr-3">
                          <InstitutionLabel institutionKey={v.institution} />
                        </td>
                        <td className="py-2 text-right">
                          {reviewer && (
                            <Button variant="ghost" size="sm" onClick={() => setPending(v)} aria-label={t('workflow.approved.revertOne', { area: model.byId.get(v.unitId)?.name ?? v.unitId })}>
                              <Undo2 /> {t('workflow.approved.revert')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {g.values.length > SHOW && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (open) next.delete(g.specId);
                      else next.add(g.specId);
                      return next;
                    })
                  }
                >
                  {open ? t('common:actions.showLess') : t('workflow.approved.showAll', { count: g.values.length })}
                </Button>
              )}
            </section>
          );
        })}
      </div>

      <Dialog open={pending != null} onOpenChange={(o) => !o && !revert.isPending && setPending(null)}>
        <DialogContent
          title={t('workflow.approved.revertTitle')}
          description={pending ? t('workflow.approved.revertLead', { area: model.byId.get(pending.unitId)?.name ?? pending.unitId, name: specLabel(t, pending.specId) }) : undefined}
        >
          <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPending(null)} disabled={revert.isPending}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="danger" onClick={doRevert} disabled={revert.isPending}>
              {revert.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />} {t('workflow.approved.revert')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
