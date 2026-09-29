/**
 * i18n - English and Kiswahili. Catalogues live in `locales/<lang>/<namespace>.json`.
 *
 * `common` and `indicators` (shared vocabulary) are bundled with the app so nothing waits on a request
 * before first paint; every page namespace (`home`, `explore`, `learn`, …) is fetched in parallel with
 * that page's code (see preloadNamespaces / app/routes). This keeps ~400 KB of text out of the first
 * download. Switching language pre-loads the namespaces in use.
 */
import i18n, { type BackendModule, type ReadCallback } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePrefs, type Language } from '@/state/prefs';

type Catalogue = Record<string, unknown>;
const loaders = import.meta.glob<Catalogue>('./locales/*/*.json', { import: 'default' });
/** Shared vocabulary ships inside the app bundle (≈ 9 KB gzipped, both languages): no fetch before first paint. */
const bundled = import.meta.glob<Catalogue>(['./locales/*/common.json', './locales/*/indicators.json'], { import: 'default', eager: true });

export const NAMESPACES = [...new Set(Object.keys(loaders).map((p) => p.match(/\/(\w+)\.json$/)![1]))];

const resources: Record<string, Record<string, Catalogue>> = {};
for (const [path, catalogue] of Object.entries(bundled)) {
  const [, lang, ns] = path.match(/\.\/locales\/(\w+)\/(\w+)\.json$/)!;
  (resources[lang] ??= {})[ns] = catalogue;
}

/** Start loading a page's namespaces (used to fetch them in parallel with the page's code). */
export function preloadNamespaces(ns: string[]): Promise<void> {
  return i18n.loadNamespaces(ns);
}

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
    resources,
    // Page namespaces not in `resources` are fetched by the lazy backend on demand.
    partialBundledLanguages: true,
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
