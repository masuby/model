import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { CLASS_COLORS, CLASS_KEYS, classRanges, type ClassKey } from '@/engine/risk/classes';
import type { RiskModel } from '@/engine/risk/types';
import { formatNumber } from '@/lib/utils';
import { classCounts, classDistributionByRegion, type DistributionRow } from '../analytics';
import { useBarShape } from '../marks';
import { useInsightTheme } from '../theme';
import { Aside, backedValueLabel, CategoryTick, FigureNote, InsightSection, Legend, TooltipCard, TooltipRow, useMediaQuery } from '../ui';

/**
 * Every class list, legend and stack on this page runs Very high → Very low. In the bars that puts the
 * High and Very High share on the common left baseline, so it compares directly across regions.
 */
const ORDER: readonly ClassKey[] = [...CLASS_KEYS].reverse();

/** Round class marker, as ClassDot draws it, for a class key rather than a score. */
function ClassKeyDot({ k }: { k: ClassKey }) {
  return <span className="inline-block size-2.5 shrink-0 rounded-[2px]" style={{ background: CLASS_COLORS[k] }} aria-hidden />;
}

type Datum = DistributionRow & Record<ClassKey, number> & { highLabel: string };

function DistributionTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t, i18n } = useTranslation(['insights', 'common']);
  const d = payload?.[0]?.payload as Datum | undefined;
  if (!active || !d) return null;
  const pct = (n: number) => formatNumber(d.total ? n / d.total : 0, i18n.language, { style: 'percent', maximumFractionDigits: 0 });
  return (
    <TooltipCard title={d.name} subtitle={t('classes.tooltipTotal', { count: d.total })}>
      {ORDER.map((k) =>
        d.counts[k] ? <TooltipRow key={k} color={CLASS_COLORS[k]} label={t(`common:classes.${k}`)} value={`${d.counts[k]} · ${pct(d.counts[k])}`} /> : null,
      )}
      <div className="mt-1 border-t border-border pt-1.5">
        <TooltipRow label={t('classes.highShare')} value={pct(d.counts.high + d.counts.veryHigh)} strong />
      </div>
    </TooltipCard>
  );
}

