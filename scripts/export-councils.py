#!/usr/bin/env python3
"""
export-councils.py — reconcile our 170 INFORM units to the REAL 195 councils (LGAs) from the
NBS 2022 PHC geodatabase (PO-RALG/NBS authoritative). Exports the 195 council boundaries +
a reconciliation map. 167 councils match our data by (Swahili-stripped) name; the 28 new/split
councils are spatially assigned to the parent district that DOES have data (real, flagged — never
fabricated). Council-specific data can replace the inherited values later.

out: src/data/tanzania-councils.json   (195 simplified polygons; props: code,name,dist,reg,src,isNew)
     data-source/council_reconciliation.csv
"""
import warnings, json, re
from pathlib import Path
warnings.filterwarnings("ignore")
import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent
GDB = "/home/kaijage/model/tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb"
n = lambda s: "".join(ch for ch in str(s).lower() if ch.isalnum())
PREF = r"^(halmashauri ya jiji la |halmashauri ya manispaa ya |halmashauri ya manispaa |halmashauri ya mji wa |halmashauri ya mji |halmashauri ya wilaya ya |halmashauri ya wilaya |halmashauri ya |baraza la manispaa |baraza la mji wa |baraza la mji |baraza la wilaya )"
def core(s): return re.sub(PREF, "", str(s).lower()).strip()
def typ(s):
    s = str(s).lower()
    return "City" if "jiji" in s else "Municipal" if "manispaa" in s else "Town" if "mji" in s else "District"

councils = gpd.read_file(GDB, layer="Councils").to_crs(4326)
districts = gpd.read_file(GDB, layer="Districts").to_crs(4326)

# our data unit names
data = json.load(open(ROOT / "src/data/tanzania-inform-risk.json"))["subnational"]["adm2"]
ours = {n(u["admin"]["adm2Name"]): u["admin"]["adm2Name"] for u in data}
# our data joined to the 150 district polygons (for spatial inheritance of new councils)
gj = json.load(open(ROOT / "src/data/tanzania-districts.json"))
dist_to_data = {}  # normalized district-polygon name -> our data unit (if it has data)
for f in gj["features"]:
    dn = n(f["properties"]["dist_name"])
    if dn in ours: dist_to_data[dn] = ours[dn]

def match(cn):
    k = n(core(cn)); t = typ(cn)
    if t in ("City", "Municipal") and (k + "urban") in ours: return ours[k + "urban"]
    if k in ours: return ours[k]
    if (k + "urban") in ours: return ours[k + "urban"]
    return None

councils["centroid"] = councils.geometry.centroid
rows = [["counc_code", "council_name", "type", "district", "region", "data_unit", "is_new"]]
feats = []
new_centroids = []
for _, c in councils.iterrows():
    disp = f"{core(c['counc_name']).title()} {typ(c['counc_name'])}"
    src = match(c["counc_name"])
    is_new = src is None
    if is_new:
        new_centroids.append((c.name, c["centroid"]))
    feats.append({"_idx": c.name, "code": str(c.get("counc_code")), "name": disp, "core": core(c["counc_name"]),
                  "dist": c["dist_name"], "reg": c["reg_name"], "src": src, "isNew": is_new})

# spatially assign each NEW council to the parent district polygon that has data
if new_centroids:
    pts = gpd.GeoDataFrame(geometry=[g for _, g in new_centroids], crs=4326)
    pts["_ci"] = [i for i, _ in new_centroids]
    joined = gpd.sjoin(pts, districts[["dist_name", "geometry"]], how="left", predicate="within")
    parent_by_ci = {r["_ci"]: r["dist_name"] for _, r in joined.iterrows()}
    for fe in feats:
        if fe["isNew"]:
            pd_name = parent_by_ci.get(fe["_idx"])
            fe["src"] = dist_to_data.get(n(pd_name)) if pd_name else None
            fe["parent"] = pd_name

# explicit real parents for the few split councils whose own district isn't in our 170 data
FALLBACK = {"malinyi": "Ulanga", "kibiti": "Rufiji", "kigamboni": "Temeke", "ubungo": "Kinondoni",
            "tanganyika": "Mpanda", "magharibia": "Magharibi", "magharibib": "Magharibi"}
for fe in feats:
    if not fe.get("src"):
        p = FALLBACK.get(n(fe["core"]))
        if p and n(p) in ours: fe["src"] = ours[n(p)]; fe["parent"] = p

# simplify geometry + build geojson
councils["geom_s"] = councils.geometry.simplify(0.01, preserve_topology=True)
out_features = []
for fe in feats:
    geom = councils.loc[fe["_idx"], "geom_s"]
    out_features.append({"type": "Feature",
        "properties": {k: fe[k] for k in ("code", "name", "dist", "reg", "src", "isNew") if k in fe} | ({"parent": fe.get("parent")} if fe.get("parent") else {}),
        "geometry": json.loads(gpd.GeoSeries([geom]).to_json())["features"][0]["geometry"]})
    rows.append([fe["code"], fe["name"], typ_str := fe["name"].split()[-1], fe["dist"], fe["reg"], fe["src"] or "", "yes" if fe["isNew"] else ""])

json.dump({"type": "FeatureCollection", "features": out_features}, open(ROOT / "src/data/tanzania-councils.json", "w"))
open(ROOT / "data-source/council_reconciliation.csv", "w").write("\n".join(",".join(f'"{c}"' if "," in str(c) else str(c) for c in r) for r in rows) + "\n")
have = sum(1 for fe in feats if fe["src"]); new = sum(1 for fe in feats if fe["isNew"])
print(f"195 councils exported. with data unit: {have}/195 | new/split councils: {new} (spatially assigned to parent)")
print("size:", (ROOT / "src/data/tanzania-councils.json").stat().st_size // 1024, "KB")
