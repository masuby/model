#!/usr/bin/env python3
"""
compute-drought-spi-spei.py — per-district drought hazard for INFORM, from CHIRPS v3
monthly rainfall (1991–2024) + ERA5 t2m (SPEI's PET). Same monthly CHIRPS v3 set
validated by regCM5/papers/paper8_year_classification.

Authentic, community-relevant drought hazard (SPI/SPEI *frequency* is ~stationary by
construction, so it is NOT used to rank). The 0–10 drought_index blends:
  • aridity            — low mean annual rainfall (dryland)            0.30
  • annual variability — interannual rainfall CV                       0.20
  • SPEI drought depth — mean magnitude of SPEI-12 during droughts     0.15
  • GROWING-SEASON failure — how often & how variable the main rainy   0.35
    season fails (the crop-failure / food-security driver → IPC/MUCHALI)

Heavy extractions are cached to _drought_cube.npz so the index can be re-tuned fast.
out: data-source/chirps_drought_spi_spei.csv
"""
from __future__ import annotations
import json, warnings
from pathlib import Path
import numpy as np, pandas as pd
from scipy import stats
warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
CHIRPS_DIR = Path("/home/kaijage/model/regCM5/data/chirps_v3")
ERA5_T2M = Path("/home/kaijage/model/regCM5/data/drivers/era5_t2m_monthly_1991-2025.nc")
GEO = ROOT / "src/data/tanzania-districts.json"
OUT = ROOT / "data-source/chirps_drought_spi_spei.csv"
CUBE = OUT.parent / "_drought_cube.npz"
OUT.parent.mkdir(parents=True, exist_ok=True)
YEARS = list(range(1991, 2025))
MONTHS = [(y, m) for y in YEARS for m in range(1, 13)]

# ---- load cached cube, else extract from rasters + ERA5 and cache --------------
if CUBE.exists():
    z = np.load(CUBE, allow_pickle=True)
    P, T = z["P"], z["T"]; names = list(z["names"]); regs = list(z["regs"]); clat = z["clat"]
    N = len(names); print(f"loaded cube P{P.shape}", flush=True)
else:
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.features import rasterize
    from shapely.geometry import shape
    from scipy import ndimage
    import xarray as xr
    feats = json.load(open(GEO))["features"]
    geoms = [shape(f["geometry"]) for f in feats]
    names = [f["properties"]["dist_name"] for f in feats]
    regs = [f["properties"]["reg_name"] for f in feats]
    clat = np.array([g.centroid.y for g in geoms]); clon = np.array([g.centroid.x for g in geoms])
    N = len(geoms)
    samp = rasterio.open(CHIRPS_DIR / "chirps-v3.0.2020.01.tif")
    win = from_bounds(29.0, -12.0, 41.0, 0.0, samp.transform).round_offsets().round_lengths()
    wt = samp.window_transform(win); Hh, Ww = int(win.height), int(win.width)
    labels = rasterize([(g, i + 1) for i, g in enumerate(geoms)], out_shape=(Hh, Ww), transform=wt, fill=0, dtype="int32")
    index = np.arange(1, N + 1)
    P = np.full((len(MONTHS), N), np.nan, np.float32)
    for t, (y, m) in enumerate(MONTHS):
        fp = CHIRPS_DIR / f"chirps-v3.0.{y}.{m:02d}.tif"
        if not fp.exists(): continue
        arr = rasterio.open(fp).read(1, window=win).astype(np.float32); valid = arr >= 0
        s = ndimage.sum(np.where(valid, arr, 0.0), labels, index); c = ndimage.sum(valid.astype(np.float32), labels, index)
        P[t] = np.where(c > 0, s / c, np.nan)
    ds = xr.open_dataset(ERA5_T2M); t2m = ds["t2m"]
    for d in ("number", "expver"):
        if d in t2m.dims: t2m = t2m.isel({d: 0})
    tt = pd.to_datetime(ds["valid_time"].values); sel = [i for i, x in enumerate(tt) if 1991 <= x.year <= 2024]
    latv, lonv = ds["latitude"].values, ds["longitude"].values; arrT = t2m.values
    T = np.full((len(MONTHS), N), np.nan, np.float32)
    for j in range(N):
        T[:, j] = arrT[sel, int(np.abs(latv - clat[j]).argmin()), int(np.abs(lonv - clon[j]).argmin())] - 273.15
    np.savez(CUBE, P=P, T=T, names=np.array(names), regs=np.array(regs), clat=clat)
    print(f"extracted + cached P{P.shape}", flush=True)

# ---- Thornthwaite PET ---------------------------------------------------------
MID = [15, 45, 74, 105, 135, 162, 198, 228, 258, 288, 318, 344]
DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
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
    return (float(-np.nanmean(sev)) if np.isfinite(sev).any() else 0.0), float(np.nanmean(out <= -1))

# ---- per-district metrics -----------------------------------------------------
PA = P.reshape(len(YEARS), 12, N)
ymask = np.isfinite(PA).any(axis=1)
annual = np.where(ymask, np.nansum(PA, axis=1), np.nan)
mean_annual = np.nanmean(annual, axis=0)
ann_cv = np.nanstd(annual, axis=0) / np.where(mean_annual > 0, mean_annual, np.nan)

rows = []
for j in range(N):
    if np.isnan(P[:, j]).all():
        rows.append([names[j], regs[j], np.nan, np.nan, np.nan, np.nan, np.nan, np.nan]); continue
    clim = np.array([np.nanmean(P[mm::12, j]) for mm in range(12)])         # climatological months
    st = max(range(12), key=lambda s: sum(clim[(s + k) % 12] for k in range(4)))
    smonths = [(st + k) % 12 for k in range(4)]                             # main 4-month rainy season
    seas = PA[:, smonths, j].sum(axis=1); sm = np.nanmean(seas)
    seas_cv = float(np.nanstd(seas) / sm) if sm > 0 else np.nan
    fail = float(np.nanmean(seas < 0.8 * sm))                              # yrs below 80% of normal season
    depth, sdf = spei_depth(P[:, j] - pet(T[:, j], clat[j]))
    rows.append([names[j], regs[j], float(mean_annual[j]), float(ann_cv[j]),
                 "-".join("JFMAMJJASOND"[m] for m in smonths), seas_cv, fail, depth])

df = pd.DataFrame(rows, columns=["dist_name", "reg_name", "mean_annual_rain", "rain_cv",
                                 "rainy_season", "season_cv", "season_fail_freq", "spei_severity"])
def mm(s):                                                                 # min-max to 0–1
    s = s.astype(float); lo, hi = np.nanmin(s), np.nanmax(s)
    return (s - lo) / (hi - lo) if hi > lo else s * 0
seasonal = 0.5 * mm(df["season_cv"]) + 0.5 * mm(df["season_fail_freq"])     # crop-failure pressure
score = 0.30 * mm(-df["mean_annual_rain"]) + 0.20 * mm(df["rain_cv"]) + 0.15 * mm(df["spei_severity"]) + 0.35 * mm(seasonal)
df["drought_index"] = (mm(score) * 10).round(2)                            # standardise blend to 0–10
df.round(3).to_csv(OUT, index=False)
print(f"\nwrote {OUT}  ({len(df)} districts)", flush=True)
print(df.sort_values("drought_index", ascending=False)[
      ["dist_name", "reg_name", "mean_annual_rain", "season_fail_freq", "drought_index"]].head(12).to_string(index=False))
