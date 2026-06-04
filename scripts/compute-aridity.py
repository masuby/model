#!/usr/bin/env python3
"""
compute-aridity.py - AUTHENTIC aridity index (P/PET, UNEP) per council from on-disk EO:
  P   = CHIRPS v3 monthly precipitation (0.05deg), 1991-2020 climatology
  PET = Thornthwaite (1948) potential evapotranspiration from ERA5 t2m monthly (1991-2020 climatology),
        with latitude daylight correction.
Aridity = annual_P / annual_PET. Lower = drier (Decrease-Risk in the advanced spec, range [0,0.65]).
Output: data-source/aridity_councils.csv  ->  fills HA.NAT.DR-ARID in the advanced benchmark.
"""
import os, glob, json
import numpy as np, rasterio
from rasterio.features import geometry_mask
import geopandas as gpd, xarray as xr

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = '/home/kaijage/model/regCM5/data/chirps_v3'
T2M = '/home/kaijage/model/regCM5/data/drivers/era5_t2m_monthly_1991-2025.nc'
Y0, Y1 = 1991, 2020

# ---- councils ----
gdf = gpd.read_file(os.path.join(ROOT, 'src/data/tanzania-councils.json'))
gdf = gdf.to_crs(4326)

# ---- CHIRPS monthly climatology over TZ window ----
ref = rasterio.open(sorted(glob.glob(f'{CH}/*.tif'))[0])
# TZ window (lon 28.5..41.5, lat -12.2..0.2)
from rasterio.windows import from_bounds
win = from_bounds(28.5, -12.2, 41.5, 0.2, ref.transform).round_offsets().round_lengths()
wt = ref.window_transform(win)
H = int(round(win.height)); W = int(round(win.width))
psum = np.zeros((12, H, W), float); pcnt = np.zeros(12, int)
for y in range(Y0, Y1 + 1):
    for m in range(1, 13):
        f = f'{CH}/chirps-v3.0.{y}.{m:02d}.tif'
        if not os.path.exists(f):
            continue
        with rasterio.open(f) as r:
            a = r.read(1, window=win, out_shape=(H, W)).astype(float)
        a[a < 0] = np.nan  # CHIRPS nodata = -9999
        psum[m - 1] += np.nan_to_num(a); pcnt[m - 1] += 1
Pclim = np.array([psum[i] / max(pcnt[i], 1) for i in range(12)])  # mm/month per cell

# ---- ERA5 t2m monthly climatology (degC) ----
ds = xr.open_dataset(T2M)
t = ds['t2m']
tdim = [d for d in t.dims if d not in ('latitude', 'longitude')][0]
import pandas as pd
months = pd.to_datetime(ds[tdim].values).month
yrs = pd.to_datetime(ds[tdim].values).year
sel = (yrs >= Y0) & (yrs <= Y1)
Tclim = []
for m in range(1, 13):
    idx = np.where(sel & (months == m))[0]
    Tclim.append(t.isel({tdim: idx}).mean(dim=tdim).values - 273.15)  # degC
Tclim = np.array(Tclim)
tlat = ds['latitude'].values; tlon = ds['longitude'].values

def t_at(lat, lon):
    i = int(np.abs(tlat - lat).argmin()); j = int(np.abs(tlon - lon).argmin())
    return Tclim[:, i, j]

def daylight_factor(lat):
    # Thornthwaite correction: mean monthly daylight hours / 12 * days/30
    days = [31,28,31,30,31,30,31,31,30,31,30,31]
    L = np.deg2rad(lat); fac = []
    for m in range(12):
        J = int(np.mean(np.cumsum([0]+days[:m]) ) ) + 15  # ~mid-month day-of-year
        dec = 0.409 * np.sin(2*np.pi*J/365 - 1.39)
        ws = np.arccos(np.clip(-np.tan(L)*np.tan(dec), -1, 1))
        N = 24/np.pi * ws  # daylight hours
        fac.append((N/12.0) * (days[m]/30.0))
    return np.array(fac)

def thornthwaite_pet(Tmon, lat):
    Tc = np.clip(Tmon, 0, None)
    I = np.sum((Tc/5.0)**1.514)
    if I <= 0: return np.zeros(12)
    a = 6.75e-7*I**3 - 7.71e-5*I**2 + 1.792e-2*I + 0.49239
    pet = 16.0 * (10.0*Tc/I)**a            # mm/month (unadjusted, 12h/30d)
    return pet * daylight_factor(lat)

rows = []
for _, c in gdf.iterrows():
    geom = [c.geometry.__geo_interface__]
    try:
        mask = geometry_mask(geom, out_shape=(H, W), transform=wt, invert=True)
    except Exception:
        continue
    if mask.sum() == 0:  # tiny polygon -> use centroid cell
        cy, cx = c.geometry.centroid.y, c.geometry.centroid.x
        col = int((cx - 28.5)/0.05); row = int((0.2 - cy)/0.05)
        Pmon = Pclim[:, max(0,min(H-1,row)), max(0,min(W-1,col))]
    else:
        Pmon = np.array([np.nanmean(Pclim[m][mask]) for m in range(12)])
    lat = c.geometry.centroid.y; lon = c.geometry.centroid.x
    Tmon = t_at(lat, lon)
    PET = thornthwaite_pet(Tmon, lat)
    annP = float(np.nansum(Pmon)); annPET = float(np.nansum(PET))
    arid = annP/annPET if annPET > 0 else None
    rows.append({'code': c.get('code'), 'council': c.get('name'), 'region': c.get('reg'),
                 'annual_P_mm': round(annP, 1), 'annual_PET_mm': round(annPET, 1),
                 'aridity_index': round(arid, 4) if arid is not None else ''})

import csv
out = os.path.join(ROOT, 'data-source/aridity_councils.csv')
with open(out, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['code','council','region','annual_P_mm','annual_PET_mm','aridity_index'])
    w.writeheader(); w.writerows(rows)
ar = [r['aridity_index'] for r in rows if r['aridity_index'] != '']
print('wrote', out, '| councils:', len(rows))
print('aridity min %.3f max %.3f mean %.3f' % (min(ar), max(ar), sum(ar)/len(ar)))
print('driest 5:', sorted([(r['aridity_index'], r['council']) for r in rows if r['aridity_index']!=''])[:5])
print('wettest 5:', sorted([(r['aridity_index'], r['council']) for r in rows if r['aridity_index']!=''])[-5:])
