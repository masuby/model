/**
 * Typesetting primitives for the Methodology page (docs/DESIGN_LANGUAGE.md): numbered document sections
 * divided by hairline rules, prose at a reading measure, left-rule notes and a tiny HTML formula kit
 * (variables, fractions, roots, big operators, aligned rows, cases) - no LaTeX dependency, no boxes, no
 * entrance motion. Display equations are set on the page, as in a statistical publication, with the
 * equation number at the right and any "where …" explanation as wrapping text beneath.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { displayNumber, type Resolution } from './data';
import { RESOLUTION_CLASS } from './tokens';

/* ------------------------------------------------------------------------------------------------ */
/* Document structure                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

export function DocSection({
  id,
  label,
  title,
  lead,
  children,
  sub = false,
  className,
}: {
  id: string;
  /**
   * Short section name shown with its number above the title ("3 · The calculation pipeline"). Omitted
   * (only the number shows) when it would repeat the title word for word.
   */
  label?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  /** A sub-section: continues its parent (no top rule) and takes a smaller serif title. */
  sub?: boolean;
  className?: string;
}) {
  const showLabel = label != null && label !== '' && !(typeof label === 'string' && typeof title === 'string' && label.trim() === title.trim());
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-[124px] lg:scroll-mt-24', sub ? 'pb-16 sm:pb-20' : 'border-t border-border py-16 first:border-t-0 first:pt-0 sm:py-20', className)}>
      <header className="max-w-3xl">
        {/* Number + short label as a kicker; when the label would repeat the title, the number sits
            inline before the title instead of standing alone. */}
        {showLabel && (
          <p className="flex items-baseline gap-2 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{displayNumber(id)}</span>
            <span aria-hidden>·</span>
            <span>{label}</span>
          </p>
        )}
        {sub ? (
          <h3 id={`${id}-title`} tabIndex={-1} className={cn('font-display text-[1.45rem] leading-snug font-semibold text-balance outline-none sm:text-[1.7rem]', showLabel && 'mt-3')}>
            {!showLabel && <span className="num mr-3 font-sans text-[0.7em] font-medium text-muted-foreground">{displayNumber(id)}</span>}
            {title}
          </h3>
        ) : (
          <h2 id={`${id}-title`} tabIndex={-1} className={cn('text-[1.75rem] leading-[1.15] text-balance outline-none sm:text-[2.25rem]', showLabel && 'mt-3')}>
            {!showLabel && <span className="num mr-3 font-sans text-[0.6em] font-medium text-muted-foreground">{displayNumber(id)}</span>}
            {title}
          </h2>
        )}
        {lead && <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted-foreground sm:text-lg">{lead}</p>}
      </header>
      {/* The section rule of the next section closes this one, so a ruled list never adds a second rule. */}
      <div className="mt-10 [&>*:last-child]:border-b-0">{children}</div>
    </section>
  );
}

/** Body paragraph at a comfortable reading measure. */
export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('max-w-[68ch] text-[15.5px] leading-[1.75] text-foreground/90', className)}>{children}</p>;
}

/** Sub-heading inside a section (sans, sentence case). */
export function SubHeading({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h3 id={id} className={cn('text-base font-semibold', className)}>
      {children}
    </h3>
  );
}

/**
 * A note set off by a left rule - not a coloured box. `caution` uses the warning rule; the title reads
 * in the foreground colour, the body in muted text.
 */
