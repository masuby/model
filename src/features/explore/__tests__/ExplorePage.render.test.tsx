// @vitest-environment jsdom
/**
 * Render smoke test for the Risk Explorer: desktop and mobile layouts mount with real data, the query
 * string drives (and is driven by) level, lens, selection, comparison and view, the ranking table sorts,
 * filters and exports, both languages have every key, and React logs no errors.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import type { Metric } from '@/engine/risk/metrics';
import { buildModel, placeKey } from '@/engine/risk/model';
import type { Unit } from '@/engine/risk/types';
import { riskBandFor } from '@/features/guide/alert';
import { usePrefs } from '@/state/prefs';
import ExplorePage from '../ExplorePage';
import { MobileSheet } from '../components/MobileSheet';

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
/** At 1280 px and wider (the controls open beside the map); narrower desktops open them as a drawer. */
let wide = true;
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
    matches: desktop && (/min-width:\s*1024px/.test(q) || (wide && /min-width:\s*1280px/.test(q))),
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
  wide = true;
  missing.length = 0;
  errors = vi.spyOn(console, 'error');
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  try {
    expect(errors).not.toHaveBeenCalled();
  } finally {
    // Restored even when the check fails, so one test's error is not counted against the next.
    errors.mockRestore();
  }
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

describe('ExplorePage - desktop', () => {
  it('mounts the panel, lens tiles, legend, statistics and the map', async () => {
    await renderAt();
    expect(screen.getByRole('heading', { level: 1, name: 'Risk explorer' })).toBeInTheDocument();
    // The headline lenses are a radio group labelled by the "Colour by" heading.
    const lenses = screen.getByRole('radiogroup', { name: 'Colour by' });
    expect(within(lenses).getByRole('radio', { name: /INFORM Risk/, checked: true })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Find a council or region' })).toBeInTheDocument();
    expect(screen.getByText('Legend & filter')).toBeInTheDocument();
    const map = screen.getByTestId('map');
    expect(map.dataset.level).toBe('council');
    // RiskMap translates labelKey within its namespace - the explorer hands it a namespace-relative key.
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
    // With an area open on a wide screen the controls fold to a rail; open them to switch the level.
    fireEvent.click(screen.getByRole('button', { name: 'Show the controls' }));
    fireEvent.click(screen.getByRole('radio', { name: /Regions/ }));
    const regionId = `R-${placeKey(council.region)}`;
    expect(params().get('level')).toBe('region');
    expect(params().get('id')).toBe(regionId);
    expect(screen.getByTestId('map').dataset.focus).toBe(regionId);
  });

  it('switches lens and class filter through the URL', async () => {
    await renderAt();
    fireEvent.click(screen.getByRole('radio', { name: /^Hazard & Exposure/ }));
    expect(params().get('metric')).toBe('dim:hazard');
    expect(screen.getByRole('radio', { name: /^Hazard & Exposure/, checked: true })).toBeInTheDocument();
    // Radio-group keyboard model: arrow keys move to the next lens and select it.
    fireEvent.keyDown(screen.getByRole('radio', { name: /^Hazard & Exposure/ }), { key: 'ArrowDown' });
    expect(params().get('metric')).toBe('dim:vulnerability');
    fireEvent.keyDown(screen.getByRole('radio', { name: /^Vulnerability/ }), { key: 'ArrowUp' });
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
    // Its dimension is open on the group, with the group marked.
    const groups = screen.getByRole('group', { name: 'Indicator groups of Hazard & Exposure' });
    expect(within(groups).getByRole('button', { name: /^Flood/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens a dimension onto its indicator groups, right under it', async () => {
    await renderAt();
    // Overall risk: no groups yet, and a hint says where they are.
    expect(screen.queryByRole('group', { name: /^Indicator groups of/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Choose a dimension to see its indicator groups/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /^Hazard & Exposure/ }));
    const groups = screen.getByRole('group', { name: 'Indicator groups of Hazard & Exposure' });
    expect(screen.getByRole('radio', { name: /^Hazard & Exposure/ }).closest('li')).toContainElement(groups);
    expect(within(groups).getByText('Natural hazards')).toBeInTheDocument();
    expect(within(groups).getByText('Human hazards')).toBeInTheDocument();

    // Choosing a group colours the map by it and keeps the list open, for the next one.
    fireEvent.click(within(groups).getByRole('button', { name: /^Flood/ }));
    expect(params().get('metric')).toBe('ind:hazard:flood');
    expect(screen.getByTestId('map').dataset.label).toBe('flood');
    const open = screen.getByRole('group', { name: 'Indicator groups of Hazard & Exposure' });
    const buttons = within(open).getAllByRole('button');
    const flood = within(open).getByRole('button', { name: /^Flood/ });
    expect(flood).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radio', { name: /^Hazard & Exposure/ })).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(within(open).getByRole('button', { name: /^Drought/ }));
    expect(params().get('metric')).toBe('ind:hazard:drought');

    // One tab stop for the list; arrow keys, Home and End move between the groups.
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    const drought = within(open).getByRole('button', { name: /^Drought/ });
    act(() => drought.focus());
    fireEvent.keyDown(drought, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[buttons.indexOf(drought) + 1]);
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(buttons.at(-1));
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);

    // Another dimension opens its own groups instead.
    fireEvent.click(screen.getByRole('radio', { name: /^Vulnerability/ }));
    expect(screen.queryByRole('group', { name: 'Indicator groups of Hazard & Exposure' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Indicator groups of Vulnerability' })).toBeInTheDocument();
    // Back to overall risk closes them.
    fireEvent.click(screen.getByRole('radio', { name: /^INFORM Risk/ }));
    expect(screen.queryByRole('group', { name: /^Indicator groups of/ })).not.toBeInTheDocument();
  });

  it('communicates the risk in the panel: the level on its colour band, two messages and the hazards, never a warning level', async () => {
    await renderAt(`?level=council&id=${council.id}`);
    const panel = await screen.findByRole('complementary', { name: `Details for ${council.name}` });
    const cls = i18n.t(`common:classes.${riskBandFor(council.risk)!.cls}`);
    expect(within(panel).getByText(`${cls} risk`)).toBeInTheDocument();
    expect(within(panel).getByText('If you live or work here')).toBeInTheDocument();
    expect(within(panel).getByText('If you plan, build, invest or settle here')).toBeInTheDocument();
    expect(within(panel).getByText(new RegExp(`^Risk here is ${cls.toLowerCase()}\\.`))).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: 'Highest-scoring indicator groups' })).toBeInTheDocument();
    expect(within(panel).queryByText(/Alert category|Major warning|^Warning$|Advisory|Preparedness priority|What helps|Take action|Be prepared/)).not.toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /View full profile/ })).toHaveAttribute('href', `/area/${council.id}`);
    expect(within(panel).getByRole('link', { name: /Risk card/ })).toHaveAttribute('href', `/area/${council.id}/card`);
  });

  it("lists the same hazards as the profile, the model's scores included (Kibiti: strong winds first), and folds the human hazards", async () => {
    await renderAt('?level=council&id=C051');
    const panel = await screen.findByRole('complementary', { name: 'Details for Kibiti District' });
    const rows = await within(panel).findAllByRole('button', { name: /Show the evidence$/ }, { timeout: 20_000 });
    // Three per dimension: the hazards, then the vulnerability groups, then the coping groups.
    expect(rows.slice(0, 4).map((b) => b.getAttribute('aria-label')!.split(':')[0])).toEqual(['Storms & cyclones', 'Flood', 'Coastal hazards', 'Displaced people']);
    expect(rows[6].getAttribute('aria-label')!.split(':')[0]).toBe('Economic capacity');
    expect(rows[0].getAttribute('aria-label')).toBe('Storms & cyclones: 10.0. Show the evidence');
    expect(within(panel).getAllByText('National value').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Regional value').length).toBeGreaterThan(0);
  });

  it('opens the evidence of a hazard: the map follows, the sources and storms show, Escape returns to the area', async () => {
    await renderAt('?level=council&id=C051');
    const panel = await screen.findByRole('complementary', { name: 'Details for Kibiti District' });
    const storms = await within(panel).findByRole('button', { name: /^Storms & cyclones: 10\.0/ }, { timeout: 20_000 });
    fireEvent.click(storms);
    expect(params().get('metric')).toBe('ind:hazard:stormsCyclone');
    const view = screen.getByRole('complementary', { name: 'Details for Kibiti District' });
    expect(within(view).getByRole('heading', { level: 3, name: 'Storms & cyclones' })).toBeInTheDocument();
    expect(within(view).getByText('What the data say')).toBeInTheDocument();
    expect(within(view).getByText('Storms: Jobo 2021, Hidaya 2024')).toBeInTheDocument();
    expect(within(view).getByText('Benchmark 2026 · 1980-2026 · TMA')).toBeInTheDocument();
    expect(document.activeElement).toBe(within(view).getByRole('heading', { level: 2, name: 'Kibiti District' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(params().get('metric')).toBeNull();
    expect(params().get('id')).toBe('C051');
    expect(within(screen.getByRole('complementary', { name: 'Details for Kibiti District' })).getByRole('heading', { name: 'Highest-scoring indicator groups' })).toBeInTheDocument();
  });

  it('moves focus to the panel when someone selects an area, not when a link opens with one', async () => {
    await renderAt(`?level=council&id=${council.id}`);
    expect(document.activeElement?.id).not.toBe('risk-panel-heading');
    cleanup();
    await renderAt();
    fireEvent.click(screen.getByRole('button', { name: 'stub-select' }));
    const panel = await screen.findByRole('complementary', { name: `Details for ${council.name}` });
    expect(document.activeElement).toBe(within(panel).getByRole('heading', { level: 2, name: council.name }));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(params().get('id')).toBeNull();
    // The selection started nowhere that survives (the controls were folded): focus lands on the search.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Find a council or region' })));
  });

  it('climbs the breadcrumb to the region and to Tanzania', async () => {
    await renderAt(`?level=council&id=${council.id}`);
    const panel = await screen.findByRole('complementary', { name: `Details for ${council.name}` });
    const crumbs = within(panel).getByRole('navigation', { name: 'Where this area sits' });
    fireEvent.click(within(crumbs).getByRole('button', { name: 'Tanzania' }));
    expect(params().get('id')).toBe('TZ');
    // The map shows the whole country.
    expect(screen.getByTestId('map').dataset.focus).toBe('TZ');
    const country = await screen.findByRole('complementary', { name: `Details for ${model.national.name}` });
    expect(within(country).getByRole('heading', { level: 2, name: 'Tanzania' })).toBeInTheDocument();
    expect(within(country).getByRole('heading', { name: 'Highest-scoring indicator groups' })).toBeInTheDocument();
    expect(within(country).getByText('Councils by risk class')).toBeInTheDocument();
    // The country's highest-scoring hazard group opens its evidence: the spread over the regions.
    const wildfire = await within(country).findByRole('button', { name: /^Wildfire: [\d.]+\. Show the evidence/ }, { timeout: 20_000 });
    fireEvent.click(wildfire);
    expect(params().get('metric')).toBe('ind:hazard:wildfire');
    const view = screen.getByRole('complementary', { name: `Details for ${model.national.name}` });
    expect(await within(view).findByRole('heading', { level: 3, name: 'Wildfire' }, { timeout: 20_000 })).toBeInTheDocument();
    expect(within(view).getByText(/^\d+ of \d+ have a value; highest:$/)).toBeInTheDocument();
  }, SLOW);

  it('folds the controls to a rail while the panel is docked, and opens them again', async () => {
    await renderAt(`?level=council&id=${council.id}`);
    expect(screen.queryByRole('radiogroup', { name: 'Colour by' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show the controls' }));
    expect(screen.getByRole('radiogroup', { name: 'Colour by' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide the controls' }));
    expect(screen.queryByRole('radiogroup', { name: 'Colour by' })).not.toBeInTheDocument();
  });

  it('below 1280 px the panel docks too, and the controls open as a drawer that Escape folds again', async () => {
    wide = false;
    await renderAt(`?level=council&id=${council.id}`);
    expect(screen.getByRole('complementary', { name: `Details for ${council.name}` })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show the controls' }));
    const lenses = screen.getByRole('radiogroup', { name: 'Colour by' });
    expect(screen.getByRole('complementary', { name: `Details for ${council.name}` })).toBeInTheDocument();
    fireEvent.keyDown(within(lenses).getAllByRole('radio')[0], { key: 'Escape' });
    expect(screen.queryByRole('radiogroup', { name: 'Colour by' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show the controls' })).toBeInTheDocument();
    expect(params().get('id')).toBe(council.id);
  });

  it('shows the area beside the map: its map and trends on the left, what its data say on the right', async () => {
    await renderAt('?level=council&id=C051');
    const insight = screen.getByRole('complementary', { name: 'Map and trends of Kibiti District' });
    expect(within(insight).getByRole('heading', { name: 'Map of Kibiti District' })).toBeInTheDocument();
    expect(within(insight).getByRole('heading', { name: 'Trends and charts' })).toBeInTheDocument();
    expect(within(insight).getByRole('heading', { name: 'Risk and its parts' })).toBeInTheDocument();
    expect(await within(insight).findByText(/^Heatwave days a year, 1991-2024/, {}, { timeout: 20_000 })).toBeInTheDocument();
    expect(within(insight).getByText(/^INFORM SADC 2024: [\d.]+ → now [\d.]+$/)).toBeInTheDocument();
    // The hazard profile opens a hazard's evidence in the risk panel.
    fireEvent.click(within(insight).getByRole('button', { name: /^Storms & cyclones: 10\.0/ }));
    expect(params().get('metric')).toBe('ind:hazard:stormsCyclone');
    const panel = screen.getByRole('complementary', { name: 'Details for Kibiti District' });
    expect(within(panel).getByRole('heading', { level: 3, name: 'Storms & cyclones' })).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Kibiti District: overview' }));
    expect(within(screen.getByRole('complementary', { name: 'Details for Kibiti District' })).getByRole('heading', { name: 'What the data say about Kibiti District' })).toBeInTheDocument();
    // The controls open as a drawer over the column.
    fireEvent.click(within(insight).getByRole('button', { name: 'Show the controls' }));
    expect(screen.getByRole('radiogroup', { name: 'Colour by' })).toBeInTheDocument();
  });

  it('below 1280 px the map and trends of the area fold inside the risk panel', async () => {
    wide = false;
    await renderAt('?level=council&id=C051');
    const panel = screen.getByRole('complementary', { name: 'Details for Kibiti District' });
    expect(screen.queryByRole('complementary', { name: 'Map and trends of Kibiti District' })).not.toBeInTheDocument();
    expect(within(panel).getByText('Map of Kibiti District')).toBeInTheDocument();
    expect(within(panel).getByText('Trends and charts')).toBeInTheDocument();
    // Open, not folded away: the map and the charts are in view without a click.
    for (const label of ['Map of Kibiti District', 'Trends and charts']) expect(within(panel).getByText(label).closest('details')?.open).toBe(true);
  });

  it('lets the reader widen either panel: a handle that steps with the arrow keys and a button to the reading width', async () => {
    act(() => usePrefs.setState({ panelWidths: { left: null, right: null } }));
    // jsdom's window is 1024 px wide; the handles clamp so the map keeps 360 px, so give them a laptop screen.
    const innerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    await renderAt('?level=council&id=C051');
    const right = screen.getByRole('separator', { name: 'Width of the right panel: drag, or use the arrow keys' });
    const before = Number(right.getAttribute('aria-valuenow'));
    fireEvent.keyDown(right, { key: 'ArrowLeft' });
    expect(usePrefs.getState().panelWidths.right).toBe(before + 16);
    fireEvent.keyDown(right, { key: 'Enter' });
    expect(usePrefs.getState().panelWidths.right).toBeNull();
    const panel = screen.getByRole('complementary', { name: 'Details for Kibiti District' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Widen the panel' }));
    expect(usePrefs.getState().panelWidths.right).toBeGreaterThanOrEqual(400);
    expect(within(panel).getByRole('button', { name: 'Narrow the panel' })).toHaveAttribute('aria-pressed', 'true');
    const left = screen.getByRole('separator', { name: 'Width of the left panel: drag, or use the arrow keys' });
    fireEvent.keyDown(left, { key: 'ArrowRight' });
    expect(usePrefs.getState().panelWidths.left).toBeGreaterThan(0);
    act(() => usePrefs.setState({ panelWidths: { left: null, right: null } }));
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: innerWidth });
  });

  it('moves to a neighbouring council from the keyboard on the map of the area', async () => {
    await renderAt('?level=council&id=C051');
    const insight = screen.getByRole('complementary', { name: 'Map and trends of Kibiti District' });
    const mafia = model.councils.find((c) => c.name === 'Mafia District')!;
    // The region's councils are buttons named with their value; the country inset is pointer-only.
    const button = await within(insight).findByRole('button', { name: /^Mafia District: INFORM Risk [\d.]+, / }, { timeout: 20_000 });
    expect(within(insight).queryByRole('button', { name: /^Pwani: / })).not.toBeInTheDocument();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(params().get('id')).toBe(mafia.id);
  });

  it('counts only updates approved through the portal: no "Updated" badge from the Benchmark 2026', async () => {
    await renderAt('?level=council&id=C051');
    const card = await screen.findByRole('complementary', { name: 'Details for Kibiti District' });
    expect(within(card).queryByText('Updated')).not.toBeInTheDocument();
    expect(within(card).queryByText(/approved data update/)).not.toBeInTheDocument();
    expect(within(card).queryByText(/^Benchmark 2026/)).not.toBeInTheDocument();
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

  it('table view docks the area card and the comparison beside and under the rows', async () => {
    await renderAt(`?level=council&view=table&id=${council.id}&cmp=${council.id},${other.id}`);
    const table = screen.getByRole('region', { name: 'Ranking table' });
    expect(within(table).getByRole('complementary', { name: `Details for ${council.name}` })).toBeInTheDocument();
    expect(within(table).getByRole('region', { name: 'Comparison' })).toBeInTheDocument();
    expect(within(table).getByRole('button', { name: /Show on map/ })).toBeInTheDocument();
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

describe('ExplorePage - mobile', () => {
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

  it('starts the sheet body from its top when the area or the hazard changes', () => {
    const props = { expanded: true, onExpandedChange: () => {}, peek: <p>peek</p>, containerHeight: 800, label: 'Sheet' };
    const { rerender } = render(
      <MobileSheet {...props} scrollKey="C051|risk">
        <p>body</p>
      </MobileSheet>,
    );
    const body = screen.getByText('body').parentElement!;
    body.scrollTop = 120;
    rerender(
      <MobileSheet {...props} scrollKey="C051|risk">
        <p>body</p>
      </MobileSheet>,
    );
    expect(body.scrollTop).toBe(120);
    rerender(
      <MobileSheet {...props} scrollKey="C051|ind:hazard:stormsCyclone">
        <p>body</p>
      </MobileSheet>,
    );
    expect(body.scrollTop).toBe(0);
  });

  it("puts a dimension's indicator groups in a second row under the lens tabs", async () => {
    desktop = false;
    await renderAt();
    expect(screen.queryByRole('group', { name: /^Indicator groups of/ })).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('group', { name: 'Colour by' })).getByRole('button', { name: /^Hazard/ }));
    expect(params().get('metric')).toBe('dim:hazard');
    const chips = screen.getByRole('group', { name: 'Indicator groups of Hazard & Exposure' });
    fireEvent.click(within(chips).getByRole('button', { name: 'Flood' }));
    expect(params().get('metric')).toBe('ind:hazard:flood');
    expect(within(screen.getByRole('group', { name: 'Indicator groups of Hazard & Exposure' })).getByRole('button', { name: 'Flood' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ExplorePage - Kiswahili', () => {
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
