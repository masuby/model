# Validating Hazards with Earth Observation (Sentinel-1 floods & beyond) — Plan

**Idea.** Our hazards are *computed* (CHIRPS rainfall, recorded events). The next level is to
**validate them against what satellites actually observed** — starting with **Sentinel-1 SAR
for floods**, because radar sees standing water *through cloud, day or night* (exactly when
floods happen and optical sensors are blind). Free, Copernicus. This turns "reported flood"
into "observed inundation extent + population flooded".

Build when it clearly helps and doesn't disrupt the live tool — this plan keeps it ready.

---

## 1. Sentinel-1 flood validation (first, highest value)

**Per recorded event** in `data-source/flood_events.csv`:
1. Pull Sentinel-1 GRD (VV+VH) **before** and **during/after** the event.
2. **Change detection**: open water drops backscatter sharply → threshold/Otsu on the
   post-minus-pre image → **inundation mask** (mask out permanent water with our waterbodies
   layer + slope).
3. Intersect the mask with district polygons → **observed flooded area** and, with the NBS
   2022 population grid, **people flooded**.
4. **Validate**: does our flood hazard / event index agree with observed extent? Calibrate the
   `event index` and the flood H×E from real inundation; flag mismatches in the manual.

**Data/compute options (no heavy infra needed to start):**
- **Copernicus Global Flood Monitoring (GFM)** / **Copernicus EMS Rapid Mapping** / **UNOSAT** —
  *ready-made* S1 flood footprints for major events → fastest validation, just overlay.
- **Google Earth Engine** or **Copernicus Data Space** — compute S1 change detection ourselves
  for events without a ready product (`rasterio`/GDAL already in this repo handle the rasters).

Output: `data-source/flood_events.csv` gains `observed_km2`, `people_flooded`, `eo_source`
columns; the flood indicator is calibrated to observation, not just rainfall.

---

## 2. Earth Observation per hazard (the menu)

| Hazard | EO product | Use |
|---|---|---|
| **Flood** | **Sentinel-1 SAR** (GRD), Copernicus GFM/EMS, UNOSAT | observed inundation extent & population flooded |
| **Drought** | MODIS/Sentinel-2 **NDVI / VHI**, FAO **ASI** (agric. stress) | cross-check rainfall drought with vegetation stress (crop-relevant → IPC) |
| **Landslide** | **Sentinel-1 InSAR** deformation + rainfall thresholds | slope movement hotspots (replace documented landslide) |
| **Wildfire** | **MODIS/VIIRS** active fire + burned area | replace INFORM-baseline wildfire with observed burns |
| **Coastal** | Sentinel-2 shoreline change, DEM + surge | erosion / inundation exposure |
| **Exposure** | **WorldPop / GHSL** settlement & built-up | refine population exposure beyond district density |

---

## 3. Validation workflow (generic)

```
computed indicator  ──┐
                      ├─▶ agreement metric (overlap / correlation) ─▶ keep | recalibrate | flag
EO observation     ──┘
```
- Where they agree → confidence ↑ (note it).
- Where they disagree → recalibrate weights **or** flag honestly in the manual (§8) and the map
  ("rainfall-based, not yet EO-validated").
- Every validated indicator records its **EO source + date** (fits the provenance + snapshot model).

---

## 4. Phases

- **Phase A — flood validation (start):** overlay Copernicus GFM/EMS footprints for the events
  already listed → `observed_km2` + `people_flooded` → calibrate the event index. Low effort,
  high credibility.
- **Phase B — drought cross-check:** MODIS VHI / FAO ASI seasonal vs our drought index; report
  agreement; surface agricultural-drought (ties to IPC/MUCHALI food security).
- **Phase C — wildfire & landslide:** VIIRS burned area → wildfire indicator; Sentinel-1 InSAR →
  landslide hotspots. Replaces two INFORM-baseline placeholders.
- **Phase D — monitoring:** Sentinel-1 auto flood alerts (new acquisition → inundation → district)
  feed the **snapshot** pipeline (see RISK_OVER_TIME_PLAN.md) → near-real-time emerging-flood risk.

---

## 5. Honest constraints

- Sentinel-1 revisit is ~6–12 days — it catches flood *peaks* if an overpass lands in the window;
  brief flash floods can be missed (combine with rainfall + reports).
- SAR confuses water with smooth dry surfaces (sand, tarmac) and is noisy in cities/vegetation —
  needs masking + care; ready-made GFM/EMS products already handle much of this.
- Processing S1 ourselves needs GEE/Copernicus access; **start with ready-made flood footprints**
  to get value immediately, add custom processing later.
- EO validates the *hazard*; risk still = ∛(H×V×LCC), so vulnerability & coping stay central.
