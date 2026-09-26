import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/charts/ChartCard';
import { ClassBadge, ClassDot } from '@/components/risk/RiskBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/ui/primitives';
import { classify } from '@/engine/risk/classes';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { formatScore } from '@/lib/utils';
import { LENSES, lensScale, lensValue, rankUnits, type LensKey, type RankRow } from '../analytics';
import { useBarShape } from '../marks';
import { useInsightTheme } from '../theme';
import { CategoryTick, InsightSection, TooltipCard, TooltipRow, WhatThisShows, useMediaQuery } from '../ui';

export const LENS_LABEL: Record<LensKey, string> = {
  risk: 'common:informRisk',
  hazard: 'common:dimensions.hazard',
  vulnerability: 'common:dimensions.vulnerability',
  coping: 'common:dimensions.coping',
};
export const LENS_SHORT: Record<LensKey, string> = {
  risk: 'insights:lens.risk',
  hazard: 'common:dimensions.hazardShort',
  vulnerability: 'common:dimensions.vulnerabilityShort',
  coping: 'common:dimensions.copingShort',
};
const LENS_ABBR: Record<LensKey, string> = { risk: 'R', hazard: 'H', vulnerability: 'V', coping: 'LCC' };

const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

interface Datum extends RankRow {
  label: string;
}

