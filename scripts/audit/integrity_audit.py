"""
Integrity audit: compare the shipped INFORM Tanzania data with the authentic workbook.

Re-run after any data or methodology change to see whether the issues in
docs/assessment/INFORM_TZ_Issue_Matrix_2026-10.xlsx are fixed:

    python3 scripts/audit/integrity_audit.py            # human-readable report
    python3 scripts/audit/integrity_audit.py --json     # machine-readable summary

Checks (issue IDs from the matrix):
  NAT-01  national record equals the first district's row (Kondoa)
  COR-01  core indicator groups that differ from the workbook, per group and per unit
  COR-03  stored dimension totals that do not follow the workbook rule (unrounded categories)
  COR-04  hazard_baseline.csv values that differ from the workbook
  Summary risk-class distribution: workbook vs shipped.

Reads only: the workbook (data-source/tanzania-inform-risk.xlsx, identical to the root
"Tanzania - Country Model Template.xlsx") and src/data/tanzania-inform-risk.json.
"""
import csv
import json
import math
import sys
import warnings
from pathlib import Path

import openpyxl

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[2]
WORKBOOK = ROOT / "data-source" / "tanzania-inform-risk.xlsx"
DATA = ROOT / "src" / "data" / "tanzania-inform-risk.json"
BASELINE = ROOT / "data-source" / "hazard_baseline.csv"

# Workbook column header -> (dataset dimension, category, leaf)
GROUPS = {
    "Coastal hazards": ("hazardExposure", "natural", "coastalHazards"),
    "Drought": ("hazardExposure", "natural", "drought"),
    "Earthquake": ("hazardExposure", "natural", "earthquake"),
    "Environmental Degradation": ("hazardExposure", "natural", "environmentalDegradation"),
    "Flood": ("hazardExposure", "natural", "flood"),
    "Heatwave": ("hazardExposure", "natural", "heatwave"),
    "Landslide": ("hazardExposure", "natural", "landslide"),
    "Lightning": ("hazardExposure", "natural", "lightning"),
    "Storms & Cyclone": ("hazardExposure", "natural", "stormsCyclone"),
    "Volcano": ("hazardExposure", "natural", "volcano"),
    "Wildfire": ("hazardExposure", "natural", "wildfire"),
    "Zoonoses, Plants & Pests": ("hazardExposure", "natural", "zoonoses"),
    "Conflict Intensity": ("hazardExposure", "human", "conflictIntensity"),
    "Conflict Risk": ("hazardExposure", "human", "conflictRisk"),
    "Hazardous Material": ("hazardExposure", "human", "hazardousMaterial"),
    "Internal Violence": ("hazardExposure", "human", "internalViolence"),
    "Vehicle Accidents": ("hazardExposure", "human", "vehicleAccidents"),
    "Development & Poverty": ("vulnerability", "socioEconomic", "developmentPoverty"),
    "Economic Dependency": ("vulnerability", "socioEconomic", "economicDependency"),
    "Habitat": ("vulnerability", "socioEconomic", "habitat"),
    "Livelihoods": ("vulnerability", "socioEconomic", "livelihoods"),
    "Displaced People": ("vulnerability", "vulnerableGroups", "displacedPeople"),
    "Health Conditions": ("vulnerability", "vulnerableGroups", "healthConditions"),
    "Children Health and Nutrition": ("vulnerability", "vulnerableGroups", "childrenHealthNutrition"),
    "Ecomonic": ("vulnerability", "vulnerableGroups", "economic"),
    "Access to health care": ("lackCopingCapacity", "infrastructure", "accessHealth"),
    "Economic capacity": ("lackCopingCapacity", "infrastructure", "economicCapacity"),
    "WASH": ("lackCopingCapacity", "infrastructure", "wash"),
    "Communication": ("lackCopingCapacity", "infrastructure", "communication"),
    "Education": ("lackCopingCapacity", "infrastructure", "education"),
    "DRR implementation": ("lackCopingCapacity", "institutional", "drrImplementation"),
    "Governance": ("lackCopingCapacity", "institutional", "governance"),
}
DIMS = {"HAZARD": "hazardExposure", "VULNERABILITY": "vulnerability", "LACK OF COPING CAPACITY": "lackCopingCapacity"}
THRESHOLDS = (2.5, 3.4, 4.3, 5.9)
CLASSES = ("Very low", "Low", "Medium", "High", "Very high")


