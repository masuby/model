/**
 * Every indicator: raw value → 0–5 score, with the reference range and scale used to normalise it.
 * The reference min/max and log flag are CALIBRATION PARAMETERS (engine/severity/definitions.ts).
 */
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/primitives';
import { SEVERITY_MODEL } from '@/engine/severity/definitions';
import { TANZANIA_AREA_KM2, TANZANIA_POPULATION_2022, type SeverityResult } from '@/engine/severity/engine';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import { DERIVED_INDICATORS, formatRaw, isNum } from '../lib';
import { DIM_ACCENT, SeverityMeter } from './bits';

const UNIT_SUFFIX = new Set(['people', 'km2', 'per10k', 'count']);

export function IndicatorTable({ result }: { result: SeverityResult }) {
  const { t, i18n } = useTranslation('severity');
  const lang = i18n.language;
  const derivationVars = { area: formatNumber(TANZANIA_AREA_KM2, lang), pop: formatNumber(TANZANIA_POPULATION_2022, lang) };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <caption className="sr-only">{t('table.caption')}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th scope="col" rowSpan={2} className="px-4 py-2.5 align-bottom sm:px-5">
                {t('table.indicator')}
              </th>
              <th scope="col" rowSpan={2} className="px-3 py-2.5 text-right align-bottom">
                {t('table.raw')}
              </th>
              <th scope="colgroup" colSpan={3} className="border-x border-border px-3 pt-2.5 pb-1 text-center">
                <span className="inline-flex items-center gap-1">
                  {t('table.calibration')}
                  <Tooltip content={t('table.calibrationHint')}>
                    <button type="button" className="rounded-full text-muted-foreground hover:text-foreground" aria-label={t('table.calibrationHint')}>
                      <Info className="size-3.5" aria-hidden />
                    </button>
                  </Tooltip>
                </span>
              </th>
              <th scope="col" rowSpan={2} className="w-44 px-4 py-2.5 align-bottom sm:px-5">
                {t('table.score')}
              </th>
            </tr>
            <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="border-l border-border px-3 pb-2.5 text-right">
                {t('table.min')}
              </th>
              <th scope="col" className="px-3 pb-2.5 text-right">
                {t('table.max')}
              </th>
              <th scope="col" className="border-r border-border px-3 pb-2.5 text-left">
                {t('table.scale')}
              </th>
            </tr>
          </thead>
          {SEVERITY_MODEL.map((dim) => (
            <tbody key={dim.id}>
              <tr className="border-b border-border bg-background/60">
                <th scope="rowgroup" colSpan={6} className="px-4 py-2 text-left sm:px-5">
                  <span className={cn('inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase', DIM_ACCENT[dim.id].text)}>
                    <span className="size-2 rounded-full" style={{ background: DIM_ACCENT[dim.id].hex }} aria-hidden />
                    {t(`dim.${dim.id}`)}
                  </span>
                  <span className="num ml-2 text-xs font-semibold text-muted-foreground">{formatScore(result.dimensions[dim.id].score)}</span>
                </th>
              </tr>
              {dim.categories.flatMap((cat) =>
                cat.components.flatMap((comp) =>
                  comp.indicators.map((def) => {
                    const v = result.indicators[def.id];
                    const derived = DERIVED_INDICATORS.has(def.id);
                    return (
                      <tr key={def.id} className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40">
                        <th scope="row" className="px-4 py-2.5 text-left font-normal sm:px-5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium">{t(`ind.${def.id}`)}</span>
                            {derived && (
                              <Tooltip content={t(`derivation.${def.id}`, derivationVars)}>
                                <button type="button" className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary" aria-label={`${t('table.derived')}: ${t(`derivation.${def.id}`, derivationVars)}`}>
                                  {t('table.derived')}
                                </button>
                              </Tooltip>
                            )}
                            {def.inverse && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{t('table.inverse')}</span>}
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {t(`cat.${cat.id}`)} › {t(`comp.${comp.id}`)}
                          </div>
                        </th>
                        <td className="num px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                          {formatRaw(def.unit, v?.raw, lang)}
                          {isNum(v?.raw) && UNIT_SUFFIX.has(def.unit) && <span className="ml-1 text-[11px] font-normal text-muted-foreground">{t(`unit.${def.unit}`)}</span>}
                        </td>
                        <td className="num border-l border-border/60 px-3 py-2.5 text-right text-muted-foreground">{formatRaw(def.unit, def.min, lang)}</td>
                        <td className="num px-3 py-2.5 text-right text-muted-foreground">{formatRaw(def.unit, def.max, lang)}</td>
                        <td className="border-r border-border/60 px-3 py-2.5">
                          <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', def.log ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-muted text-muted-foreground')}>
                            {def.log ? t('table.log') : t('table.linear')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 sm:px-5">
                          <div className="flex items-center gap-2.5">
                            <SeverityMeter value={v?.score} />
                            <span className={cn('num w-8 text-right font-display font-bold', !isNum(v?.score) && 'text-muted-foreground')}>{formatScore(v?.score)}</span>
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
    </Card>
  );
}

