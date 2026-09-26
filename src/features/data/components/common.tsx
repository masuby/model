/** Small shared building blocks for the Data Portal: states, badges, deltas, callouts, value cells. */
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Clock3, Info, RefreshCw, XCircle } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/primitives';
import type { Role, SubmissionStatus } from '@/data-layer/types';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { errorMessage } from '../lib/batch';

export function EmptyState({ icon, title, description, action, className }: { icon: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-5">{icon}</div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation('data');
  return (
    <div role="alert" className={cn('flex flex-col items-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="mt-3 font-semibold">{t('states.errorTitle')}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{t('states.errorLead')}</p>
      {error != null && <p className="mt-2 max-w-md font-mono text-xs break-words text-muted-foreground">{errorMessage(error)}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw /> {t('states.retry')}
        </Button>
      )}
    </div>
  );
}

export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  const { t } = useTranslation('data');
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{t('states.loading')}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-5 h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Signed change with direction colour: up = more risk (danger), down = less risk (success). */
export function Delta({ value, className }: { value: number | null | undefined; className?: string }) {
  const { t } = useTranslation('data');
  if (value == null) return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  if (value === 0)
    return (
      <span className={cn('num text-[11px] font-medium text-muted-foreground', className)} aria-label={t('delta.none')}>
        ±0.0
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={cn('num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', up ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success', className)}
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

export function LevelBadge({ unit, className }: { unit: Pick<Unit, 'level'> | null | undefined; className?: string }) {
  const { t } = useTranslation('data');
  if (!unit) return null;
  return (
    <Badge variant={unit.level === 'source' ? 'default' : 'secondary'} className={className}>
      {t(`levels.${unit.level}`)}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { t } = useTranslation('data');
  const variant = role === 'pmo' || role === 'admin' ? 'default' : role === 'sector' ? 'success' : 'secondary';
  return (
    <Badge variant={variant} className={className}>
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

export function Callout({
  tone = 'info',
  icon,
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const toneCls = {
    info: 'border-primary/20 bg-primary/5 [&_.callout-icon]:text-primary',
    warning: 'border-warning/30 bg-warning/5 [&_.callout-icon]:text-warning',
    danger: 'border-danger/30 bg-danger/5 [&_.callout-icon]:text-danger',
    success: 'border-success/30 bg-success/5 [&_.callout-icon]:text-success',
  }[tone];
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', toneCls, className)}>
      <span className="callout-icon mt-0.5 shrink-0 [&_svg]:size-4">{icon ?? <Info />}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('leading-relaxed text-muted-foreground', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}

/** Styled native checkbox (accessible, keyboard-friendly, themed). */
export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn('size-4 shrink-0 cursor-pointer rounded border-input accent-primary', className)} {...props} />;
}
