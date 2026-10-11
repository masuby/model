#!/usr/bin/env python3
"""
spatial-join-facilities-councils.py - facility counts of the 2022 Population and Housing Census geodatabase
on the 195 COUNCIL polygons, with the facility TYPES filtered (indicator integrity recheck, 10 October 2026).

Why this replaces scripts/spatial-join-facilities.py:
  * the census layer 'Health_Facilities' holds 56,677 points of which 35,289 are accredited drug
    dispensing outlets, 6,393 pharmacies, 2,244 traditional medicine shops and 2,102 laboratories; only
    dispensaries, health centres and hospitals (about 10,650) are health facilities in the sense of the
    access-to-health-care indicator. The earlier join counted every point.
  * the earlier join used the 150 district polygons, so the 32 urban and township workbook units had no
    row and a rural unit carried the facilities of the whole district.

in:  ../tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb (NBS/OCGS),
     src/data/tanzania-councils.json (the 195 council polygons), data-source/council_registry.csv
out: data-source/facilities_by_council.json  (per council: health, education, water, boreholes, and the
     counts by type behind health and education)
     data-source/facilities_by_unit.json      (per workbook unit = the sum of its councils; the Core's
     display metadata, read by scripts/build-core.mjs)
run: python3 scripts/spatial-join-facilities-councils.py [path-to-geodatabase]
"""
from __future__ import annotations
import csv
import json
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent
GDB = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb"
COUNCILS = ROOT / "src/data/tanzania-councils.json"
REGISTRY = ROOT / "data-source/council_registry.csv"
OUT_COUNCIL = ROOT / "data-source/facilities_by_council.json"
OUT_UNIT = ROOT / "data-source/facilities_by_unit.json"

# Facility types that count (census attribute values, verbatim).
HEALTH_TYPES = {
    "Gov Dispensary", "Private Dispensary", "Gov Health Centre/Cottage(PHCC)", "Priv Health Centre", "Gov Hospital", "Priv Hospital",
}
HEALTH_EXCLUDED = {"Accredited Dispensing Outlet (ADO)/OTC", "Pharmacy", "Traditional Medical Shop", "Laboratory"}
EDUCATION_TYPES = {
    "Gov Primary School", "Priv Primary School", "Gov Pre-Primary School", "Priv Pre-Primary School", "Private Nursery School",
    "Gov Seconadry School", "Gov Secondary School", "Priv Secondary School", "Satellite Schools/Centre",
    "Government Primary and Middle Schools", "Gov Special Schools for People with Disability", "Priv Special Schools for People with Disability",
}
EDUCATION_EXCLUDED = {"Government TUTU (Tuimbe na Tucheze) Centre", " ", ""}

councils = gpd.read_file(COUNCILS)
councils = councils.set_crs(4326) if councils.crs is None else councils.to_crs(4326)
assert len(councils) == 195, len(councils)
poly = councils[["code", "geometry"]]

counts: dict[str, dict] = {c: {"health": 0, "education": 0, "water": 0, "boreholes": 0, "healthByType": {}, "educationByType": {}} for c in councils["code"]}


def join(layer: str, type_col: str | None, keep: set[str] | None, excluded: set[str] | None, key: str, by_type_key: str | None):
    pts = gpd.read_file(GDB, layer=layer)
    pts = pts[pts.geometry.notna()].to_crs(4326)
    total = len(pts)
    if type_col:
        types = pts[type_col].astype(str).str.strip()
        unknown = set(types.unique()) - {t.strip() for t in keep} - {t.strip() for t in excluded}
        if unknown:
            raise SystemExit(f"{layer}: unexpected types {sorted(unknown)}; add them to the lists in this script")
        pts = pts[types.isin({t.strip() for t in keep})]
        pts = pts.assign(_type=types[pts.index])
    j = gpd.sjoin(pts[["geometry"] + (["_type"] if type_col else [])], poly, predicate="within", how="inner")
    # A point on a shared boundary can fall in two polygons: keep its first match only.
    j = j[~j.index.duplicated(keep="first")]
    for code, n in j.groupby("code").size().items():
        counts[code][key] = int(n)
    if by_type_key:
        for (code, t), n in j.groupby(["code", "_type"]).size().items():
            counts[code][by_type_key][t] = int(n)
    print(f"{layer}: {total} points, {len(pts)} counted after the type filter, {len(j)} inside a council polygon", file=sys.stderr)


join("Health_Facilities", "B0102", HEALTH_TYPES, HEALTH_EXCLUDED, "health", "healthByType")
join("Education_Facilities", "TYPE", EDUCATION_TYPES, EDUCATION_EXCLUDED, "education", "educationByType")
join("Water_Facilities", None, None, None, "water", None)
join("Boreholes", None, None, None, "boreholes", None)

registry = list(csv.DictReader(open(REGISTRY, newline="")))
names = {r["code"]: (r["name"], r["region"], r["workbook_unit"].strip()) for r in registry}
council_out = {
    "source": "2022 Population and Housing Census geodatabase (NBS/OCGS): health facilities (dispensaries, health centres and hospitals; drug outlets, pharmacies, traditional medicine shops and laboratories excluded), schools (pre-primary to secondary, government and private), water points and boreholes, spatially joined to the 195 council polygons (scripts/spatial-join-facilities-councils.py)",
    "built": date.today().isoformat(),
    "healthTypes": sorted(HEALTH_TYPES),
    "educationTypes": sorted(EDUCATION_TYPES),
    "councils": {c: {"name": names[c][0], "region": names[c][1], **v} for c, v in counts.items()},
}
OUT_COUNCIL.write_text(json.dumps(council_out, indent=1) + "\n")

# The workbook unit is the union of the councils linked to it (two councils for a split or an urban/rural pair).
old = json.loads(OUT_UNIT.read_text())["units"] if OUT_UNIT.exists() else {}
code_of_unit = {v["name"].strip(): k for k, v in old.items()}
unit_counts: dict[str, dict] = defaultdict(lambda: {"health": 0, "education": 0, "water": 0, "boreholes": 0})
for c, v in counts.items():
    u = names[c][2]
    for k in ("health", "education", "water", "boreholes"):
        unit_counts[u][k] += v[k]
units_out = {}
for u, v in unit_counts.items():
    code = code_of_unit.get(u)
    if not code:
        # units the district-based join never had (the 32 urban and township units): key them by their council code
        code = next(c for c, n in names.items() if n[2] == u)
    units_out[code] = {"name": u, **v}
OUT_UNIT.write_text(json.dumps({
    "source": "2022 Population and Housing Census geodatabase (NBS/OCGS): facilities counted on the 195 council polygons with the facility types filtered (scripts/spatial-join-facilities-councils.py) and summed over the councils of each INFORM workbook unit",
    "built": date.today().isoformat(),
    "units": units_out,
}, indent=1) + "\n")
print(f"wrote {OUT_COUNCIL.name} ({len(counts)} councils) and {OUT_UNIT.name} ({len(units_out)} workbook units)", file=sys.stderr)
