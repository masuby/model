/**
 * Step 2 - the affected area. Councils are toggled on a lightweight SVG map (StaticMap - no Leaflet) or
 * from the list (keyboard accessible); their NBS-2022 census totals can fill the Impact inputs. The
 * councils' mean INFORM Risk is shown as pre-crisis context only - it never enters the severity formula.
 */
import { Check, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Note } from '@/components/layout/Page';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectGroup, SelectItem } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { formatNumber, formatScore, NO_VALUE } from '@/lib/utils';
import type { AreaTotals } from '../lib';

const StaticMap = React.lazy(() => import('@/components/map/StaticMap'));

interface Props {
  model: RiskModel;
  selectedIds: string[];
  councils: Unit[];
  totals: AreaTotals;
  censusApplied: boolean;
  onToggle: (id: string) => void;
  onClear: () => void;
  onApplyCensus: () => void;
}

export const AreaPicker = React.memo(function AreaPicker({ model, selectedIds, councils, totals, censusApplied, onToggle, onClear, onApplyCensus }: Props) {
  const { t, i18n } = useTranslation(['severity', 'common']);
  const lang = i18n.language;
  const metric = React.useMemo(() => parseMetric('risk'), []);
  const onSelect = React.useCallback((u: Unit) => onToggle(u.id), [onToggle]);
  const has = councils.length > 0;

  const regions = React.useMemo(() => {
    const chosen = new Set(selectedIds);
    const byRegion = new Map<string, Unit[]>();
    for (const c of model.councils) {
      if (chosen.has(c.id)) continue;
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region)!.push(c);
    }
    return [...byRegion.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([region, list]) => ({ region, list: list.sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [model, selectedIds]);

  return (
    <div className="@container">
      <div className="grid gap-10 @3xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] @3xl:gap-10">
        {/* Map */}
        <figure className="min-w-0">
          <div className="mx-auto aspect-[1000/966] w-full max-w-[480px]">
            <React.Suspense fallback={<div className="size-full rounded-md bg-muted/60" />}>
              <StaticMap model={model} metric={metric} selectedIds={selectedIds} onSelect={onSelect} hint={t('area.hint')} className="size-full" />
            </React.Suspense>
          </div>
          <figcaption className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{t('area.mapHint')}</span>
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="mr-1">{t('area.mapLegend')}</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>{t('common:classes.veryLow')}</span>
                {CLASS_KEYS.map((k) => (
                  <span key={k} className="h-2 w-4" style={{ background: CLASS_COLORS[k] }} title={t(`common:classes.${k}`)} aria-hidden />
                ))}
                <span>{t('common:classes.veryHigh')}</span>
              </span>
            </span>
          </figcaption>
        </figure>

        {/* Selection & totals */}
        <div className="flex min-w-0 flex-col gap-7">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold">{t('area.selected', { count: councils.length })}</h3>
              {has && (
                <Button variant="link" size="sm" className="h-auto px-0" onClick={onClear}>
                  {t('common:actions.clear')}
                </Button>
              )}
            </div>
            <Select value="" onValueChange={onToggle} placeholder={t('area.add')} aria-label={t('area.addAria')} className="mt-3">
              {regions.map(({ region, list }) => (
                <SelectGroup key={region} label={region}>
                  {list.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </Select>

            {has ? (
              <ul className="mt-4 max-h-60 divide-y divide-border overflow-y-auto border-y border-border [scrollbar-width:thin]" aria-label={t('area.listAria')}>
                {councils.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 py-2 pr-1 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-muted-foreground"> · {u.region}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggle(u.id)}
                      aria-label={t('area.remove', { name: u.name })}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-y border-border py-4 text-sm text-muted-foreground">{t('area.empty')}</p>
            )}
          </div>

          <div>
            <dl className="grid grid-cols-2 divide-x divide-border">
              <div className="pr-4">
                <dt className="text-sm text-muted-foreground">{t('area.population')}</dt>
                <dd className="num mt-1 text-2xl font-semibold tracking-tight">{has ? formatNumber(totals.population, lang) : NO_VALUE}</dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">{t('area.populationSub')}</dd>
              </div>
              <div className="pl-4 sm:pl-6">
                <dt className="text-sm text-muted-foreground">{t('area.areaKm2')}</dt>
                <dd className="num mt-1 text-2xl font-semibold tracking-tight">
                  {has ? formatNumber(totals.areaKm2, lang) : NO_VALUE} <span className="text-sm font-normal text-muted-foreground">km²</span>
                </dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">{t('area.areaSub')}</dd>
              </div>
            </dl>
            <Button className="mt-5 w-full" variant={censusApplied ? 'outline' : 'default'} disabled={!has} onClick={onApplyCensus}>
              {censusApplied && <Check />}
              {censusApplied ? t('area.applied') : t('area.useCensus')}
            </Button>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('area.censusNote')}</p>
          </div>

          <Note title={t('area.context')}>
            {has ? (
              <>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground">
                  <span>{t('area.contextMean')}</span>
                  <b className="num font-semibold">{formatScore(totals.meanRisk)}</b>
                  <ClassBadge value={totals.meanRisk} size="sm" />
                </p>
                {councils.length > 1 && <p className="num mt-0.5">{t('area.contextRange', { min: formatScore(totals.minRisk), max: formatScore(totals.maxRisk) })}</p>}
                <p className="mt-2">{t('area.contextNote')}</p>
              </>
            ) : (
              <p>{t('area.contextEmpty')}</p>
            )}
          </Note>
        </div>
      </div>
    </div>
  );
});
