import { ALargeSmall } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger, Tooltip } from '@/components/ui/overlays';
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

/** The text size of the whole site: four steps of the root font size, in the header beside the theme. */
export function TextSizeToggle() {
  const { t } = useTranslation();
  const size = usePrefs((s) => s.textSize);
  const setTextSize = usePrefs((s) => s.setTextSize);
  return (
    <DropdownMenu>
      <Tooltip content={t('textSize.toggle')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('textSize.toggle')} className="size-9 sm:size-10">
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
