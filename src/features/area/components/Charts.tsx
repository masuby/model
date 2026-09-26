/**
 * The profile's three charts, all Recharts inside ChartCard (PNG + CSV export) and themed with
 * useChartTheme so they read in day and night mode:
 *   a) CategoryChart     — the six INFORM categories vs region and national (radar or bars)
 *   b) IndicatorChart    — every indicator of one dimension, coloured by the continuous 0–10 ramp
 *   c) DistributionChart — beeswarm of all peers' INFORM Risk with this unit highlighted
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartTooltip, DIMENSION_COLORS, useChartTheme } from '@/components/charts/theme';
import { ClassLegend, RampLegend } from '@/components/risk/ClassLegend';
import { Segmented } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify, THRESHOLDS } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { rampColor } from '@/engine/risk/metrics';
import { placeKey } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore, slug } from '@/lib/utils';
import { beeswarm, type AreaView } from '../lib';
import { DIM_SHORT, nationalColor, REGION_COLOR, unitColor, useMediaQuery } from './bits';

type TickProps = { x: number | string; y: number | string; payload: { value: unknown }; textAnchor?: string };

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Tooltip shell matching ChartTooltip's look, for charts that need custom rows. */
function TipShell({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-44 rounded-xl border border-border bg-elevated px-3 py-2 text-xs shadow-[var(--shadow-lift)]">
      <div className="font-semibold text-foreground">{title}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      <div className="mt-1.5 grid gap-1">{children}</div>
    </div>
  );
}
function TipRow({ color, label, value, dashed }: { color?: string; label: React.ReactNode; value: React.ReactNode; dashed?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color && <i className={cn('inline-block size-2 rounded-full', dashed && 'rounded-none border-t-2 border-dashed bg-transparent')} style={dashed ? { borderColor: color, width: 10, height: 0 } : { background: color }} />}
        {label}
      </span>
      <span className="num font-semibold text-foreground">{value}</span>
    </div>
  );
}

/** Legend entry: swatch (dot, bar or dashed line) + label. Identity is never colour alone. */
function Key({ color, label, kind = 'dot' }: { color: string; label: React.ReactNode; kind?: 'dot' | 'dash' | 'tick' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {kind === 'dot' && <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />}
      {kind === 'dash' && <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: color }} />}
      {kind === 'tick' && <span className="inline-block h-3 w-[3px] rounded-full" style={{ background: color }} />}
      {label}
    </span>
  );
}

/* ================================================================================================ */
/* a) Categories                                                                                    */
/* ================================================================================================ */

