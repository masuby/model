/**
 * "Colour by" controls: overall risk and the three dimensions, each dimension opening onto its own
 * indicator groups. Choose Hazard & Exposure and its groups (Flood, Drought…) appear right under it;
 * choosing one keeps the list open, so moving between neighbouring groups is one click.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DIMENSIONS, type DimensionKey } from '@/engine/risk/hierarchy';
import { parseMetric } from '@/engine/risk/metrics';
import { sourceFor, sourceLabel } from '@/engine/risk/sources';
import { cn } from '@/lib/utils';
import { useExplore } from '../lib/ExploreContext';
import { LENSES, MetricValue } from './bits';

/** Radio-style marker (visual only - the row itself carries the state). */
function RadioMark({ on, small = false }: { on: boolean; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full border transition-colors duration-150',
        small ? 'size-3.5' : 'size-4',
        on ? 'border-primary' : 'border-input group-hover:border-muted-foreground',
      )}
    >
      {on && <span className={cn('rounded-full bg-primary', small ? 'size-1.5' : 'size-2')} />}
    </span>
  );
}

const ROW = 'group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/70';
const SUBROW = 'group -mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-muted/70';

/** The dimension whose indicator groups are listed: the active dimension, or the one of the active group. */
function useOpenDimension(): DimensionKey | null {
  const { metric } = useExplore();
  return metric.kind === 'risk' ? null : metric.dimension;
}

/** A dimension's indicator groups, by category, in model order. */
function groupsOf(dim: DimensionKey) {
  const def = DIMENSIONS.find((d) => d.key === dim)!;
  return def.categories.map((c) => ({ category: c.key, keys: c.indicators.map((ind) => ind.key) }));
}

/**
 * The lens list (desktop panel): the four headline lenses as a radio group (arrow keys move and select,
 * one tab stop), with the open dimension's indicator groups listed under it. Scores are for the selected
 * area, else the official national figure.
 */
export function LensTiles({ labelledBy }: { labelledBy?: string }) {
  const { t } = useTranslation(['explore', 'common']);
  const { model, metric, selected, actions, metricLabel } = useExplore();
  const ref = selected ?? model.national;
  const open = useOpenDimension();
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
          const parent = m.kind === 'dimension' && open === m.dimension;
          return (
            <li key={l.key} role="none">
              <button
                ref={(el) => {
                  radios.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active || (activeIndex < 0 && parent) ? 0 : -1}
                onClick={() => actions.setMetric(l.key)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={ROW}
              >
                <RadioMark on={active} />
                <span className={cn('min-w-0 flex-1 truncate text-sm', active || parent ? 'font-semibold' : 'font-medium')}>{metricLabel(m)}</span>
                <MetricValue metric={m} value={m.get(ref)} className={cn('text-sm', active ? 'font-semibold' : 'text-muted-foreground')} />
              </button>
              {parent && m.dimension && <IndicatorGroups dim={m.dimension} />}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{selected ? t('lens.scoresFor', { name: selected.name }) : t('lens.scoresNational')}</p>
      {!open && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('lens.groupsHint')}</p>}
    </div>
  );
}

/**
 * The open dimension's indicator groups, nested under it: a group of toggle buttons with one tab stop
 * (arrow keys, Home and End move between them).
 */
function IndicatorGroups({ dim }: { dim: DimensionKey }) {
  const { t } = useTranslation(['explore', 'common', 'indicators']);
  const { model, metric, selected, actions } = useExplore();
  const ref = selected ?? model.national;
  const groups = groupsOf(dim);
  const keys = groups.flatMap((g) => g.keys);
  const active = metric.kind === 'indicator' && metric.dimension === dim ? keys.indexOf(metric.indicator!) : -1;
  const [focus, setFocus] = React.useState(Math.max(0, active));
  const buttons = React.useRef<Array<HTMLButtonElement | null>>([]);
  React.useEffect(() => {
    if (active >= 0) setFocus(active);
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? (i + 1) % keys.length
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? (i - 1 + keys.length) % keys.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? keys.length - 1
              : null;
    if (next == null) return;
    e.preventDefault();
    setFocus(next);
    buttons.current[next]?.focus();
  };

  return (
    <div role="group" aria-label={t('lens.groupsOf', { dimension: t(`common:dimensions.${dim}`) })} className="mt-0.5 mb-2 ml-[0.4rem] border-l border-border pl-4">
      {groups.map((g) => (
        <div key={g.category}>
          <p className="pt-2 pb-0.5 text-xs font-medium text-muted-foreground">{t(`common:categories.${g.category}`)}</p>
          <ul>
            {g.keys.map((key) => {
              const i = keys.indexOf(key);
              const m = parseMetric(`ind:${dim}:${key}`);
              const on = i === active;
              return (
                <li key={key}>
                  <button
                    ref={(el) => {
                      buttons.current[i] = el;
                    }}
                    type="button"
                    aria-pressed={on}
                    tabIndex={i === focus ? 0 : -1}
                    onFocus={() => setFocus(i)}
                    onClick={() => actions.setMetric(m.key)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={SUBROW}
                  >
                    <RadioMark on={on} small />
                    <span className={cn('min-w-0 flex-1 truncate text-sm', on ? 'font-semibold' : 'text-foreground/90')}>{t(`indicators:${key}`)}</span>
                    <MetricValue metric={m} value={m.get(ref)} className={cn('text-xs', on ? 'font-semibold' : 'text-muted-foreground')} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Underline tabs for the mobile sheet peek. */
export function LensChips() {
  const { model, metric, selected, actions, metricLabel } = useExplore();
  const ref = selected ?? model.national;
  const open = useOpenDimension();
  return (
    <>
      {LENSES.map((l) => {
        const m = parseMetric(l.key);
        const active = metric.key === l.key || (m.kind === 'dimension' && open === m.dimension);
        return (
          <button
            key={l.key}
            type="button"
            aria-pressed={metric.key === l.key}
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

/** The mobile second row: the open dimension's indicator groups as chips (scrolls sideways). */
export function IndicatorChips() {
  const { t } = useTranslation(['explore', 'common', 'indicators']);
  const { metric, actions } = useExplore();
  const dim = useOpenDimension();
  if (!dim) return null;
  const keys = groupsOf(dim).flatMap((g) => g.keys);
  return (
    <div
      role="group"
      aria-label={t('lens.groupsOf', { dimension: t(`common:dimensions.${dim}`) })}
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pt-2.5 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {keys.map((key) => {
        const on = metric.kind === 'indicator' && metric.indicator === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => actions.setMetric(`ind:${dim}:${key}`)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors duration-150',
              on ? 'border-foreground bg-foreground font-semibold text-background' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`indicators:${key}`)}
          </button>
        );
      })}
      <span aria-hidden className="w-2 shrink-0" />
    </div>
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
