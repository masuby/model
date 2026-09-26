// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Recharts from 'recharts';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import i18n from '@/i18n';
import { TooltipProvider } from '@/components/ui/primitives';
import { DataProvider } from '@/data-layer/DataProvider';
import { buildModel } from '@/engine/risk/model';
import AreaPage from './AreaPage';

// Leaflet needs a real layout engine; the locator map is covered by its own component.
vi.mock('@/components/map/RiskMap', () => ({ default: () => <div data-testid="risk-map" /> }));

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
    expect(screen.getByText('Every indicator, with its source')).toBeInTheDocument();
    expect(screen.getByText('How this profile is calculated', { selector: 'h2' })).toBeInTheDocument();
    expect(document.title).toContain(name);
    // Charts rendered as SVG (categories radar, distribution beeswarm, indicator bars).
    expect(document.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(3);
  });

  it('renders in Kiswahili', async () => {
    await i18n.changeLanguage('sw');
    renderAt(council.id);
    expect(screen.getByText('Kila kiashiria na chanzo chake')).toBeInTheDocument();
    await i18n.changeLanguage('en');
  });

  it('shows a friendly not-found state for unknown ids', async () => {
    await i18n.changeLanguage('en');
    renderAt('C999');
    expect(screen.getByRole('heading', { level: 1, name: 'We couldn’t find that area' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open the risk explorer/ })).toHaveAttribute('href', '/explore');
  });
});
