/** Small presentational pieces shared across the explorer (panel, overlays, sheet, table). */
import { Info, Landmark, Layers, Ruler } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify, NO_DATA_COLOR, type Scale } from '@/engine/risk/classes';
import { metricColor, RAMP_STOPS, type Metric } from '@/engine/risk/metrics';
import { cn, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';

/** The four headline lenses: overall risk and the three INFORM dimensions. */
export const LENSES = [
  { key: 'risk', color: DIMENSION_COLORS.risk },
  { key: 'dim:hazard', color: DIMENSION_COLORS.hazard },
  { key: 'dim:vulnerability', color: DIMENSION_COLORS.vulnerability },
  { key: 'dim:coping', color: DIMENSION_COLORS.coping },
] as const;

/** Dark or light text for any fill (`#rrggbb` or `rgb(r, g, b)`), by relative luminance. */
export function textOn(fill: string): string {
  const m = fill.startsWith('#') ? [1, 3, 5].map((i) => parseInt(fill.slice(i, i + 2), 16)) : (fill.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  if (m.length < 3 || m.some((x) => !Number.isFinite(x))) return '#ffffff';
  const lin = m.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return lum > 0.42 ? '#1f2937' : '#ffffff';
}

/** Uppercase eyebrow heading used by every panel section. */
export function SectionTitle({ id, children, action, className }: { id?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2.5 flex min-h-7 items-center justify-between gap-2', className)}>
      <h2 id={id} className="font-sans text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** A score in a pill filled with its INFORM class colour (or the continuous ramp for indicators). */
export function ScorePill({ value, scale, metric, className, size = 'sm' }: { value: number | null | undefined; scale?: Scale | null; metric?: Metric; className?: string; size?: 'xs' | 'sm' }) {
  const { t } = useTranslation();
  const fill = metric ? metricColor(metric, value) : scale ? (classify(value, scale)?.color ?? NO_DATA_COLOR) : NO_DATA_COLOR;
  const cls = scale ? classify(value, scale) : metric?.classOf(value);
  return (
    <span
      className={cn('num inline-flex items-center justify-center rounded-md font-bold', size === 'xs' ? 'min-w-7 px-1 py-px text-[10px]' : 'min-w-9 px-1.5 py-0.5 text-xs', className)}
      style={{ background: fill, color: textOn(fill) }}
      title={cls ? t(`classes.${cls.key}`) : undefined}
    >
      {formatScore(value)}
    </span>
  );
}

/** A dot in the metric's colour (class colour or ramp). */
export function MetricDot({ metric, value, className }: { metric: Metric; value: number | null | undefined; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full ring-2 ring-black/5', className)} style={{ background: metricColor(metric, value) }} />;
}

/** One-line bar: abbreviation, class-coloured bar, value. */
export function MiniBar({ label, title, value, scale, emphasize }: { label: string; title?: string; value: number | null | undefined; scale: Scale; emphasize?: boolean }) {
  const c = classify(value, scale);
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value * 10)) : 0;
  return (
    <div className="flex items-center gap-2" title={title ? `${title}: ${formatScore(value)}` : undefined}>
      <span className="w-8 shrink-0 truncate text-[10px] font-semibold text-muted-foreground">{label}</span>
      <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: c?.color ?? NO_DATA_COLOR }} />
      </span>
      <span className={cn('num w-7 shrink-0 text-right text-xs', emphasize ? 'font-extrabold text-foreground' : 'font-semibold text-muted-foreground')}>{formatScore(value)}</span>
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
        <div className="h-2 rounded-full ring-1 ring-black/5" style={{ background: `linear-gradient(90deg, ${RAMP_STOPS.join(',')})` }} />
        <div className="num mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
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
      <div className="flex gap-1">
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
              className={cn('flex flex-1 flex-col items-center gap-1 rounded-md pt-0.5 pb-0.5 transition-opacity hover:opacity-100', state.cls && !active && 'opacity-35')}
            >
              <span className={cn('h-2 w-full rounded-full ring-1 ring-black/10', active && 'ring-2 ring-foreground/70')} style={{ background: CLASS_COLORS[k] }} />
              <span className="num text-[10px] font-semibold text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
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
          className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', className)}
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(20rem,calc(100vw-2rem))]">
        <div className="font-display text-sm font-semibold">{t('honesty.title')}</div>
        <ul className="mt-3 grid gap-3 text-[13px] leading-relaxed text-muted-foreground">
          <li className="flex gap-2.5">
            <Ruler className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{t('honesty.indicator')}</span>
          </li>
          <li className="flex gap-2.5">
            <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{t('honesty.dimension')}</span>
          </li>
          <li className="flex gap-2.5">
            <Landmark className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{t('honesty.national')}</span>
          </li>
        </ul>
        <Link to="/methodology" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
          {t('honesty.more')}
        </Link>
      </PopoverContent>
    </Popover>
  );
}

/** Tinted inline notice (inherited data, shared source, edits…). */
export function Notice({ icon, tone = 'muted', children }: { icon: React.ReactNode; tone?: 'muted' | 'warning' | 'primary'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-xl border px-3 py-2.5 text-xs leading-relaxed [&_svg]:mt-0.5 [&_svg]:size-3.5 [&_svg]:shrink-0',
        tone === 'warning' && 'border-warning/25 bg-warning/[0.08] text-foreground [&_svg]:text-warning',
        tone === 'primary' && 'border-primary/25 bg-primary/[0.07] text-foreground [&_svg]:text-primary',
        tone === 'muted' && 'border-border bg-muted/50 text-muted-foreground',
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
