/**
 * The Advancement layer for this area: what the Tanzanian sub-indicator baskets would change, shown
 * beside the Core and never in its place. Left: Core → Advancement for risk and the three dimensions,
 * with the cautions that apply. Right: each exploded hazard group with its lineage (the workbook member
 * and every sub-indicator used, with value, score and level).
 */
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Note } from '@/components/layout/Page';
import { formatRaw, LevelTag } from '@/components/risk/Provenance';
import { Button } from '@/components/ui/button';
import { useAdvancedModel, useAdvancementInputs } from '@/data-layer/DataProvider';
import { ADVANCEMENT_BASKETS, advancementCoverage, advancementDelta, weightOf, type LeafDelta } from '@/engine/risk/advanced';
import { DIMENSION_KEYS } from '@/engine/risk/hierarchy';
import { ADVANCED_SPECS, SPECS } from '@/engine/risk/standardise';
import { cn, formatScore, NO_VALUE } from '@/lib/utils';
import { delta, formatDelta, type AreaView } from '../lib';
import { SubHeading } from './bits';

function DeltaCell({ core, adv }: { core: number | null; adv: number | null }) {
  const d = delta(adv, core);
  if (d == null) return <span className="text-muted-foreground">{NO_VALUE}</span>;
  return <span className={cn('num font-semibold', d > 0 ? 'text-danger' : d < 0 ? 'text-success' : 'text-muted-foreground')}>{formatDelta(d)}</span>;
}

