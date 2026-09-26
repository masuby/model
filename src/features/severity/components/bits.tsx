/** Small shared presentation pieces for the severity page (docs/DESIGN_LANGUAGE.md: rules, not boxes). */
import { RadioGroup } from 'radix-ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Kicker } from '@/components/layout/Page';
import { severityCategory } from '@/engine/severity/engine';
import { cn, formatScore } from '@/lib/utils';
import { isNum, ON_SEVERITY } from '../lib';

/** Number of steps in the calculator (shown as "Step n of 6"). */
export const STEP_COUNT = 6;

/** Pill with the severity category (1–5) of a 0–5 score, coloured by the official ramp. */
export function SeverityChip({ score, showScore = false, size = 'md', className }: { score: number | null | undefined; showScore?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation(['severity', 'common']);
  const c = severityCategory(isNum(score) ? score : null);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs',
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

/** Flat 0–5 bar coloured by the severity category of its value. */
export function SeverityMeter({ value, className, thin }: { value: number | null | undefined; className?: string; thin?: boolean }) {
  const c = severityCategory(isNum(value) ? value : null);
  return (
    <div className={cn('w-full bg-muted', thin ? 'h-1' : 'h-1.5', className)} aria-hidden>
      <div className="h-full transition-[width] duration-150" style={{ width: `${isNum(value) ? (Math.max(0, Math.min(5, value)) / 5) * 100 : 0}%`, background: c?.color ?? 'transparent' }} />
    </div>
  );
}

/** One step of the calculator: a ruled section with a plain "Step n of 6" label and a serif title. */
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
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation('severity');
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-24 border-t border-border pt-10 first:border-t-0 first:pt-0', className)}>
      <div className="mb-8">
        <Kicker className="num mb-2">{t('steps.kicker', { n, total: STEP_COUNT })}</Kicker>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id={`${id}-title`} className="min-w-0 text-[1.5rem] leading-tight text-balance sm:text-[1.75rem]">
            {title}
          </h2>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {description && <p className="mt-2.5 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Plain weight label, e.g. "⅔" (no chip). */
export function WeightTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('num text-xs font-normal whitespace-nowrap text-muted-foreground', className)}>{children}</span>;
}

/** Fraction label for a weight (1/3 → "⅓", 2/3 → "⅔", 1/2 → "½", else a percentage). */
export function fractionLabel(w: number): string {
  if (Math.abs(w - 1 / 3) < 1e-9) return '⅓';
  if (Math.abs(w - 2 / 3) < 1e-9) return '⅔';
  if (Math.abs(w - 1 / 2) < 1e-9) return '½';
  return `${Math.round(w * 100)}%`;
}

export const severityColor = (score: number | null | undefined) => severityCategory(isNum(score) ? score : null)?.color ?? null;

/** Radio circle drawn inside a row that is itself a Radix radio item (the parent must carry `group`). */
export function RadioMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-muted-foreground/60 transition-colors duration-150 group-hover:border-foreground group-data-[state=checked]:border-primary',
        className,
      )}
      aria-hidden
    >
      <RadioGroup.Indicator className="size-2 rounded-full bg-primary" />
    </span>
  );
}
