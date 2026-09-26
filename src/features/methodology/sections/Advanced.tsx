import { Boxes, CircleCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ADVANCED_COUNT, BASKETS, findAuthority, isDecrease, weightOf, type Basket } from '../data';
import { fadeIn } from '../tokens';
import { BigOp, Callout, DocSection, Formula, Frac, Line, Op, P, Txt, V } from '../ui';

function BasketCard({ basket }: { basket: Basket }) {
  const { t } = useTranslation(['methodology', 'indicators', 'common']);
  const leaf = basket.leaf;
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {leaf ? `${t(`common:dimensions.${leaf.dimension.key}Short`)} · ${t(`common:categories.${leaf.category.key}`)}` : basket.component}
        </div>
        <h4 className="mt-0.5 text-base font-bold">{leaf ? t(`indicators:${leaf.indicator.key}`) : basket.component}</h4>
        <div className="mt-1 text-xs text-muted-foreground">
          {t('methodology:advanced.members', { count: basket.members.length })} · {t('methodology:advanced.workbook', { count: basket.workbook.length })}
        </div>
      </div>
      <ul className="flex-1 divide-y divide-border border-t border-border">
        {basket.members.map((m) => {
          const share = basket.totalWeight ? weightOf(m) / basket.totalWeight : 0;
          const authority = findAuthority(m.sector);
          return (
            <li key={m.id} className="px-5 py-2.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium">
                  {m.name}
                  {isDecrease(m) && <span className="ml-1.5 rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground">{t('methodology:chips.inverted')}</span>}
                </span>
                <span className="num shrink-0 font-mono text-xs font-semibold">{weightOf(m).toFixed(2)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${share * 100}%` }} />
              </div>
              <div className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground/75" title={authority?.full}>
                  {m.sector}
                </span>
                {m.unit && <span> · {m.unit}</span>}
                {m.basis && <span className="line-clamp-2"> {m.basis}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className={cn('border-t border-border bg-muted/40 px-5 py-2.5 text-[11px] text-muted-foreground')}>
        <span className="font-semibold text-foreground/80">{t('methodology:advanced.workbookLine')}</span>{' '}
        {basket.workbook.length ? basket.workbook.map((s) => s.name).join(' · ') : t('methodology:advanced.noWorkbook')}
      </div>
    </Card>
  );
}

export function AdvancedSection() {
  const { t } = useTranslation('methodology');
  return (
    <DocSection
      id="advanced"
      number="07"
      eyebrow={t('sections.advanced')}
      title={t('advanced.title')}
      lead={t('advanced.lead', { groups: BASKETS.length, n: ADVANCED_COUNT })}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <P>{t('advanced.p1')}</P>
          <P>{t('advanced.how')}</P>
        </div>
        <div className="space-y-4">
          <Formula label={t('advanced.formulaLabel')} caption={t('advanced.formulaCaption')}>
            <Line>
              <V>g</V>
              <Op>=</Op>
              <Frac
                num={
                  <>
                    <BigOp symbol="Σ" below="i ∈ data" />
                    <V sub="i">w</V>
                    <V sub="i">s</V>
                  </>
                }
                den={
                  <>
                    <BigOp symbol="Σ" below="i ∈ data" />
                    <V sub="i">w</V>
                  </>
                }
              />
            </Line>
            <Line>
              <Txt>{t('advanced.weights')}</Txt>
            </Line>
          </Formula>
          <Callout tone="tip" title={t('advanced.degradeTitle')}>
            <span className="flex items-start gap-2">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>{t('advanced.degrade')}</span>
            </span>
          </Callout>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-2">
        <Boxes className="size-4 text-primary" aria-hidden />
        <h3 className="text-base font-bold">{t('advanced.basketsTitle', { groups: BASKETS.length, n: ADVANCED_COUNT })}</h3>
      </div>
      <p className="mt-1 max-w-[72ch] text-sm text-muted-foreground">{t('advanced.basketsLead')}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {BASKETS.map((b, i) => (
          <motion.div key={b.component} {...fadeIn} transition={{ ...fadeIn.transition, delay: (i % 3) * 0.05 }}>
            <BasketCard basket={b} />
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('advanced.status')}</p>
    </DocSection>
  );
}
