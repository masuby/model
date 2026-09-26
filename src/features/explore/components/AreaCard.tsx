/**
 * The selected area: header (name, class, badges), body (risk gauge, rank, dimensions vs. region or
 * national, top drivers, people, data coverage, provenance notices) and actions (profile, compare).
 * Rendered as a glass overlay on desktop and inside the bottom sheet on mobile.
 */
import { ArrowRight, Database, GitCompareArrows, Layers, Link2, MapPinned, Paintbrush, Pencil, Split, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { DimensionBars } from '@/components/risk/DimensionBars';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/primitives';
import { parseMetric, rampColor } from '@/engine/risk/metrics';
import { dataCoverage, topDrivers, unitsAt } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { coverageCounts, editCount, MAX_COMPARE, rankUnits, referenceUnit } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';
import { Notice, ScorePill, SectionTitle } from './bits';

const RISK = parseMetric('risk');

export function AreaHeader({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t } = useTranslation(['explore', 'common']);
  const edits = editCount(unit);
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
          {t(`common:levels.${unit.level}`)}
          {unit.level !== 'region' && ` · ${unit.region}`}
        </div>
        <h2 className="mt-1 text-xl leading-tight font-extrabold text-balance">{unit.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ClassBadge value={unit.risk} showScore size="sm" />
          {edits > 0 && (
            <Badge title={t('card.editedNote', { count: edits })}>
              <Pencil /> {t('common:labels.edited')}
            </Badge>
          )}
          {unit.level === 'source' && <Badge variant="warning">{t('level.reference')}</Badge>}
          {unit.inheritedFrom && <Badge variant="secondary">{t('card.inheritedBadge')}</Badge>}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('card.close')} className="-mt-1 -mr-1 shrink-0">
        <X />
      </Button>
    </div>
  );
}

