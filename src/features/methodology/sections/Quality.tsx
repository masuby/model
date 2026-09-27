import { CircleAlert, CircleCheck } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useModel } from '@/data-layer/DataProvider';
import { cn, formatNumber } from '@/lib/utils';
import { ADVANCED_COUNT, SPEC_STATS, VERIFIED } from '../data';
import { consistency } from '../derive';
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
  const vars = { used: SPEC_STATS.used, units: VERIFIED.pipelineUnits, councils: model.councils.length, regions: model.regions.length, inherited, n: ADVANCED_COUNT };

  return (
    <DocSection id="quality" label={t('sections.quality')} title={t('quality.title')} lead={t('quality.lead')}>
      {/* Live self-check: a statement and two figures, set between rules. */}
      <div className="grid gap-8 border-y border-border py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
        <div className="max-w-xl">
          <h3 className="text-base font-semibold">{t('quality.live.title')}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('quality.live.body')}</p>
          <p className={cn('mt-3 flex items-center gap-1.5 text-sm font-medium', pass ? 'text-success' : 'text-danger')}>
            {pass ? <CircleCheck className="size-4" aria-hidden /> : <CircleAlert className="size-4" aria-hidden />}
            {pass ? t('quality.live.pass') : t('quality.live.fail')}
          </p>
        </div>
        <dl className="grid grid-cols-2 md:flex md:divide-x md:divide-border" aria-live="polite">
          {(
            [
              ['dims', live.dims],
              ['risk', live.risk],
            ] as const
          ).map(([k, v], i) => (
            <div key={k} className={cn('min-w-0 md:px-8 md:last:pr-0', i === 1 && 'border-l border-border pl-5 md:border-l-0')}>
              <dt className="text-sm text-muted-foreground">{t(`quality.live.${k}`)}</dt>
              <dd className="num mt-1 font-display text-[2.1rem] leading-none font-semibold tracking-tight whitespace-nowrap">
                {v.ok}
                <span className="text-lg font-normal text-muted-foreground"> / {v.total}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <dl className="mt-12 divide-y divide-border border-b border-border">
        {CHECKS.map((c) => (
          <div key={c} className="grid gap-2 py-5 md:grid-cols-[17rem_minmax(0,1fr)] md:gap-10">
            <dt>
              <span className="block text-sm font-semibold">{t(`quality.checks.${c}.title`)}</span>
              {stat[c] && <span className="num mt-1 block text-sm text-muted-foreground">{stat[c]}</span>}
            </dt>
            <dd className="min-w-0">
              <p className="max-w-[68ch] text-sm leading-relaxed text-foreground/85">{t(`quality.checks.${c}.body`, vars)}</p>
              <code className="mt-1.5 block font-mono text-[11.5px] break-words text-muted-foreground">{FILES[c]}</code>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-sm">
        <span className="font-medium">{t('quality.reproduce')}</span>
        <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-[13px]">npx vitest run</code>
        <span className="text-muted-foreground">{t('quality.reproduceHint')}</span>
      </p>
    </DocSection>
  );
}
