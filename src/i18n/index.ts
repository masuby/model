/**
 * i18n — English and Kiswahili. Catalogues live in `locales/<lang>/<namespace>.json` and are bundled
 * eagerly (they are small). Components use `useTranslation('<namespace>')`; shared vocabulary
 * (classes, dimensions, levels, navigation) is in `common`, indicator names in `indicators`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePrefs, type Language } from '@/state/prefs';

type Catalogue = Record<string, unknown>;
const modules = import.meta.glob<Catalogue>('./locales/*/*.json', { eager: true, import: 'default' });

const resources: Record<string, Record<string, Catalogue>> = {};
for (const [path, catalogue] of Object.entries(modules)) {
  const m = path.match(/\.\/locales\/(\w+)\/(\w+)\.json$/);
  if (!m) continue;
  const [, lang, ns] = m;
  (resources[lang] ??= {})[ns] = catalogue;
}

export const LANGUAGES: Array<{ code: Language; label: string; short: string }> = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'sw', label: 'Kiswahili', short: 'SW' },
];

void i18n.use(initReactI18next).init({
  resources,
  lng: usePrefs.getState().language,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: Object.keys(resources.en ?? {}),
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Keep i18next and <html lang> in sync with the persisted preference. */
usePrefs.subscribe((s, prev) => {
  if (s.language !== prev.language) void i18n.changeLanguage(s.language);
});
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language;

export default i18n;
