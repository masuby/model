/**
 * StaticMap - a lightweight SVG choropleth (no Leaflet, no GeoJSON at runtime). Paths are pre-projected
 * and simplified by scripts/build-svg-map.mjs. Use it wherever pan/zoom is not needed: the home hero,
 * area locators, click-to-select pickers. For full exploration use RiskMap.
 *
 * With `onSelect`, the areas are buttons: a click, Enter or Space selects one, and they are in the tab
 * order (the emphasised ones only, when a set is emphasised, so a region's councils are a few tab stops
 * rather than all 195). `keyboard={false}` keeps a map pointer-only, for a small inset beside a bigger map.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import councilPaths from '@/data/tanzania-svg-councils.json';
import regionPaths from '@/data/tanzania-svg-regions.json';
import waterPaths from '@/data/tanzania-svg-water.json';
import type { ClassKey } from '@/engine/risk/classes';
import { metricColor, type Metric } from '@/engine/risk/metrics';
import { placeKey } from '@/engine/risk/model';
import type { RiskModel, Unit } from '@/engine/risk/types';
import { cn, formatNumber, formatScore } from '@/lib/utils';

interface PathSet {
  viewBox: string;
  width: number;
  height: number;
  units: Array<{ id: string; d: string }>;
}
const COUNCILS = councilPaths as PathSet;
const REGIONS = regionPaths as PathSet;
const WATER = (waterPaths as { water: string[] }).water;
/** The lakes that cross the border, whole: drawn first in the water colour, so the lake is one surface across the border. */
const LAKES_BEYOND = (waterPaths as { beyond?: string[] }).beyond ?? [];

export interface StaticMapProps {
  model: RiskModel;
  level?: 'council' | 'region';
  metric: Metric;
  /** Units drawn with a strong outline. */
  selectedIds?: string[];
  /** Units NOT in this list are drawn muted (e.g. the councils of one region). */
  emphasiseIds?: string[];
  filterClass?: ClassKey | null;
  onSelect?: (unit: Unit) => void;
  /** Zoom the view to this unit (with context around it). */
  focusId?: string | null;
  /** Show a hover card with the value. */
  hoverCard?: boolean;
  /** Extra line in the hover card, e.g. "Click to add". */
  hint?: string;
  /** Put the selectable areas in the tab order (default true with `onSelect`). */
  keyboard?: boolean;
  className?: string;
  'aria-label'?: string;
}

