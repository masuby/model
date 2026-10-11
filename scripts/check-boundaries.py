#!/usr/bin/env python3
"""
check-boundaries.py - the dry run of the boundary procedure (data-source/BOUNDARIES.md, issue ADM-06):
compare an official list of councils with the registry and report what a re-basing would have to do,
without changing anything.

usage: python3 scripts/check-boundaries.py [official.csv]
  official.csv has the columns code, name, region, district (code = reg_code|dist_code|counc_code as in
  the registry, blank when the council is not coded yet). Without an argument the registry is compared
  with itself, which must report zero changes.
exit: 0 when nothing changed, 1 otherwise.
"""
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "data-source/council_registry.csv"

norm = lambda s: re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def read_registry():
    rows = list(csv.DictReader(open(REGISTRY, newline="")))
    out = {}
    for r in rows:
        code = f"{r['reg_code']}|{r['dist_code']}|{r['counc_code']}"
        out[code] = {"id": r["code"], "name": r["name"], "region": r["region"], "district": r["district"], "retired": r.get("retired", "")}
    return out


def read_official(path):
    rows = list(csv.DictReader(open(path, newline="")))
    out = {}
    for r in rows:
        out[r.get("code") or f"?{norm(r['name'])}"] = {"name": r["name"], "region": r.get("region", ""), "district": r.get("district", "")}
    return out


def main(argv):
    registry = read_registry()
    if len(argv) > 1:
        official = read_official(argv[1])
        label = argv[1]
    else:
        official = {code: {"name": r["name"], "region": r["region"], "district": r["district"]} for code, r in registry.items()}
        label = "the registry itself (dry run)"
    added, renamed, moved, removed = [], [], [], []
    by_name = {norm(r["name"]): code for code, r in registry.items()}
    for code, o in official.items():
        if code in registry:
            r = registry[code]
            if norm(r["name"]) != norm(o["name"]):
                renamed.append((r["id"], r["name"], o["name"]))
            if norm(r["region"]) != norm(o["region"]) or norm(r["district"]) != norm(o["district"]):
                moved.append((r["id"], r["name"], f"{r['region']}/{r['district']}", f"{o['region']}/{o['district']}"))
        elif norm(o["name"]) in by_name:
            # same name, new code: the census recoded it (treat as a move of code, report it)
            r = registry[by_name[norm(o["name"])]]
            moved.append((r["id"], r["name"], by_name[norm(o["name"])], code))
        else:
            added.append((code, o["name"], o["region"], o["district"]))
    for code, r in registry.items():
        if code not in official and not r.get("retired"):
            if norm(r["name"]) not in {norm(o["name"]) for o in official.values()}:
                removed.append((r["id"], r["name"]))
    print(f"check-boundaries: {len(official)} councils in {label}; registry {len(registry)}")
    for title, items in (("added", added), ("renamed", renamed), ("moved or recoded", moved), ("removed (to retire)", removed)):
        print(f"  {title}: {len(items)}")
        for it in items:
            print("    ", " | ".join(str(x) for x in it))
    changes = len(added) + len(renamed) + len(moved) + len(removed)
    print("zero changes" if changes == 0 else f"{changes} change(s): follow data-source/BOUNDARIES.md")
    return 0 if changes == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
