#!/usr/bin/env python3
"""Build the Benchmark 2026 institutional dataset.

Reads the council datasets prepared under data-source/benchmark_2026/ (each produced by a script in
scripts/benchmark/ from a public, citable source) and writes src/data/tanzania-benchmark-2026.json:

  release      bm-2026.10
  activations  Tanzanian definitions for template indicators the SADC workbook lists without data
               (unit, keyed level, direction, normalisation and reference range, as the workbook's own
               Metadata sheet does for every indicator in use)
  respec       reference ranges re-resolved for existing indicators whose workbook range is degenerate
  datasets     one entry per dataset: indicator, source, period, resolution, method, institution, coverage
  values       approved measured values in the engine's RawValue shape (specId, unitId, level, value,
               source, dataset, period, institution, at), the same shape the data portal produces

The engine applies these values as approved institutional values (src/engine/risk/model.ts), so every
one shows its lineage, an institution can supersede it through the portal, and the workbook itself is
never changed (the parity tests build the workbook alone with `workbookOnly`).

Usage: python3 scripts/build-benchmark.py
"""
from __future__ import annotations

import csv
import datetime as dt
import json
import math
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
BM = ROOT / "data-source" / "benchmark_2026"
OUT = ROOT / "src" / "data" / "tanzania-benchmark-2026.json"
SPEC = json.load(open(ROOT / "src" / "data" / "inform-indicator-spec.json", encoding="utf-8"))
INDEX = json.load(open(ROOT / "src" / "data" / "tanzania-councils-index.json", encoding="utf-8"))
CODES = [c["code"] for c in INDEX]
REGION_OF = {c["code"]: c["reg"] for c in INDEX}
NAME_OF = {c["code"]: c["name"] for c in INDEX}
RELEASE = "bm-2026.10"
AT = "2026-10-10T00:00:00Z"


