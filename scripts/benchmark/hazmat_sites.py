#!/usr/bin/env python3
"""Hazardous-material sites by council, for the Benchmark 2026 activation of the template's hazardous-material
indicator (HA.HUM.HMAT): the number of sites that produce, store, process or dispose of hazardous materials per
100 km2 of the council's land.

Sources, each a public register or map:
  * OpenStreetMap installations (osm_hazmat_features.csv, osm_hazmat.py): fuel stations, LPG shops, fuel tanks and
    tank farms, thermal power plants, mines, landfills, wastewater plants, factories and industrial areas;
  * the 2022 Population and Housing Census mapping (NBS/OCGS geodatabase): the small-scale industries layer and
    the hospitals (government and private; referral hospitals flagged by name);
  * the NEMC environmental certificates of July-September 2026 (nemc_certificates_2026.csv,
    nemc_certificates.py) for projects that handle hazardous materials; they carry no coordinates and are added
    to their council.
Points of the mapped sources closer than 100 m are one site (a tank farm, or a factory mapped twice). A site
counts once whatever its size: the measure compares councils, it does not weigh installations.

Usage: python3 scripts/benchmark/hazmat_sites.py   (PHC_GDB sets the geodatabase path)
Writes data-source/benchmark_2026/hazmat_sites_register.csv and hazmat_sites_councils.csv."""
import collections, csv, json, os, pathlib, re
import fiona
import geopandas as gpd
import numpy as np
from scipy.spatial import cKDTree
from shapely.geometry import Point

ROOT = pathlib.Path(__file__).resolve().parents[2]
BM = ROOT / 'data-source' / 'benchmark_2026'
G = os.environ.get('PHC_GDB', str(ROOT.parent / 'tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb'))
cj = json.load(open(ROOT / 'src/data/tanzania-councils.json'))
councils = gpd.GeoDataFrame.from_features(cj['features'], crs='EPSG:4326')[['code', 'geometry']]
norm = lambda s: re.sub(r'\s+', ' ', str(s or '').strip().lower())
by_census_name = {norm(r['census_name']): r['code'] for r in csv.DictReader(open(ROOT / 'data-source/council_registry.csv'))}
land = {r['code']: float(r['land_km2']) for r in csv.DictReader(open(BM / 'council_land_area.csv'))}
REFERRAL = re.compile(r'rufaa|referral|taifa|national|kanda|zonal|muhimbili|bugando|kcmc|kilimanjaro christian|benjamin mkapa|ocean road|mloganzila|mnazi mmoja|jkci|kikwete', re.I)

pts = []  # (source, class, kind, name, lon, lat, council code or None)
for r in csv.DictReader(open(BM / 'osm_hazmat_features.csv')):
    pts.append(('OpenStreetMap', r['class'], r['kind'], r['name'], float(r['lon']), float(r['lat']), r['code']))
with fiona.open(G, layer='Small_Scale_Industries') as src:
    for f in src:
        p = f['properties']
        try:
            lat, lon = float(p['B_LATITUDE']), float(p['B_LONGITUD'])
        except (TypeError, ValueError):
            continue
        pts.append(('NBS census 2022', 'industrial', 'small-scale industry', '', lon, lat, by_census_name.get(norm(p['B_COUNCIL_']))))
with fiona.open(G, layer='Health_Facilities') as src:
    for f in src:
        p = f['properties']
        if p['B0102'] not in ('Gov Hospital', 'Priv Hospital'):
            continue
        try:
            lat, lon = float(p['B0301_LATI']), float(p['B0301_LONG'])
        except (TypeError, ValueError):
            lat = lon = None
        name = str(p['B0102B_NAM'] or '')
        pts.append(('NBS census 2022', 'health', 'referral hospital' if REFERRAL.search(name) else 'hospital', name, lon, lat, by_census_name.get(norm(p['COUNCIL_NAME']))))

df = gpd.GeoDataFrame(pts, columns=['source', 'class', 'kind', 'name', 'lon', 'lat', 'code0'],
                      geometry=[Point(p[4], p[5]) if p[4] is not None else None for p in pts], crs='EPSG:4326')
