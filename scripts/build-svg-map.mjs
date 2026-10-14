/**
 * build-svg-map.mjs - pre-project and simplify the council, region and water-body boundaries into SVG
 * path strings (src/data/tanzania-svg.json) for <StaticMap>: a lightweight choropleth for places that
 * do not need pan/zoom (home hero, area locator, click-to-select pickers). No Leaflet, no GeoJSON parsing
 * at runtime.
 *
 * Projection: equirectangular scaled by cos(φ₀) at Tanzania's mid-latitude - visually faithful at this
 * latitude and trivially cheap. Simplification: Douglas–Peucker (turf) at ~0.006° (≈ 650 m).
 *
 *   node scripts/build-svg-map.mjs
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import simplify from '@turf/simplify';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(ROOT + p, 'utf8'));

const councils = read('src/data/tanzania-councils.json');
const regions = read('src/data/tanzania-regions.json');
const water = read('src/data/tanzania-waterbodies.json');
// The international boundary (NBS/PO-RALG lines): the stretches that run through the lakes are drawn as a faint
// path on the water, so the Tanzanian part of Lake Tanganyika (and Nyasa) is told apart from the rest. The lines
// file also carries the neighbours' arcs (DRC–Zambia and DRC–Burundi through Lake Tanganyika), which Tanzania's own
// per-region boundary file tells apart.
const boundaryLines = read('data-source/geojson/International_Boundary_Lines.geojson');
const ownBoundary = read('data-source/geojson/International_Boundary.geojson');

// Frame: Tanzania's extent with a small margin.
const LON0 = 29.25;
const LON1 = 40.55;
const LAT0 = -11.8;
const LAT1 = -0.95;
const PHI = ((LAT0 + LAT1) / 2) * (Math.PI / 180);
const WIDTH = 1000;
const K = WIDTH / ((LON1 - LON0) * Math.cos(PHI));
const HEIGHT = Math.round((LAT1 - LAT0) * K);

// Integer pixels in a 1000-wide frame: sub-pixel detail is invisible at any size the map is shown.
const px = ([lon, lat]) => [Math.round((lon - LON0) * Math.cos(PHI) * K), Math.round((LAT1 - lat) * K)];
const inFrame = ([x, y]) => x > -80 && x < WIDTH + 80 && y > -80 && y < HEIGHT + 80;

/** Compact SVG path for one ring: absolute move, then relative line segments (`l dx dy`). */
function ringPath(ring) {
  const pts = ring.map(px);
  if (pts.length < 3 || !pts.some(inFrame)) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}l`;
  let last = pts[0];
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const dx = p[0] - last[0];
    const dy = p[1] - last[1];
    if (!dx && !dy) continue;
    d += `${n ? (dx < 0 ? '' : ' ') : ''}${dx}${dy < 0 ? '' : ' '}${dy}`;
    last = p;
    n++;
  }
  return n >= 2 ? `${d}z` : '';
}

/** Open polyline (no closing `z`), for a boundary stretch. */
function linePath(coords) {
  const pts = coords.map(px);
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}l`;
  let last = pts[0];
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const dx = p[0] - last[0];
    const dy = p[1] - last[1];
    if (!dx && !dy) continue;
    d += `${n ? (dx < 0 ? '' : ' ') : ''}${dx}${dy < 0 ? '' : ' '}${dy}`;
    last = p;
    n++;
  }
  return n >= 1 ? d : '';
}

/** Extent of a run in degrees (its bounding box's longer side). */
const spanOf = (run) => Math.max(Math.max(...run.map((p) => p[0])) - Math.min(...run.map((p) => p[0])), Math.max(...run.map((p) => p[1])) - Math.min(...run.map((p) => p[1])));

const linesOf = (f) => (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : []);

/** Distance in degrees from a point to the nearest segment of Tanzania's own boundary (longitudes scaled by cos φ). */
const OWN_SEGMENTS = ownBoundary.features.flatMap((f) => linesOf(f).flatMap((l) => l.slice(1).map((p, i) => [l[i], p])));
function distanceToOwnBoundary([x, y]) {
  const kx = Math.cos(PHI);
  let best = Infinity;
  for (const [[x1, y1], [x2, y2]] of OWN_SEGMENTS) {
    const ax = (x1 - x) * kx;
    const ay = y1 - y;
    const bx = (x2 - x1) * kx;
    const by = y2 - y1;
    const t = Math.max(0, Math.min(1, -(ax * bx + ay * by) / (bx * bx + by * by || 1e-12)));
    const d = Math.hypot(ax + t * bx, ay + t * by);
    if (d < best) best = d;
  }
  return best;
}

/**
 * A run is Tanzania's boundary when at least two thirds of its vertices lie within 0.08° of the per-region
 * boundary, a coarser drawing of the same line (the Tanzanian stretches score 0.73 to 1, the neighbours' arcs
 * through Lake Tanganyika 0.5 or less).
 */
const isOwn = (run) => run.filter((p) => distanceToOwnBoundary(p) <= 0.08).length >= (2 / 3) * run.length;

/**
 * Where the segment from a vertex inside a lake to the next vertex outside it crosses the lake's outline: the
 * nearest crossing, so a stretch stops at the first shore or island it meets. Null when the segment does not
 * cross the outline.
 */
