/**
 * Static teaching figures referenced from lesson content (`{ "type": "figure", "id": … }`).
 * Numbers (indicator counts, class ranges, severity weights) come from the engine, never typed in.
 * Figures sit on the page between hairline rules - typography and data colour only.
 */
import { ArrowDown, ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLASS_COLORS, CLASS_KEYS, classRanges, type ClassKey, type Scale } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { SEVERITY_WEIGHTS } from '@/engine/severity/definitions';
import { cn } from '@/lib/utils';
import type { FigureId } from '../course';
import { SEVERITY_PART_COLORS } from '../palette';

/** Hazard × Exposure × Vulnerability × Lack of coping = Risk, set as a typographic equation. */
function DisasterEquation() {
  const { t } = useTranslation('learn');
  const parts = ['hazard', 'exposure', 'vulnerability', 'coping', 'risk'] as const;
  const last = parts.length - 1;
  return (
    <ol className="grid gap-y-5 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] sm:gap-x-3">
      {parts.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && (
            <li className="hidden self-start pt-0.5 font-display text-2xl text-muted-foreground sm:block" aria-hidden>
              {i < last ? '×' : '='}
            </li>
          )}
          <li className={cn('min-w-0', p === 'risk' && 'border-t border-border pt-5 sm:border-t-0 sm:pt-0')}>
            <div className={cn('font-display text-xl leading-tight', p === 'risk' ? 'font-bold' : 'font-semibold')}>
              {/* The operators are drawn for sighted readers; screen readers hear them spelled out. */}
              {i > 0 && <span className="sr-only">{t(i < last ? 'figures.disaster.times' : 'figures.disaster.equals')} </span>}
              <span className="mr-2 text-muted-foreground sm:hidden" aria-hidden>
                {i === 0 ? '' : i < last ? '×' : '='}
              </span>
              {t(`figures.disaster.${p}`)}
            </div>
            <div className="mt-1 text-sm leading-snug text-muted-foreground">{t(`figures.disaster.${p}Q`)}</div>
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

/**
 * From 32 indicators to five classes: counts in a row, joined by the operation that links them.
 * Phones stack the steps with a down arrow and the operation between them; from md up the steps sit
 * in equal columns with the arrows in their own narrow cells (the same grid as the disaster equation).
 */
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
    <ol className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] md:items-start md:gap-x-3">
      {steps.map((s) => (
        <React.Fragment key={s.key}>
          {s.via && (
            <li className="flex items-center gap-3 py-1.5 text-muted-foreground md:py-0 md:pt-2" aria-hidden>
              <ArrowDown className="ml-2 size-4 md:hidden" />
              <ArrowRight className="hidden size-4 md:block" />
              <span className="text-xs md:hidden">{t(`figures.ladder.${s.via}`)}</span>
            </li>
          )}
          <li className="flex min-w-0 items-baseline gap-3 md:block">
            <div className={cn('num w-8 font-display text-3xl leading-none md:w-auto', s.key === 'risk' ? 'font-bold' : 'font-semibold')}>{s.count}</div>
            <div className={cn('text-sm leading-tight md:mt-1.5', s.key === 'risk' ? 'font-semibold' : 'font-medium')}>{t(`figures.ladder.${s.key}`)}</div>
            {s.via && <div className="mt-1 hidden text-xs leading-tight text-muted-foreground md:block">{t(`figures.ladder.${s.via}`)}</div>}
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

/**
 * Class ranges per scale. From sm up: one row per scale, one column per class. On phones the table
 * is transposed (one row per class, four narrow scale columns with short headers) so it fits a
 * 358px column without scrolling. Only one of the two is ever displayed, so assistive technology
 * meets a single table.
 */
function ClassThresholds() {
  const { t } = useTranslation(['learn', 'common']);
  const rows: Array<{ scale: Scale; key: 'risk' | DimensionKey; label: string }> = [
    { scale: 'risk', key: 'risk', label: t('common:informRisk') },
    ...DIMENSIONS.map((d) => ({ scale: d.scale, key: d.key, label: t(`common:dimensions.${d.key}`) })),
  ];
  const ranges = rows.map((r) => classRanges(r.scale));
  const swatch = (k: ClassKey) => <span className="size-2.5 shrink-0" style={{ background: CLASS_COLORS[k] }} aria-hidden />;
  const head = 'text-left text-xs font-medium text-muted-foreground';

  return (
    <>
      {/* Phones: classes down, scales across. */}
      <table className="w-full text-[13px] sm:hidden">
        <caption className="sr-only">{t('figures.thresholds.caption')}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={cn(head, 'py-2 pr-1.5')}>
              {t('figures.thresholds.class')}
            </th>
            {rows.map((r) => (
              <th key={r.key} scope="col" className={cn(head, 'px-1 py-2 last:pr-0')}>
                <span aria-hidden>{t(`figures.thresholds.short.${r.key}`)}</span>
                <span className="sr-only">{r.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {CLASS_KEYS.map((k, i) => (
            <tr key={k}>
              <th scope="row" className="py-2.5 pr-1.5 text-left font-medium whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  {swatch(k)}
                  {t(`common:classes.${k}`)}
                </span>
              </th>
              {rows.map((r, j) => (
                <td key={r.key} className={cn('num px-1 py-2.5 whitespace-nowrap last:pr-0', r.scale === 'risk' ? 'font-medium text-foreground' : 'text-foreground/85')}>
                  {ranges[j][i]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* sm and up: scales down, classes across. */}
      <table className="hidden w-full text-sm sm:table">
        <caption className="sr-only">{t('figures.thresholds.caption')}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={cn(head, 'py-2 pr-3')}>
              {t('figures.thresholds.scale')}
            </th>
            {CLASS_KEYS.map((k) => (
              <th key={k} scope="col" className="px-2 py-2 text-left text-xs font-medium whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  {swatch(k)}
                  {t(`common:classes.${k}`)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, j) => (
            <tr key={r.key}>
              <th scope="row" className={cn('py-2.5 pr-3 text-left', r.scale === 'risk' ? 'font-semibold' : 'font-medium')}>
                {r.label}
              </th>
              {ranges[j].map((range, i) => (
                <td key={CLASS_KEYS[i]} className="num px-2 py-2.5 whitespace-nowrap text-foreground/85">
                  {range}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function SeverityWeights() {
  const { t } = useTranslation('learn');
  const w = SEVERITY_WEIGHTS;
  const segs = [
    { key: 'impact', pct: w.geo * w.impactVsConditions.impact * 100 },
    { key: 'conditions', pct: w.geo * w.impactVsConditions.conditions * 100 },
    { key: 'complexity', pct: w.complexity * 100 },
  ] as const;
  return (
    <div>
      <div className="flex text-xs leading-snug text-muted-foreground">
        <div style={{ width: `${Math.round(w.geo * 100)}%` }} className="border-b border-border pr-2 pb-1.5">
          {t('figures.severity.geoPart', { pct: Math.round(w.geo * 100) })}
        </div>
        <div style={{ width: `${Math.round(w.complexity * 100)}%` }} className="border-b border-border pb-1.5 pl-2">
          {t('figures.severity.linearPart', { pct: Math.round(w.complexity * 100) })}
        </div>
      </div>
      <div className="mt-3 flex h-3 gap-px" aria-hidden>
        {segs.map((s) => (
          <div key={s.key} style={{ width: `${s.pct}%`, background: SEVERITY_PART_COLORS[s.key] }} />
        ))}
      </div>
      <div className="mt-2 flex gap-px text-sm">
        {segs.map((s) => (
          <div key={s.key} style={{ width: `${s.pct}%` }} className="min-w-0 pr-2">
            <div className="font-medium break-words hyphens-auto">{t(`figures.severity.${s.key}`)}</div>
            <div className="num text-muted-foreground">{Math.round(s.pct)}%</div>
          </div>
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

/**
 * A figure opens with a hairline - unless it directly follows another ruled block (a formula, terms
 * or comparison, marked `data-ruled`), whose bottom rule already separates the two.
 */
export function Figure({ id, caption }: { id: FigureId; caption?: string }) {
  const C = FIGURES[id];
  return (
    <figure className="my-10 border-t border-border pt-6 [[data-ruled]+&]:mt-6 [[data-ruled]+&]:border-t-0 [[data-ruled]+&]:pt-0">
      <C />
      {caption && <figcaption className="mt-4 text-sm leading-relaxed text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
