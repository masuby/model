import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { Metric } from '@/engine/risk/metrics';

/** Live `matchMedia` result (false during SSR/tests). */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches),
    () => false,
  );
}

/**
 * Height of the app header (flag rule + bar + hairline border), measured so the explorer fills the
 * viewport exactly - no page scroll, whatever the header ends up being.
 */
export function useHeaderHeight(fallback = 68): number {
  const [h, setH] = React.useState(fallback);
  React.useLayoutEffect(() => {
    const el = document.querySelector('header');
    if (!el) return;
    const measure = () => setH(Math.round(el.getBoundingClientRect().height) || fallback);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return h;
}

/** Callback ref + observed border-box height of an element (measured before paint on attach). */
export function useElementHeight<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [h, setH] = React.useState(0);
  const roRef = React.useRef<ResizeObserver | null>(null);
  const ref = React.useCallback((node: T | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!node) return;
    setH(node.getBoundingClientRect().height);
    const ro = new ResizeObserver(() => setH(node.getBoundingClientRect().height));
    ro.observe(node);
    roRef.current = ro;
  }, []);
  React.useEffect(() => () => roRef.current?.disconnect(), []);
  return [ref, h];
}

/** Translated label for a metric (risk, a dimension, or a single indicator). */
export function useMetricLabel() {
  const { t } = useTranslation(['explore', 'common', 'indicators']);
  return React.useCallback(
    (m: Pick<Metric, 'kind' | 'dimension' | 'indicator'>, short = false): string => {
      if (m.kind === 'risk') return t('common:informRisk');
      if (m.kind === 'dimension') return t(`common:dimensions.${m.dimension}${short ? 'Short' : ''}`);
      return t(`indicators:${m.indicator}`);
    },
    [t],
  );
}
