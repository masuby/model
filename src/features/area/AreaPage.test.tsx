// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider, queryClient } from '@/data-layer/DataProvider';
import { buildModel, placeKey } from '@/engine/risk/model';
import { riskBandFor } from '@/features/guide/alert';
import { loadRegionGuide } from '@/features/guide/data';
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

function renderAt(id: string, search = '') {
  return render(
    <DataProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[`/area/${id}${search}`]}>
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
    // The Analysis view holds the evidence; the default view leads with what to do (UX-01).
    renderAt(id, '?view=analysis');
    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Every indicator group, with its source')).toBeInTheDocument();
    expect(screen.getByText('What drives the score', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.queryByText('How this profile is calculated', { selector: 'h2' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /the Methodology page/ })).toHaveAttribute('href', '/methodology');
    expect(document.title).toContain(name);
    // Charts rendered as SVG (categories radar, distribution beeswarm, indicator bars).
    expect(document.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(3);
  });

  it('renders in Kiswahili', async () => {
    await i18n.changeLanguage('sw');
    renderAt(council.id, '?view=analysis');
    expect(screen.getByText('Kila kundi la viashiria na chanzo chake')).toBeInTheDocument();
    await i18n.changeLanguage('en');
  });

  it('defers heavy sections until they near the viewport, and renders them all before printing', async () => {
    await i18n.changeLanguage('en');
    vi.stubGlobal('IntersectionObserver', Noop); // nothing ever scrolls into view
    renderAt(council.id, '?view=analysis');
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
      renderAt(kondoa.id, '?view=analysis');
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

  it('communicates the risk: the level on its colour band, the two messages and the hazards, never a warning level or the area statements', async () => {
    await i18n.changeLanguage('en');
    const c = model.councils.find((x) => placeKey(x.region) !== 'tabora')!;
    const guide = (await loadRegionGuide(placeKey(c.region)))!.councils[c.id];
    renderAt(c.id);
    const section = document.getElementById('actions')!;
    expect(within(section).getByRole('heading', { level: 2, name: `The risk in ${c.name}` })).toBeInTheDocument();
    // The risk level is the INFORM class on its colour band, shown once: here, not in the hero.
    const risk = riskBandFor(c.risk)!;
    const cls = i18n.t(`common:classes.${risk.cls}`);
    // The default view leads with the risk; the analysis is one switch away.
    expect(screen.getByRole('radio', { name: 'Risk' })).toHaveAttribute('aria-checked', 'true');
    const status = within(section).getByRole('region', { name: 'Risk communication' });
    expect(within(status).getByText(`${cls}, ${c.risk!.toFixed(1)} out of 10 on the INFORM risk scale`)).toBeInTheDocument();
    // Risk communication: the two messages of the level, without a sentence stating the level first.
    expect(within(status).getByRole('heading', { name: 'Risk communication' })).toBeInTheDocument();
    expect(within(status).getByText('If you live or work here')).toBeInTheDocument();
    expect(within(status).getByText('If you plan, build, invest or settle here')).toBeInTheDocument();
    expect(within(status).queryByText(/^Risk here is/)).not.toBeInTheDocument();
    // No warning level, no advice, one emergency number.
    expect(within(section).queryByText(/Advisory|Major warning|Take action|What helps|Be prepared/)).not.toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'Call 190' })).toHaveAttribute('href', 'tel:190');
    expect(within(section).queryByText('114')).not.toBeInTheDocument();
    // The reconciled hazard list with its bands.
    expect(await within(section).findByRole('heading', { name: `Hazards in ${c.name}` }, { timeout: 20_000 })).toBeInTheDocument();
    // The Guide Book's statements about the area are not repeated on a council's profile.
    expect(within(section).queryByRole('heading', { level: 3, name: 'The area and its hazards' })).not.toBeInTheDocument();
    expect(within(section).queryByText(guide.know[0].risk.en)).not.toBeInTheDocument();
  });

  it('communicates the risk in Kiswahili', async () => {
    await i18n.changeLanguage('sw');
    try {
      const c = model.councils.find((x) => placeKey(x.region) === 'tabora')!;
      renderAt(c.id);
      const section = document.getElementById('actions')!;
      expect(within(section).getByRole('region', { name: 'Mawasiliano ya hatari' })).toBeInTheDocument();
      expect(within(section).queryByText(/^Hatari hapa ni/)).not.toBeInTheDocument();
      expect(within(section).getByText('Ukiishi au kufanya kazi hapa')).toBeInTheDocument();
      expect(within(section).getByText('Ukipanga, kujenga, kuwekeza au kuhamia hapa')).toBeInTheDocument();
      expect(await within(section).findByRole('heading', { name: `Vitisho katika ${c.name}` }, { timeout: 20_000 })).toBeInTheDocument();
      expect(within(section).queryByText(/Ushauri|Tahadhari kubwa|Chukua hatua/)).not.toBeInTheDocument();
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
