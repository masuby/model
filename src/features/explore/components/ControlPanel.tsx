/** The explorer's control panel: level, lens, legend & class filter, statistics, ranking preview, map options. */
import { ArrowRight, FilterX, Table2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ClassLegend, RampLegend } from '@/components/risk/ClassLegend';
import { Button } from '@/components/ui/button';
import { Segmented, Switch } from '@/components/ui/primitives';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { cn, formatDate, formatScore } from '@/lib/utils';
import { EXPLORE_LEVELS, matchesClass, sortUnits, type ExploreLevel } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { MetricDot, ScaleInfo, SectionTitle } from './bits';
import { IndicatorDetails, IndicatorPicker, LensTiles } from './LensPicker';
import { PlaceSearch } from './PlaceSearch';
import { Distribution, StatsBlock } from './StatsBlock';

const enter = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: 0.05 + i * 0.045, ease: [0.2, 0.7, 0.2, 1] as const },
});

function Section({ id, index, title, action, children }: { id: string; index: number; title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section aria-labelledby={id} {...enter(index)}>
      <SectionTitle id={id} action={action}>
        {title}
      </SectionTitle>
      {children}
    </motion.section>
  );
}

export function LevelControl() {
  const { t } = useTranslation(['explore', 'common']);
  const { model, state, actions } = useExplore();
  const counts: Record<ExploreLevel, number> = { council: model.councils.length, region: model.regions.length, source: model.sources.length };
  return (
    <div>
      <Segmented<ExploreLevel>
        size="sm"
        value={state.level}
        onValueChange={actions.setLevel}
        aria-label={t('level.label')}
        className="grid w-full grid-cols-3 [&>button]:justify-center [&>button]:py-1.5"
        options={EXPLORE_LEVELS.map((l) => ({
          value: l,
          label: (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-center whitespace-normal">{t(`level.${l}`)}</span>
              <span className="num mt-0.5 text-[10px] font-semibold text-muted-foreground">
                {counts[l]}
                {l === 'source' && ` · ${t('level.ref')}`}
              </span>
            </span>
          ),
        }))}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {state.level === 'source' && <span className="mr-1.5 rounded bg-warning/15 px-1.5 py-px text-[10px] font-bold tracking-wide text-warning uppercase">{t('level.reference')}</span>}
        {t(`level.note.${state.level}`, { count: counts[state.level] })}
      </p>
    </div>
  );
}

function LegendBlock() {
  const { t } = useTranslation(['explore', 'common']);
  const { metric, stats, state, actions } = useExplore();
  if (metric.kind === 'indicator') {
    return (
      <div>
        <RampLegend />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{t('legend.lower')}</span>
          <span>{t('legend.higher')}</span>
        </div>
        <Distribution className="mt-4" />
        <p className="mt-3 rounded-lg bg-muted/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">{t('legend.continuousNote')}</p>
      </div>
    );
  }
  return (
    <div>
      <ClassLegend scale={metric.scale ?? 'risk'} counts={stats.classCounts ?? undefined} active={state.cls} onToggle={actions.setClass} />
      <p className="mt-2 px-2 text-[11px] text-muted-foreground">{t('legend.filterHint')}</p>
    </div>
  );
}

export function RankingPreview({ limit = 8 }: { limit?: number }) {
  const { t } = useTranslation('explore');
  const { units, metric, state, ranks, selected, actions } = useExplore();
  const rows = React.useMemo(
    () =>
      sortUnits(
        units.filter((u) => matchesClass(u, metric, state.cls) && metric.get(u) != null),
        'metric',
        'desc',
        metric,
      ).slice(0, limit),
    [units, metric, state.cls, limit],
  );
  if (!rows.length) return <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">{t('table.empty')}</p>;
  return (
    <div>
      <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => actions.select(u, { focus: true })}
              aria-current={selected?.id === u.id ? 'true' : undefined}
              className={cn('flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/60', selected?.id === u.id && 'bg-primary/[0.07]')}
            >
              <span className="num w-5 shrink-0 text-xs font-bold text-muted-foreground">{ranks.get(u.id)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{u.name}</span>
                {u.level !== 'region' && <span className="block truncate text-[11px] text-muted-foreground">{u.region}</span>}
              </span>
              <span className="num flex items-center gap-1.5 font-display text-sm font-bold">
                <MetricDot metric={metric} value={metric.get(u)} />
                {formatScore(metric.get(u))}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => actions.setView('table')}>
        <Table2 /> {t('ranking.openTable')}
      </Button>
    </div>
  );
}

