#!/usr/bin/env python3
"""
build-advanced-inputs.py - the inputs of the Advancement layer, one file, with their provenance.

The Advancement layer adds Tanzanian sub-indicators (the baskets of src/data/inform-advanced-spec.json)
to the Core's hazard groups. It is computed beside the Core and shown apart from it; nothing here
touches a Core value. This script only collects, per council (C001..C195), the raw values that exist
in data-source/ with a documented method, and records what is withheld or unavailable:

  council level (computed on the 195 council polygons)
    HA.NAT.DR-ARID  aridity_councils.csv        aridity_index   P/PET, CHIRPS v3 + ERA5 Thornthwaite PET, 1991-2020
    HA.NAT.DR-NDVI  ndvi_councils.csv           ndvi            MODIS MOD13Q1 mean NDVI, 2001-2020
    HA.NAT.DR-SOIL  soil_moisture_councils.csv  ssm             NASA-USDA SMAP 10 km surface soil moisture, 2015-2022
    HA.NAT.FL-R50   council_climate.csv         heavy_days_yr   CHIRPS daily, days > 50 mm per year, 2015-2024
    HA.NAT.FL-R100  council_climate.csv         vheavy_days_yr  CHIRPS daily, days > 100 mm per year, 2015-2024
    HA.NAT.LS-SUSC  landslide_slope_councils.csv slope          SRTM mean slope (degrees)
    HA.NAT.LS-RAIN  rain_trigger_councils.csv   rx1day          CHIRPS daily, mean annual max 1-day rainfall, 2015-2023
    HA.NAT.ST-WIND  wind_councils.csv           windmax         ERA5-Land daily max 10 m wind, period maximum, 2015-2023
    HA.NAT.HW-DAYS  heatwave_councils.csv       hotdays         ERA5-Land daily Tmax > 35 C, days per year, 2015-2023
    HA.NAT.DR-SPEI  drought_members_councils.csv spei_depth    mean |SPEI-12| during droughts, CHIRPS v3 + ERA5, 1991-2024 (ADV-05: now per council)
    HA.NAT.DR-CV    drought_members_councils.csv rain_cv       interannual CV of annual rainfall, CHIRPS v3, 1991-2024 (per council)
    HA.NAT.EQ-HIST  earthquake_councils.csv     n_events_50km   USGS M>=4.5 events within 50 km of the council centroid, 1960-2024, as events/100 yr
  district level (compiled per 2022 district or workbook unit, copied to their councils, labelled)
    HA.NAT.FL-EVENT flood_events.csv            (count)         recorded flood events 2010-2024 (PMO-DMD, DesInventar, EM-DAT, press)
    VU.VG.DP-UNHCR  displaced_refugees.csv      refugees        refugees and asylum-seekers hosted, UNHCR 2024 (rounded operational figures)
    CC.INF.HC-DENS  facilities_by_council.json  health          dispensaries, health centres and hospitals per 10,000 people, 2022 PHC geodatabase, per council
    CC.INF.EDU-DENS facilities_by_council.json  education       schools (pre-primary to secondary) per 10,000 people, 2022 PHC geodatabase, per council
  computed by the engine at build time
    CC.INS.DRR-STAT the council's recorded DRM arrangements (EPRP, AA, EOCC, ERT, RVCA: PMO-DMD list + approved
                    committee records), counted 0-5; this file only records the member's provenance and coverage
  withheld
    HA.NAT.DR-SEAS  season failure frequency: the single-wettest-window season choice mis-scores bimodal
                    councils (issue MET-01); recompute both seasons before use.
    Sentinel-1 flood frequency (flood_s1_councils.csv): no basket entry; flagged research artefact.
  unavailable: every other basket member (no dataset yet; see the Methodology page).

Reference ranges and weights are those of inform-advanced-spec.json (relative ranges set from the span of
the council values at first computation; weights proposed, not calibrated: issue ADV-04).

Out: src/data/tanzania-advanced-inputs.json
Run: python3 scripts/build-advanced-inputs.py
"""
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DS = ROOT / "data-source"
OUT = ROOT / "src/data/tanzania-advanced-inputs.json"
SPEC = json.loads((ROOT / "src/data/inform-advanced-spec.json").read_text())

USGS_YEARS = 2024 - 1960 + 1  # catalogue 1960-2024 inclusive


