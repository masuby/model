// @vitest-environment jsdom
/**
 * The detailed risk card: in the reader's language, the risk and its parts, every high-scoring group of each
 * dimension with its measured values and lead sectors, every group in one table, the DRR arrangements.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import DetailedRiskCardPage from './DetailedRiskCardPage';

class Noop {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderCard(path: string) {
  return render(
    <DataProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/area/:id/card/detailed" element={<DetailedRiskCardPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
}

describe('DetailedRiskCardPage', { timeout: 60_000 }, () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', Noop);
  });
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('lists the high-scoring groups of every dimension with their values and lead sectors, and every group in one table', async () => {
    renderCard('/area/C051/card/detailed?lang=en');
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(screen.getByRole('heading', { level: 1, name: 'Kibiti District' })).toBeInTheDocument();
    expect(screen.getByText('Detailed risk card · for sectors and decision-makers')).toBeInTheDocument();
    expect(screen.getByText('In an emergency call')).toBeInTheDocument();
    // Risk and its parts against the region and the country.
    expect(screen.getByText('Risk and its parts')).toBeInTheDocument();
    expect(screen.getByText('Pwani region')).toBeInTheDocument();
    // The high-scoring groups: storms first among the hazards, displaced people among the vulnerability groups.
    expect(screen.getByText('High-scoring indicator groups (5.0 and above)')).toBeInTheDocument();
    const storms = screen.getAllByText(/^Storms & cyclones/)[0].closest('li')!;
    expect(within(storms).getByText('10.0')).toBeInTheDocument();
    expect(within(storms).getByText(/^Lead sectors:/)).toBeInTheDocument();
    expect(within(storms).getByText(/Tanzania Meteorological Authority \(TMA\)/)).toBeInTheDocument();
    expect(await within(storms).findByText('Storms: Jobo 2021, Hidaya 2024', {}, { timeout: 20_000 })).toBeInTheDocument();
    const displaced = screen.getAllByText(/^Displaced people/)[0].closest('li')!;
    expect(within(displaced).getByText('9.5')).toBeInTheDocument();
    // The lead sector on its line, and again in the Guide Book's statement on the group (since 14 October 2026).
    expect(within(displaced).getAllByText(/PMO-DMD and the Disaster Management Committees/).length).toBeGreaterThan(0);
    // Every group in the table, with its category and source.
    const all = screen.getByText('All indicator groups').nextElementSibling as HTMLTableElement;
    expect(within(all).getAllByRole('row')).toHaveLength(ALL_INDICATORS.length + 1);
    expect(within(all).getAllByText(/Benchmark 2026/).length).toBeGreaterThan(0);
    // The DRR arrangements, all nine.
    expect(screen.getByText('DRR arrangements and the committee')).toBeInTheDocument();
    expect(screen.getByText('Emergency preparedness and response plan')).toBeInTheDocument();
    expect(screen.getByText('Stakeholder collaboration')).toBeInTheDocument();
    expect(document.title).toContain('Kibiti District');
    // In INFORM's terms only: no level word or colour of the Guide Book; the book's rows under "What to do".
    expect(screen.queryByText(/Advisory|Major warning|Take action immediately|Level [123]/)).not.toBeInTheDocument();
    expect(screen.getAllByText('What to do').length).toBeGreaterThan(0);
  });

  it("follows the reader's language and names the country for the national card", async () => {
    await i18n.changeLanguage('sw');
    const view = renderCard('/area/TZ/card/detailed');
    await waitFor(() => expect(i18n.language).toBe('sw'));
    expect(screen.getByRole('heading', { level: 1, name: 'Tanzania' })).toBeInTheDocument();
    expect(screen.getByText('Kadi ya hatari ya kina · kwa sekta na watoa maamuzi')).toBeInTheDocument();
    expect(screen.getByText('Makundi ya viashiria yenye alama za juu (5.0 na zaidi)')).toBeInTheDocument();
    expect(screen.getAllByText(/^Moto wa nyika/).length).toBeGreaterThan(0);
    view.unmount();
    expect(i18n.language).toBe('sw');
  });
});
