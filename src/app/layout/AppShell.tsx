import { Menu, Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, Kbd, SheetContent } from '@/components/ui/primitives';
import { useData } from '@/data-layer/DataProvider';
import { cn } from '@/lib/utils';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { LanguageSwitcher } from './LanguageSwitcher';
import { prefetchRoute } from '../routes';
import { Logo } from './Logo';
import { ThemeToggle, useThemeSync } from './ThemeToggle';

export const NAV = [
  { to: '/explore', key: 'explore' },
  { to: '/insights', key: 'insights' },
  { to: '/severity', key: 'severity' },
  { to: '/learn', key: 'learn' },
  { to: '/methodology', key: 'methodology' },
  { to: '/data', key: 'data' },
] as const;

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/** Warm the code + translations of any internal page the user is about to open (hover, focus, touch). */
function useLinkPrefetch() {
  React.useEffect(() => {
    const onIntent = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="/"]') as HTMLAnchorElement | null;
      if (a) prefetchRoute(a.getAttribute('href') ?? '');
    };
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
    document.addEventListener('touchstart', onIntent, { passive: true });
    return () => {
      document.removeEventListener('pointerover', onIntent);
      document.removeEventListener('focusin', onIntent);
      document.removeEventListener('touchstart', onIntent);
    };
  }, []);
}

/** Per-route document title (area profiles set their own, with the area name). */
function DocumentTitle() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  React.useEffect(() => {
    if (pathname.startsWith('/area/')) return;
    const key = pathname === '/' ? null : NAV.find((n) => pathname.startsWith(n.to))?.key;
    document.title = key ? `${t(`nav.${key}`)} · ${t('appName')}` : `${t('appName')} — ${t('tagline')}`;
  }, [pathname, t, i18n.language]);
  return null;
}

function Header({ onSearch }: { onSearch: () => void }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { pathname } = useLocation();
  React.useEffect(() => setMobileOpen(false), [pathname]);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="site-header sticky top-0 z-[1000] border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-xl focus-visible:outline-2" aria-label={t('appName')}>
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'relative px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:bg-foreground',
                )
              }
            >
              {t(`nav.${n.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onSearch}
            className="hidden h-9 w-56 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground md:flex xl:w-64"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate text-left">{t('search.placeholder')}</span>
            <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
          </button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onSearch} aria-label={t('search.open')}>
            <Search />
          </Button>
          <LanguageSwitcher />
          <ThemeToggle />
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('nav.menu')}>
                <Menu />
              </Button>
            </DialogTrigger>
            <SheetContent side="right" title={<Logo />}>
              <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
                {[{ to: '/', key: 'home' } as const, ...NAV].map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === '/'}
                    className={({ isActive }) => cn('border-b border-border px-2 py-3.5 text-base font-medium transition-colors last:border-b-0 hover:text-primary', isActive && 'text-primary')}
                  >
                    {t(`nav.${n.key}`)}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useTranslation();
  const { mode } = useData();
  const build = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
  return (
    <footer className="site-footer mt-24 border-t border-border">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-md">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t('footer.about')}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('footer.disclaimer')}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t('nav.menu')}</h4>
          <ul className="mt-4 grid gap-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-foreground/80 hover:text-primary">
                  {t(`nav.${n.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">INFORM</h4>
          <ul className="mt-4 grid gap-2 text-sm">
            <li>
              <a className="text-foreground/80 hover:text-primary" href="https://drmkc.jrc.ec.europa.eu/inform-index" target="_blank" rel="noreferrer">
                INFORM (JRC)
              </a>
            </li>
            <li>
              <Link className="text-foreground/80 hover:text-primary" to="/methodology#sources">
                {t('footer.sources')}
              </Link>
            </li>
            <li>
              <a className="text-foreground/80 hover:text-primary" href="https://github.com/masuby/model" target="_blank" rel="noreferrer">
                {t('footer.github')}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} INFORM Tanzania · {t('footer.rights')}</span>
          <span className="font-mono">
            {t('footer.build', { build })} · {mode}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  useThemeSync();
  useLinkPrefetch();
  const palette = useCommandPalette();
  const { pathname } = useLocation();
  const fullBleed = pathname.startsWith('/explore');
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-[2000] rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        {t('nav.skipToContent')}
      </a>
      <ScrollToTop />
      <DocumentTitle />
      <Header onSearch={() => palette.setOpen(true)} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      {!fullBleed && <Footer />}
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
}
