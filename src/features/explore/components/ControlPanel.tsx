/**
 * The explorer's control panel: level, lens, legend & class filter, statistics and a ranking preview.
 * One column of sections separated by hairline rules - no boxes. On desktop the level switch sits in the
 * fixed header under the search, so every level is visible on the first screen.
 */
import { ArrowRight, FilterX } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classRanges, NO_DATA_COLOR } from '@/engine/risk/classes';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { RAMP_STOPS } from '@/engine/risk/metrics';
import { cn, formatDate } from '@/lib/utils';
import { EXPLORE_LEVELS, matchesClass, sortUnits, type ExploreLevel } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { MetricValue, ScaleInfo, SectionTitle } from './bits';
import { IndicatorDetails, LensTiles } from './LensPicker';
import { PlaceSearch } from './PlaceSearch';
import { Distribution, StatsBlock } from './StatsBlock';

function Section({ id, title, action, children, pad }: { id: string; title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; pad: string }) {
  return (
    <section aria-labelledby={id} className={cn('border-t border-border py-7 first:border-t-0', pad)}>
      <SectionTitle id={id} action={action}>
        {title}
      </SectionTitle>
      {children}
    </section>
  );
}

function useLevelCounts(): Record<ExploreLevel, number> {
  const { model } = useExplore();
  return { council: model.councils.length, region: model.regions.length, source: model.sources.length };
}

/** Councils / Regions / INFORM units, with the number of areas under each label. */
export function LevelSwitch({ className }: { className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { state, actions } = useExplore();
  const counts = useLevelCounts();
  return (
    <Segmented<ExploreLevel>
      size="sm"
      value={state.level}
      onValueChange={actions.setLevel}
      aria-label={t('level.label')}
      className={cn('grid w-full grid-cols-3 [&>button]:justify-center [&>button]:py-1.5', className)}
      options={EXPLORE_LEVELS.map((l) => ({
        value: l,
        label: (
          <span className="flex flex-col items-center leading-tight">
            <span className="text-center text-[13px] whitespace-normal">{t(`level.${l}`)}</span>
            <span className="num mt-0.5 text-xs font-normal text-muted-foreground">{counts[l]}</span>
          </span>
        ),
      }))}
    />
  );
}

/** What the current level is (and, for INFORM units, that it is a reference level). */
export function LevelNote({ className }: { className?: string }) {
  const { t } = useTranslation('explore');
  const { state } = useExplore();
  const counts = useLevelCounts();
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)}>
      {state.level === 'source' && <span className="font-medium text-warning">{t('level.reference')} · </span>}
      {t(`level.note.${state.level}`, { count: counts[state.level] })}
    </p>
  );
}

function Share({ value, total, color, dim }: { value: number; total: number; color: string; dim?: boolean }) {
  return (
    <span aria-hidden className={cn('h-1.5 bg-muted transition-opacity duration-150', dim && 'opacity-40')}>
      <span className="block h-full" style={{ width: `${(value / total) * 100}%`, background: color }} />
    </span>
  );
}

/**
 * Legend that is also the distribution and the class filter: swatch, class, range, count, share.
 * With a filter on, the other rows fade only their colour marks - the text keeps full contrast.
 */
