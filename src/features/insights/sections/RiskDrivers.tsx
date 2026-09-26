import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { DIMENSION_COLORS, DIMENSION_TEXT } from '@/components/charts/theme';
import { Segmented } from '@/components/ui/primitives';
import { DIMENSION_KEYS, type DimensionKey } from '@/engine/risk/hierarchy';
import type { RiskModel } from '@/engine/risk/types';
import { formatNumber, formatScore } from '@/lib/utils';
import { indicatorStats, topDriverCounts, type DriverCount, type IndicatorStat } from '../analytics';
import { useBarShape } from '../marks';
import { useInsightTheme } from '../theme';
import { CategoryTick, InsightSection, Legend, TooltipCard, TooltipRow, WhatThisShows, useMediaQuery } from '../ui';

const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];
type DimFilter = 'all' | DimensionKey;

interface DriverDatum extends DriverCount {
  id: string;
  label: string;
}
interface MeanDatum extends IndicatorStat {
  id: string;
  value: number;
  label: string;
  missing: boolean;
}

const dimColor = (p: unknown) => DIMENSION_COLORS[(p as { dim: DimensionKey }).dim];

function DriverTooltip({ total, active, payload }: { total: number; active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t, i18n } = useTranslation(['insights', 'common', 'indicators']);
  const d = payload?.[0]?.payload as DriverDatum | undefined;
  if (!active || !d) return null;
  return (
    <TooltipCard title={t(`indicators:${d.key}`)} subtitle={t(`common:dimensions.${d.dim}`)}>
      <TooltipRow color={DIMENSION_COLORS[d.dim]} label={t('drivers.topIn')} value={`${d.count} · ${formatNumber(d.count / Math.max(1, total), i18n.language, { style: 'percent', maximumFractionDigits: 0 })}`} strong />
      <TooltipRow label={t('drivers.soleTop')} value={d.sole} />
    </TooltipCard>
  );
}

function MeanTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t } = useTranslation(['insights', 'common', 'indicators']);
  const d = payload?.[0]?.payload as MeanDatum | undefined;
  if (!active || !d) return null;
  return (
    <TooltipCard title={t(`indicators:${d.key}`)} subtitle={`${t(`common:dimensions.${d.dim}`)} · ${t(`common:categories.${d.category}`)}`}>
      {d.missing ? (
        <div className="text-muted-foreground">{t('drivers.noData')}</div>
      ) : (
        <>
          <TooltipRow color={DIMENSION_COLORS[d.dim]} label={t('drivers.mean')} value={formatScore(d.mean)} strong />
          <TooltipRow label={t('drivers.range')} value={`${formatScore(d.min)}–${formatScore(d.max)}`} />
          <TooltipRow label={t('drivers.withData')} value={d.n} />
          {d.min === d.max && <div className="mt-1 max-w-56 text-[11px] leading-snug text-muted-foreground">{t('drivers.uniform')}</div>}
        </>
      )}
    </TooltipCard>
  );
}