export function AreaActions({ unit, className }: { unit: Unit; className?: string }) {
  const { t } = useTranslation('explore');
  const { state, actions } = useExplore();
  const inCompare = state.cmp.includes(unit.id);
  const full = !inCompare && state.cmp.length >= MAX_COMPARE;
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link to={`/area/${unit.id}`}>
            {t('card.viewProfile')} <ArrowRight />
          </Link>
        </Button>
        <Button
          variant={inCompare ? 'secondary' : 'outline'}
          aria-pressed={inCompare}
          onClick={() => actions.toggleCompare(unit)}
          title={full ? t('compare.fullHint') : undefined}
          className={cn(full && 'opacity-60')}
        >
          <GitCompareArrows /> {inCompare ? t('card.comparing') : t('card.compare')}
        </Button>
      </div>
      {state.view === 'table' && (
        <Button variant="ghost" size="sm" onClick={() => actions.setView('map', { focusSelection: true })}>
          <MapPinned /> {t('view.showOnMap')}
        </Button>
      )}
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/50 px-2.5 py-2">
      <div className="truncate text-[10px] font-medium text-muted-foreground">{label}</div>
      <div className="num mt-0.5 truncate font-display text-sm font-bold">{value}</div>
      {sub && <div className="truncate text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="flex items-center gap-3">
        <ScoreGauge value={unit.risk} size={132} label={t('common:informRisk')} className="shrink-0" />
        <dl className="min-w-0 flex-1 space-y-2.5">
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('card.rank')}</dt>
            <dd className="num font-display text-lg leading-tight font-extrabold">
              {riskRank ?? '—'}
              <span className="text-xs font-medium text-muted-foreground"> / {peers.length}</span>
            </dd>
          </div>
          {metric.kind !== 'risk' && (
            <div>
              <dt className="truncate text-[11px] text-muted-foreground">{metricLabel(metric)}</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <ScorePill value={metric.get(unit)} metric={metric} />
                {lensRank && <span className="num text-xs font-semibold text-muted-foreground">#{lensRank}</span>}
              </dd>
            </div>
          )}
          <div>
            <dt className="truncate text-[11px] text-muted-foreground">{reference.level === 'national' ? t('card.national') : t('card.regionRisk', { name: reference.name })}</dt>
            <dd className="num flex items-center gap-2 text-sm font-bold">
              {formatScore(reference.risk)}
              <ClassBadge value={reference.risk} size="sm" />
            </dd>
          </div>
        </dl>
      </div>

      {/* Dimensions */}
      <section>
        <SectionTitle>{t('card.dimensions')}</SectionTitle>
        <DimensionBars unit={unit} compare={reference} compact />
        <p className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span aria-hidden className="inline-block h-3 w-0.5 rounded-full bg-foreground/70" />
          {reference.level === 'national' ? t('card.markerNational') : t('card.markerRegion', { name: reference.name })}
        </p>
      </section>

      {/* Drivers */}
      {drivers.length > 0 && (
        <section>
          <SectionTitle>{t('card.drivers')}</SectionTitle>
          <ul className="-mx-2 space-y-0.5">
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
                    className={cn('group w-full rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted/70', active && 'bg-primary/[0.07]')}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: DIMENSION_COLORS[d.dim] }} />
                        <span className="truncate text-[13px] font-semibold">{t(`indicators:${d.key}`)}</span>
                        <Paintbrush className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                      </span>
                      <span className="num font-display text-sm font-bold">{formatScore(d.value)}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full" style={{ width: `${d.value * 10}%`, background: rampColor(d.value) }} />
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {t(`common:dimensions.${d.dim}Short`)} · {t(`common:categories.${d.category}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t('card.driversHint')}</p>
        </section>
      )}

      {/* People */}
      <section>
        <SectionTitle>{t('card.people')}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Fact label={t('common:labels.population')} value={formatNumber(pop, lang)} />
          <Fact label={t('common:labels.density')} value={formatNumber(density, lang, { maximumFractionDigits: 0 })} sub={t('common:units.perKm2')} />
          <Fact label={t('common:labels.area')} value={formatNumber(area, lang, { maximumFractionDigits: 0 })} sub={t('common:units.km2')} />
        </div>
        {unit.exposure?.source && (
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground" title={unit.exposure.source}>
            {t('card.popSource', { source: unit.exposure.source })}
          </p>
        )}
      </section>

      {/* Coverage */}
      <section>
        <SectionTitle>{t('common:labels.coverage')}</SectionTitle>
        <div className="flex items-center gap-3">
          <Progress value={coverage} label={t('common:labels.coverage')} className="h-1.5 flex-1" indicatorClassName={coverage >= 80 ? 'bg-success' : coverage >= 60 ? 'bg-warning' : 'bg-danger'} />
          <span className="num text-sm font-bold">{coverage}%</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{t('card.coverageDetail', { have, total })}</p>
      </section>

      {/* Provenance notices */}
      <div className="space-y-2">
        {unit.inheritedFrom && <Notice icon={<Split />} tone="warning">{t('common:labels.inherited', { parent: unit.inheritedFrom })}</Notice>}
        {unit.level === 'council' && unit.sourceName && <Notice icon={<Link2 />}>{t('common:labels.sharedSource', { source: unit.sourceName })}</Notice>}
        {unit.level === 'region' && <Notice icon={<Layers />}>{t('card.regionNote', { count: unit.members ?? 0 })}</Notice>}
        {unit.level === 'source' && (
          <Notice icon={<Database />} tone="warning">
            {t('card.sourceNote')}
          </Notice>
        )}
        {edits > 0 && (
          <Notice icon={<Pencil />} tone="primary">
            {t('card.editedNote', { count: edits })}
          </Notice>
        )}
      </div>
    </div>
  );
}

/** Desktop overlay card. */
export function AreaCardOverlay({ top, bottom }: { top: number; bottom: number }) {
  const { t } = useTranslation('explore');
  const { selected, actions } = useExplore();
  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          key="area-card"
          aria-label={t('card.label', { name: selected.name })}
          initial={{ opacity: 0, x: 28, scale: 0.98, top, bottom }}
          animate={{ opacity: 1, x: 0, scale: 1, top, bottom }}
          exit={{ opacity: 0, x: 28, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !e.defaultPrevented) actions.deselect();
          }}
          className="absolute right-4 z-30 flex w-[360px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[var(--shadow-lift)] backdrop-blur-xl"
        >
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border/70 p-4">
              <AreaHeader unit={selected} onClose={actions.deselect} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              <AreaBody unit={selected} />
            </div>
            <div className="shrink-0 border-t border-border/70 bg-card/60 p-3">
              <AreaActions unit={selected} />
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
