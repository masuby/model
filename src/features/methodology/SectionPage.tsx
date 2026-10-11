/**
 * One full section of the Methodology document on its own page (/methodology/<section>, UX-04): the
 * section as written for the long-form document, with a link back to the summary and to the previous
 * and next sections in the document's order. An unknown section returns to the summary.
 */
import { ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { displayNumber, SECTIONS, sectionKey, sectionPath } from './data';
import { useHashScroll } from './hooks';
import { ClassificationSection } from './sections/Classification';
import { GeometricSection } from './sections/Geometric';
import { LevelsSection } from './sections/Levels';
import { LimitationsSection } from './sections/Limitations';
import { OverviewSection } from './sections/Overview';
import { PipelineSection } from './sections/Pipeline';
import { ReferencesSection } from './sections/References';
import { SeveritySection } from './sections/Severity';
import { SourcesRegisterSection } from './sections/SourcesRegister';
import { StructureSection } from './sections/Structure';
import { WorkedExampleSection } from './sections/WorkedExample';

const PRINT_CSS = `@media print {
  .methodology-doc section { break-inside: auto; }
  .methodology-doc figure, .methodology-doc table, .methodology-doc li { break-inside: avoid; }
}`;

const COMPONENTS: Record<string, React.ComponentType> = {
  overview: OverviewSection,
  structure: StructureSection,
  pipeline: PipelineSection,
  'worked-example': WorkedExampleSection,
  geometric: GeometricSection,
  classification: ClassificationSection,
  levels: LevelsSection,
  severity: SeveritySection,
  sources: SourcesRegisterSection,
  limitations: LimitationsSection,
  references: ReferencesSection,
};

function Neighbour({ id, direction }: { id: string | undefined; direction: 'prev' | 'next' }) {
  const { t } = useTranslation('methodology');
  if (!id) return <span />;
  return (
    <Link to={sectionPath(id)} className={cn('group flex min-w-0 flex-col gap-1 text-sm', direction === 'next' && 'items-end text-right')}>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        {direction === 'prev' && <ArrowLeft className="size-3.5" aria-hidden />}
        {t(`section.${direction}`)}
        {direction === 'next' && <ArrowRight className="size-3.5" aria-hidden />}
      </span>
      <span className="font-medium underline-offset-4 group-hover:underline">
        <span className="num mr-2 text-muted-foreground">{displayNumber(id)}</span>
        {t(sectionKey(id))}
      </span>
    </Link>
  );
}

export default function SectionPage() {
  const { section = '' } = useParams<{ section: string }>();
  const { t } = useTranslation('methodology');
  useHashScroll();
  const index = SECTIONS.findIndex((s) => s.id === section);
  const Component = COMPONENTS[section];

  React.useEffect(() => {
    if (index < 0) return;
    const previous = document.title;
    document.title = `${t(sectionKey(section))} · ${t('hero.title')}`;
    return () => {
      document.title = previous;
    };
  }, [index, section, t]);

  if (index < 0 || !Component) return <Navigate to="/methodology" replace />;
  const prev = SECTIONS[index - 1]?.id;
  const next = SECTIONS[index + 1]?.id;

  return (
    <div className="methodology-doc">
      <style>{PRINT_CSS}</style>
      <PageContainer className="pt-6 sm:pt-8">
        <nav aria-label={t('section.breadcrumb')} className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 text-sm">
          <Link to="/methodology" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline">
            <ArrowLeft className="size-3.5" aria-hidden /> {t('section.back')}
          </Link>
          <span className="text-muted-foreground">{t('section.eyebrow', { n: displayNumber(section), total: SECTIONS.filter((x) => x.depth === 0).length })}</span>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer /> {t('hero.print')}
          </Button>
        </nav>
        <article className="min-w-0 pt-10 sm:pt-12 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0">
          <Component />
        </article>
        <nav aria-label={t('section.pager')} className="no-print grid grid-cols-2 gap-6 border-t border-border py-8 pb-16 sm:pb-20">
          <Neighbour id={prev} direction="prev" />
          <Neighbour id={next} direction="next" />
        </nav>
      </PageContainer>
    </div>
  );
}
