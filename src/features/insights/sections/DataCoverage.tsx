import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import type { RiskModel } from '@/engine/risk/types';
import { formatNumber, NO_VALUE } from '@/lib/utils';
import { coverageHistogram, LOCAL_RESOLUTIONS, resolutionBreakdown, type CoverageBin, type Resolution, type ResolutionGroup } from '../analytics';
import { useBarShape } from '../marks';
import { useInsightTheme } from '../theme';
import { backedValueLabel, FigureNote, InsightSection, TooltipCard, TooltipRow } from '../ui';

const COL_RADIUS: [number, number, number, number] = [2, 2, 0, 0];

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
  const valueLabel = React.useMemo(() => backedValueLabel(th.surface), [th.surface]);

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
    <InsightSection id="coverage" title={t('coverage.title')} lead={t('coverage.lead')}>
      {/* Two figures side by side on large screens; a shared subgrid keeps their plots level. */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-0">
        <ChartCard
          className="lg:row-span-2 lg:grid lg:grid-rows-subgrid"
          title={t('coverage.histTitle')}
          description={t('coverage.histSub', { total: nInd })}
          csv={binCsv}
          filename="data-coverage"
        >
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
                <Bar dataKey="count" maxBarSize={44} shape={colShape} isAnimationActive={false}>
                  <LabelList dataKey="count" position="top" fill={th.text} fontSize={11} fontWeight={600} offset={6} content={valueLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-6 grid grid-cols-2 divide-x divide-border border-t border-border pt-4">
            <div className="pr-5">
              <dt className="text-sm text-muted-foreground">{t('coverage.median')}</dt>
              <dd className="num mt-1 text-2xl font-semibold tracking-tight">{median === null ? NO_VALUE : `${median}%`}</dd>
            </div>
            <div className="pl-5">
              <dt className="text-sm text-muted-foreground">{t('coverage.atLeast90')}</dt>
              <dd className="num mt-1 text-2xl font-semibold tracking-tight">
                {atLeast90}
                <span className="text-base font-medium text-muted-foreground"> / {councils}</span>
              </dd>
            </div>
          </dl>
          <FigureNote>{t('coverage.histCaption')}</FigureNote>
        </ChartCard>

        <ChartCard
          className="lg:row-span-2 lg:grid lg:grid-rows-subgrid"
          title={t('coverage.resTitle')}
          description={t('coverage.resSub')}
          csv={resCsv}
          filename="indicator-provenance"
        >
          <div className="grid items-start gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
            {/* The ring is Recharts; its centre figure is plain HTML laid over it (Recharts 3 does not
                render a centred <Label> inside a Pie). */}
            <div className="relative mx-auto size-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ResolutionTooltip />} />
                  <Pie
                    data={groups}
                    dataKey="count"
                    nameKey="resolution"
                    innerRadius="66%"
                    outerRadius="96%"
                    paddingAngle={2}
                    cornerRadius={1}
                    stroke={th.surface}
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center justify-items-center text-center">
                <span className="num text-[1.75rem] leading-none font-semibold tracking-tight">
                  {local}
                  <span className="text-base font-medium text-muted-foreground">/{nInd}</span>
                </span>
                <span className="mt-1.5 max-w-24 text-xs leading-snug text-muted-foreground">{t('coverage.centre')}</span>
              </div>
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {groups.map((g) => (
                <li key={g.resolution} className="py-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="size-2.5 shrink-0" style={{ background: g.fill }} aria-hidden />
                    <span className="flex-1 font-medium">{t(`coverage.res.${g.resolution}`)}</span>
                    <span className="num font-semibold">{g.count}</span>
                    <span className="num w-10 text-right text-muted-foreground">{pct(g.count / nInd)}</span>
                  </div>
                  <p className="mt-1 pl-5 text-xs leading-relaxed text-muted-foreground">{g.indicators.map((l) => t(`indicators:${l.indicator.key}`)).join(', ')}</p>
                  {/* Each indicator's source, in reach on every device and from the keyboard (no hover-only tooltips). */}
                  <details className="mt-1.5 pl-5 text-xs">
                    <summary className="w-fit cursor-pointer font-medium text-primary underline-offset-4 hover:underline">
                      {t('coverage.showSources')}
                      <span className="sr-only">: {t(`coverage.res.${g.resolution}`)}</span>
                    </summary>
                    <ul className="mt-2 mb-1 space-y-1 border-l border-border pl-3 leading-relaxed text-muted-foreground">
                      {g.indicators.map((l) => (
                        <li key={`${l.dimension.key}:${l.indicator.key}`}>
                          <span className="text-foreground">{t(`indicators:${l.indicator.key}`)}</span> · {sourceLabel(sourceFor(l.dimension.key, l.indicator.key))}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </div>
          <FigureNote>{t('coverage.resCaption', { local, total: nInd, pct: pct(local / nInd) })}</FigureNote>
        </ChartCard>
      </div>

      <div className="mt-14 max-w-3xl border-l-2 border-warning pl-5">
        <h3 className="text-base font-semibold">{t('coverage.honestTitle')}</h3>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {t('coverage.honestBody', { national: count('national'), overlay: count('overlay'), region: count('region'), total: nInd })}
        </p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link to="/methodology" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
            {t('coverage.readMethod')} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link to="/data" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
            {t('coverage.contribute')} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </p>
      </div>
    </InsightSection>
  );
}