function BasemapToggle() {
  const { t } = useTranslation('explore');
  const { state, actions } = useExplore();
  const id = React.useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium">{t('basemap.label')}</span>
        <span className="block text-[11px] text-muted-foreground">{t('basemap.hint')}</span>
      </label>
      <Switch id={id} checked={state.basemap === 'streets'} onCheckedChange={(c) => actions.setBasemap(c ? 'streets' : 'none')} />
    </div>
  );
}

/** Panel body. `desktop` adds the title block and search; `sheet` is the mobile bottom-sheet body. */
export function ControlPanel({ variant }: { variant: 'desktop' | 'sheet' }) {
  const { t, i18n } = useTranslation(['explore', 'common']);
  const { model, metric, state, actions, metricLabel } = useExplore();
  const uid = React.useId();
  let i = 0;

  const body = (
    <div className={cn('space-y-7', variant === 'desktop' ? 'px-5 pt-5 pb-8' : 'px-4 pt-2 pb-8')}>
      <Section id={`${uid}-level`} index={i++} title={t('level.label')}>
        <LevelControl />
      </Section>

      <Section id={`${uid}-lens`} index={i++} title={t('lens.label')}>
        <LensTiles />
        <div className="mt-3">
          <IndicatorPicker />
          <IndicatorDetails />
        </div>
      </Section>

      <Section
        id={`${uid}-legend`}
        index={i++}
        title={t('legend.label')}
        action={
          <span className="flex items-center gap-1">
            {state.cls && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => actions.setClass(null)}>
                <FilterX /> {t('legend.clearFilter')}
              </Button>
            )}
            <ScaleInfo align="end" />
          </span>
        }
      >
        <LegendBlock />
      </Section>

      <Section id={`${uid}-stats`} index={i++} title={t('stats.label', { metric: metricLabel(metric) })}>
        <StatsBlock />
      </Section>

      {state.view === 'map' && (
        <Section id={`${uid}-rank`} index={i++} title={t('ranking.label', { metric: metricLabel(metric, true) })}>
          <RankingPreview limit={variant === 'desktop' ? 8 : 5} />
        </Section>
      )}

      <Section id={`${uid}-map`} index={i++} title={t('basemap.section')}>
        <BasemapToggle />
      </Section>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t('footer.asOf', { date: formatDate(`${model.asOf}-01`, i18n.language, { month: 'long', year: 'numeric' }) })} ·{' '}
        <Link to="/methodology" className="font-semibold text-primary hover:underline">
          {t('footer.methodology')}
        </Link>
      </p>
    </div>
  );

  if (variant === 'sheet') return body;

  return (
    <>
      {/* z-10 and no overflow clipping here, so the search dropdown can overlap the scroll area below. */}
      <div className="relative z-10 shrink-0 border-b border-border px-5 pt-5 pb-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute -top-20 -right-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <motion.div className="relative" {...enter(0)}>
          <div className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">{t('eyebrow')}</div>
          <h1 className="mt-1.5 text-2xl font-extrabold">{t('title')}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t('lead', { count: ALL_INDICATORS.length })}</p>
          <PlaceSearch className="mt-4" />
        </motion.div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">{body}</div>
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-5 py-2.5 text-[11px] text-muted-foreground">
        <span className="truncate">{t('footer.method')}</span>
        <Link to="/learn" className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline">
          {t('footer.learn')} <ArrowRight className="size-3" />
        </Link>
      </div>
    </>
  );
}
