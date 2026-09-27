/**
 * Overview: a lightweight SVG locator map (no Leaflet) beside the key findings, written as a short
 * report paragraph — a serif lede and a ruled list — rather than icon tiles in a card.
 */
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Segmented } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import { placeKey, topDrivers } from '@/engine/risk/model';
import { formatScore } from '@/lib/utils';
import { delta, placeListsFor, rankAmong, weakestDimension, type AreaView } from '../lib';
import { SubHeading } from './bits';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

function LocatorMap({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const navigate = useNavigate();
  const { unit, model } = view;
  const [mode, setMode] = React.useState<'focus' | 'country'>('focus');
  const metric = React.useMemo(() => parseMetric('risk'), []);
  const isNational = unit.level === 'national';

  // Councils and regions have their own outline; an INFORM source unit is shown through the councils
  // that use its data. The nation is drawn by region.
  const { level, selected } = React.useMemo(() => {
    if (unit.level === 'region') return { level: 'region' as const, selected: [unit.id] };
    if (unit.level === 'national') return { level: 'region' as const, selected: [] as string[] };
    if (unit.level === 'source') return { level: 'council' as const, selected: model.councils.filter((c) => c.sourceId === unit.id).map((c) => c.id) };
    return { level: 'council' as const, selected: [unit.id] };
  }, [unit, model]);
  const focusId = !isNational && mode === 'focus' ? (selected[0] ?? null) : null;

  return (
    <figure className="flex flex-col border-t border-border pt-5">
      <figcaption className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <SubHeading title={t('map.title')} lead={isNational ? t('map.descNational') : t('map.desc', { name: unit.name })} />
        {!isNational && selected.length > 0 && (
          <Segmented
            size="sm"
            className="no-print shrink-0 self-start"
            aria-label={t('map.viewLabel')}
            value={mode}
            onValueChange={setMode}
            options={[
              { value: 'focus', label: t('map.focus') },
              { value: 'country', label: t('map.country') },
            ]}
          />
        )}
      </figcaption>
      <div className="mt-5 aspect-[4/3] w-full">
        <React.Suspense fallback={<div className="size-full bg-muted/50" />}>
          <StaticMap
            model={model}
            level={level}
            metric={metric}
            selectedIds={selected}
            focusId={focusId}
            hint={t('map.hint')}
            onSelect={(u) => {
              if (u.id !== unit.id) navigate(`/area/${u.id}`);
            }}
            className="size-full"
            aria-label={isNational ? t('map.descNational') : t('map.desc', { name: unit.name })}
          />
        </React.Suspense>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{t('common:informRisk')}</span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{t('common:classes.veryLow')}</span>
          {CLASS_KEYS.map((k) => (
            <span key={k} className="h-2 w-5" style={{ background: CLASS_COLORS[k] }} title={t(`common:classes.${k}`)} aria-hidden />
          ))}
          <span>{t('common:classes.veryHigh')}</span>
        </span>
      </div>
    </figure>
  );
}

function KeyFindings({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rank, national, model, coverage, region } = view;
  const b = <strong className="font-semibold text-foreground" />;
  const cls = classify(unit.risk);
  const clsLabel = cls ? t(`common:classes.${cls.key}`) : t('common:classes.noData');
  const weakest = React.useMemo(() => weakestDimension(unit), [unit]);
  const top = React.useMemo(() => topDrivers(unit, 1)[0], [unit]);
  const d = delta(unit.risk, national.risk);
  const peers = t(`peers.${unit.level}`);

  const localRank = React.useMemo(() => {
    if (unit.level !== 'council' && unit.level !== 'source') return null;
    const list = unit.level === 'council' ? (model.councilsByRegion.get(placeKey(unit.region)) ?? []) : (placeListsFor(model, unit).find((l) => l.kind === 'sourceSiblings')?.units ?? []);
    return list.length > 1 ? rankAmong(unit, list) : null;
  }, [unit, model]);

  const lede =
    unit.level === 'national' ? (
      <Trans t={t} i18nKey="glance.nationalOverall" values={{ score: formatScore(unit.risk), cls: clsLabel }} components={{ b }} />
    ) : (
      <Trans
        t={t}
        i18nKey="glance.overall"
        values={{ score: formatScore(unit.risk), cls: clsLabel, rank: rank ? t('glance.rank', { count: rank.rank, ordinal: true, total: rank.total, peers }) : '' }}
        components={{ b }}
      />
    );

  const findings: Array<{ key: string; body: React.ReactNode }> = [];
  if (unit.level === 'national') {
    findings.push({
      key: 'above',
      body: <Trans t={t} i18nKey="glance.nationalAbove" values={{ n: model.councils.filter((c) => (c.risk ?? -1) > (unit.risk ?? 11)).length, total: model.councils.length }} components={{ b }} />,
    });
  } else {
    if (d != null)
      findings.push({
        key: 'national',
        body: (
          <Trans
            t={t}
            i18nKey={d > 0 ? 'glance.aboveNational' : d < 0 ? 'glance.belowNational' : 'glance.equalNational'}
            values={{ d: Math.abs(d).toFixed(1), national: formatScore(national.risk) }}
            components={{ b }}
          />
        ),
      });
    if (localRank && region)
      findings.push({
        key: 'local',
        body: (
          <Trans
            t={t}
            i18nKey="glance.localRank"
            values={{ rank: t('glance.rank', { count: localRank.rank, ordinal: true, total: localRank.total, peers }), region: unit.region }}
            components={{ b }}
          />
        ),
      });
  }
  if (weakest)
    findings.push({
      key: 'weakest',
      body: (
        <Trans
          t={t}
          i18nKey="glance.weakest"
          values={{ dim: t(`common:dimensions.${weakest.key}`), cls: t(`common:classes.${weakest.cls.key}`), score: formatScore(weakest.score) }}
          components={{ b }}
        />
      ),
    });
  if (top) findings.push({ key: 'driver', body: <Trans t={t} i18nKey="glance.driver" values={{ indicator: t(`indicators:${top.key}`), score: formatScore(top.value) }} components={{ b }} /> });
  findings.push({ key: 'coverage', body: <Trans t={t} i18nKey="glance.coverage" values={{ have: coverage.have, total: coverage.total }} components={{ b }} /> });

  return (
    <div className="border-t border-border pt-5">
      <SubHeading title={t('glance.title')} />
      <p className="mt-6 font-display text-[1.45rem] leading-snug text-balance text-muted-foreground [&_strong]:font-semibold sm:text-[1.7rem]">{lede}</p>
      <ul className="mt-6 divide-y divide-border border-t border-border">
        {findings.map((f) => (
          <li key={f.key} className="py-3.5 leading-relaxed text-muted-foreground">
            {f.body}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Overview({ view }: { view: AreaView }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 print:grid-cols-2 print:gap-8">
      <LocatorMap view={view} />
      <KeyFindings view={view} />
    </div>
  );
}
