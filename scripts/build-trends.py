#!/usr/bin/env python3
"""Climate trends per area for the explorer's trend panel: heatwave days a year (1991-2024, the Benchmark 2026
definition; scripts/benchmark/heatwave_annual.py) and annual rainfall with heavy-rain days (1981-2025, CHIRPS;
scripts/benchmark/gee_rain_annual.py), for the 195 councils, the 31 regions and Tanzania. A region's and the
country's series are the land-area-weighted means of their councils' series.
Writes src/data/tanzania-council-trends.json (loaded by the explorer only when an area's trends are shown).
Usage: python3 scripts/build-trends.py"""
import collections, csv, datetime as dt, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
TR = ROOT / 'data-source' / 'trends'
land = {r['code']: float(r['land_km2']) for r in csv.DictReader(open(ROOT / 'data-source/benchmark_2026/council_land_area.csv'))}
index = json.load(open(ROOT / 'src/data/tanzania-councils-index.json'))
region_of = {c['code']: 'R-' + re.sub(r'[^a-z0-9]', '', c['reg'].lower()) for c in index}

def series(path: pathlib.Path, field: str, digits: int, last: int) -> dict | None:
    if not path.exists():
        return None
    by: dict[str, dict[int, float]] = collections.defaultdict(dict)
    for r in csv.DictReader(open(path)):
        by[r['code']][int(r['year'])] = float(r[field])
    years = sorted({y for v in by.values() for y in v})
    if not years or years[-1] < last:
        return None  # the download is not finished
    complete = [c for c in by if all(y in by[c] for y in years)]
    if len(complete) < len(index):
        return None  # the download is not finished
    vals = {c: [round(by[c][y], digits) for y in years] for c in sorted(complete)}
    groups = collections.defaultdict(list)
    for c in complete:
        groups[region_of[c]].append(c)
        groups['TZ'].append(c)
    for g, cs in groups.items():
        w = sum(land[c] for c in cs)
        vals[g] = [round(sum(by[c][y] * land[c] for c in cs) / w, digits) for y in years]
    return {'years': [years[0], years[-1]], 'values': vals}

out = {'built': dt.date.today().isoformat(),
       'heat': series(TR / 'heatwave_annual_councils.csv', 'hw_days', 1, 2024),
       'rain': series(TR / 'rain_annual_councils.csv', 'rain_mm', 0, 2025),
       'heavy': series(TR / 'rain_annual_councils.csv', 'heavy_days', 1, 2025),
       'sources': {'heat': 'ERA5-Land daily maximum temperature (ECMWF, Earth Engine); heatwave days: runs of 3 or more days above the calendar-day 90th percentile of 1991-2020',
                   'rain': 'CHIRPS v2.0 daily rainfall (UCSB Climate Hazards Center, Earth Engine), summed by year; heavy-rain days: 50 mm or more'}}
dest = ROOT / 'src/data/tanzania-council-trends.json'
dest.write_text(json.dumps(out, separators=(',', ':')) + '\n')
print(dest.name, {k: (v['years'] if isinstance(v, dict) and 'years' in v else v) for k, v in out.items() if k in ('heat', 'rain', 'heavy')}, f'{dest.stat().st_size // 1024} KB')
