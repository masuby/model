/**
 * Area Profile - /area/:id for any unit (council C001…, region R-<key>, INFORM source unit TZ0101…,
 * national TZ). A report-like page meant to be read, printed, saved as PDF or screen-shared:
 * title block with score and key figures → locator + key findings → dimensions → charts → drivers →
 * full indicator table with provenance → ranked places → facilities & DRR → methodology.
 *
 * Built to the editorial design language (docs/DESIGN_LANGUAGE.md): numbered sections separated by
 * hairline rules, no card grids, colour only on data. Heavy below-the-fold sections mount as they
 * approach the viewport (and all at once before printing) - see components/Deferred.
 */
import './area-print.css';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Kicker, PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { formatDate } from '@/lib/utils';
import { Advancement } from './components/Advancement';
import { AreaHero } from './components/AreaHero';
import { AreaSection, useMediaQuery } from './components/bits';
import { ChartSlot, loadCharts, usePrefetchCharts } from './components/ChartSlot';
import { Deferred, DeferredProvider } from './components/Deferred';
import { Dimensions } from './components/Dimensions';
import { Drivers } from './components/Drivers';
import { IndicatorTable } from './components/IndicatorTable';
import { KeyFindings } from './components/Overview';
import { SectionNav } from './components/SectionNav';
import { Services } from './components/Services';
import { WhatToDo } from './components/WhatToDo';
import { buildAreaView, explorerHref, resolveUnit, servicesFor, type AreaView } from './lib';

function AreaNotFound({ id }: { id?: string }) {
  const { t } = useTranslation(['area', 'common']);
  return (
    <PageContainer className="py-20 sm:py-28">
      <div className="max-w-2xl">
        <Kicker>{t('eyebrow')}</Kicker>
        <h1 className="mt-3 text-[2.2rem] leading-[1.1] text-balance sm:text-[2.8rem]">{t('notFound.title')}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t('notFound.body', { id: id ?? '' })}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/explore">
              {t('notFound.explore')} <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/area/TZ">{t('notFound.national')}</Link>
          </Button>
        </div>
        <p className="mt-12 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">{t('notFound.hint')}</p>
      </div>
    </PageContainer>
  );
}

