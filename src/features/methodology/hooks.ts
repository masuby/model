import * as React from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Scroll a section into view (its CSS scroll-margin clears the sticky header) and move keyboard focus
 * to its heading, so screen-reader and keyboard users land where sighted users do.
 */
export function scrollToId(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const heading = document.getElementById(`${id}-title`);
  heading?.focus({ preventScroll: true });
  return true;
}

/** Honour `/methodology#sources` on arrival and on in-page hash changes (e.g. the footer link). */
export function useHashScroll(): void {
  const { hash } = useLocation();
  React.useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    // Wait a beat: the app shell resets scroll on route change, and the page may still be laying out.
    const timer = window.setTimeout(() => scrollToId(id), 90);
    return () => window.clearTimeout(timer);
  }, [hash]);
}

/** Scroll-spy: the id of the last section whose top has passed `offset` px from the viewport top. */
export function useScrollSpy(ids: readonly string[], offset = 140): string {
  const [active, setActive] = React.useState<string>(ids[0] ?? '');

  React.useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY >= max - 4) current = ids[ids.length - 1] ?? current;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids, offset]);

  return active;
}

/**
 * Mount far-below-the-fold content after the first paint, in `stages` batches: the page paints its header
 * and opening sections at once, and each later batch renders in a background transition a couple of
 * frames after the previous one, so no single task blocks the page for long. Returns how many batches
 * are mounted (0 … stages). `immediate` (arriving on a `#section` link) mounts everything at once so the
 * target can be scrolled to; printing does too, and `showAll` does so synchronously.
 */
export function useDeferredMount(immediate: boolean, stages: number): [number, () => void] {
  const [stage, setStage] = React.useState(immediate ? stages : 0);
  const showAll = React.useCallback(() => flushSync(() => setStage(stages)), [stages]);

  React.useEffect(() => {
    if (stage >= stages) return;
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => React.startTransition(() => setStage((s) => Math.min(stages, s + 1))));
    });
    window.addEventListener('beforeprint', showAll);
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
      window.removeEventListener('beforeprint', showAll);
    };
  }, [stage, stages, showAll]);

  return [immediate ? stages : stage, showAll];
}
