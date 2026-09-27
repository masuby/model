import { useTranslation } from 'react-i18next';
import { classify, NO_DATA_COLOR, type Scale } from '@/engine/risk/classes';
import { cn, formatScore } from '@/lib/utils';

/**
 * Readable text colour on a class fill (WCAG AA ≥ 4.5:1): near-black on every class except Very High,
 * whose deep red takes white. Unknown fills (no data) take near-black on the neutral grey.
 */
export const onClassColor = (hex: string) => (hex.toLowerCase() === '#d73027' ? '#ffffff' : '#0b1324');

export function ClassDot({ value, scale = 'risk', className }: { value: number | null | undefined; scale?: Scale; className?: string }) {
  const c = classify(value, scale);
  return <span className={cn('inline-block size-2.5 shrink-0 rounded-full ring-2 ring-black/5', className)} style={{ background: c?.color ?? NO_DATA_COLOR }} aria-hidden />;
}

/** Pill with the class name (and optionally the score), coloured by the INFORM class. */
export function ClassBadge({
  value,
  scale = 'risk',
  showScore = false,
  size = 'md',
  className,
}: {
  value: number | null | undefined;
  scale?: Scale;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { t } = useTranslation();
  const c = classify(value, scale);
  const bg = c?.color ?? NO_DATA_COLOR;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{ background: bg, color: onClassColor(bg) }}
    >
      {showScore && <span className="num">{formatScore(value)}</span>}
      {c ? t(`classes.${c.key}`) : t('classes.noData')}
    </span>
  );
}