export function RiskDrivers({ model }: { model: RiskModel }) {
  const { t, i18n } = useTranslation(['insights', 'common', 'indicators']);
  const th = useInsightTheme();
  const narrow = useMediaQuery('(max-width: 639px)');
  const [dim, setDim] = React.useState<DimFilter>('all');
  const total = model.councils.length;

  const drivers = React.useMemo<DriverDatum[]>(
    () => topDriverCounts(model.councils).map((d) => ({ ...d, id: `${d.dim}:${d.key}`, label: String(d.count) })),
    [model],
  );
  const stats = React.useMemo(() => indicatorStats(model.councils), [model]);
  const means = React.useMemo<MeanDatum[]>(() => {
    const order = (d: DimensionKey) => DIMENSION_KEYS.indexOf(d);
    return stats
      .filter((s) => dim === 'all' || s.dim === dim)
      .map((s) => ({ ...s, id: `${s.dim}:${s.key}`, value: s.mean ?? 0, missing: s.mean === null, label: s.mean === null ? t('drivers.noDataShort') : formatScore(s.mean) }))
      .sort((a, b) => order(a.dim) - order(b.dim) || Number(a.missing) - Number(b.missing) || b.value - a.value);
  }, [stats, dim, t]);

  const shape = useBarShape({ colorOf: dimColor, radius: BAR_RADIUS, activeStroke: th.ink });
  const indicatorLabel = React.useCallback((raw: string) => t(`indicators:${raw.split(':')[1] ?? raw}`), [t]);
  const tick = (p: { x?: number | string; y?: number | string; payload?: { value?: unknown } }) => (
    <CategoryTick x={p.x} y={p.y} payload={p.payload} fill={th.text} maxChars={narrow ? 16 : 26} labelOf={indicatorLabel} />
  );

  const lead = drivers[0];
  const highestMean = React.useMemo(() => [...stats].filter((s) => s.mean !== null).sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))[0], [stats]);

  const legend = DIMENSION_KEYS.map((k) => ({ key: k, color: DIMENSION_TEXT[k], label: t(`common:dimensions.${k}`) }));
  const yWidth = narrow ? 112 : 176;

  const driverCsv = React.useMemo(
    () => [
      ['ref', t('drivers.indicator'), t('drivers.dimension'), t('drivers.topIn'), t('drivers.soleTop')],
      ...drivers.map((d) => [d.id, t(`indicators:${d.key}`), t(`common:dimensions.${d.dim}`), d.count, d.sole]),
    ],
    [drivers, t],
  );
  const meanCsv = React.useMemo(
    () => [
      ['ref', t('drivers.indicator'), t('drivers.dimension'), t('drivers.category'), t('drivers.mean'), 'min', 'max', t('drivers.withData')],
      ...stats.map((s) => [`${s.dim}:${s.key}`, t(`indicators:${s.key}`), t(`common:dimensions.${s.dim}`), t(`common:categories.${s.category}`), formatScore(s.mean), formatScore(s.min), formatScore(s.max), s.n]),
    ],
    [stats, t],
  );

  return (
    <InsightSection id="drivers" index={6} eyebrow={t('drivers.eyebrow')} title={t('drivers.title')} lead={t('drivers.lead')}>
      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <ChartCard title={t('drivers.countTitle')} description={t('drivers.countSub', { total })} csv={driverCsv} filename="top-risk-drivers">
          <div style={{ height: drivers.length * 26 + 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drivers} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={th.grid} />
                <XAxis type="number" allowDecimals={false} tick={th.tick} stroke={th.axis} tickLine={false} />
                <YAxis type="category" dataKey="id" width={yWidth} interval={0} tickLine={false} axisLine={false} tick={tick} />
                <Tooltip cursor={{ fill: th.cursor }} content={<DriverTooltip total={total} />} />
                <Bar dataKey="count" maxBarSize={16} shape={shape}>
                  <LabelList dataKey="label" position="right" fill={th.text} fontSize={11} offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend className="mt-3" items={legend} aria-label={t('drivers.legend')} />
          <WhatThisShows>
            {lead
              ? t('drivers.countCaption', {
                  indicator: t(`indicators:${lead.key}`),
                  count: lead.count,
                  pct: formatNumber(lead.count / Math.max(1, total), i18n.language, { style: 'percent', maximumFractionDigits: 0 }),
                })
              : t('drivers.countCaptionEmpty')}
          </WhatThisShows>
        </ChartCard>

        <ChartCard
          title={t('drivers.meanTitle')}
          description={t('drivers.meanSub')}
          csv={meanCsv}
          filename="indicator-means"
          actions={
            <Segmented<DimFilter>
              size="sm"
              aria-label={t('drivers.filter')}
              value={dim}
              onValueChange={setDim}
              options={[
                { value: 'all', label: t('drivers.all') },
                { value: 'hazard', label: 'H' },
                { value: 'vulnerability', label: 'V' },
                { value: 'coping', label: 'LCC' },
              ]}
            />
          }
        >
          <div style={{ height: means.length * 24 + 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={means} layout="vertical" margin={{ top: 4, right: 52, bottom: 4, left: 0 }} barCategoryGap={5}>
                <CartesianGrid horizontal={false} stroke={th.grid} />
                <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={th.tick} stroke={th.axis} tickLine={false} />
                <YAxis type="category" dataKey="id" width={yWidth} interval={0} tickLine={false} axisLine={false} tick={tick} />
                <Tooltip cursor={{ fill: th.cursor }} content={<MeanTooltip />} />
                <Bar dataKey="value" maxBarSize={14} shape={shape}>
                  <LabelList dataKey="label" position="right" fill={th.text} fontSize={11} offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend className="mt-3" items={dim === 'all' ? legend : legend.filter((l) => l.key === dim)} aria-label={t('drivers.legend')} />
          <WhatThisShows>
            {highestMean
              ? t('drivers.meanCaption', {
                  indicator: t(`indicators:${highestMean.key}`),
                  value: formatScore(highestMean.mean),
                  dimension: t(`common:dimensions.${highestMean.dim}`),
                })
              : t('drivers.countCaptionEmpty')}
          </WhatThisShows>
        </ChartCard>
      </div>
    </InsightSection>
  );
}