def read(name):
    with open(DS / name, newline="") as f:
        return list(csv.DictReader(f))


def num(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if v == v else None  # drop NaN


COUNCIL_FILES = {
    "HA.NAT.DR-ARID": ("aridity_councils.csv", "code", "aridity_index", 1.0,
                       "CHIRPS v3 monthly precipitation and ERA5 2 m temperature (Thornthwaite PET)", "Annual P / PET on the council polygon, 1991-2020 climatology (scripts/compute-aridity.py)", "1991-2020", "CHC"),
    "HA.NAT.DR-NDVI": ("ndvi_councils.csv", "code", "ndvi", 1.0,
                       "MODIS MOD13Q1 NDVI (250 m), Google Earth Engine", "Zonal mean greenness on the council polygon, 2001-2020 (scripts/compute-gee-eo.py)", "2001-2020", "CHC"),
    "HA.NAT.DR-SOIL": ("soil_moisture_councils.csv", "code", "ssm", 1.0,
                       "NASA-USDA SMAP 10 km surface soil moisture, Google Earth Engine", "Zonal mean, 2015-2022 (scripts/compute-gee-eo.py)", "2015-2022", "CHC"),
    "HA.NAT.FL-R50": ("council_climate.csv", "counc_code", "heavy_days_yr", 1.0,
                      "CHIRPS daily rainfall", "Days with council-mean rainfall above 50 mm, per year, 2015-2024 (scripts/compute-council-climate.py)", "2015-2024", "CHC"),
    "HA.NAT.FL-R100": ("council_climate.csv", "counc_code", "vheavy_days_yr", 1.0,
                       "CHIRPS daily rainfall", "Days with council-mean rainfall above 100 mm, per year, 2015-2024 (scripts/compute-council-climate.py)", "2015-2024", "CHC"),
    "HA.NAT.LS-SUSC": ("landslide_slope_councils.csv", "code", "slope", 1.0,
                       "SRTM 30 m elevation, Google Earth Engine", "Mean terrain slope on the council polygon, degrees (scripts/compute-gee-eo2.py)", "SRTM 2000", "CHC"),
    "HA.NAT.LS-RAIN": ("rain_trigger_councils.csv", "code", "rx1day", 1.0,
                       "CHIRPS daily rainfall, Google Earth Engine", "Mean annual maximum 1-day rainfall, 2015-2023 (scripts/compute-gee-eo2.py)", "2015-2023", "CHC"),
    "HA.NAT.ST-WIND": ("wind_councils.csv", "code", "windmax", 1.0,
                       "ERA5-Land daily 10 m wind, Google Earth Engine", "Period maximum of daily maximum wind speed, 2015-2023 (scripts/compute-gee-eo2.py)", "2015-2023", "CHC"),
    "HA.NAT.HW-DAYS": ("heatwave_councils.csv", "code", "hotdays", 1.0,
                       "ERA5-Land daily maximum 2 m temperature, Google Earth Engine", "Days per year with Tmax above 35 C, 2015-2023 (scripts/compute-gee-eo2.py)", "2015-2023", "CHC"),
    "HA.NAT.DR-SPEI": ("drought_members_councils.csv", "code", "spei_depth", 1.0,
                       "CHIRPS v3 monthly rainfall and ERA5 2 m temperature", "Mean magnitude of SPEI-12 during drought months on the council polygon, 1991-2024 (scripts/compute-council-drought-members.py)", "1991-2024", "CHC"),
    "HA.NAT.DR-CV": ("drought_members_councils.csv", "code", "rain_cv", 1.0,
                     "CHIRPS v3 monthly rainfall", "Interannual coefficient of variation of annual rainfall on the council polygon, 1991-2024 (scripts/compute-council-drought-members.py)", "1991-2024", "CHC"),
    "HA.NAT.EQ-HIST": ("earthquake_councils.csv", "code", "n_events_50km", 100.0 / USGS_YEARS,
                       "USGS earthquake catalogue, M >= 4.5", f"Events within 50 km of the council centroid, 1960-2024, scaled to events per 100 years (x 100/{USGS_YEARS}; scripts/compute-council-earthquake.py)", "1960-2024", "CHC"),
    # Added by the indicator integrity recheck of 10 October 2026: the GEM exposure index gives Kagera 0 although the
    # Mw 5.9 Bukoba earthquake of 2016 is in the catalogue; the felt intensity records what the event density misses.
    "HA.NAT.EQ-FELT": ("earthquake_councils.csv", "code", "max_felt", 1.0,
                       "USGS earthquake catalogue, M >= 4.5", "Maximum felt intensity at the council centroid over the events of 1960-2024: max of 1.5 M - 1.5 log10(R + 15), a simple attenuation (scripts/compute-council-earthquake.py)", "1960-2024", "CHC"),
}
DISTRICT_FILES = {
    "VU.VG.DP-UNHCR": ("displaced_refugees.csv", "refugees", 1.0,
                     "UNHCR Tanzania operational data 2024 (rounded camp and urban figures)", "Refugees and asylum-seekers hosted in the district (Nyarugusu, Nduta, transit and urban caseloads), copied to its councils (data-source/displaced_refugees.csv)", "2024", "UNHCR"),
}
# Recorded flood events: one row per event in flood_events.csv; the member is the count per district.
FLOOD_EVENTS = ("flood_events.csv", "Recorded flood events compiled from PMO-DMD, DesInventar, EM-DAT and press reports",
                "Number of recorded flood events in the district, 2010-2024 (data-source/flood_events.csv), copied to its councils; the committees' validated event reports replace this file", "2010-2024", "CHC")
# Facility densities per council: 2022 PHC facility counts on the council polygon over its census population.
# Recheck of 10 October 2026: the census 'Health_Facilities' layer is mostly drug outlets and pharmacies, so
# only dispensaries, health centres and hospitals count; schools are counted from pre-primary to secondary.
FACILITIES = ("facilities_by_council.json", "2022 Population and Housing Census geodatabase (NBS/OCGS), facilities spatially joined to the 195 council polygons with the facility types filtered",
              "{what} per 10,000 people of the council (2022 census; scripts/spatial-join-facilities-councils.py)", "2022", "NBS")
DRR_STAT = ("PMO-DMD list of DRM arrangements (June 2026) and the DRR records approved through the Data portal",
            "Count of the arrangements recorded for the council (EPRP, anticipatory action, EOCC, ERT, RVCA), 0 to 5, computed by the engine from the council's record (src/engine/risk/advanced.ts)", "2026", "PMO")
WITHHELD = {
    "HA.NAT.DR-SEAS": {"reason": "Growing-season failure frequency is withheld: the method scores the single wettest 4-month window, which mis-scores bimodal councils (issue MET-01). Both rainy seasons must be scored (data-source/seasonality_zones.csv) before use.", "file": "data-source/chirps_drought_spi_spei.csv"},
}
CANDIDATES = {
    "flood_s1": {"note": "Sentinel-1 wet-season water fraction minus permanent water (data-source/flood_s1_councils.csv) has no basket entry and is flagged as a research artefact; not used.", "file": "data-source/flood_s1_councils.csv"},
}

registry = read("council_registry.csv")
codes = [r["code"] for r in registry]
assert len(codes) == 195 and len(set(codes)) == 195, len(codes)
district_of = {r["code"]: r["district"].strip() for r in registry}

values = {c: {} for c in codes}
inputs = {}
for sid, (fn, keycol, col, factor, source, method, period, inst) in COUNCIL_FILES.items():
    assert sid in SPEC, sid
    rows = {r[keycol]: r for r in read(fn)}
    n = 0
    for c in codes:
        v = num(rows.get(c, {}).get(col))
        if v is not None:
            values[c][sid] = round(v * factor, 4)
            n += 1
    inputs[sid] = {"source": source, "method": method, "period": period, "resolution": "council", "file": f"data-source/{fn}", "column": col, "filled": n, "institution": inst,
                   "unit": SPEC[sid].get("unit"), "min": SPEC[sid].get("resolved_min"), "max": SPEC[sid].get("resolved_max"), "weight": SPEC[sid].get("weight")}
def meta(sid, source, method, period, resolution, fn, col, n, inst):
    return {"source": source, "method": method, "period": period, "resolution": resolution, "file": f"data-source/{fn}", "column": col, "filled": n, "institution": inst,
            "unit": SPEC[sid].get("unit"), "min": SPEC[sid].get("resolved_min"), "max": SPEC[sid].get("resolved_max"), "weight": SPEC[sid].get("weight")}


for sid, (fn, col, factor, source, method, period, inst) in DISTRICT_FILES.items():
    assert sid in SPEC, sid
    rows = {r["dist_name"].strip(): r for r in read(fn)}
    n = 0
    for c in codes:
        v = num(rows.get(district_of[c], {}).get(col))
        if v is not None:
            values[c][sid] = round(v * factor, 4)
            n += 1
    inputs[sid] = meta(sid, source, method, period, "district", fn, col, n, inst)

# Recorded flood events per district (a count), copied to the district's councils.
fn, source, method, period, inst = FLOOD_EVENTS
counts = {}
for r in read(fn):
    counts[r["dist_name"].strip()] = counts.get(r["dist_name"].strip(), 0) + 1
n = 0
for c in codes:
    v = counts.get(district_of[c])
    if v:
        values[c]["HA.NAT.FL-EVENT"] = v
        n += 1
inputs["HA.NAT.FL-EVENT"] = meta("HA.NAT.FL-EVENT", source, method, period, "district", fn, "count of rows", n, inst)

# Facility densities per council (2022 PHC facilities on the council polygon over its 2022 census population).
unit_of = {r["code"]: r["workbook_unit"].strip() for r in registry}
pop = {r["counc_code"]: num(r["pop2022"]) for r in read("council_climate.csv")}
fac = json.loads((DS / "facilities_by_council.json").read_text())["councils"]
fn, source, method, period, inst = FACILITIES
for sid, col, what in (("CC.INF.HC-DENS", "health", "Health facilities (dispensaries, health centres, hospitals)"), ("CC.INF.EDU-DENS", "education", "Schools (pre-primary to secondary)")):
    n = 0
    for c in codes:
        f = fac.get(c)
        p = pop.get(c) or 0.0
        if f and p > 0 and num(f.get(col)) is not None:
            values[c][sid] = round(num(f[col]) * 10000.0 / p, 4)
            n += 1
    inputs[sid] = meta(sid, source, method.format(what=what), period, "council", fn, col, n, inst)

# DRM arrangements: computed by the engine from each council's record; here only the coverage of the published list.
core = json.loads((ROOT / "src/data/tanzania-inform-risk.json").read_text())
units_with_drr = {u["admin"]["adm2Name"].strip() for u in core["subnational"]["adm2"] if u.get("drr")}
n = sum(1 for c in codes if unit_of[c] in units_with_drr)
source, method, period, inst = DRR_STAT
inputs["CC.INS.DRR-STAT"] = meta("CC.INS.DRR-STAT", source, method, period, "council", "drr_status.csv", "computed", n, inst)

unavailable = sorted(sid for sid in SPEC if sid not in inputs and sid not in WITHHELD)
out = {
    "release": "adv-2026.10",
    "layer": "advancement",
    "built": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "note": "Inputs of the Advancement layer: raw values of the advanced sub-indicators per council, collected from data-source/ with their method. The layer is computed beside the Core and never changes it.",
    "rangeNote": "Reference ranges and weights are those of src/data/inform-advanced-spec.json: ranges are relative (set from the span of the council values at first computation, as the workbook does for its own indicators); weights are proposed, not calibrated (ADV-04). Each value is standardised once; there is no second rescaling (MET-09).",
    "exposureNote": "These sub-indicators measure hazard intensity on each territory, not the people exposed as INFORM's own hazard indicators do (MET-16).",
    "inputs": inputs,
    "withheld": WITHHELD,
    "candidates": CANDIDATES,
    "unavailable": unavailable,
    "values": {c: v for c, v in values.items() if v},
}
OUT.write_text(json.dumps(out, separators=(",", ":")))
filled = sum(1 for sid in SPEC if sid in inputs)
print(f"wrote {OUT.relative_to(ROOT)}: {len(out['values'])} councils; {filled} of {len(SPEC)} sub-indicators filled "
      f"({sum(1 for m in inputs.values() if m['resolution']=='council')} council-level, {sum(1 for m in inputs.values() if m['resolution']=='district')} district-level); "
      f"{len(WITHHELD)} withheld; {len(unavailable)} unavailable")
for sid, m in inputs.items():
    print(f"  {sid:16} {m['filled']:3}/195 {m['resolution']:8} {m['file']}")
