import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { useModel } from '@/data-layer/DataProvider';
import { mean } from '@/engine/risk/math';
import { formatScore } from '@/lib/utils';
import { Callout, DocSection, Fn, Formula, Line, N, Op, P, Paren, Sep, SubHeading, Txt } from '../ui';

const LEVELS = ['sources', 'councils', 'regions', 'national'] as const;

export function LevelsSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const model = useModel();

  const inherited = model.councils.filter((c) => c.inheritedFrom);
  const shared = React.useMemo(() => {
    const n = new Map<string, number>();
    for (const c of model.councils) if (c.sourceId) n.set(c.sourceId, (n.get(c.sourceId) ?? 0) + 1);
    return [...n.values()].filter((x) => x > 1).length;
  }, [model]);
  const examples = inherited
    .slice(0, 3)
    .map((c) => `${c.name} ← ${c.inheritedFrom}`)
    .join(', ');

  const figure: Record<(typeof LEVELS)[number], React.ReactNode> = { sources: model.sources.length, councils: model.councils.length, regions: model.regions.length, national: formatScore(model.national.risk) };
  const body: Record<(typeof LEVELS)[number], string> = {
    sources: t('levels.sources.body', { n: model.sources.length }),
    councils: t('levels.councils.body', { n: model.councils.length }),
    regions: t('levels.regions.body', { n: model.regions.length }),
    national: t('levels.national.body', { value: formatScore(model.national.risk) }),
  };

  const missingExample = mean([5, 5, null]);

  return (
    <DocSection id="levels" label={t('sections.levels')} title={t('levels.title')} lead={t('levels.lead')}>
      <ol className="border-y border-border">
        {LEVELS.map((k, i) => (
          <li key={k} className="grid gap-x-8 gap-y-2 border-t border-border py-6 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div className="flex items-baseline gap-3 sm:block">
              <span className="num font-display text-[2.4rem] leading-none font-semibold tracking-tight">{figure[k]}</span>
              {k === 'national' && <ClassBadge value={model.national.risk} size="sm" className="sm:mt-2.5 sm:flex sm:w-fit" />}
            </div>
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-baseline gap-x-3 text-base font-semibold">
                <span className="sr-only">{i + 1}. </span>
                {t(`levels.${k}.title`)}
                {k !== 'national' && <span className="text-sm font-normal text-muted-foreground">{t(`levels.${k}.tag`)}</span>}
              </h3>
              <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{body[k]}</p>
              {k === 'councils' && (
                <Callout tone="caution" className="mt-3 text-foreground/85">
                  {t('levels.councils.inherited', { n: inherited.length, examples })}
                </Callout>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border">
        <div className="lg:pr-10">
          <SubHeading>{t('levels.missing.title')}</SubHeading>
          <P className="mt-2 text-[15px]">{t('levels.missing.body')}</P>
          <Formula label={t('levels.missing.formula', { result: formatScore(missingExample) })} className="mt-5">
            <Line>
              <Fn>mean</Fn>
              <Paren>
                <N>5</N>
                <Sep />
                <N>5</N>
                <Sep />
                <Txt>{t('levels.missing.noData')}</Txt>
              </Paren>
              <Op>=</Op>
              <N strong>{formatScore(missingExample)}</N>
              <span className="pl-2">
                <Txt>{t('levels.missing.not')}</Txt>
              </span>
            </Line>
          </Formula>
        </div>
        <div className="border-t border-border pt-10 lg:border-t-0 lg:pt-0 lg:pl-10">
          <SubHeading>{t('levels.propagate.title')}</SubHeading>
          <P className="mt-2 text-[15px]">{t('levels.propagate.body')}</P>
          <Callout className="mt-5" title={t('levels.shared.title')}>
            {t('levels.shared.body', { n: shared })}
          </Callout>
        </div>
      </div>

      <p className="mt-12 max-w-[72ch] text-[13px] leading-relaxed text-muted-foreground">{t('levels.liveNote', { edits: model.editCount })}</p>
    </DocSection>
  );
}
