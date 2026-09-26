// @vitest-environment jsdom
/**
 * Render smoke test for the Risk Explorer: desktop and mobile layouts mount with real data, the query
 * string drives (and is driven by) level, lens, selection, comparison and view, the ranking table sorts,
 * filters and exports, both languages have every key, and React logs no errors.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import type { Metric } from '@/engine/risk/metrics';
import { buildModel, placeKey } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import ExplorePage from '../ExplorePage';

const model = buildModel();
const council = model.councils.find((c) => c.inheritedFrom) ?? model.councils[0];
const other = model.councils.find((c) => c.region !== council.region)!;
// jsdom + a full page with 195 table rows is slow, especially when the whole suite runs in parallel.
const SLOW = 90_000;
vi.setConfig({ testTimeout: SLOW, hookTimeout: SLOW });

// Leaflet needs a real layout engine: stand in a stub that exposes the props the explorer passes.
vi.mock('@/components/map/RiskMap', () => ({
  default: (p: { level: string; metric: Metric; selectedIds?: string[]; focusId?: string | null; filterClass?: string | null; onSelect?: (u: Unit) => void }) => (
    <div data-testid="map" data-level={p.level} data-label={p.metric.labelKey} data-selected={(p.selectedIds ?? []).join(',')} data-focus={p.focusId ?? ''} data-filter={p.filterClass ?? ''}>
      <button type="button" onClick={() => p.onSelect?.(model.byId.get(council.id)!)}>
        stub-select
      </button>
    </div>
  ),
}));

let desktop = true;
const missing: string[] = [];
let errors: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  class Noop {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('ResizeObserver', Noop);
  vi.stubGlobal('IntersectionObserver', Noop);
  window.matchMedia = ((q: string) => ({
    matches: desktop && /min-width:\s*(1024|1280)px/.test(q),
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  i18n.options.saveMissing = true;
  i18n.on('missingKey', (_lngs: readonly string[], ns: string, key: string) => missing.push(`${i18n.language}:${ns}:${key}`));
});

beforeEach(async () => {
  desktop = true;
  missing.length = 0;
  errors = vi.spyOn(console, 'error');
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
  expect(missing).toEqual([]);
});

function Probe() {
  const loc = useLocation();
  return <output data-testid="search">{loc.search}</output>;
}

async function renderAt(search = '') {
  const utils = render(
    <DataProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[`/explore${search}`]}>
          <Routes>
            <Route
              path="/explore"
              element={
                <>
                  <ExplorePage />
                  <Probe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </DataProvider>,
  );
  await screen.findByTestId('map');
  return utils;
}
const params = () => new URLSearchParams(screen.getByTestId('search').textContent ?? '');

describe('ExplorePage — desktop', () => {
  it('mounts the panel, lens tiles, legend, statistics and the map', async () => {
    await renderAt();
    expect(screen.getByRole('heading', { level: 1, name: 'Risk explorer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INFORM Risk/, pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Find a council or region' })).toBeInTheDocument();
    expect(screen.getByText('Legend & filter')).toBeInTheDocument();
    const map = screen.getByTestId('map');
    expect(map.dataset.level).toBe('council');
    // RiskMap translates labelKey within its namespace — the explorer hands it a namespace-relative key.
    expect(map.dataset.label).toBe('informRisk');
  });

  it('selects from the map, shows the area card and writes the id to the URL', async () => {
    await renderAt();
    fireEvent.click(screen.getByRole('button', { name: 'stub-select' }));
    expect(params().get('id')).toBe(council.id);
    const card = await screen.findByRole('complementary', { name: `Details for ${council.name}` });
    expect(within(card).getByRole('heading', { level: 2, name: council.name })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /View full profile/ })).toHaveAttribute('href', `/area/${council.id}`);
    expect(within(card).getByText('Top drivers')).toBeInTheDocument();
    expect(within(card).getByText(`Marker: ${model.byId.get(`R-${placeKey(council.region)}`)!.name} region`)).toBeInTheDocument();
    expect(screen.getByTestId('map').dataset.selected).toBe(council.id);
  });

  it('carries the selection to the region level and focuses it', async () => {
    await renderAt(`?level=council&id=${council.id}`);
    fireEvent.click(screen.getByRole('radio', { name: /Regions/ }));
    const regionId = `R-${placeKey(council.region)}`;
    expect(params().get('level')).toBe('region');
    expect(params().get('id')).toBe(regionId);
    expect(screen.getByTestId('map').dataset.focus).toBe(regionId);
  });

  it('switches lens and class filter through the URL', async () => {
    await renderAt();
    fireEvent.click(screen.getByRole('button', { name: /^Hazard & Exposure/ }));
    expect(params().get('metric')).toBe('dim:hazard');
    fireEvent.click(screen.getAllByRole('button', { name: /^High:/ })[0]);
    expect(params().get('class')).toBe('high');
    expect(screen.getByTestId('map').dataset.filter).toBe('high');
  });

  it('restores an indicator lens from a link, with provenance and the continuous-scale note', async () => {
    await renderAt('?level=council&metric=ind:hazard:flood&class=high');
    // INFORM defines no classes for single indicators: a stale class filter in the link is ignored.
    expect(screen.getByTestId('map').dataset.filter).toBe('');
    expect(screen.getByTestId('map').dataset.label).toBe('flood');
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getAllByText(/continuous 0–10 scale/i).length).toBeGreaterThan(0);
  });

  it('pins areas to the comparison tray and removes them', async () => {
    await renderAt(`?level=council&id=${council.id}&cmp=${council.id},${other.id}`);
    const tray = screen.getByRole('region', { name: 'Comparison' });
    expect(within(tray).getByText(other.name)).toBeInTheDocument();
    fireEvent.click(within(tray).getByRole('button', { name: `Remove ${other.name} from the comparison` }));
    expect(params().get('cmp')).toBe(council.id);
  });

  it('ranking table: all rows, sort by name, filter, CSV export', async () => {
    const createUrl = vi.fn(() => 'blob:test');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await renderAt('?level=council&view=table');
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(model.councils.length + 1);

    fireEvent.click(within(table).getByRole('button', { name: /^Name/ }));
    expect(params().get('sort')).toBe('name');
    expect(params().get('dir')).toBe('asc');
    const firstName = [...model.councils].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }))[0].name;
    expect(within(within(table).getAllByRole('row')[1]).getByRole('button', { name: `Show details for ${firstName}` })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter by name or region…' }), { target: { value: council.region } });
    const shown = model.councils.filter((c) => `${c.name} ${c.region}`.toLowerCase().includes(council.region.toLowerCase())).length;
    expect(within(table).getAllByRole('row')).toHaveLength(shown + 1);

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  }, SLOW);

  it('jump-to search selects a region and switches level', async () => {
    await renderAt();
    const box = screen.getByRole('combobox', { name: 'Find a council or region' });
    fireEvent.change(box, { target: { value: council.region } });
    const option = await screen.findAllByRole('option');
    expect(option.length).toBeGreaterThan(0);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(params().get('id')).toBeTruthy();
    const picked = model.byId.get(params().get('id')!)!;
    expect(params().get('level')).toBe(picked.level);
  });
});

describe('ExplorePage — mobile', () => {
  it('uses a bottom sheet with lens chips, and the area in the sheet peek', async () => {
    desktop = false;
    await renderAt(`?id=${council.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Risk explorer' })).toHaveClass('sr-only');
    expect(screen.getByRole('button', { name: 'Expand panel', expanded: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: council.name })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(params().get('id')).toBeNull();
    expect(await screen.findByRole('group', { name: 'Colour by' })).toBeInTheDocument();
  });
});

describe('ExplorePage — Kiswahili', () => {
  it('renders in Kiswahili with no missing keys', async () => {
    await act(async () => {
      await i18n.changeLanguage('sw');
    });
    await renderAt(`?level=council&id=${council.id}&view=table`);
    expect(screen.getByRole('heading', { level: 1, name: 'Chunguza hatari' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  }, SLOW);
});
