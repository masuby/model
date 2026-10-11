#!/usr/bin/env python3
"""
compute-council-drought-members.py - the drought sub-indicators of the Advancement layer on the 195
COUNCIL polygons (issue ADV-05: SPEI depth and rainfall variability were district figures copied to
their councils). Same method and data as scripts/compute-drought-spi-spei.py, read from the council
climate cube that scripts/compute-council-climate.py extracted (CHIRPS v3 monthly rainfall on each
council polygon and ERA5 2 m temperature at its centroid, 1991-2024):

  rain_cv     interannual coefficient of variation of annual rainfall (std / mean over 34 years)
  spei_depth  mean magnitude of SPEI-12 in drought months (SPEI-12 < -1), Thornthwaite PET from ERA5
  spei_freq   share of months with SPEI-12 < -1 (about stationary by construction; not a basket member)

in:  data-source/_council_climate_cube.npz, src/data/tanzania-councils.json
out: data-source/drought_members_councils.csv  (code, council, region, mean_annual_rain, rain_cv, spei_depth, spei_freq)
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parent.parent
CUBE = ROOT / "data-source/_council_climate_cube.npz"
GEO = ROOT / "src/data/tanzania-councils.json"
OUT = ROOT / "data-source/drought_members_councils.csv"
YEARS = list(range(1991, 2025))

feats = json.load(open(GEO))["features"]
codes = [str(f["properties"]["code"]) for f in feats]
names = [f["properties"]["name"] for f in feats]
regs = [f["properties"]["reg"] for f in feats]
clat = np.array([shape(f["geometry"]).centroid.y for f in feats])
z = np.load(CUBE, allow_pickle=True)
P, T = z["P"], z["T"]
N = len(feats)
assert P.shape == (len(YEARS) * 12, N), P.shape  # the cube's columns follow the council file's feature order

# Thornthwaite PET (same as compute-drought-spi-spei.py)
MID = [15, 45, 74, 105, 135, 162, 198, 228, 258, 288, 318, 344]
DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def pet(Tser, lat):
    Tc = np.clip(np.array([np.nanmean(Tser[mm::12]) for mm in range(12)]), 0, None)
    I = float(np.sum((Tc / 5.0) ** 1.514))
    if I <= 0:
        return np.zeros_like(Tser)
    a = 6.75e-7 * I**3 - 7.71e-5 * I**2 + 1.792e-2 * I + 0.49239
    lr = np.radians(lat)
    K = np.empty(12)
    for mm in range(12):
        dec = 0.4093 * np.sin(2 * np.pi * MID[mm] / 365 - 1.405)
        ws = np.arccos(np.clip(-np.tan(lr) * np.tan(dec), -1, 1))
        K[mm] = (24 / np.pi * ws / 12.0) * (DIM[mm] / 30.0)
    return np.array([16 * K[t % 12] * ((10 * max(Tser[t], 0) / I) ** a) for t in range(len(Tser))])


def spei_depth(series, scale=12):
    acc = pd.Series(series).rolling(scale).sum().values
    out = np.full_like(acc, np.nan, np.float64)
    for mm in range(12):
        idx = np.arange(len(acc))[mm::12]
        sub = acc[idx]
        ok = sub[~np.isnan(sub)]
        if len(ok) < 10:
            continue
        try:
            sh = ok.min() - 1
            c_, lc, sc = stats.fisk.fit(ok - sh)
            cdf = stats.fisk.cdf(sub - sh, c_, loc=lc, scale=sc)
        except Exception:
            mu, sd = np.nanmean(ok), np.nanstd(ok) or 1
            cdf = stats.norm.cdf((sub - mu) / sd)
        out[idx] = stats.norm.ppf(np.clip(cdf, 1e-6, 1 - 1e-6))
    sev = out[out <= -1]
    return (float(-np.nanmean(sev)) if np.isfinite(sev).any() else 0.0), float(np.nanmean(out <= -1))


PA = P.reshape(len(YEARS), 12, N)
ymask = np.isfinite(PA).any(axis=1)
annual = np.where(ymask, np.nansum(PA, axis=1), np.nan)
mean_annual = np.nanmean(annual, axis=0)
ann_cv = np.nanstd(annual, axis=0) / np.where(mean_annual > 0, mean_annual, np.nan)

rows = []
for j in range(N):
    if not np.isfinite(P[:, j]).any() or not np.isfinite(T[:, j]).any():
        rows.append([codes[j], names[j], regs[j], None, None, None, None])
        continue
    depth, freq = spei_depth(P[:, j] - pet(T[:, j], clat[j]))
    rows.append([codes[j], names[j], regs[j], round(float(mean_annual[j]), 1), round(float(ann_cv[j]), 4), round(depth, 4), round(freq, 4)])

df = pd.DataFrame(rows, columns=["code", "council", "region", "mean_annual_rain", "rain_cv", "spei_depth", "spei_freq"])
df.to_csv(OUT, index=False)
ok = df["spei_depth"].notna().sum()
print(f"wrote {OUT.relative_to(ROOT)}: {ok}/{N} councils with values")
print(df.sort_values("spei_depth", ascending=False)[["code", "council", "mean_annual_rain", "rain_cv", "spei_depth"]].head(8).to_string(index=False))
print(df.sort_values("rain_cv", ascending=False)[["code", "council", "rain_cv"]].head(5).to_string(index=False))
