import * as React from 'react';
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

/**
 * Scroll-spy: the id of the last section whose top has passed `offset` px from the viewport top,
 * plus reading progress (0–1) through the document.
 */
export function useScrollSpy(ids: readonly string[], offset = 140): { active: string; progress: number } {
  const [state, setState] = React.useState<{ active: string; progress: number }>({ active: ids[0] ?? '', progress: 0 });

  React.useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY >= max - 4) current = ids[ids.length - 1] ?? current;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setState((s) => (s.active === current && Math.abs(s.progress - progress) < 0.005 ? s : { active: current, progress }));
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

  return state;
}
