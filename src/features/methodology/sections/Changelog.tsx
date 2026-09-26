import { CircleCheck, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fadeIn } from '../tokens';
import { DocSection } from '../ui';

const ITEMS = ['thresholds', 'live', 'dar', 'severity', 'totals'] as const;

export function ChangelogSection() {
  const { t } = useTranslation('methodology');
  return (
    <DocSection id="changelog" number="12" eyebrow={t('sections.changelog')} title={t('changelog.title')} lead={t('changelog.lead')}>
      <ol className="relative space-y-4 border-l border-border pl-6 sm:pl-8">
        {ITEMS.map((k, i) => (
          <motion.li key={k} {...fadeIn} transition={{ ...fadeIn.transition, delay: i * 0.04 }} className="relative">
            <span className="absolute top-4 -left-[33px] flex size-4 items-center justify-center rounded-full bg-background sm:-left-[41px]" aria-hidden>
              <CircleCheck className="size-4 text-success" />
            </span>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{t(`changelog.items.${k}.title`)}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <Lock className="size-3" aria-hidden />
                  {t('changelog.tested')}
                </span>
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t('changelog.before')}</dt>
                  <dd className="mt-1 leading-relaxed text-muted-foreground">{t(`changelog.items.${k}.before`)}</dd>
                </div>
                <div className="rounded-xl border border-success/25 bg-success/[0.06] p-3">
                  <dt className="text-[11px] font-semibold tracking-wider text-success uppercase">{t('changelog.after')}</dt>
                  <dd className="mt-1 leading-relaxed text-foreground/90">{t(`changelog.items.${k}.after`)}</dd>
                </div>
              </dl>
            </div>
          </motion.li>
        ))}
      </ol>
    </DocSection>
  );
}