/** Title line that only appears on paper. */
function PrintHeader({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/area/${view.unit.id}` : '';
  return (
    <div className="hidden border-b border-foreground pb-2 print:block">
      <div className="flex items-baseline justify-between gap-4 text-[10pt]">
        <span className="font-display font-semibold">
          {t('common:appName')} · {t('print.title')}
        </span>
        <span className="text-muted-foreground">
          {t('print.printed', { date: formatDate(new Date(), i18n.language) })} · {t('common:labels.asOf', { date: view.model.asOf })}
        </span>
      </div>
      <div className="mt-0.5 text-[9pt] text-muted-foreground">{url}</div>
    </div>
  );
}

type Layout = 'phone' | 'tablet' | 'desktop' | 'wide';

/**
 * Rendered heights of the deferred sections, measured at 390, 820 and 1440 px (C041, R-kigoma, TZ), so
 * the placeholders keep the page length - and the scrollbar and scroll position - stable while sections
 * mount. Layouts change at 640 px (the indicator table folds, chart controls wrap), 1024 px (charts,
 * drivers and place lists go side by side) and 1280 px (long place lists split into two columns).
 */
function placeholderHeights(view: AreaView, places: number, lists: number, drrRecorded: boolean, layout: Layout) {
  const hazardRows = view.rows.filter((r) => r.dim === 'hazard').length;
  const rows = view.rows.length;
  // The national profile has no "compared with the national picture" column in Drivers.
  const national = view.unit.level === 'national';
  if (layout === 'phone')
    return {
      chartsTop: 1150,
      chartsBottom: hazardRows * 30 + 360,
      drivers: national ? 1490 : 2140,
      table: 640, // each dimension starts folded on phones
      advancement: 1500,
      places: places * 44 + 420,
      services: drrRecorded ? 1200 : 940,
    };
  if (layout === 'tablet')
    return {
      chartsTop: 1020,
      chartsBottom: hazardRows * 30 + 260,
      drivers: national ? 1190 : 1800,
      table: rows * 82 + 700, // sources sit under each indicator name below 1024 px
      advancement: 1250,
      places: places * 44 + 420,
      services: 660,
    };
  return {
    chartsTop: 540,
    chartsBottom: hazardRows * 30 + 260,
    drivers: national ? 920 : 1060,
    table: rows * 58 + 700,
    advancement: 980,
    // One list sits beside its summary; several lists each stack their summary above the list.
    places: lists > 1 ? places * 44 + 420 : Math.ceil(places / (layout === 'wide' && places > 12 ? 2 : 1)) * 46 + 70,
    services: 640,
  };
}

type ViewMode = 'risk' | 'analysis';
const ANALYSIS_IDS: ReadonlySet<string> = new Set(['why', 'charts', 'indicators', 'advancement', 'services', 'dimensions', 'drivers']);

/** Where the rest of the profile is: the other view, the explorer (neighbours, regions) and the Methodology page. */
function ViewLinks({ mode, unit, onSwitch }: { mode: ViewMode; unit: AreaView['unit']; onSwitch: (m: ViewMode) => void }) {
  const { t } = useTranslation('area');
  return (
    <nav aria-label={t('views.label')} className="no-print border-t border-border py-8 pb-16 sm:pb-20">
      <ul className="grid gap-3 text-sm">
        <li>
          <button type="button" onClick={() => onSwitch(mode === 'risk' ? 'analysis' : 'risk')} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
            {t(mode === 'risk' ? 'links.analysis' : 'links.risk')} <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </li>
        {unit.level !== 'national' && (
          <li>
            <Link to={explorerHref(unit)} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
              {t('links.places')} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </li>
        )}
        <li>
          <Link to="/methodology" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
            {t('links.method')} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function AreaReport({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  usePrefetchCharts();
  const { unit, model } = view;
  const phone = useMediaQuery('(max-width: 639px)');
  const desktop = useMediaQuery('(min-width: 1024px)');
  const wide = useMediaQuery('(min-width: 1280px)');
  const layout: Layout = phone ? 'phone' : wide ? 'wide' : desktop ? 'desktop' : 'tablet';
  const h = React.useMemo(
    () =>
      placeholderHeights(view, 0, 0, servicesFor(model, unit).drr.recorded > 0, layout),
    [view, model, unit, layout],
  );

  // Two views (UX-01): 'Risk and what to do' for people and committees (the default), 'Analysis' for
  // coordinators and analysts. A link into an analysis section (#indicators, #advancement) opens that view.
  const [params, setParams] = useSearchParams();
  const mode: ViewMode = params.get('view') === 'analysis' ? 'analysis' : 'risk';
  const setMode = React.useCallback(
    (m: ViewMode) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (m === 'analysis') next.set('view', 'analysis');
          else next.delete('view');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const sections = React.useMemo(
    () =>
      (mode === 'risk'
        ? [
            { id: 'actions', label: t('nav.actions') },
          ]
        : [
            { id: 'why', label: t('nav.why') },
            { id: 'charts', label: t('nav.charts') },
            { id: 'indicators', label: t('nav.indicators') },
            { id: 'advancement', label: t('nav.advancement') },
            { id: 'services', label: t('nav.services') },
          ]) as Array<{ id: string; label: string }>,
    [t, mode],
  );

  // Arriving on a section link (the explorer's "What to do" opens /area/<id>#actions): scroll to it, and
  // keep it in place while the map and charts above it load, until the reader scrolls themselves.
  const { hash } = useLocation();
  React.useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (ANALYSIS_IDS.has(id) && mode !== 'analysis') setMode('analysis');
  }, [hash, mode, setMode]);
  React.useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    let reading = false;
    const stop = () => {
      reading = true;
    };
    const go = () => {
      if (!reading) document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    };
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    for (const e of events) window.addEventListener(e, stop, { passive: true });
    const frame = requestAnimationFrame(go);
    const timers = [300, 900, 1800].map((ms) => window.setTimeout(go, ms));
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((tm) => window.clearTimeout(tm));
      for (const e of events) window.removeEventListener(e, stop);
    };
  }, [hash, unit.id]);

  return (
    <DeferredProvider prepare={loadCharts}>
      <div className="area-report">
        <PageContainer>
          <PrintHeader view={view} />
        </PageContainer>
        <AreaHero view={view} />
        <PageContainer className="no-print">
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <span className="text-sm font-medium text-muted-foreground">{t('views.label')}</span>
            <Segmented
              value={mode}
              onValueChange={(v) => setMode(v as ViewMode)}
              options={[
                { value: 'risk', label: t('views.risk') },
                { value: 'analysis', label: t('views.analysis') },
              ]}
              aria-label={t('views.label')}
            />
          </div>
        </PageContainer>
        <SectionNav key={mode} sections={sections} unit={unit} />

        <PageContainer>
          {mode === 'risk' ? (
            <>
              <AreaSection id="actions" index={1} eyebrow={t('sections.actions.eyebrow')} title={t('sections.actions.title', { name: unit.name })} description={t('sections.actions.lead')} className="border-t-0">
                <WhatToDo key={unit.id} view={view} />
              </AreaSection>
              <ViewLinks mode={mode} unit={unit} onSwitch={setMode} />
            </>
          ) : (
            <>
              <AreaSection id="why" index={1} eyebrow={t('sections.why.eyebrow')} title={t('sections.why.title')} description={t('sections.why.lead')} className="border-t-0">
                <div className="mb-14">
                  <KeyFindings view={view} />
                </div>
                <Dimensions view={view} />
                <div className="mt-14">
                  <Deferred minHeight={h.drivers}>
                    <Drivers view={view} />
                  </Deferred>
                </div>
              </AreaSection>

              <AreaSection id="charts" index={2} eyebrow={t('sections.charts.eyebrow')} title={t(`sections.charts.title.${unit.level}`)} description={t(`sections.charts.lead.${unit.level}`)} className="print:break-before-page">
                <Deferred minHeight={h.chartsTop}>
                  <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2 print:grid-cols-1">
                    <ChartSlot name="CategoryChart" view={view} />
                    <ChartSlot name="DistributionChart" view={view} />
                  </div>
                </Deferred>
                <div className="mt-14">
                  <Deferred minHeight={h.chartsBottom}>
                    <ChartSlot name="IndicatorChart" view={view} minHeight={h.chartsBottom} />
                  </Deferred>
                </div>
              </AreaSection>

              <AreaSection
                id="indicators"
                index={3}
                eyebrow={t('sections.indicators.eyebrow')}
                title={t('sections.indicators.title')}
                description={t('sections.indicators.lead', { count: view.rows.length })}
                className="print:break-before-page"
              >
                <Deferred minHeight={h.table}>
                  <IndicatorTable view={view} />
                </Deferred>
              </AreaSection>

              <AreaSection id="advancement" index={4} eyebrow={t('sections.advancement.eyebrow')} title={t('sections.advancement.title')} description={t('sections.advancement.lead')}>
                <Deferred minHeight={h.advancement}>
                  <Advancement view={view} />
                </Deferred>
              </AreaSection>

              <AreaSection id="services" index={5} eyebrow={t('sections.services.eyebrow')} title={t('sections.services.title')} description={t('sections.services.lead')}>
                <Deferred minHeight={h.services}>
                  <Services view={view} />
                </Deferred>
              </AreaSection>
              <ViewLinks mode={mode} unit={unit} onSwitch={setMode} />
            </>
          )}
        </PageContainer>
      </div>
    </DeferredProvider>
  );
}

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const model = useModel();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('area');
  const unit = React.useMemo(() => resolveUnit(model, id), [model, id]);
  const view = React.useMemo(() => (unit ? buildAreaView(model, unit) : null), [model, unit]);

  // Canonicalise hand-typed ids (/area/c001 → /area/C001) so shared links are stable.
  React.useEffect(() => {
    if (unit && id !== unit.id) navigate({ pathname: `/area/${unit.id}`, search: location.search, hash: location.hash }, { replace: true });
  }, [unit, id, navigate, location.search, location.hash]);

  // The document title doubles as the default PDF file name when saving.
  React.useEffect(() => {
    const previous = document.title;
    document.title = unit ? t('meta.title', { name: unit.name }) : t('notFound.title');
    return () => {
      document.title = previous;
    };
  }, [unit, t]);

  if (!view) return <AreaNotFound id={id} />;
  // Keyed by unit so moving between profiles resets section state and deferred sections.
  return <AreaReport key={view.unit.id} view={view} />;
}
