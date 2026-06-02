#!/usr/bin/env python3
"""
compute-council-climate.py — REAL council-level (195 NBS-2022 LGAs) climate hazard +
exposure, computed on the actual council polygons so every council (especially the 28
split + the shared-source groups) gets its OWN values instead of inheriting a parent.

Identical methodology to the district scripts (compute-drought-spi-spei / -heatwave /
-heavy-rain / -exposure), just on council polygons:
  • drought_index  = 0.30 aridity + 0.20 variability + 0.15 SPEI-depth + 0.35 season-fail (min-max 0–10)
  • heatwave_index = (0.5 mean-temp + 0.5 hot-quarter), min-max × 6.5
  • heavy_rain_index= (#days>50mm + 2×#days>100mm), min-max 0–10
  • exposure_index  = log min-max of (NBS-2022 council population ÷ council area)

Geometry: src/data/tanzania-councils.json (195, derived from the NBS PHC geodatabase).
Simplification (~0.01°≈1km) is finer than CHIRPS (0.05°) / ERA5 (0.25°), so zonal means
are unaffected. Population: the real NBS-2022 council figures embedded in compute-exposure.py.
Extractions cache to _council_climate_cube.npz so the blend can be re-tuned fast.

out: data-source/council_climate.csv  (counc_code, council, region, drought_index,
     heatwave_index, heavy_rain_index, heavy_days_yr, vheavy_days_yr, pop2022, area_km2,
     density, exposure_index, pop_matched)
"""
from __future__ import annotations
import json, re, warnings
from pathlib import Path
from collections import defaultdict
import numpy as np, pandas as pd
from scipy import stats
warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
CHIRPS_DIR = Path("/home/kaijage/model/regCM5/data/chirps_v3")
ERA5_T2M = Path("/home/kaijage/model/regCM5/data/drivers/era5_t2m_monthly_1991-2025.nc")
V3_DAILY = ROOT / ".cache/chirps_daily/chirps_v3_daily_TZ_2015_2024.nc"
GEO = ROOT / "src/data/tanzania-councils.json"
OUT = ROOT / "data-source/council_climate.csv"
CUBE = ROOT / "data-source/_council_climate_cube.npz"
YEARS = list(range(1991, 2025))
MONTHS = [(y, m) for y in YEARS for m in range(1, 13)]
HEAVY, VHEAVY = 50.0, 100.0

# ---- council polygons + identity --------------------------------------------
feats = json.load(open(GEO))["features"]
from shapely.geometry import shape
geoms = [shape(f["geometry"]) for f in feats]
codes = [str(f["properties"]["code"]) for f in feats]
names = [f["properties"]["name"] for f in feats]
regs = [f["properties"]["reg"] for f in feats]
clat = np.array([g.centroid.y for g in geoms]); clon = np.array([g.centroid.x for g in geoms])
N = len(geoms); print(f"councils: {N}", flush=True)

# ---- real NBS-2022 council populations (imported from compute-exposure.py) ---
import importlib.util
spec = importlib.util.spec_from_file_location("_exp", ROOT / "scripts/compute-exposure.py")
# compute-exposure runs on import (reads district geo) — avoid that; instead read its POP list textually
poptxt = (ROOT / "scripts/compute-exposure.py").read_text()
m = re.search(r"POP\s*=\s*\[(.*?)\n\]", poptxt, re.S)
POP = eval("[" + m.group(1) + "]")  # list of (region, council, population)
print(f"POP entries: {len(POP)}", flush=True)

def norm(s): return "".join(ch for ch in str(s).lower() if ch.isalnum())
TYPE = {"district", "rural", "town", "city", "municipal", "municipality", "council", "halmashauri", "wilaya", "jiji", "manispaa", "mji", "ya", "wa", "la"}
URBAN = {"town", "city", "municipal", "municipality", "urban", "jiji", "manispaa", "mji"}
def core(name): return "".join(t for t in re.split(r"[^a-z0-9]+", str(name).lower()) if t and t not in TYPE)
def urban(name): return any(w in str(name).lower() for w in URBAN)

pop_by_reg = defaultdict(list); reg_total = defaultdict(float)
for r, c, p in POP:
    pop_by_reg[norm(r)].append((core(c), urban(c), p)); reg_total[norm(r)] += p

def match_pop(reg, name):
    cands = pop_by_reg.get(norm(reg), [])
    cc, cu = core(name), urban(name)
    exact = [p for (pc, pu, p) in cands if pc == cc and pu == cu]
    if exact: return exact[0], True
    same = [p for (pc, pu, p) in cands if pc == cc]
    if same: return same[0], True
    sub = [p for (pc, pu, p) in cands if pc and (pc in cc or cc in pc)]
    if sub: return sub[0], True
    return 0.0, False

# ---- extract CHIRPS-monthly (P) + ERA5 (T) + CHIRPS-daily counts, or load cache
if CUBE.exists():
    z = np.load(CUBE, allow_pickle=True)
    P, T, c50, c100, nyears_daily = z["P"], z["T"], z["c50"], z["c100"], int(z["nyears_daily"])
    print(f"loaded council cube P{P.shape}", flush=True)
