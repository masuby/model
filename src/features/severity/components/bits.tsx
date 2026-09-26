/** Small shared presentation pieces for the severity page. */
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { SeverityDimensionKey } from '@/engine/severity/definitions';
import { severityCategory } from '@/engine/severity/engine';
import { cn, formatScore } from '@/lib/utils';
import { isNum, ON_SEVERITY } from '../lib';

export const FADE = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45 },
} as const;

/** Accent per severity dimension (distinct from the severity ramp so they never read as a score). */
export const DIM_ACCENT: Record<SeverityDimensionKey, { text: string; soft: string; ring: string; hex: string }> = {
  impact: { text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-500/10', ring: 'ring-rose-500/25', hex: '#e11d48' },
  conditions: { text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-500/10', ring: 'ring-amber-500/25', hex: '#f59e0b' },
  complexity: { text: 'text-violet-600 dark:text-violet-400', soft: 'bg-violet-500/10', ring: 'ring-violet-500/25', hex: '#8b5cf6' },
};

/** Pill with the severity category (1–5) of a 0–5 score, coloured by the official ramp. */
export function SeverityChip({ score, showScore = false, size = 'md', className }: { score: number | null | undefined; showScore?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation(['severity', 'common']);
  const c = severityCategory(isNum(score) ? score : null);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 ring-black/5',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
        !c && 'bg-muted text-muted-foreground',
        className,
      )}
      style={c ? { background: c.color, color: ON_SEVERITY[c.key] } : undefined}
    >
      {showScore && <span className="num">{formatScore(score)}</span>}
      {c ? t(`common:classes.${c.key}`) : t('results.notComputed')}
    </span>
  );
}

/** 0–5 bar coloured by the severity category of its value. */
export function SeverityMeter({ value, className, thin }: { value: number | null | undefined; className?: string; thin?: boolean }) {
  const c = severityCategory(isNum(value) ? value : null);
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-muted', thin ? 'h-1.5' : 'h-2', className)} aria-hidden>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${isNum(value) ? (Math.max(0, Math.min(5, value)) / 5) * 100 : 0}%`, background: c?.color ?? 'transparent' }} />
    </div>
  );
}

/** Step section with a numbered badge. */
export function Step({
  n,
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  n: number;
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section {...FADE} id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn('scroll-mt-24', className)}>
      <div className="mb-4 flex flex-wrap items-start gap-x-3 gap-y-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary ring-1 ring-primary/20" aria-hidden>
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={id ? `${id}-title` : undefined} className="text-xl font-bold sm:text-2xl">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </motion.section>
  );
}

/** Small weight tag, e.g. "⅔". */
export function WeightTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('num inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground', className)}>{children}</span>;
}

/** Fraction label for a weight (1/3 → "⅓", 2/3 → "⅔", 1/2 → "½", else a percentage). */
export function fractionLabel(w: number): string {
  if (Math.abs(w - 1 / 3) < 1e-9) return '⅓';
  if (Math.abs(w - 2 / 3) < 1e-9) return '⅔';
  if (Math.abs(w - 1 / 2) < 1e-9) return '½';
  return `${Math.round(w * 100)}%`;
}

export const severityColor = (score: number | null | undefined) => severityCategory(isNum(score) ? score : null)?.color ?? null;
