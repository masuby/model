#!/usr/bin/env python3
"""Road traffic crashes per 100 km2 of land, by council (the Benchmark 2026 vehicle-accidents indicator).

Each police region's recorded crashes (NBS and Tanzania Police Force, Crime and Traffic Incidents Statistics,
January-December 2024 and 2025, Table 3.4; mean of the two years) are shared among its councils in proportion
to their 2022 census population and divided by the council's land area. Dar es Salaam's police regions
(Ilala, Kinondoni, Temeke) and Zanzibar's are city-level already; elsewhere the share follows where people
live, so the big cities, where people and traffic are densest, carry the highest crash density.

Inputs (data-source/benchmark_2026/): road_accidents_police_regions.csv, police_regions_councils.csv
(council -> police region), council_pop_2022.json (2022 PHC), council_land_area.csv (land_area.py).
Writes road_crashes_councils.csv.  Usage: python3 scripts/benchmark/road_crashes.py"""
import collections, csv, json, pathlib

BM = pathlib.Path(__file__).resolve().parents[2] / 'data-source' / 'benchmark_2026'
pop = json.load(open(BM / 'council_pop_2022.json'))
land = {r['code']: r for r in csv.DictReader(open(BM / 'council_land_area.csv'))}
police = {r['code']: r['police_region'] for r in csv.DictReader(open(BM / 'police_regions_councils.csv'))}
years = collections.defaultdict(dict)
for r in csv.DictReader(open(BM / 'road_accidents_police_regions.csv')):
    years[r['police_region']][r['year']] = (float(r['accidents']), float(r['deaths']))
region_pop = collections.Counter()
for code, pr in police.items():
    region_pop[pr] += pop[code]
rows = []
for code in sorted(police):
    pr = police[code]
    crashes = sum(v[0] for v in years[pr].values()) / len(years[pr])
    deaths = sum(v[1] for v in years[pr].values()) / len(years[pr])
    share = pop[code] / region_pop[pr]
    km2 = float(land[code]['land_km2'])
    rows.append({'code': code, 'name': land[code]['name'], 'reg': land[code]['reg'], 'police_region': pr,
                 'region_crashes_per_yr': round(crashes, 1), 'region_deaths_per_yr': round(deaths, 1), 'region_pop_2022': region_pop[pr],
                 'pop2022': pop[code], 'crashes_per_yr': round(crashes * share, 2), 'land_km2': km2,
                 'crashes_per_100km2': round(crashes * share / km2 * 100, 4)})
with open(BM / 'road_crashes_councils.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
top = sorted(rows, key=lambda r: -r['crashes_per_100km2'])[:5]
print(f"road_crashes_councils.csv: {len(rows)} councils, {round(sum(r['crashes_per_yr'] for r in rows))} crashes a year; highest " + ', '.join(f"{r['name']} {r['crashes_per_100km2']:.1f}" for r in top))
