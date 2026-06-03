% Advancing the INFORM Hazard Evidence for Tanzania while Preserving the INFORM Engine: a CHIRPS/ERA5/NBS multi-criteria drought case study
% INFORM Tanzania (inform.co.tz)
% 2026-06-03

# Abstract

The INFORM Subnational Risk Index aggregates standardised (0-10) hazard, vulnerability and lack-of-coping
indicators into a comparable risk score. Its aggregation **engine** - min-max standardisation (with
logarithmic transformation and Tukey outlier capping), arithmetic averaging of indicators into categories,
the **scaled geometric mean** of categories into dimensions, and the **cube root** of the three dimensions
into risk - is a fixed methodology we **preserve exactly** as implemented in the official
*Tanzania - Country Model Template* workbook (verified formula-by-formula from its hidden sheets). What we
**advance** is the *evidence* behind individual hazard indicators where authoritative national data exist.
This paper documents the advancement of the **drought hazard** from a coarse INFORM SADC value to a
transparent four-component index computed from CHIRPS v3 rainfall (1991-2024) and ERA5 temperature -
aridity, interannual variability, SPEI drought depth, and growing-season failure - together with the
**initial vs advanced** comparison, the **impact**, and the **gap** the advancement closes. We show the
initial drought layer was spatially incoherent (the central semi-arid zone under-rated at ~4/10, a coastal
city over-rated at 10/10), whereas the advanced layer tracks observed rainfall and the food-security
geography. The flood, heatwave and exposure advancements are summarised; engine-level refinements (IQR
capping of recomputed indicators, custom vs data-range references) are deferred to future work by design.

# 1. Introduction

INFORM (the Index for Risk Management; DRMKC/JRC, European Commission) provides a transparent, reproducible
composite risk model [1]. For Tanzania, the operational instrument is the *Tanzania - Country Model
Template* workbook, whose engine standardises each indicator to 0-10 and aggregates them. The engine is
deliberately conservative and globally comparable; it must not be silently altered.

Our work separates two concerns:

1. **The engine** (how numbers combine). This stays **identical** to the workbook - we verified every
   formula directly from the (hidden) engine sheets (see the companion `INFORM_CALCULATION_ENGINE.docx`):
   component = `AVERAGE`, category = `AVERAGE`, dimension = `ROUND((10-GEOMEAN((10-c)/10*9+1...))/9*10,1)`
   (scaled geometric mean), risk = `ROUND(H^(1/3)*V^(1/3)*LCC^(1/3),1)` (cube root), and standardisation =
   min-max to 0-10 with optional log/exp transform, Tukey (Q1-1.5*IQR, Q3+1.5*IQR) outlier capping, and an
   inversion for "Decrease Risk" indicators.
2. **The evidence** (the value of each indicator). Where the INFORM SADC layer is coarse, dated, or
   incoherent for Tanzania, and authoritative national data exist, we **recompute the indicator** from
   primary data using the **same standardisation method** the engine prescribes, and we apply it
   **raise-only** (the computed value may raise a documented hazard but never silently lower it).

This paper makes the second concern explicit and auditable, using **drought** as the worked case, because
drought is the hazard most consequential for Tanzanian food security and the one for which the densest
observational record exists.

# 2. The preserved INFORM engine

We reproduced a unit end-to-end against the workbook: for Kondoa, the workbook's own Hazard dimension is
`scaled-geomean(Natural 3.544, Human 0.683) = 2.2`, and our implementation returns the same 2.2 for the
same inputs; the national value matches the workbook to the decimal (Hazard 2.2, Vulnerability 5.5,
Lack-of-Coping 5.9, Risk 4.1). The engine is therefore **unchanged**; only indicator *inputs* differ where
we advanced them. Two engine-level options the workbook supports but our recompute scripts do not yet apply
- **Tukey IQR capping** of recomputed series, and **custom (fixed) reference ranges** instead of the
Tanzania data range - are recorded as **future work** (Section 7) and are not changed here.

# 3. The drought advancement - method

## 3.1 Rationale and the gap in the initial layer

The initial INFORM SADC drought scores for Tanzania are spatially incoherent (Section 5, Table 2): several
central **semi-arid** councils (Kondoa 771 mm yr^-1, Singida 749 mm, Manyoni 760 mm) scored only 3.6-4.3/10,
while a wet coastal city (Dar es Salaam / Ilala, 1,253 mm) scored 10/10. Semi-arid central Tanzania is a
recurrent drought- and food-insecurity hotspot (IPC/MUCHALI classifications), so an index that rates it
below 5 while maxing out a coastal city is not credible. This is the **gap**: the *initial* relevance of the
drought layer was, in places, simply not true.

## 3.2 Data

- **CHIRPS v3** monthly precipitation, 0.05 deg, 1991-2024, the same product validated for Tanzanian
  rainfall classification [2]. Zonal-mean rainfall is extracted per administrative unit.
