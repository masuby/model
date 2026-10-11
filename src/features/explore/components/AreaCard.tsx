/**
 * How an area's score is built (the analysis inside the risk communication panel, RiskPanel.tsx): rank,
 * where the score sits on its class scale, dimensions against the region or the nation, top drivers,
 * people, data coverage and provenance notes. Sections are separated by hairline rules; the dimension and
 * driver rows share one row style.
 */
import { Paintbrush } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassDot } from '@/components/risk/RiskBadge';
import { Progress } from '@/components/ui/primitives';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { parseMetric, rampColor } from '@/engine/risk/metrics';
import { dataCoverage, topDrivers, unitsAt } from '@/engine/risk/model';
import { dataNotesFor } from '@/engine/risk/notes';
import { DataNoteMark } from '@/components/risk/DataNoteMark';
import type { Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore, NO_VALUE } from '@/lib/utils';
import { coverageCounts, editCount, rankUnits, referenceUnit } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { ClassScale, MetricValue, Notice, SectionTitle } from './bits';

const RISK = parseMetric('risk');

/** A labelled figure in a row of figures separated by vertical rules. */
function Figure({ label, children, sub, className }: { label: React.ReactNode; children: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <dt className="line-clamp-2 text-xs text-muted-foreground">{label}</dt>
      <dd className="num mt-auto flex items-baseline gap-1.5 truncate pt-1 text-lg leading-tight font-semibold">{children}</dd>
      {sub && <dd className="truncate text-xs text-muted-foreground">{sub}</dd>}
    </div>
  );
}

const ruled = (i: number, n: number) => (i === 0 ? 'pr-3' : i === n - 1 ? 'pl-3' : 'px-3');
const pct = (v: number | null | undefined) => (typeof v === 'number' ? Math.max(0, Math.min(100, v * 10)) : 0);

