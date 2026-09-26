import { Building2, CloudRain, Landmark, MapPinned, Microscope, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Card } from '@/components/ui/card';
import { useModel } from '@/data-layer/DataProvider';
import { ALL_INDICATORS, DIMENSIONS } from '@/engine/risk/hierarchy';
import { formatScore } from '@/lib/utils';
import { SPEC_STATS } from '../data';
import { fadeIn } from '../tokens';
import { DocSection, P, SubHeading } from '../ui';

const ADDS = [
  { key: 'councils', icon: MapPinned },
  { key: 'local', icon: CloudRain },
  { key: 'open', icon: ShieldCheck },
  { key: 'live', icon: RefreshCw },
] as const;

const AUDIENCE = [
  { key: 'dmd', icon: ShieldAlert },
  { key: 'sectors', icon: Building2 },
  { key: 'partners', icon: Landmark },
  { key: 'research', icon: Microscope },
] as const;

export function OverviewSection() {
  const { t } = useTranslation('methodology');
  const model = useModel();
  const categories = DIMENSIONS.reduce((n, d) => n + d.categories.length, 0);
  const counts = { councils: model.councils.length, regions: model.regions.length, sources: model.sources.length };

  const glance: Array<{ label: string; value: ReactNode }> = [
    { label: t('overview.glance.councils'), value: counts.councils },
    { label: t('overview.glance.regions'), value: counts.regions },
    { label: t('overview.glance.sources'), value: counts.sources },
    { label: t('overview.glance.structure'), value: `${DIMENSIONS.length} · ${categories} · ${ALL_INDICATORS.length}` },
    { label: t('overview.glance.indicators'), value: `${SPEC_STATS.used} / ${SPEC_STATS.total}` },
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
    <DocSection id="overview" number="01" eyebrow={t('sections.overview')} title={t('overview.title')} lead={t('overview.lead')}>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
        <div className="space-y-5">
          <P>{t('overview.p1')}</P>
          <P>{t('overview.p2')}</P>
          <P>{t('overview.p3', counts)}</P>
        </div>
        <motion.aside {...fadeIn} aria-labelledby="overview-glance">
          <Card className="relative overflow-hidden">
            <div className="flag-rule h-1 w-full" aria-hidden />
            <div className="p-5">
              <h3 id="overview-glance" className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {t('overview.glance.title')}
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                {glance.map((g) => (
                  <div key={g.label}>
                    <dt className="text-[11px] leading-snug text-muted-foreground">{g.label}</dt>
                    <dd className="num mt-1 font-display text-xl font-extrabold tracking-tight">{g.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">{t('overview.glance.note')}</p>
            </div>
          </Card>
        </motion.aside>
      </div>

      <SubHeading className="mt-12">{t('overview.adds.title')}</SubHeading>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ADDS.map((a, i) => (
          <motion.div key={a.key} {...fadeIn} transition={{ ...fadeIn.transition, delay: i * 0.05 }}>
            <Card className="h-full p-5">
              <div className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <a.icon className="size-4.5" aria-hidden />
              </div>
              <div className="mt-3 font-semibold">{t(`overview.adds.${a.key}.title`)}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`overview.adds.${a.key}.body`, counts)}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <SubHeading className="mt-12">{t('overview.audience.title')}</SubHeading>
      <ul className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
        {AUDIENCE.map((a) => (
          <li key={a.key} className="flex gap-3">
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
              <a.icon className="size-4" aria-hidden />
            </span>
            <div>
              <div className="text-sm font-semibold">{t(`overview.audience.${a.key}.title`)}</div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t(`overview.audience.${a.key}.body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </DocSection>
  );
}
