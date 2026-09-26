/**
 * Crisis severity (/severity) — the official JRC/ACAPS INFORM Severity Index for a Tanzanian crisis:
 *   Severity = 0.7 × G(Impact ⅓, Conditions ⅔) + 0.3 × Complexity   (0–5; category = ROUNDUP)
 * Scenario → affected area (councils) → inputs by the official structure → live result, exports,
 * the indicator calibration table and a methodology explainer. All maths is in @/engine/severity.
 */
import { ArrowRight, BookOpen, FlaskConical, Gauge, RotateCcw, ShieldAlert } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageContainer, PageHeader, SectionHeading } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import type { AffectedGroup, SeverityDimensionKey } from '@/engine/severity/definitions';
import { computeSeverity, type SeverityInput } from '@/engine/severity/engine';
import type { Unit } from '@/engine/risk/types';
import { cn, downloadText, formatNumber, formatScore, toCsv } from '@/lib/utils';
import { AreaPicker } from './components/AreaPicker';
import { DIM_ACCENT, FADE, SeverityChip, Step } from './components/bits';
import { IndicatorTable } from './components/IndicatorTable';
import { ComplexityInputs, ConditionsInputs, ImpactInputs, ReliabilityInputs } from './components/Inputs';
import { Methodology } from './components/Methodology';
import { ResultsPanel } from './components/ResultsPanel';
import { ScenarioPicker } from './components/ScenarioPicker';
import {
  areaTotals,
  buildCsvRows,
  buildExportJson,
  buildSummary,
  formulaBreakdown,
  initialSeverityState,
  missingInputs,
  severityReducer,
  validateInput,
  type ConditionLevel,
  type ExportContext,
  type InputIssue,
  type ScenarioChoice,
  type Translate,
} from './lib';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Live dimension score shown next to a step title. */
function DimScore({ dim, score }: { dim: SeverityDimensionKey; score: number | null }) {
  const { t } = useTranslation('severity');
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-3 text-xs shadow-xs">
      <span className="size-2 rounded-full" style={{ background: DIM_ACCENT[dim].hex }} aria-hidden />
      <span className="text-muted-foreground">{t('steps.dimScore')}</span>
      <b className="num font-display text-sm">{formatScore(score)}</b>
      <SeverityChip score={score} size="sm" />
    </span>
  );
}

