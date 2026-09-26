/**
 * Typesetting primitives for the Methodology page: numbered document sections, prose, call-outs and a
 * tiny HTML formula kit (variables, fractions, roots, big operators) — no LaTeX dependency.
 */
import { Info, Lightbulb, TriangleAlert, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Resolution } from './data';
import { fadeIn, RESOLUTION_STYLE } from './tokens';

/* ------------------------------------------------------------------------------------------------ */
/* Document structure                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

export function DocSection({
  id,
  number,
  eyebrow,
  title,
  lead,
  children,
  sub = false,
  className,
}: {
  id: string;
  number: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  /** A sub-section: no top rule, tighter spacing. */
  sub?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('scroll-mt-[132px] lg:scroll-mt-24', sub ? 'pb-14 sm:pb-16' : 'border-t border-border py-14 first:border-t-0 first:pt-2 sm:py-16', className)}
    >
      <motion.header {...fadeIn}>
        <div className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          <span className="num rounded-md bg-primary/10 px-1.5 py-0.5 tracking-normal">{number}</span>
          <span>{eyebrow}</span>
        </div>
        {sub ? (
          <h3 id={`${id}-title`} tabIndex={-1} className="mt-3 text-xl font-extrabold text-balance outline-none sm:text-2xl">
            {title}
          </h3>
        ) : (
          <h2 id={`${id}-title`} tabIndex={-1} className="mt-3 text-2xl font-extrabold text-balance outline-none sm:text-[2rem] sm:leading-tight">
            {title}
          </h2>
        )}
        {lead && <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">{lead}</p>}
      </motion.header>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Body paragraph at a comfortable measure. */
export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('max-w-[72ch] text-[15px] leading-7 text-foreground/85 sm:text-base sm:leading-7', className)}>{children}</p>;
}

export function SubHeading({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h3 id={id} className={cn('text-lg font-bold tracking-tight', className)}>
      {children}
    </h3>
  );
}

const CALLOUT: Record<'note' | 'caution' | 'tip', { cls: string; icon: LucideIcon; iconCls: string }> = {
  note: { cls: 'border-primary/20 bg-primary/[0.05]', icon: Info, iconCls: 'text-primary' },
  caution: { cls: 'border-warning/30 bg-warning/[0.06]', icon: TriangleAlert, iconCls: 'text-warning' },
  tip: { cls: 'border-success/25 bg-success/[0.06]', icon: Lightbulb, iconCls: 'text-success' },
};

export function Callout({ tone = 'note', title, children, className }: { tone?: keyof typeof CALLOUT; title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const c = CALLOUT[tone];
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed sm:p-5', c.cls, className)}>
      <c.icon className={cn('mt-0.5 size-4 shrink-0', c.iconCls)} aria-hidden />
      <div className="min-w-0 text-foreground/85">
        {title && <div className="mb-1 font-semibold text-foreground">{title}</div>}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Resolution badge                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

export function ResolutionBadge({ value, className }: { value: Resolution; className?: string }) {
  const { t } = useTranslation('methodology');
  const s = RESOLUTION_STYLE[value];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', s.chip, className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {t(`resolution.${value}`)}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Formula kit                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/**
 * A display formula. `label` is the plain-text reading announced to assistive technology; the visual
 * typesetting is hidden from it.
 */
export function Formula({ label, children, className, caption }: { label: string; children: React.ReactNode; className?: string; caption?: React.ReactNode }) {
  return (
    <figure className={cn('overflow-hidden rounded-xl border border-border bg-muted/45', className)}>
      <div role="math" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-md focus-visible:outline-2 focus-visible:outline-ring px-4 py-3.5 font-serif text-[17px] leading-relaxed text-foreground sm:px-5">
        <div aria-hidden className="flex min-w-max flex-col gap-2.5">
          {children}
        </div>
      </div>
      {caption && <figcaption className="border-t border-border/70 bg-card/50 px-4 py-2 text-xs leading-relaxed text-muted-foreground sm:px-5">{caption}</figcaption>}
    </figure>
  );
}

/** One line of a formula. */
export function Line({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-x-1.5 whitespace-nowrap', className)}>{children}</div>;
}

/** Italic variable, optionally subscripted. */
export function V({ children, sub, sup }: { children: React.ReactNode; sub?: React.ReactNode; sup?: React.ReactNode }) {
  return (
    <span className="italic">
      {children}
      {sub != null && <sub className="text-[0.68em] not-italic">{sub}</sub>}
      {sup != null && <sup className="text-[0.68em] not-italic">{sup}</sup>}
    </span>
  );
}

/** Upright number. */
export function N({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={cn('num not-italic', strong && 'font-semibold text-primary')}>{children}</span>;
}

/** Operator / relation symbol. */
export function Op({ children }: { children: React.ReactNode }) {
  return <span className="px-0.5 text-muted-foreground not-italic">{children}</span>;
}

/** Named function set in small caps sans (ROUND, GEOMEAN, ln…). */
export function Fn({ children }: { children: React.ReactNode }) {
  return <span className="font-sans text-[0.78em] font-semibold tracking-wide not-italic">{children}</span>;
}

/** Plain explanatory text inside a formula. */
export function Txt({ children }: { children: React.ReactNode }) {
  return <span className="font-sans text-[0.78em] text-muted-foreground not-italic">{children}</span>;
}

export function Paren({ children, square }: { children: React.ReactNode; square?: boolean }) {
  return (
    <span className="inline-flex items-center">
      <span className="text-[1.35em] leading-none font-light text-muted-foreground">{square ? '[' : '('}</span>
      <span className="inline-flex items-center gap-x-1.5 px-0.5">{children}</span>
      <span className="text-[1.35em] leading-none font-light text-muted-foreground">{square ? ']' : ')'}</span>
    </span>
  );
}

export function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.9em] leading-snug">
      <span className="inline-flex items-center gap-x-1 px-1 pb-0.5">{num}</span>
      <span className="h-px w-full bg-foreground/60" />
      <span className="inline-flex items-center gap-x-1 px-1 pt-0.5">{den}</span>
    </span>
  );
}

/** Radical with an overline over its radicand; `index` 3 renders ∛. */
export function Root({ index = 2, children }: { index?: 2 | 3; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-stretch">
      <span className="self-center pr-px text-[1.25em] leading-none">{index === 3 ? '∛' : '√'}</span>
      <span className="inline-flex items-center gap-x-1.5 border-t border-foreground/60 px-1 pt-0.5">{children}</span>
    </span>
  );
}

/** Large operator (Σ, Π) with a lower limit. */
export function BigOp({ symbol, below }: { symbol: string; below?: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center align-middle leading-none">
      <span className="text-[1.45em]">{symbol}</span>
      {below && <span className="mt-0.5 text-[0.62em] italic">{below}</span>}
    </span>
  );
}
