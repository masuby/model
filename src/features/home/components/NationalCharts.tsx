/**
 * The national risk picture under the home page's headline, where the four figures were: four compact
 * charts in each scale's own colours. Risk and its three parts on their class tracks; the councils by
 * risk class as a pie; how the three parts relate to risk across all the councils; and heatwave days
 * year by year for Tanzania.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLASS_KEYS, classColor, classify, THRESHOLDS, type ClassKey, type Scale } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { YearBars } from '@/features/explore/components/ClimateTrends';
import { meanOver, seriesFor, useTrends } from '@/features/explore/lib/trends';
import { cn, formatCompact, formatNumber, formatScore } from '@/lib/utils';

type PartKey = 'risk' | DimensionKey;
const PARTS: ReadonlyArray<{ key: PartKey; scale: Scale }> = [{ key: 'risk', scale: 'risk' }, ...DIMENSIONS.map((d) => ({ key: d.key, scale: d.scale }))];
const valueOf = (u: Unit, key: PartKey) => (key === 'risk' ? u.risk : u.dims[key].score);
/** The line colour of each part in the relation chart: the "high" class of its own palette, risk in ink. */
const LINE: Record<PartKey, string> = { risk: 'var(--foreground)', hazard: classColor('high', 'hazard'), vulnerability: classColor('high', 'vulnerability'), coping: classColor('high', 'coping') };
/** Councils averaged together in the relation chart, so the lines read. */
const SMOOTH = 9;

