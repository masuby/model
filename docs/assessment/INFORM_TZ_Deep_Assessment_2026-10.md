# INFORM Tanzania: deep assessment

9 October 2026. This is the master report. It brings together the integrity assessment (model, data, sources, data entry), the interface and risk communication review, and a second, deeper pass (pipeline replay, climate code, crisis severity, collection tools, Learn, database security, tests). Details: `INFORM_TZ_Integrity_Assessment_2026-10.md`, `INFORM_TZ_UI_and_Risk_Communication_Review_2026-10.md`; the working matrix: `INFORM_TZ_Issue_Matrix_2026-10.xlsx`.

## Summary

The engines are sound. The risk engine and the indicator specification reproduce the INFORM workbook exactly, the crisis severity engine follows the current official method, the Excel collection tool computes the same scores as the workbook, and the database security holds. **The problems are in what the engines are given and in what the site says.** The national figure is a district's row. The data shown as INFORM has been changed in 165 of 170 units, partly with hand-assigned grades, and those changes sit inside the core, not in the Advanced layer, which the app never runs. The source labels name institutions that supplied nothing. The alert badge presents the standing risk class as official warnings. The fixes are mostly small and mechanical, except rebuilding the core and moving the Tanzanian work into Advanced, which is the main piece of work.

143 issues: 8 critical, 33 high, 63 medium, 39 low.

## Scorecard

| Area | Verdict | Basis | Issues |
|---|---|---|---|
| Risk calculation engine | **Sound** | Indicator specification equals the workbook (78/78); workbook formula chain reproduced; golden tests pass. | TST-01 |
| Crisis severity engine | **Sound, minor gaps** | Matches the current JRC/ACAPS method (2026 update, Table 7, Figure 8). | SEV-01, SEV-02 |
| National figure | **Wrong** | The 'official 4.1' is Kondoa district's row; the workbook has no national risk. | NAT-01, DOC-01, LRN-01, OUT-01, OUT-02 |
| Shipped core data | **Not authentic** | 165/170 units differ from the workbook in 21/32 indicator groups; 57 units change risk class; hand grades inside. | COR-01 to COR-06, MET-01 to MET-09 |
| Provenance shown to users | **Wrong** | Source column shows the intended custodian; earthquake labelled USGS; coverage counts hand grades. | PROV-01, PIPE-01, COV-01, DOC-02 |
| Advanced layer | **Designed, not used** | Never computed in the app; 14/25 indicators filled and traceable. | ADV-01 to ADV-05 |
| Data pipeline | **Traceable, not exactly reproducible** | Replay reproduces the data except health conditions in 80 units; scripts edit the dataset in place. | PIPE-01, PIPE-02, ENG-02, ENG-03 |
| Data sources | **Global and coarse** | All 53 scoring indicators from global datasets; 15 uniform, 33 regional, 4 district-level; several stale. | SRC-01 to SRC-07, UP-01 to UP-03 |
| Excel collection tools | **Sound** | NORMAL tool formulas equal the workbook in 9,936/9,939 cells (3 = Butiama input). | SRC-07 |
| Data entry workflow | **Works for raw values; gaps** | No 0-10 path for institutions, no area-scoped roles, one review step; 0 approved values live. | DE-01 to DE-06, GOV-01 to GOV-04 |
| Database security | **Sound** | Row-level security and server-side checks hold; no self-escalation; anonymous access limited. | SEC-01 |
| Interface | **Mixed** | Explorer is good; profiles about 16 screens, Methodology 28; duplicated sections. | UX-01 to UX-08 |
| Risk communication | **Good content, wrong presentation** | Standing risk shown as official warnings; static, unmanaged content. | RC-01 to RC-08 |
| Learn course | **Good structure, one serious error** | Teaches the Kondoa figure as the official national value. | LRN-01 |
| Tests | **Strong on the engine, blind on the data** | 404 tests pass; none guards the data or the provenance shown; some lock in wrong facts. | ENG-01, TST-01 |
| Documents and external outputs | **Contain false figures** | Proposal and two presentations state the national 4.1; stale statements in docs. | OUT-01, OUT-02, DOC-03 to DOC-05 |
| INFORM methodology conformity | **Engine conforms; data, process and communication do not** | Checked against the INFORM Concept and Methodology (2017) and Subnational Guidance (2019); see the section below. | MET-10 to MET-16, NAT-01, RC-01 |
| Administrative units (170 to 195) | **Count right; links and identifiers need fixing** | 195 = 184 mainland + 11 Zanzibar; 12 urban councils use the rural unit; IDs positional; 25 units shared by two councils. | ADM-01 to ADM-06 |

