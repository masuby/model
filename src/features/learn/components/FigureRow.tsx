import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Key figures separated by vertical hairlines, all on one row at every width (for 2–3 short figures).
 * `compact` suits a narrow column.
 */
export function FigureRow({ items, compact = false, className }: { items: Array<{ label: React.ReactNode; value: React.ReactNode }>; compact?: boolean; className?: string }) {
  return (
    <dl className={cn('grid divide-x divide-border', items.length === 2 ? 'grid-cols-2' : 'grid-cols-3', className)}>
      {items.map((f, i) => (
        <div key={i} className={cn('flex min-w-0 flex-col first:pl-0', compact ? 'px-4' : 'px-4 sm:px-6')}>
          <dt className="text-sm text-muted-foreground">{f.label}</dt>
          <dd className={cn('num mt-auto pt-1.5 font-semibold tracking-tight', compact ? 'text-2xl' : 'text-3xl sm:text-[2.1rem]')}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
