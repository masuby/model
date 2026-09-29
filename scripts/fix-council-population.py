"""
fix-council-population.py - replace area-apportioned population ESTIMATES in council_climate.csv with
the authentic NBS 2022 census figures, then recompute density and the exposure index exactly as
compute-council-climate.py does (log10 density, min–max to 0–10 across all 195 councils).

Why: compute-council-climate.py matches councils to populations by name; three councils failed to
match (pop_matched = 0) and fell back to "region total × area share":
    Dar Es Salaam City (Ilala)   1,176,512  → census 1,649,912
    Mwanza City                     58,096  → census   594,834
    Busokelo District               44,290  → census   100,123
That under-counted ~1.07 M people and understated exposure (and so flood H×E) in two major cities.
data-source/population_2022_councils.csv holds the authentic figures for all 195 councils
(sum = 61,741,120 = the official 2022 PHC total).

Run:  python scripts/fix-council-population.py && node scripts/apply-council-hazards.mjs
"""
import csv
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIMATE = ROOT / "data-source" / "council_climate.csv"
CENSUS = ROOT / "data-source" / "population_2022_councils.csv"

# Council names in the boundary file whose census name differs beyond "District"/"Rural" etc.
ALIASES = {
    ("daressalaam", "daressalaam"): "ilala",
    ("mwanza", "mwanza"): "mwanza",
    ("mbeya", "busokelo"): "busekelo",
    ("kigoma", "kigomaujiji"): "kigomamunicipal",
    ("mtwara", "mtwaramikindani"): "mtwaramunicipal",
    ("pwani", "kibaha"): "kibaha",
    ("geita", "halmashuariyawilayayambogwe"): "mbogwe",
}
TYPE = r"\b(district|council|dc|municipality|municipal|city|halmashuari ya wilaya ya|halmashauri ya wilaya ya)\b"


def key(s: str) -> str:
    return re.sub(r"[^a-z]", "", str(s).lower())


def core(name: str) -> str:
    return key(re.sub(TYPE, "", str(name).lower()))


def is_town(name: str) -> bool:
    n = str(name).lower()
    return any(w in n for w in ("town", "city", "municipal", "municipality"))


census_rows = list(csv.DictReader(CENSUS.open(encoding="utf-8")))
census = {}
for r in census_rows:
    census.setdefault(key(r["region"]), []).append((r["council"], int(float(r["pop2022"]))))


def census_pop(region: str, council: str) -> int | None:
    cands = census.get(key(region), [])
    c = core(council)
    alias = ALIASES.get((key(region), c))
    if alias:
        hit = [p for (n, p) in cands if key(n) == alias]
        if hit:
            return hit[0]
    exact = [p for (n, p) in cands if key(n) == key(council)]
    if exact:
        return exact[0]
    # "X District" ↔ "X Rural" / "X" ; "X Town/Municipal" ↔ "X Town/Municipal"
    town = is_town(council)
    same_core = [(n, p) for (n, p) in cands if core(re.sub(r"\b(rural|town)\b", "", n.lower())) == core(re.sub(r"\b(rural|town)\b", "", council.lower()))]
    typed = [p for (n, p) in same_core if is_town(n) == town]
    if len(typed) == 1:
        return typed[0]
    if len(same_core) == 1:
        return same_core[0][1]
    return None


rows = list(csv.DictReader(CLIMATE.open(encoding="utf-8")))
fields = list(rows[0].keys())
changed, unresolved = [], []
for r in rows:
    p = census_pop(r["region"], r["council"])
    if p is None:
        unresolved.append((r["council"], r["region"]))
        continue
    if int(r["pop2022"]) != p:
        changed.append((r["council"], r["region"], int(r["pop2022"]), p))
        r["pop2022"] = str(p)
    r["pop_matched"] = "1"

# Recompute density and exposure exactly as compute-council-climate.py.
dens = []
for r in rows:
    area = float(r["area_km2"])
    d = int(r["pop2022"]) / area if area > 0 else float("nan")
    r["density"] = f"{d:.1f}"
    dens.append(math.log10(max(d, 1.0)))
lo, hi = min(dens), max(dens)
for r, ld in zip(rows, dens):
    r["exposure_index"] = f"{round((ld - lo) / (hi - lo) * 10, 2)}"

with CLIMATE.open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
    w.writeheader()
    w.writerows(rows)

total = sum(int(r["pop2022"]) for r in rows)
print(f"population corrected for {len(changed)} council(s):")
for c in changed:
    print(f"  {c[0]} ({c[1]}): {c[2]:,} -> {c[3]:,}")
print(f"unresolved: {unresolved or 'none'}")
print(f"total population now {total:,} (official 2022 PHC: 61,741,120)")
