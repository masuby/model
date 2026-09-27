/**
 * RiskMap — the one Leaflet choropleth used everywhere (hero, explorer, area profile, severity picker).
 * Joins the model's units onto the council / region / INFORM-district boundaries, colours by any metric
 * (class thresholds for risk and dimensions, a continuous ramp for single indicators), and restyles in
 * place when the metric or selection changes (no re-mount).
 */
import 'leaflet/dist/leaflet.css';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import * as React from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import councilsUrl from '@/data/tanzania-councils.json?url';
import districtsUrl from '@/data/tanzania-districts.json?url';
import regionsUrl from '@/data/tanzania-regions.json?url';
import waterUrl from '@/data/tanzania-waterbodies.json?url';
import type { ClassKey } from '@/engine/risk/classes';
import { metricColor, type Metric } from '@/engine/risk/metrics';
import { placeKey } from '@/engine/risk/model';
import type { Level, RiskModel, Unit } from '@/engine/risk/types';
import { formatNumber, formatScore } from '@/lib/utils';
import { resolveTheme, usePrefs } from '@/state/prefs';

/** Uniform padding in px, or Leaflet-style corner paddings [x, y]. */
export type MapPadding = number | { topLeft: [number, number]; bottomRight: [number, number] };
const paddingOptions = (p: MapPadding): L.FitBoundsOptions =>
  typeof p === 'number' ? { padding: [p, p] } : { paddingTopLeft: p.topLeft, paddingBottomRight: p.bottomRight };

type Props = {
  model: RiskModel;
  level: Level;
  metric: Metric;
  selectedIds?: string[];
  onSelect?: (unit: Unit) => void;
  filterClass?: ClassKey | null;
  focusId?: string | null;
  interactive?: boolean;
  basemap?: 'none' | 'streets';
  className?: string;
  /** Extra line for the tooltip, e.g. "Click to add". */
  tooltipHint?: string;
  /**
   * Space to keep clear when fitting the country or flying to a selection: a number (all sides) or
   * per-corner padding so floating panels (legend, area card, trays, sheets) never cover the target.
   */
  fitPadding?: MapPadding;
  showZoom?: boolean;
};

const TZ_BOUNDS: L.LatLngBoundsExpression = [
  [-11.8, 29.3],
  [-0.95, 40.6],
];

type Props0 = Record<string, string | number | boolean | null | undefined>;
type Geo = FeatureCollection<Geometry, Props0>;

/**
 * Boundaries are static files fetched on demand (and cached by the service worker), so the app bundle
 * carries no geometry and each level downloads only what it draws. One request per file per session.
 */
