import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/overlays';
import { LANGUAGES } from '@/i18n';
import { usePrefs, type Language } from '@/state/prefs';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const language = usePrefs((s) => s.language);
  const setLanguage = usePrefs((s) => s.setLanguage);
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="md" className="h-9 gap-1.5 px-2 sm:h-10 sm:px-2.5" aria-label={t('language.label')}>
          <Languages className="hidden sm:block" />
          <span className="text-xs font-semibold">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as Language)}>
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>
              <span className="w-6 text-xs font-bold text-muted-foreground">{l.short}</span>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
