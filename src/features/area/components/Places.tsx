/**
 * Ranked place lists (siblings, member councils, related units): a short summary row of figures and a
 * ruled ranked list, set directly on the page. The current area is marked in text and with a left rule
 * (every row carries the same rule, transparent, so the columns stay aligned within the list's edges).
 */
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import type { AreaView, PlaceList } from '../lib';
import { SubHeading } from './bits';

function Row({ u, rank, current }: { u: Unit; rank: number; current: boolean }) {
  const { t } = useTranslation(['area', 'common']);
  const c = classify(u.risk);
  const inner = (
    <>
      <span className="num text-sm text-muted-foreground">{rank}</span>
      <span className="min-w-0">
        <span className={cn('block truncate', current ? 'font-semibold' : 'font-medium group-hover:text-primary group-hover:underline group-hover:underline-offset-4')}>{u.name}</span>
        {(current || u.inheritedFrom) && (
          <span className="block truncate text-xs text-muted-foreground">
            {current && t('places.thisArea')}
            {current && u.inheritedFrom && ' · '}
            {u.inheritedFrom && t('places.inherits', { parent: u.inheritedFrom })}
          </span>
        )}
      </span>
      <span className="hidden h-1.5 bg-muted sm:block" aria-hidden>
        <span className="block h-full" style={{ width: `${((u.risk ?? 0) / 10) * 100}%`, background: c?.color ?? NO_DATA_COLOR }} />
      </span>
      <span className="num text-right font-semibold">
        {formatScore(u.risk)}
        <span className="sr-only"> {c ? t(`common:classes.${c.key}`) : t('common:classes.noData')}</span>
      </span>
    </>
  );
  const grid = 'grid grid-cols-[1.75rem_minmax(0,1fr)_2.75rem] items-center gap-x-4 border-l-2 py-3 pl-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_7rem_2.75rem]';
  return (
    <li className="break-inside-avoid border-b border-border">
      {current ? (
        <div aria-current="page" className={cn(grid, 'border-foreground')}>
          {inner}
        </div>
      ) : (
        <Link to={`/area/${u.id}`} className={cn(grid, 'group border-transparent')}>
          {inner}
        </Link>
      )}
    </li>
  );
}

function PlaceBlock({ list, view, wide }: { list: PlaceList; view: AreaView; wide: boolean }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, region } = view;
  const stats = React.useMemo(() => {
    const scores = list.units.map((u) => u.risk).filter(isNum);
    return {
      avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      min: scores.length ? Math.min(...scores) : null,
      max: scores.length ? Math.max(...scores) : null,
    };
  }, [list]);
  const regionName = unit.level === 'region' ? unit.name : unit.region;
  const long = list.units.length > 12;
  const summary = [
    { label: t('places.count'), value: list.units.length },
    { label: t('places.average'), value: formatScore(stats.avg) },
    { label: t('places.range'), value: `${formatScore(stats.min)}–${formatScore(stats.max)}` },
  ];

  return (
    // A single list gets a summary column beside it; several lists stack their summary above.
    <div className={cn(wide && 'grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-16')}>
      <div>
        <SubHeading title={t(`places.${list.kind}.title`, { region: regionName, name: unit.name })} lead={t(`places.${list.kind}.desc`, { region: regionName, name: unit.name })} />
        <dl className={cn('mt-6 divide-y divide-border border-y border-border text-sm', !wide && 'max-w-sm')}>
          {summary.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{s.label}</dt>
              <dd className="num text-base font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
        {list.kind === 'siblings' && region && (
          <Button variant="outline" size="sm" asChild className="no-print mt-6">
            <Link to={`/area/${region.id}`}>
              {t('places.regionProfile')} <ArrowRight />
            </Link>
          </Button>
        )}
        {list.kind === 'members' && <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{t('places.membersNote')}</p>}
      </div>

      <ol className={cn('border-t border-border', !wide && 'mt-8', long && wide && 'xl:columns-2 xl:gap-x-12')}>
        {list.units.map((u, i) => (
          <Row key={u.id} u={u} rank={i + 1} current={u.id === unit.id} />
        ))}
      </ol>
    </div>
  );
}

export function Places({ view, lists }: { view: AreaView; lists: PlaceList[] }) {
  if (!lists.length) return null;
  const wide = lists.length === 1;
  return (
    <div className={cn('grid gap-16', !wide && 'lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border')}>
      {lists.map((l, i) => (
        <div key={l.kind} className={cn(!wide && (i === 0 ? 'lg:pr-12' : 'lg:pl-12'))}>
          <PlaceBlock list={l} view={view} wide={wide} />
        </div>
      ))}
    </div>
  );
}
