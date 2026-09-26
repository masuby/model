/**
 * Live results — the index with its category bar, an incomplete state that lists what is missing,
 * the dimension → category → component → indicator tree, the formula with the numbers substituted,
 * the separately-reported reliability, and exports.
 */
import { ChevronRight, CircleAlert, ClipboardCopy, FileJson, FileSpreadsheet, FlaskConical, Sigma } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/primitives';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_MODEL, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { severityCategory, type ScoreNode, type SeverityResult } from '@/engine/severity/engine';
import { cn, formatScore } from '@/lib/utils';
import { fieldDomId, formatRaw, indicatorCoverage, isNum, type FormulaBreakdown, type InputFieldId } from '../lib';
import { DIM_ACCENT, fractionLabel, SeverityChip, SeverityMeter, severityColor, WeightTag } from './bits';

const f2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);

/** Big animated score (springs to the new value; instant with reduced motion). */
function AnimatedScore({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 140, damping: 22 });
  const text = useTransform(spring, (v) => (Math.round(v * 10) / 10).toFixed(1));
  React.useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);
  return <motion.span>{text}</motion.span>;
}

/** Five-segment category bar (1 Very low … 5 Very high) with a marker at the score. */
export function CategoryBar({ score, className }: { score: number | null; className?: string }) {
  const { t } = useTranslation(['severity', 'common']);
  const level = severityCategory(score)?.level ?? null;
  return (
    <div className={className}>
      <div className="relative pt-1.5 pb-1.5">
        <div className="grid grid-cols-5 gap-1" aria-hidden>
          {SEVERITY_CATEGORY_KEYS.map((k, i) => (
            <div key={k} className={cn('h-3 rounded-full ring-1 ring-black/5 transition-opacity duration-300', level && level !== i + 1 && 'opacity-40')} style={{ background: SEVERITY_COLORS[k] }} />
          ))}
        </div>
        {isNum(score) && (
          <motion.div
            className="absolute top-0 h-6 w-1.5 -translate-x-1/2 rounded-full bg-foreground shadow ring-2 ring-card"
            initial={false}
            animate={{ left: `${(Math.max(0, Math.min(5, score)) / 5) * 100}%` }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            aria-hidden
          />
        )}
      </div>
      <ol className="mt-1 grid grid-cols-5 gap-1 text-center text-[10px] leading-tight">
        {SEVERITY_CATEGORY_KEYS.map((k, i) => (
          <li key={k} className={cn(level === i + 1 ? 'font-bold text-foreground' : 'text-muted-foreground')} aria-current={level === i + 1 ? 'true' : undefined}>
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

function TreeRow({ label, score, tag, depth, raw }: { label: React.ReactNode; score: number | null; tag?: React.ReactNode; depth: number; raw?: React.ReactNode }) {
  const c = severityColor(score);
  return (
    <div className={cn('flex items-center gap-2 py-1', depth === 0 ? 'text-xs font-semibold' : depth === 1 ? 'text-xs' : 'text-[11px] text-muted-foreground')}>
      <span className="size-2 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: c ?? 'var(--muted)' }} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {tag}
      {raw && <span className="num hidden text-[10px] text-muted-foreground sm:inline">{raw}</span>}
      <span className={cn('num w-8 text-right', depth === 0 ? 'font-bold' : 'font-semibold', !isNum(score) && 'text-muted-foreground')}>{formatScore(score)}</span>
    </div>
  );
}

function DimensionTree({ dim, node, result }: { dim: SeverityDimensionKey; node: ScoreNode; result: SeverityResult }) {
  const { t, i18n } = useTranslation('severity');
  const def = SEVERITY_MODEL.find((d) => d.id === dim)!;
  return (
    <ul className="ml-1.5 border-l border-border pl-3">
      {def.categories.map((cat) => {
        const catNode = node.children?.find((c) => c.id === cat.id);
        return (
          <li key={cat.id} className="py-0.5">
            <TreeRow depth={0} label={t(`cat.${cat.id}`)} score={catNode?.score ?? null} tag={<WeightTag>{fractionLabel(cat.weight)}</WeightTag>} />
            <ul className="ml-1 border-l border-dashed border-border pl-3">
              {cat.components.map((comp) => {
                const compNode = catNode?.children?.find((c) => c.id === comp.id);
                return (
                  <li key={comp.id}>
                    <TreeRow depth={1} label={t(`comp.${comp.id}`)} score={compNode?.score ?? null} tag={<span className="text-[10px] text-muted-foreground">{cat.aggregation === 'geometric' ? 'G' : 'x̄'}</span>} />
                    <ul className="ml-1 pl-3">
                      {comp.indicators.map((ind) => {
                        const v = result.indicators[ind.id];
                        return (
                          <li key={ind.id}>
                            <TreeRow depth={2} label={t(`ind.${ind.id}`)} score={v?.score ?? null} raw={isNum(v?.raw) ? formatRaw(ind.unit, v.raw, i18n.language) : undefined} />
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
    <li className="rounded-xl border border-border bg-background/50">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-center gap-2.5 rounded-xl p-3 text-left transition-colors hover:bg-muted/60">
        <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-90')} aria-hidden />
        <span className={cn('size-2.5 shrink-0 rounded-full ring-4', DIM_ACCENT[dim].ring)} style={{ background: DIM_ACCENT[dim].hex }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{t(`dim.${dim}`)}</span>
            <WeightTag>{weight}</WeightTag>
          </span>
          <SeverityMeter value={node.score} thin className="mt-1.5" />
        </span>
        <span className="num w-9 text-right font-display text-lg font-extrabold">{formatScore(node.score)}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-3 pb-3">
              <DimensionTree dim={dim} node={node} result={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Formula                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function Formula({ f }: { f: FormulaBreakdown | null }) {
  const { t } = useTranslation('severity');
  const w = SEVERITY_WEIGHTS;
  const v = (dim: SeverityDimensionKey, x: number | null) => <b className={cn('font-bold', DIM_ACCENT[dim].text)}>{isNum(x) ? formatScore(x) : '?'}</b>;
  const line = 'flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5';
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3.5 font-mono text-[11.5px] leading-relaxed">
      <div className={line}>
        <span className="text-muted-foreground">{t('results.formulaLhs')} =</span>
        <span>
          {w.geo} × G({t('dim.impact')} {fractionLabel(w.impactVsConditions.impact)}, {t('dim.conditions')} {fractionLabel(w.impactVsConditions.conditions)}) + {w.complexity} × {t('dim.complexity')}
        </span>
      </div>
      <div className={line}>
        <span className="text-muted-foreground">=</span>
        <span>
          {w.geo} × G({v('impact', f?.impact ?? null)}, {v('conditions', f?.conditions ?? null)}) + {w.complexity} × {v('complexity', f?.complexity ?? null)}
        </span>
      </div>
      {f && (
        <>
          <div className={line}>
            <span className="text-muted-foreground">=</span>
            <span>
              {w.geo} × {f2(f.g)} + {w.complexity} × {f2(f.complexity)}
            </span>
          </div>
          <div className={line}>
            <span className="text-muted-foreground">=</span>
            <span>
              {f2(f.geoTerm)} + {f2(f.complexityTerm)} = <b className="rounded bg-foreground px-1.5 py-0.5 text-background">{formatScore(f.total)}</b>
            </span>
          </div>
        </>
      )}
      <p className="mt-2 font-sans text-[11px] leading-snug text-muted-foreground">{t('results.formulaHint')}</p>
    </div>
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
}

export function ResultsPanel({ result, formula, missing, scenarioLabel, illustrative, issueCount, dataReliability, daysSinceUpdate, onExportJson, onExportCsv, onCopySummary }: ResultsPanelProps) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const [open, setOpen] = React.useState<Partial<Record<SeverityDimensionKey, boolean>>>({});
  const color = result.color;
  const cov = indicatorCoverage(result);
  const rel = result.reliability;

  return (
    <Card className="overflow-hidden">
      {/* Headline */}
      <div className="relative border-b border-border p-5 sm:p-6" style={color ? { backgroundImage: `linear-gradient(135deg, ${color}40 0%, transparent 65%)` } : undefined}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{t('results.eyebrow')}</span>
          {illustrative && (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-warning/50 bg-warning/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-warning uppercase">
              <FlaskConical className="size-3" aria-hidden />
              {t('illustrative')}
            </span>
          )}
        </div>
        <h2 className="mt-1 font-display text-lg font-bold">{t('results.title')}</h2>
        <p className="truncate text-xs text-muted-foreground">{scenarioLabel}</p>

        {result.complete && isNum(result.severity) ? (
          <div className="mt-4 flex items-end gap-3">
            <div className="num font-display text-6xl leading-none font-extrabold tracking-tight" aria-hidden>
              <AnimatedScore value={result.severity} />
            </div>
            <span className="mb-1 text-base font-semibold text-muted-foreground">/ 5</span>
            <div className="mb-0.5 ml-auto flex flex-col items-end gap-1">
              <SeverityChip score={result.severity} size="lg" />
              <span className="num text-[11px] text-muted-foreground">{t('results.category', { level: result.level })}</span>
            </div>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {t('results.announce', { score: formatScore(result.severity), category: t(`common:classes.${result.category}`) })}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-end gap-3">
            <div className="num font-display text-6xl leading-none font-extrabold tracking-tight text-muted-foreground/50">—</div>
            <span className="mb-1 text-base font-semibold text-muted-foreground">/ 5</span>
            <span className="mb-1 ml-auto inline-flex items-center gap-1.5 rounded-full bg-warning/12 px-2.5 py-1 text-xs font-semibold text-warning">
              <CircleAlert className="size-3.5" aria-hidden /> {t('results.incomplete')}
            </span>
          </div>
        )}
        <CategoryBar score={result.complete ? result.severity : null} className="mt-4" />
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        {!result.complete && (
          <div role="status" className="rounded-xl border border-warning/40 bg-warning/5 p-3.5">
            <p className="text-xs font-semibold text-foreground">{t('results.incompleteLead')}</p>
            <ul className="mt-2 grid gap-2.5">
              {missing.map((m) => (
                <li key={m.dimension}>
                  <div className={cn('text-[11px] font-bold tracking-wide uppercase', DIM_ACCENT[m.dimension].text)}>{t(`dim.${m.dimension}`)}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {m.fields.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => focusField(f)}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/50 hover:text-primary"
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
          <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {t('results.issues', { count: issueCount })}
          </p>
        )}

        {/* Dimensions */}
        <section aria-labelledby="sev-dims-title">
          <div className="mb-2 flex items-center justify-between">
            <h3 id="sev-dims-title" className="text-sm font-semibold">
              {t('results.dimensions')}
            </h3>
            <button
              type="button"
              className="text-[11px] font-semibold text-primary hover:underline"
              onClick={() => {
                const all = SEVERITY_MODEL.every((d) => open[d.id]);
                setOpen(Object.fromEntries(SEVERITY_MODEL.map((d) => [d.id, !all])));
              }}
            >
              {SEVERITY_MODEL.every((d) => open[d.id]) ? t('results.collapseAll') : t('results.expandAll')}
            </button>
          </div>
          <ul className="grid gap-2">
            {SEVERITY_MODEL.map((d) => (
              <DimensionRow key={d.id} dim={d.id} result={result} open={!!open[d.id]} onToggle={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))} />
            ))}
          </ul>
        </section>

        {/* Formula */}
        <section aria-labelledby="sev-formula-title">
          <h3 id="sev-formula-title" className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sigma className="size-4 text-primary" aria-hidden /> {t('results.formula')}
          </h3>
          <Formula f={formula} />
        </section>

        {/* Reliability */}
        <section aria-labelledby="sev-rel-title" className="rounded-xl border border-border p-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 id="sev-rel-title" className="text-sm font-semibold">
              {t('results.reliability')}
            </h3>
            <span className="flex items-center gap-2">
              <span className="flex gap-0.5" role="img" aria-label={t('results.reliabilityAria', { score: rel.score })}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={cn('h-3 w-2 rounded-sm transition-colors', i <= rel.score ? 'bg-primary' : 'bg-muted')} />
                ))}
              </span>
              <span className="num text-sm font-bold">{rel.score}/5</span>
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{t(`common:classes.${rel.key}`)}</div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-muted-foreground">{t('results.completeness')}</span>
              <span className="num font-semibold">
                {rel.completeness}% · {t('results.completenessSub', { have: cov.have, total: cov.total })}
              </span>
            </div>
            <Progress value={rel.completeness} className="h-1.5" />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <dt className="text-muted-foreground">{t('results.sourceReliability')}</dt>
              <dd className="font-semibold">{dataReliability ? t(`reliabilityInput.${dataReliability}.name`) : t('results.notSet')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('results.recency')}</dt>
              <dd className="num font-semibold">{isNum(daysSinceUpdate) ? t('results.daysAgo', { count: daysSinceUpdate, n: new Intl.NumberFormat(i18n.language === 'sw' ? 'sw-TZ' : 'en-GB').format(daysSinceUpdate) }) : t('results.notSet')}</dd>
            </div>
          </dl>
          <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">{t('results.reliabilityNote')}</p>
        </section>

        {/* Export */}
        <section aria-labelledby="sev-export-title">
          <h3 id="sev-export-title" className="mb-2 text-sm font-semibold">
            {t('results.export')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onExportJson}>
              <FileJson /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <FileSpreadsheet /> CSV
            </Button>
            <Button size="sm" onClick={onCopySummary} className="col-span-2">
              <ClipboardCopy /> {t('results.copy')}
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