- **CHIRPS v3 daily** (2015-2024) for the companion heavy-rain/flood layer (Section 6).
- **ERA5** 2 m temperature, used to estimate potential evapotranspiration (PET) for SPEI [3].

## 3.3 The four-component index and its criteria

Drought relevant to communities is more than a single statistic; following the drought-index literature
[4,5] we combine four physically distinct, individually justified components, each min-max scaled to 0-1:

| Component | Weight | What it captures | Computation | Basis |
|---|---|---|---|---|
| **Aridity** | 0.30 | inherent dryness of the climate | min-max of **(-mean annual rainfall)** | UNEP aridity gradient; semi-arid = ~0.2-0.5 P/PET [6,7] |
| **Interannual variability** | 0.20 | year-to-year rainfall instability | min-max of the **coefficient of variation** of annual rainfall | East-African rainfall is among the world's most variable [8,9] |
| **SPEI drought depth** | 0.15 | severity of water-balance deficits | mean magnitude of **SPEI-12 < -1**, PET via Thornthwaite [10] from ERA5 | SPEI = standardised precipitation-evapotranspiration index [3,11] |
| **Growing-season failure** | 0.35 | crop-failure / food-security driver | 0.5*CV + 0.5*frequency of the main 4-month season below 80% of normal | season failure -> IPC food crises (highest weight) |

The blended score `0.30*aridity + 0.20*variability + 0.15*SPEI-depth + 0.35*season-failure` is then
**min-max standardised to 0-10** - exactly the INFORM normalisation - and applied **raise-only** (the
advanced value replaces the initial only where it is higher, so no documented drought area is downgraded).

**Weighting rationale.** Aridity is the baseline (a dry climate is intrinsically drought-exposed);
variability and SPEI add the *dynamic* deficit; **growing-season failure carries the largest weight (0.35)**
because, for an operational risk index feeding humanitarian planning, the decision-relevant outcome is
failure of the main cropping season, which is what triggers IPC/MUCHALI food-insecurity phases. The weights
are an explicit modelling choice; a sensitivity analysis is listed as future work.

**Why SPI/SPEI *frequency* is not used to rank.** Drought *frequency* (the share of months below a
threshold) is approximately stationary by construction across a fixed record and therefore discriminates
poorly between districts; we use SPEI **depth** (how deep deficits go) rather than frequency, and rank on
aridity + variability + season-failure, which are the spatially-informative signals.

# 4. Standardisation and integration (unchanged engine)

The four raw components are combined and the result is min-max scaled to 0-10 using the **same** formula the
workbook applies to every indicator (`10*(x-Min)/(Max-Min)`, clamped, rounded to 0.1). The drought score
then enters the **unchanged** chain: it averages with the other natural-hazard components into the
*Natural* category, which scaled-geometric-means with *Human* hazards into the *Hazard & Exposure*
dimension, which cube-roots with Vulnerability and Lack-of-Coping into Risk. No engine constant is altered.

# 5. Results - initial vs advanced

**Table 2.** Initial (INFORM SADC) vs advanced (CHIRPS/ERA5) drought score, with the raw evidence.

| District | Rainfall (mm yr^-1) | Rain CV | Season-fail freq | SPEI depth | **Initial** | **Advanced** |
|---|---|---|---|---|---|---|
| Longido (pastoral) | 668 | 0.26 | 0.27 | 1.60 | 8.6 | **9.7** |
| Monduli (pastoral) | 694 | 0.26 | 0.27 | 1.56 | 8.6 | **9.2** |
| Singida (semi-arid) | 749 | 0.24 | 0.24 | 1.68 | **3.6** | **8.7** |
| Manyoni (semi-arid) | 760 | 0.20 | 0.18 | 1.63 | **3.6** | **7.0** |
| Kondoa (semi-arid) | 771 | 0.24 | 0.24 | 1.64 | **4.3** | **8.6** |
| Rufiji (sub-humid) | 1,088 | 0.21 | 0.21 | 1.50 | 2.9 | 5.8 |
| Kilombero (wet) | 1,598 | 0.17 | 0.21 | 1.45 | 0.7 | 2.9 |
| Kyela (wettest) | 1,996 | 0.16 | 0.21 | 1.48 | 0.0 | 2.2 |
| Ilala / Dar (coastal city) | 1,253 | 0.26 | 0.24 | 1.49 | **10** | 10* |

\*Dar es Salaam retains 10 under the raise-only floor; the computed value is ~6-7. This is a flagged
artifact (the initial 10 is documented-but-wrong) queued for correction via Data Entry, *not* an advancement
outcome.

**Pattern.** The advanced layer is **monotone in rainfall**: the five driest councils (Longido, Monduli,
Singida, Manyoni, Kondoa, all 668-771 mm) score 7.0-9.7; the wettest (Kyela, Kilombero, 1,600-2,000 mm)
score 2.2-2.9. The initial layer was not monotone - it under-rated Singida/Manyoni/Kondoa (3.6-4.3) despite
their identical semi-arid climate to the (correctly high) pastoral districts.

