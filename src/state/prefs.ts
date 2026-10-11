import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'light' | 'dark' | 'system';
export type Language = 'en' | 'sw';
/** The text size of the whole site: the root font size, so every rem-based measure follows. */
export type TextSize = 'normal' | 'large' | 'larger' | 'largest';
export const TEXT_SIZES: readonly TextSize[] = ['normal', 'large', 'larger', 'largest'];
/** The root font size of each text size, in percent of the browser default. */
export const TEXT_SIZE_PERCENT: Record<TextSize, number> = { normal: 100, large: 112.5, larger: 125, largest: 137.5 };
export type PanelSide = 'left' | 'right';

interface PrefsState {
  theme: ThemePref;
  language: Language;
  textSize: TextSize;
  /** The explorer's side panels, in px; null is the default width. */
  panelWidths: Record<PanelSide, number | null>;
  /** Completed learning lessons (by id) and quiz scores - persisted per browser, no account needed. */
  learnProgress: Record<string, { completed: boolean; score: number; at: string }>;
  setTheme: (t: ThemePref) => void;
  setLanguage: (l: Language) => void;
  setTextSize: (t: TextSize) => void;
  setPanelWidth: (side: PanelSide, px: number | null) => void;
  completeLesson: (id: string, score: number) => void;
  resetProgress: () => void;
}

const initialLanguage = (): Language => {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('sw')) return 'sw';
  return 'en';
};

/** User preferences, persisted to localStorage under `inform.prefs` (read pre-paint by index.html). */
export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: initialLanguage(),
      textSize: 'normal',
      panelWidths: { left: null, right: null },
      learnProgress: {},
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setTextSize: (textSize) => set({ textSize }),
      setPanelWidth: (side, px) => set((s) => ({ panelWidths: { ...s.panelWidths, [side]: px } })),
      completeLesson: (id, score) =>
        set((s) => ({ learnProgress: { ...s.learnProgress, [id]: { completed: true, score, at: new Date().toISOString() } } })),
      resetProgress: () => set({ learnProgress: {} }),
    }),
    { name: 'inform.prefs', version: 1, merge: (persisted, current) => ({ ...current, ...(persisted as Partial<PrefsState>), panelWidths: { ...current.panelWidths, ...((persisted as Partial<PrefsState>)?.panelWidths ?? {}) } }) },
  ),
);

/** Resolve 'system' against the OS setting. */
export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref !== 'system') return pref;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
