import { ArrowRight, Database, Flag, GitMerge, MapPinned, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Card } from '@/components/ui/card';
import { useModel } from '@/data-layer/DataProvider';
import { mean } from '@/engine/risk/math';
import { cn, formatScore } from '@/lib/utils';
import { fadeIn } from '../tokens';
import { Callout, DocSection, Fn, Formula, Line, N, Op, P, Paren, SubHeading } from '../ui';

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

  const cards = [
    { key: 'sources', icon: Database, count: model.sources.length, body: t('levels.sources.body', { n: model.sources.length }), tone: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
    { key: 'councils', icon: MapPinned, count: model.councils.length, body: t('levels.councils.body', { n: model.councils.length }), tone: 'bg-primary/10 text-primary' },
    { key: 'regions', icon: GitMerge, count: model.regions.length, body: t('levels.regions.body', { n: model.regions.length }), tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
    {
      key: 'national',
      icon: Flag,
      count: formatScore(model.national.risk),
      body: t('levels.national.body', { value: formatScore(model.national.risk) }),
      tone: 'bg-amber-500/12 text-amber-800 dark:text-amber-300',
    },
  ] as const;

  const missingExample = mean([5, 5, null]);

  return (
    <DocSection id="levels" number="06" eyebrow={t('sections.levels')} title={t('levels.title')} lead={t('levels.lead')}>
      <ol className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.li key={c.key} {...fadeIn} transition={{ ...fadeIn.transition, delay: i * 0.05 }} className="relative">
            <Card className={cn('h-full p-5', c.key === 'councils' && 'border-primary/30')}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('inline-flex size-9 items-center justify-center rounded-xl', c.tone)}>
                  <c.icon className="size-4.5" aria-hidden />
                </span>
                {c.key === 'national' ? <ClassBadge value={model.national.risk} size="sm" /> : <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t(`levels.${c.key}.tag`)}</span>}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="num font-display text-3xl font-extrabold tracking-tight">{c.count}</span>
                <span className="text-sm font-semibold">{t(`levels.${c.key}.title`)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              {c.key === 'councils' && (
                <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-relaxed text-foreground/85">
                  {t('levels.councils.inherited', { n: inherited.length, examples })}
                </p>
              )}
            </Card>
            {i < 2 && <ArrowRight className="absolute top-1/2 -right-2.5 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-background text-muted-foreground 2xl:block" aria-hidden />}
          </motion.li>
        ))}
      </ol>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <SubHeading>{t('levels.missing.title')}</SubHeading>
          <P className="mt-2 text-sm sm:text-[15px]">{t('levels.missing.body')}</P>
          <Formula label={t('levels.missing.formula', { result: formatScore(missingExample) })} className="mt-4">
            <Line>
              <Fn>mean</Fn>
              <Paren>
                <N>5</N>, <N>5</N>, <span className="font-sans text-[0.8em] text-muted-foreground not-italic">{t('levels.missing.noData')}</span>
              </Paren>
              <Op>=</Op>
              <N strong>{formatScore(missingExample)}</N>
              <span className="ml-3 font-sans text-[0.8em] text-muted-foreground not-italic">{t('levels.missing.not')}</span>
            </Line>
          </Formula>
        </div>
        <div>
          <SubHeading>{t('levels.propagate.title')}</SubHeading>
          <P className="mt-2 text-sm sm:text-[15px]">{t('levels.propagate.body')}</P>
          <Callout tone="note" className="mt-4" title={t('levels.shared.title')}>
            {t('levels.shared.body', { n: shared })}
          </Callout>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{t('levels.liveNote', { edits: model.editCount })}</span>
      </div>
    </DocSection>
  );
}
