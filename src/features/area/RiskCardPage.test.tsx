// @vitest-environment jsdom
/**
 * The one-page risk card: Kiswahili first, the area's name, the emergency number, the hazard list and
 * the statements about the area, with the reader's language restored afterwards.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import RiskCardPage from './RiskCardPage';

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
            <Route path="/area/:id/card" element={<RiskCardPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
}

describe('RiskCardPage', { timeout: 60_000 }, () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', Noop);
  });
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('prints a Kiswahili card by default and restores English when left', async () => {
    await i18n.changeLanguage('en');
    const view = renderCard('/area/C001/card');
    await waitFor(() => expect(i18n.language).toBe('sw'));
    expect(screen.getByRole('heading', { level: 1, name: 'Kondoa District' })).toBeInTheDocument();
    expect(screen.getByText('190')).toBeInTheDocument();
    expect(await screen.findByText('Vitisho katika Kondoa District', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(await screen.findByText('Eneo na vitisho vyake', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(document.title).toContain('Kondoa District');
    view.unmount();
    await waitFor(() => expect(i18n.language).toBe('en'));
  });

  it('can be printed in English', async () => {
    renderCard('/area/C113/card?lang=en');
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(screen.getByRole('heading', { level: 1, name: 'Kasulu Town' })).toBeInTheDocument();
    expect(await screen.findByText('Hazards in Kasulu Town', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText('Risk level')).toBeInTheDocument();
    expect(screen.queryByText(/Advisory|Major warning|Take action/)).not.toBeInTheDocument();
  });

  it("carries statements generated from the area's own data, beside a map of where it lies", async () => {
    renderCard('/area/C051/card?lang=en');
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(screen.getByRole('heading', { name: 'What the data say about Kibiti District' })).toBeInTheDocument();
    expect(screen.getByText(/^Kibiti District is at high risk: [\d.]+ out of 10 on the INFORM scale, ranked \d+ of 195 councils in Tanzania/)).toBeInTheDocument();
    expect(await screen.findByText(/^The hazards that score highest here are strong winds \(10\.0\)/, {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText(/^About 195,638 people live here/)).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Where Kibiti District lies' }, { timeout: 20_000 })).toBeInTheDocument();
  });
});
