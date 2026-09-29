/** Small shared building blocks for the Data Portal: states, badges, deltas, ruled notes, value cells. */
import { ArrowDown, ArrowUp, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/primitives';
import type { Role, SubmissionStatus } from '@/data-layer/types';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore, NO_VALUE } from '@/lib/utils';
import { errorMessage } from '../lib/batch';

/** Empty state: a plain title and lead on the page (no box, no icon tile). */
export function EmptyState({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-xl py-10', className)}>
      <h3 className="font-display text-xl leading-snug font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Load failure: a note with a red left rule and a retry button. */
export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation('data');
  return (
    <div role="alert" className={cn('border-l-2 border-danger py-1 pl-4', className)}>
      <h3 className="text-base font-semibold">{t('states.errorTitle')}</h3>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t('states.errorLead')}</p>
      {error != null && <p className="mt-2 max-w-xl font-mono text-xs break-words text-muted-foreground">{errorMessage(error)}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw /> {t('states.retry')}
        </Button>
      )}
    </div>
  );
}

/** Loading placeholder: ruled rows of grey lines. */
export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  const { t } = useTranslation('data');
  return (
    <div className={cn('border-t border-border', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{t('states.loading')}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-b border-border py-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-4 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Signed change with direction colour: up = more risk (danger), down = less risk (success). */
export function Delta({ value, className }: { value: number | null | undefined; className?: string }) {
  const { t } = useTranslation('data');
  if (value == null) return <span className={cn('text-xs text-muted-foreground', className)}>{NO_VALUE}</span>;
  if (value === 0)
    return (
      <span className={cn('num text-xs font-medium text-muted-foreground', className)} aria-label={t('delta.none')}>
        ±0.0
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={cn('num inline-flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap', up ? 'text-danger' : 'text-success', className)}
      aria-label={t(up ? 'delta.up' : 'delta.down', { value: Math.abs(value).toFixed(1) })}
    >
      {up ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
      {up ? '+' : '−'}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

/** A 0–10 value or a muted "No data". */
export function ScoreValue({ value, className }: { value: number | null | undefined; className?: string }) {
  const { t } = useTranslation('data');
  if (value == null) return <span className={cn('text-xs text-muted-foreground italic', className)}>{t('common:classes.noData')}</span>;
  return <span className={cn('num font-semibold', className)}>{formatScore(value)}</span>;
}

/** Unit level as one neutral tag for every level (the wording, not the style, tells them apart). */
export function LevelBadge({ unit, className }: { unit: Pick<Unit, 'level'> | null | undefined; className?: string }) {
  const { t } = useTranslation('data');
  if (!unit) return null;
  return (
    <Badge variant="secondary" className={cn('font-medium', className)}>
      {t(`levels.${unit.level}`)}
    </Badge>
  );
}

/**
 * Row highlights for flush lists: the tint bleeds 12 px into the gutter on both sides (a box-shadow in
 * the same colour), so row text stays aligned with headings and rules while the tint keeps some air.
 * Apply exactly one per row.
 */
export const ROW_TINT = {
  changed: '[--row-tint:color-mix(in_oklab,var(--color-muted)_60%,transparent)] bg-(--row-tint) shadow-[-12px_0_0_var(--row-tint),12px_0_0_var(--row-tint)]',
  error: '[--row-tint:color-mix(in_oklab,var(--color-danger)_6%,transparent)] bg-(--row-tint) shadow-[-12px_0_0_var(--row-tint),12px_0_0_var(--row-tint)]',
} as const;

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { t } = useTranslation('data');
  const variant = role === 'pmo' || role === 'admin' ? 'outline' : 'secondary';
  return (
    <Badge variant={variant} className={cn('font-medium', className)}>
      {t(`roles.${role}`)}
    </Badge>
  );
}

export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const { t } = useTranslation('data');
  const Icon = status === 'approved' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock3;
  return (
    <Badge variant={status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'} className={className}>
      <Icon aria-hidden /> {t(`status.${status}`)}
    </Badge>
  );
}

/**
 * A note set off by a left rule (docs/DESIGN_LANGUAGE.md §8) - never a tinted box. The rule carries the
 * state colour; `info` stays neutral.
 */
export function Callout({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const rule = { info: 'border-border', warning: 'border-warning', danger: 'border-danger', success: 'border-success' }[tone];
  return (
    <div className={cn('border-l-2 pl-4 text-sm', rule, className)}>
      {title && <p className="font-medium text-foreground">{title}</p>}
      {children && <div className={cn('leading-relaxed text-muted-foreground', title && 'mt-0.5')}>{children}</div>}
    </div>
  );
}

/** Styled native checkbox (accessible, keyboard-friendly, themed). */
export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn('size-4 shrink-0 cursor-pointer rounded border-input accent-primary', className)} {...props} />;
}
