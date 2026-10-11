/**
 * Capacity on the ground: facility counts as a full-width row of key figures (with per-capita rates),
 * then the disaster-risk-reduction arrangements (the five the engine scores, and anticipatory action) and
 * the committee criteria - as ruled columns when any council has a record, or as one short ruled
 * definition list when nothing is recorded yet (the lead already says so).
 */
import { CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { KeyFigures, Note } from '@/components/layout/Page';
import { Progress } from '@/components/ui/primitives';
import type { Facilities } from '@/engine/risk/types';
import { cn, formatNumber } from '@/lib/utils';
import { per10k, servicesFor, type AreaView, type ServicesInfo } from '../lib';
import { SubHeading } from './bits';

const FACILITIES: ReadonlyArray<keyof Facilities> = ['health', 'education', 'water', 'boreholes'];
const DRR_KEYS = ['eprp', 'rvca', 'ert', 'eocc', 'training', 'aa'] as const;
const COMMITTEE_KEYS = ['committee', 'stakeholders', 'involvement'] as const;

/** One arrangement's recorded status (only rendered when at least one council has a record). */
function DrrItem({ k, info, className }: { k: (typeof DRR_KEYS)[number] | (typeof COMMITTEE_KEYS)[number]; info: ServicesInfo; className?: string }) {
  const { t } = useTranslation(['area', 'common']);
  const aggregate = info.basis === 'aggregate';
  const n = info.drr[k];
  const recorded = info.drr.recorded;

  const flag = info.drr.flags?.[k];
  const status: 'yes' | 'no' | 'partial' | 'unknown' = !aggregate ? (flag === true ? 'yes' : flag === false ? 'no' : 'unknown') : n === recorded ? 'yes' : n === 0 ? 'no' : 'partial';
  const Icon = status === 'yes' ? CircleCheck : status === 'no' ? CircleX : CircleDashed;
  const tone = status === 'yes' ? 'text-success' : status === 'no' ? 'text-danger' : 'text-muted-foreground';

  return (
    <li className={cn('py-5 md:py-0', className)}>
      <div className="text-sm text-muted-foreground">{t(`services.drr.${k}.abbr`)}</div>
      <h4 className="mt-1 text-base leading-snug font-semibold">{t(`services.drr.${k}.name`)}</h4>
      <div className={cn('mt-3 flex items-center gap-2 text-sm font-medium', tone)}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {aggregate ? t('services.drr.countOf', { n, total: recorded }) : status === 'yes' ? t('services.drr.inPlace') : status === 'no' ? t('services.drr.notInPlace') : t('services.drr.notRecorded')}
      </div>
      {aggregate && (
        <Progress
          value={(n / recorded) * 100}
          label={t('services.drr.progressLabel', { abbr: t(`services.drr.${k}.abbr`), n, total: recorded })}
          className="mt-2.5 h-1 rounded-none"
          indicatorClassName="rounded-none bg-success"
        />
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`services.drr.${k}.desc`)}</p>
    </li>
  );
}

export function Services({ view }: { view: AreaView }) {
  const { t, i18n } = useTranslation(['area', 'common']);
  const { unit, model } = view;
  const lang = i18n.language;
  const info = React.useMemo(() => servicesFor(model, unit), [model, unit]);
  const nat = React.useMemo(() => servicesFor(model, model.national), [model]);
  const isNational = unit.level === 'national';

  const basis =
    info.basis === 'self' ? (
      t('services.basis.self')
    ) : info.basis === 'source' ? (
      <>
        {t('services.basis.source', { count: info.sharedBy ?? 1 })}{' '}
        {info.sourceId && (
          <Link to={`/area/${info.sourceId}`} className="font-medium text-primary underline-offset-4 hover:underline">
            {info.sourceName}
          </Link>
        )}
      </>
    ) : (
      t('services.basis.aggregate', { count: info.districts, with: info.withFacilities })
    );

  const figures = info.facilities
    ? FACILITIES.map((key) => {
        const value = info.facilities![key];
        const rate = per10k(value, info.population);
        const natRate = per10k(nat.facilities?.[key], nat.population);
        return {
          label: t(`services.facilities.${key}`),
          value: formatNumber(value, lang),
          sub:
            rate != null ? (
              <>
                <span className="num text-foreground">{formatNumber(rate, lang)}</span> {t('services.per10k')}
                {!isNational && natRate != null && (
                  <span className="block">
                    {t('services.national')} <span className="num">{formatNumber(natRate, lang)}</span>
                  </span>
                )}
              </>
            ) : undefined,
        };
      })
    : null;

  return (
    <div className="grid gap-16">
      <div>
        <SubHeading title={t('services.facilitiesTitle')} lead={basis} />
        {figures ? (
          <KeyFigures className="mt-8 border-t border-border pt-6 [&_dd:first-of-type]:text-[1.75rem] lg:[&_dd:first-of-type]:text-[2.1rem]" items={figures} />
        ) : (
          <Note className="mt-6">{t('services.noFacilities')}</Note>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t('services.facilitiesSource')}</p>
      </div>

      <div className="print:break-inside-avoid">
        <SubHeading
          title={t('services.drrTitle')}
          lead={
            info.basis === 'aggregate'
              ? t('services.drrLeadAggregate', { recorded: info.drr.recorded, total: info.drr.total })
              : info.drr.recorded
                ? t('services.drrLead')
                : t('services.drrLeadNone')
          }
        />
        {info.drr.recorded > 0 ? (
          <>
            <ul className="mt-6 grid divide-y divide-border border-y border-border md:grid-cols-2 md:gap-x-10 xl:grid-cols-3 xl:gap-x-10">
              {DRR_KEYS.map((k) => (
                <DrrItem key={k} k={k} info={info} />
              ))}
            </ul>
            <h3 className="mt-8 text-sm font-semibold">{t('services.committeeTitle')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('services.committeeLead')}</p>
            <ul className="mt-4 grid divide-y divide-border border-y border-border md:grid-cols-3 md:gap-x-10">
              {COMMITTEE_KEYS.map((k) => (
                <DrrItem key={k} k={k} info={info} />
              ))}
            </ul>
          </>
        ) : (
          <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
            {DRR_KEYS.map((k) => (
              <div key={k} className="grid gap-x-8 gap-y-1 py-3.5 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                <dt className="font-medium">
                  {t(`services.drr.${k}.name`)} <span className="font-normal text-muted-foreground">({t(`services.drr.${k}.abbr`)})</span>
                </dt>
                <dd className="leading-relaxed text-muted-foreground">{t(`services.drr.${k}.desc`)}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t('services.drrSource')}</p>
      </div>
    </div>
  );
}