else:
    import rasterio, xarray as xr
    from rasterio.windows import from_bounds
    from rasterio.features import rasterize
    from scipy import ndimage
    from affine import Affine
    index = np.arange(1, N + 1)
    # CHIRPS monthly
    samp = rasterio.open(CHIRPS_DIR / "chirps-v3.0.2020.01.tif")
    win = from_bounds(29.0, -12.0, 41.0, 0.0, samp.transform).round_offsets().round_lengths()
    wt = samp.window_transform(win); Hh, Ww = int(win.height), int(win.width)
    labels = rasterize([(g, i + 1) for i, g in enumerate(geoms)], out_shape=(Hh, Ww), transform=wt, fill=0, dtype="int32")
    P = np.full((len(MONTHS), N), np.nan, np.float32)
    for t, (y, mo) in enumerate(MONTHS):
        fp = CHIRPS_DIR / f"chirps-v3.0.{y}.{mo:02d}.tif"
        if not fp.exists(): continue
        arr = rasterio.open(fp).read(1, window=win).astype(np.float32); valid = arr >= 0
        s = ndimage.sum(np.where(valid, arr, 0.0), labels, index); c = ndimage.sum(valid.astype(np.float32), labels, index)
        P[t] = np.where(c > 0, s / c, np.nan)
    print("CHIRPS monthly extracted", flush=True)
    # ERA5 t2m at council centroid
    ds = xr.open_dataset(ERA5_T2M); t2m = ds["t2m"]
    for d in ("number", "expver"):
        if d in t2m.dims: t2m = t2m.isel({d: 0})
    tt = pd.to_datetime(ds["valid_time"].values); sel = [i for i, x in enumerate(tt) if 1991 <= x.year <= 2024]
    latv, lonv = ds["latitude"].values, ds["longitude"].values; arrT = t2m.values
    T = np.full((len(MONTHS), N), np.nan, np.float32)
    for j in range(N):
        T[:, j] = arrT[sel, int(np.abs(latv - clat[j]).argmin()), int(np.abs(lonv - clon[j]).argmin())] - 273.15
    print("ERA5 extracted", flush=True)
    # CHIRPS daily >50/>100mm counts
    c50 = np.zeros(N); c100 = np.zeros(N); nyears_daily = 0
    dds = xr.open_dataset(V3_DAILY); var = "precipitation" if "precipitation" in dds.data_vars else list(dds.data_vars)[0]
    lat = dds["latitude"].values; lon = dds["longitude"].values
    flip = lat[0] < lat[-1]; la = lat[::-1] if flip else lat
    rlon = abs(lon[1] - lon[0]); rlat = abs(la[0] - la[1])
    tr = Affine.translation(lon.min() - rlon / 2, la.max() + rlat / 2) * Affine.scale(rlon, -rlat)
    dlab = rasterize([(g, i + 1) for i, g in enumerate(geoms)], out_shape=(len(la), len(lon)), transform=tr, fill=0, dtype="int32")
    darr = dds[var].values; darr = darr[:, ::-1, :] if flip else darr
    for t in range(darr.shape[0]):
        a = darr[t]; valid = np.isfinite(a)
        s = ndimage.sum(np.where(valid, a, 0.0), dlab, index); cnt = ndimage.sum(valid.astype(np.float32), dlab, index)
        dm = np.where(cnt > 0, s / cnt, np.nan)
        c50 += np.where(dm > HEAVY, 1, 0); c100 += np.where(dm > VHEAVY, 1, 0)
    nyears_daily = pd.to_datetime(dds["time"].values).year.nunique()
    print(f"CHIRPS daily extracted ({darr.shape[0]} days, {nyears_daily} yrs)", flush=True)
    np.savez(CUBE, P=P, T=T, c50=c50, c100=c100, nyears_daily=nyears_daily)
    print("cached council cube", flush=True)

# ---- Thornthwaite PET + SPEI depth (identical to district script) -----------
MID = [15, 45, 74, 105, 135, 162, 198, 228, 258, 288, 318, 344]; DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
def pet(Tser, lat):
    Tc = np.clip(np.array([np.nanmean(Tser[mm::12]) for mm in range(12)]), 0, None)
    I = float(np.sum((Tc / 5.0) ** 1.514))
    if I <= 0: return np.zeros_like(Tser)
    a = 6.75e-7 * I**3 - 7.71e-5 * I**2 + 1.792e-2 * I + 0.49239; lr = np.radians(lat); K = np.empty(12)
    for mm in range(12):
        dec = 0.4093 * np.sin(2 * np.pi * MID[mm] / 365 - 1.405); ws = np.arccos(np.clip(-np.tan(lr) * np.tan(dec), -1, 1))
        K[mm] = (24 / np.pi * ws / 12.0) * (DIM[mm] / 30.0)
    return np.array([16 * K[t % 12] * ((10 * max(Tser[t], 0) / I) ** a) for t in range(len(Tser))])
