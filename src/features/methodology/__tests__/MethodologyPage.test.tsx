// @vitest-environment jsdom
/**
 * Smoke tests: the summary page renders in both languages with its eight sections and a link to every
 * full documentation page; an old link into the full document opens the page of that section; every
 * section page renders with its anchor; and no translation key used by either page is missing.
 */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { DataProvider } from '@/data-layer/DataProvider';
import { SECTION_IDS, SUMMARY_IDS } from '../data';
import MethodologyPage from '../MethodologyPage';
import SectionPage from '../SectionPage';

const missing: string[] = [];
/** Rendering the heavier sections in jsdom is slow; allow for a loaded machine running suites in parallel. */
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

function renderAt(entry: string) {
  return render(
    <DataProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/methodology/:section" element={<SectionPage />} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  );
}

describe('MethodologyPage (summary)', () => {
  it('the missing-key detector works', () => {
    missing.length = 0;
    i18n.t('methodology:__probe__');
    expect(missing).toContain('methodology:__probe__');
    missing.length = 0;
  });

  for (const lng of ['en', 'sw'] as const) {
    it(`renders the summary with its sections and a link to every full page (${lng})`, async () => {
      await act(async () => {
        await i18n.changeLanguage(lng);
      });
      missing.length = 0;
      renderAt('/methodology');
      for (const id of SUMMARY_IDS) expect(document.getElementById(id), id).not.toBeNull();
      // The summary never carries the technical sections; it links to their pages.
      expect(document.getElementById('sources')).toBeNull();
      for (const id of SECTION_IDS) expect(document.querySelector(`a[href="/methodology/${id}"]`), id).not.toBeNull();
      expect(missing).toEqual([]);
    }, RENDER_TIMEOUT);
  }

  it('redirects an old link into the full document to the page of that section', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    renderAt('/methodology#sources');
    await waitFor(() => expect(document.getElementById('sources')).not.toBeNull(), { timeout: RENDER_TIMEOUT });
    expect(document.getElementById('sources-title')).not.toBeNull();
    expect(screen.getByRole('link', { name: /Methodology summary/ })).toHaveAttribute('href', '/methodology');
  }, RENDER_TIMEOUT);
});

describe('SectionPage', () => {
  for (const lng of ['en', 'sw'] as const) {
    for (const id of SECTION_IDS) {
      it(`renders ${id} with its anchor (${lng})`, async () => {
        await act(async () => {
          await i18n.changeLanguage(lng);
        });
        missing.length = 0;
        renderAt(`/methodology/${id}`);
        await waitFor(() => expect(document.getElementById(id), id).not.toBeNull(), { timeout: RENDER_TIMEOUT });
        expect(document.getElementById(`${id}-title`)).not.toBeNull();
        if (id === 'worked-example') expect(screen.getAllByText(/Kondoa/).length).toBeGreaterThan(0);
        expect(missing).toEqual([]);
      }, RENDER_TIMEOUT);
    }
  }

  it('returns to the summary for an unknown section', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    renderAt('/methodology/no-such-section');
    await waitFor(() => expect(document.getElementById('documentation')).not.toBeNull(), { timeout: RENDER_TIMEOUT });
  }, RENDER_TIMEOUT);
});