def place_key(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def read(name: str) -> list[dict]:
    with open(BM / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(x) -> float | None:
    try:
        v = float(str(x).replace(",", ""))
    except (TypeError, ValueError):
        return None
    return v if v == v else None


values: list[dict] = []
datasets: dict[str, dict] = {}
# Short per-value evidence where the source gives one (dataset key -> unitId -> code), rendered by the panel
# in English or Kiswahili: storms:<names>, segments:<retreating>/<all>, police:<region>, ipc:<district>/<phase>,
# grid (grid electricity only), nocell (no valid hazard cell), events:<count>,
# crashes:<police region>/<its crashes a year>/<the council's share>, sites:<all>/<fuel>/<industrial>/<mining>/<waste and power>/<hospitals>/<NEMC>.
details: dict[str, dict[str, str]] = {}
activations: dict[str, dict] = {}
respec: dict[str, dict] = {}


def dataset(key: str, spec_id: str, by_unit: dict[str, float], *, level: str, unit: str, source: str, dataset_name: str, period: str, resolution: str, method: str, institution: str, note: str = "") -> None:
    """Record one dataset and its values (unitId → value)."""
    n = 0
    for unit_id, v in by_unit.items():
        if v is None:
            continue
        values.append({"specId": spec_id, "unitId": unit_id, "level": level, "value": round(float(v), 4), "valueType": "raw", "source": source, "dataset": dataset_name, "period": period, "institution": institution, "at": AT})
        n += 1
    datasets[key] = {"indicator": spec_id, "name": SPEC.get(spec_id, {}).get("name") or activations.get(spec_id, {}).get("name"), "unit": unit, "source": source, "dataset": dataset_name, "period": period, "resolution": resolution, "method": method, "institution": institution, "level": level, "values": n, "note": note}


def activate(spec_id: str, *, name: str, unit: str, keyed_at: str, sign: str, normalisation: str, vals: list[float], fixed: tuple[float, float] | None = None, basis: str, source: str, transform: str = "None", place: dict | None = None) -> None:
    """A Tanzanian definition for a template indicator the workbook lists without data. With the workbook's
    'Logarithm' transform the range is resolved on LN(0.001 + x) over the positive values, as the workbook does for
    its counts (a zero then scores 0)."""
    if fixed:
        lo, hi = fixed
    elif transform == "Logarithm":
        pos = [math.log(0.001 + v) for v in vals if v and v > 0]
        lo, hi = (round(min(pos), 3), round(max(pos), 3))
    else:
        lo, hi = min(vals), max(vals)
        lo, hi = (round(lo, 3), round(hi, 3))
    activations[spec_id] = {"name": name, **(place or {}), "unit": unit, "keyed_at": keyed_at, "sign": sign, "normalisation": normalisation, "transform": transform, "outlier": "No", "resolved_min": lo, "resolved_max": hi, "use": "Yes", "basis": basis, "source": source}


# --------------------------------------------------------------------------------------- coast
coast = {r["code"]: r for r in read("coastal_councils.csv")}
details["coastal-erosion"] = {c: f"segments:{int(float(r['retreating_segments']))}/{int(float(r['hotspots_1km']))}" for c, r in coast.items() if int(float(r["hotspots_1km"] or 0)) > 0}
erosion = {c: (num(coast[c]["erosion_rate_m_yr"]) if c in coast else 0.0) for c in CODES}
dataset("coastal-erosion", "HA.NAT.CH-ERO", erosion, level="council", unit="m/yr",
        source="Digital Earth Africa Coastlines v0.4.4 (WFS layer coastlines_v0_4_4_hotspots_zoom_3), Landsat 2000-2023",
        dataset_name="DE Africa Coastlines v0.4.4, 1 km hotspots: mean annual rate of change over significantly retreating segments",
        period="2000-2023", resolution="council", institution="NEMC",
        method="scripts/benchmark/coastal_exposure.py + build-benchmark.py: 1 km hotspot points (certainty good) joined to the nearest council within 1.5 km; the council value is the point-count-weighted mean of rate_time over segments retreating significantly (rate < 0, p < 0.05); 0 where no segment retreats; inland councils (more than 500 m from the Indian Ocean polygon) 0",
        note="Replaces the workbook's coastal erosion values (0 for every unit, data note DN-05) with the same source correctly joined to the councils.")
lecz = {c: (num(coast[c]["lecz10_pct"]) if c in coast else 0.0) for c in CODES}
dataset("coastal-lecz", "HA.NAT.CH-SEA", lecz, level="council", unit="%",
        source="Copernicus DEM GLO-90 (2021 release, AWS public tiles) with the 2022 PHC council boundaries",
        dataset_name="Low-elevation coastal zone: share of the council's land at or below 10 m within 25 km of the sea",
        period="2021", resolution="council", institution="NEMC",
        method="scripts/benchmark/coastal_exposure.py: GLO-90 tiles mosaicked; cells with elevation 0-10 m inside the council and within 25 km of the Indian Ocean polygon, divided by the council's land cells; inland councils 0",
        note="Activates the template's sea-level-rise indicator with the standard exposure measure (the low-elevation coastal zone of CIESIN/McGranahan et al. 2007).")
activate("HA.NAT.CH-SEA", name="Sea level rise: low-elevation coastal zone (share of area at or below 10 m)", unit="%", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", vals=list(lecz.values()),
         basis="Template indicator 'Sea Level Rise' activated with the low-elevation coastal zone share; range resolved from the Tanzanian data as the workbook does", source="Copernicus DEM GLO-90")

# -------------------------------------------------------------------------------------- cyclone
cyc_rows = read("cyclone_exposure.csv")
cyc = {r["code"]: num(r["area_in_34kt_swath_pct"]) for r in cyc_rows}
details["cyclone-swath"] = {r["code"]: "storms:" + ", ".join(x.strip().title() for x in r["storms_list"].split(";") if x.strip()) for r in cyc_rows if r["storms_list"].strip()}
swath = {c: cyc.get(c, 0.0) for c in CODES}
dataset("cyclone-swath", "HA.NAT.ST-TC2", swath, level="council", unit="%",
        source="IBTrACS v04r01, South Indian basin (NOAA NCEI), tracks 1980-2026",
        dataset_name="Share of the council's area inside the gale-force (34 kt) wind swath of any tropical cyclone since 1980",
        period="1980-2026", resolution="council", institution="TMA",
        method="scripts/benchmark/cyclone_swaths.py: for every track point with sustained wind of 34 kt or more, a circle of the reported 34-kt wind radius (largest quadrant; 100 km when not reported); the union of the circles of all storms intersected with the council polygon",
        note="Replaces the workbook's cyclone exposure (one non-zero unit, Mtwara 18.1%) with an observed-track exposure for every council; the workbook's reference range (0 to 18.1%) is kept, so every council with at least 18.1% of its area inside a swath scores 10.")

# ------------------------------------------------------------------------------------- heatwave
hw = {r["code"]: num(r["hw_days_2015_2024"]) for r in read("heatwave_councils.csv")}
dataset("heatwave-days", "HA.NAT.HW-EXP", hw, level="council", unit="days/yr",
        source="ERA5-Land daily maximum 2 m temperature 1991-2024 (ECMWF, through Google Earth Engine ECMWF/ERA5_LAND/DAILY_AGGR)",
        dataset_name="Heatwave days per year: days in runs of three or more days above the calendar-day 90th percentile of 1991-2020, mean of 2015-2024",
        period="2015-2024 (base 1991-2020)", resolution="council", institution="TMA",
        method="scripts/benchmark/gee_tmax_daily.py (council-mean daily Tmax) + heatwave_days.py (15-day-window percentile, 3-day runs)",
        note="Activates the template's heatwave indicator with the WMO/ETCCDI-style warm-spell definition, which is relative to each place's own climate so that the humid coast and islands register as the rest of the country does.")
activate("HA.NAT.HW-EXP", name="Heatwave days (runs of 3 or more days above the local 90th percentile), 2015-2024", unit="days/yr", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", vals=[v for v in hw.values() if v is not None],
         basis="Template indicator 'Heatwave exposure' activated with the warm-spell day count; range resolved from the Tanzanian data", source="ERA5-Land")

# ------------------------------------------------------------------------------------ lightning
if (BM / "lightning_wglc.csv").exists():
    li = {r["code"]: num(r["strokes_per_km2_yr"]) for r in read("lightning_wglc.csv")}
    dataset("lightning-density", "HA.NAT.LI-CAS", li, level="council", unit="strokes/km2/yr",
            source="WWLLN Global Lightning Climatology (WGLC) 2010-2021, 5 arc-minute climatology (Kaplan and Lau 2021, Zenodo record 6007052)",
            dataset_name="Mean annual lightning stroke density over the council", period="2010-2021", resolution="council", institution="TMA",
            method="scripts/benchmark/lightning_zonal.py: annual stroke density summed over the monthly climatology, mean of the 5-arc-minute cells touching the council",
            note="Activates the template's lightning indicator (listed as casualties, for which no register exists) with the physical hazard density; the Lake Victoria basin and the western and southern highlands show the highest densities.")
    activate("HA.NAT.LI-CAS", name="Lightning stroke density (WWLLN 2010-2021)", unit="strokes/km2/yr", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", vals=[v for v in li.values() if v is not None],
             basis="Template indicator 'Lightning casualties' activated with the stroke density; range resolved from the Tanzanian data", source="WWLLN/WGLC")

# ------------------------------------------------------------------------------ road accidents
# Crashes where they happen: the density of recorded crashes per 100 km2, each police region's crashes shared
# among its councils by population (scripts/benchmark/road_crashes.py), so the big cities, where people and
# traffic are densest, carry the highest values (10 October 2026: the user asked for the big cities; the death
# rate per 100,000 it replaces put the rural highway regions first and Dar es Salaam among the lowest).
acc_rows = read("road_crashes_councils.csv")
acc = {r["code"]: num(r["crashes_per_100km2"]) for r in acc_rows}
details["road-crashes"] = {r["code"]: f"crashes:{r['police_region']}/{float(r['region_crashes_per_yr']):g}/{float(r['crashes_per_yr']):g}" for r in acc_rows}
dataset("road-crashes", "HA.HUM.ACC", acc, level="council", unit="crashes per 100 km2",
        source="NBS and Tanzania Police Force, Crime and Traffic Incidents Statistics January-December 2024 and 2025, Table 3.4 (recorded road traffic crashes by police region); 2022 PHC council populations; council land areas",
        dataset_name="Recorded road traffic crashes per 100 km2 of land a year, mean of 2024 and 2025", period="2024-2025", resolution="council (each police region's crashes shared among its councils by population; the Dar es Salaam and Zanzibar police regions are city-level)", institution="TPF",
        method="scripts/benchmark/road_crashes.py: each police region's recorded crashes (mean of 2024 and 2025) shared among its councils in proportion to their 2022 census population, divided by the council's land area (scripts/benchmark/land_area.py)",
        note="Activates the template's vehicle-accidents indicator with where crashes happen: the density of crashes is highest in the big cities (Zanzibar Town, the Dar es Salaam municipalities, Moshi, Mbeya, Mwanza, Arusha), where most road-traffic injuries occur (65.7% of 7,092 injured patients in Sawe et al. 2021, Emergency Medicine International, doi:10.1155/2021/4272781). Police records count serious crashes; until 2019 they also counted injury and damage-only crashes, of which Dar es Salaam recorded more than half (NBS 2018, 2019).")
activate("HA.HUM.ACC", name="Road traffic crashes per 100 km2 (police records 2024-2025, shared by population)", unit="crashes per 100 km2", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", transform="Logarithm", vals=[v for v in acc.values() if v is not None],
         basis="Template indicator 'Vehicle Accidents' activated with the density of recorded crashes; log-transformed, as the workbook does for its counts; range resolved from the Tanzanian data", source="NBS/TPF")

# ------------------------------------------------------------------------- hazardous material
# Sites that produce, store, process or dispose of hazardous materials (scripts/benchmark/hazmat_sites.py from
# OpenStreetMap, the 2022 census mapping and the NEMC certificates of July-September 2026).
hm_rows = read("hazmat_sites_councils.csv")
hm = {r["code"]: num(r["sites_per_100km2"]) for r in hm_rows}
details["hazmat-sites"] = {r["code"]: f"sites:{r['sites']}/{r['fuel']}/{r['industrial']}/{r['mining']}/{r['waste_energy']}/{r['health']}/{r['nemc_2026']}" for r in hm_rows if int(r["sites"])}
dataset("hazmat-sites", "HA.HUM.HMAT", hm, level="council", unit="sites per 100 km2",
        source="OpenStreetMap (Overpass API, 10 October 2026, ODbL); NBS 2022 Population and Housing Census mapping (small-scale industries, hospitals); NEMC environmental certificates (EIA and audit) issued July-September 2026",
        dataset_name="Sites that produce, store, process or dispose of hazardous materials per 100 km2 of land: fuel and gas installations, mines and mineral processing, factories and industrial areas, waste and thermal power sites, hospitals",
        period="2022-2026", resolution="council", institution="NEMC",
        method="scripts/benchmark/osm_hazmat.py (OpenStreetMap installations), nemc_certificates.py (the NEMC monthly certificate lists read, placed in their council from the ward and classified) and hazmat_sites.py: mapped points closer than 100 m are one site; certificates added by council; sites divided by the council's land area",
        note="Activates the template's hazardous-material indicator. The cities and their industrial corridors lead (Dar es Salaam, Zanzibar Town, Moshi, Mwanza and Ilemela, Arusha, Tanga, Mbeya, Morogoro, Kibaha and Mkuranga), followed by the gold-mining councils, where the NEMC lists certify carbon-in-pulp plants and tailings facilities. NEMC's Lake Victoria roadmap for Mwanza City (2023) counts 51 industries there and names the Nyashishi river as the carrier of industrial effluent into the lake. A site counts once whatever its size.")
activate("HA.HUM.HMAT", name="Hazardous-material sites per 100 km2 (OpenStreetMap, 2022 census, NEMC 2026)", unit="sites per 100 km2", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", transform="Logarithm", vals=[v for v in hm.values() if v is not None],
         basis="Template indicator 'Hazardous Material' activated with the density of hazardous-material sites; log-transformed, as the workbook does for its counts; range resolved from the Tanzanian data", source="OSM/NBS/NEMC")

# ---------------------------------------------------------------------------------- food security
ipc_rows = read("ipc_2026_councils.csv")
fs = {r["code"]: num(r["phase2plus_pct"]) for r in ipc_rows}
details["ipc-phase2plus"] = {r["code"]: f"ipc:{r['ipc_district']}/{int(float(r['area_phase']))}" for r in ipc_rows}
details["ipc-area-phase"] = dict(details["ipc-phase2plus"])
dataset("ipc-phase2plus", "VU.SE.LV-FS", fs, level="council", unit="%",
        source="IPC Tanzania Acute Food Insecurity Analysis, April 2026 (MUCHALI with the IPC Global Support Unit), population table for February-May 2026",
        dataset_name="Share of the analysed population in IPC Phase 2 or worse, by district", period="February-May 2026", resolution="district (both councils of a district)", institution="MUCHALI",
        method="build-benchmark.py from ipc_2026_districts.csv: 100 minus the Phase 1 share; districts matched to councils by the registry's district",
        note="Replaces the workbook's food-security values (0 in 127 councils, 149% in one, data note DN-06) for the 30 analysed districts; the reference range is re-resolved to 0-100%.")
respec["VU.SE.LV-FS"] = {"resolved_min": 0, "resolved_max": 100, "basis": "The workbook resolved this percentage's range from its own data (0 to 149); a share of population runs from 0 to 100"}
phase = {c: 1.0 for c in CODES}
for r in ipc_rows:
    phase[r["code"]] = float(r["area_phase"])
dataset("ipc-area-phase", "VU.SE.LV-IPC", phase, level="council", unit="phase",
        source="IPC Tanzania Acute Food Insecurity Analysis, April 2026 (area classification); districts outside the analysis were not flagged by the national MUCHALI screening of production shortfalls and are classified Minimal (Phase 1)",
        dataset_name="IPC area phase (1 Minimal to 5 Famine), February-May 2026", period="February-May 2026", resolution="district", institution="MUCHALI",
        method="build-benchmark.py: the report's area phase for the 30 analysed districts (Crisis where 20% or more of the population is in Phase 3 or worse); Phase 1 elsewhere",
        note="Activates the template's IPC classification indicator on the IPC's own 1-5 scale.")
activate("VU.SE.LV-IPC", name="IPC acute food insecurity area phase", unit="phase (1-5)", keyed_at="Adm2", sign="Increase Risk", normalisation="Fixed (IPC scale)", vals=[], fixed=(1, 5),
         basis="Template indicator 'Food Security - IPC Classification' activated on the IPC area-phase scale", source="IPC/MUCHALI")

# ----------------------------------------------------------------------------------------- census
cen = {r["code"]: r for r in read("census2022_councils.csv")}
CENSUS_SRC = "NBS, 2022 Population and Housing Census, Regional Basic Demographic and Socio-Economic Profile reports (31 regions, 2024-2026)"
elec = {c: num(cen[c]["lighting"]) for c in CODES}
details["census-electricity"] = {c: "grid" for c in CODES if cen[c].get("lighting_source") == "grid only"}
dataset("census-electricity", "CC.INF.COM-ELEC", elec, level="council", unit="%", source=CENSUS_SRC,
        dataset_name="Households whose main source of lighting is electricity (grid, solar or generator), Table 12.10 of each regional profile", period="2022", resolution="council", institution="NBS",
        method="scripts/benchmark/census_profiles.py: grid (TANESCO) + solar + generator shares of households by council; where a profile gives only the grid share by council (Pwani, Ruvuma) that share is used",
        note="Replaces the workbook's regional Global Data Lab values (Dodoma 100%, data note DN-08) with the census by council.")
phone = {c: num(cen[c]["phone"]) for c in CODES}
dataset("census-phone", "CC.INF.COM-PHONE", phone, level="council", unit="%", source=CENSUS_SRC,
        dataset_name="Persons aged 15 and above owning a mobile phone, Table 13.2 of each regional profile", period="2022", resolution="council", institution="NBS",
        method="scripts/benchmark/census_profiles.py: 'any mobile phone, both sexes' by council", note="Replaces the workbook's regional values with the census by council (persons rather than households).")
lit = {c: num(cen[c]["literacy"]) for c in CODES}
dataset("census-literacy", "CC.INF.EDU-ALIT", lit, level="council", unit="%", source=CENSUS_SRC,
        dataset_name="Literacy rate of persons aged 15 and above, 2022, Table 8.5 (8.3 for Dar es Salaam) of each regional profile", period="2022", resolution="council", institution="NBS",
        method="scripts/benchmark/census_profiles.py: 2022 census, both sexes, by council", note="Replaces the workbook's national literacy value with the census by council.")
fem = {c: num(cen[c]["femhh"]) for c in CODES}
dataset("census-female-headed", "VU.VG.ECO-FEMHH", fem, level="council", unit="%", source=CENSUS_SRC,
        dataset_name="Female-headed households, 2022, Table 4.4 of each regional profile", period="2022", resolution="council", institution="NBS",
        method="scripts/benchmark/census_profiles.py: 2022 share of households headed by a woman, by council", note="Activates the template's female-headed-households indicator with the census.")
activate("VU.VG.ECO-FEMHH", name="Female-headed households (2022 census)", unit="%", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", vals=[v for v in fem.values() if v is not None],
         basis="Template indicator activated with the census; range resolved from the Tanzanian data", source="NBS 2022 PHC")
dis = {c: num(cen[c]["disability"]) for c in CODES}
dataset("census-disability", "VU.VG.HC-DISAB", dis, level="council", unit="%", source=CENSUS_SRC,
        dataset_name="Disability prevalence (persons aged 7 and above), Table 10.2 of each regional profile", period="2022", resolution="council", institution="NBS",
        method="scripts/benchmark/census_profiles.py: prevalence, both sexes, by council", note="Activates the template's disability indicator with the census.")
activate("VU.VG.HC-DISAB", name="People living with disabilities (2022 census)", unit="%", keyed_at="Adm2", sign="Increase Risk", normalisation="Data range", vals=[v for v in dis.values() if v is not None],
         basis="Template indicator activated with the census; range resolved from the Tanzanian data", source="NBS 2022 PHC")

# ------------------------------------------------------------------------------------- landslide
ls_rows = {r["code"]: r for r in read("landslide_wb_ranks.csv")}
uk = [c for c in CODES if NAME_OF[c].startswith("Ukerewe")]
details["landslide-ukerewe"] = {c: "nocell" for c in uk}
dataset("landslide-ukerewe", "HA.NAT.LS-EXP", {c: 0.0 for c in uk}, level="council", unit="fraction of area", source="World Bank/GFDRR Global Landslide Hazard Map (Arup 2021), threshold ranks raster LS_TH_COG.tif",
        dataset_name="Share of the council's area in rank 3 or 4 (medium to high landslide hazard)", period="1980-2018", resolution="council", institution="GST",
        method="build-benchmark.py from landslide_wb_ranks.csv: the island has no valid hazard cell in the global map (every cell is water/no-data, which the workbook counted as fully exposed); the share of medium-to-high cells is 0",
        note="Replaces the workbook's Ukerewe value (1.0, the national maximum, data note DN-04); the global map's own ranks reproduce the workbook for the other councils (r = 0.77 with the share of rank 3-4 cells).")

# ------------------------------------------------------------------------- institutional (DRR, governance)
# The councils' DRM arrangements and committee criteria from the published PMO-DMD lists
# (data-source/drr_status.csv: region, district and council rows), scored as src/engine/risk/institutional.ts
# does; the same flags are written to src/data/tanzania-councils-drr.json for the profiles, and an approved
# committee record supersedes them through the Data portal.
DRR_CRITERIA = ["eprp", "rvca", "ert", "eocc", "training"]
GOV_CRITERIA = ["committee", "stakeholders", "involvement"]
REGISTRY = {r["code"]: r for r in csv.DictReader(open(ROOT / "data-source" / "council_registry.csv", encoding="utf-8"))}
drr_rows = list(csv.DictReader(open(ROOT / "data-source" / "drr_status.csv", encoding="utf-8")))
by_region = {place_key(r["region"]): r for r in drr_rows if r["level"] == "region"}
by_district = {(place_key(r["name"]), place_key(r["region"])): r for r in drr_rows if r["level"] == "district"}
by_council = {(place_key(r["name"]), place_key(r["region"])): r for r in drr_rows if r["level"] == "council"}
council_drr: dict[str, dict] = {}
drr_sources: dict[str, str] = {}
for c in CODES:
    reg = REGISTRY[c]
    rr = by_region.get(place_key(reg["region"]))
    dr = by_district.get((place_key(reg["district"]), place_key(reg["region"])))
    cr = by_council.get((place_key(reg["name"]), place_key(reg["region"])))
    flag = lambda key, *rows: any((r or {}).get(key) == "1" for r in rows)
    assessed = lambda key, *rows: next((True if r[key] == "1" else False for r in rows if r and r.get(key) in ("0", "1")), None)
    f: dict = {"eprp": flag("eprp", cr, dr), "rvca": flag("rvca", cr, dr), "aa": flag("aa", cr, dr), "ert": flag("ert", cr, rr), "eocc": flag("eocc", cr, rr), "training": flag("training", cr, dr, rr)}
    for key, rows in (("eprpYear", (cr, dr)), ("rvcaYear", (cr, dr))):
        y = next(((r or {}).get(key[:4] + "_year") for r in rows if (r or {}).get(key[:4] + "_year")), None)
        if y: f[key] = int(y)
    for key in GOV_CRITERIA:
        v = assessed(key, cr, dr, rr)
        if v is not None: f[key] = v
    council_drr[c] = f
    drr_sources[c] = "; ".join(dict.fromkeys(r["source"] for r in (cr, dr, rr) if r))
# Compact form for the application (model.ts expands it): one token per flag, e eprp, r rvca, a aa, t ert,
# o eocc, g training (present = in place, a year may follow e or r); C/c S/s I/i the committee criteria
# met / not met (absent = not assessed).
LETTER = {"eprp": "e", "rvca": "r", "aa": "a", "ert": "t", "eocc": "o", "training": "g"}
GOV_LETTER = {"committee": "c", "stakeholders": "s", "involvement": "i"}
def compact(f: dict) -> str:
    toks = [LETTER[k] + (str(f[k + "Year"]) if f.get(k + "Year") else "") for k in LETTER if f.get(k)]
    toks += [GOV_LETTER[k].upper() if f[k] else GOV_LETTER[k] for k in GOV_LETTER if k in f]
    return "".join(toks)
(ROOT / "src" / "data" / "tanzania-councils-drr.json").write_text(json.dumps({c: compact(f) for c, f in council_drr.items()}, separators=(",", ":")) + "\n", encoding="utf-8")
arr = {c: round(100 * sum(1 for k in DRR_CRITERIA if council_drr[c].get(k)) / len(DRR_CRITERIA), 1) for c in CODES}
# Detail codes as src/engine/risk/institutional.ts writes them: drr: + the letters of the arrangements in
# place (a year after e or r); gov: + the assessed criteria, upper case met, lower case not met.
DRR_LETTER = {"eprp": "e", "rvca": "r", "ert": "t", "eocc": "o", "training": "g"}
GOV_LETTER = {"committee": "c", "stakeholders": "s", "involvement": "i"}
def drr_detail(f):
    return "drr:" + "".join(DRR_LETTER[k] + (str(f[k + "Year"]) if f.get(k + "Year") else "") for k in DRR_CRITERIA if f.get(k))
details["drr-arrangements"] = {c: drr_detail(council_drr[c]) for c in CODES}
dataset("drr-arrangements", "CC.INS.DRR-ARR", arr, level="council", unit="% of 5 arrangements",
        source="PMO-DMD lists of district emergency preparedness and response plans and regional emergency operation centres and response teams (shared June 2026; communication of 10 October 2026), with the published launches and trainings of 2023-2026 (Kinondoni 2023; Mwanza, Mbeya, Arusha, Dodoma 2026) and TMA's bimodal rainfall areas for the trained teams",
        dataset_name="DRM arrangements in place: share of five (EPRP, RVCA, trained ERT, EOCC, DRR training of the committee)", period="2015-2026", resolution="council (plans and assessments by district; teams, centres and training by region)", institution="PMO",
        method="build-benchmark.py from drr_status.csv: a council has its district's plan and assessment, its region's team, centre and training; an arrangement not listed is not in place (the registers are PMO-DMD's own); the share of the five, as src/engine/risk/institutional.ts scores an approved committee record",
        note="Adds a Tanzanian indicator to the workbook's DRR implementation group beside its two national ones (Sendai score, anticipatory-action coverage), so that a council's own preparedness lowers its lack of coping capacity and, through the council means, its region's and the country's (decision of 10 October 2026). The national value is high while the registers are incomplete and falls as PMO-DMD records more districts.")
activate("CC.INS.DRR-ARR", name="DRM arrangements in place (EPRP, RVCA, trained ERT, EOCC, DRR training)", unit="% of 5 arrangements", keyed_at="Adm2", sign="Decrease Risk", normalisation="Fixed (0 to 100)", vals=[], fixed=(0, 100),
         basis="Tanzanian indicator in the DRR implementation component: the share of five arrangements, on a fixed 0 to 100 scale (all in place scores 0 lack of coping)", source="PMO-DMD",
         place={"dimension": "Coping Capacity", "category": "Institutional", "component": "DRR implementation"})
def gov_share(f):
    assessed_keys = [k for k in GOV_CRITERIA if k in f]
    return round(100 * sum(1 for k in assessed_keys if f[k]) / len(assessed_keys), 1) if assessed_keys else None
gov = {c: gov_share(council_drr[c]) for c in CODES}
details["committee-functioning"] = {c: "gov:" + "".join(GOV_LETTER[k].upper() if council_drr[c][k] else GOV_LETTER[k] for k in GOV_CRITERIA if k in council_drr[c]) for c in CODES if gov[c] is not None}
dataset("committee-functioning", "CC.INS.GOV-DMC", gov, level="council", unit="% of assessed criteria",
        source="PMO-DMD assessment communicated 10 October 2026 (stakeholder collaboration in the big cities; involvement in DRR issues in Arusha, Mwanza and Pwani) and the published committee trainings of 2023-2026; to be confirmed and completed by the committees through the Data portal",
        dataset_name="Disaster management committee functioning: share of the assessed criteria met (committee active, stakeholder collaboration, involvement in DRR)", period="2023-2026", resolution="council (criteria assessed by region or council)", institution="PMO",
        method="build-benchmark.py from drr_status.csv: a criterion recorded 1 or 0 is assessed; the share of the assessed criteria met; a council with no assessed criterion has no value (the group keeps the workbook's two indicators), as src/engine/risk/institutional.ts scores an approved committee record",
        note="Adds a Tanzanian indicator to the workbook's Governance group beside its national government-effectiveness score and regional corruption index. The legal framework (the Disaster Management Act 2022 and the policy) is the same everywhere and is not scored; the differences PMO-DMD sees are in collaboration and involvement.")
activate("CC.INS.GOV-DMC", name="Disaster management committee functioning (active, stakeholder collaboration, involvement in DRR)", unit="% of assessed criteria", keyed_at="Adm2", sign="Decrease Risk", normalisation="Fixed (0 to 100)", vals=[], fixed=(0, 100),
         basis="Tanzanian indicator in the Governance component: the share of the assessed committee criteria met, on a fixed 0 to 100 scale", source="PMO-DMD",
         place={"dimension": "Coping Capacity", "category": "Institutional", "component": "Governance"})

# ---------------------------------------------------------------------------------- displacement
idus = json.load(open(BM / "idmc_idus_tza.json", encoding="utf-8"))
regions = sorted({c["reg"] for c in INDEX})
tokens = {place_key(r): r for r in regions}
tokens.update({"daressalaam": "Dar es Salaam", "coast": "Pwani"})
# district names that identify a region when the region itself is not named
district_region = {place_key(c["name"].replace(" District", "").replace(" Town", "").replace(" Municipal", "").replace(" City", "")): c["reg"] for c in INDEX}
flows: dict[str, float] = {r: 0.0 for r in regions}
events: dict[str, int] = {r: 0 for r in regions}
used = 0
for r in idus:
    d = r.get("displacement_date") or ""
    if not ("2023-01-01" <= d <= "2025-12-31") or r.get("displacement_type") != "Disaster":
        continue
    fig = num(r.get("figure"))
    if not fig:
        continue
    hits: list[str] = []
    for part in str(r.get("locations_name") or "").split(";"):
        names = [place_key(x) for x in part.split(",")]
        region = next((tokens[n] for n in names if n in tokens), None) or next((district_region[n] for n in names if n in district_region), None)
        if region and region not in hits:
            hits.append(region)
    if not hits:
        continue
    used += 1
    for h in hits:
        flows[h] += fig / len(hits)
        events[h] += 1
STOCK_2024 = 75117  # IDMC GIDD: disaster IDPs in Tanzania at the end of 2024
total = sum(flows.values())
idp = {f"R-{place_key(r)}": round(STOCK_2024 * flows[r] / total) for r in regions}
details["idmc-idp"] = {f"R-{place_key(r)}": f"events:{events[r]}" for r in regions if events[r]}
dataset("idmc-idp", "VU.VG.DP-IDP", idp, level="region", unit="people", source="IDMC Global Internal Displacement Database (disaster IDP stock, end of 2024) and IDMC Internal Displacement Updates for Tanzania 2023-2025 (event locations and figures), external API",
        dataset_name="Disaster IDPs at the end of 2024 allocated to regions by the location of the 2023-2025 displacement events", period="2023-2025 events; stock end-2024", resolution="region", institution="PMO",
        method=f"build-benchmark.py: {used} displacement updates with a region or district in their location; an update naming several regions is split equally; the national stock of {STOCK_2024:,} is allocated in proportion to each region's share of the 2023-2025 displacements; regions without a recorded displacement 0",
        note="Replaces the workbook's displacement values (the national stock of 30,080 written on Kaskazini Unguja alone, Manyara 0 after the Hanang landslide; data note DN-07) with a documented regional allocation of IDMC's own figures.")

# --------------------------------------------------------------------------------------- output
# Compact form: each dataset's metadata once, its values as {unitId: value}. The engine rebuilds the
# full records (benchmark.ts); the file stays a few tens of kilobytes instead of a megabyte of repeated
# strings in the application's first download.
compact_values: dict[str, dict[str, float]] = {}
for key, d in datasets.items():
    compact_values[key] = {v["unitId"]: v["value"] for v in values if v["specId"] == d["indicator"] and v["dataset"] == d["dataset"]}
    assert len(compact_values[key]) == d["values"], key
out = {
    "release": RELEASE,
    "layer": "benchmark",
    "built": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
    "at": AT,
    "note": "Benchmark 2026: institutional values prepared from public, citable datasets for the indicators the SADC workbook leaves empty or carries with values that failed validation. Applied by the engine as approved institutional values (lineage shown), supersedable through the data portal; the workbook itself is unchanged.",
    "activations": activations,
    "respec": respec,
    "datasets": datasets,
    "values": compact_values,
    "details": {k: v for k, v in details.items() if v},
}
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
flat = BM / "BENCHMARK_2026_values.csv"
with open(flat, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["specId", "unitId", "unit_name", "level", "value", "dataset", "period", "institution", "source"])
    for v in values:
        w.writerow([v["specId"], v["unitId"], NAME_OF.get(v["unitId"], v["unitId"]), v["level"], v["value"], v["dataset"], v["period"], v["institution"], v["source"]])
# ---------------------------------------------------------------------------------- documentation
DOC = ROOT / "docs" / "BENCHMARK_2026.md"
lines = [
    "# Benchmark 2026: the institutional dataset behind the Core",
    "",
    f"Release `{RELEASE}`, values dated {AT[:10]}. Built by `python3 scripts/build-benchmark.py` from `data-source/benchmark_2026/` (each input produced by a script in `scripts/benchmark/` from the public source named below) into `src/data/tanzania-benchmark-2026.json`, which the engine applies as approved institutional values (`src/engine/risk/benchmark.ts`, `model.ts`).",
    "",
    out["note"],
    "",
    "## What the benchmark does",
    "",
    "- The workbook (INFORM Sub-national SADC 2024) is never changed: `buildModel({}, { workbookOnly: true })` still builds it exactly, and the parity tests prove it.",
    "- A benchmark value is an approved institutional value of its date. It shows its lineage wherever it is displayed, it lifts the quarantine of the workbook value it replaces, and an institution supersedes it through the data portal (the more recent approved value wins).",
    "- Template indicators the workbook lists without data are activated with a Tanzanian definition (unit, keyed level, direction, normalisation and reference range), as the workbook's Metadata sheet does for every indicator in use. The reference range of an activated indicator is resolved from the Tanzanian data, the workbook's own rule for its 'Data range' indicators.",
    "- The data portal's tools carry the activated indicators as ordinary columns (`scripts/build-collection-tool.py`), and `inform_sheets/INFORM_TZ_Collection_Benchmark_2026.xlsx` is the tool with the benchmark values filled in (green cells), the version institutions continue from.",
    "",
    "## Datasets",
    "",
    "| Indicator | Dataset | Source | Period | Resolution | Values | Institution |",
    "|---|---|---|---|---|---|---|",
]
for k, d in datasets.items():
    lines.append(f"| `{d['indicator']}` {d['name'] or ''} | {d['dataset']} | {d['source']} | {d['period']} | {d['resolution']} | {d['values']} ({d['level']}) | {d['institution']} |")
lines += ["", "### Methods", ""]
for k, d in datasets.items():
    lines.append(f"- **{d['indicator']}** ({k}): {d['method']}. {d['note']}")
lines += ["", "## Activated template indicators", "", "| Indicator | Tanzanian definition | Unit | Keyed at | Direction | Normalisation | Range | Basis |", "|---|---|---|---|---|---|---|---|"]
for sid, a in activations.items():
    lines.append(f"| `{sid}` | {a['name']} | {a['unit']} | {a['keyed_at']} | {a['sign']} | {a['normalisation']} | {a['resolved_min']} to {a['resolved_max']} | {a['basis']} |")
lines += ["", "## Re-resolved reference ranges", ""]
for sid, r in respec.items():
    lines.append(f"- `{sid}`: {r['resolved_min']} to {r['resolved_max']}. {r['basis']}.")
lines += ["", "## What remains without a dataset", "", "- Zoonoses, plants and pests (HA.NAT.ZPP-AD, ZPP-PD, ZPP-PE): no validated national dataset at council level yet; the group stays empty and is excluded from the hazard mean, as INFORM treats missing data. Candidate sources are listed in the register (issue DATA-05).", "- Internal violence (HA.HUM.VIO-EVE, VIO-FAT): withheld from the live model by programme decision (data note DN-12); the workbook keeps its ACLED counts.", "- DRR training of the committees and the committee criteria are recorded for a few regions and councils so far: the registers of PMO-DMD and the committees' records through the Data portal complete them.", "- Agricultural drought frequency for the five Dar es Salaam councils stays withheld (not applicable to a city; data note DN-01).", ""]
DOC.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"{RELEASE}: {len(values)} values, {len(datasets)} datasets, {len(activations)} activations, {len(respec)} re-specified; wrote {DOC.relative_to(ROOT)}")
for k, d in datasets.items():
    print(f"  {k:24s} {d['indicator']:18s} {d['values']:4d} values  {d['unit']}")
print("activations:", {k: (v['resolved_min'], v['resolved_max']) for k, v in activations.items()})
print("IDP by region:", {k: v for k, v in idp.items() if v})