export function ClassDistribution({ model }: { model: RiskModel }) {
  const { t, i18n } = useTranslation(['insights', 'common']);
  const th = useInsightTheme();
  const navigate = useNavigate();
  const narrow = useMediaQuery('(max-width: 639px)');
  const lang = i18n.language;

  const rows = React.useMemo<Datum[]>(
    () =>
      classDistributionByRegion(model).map((r) => ({
        ...r,
        ...r.counts,
        highLabel: formatNumber(r.highShare, lang, { style: 'percent', maximumFractionDigits: 0 }),
      })),
    [model, lang],
  );
  const national = React.useMemo(() => classCounts(model.councils, 'risk'), [model]);
  const total = CLASS_KEYS.reduce((s, k) => s + national[k], 0);
  const allHigh = rows.filter((r) => r.total > 0 && r.highShare === 1);
  const noneHigh = rows.filter((r) => r.total > 0 && r.highShare === 0);
  const ranges = classRanges('risk');

  // One shape per class; each draws a 2px surface gap so neighbouring segments stay distinct.
  const colorFns = React.useMemo(() => Object.fromEntries(CLASS_KEYS.map((k) => [k, () => CLASS_COLORS[k]])) as Record<ClassKey, () => string>, []);
  const shapes = {
    veryLow: useBarShape({ colorOf: colorFns.veryLow, gap: th.surface }),
    low: useBarShape({ colorOf: colorFns.low, gap: th.surface }),
    medium: useBarShape({ colorOf: colorFns.medium, gap: th.surface }),
    high: useBarShape({ colorOf: colorFns.high, gap: th.surface }),
    veryHigh: useBarShape({ colorOf: colorFns.veryHigh, gap: th.surface }),
  } satisfies Record<ClassKey, unknown>;

  const valueLabel = React.useMemo(() => backedValueLabel(th.surface), [th.surface]);

  const csv = React.useMemo(
    () => [
      [t('common:labels.region'), 'id', t('classes.councils'), ...CLASS_KEYS.map((k) => t(`common:classes.${k}`)), t('classes.highShare')],
      ...rows.map((r) => [r.name, r.id, r.total, ...CLASS_KEYS.map((k) => r.counts[k]), Math.round(r.highShare * 1000) / 10]),
    ],
    [rows, t],
  );

  const height = rows.length * 24 + 44;

  return (
    <InsightSection id="classes" title={t('classes.title')} lead={t('classes.lead')}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
        <ChartCard title={t('classes.chartTitle')} description={t('classes.chartSub')} csv={csv} filename="class-distribution-by-region">
          <p className="sr-only">{t('classes.aria', { all: allHigh.length, none: noneHigh.length, total: rows.length })}</p>
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 44, bottom: 4, left: 0 }} barCategoryGap={5}>
                <CartesianGrid horizontal={false} stroke={th.grid} />
                <XAxis
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tickFormatter={(v: number) => formatNumber(v, lang, { style: 'percent', maximumFractionDigits: 0 })}
                  tick={th.tick}
                  stroke={th.axis}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={narrow ? 108 : 124}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={(p) => <CategoryTick x={p.x} y={p.y} payload={p.payload} fill={th.text} maxChars={narrow ? 18 : 20} />}
                />
                <Tooltip cursor={{ fill: th.cursor }} content={<DistributionTooltip />} />
                {ORDER.map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    stackId="classes"
                    maxBarSize={16}
                    shape={shapes[k]}
                    cursor="pointer"
                    isAnimationActive={false}
                    onClick={(d) => navigate(`/area/${(d.payload as Datum).id}`)}
                  >
                    {i === ORDER.length - 1 && <LabelList dataKey="highLabel" position="right" fill={th.ink} fontSize={11} fontWeight={600} offset={8} content={valueLabel} />}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend
            className="mt-3"
            aria-label={t('classes.legend')}
            items={ORDER.map((k) => ({ key: k, color: CLASS_COLORS[k], label: t(`common:classes.${k}`) }))}
          />
          <FigureNote>{t('classes.caption')}</FigureNote>
        </ChartCard>

        <Aside title={t('classes.nationalTitle')}>
          <div className="mt-5 flex h-3 gap-0.5 overflow-hidden" role="img" aria-label={ORDER.map((k) => `${t(`common:classes.${k}`)}: ${national[k]}`).join(', ')}>
            {ORDER.map((k) => (national[k] ? <div key={k} style={{ width: `${(national[k] / Math.max(1, total)) * 100}%`, background: CLASS_COLORS[k] }} /> : null))}
          </div>
          <ul className="mt-5 divide-y divide-border border-y border-border text-sm">
            {ORDER.map((k, i) => (
              <li key={k} className="grid grid-cols-[minmax(0,1fr)_auto_3.5rem] items-center gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <ClassKeyDot k={k} />
                  {t(`common:classes.${k}`)}
                  <span className="num text-xs text-muted-foreground">{ranges[CLASS_KEYS.length - 1 - i]}</span>
                </span>
                <span className="num text-right font-medium">{national[k]}</span>
                <span className="num text-right text-muted-foreground">{formatNumber(total ? national[k] / total : 0, lang, { style: 'percent', maximumFractionDigits: 0 })}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-5">
            <div>
              <p className="flex items-baseline gap-3">
                <span className="num text-2xl font-semibold tracking-tight">{allHigh.length}</span>
                <span className="text-sm text-muted-foreground">{t('classes.allHigh', { count: allHigh.length, total: rows.length })}</span>
              </p>
              {allHigh.length > 0 && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{allHigh.map((r) => r.name).join(' · ')}</p>}
            </div>
            <p className="flex items-baseline gap-3">
              <span className="num text-2xl font-semibold tracking-tight">{noneHigh.length}</span>
              <span className="text-sm text-muted-foreground">{t('classes.noneHigh', { count: noneHigh.length, total: rows.length })}</span>
            </p>
          </div>
        </Aside>
      </div>
    </InsightSection>
  );
}
