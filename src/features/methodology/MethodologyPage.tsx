/**
 * Methodology - the summary page (UX-04): how INFORM Tanzania measures risk in seven short sections,
 * each linking to its full documentation page (/methodology/<section>, see SectionPage), and the list
 * of every full page. Old links into the full document (/methodology#sources) are redirected to the
 * page of that section. Typeset as a document (docs/DESIGN_LANGUAGE.md): hairline rules between
 * sections, no boxes around prose, no entrance motion.
 */
import { Download, Printer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';
import { useModel } from '@/data-layer/DataProvider';
import { exportFileName, exportPreamble, exportStamp } from '@/lib/exports';
import { downloadText, formatNumber } from '@/lib/utils';
import { formatMonth, REGISTER_ROWS, registerCsv, SECTION_IDS, sectionPath, SPEC_STATS, SUMMARY_IDS, SUMMARY_SECTIONS, summaryNumber, VERIFIED } from './data';
import { scrollToId, useHashScroll } from './hooks';
import { Documentation, SummaryClassification, SummaryGeometric, SummaryLevels, SummaryLimitations, SummaryOverview, SummaryPipeline, SummaryStructure } from './Summary';
import { DesktopToc, MobileToc } from './Toc';

const PRINT_CSS = `@media print {
  .methodology-doc section { break-inside: auto; }
  .methodology-doc figure, .methodology-doc table, .methodology-doc li { break-inside: avoid; }
}`;

export default function MethodologyPage() {
  const { t, i18n } = useTranslation('methodology');
  const model = useModel();
  const navigate = useNavigate();
  const { hash } = useLocation();

  // A link into the full document (the footer's /methodology#sources, older bookmarks) opens that page.
  React.useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (id && !SUMMARY_IDS.includes(id) && SECTION_IDS.includes(id)) navigate(sectionPath(id), { replace: true });
  }, [hash, navigate]);
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
        eyebrow={t('summary.eyebrow')}
        title={t('hero.title')}
        description={t('summary.lead')}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const stamp = exportStamp(t('sections.sources'));
                downloadText(exportFileName('indicator-register', stamp), registerCsv(REGISTER_ROWS, exportPreamble(t, stamp)), 'text/csv;charset=utf-8');
              }}
            >
              <Download /> {t('hero.download')}
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
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
        <MobileToc onNavigate={go} sections={SUMMARY_SECTIONS} numberOf={summaryNumber} />
        <div className="grid gap-10 pt-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:pt-14 xl:grid-cols-[14.5rem_minmax(0,1fr)] xl:gap-20 print:block">
          <aside className="no-print hidden lg:block">
            <DesktopToc onNavigate={go} sections={SUMMARY_SECTIONS} numberOf={summaryNumber} />
          </aside>
          <article className="min-w-0">
            <SummaryOverview />
            <SummaryStructure />
            <SummaryPipeline />
            <SummaryGeometric />
            <SummaryClassification />
            <SummaryLevels />
            <SummaryLimitations />
            <Documentation />
          </article>
        </div>
      </PageContainer>
    </div>
  );
}