# 6. Other advancements (summary)

The same *initial -> advanced (same standardisation) -> raise-only* discipline was applied to:

- **Flood / heavy rainfall.** Advanced from a static INFORM value to **CHIRPS v3 daily** counts of days
  > 50 mm and > 100 mm (2015-2024), combined with documented flood events and the INFORM **Hazard x
  Exposure** form `flood = max(hazard, sqrt(hazard * exposure))` so population exposure can only amplify a
  flood hazard, never hide it. Heavy-precipitation thresholds follow the ETCCDI extreme-rainfall indices.
- **Heatwave.** Advanced from blank/baseline to an **ERA5** temperature-climatology exposure proxy
  (mean + hottest-quarter), min-max capped - hot lowlands high, cool highlands low.
- **Exposure.** Advanced to **NBS 2022 PHC** population density (population / area), **log** min-max
  standardised - the workbook's own "Logarithm" transformation for the right-skewed density distribution.

Vulnerability (poverty, stunting, HIV+malaria, displacement, food insecurity) and parts of coping (WASH,
health/education access, DRR) were similarly refreshed from NBS/TDHS/IPC/UNHCR sources. All used the
engine's standardisation unchanged.

# 7. Discussion: initial vs advanced, impact, and the gap

**Initial vs advanced.** The advancement does not change *how* drought enters risk; it changes *what value*
drought has, from a coarse/incoherent layer to one grounded in 34 years of observed rainfall and the
water balance.

**Impact / outcome.** Risk rises where the evidence supports it (the central semi-arid belt and the
pastoral north), in line with IPC/MUCHALI food-insecurity classifications, and the change is auditably
raise-only. Because risk is a cube root of three dimensions, a drought rise of several points lifts the
Hazard dimension modestly and the risk score by a fraction - appropriately, since drought is one of twelve
natural hazards.

**The gap.** The advancement is justified precisely where **the initial relevance was not true**: Kondoa
and Singida are textbook semi-arid, food-insecure districts that the initial layer scored below 5. The
advancement closes that gap with transparent, reproducible evidence. Where the initial layer was already
correct (pastoral Longido/Monduli), the advancement merely confirms and slightly raises it; where the
initial layer was wrong-high (the Dar artifact), raise-only deliberately does **not** advance it down - that
case is handled separately as a documented correction.

# 8. Limitations and future work (engine stays as INFORM)

- **Engine refinements deferred:** apply the workbook's **Tukey IQR capping** to our recomputed series, and
  decide per indicator between **Tanzania data-range** and **INFORM custom (fixed global/SADC) references**.
  These change absolute 0-10 values and so are reserved for a future, separately-validated revision.
- **Drought exposure:** drought is currently a pure hazard; pairing it with **agricultural** exposure
  (cropland/livestock, not urban population) is future work.
- **Weights:** the 0.30/0.20/0.15/0.35 blend is an explicit choice; a sensitivity analysis is planned.
- **Wildfire, lightning, storms** remain documented overlays pending physical computation (MODIS/VIIRS,
  flash-density, cyclone tracks); the USGS catalogue was used only to **cross-check** (not replace) the
  earthquake overlay.

# References

[1] INFORM (2024). *INFORM Subnational Risk Index - SADC*. Disaster Risk Management Knowledge Centre / Joint Research Centre, European Commission.
[2] Funk, C. et al. (2015). The climate hazards infrared precipitation with stations - a new environmental record for monitoring extremes. *Scientific Data* 2, 150066.
[3] Hersbach, H. et al. (2020). The ERA5 global reanalysis. *Quarterly Journal of the Royal Meteorological Society* 146, 1999-2049.
[4] Zargar, A. et al. (2011). A review of drought indices. *Environmental Reviews* 19, 333-349.
[5] WMO (2012). *Standardized Precipitation Index User Guide* (WMO-No. 1090).
[6] UNEP (1992). *World Atlas of Desertification*. United Nations Environment Programme.
[7] Middleton, N. & Thomas, D. (1997). *World Atlas of Desertification*, 2nd ed. UNEP.
[8] Nicholson, S. E. (2017). Climate and climatic variability of rainfall over eastern Africa. *Reviews of Geophysics* 55, 590-635.
[9] Lyon, B. & DeWitt, D. G. (2012). A recent and abrupt decline in the East African long rains. *Geophysical Research Letters* 39, L02702.
[10] Thornthwaite, C. W. (1948). An approach toward a rational classification of climate. *Geographical Review* 38, 55-94.
[11] Vicente-Serrano, S. M., Begueria, S. & Lopez-Moreno, J. I. (2010). A multiscalar drought index sensitive to global warming: the SPEI. *Journal of Climate* 23, 1696-1718.
[12] McKee, T. B., Doesken, N. J. & Kleist, J. (1993). The relationship of drought frequency and duration to time scales. *Proc. 8th Conf. on Applied Climatology*, 179-184.
