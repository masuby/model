import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { displayNumber, SECTION_IDS, SECTIONS, sectionKey } from './data';
import { useScrollSpy } from './hooks';

interface TocProps {
  onNavigate: (id: string) => void;
}

/** Scroll-spy lives here (not in the page) so scrolling re-renders only the table of contents. */
const SPY_OFFSET = 140;

/** Plain-text contents list; the current section is marked by a rule on the left and heavier text. */
function TocList({ active, onNavigate, className }: TocProps & { active: string; className?: string }) {
  const { t } = useTranslation('methodology');
  return (
    <ol className={cn('flex flex-col border-l border-border', className)}>
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
                '-ml-px flex items-baseline gap-2.5 border-l-2 py-[5px] pr-2 pl-3.5 text-[13.5px] leading-snug transition-colors duration-150',
                isActive ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {/* Sub-sections keep their number ("3.1"), in a wider column so it aligns under its parent's. */}
              <span className={cn('num shrink-0 text-xs text-muted-foreground', s.depth ? 'w-7' : 'w-4')}>{displayNumber(s.id)}</span>
              <span>{t(sectionKey(s.id))}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Sticky table of contents with scroll-spy (desktop). */
export function DesktopToc({ onNavigate }: TocProps) {
  const { t } = useTranslation('methodology');
  const active = useScrollSpy(SECTION_IDS, SPY_OFFSET);
  return (
    <nav aria-label={t('toc.title')} className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
      <p className="mb-3 text-sm font-medium">{t('toc.title')}</p>
      <TocList active={active} onNavigate={onNavigate} />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
        className="mt-5 rounded-sm text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        ↑ {t('toc.backToTop')}
      </button>
    </nav>
  );
}

/** Collapsible table of contents pinned under the header (mobile / tablet). */
export function MobileToc({ onNavigate }: TocProps) {
  const { t } = useTranslation('methodology');
  const active = useScrollSpy(SECTION_IDS, SPY_OFFSET);
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
    <nav aria-label={t('toc.title')} className="no-print sticky top-[var(--header-h)] z-30 -mx-4 border-b border-border bg-background sm:-mx-6 lg:hidden">
      <button type="button" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-6">
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="text-muted-foreground">{t('toc.title')}</span>
          <span className="mx-2 text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="num mr-1.5 font-medium">{displayNumber(current.id)}</span>
          <span className="font-medium">{t(sectionKey(current.id))}</span>
        </span>
        <span className="sr-only">{open ? t('toc.hide') : t('toc.show')}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
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
