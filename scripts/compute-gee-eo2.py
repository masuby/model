#!/usr/bin/env python3
"""
compute-gee-eo2.py - second GEE batch for the advanced-tool gaps. Per-council zonal means + TZ raster maps.
  HW-DAYS  heatwave hot days  : ERA5-Land daily Tmax > 35C, days/yr, 2015-2023
  ST-WIND  storm max wind     : ERA5-Land daily max 10m wind speed (sqrt(umax^2+vmax^2)), period max, 2015-2023
  LS-SUSC  landslide suscept. : SRTM mean slope (deg) - the dominant susceptibility factor (steep=prone)
  LS-RAIN  landslide trigger  : CHIRPS daily mean-annual max 1-day rainfall (mm), 2015-2023
Each is VALIDATED against TZ geography before integration (no repeat of the S1-flood false-positive).
Outputs: data-source/{heatwave,wind,landslide_slope,rain_trigger}_councils.csv + inform_sheets/satellite_maps/*.tif
"""
import os, csv, io, zipfile, requests, ee, geopandas as gpd
ee.Initialize(project='ee-bonephaceedson')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROD = os.path.join(ROOT, 'inform_sheets/satellite_maps'); os.makedirs(PROD, exist_ok=True)
gdf = gpd.read_file(os.path.join(ROOT, 'src/data/tanzania-councils.json')).to_crs(4326)
gdf['geometry'] = gdf.simplify(0.02, preserve_topology=True)
TZ = ee.Geometry.Rectangle([28.5, -12.2, 41.5, 0.2])

era5 = ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR').filterDate('2015-01-01', '2024-01-01')
hotdays = era5.select('temperature_2m_max').map(lambda im: im.gt(308.15)).sum().divide(9).rename('hotdays')
wind = (era5.map(lambda im: im.select('u_component_of_wind_10m_max')
                .hypot(im.select('v_component_of_wind_10m_max')).rename('w'))
        .max().rename('windmax'))
slope = ee.Terrain.slope(ee.Image('USGS/SRTMGL1_003')).rename('slope')
chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').filterDate('2015-01-01', '2024-01-01').select('precipitation')
years = ee.List.sequence(2015, 2023)
rx1 = ee.ImageCollection(years.map(lambda y: chirps.filterDate(
        ee.Date.fromYMD(y, 1, 1), ee.Date.fromYMD(ee.Number(y).add(1), 1, 1)).max())).mean().rename('rx1day')

stackA = hotdays.addBands(wind).addBands(rx1)   # ~9km/5km
stackB = slope                                   # 30m

rows = {}
for i in range(0, len(gdf), 40):
    batch = gdf.iloc[i:i + 40]
    feats = [ee.Feature(ee.Geometry(r.geometry.__geo_interface__), {'code': r['code'], 'name': r['name']})
             for _, r in batch.iterrows()]
    fc = ee.FeatureCollection(feats)
    a = stackA.reduceRegions(collection=fc, reducer=ee.Reducer.mean(), scale=2000).getInfo()
    b = stackB.reduceRegions(collection=fc, reducer=ee.Reducer.mean(), scale=200).getInfo()
    bmap = {f['properties']['code']: f['properties'].get('mean', f['properties'].get('slope')) for f in b['features']}
    for f in a['features']:
        p = f['properties']; c = p['code']
        rows[c] = {'code': c, 'council': p['name'], 'hotdays': p.get('hotdays'),
                   'windmax': p.get('windmax'), 'rx1day': p.get('rx1day'), 'slope': bmap.get(c)}
    print('batch', i, '->', len(rows), flush=True)

def dump(fn, key, nd=3):
    with open(os.path.join(ROOT, 'data-source', fn), 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['code', 'council', key])
        for r in rows.values():
            v = r.get(key); w.writerow([r['code'], r['council'], round(v, nd) if isinstance(v, (int, float)) else ''])
dump('heatwave_councils.csv', 'hotdays'); dump('wind_councils.csv', 'windmax')
dump('landslide_slope_councils.csv', 'slope'); dump('rain_trigger_councils.csv', 'rx1day')

def top(key, n=8, rev=True):
    v = sorted([(r['council'], r[key]) for r in rows.values() if isinstance(r.get(key), (int, float))],
               key=lambda x: -x[1] if rev else x[1])
    return [(c[:20], round(x, 2)) for c, x in v[:n]]
print('VALIDATE heatwave hot-days TOP (expect hot lowlands central/west/coast):', top('hotdays'), flush=True)
print('VALIDATE max-wind TOP (expect coastal/open highland):', top('windmax'), flush=True)
print('VALIDATE slope TOP (expect Kilimanjaro/Uluguru/Rungwe/Usambara highlands):', top('slope'), flush=True)
print('VALIDATE rx1day TOP (expect wet coast/highlands):', top('rx1day'), flush=True)

for name, im, scale in [('heatwave_hotdays', hotdays, 2000), ('wind_max', wind, 2000),
                        ('landslide_slope', slope, 200), ('rain_trigger_rx1day', rx1, 2000)]:
    try:
        url = im.clip(TZ).getDownloadURL({'scale': scale, 'region': TZ, 'format': 'GEO_TIFF'})
        data = requests.get(url, timeout=300).content
        out = os.path.join(PROD, name + '.tif')
        if data[:2] == b'PK':
            z = zipfile.ZipFile(io.BytesIO(data)); open(out, 'wb').write(z.read([n for n in z.namelist() if n.endswith('.tif')][0]))
        else:
            open(out, 'wb').write(data)
        print('product saved:', name, os.path.getsize(out), flush=True)
    except Exception as e:
        print('product FAILED', name, str(e)[:120], flush=True)
print('DONE')
