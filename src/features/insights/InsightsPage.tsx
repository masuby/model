/**
 * National Insights - a story-driven analytics page for Tanzania's INFORM Risk. Every figure is
 * computed live from `useModel()` (approved edits included); see `analytics.ts` for the maths.
 *
 * Two views (UX-05): the decision charts (regions, the priority corner, hazard hot-spots, data
 * coverage) for the national committee and PMO-DMD, and the analyst charts (class distribution,
 * drivers, correlation) behind `?view=analyst`. A link into an analyst chart opens that view.
 *
 * Speed: the header, key figures and key findings need no chart library and render with the first
 * paint. Each chart section is its own lazily loaded chunk, mounted when it nears the viewport or  -
 * one section at a time, in reading order - whenever the browser is idle, so the page is complete by
 * the time anyone scrolls or prints, without one long task up front.
 */
import { ArrowRight, MapPinned, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { useModel } from '@/data-layer/DataProvider';
import { classRanges } from '@/engine/risk/classes';
import type { RiskModel } from '@/engine/risk/types';
import { cn } from '@/lib/utils';
import { headline } from './analytics';
import { HeadlineFigures, KeyFindings } from './sections/Headlines';
import { sectionClass, useMediaQuery } from './ui';

type SectionComponent = React.ComponentType<{ model: RiskModel }>;
type View = 'main' | 'analyst';

/** Height (px) a section reserves until it renders, at ≥ xl, ≥ lg and phone widths. */
type Estimate = readonly [xl: number, lg: number, narrow: number];

/**
 * A chart section: its code-split loader, and the height it reserves until it renders - measured
 * content heights (1440, 1024 and 390 px viewports), so the page barely shifts as sections arrive.
 */
function chartSection(id: string, view: View, load: () => Promise<SectionComponent>, estimate: Estimate) {
  return { id, view, load, estimate, Component: React.lazy(() => load().then((C) => ({ default: C }))) };
}

const CHART_SECTIONS = [
  chartSection('regions', 'main', () => import('./sections/RegionalRanking').then((m) => m.RegionalRanking), [1090, 1090, 1815]),
  chartSection('dimensions', 'main', () => import('./sections/DimensionScatter').then((m) => m.DimensionScatter), [850, 1430, 1700]),
  chartSection('hazards', 'main', () => import('./sections/HazardMatrix').then((m) => m.HazardMatrix), [1380, 1380, 1560]),
  chartSection('coverage', 'main', () => import('./sections/DataCoverage').then((m) => m.DataCoverage), [1140, 1300, 2170]),
  chartSection('classes', 'analyst', () => import('./sections/ClassDistribution').then((m) => m.ClassDistribution), [1110, 1110, 1720]),
  chartSection('drivers', 'analyst', () => import('./sections/RiskDrivers').then((m) => m.RiskDrivers), [1180, 1870, 2730]),
  chartSection('correlation', 'analyst', () => import('./sections/CorrelationView').then((m) => m.CorrelationView), [740, 780, 1450]),
];
const ANALYST_IDS: ReadonlySet<string> = new Set(CHART_SECTIONS.filter((s) => s.view === 'analyst').map((s) => s.id));
const ALL_IDS: readonly string[] = ['kpis', ...CHART_SECTIONS.map((s) => s.id)];

/** "2026-06" → "June 2026" / "Juni 2026" in the reader's language; anything else is shown as given. */
function formatAsOf(asOf: string, lang: string): string {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(asOf);
  if (!m) return asOf;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, m[3] ? Number(m[3]) : 1));
  try {
    return new Intl.DateTimeFormat(lang, { ...(m[3] ? { day: 'numeric' } : {}), month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  } catch {
    return asOf;
  }
}

/** Run `cb` when the main thread is idle (or soon, where idle callbacks are unsupported). Returns a cancel function. */
function whenIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(cb, { timeout: 1500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(cb, 50);
  return () => window.clearTimeout(handle);
}

/** Calls `onMount` once its children have committed (i.e. once a lazy section has actually rendered). */
function OnMount({ onMount, children }: { onMount: () => void | (() => void); children: React.ReactNode }) {
  React.useEffect(() => onMount(), [onMount]);
  return <>{children}</>;
}

/**
 * The `<section>` shell of a chart section. Its anchor exists from the first paint; the content mounts
 * when the section comes within ~a screen of the viewport, or when the page's idle queue reaches it.
 */
function DeferredSection({ id, show, estimate, onReady, children }: { id: string; show: boolean; estimate: Estimate; onReady: () => void | (() => void); children: React.ReactNode }) {
  const ref = React.useRef<HTMLElement>(null);
  const xl = useMediaQuery('(min-width: 1280px)');
  const lg = useMediaQuery('(min-width: 1024px)');
  const [near, setNear] = React.useState(() => typeof IntersectionObserver === 'undefined');

  React.useEffect(() => {
    const el = ref.current;
    if (show || near || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, near]);

  const placeholder = <div aria-hidden style={{ minHeight: estimate[xl ? 0 : lg ? 1 : 2] }} />;
  return (
    <section ref={ref} id={id} aria-labelledby={`${id}-title`} className={sectionClass()}>
      {show || near ? (
        <React.Suspense fallback={placeholder}>
          <OnMount onMount={onReady}>{children}</OnMount>
        </React.Suspense>
      ) : (
        placeholder
      )}
    </section>
  );
}

/** Sticky in-page navigation: plain text links with an underline on the section in view. */
function SectionNav({ sections }: { sections: readonly string[] }) {
  const { t } = useTranslation('insights');
  const [active, setActive] = React.useState<string>(sections[0]);
  const listRef = React.useRef<HTMLOListElement>(null);

  // Scroll-spy: the current section is the last one whose top has passed the reading line (30% down
  // the viewport); at the very bottom of the page it is the last section. Re-evaluated on every scroll
  // and resize (throttled to one check per frame), so jumps - Home/End, scrollbar drags, in-page links  -
  // can never leave it stale.
  React.useEffect(() => {
    let frame = 0;
    const evaluate = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = sections[0];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(evaluate);
    };
    evaluate();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sections]);

  // Keep the active link in view on narrow screens (horizontal scroll only).
  React.useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (list && el && list.scrollWidth > list.clientWidth) list.scrollTo({ left: Math.max(0, el.offsetLeft - 16), behavior: 'smooth' });
  }, [active]);

  return (
    <nav aria-label={t('nav.label')} className="no-print sticky top-[var(--header-h)] z-30 border-b border-border bg-background">
      <PageContainer>
        <ol ref={listRef} className="flex gap-6 overflow-x-auto [scrollbar-width:none] sm:gap-7 [&::-webkit-scrollbar]:hidden">
          {sections.map((id) => (
            <li key={id} data-id={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={active === id ? 'location' : undefined}
                className={cn(
                  '-mb-px inline-block border-b-2 pt-3 pb-2.5 text-sm whitespace-nowrap transition-colors duration-150',
                  active === id ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`nav.${id}`)}
              </a>
            </li>
          ))}
        </ol>
      </PageContainer>
    </nav>
  );
}

export default function InsightsPage() {
  const { t, i18n } = useTranslation(['insights', 'common']);
  const model = useModel();
  const ranges = classRanges('risk');
  const h = React.useMemo(() => headline(model), [model]);

  // The view lives in the query string so a link can carry it; a hash into an analyst chart opens that view.
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const view: View = params.get('view') === 'analyst' ? 'analyst' : 'main';
  const setView = React.useCallback(
    (v: View) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v === 'analyst') next.set('view', 'analyst');
          else next.delete('view');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  React.useEffect(() => {
    if (ANALYST_IDS.has(hash.slice(1)) && view !== 'analyst') setView('analyst');
  }, [hash, view, setView]);
  const chartSections = React.useMemo(() => CHART_SECTIONS.filter((s) => s.view === view), [view]);
  const sectionIds = React.useMemo(() => ['kpis', ...chartSections.map((s) => s.id)], [chartSections]);

  // Background queue: how many chart sections (in reading order) have been released. Each release
  // waits for an idle moment after the previous section has rendered. The queue restarts with the view.
  const [released, setReleased] = React.useState(0);
  const releasedRef = React.useRef(0);
  const totalRef = React.useRef(chartSections.length);
  totalRef.current = chartSections.length;
  const releaseNext = React.useCallback(() => {
    if (releasedRef.current >= totalRef.current) return;
    releasedRef.current += 1;
    setReleased(releasedRef.current);
  }, []);
  const onSectionReady = React.useCallback(() => whenIdle(releaseNext), [releaseNext]);

  React.useEffect(() => {
    releasedRef.current = 0;
    setReleased(0);
    return whenIdle(() => {
      // Warm every section chunk in the background, then start the queue.
      for (const s of CHART_SECTIONS) void s.load().catch(() => undefined);
      releaseNext();
    });
  }, [releaseNext, view]);

  // A deep link (/insights#coverage): the section shell exists from the first paint, so jump to it; the
  // section then mounts because it is in view. Sections above it keep arriving and can differ a little
  // from their reserved height, and the browser's scroll anchoring loses its anchor when a placeholder
  // is swapped for content, so keep the target pinned (before paint, via ResizeObserver) until the
  // reader scrolls, taps or types - or for at most 10 s.
  const storyRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const id = window.location.hash.slice(1);
    const target = ALL_IDS.includes(id) ? document.getElementById(id) : null;
    if (!target) return;
    target.scrollIntoView();
    const story = storyRef.current;
    if (!story || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => target.scrollIntoView());
    const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const stop = () => {
      ro.disconnect();
      window.clearTimeout(timer);
      for (const e of inputs) window.removeEventListener(e, stop);
    };
    const timer = window.setTimeout(stop, 10_000);
    for (const e of inputs) window.addEventListener(e, stop, { passive: true });
    ro.observe(story);
    ro.observe(document.body);
    return stop;
  }, [view]);

  // Printing shows the whole view, including sections nobody has scrolled to.
  React.useEffect(() => {
    const all = () => {
      releasedRef.current = CHART_SECTIONS.length;
      setReleased(CHART_SECTIONS.length);
    };
    window.addEventListener('beforeprint', all);
    return () => window.removeEventListener('beforeprint', all);
  }, []);

  const meta = [
    model.asOf ? t('common:labels.asOf', { date: formatAsOf(model.asOf, i18n.language) }) : null,
    t('scope', { councils: model.councils.length, regions: model.regions.length }),
    model.editCount > 0 ? t('edits', { count: model.editCount }) : null,
  ].filter(Boolean);

  return (
    <div>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={
          <>
            {t('lead')}
            <span className="mt-3 block text-sm">{meta.join(' · ')}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/explore">
                <MapPinned /> {t('openMap')}
              </Link>
            </Button>
            <Button variant="ghost" className="no-print" onClick={() => window.print()}>
              <Printer /> {t('common:actions.printPdf')}
            </Button>
          </>
        }
      >
        <HeadlineFigures h={h} className="mt-10 border-t border-border pt-8" />
      </PageHeader>

      <PageContainer className="no-print">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
          <span className="text-sm font-medium text-muted-foreground">{t('views.label')}</span>
          <Segmented
            value={view}
            onValueChange={(v) => setView(v as View)}
            options={[
              { value: 'main', label: t('views.main') },
              { value: 'analyst', label: t('views.analyst') },
            ]}
            aria-label={t('views.label')}
          />
          <p className="basis-full text-sm text-muted-foreground sm:basis-auto">{t(view === 'main' ? 'views.mainLead' : 'views.analystLead')}</p>
        </div>
      </PageContainer>

      <SectionNav key={view} sections={sectionIds} />

      <PageContainer>
        <div ref={storyRef} key={view}>
          <section id="kpis" aria-labelledby="kpis-title" className={sectionClass(false)}>
            <KeyFindings model={model} h={h} />
          </section>

          {chartSections.map(({ id, Component, estimate }, i) => (
            <DeferredSection key={id} id={id} show={i < released} estimate={estimate} onReady={onSectionReady}>
              <Component model={model} />
            </DeferredSection>
          ))}
        </div>

        <section aria-labelledby="notes-title" className={cn(sectionClass(), 'pb-4 sm:pb-4')}>
          <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-12">
            <div>
              <h2 id="notes-title" className="text-[1.6rem] leading-tight">
                {t('notes.title')}
              </h2>
              <Link to="/methodology" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                {t('notes.more')} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="border-t border-border text-sm leading-relaxed text-muted-foreground">
              {[t('notes.national'), t('notes.regions'), t('notes.thresholds', { ranges: ranges.join(' · ') }), t('notes.councils')].map((note, i) => (
                <li key={i} className="border-b border-border py-3.5 text-pretty">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
