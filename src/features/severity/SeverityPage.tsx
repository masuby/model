/**
 * Crisis severity (/severity) — the official JRC/ACAPS INFORM Severity Index for a Tanzanian crisis:
 *   Severity = 0.7 × G(Impact ⅓, Conditions ⅔) + 0.3 × Complexity   (0–5; category = ROUNDUP)
 * Scenario → affected area (councils) → inputs by the official structure → live result, exports,
 * the indicator calibration table and a methodology explainer. All maths is in @/engine/severity.
 *
 * Layout (docs/DESIGN_LANGUAGE.md): ruled steps on the page, one flat results panel, no entrance motion.
 * Speed: the council picker is the SVG StaticMap (no Leaflet), there is no animation library, and the
 * memoised table and methodology below the fold mount once the browser is idle and then follow the
 * result at low priority (useDeferredValue).
 */
import { ArrowRight, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Note, PageContainer, PageHeader, SectionHeading } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import type { AffectedGroup } from '@/engine/severity/definitions';
import { computeSeverity, type SeverityInput } from '@/engine/severity/engine';
import type { Unit } from '@/engine/risk/types';
import { cn, downloadText, formatNumber, formatScore, toCsv } from '@/lib/utils';
import { AreaPicker } from './components/AreaPicker';
import { SeverityChip, Step } from './components/bits';
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

/** True while the element intersects the viewport (shrunk by `rootMargin`). No animation library. */
function useInView(ref: React.RefObject<Element | null>, rootMargin: string) {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/**
 * False for the first paint, true once the browser is idle (or at once when printing). The long calibration
 * table and methodology below the fold mount then, so the first layout of this long page stays small.
 */
function useIdleMount() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (ready) return;
    const show = () => React.startTransition(() => setReady(true));
    const now = () => flushSync(() => setReady(true));
    const idle = typeof window.requestIdleCallback === 'function';
    const handle = idle ? window.requestIdleCallback(show, { timeout: 2000 }) : window.setTimeout(show, 150);
    window.addEventListener('beforeprint', now);
    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      window.removeEventListener('beforeprint', now);
    };
  }, [ready]);
  return ready;
}

/** Live dimension score shown beside a step title: plain text plus the category badge. */
function DimScore({ score }: { score: number | null }) {
  const { t } = useTranslation('severity');
  return (
    <span className="flex items-center gap-2.5 text-sm">
      <span className="text-muted-foreground">{t('steps.dimScore')}</span>
      <b className="num text-xl font-semibold">{formatScore(score)}</b>
      <SeverityChip score={score} size="sm" />
    </span>
  );
}

const lowerSection = 'scroll-mt-20 border-t border-border py-14 sm:py-16';
const headerLink = 'group inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline';
const headerArrow = 'size-3.5 transition-transform duration-150 group-hover:translate-x-0.5';

/**
 * True while the scrollable results panel (lg+) has content hidden below its fold, so the sticky export
 * bar can show that the panel continues. Always false where the panel is not a scroll container.
 */
function useMoreBelow(ref: React.RefObject<HTMLElement | null>) {
  const [more, setMore] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 1);
    el.addEventListener('scroll', update, { passive: true });
    // The observer reports once right after layout, so there is no synchronous (layout-forcing) first read.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (!ro) update();
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, [ref]);
  return more;
}