def num(v):
    return None if v in (None, "", "None") else float(v)


def round1(x):  # Excel ROUND(x, 1) on the non-negative 0-10 scale
    return math.floor(x * 10 + 0.5) / 10


def mean(xs):
    xs = [x for x in xs if isinstance(x, (int, float))]
    return sum(xs) / len(xs) if xs else None


def sgm(xs):  # INFORM scaled geometric mean (workbook Z/AK/AU before ROUND)
    xs = [x for x in xs if isinstance(x, (int, float))]
    if not xs:
        return None
    scaled = [(10 - x) / 10 * 9 + 1 for x in xs]
    return (10 - math.prod(scaled) ** (1 / len(scaled))) / 9 * 10


def risk_class(r):
    return CLASSES[sum(r >= t for t in THRESHOLDS)]


def read_workbook():
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True, read_only=True)
    rows = list(wb["INFORM SADC 2024"].iter_rows(min_row=2, max_row=203, max_col=48, values_only=True))
    header = rows[0]
    units = [dict(zip(header, r)) for r in rows[2:] if r[0]]
    return units


def main(as_json=False):
    wb_units = read_workbook()
    wb = {u["ADM2_PCODE"]: u for u in wb_units}
    data = json.loads(DATA.read_text())
    core = {u["admin"]["adm2Code"]: u for u in data["subnational"]["adm2"]}
    out = {}

    # NAT-01: is the national record a copy of the first district?
    first = wb_units[0]
    nat = data["national"]
    nd = nat.get("dimensions", {})
    pairs = [
        (nat.get("risk"), num(first["RISK"])),
        ((nd.get("hazardExposure") or {}).get("total"), num(first["HAZARD"])),
        ((nd.get("vulnerability") or {}).get("total"), num(first["VULNERABILITY"])),
        ((nd.get("lackCopingCapacity") or {}).get("total"), num(first["LACK OF COPING CAPACITY"])),
        (((nd.get("hazardExposure") or {}).get("natural") or {}).get("aggregate"), num(first["NATURAL"])),
    ]
    same = sum(1 for a, b in pairs if a is not None and b is not None and abs(float(a) - b) < 1e-9)
    out["NAT-01"] = {"first_unit": first["ADM2_NAME"], "fields_identical": f"{same}/{len(pairs)}", "fixed": same < len(pairs)}

    # COR-01: indicator groups that differ from the workbook
    per_group, changed_units = {}, set()
    for col, (dim, cat, leaf) in GROUPS.items():
        s = {"same": 0, "raised": 0, "lowered": 0, "added": 0, "removed": 0}
        for code, w in wb.items():
            c = core.get(code)
            if not c:
                continue
            a, b = num(w[col]), c[dim][cat].get(leaf)
            if a is None and b is None or (a is not None and b is not None and abs(a - b) < 0.05):
                s["same"] += 1
                continue
            changed_units.add(code)
            if a is None:
                s["added"] += 1
            elif b is None:
                s["removed"] += 1
            elif b > a:
                s["raised"] += 1
            else:
                s["lowered"] += 1
        per_group[leaf] = s
    altered = [k for k, s in per_group.items() if s["same"] < len(wb)]
    out["COR-01"] = {"units_differing": f"{len(changed_units)}/{len(wb)}", "groups_altered": f"{len(altered)}/{len(GROUPS)}", "per_group": per_group, "fixed": not changed_units}

    # COR-03: stored totals vs the workbook rule (unrounded category means)
    categories = {
        "hazardExposure": ("natural", "human"),
        "vulnerability": ("socioEconomic", "vulnerableGroups"),
        "lackCopingCapacity": ("infrastructure", "institutional"),
    }
    drift = 0
    total = 0
    for code, c in core.items():
        for dim in DIMS.values():
            cats = [mean([v for k, v in c[dim][cat].items() if k != "aggregate"]) for cat in categories[dim]]
            stored = c[dim].get("total")
            if stored is None or not any(isinstance(x, (int, float)) for x in cats):
                continue
            total += 1
            drift += abs(round1(sgm(cats)) - stored) > 0.051
    out["COR-03"] = {"dimension_totals_off_workbook_rule": f"{drift}/{total}", "fixed": drift == 0}

    # COR-04: the 'documented baseline' file vs the workbook
    if BASELINE.exists():
        rows = list(csv.DictReader(BASELINE.open()))
        cols = {"drought": "Drought", "flood": "Flood", "earthquake": "Earthquake", "landslide": "Landslide", "coastalHazards": "Coastal hazards"}
        diffs = {}
        for k, wc in cols.items():
            diffs[k] = sum(
                1
                for r in rows
                if r["adm2_code"] in wb
                and num(r.get(k)) is not None
                and num(wb[r["adm2_code"]][wc]) is not None
                and abs(num(r[k]) - num(wb[r["adm2_code"]][wc])) >= 0.05
            )
        out["COR-04"] = {"baseline_cells_differing_from_workbook": diffs, "fixed": not any(diffs.values())}

    # Risk classes: authentic workbook vs shipped core
    def dist(values):
        d = {k: 0 for k in CLASSES}
        for v in values:
            d[risk_class(v)] += 1
        return d

    wb_risk = {k: num(u["RISK"]) for k, u in wb.items()}
    core_risk = {k: c["risk"] for k, c in core.items() if isinstance(c.get("risk"), (int, float))}
    out["classes"] = {
        "workbook": dist(wb_risk.values()),
        "shipped_core": dist(core_risk.values()),
        "units_in_different_class": sum(1 for k in core_risk if k in wb_risk and risk_class(core_risk[k]) != risk_class(wb_risk[k])),
        "mean_risk_workbook": round(mean(wb_risk.values()), 2),
        "mean_risk_core": round(mean(core_risk.values()), 2),
    }

    if as_json:
        print(json.dumps(out, indent=2))
        return
    print("INFORM Tanzania integrity audit (workbook vs shipped data)\n")
    n = out["NAT-01"]
    print(f"NAT-01 national record vs first district ({n['first_unit']}): {n['fields_identical']} fields identical -> {'FIXED' if n['fixed'] else 'OPEN'}")
    c = out["COR-01"]
    print(f"COR-01 units differing from the workbook: {c['units_differing']}; indicator groups altered: {c['groups_altered']} -> {'FIXED' if c['fixed'] else 'OPEN'}")
    for leaf, s in c["per_group"].items():
        if s["same"] < len(wb):
            print(f"         {leaf:26s} raised {s['raised']:3d}  lowered {s['lowered']:3d}  added {s['added']:3d}  removed {s['removed']:3d}")
    r = out["COR-03"]
    print(f"COR-03 stored dimension totals off the workbook rule: {r['dimension_totals_off_workbook_rule']} -> {'FIXED' if r['fixed'] else 'OPEN'}")
    if "COR-04" in out:
        b = out["COR-04"]
        print(f"COR-04 hazard_baseline.csv cells differing from workbook: {b['baseline_cells_differing_from_workbook']} -> {'FIXED' if b['fixed'] else 'OPEN'}")
    k = out["classes"]
    print(f"\nRisk classes  workbook: {k['workbook']}  (mean {k['mean_risk_workbook']})")
    print(f"              shipped:  {k['shipped_core']}  (mean {k['mean_risk_core']})")
    print(f"              units in a different class from the workbook: {k['units_in_different_class']}")


if __name__ == "__main__":
    main(as_json="--json" in sys.argv)
