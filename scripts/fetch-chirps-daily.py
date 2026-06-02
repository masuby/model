#!/usr/bin/env python3
"""
fetch-chirps-daily.py — download national CHIRPS v3.0 daily precipitation for
Tanzania (2015–2024), bbox-subset, into one consolidated NetCDF used to count
heavy-rain events (>50 mm, >100 mm) per district.

Method mirrors the proven kai_hydro downloader: /vsicurl/ HTTP range reads against
the CHC per-day TIFs (rnl preferred, sat fallback), a per-day .npz cache so re-runs
resume, and a memory-safe preallocated assembly (one day at a time, no giant stack).

  out: <repo>/.cache/chirps_daily/chirps_v3_daily_TZ_2015_2024.nc   (git-ignored)

Run (backgrounded):  python3 scripts/fetch-chirps-daily.py
"""
from __future__ import annotations
import sys, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np
import pandas as pd
import xarray as xr
import rasterio
from rasterio.windows import from_bounds
from rasterio.errors import RasterioIOError

# National Tanzania bbox (west, south, east, north) — matches TZ_BOUNDS lat[-12,0] lon[29,41]
TZ_BBOX = (29.0, -12.0, 41.0, 0.0)
START, END = "2015-01-01", "2024-12-31"
N_WORKERS, DELAY = 4, 0.4

BASE_RNL = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/daily/final/rnl"
BASE_SAT = "https://data.chc.ucsb.edu/products/CHIRPS/v3.0/daily/final/sat"

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT_DIR = ROOT / ".cache" / "chirps_daily"
CACHE_DIR = OUT_DIR / "perday_cache"
OUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)
OUT_NC = OUT_DIR / "chirps_v3_daily_TZ_2015_2024.nc"


def url_for_date(date: pd.Timestamp, product: str) -> str:
    base = BASE_RNL if product == "rnl" else BASE_SAT
    name = f"chirps-v3.0.{product}.{date.year:04d}.{date.month:02d}.{date.day:02d}.tif"
    return f"{base}/{date.year}/{name}"


def read_bbox_window(url: str, bbox=TZ_BBOX, timeout=60):
    west, south, east, north = bbox
    with rasterio.Env(GDAL_HTTP_TIMEOUT=str(timeout), CPL_VSIL_CURL_USE_HEAD="NO",
                      GDAL_HTTP_MAX_RETRY="3", GDAL_HTTP_RETRY_DELAY="2"):
        with rasterio.open(f"/vsicurl/{url}") as src:
            window = from_bounds(west, south, east, north, src.transform)
            data = src.read(1, window=window).astype(np.float32)
            wt = src.window_transform(window)
            rows, cols = data.shape
            x = np.array([wt * (c + 0.5, 0) for c in range(cols)])[:, 0]
            y = np.array([wt * (0, r + 0.5) for r in range(rows)])[:, 1]
    return data, x, y


def cache_path(date: pd.Timestamp) -> Path:
    return CACHE_DIR / f"chirps_v3_{date.year:04d}{date.month:02d}{date.day:02d}.npz"


def fetch_or_load(date: pd.Timestamp):
    p = cache_path(date)
    if p.exists():
        try:
            d = np.load(p, allow_pickle=False)
            return {"date": date, "data": d["data"], "lons": d["lons"], "lats": d["lats"]}
        except Exception:
            pass
    for product in ("rnl", "sat"):
        url = url_for_date(date, product)
        for attempt in range(5):
            try:
                arr, lons, lats = read_bbox_window(url)
                np.savez(p, data=arr, lons=lons, lats=lats, product=np.array(product))
                time.sleep(DELAY)
                return {"date": date, "data": arr, "lons": lons, "lats": lats}
            except RasterioIOError as e:
                if "403" in str(e):
                    time.sleep(min(60, 5 * (attempt + 1)))
                elif attempt == 4:
                    break
                else:
                    time.sleep(2 ** attempt)
            except Exception:
                if attempt == 4:
                    break
                time.sleep(2 ** attempt)
    return None


def main():
    dates = pd.date_range(START, END, freq="D")
    pre = sum(1 for d in dates if cache_path(d).exists())
    print(f"CHIRPS v3 daily — {len(dates)} days {START}..{END}, bbox {TZ_BBOX}", flush=True)
    print(f"  pre-cached: {pre}/{len(dates)}  workers={N_WORKERS} delay={DELAY}s", flush=True)

    # Establish grid from the first available day (probe, then preallocate).
    probe = None
    for d in dates:
        probe = fetch_or_load(d)
        if probe is not None:
            break
    if probe is None:
        raise RuntimeError("Could not fetch any CHIRPS day — check network/URL.")
    nlat, nlon = probe["data"].shape
    lats, lons = probe["lats"], probe["lons"]
    stack = np.full((len(dates), nlat, nlon), np.nan, dtype=np.float32)
    idx = {d: i for i, d in enumerate(dates)}

    ok = fail = done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=N_WORKERS) as pool:
        futs = {pool.submit(fetch_or_load, d): d for d in dates}
        for fut in as_completed(futs):
            d = futs[fut]; res = fut.result(); done += 1
            if res is None or res["data"].shape != (nlat, nlon):
                fail += 1
            else:
                stack[idx[d]] = res["data"]; ok += 1
            if done % 200 == 0:
                el = time.time() - t0; rate = done / max(el, 0.1)
                print(f"  {done}/{len(dates)} ok={ok} fail={fail} "
                      f"rate={rate:.1f}/s eta={(len(dates)-done)/max(rate,1e-3)/60:.1f}min", flush=True)

    stack = np.where(stack >= 0, stack, np.nan)  # clip nodata
    ds = xr.Dataset(
        {"precipitation": (["time", "latitude", "longitude"], stack)},
        coords={"time": pd.DatetimeIndex(dates), "latitude": lats, "longitude": lons},
        attrs={"title": "CHIRPS v3.0 daily precip, Tanzania", "bbox": list(map(float, TZ_BBOX)),
               "source": "UCSB CHC v3.0 daily (rnl/sat), /vsicurl bbox extract", "n_failures": fail},
    )
    ds.to_netcdf(OUT_NC, encoding={"precipitation": {"zlib": True, "complevel": 4}})
    print(f"\nDONE: {OUT_NC}  shape={dict(ds.sizes)}  ok={ok} fail={fail} "
          f"size={OUT_NC.stat().st_size/1e6:.1f}MB  in {(time.time()-t0)/60:.1f}min", flush=True)


if __name__ == "__main__":
    main()
