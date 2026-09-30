/**
 * Capacity on the ground: facility counts as a full-width row of key figures (with per-capita rates),
 * then the three disaster-risk-reduction arrangements - as columns separated by vertical rules when
 * any district has a record, or as one short ruled definition list when nothing is recorded yet (the
 * lead already says so; three "Not recorded" columns would only repeat it).
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
const DRR_KEYS = ['eprp', 'aa', 'eocc'] as const;

/** One arrangement's recorded status (only rendered when at least one district has a record). */
function DrrItem({ k, info, className }: { k: (typeof DRR_KEYS)[number]; info: ServicesInfo; className?: string }) {
  const { t } = useTranslation(['area', 'common']);
  const aggregate = info.basis === 'aggregate';
  const n = info.drr[k];
  const recorded = info.drr.recorded;

  const status: 'yes' | 'no' | 'partial' = !aggregate ? (n ? 'yes' : 'no') : n === recorded ? 'yes' : n === 0 ? 'no' : 'partial';
  const Icon = status === 'yes' ? CircleCheck : status === 'no' ? CircleX : CircleDashed;
  const tone = status === 'yes' ? 'text-success' : status === 'no' ? 'text-danger' : 'text-muted-foreground';

  return (
    <li className={cn('py-5 md:py-0', className)}>
      <div className="text-sm text-muted-foreground">{t(`services.drr.${k}.abbr`)}</div>
      <h4 className="mt-1 text-base leading-snug font-semibold">{t(`services.drr.${k}.name`)}</h4>
      <div className={cn('mt-3 flex items-center gap-2 text-sm font-medium', tone)}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {aggregate ? t('services.drr.countOf', { n, total: recorded }) : n ? t('services.drr.inPlace') : t('services.drr.notInPlace')}
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
              ? t('services.drrLeadAggregate', { recorded: info.drr.recorded, total: info.districts })
              : info.drr.recorded
                ? t('services.drrLead')
                : t('services.drrLeadNone')
          }
        />
        {info.drr.recorded > 0 ? (
          <ul className="mt-6 grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0 md:py-6 print:grid-cols-3 print:divide-x print:divide-y-0">
            {DRR_KEYS.map((k, i) => (
              <DrrItem key={k} k={k} info={info} className={i === 0 ? 'md:pr-8' : i === 1 ? 'md:px-8' : 'md:pl-8'} />
            ))}
          </ul>
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
