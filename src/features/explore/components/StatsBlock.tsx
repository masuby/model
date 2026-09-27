/** Summary statistics for the current level × metric: mean, lowest, highest, national, distribution. */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { rampColor } from '@/engine/risk/metrics';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { computeStats } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';

/**
 * `panel`: the whole level, with the national figure and its class. `strip`: one line above the ranking
 * table; pass the table's rows as `units` so mean, lowest and highest follow its filters.
 */
export function StatsBlock({ variant = 'panel', units, className }: { variant?: 'panel' | 'strip'; units?: readonly Unit[]; className?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { model, metric, stats: levelStats, actions } = useExplore();
  const stats = React.useMemo(() => (units ? computeStats(units, metric) : levelStats), [units, metric, levelStats]);
  const national = metric.get(model.national);
  const cells = [
    { key: 'mean', label: t('stats.mean'), value: stats.mean, unit: null },
    { key: 'min', label: t('stats.min'), value: stats.min?.value ?? null, unit: stats.min?.unit ?? null },
    { key: 'max', label: t('stats.max'), value: stats.max?.value ?? null, unit: stats.max?.unit ?? null },
  ];
  const missing = stats.total - stats.withData;

  if (variant === 'strip') {
    return (
      <div className={cn('flex flex-wrap items-center gap-x-8 gap-y-2 text-sm', className)}>
        {cells.map((c) => (
          <div key={c.key} className="flex min-w-0 items-baseline gap-2">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="num font-semibold">{formatScore(c.value)}</span>
            {c.unit && (
              <button type="button" onClick={() => actions.select(c.unit!, { focus: true })} className="max-w-44 truncate text-muted-foreground hover:text-primary hover:underline">
                {c.unit.name}
              </button>
            )}
          </div>
        ))}
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground">{t('stats.national')}</span>
          <span className="num font-semibold">{formatScore(national)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <dl className="grid grid-cols-3 divide-x divide-border">
        {cells.map((c, i) => (
          <div key={c.key} className={cn('min-w-0', i === 0 ? 'pr-3' : i === 2 ? 'pl-3' : 'px-3')}>
            <dt className="text-xs text-muted-foreground">{c.label}</dt>
            <dd className="num mt-1 text-2xl leading-none font-semibold tracking-tight">{formatScore(c.value)}</dd>
            <dd className="mt-1.5 min-w-0">
              {c.unit ? (
                <button
                  type="button"
                  onClick={() => actions.select(c.unit!, { focus: true })}
                  className="block w-full text-left text-xs leading-snug text-muted-foreground transition-colors hover:text-primary hover:underline"
                  title={c.unit.name}
                >
                  <span className="line-clamp-2">{c.unit.name}</span>
                </button>
              ) : (
                <span className="block truncate text-xs text-muted-foreground">{t('stats.areas', { count: stats.withData })}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">{t('stats.national')}</span>
        <span className="flex items-center gap-2.5">
          <b className="num font-semibold">{formatScore(national)}</b>
          {metric.scale && <ClassBadge value={national} scale={metric.scale} size="sm" />}
        </span>
      </div>
      {missing > 0 && <p className="mt-3 text-xs text-muted-foreground">{t('stats.missing', { count: missing })}</p>}
    </div>
  );
}

/** Histogram of the indicator lens on the 0–10 ramp, in five bins (class lenses use the legend rows). */
export function Distribution({ className }: { className?: string }) {
  const { t } = useTranslation('explore');
  const { stats } = useExplore();
  const max = Math.max(1, ...stats.bins);
  const labels = ['0–2', '2–4', '4–6', '6–8', '8–10'];
  const summary = stats.bins.map((n, i) => `${labels[i]}: ${n}`).join(', ');
  return (
    <div className={className}>
      <div className="mb-2 text-xs text-muted-foreground">{t('stats.distribution')}</div>
      <div role="img" aria-label={`${t('stats.distribution')}: ${summary}`} className="grid h-20 grid-cols-5 items-end gap-1 border-b border-border">
        {stats.bins.map((n, i) => (
          <div key={i} className="flex h-full flex-col justify-end" title={`${labels[i]}: ${n}`}>
            <span className="num mb-1 text-center text-xs text-muted-foreground">{n}</span>
            <div style={{ height: `${Math.max(n ? 6 : 2, (n / max) * 70)}%`, background: rampColor(i * 2 + 1) }} />
          </div>
        ))}
      </div>
      <div className="num mt-1.5 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
