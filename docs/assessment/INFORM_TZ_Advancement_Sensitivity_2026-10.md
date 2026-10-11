# INFORM Tanzania: Advancement layer, sensitivity and validation (2026-10-10)

Computed by `scripts/advancement-sensitivity.mjs` with the engine (`src/engine/risk/advanced.ts`) on release `adv-2026.10` of the inputs, over the 195 councils. The Advancement layer is the Core (the INFORM SADC 2024 workbook) plus the Tanzanian sub-indicators, computed beside it; it is shown on request and the Core stays the headline. Issue ADV-04 asked for this report before Advancement scores inform decisions.

## 1. Core versus Advancement

| Measure | Value |
|---|---|
| National INFORM risk, Core | 4.10 |
| National INFORM risk, Advancement | 4.00 |
| Spearman rank correlation of council risk (Core vs Advancement) | 0.944 |
| Largest change of a council's risk | 0.4 |
| Councils changing risk class (SADC thresholds) | 34 of 195 |
| Councils changing hazard class | 40 of 195 |

Biggest movers (council risk, Core → Advancement):

| Council | Core | Advancement | Change |
|---|---|---|---|
| Kondoa District | 4.30 | 3.90 | -0.4 |
| Kondoa Town | 4.30 | 3.90 | -0.4 |
| Dar es Salaam City | 3.70 | 4.10 | +0.4 |
| Nkasi District | 5.10 | 4.70 | -0.4 |
| Mpwapwa District | 4.30 | 4.00 | -0.3 |
| Kongwa District | 4.10 | 3.80 | -0.3 |
| Dodoma City | 4.10 | 3.80 | -0.3 |
| Monduli District | 4.30 | 4.00 | -0.3 |
| Meru District | 4.40 | 4.10 | -0.3 |
| Arusha District | 4.40 | 4.10 | -0.3 |

## 2. Weight sensitivity

Each variant is compared with the baseline Advancement (the specification weights). ρ is the Spearman rank correlation of council risk; "max Δ" the largest change of any council's risk; the class columns count councils whose risk class or hazard class changes.

