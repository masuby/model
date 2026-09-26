import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SPEC_STATS } from '../data';
import { fadeIn, PHASE_STYLE } from '../tokens';
import { BigOp, DocSection, Fn, Formula, Frac, Line, N, Op, P, Paren, Root, Txt, V } from '../ui';

type Phase = keyof typeof PHASE_STYLE;

interface Step {
  n: number;
  phase: Phase;
  label: string;
  formula: ReactNode;
  applies?: string;
}

export function PipelineSection() {
  const { t } = useTranslation('methodology');
  const s = SPEC_STATS;

  const steps: Step[] = [
    {
      n: 1,
      phase: 'standardise',
      label: t(`pipeline.steps.1.formula`),
      applies: t('pipeline.applies', { n: s.denominator, total: s.used }),
      formula: (
        <Line>
          <V>x</V>
          <Op>=</Op>
          <Frac num={<V sub="raw">x</V>} den={<V>d</V>} />
          <Txt>{t('pipeline.where.denominator')}</Txt>
        </Line>
      ),
    },
    {
      n: 2,
      phase: 'standardise',
      label: t(`pipeline.steps.2.formula`),
      applies: t('pipeline.applies', { n: s.outlier, total: s.used }),
      formula: (
        <>
          <Line>
            <V>x′</V>
            <Op>=</Op>
            <Fn>min</Fn>
            <Paren>
              <Fn>max</Fn>
              <Paren>
                <V>x</V>,<V sub="1">Q</V>
                <Op>−</Op>
                <N>1.5</N>
                <Op>·</Op>
                <V>IQR</V>
              </Paren>
              ,<V sub="3">Q</V>
              <Op>+</Op>
              <N>1.5</N>
              <Op>·</Op>
              <V>IQR</V>
            </Paren>
          </Line>
          <Line>
            <Txt>{t('pipeline.where.quartiles')}</Txt>
          </Line>
        </>
      ),
    },
    {
      n: 3,
      phase: 'standardise',
      label: t(`pipeline.steps.3.formula`),
      applies: t('pipeline.applies', { n: s.log, total: s.used }),
      formula: (
        <Line>
          <V>x″</V>
          <Op>=</Op>
          <Fn>ln</Fn>
          <Paren>
            <N>0.001</N>
            <Op>+</Op>
            <V>x′</V>
          </Paren>
        </Line>
      ),
    },
    {
      n: 4,
      phase: 'standardise',
      label: t(`pipeline.steps.4.formula`),
      applies: t('pipeline.appliesMinmax', { custom: s.custom, range: s.range, dec: s.decrease }),
      formula: (
        <>
          <Line>
            <V>s*</V>
            <Op>=</Op>
            <N>10</N>
            <Op>·</Op>
            <Frac
              num={
                <>
                  <V>x″</V>
                  <Op>−</Op>
                  <V>min</V>
                </>
              }
              den={
                <>
                  <V>max</V>
                  <Op>−</Op>
                  <V>min</V>
                </>
              }
            />
            <Op>;</Op>
            <Txt>{t('pipeline.where.decrease')}</Txt>
            <V>s*</V>
            <Op>←</Op>
            <N>10</N>
            <Op>−</Op>
            <V>s*</V>
          </Line>
          <Line>
            <V>s</V>
            <Op>=</Op>
            <Fn>round</Fn>
            <Paren>
              <Fn>min</Fn>
              <Paren>
                <N>10</N>,<Fn>max</Fn>
                <Paren>
                  <N>0</N>,<V>s*</V>
                </Paren>
              </Paren>
              ,<N>1</N>
            </Paren>
          </Line>
          <Line>
            <Txt>{t('pipeline.where.minmax')}</Txt>
          </Line>
        </>
      ),
    },
    {
      n: 5,
      phase: 'aggregate',
      label: t(`pipeline.steps.5.formula`),
      formula: (
        <>
          <Line>
            <V>g</V>
            <Op>=</Op>
            <Frac
              num={
                <>
                  <BigOp symbol="Σ" below="i" />
                  <V sub="i">w</V>
                  <V sub="i">s</V>
                </>
              }
              den={
                <>
                  <BigOp symbol="Σ" below="i" />
                  <V sub="i">w</V>
                </>
              }
            />
          </Line>
          <Line>
            <Txt>{t('pipeline.where.weights')}</Txt>
          </Line>
        </>
      ),
    },
    {
      n: 6,
      phase: 'aggregate',
      label: t(`pipeline.steps.6.formula`),
      formula: (
        <Line>
          <V>c</V>
          <Op>=</Op>
          <Frac num={<N>1</N>} den={<V>m</V>} />
          <BigOp symbol="Σ" below="j" />
          <V sub="j">g</V>
          <Txt>{t('pipeline.where.components')}</Txt>
        </Line>
      ),
    },
    {
      n: 7,
      phase: 'aggregate',
      label: t(`pipeline.steps.7.formula`),
      formula: (
        <>
          <Line>
            <V>D</V>
            <Op>=</Op>
            <Fn>round</Fn>
            <Paren>
              <Frac
                num={
                  <>
                    <N>10</N>
                    <Op>−</Op>
                    <Fn>geomean</Fn>
                    <sub className="text-[0.62em] italic">k</sub>
                    <Paren>
                      <Frac
                        num={
                          <>
                            <N>10</N>
                            <Op>−</Op>
                            <V sub="k">c</V>
                          </>
                        }
                        den={<N>10</N>}
                      />
                      <Op>·</Op>
                      <N>9</N>
                      <Op>+</Op>
                      <N>1</N>
                    </Paren>
                  </>
                }
                den={<N>9</N>}
              />
              <Op>·</Op>
              <N>10</N>,<N>1</N>
            </Paren>
          </Line>
          <Line>
            <Fn>geomean</Fn>
            <Paren>
              <V sub="1">y</V>,<Op>…</Op>,<V sub="n">y</V>
            </Paren>
            <Op>=</Op>
            <Paren>
              <BigOp symbol="Π" below="k" />
              <V sub="k">y</V>
            </Paren>
            <sup className="-ml-1 self-start text-[0.68em]">
              1/<i>n</i>
            </sup>
          </Line>
        </>
      ),
    },
    {
      n: 8,
      phase: 'aggregate',
      label: t(`pipeline.steps.8.formula`),
      formula: (
        <Line>
          <V>{t('vars.risk')}</V>
          <Op>=</Op>
          <Fn>round</Fn>
          <Paren>
            <Root index={3}>
              <V>H</V>
              <Op>·</Op>
              <V>V</V>
              <Op>·</Op>
              <V>LCC</V>
            </Root>
            ,<N>1</N>
          </Paren>
        </Line>
      ),
    },
  ];

  return (
    <DocSection id="pipeline" number="03" eyebrow={t('sections.pipeline')} title={t('pipeline.title')} lead={t('pipeline.lead')}>
      <P>{t('pipeline.intro')}</P>

      <ol className="mt-10">
        {steps.map((step, i) => {
          const firstOfPhase = i === 0 || steps[i - 1].phase !== step.phase;
          const last = i === steps.length - 1;
          const style = PHASE_STYLE[step.phase];
          return (
            <li key={step.n} className="relative">
              {firstOfPhase && (
                <div className={cn('mb-5 flex items-center gap-3', i > 0 && 'mt-4')}>
                  <span className={cn('rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.12em] uppercase', style.ring)}>{t(`pipeline.phase.${step.phase}`)}</span>
                  <span className="text-xs text-muted-foreground">{t(`pipeline.phase.${step.phase}Hint`)}</span>
                </div>
              )}
              <motion.div {...fadeIn} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 pb-8 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-5">
                <div className="relative flex justify-center">
                  <span className={cn('num relative z-10 flex size-10 items-center justify-center rounded-full border font-display text-sm font-extrabold sm:size-12 sm:text-base', style.ring)}>{step.n}</span>
                  {!last && <span className={cn('absolute top-10 bottom-[-2rem] w-px sm:top-12', style.line)} aria-hidden />}
                </div>
                <div className="min-w-0 pt-1.5 sm:pt-2.5">
                  <h3 className="text-base font-bold sm:text-lg">{t(`pipeline.steps.${step.n}.title`)}</h3>
                  <p className="mt-1.5 max-w-[72ch] text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{t(`pipeline.steps.${step.n}.body`)}</p>
                  <Formula label={step.label} className="mt-3.5" caption={step.applies}>
                    {step.formula}
                  </Formula>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </DocSection>
  );
}
