/**
 * The national risk picture under the home page's headline, where the four figures were: three compact
 * charts in each scale's own colours. Risk and its three parts on their class tracks; the councils by
 * class on every scale; heatwave days year by year for Tanzania.
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

export function NationalCharts({ model, className }: { model: RiskModel; className?: string }) {
  const { t, i18n } = useTranslation(['home', 'common']);
  const national = model.national;
  const population = model.councils.reduce((s, c) => s + (c.exposure?.population ?? 0), 0);
  const counts = React.useMemo(() => {
    const out = {} as Record<PartKey, Record<ClassKey, number>>;
    for (const { key, scale } of PARTS) {
      const c = Object.fromEntries(CLASS_KEYS.map((k) => [k, 0])) as Record<ClassKey, number>;
      for (const u of model.councils) {
        const k = classify(valueOf(u, key), scale)?.key;
        if (k) c[k]++;
      }
      out[key] = c;
    }
    return out;
  }, [model]);
  const high = counts.risk.high + counts.risk.veryHigh;
  return (
    <div className={cn('grid gap-x-8 gap-y-8 sm:grid-cols-3', className)}>
      <Block title={t('picture.parts')} note={t('picture.partsNote', { councils: model.councils.length, people: formatCompact(population, i18n.language) })}>
        <PartTracks unit={national} />
      </Block>
      <Block title={t('picture.classes')} note={t('picture.classesNote', { high, pct: Math.round((high / model.councils.length) * 100) })}>
        <ClassStacks counts={counts} total={model.councils.length} />
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

/** The councils by class on every scale: one stacked bar per scale in its palette, very low to very high. */
function ClassStacks({ counts, total }: { counts: Record<PartKey, Record<ClassKey, number>>; total: number }) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <div>
      <ul className="space-y-2.5">
        {PARTS.map(({ key, scale }) => {
          const c = counts[key];
          const label = key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}Short`);
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className={cn('truncate', key === 'risk' && 'font-semibold')}>{label}</span>
                <span className="num shrink-0 text-muted-foreground">{t('picture.highOrAbove', { count: c.high + c.veryHigh })}</span>
              </div>
              <div className="mt-1 flex h-2 overflow-hidden" role="img" aria-label={`${label}: ${CLASS_KEYS.map((k) => `${t(`common:classes.${k}`)} ${c[k]}`).join(', ')}`}>
                {CLASS_KEYS.map((k) =>
                  c[k] ? <span key={k} className="h-full" style={{ width: `${(c[k] / total) * 100}%`, background: classColor(k, scale) }} title={`${t(`common:classes.${k}`)}: ${c[k]}`} /> : null,
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex justify-between gap-1 text-[10px] text-muted-foreground" aria-hidden>
        <span>{t('common:classes.veryLow')}</span>
        <span>{t('common:classes.veryHigh')}</span>
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
