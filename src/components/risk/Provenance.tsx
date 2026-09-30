/**
 * Where a value comes from, in words: the kind of source (a Tanzanian institution or a global dataset)
 * and the level a measured figure was recorded at (council, region, the whole country, or the INFORM
 * baseline). Labels live in the bundled `common` catalogue, so any page can show them.
 */
import { useTranslation } from 'react-i18next';
import { isNum } from '@/engine/risk/math';
import type { ValueLevel } from '@/engine/risk/types';
import { cn, formatNumber, NO_VALUE } from '@/lib/utils';

/** A measured value in its natural unit, with as many decimals as its size needs. */
export function formatRaw(v: number | null | undefined, lang: string): string {
  if (!isNum(v)) return NO_VALUE;
  const a = Math.abs(v);
  const digits = a === 0 ? 0 : a < 1 ? 3 : a < 100 ? 2 : a < 10_000 ? 1 : 0;
  return formatNumber(v, lang, { maximumFractionDigits: digits });
}

/** "Council figure", "Regional figure", "National figure" or "INFORM baseline". */
export function LevelTag({ level, className }: { level: ValueLevel; className?: string }) {
  const { t } = useTranslation('common');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-1.5 py-px text-[11px] leading-4 font-medium whitespace-nowrap',
        level === 'baseline' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
        className,
      )}
    >
      {t(`valueLevel.${level}`)}
    </span>
  );
}

/** "Global dataset" for international sources, "Tanzanian institution" otherwise. */
export function SourceKindTag({ kind, className }: { kind: 'national' | 'global'; className?: string }) {
  const { t } = useTranslation('common');
  return <span className={cn('text-xs whitespace-nowrap text-muted-foreground', className)}>{t(`sourceKind.${kind}`)}</span>;
}
