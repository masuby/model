#!/usr/bin/env python3
"""
compute-heavy-rain.py — per-district heavy-rainfall hazard from CHIRPS DAILY rainfall
(2015–2024). For each district the district-MEAN daily rainfall is computed; days
above 50 mm (heavy) and 100 mm (very heavy) are counted, then ÷ years -> mean annual
event counts. heavy_rain_index (0–10) = percentile rank of (count>50 + 2×count>100).

Source preference:
  1. national CHIRPS v3 daily union (.cache/chirps_daily/...), once the download lands
  2. else on-disk CHIRPS daily climatology (tanzania_climate_clip/CHIRPS_CLIMATOLOGY,
     global v2.0 days_p05 monthly files) windowed to Tanzania — used NOW.
out: data-source/chirps_heavy_rain_events.csv
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np, pandas as pd, xarray as xr
from affine import Affine
from rasterio.features import rasterize
from shapely.geometry import shape
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
V3_UNION = ROOT / ".cache/chirps_daily/chirps_v3_daily_TZ_2015_2024.nc"
CLIM_DIR = Path("/home/kaijage/tanzania_climate_clip/CHIRPS_CLIMATOLOGY")
GEO = ROOT / "src/data/tanzania-districts.json"
OUT = ROOT / "data-source/chirps_heavy_rain_events.csv"
YEARS = range(2015, 2025)
TZ = dict(lat=slice(-12.0, 0.0), lon=slice(29.0, 41.0))
HEAVY, VHEAVY = 50.0, 100.0

feats = json.load(open(GEO))["features"]
geoms = [shape(f["geometry"]) for f in feats]
names = [f["properties"]["dist_name"] for f in feats]
regs = [f["properties"]["reg_name"] for f in feats]
N = len(geoms); index = np.arange(1, N + 1)

def build_labels(lat, lon):
    """lat,lon 1-D ascending/descending arrays -> (labels, north-up arr-flip flag)."""
    flip = lat[0] < lat[-1]
    la = lat[::-1] if flip else lat
    rlon = abs(lon[1] - lon[0]); rlat = abs(la[0] - la[1])
    tr = Affine.translation(lon.min() - rlon / 2, la.max() + rlat / 2) * Affine.scale(rlon, -rlat)
    lab = rasterize([(g, i + 1) for i, g in enumerate(geoms)], out_shape=(len(la), len(lon)),
                    transform=tr, fill=0, dtype="int32")
    return lab, flip

def accumulate(arr, labels, c50, c100):
    """arr: (time, lat, lon) north-up; add per-district >50/>100 day counts."""
    for t in range(arr.shape[0]):
        a = arr[t]; valid = np.isfinite(a)
        s = ndimage.sum(np.where(valid, a, 0.0), labels, index)
        cnt = ndimage.sum(valid.astype(np.float32), labels, index)
        dm = np.where(cnt > 0, s / cnt, np.nan)
        c50 += np.where(dm > HEAVY, 1, 0); c100 += np.where(dm > VHEAVY, 1, 0)

c50 = np.zeros(N); c100 = np.zeros(N); ndays = 0; labels = None
if V3_UNION.exists():
    src = "CHIRPS v3 daily (national download)"
    ds = xr.open_dataset(V3_UNION); var = "precipitation" if "precipitation" in ds.data_vars else list(ds.data_vars)[0]
    lat = ds["latitude"].values; lon = ds["longitude"].values
    labels, flip = build_labels(lat, lon)
    arr = ds[var].values; arr = arr[:, ::-1, :] if flip else arr
    accumulate(arr, labels, c50, c100); ndays = arr.shape[0]
    nyears = pd.to_datetime(ds["time"].values).year.nunique()
else:
    src = "CHIRPS v2.0 daily climatology (on-disk), windowed to TZ"
    nyears = 0
    for y in YEARS:
        for m in range(1, 13):
            fp = CLIM_DIR / f"chirps-v2.0.{y}.{m:02d}.days_p05.nc"
            if not fp.exists():
                continue
            ds = xr.open_dataset(fp); var = "precip" if "precip" in ds.data_vars else list(ds.data_vars)[0]
            la = ds["latitude"]; lo = ds["longitude"]
            la_sl = TZ["lat"] if float(la[0]) < float(la[-1]) else slice(TZ["lat"].stop, TZ["lat"].start)
            sub = ds[var].sel(latitude=la_sl, longitude=TZ["lon"])
            lat = sub["latitude"].values; lon = sub["longitude"].values
            if labels is None:
                labels, flip = build_labels(lat, lon)
            arr = sub.values; arr = np.where(arr < 0, np.nan, arr)
            arr = arr[:, ::-1, :] if flip else arr
            accumulate(arr, labels, c50, c100); ndays += arr.shape[0]
        nyears += 1

df = pd.DataFrame({"dist_name": names, "reg_name": regs,
                   "heavy_days_yr": (c50 / max(nyears, 1)).round(2),
                   "vheavy_days_yr": (c100 / max(nyears, 1)).round(2)})
blend = df["heavy_days_yr"] + 2 * df["vheavy_days_yr"]   # very-heavy weighted double
lo, hi = blend.min(), blend.max()
df["heavy_rain_index"] = (((blend - lo) / (hi - lo) if hi > lo else blend * 0) * 10).round(2)
df.to_csv(OUT, index=False)
print(f"source: {src}\ndays={ndays} years={nyears} -> wrote {OUT} ({len(df)} districts)")
print(df.sort_values("heavy_rain_index", ascending=False).head(10).to_string(index=False))