function ClassFilterLegend() {
  const { t } = useTranslation(['explore', 'common']);
  const { metric, stats, state, actions } = useExplore();
  const counts = stats.classCounts;
  const ranges = classRanges(metric.scale ?? 'risk');
  const total = Math.max(1, stats.total);
  const missing = stats.total - stats.withData;
  const row = 'grid w-full grid-cols-[0.75rem_1fr_4.25rem_2rem_3.25rem] items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm';
  return (
    <div role="group" aria-label={t('legend.filterLabel')}>
      <ul className="-mx-2 space-y-px">
        {[...CLASS_KEYS].reverse().map((k) => {
          const i = CLASS_KEYS.indexOf(k);
          const count = counts?.[k] ?? 0;
          const active = state.cls === k;
          const dim = !!state.cls && !active;
          return (
            <li key={k}>
              <button
                type="button"
                aria-pressed={active}
                aria-label={t('legend.classCount', { cls: t(`common:classes.${k}`), count })}
                onClick={() => actions.setClass(active ? null : k)}
                className={cn(row, 'transition-colors duration-150 hover:bg-muted/70', active && 'bg-muted')}
              >
                <span aria-hidden className={cn('size-3 transition-opacity duration-150', dim && 'opacity-40')} style={{ background: CLASS_COLORS[k] }} />
                <span className={cn('truncate', active ? 'font-semibold' : 'font-medium', dim && 'text-muted-foreground')}>{t(`common:classes.${k}`)}</span>
                <span className="num text-right text-xs text-muted-foreground">{ranges[i]}</span>
                <span className={cn('num text-right font-medium', dim && 'text-muted-foreground')}>{count}</span>
                <Share value={count} total={total} color={CLASS_COLORS[k]} dim={dim} />
              </button>
            </li>
          );
        })}
        {missing > 0 && (
          <li className={cn(row, 'text-muted-foreground')}>
            <span aria-hidden className="size-3" style={{ background: NO_DATA_COLOR }} />
            <span className="truncate">{t('common:classes.noData')}</span>
            <span />
            <span className="num text-right">{missing}</span>
            <Share value={missing} total={total} color={NO_DATA_COLOR} />
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t('legend.filterHint')}</p>
    </div>
  );
}

function LegendBlock() {
  const { t } = useTranslation(['explore', 'common']);
  const { metric } = useExplore();
  if (metric.kind === 'indicator') {
    return (
      <div>
        <div className="h-2.5" style={{ background: `linear-gradient(90deg, ${RAMP_STOPS.join(',')})` }} />
        <div className="num mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>0 · {t('legend.lower')}</span>
          <span>5</span>
          <span>
            {t('legend.higher')} · 10
          </span>
        </div>
        <Distribution className="mt-6" />
        <p className="mt-5 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">{t('legend.continuousNote')}</p>
      </div>
    );
  }
  return <ClassFilterLegend />;
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
  if (!rows.length) return <p className="py-2 text-sm text-muted-foreground">{t('table.empty')}</p>;
  return (
    <div>
      <ol className="space-y-px">
        {rows.map((u) => {
          const isSel = selected?.id === u.id;
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => actions.select(u, { focus: true })}
                aria-current={isSel ? 'true' : undefined}
                className={cn(
                  'group -mx-2 grid w-[calc(100%+1rem)] grid-cols-[1.5rem_1fr_auto] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/70',
                  isSel && 'bg-muted',
                )}
              >
                <span className="num text-xs text-muted-foreground">{ranks.get(u.id)}</span>
                <span className="min-w-0">
                  <span className={cn('block truncate text-sm', isSel ? 'font-semibold' : 'font-medium')}>{u.name}</span>
                  {u.level !== 'region' && <span className="block truncate text-xs text-muted-foreground">{u.region}</span>}
                </span>
                <MetricValue metric={metric} value={metric.get(u)} className={cn('text-sm', isSel ? 'font-semibold' : 'font-medium')} />
              </button>
            </li>
          );
        })}
      </ol>
      <Button variant="link" size="sm" className="mt-3 h-auto gap-1.5 px-0" onClick={() => actions.setView('table')}>
        {t('ranking.openTable')} <ArrowRight />
      </Button>
    </div>
  );
}

/** Panel body. `desktop` adds the title block, search and level switch; `sheet` is the mobile bottom-sheet body. */
export function ControlPanel({ variant }: { variant: 'desktop' | 'sheet' }) {
  const { t, i18n } = useTranslation(['explore', 'common']);
  const { model, metric, state, actions } = useExplore();
  const uid = React.useId();
  const desktop = variant === 'desktop';
  const pad = desktop ? 'px-6' : 'px-5';
  // In the sheet the peek already shows the class legend (with counts) and filters by class, so the
  // body keeps the legend section only for indicators (ramp, histogram and the continuous-scale note).
  const showLegend = desktop || metric.kind === 'indicator';

  const body = (
    <div className={desktop ? undefined : 'pb-6'}>
      {desktop ? (
        <LevelNote className={cn('pt-5 pb-6', pad)} />
      ) : (
        <Section id={`${uid}-level`} title={t('level.label')} pad={pad}>
          <LevelSwitch />
          <LevelNote className="mt-3" />
        </Section>
      )}

      {/* On mobile the sheet's peek already holds the lens tabs; the body only adds the indicator note. */}
      {desktop ? (
        <Section id={`${uid}-lens`} title={t('lens.label')} pad={pad}>
          <LensTiles labelledBy={`${uid}-lens`} />
          <IndicatorDetails />
        </Section>
      ) : (
        metric.kind === 'indicator' && (
          <div className={cn('border-t border-border pt-3 pb-7', pad)}>
            <IndicatorDetails />
          </div>
        )
      )}

      {showLegend && (
        <Section
          id={`${uid}-legend`}
          title={t('legend.label')}
          pad={pad}
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
      )}

      <Section id={`${uid}-stats`} title={t('stats.label')} pad={pad}>
        <StatsBlock />
      </Section>

      {state.view === 'map' && (
        <Section id={`${uid}-rank`} title={t('ranking.label')} pad={pad}>
          <RankingPreview limit={desktop ? 8 : 5} />
        </Section>
      )}

      <footer className={cn('space-y-1.5 border-t border-border py-6 text-xs leading-relaxed text-muted-foreground', pad)}>
        <p>
          {t('footer.asOf', { date: formatDate(`${model.asOf}-01`, i18n.language, { month: 'long', year: 'numeric' }) })} · {t('footer.method')}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/methodology" className="font-medium text-primary hover:underline">
            {t('footer.methodology')}
          </Link>
          <Link to="/learn" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            {t('footer.learn')} <ArrowRight className="size-3" aria-hidden />
          </Link>
        </p>
      </footer>
    </div>
  );

  if (!desktop) return body;

  return (
    <>
      {/* z-10 and no overflow clipping here, so the search dropdown can overlap the scroll area below. */}
      <div className="relative z-10 shrink-0 border-b border-border px-6 pt-7 pb-5">
        <h1 className="text-[1.85rem] leading-[1.1]">{t('title')}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{t('lead', { count: ALL_INDICATORS.length })}</p>
        <PlaceSearch className="mt-5" />
        <LevelSwitch className="mt-3" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">{body}</div>
    </>
  );
}
