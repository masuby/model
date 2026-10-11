/**
 * Overview: a lightweight SVG locator map (no Leaflet) beside the key findings, written as a short
 * report paragraph - a serif lede and a ruled list - rather than icon tiles in a card.
 */
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Segmented } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import { DATA_AS_OF, placeKey, topDrivers } from '@/engine/risk/model';
import { dataNotesFor, worstStatus } from '@/engine/risk/notes';
import { lackOfReliability } from '@/engine/risk/variants';
import { formatScore } from '@/lib/utils';
import { delta, placeListsFor, rankAmong, weakestDimension, type AreaView } from '../lib';
import { AreaFigures } from './AreaHero';
import { SubHeading, useMediaQuery } from './bits';
import { useDeferred } from './Deferred';

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

/** The key findings (rank, distance from the national value, weakest dimension, top driver, coverage): the opening of the Analysis view. */
export function KeyFindings({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rank, national, model, coverage, region } = view;
  const b = <strong className="font-semibold text-foreground" />;
  const cls = classify(unit.risk);
  const clsLabel = cls ? t(`common:classes.${cls.key}`) : t('common:classes.noData');
  const weakest = React.useMemo(() => weakestDimension(unit), [unit]);
  const top = React.useMemo(() => topDrivers(unit, 1)[0], [unit]);
  const d = delta(unit.risk, national.risk);
  const peers = t(`peers.${unit.level}`);
  const reliability = React.useMemo(() => (unit.level === 'council' || unit.level === 'source' ? lackOfReliability(unit, model, DATA_AS_OF) : null), [unit, model]);

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
  if (top) {
    findings.push({ key: 'driver', body: <Trans t={t} i18nKey="glance.driver" values={{ indicator: t(`indicators:${top.key}`), score: formatScore(top.value) }} components={{ b }} /> });
    // A top driver whose workbook value is under query says so here, where the driver is named (the integrity recheck).
    const topNotes = dataNotesFor(unit, top.dim, top.key).filter((n) => n.status !== 'explained');
    if (topNotes.length)
      findings.push({
        key: 'driverNote',
        body: <Trans t={t} i18nKey="glance.driverNote" values={{ indicator: t(`indicators:${top.key}`), status: t(`common:dataNote.inline.${worstStatus(topNotes)}`) }} components={{ b }} />,
      });
  }
  findings.push({ key: 'coverage', body: <Trans t={t} i18nKey="glance.coverage" values={{ have: coverage.have, total: coverage.total }} components={{ b }} /> });
  // Lack of reliability after INFORM's index (MET-14): missing groups, age of the data, inherited or shared values. Councils and workbook units only.
  if (reliability) {
    const inherited = unit.inheritedFrom ? t('glance.inheritedNote', { parent: model.byId.get(unit.inheritedFrom)?.name ?? unit.inheritedFrom }) : reliability.inherited > 0 ? t('glance.sharedNote') : '';
    findings.push({
      key: 'reliability',
      body: <Trans t={t} i18nKey="glance.reliability" values={{ lack: formatScore(reliability.lack), age: reliability.ageYears.toFixed(1), inherited }} components={{ b }} />,
    });
  }

  return (
    <div className="max-w-3xl">
      <SubHeading title={t('glance.title')} />
      <p className="mt-5 font-display text-[1.35rem] leading-snug text-balance text-muted-foreground [&_strong]:font-semibold sm:text-[1.6rem]">{lede}</p>
      <ul className="mt-5 divide-y divide-border border-y border-border">
        {findings.map((f) => (
          <li key={f.key} className="py-3 leading-relaxed text-muted-foreground">
            {f.body}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The risk view's overview: where the area is. The findings sit in the Analysis view (UX-01); on a phone the map waits behind one line. */
export function Overview({ view }: { view: AreaView }) {
  const { t } = useTranslation('area');
  const phone = useMediaQuery('(max-width: 639px)');
  const { printing } = useDeferred();
  if (!phone)
    return (
      <div className="max-w-3xl">
        <LocatorMap view={view} />
      </div>
    );
  return (
    <div className="max-w-3xl">
      {/* The key figures sit here on a phone (the hero keeps them from tablets up). */}
      <AreaFigures view={view} className="mb-6 border-b border-border pb-6" />
      <details open={printing || undefined} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          {t('map.show', { name: view.unit.name })}
        </summary>
        <div className="mt-4">
          <LocatorMap view={view} />
        </div>
      </details>
    </div>
  );
}
