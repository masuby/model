import { FileSpreadsheet, Info, PencilLine } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS, DIMENSION_TEXT } from '@/components/charts/theme';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/primitives';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { AUTHORITIES, authorityLabel, sourceLabel, type SourceInfo } from '@/engine/risk/sources';
import { cn, downloadText, formatDate, formatScore, slug, toCsv } from '@/lib/utils';
import { delta, formatDelta, type AreaView, type IndicatorRow } from '../lib';
import { DIM_SHORT, NoDataPill, Reveal, ResolutionChip } from './bits';

const RESOLUTIONS: ReadonlyArray<SourceInfo['resolution']> = ['council', 'district', 'region', 'national', 'overlay'];

function ValueCell({ value }: { value: number | null }) {
  if (value == null) return <NoDataPill />;
  return (
    <div className="flex items-center justify-end gap-3">
      <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${value * 10}%`, background: rampColor(value) }} />
      </div>
      <span className="num w-8 text-right font-display text-base font-bold">{formatScore(value)}</span>
    </div>
  );
}

function SourceCell({ row, unitLevel }: { row: IndicatorRow; unitLevel: string }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const full = (AUTHORITIES as Record<string, { full: string }>)[row.source.by]?.full;
  return (
    <div className="min-w-0">
      <Tooltip content={full ? `${full} — ${row.source.method}` : row.source.method}>
        <span tabIndex={0} className="block text-xs leading-snug">
          <span className="font-semibold text-foreground">{authorityLabel(row.source.by)}</span>
          {row.source.also?.length ? <span className="text-muted-foreground"> (+{row.source.also.map(authorityLabel).join(', ')})</span> : null}
          <span className="block text-muted-foreground">{row.source.dataset}</span>
        </span>
      </Tooltip>
      {row.edit && (
        <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          <PencilLine className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {unitLevel === 'region'
              ? t('table.editedMembers')
              : t('table.edited', {
                  authority: authorityLabel(String(row.edit.authority ?? '')) || t('notices.unknownAuthority'),
                  date: formatDate(row.edit.at, i18n.language),
                })}
          </span>
        </span>
      )}
      {row.edit?.dataset && unitLevel !== 'region' && <span className="mt-0.5 block text-[11px] text-muted-foreground">{row.edit.dataset}</span>}
    </div>
  );
}

export function IndicatorTable({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rows, region } = view;
  const isNational = unit.level === 'national';
  const missing = rows.filter((r) => r.value == null).length;

  const exportCsv = () => {
    const header = [
      t('csv.dimension'),
      t('csv.category'),
      t('csv.indicator'),
      unit.name,
      ...(region ? [region.name] : []),
      ...(isNational ? [] : [t('breadcrumb.country')]),
      t('csv.source'),
      t('csv.resolution'),
      t('csv.editedBy'),
      t('csv.editedAt'),
    ];
    const body = rows.map((r) => [
      t(`common:dimensions.${r.dim}`),
      t(`common:categories.${r.category}`),
      t(`indicators:${r.key}`),
      r.value == null ? '' : formatScore(r.value),
      ...(region ? [r.region == null ? '' : formatScore(r.region)] : []),
      ...(isNational ? [] : [r.national == null ? '' : formatScore(r.national)]),
      sourceLabel(r.source),
      t(`resolution.${r.source.resolution}.label`),
      r.edit ? authorityLabel(String(r.edit.authority ?? '')) : '',
      r.edit ? formatDate(r.edit.at, i18n.language) : '',
    ]);
    downloadText(`inform-tz-${slug(unit.name)}-indicators.csv`, toCsv([header, ...body]), 'text/csv;charset=utf-8');
  };

  return (
    <Reveal>
      <Card className="area-breakable overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{t('table.resolutionKey')}</span>
            {RESOLUTIONS.map((r) => (
              <ResolutionChip key={r} resolution={r} />
            ))}
          </div>
          <Button variant="outline" size="sm" className="no-print self-start sm:self-auto" onClick={exportCsv}>
            <FileSpreadsheet /> {t('common:actions.downloadCsv')}
          </Button>
        </div>

        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t('table.caption', { name: unit.name })}</caption>
          <thead className="bg-muted/40 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-5 py-2.5 sm:px-6">
                {t('table.indicator')}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right">
                {t('common:labels.score')}
              </th>
              {!isNational && (
                <th scope="col" className="hidden px-3 py-2.5 text-right md:table-cell print:table-cell">
                  {t('breadcrumb.country')}
                </th>
              )}
              <th scope="col" className="hidden px-3 py-2.5 lg:table-cell print:table-cell">
                {t('common:labels.source')}
              </th>
              <th scope="col" className="hidden px-5 py-2.5 sm:table-cell sm:px-6">
                {t('table.resolution')}
              </th>
            </tr>
          </thead>
          {DIMENSIONS.map((def) => {
            const dim = unit.dims[def.key];
            return (
              <tbody key={def.key} className="print:break-inside-avoid-page">
                <tr className="border-t border-border bg-card">
                  <th scope="rowgroup" colSpan={5} className="px-5 pt-6 pb-2 text-left sm:px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="h-5 w-1 rounded-full" style={{ background: DIMENSION_COLORS[def.key] }} aria-hidden />
                      <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: DIMENSION_TEXT[def.key] }}>
                        {DIM_SHORT[def.key]}
                      </span>
                      <span className="font-display text-base font-bold">{t(`common:dimensions.${def.key}`)}</span>
                      <span className="num ml-auto font-display text-lg font-extrabold">{formatScore(dim.score)}</span>
                      <ClassBadge value={dim.score} scale={def.scale} size="sm" />
                    </div>
                  </th>
                </tr>
                {def.categories.map((cat) => (
                  <React.Fragment key={cat.key}>
                    <tr>
                      <th scope="rowgroup" colSpan={5} className="px-5 pt-3 pb-1 text-left sm:px-6">
                        <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-1.5 text-xs font-semibold text-muted-foreground">
                          <span>{t(`common:categories.${cat.key}`)}</span>
                          <span className="num">
                            {t('table.categoryScore')} {formatScore(dim.categories[cat.key]?.score)}
                          </span>
                        </div>
                      </th>
                    </tr>
                    {cat.indicators.map((ind) => {
                      const row = rows.find((r) => r.dim === def.key && r.key === ind.key)!;
                      const d = delta(row.value, row.national);
                      return (
                        <tr key={ind.key} className={cn('align-top transition-colors hover:bg-muted/40', row.value == null && 'bg-[repeating-linear-gradient(135deg,transparent_0_10px,var(--muted)_10px_12px)]')}>
                          <th scope="row" className="px-5 py-2.5 text-left font-normal sm:px-6">
                            <Tooltip content={t(`indicators:desc.${ind.key}`)} side="right">
                              <span tabIndex={0} className="font-medium text-foreground">
                                {t(`indicators:${ind.key}`)}
                                {row.edit && (
                                  <>
                                    <span className="ml-1.5 inline-block size-1.5 -translate-y-0.5 rounded-full bg-primary" aria-hidden />
                                    <span className="sr-only"> ({t('common:labels.edited')})</span>
                                  </>
                                )}
                              </span>
                            </Tooltip>
                            <div className="mt-1 lg:hidden print:hidden">
                              <SourceCell row={row} unitLevel={unit.level} />
                            </div>
                            <div className="mt-1.5 sm:hidden">
                              <ResolutionChip resolution={row.source.resolution} />
                            </div>
                          </th>
                          <td className="px-3 py-2.5 text-right">
                            <ValueCell value={row.value} />
                          </td>
                          {!isNational && (
                            <td className="num hidden px-3 py-2.5 text-right md:table-cell print:table-cell">
                              <span className="text-muted-foreground">{formatScore(row.national)}</span>
                              {d != null && d !== 0 && <span className={cn('ml-2 text-[11px] font-semibold', d > 0 ? 'text-danger' : 'text-success')}>{formatDelta(d)}</span>}
                            </td>
                          )}
                          <td className="hidden max-w-72 px-3 py-2.5 lg:table-cell print:table-cell">
                            <SourceCell row={row} unitLevel={unit.level} />
                          </td>
                          <td className="hidden px-5 py-2.5 sm:table-cell sm:px-6">
                            <ResolutionChip resolution={row.source.resolution} />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            );
          })}
        </table>

        <div className="mt-4 flex gap-3 border-t border-border bg-muted/30 px-5 py-4 text-xs leading-relaxed text-muted-foreground sm:px-6">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="grid gap-1">
            <p>
              <span className="font-semibold text-foreground">{t('noData.title', { count: missing })}</span> {t('noData.body')}
            </p>
            {unit.level === 'council' && <p>{t('table.councilNote')}</p>}
            {unit.level === 'region' && <p>{t('table.regionNote')}</p>}
            {isNational && <p>{t('table.nationalNote')}</p>}
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