function RankTooltip({ lens, active, payload }: { lens: LensKey; active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const { t } = useTranslation(['insights', 'common']);
  const d = payload?.[0]?.payload as Datum | undefined;
  if (!active || !d) return null;
  const u: Unit = d.unit;
  return (
    <TooltipCard title={d.name} subtitle={t('regions.tooltipMembers', { count: u.members ?? 0 })}>
      {LENSES.map((l) => (
        <TooltipRow
          key={l}
          label={
            <span className="flex items-center gap-1.5">
              <ClassDot value={lensValue(u, l)} scale={lensScale(l)} />
              {t(LENS_SHORT[l])}
            </span>
          }
          value={formatScore(lensValue(u, l))}
          strong={l === lens}
        />
      ))}
      <div className="mt-1 text-[11px] text-muted-foreground">{t('clickToOpen')}</div>
    </TooltipCard>
  );
}

export function RegionalRanking({ model }: { model: RiskModel }) {
  const { t } = useTranslation(['insights', 'common']);
  const th = useInsightTheme();
  const navigate = useNavigate();
  const narrow = useMediaQuery('(max-width: 639px)');
  const [lens, setLens] = React.useState<LensKey>('risk');

  const rows = React.useMemo<Datum[]>(() => rankUnits(model.regions, lens).map((r) => ({ ...r, label: formatScore(r.value) })), [model, lens]);
  const national = lensValue(model.national, lens);
  const valued = rows.filter((r) => typeof r.value === 'number');
  const top = valued.slice(0, 3);
  const bottom = valued.slice(-3).reverse();
  const spread = valued.length ? (valued[0].value as number) - (valued[valued.length - 1].value as number) : null;
  const above = typeof national === 'number' ? valued.filter((r) => (r.value as number) > national).length : null;

  const colorOf = React.useCallback((p: unknown) => (p as Datum).color, []);
  const shape = useBarShape({ colorOf, radius: BAR_RADIUS, activeStroke: th.ink });

  const riskClassLabel = React.useCallback((v: number | null) => {
    const c = classify(v);
    return c ? t(`common:classes.${c.key}`) : '';
  }, [t]);
  const csv = React.useMemo(
    () => [
      [t('common:labels.rank'), t('common:labels.region'), 'id', t('common:informRisk'), t('common:labels.class'), t('common:dimensions.hazard'), t('common:dimensions.vulnerability'), t('common:dimensions.coping')],
      ...rows.map((r, i) => [
        i + 1,
        r.name,
        r.id,
        formatScore(r.unit.risk),
        riskClassLabel(r.unit.risk),
        formatScore(r.unit.dims.hazard.score),
        formatScore(r.unit.dims.vulnerability.score),
        formatScore(r.unit.dims.coping.score),
      ]),
    ],
    [rows, t, riskClassLabel],
  );

  const height = rows.length * 24 + 48;

  return (
    <InsightSection
      id="regions"
      index={2}
      eyebrow={t('regions.eyebrow')}
      title={t('regions.title')}
      lead={t('regions.lead')}
      actions={
        <Segmented<LensKey>
          size="sm"
          aria-label={t('lens.label')}
          value={lens}
          onValueChange={setLens}
          options={LENSES.map((l) => ({
            value: l,
            label: (
              <>
                <span className="sm:hidden">{LENS_ABBR[l]}</span>
                <span className="hidden sm:inline">{t(LENS_SHORT[l])}</span>
              </>
            ),
          }))}
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:items-start">
        <ChartCard
          title={t('regions.chartTitle', { measure: t(LENS_LABEL[lens]) })}
          description={t('regions.chartSub')}
          csv={csv}
          filename={`regional-ranking-${lens}`}
        >
          <p className="sr-only">{t('regions.aria', { measure: t(LENS_LABEL[lens]), top: rows[0]?.name ?? '', value: formatScore(rows[0]?.value) })}</p>
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 18, right: 40, bottom: 4, left: 0 }} barCategoryGap={5}>
                <CartesianGrid horizontal={false} stroke={th.grid} />
                <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={th.tick} stroke={th.axis} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={narrow ? 92 : 124}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={(p) => <CategoryTick x={p.x} y={p.y} payload={p.payload} fill={th.text} maxChars={narrow ? 13 : 19} />}
                />
                <Tooltip cursor={{ fill: th.cursor }} content={<RankTooltip lens={lens} />} />
                {typeof national === 'number' && (
                  <ReferenceLine
                    x={national}
                    stroke={th.ink}
                    strokeOpacity={0.55}
                    strokeDasharray="4 3"
                    label={{ value: t('regions.nationalRef', { value: formatScore(national) }), position: 'top', fill: th.text, fontSize: 11 }}
                  />
                )}
                <Bar dataKey="value" maxBarSize={16} shape={shape} cursor="pointer" onClick={(d) => navigate(`/area/${(d.payload as Datum).id}`)}>
                  <LabelList dataKey="label" position="right" fill={th.text} fontSize={11} offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <WhatThisShows>{t('regions.caption')}</WhatThisShows>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>{t('regions.summaryTitle', { measure: t(LENS_SHORT[lens]) })}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <RankList title={t('regions.highest')} rows={top} lens={lens} offset={0} />
            <RankList title={t('regions.lowest')} rows={bottom} lens={lens} offset={valued.length - 1} descending />
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-5">
              <div>
                <dt className="text-xs text-muted-foreground">{t('regions.spread')}</dt>
                <dd className="num mt-1 font-display text-2xl font-extrabold">{formatScore(spread)}</dd>
                <dd className="text-[11px] text-muted-foreground">{t('regions.spreadSub')}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('regions.above')}</dt>
                <dd className="num mt-1 font-display text-2xl font-extrabold">
                  {above ?? '—'}
                  <span className="text-sm font-semibold text-muted-foreground"> / {valued.length}</span>
                </dd>
                <dd className="text-[11px] text-muted-foreground">{t('regions.aboveSub', { value: formatScore(national) })}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </InsightSection>
  );
}

function RankList({ title, rows, lens, offset, descending }: { title: string; rows: RankRow[]; lens: LensKey; offset: number; descending?: boolean }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h4>
      <ol className="grid gap-1">
        {rows.map((r, i) => (
          <li key={r.id}>
            <Link to={`/area/${r.id}`} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
              <span className="num w-5 text-xs font-bold text-muted-foreground">{descending ? offset - i + 1 : offset + i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold group-hover:text-primary">{r.name}</span>
              <ClassBadge value={r.value} scale={lensScale(lens)} showScore size="sm" />
              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
