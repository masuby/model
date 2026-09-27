/**
 * build-svg-map.mjs — pre-project and simplify the council, region and water-body boundaries into SVG
 * path strings (src/data/tanzania-svg.json) for <StaticMap>: a lightweight choropleth for places that
 * do not need pan/zoom (home hero, area locator, click-to-select pickers). No Leaflet, no GeoJSON parsing
 * at runtime.
 *
 * Projection: equirectangular scaled by cos(φ₀) at Tanzania's mid-latitude — visually faithful at this
 * latitude and trivially cheap. Simplification: Douglas–Peucker (turf) at ~0.006° (≈ 650 m).
 *
 *   node scripts/build-svg-map.mjs
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import simplify from '@turf/simplify';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(ROOT + p, 'utf8'));

const councils = read('src/data/tanzania-councils.json');
const regions = read('src/data/tanzania-regions.json');
const water = read('src/data/tanzania-waterbodies.json');

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
const files = {
  'src/data/tanzania-svg-councils.json': { ...frame, units: councils.features.map((f) => ({ id: String(f.properties.code), d: featurePath(f, 0.012) })) },
  'src/data/tanzania-svg-regions.json': { ...frame, units: regions.features.map((f) => ({ id: String(f.properties.reg_name), d: featurePath(f, 0.012) })) },
  // Lakes only: the Indian Ocean polygon would dominate a small map without adding information.
  'src/data/tanzania-svg-water.json': { ...frame, water: water.features.filter((f) => !/ocean/i.test(String(f.properties.name))).map((f) => featurePath(f, 0.02)).filter(Boolean) },
};
for (const [path, data] of Object.entries(files)) {
  fs.writeFileSync(ROOT + path, JSON.stringify(data));
  console.log(`wrote ${path} (${(fs.statSync(ROOT + path).size / 1024).toFixed(0)} KB)`);
}
