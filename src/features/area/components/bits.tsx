/**
 * Small presentational pieces shared by the Area Profile sections.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@/components/ui/primitives';
import type { SourceInfo } from '@/engine/risk/sources';
import { cn, formatScore } from '@/lib/utils';
import { delta, formatDelta } from '../lib';

/**
 * Series colours used consistently across the page. Unit and region are categorical (validated for
 * CVD separation and ≥3:1 contrast on the light and dark card surfaces); national is a deliberately
 * neutral *reference* mark, always drawn dashed / as a tick and labelled in text.
 */
export const unitColor = (dark: boolean) => (dark ? '#3b82f6' : '#1d6deb');
export const REGION_COLOR = '#d97706';
export const nationalColor = (dark: boolean) => (dark ? '#cbd5e1' : '#475569');

/** Fade/slide-in on scroll. `area-reveal` lets the print stylesheet force it visible. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn('area-reveal', className)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** A page section with an anchor (for the section nav), an eyebrow and a title. */
export function AreaSection({
  id,
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  id: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-32 py-10 sm:py-14 print:py-5', className)}>
      <Reveal>
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">{eyebrow}</div>
            <h2 id={`${id}-title`} className="text-2xl font-bold text-balance sm:text-3xl">
              {title}
            </h2>
            {description && <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="no-print flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </Reveal>
      {children}
    </section>
  );
}

/** "+0.8 vs Dodoma" — red when higher (worse), green when lower. Text carries the meaning, not colour. */
export function DeltaChip({ value, reference, label, className }: { value: number | null | undefined; reference: number | null | undefined; label: string; className?: string }) {
  const { t } = useTranslation('area');
  const d = delta(value, reference);
  if (d == null) return null;
  const Icon = d > 0 ? ArrowUpRight : d < 0 ? ArrowDownRight : Minus;
  return (
    <Tooltip content={t('delta.tooltip', { ref: label, value: formatScore(reference) })}>
      <span
        tabIndex={0}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
          d > 0 ? 'bg-danger/10 text-danger' : d < 0 ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
          className,
        )}
      >
        <Icon className="size-3" aria-hidden />
        <span className="num">{formatDelta(d)}</span>
        <span className="font-medium">{t('delta.vs', { ref: label })}</span>
      </span>
    </Tooltip>
  );
}

export interface TrackRef {
  value: number | null | undefined;
  label: string;
  kind: 'region' | 'national';
}

/** 0–10 track with the unit's fill and reference markers (region / national), plus a text legend. */
export function CompareTrack({ value, color, refs, className, size = 'md', showLegend = true }: { value: number | null | undefined; color: string; refs: TrackRef[]; className?: string; size?: 'sm' | 'md'; showLegend?: boolean }) {
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value * 10)) : 0;
  const present = refs.filter((r) => typeof r.value === 'number');
  return (
    <div className={className}>
      <div className={cn('relative w-full rounded-full bg-muted', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        {typeof value === 'number' ? (
          <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
        ) : (
          <div className="h-full w-full rounded-full bg-[repeating-linear-gradient(135deg,var(--border)_0_4px,transparent_4px_8px)]" />
        )}
        {present.map((r) => (
          <span
            key={r.kind}
            aria-hidden
            className={cn('absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card', size === 'sm' ? 'h-3 w-[3px]' : 'h-[18px] w-1', r.kind === 'national' && 'bg-foreground')}
            style={{ left: `${Math.max(0, Math.min(100, (r.value as number) * 10))}%`, background: r.kind === 'region' ? REGION_COLOR : undefined }}
          />
        ))}
      </div>
      {showLegend && present.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {present.map((r) => (
            <span key={r.kind} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn('inline-block h-3 w-1 rounded-full', r.kind === 'national' && 'bg-foreground')} style={{ background: r.kind === 'region' ? REGION_COLOR : undefined }} />
              {r.label} <span className="num font-semibold text-foreground">{formatScore(r.value)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Honest "how local is this data" chip. */
export function ResolutionChip({ resolution, className }: { resolution: SourceInfo['resolution']; className?: string }) {
  const { t } = useTranslation('area');
  const tone: Record<SourceInfo['resolution'], string> = {
    council: 'bg-success/12 text-success',
    district: 'bg-primary/10 text-primary',
    region: 'bg-warning/12 text-warning',
    national: 'bg-muted text-muted-foreground',
    overlay: 'border border-dashed border-border text-muted-foreground',
  };
  return (
    <Tooltip content={t(`resolution.${resolution}.desc`)}>
      <span tabIndex={0} className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', tone[resolution], className)}>
        {t(`resolution.${resolution}.label`)}
      </span>
    </Tooltip>
  );
}

/** Dashed "No data" pill — missing is not zero. */
export function NoDataPill({ className }: { className?: string }) {
  const { t } = useTranslation('area');
  return (
    <Tooltip content={t('noData.tooltip')}>
      <span tabIndex={0} className={cn('inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-muted-foreground', className)}>
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

/** A dimension's accent eyebrow (H / V / LCC). */
export const DIM_SHORT = { hazard: 'H', vulnerability: 'V', coping: 'LCC' } as const;