| Variant | ρ | max Δ risk | Risk class changes | Hazard class changes |
|---|---|---|---|---|
| Equal weights (every member 1) | 0.980 | 0.20 | 16 | 16 |
| HA.NAT.DR-SPEI × 0.5 | 0.998 | 0.10 | 0 | 4 |
| HA.NAT.DR-SPEI × 2 | 0.997 | 0.10 | 4 | 2 |
| HA.NAT.DR-SPEI left out | 0.996 | 0.10 | 3 | 5 |
| HA.NAT.DR-ARID × 0.5 | 0.997 | 0.10 | 1 | 2 |
| HA.NAT.DR-ARID × 2 | 0.996 | 0.10 | 7 | 7 |
| HA.NAT.DR-ARID left out | 0.995 | 0.10 | 4 | 6 |
| HA.NAT.DR-CV × 0.5 | 0.999 | 0.10 | 0 | 1 |
| HA.NAT.DR-CV × 2 | 0.998 | 0.10 | 3 | 1 |
| HA.NAT.DR-CV left out | 0.999 | 0.10 | 1 | 4 |
| HA.NAT.DR-SEAS × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.DR-SEAS × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.DR-SEAS left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.DR-NDVI × 0.5 | 0.999 | 0.10 | 1 | 1 |
| HA.NAT.DR-NDVI × 2 | 0.999 | 0.10 | 1 | 1 |
| HA.NAT.DR-NDVI left out | 0.999 | 0.10 | 1 | 2 |
| HA.NAT.DR-SOIL × 0.5 | 0.998 | 0.10 | 1 | 2 |
| HA.NAT.DR-SOIL × 2 | 0.998 | 0.10 | 3 | 3 |
| HA.NAT.DR-SOIL left out | 0.997 | 0.10 | 2 | 2 |
| HA.NAT.DR-WLEV × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.DR-WLEV × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.DR-WLEV left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-R50 × 0.5 | 0.996 | 0.10 | 6 | 3 |
| HA.NAT.FL-R50 × 2 | 0.994 | 0.10 | 6 | 7 |
| HA.NAT.FL-R50 left out | 0.992 | 0.10 | 10 | 9 |
| HA.NAT.FL-R100 × 0.5 | 0.997 | 0.10 | 5 | 2 |
| HA.NAT.FL-R100 × 2 | 0.996 | 0.10 | 2 | 3 |
| HA.NAT.FL-R100 left out | 0.996 | 0.10 | 7 | 3 |
| HA.NAT.FL-WLEV × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-WLEV × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-WLEV left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-BASIN × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-BASIN × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-BASIN left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-EVENT × 0.5 | 1.000 | 0.10 | 0 | 1 |
| HA.NAT.FL-EVENT × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.FL-EVENT left out | 1.000 | 0.10 | 0 | 1 |
| HA.NAT.LS-SUSC × 0.5 | 0.997 | 0.10 | 4 | 4 |
| HA.NAT.LS-SUSC × 2 | 0.997 | 0.10 | 2 | 4 |
| HA.NAT.LS-SUSC left out | 0.993 | 0.10 | 5 | 5 |
| HA.NAT.LS-RAIN × 0.5 | 0.996 | 0.10 | 3 | 2 |
| HA.NAT.LS-RAIN × 2 | 0.996 | 0.10 | 2 | 3 |
| HA.NAT.LS-RAIN left out | 0.993 | 0.10 | 5 | 5 |
| HA.NAT.ST-FREQ × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.ST-FREQ × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.ST-FREQ left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.ST-WIND × 0.5 | 0.997 | 0.10 | 1 | 5 |
| HA.NAT.ST-WIND × 2 | 0.995 | 0.10 | 5 | 4 |
| HA.NAT.ST-WIND left out | 0.994 | 0.20 | 7 | 7 |
| HA.NAT.EQ-PGA × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.EQ-PGA × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.EQ-PGA left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.EQ-HIST × 0.5 | 0.996 | 0.10 | 4 | 3 |
| HA.NAT.EQ-HIST × 2 | 0.995 | 0.10 | 6 | 4 |
| HA.NAT.EQ-HIST left out | 0.993 | 0.10 | 6 | 7 |
| HA.NAT.EQ-FELT × 0.5 | 0.996 | 0.10 | 4 | 3 |
| HA.NAT.EQ-FELT × 2 | 0.996 | 0.10 | 3 | 6 |
| HA.NAT.EQ-FELT left out | 0.991 | 0.10 | 5 | 4 |
| HA.NAT.CO-WAVE × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-WAVE × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-WAVE left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-WIND × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-WIND × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-WIND left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-SURGE × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-SURGE × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-SURGE left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-EROS × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-EROS × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-EROS left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-MANG × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-MANG × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.CO-MANG left out | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.HW-DAYS × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.HW-DAYS × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.HW-DAYS left out | 0.987 | 0.20 | 26 | 22 |
| HA.NAT.LI-FLASH × 0.5 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.LI-FLASH × 2 | 1.000 | 0.00 | 0 | 0 |
| HA.NAT.LI-FLASH left out | 1.000 | 0.00 | 0 | 0 |
| VU.VG.DP-UNHCR × 0.5 | 1.000 | 0.10 | 0 | 0 |
| VU.VG.DP-UNHCR × 2 | 1.000 | 0.10 | 0 | 0 |
| VU.VG.DP-UNHCR left out | 0.998 | 0.20 | 0 | 0 |
| CC.INF.HC-DENS × 0.5 | 1.000 | 0.10 | 1 | 0 |
| CC.INF.HC-DENS × 2 | 0.998 | 0.10 | 0 | 0 |
| CC.INF.HC-DENS left out | 0.999 | 0.10 | 1 | 0 |
| CC.INF.EDU-DENS × 0.5 | 0.998 | 0.10 | 0 | 0 |
| CC.INF.EDU-DENS × 2 | 0.999 | 0.10 | 1 | 0 |
| CC.INF.EDU-DENS left out | 0.998 | 0.10 | 0 | 0 |
| CC.INS.DRR-STAT × 0.5 | 1.000 | 0.10 | 1 | 0 |
| CC.INS.DRR-STAT × 2 | 0.998 | 0.10 | 0 | 0 |
| CC.INS.DRR-STAT left out | 0.999 | 0.10 | 1 | 0 |

Reading: the lowest rank agreement with the baseline is 0.980 (Equal weights (every member 1)); the most risk-class changes come from "HA.NAT.HW-DAYS left out" (26 councils). Variants that leave a ρ above 0.99 and change no class show that the ranking does not depend on that weight.

## 3. Agreement with the documented hazards of the Risk Action Guide Book

For each hazard group with a basket: how well the group score separates the councils where the guide book documents that hazard (through the hazard crosswalk) from the others. AUC 0.5 means no separation, 1 perfect separation. The guide documents hazards by local experience, so this is agreement with institutional knowledge, not a measure of truth; both columns use the same councils.

