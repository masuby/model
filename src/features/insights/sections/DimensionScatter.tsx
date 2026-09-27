import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, type ScatterShapeProps } from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { ClassDot } from '@/components/risk/RiskBadge';
import { Select, SelectItem } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS, classify, THRESHOLDS, type ClassKey } from '@/engine/risk/classes';
import { isNum } from '@/engine/risk/math';
import type { RiskModel } from '@/engine/risk/types';
import { formatCompact, formatNumber, formatScore } from '@/lib/utils';
import { classCounts, HIGH_INDEX } from '../analytics';
import { useInsightTheme } from '../theme';
import { Aside, FigureNote, InsightSection, Legend, SubHeading, TooltipCard, TooltipRow, useMediaQuery } from '../ui';

interface Point {
  id: string;
  name: string;
  region: string;
  h: number;
  v: number;
  c: number | null;
  risk: number | null;
  pop: number;
  color: string;
  classKey: ClassKey | null;
  hot: boolean;
}

const ALL = '__all__';
/** Start of the "High" class on each axis' own scale. */
const H_HIGH = THRESHOLDS.hazard[HIGH_INDEX - 1];
const V_HIGH = THRESHOLDS.vulnerability[HIGH_INDEX - 1];

function CouncilTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t, i18n } = useTranslation(['insights', 'common']);
  const d = payload?.[0]?.payload as Point | undefined;
  if (!active || !d) return null;
  const row = (label: string, value: number | null, scale: 'hazard' | 'vulnerability' | 'coping' | 'risk', strong?: boolean) => (
    <TooltipRow
      label={
        <span className="flex items-center gap-1.5">
          <ClassDot value={value} scale={scale} />
          {label}
        </span>
      }
      value={formatScore(value)}
      strong={strong}
    />
  );
  return (
    <TooltipCard title={d.name} subtitle={d.region}>
      {row(t('common:dimensions.hazardShort'), d.h, 'hazard')}
      {row(t('common:dimensions.vulnerabilityShort'), d.v, 'vulnerability')}
      {row(t('common:dimensions.copingShort'), d.c, 'coping')}
      {row(t('common:informRisk'), d.risk, 'risk', true)}
      <TooltipRow label={t('common:labels.population')} value={formatNumber(d.pop, i18n.language)} />
      <div className="mt-1 text-[11px] text-muted-foreground">{t('clickToOpen')}</div>
    </TooltipCard>
  );
}

