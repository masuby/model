import { CircleAlert, CircleCheck, FlaskConical, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { useModel } from '@/data-layer/DataProvider';
import { cn, formatNumber } from '@/lib/utils';
import { ADVANCED_COUNT, SPEC_STATS, VERIFIED } from '../data';
import { consistency } from '../derive';
import { fadeIn } from '../tokens';
import { DocSection } from '../ui';

const CHECKS = ['standardise', 'pipeline', 'parity', 'invariants', 'flexibility', 'advanced', 'severity'] as const;
type Check = (typeof CHECKS)[number];

/** The test file that locks each check in (paths under src/engine). */
const FILES: Record<Check, string> = {
  standardise: 'risk/__tests__/standardise.golden.test.ts',
  pipeline: 'risk/__tests__/pipeline.golden.test.ts',
  parity: 'risk/__tests__/workbook.golden.test.ts',
  invariants: 'risk/__tests__/model.test.ts · dataset.integrity.test.ts',
  flexibility: 'risk/__tests__/flexibility.test.ts',
  advanced: 'risk/__tests__/advanced.test.ts',
  severity: 'severity/__tests__/severity.test.ts',
};

export function QualitySection() {
  const { t, i18n } = useTranslation('methodology');
  const model = useModel();
  const live = React.useMemo(() => consistency(model.councils), [model]);
  const pass = live.dims.ok === live.dims.total && live.risk.ok === live.risk.total;
  const inherited = model.councils.filter((c) => c.inheritedFrom).length;

  const stat: Partial<Record<Check, string>> = {
    standardise: `${formatNumber(VERIFIED.standardiseValues, i18n.language)} / ${formatNumber(VERIFIED.standardiseValues, i18n.language)}`,
    pipeline: `${VERIFIED.pipelineUnits} / ${VERIFIED.pipelineUnits}`,
    parity: t('quality.rows', { n: VERIFIED.workbookRows }),
    advanced: `${ADVANCED_COUNT}`,
  };
  const vars = {
    used: SPEC_STATS.used,
    units: VERIFIED.pipelineUnits,
    councils: model.councils.length,
    regions: model.regions.length,
    inherited,
    n: ADVANCED_COUNT,
  };

  return (
    <DocSection id="quality" number="10" eyebrow={t('sections.quality')} title={t('quality.title')} lead={t('quality.lead')}>
      <motion.div {...fadeIn}>
        <Card className={cn('relative overflow-hidden p-5 sm:p-6', pass ? 'border-success/30' : 'border-danger/40')}>
          <div className={cn('pointer-events-none absolute -top-20 -right-20 size-56 rounded-full blur-3xl', pass ? 'bg-success/15' : 'bg-danger/15')} aria-hidden />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', pass ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger')}>
                {pass ? <CircleCheck className="size-3.5" aria-hidden /> : <CircleAlert className="size-3.5" aria-hidden />}
                {pass ? t('quality.live.pass') : t('quality.live.fail')}
              </div>
              <h3 className="mt-3 text-lg font-bold">{t('quality.live.title')}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('quality.live.body')}</p>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-6" aria-live="polite">
              <div>
                <dt className="text-xs text-muted-foreground">{t('quality.live.dims')}</dt>
                <dd className="num mt-1 font-display text-3xl font-extrabold tracking-tight">
                  {live.dims.ok}
                  <span className="text-lg text-muted-foreground"> / {live.dims.total}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('quality.live.risk')}</dt>
                <dd className="num mt-1 font-display text-3xl font-extrabold tracking-tight">
                  {live.risk.ok}
                  <span className="text-lg text-muted-foreground"> / {live.risk.total}</span>
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </motion.div>

      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {CHECKS.map((c, i) => (
          <motion.li key={c} {...fadeIn} transition={{ ...fadeIn.transition, delay: (i % 2) * 0.05 }}>
            <Card className="flex h-full gap-4 p-5">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                <CircleCheck className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="font-semibold">{t(`quality.checks.${c}.title`)}</h3>
                  {stat[c] && <span className="num font-display text-sm font-extrabold text-success">{stat[c]}</span>}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`quality.checks.${c}.body`, vars)}</p>
                <code className="mt-2 inline-block rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">{FILES[c]}</code>
              </div>
            </Card>
          </motion.li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-dashed border-border p-4 text-sm sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-2 font-semibold">
          <FlaskConical className="size-4 text-primary" aria-hidden />
          {t('quality.reproduce')}
        </span>
        <code className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs">
          <Terminal className="size-3.5 text-muted-foreground" aria-hidden />
          npx vitest run
        </code>
        <span className="text-xs text-muted-foreground">{t('quality.reproduceHint')}</span>
      </div>
    </DocSection>
  );
}
