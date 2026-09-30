/**
 * Every indicator with its source - a statistical table set directly on the page: hairline rows,
 * sentence-case column headers, a sticky header, numbers right-aligned, and notes set off by a rule.
 * Each source says whether it is a Tanzanian institution or a global dataset; a score recomputed from
 * figures that institutions sent lists those figures, each with the level it was recorded at (council,
 * region or the whole country), and the resolution column follows the latest one.
 *
 * Keyboard: one tab stop per row (the indicator name, whose tooltip carries the description and the
 * source method); source and resolution tooltips are hover-only because the key above explains them.
 * On phones each dimension starts folded behind a disclosure button (everything prints unfolded).
 */
import { ChevronDown, FileSpreadsheet, PencilLine } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_TEXT } from '@/components/charts/theme';
import { Note } from '@/components/layout/Page';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/primitives';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { AUTHORITIES, authorityKind, authorityLabel, sourceLabel, type SourceInfo } from '@/engine/risk/sources';
import type { EditStamp, LeafInput } from '@/engine/risk/types';
import { cn, downloadText, formatDate, formatScore, slug, toCsv } from '@/lib/utils';
import { delta, formatDelta, type AreaView, type IndicatorRow } from '../lib';
import { DIM_SHORT, NoDataPill, ResolutionChip, useMediaQuery } from './bits';
import { useDeferred } from './Deferred';

const RESOLUTIONS: ReadonlyArray<SourceInfo['resolution']> = ['council', 'district', 'region', 'national', 'overlay'];

/** Sticky offset: app header + the section nav (44 px tabs + 2 px rules). */
const STICKY_TOP = 'top-[calc(var(--header-h)+46px)]';

function ValueCell({ value }: { value: number | null }) {
  if (value == null) return <NoDataPill focusable={false} />;
  return (
    <div className="flex items-center justify-end gap-3">
      <div className="hidden h-1 w-20 bg-muted sm:block" aria-hidden>
        <div className="h-full" style={{ width: `${value * 10}%`, background: rampColor(value) }} />
      </div>
      <span className="num w-8 text-right font-semibold">{formatScore(value)}</span>
    </div>
  );
}

/** "Full authority name: method", shown on hover over the source and in the indicator's tooltip. */
function sourceTip(row: IndicatorRow): string {
  const full = (AUTHORITIES as Record<string, { full: string }>)[row.source.by]?.full;
  return full ? `${full}: ${row.source.method}` : row.source.method;
}

/** Figures from institutions behind a council's recomputed score (none on regions or the country). */
const measuredInputs = (edit: EditStamp | null, unitLevel: string): LeafInput[] =>
  unitLevel === 'region' || unitLevel === 'national' ? [] : (edit?.inputs ?? []).filter((i) => i.level !== 'baseline');

/** The level of the latest figure an institution sent, as a data resolution. */
function measuredResolution(inputs: readonly LeafInput[]): SourceInfo['resolution'] | null {
  const latest = inputs.reduce<LeafInput | null>((a, b) => (!a || (b.at ?? '') > (a.at ?? '') ? b : a), null);
  return latest && latest.level !== 'baseline' ? latest.level : null;
}

// Loaded only for councils with figures from institutions: it brings the workbook's indicator specifications.
const MeasuredInputs = React.lazy(() => import('./MeasuredInputs'));

