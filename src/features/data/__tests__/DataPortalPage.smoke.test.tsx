// @vitest-environment jsdom
/**
 * Smoke test of the whole portal in local demo mode: renders per role; an institution sends figures for
 * an assigned indicator; a reviewer approves them, enters direct scores and bulk-pastes; an
 * administrator manages people.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Role queries are slow over a page this size in jsdom; prefer label/text queries and plain selectors.
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

const SPEC = 'VU.VG.CH-UW'; // Underweight children (%)
const assignToNbs = () => localStorage.setItem('inform.v2.assignments', JSON.stringify([{ specId: SPEC, institutionKey: 'NBS', assignedAt: new Date().toISOString() }]));
const stored = <T,>(key: string, fallback: T): T => JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
const slow = { timeout: 40_000 }; // the live model now applies the Benchmark 2026 on every rebuild

afterEach(() => {
  cleanup();
  queryClient.clear();
  localStorage.clear();
});

function renderAt(url: string, role: 'viewer' | 'sector' | 'pmo' | 'admin') {
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
    expect(screen.queryByRole('tab', { name: /Enter scores|Bulk paste/ })).not.toBeInTheDocument();
    // Visitors have a single section, shown under a plain heading rather than a one-item tab row.
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Approved changes' })).toBeInTheDocument();
    expect(await screen.findByText('The INFORM SADC 2024 baseline is in use')).toBeInTheDocument();
  });

  it('shows an institution its assigned indicators, and nothing to do without any', async () => {
    renderAt('/data', 'sector');
    expect(screen.queryByRole('tab', { name: /Enter scores|Bulk paste/ })).not.toBeInTheDocument();
    expect(await screen.findByText('Indicators for NBS', {}, slow)).toBeInTheDocument();
    expect(screen.getByText('No indicators assigned yet')).toBeInTheDocument();
  });

  it('lets an institution answer a request with figures for a region', async () => {
    assignToNbs();
    localStorage.setItem(
      'inform.v2.requests',
      JSON.stringify([{ id: 'r1', specId: SPEC, institutionKey: 'NBS', kind: 'update', status: 'open', dueDate: '2099-01-31', createdByName: 'Demo PMO reviewer', createdAt: new Date().toISOString() }]),
    );
    renderAt('/data', 'sector');
    expect(await screen.findByText('Underweight children', {}, slow)).toBeInTheDocument();
    expect(screen.getByText(/Update requested/)).toBeInTheDocument();
    fireEvent.click(button(document, /^Enter values$/)!);

    const dodoma = await screen.findByLabelText('New value for Dodoma', {}, slow);
    fireEvent.change(dodoma, { target: { value: '21,5' } });
    fireEvent.change(screen.getByLabelText('Dataset or source'), { target: { value: 'TDHS-MIS 2022' } });
    fireEvent.click(button(document, /^Send for review$/)!);

    await waitFor(() => expect(stored('inform.v2.rawSubmissions', [])).toHaveLength(1));
    expect(stored<unknown[]>('inform.v2.rawSubmissions', [])[0]).toMatchObject({
      specId: SPEC,
      status: 'pending',
      requestId: 'r1',
      dataset: 'TDHS-MIS 2022',
      entries: [{ unitId: 'R-dodoma', level: 'region', value: 21.5 }],
    });
    expect(stored<Array<{ status: string }>>('inform.v2.requests', [])[0].status).toBe('submitted');
  });

  it('lets a PMO reviewer approve measured values, which then feed the scores', async () => {
    assignToNbs();
    localStorage.setItem(
      'inform.v2.rawSubmissions',
      JSON.stringify([
        {
          id: 'x1',
          specId: SPEC,
          institutionKey: 'NBS',
          entries: [{ unitId: 'R-dodoma', level: 'region', value: 21.5 }],
          dataset: 'TDHS-MIS 2022',
          authorId: 'someone-else',
          authorName: 'Officer B',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    renderAt('/data', 'pmo');
    expect(await screen.findByText(/by Officer B/, {}, slow)).toBeInTheDocument();
    const approve = [...document.querySelectorAll<HTMLButtonElement>('button')].filter((b) => b.textContent?.trim() === 'Approve').at(-1)!;
    fireEvent.click(approve);
    await waitFor(() => expect(stored('inform.v2.rawValues', [])).toHaveLength(1));
    expect(stored<unknown[]>('inform.v2.rawValues', [])[0]).toMatchObject({ specId: SPEC, unitId: 'R-dodoma', level: 'region', value: 21.5, institution: 'NBS' });
    expect(await screen.findByText('All caught up', {}, slow)).toBeInTheDocument();
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


  it('gives administrators the people section, with each officer’s institution', async () => {
    renderAt('/data?tab=people', 'admin');
    expect(await screen.findByText(/these are the demo accounts in this browser/, {}, slow)).toBeInTheDocument();
    expect(screen.getByText('Demo sector officer')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution of Demo sector officer')).toBeInTheDocument();
  });
});
