import { useTranslation } from 'react-i18next';
import { onClassColor } from '@/components/risk/RiskBadge';
import { CLASS_COLORS, CLASS_KEYS, classify, classRanges, THRESHOLDS, type Scale } from '@/engine/risk/classes';
import { Callout, Cases, DocSection, Formula, Line, N, Op, P, SubHeading, Txt, V } from '../ui';

const SCALES: readonly Scale[] = ['risk', 'hazard', 'vulnerability', 'coping'];

function useScaleLabel() {
  const { t } = useTranslation('common');
  return (s: Scale) => (s === 'risk' ? t('informRisk') : t(`dimensions.${s}`));
}

/** The model's own abbreviations, used as column heads on phones. */
const SCALE_TAG: Record<Exclude<Scale, 'risk'>, string> = { hazard: 'H', vulnerability: 'V', coping: 'LCC' };

function ScaleBar({ scale }: { scale: Scale }) {
  const { t } = useTranslation('common');
  const label = useScaleLabel();
  const bounds = [0, ...THRESHOLDS[scale], 10];
  return (
    <div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start sm:gap-6">
      <div className="text-sm font-medium sm:pt-1">{label(scale)}</div>
      <div>
        <div className="flex h-7 gap-px overflow-hidden" role="img" aria-label={`${label(scale)}: ${CLASS_KEYS.map((k, i) => `${t(`classes.${k}`)} ${classRanges(scale)[i]}`).join('; ')}`}>
          {CLASS_KEYS.map((k, i) => (
            <div
              key={k}
              className="flex min-w-0 items-center justify-center overflow-hidden px-1 text-[11px] font-medium whitespace-nowrap"
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
              className="num absolute text-[11px] text-muted-foreground"
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
    <DocSection id="classification" label={t('sections.classification')} title={t('classification.title')} lead={t('classification.lead', { t1: THRESHOLDS.risk[0].toFixed(1) })}>
      <Formula label={t('classification.ruleLabel')} caption={t('classification.ruleCaption')}>
        {/* The workbook's nested IF, set as a case definition. */}
        <Line>
          <V>{t('vars.class')}</V>
          <Op>=</Op>
          <Cases
            rows={CLASS_KEYS.map((k, i) => [
              t(`common:classes.${k}`),
              <>
                <Txt>{t('classification.if')}</Txt>
                {i > 0 && (
                  <>
                    <V sub={i}>t</V>
                    <Op>≤</Op>
                  </>
                )}
                <V>x</V>
                {i < CLASS_KEYS.length - 1 && (
                  <>
                    <Op>&lt;</Op>
                    <V sub={i + 1}>t</V>
                  </>
                )}
              </>,
            ])}
          />
        </Line>
      </Formula>

      <div className="mt-14">
        <SubHeading>{t('classification.visualTitle')}</SubHeading>
        <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{t('classification.visualLead')}</p>
        <div className="mt-6 space-y-5 border-t border-border pt-6">
          {SCALES.map((s) => (
            <ScaleBar key={s} scale={s} />
          ))}
        </div>
      </div>

      <SubHeading id="classification-table" className="mt-14">
        {t('classification.tableCaption')}
      </SubHeading>
      <div className="mt-3 overflow-x-auto">
        <table aria-labelledby="classification-table" className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-foreground/25 text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2.5 pr-2 font-medium sm:pr-4">
                {t('classification.class')}
              </th>
              {SCALES.map((s) => (
                <th key={s} scope="col" className="px-2 py-2.5 text-right font-medium sm:px-4">
                  {/* H / V / LCC on phones, so all five columns fit without scrolling; screen readers get the full name. */}
                  <span className="sm:hidden" aria-hidden>
                    {s === 'risk' ? t('vars.risk') : SCALE_TAG[s]}
                  </span>
                  <span className="sr-only sm:not-sr-only">{label(s)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...CLASS_KEYS].reverse().map((k) => {
              const i = CLASS_KEYS.indexOf(k);
              return (
                <tr key={k}>
                  <th scope="row" className="py-2.5 pr-2 text-left font-normal whitespace-nowrap sm:pr-4">
                    <span className="inline-flex items-center gap-2 sm:gap-2.5">
                      <span className="size-2.5 rounded-[2px]" style={{ background: CLASS_COLORS[k] }} aria-hidden />
                      {t(`common:classes.${k}`)}
                    </span>
                  </th>
                  {SCALES.map((s) => (
                    <td key={s} className="num px-2 py-2.5 text-right whitespace-nowrap sm:px-4 sm:text-[13px]">
                      {classRanges(s)[i]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <P className="text-[15px]">{t('classification.own')}</P>
        <Callout title={t('classification.exampleTitle')}>
          {t('classification.example', { value: sample.toFixed(1), hazardClass: onHazard ? t(`common:classes.${onHazard.key}`) : '—', riskClass: onRisk ? t(`common:classes.${onRisk.key}`) : '—' })}
          <span className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('common:dimensions.hazard')}</span>
            <N>
              <span className="text-sm font-semibold text-foreground">{sample.toFixed(1)}</span>
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
