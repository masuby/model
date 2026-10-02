import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { useModel } from '@/data-layer/DataProvider';
import { formatScore } from '@/lib/utils';
import { DocSection, P, SubHeading } from '../ui';

const ADDS = ['councils', 'local', 'open', 'live'] as const;
const AUDIENCE = ['dmd', 'sectors', 'partners', 'research'] as const;

export function OverviewSection() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const counts = { councils: model.councils.length, regions: model.regions.length, sources: model.sources.length };

  const glance: Array<{ label: string; value: ReactNode }> = [
    { label: t('overview.glance.councils'), value: counts.councils },
    { label: t('overview.glance.regions'), value: counts.regions },
    {
      label: t('overview.glance.national'),
      value: (
        <span className="inline-flex items-center gap-2">
          {formatScore(model.national.risk)}
          <ClassBadge value={model.national.risk} size="sm" />
        </span>
      ),
    },
  ];

  return (
    <DocSection id="overview" label={t('sections.overview')} title={t('overview.title')} lead={t('overview.lead')}>
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:gap-14">
        <div className="space-y-5">
          <P>{t('overview.p1')}</P>
          <P>{t('overview.p2')}</P>
          <P>{t('overview.p3', counts)}</P>
        </div>

        <aside aria-labelledby="overview-glance">
          <SubHeading id="overview-glance">{t('overview.glance.title')}</SubHeading>
          <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
            {glance.map((g) => (
              <div key={g.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">{g.label}</dt>
                <dd className="num shrink-0 text-right font-semibold">{g.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('overview.glance.note')}</p>
        </aside>
      </div>

      <SubHeading className="mt-16">{t('overview.adds.title')}</SubHeading>
      <ul className="mt-4 grid border-t border-border md:grid-cols-2 md:gap-x-12">
        {ADDS.map((k) => (
          <li key={k} className="border-b border-border py-5">
            <p className="font-medium">{t(`overview.adds.${k}.title`)}</p>
            <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{t(`overview.adds.${k}.body`, counts)}</p>
          </li>
        ))}
      </ul>

      <SubHeading className="mt-14">{t('overview.audience.title')}</SubHeading>
      <dl className="mt-4 divide-y divide-border border-t border-border">
        {AUDIENCE.map((k) => (
          <div key={k} className="grid gap-1 py-4 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8">
            <dt className="text-sm font-medium">{t(`overview.audience.${k}.title`)}</dt>
            <dd className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{t(`overview.audience.${k}.body`)}</dd>
          </div>
        ))}
      </dl>
    </DocSection>
  );
}
