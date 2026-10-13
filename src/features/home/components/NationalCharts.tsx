/**
 * The national risk picture under the home page's headline, where the four figures were: three compact
 * charts in each scale's own colours. Risk and its three parts on their class tracks; the councils by
 * risk class as a pie; and how the three parts relate to risk across all the councils.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLASS_KEYS, classColor, classify, readableOn, THRESHOLDS, type ClassKey, type Scale } from '@/engine/risk/classes';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { isNum } from '@/engine/risk/math';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatCompact, formatScore } from '@/lib/utils';

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
    <div className={cn('grid gap-x-8 gap-y-5 sm:grid-cols-2', className)}>
      <Block title={t('picture.parts')} note={t('picture.partsNote', { people: formatCompact(population, i18n.language) })}>
        <PartTracks unit={national} />
      </Block>
      <Block title={t('picture.pie')} note={t('picture.pieNote', { high, pct: Math.round((high / model.councils.length) * 100) })}>
        <ClassPie counts={counts} total={model.councils.length} high={high} />
      </Block>
      <Block title={t('picture.relation')} note={t('picture.relationNote')} className="sm:col-span-2">
        <RelationLines model={model} />
      </Block>
    </div>
  );
}

function Block({ title, note, className, children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={className}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {note && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{note}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/** Risk and its three parts, each on the class track of its own scale: the five classes sized by their thresholds, the one the score falls in in full colour. */
function PartTracks({ unit }: { unit: Unit }) {
  const { t } = useTranslation(['home', 'common']);
  return (
    <ul className="space-y-2">
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

/** A donut slice from angle a0 to a1 (radians from twelve o'clock), with a small gap on each side. */
function arc(a0: number, a1: number, R: number, r: number, gap: number): string {
  const g = a1 - a0 > 2 * gap ? gap : 0;
  const s = a0 + g;
  const e = a1 - g;
  const pt = (rad: number, a: number) => [50 + rad * Math.sin(a), 50 - rad * Math.cos(a)];
  const [x0, y0] = pt(R, s);
  const [x1, y1] = pt(R, e);
  const [x2, y2] = pt(r, e);
  const [x3, y3] = pt(r, s);
  const large = e - s > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} A${r},${r} 0 ${large} 0 ${x3.toFixed(2)},${y3.toFixed(2)} Z`;
}

/**
 * The councils by risk class as a donut in the risk palette: one slice per class with its share written
 * on it when there is room, the share at high or above in the middle, and the count and share of every
 * class beside it.
 */
function ClassPie({ counts, total, high }: { counts: Record<ClassKey, number>; total: number; high: number }) {
  const { t } = useTranslation(['home', 'common']);
  const R = 48;
  const r = 29;
  let angle = 0;
  const slices = CLASS_KEYS.map((k) => {
    const share = total ? counts[k] / total : 0;
    const a0 = angle;
    const a1 = angle + share * 2 * Math.PI;
    angle = a1;
    const mid = (a0 + a1) / 2;
    const lr = (R + r) / 2;
    return { key: k, share, d: arc(a0, a1, R, r, 0.028), lx: 50 + lr * Math.sin(mid), ly: 50 - lr * Math.cos(mid) };
  });
  const label = CLASS_KEYS.map((k) => `${t(`common:classes.${k}`)} ${counts[k]} (${Math.round((counts[k] / total) * 100)}%)`).join(', ');
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-32 shrink-0" role="img" aria-label={`${t('picture.pie')}: ${label}`}>
        {slices.map((s) =>
          s.share > 0 ? (
            <path key={s.key} d={s.d} fill={classColor(s.key, 'risk')} stroke="var(--background)" strokeWidth={0.6} strokeLinejoin="round">
              <title>{`${t(`common:classes.${s.key}`)}: ${counts[s.key]} (${Math.round(s.share * 100)}%)`}</title>
            </path>
          ) : null,
        )}
        {slices.map((s) =>
          s.share >= 0.08 ? (
            <text key={`l-${s.key}`} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="600" fill={readableOn(classColor(s.key, 'risk'))} className="num">
              {Math.round(s.share * 100)}%
            </text>
          ) : null,
        )}
        <text x="50" y="47" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="700" fill="currentColor" className="num">
          {Math.round((high / total) * 100)}%
        </text>
        <text x="50" y="59" textAnchor="middle" dominantBaseline="central" fontSize="6" fill="currentColor" fillOpacity={0.65}>
          {t('picture.pieCentre')}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {[...CLASS_KEYS].reverse().map((k) => (
          <li key={k} className={cn('flex items-baseline justify-between gap-2', !counts[k] && 'text-muted-foreground')}>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: classColor(k, 'risk'), opacity: counts[k] ? 1 : 0.35 }} aria-hidden />
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
  // The drawing stretches to the block's width (preserveAspectRatio none); labels stay HTML so they keep their size on a phone.
  const W = 600;
  const H = 150;
  const PAD = 3;
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
  const x = (i: number) => (i / Math.max(1, ranked.length - 1)) * W;
  const y = (v: number) => PAD + (1 - v / 10) * (H - 2 * PAD);
  const path = (points: number[]) => points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const name = (key: PartKey) => (key === 'risk' ? t('common:informRisk') : t(`common:dimensions.${key}Short`));
  return (
    <div>
      <div className="flex gap-2">
        <div className="num flex h-24 shrink-0 flex-col justify-between text-[10px] leading-none text-muted-foreground" aria-hidden>
          <span>10</span>
          <span>5</span>
          <span>0</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label={t('picture.relationAria')}>
            {[0, 5, 10].map((v) => (
              <line key={v} x1={0} x2={W} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {lines.map((l) => (
              <path key={l.key} d={path(l.points)} fill="none" stroke={LINE[l.key]} strokeWidth={l.key === 'risk' ? 2.25 : 1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          <p className="mt-1 flex justify-between text-[10px] text-muted-foreground" aria-hidden>
            <span>{t('picture.relationLeft')}</span>
            <span>{t('picture.relationRight')}</span>
          </p>
        </div>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground" aria-hidden>
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
