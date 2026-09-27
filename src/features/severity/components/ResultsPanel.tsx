/**
 * Live results — one flat panel (the only box on the page besides inputs): the index with its category
 * bar, an incomplete state that lists what is missing, the dimension → category → component → indicator
 * tree, the formula with the numbers substituted and the separately-reported reliability (both native
 * <details>, closed by default so the panel fits a laptop screen), and an export bar that stays pinned
 * to the bottom of the sticky panel on wide screens. Sections are separated by hairline rules.
 */
import { ChevronRight, CircleAlert, ClipboardCopy } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Kicker } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/primitives';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_MODEL, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { severityCategory, type ScoreNode, type SeverityResult } from '@/engine/severity/engine';
import { cn, formatScore } from '@/lib/utils';
import { fieldDomId, indicatorCoverage, isNum, type FormulaBreakdown, type InputFieldId } from '../lib';
import { fractionLabel, SeverityChip, SeverityMeter, severityColor, WeightTag } from './bits';

const f2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
const sectionCls = 'border-t border-border px-5 py-5 sm:px-6';

/** Five-segment category bar (1 Very low … 5 Very high) with a marker at the score. */
export function CategoryBar({ score, className }: { score: number | null; className?: string }) {
  const { t } = useTranslation(['severity', 'common']);
  const level = severityCategory(score)?.level ?? null;
  return (
    <div className={className}>
      <div className="relative py-1">
        <div className="grid grid-cols-5 gap-0.5" aria-hidden>
          {SEVERITY_CATEGORY_KEYS.map((k, i) => (
            <div key={k} className={cn('h-2 transition-opacity duration-150', level && level !== i + 1 && 'opacity-35')} style={{ background: SEVERITY_COLORS[k] }} />
          ))}
        </div>
        {isNum(score) && (
          <div
            className="absolute top-0 h-4 w-[3px] -translate-x-1/2 bg-foreground outline-2 outline-card transition-[left] duration-150"
            style={{ left: `${(Math.max(0, Math.min(5, score)) / 5) * 100}%` }}
            aria-hidden
          />
        )}
      </div>
      <ol className="mt-2 grid grid-cols-5 gap-0.5 text-center text-[11px] leading-tight">
        {SEVERITY_CATEGORY_KEYS.map((k, i) => (
          <li key={k} className={cn(level === i + 1 ? 'font-semibold text-foreground' : 'text-muted-foreground')} aria-current={level === i + 1 ? 'true' : undefined}>
            <span className="num block">{i + 1}</span>
            <span className="block">{t(`common:classes.${k}`)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function focusField(f: InputFieldId) {
  const el = document.getElementById(fieldDomId(f));
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const target = el.matches('input,button') ? el : el.querySelector<HTMLElement>('input,button,[tabindex="0"]');
  window.setTimeout(() => target?.focus({ preventScroll: true }), 350);
}

/* ------------------------------------------------------------------------------------------------ */
/* Dimension tree                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** A tiny colour mark with a hairline edge, so pale (level 1–2) and dark (level 5) colours stay visible. */
const dotCls = 'size-2 shrink-0 rounded-full ring-1 ring-foreground/20 ring-inset';

function TreeRow({ label, score, tag, depth }: { label: React.ReactNode; score: number | null; tag?: React.ReactNode; depth: number }) {
  const c = severityColor(score);
  return (
    <div className={cn('flex items-start gap-2 py-1 text-xs leading-snug', depth === 0 ? 'font-semibold' : depth === 1 ? 'font-medium' : 'text-muted-foreground')}>
      <span className={cn(dotCls, 'mt-[5px]')} style={{ background: c ?? 'var(--muted)' }} aria-hidden />
      <span className="min-w-0 flex-1">{label}</span>
      {tag}
      <span className={cn('num w-7 shrink-0 text-right', depth === 0 ? 'font-semibold' : 'font-medium text-foreground', !isNum(score) && 'text-muted-foreground')}>{formatScore(score)}</span>
    </div>
  );
}

function DimensionTree({ dim, node, result }: { dim: SeverityDimensionKey; node: ScoreNode; result: SeverityResult }) {
  const { t } = useTranslation('severity');
  const def = SEVERITY_MODEL.find((d) => d.id === dim)!;
  return (
    <ul className="ml-1 border-l border-border pl-3">
      {def.categories.map((cat) => {
        const catNode = node.children?.find((c) => c.id === cat.id);
        return (
          <li key={cat.id} className="py-0.5">
            <TreeRow
              depth={0}
              label={t(`cat.${cat.id}`)}
              score={catNode?.score ?? null}
              tag={
                <WeightTag className="shrink-0">
                  {fractionLabel(cat.weight)} · {cat.aggregation === 'geometric' ? 'G' : 'x̄'}
                </WeightTag>
              }
            />
            <ul className="ml-1 border-l border-border pl-3">
              {cat.components.map((comp) => {
                const compNode = catNode?.children?.find((c) => c.id === comp.id);
                return (
                  <li key={comp.id}>
                    <TreeRow depth={1} label={t(`comp.${comp.id}`)} score={compNode?.score ?? null} />
                    <ul className="pl-3">
                      {comp.indicators.map((ind) => {
                        const v = result.indicators[ind.id];
                        return (
                          <li key={ind.id}>
                            <TreeRow depth={2} label={t(`ind.${ind.id}`)} score={v?.score ?? null} />
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function DimensionRow({ dim, result, open, onToggle }: { dim: SeverityDimensionKey; result: SeverityResult; open: boolean; onToggle: () => void }) {
  const { t } = useTranslation('severity');
  const node = result.dimensions[dim];
  const w = SEVERITY_WEIGHTS;
  const weight = dim === 'complexity' ? `${Math.round(w.complexity * 100)}%` : t('results.weightInG', { w: fractionLabel(w.impactVsConditions[dim]) });
  const id = `sev-tree-${dim}`;
  return (
    <li>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="group flex w-full items-center gap-2.5 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:text-foreground', open && 'rotate-90')} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium group-hover:underline group-hover:underline-offset-4">{t(`dim.${dim}`)}</span>
            <WeightTag>{weight}</WeightTag>
          </span>
          <SeverityMeter value={node.score} thin className="mt-2" />
        </span>
        <span className="num w-9 text-right text-lg font-semibold">{formatScore(node.score)}</span>
      </button>
      {open && (
        <div id={id} className="pb-3 pl-1.5">
          <DimensionTree dim={dim} node={node} result={result} />
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Formula                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The formula with the user's numbers as aligned lines with a hanging "=". There is no symbolic line:
 * the dimension scores are listed just above, and the hint beneath names G's two arguments.
 */
function Formula({ f, result }: { f: FormulaBreakdown | null; result: SeverityResult }) {
  const { t } = useTranslation('severity');
  const w = SEVERITY_WEIGHTS;
  const v = (x: number | null | undefined) => <b className="font-semibold text-foreground">{isNum(x) ? formatScore(x) : '?'}</b>;
  const d = result.dimensions;
  const rows: Array<[React.ReactNode, React.ReactNode]> = [
    [
      t('results.formulaLhs'),
      <>
        {w.geo} × G({v(d.impact.score)}, {v(d.conditions.score)}) + {w.complexity} × {v(d.complexity.score)}
      </>,
    ],
  ];
  if (f) {
    rows.push(
      [
        null,
        <>
          {w.geo} × {f2(f.g)} + {w.complexity} × {f2(f.complexity)}
        </>,
      ],
      [
        null,
        <>
          {f2(f.geoTerm)} + {f2(f.complexityTerm)}
        </>,
      ],
      [null, <b className="text-[13px] font-bold text-foreground">{formatScore(f.total)}</b>],
    );
  }
  return (
    <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-1.5 gap-y-0.5 border-l-2 border-border pl-3 font-mono text-xs leading-relaxed text-muted-foreground">
      {rows.map(([lhs, rhs], i) => (
        <React.Fragment key={i}>
          <span>{lhs}</span>
          <span>=</span>
          <span className="num">{rhs}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** A native disclosure section of the panel: title row (plus an optional summary value) and a CSS-only chevron. */
function PanelDetails({ id, title, aside, children }: { id: string; title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="group/d border-t border-border">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 outline-none select-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open/d:rotate-90" aria-hidden />
        <h3 id={id} className="min-w-0 flex-1 text-sm font-semibold">
          {title}
        </h3>
        {aside}
      </summary>
      <div className="px-5 pt-1 pb-5 sm:px-6">{children}</div>
    </details>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Panel                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export interface ResultsPanelProps {
  result: SeverityResult;
  formula: FormulaBreakdown | null;
  missing: Array<{ dimension: SeverityDimensionKey; fields: InputFieldId[] }>;
  scenarioLabel: string;
  illustrative: boolean;
  issueCount: number;
  dataReliability: 'low' | 'medium' | 'high' | null | undefined;
  daysSinceUpdate: number | null | undefined;
  onExportJson: () => void;
  onExportCsv: () => void;
  onCopySummary: () => void;
  /** Wide screens: the panel scrolls and some content is hidden under the pinned export bar. */
  moreBelow?: boolean;
}

export function ResultsPanel({
  result,
  formula,
  missing,
  scenarioLabel,
  illustrative,
  issueCount,
  dataReliability,
  daysSinceUpdate,
  onExportJson,
  onExportCsv,
  onCopySummary,
  moreBelow,
}: ResultsPanelProps) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const [open, setOpen] = React.useState<Partial<Record<SeverityDimensionKey, boolean>>>({});
  const cov = indicatorCoverage(result);
  const rel = result.reliability;
  const allOpen = SEVERITY_MODEL.every((d) => open[d.id]);

  return (
    // On lg+ the frame belongs to the scrolling <aside>, so its outline stays complete; the card drops its own.
    <Card className="lg:rounded-none lg:border-0">
      {/* Headline */}
      <div className="px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
        <Kicker>{t('results.eyebrow')}</Kicker>
        <h2 className="mt-1 text-[1.35rem] leading-tight">{t('results.title')}</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">{illustrative ? t('results.scenarioIllustrative', { name: scenarioLabel }) : scenarioLabel}</p>

        {result.complete && isNum(result.severity) ? (
          <div className="mt-6 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2" aria-hidden>
              <span className="num font-display text-[3.75rem] leading-[0.9] font-semibold tracking-tight">{formatScore(result.severity)}</span>
              <span className="text-base text-muted-foreground">/ 5</span>
            </div>
            <div className="flex flex-col items-end gap-1.5 pb-1">
              <SeverityChip score={result.severity} />
              <span className="num text-xs text-muted-foreground">{t('results.category', { level: result.level })}</span>
            </div>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {t('results.announce', { score: formatScore(result.severity), category: t(`common:classes.${result.category}`) })}
            </span>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="font-display text-2xl font-semibold text-muted-foreground">{t('results.notComputed')}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning">
              <CircleAlert className="size-4 self-center" aria-hidden />
              {t('results.incomplete')}
            </span>
          </div>
        )}
        <CategoryBar score={result.complete ? result.severity : null} className="mt-6" />
      </div>

      {(!result.complete || issueCount > 0) && (
        <div className={cn(sectionCls, 'grid gap-4')}>
          {!result.complete && (
            <div role="status" className="border-l-2 border-warning pl-4">
              <p className="text-sm font-medium">{t('results.incompleteLead')}</p>
              <ul className="mt-2.5 grid gap-2.5">
                {missing.map((m) => (
                  <li key={m.dimension}>
                    <div className="text-xs text-muted-foreground">{t(`dim.${m.dimension}`)}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {m.fields.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => focusField(f)}
                          className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {t(`field.${f}.short`)}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {issueCount > 0 && (
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              {t('results.issues', { count: issueCount })}
            </p>
          )}
        </div>
      )}

      {/* Dimensions */}
      <section aria-labelledby="sev-dims-title" className={cn(sectionCls, 'pb-2 sm:pb-2')}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="sev-dims-title" className="text-sm font-semibold">
            {t('results.dimensions')}
          </h3>
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => setOpen(Object.fromEntries(SEVERITY_MODEL.map((d) => [d.id, !allOpen])))}
          >
            {allOpen ? t('results.collapseAll') : t('results.expandAll')}
          </button>
        </div>
        <ul className="mt-1 divide-y divide-border">
          {SEVERITY_MODEL.map((d) => (
            <DimensionRow key={d.id} dim={d.id} result={result} open={!!open[d.id]} onToggle={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))} />
          ))}
        </ul>
      </section>

      {/* Formula (closed by default) */}
      <PanelDetails id="sev-formula-title" title={t('results.formula')}>
        <Formula f={formula} result={result} />
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('results.formulaHint')}</p>
      </PanelDetails>

      {/* Reliability: the score stays visible in the summary row; the breakdown is one click away */}
      <PanelDetails
        id="sev-rel-title"
        title={t('results.reliability')}
        aside={
          <span className="flex shrink-0 items-center gap-2.5">
            <span className="flex gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={cn('h-2.5 w-2 transition-colors duration-150', i <= rel.score ? 'bg-foreground/80' : 'bg-muted ring-1 ring-foreground/10 ring-inset')} />
              ))}
            </span>
            <span className="num text-sm font-semibold">{rel.score}/5</span>
          </span>
        }
      >
        <div className="text-xs text-muted-foreground">{t(`common:classes.${rel.key}`)}</div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{t('results.completeness')}</span>
            <span className="num font-medium">
              {rel.completeness}% · {t('results.completenessSub', { have: cov.have, total: cov.total })}
            </span>
          </div>
          <Progress value={rel.completeness} label={`${t('results.completeness')}: ${rel.completeness}%`} className="h-1 rounded-none" indicatorClassName="rounded-none bg-foreground/80" />
        </div>
        <dl className="mt-4 grid grid-cols-2 divide-x divide-border text-xs">
          <div className="pr-3">
            <dt className="text-muted-foreground">{t('results.sourceReliability')}</dt>
            <dd className="mt-0.5 font-medium">{dataReliability ? t(`reliabilityInput.${dataReliability}.name`) : t('results.notSet')}</dd>
          </div>
          <div className="pl-3">
            <dt className="text-muted-foreground">{t('results.recency')}</dt>
            <dd className="num mt-0.5 font-medium">
              {isNum(daysSinceUpdate) ? t('results.daysAgo', { count: daysSinceUpdate, n: new Intl.NumberFormat(i18n.language === 'sw' ? 'sw-TZ' : 'en-GB').format(daysSinceUpdate) }) : t('results.notSet')}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('results.reliabilityNote')}</p>
      </PanelDetails>

      {/* Export: one row, pinned to the bottom of the scrolling panel on wide screens */}
      <section
        aria-labelledby="sev-export-title"
        className={cn(
          'border-t bg-card px-5 py-3.5 transition-[border-color,box-shadow] duration-150 sm:px-6 lg:sticky lg:bottom-0',
          moreBelow ? 'border-foreground/25 shadow-[0_-8px_16px_-12px_rgb(0_0_0/0.35)]' : 'border-border',
        )}
      >
        <h3 id="sev-export-title" className="sr-only">
          {t('results.export')}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={onCopySummary} className="min-w-0 flex-1" aria-label={t('results.copy')} title={t('results.copy')}>
            <ClipboardCopy /> <span className="truncate">{t('results.copyShort')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onExportJson}>
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            CSV
          </Button>
        </div>
      </section>
    </Card>
  );
}