export function DimensionScatter({ model }: { model: RiskModel }) {
  const { t, i18n } = useTranslation(['insights', 'common']);
  const th = useInsightTheme();
  const navigate = useNavigate();
  const narrow = useMediaQuery('(max-width: 639px)');
  const [focus, setFocus] = React.useState<string>(ALL);

  const points = React.useMemo<Point[]>(() => {
    const out: Point[] = [];
    for (const u of model.councils) {
      const h = u.dims.hazard.score;
      const v = u.dims.vulnerability.score;
      if (!isNum(h) || !isNum(v)) continue;
      const c = classify(u.risk);
      out.push({
        id: u.id,
        name: u.name,
        region: u.region,
        h,
        v,
        c: u.dims.coping.score,
        risk: u.risk,
        pop: u.exposure?.population ?? 0,
        color: c?.color ?? '#94a3b8',
        classKey: c?.key ?? null,
        hot: h >= H_HIGH && v >= V_HIGH,
      });
    }
    return out;
  }, [model]);

  // Draw big bubbles first so small ones stay visible; the focused region is drawn last (on top).
  const ordered = React.useMemo(
    () => [...points].sort((a, b) => Number(focus !== ALL && a.region === focus) - Number(focus !== ALL && b.region === focus) || b.pop - a.pop),
    [points, focus],
  );

  const regions = React.useMemo(() => [...new Set(points.map((p) => p.region))].sort((a, b) => a.localeCompare(b)), [points]);
  const maxPop = Math.max(1, ...points.map((p) => p.pop));
  const hs = points.map((p) => p.h);
  const vs = points.map((p) => p.v);
  const xDomain: [number, number] = [Math.max(0, Math.floor(Math.min(...hs, THRESHOLDS.hazard[0]))), Math.min(10, Math.ceil(Math.max(...hs, THRESHOLDS.hazard[3]) + 0.05))];
  const yDomain: [number, number] = [Math.max(0, Math.floor(Math.min(...vs, THRESHOLDS.vulnerability[0]))), Math.min(10, Math.ceil(Math.max(...vs, THRESHOLDS.vulnerability[3]) + 0.05))];

  const hot = points.filter((p) => p.hot).sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0));
  const hotPop = hot.reduce((s, p) => s + p.pop, 0);
  const counts = classCounts(model.councils, 'risk');

  const renderBubble = React.useCallback(
    (p: ScatterShapeProps) => {
      const d = p.payload as Point | undefined;
      if (!d || !isNum(p.cx) || !isNum(p.cy)) return <g />;
      const r = Math.max(3, p.width / 2);
      const dimmed = focus !== ALL && d.region !== focus;
      return (
        <g opacity={dimmed ? 0.14 : 1} style={{ cursor: 'pointer', transition: 'opacity 150ms ease' }} onClick={() => navigate(`/area/${d.id}`)}>
          {/* Hit target ≥ 24px so small bubbles are easy to hover and click. */}
          <circle cx={p.cx} cy={p.cy} r={Math.max(r, 12)} fill="transparent" />
          <circle cx={p.cx} cy={p.cy} r={r} fill={d.color} fillOpacity={p.isActive ? 1 : 0.85} stroke={p.isActive ? th.ink : th.surface} strokeWidth={p.isActive ? 2 : 1.25} />
        </g>
      );
    },
    [focus, navigate, th.ink, th.surface],
  );

  const csv = React.useMemo(
    () => [
      ['id', t('common:levels.council'), t('common:labels.region'), t('common:dimensions.hazard'), t('common:dimensions.vulnerability'), t('common:dimensions.coping'), t('common:informRisk'), t('common:labels.class'), t('common:labels.population')],
      ...points.map((p) => [p.id, p.name, p.region, formatScore(p.h), formatScore(p.v), formatScore(p.c), formatScore(p.risk), p.classKey ? t(`common:classes.${p.classKey}`) : '', p.pop]),
    ],
    [points, t],
  );

  const axisLabel = { fill: th.text, fontSize: 12, fontWeight: 600 } as const;

  return (
    <InsightSection
      id="dimensions"
      title={t('scatter.title')}
      lead={t('scatter.lead')}
      actions={
        <Select value={focus} onValueChange={setFocus} aria-label={t('scatter.highlight')} className="w-full sm:w-56">
          <SelectItem value={ALL}>{t('scatter.allRegions')}</SelectItem>
          {regions.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </Select>
      }
    >
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] xl:items-start xl:gap-14">
        <ChartCard title={t('scatter.chartTitle')} description={t('scatter.chartSub')} csv={csv} filename="hazard-vulnerability-bubbles">
          <p className="sr-only">{t('scatter.aria', { count: hot.length, total: points.length })}</p>
          <div className="h-[380px] sm:h-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: narrow ? 8 : 20, bottom: 30, left: narrow ? -8 : 4 }}>
                <CartesianGrid stroke={th.grid} />
                <ReferenceArea
                  x1={H_HIGH}
                  x2={xDomain[1]}
                  y1={V_HIGH}
                  y2={yDomain[1]}
                  fill={CLASS_COLORS.veryHigh}
                  fillOpacity={th.dark ? 0.1 : 0.06}
                  stroke="none"
                  label={narrow ? undefined : { value: t('scatter.hotLabel'), position: 'insideTopRight', fill: th.text, fontSize: 11, fontWeight: 600 }}
                />
                {THRESHOLDS.hazard.map((x, i) => (
                  <ReferenceLine key={`x${x}`} x={x} stroke={th.axis} strokeOpacity={i === HIGH_INDEX - 1 ? 1 : 0.55} strokeWidth={i === HIGH_INDEX - 1 ? 1.25 : 1} strokeDasharray="3 4" />
                ))}
                {THRESHOLDS.vulnerability.map((y, i) => (
                  <ReferenceLine key={`y${y}`} y={y} stroke={th.axis} strokeOpacity={i === HIGH_INDEX - 1 ? 1 : 0.55} strokeWidth={i === HIGH_INDEX - 1 ? 1.25 : 1} strokeDasharray="3 4" />
                ))}
                <XAxis
                  type="number"
                  dataKey="h"
                  domain={xDomain}
                  allowDataOverflow
                  tickCount={xDomain[1] - xDomain[0] + 1}
                  tick={th.tick}
                  stroke={th.axis}
                  tickLine={false}
                  label={{ value: t('scatter.xAxis'), position: 'insideBottom', offset: -18, ...axisLabel }}
                />
                <YAxis
                  type="number"
                  dataKey="v"
                  domain={yDomain}
                  allowDataOverflow
                  tickCount={yDomain[1] - yDomain[0] + 1}
                  tick={th.tick}
                  stroke={th.axis}
                  tickLine={false}
                  width={44}
                  label={{ value: t('scatter.yAxis'), angle: -90, position: 'insideLeft', offset: 14, style: { textAnchor: 'middle' }, ...axisLabel }}
                />
                <ZAxis type="number" dataKey="pop" domain={[0, maxPop]} range={narrow ? [18, 380] : [28, 640]} />
                <Tooltip cursor={{ stroke: th.axis, strokeDasharray: '3 3' }} content={<CouncilTooltip />} isAnimationActive={false} />
                <Scatter data={ordered} shape={renderBubble} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Legend
              aria-label={t('scatter.legendClasses')}
              items={[...CLASS_KEYS].reverse().map((k) => ({ key: k, color: CLASS_COLORS[k], label: t(`common:classes.${k}`), value: counts[k], shape: 'dot' as const }))}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg width="34" height="16" aria-hidden className="shrink-0">
                <circle cx="5" cy="11" r="3" fill="none" stroke="currentColor" />
                <circle cx="22" cy="8" r="7.5" fill="none" stroke="currentColor" />
              </svg>
              {t('scatter.sizeLegend')}
            </div>
          </div>
          <FigureNote>{t('scatter.caption', { h: formatScore(H_HIGH), v: formatScore(V_HIGH) })}</FigureNote>
        </ChartCard>

        {/* Below xl the aside spans the page: summary on the left, list on the right, so rows stay short. */}
        <Aside title={t('scatter.hotTitle')}>
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-x-12 xl:block">
            <div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="num text-4xl font-semibold tracking-tight">{hot.length}</span>
                <span className="text-sm text-muted-foreground">{t('scatter.hotOf', { total: points.length })}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{t('scatter.hotBody', { pop: formatCompact(hotPop, i18n.language), h: formatScore(H_HIGH), v: formatScore(V_HIGH) })}</p>
            </div>
            {hot.length > 0 && (
              <div>
                <SubHeading className="mt-8 lg:mt-4 xl:mt-8">{t('scatter.hotTop')}</SubHeading>
                <ol className="mt-2 divide-y divide-border border-y border-border">
                  {hot.slice(0, 8).map((p) => (
                    <li key={p.id}>
                      <Link to={`/area/${p.id}`} className="group flex items-center gap-3 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium underline-offset-4 group-hover:text-primary group-hover:underline">{p.name}</span>
                          {/* Dimension names spelled out (no H/V abbreviations, which read differently in Kiswahili). */}
                          <span className="block text-xs leading-snug text-muted-foreground">
                            {p.region} · {t('common:dimensions.hazardShort')} <span className="num">{formatScore(p.h)}</span> · {t('common:dimensions.vulnerabilityShort')}{' '}
                            <span className="num">{formatScore(p.v)}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-sm">
                          <ClassDot value={p.risk} />
                          <span className="text-muted-foreground">{p.classKey ? t(`common:classes.${p.classKey}`) : t('common:classes.noData')}</span>
                          <span className="num w-8 text-right font-semibold">{formatScore(p.risk)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Aside>
      </div>
    </InsightSection>
  );
}
