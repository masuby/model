/**
 * Small presentational pieces shared by the Area Profile sections (docs/DESIGN_LANGUAGE.md): hairline
 * rules, plain-case labels, colour only where it carries data.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Kicker } from '@/components/layout/Page';
import { Tooltip } from '@/components/ui/primitives';
import type { SourceInfo } from '@/engine/risk/sources';
import { cn, formatScore } from '@/lib/utils';
import { delta, formatDelta } from '../lib';

/**
 * Series colours used consistently across the page. Unit and region are categorical (validated for
 * CVD separation and ≥3:1 contrast on the light and dark surfaces); national is a deliberately
 * neutral *reference* mark, always drawn dashed / as a tick and labelled in text.
 */
export const unitColor = (dark: boolean) => (dark ? '#3b82f6' : '#1d6deb');
export const REGION_COLOR = '#d97706';
export const nationalColor = (dark: boolean) => (dark ? '#cbd5e1' : '#475569');

/** A numbered report section: hairline rule, plain label ("3 · Comparisons"), serif title, lead. */
export function AreaSection({
  id,
  index,
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  id: string;
  index: number;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-28 border-t border-border py-12 sm:py-16 print:py-6', className)}>
      <div className="area-heading mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between print:mb-6">
        <div className="max-w-3xl">
          <Kicker className="mb-3">
            <span className="num">{index}</span>
            <span aria-hidden> · </span>
            <span className="sr-only">. </span>
            {eyebrow}
          </Kicker>
          <h2 id={`${id}-title`} className="text-[1.7rem] leading-[1.15] text-balance sm:text-[2.1rem]">
            {title}
          </h2>
          {description && <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="no-print flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** Sub-heading inside a section (sans, with an optional one-line lead). */
export function SubHeading({ title, lead, className, id }: { title: React.ReactNode; lead?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={className}>
      <h3 id={id} className="text-base font-semibold leading-snug">
        {title}
      </h3>
      {lead && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}

/** "↗ +0.8 vs Dodoma" - text first; red when higher (worse), green when lower. */
export function DeltaChip({ value, reference, label, className }: { value: number | null | undefined; reference: number | null | undefined; label: string; className?: string }) {
  const { t } = useTranslation('area');
  const d = delta(value, reference);
  if (d == null) return null;
  const Icon = d > 0 ? ArrowUpRight : d < 0 ? ArrowDownRight : Minus;
  return (
    <Tooltip content={t('delta.tooltip', { ref: label, value: formatScore(reference) })}>
      <span tabIndex={0} className={cn('inline-flex items-center gap-1 text-xs whitespace-nowrap', className)}>
        <Icon className={cn('size-3.5', d > 0 ? 'text-danger' : d < 0 ? 'text-success' : 'text-muted-foreground')} aria-hidden />
        <span className={cn('num font-semibold', d > 0 ? 'text-danger' : d < 0 ? 'text-success' : 'text-muted-foreground')}>{formatDelta(d)}</span>
        <span className="text-muted-foreground">{t('delta.vs', { ref: label })}</span>
      </span>
    </Tooltip>
  );
}

export interface TrackRef {
  value: number | null | undefined;
  label: string;
  kind: 'region' | 'national';
}

/**
 * Reference marks, drawn so they never blend into the fill: the national value is a foreground tick
 * across the track; the regional value is a hollow ring (background centre, amber outline), which
 * stays visible on an amber or red fill.
 */
function RefMark({ kind, size, className, style }: { kind: TrackRef['kind']; size: 'sm' | 'md'; className?: string; style?: React.CSSProperties }) {
  if (kind === 'region') {
    return <span aria-hidden className={cn('rounded-full border-2 bg-background', size === 'sm' ? 'size-2' : 'size-2.5', className)} style={{ borderColor: REGION_COLOR, ...style }} />;
  }
  return <span aria-hidden className={cn('bg-foreground ring-2 ring-background', size === 'sm' ? 'h-2.5 w-0.5' : 'h-4 w-[3px]', className)} style={style} />;
}

/** Flat 0–10 track with the unit's fill and reference marks (region / national), plus a text legend. */
export function CompareTrack({ value, color, refs, className, size = 'md', showLegend = true }: { value: number | null | undefined; color: string; refs: TrackRef[]; className?: string; size?: 'sm' | 'md'; showLegend?: boolean }) {
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value * 10)) : 0;
  const present = refs.filter((r) => typeof r.value === 'number');
  // National first so the regional ring is drawn on top where the two coincide.
  const ordered = [...present].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'national' ? -1 : 1));
  return (
    <div className={className}>
      <div className={cn('relative w-full bg-muted', size === 'sm' ? 'h-1' : 'h-2')}>
        {typeof value === 'number' ? (
          <div className="h-full" style={{ width: `${pct}%`, background: color }} />
        ) : (
          <div className="h-full w-full border border-dashed border-border bg-background" />
        )}
        {ordered.map((r) => (
          <RefMark
            key={r.kind}
            kind={r.kind}
            size={size}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${Math.max(0, Math.min(100, (r.value as number) * 10))}%` }}
          />
        ))}
      </div>
      {showLegend && present.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {present.map((r) => (
            <span key={r.kind} className="inline-flex items-center gap-1.5">
              <RefMark kind={r.kind} size="sm" className={cn('inline-block', r.kind === 'national' && 'h-3 ring-0')} />
              {r.label} <span className="num font-semibold text-foreground">{formatScore(r.value)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** "/ 10" after a score, set in thin spaces and muted; read as "out of 10" by screen readers. */
export function OutOf10({ className }: { className?: string }) {
  const { t } = useTranslation('area');
  return (
    <span className={cn('font-sans font-normal text-muted-foreground', className)}>
      <span aria-hidden>{'\u2009/\u200910'}</span>
      <span className="sr-only"> {t('hero.outOf10')}</span>
    </span>
  );
}

/**
 * How local the data are - plain text with an explanatory tooltip (the label carries the meaning).
 * `focusable={false}` where a key already explains the terms (the indicator table), so keyboard users
 * are not made to tab through one chip per row.
 */
export function ResolutionChip({ resolution, className, focusable = true }: { resolution: SourceInfo['resolution']; className?: string; focusable?: boolean }) {
  const { t } = useTranslation('area');
  return (
    <Tooltip content={t(`resolution.${resolution}.desc`)}>
      <span tabIndex={focusable ? 0 : undefined} className={cn('cursor-help text-xs whitespace-nowrap text-muted-foreground underline decoration-border decoration-dotted underline-offset-4', resolution === 'overlay' && 'italic', className)}>
        {t(`resolution.${resolution}.label`)}
      </span>
    </Tooltip>
  );
}

/** "No data" tag with a dashed outline - missing is not zero. */
export function NoDataPill({ className, focusable = true }: { className?: string; focusable?: boolean }) {
  const { t } = useTranslation('area');
  return (
    <Tooltip content={t('noData.tooltip')}>
      <span tabIndex={focusable ? 0 : undefined} className={cn('inline-flex items-center rounded-sm border border-dashed border-muted-foreground/50 px-1.5 py-px text-[11px] font-medium whitespace-nowrap text-muted-foreground italic', className)}>
        {t('common:classes.noData')}
      </span>
    </Tooltip>
  );
}

/** Tracks a media query (for chart sizing that cannot be done in CSS). */
export function useMediaQuery(query: string): boolean {
  const get = React.useCallback(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches, [query]);
  const [match, setMatch] = React.useState(get);
  React.useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** A dimension's short label (H / V / LCC). */
export const DIM_SHORT = { hazard: 'H', vulnerability: 'V', coping: 'LCC' } as const;
