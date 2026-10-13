// @vitest-environment jsdom
/**
 * Smoke tests: the whole document renders in both languages with every section anchor (the thirteen
 * sections of the contents), no translation key used by the page is missing, the deferred sections mount
 * after the first paint, and a link to a section's own path opens the document at that section.
 */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { DataProvider } from '@/data-layer/DataProvider';
import { SECTION_IDS } from '../data';
import MethodologyPage from '../MethodologyPage';
import SectionRedirect from '../SectionRedirect';

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

function renderPage(entry = '/methodology#sources') {
  return render(
    <DataProvider>
      <MemoryRouter initialEntries={[entry]}>
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

  it('the contents list the thirteen sections of the document, in order', () => {
    expect(SECTION_IDS).toEqual(['overview', 'structure', 'pipeline', 'worked-example', 'geometric', 'classification', 'levels', 'advanced', 'severity', 'sources', 'quality', 'limitations', 'changelog', 'references']);
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
      expect(document.getElementById('advanced-title')).not.toBeNull();
      expect(document.getElementById('quality-title')).not.toBeNull();
      expect(document.getElementById('changelog-title')).not.toBeNull();
      // The live worked example defaults to Kondoa.
      expect(screen.getAllByText(/Kondoa/).length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    }, RENDER_TIMEOUT);
  }

  it('without a hash, opens with the first sections and mounts the rest after the first paint', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    renderPage('/methodology');
    expect(document.getElementById('overview')).not.toBeNull();
    expect(document.getElementById('structure')).not.toBeNull();
    await waitFor(() => expect(document.getElementById('references')).not.toBeNull(), { timeout: RENDER_TIMEOUT });
    for (const id of SECTION_IDS) expect(document.getElementById(id), id).not.toBeNull();
  }, RENDER_TIMEOUT);
});

describe('SectionRedirect', () => {
  function Probe() {
    const l = useLocation();
    return <span data-testid="probe">{l.pathname + l.hash}</span>;
  }
  const at = (entry: string) =>
    render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/methodology" element={<Probe />} />
          <Route path="/methodology/:section" element={<SectionRedirect />} />
        </Routes>
      </MemoryRouter>,
    );

  it("a section's own path opens the document at that section", () => {
    at('/methodology/sources');
    expect(screen.getByTestId('probe').textContent).toBe('/methodology#sources');
  });

  it('an unknown section still opens the document', () => {
    cleanup();
    at('/methodology/no-such-section');
    expect(screen.getByTestId('probe').textContent).toBe('/methodology#no-such-section');
  });
});
