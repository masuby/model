/** "Colour by" controls: overall risk + the three dimensions, and a searchable indicator picker. */
import { Command } from 'cmdk';
import { Check, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { parseMetric, rampColor } from '@/engine/risk/metrics';
import { indicatorValue } from '@/engine/risk/model';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import { cn, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { LENSES, MetricValue } from './bits';

/** Radio-style marker (visual only - the row itself carries the state). */
function RadioMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-150',
        on ? 'border-primary' : 'border-input group-hover:border-muted-foreground',
      )}
    >
      {on && <span className="size-2 rounded-full bg-primary" />}
    </span>
  );
}

const ROW = 'group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/70';

/**
 * The lens list (desktop panel): the four headline lenses as a radio group (arrow keys move and select,
 * one tab stop), then the indicator picker as a fifth row. Scores are for the selected area, else the
 * official national figure.
 */
export function LensTiles({ labelledBy }: { labelledBy?: string }) {
  const { t } = useTranslation('explore');
  const { model, metric, selected, actions, metricLabel } = useExplore();
  const ref = selected ?? model.national;
  const radios = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = LENSES.findIndex((l) => l.key === metric.key);
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + LENSES.length) % LENSES.length;
    radios.current[next]?.focus();
    actions.setMetric(LENSES[next].key);
  };
  return (
    <div>
      <ul role="radiogroup" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : t('lens.label')} className="space-y-0.5">
        {LENSES.map((l, i) => {
          const m = parseMetric(l.key);
          const active = metric.key === l.key;
          return (
            <li key={l.key} role="none">
              <button
                ref={(el) => {
                  radios.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active || (activeIndex < 0 && i === 0) ? 0 : -1}
                onClick={() => actions.setMetric(l.key)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={ROW}
              >
                <RadioMark on={active} />
                <span className={cn('min-w-0 flex-1 truncate text-sm', active ? 'font-semibold' : 'font-medium')}>{metricLabel(m)}</span>
                <MetricValue metric={m} value={m.get(ref)} className={cn('text-sm', active ? 'font-semibold' : 'text-muted-foreground')} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-0.5">
        <IndicatorPicker />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{selected ? t('lens.scoresFor', { name: selected.name }) : t('lens.scoresNational')}</p>
    </div>
  );
}

/** Underline tabs for the mobile sheet peek. */
export function LensChips() {
  const { model, metric, selected, actions, metricLabel } = useExplore();
  const ref = selected ?? model.national;
  return (
    <>
      {LENSES.map((l) => {
        const m = parseMetric(l.key);
        const active = metric.key === l.key;
        return (
          <button
            key={l.key}
            type="button"
            aria-pressed={active}
            onClick={() => actions.setMetric(l.key)}
            className={cn(
              '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 pt-1 pb-2.5 text-sm whitespace-nowrap transition-colors duration-150',
              active ? 'border-foreground font-semibold text-foreground' : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            {metricLabel(m, true)}
            <MetricValue metric={m} value={m.get(ref)} className="text-xs font-normal text-muted-foreground" />
          </button>
        );
      })}
    </>
  );
}

/** Searchable indicator picker, grouped Dimension → Category. */
export function IndicatorPicker({ variant = 'field' }: { variant?: 'field' | 'chip' }) {
  const { t } = useTranslation(['explore', 'common', 'indicators']);
  const { model, metric, selected, actions } = useExplore();
  const [open, setOpen] = React.useState(false);
  const ref = selected ?? model.national;
  const active = metric.kind === 'indicator' ? { dim: metric.dimension!, key: metric.indicator! } : null;
  const activeLabel = active ? t(`indicators:${active.key}`) : null;

  const trigger =
    variant === 'field' ? (
      <button type="button" aria-haspopup="dialog" className={ROW}>
        <RadioMark on={!!active} />
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-sm', active ? 'font-semibold' : 'font-medium')}>
            {activeLabel ?? t('lens.indicator')}
            {active && <span className="sr-only"> ({t('lens.selected')})</span>}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {active ? `${t(`common:dimensions.${active.dim}Short`)} · ${t('lens.indicator')}` : t('lens.pickIndicator')}
          </span>
        </span>
        {active && <MetricValue metric={metric} value={metric.get(ref)} className="text-sm font-semibold" />}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
    ) : (
      <button
        type="button"
        aria-haspopup="dialog"
        className={cn(
          '-mb-px inline-flex max-w-52 shrink-0 items-center gap-1.5 border-b-2 pt-1 pb-2.5 text-sm whitespace-nowrap transition-colors duration-150',
          active ? 'border-foreground font-semibold text-foreground' : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
        )}
      >
        <span className="truncate">
          {activeLabel ?? t('lens.indicatorChip')}
          {active && <span className="sr-only"> ({t('lens.selected')})</span>}
        </span>
        <ChevronDown className="size-3.5 shrink-0 opacity-70" />
      </button>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-[min(23rem,calc(100vw-2rem))] overflow-hidden p-0">
        <Command
          label={t('lens.pickIndicator')}
          loop
          className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <Command.Input autoFocus placeholder={t('lens.searchIndicator')} className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Command.List className="max-h-[min(55vh,22rem)] overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">{t('lens.noIndicator')}</Command.Empty>
            {DIMENSIONS.flatMap((d) =>
              d.categories.map((c) => (
                <Command.Group key={`${d.key}:${c.key}`} value={`${d.key}:${c.key}`} heading={`${t(`common:dimensions.${d.key}Short`)} · ${t(`common:categories.${c.key}`)}`}>
                  {c.indicators.map((ind) => {
                    const v = indicatorValue(ref, d.key, ind.key);
                    const isActive = active?.dim === d.key && active.key === ind.key;
                    return (
                      <Command.Item
                        key={ind.key}
                        value={`${d.key}:${ind.key}`}
                        keywords={[t(`indicators:${ind.key}`), ind.en, t(`common:categories.${c.key}`), t(`common:dimensions.${d.key}`)]}
                        onSelect={() => {
                          actions.setMetric(`ind:${d.key}:${ind.key}`);
                          setOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
                      >
                        <span className={cn('min-w-0 flex-1 truncate', isActive && 'font-semibold')}>{t(`indicators:${ind.key}`)}</span>
                        <span className="num inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: rampColor(v) }} />
                          {formatScore(v)}
                        </span>
                        <Check className={cn('size-4 text-primary', !isActive && 'invisible')} aria-hidden />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )),
            )}
          </Command.List>
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">{selected ? t('lens.valuesFor', { name: selected.name }) : t('lens.valuesNational')}</div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Description + provenance of the active indicator lens, as a ruled note. */
export function IndicatorDetails() {
  const { t } = useTranslation(['explore', 'indicators']);
  const { metric, actions } = useExplore();
  if (metric.kind !== 'indicator' || !metric.dimension || !metric.indicator) return null;
  const src = sourceFor(metric.dimension, metric.indicator);
  return (
    <div className="mt-4 border-l-2 border-border pl-4 text-sm leading-relaxed">
      <p className="text-muted-foreground">{t(`indicators:desc.${metric.indicator}`)}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="font-medium text-foreground">{t('lens.source')}</dt>
        <dd className="text-muted-foreground">{sourceLabel(src)}</dd>
        <dt className="font-medium text-foreground">{t('lens.resolution')}</dt>
        <dd className="text-muted-foreground">{t(`resolution.${src.resolution}`)}</dd>
      </dl>
      <button type="button" onClick={() => actions.setMetric('risk')} className="mt-3 text-sm font-medium text-primary hover:underline">
        {t('lens.backToRisk')}
      </button>
    </div>
  );
}
