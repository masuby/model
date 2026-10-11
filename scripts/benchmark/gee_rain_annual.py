#!/usr/bin/env python3
"""Annual rainfall per council, 1981-2025, for the explorer's trend panel: CHIRPS v2.0 daily (UCSB-CHG/CHIRPS/DAILY,
Earth Engine) summed over each calendar year, then averaged over the council polygon (src/data/tanzania-councils.json),
with the number of days of 50 mm or more. Writes data-source/trends/rain_annual_councils.csv (code, year, rain_mm,
heavy_days). Needs an Earth Engine account: EE_PROJECT=<project> python3 scripts/benchmark/gee_rain_annual.py"""
import csv, json, os, pathlib, time
import ee

ROOT = pathlib.Path(__file__).resolve().parents[2]
ee.Initialize(project=os.environ.get('EE_PROJECT', 'ee-bonephaceedson'))
cj = json.load(open(ROOT / 'src/data/tanzania-councils.json'))
fc = ee.FeatureCollection([ee.Feature(ee.Geometry(f['geometry']), {'code': f['properties']['code']}) for f in cj['features']])
col = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').select('precipitation')
out = ROOT / 'data-source/trends/rain_annual_councils.csv'
done = {}
if out.exists():
    for r in csv.DictReader(open(out)):
        done.setdefault(int(r['year']), []).append(r)
rows = [r for y in done for r in done[y]]
for y in range(1981, 2026):
    if y in done:
        continue
    yc = col.filterDate(f'{y}-01-01', f'{y + 1}-01-01')
    img = yc.sum().rename('rain').addBands(yc.map(lambda i: i.gte(50)).sum().rename('heavy'))
    for attempt in range(4):
        try:
            red = img.reduceRegions(collection=fc, reducer=ee.Reducer.mean(), scale=5566).getInfo()
            break
        except Exception as e:  # transient Earth Engine errors
            print('retry', y, attempt, str(e)[:100]); time.sleep(20)
    else:
        raise SystemExit(f'failed {y}')
    for f in red['features']:
        p = f['properties']
        rows.append({'code': p['code'], 'year': y, 'rain_mm': round(p.get('rain') or 0, 1), 'heavy_days': round(p.get('heavy') or 0, 2)})
    with open(out, 'w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=['code', 'year', 'rain_mm', 'heavy_days']); w.writeheader(); w.writerows(sorted(rows, key=lambda r: (r['code'], int(r['year']))))
    print(y, 'done', flush=True)
