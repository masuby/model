/**
 * Methodology explainer: the official aggregation structure (Indicators → Components → Categories →
 * Dimensions → Index, weights ⅓/⅔ and 70/30) drawn as a flat, ruled diagram - columns separated by
 * hairlines on wide screens, a nested tree on small ones - with live scores, the four principles and the
 * citations. Colour appears only as small severity dots on scores (data).
 */
import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_MODEL, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { TANZANIA_AREA_KM2, TANZANIA_POPULATION_2022, type SeverityResult } from '@/engine/severity/engine';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { fractionLabel, severityColor } from './bits';

const COUNTS = {
  indicators: SEVERITY_MODEL.reduce((s, d) => s + d.categories.reduce((a, c) => a + c.components.reduce((b, k) => b + k.indicators.length, 0), 0), 0),
  components: SEVERITY_MODEL.reduce((s, d) => s + d.categories.reduce((a, c) => a + c.components.length, 0), 0),
  categories: SEVERITY_MODEL.reduce((s, d) => s + d.categories.length, 0),
  dimensions: SEVERITY_MODEL.length,
  index: 1,
};
const LEVELS = ['indicators', 'components', 'categories', 'dimensions', 'index'] as const;

/* Column widths shared by the header and the nested rows so the columns line up (xl only). */
const W = { comp: 'xl:w-64', cat: 'xl:w-52', dim: 'xl:w-40' } as const;
const cell = 'xl:shrink-0 xl:border-l xl:border-border xl:px-4';

function Score({ score, className }: { score: number | null | undefined; className?: string }) {
  return (
    <span className={cn('num inline-flex items-center gap-1.5 font-semibold whitespace-nowrap', className)}>
      <span className="size-2 rounded-full ring-1 ring-foreground/20 ring-inset" style={{ background: severityColor(score) ?? 'var(--muted)' }} aria-hidden />
      {formatScore(score)}
    </span>
  );
}

