/**
 * Ranking table: sortable, searchable, class-filtered, row click selects, CSV export of the current view.
 * Nothing floats over the rows: on desktop the area card docks as a column on the right (`aside`) and the
 * comparison docks under the table (`footer`). Columns respond to the table column's own width (container
 * queries), so they give way in order - class, region, the non-active dimensions - when the card is open.
 */
import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, GitCompareArrows, Search, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/primitives';
import { CLASS_COLORS, classify, type Scale } from '@/engine/risk/classes';
import type { DimensionKey } from '@/engine/risk/hierarchy';
import { parseMetric } from '@/engine/risk/metrics';
import type { Unit } from '@/engine/risk/types';
import { cn, downloadText, formatScore, NO_VALUE, slug, toCsv } from '@/lib/utils';
import { matchesClass, normalizeText, sortUnits, type SortKey } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { useMediaQuery } from '../lib/hooks';
import { MetricDot } from './bits';
import { StatsBlock } from './StatsBlock';
import { ViewToolbar } from './ViewToolbar';

const RISK = parseMetric('risk');
const DIMS: readonly DimensionKey[] = ['hazard', 'vulnerability', 'coping'];
const csvScore = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : '');

/** The class as plain text with its dot - no filled pill on every row. */
function ClassText({ value, scale }: { value: number | null | undefined; scale: Scale }) {
  const { t } = useTranslation('common');
  const c = classify(value, scale);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <ClassDot value={value} scale={scale} className="size-2 ring-0" />
      {c ? t(`classes.${c.key}`) : t('classes.noData')}
    </span>
  );
}

