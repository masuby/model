/** Compact comparison of up to three pinned areas: risk and the three dimensions as class-coloured bars. */
import { ChevronDown, ChevronUp, GitCompareArrows, X } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { Scale } from '@/engine/risk/classes';
import type { Unit } from '@/engine/risk/types';
import { cn } from '@/lib/utils';
import { MAX_COMPARE } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { MiniBar } from './bits';

const ROWS: Array<{ key: string; abbr: string; scale: Scale; get: (u: Unit) => number | null }> = [
  { key: 'risk', abbr: 'risk', scale: 'risk', get: (u) => u.risk },
  { key: 'hazard', abbr: 'hazard', scale: 'hazard', get: (u) => u.dims.hazard.score },
  { key: 'vulnerability', abbr: 'vulnerability', scale: 'vulnerability', get: (u) => u.dims.vulnerability.score },
  { key: 'coping', abbr: 'coping', scale: 'coping', get: (u) => u.dims.coping.score },
];

export function CompareTray({ className, defaultCollapsed = false }: { className?: string; defaultCollapsed?: boolean }) {
  const { t } = useTranslation(['explore', 'common']);
  const { compare, selected, actions } = useExplore();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const bodyId = React.useId();
  const best = ROWS.map((r) => Math.max(...compare.map((u) => r.get(u) ?? -Infinity)));
  const label = (key: string) => (key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}`));

  return (
    <motion.div
      role="region"
      aria-label={t('compare.title')}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn('rounded-2xl border border-border/70 bg-card/90 shadow-[var(--shadow-lift)] backdrop-blur-xl', className)}
    >
      <div className="flex items-center gap-2 py-1.5 pr-1.5 pl-3">
        <GitCompareArrows className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="shrink-0 text-sm font-semibold">{t('compare.title')}</span>
        <span className="num shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
          {compare.length}/{MAX_COMPARE}
        </span>
        <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
          {collapsed &&
            compare.map((u) => (
              <span key={u.id} className="truncate rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                {u.name}
              </span>
            ))}
        </div>
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
        <div
          id={bodyId}
          className="grid gap-2 overflow-x-auto overscroll-x-contain px-2.5 pb-2.5 [scrollbar-width:thin]"
          style={{ gridTemplateColumns: `repeat(${compare.length}, minmax(9.5rem, 1fr))` }}
        >
          {compare.map((u) => (
            <div key={u.id} className={cn('min-w-0 rounded-xl border border-border/70 bg-background/60 p-2.5', selected?.id === u.id && 'ring-2 ring-primary/40')}>
              <div className="flex items-start gap-1">
                <button type="button" onClick={() => actions.select(u, { focus: true })} className="min-w-0 flex-1 rounded-md text-left hover:text-primary">
                  <span className="block truncate text-[13px] font-semibold">{u.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {u.level === 'region' ? t('common:levels.region') : `${t(`common:levels.${u.level}`)} · ${u.region}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => actions.removeCompare(u.id)}
                  aria-label={t('compare.remove', { name: u.name })}
                  className="-mt-0.5 -mr-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {ROWS.map((r, i) => {
                  const v = r.get(u);
                  return <MiniBar key={r.key} label={t(`abbr.${r.abbr}`)} title={label(r.key)} value={v} scale={r.scale} emphasize={compare.length > 1 && v != null && v === best[i]} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
