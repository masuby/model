/** "Colour by" controls: overall risk + the three dimensions, and a searchable indicator picker. */
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, RotateCcw, Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSION_COLORS } from '@/components/charts/theme';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives';
import { DIMENSIONS } from '@/engine/risk/hierarchy';
import { parseMetric, RAMP_STOPS, rampColor } from '@/engine/risk/metrics';
import { indicatorValue } from '@/engine/risk/model';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import { cn, formatScore } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { LENSES, ScorePill } from './bits';

/** 2×2 tiles (desktop panel / expanded sheet). Scores are for the selected area, else the official national figure. */
export function LensTiles() {
  const { t } = useTranslation('explore');
  const { model, metric, selected, actions, metricLabel } = useExplore();
  const ref = selected ?? model.national;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
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
                'group relative flex min-h-[74px] flex-col justify-between overflow-hidden rounded-xl border bg-card py-2.5 pr-2.5 pl-3.5 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-soft)]',
                active ? 'border-primary/50 bg-primary/[0.05] shadow-[var(--shadow-soft)] ring-2 ring-primary/25' : 'border-border hover:border-foreground/15',
              )}
            >
              <span aria-hidden className="absolute inset-y-2 left-1.5 w-[3px] rounded-full" style={{ background: l.color }} />
              <span className="text-[13px] leading-snug font-semibold">{metricLabel(m)}</span>
              <span className="mt-2 flex items-center justify-between gap-2">
                <ScorePill value={m.get(ref)} scale={m.scale} />
                {active && <Check className="size-4 text-primary" aria-hidden />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{selected ? t('lens.scoresFor', { name: selected.name }) : t('lens.scoresNational')}</p>
    </div>
  );
}

/** Horizontal chips (mobile sheet peek). */
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
              'inline-flex shrink-0 items-center gap-2 rounded-full border py-1 pr-1 pl-2.5 text-xs font-semibold whitespace-nowrap transition-colors',
              active ? 'border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/30' : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            <span aria-hidden className="size-2 rounded-full" style={{ background: l.color }} />
            {metricLabel(m, true)}
            <ScorePill value={m.get(ref)} scale={m.scale} size="xs" className="rounded-full" />
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
  const gradient = `linear-gradient(135deg, ${RAMP_STOPS.join(',')})`;

  const trigger =
    variant === 'field' ? (
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left shadow-xs transition-colors hover:bg-muted/60',
          active ? 'border-primary/50 ring-2 ring-primary/25' : 'border-border',
        )}
      >
        <span aria-hidden className="size-8 shrink-0 rounded-lg ring-1 ring-black/5" style={{ background: gradient }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium text-muted-foreground">
            {active ? `${t(`common:dimensions.${active.dim}Short`)} · ${t('lens.indicator')}` : t('lens.indicator')}
          </span>
          <span className={cn('block truncate text-sm font-semibold', !active && 'text-muted-foreground')}>{activeLabel ?? t('lens.pickIndicator')}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          'inline-flex max-w-52 shrink-0 items-center gap-2 rounded-full border py-1 pr-2.5 pl-1 text-xs font-semibold whitespace-nowrap transition-colors',
          active ? 'border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/30' : 'border-border bg-card text-muted-foreground hover:text-foreground',
        )}
      >
        <span aria-hidden className="size-5 shrink-0 rounded-full ring-1 ring-black/5" style={{ background: gradient }} />
        <span className="truncate">{activeLabel ?? t('lens.indicatorChip')}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
      </button>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-[min(23rem,calc(100vw-2rem))] overflow-hidden p-0">
        <Command
          label={t('lens.pickIndicator')}
          loop
          className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <Command.Input autoFocus placeholder={t('lens.searchIndicator')} className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Command.List className="max-h-[min(55vh,22rem)] overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">{t('lens.noIndicator')}</Command.Empty>
            {DIMENSIONS.flatMap((d) =>
              d.categories.map((c) => (
                <Command.Group
                  key={`${d.key}:${c.key}`}
                  value={`${d.key}:${c.key}`}
                  heading={
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="size-1.5 rounded-full" style={{ background: DIMENSION_COLORS[d.key] }} />
                      {t(`common:dimensions.${d.key}Short`)} · {t(`common:categories.${c.key}`)}
                    </span>
                  }
                >
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
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
                      >
                        <span aria-hidden className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: rampColor(v) }} />
                        <span className={cn('min-w-0 flex-1 truncate', isActive && 'font-semibold')}>{t(`indicators:${ind.key}`)}</span>
                        <span className="num text-xs font-semibold text-muted-foreground">{formatScore(v)}</span>
                        <Check className={cn('size-4 text-primary', !isActive && 'invisible')} aria-hidden />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )),
            )}
          </Command.List>
          <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">{selected ? t('lens.valuesFor', { name: selected.name }) : t('lens.valuesNational')}</div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Description + provenance of the active indicator lens. */
export function IndicatorDetails() {
  const { t } = useTranslation(['explore', 'indicators']);
  const { metric, actions } = useExplore();
  if (metric.kind !== 'indicator' || !metric.dimension || !metric.indicator) return null;
  const src = sourceFor(metric.dimension, metric.indicator);
  return (
    <div className="mt-2.5 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs leading-relaxed">
      <p className="text-muted-foreground">{t(`indicators:desc.${metric.indicator}`)}</p>
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="font-semibold text-foreground">{t('lens.source')}</dt>
        <dd className="text-muted-foreground">{sourceLabel(src)}</dd>
        <dt className="font-semibold text-foreground">{t('lens.resolution')}</dt>
        <dd className="text-muted-foreground">{t(`resolution.${src.resolution}`)}</dd>
      </dl>
      <button type="button" onClick={() => actions.setMetric('risk')} className="mt-2.5 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
        <RotateCcw className="size-3.5" aria-hidden />
        {t('lens.backToRisk')}
      </button>
    </div>
  );
}
