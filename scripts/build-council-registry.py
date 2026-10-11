#!/usr/bin/env python3
"""
build-council-registry.py - the permanent registry of the 195 councils and their link to the 170 units of
the INFORM SADC 2024 workbook.

Why a registry: the council identifiers C001..C195 are the keys of every stored value (approved data,
raw values, audit log, guidance entries, links). They were first assigned in the order of the census file;
this registry freezes them, records the official census codes beside them, and makes every link to a
workbook unit explicit and reasoned, so a future boundary change can never renumber a council silently.

Link rules (census name decides the type; the workbook unit is matched by name, never by position):
  • City / Municipal / Town council  ->  '<name> Urban', '<name> Township Authority' or '<name> Mji'
    in the workbook, else the plain '<name>' unit (urban councils whose workbook unit has no suffix).
  • District council                 ->  the plain '<name>' unit.
  • Renamed councils keep their own unit under its former name (link = renamed).
  • Councils created or split after the workbook's boundaries inherit the unit of the council they were
    carved from (link = inherits); that unit is recorded in src/data/tanzania-councils.json by the
    spatial assignment made when the boundaries were first reconciled, and is kept here.

Inputs : the NBS 2022 PHC geodatabase (Councils layer), src/data/tanzania-councils.json (codes and the
         earlier spatial parents), src/data/tanzania-inform-risk.json (workbook unit names).
Outputs: data-source/council_registry.csv, data-source/council_reconciliation.csv, and the properties of
         src/data/tanzania-councils.json (name, src, isNew, parent, formerly, census codes).
Run    : python3 scripts/build-council-registry.py   (then: node scripts/build-council-index.mjs)
"""
import csv
import json
import re
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
import geopandas as gpd  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
GDB = "/home/kaijage/model/tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb"
GEO = ROOT / "src/data/tanzania-councils.json"

norm = lambda s: re.sub(r"[^a-z0-9]", "", str(s).lower())
PREFIX = re.compile(
    r"^(halmashauri ya jiji la |halmashauri ya manispaa ya |halmashauri ya manispaa |halmashauri ya mji wa |halmashauri ya mji |"
    r"halmashauri ya wilaya ya |halmashuari ya wilaya ya |halmashauri ya wilaya |halmashauri ya |baraza la manispaa |baraza la mji wa |"
    r"baraza la mji |baraza la wilaya )",
    re.I,
)


def council_type(census_name: str) -> str:
    low = census_name.lower()
    if low.startswith("halmashauri ya jiji"):
        return "City"
    if "manispaa" in low:
        return "Municipal"
    if re.search(r"\bmji\b", low):
        return "Town"
    return "District"


def core_name(census_name: str) -> str:
    return PREFIX.sub("", census_name).strip()


# Councils whose workbook unit cannot be found by the name rules, or whose council was renamed.
RENAMED = {  # display name -> (workbook unit, former council name)
    "Dar es Salaam City": ("Ilala", "Ilala Municipal Council"),
    "Mwanza City": ("Nyamagana", "Nyamagana Municipal Council"),
    "Mtama District": ("Lindi", "Lindi District Council"),
}
EXPLICIT = {  # display name -> workbook unit (own unit under another spelling)
    "Kigoma Ujiji Municipal": "Kigoma  Urban",
    "Mtwara Mikindani Municipal": "Mtwara Urban",
    "Mbogwe District": "Mbogwe",
}

councils = gpd.read_file(GDB, layer="Councils", ignore_geometry=True)
geo = json.load(open(GEO))
units = json.load(open(ROOT / "src/data/tanzania-inform-risk.json"))["subnational"]["adm2"]
unit_by_key = {norm(u["admin"]["adm2Name"]): u["admin"]["adm2Name"] for u in units}
unit_by_key["butiama"] = unit_by_key.get("butiam", unit_by_key.get("butiama"))  # workbook typo 'Butiam'

by_triple = {}
for f in geo["features"]:
    p = f["properties"]
    by_triple[(norm(p["reg"]), norm(p["dist"]), str(p["ccode"]))] = f

rows = []
used = {}
for _, c in councils.iterrows():
    triple = (norm(c["reg_name"]), norm(c["dist_name"]), str(c["counc_code"]))
    f = by_triple[triple]
    p = f["properties"]
    typ = council_type(c["counc_name"])
    core = core_name(c["counc_name"])
    name = f"{core} {typ}"
    link, unit, formerly, parent = None, None, "", None
    if name in RENAMED:
        unit, formerly = RENAMED[name]
        link = "renamed"
    elif name in EXPLICIT:
        unit, link = EXPLICIT[name], "own"
    else:
        k = norm(core)
        candidates = [k + "urban", k + "townshipauthority", k + "mji", k] if typ != "District" else [k]
        for cand in candidates:
            if cand in unit_by_key:
                unit, link = unit_by_key[cand], "own"
                break
    if unit is None:
        # created or split after the workbook's boundaries: keep the spatial parent recorded earlier
        unit, link, parent = p["src"], "inherits", p.get("parent") or p["src"]
    used.setdefault(unit, []).append(name)
    rows.append(
        {
            "code": p["code"],
            "reg_code": str(c["reg_code"]),
            "dist_code": str(c["dist_code"]),
            "counc_code": str(c["counc_code"]),
            "census_name": c["counc_name"],
            "name": name,
            "type": typ,
            "region": p["reg"],
            "district": c["dist_name"],
            "workbook_unit": unit,
            "link": link,
            "formerly": formerly,
            "parent": parent or "",
        }
    )
    p.update({"name": name, "src": unit, "isNew": link == "inherits", "rcode": str(c["reg_code"]), "dcode": str(c["dist_code"])})
    for key in ("parent", "formerly"):
        p.pop(key, None)
    if parent:
        p["parent"] = parent
    if formerly:
        p["formerly"] = formerly

rows.sort(key=lambda r: r["code"])
assert [r["code"] for r in rows] == [f"C{i:03d}" for i in range(1, 196)], "codes must stay C001..C195"
missing = sorted(set(unit_by_key.values()) - set(used) - {"Butiam"})
assert not missing, f"workbook units not used by any council: {missing}"

with open(ROOT / "data-source/council_registry.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
with open(ROOT / "data-source/council_reconciliation.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["code", "council_name", "type", "district", "region", "workbook_unit", "link", "shared_with"])
    for r in rows:
        others = [n for n in used[r["workbook_unit"]] if n != r["name"]]
        w.writerow([r["code"], r["name"], r["type"], r["district"], r["region"], r["workbook_unit"], r["link"], "; ".join(others)])
json.dump(geo, open(GEO, "w"))

shared = {u: n for u, n in used.items() if len(n) > 1}
print(f"registry: {len(rows)} councils; links: " + ", ".join(f"{k} {sum(1 for r in rows if r['link'] == k)}" for k in ("own", "renamed", "inherits")))
print(f"workbook units used: {len(used)} of {len(set(unit_by_key.values()))}; shared by two councils: {len(shared)}")
