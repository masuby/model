import '@testing-library/jest-dom/vitest';
import i18n, { i18nReady, loadAllCatalogues } from '@/i18n';

// Catalogues are lazy-loaded in the app; tests get every namespace for both languages up front so
// translations resolve synchronously.
await i18nReady;
await loadAllCatalogues();
await i18n.changeLanguage('en');
