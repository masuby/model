import { CircleCheck, CircleDashed, CircleX, Droplets, GraduationCap, HeartPulse, Waves } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/primitives';
import type { Facilities } from '@/engine/risk/types';
import { cn, formatNumber } from '@/lib/utils';
import { per10k, servicesFor, type AreaView, type ServicesInfo } from '../lib';
import { Reveal } from './bits';

const TILES: Array<{ key: keyof Facilities; icon: React.ComponentType<{ className?: string }>; tint: string }> = [
  { key: 'health', icon: HeartPulse, tint: 'bg-danger/10 text-danger' },
  { key: 'education', icon: GraduationCap, tint: 'bg-primary/10 text-primary' },
  { key: 'water', icon: Droplets, tint: 'bg-success/12 text-success' },
  { key: 'boreholes', icon: Waves, tint: 'bg-warning/12 text-warning' },
];

const DRR_KEYS = ['eprp', 'aa', 'eocc'] as const;

function DrrItem({ k, info }: { k: (typeof DRR_KEYS)[number]; info: ServicesInfo }) {
  const { t } = useTranslation(['area', 'common']);
  const aggregate = info.basis === 'aggregate';
  const n = info.drr[k];
  const recorded = info.drr.recorded;

  let status: 'yes' | 'no' | 'unknown' | 'partial';
  if (!recorded) status = 'unknown';
  else if (!aggregate) status = n ? 'yes' : 'no';
  else status = n === recorded ? 'yes' : n === 0 ? 'no' : 'partial';
  const Icon = status === 'yes' ? CircleCheck : status === 'no' ? CircleX : CircleDashed;
  const tone = status === 'yes' ? 'text-success' : status === 'no' ? 'text-danger' : 'text-muted-foreground';

  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <Icon className={cn('mt-0.5 size-5 shrink-0', tone)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-semibold">
            {t(`services.drr.${k}.name`)} <span className="text-xs font-medium text-muted-foreground">({t(`services.drr.${k}.abbr`)})</span>
          </span>
          <span className={cn('text-xs font-semibold', tone)}>
            {!recorded
              ? t('services.drr.notRecorded')
              : aggregate
                ? t('services.drr.countOf', { n, total: recorded })
                : n
                  ? t('services.drr.inPlace')
                  : t('services.drr.notInPlace')}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`services.drr.${k}.desc`)}</p>
        {aggregate && recorded > 0 && <Progress value={(n / recorded) * 100} className="mt-2 h-1.5" indicatorClassName="bg-success" />}
      </div>
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
          <Link to={`/area/${info.sourceId}`} className="font-semibold text-primary underline-offset-4 hover:underline">
            {info.sourceName}
          </Link>
        )}
      </>
    ) : (
      t('services.basis.aggregate', { count: info.districts, with: info.withFacilities })
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] print:grid-cols-1">
      <Reveal>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">{t('services.facilitiesTitle')}</CardTitle>
            <CardDescription>{basis}</CardDescription>
          </CardHeader>
          <CardContent>
            {info.facilities ? (
              <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-4">
                {TILES.map(({ key, icon: Icon, tint }) => {
                  const value = info.facilities![key];
                  const rate = per10k(value, info.population);
                  const natRate = per10k(nat.facilities?.[key], nat.population);
                  return (
                    <div key={key} className="rounded-2xl border border-border bg-background/40 p-4 print:break-inside-avoid">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{t(`services.facilities.${key}`)}</span>
                        <span className={cn('inline-flex size-8 items-center justify-center rounded-lg', tint)}>
                          <Icon className="size-4" />
                        </span>
                      </div>
                      <div className="num mt-2 font-display text-3xl font-extrabold tracking-tight">{formatNumber(value, lang)}</div>
                      {rate != null && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="num font-semibold text-foreground">{formatNumber(rate, lang)}</span> {t('services.per10k')}
                          {!isNational && natRate != null && (
                            <span className="block">
                              {t('services.national')} <span className="num">{formatNumber(natRate, lang)}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{t('services.noFacilities')}</p>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{t('services.facilitiesSource')}</p>
          </CardContent>
        </Card>
      </Reveal>
      <Reveal delay={0.06}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">{t('services.drrTitle')}</CardTitle>
            <CardDescription>
              {info.basis === 'aggregate'
                ? t('services.drrLeadAggregate', { recorded: info.drr.recorded, total: info.districts })
                : info.drr.recorded
                  ? t('services.drrLead')
                  : t('services.drrLeadNone')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {DRR_KEYS.map((k) => (
                <DrrItem key={k} k={k} info={info} />
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{t('services.drrSource')}</p>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
