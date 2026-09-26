/**
 * Methodology — long-form, citable documentation of INFORM Tanzania: model structure, the exact
 * standardisation and aggregation formulas (with a live worked example computed by the engine),
 * classification, administrative levels, the advanced multi-source model, the crisis-severity method,
 * the data-sources register, quality assurance, limitations, corrections and references.
 * Sections are anchor-addressable (`/methodology#sources`) and tracked by a scroll-spy table of contents.
 * Typeset as a document (docs/DESIGN_LANGUAGE.md): hairline rules between sections, no boxes around
 * prose, no entrance motion.
 */
import { Download, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { downloadText, formatNumber } from '@/lib/utils';
import { formatMonth, REGISTER_ROWS, registerCsv, SPEC_STATS, VERIFIED } from './data';
import { scrollToId, useDeferredMount, useHashScroll } from './hooks';
import { AdvancedSection } from './sections/Advanced';
import { ChangelogSection } from './sections/Changelog';
import { ClassificationSection } from './sections/Classification';
import { GeometricSection } from './sections/Geometric';
import { LevelsSection } from './sections/Levels';
import { LimitationsSection } from './sections/Limitations';
import { OverviewSection } from './sections/Overview';
import { PipelineSection } from './sections/Pipeline';
import { QualitySection } from './sections/Quality';
import { ReferencesSection } from './sections/References';
import { SeveritySection } from './sections/Severity';
import { SourcesRegisterSection } from './sections/SourcesRegister';
import { StructureSection } from './sections/Structure';
import { WorkedExampleSection } from './sections/WorkedExample';
import { DesktopToc, MobileToc } from './Toc';

const PRINT_CSS = `@media print {
  .methodology-doc section { break-inside: auto; }
  .methodology-doc figure, .methodology-doc table, .methodology-doc li { break-inside: avoid; }
}`;

/** Batches of the document mounted after the first paint (see `useDeferredMount`). */
const DEFERRED_STAGES = 2;

/**
 * The document body. The opening sections render with the page; the rest mounts in two batches once the
 * first frame is painted. Memoised: sections read the model themselves, so hash changes do not
 * re-render them.
 */
const Sections = React.memo(function Sections({ stage }: { stage: number }) {
  return (
    <article className="min-w-0">
      <OverviewSection />
      <StructureSection />
      {stage >= 1 && (
        <>
          <PipelineSection />
          <WorkedExampleSection />
          <GeometricSection />
          <ClassificationSection />
          <LevelsSection />
        </>
      )}
      {stage >= 2 && (
        <>
          <AdvancedSection />
          <SeveritySection />
          <SourcesRegisterSection />
          <QualitySection />
          <LimitationsSection />
          <ChangelogSection />
          <ReferencesSection />
        </>
      )}
    </article>
  );
});

export default function MethodologyPage() {
  const { t, i18n } = useTranslation('methodology');
  const model = useModel();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [stage, showAll] = useDeferredMount(hash.length > 1, DEFERRED_STAGES);
  useHashScroll();

  const go = React.useCallback(
    (id: string) => {
      if (hash === `#${id}`) scrollToId(id);
      else navigate({ hash: `#${id}` }, { replace: true, preventScrollReset: true });
    },
    [hash, navigate],
  );

  const meta = [
    model.asOf ? t('hero.asOf', { date: formatMonth(model.asOf, i18n.language) }) : null,
    t('hero.indicators', { used: SPEC_STATS.used, total: SPEC_STATS.total }),
    t('hero.verified', { n: formatNumber(VERIFIED.standardiseValues, i18n.language) }),
  ].filter(Boolean) as string[];

  return (
    <div className="methodology-doc">
      <style>{PRINT_CSS}</style>
      <PageHeader
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        description={t('hero.lead')}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadText('inform-tanzania-indicator-register.csv', registerCsv(REGISTER_ROWS), 'text/csv;charset=utf-8')}>
              <Download /> {t('hero.download')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                showAll();
                window.print();
              }}
            >
              <Printer /> {t('hero.print')}
            </Button>
          </div>
        }
      >
        <ul className="num mt-8 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-y-1.5">
          {meta.map((m) => (
            <li key={m} className="sm:border-l sm:border-border sm:px-4 sm:first:border-l-0 sm:first:pl-0">
              {m}
            </li>
          ))}
        </ul>
      </PageHeader>

      <PageContainer>
        <MobileToc onNavigate={go} />
        <div className="grid gap-10 pt-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:pt-16 xl:grid-cols-[14.5rem_minmax(0,1fr)] xl:gap-20 print:block">
          <aside className="no-print hidden lg:block">
            <DesktopToc onNavigate={go} />
          </aside>
          <Sections stage={stage} />
        </div>
      </PageContainer>
    </div>
  );
}
