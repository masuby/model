/** Summary statistics for the current level × metric: mean, lowest, highest, national, distribution. */
import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { CLASS_COLORS, CLASS_KEYS } from '@/engine/risk/classes';
import { rampColor } from '@/engine/risk/metrics';
import { cn, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { MetricDot } from './bits';

export function StatsBlock({ variant = 'panel', className }: { variant?: 'panel' | 'strip'; className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { model, metric, stats, actions } = useExplore();
  const national = metric.get(model.national);
  const cells = [
    { key: 'mean', label: t('stats.mean'), value: stats.mean, unit: null },
    { key: 'min', label: t('stats.min'), value: stats.min?.value ?? null, unit: stats.min?.unit ?? null },
    { key: 'max', label: t('stats.max'), value: stats.max?.value ?? null, unit: stats.max?.unit ?? null },
  ];
  const missing = stats.total - stats.withData;

  if (variant === 'strip') {
    return (
      <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 text-xs', className)}>
        {cells.map((c) => (
          <div key={c.key} className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="num font-display text-sm font-bold">{formatScore(c.value)}</span>
            {c.unit && (
              <button type="button" onClick={() => actions.select(c.unit!, { focus: true })} className="max-w-40 truncate text-muted-foreground hover:text-primary">
                {c.unit.name}
              </button>
            )}
          </div>
        ))}
        <div className="flex items-baseline gap-1.5">
          <span className="text-muted-foreground">{t('stats.national')}</span>
          <span className="num font-display text-sm font-bold">{formatScore(national)}</span>
        </div>
        <Distribution className="max-w-sm min-w-48 flex-1" compact />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.key} className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="text-[11px] font-medium text-muted-foreground">{c.label}</div>
            <div className="num mt-0.5 flex items-center gap-1.5 font-display text-xl font-extrabold tracking-tight">
              <MetricDot metric={metric} value={c.value} className="size-2" />
              {formatScore(c.value)}
            </div>
            {c.unit ? (
              <button
                type="button"
                onClick={() => actions.select(c.unit!, { focus: true })}
                className="block w-full truncate text-left text-[11px] text-muted-foreground transition-colors hover:text-primary"
                title={c.unit.name}
              >
                {c.unit.name}
              </button>
            ) : (
              <div className="text-[11px] text-muted-foreground">{t('stats.areas', { count: stats.withData })}</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Landmark className="size-3.5" aria-hidden />
          {t('stats.national')}
        </span>
        <span className="flex items-center gap-2">
          <b className="num font-display text-sm">{formatScore(national)}</b>
          {metric.scale && <ClassBadge value={national} scale={metric.scale} size="sm" />}
        </span>
      </div>
      <Distribution className="mt-3" />
      {missing > 0 && <p className="mt-2 text-[11px] text-muted-foreground">{t('stats.missing', { count: missing })}</p>}
    </div>
  );
}

/** Stacked class bar for class metrics; a 5-bin histogram on the 0–10 ramp for indicators. */
export function Distribution({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useTranslation(['explore', 'common']);
  const { stats } = useExplore();

  if (stats.classCounts) {
    const counts = stats.classCounts;
    const total = CLASS_KEYS.reduce((s, k) => s + counts[k], 0) || 1;
    const summary = CLASS_KEYS.map((k) => `${t(`common:classes.${k}`)} ${counts[k]}`).join(', ');
    return (
      <div className={className}>
        {!compact && <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">{t('stats.distribution')}</div>}
        <div role="img" aria-label={`${t('stats.distribution')}: ${summary}`} className={cn('flex overflow-hidden rounded-full bg-muted', compact ? 'h-2' : 'h-3')}>
          {CLASS_KEYS.map((k) =>
            counts[k] ? (
              <div
                key={k}
                className="h-full transition-[width] duration-500 ease-out first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(counts[k] / total) * 100}%`, background: CLASS_COLORS[k] }}
                title={`${t(`common:classes.${k}`)}: ${counts[k]}`}
              />
            ) : null,
          )}
        </div>
      </div>
    );
  }

  const max = Math.max(1, ...stats.bins);
  const labels = ['0–2', '2–4', '4–6', '6–8', '8–10'];
  const summary = stats.bins.map((n, i) => `${labels[i]}: ${n}`).join(', ');
  return (
    <div className={className}>
      {!compact && <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">{t('stats.distribution')}</div>}
      <div role="img" aria-label={`${t('stats.distribution')}: ${summary}`} className={cn('grid grid-cols-5 items-end gap-1.5', compact ? 'h-6' : 'h-16')}>
        {stats.bins.map((n, i) => (
          <div key={i} className="flex h-full flex-col justify-end" title={`${labels[i]}: ${n}`}>
            {!compact && <span className="num mb-0.5 text-center text-[10px] font-semibold text-muted-foreground">{n}</span>}
            <div className="rounded-t-md transition-[height] duration-500 ease-out" style={{ height: `${Math.max(n ? 8 : 3, (n / max) * (compact ? 100 : 72))}%`, background: rampColor(i * 2 + 1) }} />
          </div>
        ))}
      </div>
      {!compact && (
        <div className="num mt-1 grid grid-cols-5 gap-1.5 text-center text-[10px] text-muted-foreground">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
