// @vitest-environment jsdom
/**
 * Render smoke test: the whole Insights page mounts with real data in both languages, every chart
 * produces an SVG surface, the matrix sorts, and React logs no errors (keys, nesting, etc.).
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
      for (const id of ['kpis', 'regions', 'dimensions', 'hazards', 'classes', 'drivers', 'coverage', 'correlation']) expect(container.querySelector(`section#${id}`)).not.toBeNull();

      // Hazard matrix: a header row plus one row per region.
      const model = buildModel();
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(model.regions.length + 1);

      // Recharts surfaces: ranking, scatter, distribution, drivers ×2, coverage, donut.
      expect(container.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(7);

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
      renderPage();
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
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(i18n.t('insights:title', { lng: 'sw' }));
      expect(screen.getAllByText(/Kinachoonyeshwa:/).length).toBeGreaterThanOrEqual(8);
      expect(container.textContent).not.toMatch(RAW_KEY);
    },
    SLOW,
  );
});