export default function StaticMap({
  model,
  level = 'council',
  metric,
  selectedIds = [],
  emphasiseIds,
  filterClass = null,
  onSelect,
  focusId = null,
  hoverCard = true,
  hint,
  keyboard = true,
  className,
  'aria-label': ariaLabel,
}: StaticMapProps) {
  const { t, i18n } = useTranslation();
  const set = level === 'region' ? REGIONS : COUNCILS;
  const unitFor = React.useCallback((id: string) => (level === 'region' ? model.byId.get(`R-${placeKey(id)}`) : model.byId.get(id)) ?? null, [model, level]);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hover, setHover] = React.useState<{ unit: Unit; x: number; y: number } | null>(null);
  const [viewBox, setViewBox] = React.useState(set.viewBox);

  // Zoom to the focused unit using its rendered bounding box (pads by 60% for context).
  React.useLayoutEffect(() => {
    if (!focusId) {
      setViewBox(set.viewBox);
      return;
    }
    const el = svgRef.current?.querySelector<SVGPathElement>(`[data-id="${CSS.escape(focusId)}"]`);
    // getBBox needs a layout engine (absent in tests, and it throws on an element not yet rendered).
    if (!el || typeof el.getBBox !== 'function') return;
    let b: DOMRect;
    try {
      b = el.getBBox();
    } catch {
      return;
    }
    const size = Math.max(b.width, b.height) * 2.2 + 40;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    setViewBox(`${Math.round(cx - size / 2)} ${Math.round(cy - size / 2)} ${Math.round(size)} ${Math.round(size)}`);
  }, [focusId, set.viewBox]);

  const selected = new Set(selectedIds);
  const emphasised = emphasiseIds ? new Set(emphasiseIds) : null;
  const label = ariaLabel ?? t('a11y.mapOf', { metric: t(metric.labelKey) });
  const selectable = !!onSelect;

  const onMove = (e: React.PointerEvent<SVGPathElement>, unit: Unit) => {
    if (!hoverCard) return;
    const box = svgRef.current?.parentElement?.getBoundingClientRect();
    if (!box) return;
    setHover({ unit, x: e.clientX - box.left, y: e.clientY - box.top });
  };
  // Keyboard focus shows the same card as the pointer, over the middle of the area.
  const onFocus = (e: React.FocusEvent<SVGPathElement>, unit: Unit) => {
    if (!hoverCard) return;
    const box = svgRef.current?.parentElement?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect?.();
    if (!box || !r) return;
    setHover({ unit, x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
  };

  return (
    <div
      className={cn('relative select-none', focusId && 'overflow-hidden rounded-md border border-border bg-[var(--map-bg)]', className)}
      onPointerLeave={() => setHover(null)}
    >
      {/* A picture when it only shows; a group of buttons when the areas select. */}
      <svg ref={svgRef} viewBox={viewBox} className="size-full" role={selectable ? 'group' : 'img'} aria-label={label} preserveAspectRatio="xMidYMid meet">
        <g aria-hidden>
          {LAKES_BEYOND.map((d, i) => (
            <path key={i} d={d} fill="var(--map-water)" stroke="none" pointerEvents="none" />
          ))}
        </g>
        <g>
          {set.units.map((p) => {
            const unit = unitFor(p.id);
            const v = unit ? metric.get(unit) : null;
            const cls = metric.classOf(v);
            const dim = (!!filterClass && cls?.key !== filterClass) || (!!emphasised && !!unit && !emphasised.has(unit.id));
            const focusable = selectable && keyboard && !!unit && (!emphasised || emphasised.has(unit.id));
            return (
              <path
                key={p.id}
                data-id={unit?.id ?? p.id}
                d={p.d}
                fill={metricColor(metric, v)}
                fillOpacity={v == null ? 0.35 : dim ? 0.18 : 1}
                stroke="var(--map-stroke)"
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
                className={cn(selectable && unit && 'cursor-pointer', focusable && 'outline-none focus-visible:[stroke:#0b1324] focus-visible:[stroke-width:2.5px]')}
                role={focusable ? 'button' : undefined}
                tabIndex={focusable ? 0 : undefined}
                aria-label={focusable && unit ? `${unit.name}: ${t(metric.labelKey)} ${formatScore(v)}${cls ? `, ${t(`classes.${cls.key}`)}` : ''}` : undefined}
                onPointerMove={unit ? (e) => onMove(e, unit) : undefined}
                onClick={unit && onSelect ? () => onSelect(unit) : undefined}
                onFocus={focusable && unit ? (e) => onFocus(e, unit) : undefined}
                onBlur={focusable ? () => setHover(null) : undefined}
                onKeyDown={
                  focusable && unit && onSelect
                    ? (e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        onSelect(unit);
                      }
                    : undefined
                }
              />
            );
          })}
        </g>
        <g aria-hidden>
          {/* No outline: a stroke would draw the border as a line across the lake where the national water polygon is clipped. */}
          {WATER.map((d, i) => (
            <path key={i} d={d} fill="var(--map-water)" stroke="none" pointerEvents="none" />
          ))}
        </g>
        {/* Selection outlines drawn last so they sit above neighbours and water. */}
        <g aria-hidden pointerEvents="none">
          {set.units
            .filter((p) => {
              const u = unitFor(p.id);
              return u && selected.has(u.id);
            })
            .map((p) => (
              // Class fills are identical in both themes, so the outline is too: dark line over a light halo.
              <g key={`sel-${p.id}`}>
                <path d={p.d} fill="none" stroke="#ffffff" strokeOpacity={0.9} strokeWidth={4.5} vectorEffect="non-scaling-stroke" />
                <path d={p.d} fill="none" stroke="#0b1324" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          {hover && (
            <g>
              <path d={set.units.find((p) => unitFor(p.id)?.id === hover.unit.id)?.d} fill="none" stroke="#ffffff" strokeOpacity={0.85} strokeWidth={3} vectorEffect="non-scaling-stroke" />
              <path d={set.units.find((p) => unitFor(p.id)?.id === hover.unit.id)?.d} fill="none" stroke="#0b1324" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </g>
      </svg>

      {hover && hoverCard && (
        <div
          className="pointer-events-none absolute z-10 w-56 rounded-md border border-border bg-elevated px-3 py-2.5 text-xs shadow-[var(--shadow-lift)]"
          style={{ left: Math.min(hover.x + 14, (svgRef.current?.parentElement?.clientWidth ?? 0) - 232), top: Math.max(4, hover.y - 12) }}
        >
          <div className="text-sm font-semibold leading-tight">{hover.unit.name}</div>
          <div className="text-muted-foreground">{hover.unit.level === 'council' ? hover.unit.region : t(`levels.${hover.unit.level}`)}</div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground">{t(metric.labelKey)}</span>
            <span className="num text-sm font-semibold">
              {formatScore(metric.get(hover.unit))}
              {metric.classOf(metric.get(hover.unit)) && <span className="ml-1.5 font-normal text-muted-foreground">{t(`classes.${metric.classOf(metric.get(hover.unit))!.key}`)}</span>}
            </span>
          </div>
          {hover.unit.exposure?.population ? (
            <div className="mt-0.5 flex justify-between gap-3 text-muted-foreground">
              <span>{t('labels.population')}</span>
              <span className="num">{formatNumber(hover.unit.exposure.population, i18n.language)}</span>
            </div>
          ) : null}
          {hint && <div className="mt-2 border-t border-border pt-1.5 text-muted-foreground">{hint}</div>}
        </div>
      )}
    </div>
  );
}
