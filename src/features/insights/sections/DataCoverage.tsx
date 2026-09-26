import { ArrowRight, TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Label, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type LabelProps } from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { Button } from '@/components/ui/button';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import type { RiskModel } from '@/engine/risk/types';
import { formatNumber } from '@/lib/utils';
import { coverageHistogram, LOCAL_RESOLUTIONS, resolutionBreakdown, type CoverageBin, type Resolution, type ResolutionGroup } from '../analytics';
import { useBarShape } from '../marks';
import { useInsightTheme } from '../theme';
import { InsightSection, TooltipCard, TooltipRow, WhatThisShows } from '../ui';

const COL_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

interface BinDatum extends CoverageBin {
  name: string;
  have: number;
}

function CoverageTooltip({ total, active, payload }: { total: number; active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t } = useTranslation('insights');
  const d = payload?.[0]?.payload as BinDatum | undefined;
  if (!active || !d) return null;
  return (
    <TooltipCard title={t('coverage.tooltipTitle', { have: d.have, total })}>
      <TooltipRow label={t('coverage.councils')} value={d.count} strong />
      <TooltipRow label={t('coverage.share')} value={`${d.coverage}%`} />
    </TooltipCard>
  );
}

function ResolutionTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t } = useTranslation(['insights', 'indicators']);
  const d = payload?.[0]?.payload as (ResolutionGroup & { fill: string }) | undefined;
  if (!active || !d) return null;
  return (
    <TooltipCard title={t(`coverage.res.${d.resolution}`)} subtitle={t(`coverage.resDesc.${d.resolution}`)}>
      <TooltipRow color={d.fill} label={t('coverage.indicators')} value={d.count} strong />
    </TooltipCard>
  );
}

