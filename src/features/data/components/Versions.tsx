/**
 * Dated versions of the approved data (DE-06): the days on which values were approved, two of them
 * chosen for comparison (the earlier version against the latest by default), the national value at
 * both, every region and council whose risk changed, and those councils on the map of the current
 * version.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectItem } from '@/components/ui/primitives';
import { useModel, useModelAsOf, useOverrides, useRawValues } from '@/data-layer/DataProvider';
import { versionsOf } from '@/data-layer/versions';
import { parseMetric } from '@/engine/risk/metrics';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatDate, formatScore } from '@/lib/utils';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));
const NOW = 'now';

function changedUnits(from: RiskModel, to: RiskModel): Array<{ unit: Unit; from: number | null; to: number | null }> {
  const out: Array<{ unit: Unit; from: number | null; to: number | null }> = [];
  for (const u of [...to.regions, ...to.councils]) {
    const before = from.byId.get(u.id)?.risk ?? null;
    if (before !== u.risk) out.push({ unit: u, from: before, to: u.risk });
  }
  return out.sort((a, b) => Math.abs((b.to ?? 0) - (b.from ?? 0)) - Math.abs((a.to ?? 0) - (a.from ?? 0)));
}

export function Versions() {
  const { t, i18n } = useTranslation(['data', 'common']);
  const ov = useOverrides();
  const raw = useRawValues();
  const current = useModel();
  const versions = React.useMemo(() => versionsOf(ov.data ?? {}, raw.data ?? []), [ov.data, raw.data]);
  // Default: the day before the latest approvals (or the baseline, a day before the first) against now.
  const [from, setFrom] = React.useState<string | null>(null);
  const [to, setTo] = React.useState<string>(NOW);
  const fromDate = from ?? (versions.length > 1 ? versions[1].date : versions.length ? dayBefore(versions[0].date) : null);
  const fromModel = useModelAsOf(fromDate);
  const toModel = useModelAsOf(to === NOW ? null : to);
  const target = to === NOW ? current : toModel;
  const changes = React.useMemo(() => (fromModel && target ? changedUnits(fromModel, target) : []), [fromModel, target]);
  const metric = React.useMemo(() => parseMetric('risk'), []);
  const lang = i18n.language;

  if (!versions.length) return null;
  const label = (v: { date: string; count: number }) => t('versions.version', { date: formatDate(v.date, lang), count: v.count });
  const baselineOption = dayBefore(versions[versions.length - 1].date);
  const councilsChanged = changes.filter((c) => c.unit.level === 'council').map((c) => c.unit.id);

  return (
    <section aria-labelledby="versions-title" className="mb-10 border-b border-border pb-8">
      <h3 id="versions-title" className="font-display text-lg font-semibold">
        {t('versions.title')}
      </h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('versions.lead')}</p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <span className="text-sm font-medium">{t('versions.from')}</span>
          <Select value={fromDate ?? baselineOption} onValueChange={setFrom} aria-label={t('versions.from')} className="h-9 w-64">
            <SelectItem value={baselineOption}>{t('approved.emptyTitle')}</SelectItem>
            {versions.map((v) => (
              <SelectItem key={v.date} value={v.date}>
                {label(v)}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium">{t('versions.to')}</span>
          <Select value={to} onValueChange={setTo} aria-label={t('versions.to')} className="h-9 w-64">
            <SelectItem value={NOW}>{t('versions.now')}</SelectItem>
            {versions.map((v) => (
              <SelectItem key={v.date} value={v.date}>
                {label(v)}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <ul className="mt-3 text-xs text-muted-foreground">
        {versions.slice(0, 6).map((v) => (
          <li key={v.date}>
            {label(v)}
            {v.authors.length > 0 && ` · ${t('versions.authors', { names: v.authors.join(', ') })}`}
          </li>
        ))}
      </ul>

      {!fromModel || !target ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('versions.loading')}</p>
      ) : (
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="text-sm">
              <span className="font-medium">{t('versions.national')}</span>: <span className="num">{formatScore(fromModel.national.risk)}</span> → <span className="num font-semibold">{formatScore(target.national.risk)}</span>
            </p>
            <p className="mt-2 text-sm font-medium">{changes.length ? t('versions.changed', { count: changes.length }) : t('versions.unchanged')}</p>
            {changes.length > 0 && (
              <table className="mt-2 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
                    <th scope="col" className="py-1.5 pr-3 font-medium">
                      {t('versions.col.area')}
                    </th>
                    <th scope="col" className="num py-1.5 pr-3 font-medium">
                      {t('versions.col.from')}
                    </th>
                    <th scope="col" className="num py-1.5 pr-3 font-medium">
                      {t('versions.col.to')}
                    </th>
                    <th scope="col" className="num py-1.5 font-medium">
                      {t('versions.col.change')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {changes.slice(0, 40).map((c) => {
                    const d = (c.to ?? 0) - (c.from ?? 0);
                    return (
                      <tr key={c.unit.id} className="border-b border-border">
                        <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                          {c.unit.name} <span className="text-xs text-muted-foreground">({t(`common:levels.${c.unit.level}`)})</span>
                        </th>
                        <td className="num py-1.5 pr-3">{formatScore(c.from)}</td>
                        <td className="num py-1.5 pr-3">{formatScore(c.to)}</td>
                        <td className={cn('num py-1.5', d > 0 ? 'text-danger' : 'text-success')}>{d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <figure>
            <figcaption className="text-sm font-medium">{t('versions.map')}</figcaption>
            <div className="mt-2 aspect-[4/3] w-full max-w-md">
              <React.Suspense fallback={<div className="size-full bg-muted/50" />}>
                <StaticMap model={target} level="council" metric={metric} selectedIds={councilsChanged} emphasiseIds={councilsChanged.length ? councilsChanged : undefined} hoverCard className="size-full" aria-label={t('versions.map')} />
              </React.Suspense>
            </div>
          </figure>
        </div>
      )}
    </section>
  );
}

function dayBefore(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