function SourceCell({ row, unitLevel }: { row: IndicatorRow; unitLevel: string }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const measured = measuredInputs(row.edit, unitLevel).length > 0;
  return (
    <div className="min-w-0">
      <Tooltip content={sourceTip(row)}>
        <span className="block cursor-help text-xs leading-snug">
          <span className="font-medium text-foreground">{authorityLabel(row.source.by)}</span>
          {row.source.also?.length ? <span className="text-muted-foreground"> (+{row.source.also.map(authorityLabel).join(', ')})</span> : null}
          <span className="text-muted-foreground"> · {t(`common:sourceKind.${authorityKind(row.source.by)}`)}</span>
          <span className="block text-muted-foreground">{row.source.dataset}</span>
        </span>
      </Tooltip>
      {row.edit && (
        <span className="mt-1.5 flex max-w-full items-center gap-1 text-xs text-primary">
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
      {row.edit?.dataset && unitLevel !== 'region' && !measured && <span className="mt-0.5 block text-[11px] text-muted-foreground">{row.edit.dataset}</span>}
      {measured && row.edit && (
        <React.Suspense fallback={null}>
          <MeasuredInputs edit={row.edit} />
        </React.Suspense>
      )}
    </div>
  );
}

export function IndicatorTable({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rows, region } = view;
  const isNational = unit.level === 'national';
  const missing = React.useMemo(() => rows.filter((r) => r.value == null).length, [rows]);
  const narrow = useMediaQuery('(max-width: 639px)');
  const { printing } = useDeferred();
  const [open, setOpen] = React.useState<Partial<Record<DimensionKey, boolean>>>({});
  const foldable = narrow && !printing;
  const byKey = React.useMemo(() => new Map(rows.map((r) => [`${r.dim}:${r.key}`, r])), [rows]);

  const exportCsv = () => {
    const header = [
      t('csv.dimension'),
      t('csv.category'),
      t('csv.indicator'),
      unit.name,
      ...(region ? [region.name] : []),
      ...(isNational ? [] : [t('breadcrumb.country')]),
      t('csv.source'),
      t('csv.sourceKind'),
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
      t(`common:sourceKind.${authorityKind(r.source.by)}`),
      t(`resolution.${measuredResolution(measuredInputs(r.edit, unit.level)) ?? r.source.resolution}.label`),
      r.edit ? authorityLabel(String(r.edit.authority ?? '')) : '',
      r.edit ? formatDate(r.edit.at, i18n.language) : '',
    ]);
    downloadText(`inform-tz-${slug(unit.name)}-indicators.csv`, toCsv([header, ...body]), 'text/csv;charset=utf-8');
  };

  const th = 'sticky z-10 bg-background py-3 text-xs font-medium text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]';

  return (
    <div className="area-breakable">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t('table.resolutionKey')}</span>
          {RESOLUTIONS.map((r) => (
            <ResolutionChip key={r} resolution={r} />
          ))}
        </p>
        <Button variant="outline" size="sm" className="no-print self-start sm:self-auto" onClick={exportCsv}>
          <FileSpreadsheet /> {t('common:actions.downloadCsv')}
        </Button>
      </div>

      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t('table.caption', { name: unit.name })}</caption>
        <thead className="text-left">
          <tr>
            <th scope="col" className={cn(th, STICKY_TOP, 'pr-3')}>
              {t('table.indicator')}
            </th>
            <th scope="col" className={cn(th, STICKY_TOP, 'px-3 text-right')}>
              {t('common:labels.score')}
            </th>
            {!isNational && (
              <th scope="col" className={cn(th, STICKY_TOP, 'hidden px-3 text-right md:table-cell print:table-cell')}>
                {t('breadcrumb.country')}
              </th>
            )}
            <th scope="col" className={cn(th, STICKY_TOP, 'hidden px-3 lg:table-cell print:table-cell')}>
              {t('common:labels.source')}
            </th>
            <th scope="col" className={cn(th, STICKY_TOP, 'hidden pl-3 sm:table-cell')}>
              {t('table.resolution')}
            </th>
          </tr>
        </thead>
        {DIMENSIONS.map((def) => {
          const dim = unit.dims[def.key];
          const collapsed = foldable && !open[def.key];
          const count = def.categories.reduce((n, c) => n + c.indicators.length, 0);
          return (
            <tbody key={def.key} className="print:break-inside-avoid-page">
              <tr>
                <th scope="rowgroup" colSpan={5} className="border-b border-foreground/25 pt-10 pb-2.5 text-left">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold" style={{ color: DIMENSION_TEXT[def.key] }}>
                      {DIM_SHORT[def.key]}
                    </span>
                    <span className="text-base font-semibold">{t(`common:dimensions.${def.key}`)}</span>
                    <span className="ml-auto flex items-center gap-3">
                      <span className="num text-base font-semibold">{formatScore(dim.score)}</span>
                      <ClassBadge value={dim.score} scale={def.scale} size="sm" />
                    </span>
                  </div>
                  {foldable && (
                    <button
                      type="button"
                      aria-expanded={!collapsed}
                      onClick={() => setOpen((o) => ({ ...o, [def.key]: collapsed }))}
                      className="no-print mt-2 -ml-1 inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-sm font-medium text-primary"
                    >
                      <ChevronDown className={cn('size-4 transition-transform duration-150 motion-reduce:transition-none', !collapsed && 'rotate-180')} aria-hidden />
                      {collapsed ? t('table.show', { count }) : t('table.hide')}
                    </button>
                  )}
                </th>
              </tr>
              {!collapsed &&
                def.categories.map((cat) => (
                <React.Fragment key={cat.key}>
                  <tr>
                    <th scope="rowgroup" colSpan={5} className="border-b border-border pt-5 pb-2 text-left">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                        <span>{t(`common:categories.${cat.key}`)}</span>
                        <span className="num">
                          {t('table.categoryScore')} {formatScore(dim.categories[cat.key]?.score)}
                        </span>
                      </div>
                    </th>
                  </tr>
                  {cat.indicators.map((ind) => {
                    const row = byKey.get(`${def.key}:${ind.key}`)!;
                    const d = delta(row.value, row.national);
                    const resolution = measuredResolution(measuredInputs(row.edit, unit.level)) ?? row.source.resolution;
                    return (
                      <tr key={ind.key} className="border-b border-border align-top transition-colors duration-150 hover:bg-muted/40">
                        <th scope="row" className="py-3 pr-3 text-left font-normal">
                          <Tooltip
                            content={
                              <>
                                <span className="block">{t(`indicators:desc.${ind.key}`)}</span>
                                <span className="mt-1 block opacity-75">{sourceTip(row)}</span>
                              </>
                            }
                            side="right"
                          >
                            <span tabIndex={0} className={cn('text-foreground', row.value == null && 'text-muted-foreground')}>
                              {t(`indicators:${ind.key}`)}
                              {row.edit && (
                                <>
                                  <PencilLine className="ml-1.5 inline size-3 -translate-y-px text-primary" aria-hidden />
                                  <span className="sr-only"> ({t('common:labels.edited')})</span>
                                </>
                              )}
                            </span>
                          </Tooltip>
                          <div className="mt-1 lg:hidden print:hidden">
                            <SourceCell row={row} unitLevel={unit.level} />
                          </div>
                          <div className="mt-1 sm:hidden">
                            <ResolutionChip resolution={resolution} focusable={false} />
                          </div>
                        </th>
                        <td className="px-3 py-3 text-right">
                          <ValueCell value={row.value} />
                        </td>
                        {!isNational && (
                          <td className="num hidden px-3 py-3 text-right md:table-cell print:table-cell">
                            <span className="text-muted-foreground">{formatScore(row.national)}</span>
                            {d != null && d !== 0 && <span className={cn('ml-2 text-xs font-semibold', d > 0 ? 'text-danger' : 'text-success')}>{formatDelta(d)}</span>}
                          </td>
                        )}
                        <td className="hidden max-w-72 px-3 py-3 lg:table-cell print:table-cell">
                          <SourceCell row={row} unitLevel={unit.level} />
                        </td>
                        <td className="hidden py-3 pl-3 sm:table-cell">
                          <ResolutionChip resolution={resolution} focusable={false} />
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

      {/* How this unit's values were built is noted once, under the title - not repeated here. */}
      <Note className="mt-8 max-w-3xl" title={t('noData.title', { count: missing })}>
        <p>{t('noData.body')}</p>
      </Note>
    </div>
  );
}
