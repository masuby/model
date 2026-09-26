import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ADVANCED_COUNT, BASKETS, findAuthority, isDecrease, weightOf, type Basket } from '../data';
import { BigOp, Callout, DocSection, Formula, Frac, Line, Op, P, SubHeading, V } from '../ui';

const basketId = (b: Basket) => `basket-${b.component.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

/**
 * One basket as a row group of the baskets table: a header row (a disclosure button with the basket's
 * name, its size and the workbook indicator it joins) followed by one row per sub-indicator. Collapsed
 * rows stay in the DOM (hidden), so the printed page still lists every sub-indicator.
 */
function BasketRows({ basket, open, onToggle }: { basket: Basket; open: boolean; onToggle: (component: string) => void }) {
  const { t } = useTranslation(['methodology', 'indicators']);
  const id = basketId(basket);
  const name = basket.leaf ? t(`indicators:${basket.leaf.indicator.key}`) : basket.component;
  const rowIds = basket.members.map((m) => `${id}-${m.id}`);
  return (
    <tbody className="border-t border-border">
      <tr>
        <th colSpan={4} scope="rowgroup" className="p-0 text-left font-normal">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={rowIds.join(' ')}
            onClick={() => onToggle(basket.component)}
            className="group flex w-full items-start gap-3 py-3.5 text-left transition-colors duration-150"
          >
            <ChevronDown className={cn('mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150', !open && '-rotate-90')} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-semibold group-hover:text-primary">{name}</span>
                <span className="num text-xs text-muted-foreground">{t('methodology:advanced.members', { count: basket.members.length })}</span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {t('methodology:advanced.workbookLine')} {basket.workbook.length ? basket.workbook.map((s) => s.name).join(' · ') : t('methodology:advanced.noWorkbook')}
              </span>
            </span>
          </button>
        </th>
      </tr>
      {basket.members.map((m, i) => {
        const authority = findAuthority(m.sector);
        const lead = (
          <>
            <span className="font-medium text-foreground/85" title={authority?.full}>
              {m.sector}
            </span>
            {m.unit && <span> · {m.unit}</span>}
          </>
        );
        return (
          <tr key={m.id} id={rowIds[i]} className={cn('align-top', open ? 'border-t border-border/70' : 'hidden print:table-row')}>
            <td className="py-2.5 pr-4 pl-7">
              <span className="text-sm">{m.name}</span>
              {isDecrease(m) && <span className="ml-1.5 text-xs text-muted-foreground">({t('methodology:chips.inverted')})</span>}
              {/* Phones: lead, unit and basis sit under the name instead of in their own columns. */}
              <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{lead}</span>
              {m.basis && <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground md:hidden">{m.basis}</span>}
            </td>
            <td className="hidden px-4 py-2.5 text-xs leading-relaxed text-muted-foreground md:table-cell">{lead}</td>
            <td className="hidden px-4 py-2.5 md:table-cell">
              <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground" title={m.basis ?? undefined}>
                {m.basis ?? '—'}
              </span>
            </td>
            <td className="num py-2.5 pl-4 text-right text-[13px] font-semibold">{weightOf(m).toFixed(2)}</td>
          </tr>
        );
      })}
    </tbody>
  );
}

export function AdvancedSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const [open, setOpen] = React.useState<ReadonlySet<string>>(() => new Set(BASKETS.slice(0, 1).map((b) => b.component)));
  const toggle = React.useCallback(
    (component: string) =>
      setOpen((prev) => {
        const next = new Set(prev);
        if (!next.delete(component)) next.add(component);
        return next;
      }),
    [],
  );
  const allOpen = open.size === BASKETS.length;

  /** Where the baskets sit in the hierarchy, stated once ("Hazard · Natural hazards"). */
  const where = React.useMemo(
    () => [...new Set(BASKETS.flatMap((b) => (b.leaf ? [`${t(`common:dimensions.${b.leaf.dimension.key}Short`)} · ${t(`common:categories.${b.leaf.category.key}`)}`] : [])))].join(', '),
    [t],
  );

  return (
    <DocSection id="advanced" label={t('sections.advanced')} title={t('advanced.title')} lead={t('advanced.lead', { groups: BASKETS.length, n: ADVANCED_COUNT })}>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-5">
          <P>{t('advanced.p1')}</P>
          <P>{t('advanced.how')}</P>
        </div>
        <div className="space-y-8">
          <Formula label={t('advanced.formulaLabel')} where={t('advanced.weights')} caption={t('advanced.formulaCaption')}>
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
          </Formula>
          <Callout title={t('advanced.degradeTitle')}>{t('advanced.degrade')}</Callout>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SubHeading id="advanced-baskets">{t('advanced.basketsTitle', { groups: BASKETS.length, n: ADVANCED_COUNT })}</SubHeading>
          <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{t('advanced.basketsLead', { groups: BASKETS.length, where })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(new Set(allOpen ? [] : BASKETS.map((b) => b.component)))} className="no-print self-start sm:self-auto">
          <ChevronsUpDown /> {allOpen ? t('structure.collapseAll') : t('structure.expandAll')}
        </Button>
      </div>

      <table aria-labelledby="advanced-baskets" className="mt-6 w-full border-collapse text-sm">
        <colgroup>
          <col />
          <col className="md:w-[11rem]" />
          <col className="md:w-[40%]" />
          <col className="w-[4.5rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2.5 pr-4 pl-7 font-medium">
              {t('advanced.col.name')}
            </th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
              {t('advanced.col.lead')}
            </th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
              {t('advanced.col.basis')}
            </th>
            <th scope="col" className="py-2.5 pl-4 text-right font-medium">
              {t('advanced.col.weight')}
            </th>
          </tr>
        </thead>
        {BASKETS.map((b) => (
          <BasketRows key={b.component} basket={b} open={open.has(b.component)} onToggle={toggle} />
        ))}
      </table>
      <div className="mt-8 border-t border-border pt-4">
        <p className="max-w-[72ch] text-[13px] leading-relaxed text-muted-foreground">{t('advanced.status')}</p>
      </div>
    </DocSection>
  );
}