export function RankingTable({ bottomPad = 0, aside, footer }: { bottomPad?: number; aside?: React.ReactNode; footer?: React.ReactNode }) {
  const { t, i18n } = useTranslation(['explore', 'common']);
  const { units, metric, state, ranks, selected, actions, metricLabel, isDesktop } = useExplore();
  const [q, setQ] = React.useState('');
  const wide = useMediaQuery('(min-width: 1280px)');

  const collator = React.useMemo(() => new Intl.Collator(i18n.language === 'sw' ? 'sw' : 'en', { sensitivity: 'base', numeric: true }), [i18n.language]);
  const filtered = React.useMemo(() => {
    const nq = normalizeText(q);
    return units.filter((u) => matchesClass(u, metric, state.cls) && (!nq || normalizeText(`${u.name} ${u.region}`).includes(nq)));
  }, [units, metric, state.cls, q]);
  const rows = React.useMemo(() => sortUnits(filtered, state.sort, state.dir, metric, collator), [filtered, state.sort, state.dir, metric, collator]);

  const showMetricCol = metric.kind === 'indicator';
  const activeCol: SortKey = metric.kind === 'risk' ? 'risk' : metric.kind === 'dimension' ? metric.dimension! : 'metric';
  const showRegion = state.level !== 'region';
  const classMetric = metric.kind === 'indicator' ? RISK : metric;
  const classHeader = metric.kind === 'indicator' ? t('table.riskClass') : t('common:labels.class');
  const levelPlural = t(`level.${state.level}`);
  // Where the Class column shows the active lens's class, the active score drops its (duplicate) dot.
  const dotHiddenWithClass = metric.kind !== 'indicator' ? '@3xl:hidden' : undefined;

  // Keep the selected row in view when the selection changes elsewhere (map, search, compare).
  const rowRefs = React.useRef(new Map<string, HTMLTableRowElement>());
  React.useEffect(() => {
    if (selected) rowRefs.current.get(selected.id)?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  const exportCsv = () => {
    const header = [
      t('table.rank'),
      'ID',
      t('table.name'),
      t('common:labels.region'),
      t('table.level'),
      ...(showMetricCol ? [metricLabel(metric)] : []),
      t('common:informRisk'),
      t('common:dimensions.hazard'),
      t('common:dimensions.vulnerability'),
      t('common:dimensions.coping'),
      classHeader,
      t('common:labels.population'),
    ];
    const body = rows.map((u) => {
      const cls = classMetric.classOf(classMetric.get(u));
      return [
        ranks.get(u.id) ?? '',
        u.id,
        u.name,
        u.region,
        t(`common:levels.${u.level}`),
        ...(showMetricCol ? [csvScore(metric.get(u))] : []),
        csvScore(u.risk),
        csvScore(u.dims.hazard.score),
        csvScore(u.dims.vulnerability.score),
        csvScore(u.dims.coping.score),
        cls ? t(`common:classes.${cls.key}`) : '',
        u.exposure?.population ?? '',
      ];
    });
    downloadText(`inform-tz-${state.level}-${slug(metricLabel(metric))}${state.cls ? `-${state.cls}` : ''}.csv`, toCsv([header, ...body]), 'text/csv;charset=utf-8');
  };

  // A render helper (not a component) so header buttons keep focus across re-sorts.
  const th = (key: string, col: SortKey, label: React.ReactNode, { className, right }: { className?: string; right?: boolean } = {}) => {
    const active = state.sort === col;
    return (
      <th
        key={key}
        scope="col"
        aria-sort={active ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={cn('sticky top-0 z-10 border-b border-border bg-background py-3 font-normal first:pl-0', right ? 'px-2.5 text-right' : 'px-3 text-left', className)}
      >
        <button
          type="button"
          onClick={() => actions.setSort(col)}
          className={cn(
            'inline-flex items-center gap-1 rounded-sm text-xs font-medium whitespace-nowrap transition-colors hover:text-foreground',
            active || col === activeCol ? 'text-foreground' : 'text-muted-foreground',
            right && 'flex-row-reverse',
          )}
        >
          {label}
          {active ? state.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-35" />}
        </button>
      </th>
    );
  };

  // Dimension headers: the abbreviation where space is short, the short name where the column is wide.
  const dimHeader = (d: DimensionKey) => (
    <abbr title={t(`common:dimensions.${d}`)} className="no-underline">
      <span className="@4xl:hidden">{t(`abbr.${d}`)}</span>
      <span className="hidden @4xl:inline">{t(`common:dimensions.${d}Short`)}</span>
    </abbr>
  );
  // The active lens's column is always shown; the other dimensions give way on narrow tables.
  const dimVisibility = (d: DimensionKey) => (d === activeCol ? undefined : 'hidden @lg:table-cell');

  // Only the active column carries its colour key; the others are plain numbers.
  const scoreCell = (col: SortKey, v: number | null | undefined, dot: React.ReactNode, className?: string) => (
    <td className={cn('px-2.5 py-3 text-right', className)}>
      <span className={cn('num inline-flex items-center justify-end gap-2', col === activeCol ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
        {col === activeCol && dot}
        {formatScore(v)}
      </span>
    </td>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background" role="region" aria-label={t('table.label')}>
      {/* Header - spans the full stage, above the table and the docked card */}
      <div className="relative shrink-0 border-b border-border px-4 pt-4 pb-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{t('table.eyebrow', { level: levelPlural })}</p>
            <h2 className="mt-0.5 truncate text-xl leading-tight sm:text-[1.65rem]">{t('table.title', { metric: metricLabel(metric) })}</h2>
          </div>
          <ViewToolbar compact={!wide} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('table.search')}
              aria-label={t('table.search')}
              className="h-9 pl-9 shadow-none [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          {state.cls && (
            <button
              type="button"
              onClick={() => actions.setClass(null)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              aria-label={t('table.clearClass', { cls: t(`common:classes.${state.cls}`) })}
            >
              <span aria-hidden className="size-2.5" style={{ background: CLASS_COLORS[state.cls] }} />
              {t(`common:classes.${state.cls}`)}
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
          <span className="num text-sm text-muted-foreground" aria-live="polite">
            {t('table.showing', { shown: rows.length, total: units.length })}
          </span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv} disabled={!rows.length}>
            <FileSpreadsheet /> <span className="hidden sm:inline">{t('table.export')}</span>
            <span className="sr-only sm:hidden">{t('table.export')}</span>
          </Button>
        </div>
        {isDesktop && <StatsBlock variant="strip" units={rows} className="mt-4" />}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Table column: the rows scroll; the comparison (if any) is docked under them. */}
        <div className="@container flex min-w-0 flex-1 flex-col">
          <div
            className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 sm:px-6 lg:px-8"
            style={{ paddingBottom: bottomPad || undefined, scrollPaddingTop: 44, scrollPaddingBottom: bottomPad + 8 }}
          >
            <table className="w-full border-separate border-spacing-0 text-sm">
              <caption className="sr-only">{t('table.caption', { metric: metricLabel(metric), level: levelPlural })}</caption>
              <thead>
                <tr>
                  {th('rank', 'metric', <><span aria-hidden>{t('table.rankShort')}</span><span className="sr-only">{t('table.rank')}</span></>, { className: 'w-12' })}
                  {th('name', 'name', t('table.name'), { className: '@md:min-w-44' })}
                  {showRegion && th('region', 'region', t('common:labels.region'), { className: 'hidden @2xl:table-cell' })}
                  {showMetricCol && th('metric', 'metric', <span className="inline-block max-w-36 truncate align-bottom">{metricLabel(metric)}</span>, { right: true })}
                  {th('risk', 'risk', <abbr title={t('common:informRisk')} className="no-underline">{t('abbr.risk')}</abbr>, { right: true })}
                  {DIMS.map((d) => th(d, d, dimHeader(d), { right: true, className: dimVisibility(d) }))}
                  <th scope="col" className="sticky top-0 z-10 hidden border-b border-border bg-background py-3 pr-0 pl-3 text-left text-xs font-medium whitespace-nowrap text-muted-foreground @3xl:table-cell">
                    {classHeader}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u: Unit) => {
                  const isSel = selected?.id === u.id;
                  const pinned = state.cmp.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      ref={(el) => {
                        if (el) rowRefs.current.set(u.id, el);
                        else rowRefs.current.delete(u.id);
                      }}
                      onClick={() => actions.select(u, { focus: true })}
                      data-selected={isSel || undefined}
                      className={cn('group cursor-pointer transition-colors duration-150 [&>td]:border-b [&>td]:border-border hover:bg-muted/50', isSel && 'bg-accent hover:bg-accent')}
                    >
                      <td className="num py-3 pr-3 text-muted-foreground">{ranks.get(u.id) ?? NO_VALUE}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.select(u, { focus: true });
                            }}
                            aria-label={t('table.selectRow', { name: u.name })}
                            className={cn('min-w-0 rounded-sm text-left font-medium transition-colors group-hover:text-primary', isSel && 'font-semibold')}
                          >
                            {u.name}
                          </button>
                          {pinned && <GitCompareArrows className="size-3.5 shrink-0 text-primary" aria-label={t('card.comparing')} />}
                        </div>
                        {showRegion && <div className="text-xs text-muted-foreground @2xl:hidden">{u.region}</div>}
                      </td>
                      {showRegion && <td className="hidden px-3 py-3 whitespace-nowrap text-muted-foreground @2xl:table-cell">{u.region}</td>}
                      {showMetricCol && scoreCell('metric', metric.get(u), <MetricDot metric={metric} value={metric.get(u)} />)}
                      {scoreCell('risk', u.risk, <ClassDot value={u.risk} className={dotHiddenWithClass} />)}
                      {DIMS.map((d) => (
                        <React.Fragment key={d}>
                          {scoreCell(d, u.dims[d].score, <ClassDot value={u.dims[d].score} scale={d} className={dotHiddenWithClass} />, dimVisibility(d))}
                        </React.Fragment>
                      ))}
                      <td className="hidden py-3 pr-0 pl-3 @3xl:table-cell">
                        <ClassText value={classMetric.get(u)} scale={classMetric.scale ?? 'risk'} />
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      {t('table.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {footer}
        </div>
        {aside}
      </div>
    </div>
  );
}