## The ten actions that matter most

| # | Action | Issues |
|---|---|---|
| 1 | Decide the national figure (D1) and replace Kondoa's row everywhere: code, interface, Learn, documents, presentations, proposal. | NAT-01, DOC-01, LRN-01, OUT-01, OUT-02 |
| 2 | Remove the alert badge and the warning wording; show preparedness priority instead (D6). | RC-01, RC-02 |
| 3 | Show the real source of every value, including earthquake, and report coverage by lineage. | PROV-01, PIPE-01, COV-01 |
| 4 | Fix the rounding rule (two councils change class) and add the missing data tests to CI. | COR-03, ENG-01, TST-01 |
| 5 | Correct the proposal, the two presentations and the other documents in docs/ before 31 October 2026. | OUT-01, OUT-02, OUT-03 |
| 6 | Rebuild the core from the workbook; move every Tanzanian adjustment, including the hand grades, into Advanced; switch Advanced on as a separate view (D2, D3). | COR-01, COR-02, ADV-01, ADV-02, PIPE-02 |
| 7 | Link the twelve urban councils to their own workbook units, make council identifiers permanent and label shared values. | ADM-01, ADM-03, ADM-05 |
| 8 | Give coordinators area-scoped roles, a review chain and guidance management (D8). | GOV-01, GOV-02, RC-05 |
| 9 | Let institutions deposit 0-10 values as well as raw figures, with templates and a citable source (D4). | DE-01, DE-03 |
| 10 | Introduce versioned, validated releases with a reliability score; fix the drought index and the exposure concept before Advanced is shown (D11, D12). | MET-15, MET-14, MET-01, MET-09, MET-16 |

## Decisions needed

| ID | Decision | Recommendation |
|---|---|---|
| D1 | Definition of the national figure | Recommended: the INFORM aggregate of the councils by the regional method, labelled 'aggregate of councils (not an official INFORM figure)'. INFORM subnational models are not comparable with each other or with INFORM Global, so never set it beside the INFORM Global country score as if comparable; if the Global value is shown, show it apart with its version. Blocks NAT-01, DOC-01, OUT-01, OUT-02, LRN-01. |
| D2 | Core and Advanced principle, and the default view | Recommended: Core = workbook + approved INFORM-method institutional values; every Tanzanian adjustment in Advanced; Core as default with an Advanced switch. Blocks COR-01, COR-05, ADV-01. |
| D3 | Judgement grades | Recommended: remove from Core now; keep in Advanced only as dated expert assessments with a named assessor until replaced by data. Blocks COR-02, ADV-02. |
| D4 | 0-10 deposits by institutions | Recommended: allowed; INFORM-method scores with the raw value attached and verified go to Core, others to Advanced. INFORM uses open, published data: a deposited value enters Core only with a citable source (publication, dataset or official letter) recorded in its lineage. Blocks DE-01. |
| D5 | Upstream workbook defects | Recommended: keep authentic values in Core with a visible note, correct in Advanced, report to SADC/JRC. Covers UP-01..03. |
| D6 | Alert badge from the risk class | Recommended: remove it; show 'Preparedness priority' with INFORM class words and colours; keep Advisory, Warning and Major warning for active official warnings only. Blocks RC-01, RC-02. |
| D7 | Priority bands for single hazards | The workbook defines thresholds only for Hazard, Vulnerability, Lack of coping and Risk, none per hazard. Recommended: a declared communication band for single hazard scores (e.g. under 2 very low, 2 to 4 low, 4 to 6 medium, 6 to 8 high, 8 and above very high), labelled as a display rule and checked with coordinators. Blocks RC-03. |
| D8 | Who records warnings and approves content at each level | Recommended chain: DDRRC to RDRRC (council content), RDRRC to NDRRC (region), NDRRC to PMO-DMD (national hazard content), PMO-DMD with NDRRC review (vulnerability and coping actions); warnings recorded by NDRRC from TMA bulletins. Blocks RC-04, RC-05, GOV-01, GOV-02, GOV-04. |
| D9 | Default language of public pages | Recommended: Kiswahili first on public pages and print cards, English one tap away. Blocks UX-01, RC-08. |
| D10 | Vulnerability and coping action library | Recommended: PMO-DMD owns it, NDRRC reviews, lead sectors named, one entry per INFORM vulnerability and coping group. Blocks RC-07. |
| D11 | Methodological variants (natural-hazard aggregation, Tanzanian classes) | Recommended: the Core keeps the SADC 2024 rules (arithmetic natural and human categories, SADC thresholds), so it stays the authentic INFORM model; Advanced may show labelled sensitivities (inverted geometric natural hazard; Tanzanian cluster classes), each map saying which rule it uses; raise both with SADC and INFORM (JRC). Blocks MET-10, MET-12. |
| D12 | Releases, validation and boundary updates | Recommended: an annual release with version and date; the NDRRC technical committee reviews data changes, PMO-DMD approves publication; methodological changes go to INFORM (JRC) before entering the Core; boundary changes follow a written procedure. Blocks MET-15, ADM-06. |

