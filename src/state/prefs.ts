import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'light' | 'dark' | 'system';
export type Language = 'en' | 'sw';

interface PrefsState {
  theme: ThemePref;
  language: Language;
  /** Completed learning lessons (by id) and quiz scores - persisted per browser, no account needed. */
  learnProgress: Record<string, { completed: boolean; score: number; at: string }>;
  setTheme: (t: ThemePref) => void;
  setLanguage: (l: Language) => void;
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
      learnProgress: {},
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      completeLesson: (id, score) =>
        set((s) => ({ learnProgress: { ...s.learnProgress, [id]: { completed: true, score, at: new Date().toISOString() } } })),
      resetProgress: () => set({ learnProgress: {} }),
    }),
    { name: 'inform.prefs', version: 1 },
  ),
);

/** Resolve 'system' against the OS setting. */
export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref !== 'system') return pref;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