function Band({ dim, result }: { dim: SeverityDimensionKey; result: SeverityResult }) {
  const { t } = useTranslation('severity');
  const def = SEVERITY_MODEL.find((d) => d.id === dim)!;
  const node = result.dimensions[dim];
  const dimWeight = dim === 'complexity' ? `${Math.round(SEVERITY_WEIGHTS.complexity * 100)}%` : t('results.weightInG', { w: fractionLabel(SEVERITY_WEIGHTS.impactVsConditions[dim]) });
  return (
    <div className="flex flex-col border-t border-border first:border-t-0 xl:flex-row xl:items-stretch">
      {/* Dimension (first on small screens, last column on wide ones) */}
      <div className={cn('flex items-baseline justify-between gap-3 py-4 xl:order-last xl:flex-col xl:justify-center xl:gap-1', W.dim, cell, 'xl:pr-0')}>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{t(`dim.${dim}`)}</span>
          <span className="num mt-0.5 block text-xs text-muted-foreground">{t('method.dimWeight', { w: dimWeight })}</span>
        </span>
        <Score score={node.score} className="text-xl xl:mt-1" />
      </div>

      {/* Categories */}
      <div className="ml-1 flex min-w-0 flex-1 flex-col border-l border-border pl-4 xl:ml-0 xl:border-l-0 xl:pl-0">
        {def.categories.map((cat) => {
          const catNode = node.children?.find((c) => c.id === cat.id);
          return (
            <div key={cat.id} className="flex flex-col border-t border-border first:border-t-0 xl:flex-row xl:items-stretch">
              <div className={cn('flex items-baseline justify-between gap-3 py-2.5 xl:order-last xl:flex-col xl:justify-center xl:gap-1', W.cat, cell)}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t(`cat.${cat.id}`)}</span>
                  <span className="num block text-xs text-muted-foreground">
                    {fractionLabel(cat.weight)} · {cat.aggregation === 'geometric' ? 'G' : 'x̄'}
                  </span>
                </span>
                <Score score={catNode?.score} className="text-sm" />
              </div>

              {/* Components */}
              <div className="ml-1 flex min-w-0 flex-1 flex-col border-l border-border pb-2 pl-4 xl:ml-0 xl:border-l-0 xl:pb-0 xl:pl-0">
                {cat.components.map((comp) => {
                  const compNode = catNode?.children?.find((c) => c.id === comp.id);
                  return (
                    <div key={comp.id} className="flex flex-col xl:flex-1 xl:flex-row xl:items-stretch xl:[&:first-child>*]:pt-3 xl:[&:last-child>*]:pb-3">
                      <div className={cn('flex items-baseline justify-between gap-3 py-1.5 xl:order-last xl:py-1.5', W.comp, cell)}>
                        <span className="min-w-0 text-[13px] leading-snug">{t(`comp.${comp.id}`)}</span>
                        <Score score={compNode?.score} className="text-xs" />
                      </div>
                      <ul className="flex min-w-0 flex-1 flex-col pb-1.5 pl-3 text-xs leading-snug text-muted-foreground xl:py-1.5 xl:pr-4 xl:pl-0">
                        {comp.indicators.map((ind) => (
                          <li key={ind.id} className="py-px">
                            {t(`ind.${ind.id}`)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AggregationDiagram({ result }: { result: SeverityResult }) {
  const { t } = useTranslation(['severity', 'common']);
  const w = SEVERITY_WEIGHTS;
  return (
    <figure>
      {/* Level chain - small screens (wide screens carry it in the column headers) */}
      <ol className="mb-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground xl:hidden" aria-label={t('method.chainAria')}>
        {LEVELS.map((l, i) => (
          <li key={l} className="inline-flex items-center gap-1.5">
            <span>
              <b className="num font-semibold text-foreground">{COUNTS[l]}</b> {t(`method.levels.${l}`).toLowerCase()}
            </span>
            {i < LEVELS.length - 1 && <ChevronRight className="size-3.5" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="border-y border-foreground/25 xl:grid xl:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0">
          {/* Column headers (wide screens) */}
          <div className="hidden border-b border-foreground/25 text-xs font-medium text-muted-foreground xl:flex" aria-hidden>
            <span className="flex-1 py-2.5 pr-4">
              {t('method.levels.indicators')} <span className="num">· {COUNTS.indicators}</span>
            </span>
            <span className={cn('py-2.5', W.comp, cell)}>
              {t('method.levels.components')} <span className="num">· {COUNTS.components}</span>
            </span>
            <span className={cn('py-2.5', W.cat, cell)}>
              {t('method.levels.categories')} <span className="num">· {COUNTS.categories}</span>
            </span>
            <span className={cn('py-2.5', W.dim, cell, 'xl:pr-0')}>
              {t('method.levels.dimensions')} <span className="num">· {COUNTS.dimensions}</span>
            </span>
          </div>
          {SEVERITY_MODEL.map((d) => (
            <Band key={d.id} dim={d.id} result={result} />
          ))}
        </div>

        {/* Index */}
        <div className="flex flex-col border-t border-foreground/25 py-6 xl:border-t-0 xl:border-l xl:border-border xl:py-0">
          <span className="hidden border-b border-foreground/25 py-2.5 pl-6 text-xs font-medium text-muted-foreground xl:block" aria-hidden>
            {t('method.levels.index')} <span className="num">· {COUNTS.index}</span>
          </span>
          {/* Top-aligned beside its column header, and kept in view while the reader scans the bands */}
          <div className="flex flex-col justify-start xl:sticky xl:top-24 xl:py-6 xl:pl-6">
            <span className="text-sm font-semibold">{t('results.title')}</span>
            <span className="mt-3 flex items-baseline gap-3">
              <span className="num font-display text-[2.75rem] leading-none font-semibold tracking-tight">{formatScore(result.severity)}</span>
              <span className="text-sm text-muted-foreground">{result.category ? t(`common:classes.${result.category}`) : t('results.notComputed')}</span>
            </span>
            <span className="mt-4 grid grid-cols-5 gap-0.5" aria-hidden>
              {SEVERITY_CATEGORY_KEYS.map((k) => (
                <span key={k} className={cn('h-1.5 ring-1 ring-foreground/10 ring-inset', result.category && result.category !== k && 'opacity-35')} style={{ background: SEVERITY_COLORS[k] }} />
              ))}
            </span>
            <p className="num mt-5 border-l-2 border-border pl-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {w.geo} × G({t('dim.impact')} {fractionLabel(w.impactVsConditions.impact)}, {t('dim.conditions')} {fractionLabel(w.impactVsConditions.conditions)})
              <br />+ {w.complexity} × {t('dim.complexity')}
            </p>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          <b className="font-mono font-semibold text-foreground">G</b>: {t('method.legendG')}
        </span>
        <span>
          <b className="font-mono font-semibold text-foreground">x̄</b>: {t('method.legendMean')}
        </span>
        <span>{t('method.live')}</span>
      </figcaption>
    </figure>
  );
}

const PRINCIPLES = ['normalise', 'aggregate', 'classify', 'reliability'] as const;

export const Methodology = React.memo(function Methodology({ result }: { result: SeverityResult }) {
  const { t, i18n } = useTranslation('severity');
  const lang = i18n.language;
  return (
    <div className="grid gap-14">
      <AggregationDiagram result={result} />

      <ol className="grid gap-y-8 border-t border-border pt-8 sm:grid-cols-2 xl:grid-cols-4">
        {PRINCIPLES.map((key, i) => (
          <li key={key} className="sm:odd:pr-6 sm:even:border-l sm:even:border-border sm:even:pl-6 xl:border-l xl:border-border xl:px-6 xl:first:border-l-0 xl:first:pl-0 xl:last:pr-0">
            <span className="num text-sm text-muted-foreground">{i + 1}</span>
            <h3 className="mt-1 text-base font-semibold">{t(`method.cards.${key}.title`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`method.cards.${key}.body`)}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-10 border-t border-border pt-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border">
        <div className="lg:pr-10">
          <h3 className="text-base font-semibold">{t('method.cite.title')}</h3>
          <ol className="mt-3 divide-y divide-border text-sm leading-relaxed">
            <li className="py-3">{t('method.cite.jrc')}</li>
            <li className="py-3">{t('method.cite.acaps')}</li>
          </ol>
        </div>
        <div className="lg:pl-10">
          <h3 className="text-base font-semibold">{t('method.adaptTitle')}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('method.adapt')}</p>
          <p className="num mt-3 text-sm text-muted-foreground">{t('method.denominators', { pop: formatNumber(TANZANIA_POPULATION_2022, lang), area: formatNumber(TANZANIA_AREA_KM2, lang) })}</p>
        </div>
      </div>
    </div>
  );
});