export default function SeverityPage() {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const model = useModel();
  const [state, dispatch] = React.useReducer(severityReducer, undefined, () => initialSeverityState('riverineFlood'));
  const { input } = state;

  const result = React.useMemo(() => computeSeverity(input), [input]);
  // The table and methodology far below follow the result at low priority, so typing stays instant.
  const lowPriorityResult = React.useDeferredValue(result);
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
  const resultsInView = useInView(resultsRef, '0px 0px -35% 0px');
  const moreBelow = useMoreBelow(resultsRef);
  const lowerReady = useIdleMount();

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader eyebrow={t('header.eyebrow')} title={t('header.title')} description={t('header.lead')}>
        {/* Risk vs severity: a matched pair of columns set off by one vertical rule, each ending in a link */}
        <dl className="mt-8 grid max-w-3xl gap-y-6 sm:mt-10 sm:grid-cols-2 sm:divide-x sm:divide-border">
          <div className="sm:pr-8">
            <dt className="text-sm text-muted-foreground">{t('header.before')}</dt>
            <dd className="mt-1 text-base font-semibold">
              {t('common:informRisk')} <span className="num font-normal text-muted-foreground">· 0–10</span>
            </dd>
            <dd className="mt-1.5 text-sm">
              <Link to="/explore" className={headerLink}>
                {t('header.riskCta')}
                <ArrowRight className={headerArrow} aria-hidden />
              </Link>
            </dd>
          </div>
          <div className="sm:pl-8">
            <dt className="text-sm text-muted-foreground">{t('header.during')}</dt>
            <dd className="mt-1 text-base font-semibold">
              {t('header.severityName')} <span className="num font-normal text-muted-foreground">· 0–5</span>
            </dd>
            <dd className="mt-1.5 text-sm">
              <a href="#sev-method" className={headerLink}>
                {t('header.methodCta')}
                <ArrowRight className={headerArrow} aria-hidden />
              </a>
            </dd>
          </div>
        </dl>
      </PageHeader>

      <PageContainer className="pt-12 pb-16 sm:pt-14">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-16">
          <div className="flex min-w-0 flex-col gap-14">
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
              <Note tone="warning" title={t('illustrativeTitle')} className="mt-6">
                {t('illustrativeNote')}
              </Note>
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

            <Step n={3} id="sev-step-impact" title={t('dim.impact')} description={t('steps.impact.lead')} actions={<DimScore score={result.dimensions.impact.score} />}>
              <ImpactInputs input={input} result={result} issues={issues} issueText={issueText} patch={patch} />
            </Step>

            <Step n={4} id="sev-step-conditions" title={t('dim.conditions')} description={t('steps.conditions.lead')} actions={<DimScore score={result.dimensions.conditions.score} />}>
              <ConditionsInputs input={input} result={result} issues={issues} issueText={issueText} setLevel={setLevel} />
            </Step>

            <Step n={5} id="sev-step-complexity" title={t('dim.complexity')} description={t('steps.complexity.lead')} actions={<DimScore score={result.dimensions.complexity.score} />}>
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
            className="scroll-mt-24 [scrollbar-width:thin] lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:rounded-lg lg:border lg:border-border lg:bg-card"
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
              moreBelow={moreBelow}
            />
          </aside>
        </div>
      </PageContainer>

      <PageContainer>
        <section className={lowerSection} aria-labelledby="sev-table-heading">
          <SectionHeading eyebrow={t('table.eyebrow')} title={<span id="sev-table-heading">{t('table.title')}</span>} description={t('table.lead')} />
          {lowerReady ? <IndicatorTable result={lowPriorityResult} /> : <div className="min-h-[40rem]" data-deferred="pending" />}
        </section>

        <section id="sev-method" className={lowerSection} aria-labelledby="sev-method-heading">
          <SectionHeading eyebrow={t('method.eyebrow')} title={<span id="sev-method-heading">{t('method.title')}</span>} description={t('method.lead')} />
          {lowerReady ? <Methodology result={lowPriorityResult} /> : <div className="min-h-[60rem]" data-deferred="pending" />}
        </section>
      </PageContainer>

      {/* Mobile: a compact live score that jumps to the full result (removed from the a11y tree while the result is in view) */}
      <div
        className={cn(
          'fixed inset-x-3 bottom-3 z-[1050] transition-[opacity,transform] duration-150 lg:hidden',
          resultsInView ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100',
        )}
        aria-hidden={resultsInView || undefined}
        inert={resultsInView || undefined}
      >
        <a href="#sev-results" className="flex items-center gap-3 rounded-lg border border-border bg-elevated px-4 py-2.5 shadow-[var(--shadow-lift)]" tabIndex={resultsInView ? -1 : 0}>
          <span className="text-sm text-muted-foreground">{t('scenario.severity')}</span>
          <span className="num text-2xl leading-none font-semibold">{result.complete ? formatScore(result.severity) : '—'}</span>
          <span className="text-xs text-muted-foreground">/ 5</span>
          <SeverityChip score={result.complete ? result.severity : null} size="sm" />
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
            {t('results.mobileCta')} <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </a>
      </div>
    </div>
  );
}