export function CategoryChart({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const th = useChartTheme();
  const wide = useMediaQuery('(min-width: 640px)');
  const [mode, setMode] = React.useState<'radar' | 'bars'>('radar');
  const { unit, region, categories, national } = view;
  const hasNational = unit.level !== 'national';

  const data = categories.map((c) => ({
    cat: c.key,
    dim: c.dim,
    label: t(`cats.${c.key}`),
    full: t(`common:categories.${c.key}`),
    unit: c.value,
    region: c.region,
    national: c.national,
  }));
  const fullByLabel = new Map(data.map((d) => [d.label, `${d.full} · ${t(`common:dimensions.${d.dim}Short`)}`]));

  const series = [
    { key: 'unit' as const, name: unit.name, color: unitColor(th.dark), fill: 0.22, dashed: false },
    ...(region ? [{ key: 'region' as const, name: region.name, color: REGION_COLOR, fill: 0.06, dashed: false }] : []),
    ...(hasNational ? [{ key: 'national' as const, name: t('breadcrumb.country'), color: nationalColor(th.dark), fill: 0, dashed: true }] : []),
  ];

  const order = series.map((s) => s.key as string);

  const csv = [
    [t('csv.dimension'), t('csv.category'), ...series.map((s) => s.name)],
    ...data.map((d) => [t(`common:dimensions.${d.dim}`), d.full, ...series.map((s) => (d[s.key] == null ? '' : formatScore(d[s.key])))]),
  ];

  return (
    <ChartCard
      className="h-full"
      title={t('charts.categories.title')}
      description={hasNational ? t('charts.categories.desc') : t('charts.categories.descNational')}
      csv={csv}
      filename={`${slug(unit.name)}-categories`}
      actions={
        <Segmented
          size="sm"
          aria-label={t('charts.categories.modeLabel')}
          value={mode}
          onValueChange={setMode}
          options={[
            { value: 'radar', label: t('charts.categories.radar') },
            { value: 'bars', label: t('charts.categories.bars') },
          ]}
        />
      }
    >
      <div role="img" aria-label={t('charts.categories.aria', { name: unit.name })}>
        <ResponsiveContainer width="100%" height={340}>
          {mode === 'radar' ? (
            <RadarChart data={data} outerRadius={wide ? '74%' : '62%'} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke={th.grid} />
              <PolarAngleAxis dataKey="label" tick={{ ...th.tick, fontSize: wide ? 11 : 10, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[0, 10]} tickCount={6} angle={90} tick={{ ...th.tick, fontSize: 9 }} axisLine={false} />
              {/* Drawn back-to-front so the area itself sits on top; tooltip keeps reading order. */}
              {[...series].reverse().map((s) => (
                <Radar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={s.fill}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '5 4' : undefined}
                  dot={s.dashed ? false : { r: 3, fill: s.color, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={700}
                />
              ))}
              <Tooltip itemSorter={(item) => order.indexOf(String(item.dataKey))} content={<ChartTooltip labelFormatter={(l) => fullByLabel.get(String(l)) ?? l} />} />
            </RadarChart>
          ) : (
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap="20%" barGap={2}>
              <CartesianGrid horizontal={false} stroke={th.grid} />
              <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={th.tick} stroke={th.axis} />
              <YAxis type="category" dataKey="label" width={wide ? 120 : 92} tick={{ ...th.tick, fontWeight: 600 }} tickLine={false} axisLine={false} interval={0} />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} fillOpacity={s.dashed ? 0.55 : 1} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive animationDuration={600} />
              ))}
              <Tooltip cursor={{ fill: th.cursor }} content={<ChartTooltip labelFormatter={(l) => fullByLabel.get(String(l)) ?? l} />} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {series.map((s) => (
          <Key key={s.key} color={s.color} kind={s.dashed ? 'dash' : 'dot'} label={s.name} />
        ))}
        {unit.level === 'national' && <span>{t('charts.categories.officialNote', { value: formatScore(national.risk) })}</span>}
      </div>
    </ChartCard>
  );
}

/* ================================================================================================ */
/* b) Indicators of one dimension                                                                    */
/* ================================================================================================ */

interface IndicatorDatum {
  indicator: string;
  name: string;
  category: string;
  value: number | null;
  plot: number;
  /** Reference value (national or region). Not called `ref`: Recharts spreads data into element props. */
  refValue: number | null;
}

export function IndicatorChart({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const th = useChartTheme();
  const wide = useMediaQuery('(min-width: 640px)');
  const { unit, region, rows } = view;
  const [dim, setDim] = React.useState<DimensionKey>('hazard');
  const refOptions = [...(unit.level !== 'national' ? (['national'] as const) : []), ...(region ? (['region'] as const) : [])];
  const [refKind, setRefKind] = React.useState<'national' | 'region'>('national');
  const activeRef = refOptions.includes(refKind) ? refKind : (refOptions[0] ?? null);
  const refColor = activeRef === 'region' ? REGION_COLOR : nationalColor(th.dark);
  const refName = activeRef === 'region' ? (region?.name ?? '') : t('breadcrumb.country');

  const data: IndicatorDatum[] = rows
    .filter((r) => r.dim === dim)
    .map((r) => ({
      indicator: r.key,
      name: t(`indicators:${r.key}`),
      category: t(`common:categories.${r.category}`),
      value: r.value,
      plot: r.value ?? 0,
      refValue: activeRef === 'region' ? r.region : activeRef === 'national' ? r.national : null,
    }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  const missing = data.filter((d) => d.value == null).length;
  const surface = th.dark ? '#0d1526' : '#ffffff';

  const shape = (p: BarShapeProps) => {
    const d = p.payload as IndicatorDatum | undefined;
    const bg = p.background;
    if (!d || !bg || bg.x == null || bg.y == null) return <g />;
    const { x, y, width, height } = p;
    const bx = bg.x;
    const bw = bg.width ?? 0;
    const cy = y + height / 2;
    const refX = d.refValue != null ? bx + (d.refValue / 10) * bw : null;
    if (d.value == null) {
      return (
        <g>
          <rect x={bx} y={y + 1} width={bw} height={Math.max(0, height - 2)} rx={4} fill="none" stroke={th.axis} strokeDasharray="4 3" />
          <text x={bx + 8} y={cy} dominantBaseline="central" fontSize={11} fontStyle="italic" fill={th.text}>
            {t('common:classes.noData')}
          </text>
        </g>
      );
    }
    const w = Math.max(width, 2);
    return (
      <g>
        <rect x={bx} y={y} width={bw} height={height} rx={4} fill={th.cursor} />
        <rect x={x} y={y} width={w} height={height} rx={4} fill={rampColor(d.value)} stroke={th.axis} strokeWidth={0.75} />
        {refX != null && <line x1={refX} x2={refX} y1={y - 3} y2={y + height + 3} stroke={refColor} strokeWidth={3} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 1px ${surface})` }} />}
        <text x={x + w + 6} y={cy} dominantBaseline="central" fontSize={11} fontWeight={700} fill={th.dark ? '#e7ecf5' : '#0b1324'} className="num">
          {formatScore(d.value)}
        </text>
      </g>
    );
  };

  const tick = (p: TickProps) => (
    <text x={p.x} y={p.y} dy={4} textAnchor="end" fontSize={11} fill={th.text}>
      {truncate(String(p.payload.value), wide ? 30 : 17)}
    </text>
  );

  const tip = (p: TooltipContentProps) => {
    if (!p.active || !p.payload?.length) return null;
    const d = p.payload[0]?.payload as IndicatorDatum | undefined;
    if (!d) return null;
    return (
      <TipShell title={d.name} sub={d.category}>
        <TipRow color={d.value == null ? undefined : rampColor(d.value)} label={unit.name} value={d.value == null ? t('common:classes.noData') : formatScore(d.value)} />
        {activeRef && <TipRow color={refColor} label={refName} value={d.refValue == null ? t('common:classes.noData') : formatScore(d.refValue)} />}
      </TipShell>
    );
  };

  const csv = [
    [t('csv.indicator'), t('csv.category'), t('csv.dimension'), unit.name, ...(activeRef ? [refName] : [])],
    ...data.map((d) => [d.name, d.category, t(`common:dimensions.${dim}`), d.value == null ? '' : formatScore(d.value), ...(activeRef ? [d.refValue == null ? '' : formatScore(d.refValue)] : [])]),
  ];

  return (
    <ChartCard
      title={t('charts.indicators.title')}
      description={t('charts.indicators.desc')}
      csv={csv}
      filename={`${slug(unit.name)}-${dim}-indicators`}
      actions={
        <Segmented
          size="sm"
          aria-label={t('charts.indicators.dimLabel')}
          value={dim}
          onValueChange={setDim}
          options={DIMENSIONS.map((d) => ({
            value: d.key,
            label: (
              <>
                <span className="inline-block size-2 rounded-full" style={{ background: DIMENSION_COLORS[d.key] }} aria-hidden />
                <span className="sm:hidden">{DIM_SHORT[d.key]}</span>
                <span className="hidden sm:inline">{t(`common:dimensions.${d.key}Short`)}</span>
              </>
            ),
          }))}
        />
      }
    >
      {refOptions.length > 1 && (
        <div className="no-print mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('charts.indicators.compareWith')}</span>
          <Segmented
            size="sm"
            aria-label={t('charts.indicators.compareWith')}
            value={activeRef ?? 'national'}
            onValueChange={setRefKind}
            options={refOptions.map((r) => ({ value: r, label: r === 'region' ? (region?.name ?? '') : t('breadcrumb.country') }))}
          />
        </div>
      )}
      <div role="img" aria-label={t('charts.indicators.aria', { dim: t(`common:dimensions.${dim}`), name: unit.name })}>
        <ResponsiveContainer width="100%" height={data.length * 30 + 44}>
          <BarChart data={data} layout="vertical" margin={{ top: 6, right: 40, bottom: 4, left: 4 }} barCategoryGap={7}>
            <CartesianGrid horizontal={false} stroke={th.grid} />
            <XAxis type="number" domain={[0, 10]} ticks={[0, 2.5, 5, 7.5, 10]} tick={th.tick} stroke={th.axis} />
            <YAxis type="category" dataKey="name" width={wide ? 190 : 118} tick={tick} tickLine={false} axisLine={false} interval={0} />
            <Tooltip cursor={{ fill: th.cursor }} content={tip} />
            <Bar dataKey="plot" background={{ fill: 'transparent' }} shape={shape} isAnimationActive animationDuration={600} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-4 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-[minmax(0,260px)_1fr] sm:items-center">
        <div>
          <div className="mb-1.5 font-medium">{t('charts.indicators.ramp')}</div>
          <RampLegend />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {activeRef && <Key color={refColor} kind="tick" label={t('charts.indicators.refKey', { name: refName })} />}
          {missing > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-5 rounded border border-dashed border-muted-foreground/60" />
              {t('charts.indicators.missing', { count: missing })}
            </span>
          )}
        </div>
      </div>
    </ChartCard>
  );
}

/* ================================================================================================ */
/* c) Position in the distribution                                                                 */
/* ================================================================================================ */

interface DotDatum {
  x: number;
  y: number;
  /** Not called `id`: Recharts spreads data entries into element props. */
  unitId: string;
  name: string;
  region: string;
  group: 'self' | 'region' | 'other';
}

export function DistributionChart({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const th = useChartTheme();
  const navigate = useNavigate();
  const wide = useMediaQuery('(min-width: 640px)');
  const { unit, peers, model, national, rank } = view;
  const isNational = unit.level === 'national';
  const pool: Unit[] = isNational ? model.councils : peers;
  const poolLevel = isNational ? 'council' : unit.level;
  const regionKey = placeKey(unit.region);
  const showRegion = unit.level === 'council' || unit.level === 'source';

  // Minimum horizontal gap (in score units) so dots in a lane never overlap at the chart's smallest width.
  const { points, maxLane } = React.useMemo(() => beeswarm(pool, (u) => u.risk, wide ? 0.2 : 0.26), [pool, wide]);
  const data: DotDatum[] = points.map((p) => ({
    x: p.x,
    y: p.y,
    unitId: p.item.id,
    name: p.item.name,
    region: p.item.region,
    group: p.item.id === unit.id ? 'self' : showRegion && placeKey(p.item.region) === regionKey ? 'region' : 'other',
  }));
  const groups = {
    other: data.filter((d) => d.group === 'other'),
    region: data.filter((d) => d.group === 'region'),
    self: data.filter((d) => d.group === 'self'),
  };
  const lane = Math.max(1, maxLane);
  const height = Math.max(200, Math.min(340, (2 * lane + 2) * (wide ? 13 : 11) + 70));
  const surface = th.dark ? '#0d1526' : '#ffffff';
  const other = th.dark ? 'rgba(203,213,225,0.55)' : 'rgba(71,85,105,0.5)';
  const uc = unitColor(th.dark);
  const peersLabel = t(`peers.${poolLevel}`);

  const dot = (r: number, fill: string) =>
    function DotShape(p: { cx?: number; cy?: number }) {
      if (p.cx == null || p.cy == null) return <g />;
      return <circle cx={p.cx} cy={p.cy} r={r} fill={fill} stroke={surface} strokeWidth={1.25} style={{ cursor: 'pointer' }} />;
    };
  const selfShape = (p: { cx?: number; cy?: number }) => {
    if (p.cx == null || p.cy == null) return <g />;
    return (
      <g>
        <circle cx={p.cx} cy={p.cy} r={13} fill={uc} opacity={0.18} />
        <circle cx={p.cx} cy={p.cy} r={7} fill={uc} stroke={surface} strokeWidth={2} />
        <text x={p.cx} y={p.cy - 18} textAnchor="middle" fontSize={11} fontWeight={800} fill={th.dark ? '#e7ecf5' : '#0b1324'}>
          {formatScore(unit.risk)}
        </text>
      </g>
    );
  };
  const go = (d: unknown) => {
    const id = (d as { payload?: { unitId?: string } } | null)?.payload?.unitId;
    if (id && id !== unit.id) navigate(`/area/${id}`);
  };
  const tip = (p: TooltipContentProps) => {
    if (!p.active || !p.payload?.length) return null;
    const d = p.payload[0]?.payload as DotDatum | undefined;
    if (!d) return null;
    const c = classify(d.x);
    return (
      <TipShell title={d.name} sub={poolLevel === 'council' || poolLevel === 'source' ? d.region : undefined}>
        <TipRow color={c?.color} label={t('common:informRisk')} value={`${formatScore(d.x)} · ${c ? t(`common:classes.${c.key}`) : ''}`} />
        {d.unitId !== unit.id && <div className="mt-1 text-[11px] text-muted-foreground">{t('charts.distribution.clickHint')}</div>}
      </TipShell>
    );
  };

  const bounds = [0, ...THRESHOLDS.risk, 10];
  const csv = [[t('csv.name'), t('csv.region'), t('common:informRisk'), t('csv.highlight')], ...[...data].sort((a, b) => b.x - a.x).map((d) => [d.name, d.region, formatScore(d.x), t(`charts.distribution.group.${d.group}`)])];

  return (
    <ChartCard
      className="h-full"
      title={t('charts.distribution.title')}
      description={isNational ? t('charts.distribution.descNational', { count: pool.length }) : t(`charts.distribution.desc.${poolLevel}`, { count: pool.length })}
      csv={csv}
      filename={`${slug(unit.name)}-distribution`}
    >
      <div
        role="img"
        aria-label={
          rank
            ? t('charts.distribution.aria', { name: unit.name, score: formatScore(unit.risk), rank: rank.rank, total: rank.total, peers: peersLabel })
            : t('charts.distribution.ariaNational', { count: pool.length, score: formatScore(national.risk) })
        }
      >
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 26, right: 12, bottom: 4, left: 12 }}>
            {CLASS_KEYS.map((k, i) => (
              <ReferenceArea key={k} x1={bounds[i]} x2={bounds[i + 1]} fill={CLASS_COLORS[k]} fillOpacity={th.dark ? 0.1 : 0.13} strokeOpacity={0} ifOverflow="hidden" />
            ))}
            <XAxis type="number" dataKey="x" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={th.tick} stroke={th.axis} />
            <YAxis type="number" dataKey="y" domain={[-lane - 1, lane + 1]} hide />
            <Tooltip cursor={false} content={tip} />
            {isNational && (
              <ReferenceLine
                x={national.risk ?? 0}
                stroke={nationalColor(th.dark)}
                strokeDasharray="5 4"
                strokeWidth={2}
                label={{ value: `${t('breadcrumb.country')} ${formatScore(national.risk)}`, position: 'top', fill: th.text, fontSize: 11, fontWeight: 700 }}
              />
            )}
            <Scatter name="other" data={groups.other} shape={dot(wide ? 4 : 3.5, other)} onClick={go} isAnimationActive={false} />
            {groups.region.length > 0 && <Scatter name="region" data={groups.region} shape={dot(wide ? 4.5 : 4, REGION_COLOR)} onClick={go} isAnimationActive={false} />}
            {groups.self.length > 0 && <Scatter name="self" data={groups.self} shape={selfShape} isAnimationActive={false} />}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-center text-[11px] text-muted-foreground">{t('charts.distribution.axis')}</div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        {!isNational && <Key color={uc} kind="dot" label={<span className="font-semibold text-foreground">{unit.name}</span>} />}
        {showRegion && groups.region.length > 0 && <Key color={REGION_COLOR} kind="dot" label={t(`charts.distribution.sameRegion.${poolLevel}`, { region: unit.region })} />}
        <Key color={other} kind="dot" label={t(`charts.distribution.others.${poolLevel}`)} />
        {isNational && <Key color={nationalColor(th.dark)} kind="dash" label={t('charts.distribution.nationalLine')} />}
      </div>
      <ClassLegend orientation="horizontal" className="mt-3" />
    </ChartCard>
  );
}
