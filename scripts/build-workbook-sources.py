#!/usr/bin/env python3
"""Export the workbook's own provenance (Metadata sheet) for the indicators in use, so the site can show
where every Core value really comes from: the dataset, its publisher, its year and its resolution, as the
INFORM SADC 2024 workbook records them.

Run: python3 scripts/build-workbook-sources.py
Out: src/data/inform-workbook-sources.json  { indicators: {id: {...}}, components: {component: {...}} }
"""
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WB = ROOT / "data-source/tanzania-inform-risk.xlsx"
OUT = ROOT / "src/data/inform-workbook-sources.json"

spec = json.load(open(ROOT / "src/data/inform-indicator-spec.json"))
used = {k for k, v in spec.items() if v.get("use") == "Yes"}

wb = openpyxl.load_workbook(WB, data_only=True, read_only=True)
rows = list(wb["Metadata"].iter_rows(values_only=True))
hdr = [str(h).strip() if h else "" for h in rows[0]]
col = {h: i for i, h in enumerate(hdr)}
clean = lambda v: " ".join(str(v).split()) if v is not None and str(v).strip() not in ("", "None", "N/A", "n/a") else ""
RES = {"Subnational (adm2)": "district", "Subnational (adm1)": "region", "National": "national"}


def year_of(v):
    s = clean(v)
    s = re.sub(r"(\d{4})\.0\b", r"\1", s)
    if s.lower().startswith("unknown"):
        return "year unknown"
    if s.lower().startswith("n/a"):
        return "modelled"
    return s


indicators = {}
for r in rows[1:]:
    iid = clean(r[col["INFORM Id"]])
    if iid not in used:
        continue
    indicators[iid] = {
        "id": iid,
        "name": clean(r[col["Indicator"]]),
        "component": clean(r[col["Component"]]),
        "dimension": clean(r[col["Dimension"]]),
        "source": clean(r[col["Source"]]),
        "url": clean(r[col["URL used"]]),
        "resolution": RES.get(clean(r[col["Resolution"]]), "national"),
        "year": year_of(r[col["Data year"]]),
        "unit": clean(r[col["Measure Unit"]]),
        "description": clean(r[col["Description"]])[:300],
    }
missing = sorted(used - set(indicators))
assert not missing, f"used indicators without metadata: {missing}"

ORDER = {"district": 0, "region": 1, "national": 2}
components = {}
for ind in indicators.values():
    c = components.setdefault(ind["component"], {"component": ind["component"], "indicators": [], "sources": [], "years": [], "resolution": "national"})
    c["indicators"].append(ind["id"])
    if ind["source"] and ind["source"] not in c["sources"]:
        c["sources"].append(ind["source"])
    if ind["year"] and ind["year"] not in c["years"]:
        c["years"].append(ind["year"])
    if ORDER[ind["resolution"]] < ORDER[c["resolution"]]:
        c["resolution"] = ind["resolution"]
OUT.write_text(json.dumps({"source": "INFORM SADC 2024 workbook, sheet 'Metadata' (indicators in use)", "indicators": indicators, "components": components}, ensure_ascii=False, indent=0))
print(f"wrote {OUT.relative_to(ROOT)}: {len(indicators)} indicators, {len(components)} components")
for c in list(components.values())[:3]:
    print("  ", c["component"], "|", "; ".join(c["sources"]), "|", ", ".join(c["years"]), "|", c["resolution"])
