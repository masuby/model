/**
 * The Guide Book's rows as every surface shows them: a hazard or a group with its level badge, then each
 * row's impact and its actions in the reader's language, folded past the first rows.
 */
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSION_BY_KEY } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { cn, formatScore } from '@/lib/utils';
import type { ActionRow, GroupCommunication, HazardCommunication } from './actions';
import { bandFor, hazardItemName } from './crosswalk';
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

/** One hazard: its name, its INFORM class and score, and its rows. */
export function HazardActions({ hazard, coastal, first = 3, dense = false }: { hazard: HazardCommunication; coastal: boolean; first?: number; dense?: boolean }) {
  const { t } = useTranslation(['guide', 'common', 'indicators']);
  const band = bandFor(hazard.item.score);
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('font-semibold', dense && 'text-[12px]')}>{hazardItemName(t, hazard.item, coastal)}</span>
        {band && (
          <span className="num text-xs text-muted-foreground">
            {t(`common:classes.${band}`)} · {formatScore(hazard.item.score)}
          </span>
        )}
        {hazard.rows.some((r) => r.from === 'council') && <span className="text-xs text-muted-foreground">{t('actions.council')}</span>}
      </p>
      <ActionList rows={hazard.rows} first={first} dense={dense} className="mt-1" />
    </div>
  );
}

/** One vulnerability or coping group: its name, dimension, class and score, the guide's statement, and its rows. */
export function GroupActions({ group, first = 2, dense = false, intro = true }: { group: GroupCommunication; first?: number; dense?: boolean; intro?: boolean }) {
  const { t, i18n } = useTranslation(['guide', 'common', 'indicators']);
  const band = bandFor(group.score);
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('font-semibold', dense && 'text-[12px]')}>{t(`indicators:${group.key}`)}</span>
        <span className="num text-xs text-muted-foreground">
          {t(`common:dimensions.${group.dim}Short`)} · {band ? `${t(`common:classes.${band}`)} · ` : ''}
          {formatScore(group.score)}
        </span>
      </p>
      {intro && group.guide && <p className={cn('mt-1 text-muted-foreground', dense ? 'text-[12px] leading-snug' : 'text-sm leading-relaxed')}>{pick(group.guide.intro, i18n.language)}</p>}
      <ActionList rows={group.rows} first={first} dense={dense} className="mt-1" />
    </div>
  );
}

/** A chip of a chooser: the item's name with its colour and score; pressed when chosen. */
function Chip({ on, color, label, score, onClick }: { on: boolean; color: string; label: string; score: number | null; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors', on ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted')}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span>{label}</span>
      {score != null && <span className="num">{formatScore(score)}</span>}
    </button>
  );
}

/** Choose a hazard, read its rows: one chip per hazard (the highest first and chosen), the chosen one's rows below. */
export function HazardChooser({ hazards, coastal, first = 3, dense = false }: { hazards: readonly HazardCommunication[]; coastal: boolean; first?: number; dense?: boolean }) {
  const { t } = useTranslation(['guide', 'common', 'indicators']);
  const [key, setKey] = React.useState<string | null>(null);
  const current = hazards.find((h) => h.item.key === key) ?? hazards[0];
  if (!current) return null;
  return (
    <div>
      <div role="group" aria-label={t('actions.choose')} className="flex flex-wrap gap-1.5">
        {hazards.map((h) => (
          <Chip
            key={h.item.key}
            on={h.item.key === current.item.key}
            color={h.item.score != null ? rampColor(h.item.score, 'hazard') : NO_DATA_COLOR}
            label={hazardItemName(t, h.item, coastal)}
            score={h.item.score}
            onClick={() => setKey(h.item.key)}
          />
        ))}
      </div>
      <div className="mt-3">
        <HazardActions hazard={current} coastal={coastal} first={first} dense={dense} />
      </div>
    </div>
  );
}

/** Choose a vulnerability or coping group, read what it measures and its rows; `extra` renders beneath the chosen group (the library's entry). */
export function GroupChooser({ groups, first = 2, dense = false, intro = true, extra }: { groups: readonly GroupCommunication[]; first?: number; dense?: boolean; intro?: boolean; extra?: (group: GroupCommunication) => React.ReactNode }) {
  const { t } = useTranslation(['guide', 'common', 'indicators']);
  const [ref, setRef] = React.useState<string | null>(null);
  const current = groups.find((g) => g.ref === ref) ?? groups[0];
  if (!current) return null;
  return (
    <div>
      <div role="group" aria-label={t('groups.choose')} className="flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <Chip key={g.ref} on={g.ref === current.ref} color={rampColor(g.score, DIMENSION_BY_KEY[g.dim].scale)} label={t(`indicators:${g.key}`)} score={g.score} onClick={() => setRef(g.ref)} />
        ))}
      </div>
      <div className="mt-3">
        <GroupActions group={current} first={first} dense={dense} intro={intro} />
        {extra?.(current)}
      </div>
    </div>
  );
}
