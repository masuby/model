import { useTranslation } from 'react-i18next';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';

/** Horizontal bars for the three dimensions, each coloured by its own class thresholds. */
export function DimensionBars({ unit, compare, className, compact = false }: { unit: Unit; compare?: Unit | null; className?: string; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-col', compact ? 'gap-2.5' : 'gap-4', className)}>
      {DIMENSIONS.map((d) => (
        <ScoreBar
          key={d.key}
          label={t(`dimensions.${d.key}`)}
          value={unit.dims[d.key].score}
          dim={d.key}
          reference={compare?.dims[d.key].score}
          referenceLabel={compare?.name}
          compact={compact}
        />
      ))}
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  dim,
  reference,
  referenceLabel,
  compact,
  max = 10,
  hint,
}: {
  label: string;
  value: number | null | undefined;
  dim?: DimensionKey | 'risk';
  reference?: number | null;
  referenceLabel?: string;
  compact?: boolean;
  max?: number;
  hint?: React.ReactNode;
}) {
  const scale = dim === 'risk' || !dim ? 'risk' : DIMENSIONS.find((d) => d.key === dim)!.scale;
  const c = classify(value, scale);
  const pct = typeof value === 'number' ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{label}</span>
        <span className="num flex items-baseline gap-1.5">
          {hint}
          <span className={cn('num font-semibold', compact ? 'text-sm' : 'text-base')}>{formatScore(value)}</span>
        </span>
      </div>
      <div className={cn('relative w-full overflow-visible bg-muted', compact ? 'h-1' : 'h-1.5')}>
        <div className="h-full transition-[width] duration-150" style={{ width: `${pct}%`, background: c?.color ?? NO_DATA_COLOR }} />
        {typeof reference === 'number' && (
          <span
            title={referenceLabel ? `${referenceLabel}: ${formatScore(reference)}` : formatScore(reference)}
            className="absolute top-1/2 h-[260%] w-px -translate-y-1/2 bg-foreground/80"
            style={{ left: `${(reference / max) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
