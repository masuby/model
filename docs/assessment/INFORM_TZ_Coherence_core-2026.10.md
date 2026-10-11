# INFORM Tanzania: coherence report, release core-2026.10 (2026-10-10)

The cross-correlation check the INFORM Subnational Guidance (II.7) asks for, computed with the engine (`node scripts/coherence-report.mjs`; the Quality section of the Methodology page runs the same code live over the councils) for the Core and for the Advancement layer, over the 170 workbook units and the 195 councils. A category that correlates negatively with its partner, or not at all with risk, adds little or contradicts the dimension it belongs to; a group with one value for every unit adds no subnational information; an empty group enters no score.

## Core: correlation matrix over the 170 workbook units

| | Natural hazards | Human hazards | Socio-economic vulnerability | Vulnerable groups | Infrastructure | Institutional | Hazard & Exposure | Vulnerability | Lack of Coping Capacity | INFORM Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Natural hazards (Hazard & Exposure) | 1.00 | 0.00 | -0.06 | -0.14 | 0.06 | 0.05 | 1.00 | -0.12 | 0.05 | 0.76 |
| Human hazards (Hazard & Exposure) | 0.00 | 1.00 | -0.00 | 0.00 | 0.00 | -0.00 | 0.00 | -0.00 | 0.00 | -0.00 |
| Socio-economic vulnerability (Vulnerability) | -0.06 | -0.00 | 1.00 | 0.59 | 0.81 | -0.24 | -0.07 | 0.86 | 0.70 | 0.52 |
| Vulnerable groups (Vulnerability) | -0.14 | 0.00 | 0.59 | 1.00 | 0.52 | -0.07 | -0.14 | 0.92 | 0.48 | 0.44 |
| Infrastructure (Lack of Coping Capacity) | 0.06 | 0.00 | 0.81 | 0.52 | 1.00 | -0.35 | 0.05 | 0.73 | 0.80 | 0.56 |
| Institutional (Lack of Coping Capacity) | 0.05 | -0.00 | -0.24 | -0.07 | -0.35 | 1.00 | 0.06 | -0.16 | 0.27 | -0.02 |
| Hazard & Exposure | 1.00 | 0.00 | -0.07 | -0.14 | 0.05 | 0.06 | 1.00 | -0.13 | 0.05 | 0.75 |
| Vulnerability | -0.12 | -0.00 | 0.86 | 0.92 | 0.73 | -0.16 | -0.13 | 1.00 | 0.65 | 0.53 |
| Lack of Coping Capacity | 0.05 | 0.00 | 0.70 | 0.48 | 0.80 | 0.27 | 0.05 | 0.65 | 1.00 | 0.53 |
| INFORM Risk | 0.76 | -0.00 | 0.52 | 0.44 | 0.56 | -0.02 | 0.75 | 0.53 | 0.53 | 1.00 |

## Core: correlation matrix over the 195 councils

| | Natural hazards | Human hazards | Socio-economic vulnerability | Vulnerable groups | Infrastructure | Institutional | Hazard & Exposure | Vulnerability | Lack of Coping Capacity | INFORM Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Natural hazards (Hazard & Exposure) | 1.00 | -0.14 | -0.04 | 0.29 | -0.05 | -0.18 | 0.66 | 0.23 | -0.17 | 0.62 |
| Human hazards (Hazard & Exposure) | -0.14 | 1.00 | -0.36 | -0.18 | -0.64 | 0.04 | 0.65 | -0.29 | -0.46 | 0.05 |
| Socio-economic vulnerability (Vulnerability) | -0.04 | -0.36 | 1.00 | 0.25 | 0.74 | -0.22 | -0.31 | 0.60 | 0.44 | 0.39 |
| Vulnerable groups (Vulnerability) | 0.29 | -0.18 | 0.25 | 1.00 | 0.20 | -0.21 | 0.08 | 0.92 | -0.01 | 0.73 |
| Infrastructure (Lack of Coping Capacity) | -0.05 | -0.64 | 0.74 | 0.20 | 1.00 | 0.01 | -0.52 | 0.46 | 0.79 | 0.26 |
| Institutional (Lack of Coping Capacity) | -0.18 | 0.04 | -0.22 | -0.21 | 0.01 | 1.00 | -0.10 | -0.26 | 0.61 | -0.06 |
| Hazard & Exposure | 0.66 | 0.65 | -0.31 | 0.08 | -0.52 | -0.10 | 1.00 | -0.05 | -0.48 | 0.51 |
| Vulnerability | 0.23 | -0.29 | 0.60 | 0.92 | 0.46 | -0.26 | -0.05 | 1.00 | 0.16 | 0.76 |
| Lack of Coping Capacity | -0.17 | -0.46 | 0.44 | -0.01 | 0.79 | 0.61 | -0.48 | 0.16 | 1.00 | 0.13 |
| INFORM Risk | 0.62 | 0.05 | 0.39 | 0.73 | 0.26 | -0.06 | 0.51 | 0.76 | 0.13 | 1.00 |

## Core: groups with one value for every unit

Conflict intensity; Conflict risk; WASH; DRR implementation

## Core: groups empty for every unit

Coastal hazards; Heatwave; Lightning; Zoonoses, plants & pests; Hazardous material; Internal violence; Vehicle accidents; Livelihoods; Economic (vulnerable groups)

## Core: groups with some units missing (workbook units)

Drought (3); Earthquake (1); Flood (1); Landslide (2); Storms & cyclones (1); Displaced people (8)