export function Callout({ tone = 'note', title, children, className }: { tone?: 'note' | 'caution'; title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-[68ch] border-l-2 py-0.5 pl-4 text-sm leading-relaxed text-muted-foreground', tone === 'caution' ? 'border-warning' : 'border-border', className)}>
      {title && <p className="mb-1 font-medium text-foreground">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Resolution label                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The resolution mark, encoded by shape and value (not by teal shade alone): filled dark (council), filled
 * mid (district), ring (region), filled grey (national), dashed ring (documented overlay).
 */
export function ResolutionDot({ value, className }: { value: Resolution; className?: string }) {
  return <span className={cn('inline-block size-2.5 shrink-0 rounded-full', RESOLUTION_CLASS[value], className)} aria-hidden />;
}

/** Data resolution as a mark plus its name (never the mark alone). */
export function ResolutionBadge({ value, className }: { value: Resolution; className?: string }) {
  const { t } = useTranslation('methodology');
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs whitespace-nowrap', className)}>
      <ResolutionDot value={value} />
      {t(`resolution.${value}`)}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Formula kit                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Whether a horizontally scrollable element overflows and is not yet scrolled to its end - drives the
 * right-edge fade that tells a reader on a narrow screen that the formula continues.
 */
function useScrollHint(ref: React.RefObject<HTMLElement | null>) {
  const [state, setState] = React.useState({ overflow: false, more: false });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const overflow = el.scrollWidth > el.clientWidth + 1;
      const more = overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setState((s) => (s.overflow === overflow && s.more === more ? s : { overflow, more }));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, [ref]);
  return state;
}

/**
 * A display formula set on the page (no panel), with an optional equation number at the right. `label`
 * is the plain-text reading announced to assistive technology; the visual typesetting is hidden from it.
 * `where` is the explanation that follows the equation ("where d is …") and `caption` a further note; both
 * wrap as ordinary text beneath the math. A formula wider than its column scrolls, with a fade at the
 * right edge while more is hidden.
 */
export function Formula({
  label,
  children,
  className,
  where,
  caption,
  tag,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  where?: React.ReactNode;
  caption?: React.ReactNode;
  /** Equation number, e.g. "1" → "(1)". */
  tag?: React.ReactNode;
  /** Smaller type, for formulas set in a narrow column. */
  compact?: boolean;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const hint = useScrollHint(scroller);
  return (
    <figure className={cn('min-w-0', className)}>
      <div className="flex items-center gap-4 sm:gap-6">
        <div
          ref={scroller}
          role="math"
          aria-label={label}
          // Focusable only when it scrolls, so keyboard users can reach the hidden part.
          tabIndex={hint.overflow ? 0 : undefined}
          className={cn(
            'min-w-0 flex-1 overflow-x-auto py-1 font-display leading-relaxed text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring',
            compact ? 'text-[15px]' : 'text-[15px] sm:text-[17px]',
            hint.more && '[mask-image:linear-gradient(to_right,#000_86%,transparent)] print:[mask-image:none]',
          )}
        >
          <div aria-hidden className={cn('flex min-w-max flex-col gap-3', compact && '[&>div]:gap-x-1')}>
            {children}
          </div>
        </div>
        {tag != null && (
          <span className="num shrink-0 text-sm text-muted-foreground" aria-hidden>
            ({tag})
          </span>
        )}
      </div>
      {(where || caption) && (
        <figcaption className="mt-2 max-w-[72ch] space-y-1 font-sans text-[13px] leading-relaxed text-muted-foreground">
          {where && <p>{where}</p>}
          {caption && <p>{caption}</p>}
        </figcaption>
      )}
    </figure>
  );
}

/** One line of a formula. */
export function Line({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-x-1.5 whitespace-nowrap', className)}>{children}</div>;
}

/**
 * Several equations (or one equation broken over lines) aligned on their relation sign: each row is
 * `[left side, relation + right side]`; a continuation row leaves the left side empty.
 */
export function Aligned({ rows }: { rows: ReadonlyArray<ReadonlyArray<React.ReactNode>> }) {
  return (
    <div className="grid grid-cols-[max-content_max-content] items-center gap-x-1.5 gap-y-3">
      {rows.map(([lhs, rhs], i) => (
        <React.Fragment key={i}>
          <div className="flex items-center justify-end gap-x-1.5 whitespace-nowrap">{lhs}</div>
          <div className="flex items-center gap-x-1.5 whitespace-nowrap">{rhs}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

/** A case definition: a brace followed by `[value, condition]` rows. */
export function Cases({ rows }: { rows: ReadonlyArray<ReadonlyArray<React.ReactNode>> }) {
  return (
    <span className="inline-flex items-stretch gap-2">
      <svg viewBox="0 0 10 100" preserveAspectRatio="none" className="w-2.5 shrink-0 text-muted-foreground" aria-hidden>
        <path d="M9 1 C5 1 5 4 5 10 L5 42 C5 47 4 50 1 50 C4 50 5 53 5 58 L5 90 C5 96 5 99 9 99" fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="grid grid-cols-[max-content_max-content] items-center gap-x-6 gap-y-1.5 py-0.5">
        {rows.map(([value, when], i) => (
          <React.Fragment key={i}>
            <span className="font-sans text-[0.85em] not-italic">{value}</span>
            <span className="flex items-center gap-x-1.5 whitespace-nowrap">{when}</span>
          </React.Fragment>
        ))}
      </span>
    </span>
  );
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

/** Upright number; `strong` marks a result. */
export function N({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={cn('num not-italic', strong && 'font-semibold')}>{children}</span>;
}

/** Operator / relation symbol. */
export function Op({ children }: { children: React.ReactNode }) {
  return <span className="px-0.5 text-muted-foreground not-italic">{children}</span>;
}

/** Named function (ln, round, geomean…), upright in the serif face as mathematical convention has it. */
export function Fn({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <span className="font-display not-italic">
      {children}
      {sub != null && <sub className="text-[0.62em] italic">{sub}</sub>}
    </span>
  );
}

/**
 * A separator (comma by default) that hugs the preceding term: it cancels the flex gap before it, so
 * "(x, y)" does not read "(x , y)".
 */
export function Sep({ children = ',' }: { children?: React.ReactNode }) {
  return <span className="-ml-1.5">{children}</span>;
}

/** A short qualifier inside a formula (a few words at most - explanations belong in `where`). */
export function Txt({ children }: { children: React.ReactNode }) {
  return <span className="font-sans text-[0.78em] text-muted-foreground not-italic">{children}</span>;
}

/** Parentheses (or brackets); `sup` sets an exponent against the closing glyph. */
export function Paren({ children, square, sup }: { children: React.ReactNode; square?: boolean; sup?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center">
      <span className="text-[1.35em] leading-none font-light text-muted-foreground">{square ? '[' : '('}</span>
      <span className="inline-flex items-center gap-x-1.5 px-0.5">{children}</span>
      {sup != null ? (
        <span className="inline-flex items-start">
          <span className="text-[1.35em] leading-none font-light text-muted-foreground">{square ? ']' : ')'}</span>
          <sup className="top-0 -mt-0.5 ml-px text-[0.68em] leading-none">{sup}</sup>
        </span>
      ) : (
        <span className="text-[1.35em] leading-none font-light text-muted-foreground">{square ? ']' : ')'}</span>
      )}
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
