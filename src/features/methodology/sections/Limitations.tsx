import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { cn } from '@/lib/utils';
import { Callout, DocSection } from '../ui';

type Status = 'open' | 'inProgress' | 'planned';

const ITEMS: ReadonlyArray<{ key: string; status: Status }> = [
  { key: 'overlays', status: 'inProgress' },
  { key: 'drought', status: 'open' },
  { key: 'relative', status: 'open' },
  { key: 'floor', status: 'open' },
  { key: 'bimodal', status: 'open' },
  { key: 'inherit', status: 'inProgress' },
  { key: 'surveys', status: 'planned' },
  { key: 'sentinel', status: 'open' },
  { key: 'precision', status: 'planned' },
  { key: 'freshness', status: 'inProgress' },
];

/** Status is state, so it may carry colour - as a small dot beside a plain word, never a tinted pill. */
const STATUS_DOT: Record<Status, string> = { open: 'bg-warning', inProgress: 'bg-primary', planned: 'border border-muted-foreground' };

export function LimitationsSection() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const vars = React.useMemo(() => {
    const perSource = new Map<string, number>();
    for (const c of model.councils) if (c.sourceId) perSource.set(c.sourceId, (perSource.get(c.sourceId) ?? 0) + 1);
    return { inherited: model.councils.filter((c) => c.inheritedFrom).length, shared: [...perSource.values()].filter((n) => n > 1).length, groups: ALL_INDICATORS.length };
  }, [model]);

  return (
    <DocSection id="limitations" label={t('sections.limitations')} title={t('limitations.title')} lead={t('limitations.lead')}>
      <ol className="border-y border-border">
        {ITEMS.map((item, i) => (
          <li key={item.key} className="grid gap-x-6 border-t border-border py-6 first:border-t-0 sm:grid-cols-[2rem_minmax(0,1fr)]">
            <span className="num hidden pt-px text-sm text-muted-foreground sm:block" aria-hidden>
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className="text-base font-semibold text-balance">{t(`limitations.items.${item.key}.title`, vars)}</h3>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground">
                  <span className={cn('size-1.5 rounded-full', STATUS_DOT[item.status])} aria-hidden />
                  {t(`limitations.status.${item.status}`)}
                </span>
              </div>
              <dl className="mt-3 grid gap-x-5 gap-y-2 text-sm leading-relaxed sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">{t('limitations.today')}</dt>
                <dd className="max-w-[68ch] text-foreground/85">{t(`limitations.items.${item.key}.now`, vars)}</dd>
                <dt className="text-muted-foreground">{t('limitations.next')}</dt>
                <dd className="max-w-[68ch] text-muted-foreground">{t(`limitations.items.${item.key}.next`, vars)}</dd>
              </dl>
            </div>
          </li>
        ))}
      </ol>
      <Callout className="mt-10" title={t('limitations.closingTitle')}>
        {t('limitations.closing')}
      </Callout>
      <p className="mt-6 max-w-[72ch] text-xs leading-relaxed text-muted-foreground">{t('limitations.sourcesNote')}</p>
    </DocSection>
  );
}