function shoreCrossing(inside, outside, lake) {
  const [x0, y0] = inside;
  const dx = outside[0] - x0;
  const dy = outside[1] - y0;
  const rings = lake.geometry.type === 'Polygon' ? lake.geometry.coordinates : lake.geometry.coordinates.flat();
  let best = null;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, ay] = ring[i - 1];
      const ex = ring[i][0] - ax;
      const ey = ring[i][1] - ay;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-15) continue;
      const wx = ax - x0;
      const wy = ay - y0;
      const t = (wx * ey - wy * ex) / den;
      const u = (wx * dy - wy * dx) / den;
      if (t > 1e-9 && t <= 1 && u >= 0 && u <= 1 && (best === null || t < best)) best = t;
    }
  }
  return best === null ? null : [x0 + best * dx, y0 + best * dy];
}

/** Drop a short leading or trailing vertex that doubles back on the line (a spike in the source at the Zambian shore of Tanganyika). */
function trimSpikes(run) {
  const spike = (a, b, c) => Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.05 && (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]) < 0;
  let r = run;
  while (r.length >= 3 && spike(r[0], r[1], r[2])) r = r.slice(1);
  while (r.length >= 3 && spike(r[r.length - 1], r[r.length - 2], r[r.length - 3])) r = r.slice(0, -1);
  return r;
}

/**
 * Tanzania's boundary through the lakes (the Indian Ocean left out): the runs of boundary vertices inside a lake,
 * joined to the shore where the line leaves the water, as simplified line strings.
 */
function lakeBoundaries() {
  const lakes = water.features.filter((f) => !/ocean/i.test(String(f.properties.name)));
  const lakeOf = (pt) => lakes.find((lake) => booleanPointInPolygon(pt, lake)) ?? null;
  const runs = [];
  for (const f of boundaryLines.features) {
    for (const line of linesOf(f)) {
      let run = [];
      let lake = null;
      let before = null;
      let last = null;
      const flush = (after) => {
        if (run.length >= 2) runs.push({ run, lake, before, after });
        run = [];
        lake = null;
      };
      for (const pt of line) {
        const l = lakeOf(pt);
        if (l) {
          if (!run.length) before = last;
          lake ??= l;
          run.push(pt);
        } else flush(pt);
        last = pt;
      }
      flush(null);
    }
  }
  const kept = [];
  console.log('lake boundaries:');
  for (const { run, lake, before, after } of runs) {
    const name = String(lake.properties.name).replace(/\s+/g, ' ').trim() || 'unnamed water';
    if (spanOf(run) < 0.05) continue; // a few vertices touching a shore or a river pool
    if (!isOwn(run)) {
      console.log(`  ${name}: a neighbours' arc of ${run.length} vertices left out`);
      continue;
    }
    let r = trimSpikes(run);
    const head = before && r[0] === run[0] ? shoreCrossing(r[0], before, lake) : null;
    const tail = after && r[r.length - 1] === run[run.length - 1] ? shoreCrossing(r[r.length - 1], after, lake) : null;
    if (head) r = [head, ...r];
    if (tail) r = [...r, tail];
    const joins = [head && 'start', tail && 'end'].filter(Boolean);
    console.log(`  ${name}: ${run.length} vertices over ${spanOf(run).toFixed(2)}°${r.length !== run.length + joins.length ? ', spike trimmed' : ''}${joins.length ? `, joined to the shore at its ${joins.join(' and ')}` : ''}`);
    kept.push(simplify({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r } }, { tolerance: 0.004, highQuality: false }).geometry.coordinates);
  }
  return kept;
}

/** Simplify one polygon; degenerate rings (fewer than 4 points) are dropped, never fatal. */
function simplifyPolygon(poly, tolerance) {
  const rings = poly.filter((r) => r.length >= 4);
  if (!rings.length) return [];
  try {
    return simplify({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: rings } }, { tolerance, highQuality: false }).geometry.coordinates;
  } catch {
    return rings; // keep the original geometry rather than lose a sliver of territory
  }
}

function featurePath(feature, tolerance) {
  const g = feature.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys
    .flatMap((poly) => simplifyPolygon(poly, tolerance).map(ringPath))
    .filter(Boolean)
    .join('');
}

const frame = { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, width: WIDTH, height: HEIGHT };
const boundaries = lakeBoundaries();
const files = {
  'src/data/tanzania-svg-councils.json': { ...frame, units: councils.features.map((f) => ({ id: String(f.properties.code), d: featurePath(f, 0.012) })) },
  'src/data/tanzania-svg-regions.json': { ...frame, units: regions.features.map((f) => ({ id: String(f.properties.reg_name), d: featurePath(f, 0.012) })) },
  // Lakes only: the Indian Ocean polygon would dominate a small map without adding information.
  'src/data/tanzania-svg-water.json': {
    ...frame,
    water: water.features.filter((f) => !/ocean/i.test(String(f.properties.name))).map((f) => featurePath(f, 0.02)).filter(Boolean),
    // The international boundary through the lakes, as open paths drawn on the water.
    boundaries: boundaries.map(linePath).filter(Boolean),
  },
  // The same stretches as GeoJSON for the explorer map.
  'src/data/tanzania-lake-boundaries.json': { type: 'FeatureCollection', features: boundaries.map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } })) },
};
for (const [path, data] of Object.entries(files)) {
  fs.writeFileSync(ROOT + path, JSON.stringify(data));
  console.log(`wrote ${path} (${(fs.statSync(ROOT + path).size / 1024).toFixed(0)} KB)`);
}