## Critical and high issues

| ID | Severity | Priority | Issue |
|---|---|---|---|
| NAT-01 | Critical | P0 | The "official national INFORM risk 4.1" is Kondoa district's row |
| COR-01 | Critical | P1 | The displayed core is not the authentic workbook: Tanzanian changes sit inside the core, not in the Advanced layer |
| COR-02 | Critical | P0 (label) / P1 (replace) | Hand-assigned grades are presented as data |
| COR-03 | High | P0 | Stored dimension totals use a rounding rule that is not in the workbook |
| COR-04 | High | P1 | The 'documented baseline' used as a floor is not the INFORM baseline |
| COR-05 | High | P1 | Raise-only cascades bias scores upward |
| COR-06 | High | P1 | Partly filled indicator groups make units incomparable |
| MET-01 | High | P1 | Drought index artefact (ours): wet highlands score 10 |
| MET-02 | High | P1 | WASH rebuilt from raw facility counts |
| SRC-01 | High | P1 | Most indicators carry regional or national values only |
| ADV-01 | High | P1 | The Advanced model is never computed or shown |
| ADV-02 | High | P1 | Many Tanzanian adjustments have no Advanced indicator |
| DE-01 | High | P1 | Institutions cannot deposit 0-10 values |
| DE-04 | High | P0 | Sign-in email may not reach officers |
| DOC-01 | Critical | P0 | The UI calls Kondoa's row the official national figure |
| DOC-02 | High | P0 | Claims of exact reproduction and traceability overstate the displayed data |
| ENG-01 | High | P0 | Tests lock in the wrong facts |
| OUT-01 | Critical | P0 | The PMO proposal states false or stale facts |
| OUT-02 | Critical | P0 | Presentations state the false national figure |
| PROV-01 | Critical | P0 | The source column shows the intended custodian, not where the value came from |
| UX-01 | High | P1 | Area profiles are too long for any single audience |
| RC-01 | Critical | P0 | The standing risk class is shown with official warning names and colours |
| RC-02 | High | P0 | Wording implies an active warning |
| RC-03 | High | P1 | Two different hazard pictures on the same page |
| RC-04 | High | P1 | Warning levels are per area, not per hazard and time |
| RC-05 | High | P1 | Coordinators cannot maintain the guidance |
| GOV-01 | High | P1 | Roles cannot be limited to an area |
| GOV-02 | High | P1 | No review chain by level |
| PIPE-01 | High | P0 (label) / P1 | Earthquake is labelled as computed from the USGS catalogue, but that step was never applied |
| LRN-01 | High | P0 | The course teaches the false national figure as 'official' |
| TST-01 | High | P1 | No test guards the shipped data or the provenance shown |
| MET-15 | High | P1 | Updates, validation and versions do not follow the INFORM process |
| ADM-01 | High | P1 | Twelve urban councils use the rural district's data; twelve workbook units are never used |
| ADM-03 | High | P1 | Council identifiers are positional, not official |
| OUT-03 | High | P0 | Other shareable documents repeat the district row as the national figure and describe raise-only and USGS as method |
| ADV-06 | High | P1 | Facility densities counted drug outlets as health facilities, on district polygons |
| RC-10 | High | P1 | Profiles communicated warnings and advice where the programme communicates standing risk |
| DATA-01 | High | P1 | Six indicator groups of the template had no data and eight values were withheld, leaving the model thin |
| RC-16 | High | P1 | The low band's planning message promised 'few hazard constraints' where a natural hazard is very high |
| DATA-09 | High | P1 | DRR implementation was one national value: a council's own preparedness changed nothing |
| LRN-02 | High | P0 | The course taught two non-INFORM rules as INFORM: a log-scaled density exposure index that amplifies flood, and a refugee-driven 'displaced people' score for Kasulu |

