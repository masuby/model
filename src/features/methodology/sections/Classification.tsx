import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { onClassColor } from '@/components/risk/RiskBadge';
import { Card } from '@/components/ui/card';
import { CLASS_COLORS, CLASS_KEYS, classify, classRanges, THRESHOLDS, type Scale } from '@/engine/risk/classes';
import { fadeIn } from '../tokens';
import { Callout, DocSection, Fn, Formula, Line, N, Op, P, Paren, V } from '../ui';

const SCALES: readonly Scale[] = ['risk', 'hazard', 'vulnerability', 'coping'];

function useScaleLabel() {
  const { t } = useTranslation('common');
  return (s: Scale) => (s === 'risk' ? t('informRisk') : t(`dimensions.${s}`));
}

function ScaleBar({ scale }: { scale: Scale }) {
  const { t } = useTranslation('common');
  const label = useScaleLabel();
  const bounds = [0, ...THRESHOLDS[scale], 10];
  return (
    <div className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="text-sm font-semibold">{label(scale)}</div>
      <div>
        <div className="flex h-7 overflow-hidden rounded-lg ring-1 ring-border" role="img" aria-label={`${label(scale)}: ${CLASS_KEYS.map((k, i) => `${t(`classes.${k}`)} ${classRanges(scale)[i]}`).join('; ')}`}>
          {CLASS_KEYS.map((k, i) => (
            <div
              key={k}
              className="flex min-w-0 items-center justify-center overflow-hidden px-1 text-[10px] font-semibold whitespace-nowrap"
              style={{ width: `${(bounds[i + 1] - bounds[i]) * 10}%`, background: CLASS_COLORS[k], color: onClassColor(CLASS_COLORS[k]) }}
            >
              <span className="hidden truncate md:inline">{t(`classes.${k}`)}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-4" aria-hidden>
          {bounds.map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="num absolute text-[10px] text-muted-foreground"
              style={{ left: `${b * 10}%`, transform: i === 0 ? 'none' : i === bounds.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {b.toFixed(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClassificationSection() {
  const { t } = useTranslation(['methodology', 'common']);
  const label = useScaleLabel();
  const sample = 4;
  const onHazard = classify(sample, 'hazard');
  const onRisk = classify(sample, 'risk');

  return (
    <DocSection id="classification" number="05" eyebrow={t('sections.classification')} title={t('classification.title')} lead={t('classification.lead', { t1: THRESHOLDS.risk[0].toFixed(1) })}>
      <Formula label={t('classification.ruleLabel')} caption={t('classification.ruleCaption')}>
        <Line>
          <V>{t('vars.class')}</V>
          <Op>=</Op>
          <Fn>if</Fn>
          <Paren>
            <V>x</V>
            <Op>&lt;</Op>
            <V sub="1">t</V>, <span className="font-sans text-[0.85em] not-italic">{t('common:classes.veryLow')}</span>,<Fn>if</Fn>
            <Paren>
              <V>x</V>
              <Op>&lt;</Op>
              <V sub="2">t</V>, <span className="font-sans text-[0.85em] not-italic">{t('common:classes.low')}</span>,<Op>…</Op>
            </Paren>
          </Paren>
        </Line>
      </Formula>

      <motion.div {...fadeIn} className="mt-8">
        <Card className="p-5 sm:p-6">
          <h3 className="text-base font-bold">{t('classification.visualTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('classification.visualLead')}</p>
          <div className="mt-6 space-y-5">
            {SCALES.map((s) => (
              <ScaleBar key={s} scale={s} />
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="px-5 pt-4 pb-2 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t('classification.tableCaption')}</caption>
          <thead>
            <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-2.5 font-semibold">
                {t('classification.class')}
              </th>
              {SCALES.map((s) => (
                <th key={s} scope="col" className="px-4 py-2.5 font-semibold">
                  {label(s)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...CLASS_KEYS].reverse().map((k) => {
              const i = CLASS_KEYS.indexOf(k);
              return (
                <tr key={k} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-5 py-2.5 text-left font-medium">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="size-3 rounded-[4px] ring-1 ring-black/10" style={{ background: CLASS_COLORS[k] }} aria-hidden />
                      {t(`common:classes.${k}`)}
                    </span>
                  </th>
                  {SCALES.map((s) => (
                    <td key={s} className="num px-4 py-2.5 font-mono text-[13px]">
                      {classRanges(s)[i]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <P className="text-sm sm:text-[15px]">{t('classification.own')}</P>
        <Callout tone="caution" title={t('classification.exampleTitle')}>
          {t('classification.example', {
            value: sample.toFixed(1),
            hazardClass: onHazard ? t(`common:classes.${onHazard.key}`) : '—',
            riskClass: onRisk ? t(`common:classes.${onRisk.key}`) : '—',
          })}
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('common:dimensions.hazard')}</span>
            <N>
              <span className="font-display text-sm font-bold">{sample.toFixed(1)}</span>
            </N>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: onHazard?.color, color: onHazard ? onClassColor(onHazard.color) : undefined }}>
              {onHazard && t(`common:classes.${onHazard.key}`)}
            </span>
            <span className="text-xs text-muted-foreground">≠ {t('common:informRisk')}</span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: onRisk?.color, color: onRisk ? onClassColor(onRisk.color) : undefined }}>
              {onRisk && t(`common:classes.${onRisk.key}`)}
            </span>
          </span>
        </Callout>
      </div>
    </DocSection>
  );
}
