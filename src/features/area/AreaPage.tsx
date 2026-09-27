/**
 * Area Profile — /area/:id for any unit (council C001…, region R-<key>, INFORM source unit TZ0101…,
 * national TZ). A report-like page meant to be read, printed, saved as PDF or screen-shared:
 * title block with score and key figures → locator + key findings → dimensions → charts → drivers →
 * full indicator table with provenance → ranked places → facilities & DRR → methodology.
 *
 * Built to the editorial design language (docs/DESIGN_LANGUAGE.md): numbered sections separated by
 * hairline rules, no card grids, colour only on data. Heavy below-the-fold sections mount as they
 * approach the viewport (and all at once before printing) — see components/Deferred.
 */
import './area-print.css';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Kicker, PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { formatDate } from '@/lib/utils';
import { AreaHero } from './components/AreaHero';
import { AreaSection, useMediaQuery } from './components/bits';
import { ChartSlot, loadCharts, usePrefetchCharts } from './components/ChartSlot';
import { Deferred, DeferredProvider } from './components/Deferred';
import { Dimensions } from './components/Dimensions';
import { Drivers } from './components/Drivers';
import { IndicatorTable } from './components/IndicatorTable';
import { Methodology } from './components/Methodology';
import { Overview } from './components/Overview';
import { Places } from './components/Places';
import { SectionNav } from './components/SectionNav';
import { Services } from './components/Services';
import { buildAreaView, placeListsFor, resolveUnit, servicesFor, type AreaView } from './lib';

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
 * the placeholders keep the page length — and the scrollbar and scroll position — stable while sections
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
      places: places * 44 + 420,
      services: drrRecorded ? 1200 : 940,
    };
  if (layout === 'tablet')
    return {
      chartsTop: 1020,
      chartsBottom: hazardRows * 30 + 260,
      drivers: national ? 1190 : 1800,
      table: rows * 82 + 700, // sources sit under each indicator name below 1024 px
      places: places * 44 + 420,
      services: 660,
    };
  return {
    chartsTop: 540,
    chartsBottom: hazardRows * 30 + 260,
    drivers: national ? 920 : 1060,
    table: rows * 58 + 700,
    // One list sits beside its summary; several lists each stack their summary above the list.
    places: lists > 1 ? places * 44 + 420 : Math.ceil(places / (layout === 'wide' && places > 12 ? 2 : 1)) * 46 + 70,
    services: 640,
  };
}

function AreaReport({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  usePrefetchCharts();
  const { unit, model } = view;
  const placeLists = React.useMemo(() => placeListsFor(model, unit).filter((l) => l.units.length > 0), [model, unit]);
  const hasPlaces = placeLists.length > 0;
  const phone = useMediaQuery('(max-width: 639px)');
  const desktop = useMediaQuery('(min-width: 1024px)');
  const wide = useMediaQuery('(min-width: 1280px)');
  const layout: Layout = phone ? 'phone' : wide ? 'wide' : desktop ? 'desktop' : 'tablet';
  const h = React.useMemo(
    () =>
      placeholderHeights(
        view,
        placeLists.reduce((n, l) => Math.max(n, l.units.length), 0),
        placeLists.length,
        servicesFor(model, unit).drr.recorded > 0,
        layout,
      ),
    [view, placeLists, model, unit, layout],
  );

  const sections = React.useMemo(
    () =>
      [
        { id: 'overview', label: t('nav.overview') },
        { id: 'dimensions', label: t('nav.dimensions') },
        { id: 'charts', label: t('nav.charts') },
        { id: 'drivers', label: t('nav.drivers') },
        { id: 'indicators', label: t('nav.indicators') },
        ...(hasPlaces ? [{ id: 'places', label: t('nav.places') }] : []),
        { id: 'services', label: t('nav.services') },
        { id: 'method', label: t('nav.method') },
      ] as Array<{ id: string; label: string }>,
    [t, hasPlaces],
  );
  const n = (id: string) => sections.findIndex((s) => s.id === id) + 1;

  return (
    <DeferredProvider prepare={loadCharts}>
      <div className="area-report">
        <PageContainer>
          <PrintHeader view={view} />
        </PageContainer>
        <AreaHero view={view} />
        <SectionNav sections={sections} unit={unit} />

        <PageContainer>
          <AreaSection id="overview" index={n('overview')} eyebrow={t('sections.overview.eyebrow')} title={t('sections.overview.title', { name: unit.name })} className="border-t-0">
            <Overview view={view} />
          </AreaSection>

          <AreaSection id="dimensions" index={n('dimensions')} eyebrow={t('sections.dimensions.eyebrow')} title={t('sections.dimensions.title')} description={t('sections.dimensions.lead')}>
            <Dimensions view={view} />
          </AreaSection>

          <AreaSection id="charts" index={n('charts')} eyebrow={t('sections.charts.eyebrow')} title={t(`sections.charts.title.${unit.level}`)} description={t(`sections.charts.lead.${unit.level}`)} className="print:break-before-page">
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

          <AreaSection id="drivers" index={n('drivers')} eyebrow={t('sections.drivers.eyebrow')} title={t('sections.drivers.title')} description={t('sections.drivers.lead')}>
            <Deferred minHeight={h.drivers}>
              <Drivers view={view} />
            </Deferred>
          </AreaSection>

          <AreaSection
            id="indicators"
            index={n('indicators')}
            eyebrow={t('sections.indicators.eyebrow')}
            title={t('sections.indicators.title')}
            description={t('sections.indicators.lead', { count: view.rows.length })}
            className="print:break-before-page"
          >
            <Deferred minHeight={h.table}>
              <IndicatorTable view={view} />
            </Deferred>
          </AreaSection>

          {hasPlaces && (
            <AreaSection id="places" index={n('places')} eyebrow={t('sections.places.eyebrow')} title={t(`sections.places.title.${unit.level}`, { region: unit.region })} description={t('sections.places.lead')}>
              <Deferred minHeight={h.places}>
                <Places view={view} lists={placeLists} />
              </Deferred>
            </AreaSection>
          )}

          <AreaSection id="services" index={n('services')} eyebrow={t('sections.services.eyebrow')} title={t('sections.services.title')} description={t('sections.services.lead')}>
            <Deferred minHeight={h.services}>
              <Services view={view} />
            </Deferred>
          </AreaSection>

          <AreaSection id="method" index={n('method')} eyebrow={t('sections.method.eyebrow')} title={t('sections.method.title')} className="pb-16 sm:pb-20">
            <Methodology view={view} />
          </AreaSection>
        </PageContainer>
      </div>
    </DeferredProvider>
  );
}

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const model = useModel();
  const navigate = useNavigate();
  const { t } = useTranslation('area');
  const unit = React.useMemo(() => resolveUnit(model, id), [model, id]);
  const view = React.useMemo(() => (unit ? buildAreaView(model, unit) : null), [model, unit]);

  // Canonicalise hand-typed ids (/area/c001 → /area/C001) so shared links are stable.
  React.useEffect(() => {
    if (unit && id !== unit.id) navigate(`/area/${unit.id}`, { replace: true });
  }, [unit, id, navigate]);

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
