/**
 * Static teaching figures referenced from lesson content (`{ "type": "figure", "id": … }`).
 * Numbers (indicator counts, class ranges, severity weights) come from the engine, never typed in.
 */
import { ArrowDown, ArrowRight, CloudLightning, HeartPulse, ShieldCheck, Sigma, Users } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLASS_COLORS, CLASS_KEYS, classRanges, type Scale } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSIONS } from '@/engine/risk/hierarchy';
import { onClassColor } from '@/components/risk/RiskBadge';
import { SEVERITY_WEIGHTS } from '@/engine/severity/definitions';
import { cn } from '@/lib/utils';
import type { FigureId } from '../course';

const fade = { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' } } as const;

function DisasterEquation() {
  const { t } = useTranslation('learn');
  const parts = [
    { key: 'hazard', icon: CloudLightning, tint: 'from-amber-500/20 to-orange-500/5 text-amber-600 dark:text-amber-400' },
    { key: 'exposure', icon: Users, tint: 'from-sky-500/20 to-blue-500/5 text-sky-600 dark:text-sky-400' },
    { key: 'vulnerability', icon: HeartPulse, tint: 'from-rose-500/20 to-pink-500/5 text-rose-600 dark:text-rose-400' },
    { key: 'coping', icon: ShieldCheck, tint: 'from-emerald-500/20 to-green-500/5 text-emerald-600 dark:text-emerald-400' },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1.1fr] xl:items-stretch">
      {parts.map((p, i) => (
        <React.Fragment key={p.key}>
          <motion.div {...fade} transition={{ duration: 0.35, delay: i * 0.08 }} className="rounded-2xl border border-border bg-card p-3 text-center">
            <div className={cn('mx-auto inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br', p.tint)}>
              <p.icon className="size-5" aria-hidden />
            </div>
            <div className="mt-2 text-sm font-bold">{t(`figures.disaster.${p.key}`)}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t(`figures.disaster.${p.key}Q`)}</div>
          </motion.div>
          {i < 3 && (
            <div className="hidden items-center justify-center font-display text-xl font-bold text-muted-foreground/60 xl:flex" aria-hidden>
              ×
            </div>
          )}
        </React.Fragment>
      ))}
      <div className="hidden items-center justify-center font-display text-xl font-bold text-muted-foreground/60 xl:flex" aria-hidden>
        =
      </div>
      <motion.div {...fade} transition={{ duration: 0.35, delay: 0.35 }} className="col-span-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-3 text-center sm:col-span-4 xl:col-span-1">
        <div className="mx-auto inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sigma className="size-5" aria-hidden />
        </div>
        <div className="mt-2 text-sm font-bold">{t('figures.disaster.risk')}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t('figures.disaster.riskQ')}</div>
      </motion.div>
    </div>
  );
}

function AggregationLadder() {
  const { t } = useTranslation('learn');
  const categories = DIMENSIONS.reduce((s, d) => s + d.categories.length, 0);
  const steps = [
    { key: 'indicators', count: ALL_INDICATORS.length, via: null },
    { key: 'categories', count: categories, via: 'mean' },
    { key: 'dimensions', count: DIMENSIONS.length, via: 'geomean' },
    { key: 'risk', count: 1, via: 'cubeRoot' },
    { key: 'class', count: CLASS_KEYS.length, via: 'thresholds' },
  ] as const;
  return (
    <div className="flex flex-col items-stretch gap-1 md:flex-row md:items-stretch">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && (
            <div className="flex items-center justify-center text-primary" aria-hidden>
              <ArrowDown className="size-4 md:hidden" />
              <ArrowRight className="hidden size-4 md:block" />
            </div>
          )}
          <motion.div
            {...fade}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className={cn('flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center', s.key === 'risk' ? 'border-primary/40 bg-primary/10' : 'border-border bg-card')}
          >
            <div className="num font-display text-2xl leading-none font-extrabold">{s.count}</div>
            <div className="mt-1 text-xs leading-tight font-bold">{t(`figures.ladder.${s.key}`)}</div>
            {s.via && <div className="mt-1 text-[10px] leading-tight font-semibold text-primary">{t(`figures.ladder.${s.via}`)}</div>}
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );
}

function ClassThresholds() {
  const { t } = useTranslation(['learn', 'common']);
  const rows: Array<{ scale: Scale; label: string }> = [
    { scale: 'risk', label: t('common:informRisk') },
    ...DIMENSIONS.map((d) => ({ scale: d.scale, label: t(`common:dimensions.${d.key}`) })),
  ];
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">{t('figures.thresholds.caption')}</caption>
        <thead>
          <tr>
            <th scope="col" className="text-left text-xs font-semibold text-muted-foreground">
              {t('figures.thresholds.scale')}
            </th>
            {CLASS_KEYS.map((k) => (
              <th key={k} scope="col" className="rounded-lg px-2 py-1.5 text-center text-xs font-bold" style={{ background: CLASS_COLORS[k], color: onClassColor(CLASS_COLORS[k]) }}>
                {t(`common:classes.${k}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.scale}>
              <th scope="row" className={cn('pr-2 text-left text-xs font-semibold', r.scale === 'risk' && 'text-primary')}>
                {r.label}
              </th>
              {classRanges(r.scale).map((range, i) => (
                <td key={CLASS_KEYS[i]} className="num rounded-lg bg-muted/60 px-2 py-1.5 text-center text-xs font-medium">
                  {range}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeverityWeights() {
  const { t } = useTranslation('learn');
  const w = SEVERITY_WEIGHTS;
  const impact = w.geo * w.impactVsConditions.impact * 100;
  const conditions = w.geo * w.impactVsConditions.conditions * 100;
  const complexity = w.complexity * 100;
  const segs = [
    { key: 'impact', pct: impact, cls: 'bg-orange-400 text-slate-900' },
    { key: 'conditions', pct: conditions, cls: 'bg-red-500 text-white' },
    { key: 'complexity', pct: complexity, cls: 'bg-slate-600 text-white dark:bg-slate-400 dark:text-slate-900' },
  ] as const;
  return (
    <div>
      <div className="flex text-[11px] font-semibold text-muted-foreground">
        <div style={{ width: `${Math.round(w.geo * 100)}%` }} className="border-b-2 border-primary/50 pb-1 text-center">
          {t('figures.severity.geoPart', { pct: Math.round(w.geo * 100) })}
        </div>
        <div style={{ width: `${Math.round(complexity)}%` }} className="border-b-2 border-muted-foreground/40 pb-1 text-center">
          {t('figures.severity.linearPart', { pct: Math.round(complexity) })}
        </div>
      </div>
      <div className="mt-2 flex h-12 overflow-hidden rounded-2xl">
        {segs.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ width: 0 }}
            whileInView={{ width: `${s.pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={cn('flex items-center justify-center overflow-hidden px-1 text-center text-[11px] leading-tight font-bold whitespace-nowrap', s.cls)}
          >
            {t(`figures.severity.${s.key}`)} · {Math.round(s.pct)}%
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const FIGURES: Record<FigureId, () => React.ReactElement> = {
  disasterEquation: DisasterEquation,
  aggregationLadder: AggregationLadder,
  classThresholds: ClassThresholds,
  severityWeights: SeverityWeights,
};

export function Figure({ id, caption }: { id: FigureId; caption?: string }) {
  const C = FIGURES[id];
  return (
    <figure className="my-8">
      <div className="rounded-3xl border border-border bg-muted/30 p-4 sm:p-5">
        <C />
      </div>
      {caption && <figcaption className="mt-2 px-1 text-center text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
