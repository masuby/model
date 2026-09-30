/**
 * Comparison of up to three pinned areas: risk and the three dimensions as class-coloured bars. A small
 * table - the row labels once on the left, one column per area separated by vertical rules. It floats
 * over the map, docks under the ranking table, and sits above the bottom sheet on mobile.
 */
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { classify, NO_DATA_COLOR, type Scale } from '@/engine/risk/classes';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { MAX_COMPARE } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';

const ROWS: Array<{ key: 'risk' | 'hazard' | 'vulnerability' | 'coping'; scale: Scale; get: (u: Unit) => number | null }> = [
  { key: 'risk', scale: 'risk', get: (u) => u.risk },
  { key: 'hazard', scale: 'hazard', get: (u) => u.dims.hazard.score },
  { key: 'vulnerability', scale: 'vulnerability', get: (u) => u.dims.vulnerability.score },
  { key: 'coping', scale: 'coping', get: (u) => u.dims.coping.score },
];

export function CompareTray({
  className,
  placement = 'floating',
  defaultCollapsed = false,
}: {
  className?: string;
  placement?: 'floating' | 'docked';
  defaultCollapsed?: boolean;
}) {
  const { t } = useTranslation(['explore', 'common']);
  const { compare, selected, actions } = useExplore();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const bodyId = React.useId();
  const rowLabel = (key: string) => (key === 'risk' ? t('abbr.risk') : t(`common:dimensions.${key}Short`));
  const rowTitle = (key: string) => (key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}`));
  const docked = placement === 'docked';

  return (
    <div role="region" aria-label={t('compare.title')} className={cn(docked ? 'border-t border-border bg-background' : 'glass rounded-lg', className)}>
      <div className={cn('flex items-center gap-3 py-1.5 pr-1.5', docked ? 'pl-4 sm:pl-6 lg:pl-8' : 'pl-4', !collapsed && 'border-b border-border')}>
        <span className="shrink-0 text-sm font-semibold">{t('compare.title')}</span>
        <span className="num shrink-0 text-xs text-muted-foreground">
          {compare.length}/{MAX_COMPARE}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{collapsed && compare.map((u) => u.name).join(' · ')}</span>
        <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={actions.clearCompare}>
          {t('compare.clear')}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 shrink-0"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? t('compare.expand') : t('compare.collapse')}
        >
          {collapsed ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
      {!collapsed && (
        <div id={bodyId} className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t('compare.title')}</caption>
            <thead>
              <tr>
                <td className={cn('w-0', docked ? 'pl-4 sm:pl-6 lg:pl-8' : 'pl-4')} />
                {compare.map((u) => {
                  const isSel = selected?.id === u.id;
                  return (
                    <th key={u.id} scope="col" className="min-w-32 border-l border-border px-4 pt-3 pb-2 text-left align-top font-normal">
                      <div className="flex items-start gap-1">
                        <button
                          type="button"
                          onClick={() => actions.select(u, { focus: true })}
                          aria-current={isSel ? 'true' : undefined}
                          className="group min-w-0 flex-1 text-left"
                        >
                          <span className={cn('block truncate text-sm font-semibold group-hover:underline group-hover:underline-offset-4', isSel && 'text-primary')}>{u.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {u.level === 'region' ? t('common:levels.region') : `${t(`common:levels.${u.level}`)} · ${u.region}`}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => actions.removeCompare(u.id)}
                          aria-label={t('compare.remove', { name: u.name })}
                          className="-mt-0.5 -mr-1.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>*]:pb-3.5">
              {ROWS.map((r) => (
                <tr key={r.key}>
                  <th
                    scope="row"
                    title={rowTitle(r.key)}
                    className={cn('py-1 pr-4 text-left text-xs font-normal whitespace-nowrap text-muted-foreground', docked ? 'pl-4 sm:pl-6 lg:pl-8' : 'pl-4')}
                  >
                    {rowLabel(r.key)}
                  </th>
                  {compare.map((u) => {
                    const v = r.get(u);
                    const c = classify(v, r.scale);
                    const pct = typeof v === 'number' ? Math.max(0, Math.min(100, v * 10)) : 0;
                    return (
                      <td key={u.id} className="border-l border-border px-4 py-1">
                        <span className="flex items-center gap-2.5">
                          <span aria-hidden className="relative h-1.5 min-w-0 flex-1 bg-muted">
                            <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: c?.color ?? NO_DATA_COLOR }} />
                          </span>
                          <span className="num w-7 shrink-0 text-right">{formatScore(v)}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
