// @vitest-environment jsdom
/**
 * Smoke test: the whole page renders in both languages, every section anchor exists, and no
 * translation key used by the page is missing.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { DataProvider } from '@/data-layer/DataProvider';
import { SECTION_IDS } from '../data';
import MethodologyPage from '../MethodologyPage';

const missing: string[] = [];
/** Rendering the whole document in jsdom is heavy; allow for a loaded machine running suites in parallel. */
const RENDER_TIMEOUT = 60_000;

beforeAll(() => {
  class NoopObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  const g = globalThis as unknown as Record<string, unknown>;
  g.IntersectionObserver ??= NoopObserver;
  g.ResizeObserver ??= NoopObserver;
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  Element.prototype.scrollIntoView = () => {};

  i18n.options.saveMissing = true;
  i18n.on('missingKey', (_lngs: readonly string[], ns: string, key: string) => {
    missing.push(`${ns}:${key}`);
  });
});

afterEach(() => cleanup());

function renderPage() {
  return render(
    <DataProvider>
      <MemoryRouter initialEntries={['/methodology#sources']}>
        <MethodologyPage />
      </MemoryRouter>
    </DataProvider>,
  );
}

describe('MethodologyPage', () => {
  it('the missing-key detector works', () => {
    missing.length = 0;
    i18n.t('methodology:__probe__');
    expect(missing).toContain('methodology:__probe__');
    missing.length = 0;
  });

  for (const lng of ['en', 'sw'] as const) {
    it(`renders every section with its anchor (${lng})`, async () => {
      await act(async () => {
        await i18n.changeLanguage(lng);
      });
      missing.length = 0;
      renderPage();
      for (const id of SECTION_IDS) expect(document.getElementById(id), id).not.toBeNull();
      expect(document.getElementById('sources-title')).not.toBeNull();
      // The live worked example defaults to Kondoa.
      expect(screen.getAllByText(/Kondoa/).length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    }, RENDER_TIMEOUT);
  }
});