## INFORM methodology conformity

21 requirements from the INFORM Concept and Methodology (2017) and the Subnational Guidance (2019): 8 conform, 1 conforms in the engine but not in the data, 2 upstream deviations, 4 partly, 3 missing, 3 breached. The engine follows INFORM; the gaps are in data, process and communication.

| Requirement | INFORM reference | Workbook | Engine | Site data | Verdict | Issues |
|---|---|---|---|---|---|---|
| Framework: three dimensions (hazard and exposure, vulnerability, lack of coping capacity), two categories each | Concept and Methodology 2017, 2.3 | Same | Same | Same | Conforms |  |
| Indicators made comparable (per capita, %, density; no absolute counts) | Subnational Guidance 2019, II.3 | Denominators per indicator | Same (spec 78/78) | Hand grades added (COR-02) | Core conforms | COR-02 |
| Outliers capped (box plot, skewness and kurtosis) | 2017, 6.3 | Outlier fence per indicator | Same | Same | Conforms |  |
| Log transform for skewed counts | 2017, 6.2 | LN(0.001+x) where specified | Same | Same | Conforms |  |
| Min-max to 0-10, higher = worse, inversion | 2017, 6.3, Eq. 2-3 | Data range (dynamic) or custom | Frozen ranges | Same | Conforms; engine closer to INFORM's fixed-range preference | MET-06 |
| Normalised indicators rounded to one decimal | 2017, 6.3 | ROUND(,1) | Same | Same | Conforms |  |
| Missing data: most recent year within 5 years; under 10% missing; otherwise average the rest | Guidance II.3 | Blanks skipped; 6 components empty for all units | Missing never zero | Gaps filled with hand grades | Partly | COR-02, MET-13 |
| Indicators to component: arithmetic mean | Guidance II.5 | AVERAGEIFS of Use = Yes | Same | Same | Conforms |  |
| Natural hazard category: geometric average of hazard components | 2017, 4.2.2.2, Table 5 | Arithmetic AVERAGE (SADC choice) | Reproduces the workbook | Same | Deviates (upstream, allowed by the subnational guidance) | MET-10 |
| Human hazard: maximum of current and projected conflict | 2017, Table 7 | Average of 5 components incl. technological | Reproduces the workbook | Same | Deviates (upstream) | MET-11 |
| Dimensions: inverted geometric mean of the two categories | 2017, 4.2.1, 4.3.2, 4.4.2; Box 6 | ROUND(scaled geomean, 1) | Same | Stored totals use rounded categories in 68/510 cases | Engine conforms; data defect | COR-03 |
| Risk = H^(1/3) x V^(1/3) x LCC^(1/3) | 2017, 2.2 Eq. 1 | Same, ROUND 1 | Same | Same | Conforms |  |
| Classes by cluster analysis for risk, dimensions and categories | 2017, 7; Guidance II.6 | SADC thresholds, risk and dimensions only | Same thresholds | Risk class shown as warning levels | Partly | MET-12, RC-01 |
| Statistical coherence check (correlation matrix) | Guidance II.7 | Not done | Not done | Not done | Missing | MET-13 |
| Reliability shown (Lack of Reliability Index) | 2017, 3.6 | Not present | Not present | Coverage counts hand grades | Missing | MET-14, COV-01 |
| Open, published data, documented in metadata | Guidance, principles; 2017, 4.1 | Global datasets with metadata | n/a | Hand grades; source labels show custodians | Breached | COR-02, PROV-01 |
| Hazard and exposure as people exposed (absolute and relative) | 2017, 4.2.2 | SADC indicators (mixed) | n/a | Advanced: intensity indices, raise-only | Partly | MET-16, MET-08 |
| Unique admin codes; recalculate when boundaries change | Guidance II.2 | 170 units with P-codes (older boundaries) | 195 councils, positional IDs | 12 councils mislinked; 25 units shared | Partly | ADM-01, ADM-03, ADM-05 |
| Process: core group, partner validation, publication, update every 6-12 months | Guidance II.8-II.10 | SADC 2024 release | n/a | No versions or validation record | Missing | MET-15 |
| Subnational results not compared with other models or INFORM Global | Guidance, introduction | No national risk | n/a | 'Official national 4.1' is Kondoa | Breached | NAT-01 |
| Risk is not severity and not a warning | 2017, 2; Severity 2026 | n/a | Severity engine separate | Risk class shown as Advisory/Warning/Major warning | Breached | RC-01, RC-02 |

