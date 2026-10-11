#!/usr/bin/env python3
"""
compute-council-earthquake.py - the historical-seismicity sub-indicator of the Advancement layer on the
195 COUNCIL polygons (issue ADV-05: previously a district figure copied to its councils). Same catalogue
and method as scripts/compute-earthquake.py: USGS FDSN export, M >= 4.5, 1960-2024, Tanzania bounding
box; for each council centroid the number of events within 50 km and the maximum "felt" intensity
(1.5*M - 1.5*log10(R + 15), a simple attenuation).

in:  data-source/usgs_earthquakes_tz.csv, src/data/tanzania-councils.json
out: data-source/earthquake_councils.csv  (code, council, region, max_felt, n_events_50km)
"""
from __future__ import annotations
import csv
import json
import math
from pathlib import Path
import numpy as np
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parent.parent
GEO = ROOT / "src/data/tanzania-councils.json"
EQ = ROOT / "data-source/usgs_earthquakes_tz.csv"
OUT = ROOT / "data-source/earthquake_councils.csv"

quakes = []
with open(EQ) as f:
    for row in csv.DictReader(f):
        try:
            quakes.append((float(row["latitude"]), float(row["longitude"]), float(row["mag"])))
        except (ValueError, KeyError):
            continue
feats = json.load(open(GEO))["features"]


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


rows = []
for f in feats:
    c = shape(f["geometry"]).centroid
    best, n50 = 0.0, 0
    for qlat, qlon, mag in quakes:
        R = haversine(c.y, c.x, qlat, qlon)
        if R < 50:
            n50 += 1
        felt = 1.5 * mag - 1.5 * math.log10(R + 15.0)
        if felt > best:
            best = felt
    rows.append([f["properties"]["code"], f["properties"]["name"], f["properties"]["reg"], round(best, 3), n50])

with open(OUT, "w", newline="") as out:
    w = csv.writer(out)
    w.writerow(["code", "council", "region", "max_felt", "n_events_50km"])
    w.writerows(rows)
arr = np.array([r[4] for r in rows])
print(f"earthquakes M>=4.5: {len(quakes)}; wrote {OUT.relative_to(ROOT)}: {len(rows)} councils; events within 50 km: max {arr.max()}, councils with any {int((arr > 0).sum())}")
