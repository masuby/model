/**
 * Area Profile — /area/:id for any unit (council C001…, region R-<key>, INFORM source unit TZ0101…,
 * national TZ). A report-like page meant to be printed, saved as PDF or screen-shared:
 * hero with score and rank → locator + key findings → dimensions → charts → drivers → full indicator
 * table with provenance → ranked places → facilities & DRR → methodology.
 */
import './area-print.css';
import { Compass, Flag, MapPinOff } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { formatDate } from '@/lib/utils';
import { AreaHero } from './components/AreaHero';
import { AreaSection } from './components/bits';
import { CategoryChart, DistributionChart, IndicatorChart } from './components/Charts';
import { Dimensions } from './components/Dimensions';
import { Drivers } from './components/Drivers';
import { IndicatorTable } from './components/IndicatorTable';
import { Methodology } from './components/Methodology';
import { Overview } from './components/Overview';
import { Places } from './components/Places';
import { SectionNav } from './components/SectionNav';
import { Services } from './components/Services';
import { buildAreaView, placeListsFor, resolveUnit, type AreaView } from './lib';

function AreaNotFound({ id }: { id?: string }) {
  const { t } = useTranslation(['area', 'common']);
  return (
    <PageContainer className="relative flex flex-col items-center py-24 text-center sm:py-32">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_65%)]" />
      <span className="relative inline-flex size-20 items-center justify-center rounded-3xl border border-border bg-card text-muted-foreground shadow-[var(--shadow-soft)]">
        <MapPinOff className="size-9" />
      </span>
      <h1 className="relative mt-6 text-3xl font-extrabold text-balance sm:text-4xl">{t('notFound.title')}</h1>
      <p className="relative mt-3 max-w-md leading-relaxed text-muted-foreground">{t('notFound.body', { id: id ?? '' })}</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" asChild>
          <Link to="/explore">
            <Compass /> {t('notFound.explore')}
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/area/TZ">
            <Flag /> {t('notFound.national')}
          </Link>
        </Button>
      </div>
      <p className="relative mt-8 max-w-md text-xs leading-relaxed text-muted-foreground">{t('notFound.hint')}</p>
    </PageContainer>
  );
}

/** Title block that only appears on paper. */
function PrintHeader({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/area/${view.unit.id}` : '';
  return (
    <div className="hidden print:block">
      <div className="flag-rule h-1 w-full rounded-full" />
      <div className="mt-2 flex items-baseline justify-between gap-4 text-[10pt]">
        <span className="font-display font-bold">
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

function AreaReport({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common']);
  const { unit } = view;
  const hasPlaces = placeListsFor(view.model, unit).some((l) => l.units.length > 0);

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

  return (
    <div className="area-report">
      <PrintHeader view={view} />
      <AreaHero view={view} />
      <SectionNav sections={sections} unit={unit} />

      <PageContainer>
        <AreaSection id="overview" eyebrow={t('sections.overview.eyebrow')} title={t('sections.overview.title', { name: unit.name })}>
          <Overview view={view} />
        </AreaSection>

        <AreaSection id="dimensions" eyebrow={t('sections.dimensions.eyebrow')} title={t('sections.dimensions.title')} description={t('sections.dimensions.lead')}>
          <Dimensions view={view} />
        </AreaSection>

        <AreaSection id="charts" eyebrow={t('sections.charts.eyebrow')} title={t('sections.charts.title')} description={t('sections.charts.lead')} className="print:break-before-page">
          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
            <CategoryChart view={view} />
            <DistributionChart view={view} />
          </div>
          <div className="mt-6">
            <IndicatorChart view={view} />
          </div>
        </AreaSection>

        <AreaSection id="drivers" eyebrow={t('sections.drivers.eyebrow')} title={t('sections.drivers.title')} description={t('sections.drivers.lead')}>
          <Drivers view={view} />
        </AreaSection>

        <AreaSection id="indicators" eyebrow={t('sections.indicators.eyebrow')} title={t('sections.indicators.title')} description={t('sections.indicators.lead', { count: view.rows.length })} className="print:break-before-page">
          <IndicatorTable view={view} />
        </AreaSection>

        {hasPlaces && (
          <AreaSection id="places" eyebrow={t('sections.places.eyebrow')} title={t(`sections.places.title.${unit.level}`, { region: unit.region })} description={t('sections.places.lead')}>
            <Places view={view} />
          </AreaSection>
        )}

        <AreaSection id="services" eyebrow={t('sections.services.eyebrow')} title={t('sections.services.title')} description={t('sections.services.lead')}>
          <Services view={view} />
        </AreaSection>

        <AreaSection id="method" eyebrow={t('sections.method.eyebrow')} title={t('sections.method.title')} className="pb-20">
          <Methodology view={view} />
        </AreaSection>
      </PageContainer>
    </div>
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
  // Keyed by unit so moving between profiles resets section state and entry motion.
  return <AreaReport key={view.unit.id} view={view} />;
}
