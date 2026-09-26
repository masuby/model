/**
 * i18n — English and Kiswahili. Catalogues live in `locales/<lang>/<namespace>.json`.
 *
 * Only `common` and `indicators` (shared vocabulary) load at start-up, and only for the active
 * language; every page namespace (`home`, `explore`, `learn`, …) is fetched with that page's code the
 * first time `useTranslation('<ns>')` asks for it (react-i18next suspends until it arrives). This keeps
 * ~400 KB of text out of the first download. Switching language pre-loads the namespaces in use.
 */
import i18n, { type BackendModule, type ReadCallback } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePrefs, type Language } from '@/state/prefs';

type Catalogue = Record<string, unknown>;
const loaders = import.meta.glob<Catalogue>('./locales/*/*.json', { import: 'default' });

export const NAMESPACES = [...new Set(Object.keys(loaders).map((p) => p.match(/\/(\w+)\.json$/)![1]))];

const lazyBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(language: string, namespace: string, callback: ReadCallback) {
    const load = loaders[`./locales/${language}/${namespace}.json`];
    if (!load) return callback(null, {});
    load().then(
      (data) => callback(null, data),
      (err: Error) => callback(err, false),
    );
  },
};

export const LANGUAGES: Array<{ code: Language; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'sw', label: 'Kiswahili', short: 'SW' },
];

export const i18nReady = i18n
  .use(lazyBackend)
  .use(initReactI18next)
  .init({
    lng: usePrefs.getState().language,
    fallbackLng: 'en',
    supportedLngs: ['en', 'sw'],
    ns: ['common', 'indicators'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: true },
  });

/** Load every namespace for every language (tests, and anywhere a full catalogue is needed). */
export function loadAllCatalogues(): Promise<void> {
  return i18n.reloadResources(['en', 'sw'], NAMESPACES);
}

/** Keep i18next and <html lang> in sync with the persisted preference. */
usePrefs.subscribe((s, prev) => {
  if (s.language !== prev.language) void i18n.changeLanguage(s.language);
});
const hasDom = typeof document !== 'undefined';
i18n.on('languageChanged', (lng) => {
  if (hasDom) document.documentElement.lang = lng;
});
if (hasDom) document.documentElement.lang = usePrefs.getState().language;

export default i18n;
