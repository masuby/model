import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout/Page';
import { ClassDot } from '@/components/risk/RiskBadge';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';
import { useDeferred } from './Deferred';

/**
 * Sticky in-page navigation with scroll-spy: a solid bar with underline tabs, sitting just below the
 * app header. Jumping to a section first renders any deferred sections so the target does not move.
 *
 * The active tab is computed from positions on every (rAF-throttled) scroll and resize: the last
 * section whose top has passed just under the bar, the first section when none has, and the last one
 * at the very bottom of the page. This stays right after instant jumps (scrollbar drags, Home key,
 * scrollTo(0, 0)), which an IntersectionObserver band would miss.
 */
export function SectionNav({ sections, unit }: { sections: Array<{ id: string; label: string }>; unit: Unit }) {
  const { t } = useTranslation('area');
  const { revealAll } = useDeferred();
  const [active, setActive] = React.useState(sections[0]?.id);
  const listRef = React.useRef<HTMLUListElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);
  /** While a tab-initiated smooth scroll runs, hold the chosen tab instead of stepping through the others. */
  const lockRef = React.useRef<number | null>(null);

  const measure = React.useCallback(() => {
    if (lockRef.current != null || !sections.length) return;
    const line = (barRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
    const doc = document.documentElement;
    let current = sections[0].id;
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
      current = sections[sections.length - 1].id;
    } else {
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
    }
    setActive(current);
  }, [sections]);

  React.useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [measure]);

  // Release the lock once the smooth scroll has settled (scrollend where supported, else a timeout).
  React.useEffect(() => {
    const release = () => {
      if (lockRef.current == null) return;
      window.clearTimeout(lockRef.current);
      lockRef.current = null;
      measure();
    };
    window.addEventListener('scrollend', release);
    return () => {
      window.removeEventListener('scrollend', release);
      if (lockRef.current != null) window.clearTimeout(lockRef.current);
    };
  }, [measure]);

  // Keep the active tab in view on narrow screens (scroll only the strip, never the page).
  React.useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (list && el && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }
  }, [active]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    revealAll();
    setActive(id);
    if (lockRef.current != null) window.clearTimeout(lockRef.current);
    lockRef.current = window.setTimeout(() => {
      lockRef.current = null;
      measure();
    }, 1200);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div ref={barRef} className="no-print sticky top-[var(--header-h)] z-[900] border-y border-border bg-background">
      <PageContainer className="flex items-stretch gap-6">
        <div className="hidden shrink-0 items-center gap-2 border-r border-border pr-6 text-sm lg:flex">
          <ClassDot value={unit.risk} />
          <span className="max-w-48 truncate font-medium">{unit.name}</span>
          <span className="num text-muted-foreground">{formatScore(unit.risk)}</span>
        </div>
        <nav aria-label={t('nav.label')} className="min-w-0 flex-1">
          <ul ref={listRef} className="-mx-3 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  data-id={s.id}
                  onClick={(e) => go(e, s.id)}
                  aria-current={active === s.id ? 'location' : undefined}
                  className={cn(
                    'relative inline-flex h-11 items-center px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                    'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:transition-colors after:duration-150',
                    active === s.id ? 'text-foreground after:bg-foreground' : 'text-muted-foreground after:bg-transparent hover:text-foreground',
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageContainer>
    </div>
  );
}
