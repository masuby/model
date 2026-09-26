import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout/Page';
import { ClassDot } from '@/components/risk/RiskBadge';
import type { Unit } from '@/engine/risk/types';
import { cn, formatScore } from '@/lib/utils';

/** Sticky in-page navigation with scroll-spy. Sits just below the app header (3 px flag rule + 64 px bar + 1 px border). */
export function SectionNav({ sections, unit }: { sections: Array<{ id: string; label: string }>; unit: Unit }) {
  const { t } = useTranslation('area');
  const [active, setActive] = React.useState(sections[0]?.id);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Keep the active pill in view on narrow screens.
  React.useEffect(() => {
    // Scroll only the pill strip (never the page, which would interrupt smooth section scrolling).
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (list && el && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }
  }, [active]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <div className="no-print sticky top-[var(--header-h)] z-[900] border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <PageContainer className="flex items-center gap-4">
        <div className="hidden shrink-0 items-center gap-2 border-r border-border py-2 pr-4 text-sm md:flex">
          <ClassDot value={unit.risk} />
          <span className="max-w-44 truncate font-semibold">{unit.name}</span>
          <span className="num font-display font-bold text-muted-foreground">{formatScore(unit.risk)}</span>
        </div>
        <nav aria-label={t('nav.label')} className="min-w-0 flex-1">
          <ul ref={listRef} className="relative flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  data-id={s.id}
                  onClick={(e) => go(e, s.id)}
                  aria-current={active === s.id ? 'location' : undefined}
                  className={cn(
                    'inline-flex rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    active === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