export function NationalCharts({ model, className }: { model: RiskModel; className?: string }) {
  const { t, i18n } = useTranslation(['home', 'common']);
  const national = model.national;
  const population = model.councils.reduce((s, c) => s + (c.exposure?.population ?? 0), 0);
  const counts = React.useMemo(() => {
    const c = Object.fromEntries(CLASS_KEYS.map((k) => [k, 0])) as Record<ClassKey, number>;
    for (const u of model.councils) {
      const k = classify(u.risk, 'risk')?.key;
      if (k) c[k]++;
    }
    return c;
  }, [model]);
  const high = counts.high + counts.veryHigh;
  return (
    <div className={cn('grid gap-x-8 gap-y-8 sm:grid-cols-2', className)}>
      <Block title={t('picture.parts')} note={t('picture.partsNote', { councils: model.councils.length, people: formatCompact(population, i18n.language) })}>
        <PartTracks unit={national} />
      </Block>
      <Block title={t('picture.pie')} note={t('picture.pieNote', { high, pct: Math.round((high / model.councils.length) * 100) })}>
        <ClassPie counts={counts} total={model.councils.length} />
      </Block>
      <Block title={t('picture.relation')} note={t('picture.relationNote', { count: model.councils.length, window: SMOOTH })}>
        <RelationLines model={model} />
      </Block>
      <HeatTrend unit={national} />
    </div>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      {note && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Risk and its three parts, each on the class track of its own scale: the five classes sized by their thresholds, the one the score falls in in full colour. */
function PartTracks({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <ul className="space-y-2.5">
      {PARTS.map(({ key, scale }) => {
        const v = valueOf(unit, key);
        const c = classify(v, scale);
        const bounds = [0, ...THRESHOLDS[scale], 10];
        const label = key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}Short`);
        const cls = c ? t(`common:classes.${c.key}`) : t('common:classes.noData');
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className={cn('truncate', key === 'risk' && 'font-semibold')}>{label}</span>
              <span className="num inline-flex shrink-0 items-baseline gap-1.5">
                <span className="text-muted-foreground">{cls}</span>
                <span className="font-semibold">{formatScore(v)}</span>
              </span>
            </div>
            <div className="relative mt-1" role="img" aria-label={t('picture.trackAria', { label, score: formatScore(v), cls })}>
              <div className="flex h-2 gap-px">
                {CLASS_KEYS.map((k, i) => (
                  <span key={k} className="h-full" style={{ width: `${(bounds[i + 1] - bounds[i]) * 10}%`, background: classColor(k, scale), opacity: c?.key === k ? 1 : 0.28 }} />
                ))}
              </div>
              {isNum(v) && <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: `${Math.max(0, Math.min(100, v * 10))}%` }} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** The councils by risk class as a pie in the risk palette, with the count and share of each class beside it. */
function ClassPie({ counts, total }: { counts: Record<ClassKey, number>; total: number }) {
  const { t } = useTranslation(['home', 'common']);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const slices = CLASS_KEYS.map((k) => {
    const share = total ? counts[k] / total : 0;
    const slice = { key: k, share, dash: `${share * c} ${c - share * c}`, offset: -offset * c };
    offset += share;
    return slice;
  });
  const label = CLASS_KEYS.map((k) => `${t(`common:classes.${k}`)} ${counts[k]} (${Math.round((counts[k] / total) * 100)}%)`).join(', ');
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`${t('picture.pie')}: ${label}`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="18" />
        {slices.map((s) =>
          s.share > 0 ? <circle key={s.key} cx="50" cy="50" r={r} fill="none" stroke={classColor(s.key, 'risk')} strokeWidth="18" strokeDasharray={s.dash} strokeDashoffset={s.offset} /> : null,
        )}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1 text-xs">
        {[...CLASS_KEYS].reverse().map((k) => (
          <li key={k} className="flex items-baseline justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-[2px]" style={{ background: classColor(k, 'risk') }} aria-hidden />
              <span className="truncate">{t(`common:classes.${k}`)}</span>
            </span>
            <span className="num shrink-0">
              <span className="font-semibold">{counts[k]}</span> <span className="text-muted-foreground">{Math.round((counts[k] / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rolling mean of a series over an odd window, centred. */
function smooth(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - half), Math.min(values.length, i + half + 1));
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

/** The three parts against risk across every council: councils ranked by risk, highest first, each part a smoothed line. */
function RelationLines({ model }: { model: RiskModel }) {
  const { t } = useTranslation(['home', 'common']);
  const W = 320;
  const H = 120;
  const PAD = { l: 18, r: 4, t: 6, b: 16 };
  const ranked = React.useMemo(() => model.councils.filter((u) => isNum(u.risk)).sort((a, b) => b.risk! - a.risk!), [model]);
  const lines = React.useMemo(
    () =>
      PARTS.map(({ key }) => ({
        key,
        points: smooth(
          ranked.map((u) => valueOf(u, key) ?? 0),
          SMOOTH,
        ),
      })),
    [ranked],
  );
  const x = (i: number) => PAD.l + (i / Math.max(1, ranked.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / 10) * (H - PAD.t - PAD.b);
  const path = (points: number[]) => points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const name = (key: PartKey) => (key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}Short`));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" role="img" aria-label={t('picture.relationAria', { count: ranked.length })}>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.15} strokeWidth={0.75} />
            <text x={PAD.l - 4} y={y(v)} textAnchor="end" dominantBaseline="central" fontSize="8" fill="currentColor" fillOpacity={0.6}>
              {v}
            </text>
          </g>
        ))}
        {lines.map((l) => (
          <path key={l.key} d={path(l.points)} fill="none" stroke={LINE[l.key]} strokeWidth={l.key === 'risk' ? 2 : 1.5} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        <text x={PAD.l} y={H - 3} fontSize="8" fill="currentColor" fillOpacity={0.6}>
          {t('picture.relationLeft')}
        </text>
        <text x={W - PAD.r} y={H - 3} textAnchor="end" fontSize="8" fill="currentColor" fillOpacity={0.6}>
          {t('picture.relationRight')}
        </text>
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground" aria-hidden>
        {PARTS.map(({ key }) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: LINE[key] }} />
            {name(key)}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Heatwave days a year for Tanzania, 1991-2024, against the 1991-2020 average. */
function HeatTrend({ unit }: { unit: Unit }) {
  const { t, i18n } = useTranslation('home');
  const { data } = useTrends();
  const heat = seriesFor(data?.heat, unit);
  if (!heat) return <Block title={t('picture.trends')}>{<div className="h-20 animate-pulse rounded bg-muted/60" aria-hidden />}</Block>;
  const base = meanOver(heat, 1991, 2020);
  const recent = meanOver(heat, 2015, 2024);
  const fmt = (v: number | null) => (v == null ? '' : formatNumber(Math.round(v), i18n.language));
  const note = t('picture.heatNote', { base: fmt(base), recent: fmt(recent) });
  return (
    <Block title={t('picture.trends')} note={t('picture.heat', { from: heat[0].year, to: heat[heat.length - 1].year })}>
      <YearBars points={heat} mean={base} color="#e8590c" label={note} />
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>
    </Block>
  );
}
