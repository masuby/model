/**
 * Methodology explainer: the official aggregation diagram (Indicators → Components → Categories →
 * Dimensions → Index, weights ⅓/⅔ and 70/30) drawn with plain HTML boxes — horizontal on wide
 * screens, a nested tree on small ones — with live scores, the four principles and the citations.
 */
import { BookMarked, ChevronDown, ChevronRight, Layers, Scale, ShieldCheck, Sigma } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_MODEL, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { TANZANIA_AREA_KM2, TANZANIA_POPULATION_2022, type SeverityResult } from '@/engine/severity/engine';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { DIM_ACCENT, FADE, fractionLabel, severityColor, WeightTag } from './bits';

const COUNTS = {
  indicators: SEVERITY_MODEL.reduce((s, d) => s + d.categories.reduce((a, c) => a + c.components.reduce((b, k) => b + k.indicators.length, 0), 0), 0),
  components: SEVERITY_MODEL.reduce((s, d) => s + d.categories.reduce((a, c) => a + c.components.length, 0), 0),
  categories: SEVERITY_MODEL.reduce((s, d) => s + d.categories.length, 0),
  dimensions: SEVERITY_MODEL.length,
  index: 1,
};

const GROUPS: Array<{ dims: SeverityDimensionKey[]; weight: number }> = [
  { dims: ['impact', 'conditions'], weight: SEVERITY_WEIGHTS.geo },
  { dims: ['complexity'], weight: SEVERITY_WEIGHTS.complexity },
];

function Arrow({ className }: { className?: string }) {
  return (
    <span className={cn('hidden shrink-0 items-center justify-center text-muted-foreground/60 xl:flex', className)} aria-hidden>
      <ChevronRight className="size-4" />
    </span>
  );
}

function ScorePill({ score }: { score: number | null | undefined }) {
  const c = severityColor(score);
  return (
    <span className="num inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-border">
      <span className="size-1.5 rounded-full" style={{ background: c ?? 'var(--muted-foreground)' }} aria-hidden />
      {formatScore(score)}
    </span>
  );
}

