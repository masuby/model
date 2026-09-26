import { useTranslation } from 'react-i18next';
import { CLASS_COLORS, CLASS_KEYS, classRanges, NO_DATA_COLOR, type ClassKey, type Scale } from '@/engine/risk/classes';
import { RAMP_STOPS } from '@/engine/risk/metrics';
import { cn } from '@/lib/utils';

/** Legend for a class scale. Clickable entries act as a class filter when `onToggle` is given. */
export function ClassLegend({
  scale = 'risk',
  counts,
  active,
  onToggle,
  className,
  orientation = 'vertical',
}: {
  scale?: Scale;
  counts?: Partial<Record<ClassKey, number>>;
  active?: ClassKey | null;
  onToggle?: (k: ClassKey | null) => void;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}) {
  const { t } = useTranslation();
  const ranges = classRanges(scale);
  return (
    <ul className={cn(orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex flex-wrap gap-1.5', className)}>
      {[...CLASS_KEYS].reverse().map((k) => {
        const i = CLASS_KEYS.indexOf(k);
        const isActive = active === k;
        const dim = active && !isActive;
        const content = (
          <>
            <span className="inline-block size-2.5 shrink-0 rounded-[2px]" style={{ background: CLASS_COLORS[k] }} />
            <span className="flex-1 truncate text-left">{t(`classes.${k}`)}</span>
            <span className="num text-[11px] text-muted-foreground">{counts ? (counts[k] ?? 0) : ranges[i]}</span>
          </>
        );
        return (
          <li key={k}>
            {onToggle ? (
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onToggle(isActive ? null : k)}
                className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium transition-all hover:bg-muted', isActive && 'bg-muted ring-1 ring-border', dim && 'opacity-40')}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium">{content}</div>
            )}
          </li>
        );
      })}
      <li className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
        <span className="inline-block size-2.5 shrink-0 rounded-[2px]" style={{ background: NO_DATA_COLOR }} />
        {t('classes.noData')}
      </li>
    </ul>
  );
}

/** Continuous 0–10 legend used for single-indicator lenses. */
export function RampLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${RAMP_STOPS.join(',')})` }} />
      <div className="num flex justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span>2.5</span>
        <span>5</span>
        <span>7.5</span>
        <span>10</span>
      </div>
    </div>
  );
}
