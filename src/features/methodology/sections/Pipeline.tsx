import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SPEC_STATS } from '../data';
import { Aligned, BigOp, DocSection, Fn, Formula, Frac, Line, N, Op, P, Paren, Root, Sep, Txt, V } from '../ui';

type Phase = 'standardise' | 'aggregate';
const PHASES: readonly Phase[] = ['standardise', 'aggregate'];

interface Step {
  n: number;
  phase: Phase;
  label: string;
  formula: ReactNode;
  /** A further line of the display, outside the aligned rows. */
  extra?: ReactNode;
  /** The "where ..." explanation set beneath the equation. */
  where?: string;
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
      where: t('pipeline.where.denominator'),
      applies: t('pipeline.applies', { n: s.denominator, total: s.used }),
      formula: (
        <Line>
          <V>x</V>
          <Op>=</Op>
          <Frac num={<V sub="raw">x</V>} den={<V>d</V>} />
        </Line>
      ),
    },
    {
      n: 2,
      phase: 'standardise',
      label: t(`pipeline.steps.2.formula`),
      where: t('pipeline.where.quartiles'),
      applies: t('pipeline.applies', { n: s.outlier, total: s.used }),
      formula: (
        <Aligned
          rows={[
            [
              <V key="l">x′</V>,
              <>
                <Op>=</Op>
                <Fn>min</Fn>
                <Paren>
                  <Fn>max</Fn>
                  <Paren>
                    <V>x</V>
                    <Sep />
                    <V>L</V>
                  </Paren>
                  <Sep />
                  <V>U</V>
                </Paren>
              </>,
            ],
            [
              <V key="l">L</V>,
              <>
                <Op>=</Op>
                <V sub="1">Q</V>
                <Op>−</Op>
                <N>1.5</N>
                <Op>·</Op>
                <V>IQR</V>
              </>,
            ],
            [
              <V key="l">U</V>,
              <>
                <Op>=</Op>
                <V sub="3">Q</V>
                <Op>+</Op>
                <N>1.5</N>
                <Op>·</Op>
                <V>IQR</V>
              </>,
            ],
          ]}
        />
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
      where: t('pipeline.where.minmax'),
      applies: t('pipeline.appliesMinmax', { custom: s.custom, range: s.range, dec: s.decrease }),
      formula: (
        <Aligned
          rows={[
            [
              <V key="l">s*</V>,
              <>
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
              </>,
            ],
            [
              <V key="l">s*</V>,
              <>
                <Op>←</Op>
                <N>10</N>
                <Op>−</Op>
                <V>s*</V>
                <span className="pl-2">
                  <Txt>{t('pipeline.where.decrease')}</Txt>
                </span>
              </>,
            ],
            [
              <V key="l">s</V>,
              <>
                <Op>=</Op>
                <Fn>round</Fn>
                <Paren>
                  <Fn>min</Fn>
                  <Paren>
                    <N>10</N>
                    <Sep />
                    <Fn>max</Fn>
                    <Paren>
                      <N>0</N>
                      <Sep />
                      <V>s*</V>
                    </Paren>
                  </Paren>
                  <Sep />
                  <N>1</N>
                </Paren>
              </>,
            ],
          ]}
        />
      ),
    },
    {
      n: 5,
      phase: 'aggregate',
      label: t(`pipeline.steps.5.formula`),
      where: t('pipeline.where.weights'),
      formula: (
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
      ),
    },
    {
      n: 6,
      phase: 'aggregate',
      label: t(`pipeline.steps.6.formula`),
      where: t('pipeline.where.components'),
      formula: (
        <Line>
          <V>c</V>
          <Op>=</Op>
          <Frac num={<N>1</N>} den={<V>m</V>} />
          <BigOp symbol="Σ" below="j" />
          <V sub="j">g</V>
        </Line>
      ),
    },
    {
      n: 7,
      phase: 'aggregate',
      label: t(`pipeline.steps.7.formula`),
      formula: (
        <Aligned
          rows={[
            [
              <V key="l" sub="k">
                y
              </V>,
              <>
                <Op>=</Op>
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
              </>,
            ],
            [
              <V key="l">D</V>,
              <>
                <Op>=</Op>
                <Fn>round</Fn>
                <Paren>
                  <Frac
                    num={
                      <>
                        <N>10</N>
                        <Op>−</Op>
                        <Fn sub="k">geomean</Fn>
                        <Paren>
                          <V sub="k">y</V>
                        </Paren>
                      </>
                    }
                    den={<N>9</N>}
                  />
                  <Op>·</Op>
                  <N>10</N>
                  <Sep />
                  <N>1</N>
                </Paren>
              </>,
            ],
          ]}
        />
      ),
      /* The definition of the geometric mean, set on its own line so its wide left side does not push the
         aligned rows above to the right. */
      extra: (
        <Line>
          <Fn>geomean</Fn>
          <Paren>
            <V sub="1">y</V>
            <Sep />
            <Op>…</Op>
            <Sep />
            <V sub="n">y</V>
          </Paren>
          <Op>=</Op>
          <Paren
            sup={
              <>
                1/<i>n</i>
              </>
            }
          >
            <BigOp symbol="Π" below="k" />
            <V sub="k">y</V>
          </Paren>
        </Line>
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
            <Sep />
            <N>1</N>
          </Paren>
        </Line>
      ),
    },
  ];

  return (
    <DocSection id="pipeline" label={t('sections.pipeline')} title={t('pipeline.title')} lead={t('pipeline.lead')}>
      <P>{t('pipeline.intro')}</P>

      {PHASES.map((phase) => (
        <div key={phase} className="mt-14">
          <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-foreground/25 pb-2 text-base font-semibold">
            {t(`pipeline.phase.${phase}`)}
            <span className="text-sm font-normal text-muted-foreground">{t(`pipeline.phase.${phase}Hint`)}</span>
          </h3>
          <ol>
            {steps
              .filter((step) => step.phase === phase)
              .map((step) => (
                <li key={step.n} className="border-b border-border py-8 last:border-b-0 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-6">
                  <span className="num hidden font-display text-[1.75rem] leading-none text-muted-foreground sm:block" aria-hidden>
                    {step.n}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold sm:text-[1.05rem]">
                      {/* On phones the number sits inline with the title, so the formula gets the full width. */}
                      <span className="num mr-2 font-display text-lg font-normal text-muted-foreground sm:sr-only">
                        {step.n}
                        <span className="sr-only">.</span>
                      </span>
                      {t(`pipeline.steps.${step.n}.title`)}
                    </h4>
                    <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted-foreground">{t(`pipeline.steps.${step.n}.body`)}</p>
                    <Formula label={step.label} className="mt-5" where={step.where} caption={step.applies} tag={step.n}>
                      {step.formula}
                      {step.extra}
                    </Formula>
                  </div>
                </li>
              ))}
          </ol>
        </div>
      ))}
    </DocSection>
  );
}
