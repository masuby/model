/**
 * Deferred rendering for the long Area Profile.
 *
 * Below-the-fold sections (charts, the full indicator table, place lists…) are the bulk of the page's
 * main-thread work. `Deferred` renders a fixed-height placeholder until the section approaches the
 * viewport, then mounts the real content once. Everything is rendered at once when:
 *   • the page is about to print (`beforeprint`, or the print media query turning on) - paper must be
 *     complete, so the update is flushed synchronously before the browser lays out the print copy;
 *   • the reader jumps to a section from the in-page navigation (so the scroll target does not move
 *     while placeholders above it are swapped for real content).
 */
import * as React from 'react';
import { flushSync } from 'react-dom';

interface DeferredState {
  /** True once every deferred section has been asked to render. */
  all: boolean;
  /** True once the page has entered print mode (charts then use a paper-sized first render). */
  printing: boolean;
  /** Render every deferred section now (synchronously). */
  revealAll: () => void;
  /** Render everything, give charts two frames to measure, then open the print dialog. */
  print: () => void;
}

const DeferredContext = React.createContext<DeferredState>({ all: true, printing: false, revealAll: () => {}, print: () => window.print() });

export const useDeferred = () => React.useContext(DeferredContext);

export function DeferredProvider({ children, prepare }: { children: React.ReactNode; /** Async work to finish before printing (e.g. loading chart code). */ prepare?: () => Promise<unknown> }) {
  const [all, setAll] = React.useState(false);
  const [printing, setPrinting] = React.useState(false);

  const revealAll = React.useCallback(() => {
    flushSync(() => setAll(true));
  }, []);

  React.useEffect(() => {
    const onPrint = () => {
      flushSync(() => {
        setAll(true);
        setPrinting(true);
      });
    };
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
    const onMq = (e: MediaQueryListEvent) => {
      if (e.matches) onPrint();
    };
    window.addEventListener('beforeprint', onPrint);
    mq?.addEventListener?.('change', onMq);
    return () => {
      window.removeEventListener('beforeprint', onPrint);
      mq?.removeEventListener?.('change', onMq);
    };
  }, []);

  const print = React.useCallback(() => {
    void Promise.resolve(prepare?.()).finally(() => {
      flushSync(() => {
        setAll(true);
        setPrinting(true);
      });
      // Charts measure their width with ResizeObserver after layout; let that happen before printing.
      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    });
  }, [prepare]);

  const value = React.useMemo(() => ({ all, printing, revealAll, print }), [all, printing, revealAll, print]);
  return <DeferredContext.Provider value={value}>{children}</DeferredContext.Provider>;
}

/**
 * Mounts `children` only once the placeholder comes within `rootMargin` of the viewport. The caller
 * passes the content's measured height for the current layout (phone / tablet / desktop - see
 * placeholderHeights in AreaPage), so the scrollbar, the section nav and content above the viewport
 * stay put when the section mounts.
 */
export function Deferred({ minHeight, children, rootMargin = '800px 0px' }: { minHeight: number | string; children: React.ReactNode; rootMargin?: string }) {
  const { all } = useDeferred();
  const ref = React.useRef<HTMLDivElement>(null);
  const [near, setNear] = React.useState(() => typeof IntersectionObserver === 'undefined');
  const shown = near || all;

  React.useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          setNear(true);
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  if (shown) return <>{children}</>;
  return <div ref={ref} className="area-deferred" style={{ minHeight }} aria-hidden />;
}