The deviations in the workbook (natural and human hazard aggregation) are upstream choices of the SADC 2024 model and are allowed by the subnational guidance; the Core keeps them so that it stays the authentic model, and Advanced may show the INFORM global rules as labelled sensitivities (D11).

## Administrative units: is 195 right, and what the move from 170 changed

- **195 is right.** 184 councils on the mainland (PO-RALG in Parliament refers to 'Halmashauri zote 184', for example in the Hansard of 7 February 2025) plus 11 in Zanzibar; the NBS 2022 census geodatabase used by the site has 31 regions, 150 districts, 195 councils and 4,344 wards, and the council populations sum to the census total of 61,741,120. With Kigoma Ujiji typed correctly, the mainland split is 6 City, 20 Municipal, 21 Town and 137 District councils. No council created after the 2022 census was found; confirm with PO-RALG before each annual release.
- **The workbook's 170 units are an older boundary set.** They include township authorities and urban units, but not the councils created or split since (for example Ubungo, Kigamboni, Kibiti, Chalinze, Bumbuli, Mlimba, Ifakara, Ushetu, Msalala, Magharibi A and B).
- **How the site maps them today:** 195 councils use only 158 of the 170 units; 34 units back 71 councils; 12 urban workbook units are never used because twelve urban councils are linked to the rural district (ADM-01).
- **After the fix:** all 170 units are used; 25 units back two councils each (50 councils). For one council in each pair (and both in four pairs) the values describe a larger or different area (ADM-05).
- **Effect on aggregates:** with authentic values the national aggregate is 3.8 over the 170 units and 3.8 over the 195 councils; 3 of 31 regions move by 0.1, none changes class. The re-basing itself did not raise the figures; the data modifications did (site data: 4.2 over 170 units, 4.3 over 195 councils).
- **Effect on councils:** for the twelve mislinked councils, hazard and exposure differ from their own unit (vulnerability and coping are identical in the authentic workbook) and 3 change risk class; in the shipped data the gap is larger because the urban and rural units were modified differently.
- **If there are more than 195 councils later:** the IDs C001 to C195 follow file order, so adding or re-ordering a council would renumber them and move stored values, guidance entries and links to the wrong council (ADM-03); tests and page text hard-code 195 (ADM-04); a new council needs official boundaries, census population, recomputed council hazards and flagged inheritance of vulnerability and coping until its own data exist (ADM-05, ADM-06). INFORM treats any boundary change as a reason to recalculate. The database already accepts IDs up to C999.