export function AreaBody({ unit }: { unit: Unit }) {
  const { t, i18n } = useTranslation(['explore', 'common', 'indicators']);
  const { model, metric, actions, metricLabel } = useExplore();
  const lang = i18n.language;

  const peers = React.useMemo(() => unitsAt(model, unit.level), [model, unit.level]);
  const riskRank = React.useMemo(() => rankUnits(peers, RISK).get(unit.id), [peers, unit.id]);
  const lensRank = React.useMemo(() => (metric.kind === 'risk' ? undefined : rankUnits(peers, metric).get(unit.id)), [peers, metric, unit.id]);
  const reference = referenceUnit(model, unit);
  const drivers = React.useMemo(() => topDrivers(unit, 3), [unit]);
  const coverage = dataCoverage(unit);
  const { have, total } = coverageCounts(unit);
  const edits = editCount(unit);
  const pop = unit.exposure?.population;
  const density = unit.exposure?.density;
  const area = unit.exposure?.areaKm2 ?? (pop && density ? pop / density : null);
  const referenceLabel = reference.level === 'national' ? t('card.national') : t('card.regionRisk', { name: reference.name });

  const riskLens = metric.kind === 'risk';
  const referenceValue = (
    <span className="inline-flex items-center gap-1.5">
      <ClassDot value={reference.risk} className="size-2 ring-0" />
      {formatScore(reference.risk)}
    </span>
  );

  // Two figures side by side. With a dimension or indicator lens the lens takes the second column and
  // the reference moves to its own ruled row, so no label has to be cut short.
  const headline: Array<{ key: string; label: React.ReactNode; value: React.ReactNode }> = [
    {
      key: 'rank',
      label: t('card.rank'),
      value: (
        <>
          {riskRank ?? NO_VALUE}
          <span className="text-sm font-normal text-muted-foreground">/ {peers.length}</span>
        </>
      ),
    },
    riskLens
      ? { key: 'ref', label: <span title={referenceLabel}>{referenceLabel}</span>, value: referenceValue }
      : {
          key: 'lens',
          label: <span title={metricLabel(metric)}>{metricLabel(metric)}</span>,
          value: (
            <>
              <MetricValue metric={metric} value={metric.get(unit)} />
              {lensRank && <span className="text-sm font-normal text-muted-foreground">#{lensRank}</span>}
            </>
          ),
        },
  ];

  return (
    <div className="divide-y divide-border">
      {/* Headline: rank, reference, and where the score sits on the risk classes */}
      <section className="pb-6">
        <dl className="grid grid-cols-2 divide-x divide-border">
          {headline.map((f, i) => (
            <Figure key={f.key} label={f.label} className={ruled(i, headline.length)}>
              {f.value}
            </Figure>
          ))}
        </dl>
        {!riskLens && (
          <dl className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm">
            <dt className="min-w-0 text-muted-foreground">
              {referenceLabel} · {t('abbr.risk')}
            </dt>
            <dd className="num shrink-0 font-semibold">{referenceValue}</dd>
          </dl>
        )}
        <ClassScale value={unit.risk} className="mt-5" />
      </section>

      {/* Dimensions */}
      <section className="py-6">
        <SectionTitle as="h3" className="mb-2">
          {t('card.dimensions')}
        </SectionTitle>
        <ul>
          {DIMENSIONS.map((d) => {
            const v = unit.dims[d.key].score;
            const ref = reference.dims[d.key]?.score;
            const c = classify(v, d.scale);
            return (
              <li key={d.key} className="py-2">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{t(`common:dimensions.${d.key}`)}</span>
                  <span className="num text-sm font-semibold">
                    {formatScore(v)}
                    {typeof ref === 'number' && (
                      <span className="sr-only">
                        {' '}
                        ({reference.name}: {formatScore(ref)})
                      </span>
                    )}
                  </span>
                </span>
                <span className="relative mt-1.5 block h-1 bg-muted">
                  <span className="block h-full" style={{ width: `${pct(v)}%`, background: c?.color ?? NO_DATA_COLOR }} />
                  {typeof ref === 'number' && (
                    <span
                      aria-hidden
                      title={`${reference.name}: ${formatScore(ref)}`}
                      className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground/70"
                      style={{ left: `${pct(ref)}%` }}
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="inline-block h-3 w-0.5 bg-foreground/70" />
          {reference.level === 'national' ? t('card.markerNational') : t('card.markerRegion', { name: reference.name })}
        </p>
      </section>

      {/* Drivers */}
      {drivers.length > 0 && (
        <section className="py-6">
          <SectionTitle as="h3" className="mb-2">
            {t('card.drivers')}
          </SectionTitle>
          <ul className="-mx-2">
            {drivers.map((d) => {
              const key = `ind:${d.dim}:${d.key}`;
              const active = metric.key === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => actions.setMetric(key)}
                    title={t('card.colourBy', { name: t(`indicators:${d.key}`) })}
                    className={cn('group w-full rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/70', active && 'bg-muted')}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className={cn('truncate text-sm', active ? 'font-semibold' : 'font-medium')}>{t(`indicators:${d.key}`)}</span>
                        <Paintbrush className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                      </span>
                      <span className="num inline-flex items-center gap-1 text-sm font-semibold">
                        {formatScore(d.value)}
                        <DataNoteMark notes={dataNotesFor(unit, d.dim, d.key)} focusable={false} />
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1 bg-muted">
                      <span className="block h-full" style={{ width: `${pct(d.value)}%`, background: rampColor(d.value, d.dim) }} />
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {t(`common:dimensions.${d.dim}Short`)} · {t(`common:categories.${d.category}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('card.driversHint')}</p>
        </section>
      )}

      {/* People */}
      <section className="py-6">
        <SectionTitle as="h3" className="mb-3">
          {t('card.people')}
        </SectionTitle>
        <dl className="grid grid-cols-3 divide-x divide-border">
          <Figure label={t('common:labels.population')} className={ruled(0, 3)}>
            {formatNumber(pop, lang)}
          </Figure>
          <Figure label={t('common:labels.density')} sub={t('common:units.perKm2')} className={ruled(1, 3)}>
            {formatNumber(density, lang, { maximumFractionDigits: 0 })}
          </Figure>
          <Figure label={t('common:labels.area')} sub={t('common:units.km2')} className={ruled(2, 3)}>
            {formatNumber(area, lang, { maximumFractionDigits: 0 })}
          </Figure>
        </dl>
        {unit.exposure?.source && (
          <p className="mt-3 truncate text-xs text-muted-foreground" title={unit.exposure.source}>
            {t('card.popSource', { source: unit.exposure.source })}
          </p>
        )}
      </section>

      {/* Coverage */}
      <section className="py-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <SectionTitle as="h3" className="mb-0 min-h-0">
            {t('common:labels.coverage')}
          </SectionTitle>
          <span className="num text-sm font-semibold">{coverage}%</span>
        </div>
        <Progress
          value={coverage}
          label={t('common:labels.coverage')}
          className="h-1 rounded-none"
          indicatorClassName={cn('rounded-none', coverage >= 80 ? 'bg-success' : coverage >= 60 ? 'bg-warning' : 'bg-danger')}
        />
        <p className="mt-2 text-xs text-muted-foreground">{t('card.coverageDetail', { have, total })}</p>
      </section>

      {/* Provenance notes */}
      {(unit.inheritedFrom || (unit.level === 'council' && unit.sourceName) || edits > 0) && (
        <section className="space-y-3 pt-6">
          {unit.inheritedFrom && <Notice tone="warning">{t('common:labels.inherited', { parent: unit.inheritedFrom })}</Notice>}
          {unit.level === 'council' && unit.sourceName && <Notice>{t('common:labels.sharedSource', { source: unit.sourceName })}</Notice>}
          {edits > 0 && <Notice tone="primary">{t('card.editedNote', { count: edits })}</Notice>}
        </section>
      )}
    </div>
  );
}
