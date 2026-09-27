import type { KeyedLevel, Resolution } from './data';

/**
 * Data resolution, encoded by shape and value rather than by teal shade alone, so the five marks stay
 * distinct at 10 px: council = filled dark teal, district = filled mid teal, region = teal ring, national =
 * filled grey, documented overlay = dashed ring (an overlay is not a measurement). Every mark is at least
 * 3:1 against the page in both themes (WCAG 1.4.11) and always sits next to a text label or an sr-only name.
 */
export const RESOLUTION_CLASS: Record<Resolution, string> = {
  council: 'bg-[#0f5f58] dark:bg-[#8ee0d4]',
  district: 'bg-[#2a8f83] dark:bg-[#3f9a8e]',
  region: 'border-2 border-[#3d8f85] dark:border-[#5bbfb2]',
  national: 'bg-[#6b7280] dark:bg-[#8b95a7]',
  overlay: 'border-[1.5px] border-dashed border-muted-foreground',
};

/**
 * Keyed level of a workbook indicator, for the proportion bar and its legend: dark teal (district/council,
 * ADM2), mid teal (region, ADM1), grey (national). Each fill is at least 3:1 against the page in both themes.
 */
export const LEVEL_CLASS: Record<KeyedLevel, string> = {
  adm2: 'bg-[#0f5f58] dark:bg-[#8ee0d4]',
  adm1: 'bg-[#3d8f85] dark:bg-[#3f9a8e]',
  national: 'bg-[#6b7280] dark:bg-[#8b95a7]',
};
