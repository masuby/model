/**
 * Recharts mark renderers for the Insights charts (Recharts 3 deprecates <Cell>; per-datum colour is
 * done through the `shape` prop). Marks follow the house spec: rounded data-end, square baseline, a
 * 2px surface gap between touching marks, and a visible lift on hover/focus.
 */
import * as React from 'react';
import { Rectangle, type BarShapeProps } from 'recharts';

type Radius = number | [number, number, number, number];

export function useBarShape({
  colorOf,
  radius = 0,
  gap,
  activeStroke,
}: {
  colorOf: (payload: unknown) => string;
  radius?: Radius;
  /** Surface colour drawn as a 1px inner stroke on each side → 2px gap between touching segments. */
  gap?: string;
  activeStroke?: string;
}) {
  return React.useCallback(
    (p: BarShapeProps) => {
      if (!(p.width > 0.5) || !(p.height > 0.5)) return <g />;
      const active = p.isActive;
      return (
        <Rectangle
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          radius={radius}
          fill={colorOf(p.payload)}
          fillOpacity={active ? 1 : 0.9}
          stroke={active && activeStroke ? activeStroke : gap}
          strokeWidth={active && activeStroke ? 1.5 : gap ? 2 : 0}
          style={{ transition: 'fill-opacity 150ms ease' }}
        />
      );
    },
    [colorOf, radius, gap, activeStroke],
  );
}
