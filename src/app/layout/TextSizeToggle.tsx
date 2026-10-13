import { ALargeSmall } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/primitives';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger, Tooltip } from '@/components/ui/overlays';
import { cn } from '@/lib/utils';
import { TEXT_SIZE_PERCENT, TEXT_SIZES, usePrefs, type TextSize } from '@/state/prefs';

/** Keeps `<html data-text-size>` in sync with the preference (public/theme-init.js applies it before paint). */
export function useTextSizeSync() {
  const size = usePrefs((s) => s.textSize);
  React.useEffect(() => {
    const root = document.documentElement;
    if (size === 'normal') root.removeAttribute('data-text-size');
    else root.setAttribute('data-text-size', size);
  }, [size]);
}

/** The text size of the whole site: four steps of the root font size, in the header beside the theme (from tablets up). */
export function TextSizeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const size = usePrefs((s) => s.textSize);
  const setTextSize = usePrefs((s) => s.setTextSize);
  return (
    <DropdownMenu>
      <Tooltip content={t('textSize.toggle')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('textSize.toggle')} className={cn('size-9 sm:size-10', className)}>
            <ALargeSmall />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('textSize.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={size} onValueChange={(v) => setTextSize(v as TextSize)}>
          {TEXT_SIZES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {t(`textSize.${s}`)} <span className="num ml-auto pl-3 text-xs text-muted-foreground">{TEXT_SIZE_PERCENT[s]}%</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The same choice as a labelled row of buttons, for the phone menu (the header has no room for the button there). */
export function TextSizeChoice({ className }: { className?: string }) {
  const { t } = useTranslation();
  const size = usePrefs((s) => s.textSize);
  const setTextSize = usePrefs((s) => s.setTextSize);
  return (
    <div className={className}>
      <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('textSize.label')}</p>
      <Segmented size="sm" value={size} onValueChange={(v) => setTextSize(v as TextSize)} aria-label={t('textSize.label')} className="mx-2 grid grid-cols-4" options={TEXT_SIZES.map((s) => ({ value: s, label: t(`textSize.${s}`) }))} />
    </div>
  );
}