export function DataCoverage({ model }: { model: RiskModel }) {
  const { t, i18n } = useTranslation(['insights', 'common', 'indicators']);
  const th = useInsightTheme();
  const lang = i18n.language;
  const nInd = ALL_INDICATORS.length;

  const bins = React.useMemo<BinDatum[]>(
    () => coverageHistogram(model.councils).map((b) => ({ ...b, name: `${b.coverage}%`, have: Math.round((b.coverage / 100) * nInd) })),
    [model, nInd],
  );
  const councils = model.councils.length;
  const median = React.useMemo(() => {
    const xs: number[] = [];
    for (const b of bins) for (let i = 0; i < b.count; i++) xs.push(b.coverage);
    return xs.length ? xs[Math.floor((xs.length - 1) / 2)] : null;
  }, [bins]);
  const atLeast90 = bins.filter((b) => b.coverage >= 90).reduce((s, b) => s + b.count, 0);

  const groups = React.useMemo(() => resolutionBreakdown().map((g) => ({ ...g, fill: th.resolution[g.resolution] })), [th.resolution]);
  const count = (r: Resolution) => groups.find((g) => g.resolution === r)?.count ?? 0;
  const local = LOCAL_RESOLUTIONS.reduce((s, r) => s + count(r), 0);

  const seriesColor = React.useCallback(() => th.series, [th.series]);
  const colShape = useBarShape({ colorOf: seriesColor, radius: COL_RADIUS, activeStroke: th.ink });

  const renderCentre = React.useCallback(
    (props: LabelProps) => {
      const vb = props.viewBox as { cx?: number; cy?: number } | undefined;
      if (typeof vb?.cx !== 'number' || typeof vb?.cy !== 'number') return <g />;
      return (
        <g>
          <text x={vb.cx} y={vb.cy - 4} textAnchor="middle" fill={th.ink} fontSize={28} fontWeight={800}>
            {`${local}/${nInd}`}
          </text>
          <text x={vb.cx} y={vb.cy + 16} textAnchor="middle" fill={th.text} fontSize={11}>
            {t('coverage.centre')}
          </text>
        </g>
      );
    },
    [local, nInd, t, th.ink, th.text],
  );

  const binCsv = React.useMemo(() => [[t('coverage.share'), t('coverage.indicatorsWithData'), t('coverage.councils')], ...bins.map((b) => [b.coverage, b.have, b.count])], [bins, t]);
  const resCsv = React.useMemo(
    () => [
      ['ref', t('drivers.indicator'), t('drivers.dimension'), t('coverage.resolution'), t('common:labels.source'), t('coverage.method')],
      ...ALL_INDICATORS.map(({ dimension, indicator }) => {
        const src = sourceFor(dimension.key, indicator.key);
        return [`${dimension.key}:${indicator.key}`, t(`indicators:${indicator.key}`), t(`common:dimensions.${dimension.key}`), t(`coverage.res.${src.resolution}`), sourceLabel(src), src.method];
      }),
    ],
    [t],
  );

  const pct = (x: number) => formatNumber(x, lang, { style: 'percent', maximumFractionDigits: 0 });

  return (
    <InsightSection id="coverage" index={7} eyebrow={t('coverage.eyebrow')} title={t('coverage.title')} lead={t('coverage.lead')}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ChartCard title={t('coverage.histTitle')} description={t('coverage.histSub', { total: nInd })} csv={binCsv} filename="data-coverage">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bins} margin={{ top: 22, right: 8, bottom: 22, left: -12 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={th.grid} />
                <XAxis
                  dataKey="name"
                  tick={th.tick}
                  stroke={th.axis}
                  tickLine={false}
                  label={{ value: t('coverage.xAxis'), position: 'insideBottom', offset: -14, fill: th.text, fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={th.tick} stroke={th.axis} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: th.cursor }} content={<CoverageTooltip total={nInd} />} />
                <Bar dataKey="count" maxBarSize={44} shape={colShape}>
                  <LabelList dataKey="count" position="top" fill={th.text} fontSize={11} fontWeight={600} offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/60 px-3 py-2.5">
              <dt className="text-[11px] text-muted-foreground">{t('coverage.median')}</dt>
              <dd className="num font-display text-xl font-extrabold">{median === null ? '—' : `${median}%`}</dd>
            </div>
            <div className="rounded-xl bg-muted/60 px-3 py-2.5">
              <dt className="text-[11px] text-muted-foreground">{t('coverage.atLeast90')}</dt>
              <dd className="num font-display text-xl font-extrabold">
                {atLeast90}
                <span className="text-sm font-semibold text-muted-foreground"> / {councils}</span>
              </dd>
            </div>
          </dl>
          <WhatThisShows>{t('coverage.histCaption', { median: median ?? '—', total: nInd })}</WhatThisShows>
        </ChartCard>

        <ChartCard title={t('coverage.resTitle')} description={t('coverage.resSub')} csv={resCsv} filename="indicator-provenance">
          <div className="grid items-center gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
            <div className="mx-auto h-[220px] w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ResolutionTooltip />} />
                  <Pie
                    data={groups}
                    dataKey="count"
                    nameKey="resolution"
                    innerRadius="64%"
                    outerRadius="96%"
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke={th.surface}
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                  >
                    <Label position="center" content={renderCentre} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid gap-3">
              {groups.map((g) => (
                <li key={g.resolution}>
                  <div className="flex items-center gap-2">
                    <span className="size-3 shrink-0 rounded-[4px]" style={{ background: g.fill }} aria-hidden />
                    <span className="flex-1 text-sm font-semibold">{t(`coverage.res.${g.resolution}`)}</span>
                    <span className="num text-sm font-bold">{g.count}</span>
                    <span className="num w-10 text-right text-xs text-muted-foreground">{pct(g.count / nInd)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 pl-5">
                    {g.indicators.map((l) => (
                      <span
                        key={`${l.dimension.key}:${l.indicator.key}`}
                        title={sourceLabel(sourceFor(l.dimension.key, l.indicator.key))}
                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t(`indicators:${l.indicator.key}`)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <WhatThisShows>{t('coverage.resCaption', { local, total: nInd, pct: pct(local / nInd) })}</WhatThisShows>
        </ChartCard>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-warning/30 bg-warning/6 p-5 sm:flex-row sm:items-start sm:p-6">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold">{t('coverage.honestTitle')}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {t('coverage.honestBody', { national: count('national'), overlay: count('overlay'), region: count('region'), total: nInd })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/methodology">
                {t('coverage.readMethod')} <ArrowRight />
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/data">
                {t('coverage.contribute')} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </InsightSection>
  );
}
