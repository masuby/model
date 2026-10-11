#!/usr/bin/env python3
"""OpenStreetMap installations that mark hazardous materials, for the Benchmark 2026 hazardous-material indicator.

Queries the Overpass API (www.openstreetmap.org data, ODbL) over Tanzania's bounding box, split into quarters for
the heavy keys, caches the answers in a directory, and keeps the features inside the 195 councils:
  fuel stations (amenity=fuel), LPG shops (shop=gas), fuel storage tanks and tank farms (man_made=storage_tank:
  fuel content, or untagged tanks in groups of four or more within 250 m; water tanks left out), thermal power
  plants (power=plant burning gas, oil, diesel, coal, biomass or waste), open-pit mines (landuse=quarry with a
  mineral resource), mine shafts and adits, landfills and dumpsites, wastewater treatment plants, factories
  (man_made=works, without the grain mills and the workshops that handle no hazardous material), industrial
  sites with a hazardous industry (industrial=oil, gas, chemical, cement, mine, scrap_yard, factory and others)
  and industrial areas (landuse=industrial).

Usage: python3 scripts/benchmark/osm_hazmat.py CACHE_DIR [--fetch]
Writes data-source/benchmark_2026/osm_hazmat_features.csv (one row per kept feature, with its council)."""
import collections, glob, json, os, pathlib, re, subprocess, sys, time
import geopandas as gpd
from shapely.geometry import Point

ROOT = pathlib.Path(__file__).resolve().parents[2]
OSM = sys.argv[1] if len(sys.argv) > 1 else '.'
BBOX = (-11.8, 29.3, -0.9, 40.6)
QUARTERS = [(-11.8, 29.3, -6.35, 34.95), (-11.8, 34.95, -6.35, 40.6), (-6.35, 29.3, -0.9, 34.95), (-6.35, 34.95, -0.9, 40.6)]
QUERIES = {
    'fuel': 'nwr["amenity"="fuel"]', 'gas_shop': 'nwr["shop"="gas"]', 'storage_tank': 'nwr["man_made"="storage_tank"]',
    'power_plant': 'nwr["power"="plant"]', 'quarry': 'nwr["landuse"="quarry"]', 'mine': 'nwr["man_made"~"^(mineshaft|adit)$"]',
    'landfill': 'nwr["landuse"="landfill"]', 'wastewater': 'nwr["man_made"="wastewater_plant"]', 'landuse_industrial': 'nwr["landuse"="industrial"]',
}
HEAVY = {'works': 'nwr["man_made"="works"]', 'industrial': 'nwr["industrial"]'}  # fetched by quarter


def fetch() -> None:
    def get(sel: str, box, dest: str) -> None:
        if os.path.exists(dest):
            return
        q = f'[out:json][timeout:300];\n{sel}{box};\nout center tags;\n'
        for _ in range(6):
            r = subprocess.run(['curl', '-s', '-A', 'INFORM-Tanzania/1.0', '--data-urlencode', f'data={q}', 'https://overpass-api.de/api/interpreter', '-o', dest, '-w', '%{http_code}', '--max-time', '330'], capture_output=True, text=True)
            try:
                d = json.load(open(dest))
                if r.stdout == '200' and not d.get('remark'):
                    return
            except ValueError:
                pass
            os.remove(dest); time.sleep(30)
        raise SystemExit(f'Overpass failed for {sel} {box}')
    for k, sel in QUERIES.items():
        get(sel, BBOX, os.path.join(OSM, f'{k}.json'))
    for k, sel in HEAVY.items():
        for qb in QUARTERS:
            get(sel, qb, os.path.join(OSM, f"{k}_{'_'.join(str(x).replace('.', '_') for x in qb)}.json"))


if '--fetch' in sys.argv:
    fetch()
cj = json.load(open(ROOT / 'src/data/tanzania-councils.json'))
councils = gpd.GeoDataFrame.from_features(cj['features'], crs='EPSG:4326')[['code', 'geometry']]

FUEL_CONTENT = re.compile(r'oil|fuel|petrol|diesel|gas|lpg|kerosene|jet|crude|bitumen|chemical', re.I)
HAZ_INDUSTRIAL = re.compile(r'^(oil|gas|fuel|refinery|petroleum|wellsite|chemical|chemicals|cement|asphalt|steelmaking|steel|metal_processing|smelter|mine|mining|scrap_yard|tannery|distillery|brewery|fertiliser|fertilizer|explosives|paint|plastic|plastics|battery|depot|oil_depot|fuel_depot|gas_storage|power|waste|recycling|wastewater|factory)$', re.I)
THERMAL = re.compile(r'gas|oil|diesel|coal|biomass|waste|biogas|hfo|fossil', re.I)
MINERAL = re.compile(r'gold|copper|coal|uranium|nickel|graphite|diamond|tanzanite|mineral|ore', re.I)

def elements(name):
    out = []
    for f in sorted(glob.glob(os.path.join(OSM, name + '.json')) + glob.glob(os.path.join(OSM, name + '_*.json'))):
        try:
            d = json.load(open(f))
        except ValueError:
            continue  # an error page saved by a failed request
        if not isinstance(d, dict) or d.get('remark'): continue
        out += d.get('elements', [])
    return out

def lonlat(e):
    if 'lat' in e: return e['lon'], e['lat']
    c = e.get('center');
    return (c['lon'], c['lat']) if c else (None, None)