def spei_depth(series, scale=12):
    acc = pd.Series(series).rolling(scale).sum().values; out = np.full_like(acc, np.nan, np.float64)
    for mm in range(12):
        idx = np.arange(len(acc))[mm::12]; sub = acc[idx]; ok = sub[~np.isnan(sub)]
        if len(ok) < 10: continue
        try:
            sh = ok.min() - 1; c_, lc, sc = stats.fisk.fit(ok - sh); cdf = stats.fisk.cdf(sub - sh, c_, loc=lc, scale=sc)
        except Exception:
            mu, sd = np.nanmean(ok), np.nanstd(ok) or 1; cdf = stats.norm.cdf((sub - mu) / sd)
        out[idx] = stats.norm.ppf(np.clip(cdf, 1e-6, 1 - 1e-6))
    sev = out[out <= -1]
    return (float(-np.nanmean(sev)) if np.isfinite(sev).any() else 0.0)

PA = P.reshape(len(YEARS), 12, N)
annual = np.where(np.isfinite(PA).any(axis=1), np.nansum(PA, axis=1), np.nan)
mean_annual = np.nanmean(annual, axis=0); ann_cv = np.nanstd(annual, axis=0) / np.where(mean_annual > 0, mean_annual, np.nan)
season_cv = np.full(N, np.nan); season_fail = np.full(N, np.nan); spei_sev = np.full(N, np.nan)
for j in range(N):
    if np.isnan(P[:, j]).all(): continue
    clim = np.array([np.nanmean(P[mm::12, j]) for mm in range(12)])
    st = max(range(12), key=lambda s: sum(clim[(s + k) % 12] for k in range(4))); smonths = [(st + k) % 12 for k in range(4)]
    seas = PA[:, smonths, j].sum(axis=1); sm = np.nanmean(seas)
    season_cv[j] = float(np.nanstd(seas) / sm) if sm > 0 else np.nan
    season_fail[j] = float(np.nanmean(seas < 0.8 * sm))
    spei_sev[j] = spei_depth(P[:, j] - pet(T[:, j], clat[j]))

def mm(s):
    s = np.asarray(s, float); lo, hi = np.nanmin(s), np.nanmax(s)
    return (s - lo) / (hi - lo) if hi > lo else s * 0
seasonal = 0.5 * mm(season_cv) + 0.5 * mm(season_fail)
drought = (mm(0.30 * mm(-mean_annual) + 0.20 * mm(ann_cv) + 0.15 * mm(spei_sev) + 0.35 * mm(seasonal)) * 10).round(2)

# heatwave
TA = T.reshape(-1, 12, N); clim_t = np.nanmean(TA, axis=0); hot3 = np.sort(clim_t, axis=0)[-3:].mean(axis=0)
mean_t = np.nanmean(T, axis=0); heat = (mm(0.5 * mean_t + 0.5 * hot3) * 6.5).round(2)

# heavy rain
heavy_yr = c50 / max(nyears_daily, 1); vheavy_yr = c100 / max(nyears_daily, 1)
blend = heavy_yr + 2 * vheavy_yr; heavy_rain = (mm(blend) * 10).round(2)

# exposure (council pop / council area, log min-max)
import geopandas as gpd
gdf = gpd.read_file(GEO)
area = (gdf.to_crs(6933).area / 1e6).values  # km², same order as feats
pops = np.zeros(N); matched = np.zeros(N, bool)
for j in range(N):
    p, ok = match_pop(regs[j], names[j]); pops[j] = p; matched[j] = ok
# region fallback by area share for any unmatched
for j in range(N):
    if not matched[j]:
        rt = reg_total.get(norm(regs[j]), 0.0)
        ra = sum(area[k] for k in range(N) if norm(regs[k]) == norm(regs[j]))
        pops[j] = rt * (area[j] / ra) if ra > 0 else 0.0
density = pops / np.where(area > 0, area, np.nan)
ld = np.log10(np.clip(density, 1, None)); exposure = ((ld - np.nanmin(ld)) / (np.nanmax(ld) - np.nanmin(ld)) * 10).round(2)

df = pd.DataFrame({
    "counc_code": codes, "council": names, "region": regs,
    "drought_index": drought, "heatwave_index": heat, "heavy_rain_index": heavy_rain,
    "heavy_days_yr": heavy_yr.round(2), "vheavy_days_yr": vheavy_yr.round(2),
    "pop2022": pops.round().astype(int), "area_km2": area.round(1), "density": density.round(1),
    "exposure_index": exposure, "pop_matched": matched.astype(int),
})
df.to_csv(OUT, index=False)
print(f"\nwrote {OUT}  ({len(df)} councils; pop matched {int(matched.sum())}/{N})")
print("unmatched:", [names[j] for j in range(N) if not matched[j]][:15])
print("\nTop drought councils:"); print(df.sort_values("drought_index", ascending=False)[["council","region","drought_index"]].head(8).to_string(index=False))
print("\nTop exposure councils:"); print(df.sort_values("exposure_index", ascending=False)[["council","region","pop2022","exposure_index"]].head(8).to_string(index=False))
