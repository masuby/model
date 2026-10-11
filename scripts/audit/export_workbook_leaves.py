#!/usr/bin/env python3
"""Export the workbook's cached scores (the 32 components, the three dimensions and risk) for the 170
Tanzanian units into a test fixture, read directly from the main sheet 'INFORM SADC 2024' with openpyxl
(no recalculation). The engine's dataset test compares the Core data with this fixture, so the Core can
never drift from the workbook without a test failing.

Run: python3 scripts/audit/export_workbook_leaves.py
Out: src/engine/risk/__tests__/fixtures/workbook.leaves.fixture.json
"""
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
WB = ROOT / "data-source/tanzania-inform-risk.xlsx"
OUT = ROOT / "src/engine/risk/__tests__/fixtures/workbook.leaves.fixture.json"

LEAVES = {  # workbook column header -> dataset leaf key
    "Coastal hazards": "coastalHazards", "Drought": "drought", "Earthquake": "earthquake",
    "Environmental Degradation": "environmentalDegradation", "Flood": "flood", "Heatwave": "heatwave",
    "Landslide": "landslide", "Lightning": "lightning", "Storms & Cyclone": "stormsCyclone", "Volcano": "volcano",
    "Wildfire": "wildfire", "Zoonoses, Plants & Pests": "zoonoses", "Conflict Intensity": "conflictIntensity",
    "Conflict Risk": "conflictRisk", "Hazardous Material": "hazardousMaterial", "Internal Violence": "internalViolence",
    "Vehicle Accidents": "vehicleAccidents", "Development & Poverty": "developmentPoverty",
    "Economic Dependency": "economicDependency", "Habitat": "habitat", "Livelihoods": "livelihoods",
    "Displaced People": "displacedPeople", "Health Conditions": "healthConditions",
    "Children Health and Nutritio": "childrenHealthNutrition", "Ecomonic": "economic",
    "Access to health care": "accessHealth", "Economic capacity": "economicCapacity", "WASH": "wash",
    "Communication": "communication", "Education": "education", "DRR implementation": "drrImplementation",
    "Governance": "governance",
}
TOTALS = {"HAZARD": "hazard", "VULNERABILITY": "vulnerability", "LACK OF COPING CAPACITY": "coping", "RISK": "risk"}

wb = openpyxl.load_workbook(WB, data_only=True, read_only=True)
ws = wb["INFORM SADC 2024"]
rows = list(ws.iter_rows(values_only=True))
header = [str(h).strip() if h is not None else "" for h in rows[1]]
col = {}
for i, h in enumerate(header):
    for name, key in LEAVES.items():
        if h.startswith(name):
            col[key] = i
    if h in TOTALS:
        col[TOTALS[h]] = i
missing = [k for k in list(LEAVES.values()) + list(TOTALS.values()) if k not in col]
assert not missing, f"columns not found: {missing}"
iso = header.index("ISO3")
pcode = header.index("ADM2_PCODE")
name = header.index("ADM2_NAME")

units = []
for r in rows[3:]:
    if not r or r[iso] != "TZA" or not r[pcode]:
        continue
    cell = lambda k: (r[col[k]] if isinstance(r[col[k]], (int, float)) else None)
    units.append({"id": r[pcode], "name": r[name], "leaves": {k: cell(k) for k in LEAVES.values()}, **{k: cell(k) for k in TOTALS.values()}})
assert len(units) == 170, len(units)
OUT.write_text(json.dumps({"source": "INFORM SADC 2024 workbook, sheet 'INFORM SADC 2024', cached values", "units": units}))
print(f"wrote {OUT.relative_to(ROOT)}: {len(units)} units, {len(LEAVES)} leaves each")
