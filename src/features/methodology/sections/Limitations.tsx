import { ArrowRight, Route } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { useModel } from '@/data-layer/DataProvider';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { cn } from '@/lib/utils';
import { fadeIn } from '../tokens';
import { Callout, DocSection, P } from '../ui';

type Status = 'open' | 'inProgress' | 'planned';

const ITEMS: ReadonlyArray<{ key: string; status: Status }> = [
  { key: 'overlays', status: 'inProgress' },
  { key: 'drought', status: 'open' },
  { key: 'relative', status: 'open' },
  { key: 'floor', status: 'open' },
  { key: 'inherit', status: 'inProgress' },
  { key: 'surveys', status: 'planned' },
  { key: 'sentinel', status: 'open' },
  { key: 'precision', status: 'planned' },
  { key: 'freshness', status: 'inProgress' },
];

const STATUS_STYLE: Record<Status, string> = {
  open: 'bg-warning/12 text-warning',
  inProgress: 'bg-primary/10 text-primary',
  planned: 'bg-muted text-muted-foreground',
};

export function LimitationsSection() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const vars = React.useMemo(() => {
    const perSource = new Map<string, number>();
    for (const c of model.councils) if (c.sourceId) perSource.set(c.sourceId, (perSource.get(c.sourceId) ?? 0) + 1);
    return {
      inherited: model.councils.filter((c) => c.inheritedFrom).length,
      shared: [...perSource.values()].filter((n) => n > 1).length,
      groups: ALL_INDICATORS.length,
    };
  }, [model]);

  return (
    <DocSection id="limitations" number="11" eyebrow={t('sections.limitations')} title={t('limitations.title')} lead={t('limitations.lead')}>
      <ul className="grid gap-4 lg:grid-cols-2">
        {ITEMS.map((item, i) => (
          <motion.li key={item.key} {...fadeIn} transition={{ ...fadeIn.transition, delay: (i % 2) * 0.05 }}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-balance">{t(`limitations.items.${item.key}.title`, vars)}</h3>
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap', STATUS_STYLE[item.status])}>{t(`limitations.status.${item.status}`)}</span>
              </div>
              <div className="mt-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t('limitations.today')}</div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">{t(`limitations.items.${item.key}.now`, vars)}</p>
              <div className="mt-auto pt-4">
                <div className="flex gap-2.5 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed">
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <span className="font-semibold">{t('limitations.next')} </span>
                    <span className="text-muted-foreground">{t(`limitations.items.${item.key}.next`, vars)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.li>
        ))}
      </ul>
      <Callout tone="tip" className="mt-6" title={t('limitations.closingTitle')}>
        <span className="flex items-start gap-2">
          <Route className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <span>{t('limitations.closing')}</span>
        </span>
      </Callout>
      <P className="mt-4 text-xs text-muted-foreground sm:text-xs">{t('limitations.sourcesNote')}</P>
    </DocSection>
  );
}