| Council | Linked now to | Own workbook unit | Risk now | Risk with own unit |
|---|---|---|---|---|
| Korogwe Town | Korogwe | Korogwe Township Authority | 4.2 (Medium) | 3.9 (Medium) |
| Handeni Town | Handeni | Handeni Mji | 3.7 (Medium) | 3.7 (Medium) |
| Kibaha Town | Kibaha | Kibaha Urban | 3.8 (Medium) | 3.6 (Medium) |
| Mtwara Mikindani Municipal | Mtwara | Mtwara Urban | 4.9 (High) | 4.8 (High) |
| Masasi Town | Masasi | Masasi Township Authority | 4.3 (High) | 4.2 (Medium) |
| Mafinga Town | Mufindi | Mafinga Township Authority | 3.0 (Low) | 2.7 (Low) |
| Kasulu Town | Kasulu | Kasulu Township Authority | 4.3 (High) | 4.2 (Medium) |
| Kigoma Ujiji Municipal (shown as 'City', ADM-02) | Kigoma | Kigoma Urban | 4.6 (High) | 4.4 (High) |
| Kahama Municipal | Kahama | Kahama Township Authority | 3.8 (Medium) | 3.6 (Medium) |
| Babati Town | Babati | Babati Urban | 4.2 (Medium) | 4.1 (Medium) |
| Njombe Town | Njombe | Njombe Urban | 3.3 (Low) | 3.4 (Medium) |
| Makambako Town | Njombe | Makambako Township Authority | 3.3 (Low) | 3.1 (Low) |

Values in this table are the authentic workbook values; the full list of 195 councils is in the matrix (sheet 'Admin units 170-195').


## Review of the register (fourth pass)

Every issue was re-read and, where the claim could be re-measured, re-checked against the code, the database migrations, the data files and the documents. 40 confirmed; re-measured; 40 confirmed; not re-measured; 13 new (fourth pass); 12 confirmed; evidence amended; 12 new (sixth pass); 9 new (thirteenth pass); 5 new (ninth pass); 4 new (fourteenth pass); 3 new (eighth pass); 2 new (sixteenth pass); 1 new (eleventh pass); 1 new (twelfth pass).

Corrections to earlier statements: measured values submitted for a council already apply to that council alone (DE-02, ADM-05); the Methodology page's limitations section and the guide block carry partial disclosures that the headline claims contradict (COR-02, DOC-02, RC-01); the Insights coverage section shares the coverage defect (COV-01); the earthquake count on the Insights page depends on an unstated tie rule (UX-08).

New issues found: OUT-03 (High), EXP-01 (Medium), TOOL-01 (Medium), TOOL-02 (Low), SEC-02 (Low), SEC-03 (Low), DE-07 (Medium), DE-08 (Low), TST-02 (Low), DOC-06 (Low), RC-09 (Low), UP-04 (Low), SRC-08 (Low). Details in the Issues sheet and in the integrity report; verdicts per issue in the Review sheet.


## How the findings were verified

- Read the workbook directly (formulas and cached values): formula chain, indicator specification, thresholds, metadata, absence of a national calculation.
- Compared every indicator group of the shipped data with the workbook for all 170 units (re-runnable: python3 scripts/audit/integrity_audit.py).
- Ran the project's own engine through its test runner to obtain council, region and national values.
- Replayed the data pipeline in an isolated copy, from the workbook through every refill script.
- Reviewed the refill, overlay, coping and drought scripts line by line.
- Recalculated the NORMAL collection tool in LibreOffice and compared every score with the workbook.
- Read the live database with the public key; protected tables checked with header-only requests (no personal data retrieved).
- Rendered every page of the production build at desktop and phone width and measured each section.
- Checked the severity engine against the official methodology (JRC page; ACAPS/JRC update of 2 February 2026).
- Checked the live security headers and the production bundle.
- Read the INFORM Concept and Methodology (2017) and the Subnational Guidance v2 (2019) for every step that matters (pre-processing, aggregation, classes, validation, reliability, process) and checked the workbook, the engine and the data against each step.
- Recomputed the 170 units from the workbook's cached component values with the engine's formulas (0 mismatches), measured the 170 to 195 re-basing and the natural-hazard aggregation sensitivity on authentic values, and ran the INFORM correlation check.
- Checked the council count against the NBS 2022 census geodatabase and statements by PO-RALG in Parliament (2024, 2025).
- Fourth pass: re-verified the register; read the five database migrations, the raw-value engine, the export code, the guide data, the locale files, the dependency audit and the documents in docs/; compared the baseline raw file with the workbook and the collection benchmark with the council links.

