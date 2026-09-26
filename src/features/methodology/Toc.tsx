import { ArrowUp, ChevronDown, ListTree } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SECTION_IDS, SECTIONS, sectionKey } from './data';
import { useScrollSpy } from './hooks';

interface TocProps {
  onNavigate: (id: string) => void;
}

/** Scroll-spy lives here (not in the page) so scrolling re-renders only the table of contents. */
const SPY_OFFSET = 140;

function TocList({ active, onNavigate, className }: TocProps & { active: string; className?: string }) {
  const { t } = useTranslation('methodology');
  return (
    <ol className={cn('relative flex flex-col', className)}>
      {SECTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                onNavigate(s.id);
              }}
              className={cn(
                'group relative flex items-baseline gap-2.5 border-l-2 py-1.5 pr-2 text-[13px] leading-snug transition-colors',
                s.depth ? 'pl-7' : 'pl-3.5',
                isActive ? 'border-primary font-semibold text-foreground' : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {!s.depth && <span className={cn('num w-5 shrink-0 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>{s.number}</span>}
              <span>{t(sectionKey(s.id))}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Sticky table of contents with scroll-spy and reading progress (desktop). */
export function DesktopToc({ onNavigate }: TocProps) {
  const { t } = useTranslation('methodology');
  const { active, progress } = useScrollSpy(SECTION_IDS, SPY_OFFSET);
  return (
    <nav aria-label={t('toc.title')} className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        <ListTree className="size-3.5" aria-hidden />
        {t('toc.title')}
      </div>
      <TocList active={active} onNavigate={onNavigate} />
      <div className="mt-6 pr-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>{t('toc.progress')}</span>
          <span className="num">{Math.round(progress * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
        </div>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUp className="size-3.5" aria-hidden />
          {t('toc.backToTop')}
        </button>
      </div>
    </nav>
  );
}

/** Collapsible table of contents pinned under the header (mobile / tablet). */
export function MobileToc({ onNavigate }: TocProps) {
  const { t } = useTranslation('methodology');
  const { active, progress } = useScrollSpy(SECTION_IDS, SPY_OFFSET);
  const [open, setOpen] = React.useState(false);
  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav aria-label={t('toc.title')} className="no-print sticky top-[67px] z-30 -mx-4 border-b border-border bg-background/90 backdrop-blur-xl sm:-mx-6 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-6"
      >
        <ListTree className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t('toc.title')}</span>
          <span className="block truncate text-sm font-semibold">
            <span className="num mr-1.5 text-primary">{current.number}</span>
            {t(sectionKey(current.id))}
          </span>
        </span>
        <span className="sr-only">{open ? t('toc.hide') : t('toc.show')}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div className="h-0.5 bg-muted" aria-hidden>
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
      </div>
      <div id={listId} hidden={!open} className="max-h-[60dvh] overflow-y-auto border-t border-border px-4 py-3 sm:px-6">
        <TocList
          active={active}
          onNavigate={(id) => {
            setOpen(false);
            onNavigate(id);
          }}
        />
      </div>
    </nav>
  );
}