## Advancement: correlation matrix over the 170 workbook units

| | Natural hazards | Human hazards | Socio-economic vulnerability | Vulnerable groups | Infrastructure | Institutional | Hazard & Exposure | Vulnerability | Lack of Coping Capacity | INFORM Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Natural hazards (Hazard & Exposure) | 1.00 | 0.00 | -0.06 | -0.14 | 0.06 | 0.05 | 1.00 | -0.12 | 0.05 | 0.76 |
| Human hazards (Hazard & Exposure) | 0.00 | 1.00 | -0.00 | 0.00 | 0.00 | -0.00 | 0.00 | -0.00 | 0.00 | -0.00 |
| Socio-economic vulnerability (Vulnerability) | -0.06 | -0.00 | 1.00 | 0.59 | 0.81 | -0.24 | -0.07 | 0.86 | 0.70 | 0.52 |
| Vulnerable groups (Vulnerability) | -0.14 | 0.00 | 0.59 | 1.00 | 0.52 | -0.07 | -0.14 | 0.92 | 0.48 | 0.44 |
| Infrastructure (Lack of Coping Capacity) | 0.06 | 0.00 | 0.81 | 0.52 | 1.00 | -0.35 | 0.05 | 0.73 | 0.80 | 0.56 |
| Institutional (Lack of Coping Capacity) | 0.05 | -0.00 | -0.24 | -0.07 | -0.35 | 1.00 | 0.06 | -0.16 | 0.27 | -0.02 |
| Hazard & Exposure | 1.00 | 0.00 | -0.07 | -0.14 | 0.05 | 0.06 | 1.00 | -0.13 | 0.05 | 0.75 |
| Vulnerability | -0.12 | -0.00 | 0.86 | 0.92 | 0.73 | -0.16 | -0.13 | 1.00 | 0.65 | 0.53 |
| Lack of Coping Capacity | 0.05 | 0.00 | 0.70 | 0.48 | 0.80 | 0.27 | 0.05 | 0.65 | 1.00 | 0.53 |
| INFORM Risk | 0.76 | -0.00 | 0.52 | 0.44 | 0.56 | -0.02 | 0.75 | 0.53 | 0.53 | 1.00 |

## Advancement: correlation matrix over the 195 councils

| | Natural hazards | Human hazards | Socio-economic vulnerability | Vulnerable groups | Infrastructure | Institutional | Hazard & Exposure | Vulnerability | Lack of Coping Capacity | INFORM Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Natural hazards (Hazard & Exposure) | 1.00 | -0.18 | -0.04 | 0.32 | -0.05 | -0.15 | 0.50 | 0.26 | -0.16 | 0.53 |
| Human hazards (Hazard & Exposure) | -0.18 | 1.00 | -0.36 | -0.17 | -0.60 | 0.00 | 0.76 | -0.28 | -0.40 | 0.13 |
| Socio-economic vulnerability (Vulnerability) | -0.04 | -0.36 | 1.00 | 0.25 | 0.76 | -0.17 | -0.35 | 0.60 | 0.39 | 0.38 |
| Vulnerable groups (Vulnerability) | 0.32 | -0.17 | 0.25 | 1.00 | 0.19 | -0.18 | 0.06 | 0.92 | -0.03 | 0.74 |
| Infrastructure (Lack of Coping Capacity) | -0.05 | -0.60 | 0.76 | 0.19 | 1.00 | 0.05 | -0.57 | 0.45 | 0.72 | 0.24 |
| Institutional (Lack of Coping Capacity) | -0.15 | 0.00 | -0.17 | -0.18 | 0.05 | 1.00 | -0.10 | -0.22 | 0.72 | 0.04 |
| Hazard & Exposure | 0.50 | 0.76 | -0.35 | 0.06 | -0.57 | -0.10 | 1.00 | -0.09 | -0.46 | 0.45 |
| Vulnerability | 0.26 | -0.28 | 0.60 | 0.92 | 0.45 | -0.22 | -0.09 | 1.00 | 0.13 | 0.76 |
| Lack of Coping Capacity | -0.16 | -0.40 | 0.39 | -0.03 | 0.72 | 0.72 | -0.46 | 0.13 | 1.00 | 0.16 |
| INFORM Risk | 0.53 | 0.13 | 0.38 | 0.74 | 0.24 | 0.04 | 0.45 | 0.76 | 0.16 | 1.00 |

## Advancement: groups with one value for every unit

Conflict intensity; Conflict risk; WASH; DRR implementation

## Advancement: groups empty for every unit

Coastal hazards; Heatwave; Lightning; Zoonoses, plants & pests; Hazardous material; Internal violence; Vehicle accidents; Livelihoods; Economic (vulnerable groups)

## Advancement: groups with some units missing (workbook units)

Drought (3); Earthquake (1); Flood (1); Landslide (2); Storms & cyclones (1); Displaced people (8)

## Reading

- Constant groups are the first targets for institutional data through the Data portal: a value per region or council turns them into information.
- Negative correlation between the two coping categories (infrastructure against institutional) means the institutional category pulls the dimension the other way; with one national value for DRR implementation, the category carries governance alone.
- The Advancement layer adds council variation to the hazard groups and to displaced people, facilities and DRM arrangements, which shows as higher correlations with risk and fewer constant groups.

Machine-readable results: `INFORM_TZ_Coherence_core-2026.10.json`. Regenerate with every release.
