#!/usr/bin/env python3
"""
compute-gee-eo.py - AUTHENTIC Earth Engine EO computations per council + downloaded raster products:
  NDVI         MODIS MOD13Q1 (250 m) mean greenness, 2001-2020   -> DR-NDVI (vegetation drought stress)
  Soil moisture NASA-USDA SMAP 10 km surface soil moisture, 2015-2022 -> DR-SOIL
  Sentinel-1 flood frequency  COPERNICUS/S1_GRD VV wet-season water fraction minus JRC permanent water
                              2017-2023 -> flood hazard
Outputs: data-source/{ndvi_councils,soil_moisture_councils,flood_s1_councils}.csv (per-council zonal mean)
         data-source/eo_products/{ndvi_mean,soil_ssm_mean,flood_s1_freq}.tif (Tanzania raster products kept)
"""
import os, csv, io, zipfile, requests
import ee, geopandas as gpd

ee.Initialize(project='ee-bonephaceedson')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROD = os.path.join(ROOT, 'data-source/eo_products'); os.makedirs(PROD, exist_ok=True)

# ---- councils (simplified for inline EE FeatureCollection) ----
gdf = gpd.read_file(os.path.join(ROOT, 'src/data/tanzania-councils.json')).to_crs(4326)
gdf['geometry'] = gdf.simplify(0.02, preserve_topology=True)
TZ = ee.Geometry.Rectangle([28.5, -12.2, 41.5, 0.2])

# ---- EO layers ----
ndvi = (ee.ImageCollection('MODIS/061/MOD13Q1').filterDate('2001-01-01', '2021-01-01')
        .select('NDVI').mean().multiply(0.0001).rename('ndvi'))
soil = (ee.ImageCollection('NASA_USDA/HSL/SMAP10KM_soil_moisture').filterDate('2015-04-01', '2022-08-01')
        .select('ssm').mean().rename('ssm'))
# Sentinel-1 wet-season (Nov-May) VV water fraction (VV < -17 dB), minus JRC permanent water
s1 = (ee.ImageCollection('COPERNICUS/S1_GRD')
      .filter(ee.Filter.eq('instrumentMode', 'IW'))
      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
      .select('VV').filterDate('2017-01-01', '2024-01-01')
      .filter(ee.Filter.Or(ee.Filter.calendarRange(11, 12, 'month'),
                           ee.Filter.calendarRange(1, 5, 'month'))))
waterfreq = s1.map(lambda im: im.lt(-17)).mean()
jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence').unmask(0).divide(100)
floodfreq = waterfreq.subtract(jrc).max(0).rename('floodfreq')

stack = ndvi.addBands(soil).addBands(floodfreq)

# ---- per-council zonal means (batched) ----
rows = {}
for i in range(0, len(gdf), 40):
    batch = gdf.iloc[i:i + 40]
    feats = [ee.Feature(ee.Geometry(r.geometry.__geo_interface__),
                        {'code': r['code'], 'name': r['name']}) for _, r in batch.iterrows()]
    res = stack.reduceRegions(collection=ee.FeatureCollection(feats),
                              reducer=ee.Reducer.mean(), scale=500).getInfo()
    for f in res['features']:
        p = f['properties']
        rows[p['code']] = {'code': p['code'], 'council': p['name'],
                           'ndvi': p.get('ndvi'), 'ssm': p.get('ssm'), 'floodfreq': p.get('floodfreq')}
    print('zonal batch', i, '->', len(rows), 'councils', flush=True)

def dump(fname, key, extra_round=4):
    with open(os.path.join(ROOT, 'data-source', fname), 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['code', 'council', key])
        for r in rows.values():
            v = r.get(key)
            w.writerow([r['code'], r['council'], round(v, extra_round) if isinstance(v, (int, float)) else ''])

dump('ndvi_councils.csv', 'ndvi'); dump('soil_moisture_councils.csv', 'ssm'); dump('flood_s1_councils.csv', 'floodfreq')
vals = lambda k: [r[k] for r in rows.values() if isinstance(r.get(k), (int, float))]
for k in ('ndvi', 'ssm', 'floodfreq'):
    v = vals(k); print('%-10s n=%d min=%.4f max=%.4f mean=%.4f' % (k, len(v), min(v), max(v), sum(v)/len(v)), flush=True)

# ---- download raster products (kept on disk) ----
for name, im, scale in [('ndvi_mean', ndvi, 1000), ('soil_ssm_mean', soil, 10000), ('flood_s1_freq', floodfreq, 1000)]:
    try:
        url = im.clip(TZ).getDownloadURL({'scale': scale, 'region': TZ, 'format': 'GEO_TIFF'})
        data = requests.get(url, timeout=300).content
        out = os.path.join(PROD, name + '.tif')
        if data[:2] == b'PK':  # zip
            z = zipfile.ZipFile(io.BytesIO(data)); tif = [n for n in z.namelist() if n.endswith('.tif')][0]
            open(out, 'wb').write(z.read(tif))
        else:
            open(out, 'wb').write(data)
        print('product saved:', out, os.path.getsize(out), 'bytes', flush=True)
    except Exception as e:
        print('product FAILED', name, str(e)[:150], flush=True)
print('DONE')
