/**
 * Climate year by year for an area: heatwave days a year (1991-2024) and rainfall a year (1981-2025) as
 * bars with the 1991-2020 normal, from the council trend series (src/data/tanzania-council-trends.json).
 * Shown in the explorer's insight column, on the detailed risk card and on the home page.
 */
import { useTranslation } from 'react-i18next';
import type { Unit } from '@/engine/risk/types';
import { formatNumber } from '@/lib/utils';
import { meanOver, seriesFor, useTrends } from '../lib/trends';

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
            {heavyNormal != null && ` ${t('insight.charts.heavySummary', { count: Math.round(heavyNormal * 10) / 10 })}`}
          </p>
        </div>
      )}
      <p className="text-[11px] leading-snug text-muted-foreground">{[heat && data?.sources.heat, rain && data?.sources.rain].filter(Boolean).join(' · ')}</p>
    </div>
  );
}
