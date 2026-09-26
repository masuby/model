/** Ranking table: sortable, searchable, class-filtered, row click selects, CSV export of the current view. */
import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, GitCompareArrows, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge, ClassDot } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/primitives';
import { CLASS_COLORS } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import type { Unit } from '@/engine/risk/types';
import { cn, downloadText, formatScore, slug, toCsv } from '@/lib/utils';
import { matchesClass, normalizeText, sortUnits, type SortKey } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { MetricDot } from './bits';
import { StatsBlock } from './StatsBlock';
import { ViewToolbar } from './ViewToolbar';

const RISK = parseMetric('risk');
const csvScore = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : '');

export function RankingTable({ overlays, bottomPad = 0, rightPad = 0 }: { overlays?: React.ReactNode; bottomPad?: number; rightPad?: number }) {
  const { t, i18n } = useTranslation(['explore', 'common']);
  const { units, metric, state, ranks, selected, actions, metricLabel, isDesktop } = useExplore();
  const [q, setQ] = React.useState('');

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
        className={cn('sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur', right ? 'text-right' : 'text-left', col === activeCol && 'bg-primary/[0.06]', className)}
      >
        <button
          type="button"
          onClick={() => actions.setSort(col)}
          className={cn(
            'inline-flex items-center gap-1 rounded-md text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase transition-colors hover:text-foreground',
            active ? 'text-foreground' : 'text-muted-foreground',
            right && 'flex-row-reverse',
          )}
        >
          {label}
          {active ? state.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
        </button>
      </th>
    );
  };

  const scoreCell = (col: SortKey, v: number | null | undefined, dot: React.ReactNode, className?: string) => (
    <td className={cn('px-3 py-2.5 text-right', col === activeCol && 'bg-primary/[0.04]', className)}>
      <span className={cn('num inline-flex items-center justify-end gap-1.5', col === activeCol ? 'font-display font-bold' : 'text-muted-foreground')}>
        {dot}
        {formatScore(v)}
      </span>
    </td>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex flex-col bg-background"
      role="region"
      aria-label={t('table.label')}
    >
      {/* Header */}
      <div className="relative shrink-0 border-b border-border bg-card/60 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">{t('table.eyebrow', { level: levelPlural })}</div>
            <h2 className="truncate text-lg font-bold sm:text-xl">{t('table.title', { metric: metricLabel(metric) })}</h2>
          </div>
          <ViewToolbar compact={!isDesktop} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('table.search')}
              aria-label={t('table.search')}
              className="h-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          {state.cls && (
            <button
              type="button"
              onClick={() => actions.setClass(null)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-muted"
              aria-label={t('table.clearClass', { cls: t(`common:classes.${state.cls}`) })}
            >
              <span className="size-2.5 rounded-full" style={{ background: CLASS_COLORS[state.cls] }} />
              {t(`common:classes.${state.cls}`)}
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
          <span className="num text-xs text-muted-foreground" aria-live="polite">
            {t('table.showing', { shown: rows.length, total: units.length })}
          </span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv} disabled={!rows.length}>
            <FileSpreadsheet /> <span className="hidden sm:inline">{t('table.export')}</span>
            <span className="sr-only sm:hidden">{t('table.export')}</span>
          </Button>
        </div>
        {isDesktop && <StatsBlock variant="strip" className="mt-3" />}
      </div>

      {/* Body */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-auto overscroll-contain transition-[padding] duration-300" style={{ paddingBottom: bottomPad, paddingRight: rightPad, scrollPaddingTop: 44, scrollPaddingBottom: bottomPad + 8 }}>
          <table className="w-full border-separate border-spacing-0 text-sm">
            <caption className="sr-only">{t('table.caption', { metric: metricLabel(metric), level: levelPlural })}</caption>
            <thead>
              <tr>
                {th('rank', 'metric', <><span aria-hidden>{t('table.rankShort')}</span><span className="sr-only">{t('table.rank')}</span></>, { className: 'w-12' })}
                {th('name', 'name', t('table.name'))}
                {showRegion && th('region', 'region', t('common:labels.region'), { className: 'hidden md:table-cell' })}
                {showMetricCol && th('metric', 'metric', <span className="inline-block max-w-36 truncate align-bottom">{metricLabel(metric)}</span>, { right: true })}
                {th('risk', 'risk', <abbr title={t('common:informRisk')} className="no-underline">{t('abbr.risk')}</abbr>, { right: true })}
                {th('hazard', 'hazard', <abbr title={t('common:dimensions.hazard')} className="no-underline">{t('abbr.hazard')}</abbr>, { right: true, className: 'hidden sm:table-cell' })}
                {th('vulnerability', 'vulnerability', <abbr title={t('common:dimensions.vulnerability')} className="no-underline">{t('abbr.vulnerability')}</abbr>, { right: true, className: 'hidden sm:table-cell' })}
                {th('coping', 'coping', <abbr title={t('common:dimensions.coping')} className="no-underline">{t('abbr.coping')}</abbr>, { right: true, className: 'hidden sm:table-cell' })}
                <th scope="col" className="sticky top-0 z-10 hidden border-b border-border bg-card/95 px-3 py-2.5 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase backdrop-blur lg:table-cell">
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
                    className={cn('group cursor-pointer transition-colors [&>td]:border-b [&>td]:border-border/60 hover:bg-muted/50', isSel && 'bg-primary/[0.08] hover:bg-primary/10')}
                  >
                    <td className={cn('num px-3 py-2.5 text-xs font-bold text-muted-foreground', isSel && 'shadow-[inset_3px_0_0_var(--primary)]')}>{ranks.get(u.id) ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.select(u, { focus: true });
                          }}
                          aria-label={t('table.selectRow', { name: u.name })}
                          className="min-w-0 rounded text-left font-semibold transition-colors group-hover:text-primary"
                        >
                          {u.name}
                        </button>
                        {pinned && <GitCompareArrows className="size-3.5 shrink-0 text-primary" aria-label={t('card.comparing')} />}
                      </div>
                      {showRegion && <div className="text-[11px] text-muted-foreground md:hidden">{u.region}</div>}
                    </td>
                    {showRegion && <td className="hidden px-3 py-2.5 whitespace-nowrap text-muted-foreground md:table-cell">{u.region}</td>}
                    {showMetricCol && scoreCell('metric', metric.get(u), <MetricDot metric={metric} value={metric.get(u)} />)}
                    {scoreCell('risk', u.risk, <ClassDot value={u.risk} />)}
                    {scoreCell('hazard', u.dims.hazard.score, <ClassDot value={u.dims.hazard.score} scale="hazard" />, 'hidden sm:table-cell')}
                    {scoreCell('vulnerability', u.dims.vulnerability.score, <ClassDot value={u.dims.vulnerability.score} scale="vulnerability" />, 'hidden sm:table-cell')}
                    {scoreCell('coping', u.dims.coping.score, <ClassDot value={u.dims.coping.score} scale="coping" />, 'hidden sm:table-cell')}
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <ClassBadge value={classMetric.get(u)} scale={classMetric.scale ?? 'risk'} size="sm" />
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
        {overlays}
      </div>
    </motion.div>
  );
}
