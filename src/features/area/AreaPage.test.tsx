// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider, queryClient } from '@/data-layer/DataProvider';
import { buildModel, placeKey } from '@/engine/risk/model';
import { alertFor } from '@/features/guide/alert';
import { isStatusRow, loadHazardGuide, loadRegionGuide } from '@/features/guide/data';
import AreaPage from './AreaPage';
import { loadCharts } from './components/ChartSlot';

// The SVG locator zooms with getBBox, which jsdom lacks; the map is covered by its own component.
vi.mock('@/components/map/StaticMap', () => ({ default: () => <div data-testid="static-map" /> }));

// jsdom has no layout: give every chart a fixed size so the custom SVG shapes actually render.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof Recharts>();
  const { cloneElement } = await import('react');
  return {
    ...actual,
    ResponsiveContainer: ({ children, height }: { children: React.ReactElement<{ width?: number; height?: number }>; height?: number | string }) =>
      cloneElement(children, { width: 800, height: typeof height === 'number' ? height : 320 }),
  };
});

class Noop {
  observe(_target?: Element) {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

/** Reports every observed element as on screen - as if the reader had scrolled the whole page. */
class InViewObserver extends Noop {
  private readonly cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    super();
    this.cb = cb;
  }
  override observe(target: Element) {
    this.cb([{ isIntersecting: true, target, boundingClientRect: target.getBoundingClientRect() } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', Noop);
});

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', InViewObserver);
});

const model = buildModel();

function renderAt(id: string) {
  return render(
    <DataProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[`/area/${id}`]}>
          <Routes>
            <Route path="/area/:id" element={<AreaPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
}

// Full-page renders are heavy in jsdom (and slower still when the whole suite runs in parallel).
describe('AreaPage', { timeout: 90_000 }, () => {
  // In the app the chart module is prefetched while the browser is idle; warm it the same way here so
  // chart sections render synchronously when they mount (and before printing).
  beforeAll(async () => {
    await loadCharts();
  }, 60_000); // a cold import of the chart library can be slow when the whole suite runs in parallel
  const council = model.councils.find((c) => c.inheritedFrom) ?? model.councils[0];
  const region = model.regions[0];
  const source = model.sources[0];

  it.each([
    ['council', council.id, council.name],
    ['council (lower-case id)', council.id.toLowerCase(), council.name],
    ['region', region.id, region.name],
    ['source unit', source.id, source.name],
    ['national', 'TZ', model.national.name],
  ])('renders the %s profile', async (_label, id, name) => {
    await i18n.changeLanguage('en');
    renderAt(id);
    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Every indicator group, with its source')).toBeInTheDocument();
    expect(screen.getByText('How this profile is calculated', { selector: 'h2' })).toBeInTheDocument();
    expect(document.title).toContain(name);
    // Charts rendered as SVG (categories radar, distribution beeswarm, indicator bars).
    expect(document.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(3);
  });

  it('renders in Kiswahili', async () => {
    await i18n.changeLanguage('sw');
    renderAt(council.id);
    expect(screen.getByText('Kila kundi la viashiria na chanzo chake')).toBeInTheDocument();
    await i18n.changeLanguage('en');
  });

  it('defers heavy sections until they near the viewport, and renders them all before printing', async () => {
    await i18n.changeLanguage('en');
    vi.stubGlobal('IntersectionObserver', Noop); // nothing ever scrolls into view
    renderAt(council.id);
    // Section headings are always there (the nav and print need them); the heavy content is not yet.
    expect(screen.getByText('Every indicator group, with its source', { selector: 'h2' })).toBeInTheDocument();
    expect(document.querySelectorAll('svg.recharts-surface')).toHaveLength(0);
    expect(screen.queryByRole('table', { name: /All indicator groups for/ })).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('beforeprint'));
    });
    expect(document.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('table', { name: /All indicator groups for/ })).toBeInTheDocument();
    expect(document.querySelector('.area-deferred')).toBeNull();
  });

  it('lists the figures an institution sent behind a score, with the level they were recorded at', async () => {
    await i18n.changeLanguage('en');
    const kondoa = model.councils.find((c) => c.region === 'Dodoma')!;
    localStorage.setItem(
      'inform.v2.rawValues',
      JSON.stringify([{ specId: 'VU.VG.CH-UW', unitId: 'R-dodoma', level: 'region', value: 21.5, dataset: 'TDHS-MIS 2022', institution: 'NBS', at: new Date().toISOString() }]),
    );
    queryClient.clear();
    try {
      renderAt(kondoa.id);
      // A lazy chunk: allow for a busy machine (the suite runs files in parallel).
      expect((await screen.findAllByText('Figures behind this score', {}, { timeout: 45_000 })).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Regional figure').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/NBS · TDHS-MIS 2022/).length).toBeGreaterThan(0);
      // Every source says what kind it is.
      expect(screen.getAllByText(/· Tanzanian institution/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/· Global dataset/).length).toBeGreaterThan(0);
    } finally {
      localStorage.removeItem('inform.v2.rawValues');
      queryClient.clear();
    }
  });

  it('tells people what to do: the local advice, every hazard at each alert level, and the incident guide', async () => {
    await i18n.changeLanguage('en');
    const c = model.councils.find((x) => placeKey(x.region) !== 'tabora')!;
    const guide = (await loadRegionGuide(placeKey(c.region)))!.councils[c.id];
    const levels = await loadHazardGuide(guide.hazards[0]);
    renderAt(c.id);
    const section = document.getElementById('actions')!;
    expect(within(section).getByRole('heading', { level: 2, name: `What to do in ${c.name}` })).toBeInTheDocument();
    // The alert category follows the risk level, in the hero (a link to this section) and here.
    const alert = alertFor(c.risk)!;
    const category = ['Advisory', 'Warning', 'Major warning'][alert.level - 1];
    expect(screen.getByRole('link', { name: new RegExp(`^Alert category: ${category}\\s*What to do$`) })).toHaveAttribute('href', '#actions');
    const status = within(section).getByRole('region', { name: `Alert category for ${c.name}` });
    expect(within(status).getByText(category)).toBeInTheDocument();
    expect(within(status).getByText(new RegExp(`assessed risk level: ${i18n.t(`common:classes.${alert.cls}`)}`))).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'Call 190 (Emergency)' })).toHaveAttribute('href', 'tel:190');
    // Know your risk: the guide's own statement for this council, and what helps.
    expect((await within(section).findAllByText(guide.know[0].risk.en, {}, { timeout: 20_000 })).length).toBeGreaterThan(0);
    expect(within(section).getAllByText('What helps').length).toBeGreaterThan(0);
    // The hazards the guide documents here come first, the first one open at the area's alert category.
    const hazards = within(section).getByRole('radiogroup', { name: `Hazards in ${c.name}` });
    expect(within(hazards).getAllByRole('radio')).toHaveLength(guide.hazards.length);
    expect(within(hazards).getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
    expect(within(section).getByRole('radio', { name: new RegExp(`^${category} ·`) })).toHaveAttribute('aria-checked', 'true');
    expect(within(section).getByText(`· ${c.name}'s alert category`)).toBeInTheDocument();
    expect(within(section).getByRole('combobox', { name: 'Other hazards' })).toBeInTheDocument();
    // A major warning: what people may see, and what to do.
    fireEvent.click(within(section).getByRole('radio', { name: /^Major warning/ }));
    const top = levels['3']!.find((r) => !isStatusRow(r))!;
    expect((await within(section).findAllByText(top.impact.en, {}, { timeout: 20_000 })).length).toBeGreaterThan(0);
    expect(within(section).getAllByText(top.actions.en[0]).length).toBeGreaterThan(0);
    // The incident guide, folded.
    expect(await within(section).findByRole('heading', { level: 3, name: 'Incidents and accidents' }, { timeout: 20_000 })).toBeInTheDocument();
  });

