/**
 * The Methodology summary (UX-04): seven short sections that say how the index works, each with a
 * link to its full documentation page, and the list of every full page. Nothing here repeats the
 * detail of the full sections: the texts are the opening paragraphs of each, the structure is the
 * hierarchy at a glance, the pipeline is four sentences, and the limitations are their titles.
 */
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { useModel } from '@/data-layer/DataProvider';
import { CLASS_KEYS, classRanges, type Scale } from '@/engine/risk/classes';
import { ALL_INDICATORS, DIMENSIONS } from '@/engine/risk/hierarchy';
import { dataNotesSummary } from '@/engine/risk/notes';
import { cn, formatScore } from '@/lib/utils';
import { displayNumber, SECTIONS, sectionKey, sectionPath, summaryNumber } from './data';
import { DocSection, P } from './ui';

/** "Read the full section" link under a summary block. */
function Open({ id, className }: { id: string; className?: string }) {
  const { t } = useTranslation('methodology');
  return (
    <Link to={sectionPath(id)} className={cn('inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline', className)}>
      {t('summary.open', { title: t(sectionKey(id)) })} <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

/** A summary section: the title links to its full page; the body is short. */
function Section({ id, title, lead, children }: { id: string; title: React.ReactNode; lead?: React.ReactNode; children: React.ReactNode }) {
  const { t } = useTranslation('methodology');
  const heading =
    id === 'documentation' ? (
      <span className="text-[1.4rem] sm:text-[1.7rem]">{title}</span>
    ) : (
      <Link to={sectionPath(id)} className="group/title inline text-[1.4rem] underline-offset-4 hover:underline sm:text-[1.7rem]" title={t('summary.open', { title: t(sectionKey(id)) })}>
        {title}
        <ArrowRight className="ml-2 inline size-4 align-baseline text-muted-foreground transition-colors group-hover/title:text-primary" aria-hidden />
      </Link>
    );
  return (
    <DocSection id={id} number={summaryNumber(id)} title={heading} lead={lead} className="py-6 sm:py-8 [&>header+div]:mt-5">
      {children}
      {id !== 'documentation' && <Open id={id} className="mt-4 text-xs" />}
    </DocSection>
  );
}

export function SummaryOverview() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const counts = { councils: model.councils.length, regions: model.regions.length, sources: model.sources.length };
  return (
    <Section id="overview" title={t('overview.title')}>
      <div className="max-w-[70ch] space-y-4">
        <P>{t('overview.p1')}</P>
        <P>{t('overview.p3', counts)}</P>
      </div>
    </Section>
  );
}

/** The hierarchy at a glance: three dimensions, their two categories, and the groups each holds. */
export function SummaryStructure() {
  const { t } = useTranslation(['methodology', 'common', 'indicators']);
  return (
    <Section id="structure" title={t('methodology:structure.title')}>
      <div className="grid gap-6 md:grid-cols-3">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="border-t-2 pt-3" style={{ borderColor: DIMENSION_COLORS[d.key] }}>
            <h3 className="text-base font-semibold">{t(`common:dimensions.${d.key}`)}</h3>
            <ul className="mt-3 space-y-3">
              {d.categories.map((c) => (
                <li key={c.key} className="text-sm">
                  <p className="font-medium">{t(`common:categories.${c.key}`)}</p>
                  <p className="mt-0.5 leading-relaxed text-muted-foreground">{c.indicators.map((i) => t(`indicators:${i.key}`)).join(' · ')}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

const STEPS = [1, 2, 3, 4] as const;

/** The calculation in four sentences. */
export function SummaryPipeline() {
  const { t } = useTranslation('methodology');
  return (
    <Section id="pipeline" title={t('summary.pipeline.title')}>
      <ol className="max-w-[70ch] divide-y divide-border border-y border-border">
        {STEPS.map((n) => (
          <li key={n} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 py-3.5">
            <span className="num pt-px text-sm font-semibold text-muted-foreground">{n}</span>
            <p className="leading-relaxed">{t(`summary.pipeline.steps.${n}`)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function SummaryGeometric() {
  const { t } = useTranslation('methodology');
  return (
    <Section id="geometric" title={t('geometric.title')}>
      <div className="max-w-[70ch]">
        <P>{t('geometric.p1')}</P>
      </div>
    </Section>
  );
}

const SCALES: readonly Scale[] = ['risk', 'hazard', 'vulnerability', 'coping'];

/** The class boundaries of every scale, in one table. */
export function SummaryClassification() {
  const { t } = useTranslation(['methodology', 'common']);
  return (
    <Section id="classification" title={t('methodology:classification.title')}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-foreground/25 text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">
                {t('methodology:classification.class')}
              </th>
              {SCALES.map((s) => (
                <th key={s} scope="col" className="num py-2 pr-3 font-medium">
                  {s === 'risk' ? t('common:informRisk') : t(`common:dimensions.${s}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLASS_KEYS.map((k, i) => (
              <tr key={k} className="border-b border-border">
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {t(`common:classes.${k}`)}
                </th>
                {SCALES.map((s) => (
                  <td key={s} className="num py-2 pr-3 text-muted-foreground">
                    {classRanges(s)[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function SummaryLevels() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const rows = [
    { key: 'councils', body: t('summary.levels.councils', { n: model.councils.length, units: model.sources.length }) },
    { key: 'regions', body: t('summary.levels.regions', { n: model.regions.length }) },
    { key: 'national', body: t('summary.levels.national', { value: formatScore(model.national.risk) }) },
  ];
  return (
    <Section id="levels" title={t('levels.title')}>
      <dl className="max-w-[70ch] divide-y divide-border border-y border-border">
        {rows.map((r) => (
          <div key={r.key} className="grid gap-x-6 gap-y-1 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <dt className="font-medium">{t(`levels.${r.key}.title`)}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{r.body}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** Keep in step with ITEMS in sections/Limitations.tsx. */
const LIMITATIONS: ReadonlyArray<{ key: string; status: 'open' | 'inProgress' | 'planned' }> = [
  { key: 'queried', status: 'inProgress' },
  { key: 'empty', status: 'open' },
  { key: 'inherit', status: 'inProgress' },
  { key: 'global', status: 'inProgress' },
  { key: 'advanced', status: 'inProgress' },
];
const STATUS_DOT = { open: 'bg-warning', inProgress: 'bg-primary', planned: 'border border-muted-foreground' } as const;

/** The limitations by title and status; the full page carries "today" and "next" for each. */
export function SummaryLimitations() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const vars = React.useMemo(() => {
    const perSource = new Map<string, number>();
    for (const c of model.councils) if (c.sourceId) perSource.set(c.sourceId, (perSource.get(c.sourceId) ?? 0) + 1);
    const notes = dataNotesSummary(model);
    return { inherited: model.councils.filter((c) => c.inheritedFrom).length, shared: [...perSource.values()].filter((n) => n > 1).length, groups: ALL_INDICATORS.length, notes: notes.notes, queried: notes.queried, noteGroups: notes.groups, councils: notes.councils, withheld: notes.withheld, replaced: notes.replaced, withheldWorkbook: notes.withheldWorkbook, withheldUnits: notes.withheldUnits, withheldCouncils: notes.withheldCouncils };
  }, [model]);
  return (
    <Section id="limitations" title={t('limitations.title')}>
      <ol className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
        {LIMITATIONS.map((item, i) => (
          <li key={item.key} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border py-2.5 text-sm">
            <span className="num text-muted-foreground">{i + 1}</span>
            <span className="font-medium">{t(`limitations.items.${item.key}.title`, vars)}</span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground">
              <span className={cn('size-1.5 rounded-full', STATUS_DOT[item.status])} aria-hidden />
              {t(`limitations.status.${item.status}`)}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Every full documentation page, in the document's order and numbering. */
export function Documentation() {
  const { t } = useTranslation('methodology');
  return (
    <Section id="documentation" title={t('summary.documentation.title')}>
      <p className="mb-3 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">{t('summary.documentation.lead')}</p>
      <ol className="grid gap-x-10 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.id} className="border-b border-border">
            <Link to={sectionPath(s.id)} className="group flex items-baseline gap-3 py-3 text-sm hover:text-primary">
              <span className={cn('num shrink-0 text-xs text-muted-foreground', s.depth ? 'w-7 pl-3' : 'w-7')}>{displayNumber(s.id)}</span>
              <span className={cn('flex-1 font-medium underline-offset-4 group-hover:underline', s.depth && 'font-normal')}>{t(sectionKey(s.id))}</span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}
