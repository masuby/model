/**
 * National Insights — a story-driven analytics page for Tanzania's INFORM Risk. Every figure is
 * computed live from `useModel()` (approved edits included); see `analytics.ts` for the maths.
 */
import { BookOpen, CalendarDays, MapPinned, Printer } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useModel } from '@/data-layer/DataProvider';
import { classRanges } from '@/engine/risk/classes';
import { cn } from '@/lib/utils';
import { ClassDistribution } from './sections/ClassDistribution';
import { CorrelationView } from './sections/CorrelationView';
import { DataCoverage } from './sections/DataCoverage';
import { DimensionScatter } from './sections/DimensionScatter';
import { HazardMatrix } from './sections/HazardMatrix';
import { Headlines } from './sections/Headlines';
import { RegionalRanking } from './sections/RegionalRanking';
import { RiskDrivers } from './sections/RiskDrivers';

const SECTIONS = ['kpis', 'regions', 'dimensions', 'hazards', 'classes', 'drivers', 'coverage', 'correlation'] as const;
type SectionId = (typeof SECTIONS)[number];

/** Sticky in-page navigation with a scroll-spy highlight. */
function SectionNav() {
  const { t } = useTranslation('insights');
  const [active, setActive] = React.useState<SectionId>('kpis');
  const listRef = React.useRef<HTMLOListElement>(null);

  React.useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keep the active chip in view on narrow screens (horizontal scroll only).
  React.useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (list && el && list.scrollWidth > list.clientWidth) list.scrollTo({ left: Math.max(0, el.offsetLeft - 16), behavior: 'smooth' });
  }, [active]);

  return (
    <nav aria-label={t('nav.label')} className="no-print sticky top-16 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <PageContainer>
        <ol ref={listRef} className="-mx-1 flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((id, i) => (
            <li key={id} data-id={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={active === id ? 'location' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                  active === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="num opacity-60">{String(i + 1).padStart(2, '0')}</span>
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
  const { t } = useTranslation(['insights', 'common']);
  const model = useModel();
  const ranges = classRanges('risk');

  return (
    <MotionConfig reducedMotion="user">
      <div className="pb-8">
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('lead')}
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to="/explore">
                  <MapPinned /> {t('openMap')}
                </Link>
              </Button>
              <Button variant="ghost" className="no-print" onClick={() => window.print()}>
                <Printer /> {t('common:actions.print')}
              </Button>
            </>
          }
        >
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            {model.asOf && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 font-semibold text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden />
                {t('common:labels.asOf', { date: model.asOf })}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 font-semibold text-muted-foreground">
              {t('scope', { councils: model.councils.length, regions: model.regions.length })}
            </span>
            {model.editCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{t('edits', { count: model.editCount })}</span>
            )}
          </div>
        </PageHeader>

        <SectionNav />

        <PageContainer className="[&>section+section]:border-t [&>section+section]:border-border">
          <Headlines model={model} />
          <RegionalRanking model={model} />
          <DimensionScatter model={model} />
          <HazardMatrix model={model} />
          <ClassDistribution model={model} />
          <RiskDrivers model={model} />
          <DataCoverage model={model} />
          <CorrelationView model={model} />
        </PageContainer>

        <PageContainer className="pt-4">
          <Card className="bg-card/60">
            <CardContent className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold">{t('notes.title')}</h2>
                <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary/60">
                  <li>{t('notes.national')}</li>
                  <li>{t('notes.regions')}</li>
                  <li>{t('notes.thresholds', { ranges: ranges.join(' · ') })}</li>
                  <li>{t('notes.councils')}</li>
                  <li>{t('notes.composite')}</li>
                </ul>
                <Button variant="link" className="mt-4" asChild>
                  <Link to="/methodology">{t('notes.more')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    </MotionConfig>
  );
}
