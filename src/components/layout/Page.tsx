import * as React from 'react';
import { cn } from '@/lib/utils';

/** Standard page container. */
export function PageContainer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1440px] px-4 sm:px-6', className)}>{children}</div>;
}

/** Page title block with optional eyebrow, description and actions. */
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
    <div className={cn('relative overflow-hidden border-b border-border bg-card/40', className)}>
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <PageContainer className="relative py-10 sm:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl animate-fade-up">
            {eyebrow && <div className="mb-3 text-xs font-semibold tracking-[0.16em] text-primary uppercase">{eyebrow}</div>}
            <h1 className="text-3xl font-extrabold text-balance sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </PageContainer>
    </div>
  );
}

/** Section heading used inside pages. */
export function SectionHeading({ eyebrow, title, description, actions, className }: { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <div className="mb-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">{eyebrow}</div>}
        <h2 className="text-2xl font-bold text-balance sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** KPI tile. */
export function Stat({ label, value, sub, icon, className }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5', className)}>
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        {icon && <span className="text-primary [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="num mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