rows, seen = [], set()
def keep(e, cls, kind, label):
    k = (e['type'], e['id'])
    if k in seen: return
    lon, lat = lonlat(e)
    if lon is None: return
    seen.add(k)
    t = e.get('tags', {})
    rows.append({'osm': f"{e['type']}/{e['id']}", 'lon': lon, 'lat': lat, 'class': cls, 'kind': kind, 'name': t.get('name', ''), 'label': label})

for e in elements('fuel'):
    keep(e, 'fuel', 'fuel station', e.get('tags', {}).get('brand', ''))
for e in elements('gas_shop'):
    keep(e, 'fuel', 'gas (LPG) shop', '')
tanks = []
for e in elements('storage_tank'):
    t = e.get('tags', {})
    content = t.get('content', '') + ' ' + t.get('substance', '') + ' ' + t.get('name', '') + ' ' + t.get('operator', '')
    if re.search(r'water', content, re.I): continue
    lon, lat = lonlat(e)
    if lon is None: continue
    tanks.append((e, bool(FUEL_CONTENT.search(content))))
for e in elements('power_plant'):
    t = e.get('tags', {})
    src = ' '.join(t.get(k, '') for k in ('plant:source', 'generator:source', 'plant:method', 'name', 'operator'))
    if re.search(r'solar|hydro|wind|photovoltaic', src, re.I) and not THERMAL.search(t.get('plant:source', '')): continue
    if THERMAL.search(src) or re.search(r'thermal|kinyerezi|ubungo|songas|symbion|iptl|tegeta', src, re.I):
        keep(e, 'energy', 'thermal power plant', t.get('plant:source', ''))
for e in elements('quarry'):
    t = e.get('tags', {})
    if MINERAL.search(' '.join(t.get(k, '') for k in ('resource', 'name', 'product', 'operator'))):
        keep(e, 'mining', 'open-pit mine', t.get('resource', ''))
for e in elements('mine'):
    keep(e, 'mining', 'mine shaft or adit', '')
for e in elements('landfill'):
    keep(e, 'waste', 'landfill or dumpsite', '')
for e in elements('wastewater'):
    keep(e, 'waste', 'wastewater treatment', '')
# works: OpenStreetMap maps tens of thousands of grain mills as works (product=food); they and other
# workshops that handle no hazardous material (carpentry, furniture, tea, coffee, stores) are left out
NON_HAZ_WORKS = re.compile(r'food|maize|flour|grain|\bmill|milling|grind|mashine|machine|\brice|sunflower|coffee|\bcoff\b|\btea\b|avocado|coconut|juice|bakery|bread|\bsalt|carpent|furniture|feniture|funiture|timber|wood|shoe|tailor|godown|\bstore|charcoal|decoder|slum|towel|linen|garment|brick|\btile|sisal|cotton gin|ginnery|cashew', re.I)
for e in elements('works'):
    t = e.get('tags', {})
    if NON_HAZ_WORKS.search(' '.join(t.get(k, '') for k in ('product', 'name', 'operator', 'industrial'))):
        continue
    keep(e, 'industrial', 'factory (works)', t.get('product', ''))
for e in elements('industrial'):
    t = e.get('tags', {})
    v = t.get('industrial', '')
    # a depot or store counts only when it holds fuel or gas (bus, container and grain depots do not)
    if v in ('depot', 'storage') and not FUEL_CONTENT.search(' '.join(t.get(k, '') for k in ('name', 'operator', 'product', 'content', 'substance'))):
        continue
    if HAZ_INDUSTRIAL.match(v) or v == 'storage':
        cls = 'fuel' if re.match(r'oil|gas|fuel|refinery|petroleum|wellsite|depot|storage|oil_depot|fuel_depot|gas_storage', v, re.I) else 'mining' if re.match(r'mine|mining', v, re.I) else 'waste' if re.match(r'waste|recycling|wastewater', v, re.I) else 'energy' if v == 'power' else 'industrial'
        keep(e, cls, f'industrial={v}', '')
for e in elements('landuse_industrial'):
    keep(e, 'industrial', 'industrial area', e.get('tags', {}).get('industrial', ''))
# storage tanks: fuel-tagged tanks, and untagged tanks in clusters of four or more within 250 m (tank farms)
tg = gpd.GeoDataFrame({'fuel': [f for _, f in tanks], 'e': [e for e, _ in tanks]}, geometry=[Point(*lonlat(e)) for e, _ in tanks], crs='EPSG:4326').to_crs('EPSG:32737')
nb = gpd.sjoin(tg, gpd.GeoDataFrame(geometry=tg.buffer(250), crs=tg.crs), predicate='within')
counts = nb.groupby(nb.index).size()
for i, r in tg.iterrows():
    if r['fuel'] or counts.get(i, 0) >= 4:
        keep(r['e'], 'fuel', 'storage tank (fuel or tank farm)', '')

pts = gpd.GeoDataFrame(rows, geometry=[Point(r['lon'], r['lat']) for r in rows], crs='EPSG:4326')
j = gpd.sjoin(pts, councils, predicate='within', how='inner')
j = j.drop(columns=['geometry', 'index_right'])
j.to_csv(ROOT / 'data-source/benchmark_2026/osm_hazmat_features.csv', index=False)
print('kept in Tanzania:', len(j), 'of', len(rows))
print(collections.Counter(j['kind']).most_common())
