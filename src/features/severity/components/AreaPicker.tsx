/**
 * Step 2 — the affected area. Councils are toggled on the (lazy) RiskMap or from an accessible list;
 * their NBS-2022 census totals can fill the Impact inputs. The councils' mean INFORM Risk is shown as
 * pre-crisis context only — it never enters the severity formula.
 */
import { Check, Info, MapPin, MousePointerClick, Ruler, Users, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassBadge } from '@/components/risk/RiskBadge';
import { ScoreBar } from '@/components/risk/DimensionBars';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectGroup, SelectItem, Skeleton } from '@/components/ui/primitives';
import { CLASS_COLORS, CLASS_KEYS } from '@/engine/risk/classes';
import { parseMetric } from '@/engine/risk/metrics';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';
import type { AreaTotals } from '../lib';

const RiskMap = React.lazy(() => import('@/components/map/RiskMap'));

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

  const regions = React.useMemo(() => {
    const byRegion = new Map<string, Unit[]>();
    for (const c of model.councils) {
      if (selectedIds.includes(c.id)) continue;
      if (!byRegion.has(c.region)) byRegion.set(c.region, []);
      byRegion.get(c.region)!.push(c);
    }
    return [...byRegion.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([region, list]) => ({ region, list: list.sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [model, selectedIds]);

  return (
    <Card className="@container overflow-hidden">
      <div className="grid @3xl:grid-cols-[1.15fr_1fr]">
        {/* Map */}
        <div className="relative h-[340px] border-b border-border @lg:h-[400px] @3xl:h-auto @3xl:min-h-[460px] @3xl:border-r @3xl:border-b-0">
          <React.Suspense fallback={<Skeleton className="size-full rounded-none" />}>
            <RiskMap model={model} level="council" metric={metric} selectedIds={selectedIds} onSelect={onSelect} tooltipHint={t('area.hint')} className="size-full" fitPadding={12} />
          </React.Suspense>
          <div className="glass pointer-events-none absolute top-3 left-3 flex max-w-[70%] items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium shadow-lg">
            <MousePointerClick className="size-4 shrink-0 text-primary" aria-hidden />
            <span>{t('area.mapHint')}</span>
          </div>
          <div className="glass pointer-events-none absolute bottom-3 left-3 rounded-xl px-3 py-2 text-[11px] font-medium shadow-lg">
            <div className="mb-1 text-muted-foreground">{t('area.mapLegend')}</div>
            <div className="flex gap-1" aria-hidden>
              {CLASS_KEYS.map((k) => (
                <span key={k} className="h-2 w-6 rounded-full" style={{ background: CLASS_COLORS[k] }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{t('common:classes.veryLow')}</span>
              <span>{t('common:classes.veryHigh')}</span>
            </div>
          </div>
        </div>

        {/* Selection & totals */}
        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold">
              <MapPin className="size-4 text-primary" aria-hidden />
              {t('area.selected', { count: councils.length })}
            </h3>
            {councils.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                {t('common:actions.clear')}
              </Button>
            )}
          </div>

          <Select value="" onValueChange={onToggle} placeholder={t('area.add')} aria-label={t('area.addAria')}>
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

          {councils.length ? (
            <ul className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1" aria-label={t('area.listAria')}>
              {councils.map((u) => (
                <li key={u.id} className="animate-fade-up">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pr-1 pl-2.5 text-xs">
                    <span className="font-semibold">{u.name}</span>
                    <span className="text-muted-foreground">{u.region}</span>
                    <button
                      type="button"
                      onClick={() => onToggle(u.id)}
                      aria-label={t('area.remove', { name: u.name })}
                      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">{t('area.empty')}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Users className="size-3.5" aria-hidden /> {t('area.population')}
              </div>
              <div className="num mt-1 font-display text-lg font-extrabold">{councils.length ? formatNumber(totals.population, lang) : '—'}</div>
              <div className="text-[10px] text-muted-foreground">{t('area.populationSub')}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Ruler className="size-3.5" aria-hidden /> {t('area.areaKm2')}
              </div>
              <div className="num mt-1 font-display text-lg font-extrabold">
                {councils.length ? formatNumber(totals.areaKm2, lang) : '—'} <span className="text-xs font-semibold text-muted-foreground">km²</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{t('area.areaSub')}</div>
            </div>
          </div>

          <div>
            <Button className="w-full" variant={censusApplied ? 'outline' : 'default'} disabled={!councils.length} onClick={onApplyCensus}>
              {censusApplied ? <Check /> : <Users />}
              {censusApplied ? t('area.applied') : t('area.useCensus')}
            </Button>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t('area.censusNote')}</p>
          </div>

          <div className={cn('mt-auto rounded-xl border p-3.5', councils.length ? 'border-border bg-muted/40' : 'border-dashed border-border')}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{t('area.context')}</span>
              {councils.length > 0 && <ClassBadge value={totals.meanRisk} size="sm" />}
            </div>
            {councils.length ? (
              <>
                <div className="mt-2">
                  <ScoreBar label={t('area.contextMean')} value={totals.meanRisk} dim="risk" compact />
                </div>
                {councils.length > 1 && <div className="num mt-1.5 text-[11px] text-muted-foreground">{t('area.contextRange', { min: formatScore(totals.minRisk), max: formatScore(totals.maxRisk) })}</div>}
                <p className="mt-2 flex gap-1.5 text-[11px] leading-snug text-muted-foreground">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  {t('area.contextNote')}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">{t('area.contextEmpty')}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
