import { ArrowRight, ShieldQuestion } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_MODEL, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { cn } from '@/lib/utils';
import { fractionLabel } from '../data';
import { fadeIn } from '../tokens';
import { Callout, DocSection, Fn, Formula, Frac, Line, N, Op, P, Paren, V } from '../ui';

const DIM_STYLE: Record<SeverityDimensionKey, string> = {
  impact: 'border-rose-500/35 bg-rose-500/[0.06]',
  conditions: 'border-orange-500/35 bg-orange-500/[0.06]',
  complexity: 'border-violet-500/35 bg-violet-500/[0.06]',
};
const DIM_TEXT: Record<SeverityDimensionKey, string> = {
  impact: 'text-rose-700 dark:text-rose-300',
  conditions: 'text-orange-700 dark:text-orange-300',
  complexity: 'text-violet-700 dark:text-violet-300',
};

/** The weight a dimension carries in the final formula: inside G for impact/conditions, linear for complexity. */
function dimensionWeightLabel(id: SeverityDimensionKey): string {
  const w = SEVERITY_WEIGHTS;
  return `w = ${fractionLabel(id === 'complexity' ? w.complexity : w.impactVsConditions[id])}`;
}

export function SeveritySection() {
  const { t } = useTranslation(['methodology', 'common']);
  const w = SEVERITY_WEIGHTS;

  return (
    <DocSection id="severity" number="08" eyebrow={t('sections.severity')} title={t('severity.title')} lead={t('severity.lead')}>
      <P>{t('severity.p1')}</P>

      <Formula className="mt-6" label={t('severity.formulaLabel')} caption={t('severity.formulaCaption')}>
        <Line className="text-[1.1em]">
          <V>{t('vars.severity')}</V>
          <Op>=</Op>
          <N>{w.geo.toFixed(1)}</N>
          <Op>×</Op>
          <V>G</V>
          <Paren>
            <V sub={fractionLabel(w.impactVsConditions.impact)}>{t('vars.impact')}</V>, <V sub={fractionLabel(w.impactVsConditions.conditions)}>{t('vars.conditions')}</V>
          </Paren>
          <Op>+</Op>
          <N>{w.complexity.toFixed(1)}</N>
          <Op>×</Op>
          <V>{t('vars.complexity')}</V>
        </Line>
      </Formula>

      <div className="mt-8 grid gap-4 xl:grid-cols-3">
        {SEVERITY_MODEL.map((dim, i) => (
          <motion.div key={dim.id} {...fadeIn} transition={{ ...fadeIn.transition, delay: i * 0.05 }}>
            <Card className={cn('h-full border p-5', DIM_STYLE[dim.id])}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-xs font-bold tracking-[0.12em] uppercase', DIM_TEXT[dim.id])}>{t(`severity.dim.${dim.id}`)}</span>
                <span className="num rounded-full bg-card px-2 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-border">{dimensionWeightLabel(dim.id)}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {dim.categories.map((cat) => (
                  <li key={cat.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold">{t(`severity.cat.${cat.id}`)}</span>
                      <span className="num font-mono text-[11px] text-muted-foreground">
                        w = {fractionLabel(cat.weight)} · {t(`severity.agg.${cat.aggregation}`)}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {cat.components.map((c) => (
                        <li key={c.id} className="flex items-baseline justify-between gap-2">
                          <span>{t(`severity.comp.${c.id}`)}</span>
                          <span className="num shrink-0">{t('severity.indicatorCount', { count: c.indicators.length })}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-bold">{t('severity.aggTitle')}</h3>
          <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/85">
            {(['normalise', 'average', 'geometric', 'final'] as const).map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="num mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                <span>{t(`severity.steps.${k}`)}</span>
              </li>
            ))}
          </ol>
          <Formula className="mt-4" label={t('severity.gLabel')} caption={t('severity.gCaption')}>
            <Line>
              <V>G</V>
              <Paren>
                <V>x</V>; <V>w</V>
              </Paren>
              <Op>=</Op>
              <N>5</N>
              <Op>−</Op>
              <Frac
                num={
                  <>
                    <Fn>exp</Fn>
                    <Paren>
                      <Frac
                        num={
                          <>
                            <span className="text-[1.2em]">Σ</span>
                            <V sub="i">w</V>
                            <Fn>ln</Fn>
                            <V sub="i">y</V>
                          </>
                        }
                        den={
                          <>
                            <span className="text-[1.2em]">Σ</span>
                            <V sub="i">w</V>
                          </>
                        }
                      />
                    </Paren>
                    <Op>−</Op>
                    <N>1</N>
                  </>
                }
                den={<N>4</N>}
              />
              <Op>·</Op>
              <N>5</N>
            </Line>
            <Line>
              <V sub="i">y</V>
              <Op>=</Op>
              <Frac
                num={
                  <>
                    <Paren>
                      <N>5</N>
                      <Op>−</Op>
                      <V sub="i">x</V>
                    </Paren>
                    <Op>·</Op>
                    <N>4</N>
                  </>
                }
                den={<N>5</N>}
              />
              <Op>+</Op>
              <N>1</N>
            </Line>
          </Formula>
        </div>

        <div>
          <h3 className="text-base font-bold">{t('severity.categoriesTitle')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('severity.categoriesLead')}</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t('severity.categoriesTitle')}</caption>
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2 font-semibold">
                    {t('severity.col.score')}
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    {t('severity.col.level')}
                  </th>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    {t('severity.col.category')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {SEVERITY_CATEGORY_KEYS.map((k, i) => {
                  const level = i + 1;
                  const lo = level === 1 ? 0 : level - 1 + 0.1;
                  return (
                    <tr key={k} className="border-b border-border last:border-b-0">
                      <td className="num px-4 py-2 font-mono text-[13px]">
                        {lo.toFixed(1)}–{level.toFixed(1)}
                      </td>
                      <td className="num px-4 py-2 font-semibold">{level}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: SEVERITY_COLORS[k], color: level <= 3 ? '#1f2937' : '#ffffff' }}>
                          {t(`common:classes.${k}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Callout tone="note" className="mt-4" title={t('severity.reliabilityTitle')}>
            <span className="flex items-start gap-2">
              <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{t('severity.reliability')}</span>
            </span>
          </Callout>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[72ch] text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/80">{t('severity.citeLabel')}</span> {t('severity.citation')} {t('severity.calibration')}
        </p>
        <Button variant="outline" asChild className="shrink-0">
          <Link to="/severity">
            {t('severity.open')} <ArrowRight />
          </Link>
        </Button>
      </div>
    </DocSection>
  );
}
