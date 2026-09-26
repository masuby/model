import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ClassDot } from '@/components/risk/RiskBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { placeListsFor, type AreaView, type PlaceList } from '../lib';
import { Reveal } from './bits';

function Row({ u, rank, current }: { u: Unit; rank: number; current: boolean }) {
  const { t } = useTranslation(['area', 'common']);
  const c = classify(u.risk);
  const inner = (
    <>
      <span className="num w-6 shrink-0 text-right text-sm font-bold text-muted-foreground">{rank}</span>
      <ClassDot value={u.risk} />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate font-semibold', !current && 'group-hover:text-primary')}>{u.name}</div>
        {u.inheritedFrom && <div className="truncate text-xs text-muted-foreground">{t('places.inherits', { parent: u.inheritedFrom })}</div>}
      </div>
      {current && <Badge className="shrink-0">{t('places.thisArea')}</Badge>}
      <div className="hidden w-28 shrink-0 sm:block" aria-hidden>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${((u.risk ?? 0) / 10) * 100}%`, background: c?.color ?? NO_DATA_COLOR }} />
        </div>
      </div>
      <span className="num w-9 shrink-0 text-right font-display text-base font-bold">{formatScore(u.risk)}</span>
      <span className="sr-only">{c ? t(`common:classes.${c.key}`) : t('common:classes.noData')}</span>
      {current ? <span className="size-4 shrink-0" /> : <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </>
  );
  return (
    <li className="break-inside-avoid">
      {current ? (
        <div aria-current="page" className="flex items-center gap-3 rounded-xl bg-primary/8 px-3 py-2.5 ring-1 ring-primary/25">
          {inner}
        </div>
      ) : (
        <Link to={`/area/${u.id}`} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/70">
          {inner}
        </Link>
      )}
    </li>
  );
}

function PlaceCard({ list, view }: { list: PlaceList; view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, region } = view;
  const scores = list.units.map((u) => u.risk).filter(isNum);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const min = scores.length ? Math.min(...scores) : null;
  const max = scores.length ? Math.max(...scores) : null;
  const regionName = unit.level === 'region' ? unit.name : unit.region;
  const long = list.units.length > 12;

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-lg">{t(`places.${list.kind}.title`, { region: regionName, name: unit.name })}</CardTitle>
          <CardDescription className="mt-1">{t(`places.${list.kind}.desc`, { region: regionName, name: unit.name })}</CardDescription>
        </div>
        {list.kind === 'siblings' && region && (
          <Button variant="outline" size="sm" asChild className="no-print shrink-0">
            <Link to={`/area/${region.id}`}>
              {t('places.regionProfile')} <ArrowRight />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <dl className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-muted/50 px-4 py-3 text-center">
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('places.count')}</dt>
            <dd className="num font-display text-lg font-extrabold">{list.units.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('places.average')}</dt>
            <dd className="num font-display text-lg font-extrabold">{formatScore(avg)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('places.range')}</dt>
            <dd className="num font-display text-lg font-extrabold">
              {formatScore(min)}–{formatScore(max)}
            </dd>
          </div>
        </dl>
        <ol className={cn('grid gap-0.5', long && 'lg:block lg:columns-2 lg:gap-6')}>
          {list.units.map((u, i) => (
            <Row key={u.id} u={u} rank={i + 1} current={u.id === unit.id} />
          ))}
        </ol>
        {list.kind === 'members' && <p className="mt-4 text-xs text-muted-foreground">{t('places.membersNote')}</p>}
      </CardContent>
    </Card>
  );
}

export function Places({ view }: { view: AreaView }) {
  const lists = placeListsFor(view.model, view.unit).filter((l) => l.units.length > 0);
  if (!lists.length) return null;
  return (
    <div className={cn('grid gap-6', lists.length > 1 && 'lg:grid-cols-2')}>
      {lists.map((l, i) => (
        <Reveal key={l.kind} delay={i * 0.06} className="h-full">
          <PlaceCard list={l} view={view} />
        </Reveal>
      ))}
    </div>
  );
}
