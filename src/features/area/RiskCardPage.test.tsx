// @vitest-environment jsdom
/**
 * The one-page risk card: in the reader's language, the area's name, the emergency number, the hazard list
 * and the statements about the area; ?lang prints the other language for the card only and the reader's
 * choice is restored afterwards.
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

  it("prints in the reader's language", async () => {
    await i18n.changeLanguage('en');
    renderCard('/area/C001/card');
    expect(screen.getByRole('heading', { level: 1, name: 'Kondoa District' })).toBeInTheDocument();
    expect(screen.getByText('190')).toBeInTheDocument();
    expect(await screen.findByText('Hazards in Kondoa District', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText('Risk communication')).toBeInTheDocument();
    expect(i18n.language).toBe('en');
    expect(document.title).toContain('Kondoa District');
  });

  it('?lang prints the other language for the card only, and the reader keeps their own when they leave', async () => {
    await i18n.changeLanguage('en');
    const view = renderCard('/area/C001/card?lang=sw');
    await waitFor(() => expect(i18n.language).toBe('sw'));
    expect(await screen.findByText('Vitisho katika Kondoa District', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText('Mawasiliano ya hatari')).toBeInTheDocument();
    expect(screen.queryByText('Eneo na vitisho vyake')).not.toBeInTheDocument();
    view.unmount();
    await waitFor(() => expect(i18n.language).toBe('en'));
  });

  it('can be printed in English', async () => {
    renderCard('/area/C113/card?lang=en');
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(screen.getByRole('heading', { level: 1, name: 'Kasulu Town' })).toBeInTheDocument();
    expect(await screen.findByText('Hazards in Kasulu Town', {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(screen.getByText('Risk level')).toBeInTheDocument();
    // The Guide Book level of the class, named with its colour (PMO-DMD, 14 October 2026).
    expect(screen.getAllByText(/^Level [123] · (Advisory|Warning|Major warning)$/).length).toBeGreaterThan(0);
  });

  it('shows where the area lies and the risk communication, with no generated statements', async () => {
    renderCard('/area/C051/card?lang=en');
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(screen.queryByRole('heading', { name: 'What the data say about Kibiti District' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Kibiti District is at high risk/)).not.toBeInTheDocument();
    expect(screen.getByText('Risk communication')).toBeInTheDocument();
    expect(screen.getByText('If you live or work here')).toBeInTheDocument();
    expect(screen.queryByText(/^Risk here is/)).not.toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Where Kibiti District lies' }, { timeout: 20_000 })).toBeInTheDocument();
  });
});
