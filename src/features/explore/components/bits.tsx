/** Small presentational pieces shared across the explorer (panel, overlays, sheet, table). */
import { Info } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify, THRESHOLDS, type Scale } from '@/engine/risk/classes';
import { metricColor, RAMP_STOPS, type Metric } from '@/engine/risk/metrics';
import { cn, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';

/** The four headline lenses: overall risk and the three INFORM dimensions. */
export const LENSES = [{ key: 'risk' }, { key: 'dim:hazard' }, { key: 'dim:vulnerability' }, { key: 'dim:coping' }] as const;

/** Section heading: serif `h2` in the panel, a plain sans `h3` inside the area card. */
export function SectionTitle({
  id,
  children,
  action,
  className,
  as = 'h2',
}: {
  id?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}) {
  const Heading = as;
  return (
    <div className={cn('mb-4 flex min-h-7 items-center justify-between gap-3', className)}>
      <Heading id={id} className={as === 'h2' ? 'text-[1.075rem] leading-snug font-semibold' : 'text-sm font-semibold'}>
        {children}
      </Heading>
      {action}
    </div>
  );
}

/** A dot in the metric's colour (class colour or ramp). */
export function MetricDot({ metric, value, className }: { metric: Metric; value: number | null | undefined; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', className)} style={{ background: metricColor(metric, value) }} />;
}

/** A score with its colour key: `● 4.1`. */
export function MetricValue({ metric, value, className }: { metric: Metric; value: number | null | undefined; className?: string }) {
  return (
    <span className={cn('num inline-flex items-center gap-1.5', className)}>
      <MetricDot metric={metric} value={value} />
      {formatScore(value)}
    </span>
  );
}

/**
 * Where a score sits on its scale's INFORM classes: five segments sized by the class thresholds on a
 * neutral track, the score's own class in colour, and a marker at the value.
 */
export function ClassScale({ value, scale = 'risk', className }: { value: number | null | undefined; scale?: Scale; className?: string }) {
  const bounds = [0, ...THRESHOLDS[scale], 10];
  const c = classify(value, scale);
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value * 10)) : null;
  return (
    <div className={className} aria-hidden>
      <div className="relative">
        <div className="flex h-2 gap-px">
          {CLASS_KEYS.map((k, i) => {
            const on = c?.index === i;
            return <span key={k} className={cn('h-full', !on && 'bg-muted')} style={{ width: `${(bounds[i + 1] - bounds[i]) * 10}%`, background: on ? CLASS_COLORS[k] : undefined }} />;
          })}
        </div>
        {pct != null && <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: `${pct}%` }} />}
      </div>
      <div className="num mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}

/** Compact legend (map overlay, mobile peek). Class swatches double as a class filter. */
export function MiniLegend({ className }: { className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { metric, stats, state, actions } = useExplore();
  if (metric.kind === 'indicator') {
    return (
      <div className={className}>
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${RAMP_STOPS.join(',')})` }} />
        <div className="num mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>0 · {t('legend.lower')}</span>
          <span>
            {t('legend.higher')} · 10
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={className} role="group" aria-label={t('legend.filterLabel')}>
      <div className="grid grid-cols-5 gap-px">
        {CLASS_KEYS.map((k) => {
          const active = state.cls === k;
          const count = stats.classCounts?.[k] ?? 0;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              aria-label={t('legend.classCount', { cls: t(`common:classes.${k}`), count })}
              title={`${t(`common:classes.${k}`)} · ${count}`}
              onClick={() => actions.setClass(active ? null : k)}
              className="group flex flex-col gap-1.5 pt-1"
            >
              <span
                className={cn(
                  'h-2 w-full transition-opacity duration-150',
                  state.cls && !active && 'opacity-40 group-hover:opacity-80',
                  active && 'outline-2 outline-offset-1 outline-foreground',
                )}
                style={{ background: CLASS_COLORS[k] }}
              />
              <span className={cn('num text-center text-xs', active ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>{count}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-0.5 flex justify-between text-xs text-muted-foreground">
        <span>{t('common:classes.veryLow')}</span>
        <span>{t('common:classes.veryHigh')}</span>
      </div>
    </div>
  );
}

/** Compact map key (desktop): five flat class swatches or the 0–10 ramp, end labels only. */
export function MapKey({ className }: { className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { metric } = useExplore();
  if (metric.kind === 'indicator') {
    return (
      <div className={className} aria-hidden>
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${RAMP_STOPS.join(',')})` }} />
        <div className="num mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>0 · {t('legend.lower')}</span>
          <span>
            {t('legend.higher')} · 10
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={className} aria-hidden>
      <div className="grid grid-cols-5 gap-px">
        {CLASS_KEYS.map((k) => (
          <span key={k} className="h-2" style={{ background: CLASS_COLORS[k] }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>{t('common:classes.veryLow')}</span>
        <span>{t('common:classes.veryHigh')}</span>
      </div>
    </div>
  );
}

/** Honesty note: what the colours mean and where the national figure comes from. */
export function ScaleInfo({ className, align = 'start' }: { className?: string; align?: 'start' | 'center' | 'end' }) {
  const { t } = useTranslation('explore');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('honesty.label')}
          className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', className)}
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(21rem,calc(100vw-2rem))] p-5">
        <div className="font-display text-base font-semibold">{t('honesty.title')}</div>
        <ul className="mt-3 divide-y divide-border text-sm leading-relaxed text-muted-foreground">
          <li className="py-2.5">{t('honesty.indicator')}</li>
          <li className="py-2.5">{t('honesty.dimension')}</li>
          <li className="py-2.5">{t('honesty.national')}</li>
        </ul>
        <Link to="/methodology" className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">
          {t('honesty.more')}
        </Link>
      </PopoverContent>
    </Popover>
  );
}

/** A note set off by a left rule (inherited data, shared source, edits…) - no tinted box, no icon. */
export function Notice({ tone = 'muted', children }: { tone?: 'muted' | 'warning' | 'primary'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'border-l-2 pl-3 text-sm leading-relaxed text-muted-foreground',
        tone === 'warning' ? 'border-warning' : tone === 'primary' ? 'border-primary' : 'border-border',
      )}
    >
      {children}
    </p>
  );
}
