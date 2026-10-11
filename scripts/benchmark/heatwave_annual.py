#!/usr/bin/env python3
"""Heatwave days per year and council, 1991-2024, for the explorer's trend panel: the Benchmark 2026 heatwave
definition (scripts/benchmark/heatwave_days.py) year by year. A heatwave day is a day in a run of three or more
days above the calendar-day 90th percentile of 1991-2020 (15-day window) of ERA5-Land daily maximum temperature,
averaged over the council (scripts/benchmark/gee_tmax_daily.py writes the daily files).
Usage: python3 scripts/benchmark/heatwave_annual.py TMAX_DIR   (the directory of tmax_<year>.csv)
Writes data-source/trends/heatwave_annual_councils.csv (code, year, hw_days, tmax_mean_c)."""
import csv, glob, pathlib, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
files = sorted(glob.glob(f'{sys.argv[1]}/tmax_*.csv'))
dates, rows, codes = [], [], None
for f in files:
    r = list(csv.reader(open(f)))
    codes = codes or r[0][1:]
    for line in r[1:]:
        dates.append(line[0]); rows.append([float(x) if x else np.nan for x in line[1:]])
T = np.array(rows)
d64 = np.array(dates, dtype='datetime64[D]')
years = d64.astype('datetime64[Y]').astype(int) + 1970
doy = (d64 - d64.astype('datetime64[Y]')).astype(int)
base = (years >= 1991) & (years <= 2020)
thr = np.full((366, T.shape[1]), np.nan)
for d in range(366):
    win = np.isin(doy, [(d + off) % 366 for off in range(-7, 8)])
    thr[d] = np.nanpercentile(T[win & base], 90, axis=0)
above = T > thr[doy]
hw = np.zeros_like(above)
for j in range(T.shape[1]):
    run = 0
    a = above[:, j]
    for i in range(len(a)):
        if a[i]:
            run += 1
        else:
            if run >= 3: hw[i - run:i, j] = True
            run = 0
    if run >= 3: hw[len(a) - run:, j] = True
out = []
for j, c in enumerate(codes):
    for y in range(years.min(), years.max() + 1):
        sel = years == y
        out.append({'code': c, 'year': int(y), 'hw_days': int(hw[sel, j].sum()), 'tmax_mean_c': round(float(np.nanmean(T[sel, j])), 2)})
dest = ROOT / 'data-source/trends/heatwave_annual_councils.csv'
with open(dest, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['code', 'year', 'hw_days', 'tmax_mean_c']); w.writeheader(); w.writerows(out)
print(f'{dest.name}: {len(codes)} councils x {years.max() - years.min() + 1} years')