| Group | Documented in (councils) | Councils with Advancement data | AUC, Core | AUC, Advancement |
|---|---|---|---|---|
| drought | 83 | 195 | 0.64 | 0.72 |
| flood | 195 | 195 | n/a | n/a |
| landslide | 175 | 195 | 0.66 | 0.74 |
| stormsCyclone | 105 | 195 | 0.49 | 0.54 |
| earthquake | 29 | 195 | 0.81 | 0.76 |
| coastalHazards | 62 | 0 | n/a | n/a |

## 4. Members and coverage

| Member | Name | Weight | Councils filled | Level |
|---|---|---|---|---|
| HA.NAT.DR-SPEI | SPEI-12 drought depth | 0.25 | 194 | council |
| HA.NAT.DR-ARID | Aridity (P/PET) | 0.15 | 195 | council |
| HA.NAT.DR-CV | Rainfall variability (CV) | 0.15 | 194 | council |
| HA.NAT.DR-SEAS | Growing-season failure frequency | 0.2 | 0 | withheld |
| HA.NAT.DR-NDVI | Mean NDVI (greenness) | 0.1 | 195 | council |
| HA.NAT.DR-SOIL | Soil moisture | 0.1 | 194 | council |
| HA.NAT.DR-WLEV | Water levels (% of normal) | 0.05 | 0 | unavailable |
| HA.NAT.FL-R50 | Extreme wet days (>50 mm) | 0.3 | 195 | council |
| HA.NAT.FL-R100 | Very-heavy days (>100 mm) | 0.15 | 195 | council |
| HA.NAT.FL-WLEV | River peak above normal | 0.2 | 0 | unavailable |
| HA.NAT.FL-BASIN | Basin flood records | 0.2 | 0 | unavailable |
| HA.NAT.FL-EVENT | Recorded flood impact events | 0.15 | 34 | district |
| HA.NAT.LS-SUSC | Slope susceptibility (mean) | 0.55 | 195 | council |
| HA.NAT.LS-RAIN | Triggering rainfall (max 1-day) | 0.45 | 195 | council |
| HA.NAT.ST-FREQ | Cyclone/strong-wind frequency | 0.6 | 0 | unavailable |
| HA.NAT.ST-WIND | Extreme wind speed | 0.4 | 195 | council |
| HA.NAT.EQ-PGA | Seismic hazard (PGA 475-yr) | 0.7 | 0 | unavailable |
| HA.NAT.EQ-HIST | Historical seismicity density | 0.3 | 195 | council |
| HA.NAT.EQ-FELT | Maximum felt intensity | 0.3 | 195 | council |
| HA.NAT.CO-WAVE | Significant wave height (Hs 99th pct) | 0.25 | 0 | unavailable |
| HA.NAT.CO-WIND | Extreme onshore wind | 0.2 | 0 | unavailable |
| HA.NAT.CO-SURGE | Storm-surge frequency | 0.2 | 0 | unavailable |
| HA.NAT.CO-EROS | Shoreline retreat / erosion rate | 0.2 | 0 | unavailable |
| HA.NAT.CO-MANG | Mangrove loss (protective buffer) | 0.15 | 0 | unavailable |
| HA.NAT.HW-DAYS | Hot days (Tmax > 35C) | 1 | 195 | council |
| HA.NAT.LI-FLASH | Flash density | 1 | 0 | unavailable |
| VU.VG.DP-UNHCR | Refugees and asylum-seekers hosted | 1 | 8 | district |
| CC.INF.HC-DENS | Health facilities per 10,000 people | 1 | 195 | council |
| CC.INF.EDU-DENS | Schools per 10,000 people | 1 | 195 | council |
| CC.INS.DRR-STAT | DRM arrangements in place (EPRP AA EOCC ERT RVCA) | 1 | 46 | council |

## 5. What this does and does not show

- The weights remain proposed; this report shows how much the ranking depends on each, which is the information a calibration against recorded losses would need. A calibration needs an event and loss register by council (the committees' validated event reports through the Data portal, DesInventar, EM-DAT), which does not exist at council level yet.
- The agreement test uses the guide book's documented hazards as the reference. It is institutional knowledge, not an observed loss record, and the guide documents floods for almost every council, so the flood row says little.
- Hazard members measure intensity on the territory, not people exposed (MET-16); refugees, facility densities and DRM arrangements are counts at the district or council level.

Regenerate: `node scripts/advancement-sensitivity.mjs`. Machine-readable results: `INFORM_TZ_Advancement_Sensitivity_2026-10.json`.
