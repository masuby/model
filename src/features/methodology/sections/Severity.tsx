import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEVERITY_CATEGORY_KEYS, SEVERITY_COLORS, SEVERITY_MODEL, SEVERITY_WEIGHTS, type SeverityDimensionKey } from '@/engine/severity/definitions';
import { fractionLabel } from '../data';
import { Aligned, Callout, DocSection, Fn, Formula, Frac, Line, N, Op, P, Paren, Sep, SubHeading, V } from '../ui';

/** The weight a dimension carries in the final formula: inside G for impact/conditions, linear for complexity. */
function dimensionWeightLabel(id: SeverityDimensionKey): string {
  const w = SEVERITY_WEIGHTS;
  return `w = ${fractionLabel(id === 'complexity' ? w.complexity : w.impactVsConditions[id])}`;
}

export function SeveritySection() {
  const { t } = useTranslation(['methodology', 'common']);
  const w = SEVERITY_WEIGHTS;

  return (
    <DocSection id="severity" label={t('sections.severity')} title={t('severity.title')} lead={t('severity.lead')}>
      <P>{t('severity.p1')}</P>

      <Formula className="mt-8" label={t('severity.formulaLabel')} caption={t('severity.formulaCaption')}>
        {/* Broken after the "+" so it fits a phone without scrolling. */}
        <Aligned
          rows={[
            [
              <V key="l">{t('vars.severity')}</V>,
              <>
                <Op>=</Op>
                <N>{w.geo.toFixed(1)}</N>
                <Op>×</Op>
                <V>G</V>
                <Paren>
                  <V sub={fractionLabel(w.impactVsConditions.impact)}>{t('vars.impact')}</V>
                  <Sep />
                  <V sub={fractionLabel(w.impactVsConditions.conditions)}>{t('vars.conditions')}</V>
                </Paren>
              </>,
            ],
            [
              null,
              <>
                <Op>+</Op>
                <N>{w.complexity.toFixed(1)}</N>
                <Op>×</Op>
                <V>{t('vars.complexity')}</V>
              </>,
            ],
          ]}
        />
      </Formula>

      <div className="mt-12 grid gap-10 xl:grid-cols-3 xl:gap-0 xl:divide-x xl:divide-border xl:border-t xl:border-border">
        {SEVERITY_MODEL.map((dim) => (
          <div key={dim.id} className="border-t border-border pt-5 xl:border-t-0 xl:px-7 xl:first:pl-0 xl:last:pr-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold">{t(`severity.dim.${dim.id}`)}</h3>
              <span className="num shrink-0 text-xs text-muted-foreground">{dimensionWeightLabel(dim.id)}</span>
            </div>
            <ul className="mt-3 divide-y divide-border border-t border-border">
              {dim.categories.map((cat) => (
                <li key={cat.id} className="py-3.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{t(`severity.cat.${cat.id}`)}</span>
                    <span className="num shrink-0 text-xs text-muted-foreground">
                      w = {fractionLabel(cat.weight)} · {t(`severity.agg.${cat.aggregation}`)}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {cat.components.map((c) => (
                      <li key={c.id} className="flex items-baseline justify-between gap-3">
                        <span>{t(`severity.comp.${c.id}`)}</span>
                        <span className="num shrink-0">{t('severity.indicatorCount', { count: c.indicators.length })}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border">
        <div className="lg:pr-10">
          <SubHeading>{t('severity.aggTitle')}</SubHeading>
          <ol className="mt-3 divide-y divide-border border-t border-border text-sm leading-relaxed text-foreground/85">
            {(['normalise', 'average', 'geometric', 'final'] as const).map((k, i) => (
              <li key={k} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 py-2.5">
                <span className="num text-muted-foreground">{i + 1}.</span>
                <span>{t(`severity.steps.${k}`)}</span>
              </li>
            ))}
          </ol>
          <Formula className="mt-5" label={t('severity.gLabel')} caption={t('severity.gCaption')}>
            <Line>
              <V>G</V>
              <Paren>
                <V>x</V>
                <Sep>;</Sep>
                <V>w</V>
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

        <div className="border-t border-border pt-10 lg:border-t-0 lg:pt-0 lg:pl-10">
          <SubHeading>{t('severity.categoriesTitle')}</SubHeading>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('severity.categoriesLead')}</p>
          <div className="mt-4">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t('severity.categoriesTitle')}</caption>
              <thead>
                <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {t('severity.col.score')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    {t('severity.col.level')}
                  </th>
                  <th scope="col" className="py-2 pl-4 font-medium">
                    {t('severity.col.category')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SEVERITY_CATEGORY_KEYS.map((k, i) => {
                  const level = i + 1;
                  const lo = level === 1 ? 0 : level - 1 + 0.1;
                  return (
                    <tr key={k}>
                      <td className="num py-2.5 pr-4 text-[13px]">
                        {lo.toFixed(1)}–{level.toFixed(1)}
                      </td>
                      <td className="num px-4 py-2.5 text-right font-semibold">{level}</td>
                      <td className="py-2.5 pl-4">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: SEVERITY_COLORS[k], color: level <= 3 ? '#1f2937' : '#ffffff' /* levels 4–5 are dark enough for white (≥ 4.5:1) */ }}
                        >
                          {t(`common:classes.${k}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Callout className="mt-8" title={t('severity.reliabilityTitle')}>
            {t('severity.reliability')}
          </Callout>
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <p className="max-w-[72ch] text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/85">{t('severity.citeLabel')}</span> {t('severity.citation')} {t('severity.calibration')}
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
