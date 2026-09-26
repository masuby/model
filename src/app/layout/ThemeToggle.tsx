import { Laptop, Moon, Sun } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger, Tooltip } from '@/components/ui/primitives';
import { resolveTheme, usePrefs, type ThemePref } from '@/state/prefs';

/** Keeps <html class="dark"> in sync with the preference and the OS setting. */
export function useThemeSync() {
  const theme = usePrefs((s) => s.theme);
  React.useEffect(() => {
    const apply = () => {
      const dark = resolveTheme(theme) === 'dark';
      const root = document.documentElement;
      root.classList.add('theme-transition');
      root.classList.toggle('dark', dark);
      window.setTimeout(() => root.classList.remove('theme-transition'), 250);
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

/** One-click day/night toggle (long-form menu for "system"). */
export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const resolved = resolveTheme(theme);
  return (
    <DropdownMenu>
      <Tooltip content={t('theme.toggle')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('theme.toggle')} className="relative">
            <Sun className={`transition-all duration-300 ${resolved === 'dark' ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`} />
            <Moon className={`absolute transition-all duration-300 ${resolved === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemePref)}>
          <DropdownMenuRadioItem value="light">
            <Sun /> {t('theme.light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> {t('theme.dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Laptop /> {t('theme.system')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
