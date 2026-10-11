#!/usr/bin/env python3
"""Council land area (km2) for the density indicators of the Benchmark 2026: each council polygon
(src/data/tanzania-councils.json, 2022 PHC boundaries) minus the water bodies (src/data/tanzania-waterbodies.json:
the Indian Ocean and the lakes), measured in an equal-area projection (EPSG:6933).
Writes data-source/benchmark_2026/council_land_area.csv.  Usage: python3 scripts/benchmark/land_area.py"""
import csv, json, pathlib
import geopandas as gpd
from shapely.ops import unary_union

ROOT = pathlib.Path(__file__).resolve().parents[2]
cj = json.load(open(ROOT / 'src/data/tanzania-councils.json'))
g = gpd.GeoDataFrame.from_features(cj['features'], crs='EPSG:4326').to_crs('EPSG:6933')
wj = json.load(open(ROOT / 'src/data/tanzania-waterbodies.json'))
water = unary_union(gpd.GeoDataFrame.from_features(wj['features'], crs='EPSG:4326').to_crs('EPSG:6933').geometry.buffer(0))
rows = []
for _, r in g.iterrows():
    geom = r.geometry.buffer(0)
    rows.append({'code': r['code'], 'name': r['name'], 'reg': r['reg'], 'area_km2': round(geom.area / 1e6, 2), 'land_km2': round(geom.difference(water).area / 1e6, 2)})
out = ROOT / 'data-source/benchmark_2026/council_land_area.csv'
with open(out, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(f'{out.name}: {len(rows)} councils, {round(sum(r["land_km2"] for r in rows)):,} km2 of land')
