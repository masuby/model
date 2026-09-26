/** Jump-to search (ARIA combobox): filters councils and regions as you type and selects on Enter/click. */
import { AnimatePresence, motion } from 'motion/react';
import { MapPin, Search, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassDot } from '@/components/risk/RiskBadge';
import { cn, formatScore } from '@/lib/utils';
import { searchUnits } from '../lib/explore';
import { useExplore } from '../lib/ExploreContext';

export function PlaceSearch({ className, glass = false }: { className?: string; glass?: boolean }) {
  const { t } = useTranslation(['explore', 'common']);
  const { model, state, actions } = useExplore();
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const pool = React.useMemo(
    () => (state.level === 'source' ? [...model.regions, ...model.councils, ...model.sources] : [...model.regions, ...model.councils]),
    [model, state.level],
  );
  const results = React.useMemo(() => searchUnits(pool, q, 8), [pool, q]);
  const showList = open && q.trim().length > 0;

  const pick = (i: number) => {
    const u = results[i];
    if (!u) return;
    actions.select(u, { focus: true });
    setQ('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      if (showList && results.length) {
        e.preventDefault();
        pick(active);
      }
    } else if (e.key === 'Escape') {
      if (q) setQ('');
      else inputRef.current?.blur();
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={t('search.label')}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={q}
        placeholder={t('search.placeholder')}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={cn(
          'h-11 w-full rounded-xl border pr-10 pl-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/40 [&::-webkit-search-cancel-button]:hidden',
          glass ? 'border-border/70 bg-card/85 shadow-lg backdrop-blur-xl' : 'border-input bg-card shadow-xs',
        )}
      />
      {q && (
        <button
          type="button"
          aria-label={t('common:actions.clear')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQ('');
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
      <AnimatePresence>
        {showList && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={t('search.results')}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-elevated p-1 shadow-[var(--shadow-lift)]"
          >
            {results.length ? (
              results.map((u, i) => (
                <li
                  key={u.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm', i === active && 'bg-muted')}
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{u.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {u.level === 'region' ? t('common:levels.region') : `${t(`common:levels.${u.level}`)} · ${u.region}`}
                    </span>
                  </span>
                  <span className="num flex items-center gap-1.5 text-xs font-semibold">
                    <ClassDot value={u.risk} />
                    {formatScore(u.risk)}
                  </span>
                </li>
              ))
            ) : (
              <li role="option" aria-selected={false} aria-disabled className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('search.empty', { q })}
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