j = gpd.sjoin(df[df.geometry.notna()], councils, predicate='within', how='left')
j = j[~j.index.duplicated(keep='first')]
df['code'] = j['code'].reindex(df.index)
# a point just outside every polygon (on the shoreline) or without coordinates keeps the council the census gives it
df['code'] = df['code'].fillna(df['code0'])
df = df[df['code'].notna() & (df['code'] != '') & (df['lon'].notna())].copy()
m = df.to_crs('EPSG:32737')
xy = np.c_[m.geometry.x.values, m.geometry.y.values]
parent = list(range(len(xy)))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]
        a = parent[a]
    return a
for a, b in cKDTree(xy).query_pairs(100.0):
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[rb] = ra
m['site'] = [find(i) for i in range(len(xy))]
RANK = {'mining': 0, 'fuel': 1, 'energy': 2, 'waste': 3, 'industrial': 4, 'health': 5}
sites = []
for _, grp in m.groupby('site', sort=True):
    grp = grp.sort_values('class', key=lambda s: s.map(RANK), kind='stable')
    first = grp.iloc[0]
    sites.append({'site': '', 'code': first['code'], 'class': first['class'], 'kind': first['kind'], 'name': next((n for n in grp['name'] if isinstance(n, str) and n), ''),
                  'sources': '+'.join(sorted(set(grp['source']))), 'features': len(grp), 'lon': round(float(first['lon']), 5), 'lat': round(float(first['lat']), 5)})
NEMC_CLASS = {'fuel': 'fuel', 'mining': 'mining', 'chemical': 'industrial', 'heavy': 'industrial', 'waste': 'waste', 'energy': 'energy', 'health': 'health'}
for r in csv.DictReader(open(BM / 'nemc_certificates_2026.csv')):
    if r['class'] and r['code']:
        section = re.sub(r'\s*\(.*$', '', r['section'] or '').strip().lower()
        sites.append({'site': '', 'code': r['code'], 'class': NEMC_CLASS[r['class']], 'kind': f'NEMC certificate: {section}', 'name': f"{r['project']} ({r['owner']}; {r['reg']})",
                      'sources': 'NEMC 2026', 'features': 1, 'lon': '', 'lat': ''})
sites.sort(key=lambda s: (s['code'], RANK[s['class']], s['kind'], s['name']))
for i, s in enumerate(sites):
    s['site'] = f'S{i + 1:05d}'
with open(BM / 'hazmat_sites_register.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(sites[0].keys())); w.writeheader(); w.writerows(sites)
rows = []
for c in json.load(open(ROOT / 'src/data/tanzania-councils-index.json')):
    s = [x for x in sites if x['code'] == c['code']]
    n = collections.Counter(x['class'] for x in s)
    rows.append({'code': c['code'], 'name': c['name'], 'reg': c['reg'], 'land_km2': land[c['code']], 'sites': len(s), 'fuel': n['fuel'], 'industrial': n['industrial'], 'mining': n['mining'],
                 'waste_energy': n['waste'] + n['energy'], 'health': n['health'], 'referral_hospitals': sum(1 for x in s if x['kind'] == 'referral hospital'),
                 'nemc_2026': sum(1 for x in s if x['sources'] == 'NEMC 2026'), 'sites_per_100km2': round(len(s) / land[c['code']] * 100, 4)})
with open(BM / 'hazmat_sites_councils.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(f'hazmat_sites_register.csv: {len(sites)} sites from {len(m)} mapped features and {sum(1 for x in sites if x["sources"] == "NEMC 2026")} NEMC certificates;', dict(collections.Counter(x['class'] for x in sites)))
top = sorted(rows, key=lambda r: -r['sites_per_100km2'])[:6]
print('highest:', ', '.join(f"{r['name']} {r['sites_per_100km2']:.1f}" for r in top), '| councils without a site:', sum(1 for r in rows if r['sites'] == 0))
