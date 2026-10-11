/**
 * The national risk picture on the home page: charts in each scale's own colours, in place of bare
 * figures. Risk and its three parts on their class tracks; the councils by class on every scale; the
 * climate year by year; and the national value of every indicator group of the three dimensions.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLASS_KEYS, classColor, classify, NO_DATA_COLOR, THRESHOLDS, type ClassKey, type Scale } from '@/engine/risk/classes';
import { DIMENSION_BY_KEY, DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import { rampColor } from '@/engine/risk/metrics';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { ClimateTrends } from '@/features/explore/components/ClimateTrends';
import { dimensionGroups } from '@/features/explore/lib/riskPanel';
import { cn, formatCompact, formatScore } from '@/lib/utils';

type PartKey = 'risk' | DimensionKey;
const PARTS: ReadonlyArray<{ key: PartKey; scale: Scale }> = [{ key: 'risk', scale: 'risk' }, ...DIMENSIONS.map((d) => ({ key: d.key, scale: d.scale }))];
const valueOf = (u: Unit, key: PartKey) => (key === 'risk' ? u.risk : u.dims[key].score);
/** Hazard groups shown before the rest (the dimension has fifteen). */
const HAZARDS_SHOWN = 8;

export function NationalCharts({ model }: { model: RiskModel }) {
  const { t, i18n } = useTranslation(['home', 'common', 'indicators']);
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
    <div className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      <Block title={t('picture.parts')} note={t('picture.partsNote', { councils: model.councils.length, people: formatCompact(population, i18n.language) })}>
        <PartTracks unit={national} />
      </Block>
      <Block title={t('picture.classes')} note={t('picture.classesNote', { high, pct: Math.round((high / model.councils.length) * 100) })}>
        <ClassStacks counts={counts} total={model.councils.length} />
      </Block>
      <Block title={t('picture.trends')}>
        <ClimateTrends unit={national} />
      </Block>
      <Block title={t('common:dimensions.hazard')} note={t('picture.groupsNote')}>
        <GroupBars unit={national} dim="hazard" limit={HAZARDS_SHOWN} />
      </Block>
      <Block title={t('common:dimensions.vulnerability')} note={t('picture.groupsNote')}>
        <GroupBars unit={national} dim="vulnerability" />
      </Block>
      <Block title={t('common:dimensions.coping')} note={t('picture.groupsNote')}>
        <GroupBars unit={national} dim="coping" />
      </Block>
    </div>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-5">
      <h3 className="text-base font-semibold">{title}</h3>
      {note && <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Risk and its three parts, each on the class track of its own scale: the five classes sized by their thresholds, the one the score falls in in full colour. */
function PartTracks({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <ul className="space-y-4">
      {PARTS.map(({ key, scale }) => {
        const v = valueOf(unit, key);
        const c = classify(v, scale);
        const bounds = [0, ...THRESHOLDS[scale], 10];
        const label = key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}`);
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={cn('truncate', key === 'risk' && 'font-semibold')}>{label}</span>
              <span className="num inline-flex shrink-0 items-baseline gap-2">
                <span className="text-xs text-muted-foreground">{c ? t(`common:classes.${c.key}`) : t('common:classes.noData')}</span>
                <span className="font-semibold">{formatScore(v)}</span>
              </span>
            </div>
            <div
              className="relative mt-1.5"
              role="img"
              aria-label={t('picture.trackAria', { label, score: formatScore(v), cls: c ? t(`common:classes.${c.key}`) : t('common:classes.noData') })}
            >
              <div className="flex h-2.5 gap-px">
                {CLASS_KEYS.map((k, i) => (
                  <span key={k} className="h-full" style={{ width: `${(bounds[i + 1] - bounds[i]) * 10}%`, background: classColor(k, scale), opacity: c?.key === k ? 1 : 0.28 }} />
                ))}
              </div>
              {isNum(v) && <span className="absolute -top-1 h-4.5 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: `${Math.max(0, Math.min(100, v * 10))}%` }} />}
            </div>
          </li>
        );
      })}
      <li className="num flex justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span>10</span>
      </li>
    </ul>
  );
}

/** The councils by class on every scale: one stacked bar per scale in its palette, very low to very high. */
function ClassStacks({ counts, total }: { counts: Record<PartKey, Record<ClassKey, number>>; total: number }) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <div>
      <ul className="space-y-3">
        {PARTS.map(({ key, scale }) => {
          const c = counts[key];
          const label = key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}`);
          const upper = c.high + c.veryHigh;
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={cn('truncate', key === 'risk' && 'font-semibold')}>{label}</span>
                <span className="num shrink-0 text-xs text-muted-foreground">{t('picture.highOrAbove', { count: upper })}</span>
              </div>
              <div className="mt-1.5 flex h-3 overflow-hidden" role="img" aria-label={`${label}: ${CLASS_KEYS.map((k) => `${t(`common:classes.${k}`)} ${c[k]}`).join(', ')}`}>
                {CLASS_KEYS.map((k) =>
                  c[k] ? <span key={k} className="h-full" style={{ width: `${(c[k] / total) * 100}%`, background: classColor(k, scale) }} title={`${t(`common:classes.${k}`)}: ${c[k]}`} /> : null,
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex justify-between gap-2 text-[11px] text-muted-foreground" aria-hidden>
        {CLASS_KEYS.map((k) => (
          <span key={k}>{t(`common:classes.${k}`)}</span>
        ))}
      </p>
    </div>
  );
}

/** The national value of every group of a dimension, highest first, in the dimension's ramp. */
function GroupBars({ unit, dim, limit }: { unit: Unit; dim: DimensionKey; limit?: number }) {
  const { t } = useTranslation(['home', 'common', 'indicators']);
  const scale = DIMENSION_BY_KEY[dim].scale;
  const groups = React.useMemo(() => dimensionGroups(unit, dim), [unit, dim]);
  const shown = limit ? groups.slice(0, limit) : groups;
  const score = unit.dims[dim].score;
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: classify(score, scale)?.color ?? NO_DATA_COLOR }} aria-hidden />
          <span className="text-muted-foreground">{t('picture.dimensionScore')}</span>
        </span>
        <span className="num font-semibold">{formatScore(score)}</span>
      </p>
      <ul className="mt-3 space-y-2">
        {shown.map((g) => (
          <li key={g.key}>
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{t(`indicators:${g.key}`)}</span>
              <span className="num font-medium">{formatScore(g.score)}</span>
            </span>
            <span className="mt-1 block h-1.5 bg-muted" role="img" aria-label={`${t(`indicators:${g.key}`)}: ${formatScore(g.score)}`}>
              <span className="block h-full" style={{ width: `${g.score * 10}%`, background: rampColor(g.score, scale) }} />
            </span>
          </li>
        ))}
      </ul>
      {limit && groups.length > limit && <p className="mt-2 text-[11px] text-muted-foreground">{t('picture.more', { count: groups.length - limit })}</p>}
    </div>
  );
}
