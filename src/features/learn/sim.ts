/**
 * Pure helpers behind the lesson simulators (unit-tested).
 */
import type { SeverityInput } from '@/engine/severity/engine';

/**
 * Scale a severity scenario to a new number of people affected: displaced, deaths and people at each
 * level of humanitarian conditions scale in proportion, so the crisis keeps its shape but changes size.
 * People affected never exceed the people living in the area.
 */
export function scaleScenario(base: SeverityInput, affected: number): SeverityInput {
  const cap = typeof base.peopleInArea === 'number' && base.peopleInArea > 0 ? base.peopleInArea : Infinity;
  const people = Math.max(0, Math.min(cap, Math.round(affected)));
  const k = base.peopleAffected ? people / base.peopleAffected : 1;
  const sc = (x: number | null | undefined) => (typeof x === 'number' ? Math.round(x * k) : x);
  const lv = base.levels ?? {};
  return {
    ...base,
    peopleAffected: people,
    displaced: sc(base.displaced),
    fatalities: sc(base.fatalities),
    levels: { 5: sc(lv[5]), 4: sc(lv[4]), 3: sc(lv[3]), 2: sc(lv[2]) },
  };
}

/** Map a 0…steps slider position onto a log scale between min and max (and back). */
export const logSliderToValue = (s: number, min: number, max: number, steps: number): number =>
  Math.round(10 ** (Math.log10(min) + (Math.max(0, Math.min(steps, s)) / steps) * (Math.log10(max) - Math.log10(min))));
export const valueToLogSlider = (v: number, min: number, max: number, steps: number): number =>
  Math.max(0, Math.min(steps, Math.round(((Math.log10(Math.max(v, min)) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * steps)));
