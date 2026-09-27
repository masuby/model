/**
 * Every indicator: raw value → 0–5 score, with the reference range and scale used to normalise it.
 * The reference min/max and log flag are CALIBRATION PARAMETERS (engine/severity/definitions.ts).
 * A plain table on the page: hairline rows, sentence-case headers, numbers right-aligned. On phones the
 * calibration columns are hidden so Indicator | Raw value | Score fit without sideways scrolling.
 */
import { Info } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@/components/ui/primitives';
import { SEVERITY_MODEL } from '@/engine/severity/definitions';
import { TANZANIA_AREA_KM2, TANZANIA_POPULATION_2022, type SeverityResult } from '@/engine/severity/engine';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { DERIVED_INDICATORS, formatRaw, isNum } from '../lib';
import { SeverityMeter } from './bits';

const UNIT_SUFFIX = new Set(['people', 'km2', 'per10k', 'count']);
const th = 'px-3 py-2.5 text-xs font-medium text-muted-foreground';
/** Calibration columns (min, max, scale): shown from sm up. */
const calib = 'hidden sm:table-cell';

export const IndicatorTable = React.memo(function IndicatorTable({ result }: { result: SeverityResult }) {
  const { t, i18n } = useTranslation('severity');
  const lang = i18n.language;
  const derivationVars = { area: formatNumber(TANZANIA_AREA_KM2, lang), pop: formatNumber(TANZANIA_POPULATION_2022, lang) };

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full border-collapse text-sm sm:min-w-[760px]">
        <caption className="sr-only">{t('table.caption')}</caption>
        <thead className="border-b border-foreground/25">
          <tr className="text-left">
            <th scope="col" rowSpan={2} className={cn(th, 'pl-0 align-bottom')}>
              {t('table.indicator')}
            </th>
            <th scope="col" rowSpan={2} className={cn(th, 'text-right align-bottom')}>
              {t('table.raw')}
            </th>
            <th scope="colgroup" colSpan={3} className={cn(th, calib, 'pb-1 text-center')}>
              <span className="flex items-center justify-center gap-1 border-b border-border pb-1.5">
                {t('table.calibration')}
                <Tooltip content={t('table.calibrationHint')}>
                  <button type="button" className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" aria-label={t('table.calibrationHint')}>
                    <Info className="size-3.5" aria-hidden />
                  </button>
                </Tooltip>
              </span>
            </th>
            <th scope="col" rowSpan={2} className={cn(th, 'pr-0 align-bottom sm:w-48')}>
              {t('table.score')}
            </th>
          </tr>
          <tr>
            <th scope="col" className={cn(th, calib, 'w-24 pt-1.5 text-right')}>
              {t('table.min')}
            </th>
            <th scope="col" className={cn(th, calib, 'w-24 pt-1.5 text-right')}>
              {t('table.max')}
            </th>
            <th scope="col" className={cn(th, calib, 'pt-1.5 text-left')}>
              {t('table.scale')}
            </th>
          </tr>
        </thead>
        {SEVERITY_MODEL.map((dim) => (
          <tbody key={dim.id}>
            <tr className="border-b border-border">
              <th scope="rowgroup" colSpan={6} className="pt-7 pb-2.5 text-left">
                <span className="text-base font-semibold">{t(`dim.${dim.id}`)}</span>
                <span className="num ml-2.5 text-sm text-muted-foreground">{formatScore(result.dimensions[dim.id].score)}</span>
              </th>
            </tr>
            {dim.categories.flatMap((cat) =>
              cat.components.flatMap((comp) =>
                comp.indicators.map((def) => {
                  const v = result.indicators[def.id];
                  const derived = DERIVED_INDICATORS.has(def.id);
                  return (
                    <tr key={def.id} className="border-b border-border transition-colors duration-150 hover:bg-muted/40">
                      <th scope="row" className="py-3 pr-3 text-left font-normal">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-medium">{t(`ind.${def.id}`)}</span>
                          {derived && (
                            <Tooltip content={t(`derivation.${def.id}`, derivationVars)}>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                                aria-label={`${t('table.derived')}: ${t(`derivation.${def.id}`, derivationVars)}`}
                              >
                                {t('table.derived')}
                              </button>
                            </Tooltip>
                          )}
                          {def.inverse && <span className="text-xs text-muted-foreground">{t('table.inverse')}</span>}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {t(`cat.${cat.id}`)} › {t(`comp.${comp.id}`)}
                        </div>
                      </th>
                      <td className="num px-3 py-3 text-right font-medium whitespace-nowrap">
                        {formatRaw(def.unit, v?.raw, lang)}
                        {isNum(v?.raw) && UNIT_SUFFIX.has(def.unit) && <span className="block text-xs font-normal text-muted-foreground sm:ml-1 sm:inline">{t(`unit.${def.unit}`)}</span>}
                      </td>
                      <td className={cn(calib, 'num px-3 py-3 text-right text-muted-foreground')}>{formatRaw(def.unit, def.min, lang)}</td>
                      <td className={cn(calib, 'num px-3 py-3 text-right text-muted-foreground')}>{formatRaw(def.unit, def.max, lang)}</td>
                      <td className={cn(calib, 'px-3 py-3 text-xs', def.log ? 'font-medium text-foreground' : 'text-muted-foreground')}>{def.log ? t('table.log') : t('table.linear')}</td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <SeverityMeter value={v?.score} className="w-10 sm:w-full" />
                          <span className={cn('num w-8 text-right font-semibold', !isNum(v?.score) && 'text-muted-foreground')}>{formatScore(v?.score)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }),
              ),
            )}
          </tbody>
        ))}
      </table>
    </div>
  );
});