## What this assessment did not cover

- Accessibility was not re-audited independently (the changelog reports an axe WCAG 2.1 AA audit of every page).
- Supabase dashboard settings (custom SMTP, leaked-password protection) are not visible from outside (DE-04).
- Kiswahili wording was checked for completeness, not reviewed by a native speaker.
- CHIRPS and ERA5 were not re-processed; the review relied on the derived files in data-source/ and the script logic.
- No user testing with coordinators or communities; interface verdicts are expert review against the audiences in the interface review.

## What is sound

- **Reference workbook:** Root 'Tanzania - Country Model Template.xlsx' is byte-identical to data-source/tanzania-inform-risk.xlsx (sha256 1da34336...).
- **Indicator specification:** inform-indicator-spec.json matches the workbook for 78/78 indicators on every field (component, dimension, denominator, outlier, transform, normalisation, sign, use, reference range); 46 cosmetic differences are blank vs 0 ranges on unused indicators. 53 indicators in use.
- **Engine:** Workbook formula chain confirmed (AVERAGEIFS of Use=Yes indicators; AVERAGE for categories; ROUND(scaled geomean, 1); ROUND(cube root, 1)) and reproduced by the engine; golden tests (8,664/8,664 standardised values, raw to risk for 170 units, cell parity) pass.
- **Reference population:** Data-range min/max in the Country Model Template are taken over Tanzanian units only (not SADC-wide).
- **Flood formula:** Manual, engine and shipped data agree: flood = max(h, sqrt(h x exposure)) in 138/138 units.
- **Council hazards:** No council hazard value is below its source unit (195 councils).
- **Census population:** NBS 2022 council populations sum to 61,741,120; the three corrected councils (Mwanza City, Dar es Salaam City, Busokelo) are right.
- **NORMAL Benchmark:** 10,130 of 10,134 filled cells equal the workbook raw values (exception: Butiama, SRC-07).
- **ADVANCED Benchmark:** All 14 filled advanced indicators trace to computed files in data-source/ (13 exact; seismicity 174/175).
- **Vulnerability baseline:** data-source/vuln_baseline.csv equals the workbook.
- **Database security:** 22/22 SECURITY DEFINER functions pin search_path; anonymous reads limited to approved values and assignments by design.
- **Build and tests:** Typecheck, lint, 404/404 tests and production build pass; live site serves df12dbb (= local HEAD).
- **Pipeline traceability:** Replaying the scripts on the workbook in an isolated copy reproduces every shipped leaf except health conditions in 80 units (0.1 apart, from an earlier script version); values not in the workbook trace to a script constant or a data-source file (PIPE-02).
- **NORMAL collection tool formulas:** The tool's standardisation, recalculated in LibreOffice on the filled Benchmark, equals the workbook's standardised values in 9,936 of 9,939 cells; the 3 differences are the Butiama input row (SRC-07), not formulas.
- **Crisis severity engine:** Matches the current JRC/ACAPS method (2026 update, Table 7 and Figure 8): 70% x inverted weighted geometric mean (Impact 1/3, Conditions 2/3) + 30% Complexity, 0-5 scale, round-up categories Very low to Very high, completeness rule, 5% concentration rule. Gaps: SEV-01, SEV-02.
- **Row-level security:** Anonymous visitors cannot read profiles, submissions, audit log, requests or raw submissions (HTTP 401); public tables are approved values, institutions and assignments. Non-admins cannot change their own role or institution (WITH CHECK in migration 0004).
- **Security headers and performance:** HSTS with preload, X-Frame-Options DENY, nosniff, referrer and permissions policies on the live site; entry chunk 130 KB gzip, charts, map and Supabase code loaded on demand. Weak point: SEC-01.
- **Council count:** 195 councils is right: 184 on the mainland (PO-RALG in Parliament: 'Halmashauri zote 184', Hansard of 7 February 2025) and 11 in Zanzibar; the NBS 2022 census geodatabase has 31 regions, 150 districts, 195 councils, 4,344 wards; council populations sum to 61,741,120 (2022 census total). No council created after the census was found.
- **Re-basing effect on aggregates:** With the authentic workbook values the 195-council structure leaves the national aggregate at 3.8 and moves 3 of 31 regional risks by 0.1 with no class change: the 170 to 195 move itself is not what raised the figures; the data modifications are (NAT-01).
- **Workbook arithmetic:** The 170 units' dimensions and risks recomputed from the workbook's cached component values with the engine's formulas: 0 mismatches.
- **Baseline raw file:** src/data/inform-baseline-raw.json equals the workbook's 'Indicator Data' sheet for all 53 used indicators and 170 units (9,010 cells; Mkinga matched by name because its P-code is blank in that sheet).
- **Region names:** The 31 region names agree across the council index, the regions boundary file, the workbook and the guide files (after normalisation).
- **Guide coverage:** The Risk Action Guide data cover 195 of 195 councils; the hazard counts cited in RC-03 (floods 187, heavy rainfall 168, strong winds 105, drought 81, large waves 62, landslides 61, wildfire 58, public health 55, earthquake 29) were reproduced exactly.
- **Roles and institutions:** A non-admin user cannot change their own role or institution (migration 0004 pins both in the profiles policy); sector officers can submit only indicators assigned to their institution (app.can_enter).
- **Raw-value scoring:** 51 of the 53 used indicators can be scored from a measured value with the frozen workbook reference; the two that cannot are degenerate upstream (UP-04, SRC-04).
- **Secrets:** Tracked .env.example and .env.demo hold placeholders only; the archived setup note contains no key; CI (typecheck, lint, tests, build) runs on every push and pull request.
- **Indicator integrity register:** node scripts/integrity-recheck.mjs rechecks every value of the 53 workbook indicators and 32 groups over the 170 units and every Advancement member over the 195 councils; 15 coded ground-truth checks (CHK-01 to CHK-15): the nine Core failures are the workbook's and carry data notes; every Advancement check passes.
- **Facility counts:** The 2022 PHC facility points joined to the 195 council polygons with the facility types filtered: 10,575 health facilities (of 10,649 in scope), 42,963 schools, 302,163 water points, 9,146 boreholes inside a council polygon.