const GEO_URL: Record<Level | 'water', string> = { council: councilsUrl, region: regionsUrl, national: regionsUrl, source: districtsUrl, water: waterUrl };
const geoCache = new Map<string, Promise<Geo>>();
function loadGeo(key: Level | 'water'): Promise<Geo> {
  const url = GEO_URL[key];
  if (!geoCache.has(url)) {
    geoCache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Failed to load boundaries (${r.status})`);
        return r.json() as Promise<Geo>;
      }),
    );
  }
  return geoCache.get(url)!;
}
function useGeo(key: Level | 'water'): Geo | null {
  const [geo, setGeo] = React.useState<{ key: string; data: Geo } | null>(null);
  React.useEffect(() => {
    let alive = true;
    loadGeo(key).then(
      (data) => alive && setGeo({ key, data }),
      () => geoCache.delete(GEO_URL[key]),
    );
    return () => {
      alive = false;
    };
  }, [key]);
  return geo && geo.key === key ? geo.data : null;
}
const EMPTY: Geo = { type: 'FeatureCollection', features: [] };

/** Resolve the unit behind a boundary feature at a level. */
function useUnitResolver(model: RiskModel, level: Level) {
  return React.useMemo(() => {
    if (level === 'council') return (f: Feature<Geometry, Props0>) => model.byId.get(String(f.properties.code)) ?? null;
    if (level === 'region') return (f: Feature<Geometry, Props0>) => model.byId.get(`R-${placeKey(String(f.properties.reg_name))}`) ?? null;
    if (level === 'national') return () => model.national;
    const idx = new Map(model.sources.map((s) => [`${placeKey(s.name)}|${placeKey(s.region)}`, s]));
    return (f: Feature<Geometry, Props0>) => idx.get(`${placeKey(String(f.properties.dist_name))}|${placeKey(String(f.properties.reg_name))}`) ?? null;
  }, [model, level]);
}

function FitTo({ bounds, padding }: { bounds: L.LatLngBoundsExpression | null; padding: MapPadding }) {
  const map = useMap();
  const padKey = JSON.stringify(padding); // compared by value: inline objects must not re-trigger a flight
  React.useEffect(() => {
    if (bounds) map.flyToBounds(bounds, { ...paddingOptions(JSON.parse(padKey) as MapPadding), duration: 0.5, maxZoom: 8 });
  }, [bounds, map, padKey]);
  return null;
}

/** Keeps the map sized to its container; refits to Tanzania until the user has panned or zoomed. */
function Resizer({ padding, keepFit }: { padding: MapPadding; keepFit: boolean }) {
  const map = useMap();
  const padKey = JSON.stringify(padding);
  React.useEffect(() => {
    const pad = JSON.parse(padKey) as MapPadding;
    const el = map.getContainer();
    let userMoved = false;
    const mark = () => {
      userMoved = true;
    };
    map.on('dragstart zoomstart', mark);
    const fit = () => {
      map.invalidateSize();
      if (!userMoved && keepFit) {
        map.off('zoomstart', mark);
        map.fitBounds(TZ_BOUNDS, { ...paddingOptions(pad), animate: false });
        map.on('zoomstart', mark);
      }
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
      map.off('dragstart zoomstart', mark);
    };
  }, [map, padKey, keepFit]);
  return null;
}

export default function RiskMap({
  model,
  level,
  metric,
  selectedIds = [],
  onSelect,
  filterClass = null,
  focusId = null,
  interactive = true,
  basemap = 'none',
  className,
  tooltipHint,
  fitPadding = 16,
  showZoom = true,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = resolveTheme(usePrefs((s) => s.theme));
  const loadedGeo = useGeo(level);
  const water = useGeo('water');
  const geo = loadedGeo ?? EMPTY;
  const unitOf = useUnitResolver(model, level);
  const layerRef = React.useRef<L.GeoJSON | null>(null);

  // Everything the style/tooltip callbacks read lives in a ref, so they stay stable across renders.
  const live = React.useRef({ metric, selectedIds, filterClass, onSelect, unitOf, t, lang: i18n.language, tooltipHint, theme });
  live.current = { metric, selectedIds, filterClass, onSelect, unitOf, t, lang: i18n.language, tooltipHint, theme };

  const style = React.useCallback((f?: Feature<Geometry, Props0>): L.PathOptions => {
    const { metric: m, selectedIds: sel, filterClass: fc, unitOf: uo, theme: th } = live.current;
    const u = f ? uo(f) : null;
    const v = u ? m.get(u) : null;
    const cls = m.classOf(v);
    const selected = !!u && sel.includes(u.id);
    const dimmed = !!fc && cls?.key !== fc;
    const stroke = getComputedStyle(document.documentElement).getPropertyValue('--map-stroke').trim() || (th === 'dark' ? '#0b1324' : '#ffffff');
    return {
      fillColor: metricColor(m, v),
      fillOpacity: v == null ? 0.25 : dimmed ? 0.12 : basemap === 'none' ? 0.9 : 0.7,
      // Class fills are the same in both themes, so the selection outline is too (dark, AA on every fill).
      color: selected ? '#0b1324' : stroke,
      weight: selected ? 2.8 : level === 'region' || level === 'national' ? 1.2 : 0.6,
      opacity: dimmed ? 0.4 : 1,
    };
  }, [basemap, level]);

  // Restyle in place when anything visual changes.
  React.useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setStyle(style as L.StyleFunction);
    layer.eachLayer((l) => {
      const f = (l as L.Path & { feature?: Feature<Geometry, Props0> }).feature;
      const u = f ? unitOf(f) : null;
      if (u && selectedIds.includes(u.id)) (l as L.Path).bringToFront();
    });
  }, [metric, selectedIds, filterClass, theme, style, unitOf, model, loadedGeo]);

  const tooltipHtml = React.useCallback((f: Feature<Geometry, Props0>) => {
    const { metric: m, unitOf: uo, t: tr, lang, tooltipHint: hint } = live.current;
    const u = uo(f);
    if (!u) return `<div class="px-3 py-2 text-xs">${tr('classes.noData')}</div>`;
    const v = m.get(u);
    const cls = m.classOf(v);
    const metricLabel = tr(m.labelKey, { ns: m.kind === 'indicator' ? 'indicators' : 'common' });
    const pop = u.exposure?.population;
    const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
    return `<div style="min-width:210px;max-width:260px" class="p-3">
      <div style="font-weight:700;font-size:14px;line-height:1.2">${esc(u.name)}</div>
      <div style="font-size:11px;opacity:.65;margin-top:2px">${esc(u.level === 'council' ? u.region : tr(`levels.${u.level}`))}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px">
        <span style="font-size:12px;opacity:.8">${esc(metricLabel)}</span>
        <span style="display:flex;align-items:center;gap:6px;font-weight:800;font-size:15px;font-variant-numeric:tabular-nums">
          <i style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${metricColor(m, v)}"></i>${formatScore(v)}
        </span>
      </div>
      ${cls ? `<div style="font-size:11px;text-align:right;opacity:.75">${tr(`classes.${cls.key}`)}</div>` : ''}
      ${m.kind !== 'risk' ? `<div style="display:flex;justify-content:space-between;font-size:11px;opacity:.7;margin-top:6px"><span>${tr('informRisk')}</span><b>${formatScore(u.risk)}</b></div>` : ''}
      ${pop ? `<div style="display:flex;justify-content:space-between;font-size:11px;opacity:.7;margin-top:2px"><span>${tr('labels.population')}</span><b>${formatNumber(pop, lang)}</b></div>` : ''}
      ${Object.keys(u.edits).length ? `<div style="font-size:11px;color:#2563eb;margin-top:6px">● ${tr('labels.edited')}</div>` : ''}
      ${hint ? `<div style="font-size:11px;opacity:.6;margin-top:8px;border-top:1px solid rgba(127,127,127,.25);padding-top:6px">${esc(hint)}</div>` : ''}
    </div>`;
  }, []);

  const onEach = React.useCallback((f: Feature<Geometry, Props0>, layer: L.Layer) => {
    if (!interactive) return;
    layer.bindTooltip(() => tooltipHtml(f), { sticky: true, className: 'inform-tip', direction: 'top', offset: [0, -8] });
    layer.on({
      click: () => {
        const u = live.current.unitOf(f);
        if (u) live.current.onSelect?.(u);
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const p = e.target as L.Path;
        p.setStyle({ weight: 2.4, color: '#0b1324' });
        p.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        layerRef.current?.resetStyle(e.target as L.Path);
      },
    });
  }, [interactive, tooltipHtml]);

  const focusBounds = React.useMemo<L.LatLngBoundsExpression | null>(() => {
    if (!focusId) return null;
    const f = geo.features.find((ft) => unitOf(ft)?.id === focusId);
    if (!f) return null;
    return L.geoJSON(f).getBounds();
  }, [focusId, geo, unitOf]);

  const tiles =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  return (
    <div className={className} role="region" aria-label={t('a11y.mapOf', { metric: t(metric.labelKey, { ns: metric.kind === 'indicator' ? 'indicators' : 'common' }) })}>
      <MapContainer
        bounds={TZ_BOUNDS}
        className="size-full"
        zoomSnap={0.1}
        zoomControl={interactive && showZoom}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        attributionControl={basemap !== 'none'}
        minZoom={4.5}
        maxBounds={[
          [-16, 24],
          [3.5, 46],
        ]}
      >
        <Resizer padding={fitPadding} keepFit={!focusId} />
        {basemap !== 'none' && <TileLayer key={theme} url={tiles} attribution='&copy; OpenStreetMap &copy; CARTO' />}
        {loadedGeo && <GeoJSON key={level} ref={layerRef} data={geo} style={style as L.StyleFunction} onEachFeature={onEach as (f: Feature, l: L.Layer) => void} />}
        {water && (
          <GeoJSON
            key={`water-${theme}`}
            data={water}
            interactive={false}
            style={() => {
              const css = getComputedStyle(document.documentElement);
              return { fillColor: css.getPropertyValue('--map-water').trim(), fillOpacity: 1, color: css.getPropertyValue('--map-water-stroke').trim(), weight: 0.6 };
            }}
          />
        )}
        <FitTo bounds={focusBounds} padding={fitPadding} />
      </MapContainer>
    </div>
  );
}
