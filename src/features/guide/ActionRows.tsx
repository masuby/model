/**
 * The Guide Book's rows as every surface shows them: a hazard or a group with its level badge, then each
 * row's impact and its actions in the reader's language, folded past the first rows.
 */
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatScore } from '@/lib/utils';
import type { ActionRow, GroupCommunication, HazardCommunication } from './actions';
import { LevelBadge } from './AlertBadge';
import { hazardItemName } from './crosswalk';
import { pick, pickList } from './data';

export function ActionList({ rows, first = 3, dense = false, className }: { rows: readonly ActionRow[]; first?: number; dense?: boolean; className?: string }) {
  const { t, i18n } = useTranslation('guide');
  const [all, setAll] = React.useState(false);
  const shown = all ? rows : rows.slice(0, first);
  if (!rows.length) return <p className={cn(dense ? 'text-[12px]' : 'text-sm', 'text-muted-foreground', className)}>{t('actions.none')}</p>;
  return (
    <div className={className}>
      <ul className={cn('divide-y divide-border/70', dense ? 'text-[12px] leading-snug' : 'text-sm leading-relaxed')}>
        {shown.map((r, i) => {
          const impact = pick(r.impact, i18n.language);
          return (
            <li key={i} className={dense ? 'py-1' : 'py-2'}>
              {impact && <p className="font-medium">{impact}</p>}
              <ul className={cn('list-disc pl-4', impact && 'mt-0.5')}>
                {pickList(r.actions, i18n.language).map((a, j) => (
                  <li key={j}>{a}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      {rows.length > first && !dense && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline print:hidden">
          <ChevronDown className={cn('size-4 transition-transform', all && 'rotate-180')} aria-hidden />
          {all ? t('actions.less') : t('actions.more', { count: rows.length })}
        </button>
      )}
    </div>
  );
}

/** One hazard: its name, its level, and its rows. */
export function HazardActions({ hazard, coastal, first = 3, dense = false }: { hazard: HazardCommunication; coastal: boolean; first?: number; dense?: boolean }) {
  const { t } = useTranslation(['guide', 'common', 'indicators']);
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('font-semibold', dense && 'text-[12px]')}>{hazardItemName(t, hazard.item, coastal)}</span>
        {hazard.item.score != null && <span className="num text-xs text-muted-foreground">{formatScore(hazard.item.score)}</span>}
        <LevelBadge level={hazard.level} size="sm" />
        {!hazard.own && <span className="text-xs text-muted-foreground">{t('actions.areaLevel')}</span>}
        {hazard.rows.some((r) => r.from === 'council') && <span className="text-xs text-muted-foreground">{t('actions.council')}</span>}
      </p>
      <ActionList rows={hazard.rows} first={first} dense={dense} className="mt-1" />
    </div>
  );
}

/** One vulnerability or coping group: its name, score and level, the guide's statement, and its rows. */
export function GroupActions({ group, first = 2, dense = false, intro = true }: { group: GroupCommunication; first?: number; dense?: boolean; intro?: boolean }) {
  const { t, i18n } = useTranslation(['guide', 'common', 'indicators']);
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('font-semibold', dense && 'text-[12px]')}>{t(`indicators:${group.key}`)}</span>
        <span className="num text-xs text-muted-foreground">
          {t(`common:dimensions.${group.dim}Short`)} · {formatScore(group.score)}
        </span>
        <LevelBadge level={group.level} size="sm" />
      </p>
      {intro && group.guide && <p className={cn('mt-1 text-muted-foreground', dense ? 'text-[12px] leading-snug' : 'text-sm leading-relaxed')}>{pick(group.guide.intro, i18n.language)}</p>}
      <ActionList rows={group.rows} first={first} dense={dense} className="mt-1" />
    </div>
  );
}