## Sources consulted for the third pass

- Marin-Ferrer, M., Vernaccini, L., & Poljansek, K. (2017). Index for Risk Management INFORM: Concept and methodology, version 2017 (EUR 28655 EN). Publications Office of the European Union. https://publications.jrc.ec.europa.eu/repository/handle/JRC106949
- INFORM (2019). INFORM Subnational Risk Index: Guidance for developing subnational INFORM models, version 2 (March 2019). European Commission Joint Research Centre. https://drmkc.jrc.ec.europa.eu/inform-index/Portals/0/InfoRM/Subnational/INFORM%20Subnational%20Guidance%20v2%20March2019.pdf
- Poljansek, K., Papadimitriou, E., Marzi, S., et al. (2026). INFORM Severity Index: Concept and methodology, version 2026 (EUR 40592). https://doi.org/10.2760/2266313
- Poljansek, K., Thow, A., Kozma, R., et al. (2026). INFORM Warning user guide (JRC146982). https://doi.org/10.2760/4064723
- Bunge la Tanzania (2025, February 7). Majadiliano ya Bunge, Mkutano wa Kumi na Nane, Kikao cha Tisa: the Deputy Minister, PO-RALG, refers to 'Halmashauri zote 184'. https://polis.parliament.go.tz/uploads/documents/1741252099-07%20FEBRUARI%202025%20ALL.pdf
- National Bureau of Statistics (2022). 2022 Population and Housing Census: Administrative units population distribution report. https://sensa.nbs.go.tz/publication/volume1a.pdf ; 2022 PHC geodatabase (local copy in the TCVMP folder).

