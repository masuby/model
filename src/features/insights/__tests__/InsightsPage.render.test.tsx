// @vitest-environment jsdom
/**
 * Render smoke test: the whole Insights page mounts with real data in both languages, every chart
 * produces an SVG surface, the matrix sorts, and React logs no errors (keys, nesting, etc.).
 *
 * Chart sections are code-split and mounted progressively after the first paint, so each test first
 * waits until every section has rendered.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import { buildModel } from '@/engine/risk/model';
import { hazardMatrix, sortMatrix } from '../analytics';
import InsightsPage from '../InsightsPage';

const W = 1200;
const H = 600;
const SLOW = 60_000; // jsdom + Recharts import is slow on first run

beforeAll(() => {
  // jsdom lacks layout: give Recharts' ResponsiveContainer a real size and stub browser observers.
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe(target: Element) {
      const contentRect = { width: W, height: H, top: 0, left: 0, bottom: H, right: W, x: 0, y: 0, toJSON: () => ({}) };
      this.cb([{ target, contentRect } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.assign(globalThis, { ResizeObserver: RO, IntersectionObserver: IO });
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: W, height: H, top: 0, left: 0, bottom: H, right: W, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
  for (const [prop, v] of [
    ['clientWidth', W],
    ['clientHeight', H],
    ['offsetWidth', W],
    ['offsetHeight', H],
  ] as const)
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => v });
});

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

function renderPage() {
  return render(
    <DataProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={['/insights']}>
          <InsightsPage />
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
}

/** The decision view (UX-05): the findings and four charts; the analyst view adds three more. */
const MAIN_IDS = ['kpis', 'regions', 'dimensions', 'hazards', 'coverage'];
const ANALYST_IDS = ['kpis', 'classes', 'drivers', 'correlation'];

/** Wait until every section of the current view has mounted its heading (chart sections load after the first paint). */
async function allSectionsRendered(container: HTMLElement, ids: readonly string[] = MAIN_IDS) {
  await waitFor(
    () => {
      for (const id of ids) expect(container.querySelector(`section#${id} h2`)).not.toBeNull();
    },
    { timeout: SLOW },
  );
}

/** Switch to the analyst charts (the second view). */
async function openAnalystView(container: HTMLElement) {
  fireEvent.click(screen.getByRole('radio', { name: i18n.t('insights:views.analyst') }));
  await allSectionsRendered(container, ANALYST_IDS);
}

const RAW_KEY = /(?<![A-Za-z])(kpi|regions|scatter|matrix|classes|drivers|coverage|correlation|findings|notes|nav|lens)\.[a-z][a-zA-Z]+/;

describe('InsightsPage', () => {
  it(
    'renders every section with live data and no React errors',
    async () => {
      const errors: string[] = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => void errors.push(args.map(String).join(' ')));
      await act(() => i18n.changeLanguage('en'));
      const { container } = renderPage();

      expect(screen.getByRole('heading', { level: 1, name: i18n.t('insights:title') })).toBeInTheDocument();
      // Every section anchor of the decision view exists from the first paint (the sticky nav links to them);
      // the analyst charts wait behind their view (UX-05: at most five sections in the main view).
      for (const id of MAIN_IDS) expect(container.querySelector(`section#${id}`)).not.toBeNull();
      for (const id of ANALYST_IDS.slice(1)) expect(container.querySelector(`section#${id}`)).toBeNull();
      expect(container.querySelectorAll('[data-id]').length).toBe(MAIN_IDS.length);
      await allSectionsRendered(container);

      // Hazard matrix: a header row plus one row per region.
      const model = buildModel();
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(model.regions.length + 1);

      // Recharts surfaces in the decision view: ranking, scatter, coverage, donut.
      expect(container.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(4);
      // The analyst view: distribution, drivers ×2, correlation.
      await openAnalystView(container);
      for (const id of ANALYST_IDS) expect(container.querySelector(`section#${id}`), id).not.toBeNull();
      for (const id of MAIN_IDS.slice(1)) expect(container.querySelector(`section#${id}`), id).toBeNull();
      expect(container.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(3);

      // No raw i18n keys leaked into the page.
      expect(container.textContent).not.toMatch(RAW_KEY);

      spy.mockRestore();
      expect(errors.filter((e) => !/width\(0\)|height\(0\)/.test(e))).toEqual([]);
    },
    SLOW,
  );

  it(
    'sorts the hazard matrix by a column',
    async () => {
      const { container } = renderPage();
      await allSectionsRendered(container);
      const table = screen.getByRole('table');
      const rows = hazardMatrix(buildModel().regions);
      const firstRow = () => within(within(table).getAllByRole('row')[1]).getByRole('rowheader');
      // Columns: Region, All natural hazards, Drought, …
      const droughtHeader = () => within(table).getAllByRole('columnheader')[2];
      const button = within(droughtHeader()).getByRole('button');

      fireEvent.click(button);
      expect(droughtHeader()).toHaveAttribute('aria-sort', 'descending');
      expect(firstRow()).toHaveTextContent(sortMatrix(rows, 'drought', 'desc')[0].name);

      fireEvent.click(button);
      expect(droughtHeader()).toHaveAttribute('aria-sort', 'ascending');
      expect(firstRow()).toHaveTextContent(sortMatrix(rows, 'drought', 'asc')[0].name);
    },
    SLOW,
  );

  it(
    'renders in Kiswahili',
    async () => {
      await act(() => i18n.changeLanguage('sw'));
      const { container } = renderPage();
      await allSectionsRendered(container);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(i18n.t('insights:title', { lng: 'sw' }));
      // Every section heading and every chart's figure note is in Kiswahili.
      const sw = (key: string, opts?: Record<string, unknown>) => i18n.t(`insights:${key}`, { lng: 'sw', ...opts });
      const main: Record<string, string> = { kpis: 'findings.title', regions: 'regions.title', dimensions: 'scatter.title', hazards: 'matrix.title', coverage: 'coverage.title' };
      for (const [id, key] of Object.entries(main)) expect(container.querySelector(`section#${id} h2`)).toHaveTextContent(sw(key));
      for (const key of ['regions.caption', 'coverage.histCaption']) expect(screen.getByText(sw(key))).toBeInTheDocument();
      expect(container.querySelector('#coverage')).toHaveTextContent(sw('coverage.showSources'));
      expect(container.textContent).not.toMatch(RAW_KEY);
      await openAnalystView(container);
      const analyst: Record<string, string> = { classes: 'classes.title', drivers: 'drivers.title', correlation: 'correlation.title' };
      for (const [id, key] of Object.entries(analyst)) expect(container.querySelector(`section#${id} h2`)).toHaveTextContent(sw(key));
      for (const key of ['classes.caption', 'correlation.caption']) expect(screen.getByText(sw(key))).toBeInTheDocument();
      expect(container.textContent).not.toMatch(RAW_KEY);
    },
    SLOW,
  );
});