/** One exploded hazard group: Core and Advancement values, then (councils) the members behind the value. */
function LeafRow({ leaf, lang, council }: { leaf: LeafDelta; lang: string; council: boolean }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { basket, core, advanced, stamp } = leaf;
  const members = stamp?.inputs?.filter((i) => i.level !== 'baseline') ?? [];
  const coreMember = stamp?.inputs?.find((i) => i.level === 'baseline') ?? null;
  return (
    <li className="py-4">
      <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_3.5rem] items-baseline gap-x-3">
        <div className="min-w-0">
          <span className="font-medium">{t(`indicators:${basket.key}`)}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {council ? t('advancement.basket', { filled: members.length, total: basket.members.length }) : t('advancement.basketAggregate')}
          </span>
        </div>
        <span className="num text-right text-sm text-muted-foreground">{formatScore(core)}</span>
        <span className="num text-right text-sm font-semibold">{formatScore(advanced)}</span>
        <span className="text-right">
          <DeltaCell core={core} adv={advanced} />
        </span>
      </div>
      {council && stamp && (
        <table className="mt-3 w-full text-xs">
          <caption className="sr-only">{t('advancement.lineage', { group: t(`indicators:${basket.key}`) })}</caption>
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                {t('advancement.col.input')}
              </th>
              <th scope="col" className="num py-1.5 px-3 text-right font-medium">
                {t('advancement.col.value')}
              </th>
              <th scope="col" className="num py-1.5 px-3 text-right font-medium">
                {t('advancement.col.score')}
              </th>
              <th scope="col" className="num py-1.5 pl-3 text-right font-medium">
                {t('advancement.col.weight')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {coreMember && (
              <tr className="align-top">
                <td className="py-1.5 pr-3">
                  <span className="text-foreground">{SPECS[coreMember.specId]?.name ?? coreMember.specId}</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    <LevelTag level="baseline" className="mr-1.5" />
                    {t('advancement.workbookMember')}
                  </span>
                </td>
                <td className="num px-3 py-1.5 text-right text-muted-foreground">{NO_VALUE}</td>
                <td className="num px-3 py-1.5 text-right">{formatScore(coreMember.score)}</td>
                <td className="num py-1.5 pl-3 text-right">{basket.workbook.length.toFixed(2)}</td>
              </tr>
            )}
            {members.map((m) => {
              const spec = ADVANCED_SPECS[m.specId];
              return (
                <tr key={m.specId} className="align-top">
                  <td className="py-1.5 pr-3">
                    <span className="text-foreground">{spec?.name ?? m.specId}</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      <LevelTag level={m.level} className="mr-1.5" />
                      {m.dataset}
                    </span>
                  </td>
                  <td className="num px-3 py-1.5 text-right whitespace-nowrap">
                    {formatRaw(m.raw, lang)}
                    {spec?.unit && <span className="ml-1 text-muted-foreground">{spec.unit}</span>}
                  </td>
                  <td className="num px-3 py-1.5 text-right">{formatScore(m.score)}</td>
                  <td className="num py-1.5 pl-3 text-right">{spec ? weightOf(spec).toFixed(2) : NO_VALUE}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {council && !stamp && <p className="mt-2 text-xs text-muted-foreground">{t('advancement.noInputs')}</p>}
    </li>
  );
}

export function Advancement({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const { unit, model } = view;
  const advanced = useAdvancedModel();
  const inputs = useAdvancementInputs();
  const d = React.useMemo(() => (advanced ? advancementDelta(model, advanced, unit.id) : null), [advanced, model, unit.id]);

  if (unit.level === 'source') return <Note>{t('advancement.notForUnits')}</Note>;
  if (!advanced || !inputs || !d)
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('advancement.loading')}
      </p>
    );

  const cov = advancementCoverage(inputs);
  const council = unit.level === 'council';
  const rows = [
    { key: 'risk', label: t('common:informRisk'), core: d.risk.core, adv: d.risk.advanced },
    ...DIMENSION_KEYS.map((k) => ({ key: k, label: t(`common:dimensions.${k}`), core: d.dims[k].core, adv: d.dims[k].advanced })),
  ];

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-0 lg:divide-x lg:divide-border print:grid-cols-1">
      <div className="lg:pr-12 xl:pr-16">
        <p className="font-display text-xl leading-snug text-pretty sm:text-2xl">
          {d.changed ? t('advancement.headline', { core: formatScore(d.risk.core), adv: formatScore(d.risk.advanced) }) : t('advancement.noChange')}
        </p>
        <table className="mt-6 w-full text-sm">
          <caption className="sr-only">{t('advancement.dims')}</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="py-2.5 pr-3 text-left font-medium">
                {t('advancement.col.measure')}
              </th>
              <th scope="col" className="num px-3 py-2.5 text-right font-medium">
                {t('advancement.col.core')}
              </th>
              <th scope="col" className="num px-3 py-2.5 text-right font-medium">
                {t('advancement.col.adv')}
              </th>
              <th scope="col" className="num py-2.5 pl-3 text-right font-medium">
                {t('advancement.col.delta')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                  {r.label}
                </th>
                <td className="num px-3 py-2.5 text-right text-muted-foreground">{formatScore(r.core)}</td>
                <td className="num px-3 py-2.5 text-right font-semibold">{formatScore(r.adv)}</td>
                <td className="py-2.5 pl-3 text-right">
                  <DeltaCell core={r.core} adv={r.adv} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!council && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('advancement.aggregate')}</p>}

        <Note className="mt-8">
          <p className="font-medium text-foreground">{t('advancement.notes.title')}</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t('advancement.notes.core')}</li>
            <li>{t('advancement.notes.intensity')}</li>
            <li>{t('advancement.notes.ranges', { councils: model.councils.length })}</li>
            <li>{t('advancement.notes.district')}</li>
            <li>{t('advancement.notes.coverage', { filled: cov.filled, total: cov.total, release: inputs.release })}</li>
          </ul>
        </Note>
        <Button variant="outline" className="no-print mt-8" asChild>
          <Link to="/methodology/structure">
            {t('advancement.link')} <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="lg:pl-12 xl:pl-16">
        <SubHeading id="advancement-leaves" title={t('advancement.leaves')} lead={council ? t('advancement.leavesLead') : t('advancement.leavesLeadAggregate', { count: ADVANCEMENT_BASKETS.length })} />
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_3.5rem] gap-x-3 border-b border-border pb-2 text-[11px] text-muted-foreground" aria-hidden>
          <span>{t('advancement.col.group')}</span>
          <span className="text-right">{t('advancement.col.core')}</span>
          <span className="text-right">{t('advancement.col.adv')}</span>
          <span className="text-right">{t('advancement.col.delta')}</span>
        </div>
        <ul className="divide-y divide-border border-b border-border">
          {d.leaves.map((l) => (
            <LeafRow key={l.basket.ref} leaf={l} lang={i18n.language} council={council} />
          ))}
        </ul>
      </div>
    </div>
  );
}
