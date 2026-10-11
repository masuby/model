/**
 * The selected area beside the map: a map of the area to move around from (its region's councils, the
 * neighbours one click away, and the country with the region marked), and trends and charts (the risk and
 * its parts against the region and Tanzania, the risk profile (the groups of every dimension), heatwave days
 * and rainfall year by year,
 * and how the assessment changed since the INFORM SADC 2024 workbook).
 *
 * Wide desktops show both in a column on the left (InsightColumn) while the risk communication panel docks
 * on the right; narrower screens show them inside that panel.
 */
import { ChevronDown, PanelLeftOpen } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { classify, NO_DATA_COLOR } from '@/engine/risk/classes';
import { DIMENSION_BY_KEY, DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { parseMetric, rampColor } from '@/engine/risk/metrics';
import { buildModel, placeKey } from '@/engine/risk/model';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { dimensionGroups } from '../lib/riskPanel';
import { PanelWidthButton } from './PanelResizer';
import { meanOver, seriesFor, useTrends } from '../lib/trends';
import { SectionTitle } from './bits';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

/** The workbook exactly (INFORM SADC 2024), built once on first use: the reference for "how it changed". */
let WORKBOOK: RiskModel | null = null;
const workbookModel = () => (WORKBOOK ??= buildModel({}, { workbookOnly: true }));

const areaName = (t: (k: string) => string, unit: Unit) => (unit.level === 'national' ? t('riskPanel.country') : unit.name);

/* ------------------------------------------------------------------------------------------------ */
/* The map of the area, for moving around                                                            */
/* ------------------------------------------------------------------------------------------------ */

export function AreaNavMap({ unit, className }: { unit: Unit; className?: string }) {
  const { t } = useTranslation('explore');
  const { model, metric, actions } = useExplore();
  const region = unit.level === 'council' || unit.level === 'source' ? (model.byId.get(`R-${placeKey(unit.region)}`) ?? null) : unit.level === 'region' ? unit : null;
  const regionCouncils = React.useMemo(() => (region ? (model.councilsByRegion.get(placeKey(region.name)) ?? []).map((c) => c.id) : undefined), [model, region]);
  const regionMetric = React.useMemo(() => parseMetric('risk'), []);
  const select = (u: Unit) => {
    if (u.id !== unit.id) actions.select(u, { focus: true });
  };
  const councilLevel = unit.level === 'council';
  return (
    <div className={className}>
      <div className="relative aspect-[4/3] w-full">
        <React.Suspense fallback={<div className="size-full animate-pulse rounded-md bg-muted/60" />}>
          <StaticMap
            model={model}
            level={councilLevel ? 'council' : 'region'}
            metric={metric}
            selectedIds={unit.level === 'national' ? [] : [unit.id]}
            emphasiseIds={councilLevel ? regionCouncils : undefined}
            focusId={unit.level === 'national' ? null : unit.id}
            onSelect={select}
            hint={t('insight.map.select')}
            className="size-full"
            aria-label={t('insight.map.label', { name: areaName(t, unit) })}
          />
        </React.Suspense>
        {region && (
          <div className="absolute right-2 bottom-2 w-[30%] rounded-sm border border-border bg-background/90 p-0.5 shadow-sm">
            <React.Suspense fallback={null}>
              <StaticMap
                model={model}
                level="region"
                metric={regionMetric}
                selectedIds={[region.id]}
                onSelect={select}
                hoverCard={false}
                keyboard={false}
                className="aspect-square w-full"
                aria-label={t('insight.map.inset', { region: region.name })}
              />
            </React.Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Charts                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

const PARTS: ReadonlyArray<{ key: 'risk' | DimensionKey; scale: 'risk' | 'hazard' | 'vulnerability' | 'coping' }> = [
  { key: 'risk', scale: 'risk' },
  ...DIMENSIONS.map((d) => ({ key: d.key, scale: d.scale })),
];
const partValue = (u: Unit | null, key: 'risk' | DimensionKey) => (!u ? null : key === 'risk' ? u.risk : u.dims[key].score);

/** The risk and its three parts on a 0-10 track: the area (dot in its class colour), its region and Tanzania. */
function PartsChart({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['explore', 'common']);
  const { model } = useExplore();
  const region = unit.level === 'council' || unit.level === 'source' ? (model.byId.get(`R-${placeKey(unit.region)}`) ?? null) : null;
  const national = unit.level === 'national' ? null : model.national;
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-foreground" aria-hidden /> {areaName(t, unit)}
        </span>
        {region && (
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full border-2 border-foreground/70" aria-hidden /> {t('riskPanel.group.compareRegion', { name: region.name })}
          </span>
        )}
        {national && (
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-0.5 bg-foreground/70" aria-hidden /> {t('riskPanel.group.compareNational')}
          </span>
        )}
      </p>
      <ul className="mt-3 space-y-3">
        {PARTS.map(({ key, scale }) => {
          const v = partValue(unit, key);
          const r = partValue(region, key);
          const n = partValue(national, key);
          const pos = (x: number) => `${Math.max(0, Math.min(100, x * 10))}%`;
          const label = key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}`);
          return (
            <li key={key}>
              <span className="flex items-baseline justify-between gap-2 text-xs">
                <span className={cn('truncate', key === 'risk' && 'font-semibold')}>{label}</span>
                <span className="num font-semibold">{formatScore(v)}</span>
              </span>
              <span className="relative mt-1.5 block h-3" role="img" aria-label={t('insight.charts.partAria', { label, value: formatScore(v), region: formatScore(r), national: formatScore(n) })}>
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
                {isNum(n) && <span className="absolute top-0 h-3 w-0.5 -translate-x-1/2 bg-foreground/70" style={{ left: pos(n) }} />}
                {isNum(r) && <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/70 bg-background" style={{ left: pos(r) }} />}
                {isNum(v) && <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background" style={{ left: pos(v), background: classify(v, scale)?.color ?? NO_DATA_COLOR }} />}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The groups of a dimension shown before "Show all". */
const PROFILE_FIRST = 5;

/**
 * The risk profile: the indicator groups of each dimension with their scores, highest first (hazard
 * groups at 0 are left out: no hazard), each one click from its evidence in the risk panel.
 */
function RiskProfile({ unit }: { unit: Unit }) {
  return (
    <div className="space-y-4">
      {DIMENSIONS.map((d) => (
        <DimensionGroups key={d.key} unit={unit} dim={d.key} />
      ))}
    </div>
  );
}

function DimensionGroups({ unit, dim }: { unit: Unit; dim: DimensionKey }) {
  const { t } = useTranslation(['explore', 'indicators', 'common']);
  const { actions } = useExplore();
  const [all, setAll] = React.useState(false);
  const def = DIMENSION_BY_KEY[dim];
  const groups = React.useMemo(() => dimensionGroups(unit, dim), [unit, dim]);
  const shown = all ? groups : groups.slice(0, PROFILE_FIRST);
  const score = unit.dims[dim].score;
  return (
    <div>
      <p className="flex items-baseline justify-between gap-2 text-xs font-semibold">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full" style={{ background: classify(score, def.scale)?.color ?? NO_DATA_COLOR }} aria-hidden />
          <span className="truncate">{t(`common:dimensions.${dim}`)}</span>
        </span>
        <span className="num">{formatScore(score)}</span>
      </p>
      {groups.length ? (
        <ul className="-mx-1.5 mt-1">
          {shown.map((g) => (
            <li key={g.key}>
              <button type="button" onClick={() => actions.setMetric(`ind:${dim}:${g.key}`)} className="w-full rounded px-1.5 py-1 text-left hover:bg-muted/70" aria-label={t('insight.charts.groupAria', { name: t(`indicators:${g.key}`), score: formatScore(g.score) })}>
                <span className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate">{t(`indicators:${g.key}`)}</span>
                  <span className="num font-semibold">{formatScore(g.score)}</span>
                </span>
                <span className="mt-1 block h-1 bg-muted">
                  <span className="block h-full" style={{ width: `${g.score * 10}%`, background: rampColor(g.score, def.scale) }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{t('insight.charts.noGroups')}</p>
      )}
      {groups.length > PROFILE_FIRST && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <ChevronDown className={cn('size-3.5 transition-transform', all && 'rotate-180')} aria-hidden />
          {all ? t('riskPanel.top.less') : t('riskPanel.top.more', { count: groups.length })}
        </button>
      )}
    </div>
  );
}

/** Bars for one value a year, with a dashed line at the 1991-2020 mean; bars can be coloured by the side of the mean they fall on. */
function YearBars({ points, mean, color, above, below, label }: { points: Array<{ year: number; value: number }>; mean: number | null; color?: string; above?: string; below?: string; label: string }) {
  const max = Math.max(...points.map((p) => p.value), mean ?? 0) || 1;
  const w = 6;
  const gap = 2;
  const width = points.length * (w + gap);
  const height = 72;
  const y = (v: number) => height - (v / max) * (height - 4);
  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
        {points.map((p, i) => {
          const fill = color ?? (mean != null && p.value >= mean ? above : below);
          return (
            <rect key={p.year} x={i * (w + gap)} y={y(p.value)} width={w} height={Math.max(0.5, height - y(p.value))} fill={fill}>
              <title>{`${p.year}: ${formatNumber(Math.round(p.value * 10) / 10)}`}</title>
            </rect>
          );
        })}
        {mean != null && <line x1={0} x2={width} y1={y(mean)} y2={y(mean)} stroke="currentColor" strokeOpacity={0.6} strokeDasharray="3 2" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
      </svg>
      <figcaption className="mt-0.5 flex justify-between text-[11px] text-muted-foreground">
        <span className="num">{points[0]?.year}</span>
        <span className="num">{points[points.length - 1]?.year}</span>
      </figcaption>
    </figure>
  );
}

export function ClimateTrends({ unit }: { unit: Unit }) {
  const { t, i18n } = useTranslation('explore');
  const { data, isLoading } = useTrends();
  const lang = i18n.language;
  if (isLoading) return <div className="h-24 animate-pulse rounded bg-muted/60" aria-hidden />;
  const heat = seriesFor(data?.heat, unit);
  const rain = seriesFor(data?.rain, unit);
  const heavy = seriesFor(data?.heavy, unit);
  if (!heat && !rain) return <p className="text-sm text-muted-foreground">{t('insight.charts.noTrends')}</p>;
  const heatBase = heat ? meanOver(heat, 1991, 2020) : null;
  const heatRecent = heat ? meanOver(heat, 2015, 2024) : null;
  const rainNormal = rain ? meanOver(rain, 1991, 2020) : null;
  const dry = rain ? rain.reduce((a, p) => (p.value < a.value ? p : a)) : null;
  const wet = rain ? rain.reduce((a, p) => (p.value > a.value ? p : a)) : null;
  const heavyNormal = heavy ? meanOver(heavy, 1991, 2020) : null;
  const fmt = (v: number | null) => (v == null ? '' : formatNumber(Math.round(v), lang));
  return (
    <div className="space-y-5">
      {heat && (
        <div>
          <p className="text-xs font-medium">{t('insight.charts.heat', { from: heat[0].year, to: heat[heat.length - 1].year })}</p>
          <YearBars points={heat} mean={heatBase} color="#e8590c" label={t('insight.charts.heatSummary', { base: fmt(heatBase), recent: fmt(heatRecent) })} />
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{t('insight.charts.heatSummary', { base: fmt(heatBase), recent: fmt(heatRecent) })}</p>
        </div>
      )}
      {rain && dry && wet && (
        <div>
          <p className="text-xs font-medium">{t('insight.charts.rain', { from: rain[0].year, to: rain[rain.length - 1].year })}</p>
          <YearBars points={rain} mean={rainNormal} above="#1c7ed6" below="#b08850" label={t('insight.charts.rainSummary', { normal: fmt(rainNormal), dryYear: dry.year, dry: fmt(dry.value), wetYear: wet.year, wet: fmt(wet.value) })} />
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {t('insight.charts.rainSummary', { normal: fmt(rainNormal), dryYear: dry.year, dry: fmt(dry.value), wetYear: wet.year, wet: fmt(wet.value) })}
            {heavyNormal != null && ` ${t('insight.charts.heavySummary', { days: formatNumber(Math.round(heavyNormal * 10) / 10, lang) })}`}
          </p>
        </div>
      )}
      <p className="text-[11px] leading-snug text-muted-foreground">{[heat && data?.sources.heat, rain && data?.sources.rain].filter(Boolean).join(' · ')}</p>
    </div>
  );
}

/** INFORM risk in the INFORM SADC 2024 workbook against today's value. */
function AssessmentHistory({ unit }: { unit: Unit }) {
  const { t } = useTranslation('explore');
  const { state } = useExplore();
  const wb = React.useMemo(() => {
    const m = workbookModel();
    return unit.level === 'national' ? m.national : (m.byId.get(unit.id) ?? null);
  }, [unit]);
  if (!wb || !isNum(wb.risk) || !isNum(unit.risk)) return null;
  return (
    <p className="text-xs leading-snug text-muted-foreground">
      {t('insight.charts.history', { workbook: formatScore(wb.risk), live: formatScore(unit.risk), layer: t(`layer.${state.layer}`) })}
    </p>
  );
}

export function AreaCharts({ unit }: { unit: Unit }) {
  const { t } = useTranslation('explore');
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle as="h3" className="mb-2">
          {t('insight.charts.parts')}
        </SectionTitle>
        <PartsChart unit={unit} />
        <div className="mt-3">
          <AssessmentHistory unit={unit} />
        </div>
      </section>
      <section>
        <SectionTitle as="h3" className="mb-2">
          {t('insight.charts.profile')}
        </SectionTitle>
        <RiskProfile unit={unit} />
      </section>
      <section>
        <SectionTitle as="h3" className="mb-2">
          {t('insight.charts.climate')}
        </SectionTitle>
        <ClimateTrends unit={unit} />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* The left column on wide desktops                                                                  */
/* ------------------------------------------------------------------------------------------------ */

export function InsightColumn({ unit, onOpenControls }: { unit: Unit; onOpenControls: () => void }) {
  const { t } = useTranslation('explore');
  const name = areaName(t, unit);
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
        <p className="truncate text-sm font-semibold">{name}</p>
        <div className="-mr-2 flex shrink-0 items-center">
          <Button variant="ghost" size="sm" onClick={onOpenControls}>
            <PanelLeftOpen /> {t('riskPanel.rail.open')}
          </Button>
          <PanelWidthButton side="left" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8 [scrollbar-width:thin]">
        <section aria-labelledby="insight-map-title">
          <SectionTitle as="h2" id="insight-map-title" className="mb-2">
            {t('insight.map.title', { name })}
          </SectionTitle>
          <AreaNavMap unit={unit} />
        </section>
        <section aria-labelledby="insight-charts-title" className="mt-7">
          <SectionTitle as="h2" id="insight-charts-title" className="mb-3">
            {t('insight.charts.title')}
          </SectionTitle>
          <AreaCharts unit={unit} />
        </section>
      </div>
    </div>
  );
}
