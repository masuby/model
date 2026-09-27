// @vitest-environment jsdom
/**
 * Smoke test: the page renders in both languages with no missing translation keys, shows the engine's
 * score for the default scenario, formats typed numbers, and lists missing inputs for a blank form.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import { computeSeverity } from '@/engine/severity/engine';
import { SEVERITY_SCENARIOS } from '@/engine/severity/scenarios';
import i18n from '@/i18n';
import SeverityPage from '../SeverityPage';

vi.mock('@/components/map/StaticMap', () => ({ default: () => <div data-testid="static-map" /> }));

const missing: string[] = [];

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
      <TooltipProvider>
        <MemoryRouter initialEntries={['/severity']}>
          <SeverityPage />
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
}

describe('SeverityPage', () => {
  for (const lng of ['en', 'sw'] as const) {
    it(`renders every step, the result and the methodology (${lng})`, { timeout: 60_000 }, async () => {
      await act(async () => {
        await i18n.changeLanguage(lng);
      });
      missing.length = 0;
      renderPage();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(i18n.t('severity:header.title'));
      for (const id of ['sev-step-scenario', 'sev-step-area', 'sev-step-impact', 'sev-step-conditions', 'sev-step-complexity', 'sev-step-reliability', 'sev-results', 'sev-method'])
        expect(document.getElementById(id)).not.toBeNull();
      const expected = computeSeverity(SEVERITY_SCENARIOS[0].input);
      const results = within(document.getElementById('sev-results')!);
      expect(results.getByText(i18n.t('severity:results.announce', { score: expected.severity!.toFixed(1), category: i18n.t(`common:classes.${expected.category}`) }))).toBeInTheDocument();
      expect(screen.getAllByRole('radio').length).toBeGreaterThanOrEqual(4);
      // The table and methodology mount once the browser is idle.
      await waitFor(() => expect(document.querySelector('[data-deferred="pending"]')).toBeNull(), { timeout: 20_000 });
      expect(missing).toEqual([]);
    });
  }

  it('formats typed numbers and lists missing inputs for a blank form', { timeout: 60_000 }, async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    renderPage();
    const affected = screen.getByLabelText('People affected') as HTMLInputElement;
    expect(affected.value).toBe(new Intl.NumberFormat('en-GB').format(SEVERITY_SCENARIOS[0].input.peopleAffected!));
    fireEvent.focus(affected);
    fireEvent.change(affected, { target: { value: '1234567' } });
    expect(affected.value).toBe('1,234,567');
    fireEvent.change(affected, { target: { value: '-5' } });
    expect(screen.getByText('Enter zero or more.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /Blank \/ custom/ }));
    const results = within(document.getElementById('sev-results')!);
    expect(results.getByText('Incomplete')).toBeInTheDocument();
    expect(results.getByRole('button', { name: 'People affected' })).toBeInTheDocument();
    expect(results.getByRole('button', { name: 'People at level 3' })).toBeInTheDocument();
  });
});
