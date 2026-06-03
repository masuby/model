#!/usr/bin/env python3
"""
compute-earthquake.py - PHYSICAL earthquake hazard per district from the real USGS catalogue
(M>=4.5, 1960-2024, Tanzania bbox), replacing the earlier rift-proximity overlay.

For each district centroid the "felt" intensity of every catalogued earthquake is estimated with a
simple intensity-attenuation relation (intensity grows with magnitude, decays with distance), and the
MAXIMUM over all events is taken - the worst historical shaking that location has experienced. That
maximum is min-max standardised to 0-10. The western rift (Lake Tanganyika/Rukwa/Kigoma, the M6.8 and
M6.5 events) ranks highest; the 2016 Kagera M5.9 lifts the north-west; the coast/centre stay low.

in:  data-source/usgs_earthquakes_tz.csv (USGS FDSN export), src/data/tanzania-districts.json
out: data-source/earthquake_usgs.csv  (dist_name, reg_name, max_felt, n_events_50km, earthquake_index)
"""
from __future__ import annotations
import json, math, csv
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
GEO = ROOT / "src/data/tanzania-districts.json"
EQ = ROOT / "data-source/usgs_earthquakes_tz.csv"
OUT = ROOT / "data-source/earthquake_usgs.csv"

# catalogue
quakes = []
with open(EQ) as f:
    for row in csv.DictReader(f):
        try:
            quakes.append((float(row["latitude"]), float(row["longitude"]), float(row["mag"])))
        except (ValueError, KeyError):
            continue
Q = np.array(quakes)  # (N,3): lat, lon, mag
print(f"earthquakes M>=4.5: {len(Q)}", flush=True)

from shapely.geometry import shape
feats = json.load(open(GEO))["features"]
names = [f["properties"]["dist_name"] for f in feats]
regs = [f["properties"]["reg_name"] for f in feats]
cent = np.array([[shape(f["geometry"]).centroid.y, shape(f["geometry"]).centroid.x] for f in feats])

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1); dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

# Simple intensity-attenuation: felt = 1.5*M - 1.5*log10(R+15). Max over events; also count near events.
max_felt = np.zeros(len(feats)); n50 = np.zeros(len(feats), int)
for i, (clat, clon) in enumerate(cent):
    best = 0.0
    for qlat, qlon, mag in Q:
        R = haversine(clat, clon, qlat, qlon)
        if R < 50: n50[i] += 1
        felt = 1.5 * mag - 1.5 * math.log10(R + 15.0)
        if felt > best: best = felt
    max_felt[i] = best

lo, hi = max_felt.min(), max_felt.max()
idx = ((max_felt - lo) / (hi - lo) * 10) if hi > lo else max_felt * 0
idx = np.round(idx, 2)

rows = sorted(zip(names, regs, max_felt.round(2), n50, idx), key=lambda r: -r[4])
with open(OUT, "w", newline="") as f:
    w = csv.writer(f); w.writerow(["dist_name", "reg_name", "max_felt", "n_events_50km", "earthquake_index"])
    for r in rows: w.writerow(r)
print(f"wrote {OUT} ({len(rows)} districts)")
print("Top seismic-hazard districts:")
for n, rg, mf, ne, ix in rows[:12]:
    print(f"  {n:18} {rg:14} felt {mf:5}  events<50km {ne:3}  index {ix}")
