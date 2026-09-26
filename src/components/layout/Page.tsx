/**
 * Page-level layout primitives (see docs/DESIGN_LANGUAGE.md): structure comes from type, whitespace and
 * hairline rules — not boxes.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Standard page container. */
export function PageContainer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

/** Small plain-case label above a title (replaces uppercase "eyebrows"). */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-sm font-medium text-muted-foreground', className)}>{children}</div>;
}

/** Page title block: serif title, lead paragraph, optional actions; closed by a hairline rule. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn('border-b border-border', className)}>
      <PageContainer className="pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {eyebrow && <Kicker className="mb-3">{eyebrow}</Kicker>}
            <h1 className="text-[2rem] leading-[1.1] text-balance sm:text-[2.6rem]">{title}</h1>
            {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </PageContainer>
    </header>
  );
}

/** Section heading: serif title with an optional plain label and lead. Pair with a `border-t` section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <Kicker className="mb-2">{eyebrow}</Kicker>}
        <h2 className="text-[1.6rem] leading-tight text-balance sm:text-[2rem]">{title}</h2>
        {description && <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A page section separated from the previous one by a hairline rule. */
export function Section({ className, children, id, ruled = true }: { className?: string; children: React.ReactNode; id?: string; ruled?: boolean }) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-14 sm:py-16', ruled && 'border-t border-border', className)}>
      {children}
    </section>
  );
}

/**
 * One key figure: a large number with a label, set off by a left hairline. Place several in a grid or
 * `KeyFigures` row — never inside individual boxes.
 */
export function Stat({ label, value, sub, icon, className }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border-l border-border py-1 pl-4 sm:pl-5', className)}>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon && <span className="[&_svg]:size-3.5" aria-hidden>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="num mt-1.5 text-3xl font-semibold tracking-tight sm:text-[2.1rem]">{value}</div>
      {sub && <div className="mt-1 text-sm text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** A row of key figures separated by vertical rules (wraps to two columns on small screens). */
export function KeyFigures({ items, className }: { items: Array<{ label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode }>; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-y-6 md:flex md:divide-x md:divide-border', className)}>
      {items.map((it, i) => (
        <div key={i} className={cn('min-w-0 md:flex-1 md:px-6 md:first:pl-0 md:last:pr-0', i % 2 === 1 && 'border-l border-border pl-4 md:border-l-0')}>
          <dt className="text-sm text-muted-foreground">{it.label}</dt>
          <dd className="num mt-1.5 text-3xl font-semibold tracking-tight sm:text-[2.1rem]">{it.value}</dd>
          {it.sub && <dd className="mt-1 text-sm text-muted-foreground">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** A note set off by a left rule (no coloured box). */
export function Note({ children, tone = 'neutral', title, className }: { children: React.ReactNode; tone?: 'neutral' | 'warning' | 'danger'; title?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-l-2 pl-4 text-sm leading-relaxed text-muted-foreground',
        tone === 'warning' ? 'border-warning' : tone === 'danger' ? 'border-danger' : 'border-border',
        className,
      )}
    >
      {title && <p className="mb-1 font-medium text-foreground">{title}</p>}
      {children}
    </div>
  );
}