function Band({ dim, result }: { dim: SeverityDimensionKey; result: SeverityResult }) {
  const { t } = useTranslation('severity');
  const def = SEVERITY_MODEL.find((d) => d.id === dim)!;
  const node = result.dimensions[dim];
  const accent = DIM_ACCENT[dim];
  const dimWeight = dim === 'complexity' ? `${Math.round(SEVERITY_WEIGHTS.complexity * 100)}%` : fractionLabel(SEVERITY_WEIGHTS.impactVsConditions[dim]);
  return (
    <div className={cn('rounded-2xl p-2.5 ring-1 sm:p-3', accent.soft, accent.ring)}>
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-stretch">
        {/* Categories */}
        <div className="order-2 flex min-w-0 flex-1 flex-col gap-2.5 xl:order-1">
          {def.categories.map((cat) => {
            const catNode = node.children?.find((c) => c.id === cat.id);
            return (
              <div key={cat.id} className="flex flex-col gap-2 rounded-xl bg-card/60 p-2 xl:flex-row xl:items-stretch xl:bg-transparent xl:p-0">
                {/* Components */}
                <div className="order-2 flex min-w-0 flex-1 flex-col gap-1.5 xl:order-1 xl:justify-center">
                  {cat.components.map((comp) => {
                    const compNode = catNode?.children?.find((c) => c.id === comp.id);
                    return (
                      <div key={comp.id} className="flex flex-col gap-1.5 xl:flex-row xl:items-center xl:gap-2">
                        <ul className="order-2 flex min-w-0 flex-1 flex-wrap gap-1 pl-3 xl:order-1 xl:justify-end xl:pl-0">
                          {comp.indicators.map((ind) => (
                            <li key={ind.id} className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] leading-tight text-muted-foreground">
                              {t(`ind.${ind.id}`)}
                            </li>
                          ))}
                        </ul>
                        <Arrow className="xl:order-2" />
                        <div className="order-1 flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-xs xl:order-3 xl:w-40 xl:shrink-0">
                          <span className="min-w-0 text-[11px] leading-tight font-medium">{t(`comp.${comp.id}`)}</span>
                          <ScorePill score={compNode?.score} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Arrow className="xl:order-2" />
                <div className="order-1 flex flex-col justify-center gap-1 rounded-xl border border-border bg-card px-3 py-2 shadow-xs xl:order-3 xl:w-40 xl:shrink-0">
                  <span className="text-xs leading-tight font-semibold">{t(`cat.${cat.id}`)}</span>
                  <span className="flex flex-wrap items-center gap-1">
                    <WeightTag>{fractionLabel(cat.weight)}</WeightTag>
                    <WeightTag>{cat.aggregation === 'geometric' ? 'G' : 'x̄'}</WeightTag>
                    <ScorePill score={catNode?.score} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <Arrow className="xl:order-2" />
        {/* Dimension */}
        <div className="order-1 flex items-center justify-between gap-3 rounded-xl bg-card px-3.5 py-3 shadow-sm ring-1 ring-border xl:order-3 xl:w-36 xl:shrink-0 xl:flex-col xl:items-start xl:justify-center">
          <span className="min-w-0">
            <span className={cn('block font-display text-sm font-extrabold', accent.text)}>{t(`dim.${dim}`)}</span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">{t('method.dimWeight', { w: dimWeight })}</span>
          </span>
          <span className="num font-display text-2xl leading-none font-extrabold">{formatScore(node.score)}</span>
        </div>
      </div>
    </div>
  );
}

function AggregationDiagram({ result }: { result: SeverityResult }) {
  const { t } = useTranslation(['severity', 'common']);
  const levels = ['indicators', 'components', 'categories', 'dimensions', 'index'] as const;
  return (
    <Card className="p-3 sm:p-5">
      {/* Level chain (legend of the columns) */}
      <ol className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs" aria-label={t('method.chainAria')}>
        {levels.map((l, i) => (
          <React.Fragment key={l}>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 font-semibold">
              <span className="num flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{COUNTS[l]}</span>
              {t(`method.levels.${l}`)}
            </li>
            {i < levels.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden />}
          </React.Fragment>
        ))}
      </ol>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {GROUPS.map((g) => (
            <div key={g.dims.join('+')} className="flex flex-col gap-2 xl:flex-row xl:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {g.dims.map((d) => (
                  <Band key={d} dim={d} result={result} />
                ))}
              </div>
              {/* Combiner: bracket on wide screens, a pill underneath on small ones */}
              <div className="flex items-center gap-2 xl:w-28 xl:shrink-0">
                <span className={cn('hidden w-3 self-stretch rounded-r-xl border-y-2 border-r-2 border-border xl:block', g.dims.length > 1 ? 'my-12' : 'my-8')} aria-hidden />
                <ChevronDown className="mx-auto size-4 text-muted-foreground/60 xl:hidden" aria-hidden />
                <div className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-center shadow-xs xl:flex-1">
                  {g.dims.length > 1 && (
                    <div className="num font-mono text-[11px] font-semibold">
                      G({fractionLabel(SEVERITY_WEIGHTS.impactVsConditions.impact)}, {fractionLabel(SEVERITY_WEIGHTS.impactVsConditions.conditions)})
                    </div>
                  )}
                  <div className="num font-display text-base font-extrabold text-primary">× {Math.round(g.weight * 100)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Arrow />
        <ChevronDown className="mx-auto size-4 text-muted-foreground/60 xl:hidden" aria-hidden />
        {/* Index */}
        <div className="flex flex-col justify-center rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 xl:w-48 xl:shrink-0">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">{t('method.levels.index')}</span>
          <span className="mt-1 font-display text-base leading-tight font-extrabold">{t('results.title')}</span>
          <span className="num mt-3 font-display text-4xl leading-none font-extrabold">{formatScore(result.severity)}</span>
          <span className="mt-1 text-[11px] text-muted-foreground">{result.category ? t(`common:classes.${result.category}`) : t('results.notComputed')}</span>
          <div className="mt-3 flex gap-0.5" aria-hidden>
            {SEVERITY_CATEGORY_KEYS.map((k) => (
              <span key={k} className="h-1.5 flex-1 rounded-full first:rounded-l-full" style={{ background: SEVERITY_COLORS[k] }} />
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] leading-snug text-muted-foreground">0.7 × G + 0.3 × {t('dim.complexity')}</p>
        </div>
      </div>

      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          <b className="font-mono text-foreground">G</b> — {t('method.legendG')}
        </span>
        <span>
          <b className="font-mono text-foreground">x̄</b> — {t('method.legendMean')}
        </span>
        <span>{t('method.live')}</span>
      </p>
    </Card>
  );
}

const PRINCIPLES = [
  { key: 'normalise', icon: Scale },
  { key: 'aggregate', icon: Sigma },
  { key: 'classify', icon: Layers },
  { key: 'reliability', icon: ShieldCheck },
] as const;

export function Methodology({ result }: { result: SeverityResult }) {
  const { t, i18n } = useTranslation('severity');
  const lang = i18n.language;
  return (
    <div className="grid gap-6">
      <motion.div {...FADE}>
        <AggregationDiagram result={result} />
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PRINCIPLES.map(({ key, icon: Icon }, i) => (
          <motion.div key={key} {...FADE} transition={{ duration: 0.45, delay: i * 0.06 }}>
            <Card className="h-full p-5">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 font-display text-base font-bold">{t(`method.cards.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`method.cards.${key}.body`)}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div {...FADE}>
        <Card className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base font-bold">
              <BookMarked className="size-4 text-primary" aria-hidden /> {t('method.cite.title')}
            </h3>
            <ol className="mt-3 grid gap-3 text-sm leading-relaxed">
              <li className="border-l-2 border-primary/40 pl-3">{t('method.cite.jrc')}</li>
              <li className="border-l-2 border-primary/40 pl-3">{t('method.cite.acaps')}</li>
            </ol>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
            <h3 className="font-display text-sm font-bold text-foreground">{t('method.adaptTitle')}</h3>
            <p className="mt-1.5">{t('method.adapt')}</p>
            <p className="num mt-2">{t('method.denominators', { pop: formatNumber(TANZANIA_POPULATION_2022, lang), area: formatNumber(TANZANIA_AREA_KM2, lang) })}</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

