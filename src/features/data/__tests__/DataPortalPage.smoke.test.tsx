// @vitest-environment jsdom
/**
 * Smoke test of the whole portal in local demo mode: renders per role, enters a score, sees the live
 * preview, submits through the confirm dialog and finds the submission in the review queue.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

// Role queries are slow over a page this size in jsdom; prefer label/text queries and plain selectors.
const byId = (id: string) => document.getElementById(id)!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const button = (root: HTMLElement | Document, text: RegExp) =>
  [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => text.test(b.textContent ?? '')) ?? null;
import { MemoryRouter } from 'react-router-dom';
import '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider, queryClient } from '@/data-layer/DataProvider';
import DataPortalPage from '../DataPortalPage';

beforeAll(() => {
  // jsdom lacks these; Radix / cmdk touch them.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  localStorage.clear();
});

function renderAt(url: string, role: 'viewer' | 'sector' | 'pmo') {
  localStorage.setItem('inform.demoRole', role);
  return render(
    <DataProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[url]}>
          <DataPortalPage />
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
}

describe('DataPortalPage (local demo mode)', { timeout: 60_000 }, () => {
  it('shows the demo banner and read-only content to visitors', async () => {
    renderAt('/data', 'viewer');
    expect(screen.getByText(/Demo mode/)).toBeInTheDocument();
    expect(screen.getByText('Want to contribute data?')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Enter scores/ })).not.toBeInTheDocument();
    // Visitors have a single section, shown under a plain heading rather than a one-item tab row.
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Approved changes' })).toBeInTheDocument();
    expect(await screen.findByText('The official baseline is in use')).toBeInTheDocument();
  });

  it('lets a sector officer enter a score, preview it and send it for review', async () => {
    renderAt('/data?tab=scores&council=C001', 'sector');
    const input = await screen.findByLabelText('Flood');
    fireEvent.change(input, { target: { value: '9.9' } });
    expect(screen.getAllByText('1 change ready').length).toBeGreaterThan(0);

    // V/C rows are marked as shared with the sibling council.
    expect(screen.getAllByText(/Kondoa Town/).length).toBeGreaterThan(0);

    // Invalid input is announced.
    const drought = byId('score-hazard-drought');
    fireEvent.change(drought, { target: { value: '12' } });
    expect(drought).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('score-hazard-drought-error')).toHaveTextContent('Scores run from 0 to 10.');
    fireEvent.change(drought, { target: { value: '' } });

    fireEvent.click(button(document, /Review & send 1 change/)!);
    await waitFor(() => expect(dialog()).not.toBeNull());
    expect(within(dialog()!).getAllByText('Kondoa District').length).toBeGreaterThan(0);
    fireEvent.click(button(dialog()!, /Send for review/)!);
    await waitFor(() => expect(dialog()).toBeNull());

    const stored = JSON.parse(localStorage.getItem('inform.v2.submissions') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ unitId: 'C001', status: 'pending', changes: [{ ref: 'hazard:flood', value: 9.9 }] });
  });

  it('splits hazard and V/C changes onto the council and its source unit', async () => {
    renderAt('/data?tab=scores&council=C001', 'sector');
    await waitFor(() => expect(document.getElementById('score-hazard-flood')).not.toBeNull());
    fireEvent.change(byId('score-hazard-flood'), { target: { value: '9.9' } });
    fireEvent.change(byId('score-vulnerability-habitat'), { target: { value: '9.8' } });
    fireEvent.click(button(document, /Review & send 2 changes/)!);
    await waitFor(() => expect(dialog()).not.toBeNull());
    fireEvent.click(button(dialog()!, /Send 2 for review/)!);
    await waitFor(() => expect(JSON.parse(localStorage.getItem('inform.v2.submissions') ?? '[]')).toHaveLength(2));
    const stored = JSON.parse(localStorage.getItem('inform.v2.submissions')!) as Array<{ unitId: string }>;
    expect(stored.map((s) => s.unitId).sort()).toEqual(['C001', 'TZ0101']);
  });

  it('shows pending submissions to a PMO reviewer who can approve them', async () => {
    localStorage.setItem(
      'inform.v2.submissions',
      JSON.stringify([
        {
          id: 's1',
          unitId: 'C001',
          unitName: 'Kondoa District',
          region: 'Dodoma',
          changes: [{ ref: 'hazard:flood', value: 9.9, previous: 1 }],
          authority: 'TMA',
          authorId: 'someone-else',
          authorName: 'Officer A',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    renderAt('/data', 'pmo');
    const tab = [...document.querySelectorAll('[role="tab"]')].find((t) => /Review queue/.test(t.textContent ?? ''));
    expect(tab).toHaveAttribute('data-state', 'active');
    expect(await screen.findByText(/by Officer A/)).toBeInTheDocument();
    const approve = [...document.querySelectorAll<HTMLButtonElement>('button')].filter((b) => b.textContent?.trim() === 'Approve').at(-1)!;
    fireEvent.click(approve);
    await waitFor(() => expect(JSON.parse(localStorage.getItem('inform.v2.values') ?? '{}').C001?.['hazard:flood']?.value).toBe(9.9));
    expect(await screen.findByText('All caught up')).toBeInTheDocument();
  });

  it('parses a bulk paste into a preview', async () => {
    renderAt('/data?tab=paste', 'sector');
    fireEvent.change(await screen.findByLabelText('Pasted data'), { target: { value: 'Kondoa DC\t9.9\nNowhere\t5' } });
    expect(await screen.findByText('No matching name found.')).toBeInTheDocument();
    expect(screen.getByText('Kondoa District')).toBeInTheDocument();
  });
});
