/**
 * Methodology — long-form, citable documentation of INFORM Tanzania: model structure, the exact
 * standardisation and aggregation formulas (with a live worked example computed by the engine),
 * classification, administrative levels, the advanced multi-source model, the crisis-severity method,
 * the data-sources register, quality assurance, limitations, corrections and references.
 * Sections are anchor-addressable (`/methodology#sources`) and tracked by a scroll-spy table of contents.
 */
import { CalendarClock, Download, FlaskConical, Layers, Printer } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { downloadText, formatNumber } from '@/lib/utils';
import { REGISTER_ROWS, registerCsv, SPEC_STATS, VERIFIED } from './data';
import { scrollToId, useHashScroll } from './hooks';
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
  .methodology-doc [style*="opacity"] { opacity: 1 !important; transform: none !important; }
  .methodology-doc section { break-inside: auto; }
  .methodology-doc figure, .methodology-doc table { break-inside: avoid; }
}`;

function MetaChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur [&_svg]:size-3.5 [&_svg]:text-primary">
      {icon}
      {children}
    </span>
  );
}

/** The document body. Memoised: sections read the model themselves, so hash changes do not re-render them. */
const Sections = React.memo(function Sections() {
  return (
    <article className="min-w-0">
      <OverviewSection />
      <StructureSection />
      <PipelineSection />
      <WorkedExampleSection />
      <GeometricSection />
      <ClassificationSection />
      <LevelsSection />
      <AdvancedSection />
      <SeveritySection />
      <SourcesRegisterSection />
      <QualitySection />
      <LimitationsSection />
      <ChangelogSection />
      <ReferencesSection />
    </article>
  );
});

export default function MethodologyPage() {
  const { t, i18n } = useTranslation('methodology');
  const model = useModel();
  const navigate = useNavigate();
  const { hash } = useLocation();
  useHashScroll();

  const go = React.useCallback(
    (id: string) => {
      if (hash === `#${id}`) scrollToId(id);
      else navigate({ hash: `#${id}` }, { replace: true, preventScrollReset: true });
    },
    [hash, navigate],
  );

  return (
    <MotionConfig reducedMotion="user">
      {/* Print: reveal blocks that never scrolled into view (motion leaves them at opacity 0). */}
      <style>{PRINT_CSS}</style>
      <div className="methodology-doc">
        <PageHeader
          eyebrow={t('hero.eyebrow')}
          title={t('hero.title')}
          description={t('hero.lead')}
          actions={
            <div className="no-print flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadText('inform-tanzania-indicator-register.csv', registerCsv(REGISTER_ROWS), 'text/csv;charset=utf-8')}>
                <Download /> {t('hero.download')}
              </Button>
              <Button variant="ghost" onClick={() => window.print()}>
                <Printer /> {t('hero.print')}
              </Button>
            </div>
          }
        >
          <div className="mt-6 flex flex-wrap gap-2">
            {model.asOf && <MetaChip icon={<CalendarClock />}>{t('hero.asOf', { date: model.asOf })}</MetaChip>}
            <MetaChip icon={<Layers />}>{t('hero.indicators', { used: SPEC_STATS.used, total: SPEC_STATS.total })}</MetaChip>
            <MetaChip icon={<FlaskConical />}>{t('hero.verified', { n: formatNumber(VERIFIED.standardiseValues, i18n.language) })}</MetaChip>
          </div>
        </PageHeader>

        <PageContainer>
          <MobileToc onNavigate={go} />
          <div className="grid gap-10 pt-8 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:pt-12 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-14 print:block">
            <aside className="no-print hidden lg:block">
              <DesktopToc onNavigate={go} />
            </aside>
            <Sections />
          </div>
        </PageContainer>
      </div>
    </MotionConfig>
  );
}