  it("leads with the council's own plan where the guide has one, in Kiswahili", async () => {
    await i18n.changeLanguage('sw');
    try {
      const c = model.councils.find((x) => placeKey(x.region) === 'tabora')!;
      const plan = (await loadRegionGuide('tabora'))!.councils[c.id].levels!;
      renderAt(c.id);
      const section = document.getElementById('actions')!;
      expect(within(section).getByRole('region', { name: `Aina ya tahadhari kwa ${c.name}` })).toBeInTheDocument();
      const hazards = await within(section).findByRole('radiogroup', { name: `Majanga katika ${c.name}` }, { timeout: 20_000 });
      const first = within(hazards).getAllByRole('radio')[0];
      expect(first).toHaveTextContent(`Mpango wa halmashauri ya ${c.name}`);
      expect(first).toHaveAttribute('aria-checked', 'true');
      // The plan opens at the council's alert category.
      const level = String(alertFor(c.risk)!.level) as '1' | '2' | '3';
      const row = plan[level]!.find((r) => !isStatusRow(r))!;
      expect(within(section).getAllByText(row.impact.sw).length).toBeGreaterThan(0);
    } finally {
      await i18n.changeLanguage('en');
    }
  });

  it('shows a friendly not-found state for unknown ids', async () => {
    await i18n.changeLanguage('en');
    renderAt('C999');
    expect(screen.getByRole('heading', { level: 1, name: 'We couldn’t find that area' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open the risk explorer/ })).toHaveAttribute('href', '/explore');
  });
});
