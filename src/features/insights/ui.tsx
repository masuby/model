/**
 * Small building blocks shared by the Insights sections: section wrapper with entry motion, the
 * "What this shows" caption, tooltip card, legends, a truncating axis tick and a media-query hook.
 */
import { Info } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '@/components/layout/Page';
import { cn } from '@/lib/utils';

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.2, 0.7, 0.2, 1] as const },
};

/** A numbered, anchored story section with subtle entry motion. */
export function InsightSection({
  id,
  index,
  eyebrow,
  title,
  lead,
  actions,
  className,
  children,
}: {
  id: string;
  index: number;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-32 py-12 sm:py-16', className)}>
      {/* Print shows everything, even sections never scrolled into view. */}
      <motion.div {...fadeUp} className="print:transform-none! print:opacity-100!">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="num">{String(index).padStart(2, '0')}</span>
              <span className="h-px w-6 bg-primary/40" aria-hidden />
              {eyebrow}
            </span>
          }
          title={<span id={`${id}-title`}>{title}</span>}
          description={lead}
          actions={actions}
        />
      </motion.div>
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="print:transform-none! print:opacity-100!">
        {children}
      </motion.div>
    </section>
  );
}

/** Plain-language caption placed under each chart. */
export function WhatThisShows({ children, className }: { children: React.ReactNode; className?: string }) {
  const { t } = useTranslation('insights');
  return (
    <div className={cn('mt-4 flex gap-2.5 rounded-xl bg-muted/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p>
        <span className="font-semibold text-foreground">{t('whatThisShows')}</span> {children}
      </p>
    </div>
  );
}

/** Themed container for custom Recharts tooltips (matches the shared ChartTooltip). */
export function TooltipCard({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="max-w-72 min-w-44 rounded-xl border border-border bg-elevated px-3 py-2.5 text-xs shadow-[var(--shadow-lift)]">
      <div className="font-semibold text-foreground">{title}</div>
      {subtitle && <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>}
      {children && <div className="mt-2 grid gap-1">{children}</div>}
    </div>
  );
}

/** One "label … value" row in a tooltip, keyed by a short line of the series colour. */
export function TooltipRow({ color, label, value, strong }: { color?: string; label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color && <i className="inline-block h-0.5 w-3 rounded-full" style={{ background: color }} aria-hidden />}
        {label}
      </span>
      <span className={cn('num text-foreground', strong ? 'font-bold' : 'font-semibold')}>{value}</span>
    </div>
  );
}

export interface LegendEntry {
  key: string;
  color: string;
  label: React.ReactNode;
  value?: React.ReactNode;
  shape?: 'square' | 'dot' | 'line';
}

/** Inline legend (always present for ≥ 2 series); the swatch mirrors the mark, text stays in ink. */
export function Legend({ items, className, 'aria-label': ariaLabel }: { items: LegendEntry[]; className?: string; 'aria-label'?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)} aria-label={ariaLabel}>
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn('inline-block shrink-0', it.shape === 'dot' ? 'size-2.5 rounded-full' : it.shape === 'line' ? 'h-0.5 w-4 rounded-full' : 'size-2.5 rounded-[3px]')}
            style={{ background: it.color }}
          />
          <span className="text-foreground/85">{it.label}</span>
          {it.value !== undefined && <span className="num font-semibold text-foreground">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Truncate a label for an axis, keeping the full text in an SVG <title> (hover) for sighted users. */
export function truncate(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, Math.max(1, max - 1)).trimEnd()}…` : label;
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
}

/** Y-axis category tick that truncates long names and optionally translates the raw value. */
export function CategoryTick({ x, y, payload, fill, maxChars, labelOf, weight }: TickProps & { fill: string; maxChars: number; labelOf?: (raw: string) => string; weight?: number }) {
  const raw = String(payload?.value ?? '');
  const label = labelOf ? labelOf(raw) : raw;
  const short = truncate(label, maxChars);
  return (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" fill={fill} fontSize={11} fontWeight={weight}>
      {short !== label && <title>{label}</title>}
      {short}
    </text>
  );
}

/** Subscribe to a CSS media query (SSR-safe). */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Mini horizontal "where does this value sit on the 0–10 class scale" strip for KPI tiles. */
export function ScaleStrip({ value, bounds, colors, className, label }: { value: number | null; bounds: readonly number[]; colors: readonly string[]; className?: string; label?: string }) {
  const edges = [0, ...bounds, 10];
  return (
    <div className={cn('relative mt-3 h-1.5 w-full', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <div className="flex h-full gap-[2px] overflow-hidden rounded-full">
        {colors.map((c, i) => (
          <span key={i} className="h-full" style={{ width: `${((edges[i + 1] - edges[i]) / 10) * 100}%`, background: c, opacity: 0.85 }} />
        ))}
      </div>
      {typeof value === 'number' && (
        <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground shadow" style={{ left: `${(Math.max(0, Math.min(10, value)) / 10) * 100}%` }} />
      )}
    </div>
  );
}
