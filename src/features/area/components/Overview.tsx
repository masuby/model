import { Activity, Database, Gauge, Scale, ShieldAlert, Trophy } from 'lucide-react';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmented, Skeleton } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import { placeKey, topDrivers } from '@/engine/risk/model';
import { formatScore } from '@/lib/utils';
import { delta, placeListsFor, rankAmong, weakestDimension, type AreaView } from '../lib';
import { Reveal } from './bits';

const RiskMap = React.lazy(() => import('@/components/map/RiskMap'));

function LocatorMap({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit, model } = view;
  const [mode, setMode] = React.useState<'focus' | 'country'>('focus');
  const metric = React.useMemo(() => parseMetric('risk'), []);
  const isNational = unit.level === 'national';
  const level = isNational ? 'region' : unit.level;
  const selected = React.useMemo(() => (isNational ? [] : [unit.id]), [isNational, unit.id]);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t('map.title')}</CardTitle>
          <CardDescription className="mt-1">{isNational ? t('map.descNational') : t('map.desc', { name: unit.name })}</CardDescription>
        </div>
        {!isNational && (
          <Segmented
            size="sm"
            className="no-print shrink-0"
            aria-label={t('map.viewLabel')}
            value={mode}
            onValueChange={setMode}
            options={[
              { value: 'focus', label: t('map.focus') },
              { value: 'country', label: t('map.country') },
            ]}
          />
        )}
      </CardHeader>
      <div className="relative isolate min-h-[300px] flex-1 border-t border-border sm:min-h-[360px] print:min-h-[260px]">
        <React.Suspense fallback={<Skeleton className="absolute inset-0 rounded-none" />}>
          <RiskMap
            model={model}
            level={level}
            metric={metric}
            selectedIds={selected}
            focusId={!isNational && mode === 'focus' ? unit.id : null}
            interactive={false}
            className="absolute inset-0"
            fitPadding={mode === 'focus' && !isNational ? 48 : 16}
          />
        </React.Suspense>
        <div className="glass pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl px-3 py-2 text-[11px] font-medium shadow-lg">
          <div className="mb-1.5 text-muted-foreground">{t('common:informRisk')}</div>
          <div className="flex gap-1">
            {CLASS_KEYS.map((k) => (
              <span key={k} className="h-2 w-6 rounded-full" style={{ background: CLASS_COLORS[k] }} title={t(`common:classes.${k}`)} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{t('common:classes.veryLow')}</span>
            <span>{t('common:classes.veryHigh')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Finding({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <p className="min-w-0 leading-relaxed text-muted-foreground">{children}</p>
    </li>
  );
}

function KeyFindings({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rank, national, model, coverage, region } = view;
  const b = <strong className="font-semibold text-foreground" />;
  const cls = classify(unit.risk);
  const clsLabel = cls ? t(`common:classes.${cls.key}`) : t('common:classes.noData');
  const weakest = weakestDimension(unit);
  const top = topDrivers(unit, 1)[0];
  const d = delta(unit.risk, national.risk);
  const peers = t(`peers.${unit.level}`);

  const localRank = React.useMemo(() => {
    if (unit.level !== 'council' && unit.level !== 'source') return null;
    const list = unit.level === 'council' ? (model.councilsByRegion.get(placeKey(unit.region)) ?? []) : (placeListsFor(model, unit).find((l) => l.kind === 'sourceSiblings')?.units ?? []);
    return list.length > 1 ? rankAmong(unit, list) : null;
  }, [unit, model]);

  const findings: React.ReactNode[] = [];
  if (unit.level === 'national') {
    findings.push(
      <Finding key="overall" icon={Gauge}>
        <Trans t={t} i18nKey="glance.nationalOverall" values={{ score: formatScore(unit.risk), cls: clsLabel }} components={{ b }} />
      </Finding>,
      <Finding key="above" icon={Scale}>
        <Trans
          t={t}
          i18nKey="glance.nationalAbove"
          values={{ n: model.councils.filter((c) => (c.risk ?? -1) > (unit.risk ?? 11)).length, total: model.councils.length }}
          components={{ b }}
        />
      </Finding>,
    );
  } else {
    findings.push(
      <Finding key="overall" icon={Gauge}>
        <Trans
          t={t}
          i18nKey="glance.overall"
          values={{ score: formatScore(unit.risk), cls: clsLabel, rank: rank ? t('glance.rank', { count: rank.rank, ordinal: true, total: rank.total, peers }) : '' }}
          components={{ b }}
        />
      </Finding>,
    );
    if (d != null)
      findings.push(
        <Finding key="national" icon={Scale}>
          <Trans
            t={t}
            i18nKey={d > 0 ? 'glance.aboveNational' : d < 0 ? 'glance.belowNational' : 'glance.equalNational'}
            values={{ d: Math.abs(d).toFixed(1), national: formatScore(national.risk) }}
            components={{ b }}
          />
        </Finding>,
      );
    if (localRank && region)
      findings.push(
        <Finding key="local" icon={Trophy}>
          <Trans
            t={t}
            i18nKey="glance.localRank"
            values={{ rank: t('glance.rank', { count: localRank.rank, ordinal: true, total: localRank.total, peers }), region: unit.region }}
            components={{ b }}
          />
        </Finding>,
      );
  }
  if (weakest)
    findings.push(
      <Finding key="weakest" icon={ShieldAlert}>
        <Trans
          t={t}
          i18nKey="glance.weakest"
          values={{ dim: t(`common:dimensions.${weakest.key}`), cls: t(`common:classes.${weakest.cls.key}`), score: formatScore(weakest.score) }}
          components={{ b }}
        />
      </Finding>,
    );
  if (top)
    findings.push(
      <Finding key="driver" icon={Activity}>
        <Trans t={t} i18nKey="glance.driver" values={{ indicator: t(`indicators:${top.key}`), score: formatScore(top.value) }} components={{ b }} />
      </Finding>,
    );
  findings.push(
    <Finding key="coverage" icon={Database}>
      <Trans t={t} i18nKey="glance.coverage" values={{ have: coverage.have, total: coverage.total }} components={{ b }} />
    </Finding>,
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{t('glance.title')}</CardTitle>
        <CardDescription>{t('glance.lead', { name: unit.name })}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-5">{findings}</ol>
      </CardContent>
    </Card>
  );
}

export function Overview({ view }: { view: AreaView }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] print:grid-cols-2">
      <Reveal className="h-full print:break-inside-avoid">
        <LocatorMap view={view} />
      </Reveal>
      <Reveal delay={0.06} className="h-full print:break-inside-avoid">
        <KeyFindings view={view} />
      </Reveal>
    </div>
  );
}