export default function SeverityPage() {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const model = useModel();
  const [state, dispatch] = React.useReducer(severityReducer, undefined, () => initialSeverityState('riverineFlood'));
  const { input } = state;

  const result = React.useMemo(() => computeSeverity(input), [input]);
  const councils = React.useMemo(() => state.councilIds.map((id) => model.byId.get(id)).filter((u): u is Unit => !!u), [state.councilIds, model]);
  const totals = React.useMemo(() => areaTotals(councils), [councils]);
  const issues = React.useMemo(() => validateInput(input), [input]);
  const missing = React.useMemo(() => missingInputs(input, result), [input, result]);
  const formula = React.useMemo(() => formulaBreakdown(result), [result]);
  const censusApplied = councils.length > 0 && input.peopleInArea === totals.population && input.areaAffectedKm2 === totals.areaKm2;

  const tr = React.useCallback<Translate>((key, opts) => t(key, opts ?? {}), [t]);
  const issueText = React.useCallback(
    (i: InputIssue) => t(`issue.${i.key}`, Object.fromEntries(Object.entries(i.values).map(([k, v]) => [k, formatNumber(v, lang)]))),
    [t, lang],
  );

  const patch = React.useCallback((p: Partial<SeverityInput>) => dispatch({ type: 'patch', patch: p }), []);
  const setLevel = React.useCallback((level: ConditionLevel, value: number | null) => dispatch({ type: 'setLevel', level, value }), []);
  const toggleGroup = React.useCallback((group: AffectedGroup) => dispatch({ type: 'toggleGroup', group }), []);
  const toggleCouncil = React.useCallback((id: string) => dispatch({ type: 'toggleCouncil', id }), []);
  const clearCouncils = React.useCallback(() => dispatch({ type: 'clearCouncils' }), []);
  const loadScenario = React.useCallback((id: ScenarioChoice) => dispatch({ type: 'loadScenario', id }), []);
  const applyCensus = React.useCallback(() => {
    dispatch({ type: 'applyCensus', population: totals.population, areaKm2: totals.areaKm2 });
    toast.success(t('area.appliedToast'), { description: t('area.appliedToastSub', { people: formatNumber(totals.population, lang), area: formatNumber(totals.areaKm2, lang) }) });
  }, [totals, t, lang]);

  const scenarioName = t(`scenario.${state.scenario}.name`);
  const scenarioLabel = state.modified ? `${scenarioName} · ${t('scenario.edited')}` : scenarioName;
  const illustrative = state.scenario !== 'custom';

  const exportCtx = (): ExportContext => ({ state, result, councils, totals, lang, t: tr });
  const fileBase = `inform-tz-severity-${state.scenario}-${new Date().toISOString().slice(0, 10)}`;
  const onExportJson = () => downloadText(`${fileBase}.json`, JSON.stringify(buildExportJson(exportCtx()), null, 2), 'application/json;charset=utf-8');
  const onExportCsv = () => downloadText(`${fileBase}.csv`, toCsv(buildCsvRows(exportCtx())), 'text/csv;charset=utf-8');
  const onCopySummary = async () => {
    const text = buildSummary(exportCtx());
    if (await copyText(text)) toast.success(t('results.copied'), { description: text.split('\n')[0] });
    else toast.error(t('results.copyFailed'));
  };

  const resultsRef = React.useRef<HTMLElement>(null);
  const resultsInView = useInView(resultsRef, { margin: '0px 0px -35% 0px' });

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        eyebrow={t('header.eyebrow')}
        title={t('header.title')}
        description={t('header.lead')}
        actions={
          <Button variant="outline" asChild>
            <a href="#sev-method">
              <BookOpen /> {t('header.methodCta')}
            </a>
          </Button>
        }
      >
        <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
          <Link to="/explore" className="group flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-3.5 shadow-xs backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-green-500/5 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{t('common:informRisk')}</span>
              <span className="block text-xs text-muted-foreground">{t('header.riskSub')}</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-card/80 p-3.5 shadow-xs ring-1 ring-rose-500/10 backdrop-blur">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/15 to-orange-500/5 text-rose-700 dark:text-rose-400">
              <Gauge className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{t('header.severityName')}</span>
              <span className="block text-xs text-muted-foreground">{t('header.severitySub')}</span>
            </span>
            <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">{t('header.here')}</span>
          </div>
        </div>
      </PageHeader>

      <PageContainer className="py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 flex-col gap-12">
            <Step
              n={1}
              id="sev-step-scenario"
              title={t('steps.scenario.title')}
              description={t('steps.scenario.lead')}
              actions={
                state.modified && (
                  <Button variant="ghost" size="sm" onClick={() => loadScenario(state.scenario)}>
                    <RotateCcw /> {state.scenario === 'custom' ? t('scenario.clearForm') : t('scenario.restore')}
                  </Button>
                )
              }
            >
              <ScenarioPicker value={state.scenario} onChange={loadScenario} />
              <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-warning/40 bg-warning/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <span>
                  <b className="font-semibold text-foreground">{t('illustrativeTitle')}</b> {t('illustrativeNote')}
                </span>
              </p>
            </Step>

            <Step n={2} id="sev-step-area" title={t('steps.area.title')} description={t('steps.area.lead')}>
              <AreaPicker
                model={model}
                selectedIds={state.councilIds}
                councils={councils}
                totals={totals}
                censusApplied={censusApplied}
                onToggle={toggleCouncil}
                onClear={clearCouncils}
                onApplyCensus={applyCensus}
              />
            </Step>

            <Step n={3} id="sev-step-impact" title={t('dim.impact')} description={t('steps.impact.lead')} actions={<DimScore dim="impact" score={result.dimensions.impact.score} />}>
              <ImpactInputs input={input} result={result} issues={issues} issueText={issueText} patch={patch} />
            </Step>

            <Step n={4} id="sev-step-conditions" title={t('dim.conditions')} description={t('steps.conditions.lead')} actions={<DimScore dim="conditions" score={result.dimensions.conditions.score} />}>
              <ConditionsInputs input={input} result={result} issues={issues} issueText={issueText} setLevel={setLevel} />
            </Step>

            <Step n={5} id="sev-step-complexity" title={t('dim.complexity')} description={t('steps.complexity.lead')} actions={<DimScore dim="complexity" score={result.dimensions.complexity.score} />}>
              <ComplexityInputs input={input} result={result} issues={issues} issueText={issueText} patch={patch} toggleGroup={toggleGroup} />
            </Step>

            <Step n={6} id="sev-step-reliability" title={t('steps.reliability.title')} description={t('steps.reliability.lead')}>
              <ReliabilityInputs input={input} patch={patch} />
            </Step>
          </div>

          <aside
            ref={resultsRef}
            id="sev-results"
            aria-label={t('results.title')}
            className="scroll-mt-24 [scrollbar-width:thin] lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:rounded-2xl"
          >
            <ResultsPanel
              result={result}
              formula={formula}
              missing={missing}
              scenarioLabel={scenarioLabel}
              illustrative={illustrative}
              issueCount={issues.length}
              dataReliability={input.dataReliability}
              daysSinceUpdate={input.daysSinceUpdate}
              onExportJson={onExportJson}
              onExportCsv={onExportCsv}
              onCopySummary={() => void onCopySummary()}
            />
          </aside>
        </div>
      </PageContainer>

      <section className="mt-6 border-y border-border bg-card/40 py-16" aria-labelledby="sev-table-heading">
        <PageContainer>
          <motion.div {...FADE}>
            <SectionHeading eyebrow={t('table.eyebrow')} title={<span id="sev-table-heading">{t('table.title')}</span>} description={t('table.lead')} />
          </motion.div>
          <motion.div {...FADE}>
            <IndicatorTable result={result} />
          </motion.div>
        </PageContainer>
      </section>

      <section id="sev-method" className="scroll-mt-20 py-16" aria-labelledby="sev-method-heading">
        <PageContainer>
          <motion.div {...FADE}>
            <SectionHeading eyebrow={t('method.eyebrow')} title={<span id="sev-method-heading">{t('method.title')}</span>} description={t('method.lead')} />
          </motion.div>
          <Methodology result={result} />
        </PageContainer>
      </section>

      {/* Mobile: a compact live score that jumps to the full result */}
      <div className={cn('fixed inset-x-3 bottom-3 z-[1050] transition-all duration-300 lg:hidden', resultsInView ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100')}>
        <a href="#sev-results" className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-[var(--shadow-lift)]" tabIndex={resultsInView ? -1 : 0}>
          <Gauge className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="num font-display text-2xl leading-none font-extrabold">{result.complete ? formatScore(result.severity) : '—'}</span>
          <span className="text-xs text-muted-foreground">/ 5</span>
          <SeverityChip score={result.complete ? result.severity : null} size="sm" />
          <span className="ml-auto text-xs font-semibold text-primary">{t('results.mobileCta')}</span>
        </a>
      </div>
    </div>
  );
}
