# INFORM Tanzania: integrity assessment and issue matrix

Assessed 9 October 2026. Compared the authentic workbook `Tanzania - Country Model Template.xlsx` (identical to `data-source/tanzania-inform-risk.xlsx`) with the shipped data, the engine, the Methodology page and documentation, the tools and benchmarks in `inform_sheets/`, the data-entry workflow and the live database. The working matrix with every indicator is `INFORM_TZ_Issue_Matrix_2026-10.xlsx` in this folder. The core checks can be re-run at any time with `python3 scripts/audit/integrity_audit.py`.

## The principle used for this assessment

The core model must remain the authentic INFORM workbook: same indicators, same formulas, same values, except where a Tanzanian institution supplies a figure entered by the INFORM method. Every other Tanzanian improvement belongs in the Advanced layer, traceable to its data, and what the site says about its method must match what the engine does.

## Headline findings

- **National 'official 4.1':** Kondoa district's row (5/5 national fields identical). The workbook has no national risk.
- **Genuine national aggregate:** Authentic workbook 3.8 (H 2.4, V 3.8, LCC 6.2); current site data 4.3 (H 3.4, V 4.0, LCC 5.7).
- **Core vs workbook:** 165/170 units differ, in 21 of 32 indicator groups.
- **Risk classes:** 57/170 units in a different class from the authentic workbook; High 24 to 53; mean risk 3.80 to 4.07.
- **Rounding rule:** 68/510 stored dimension totals off the workbook rule; source units Chunya, Shinyanga, Momba and councils Chunya District, Shinyanga District wrongly High.
- **Judgement grades in the core:** Lightning 129 units, zoonoses 71, vehicle accidents 64, hazardous material 16; plus hard-coded flood, drought, landslide, coastal, earthquake, poverty, child nutrition, DRR, governance.
- **Advanced layer:** Defined and tested but never computed; 14/25 advanced indicators filled and traceable.
- **Data sources (53 scoring indicators):** All global; 15 uniform, 33 regional, 4 district-level; internet access has no data.
- **Data entry:** Institutions can enter raw values only; 63/78 indicators assigned; 0 approved values on the live site.

The engine and the indicator specification are authentic. The problems are in the data the engine is given, in the national figure, and in how the site describes them.

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

## Issue matrix

143 issues: 8 critical, 33 high, 63 medium, 39 low. Priority P0 = before external use and the 31 October deadline; P1 = next 2 to 4 weeks; P2 = planned; P3 = backlog. Effort S = up to 1 day, M = 2 to 5 days, L = 1 to 3 weeks, XL = institutional, longer.

| ID | Severity | Priority | Effort | Issue |
|---|---|---|---|---|
| NAT-01 | Critical | P0 | S | The "official national INFORM risk 4.1" is Kondoa district's row |
| COR-01 | Critical | P1 | L | The displayed core is not the authentic workbook: Tanzanian changes sit inside the core, not in the Advanced layer |
| COR-02 | Critical | P0 (label) / P1 (replace) | M | Hand-assigned grades are presented as data |
| COR-03 | High | P0 | S | Stored dimension totals use a rounding rule that is not in the workbook |
| COR-04 | High | P1 | S | The 'documented baseline' used as a floor is not the INFORM baseline |
| COR-05 | High | P1 | M | Raise-only cascades bias scores upward |
| COR-06 | High | P1 | M | Partly filled indicator groups make units incomparable |
| MET-01 | High | P1 | M | Drought index artefact (ours): wet highlands score 10 |
| MET-02 | High | P1 | S | WASH rebuilt from raw facility counts |
| MET-03 | Medium | P1 | M | Vulnerability adjustments change INFORM indicator definitions |
| MET-04 | Medium | P1 | S | Coping lowered by judgement for DRR initiatives |
| MET-05 | Medium | P2 | S | Two methodologies can apply to the same indicator group |
| MET-06 | Low | P2 | S | Frozen reference ranges differ from the workbook's dynamic ranges |
| MET-07 | Low | P2 | S | Regions average councils without weights |
| MET-08 | Low | P2 | S | Flood mixes hazard and exposure concepts |
| SRC-01 | High | P1 | XL | Most indicators carry regional or national values only |
| SRC-02 | Medium | P1 | XL | All 53 scoring indicators come from global datasets |
| SRC-03 | Medium | P1 | M | Stale vintages |
| SRC-04 | Medium | P1 | S | Internet access is switched on but has no data |
| SRC-05 | Medium | P1 | S | 15 indicators have no responsible institution in the live portal |
| SRC-06 | Low | P2 | S | Metadata inconsistencies |
| SRC-07 | Low | P2 | S | NORMAL Benchmark: Butiama carries Musoma's values |
| ADV-01 | High | P1 | M | The Advanced model is never computed or shown |
| ADV-02 | High | P1 | M | Many Tanzanian adjustments have no Advanced indicator |
| ADV-03 | Medium | P1 | L | 11 of 25 advanced indicators are empty |
| ADV-04 | Low | P2 | M | Basket weights are proposed, not calibrated |
| ADV-05 | Low | P3 | S | Some filled advanced indicators are district-level, not council-level |
| DE-01 | High | P1 | M | Institutions cannot deposit 0-10 values |
| DE-02 | Medium | P1 | M | Council-level vulnerability and coping data cannot be applied to one council through direct 0-10 entry |
| DE-03 | Medium | P1 | S | No downloadable template per institution |
| DE-04 | High | P0 | S | Sign-in email may not reach officers |
| DE-05 | Medium | P2 | S | Out-of-range values clamp silently |
| DE-06 | Medium | P2 | M | No dataset versions or snapshots |
| DOC-01 | Critical | P0 | S | The UI calls Kondoa's row the official national figure |
| DOC-02 | High | P0 | S | Claims of exact reproduction and traceability overstate the displayed data |
| DOC-03 | Medium | P1 | S | Limitations section is incomplete |
| DOC-04 | Low | P2 | S | 'A 0 is a real measured zero' is not true for two upstream indicators |
| DOC-05 | Low | P2 | S | Stale or inaccurate statements |
| ENG-01 | High | P0 | S | Tests lock in the wrong facts |
| ENG-02 | Medium | P1 | M | Data scripts edit the dataset in place |
| ENG-03 | Medium | P2 | S | Hazard computations cannot be reproduced by a collaborator |
| ENG-04 | Low | P3 | S | Kiswahili plural forms missing |
| OPS-01 | Medium | P0 | S | GitHub token exposed |
| OPS-02 | Medium | P1 | S | A second 'reference' workbook is broken and uses a different reference population |
| OUT-01 | Critical | P0 | S | The PMO proposal states false or stale facts |
| OUT-02 | Critical | P0 | S | Presentations state the false national figure |
| UP-01 | Medium | P2 | - | Dar es Salaam drought = 10 in the regional workbook |
| UP-02 | Medium | P2 | - | Coastal erosion indicator is degenerate for Tanzania |
| UP-03 | Low | P3 | - | Livelihoods raw value 0 in 108 units |
| PROV-01 | Critical | P0 | S | The source column shows the intended custodian, not where the value came from |
| UX-01 | High | P1 | M | Area profiles are too long for any single audience |
| UX-02 | Medium | P1 | S | Duplicated and low-value sections on area profiles |
| UX-03 | Medium | P1 | S | Region and national 'What to do' list every member council's text |
| UX-04 | Medium | P2 | M | The Methodology page is 27,000 px and overlaps Learn and the profiles |
| UX-05 | Low | P2 | S | Insights mixes decision charts with analyst charts |
| UX-06 | Medium | P0 (KPI) / P2 | S | Home repeats navigation and overstates data authority |
| UX-07 | Low | P2 | S | The 170 'INFORM units' level is offered to every user |
| UX-08 | Medium | P1 | S | Misleading national message: 'Earthquake is the most common top-scoring indicator' |
| RC-01 | Critical | P0 | S | The standing risk class is shown with official warning names and colours |
| RC-02 | High | P0 | S | Wording implies an active warning |
| RC-03 | High | P1 | M | Two different hazard pictures on the same page |
| RC-04 | High | P1 | M | Warning levels are per area, not per hazard and time |
| RC-05 | High | P1 | L | Coordinators cannot maintain the guidance |
| RC-06 | Medium | P1 | S | No crosswalk between guide hazards and INFORM indicator groups |
| RC-07 | Medium | P1 | M | No guidance on reducing vulnerability and lack of coping capacity |
| RC-08 | Low | P2 | S | No print card or SMS text for dissemination |
| GOV-01 | High | P1 | M | Roles cannot be limited to an area |
| GOV-02 | High | P1 | M | No review chain by level |
| GOV-03 | Medium | P2 | M | No hazard event reporting for district coordinators |
| GOV-04 | Medium | P1 | S | No record of official warnings |
| PIPE-01 | High | P0 (label) / P1 | S | Earthquake is labelled as computed from the USGS catalogue, but that step was never applied |
| PIPE-02 | Medium | P1 | S | The shipped dataset is reproducible only approximately, from scripts that mutate it in place |
| MET-09 | Medium | P2 | S | Drought composite: uncited weights and a second min-max stretch |
| SEV-01 | Low | P2 | S | No zero rule when impact or conditions are zero |
| SEV-02 | Low | P3 | M | Track the 2026 revision of the INFORM Severity methodology |
| LRN-01 | High | P0 | S | The course teaches the false national figure as 'official' |
| COV-01 | Medium | P1 | S | 'Data coverage' counts hand grades as data |
| SEC-01 | Low | P2 | S | The content security policy allows inline scripts |
| TST-01 | High | P1 | S | No test guards the shipped data or the provenance shown |
| MET-10 | Medium | P2 | S | Natural hazards are averaged; INFORM's own method combines hazards with the inverted geometric mean |
| MET-11 | Low | P3 | S | Human hazard averages conflict with technological hazards; INFORM Global takes the maximum of current and projected conflict |
| MET-12 | Medium | P2 | M | Risk classes use SADC-wide thresholds that hardly separate Tanzanian units; categories have no classes |
| MET-13 | Medium | P2 | S | The model's statistical coherence was never checked |
| MET-14 | Medium | P2 | M | No reliability measure is shown beside the scores |
| MET-15 | High | P1 | M | Updates, validation and versions do not follow the INFORM process |
| MET-16 | Medium | P3 | M | Advanced hazards measure hazard intensity, not people exposed |
| ADM-01 | High | P1 | S | Twelve urban councils use the rural district's data; twelve workbook units are never used |
| ADM-02 | Low | P2 | S | Wrong council type and names; renamed councils shown as new |
| ADM-03 | High | P1 | M | Council identifiers are positional, not official |
| ADM-04 | Low | P2 | S | '195' is hard-coded in tests, page text and scripts |
| ADM-05 | Medium | P1 | M | 50 councils share 25 workbook units; their values are not their own |
| ADM-06 | Low | P3 | S | No procedure for boundary changes (new councils, wards) |
| OUT-03 | High | P0 | S | Other shareable documents repeat the district row as the national figure and describe raise-only and USGS as method |
| EXP-01 | Medium | P1 | S | Downloads carry the displayed values and the misattributed sources with no version, date or lineage |
| TOOL-01 | Medium | P1 | S | The collection tools' council rows carry the rural unit's raw values for the twelve mislinked councils |
| TOOL-02 | Low | P2 | M | The ADVANCED Excel tool's formulas have never been compared with the engine |
| SEC-02 | Low | P2 | S | Officers' names are readable by anonymous clients through the API |
| SEC-03 | Low | P3 | S | A dependency with a known high-severity vulnerability is listed as a runtime dependency |
| DE-07 | Medium | P2 | M | Institutions are not notified of requests or decisions |
| DE-08 | Low | P3 | S | The database accepts direct-edit submissions for unknown units and indicator keys |
| TST-02 | Low | P3 | S | Accessibility checks are not automated |
| DOC-06 | Low | P2 | S | 'Data as of June 2026' is stale |
| RC-09 | Low | P2 | S | Eight councils have no documented-hazard statement in the guide |
| UP-04 | Low | P3 | - | 'Density of health facilities' has a custom range of 0 to 0 and never scores |
| SRC-08 | Low | P2 | S | Council populations are transcribed from a third-party site |
| UP-05 | Medium | P2 | - | Drought frequency puts the semi-arid Lake zone at the minimum |
| UP-06 | Medium | P2 | - | Kagera has zero earthquake exposure despite the 2016 Bukoba earthquake |
| UP-07 | Low | P3 | - | Ukerewe, a flat island, is the most landslide-exposed unit |
| UP-08 | Medium | P2 | - | Internal displacement is assigned to the wrong regions |
| UP-09 | Medium | P2 | - | Access to electricity is 100% for Dodoma region |
| UP-10 | Low | P3 | - | The earthquake index sits at its ceiling for 49 units |
| UP-11 | Low | P3 | - | The flood model gives Kinondoni a tenth of Ilala's exposure |
| ADV-06 | High | P1 | M | Facility densities counted drug outlets as health facilities, on district polygons |
| ADV-07 | Medium | P2 | S | Six member reference ranges did not fit the council spans |
| ADV-08 | Medium | P2 | S | The earthquake basket measured frequency only, so a single damaging event did not count |
| RC-10 | High | P1 | M | Profiles communicated warnings and advice where the programme communicates standing risk |
| RC-11 | Low | P1 | S | Two emergency numbers were shown |
| DE-09 | Medium | P1 | M | No single screen let the Office control the distribution of data-serving responsibilities |
| DOC-07 | Medium | P1 | S | The live Methodology page carried the research analyses as well as the operational documentation |
| UX-10 | Low | P2 | S | Learning pages used half the screen and the course progress was easy to miss |
| DATA-01 | High | P1 | L | Six indicator groups of the template had no data and eight values were withheld, leaving the model thin |
| DATA-02 | Medium | P1 | M | Template indicators without data had no Tanzanian definition the engine could score |
| DATA-03 | Medium | P1 | M | Suspicious workbook values were corrected by hand nowhere: the system could not show a corrected value with its lineage |
| TOOL-03 | Medium | P1 | M | The collection tools did not carry the activated indicators or the benchmark values, and a filled tool could not be imported |
| DATA-05 | Low | P2 | L | Zoonoses, plants and pests, and hazardous material still have no validated council dataset |
| DE-10 | Medium | P1 | S | Reviewers could type a 0-10 score for an indicator group (Enter scores, Bulk paste) |
| UX-11 | Low | P2 | S | The header listed six sections side by side |
| UX-12 | Medium | P1 | S | Every council and region showed 'Updated' after the Benchmark 2026 |
| PERF-01 | Medium | P1 | S | The Benchmark 2026 file tripled the application's first download |
| RC-15 | Medium | P1 | S | The explorer card and the profile listed different hazards for the same council |
| RC-16 | High | P1 | S | The low band's planning message promised 'few hazard constraints' where a natural hazard is very high |
| UX-13 | Medium | P1 | S | Keyboard focus is lost after selecting an area in the explorer |
| UX-14 | Low | P2 | S | The explorer has no national panel |
| RC-12 | Medium | P1 | S | Three colour systems on one screen |
| RC-13 | Medium | P1 | S | Human hazards would read as a council's own hazards |
| RC-14 | Low | P2 | M | The Guide Book's statements are not tagged by hazard, and its hazards disagree with the model's in measurable ways |
| DATA-06 | Medium | P1 | S | Internal violence counts (ACLED, by region) are too complicated to communicate as a council's hazard |
| DATA-07 | Medium | P1 | S | Vehicle accidents did not show the big cities: a regional death rate put rural highway regions first |
| DATA-08 | Medium | P1 | S | The benchmark's council population file gave 29 councils a neighbour's population |
| UX-15 | Medium | P1 | M | Selecting an area showed no map of it, no trends and no statements of its own |
| DATA-09 | High | P1 | M | DRR implementation was one national value: a council's own preparedness changed nothing |
| DATA-10 | Medium | P1 | M | Governance was a national score and a regional corruption index: the committees' functioning was not measured |
| LRN-02 | High | P0 | S | The course taught two non-INFORM rules as INFORM: a log-scaled density exposure index that amplifies flood, and a refugee-driven 'displaced people' score for Kasulu |

### Details

**NAT-01 The "official national INFORM risk 4.1" is Kondoa district's row** (Critical, P0, effort S)

- Evidence: scripts/lib/informRiskDataService.js calculateNationalAggregates() takes the first unit ('We use the first district's values'). Every national field equals Kondoa's workbook row: drought 4.3, earthquake 10, natural 3.544444444, human 0.6833333333, H 2.2, V 5.5, LCC 5.9, risk 4.1. The workbook contains no national risk calculation ('Data - National' holds national-level input indicators only). Genuine aggregates by the INFORM method: authentic workbook values 3.8 (H 2.4, V 3.8, LCC 6.2) both over the 170 units and over the 195 councils (the re-basing itself changes nothing nationally); current site data 4.2 over the 170 units and 4.3 over the 195 councils (H 3.4, V 4.0, LCC 5.7). The rise from 3.8 is the data modifications (COR-01, COR-02) plus about 0.1 from the raise-only council hazards.
- Impact: The headline national figure, the national profile and every "X points above/below the official national value" statement on area profiles are false. Repeated in CHANGELOG, METHODOLOGY_MANUAL, WORKED_EXAMPLE, two presentations (one in the SADC format) and the PMO proposal. Genuine aggregates by the INFORM method: authentic workbook (170 units) 3.8 (H 2.4, V 3.8, LCC 6.2); current site data (195 councils) 4.3 (H 3.4, V 4.0, LCC 5.7).
- Fix: Define the national figure explicitly. Recommended: the INFORM aggregate of the councils (same method as regions: indicator means, category means, scaled geometric mean, cube root), labelled as such; optionally show the INFORM Global country value separately with its version. Replace calculateNationalAggregates, regenerate the data, update UI text, docs and tests, correct external outputs.
- Decision / owner: User / PMO: decision D1 (definition of the national figure)
- Acceptance: A test recomputes the national value from councils; it equals no single unit; the label states the method.

**COR-01 The displayed core is not the authentic workbook: Tanzanian changes sit inside the core, not in the Advanced layer** (Critical, P1, effort L)

- Evidence: Leaf-by-leaf comparison of src/data/tanzania-inform-risk.json with the workbook (sha 1da34336, identical to the root 'Tanzania - Country Model Template.xlsx'): 165/170 units differ in 21 of 32 indicator groups. Added where the workbook has no value: heatwave 138, lightning 129, zoonoses 71, vehicle accidents 64, hazardous material 16. Raised: drought 133 (up to +7.7), health 86, flood 54, child health 45, storms 29, poverty 27, coastal 25, earthquake 20, landslide 13, livelihoods 13, volcano 9, displaced 6, wildfire 3. Lowered (lack of coping): WASH 114 (and raised in 22), DRR 41, governance 35. Reproduce: python3 scripts/audit/integrity_audit.py
- Impact: 57/170 units (34%) are in a different risk class from the authentic model; High-risk units 24 to 53; mean risk 3.80 to 4.07. Users are told the scores are INFORM; they are INFORM plus Tanzanian adjustments with no visible separation.
- Fix: Rebuild the core strictly from the workbook (inform-baseline-raw.json through the engine) plus approved institutional values entered by the INFORM method. Move every Tanzanian adjustment into the Advanced layer as labelled sub-indicators with lineage. Show Core and Advanced as explicit views with per-unit deltas.
- Decision / owner: User: decision D2 (principle and default view)
- Acceptance: Audit script: COR-01 'units differing' = 0/170 when no institutional value is approved; Advanced deltas listed per unit with source.

**COR-02 Hand-assigned grades are presented as data** (Critical, P0 (label) / P1 (replace), effort M)

- Evidence: scripts/build-hazard-overlays.mjs assigns 0-10 grades by region and district for lightning, volcano, zoonoses, earthquake, wildfire, vehicle accidents and hazardous material ('researched rules'); no dataset is processed. One basis text per hazard is stamped on every row: Rombo (Kilimanjaro) and Momba (Songwe) lightning cite a 'Lake Victoria basin hotspot'. Vehicle accidents cite 'police road-accident data' but the code says values were 'kept moderate'. scripts/refill-real-hazards.mjs hard-codes flood (8.5 Kilosa, Kilombero, Ulanga, Rufiji, Kyela; 8.0 all of Dar es Salaam region; 7.5 all of Kigoma), drought (7.0 Dodoma, Singida, Shinyanga, Simiyu), landslide, coastal (7.0), earthquake, poverty (8.5 Geita...), child nutrition (9.0 Iringa...), DRR and governance. storm_cyclone_exposure.csv grades storms in 37 rows from named events. Lightning flash density is empty in the Advanced Benchmark: the lightning grades have no measured basis anywhere.
- Impact: Expert judgement changes 165 units' scores. The Methodology page's limitations section does disclose '9 documented overlays graded from evidence rather than a gridded dataset' and 'raise-only flooring', and the source legend has a 'Documented overlay' label; but the same page's headline text calls the values 'the Tanzanian data layer', 'traceable to its authority', and the disclosure sits at the foot of a 27,000 px page, so the two statements contradict each other.
- Fix: Remove judgement grades from the core now, or label them on every display. In Advanced, replace each with a gridded dataset (LIS/OTD lightning, GEM PGA already in the workbook, MODIS/VIIRS or the TFS fire points on file, police accident counts, IBTrACS) or keep it as an 'expert assessment' sub-indicator with named assessor, method and date.
- Decision / owner: User: decision D3 (drop, or keep as labelled expert assessments)
- Acceptance: Every non-workbook value carries dataset, method and date; no basis text is shared across unrelated places.

**COR-03 Stored dimension totals use a rounding rule that is not in the workbook** (High, P0, effort S)

- Evidence: Workbook cells Z/AK/AU combine UNROUNDED category means (e.g. S = 3.544444444). The shipped data rounds each category to one decimal first: stored totals = ROUND(sgm(rounded categories)) in 510/510 dimensions, but follow the workbook rule in only 442/510. 68/510 source-unit dimension totals, 87 council dimension totals and 20 risks differ by 0.1.
- Impact: Source units Chunya, Shinyanga and Momba show High (4.3) but are Medium (4.2) under the workbook rule; at council level 20 risks change by 0.1 and two councils change class (Chunya District and Shinyanga District, High to Medium; Momba District stays High on its own hazard values). Unedited units show stored totals while edited units are recomputed unrounded, so an approval can move an untouched dimension by 0.1.
- Fix: Store leaves only; derive categories, dimensions and risk at runtime with unrounded categories (the engine already does this for edited units). Add an integrity test: stored == recompute from leaves.
- Decision / owner: No decision needed
- Acceptance: Audit script: COR-03 = 0/510; the three source units and two councils reclassify.

**COR-04 The 'documented baseline' used as a floor is not the INFORM baseline** (High, P1, effort S)

- Evidence: data-source/hazard_baseline.csv differs from the workbook in drought (27 units, e.g. Kondoa 4.3 to 7.0), coastal (25, Pangani 0 to 7.0), flood (18, Kilosa 6.9 to 8.5), landslide (13, Rombo 4.2 to 7.0) and earthquake (8, Kibondo 0 to 6.0): the hand refills of COR-02. Scripts and the manual call it the documented baseline and floor computed values at it. (vuln_baseline.csv does match the workbook.)
- Impact: The precautionary floor protects judgement values, not INFORM values.
- Fix: Regenerate any baseline from the workbook only; remove the floor from the core (COR-01).
- Decision / owner: No decision needed
- Acceptance: Audit script: COR-04 all zero.

**COR-05 Raise-only cascades bias scores upward** (High, P1, effort M)

- Evidence: Each stage keeps the maximum of the previous value and a new estimate: workbook, hand refills, district climate, council climate. 135 units raised vs 15 lowered; drought raised in 133 units (up to +7.7) and again in 125 councils; flood in 56 councils; heatwave in 25.
- Impact: A maximum over several estimates is biased upward; regional and national aggregates inherit the bias.
- Fix: In Advanced, combine sources with the basket (weighted mean over the members present) already in the engine; never floor. Treat precaution as an interpretation rule, not a computation rule.
- Decision / owner: User: decision D2
- Acceptance: No max() combination of sources remains in the pipeline.

**COR-06 Partly filled indicator groups make units incomparable** (High, P1, effort M)

- Evidence: Added groups are null where not graded, never 0: hazardous material null in 154 units, vehicle accidents 106, zoonoses 99, lightning 41, heatwave 32. The natural- and human-hazard categories are plain means, so units are averaged over different sets of groups.
- Impact: Unequal denominators across units; documenting a low hazard can lower a unit below an otherwise identical unit with no value.
- Fix: In Advanced a group is assessed for every unit (0 where absent, with evidence) or not used. Physical layers (heatwave, lightning) are computed for every unit, including units that share a polygon.
- Decision / owner: No decision needed
- Acceptance: Every Advanced group has 0 nulls or is excluded.

**MET-01 Drought index artefact (ours): wet highlands score 10** (High, P1, effort M)

- Evidence: Lushoto and Bumbuli = 10.0 (workbook 4.3); they outrank arid Longido (9.7). Root cause in scripts/compute-drought-spi-spei.py: the 'main rainy season' is the single wettest 4-month window of the climatology (argmax over start months). In bimodal Lushoto that window is Oct-Jan, the erratic short rains (season CV 0.46, failure rate 0.35); neighbouring Korogwe, with the same rainfall (1,023 vs 1,053 mm), selects Feb-May, the reliable long rains (CV 0.24, failure 0.21) and scores 7.3. The composite is then min-max scaled a second time, so the most extreme district always becomes exactly 10. Councils use the same method (Bumbuli 10).
- Impact: The national drought ranking is topped by an artefact.
- Fix: Score both rainy seasons (MAM and OND) in bimodal zones using data-source/seasonality_zones.csv; validate against MUCHALI/IPC history; Advanced only.
- Decision / owner: No decision needed
- Acceptance: Wet highland councils fall below the arid north; validation table published.

**MET-02 WASH rebuilt from raw facility counts** (High, P1, effort S)

- Evidence: scripts/enrich-coping-facilities.mjs sets WASH = rank of (water points + boreholes) mapped onto 2-8, overwriting the workbook WASH in 136 units. Counts are not divided by population or area. (The workbook's two WASH indicators are national values, uniform for every unit.)
- Impact: Large or populous districts look better served because they are large; this is not the INFORM definition (% using basic water and sanitation).
- Fix: Remove from the core. Enter council-level % of households with an improved water source and toilet facility from the 2022 Census (NBS) or MoW data as raw values for CC.INF.WASH-WF and CC.INF.WASH-SAN.
- Decision / owner: No decision needed
- Acceptance: WASH traces to a % indicator with source and year.

**MET-03 Vulnerability adjustments change INFORM indicator definitions** (Medium, P1, effort M)

- Evidence: Health conditions replaced by a regional HIV (THIS 2022-23) + malaria (TDHS-MIS 2022) min-max blend in 86 units; child health and nutrition raised from TDHS 2022 stunting grades (INFORM uses child mortality and underweight); poverty set by HBS 2017-18 grades per region; livelihoods from IPC phases mapped by hand (Phase 3 = 9, Phase 2 = 7); displaced people scaled from UNHCR counts.
- Impact: Same indicator name, different definition; not comparable with INFORM elsewhere.
- Fix: Enter survey figures as raw values for the matching INFORM indicators (TDHS 2022 for child mortality and underweight, MAP or TDHS for malaria prevalence) so the workbook standardiser scores them; keep measures INFORM does not define (stunting, HIV) in Advanced.
- Decision / owner: No decision needed
- Acceptance: No core vulnerability value without a workbook indicator behind it.

**MET-04 Coping lowered by judgement for DRR initiatives** (Medium, P1, effort S)

- Evidence: DRR implementation lowered in 41 units and governance in 35 for regions with an EOCC/ERT, drought anticipatory-action districts and EPRP districts. INFORM's DRR indicators are national (Sendai score, early warning).
- Impact: Coping improvements without a measured indicator.
- Fix: Define an Advanced 'local DRR capacity' sub-indicator with a published rubric (EOCC, trained ERT, adopted EPRP, completed RVCA), assessed by PMO-DMD with dates; keep it out of the core.
- Decision / owner: User: rubric approval
- Acceptance: Rubric published; each council lists its evidence.

**MET-05 Two methodologies can apply to the same indicator group** (Medium, P2, effort S)

- Evidence: deriveRawOverrides rebuilds a group from the workbook baseline raw values as soon as any institutional figure is approved, discarding the refill or computed value shown before. A national-level figure applies to all 195 councils.
- Impact: Approving one figure can silently replace a whole layer.
- Fix: Resolved by COR-01 (the core uses the workbook method everywhere). Until then, warn reviewers when an approval switches a group's method.
- Decision / owner: No decision needed
- Acceptance: Review screen shows the method of the current and the proposed value.

**MET-06 Frozen reference ranges differ from the workbook's dynamic ranges** (Low, P2, effort S)

- Evidence: The workbook's data-range min/max are MIN/MAX over current Tanzanian data (dynamic); the engine freezes them at the 2024 values. Identical on baseline data; a new extreme clamps at 0/10 in the engine but rescales every unit in the workbook. INFORM itself prefers fixed, predefined min and max values, kept stable through time and re-evaluated about every five years (Concept and Methodology 2017, section 6.3), so the engine follows the INFORM guidance more closely than the workbook does.
- Impact: Silent clamping of new extreme values; undisclosed difference from the workbook.
- Fix: Keep frozen ranges (INFORM practice, and needed for comparability across levels and releases); disclose it; flag out-of-range submissions; re-evaluate the ranges at a fixed interval (INFORM: about five years) or at a declared release.
- Decision / owner: User: re-basing rule
- Acceptance: Out-of-range values trigger a warning; rule documented.

**MET-07 Regions average councils without weights** (Low, P2, effort S)

- Evidence: aggregateUnits takes plain means over councils; 25 workbook units each back two councils (34 with the current mislinks, ADM-01), so their values count once per council. Measured on the authentic workbook values: counting per council instead of per unit changes 3 of 31 regional risks by 0.1 (Iringa, Katavi, Mtwara), no class changes, and leaves the national aggregate at 3.8.
- Impact: Small today, but split units weigh more in their region and the rule is undocumented; the region's exposure index is likewise the mean of its councils' indices rather than recomputed from the region's density.
- Fix: Aggregate vulnerability and coping over distinct source units, or population-weight; document the rule.
- Decision / owner: No decision needed
- Acceptance: Rule documented and tested.

**MET-08 Flood mixes hazard and exposure concepts** (Low, P2, effort S)

- Evidence: Core flood = max(h, sqrt(h x exposure)) with h = max(documented flood, heavy-rain index, event index). The workbook's flood indicator (JRC flood exposure) already measures exposed population. Manual, engine and data agree (138/138 units), but the concept differs from INFORM.
- Impact: Exposure counted twice for flood; differs from INFORM.
- Fix: Keep the workbook flood exposure in the core; move the composite to Advanced.
- Decision / owner: No decision needed
- Acceptance: Core flood == workbook flood.

**SRC-01 Most indicators carry regional or national values only** (High, P1, effort XL)

- Evidence: Of 53 scoring indicators: 31 keyed at region, 16 national, 6 district. In the data, 15 have one value for all 170 units, 33 vary only by region, 4 vary by district (deforestation, landslide, flood and earthquake exposure).
- Impact: Council differences in vulnerability and coping are regional differences; 'council-level risk' overstates the resolution.
- Fix: Prioritise council-level institutional data for uniform and regional indicators that have council sources: 2022 Census (WASH, literacy, electricity, urban population, dependency ratio), MoH DHIS2 (immunisation, facilities), HRHIS (health workers).
- Decision / owner: Institutions via PMO-DMD
- Acceptance: Coverage dashboard shows the share of council-level values per indicator.

**SRC-02 All 53 scoring indicators come from global datasets** (Medium, P1, effort XL)

- Evidence: Workbook Metadata: Global Data Lab, World Bank, WHO, JRC, FAO, GEM, ACLED, IDMC, OPHI, UN-Habitat, MAP, NOAA, UNDRR, Anticipation Hub, Heidelberg, Digital Earth Africa, 4TU, HDX. None from a Tanzanian institution.
- Impact: National ownership and currency of the data are limited.
- Fix: Through data entry, let custodians replace each global proxy with national data on the same definition, keeping the global value as the baseline.
- Decision / owner: Institutions via PMO-DMD
- Acceptance: Register shows a Tanzanian source for each indicator.

**SRC-03 Stale vintages** (Medium, P1, effort M)

- Evidence: Child mortality and underweight 2006-2021 and immunisation coverage 2006-2021 (before TDHS 2022); landslide exposure 1980-2018; MPI 2012-2021; soil erosion year unknown; flood exposure 'modelled, n/a'.
- Impact: Scores reflect conditions up to a decade old.
- Fix: Update with TDHS-MIS 2022, PHC 2022 and recent sector data via data entry.
- Decision / owner: Institutions
- Acceptance: Every indicator has a stated year of 2019 or later, or a recorded reason.

**SRC-04 Internet access is switched on but has no data** (Medium, P1, effort S)

- Evidence: CC.INF.COM-INT (Use = Yes) has no value in any of the 170 units; communication is the mean of two indicators.
- Impact: Communication under-specified.
- Fix: Obtain TCRA/NBS internet access data, or record a documented decision to switch it off.
- Decision / owner: User
- Acceptance: Indicator has data or a recorded decision.

**SRC-05 15 indicators have no responsible institution in the live portal** (Medium, P1, effort S)

- Evidence: Live indicator_assignments: 63 of 78. Unassigned: conflict (CBAR, GCRI, VIO-EVE, VIO-FAT), environmental degradation (ED-DEF, DE-ERO), economic dependency (ODA, REM, DR), economic capacity (INC, IWI, GDP), communication (ELEC, INT, PHONE). The NORMAL Excel tool names a lead for each (e.g. MoHA, TPF, NEMC, NBS, TCRA).
- Impact: No one is asked to update these indicators.
- Fix: Assign them in the portal, consistent with the NORMAL tool.
- Decision / owner: PMO reviewer
- Acceptance: 78/78 assigned.

**SRC-06 Metadata inconsistencies** (Low, P2, effort S)

- Evidence: HA.NAT.DE-ERO and VU.VG.HC-LEXP are keyed 'National' but hold 25 distinct values. Mkinga has no workbook value for 6 hazard indicators, and its ADM2_PCODE is blank in the 'Indicator Data' sheet (the row is matched by name; the baseline raw file carries its values correctly).
- Impact: Resolution labels mislead; Mkinga hazards partly missing.
- Fix: Correct keyed_at in the spec; source Mkinga hazards (GST/TMA).
- Decision / owner: No decision needed
- Acceptance: Spec resolution matches the data.

**SRC-07 NORMAL Benchmark: Butiama carries Musoma's values** (Low, P2, effort S)

- Evidence: 10,130 of the 10,134 filled Benchmark cells equal the workbook. The 4 that differ are C148 Butiama District, holding Musoma's (TZ2003) earthquake, deforestation, flood and landslide raw values instead of Butiama's own.
- Impact: One council benchmarked with a neighbour's data.
- Fix: Rebuild the Benchmark row from Butiama's workbook values.
- Decision / owner: No decision needed
- Acceptance: Benchmark == workbook for all filled cells.

**ADV-01 The Advanced model is never computed or shown** (High, P1, effort M)

- Evidence: computeAdvanced has no callers outside tests; the app passes only the core spec to deriveRawOverrides (DataProvider.tsx:235, workflow.ts:317). Figures approved for the 25 advanced indicators, which institutions can be assigned, change no score.
- Impact: Institutional work on advanced indicators has no visible effect; the place where Tanzanian changes belong does not run.
- Fix: Compute Advanced alongside Core from the same approved data; add a Core/Advanced switch with per-unit deltas and lineage.
- Decision / owner: User: decision D2 (default view)
- Acceptance: An approved advanced figure changes the Advanced score and not the Core.

**ADV-02 Many Tanzanian adjustments have no Advanced indicator** (High, P1, effort M)

- Evidence: The advanced spec covers drought (7), flood (5), coastal (5), landslide (2), storms (2), earthquake (2), heatwave (1) and lightning (1). Zoonoses, vehicle accidents, hazardous material, volcano, wildfire and every vulnerability and coping adjustment exist only in the core.
- Impact: Moving adjustments out of the core has no destination yet.
- Fix: Add each retained adjustment as an advanced sub-indicator with unit, range, weight, owner and source, or drop it.
- Decision / owner: User: decision D3
- Acceptance: Every retained adjustment has an advanced spec entry.

**ADV-03 11 of 25 advanced indicators are empty** (Medium, P1, effort L)

- Evidence: Advanced Benchmark: no values for lightning flash density, seismic hazard (PGA), river peak, basin flood records, recorded flood events, water levels, cyclone frequency, wave height, onshore wind, storm surge, shoreline retreat, mangrove loss. The 14 filled ones trace exactly to data-source/*.csv.
- Impact: Baskets run on part of their members.
- Fix: Compute from open data (LIS/OTD, GEM, IBTrACS, ERA5 waves, Digital Earth Africa coastlines, Global Mangrove Watch) or request from TMA, MoW/basin boards and NEMC.
- Decision / owner: Institutions / analysts
- Acceptance: 25/25 filled or documented as unavailable.

**ADV-04 Basket weights are proposed, not calibrated** (Low, P2, effort M)

- Evidence: Weights in inform-advanced-spec.json come from the literature; no sensitivity analysis or validation.
- Impact: Advanced scores unvalidated.
- Fix: Sensitivity analysis and validation against recorded events before Advanced scores inform decisions.
- Decision / owner: No decision needed
- Acceptance: Validation report published.

**ADV-05 Some filled advanced indicators are district-level, not council-level** (Low, P3, effort S)

- Evidence: SPEI, rainfall variability and season failure (174/195) and seismicity (175/195) are copied from district files; 21 councils are blank.
- Impact: Councils inherit district values; 21 councils missing.
- Fix: Compute on council polygons, as already done for aridity, NDVI and wind.
- Decision / owner: No decision needed
- Acceptance: 195/195 council values.

**DE-01 Institutions cannot deposit 0-10 values** (High, P1, effort M)

- Evidence: Sector users see only the Indicators tab (raw measured values). Direct 0-10 entry and bulk paste are reviewer-only and act on the 32 indicator groups, not on individual indicators.
- Impact: An institution that has already computed scores (for example with the NORMAL Excel tool) cannot submit them.
- Fix: Implement entry path B of the Data management design: indicator-level 0-10 values from institutions, method declared and verified.
- Decision / owner: User: decision D4
- Acceptance: An institution submits 0-10 values for 4 councils; only those 4 change after approval.

**DE-02 Council-level vulnerability and coping data cannot be applied to one council through direct 0-10 entry** (Medium, P1, effort M)

- Evidence: Direct 0-10 entries (submissions) for vulnerability and coping target the INFORM source unit (src/features/data/lib/targets.ts: 'edits MUST target the source unit, so every sibling council...'), so they reach every council that shares the unit. Correction to the first pass: the measured-value path (raw_values) already resolves per council: deriveRawOverrides keys its overrides by council id and buildModel applies them to that council only (copy-on-write).
- Impact: An institution with council data changes siblings it has no data for.
- Fix: Offer council-level direct 0-10 entry for vulnerability and coping with finest-level-wins, or route council entries through the measured-value path; label values shared from the unit.
- Decision / owner: No decision needed
- Acceptance: A council-level value changes one council only.

**DE-03 No downloadable template per institution** (Medium, P1, effort S)

- Evidence: The NORMAL and ADVANCED Excel tools are kept local (commit 745ad31) and are not offered in the portal.
- Impact: Offline institutions have no official round-trip format.
- Fix: Generate a template per institution (its indicators x councils, regions and a national row) with a value-type column (raw or 0-10); accept it back by upload.
- Decision / owner: No decision needed
- Acceptance: Template download and upload work for one pilot institution.

**DE-04 Sign-in email may not reach officers** (High, P0, effort S)

- Evidence: docs/DEPLOYMENT.md: the built-in Supabase sender only reaches organisation members; custom SMTP is required before inviting officers. Not verifiable from here. Live: 0 approved values.
- Impact: Officers may never receive the sign-in link.
- Fix: Verify or configure SMTP; test an invitation end to end with one institution.
- Decision / owner: Admin
- Acceptance: A non-member officer signs in from an emailed link.

**DE-05 Out-of-range values clamp silently** (Medium, P2, effort S)

- Evidence: Standardisation clamps to 0-10 against frozen ranges (MET-06).
- Impact: A unit error can pass as a maximum score.
- Fix: Warn the submitter and flag the reviewer when a raw value falls outside the reference range.
- Decision / owner: No decision needed
- Acceptance: Warning shown in entry and review.

**DE-06 No dataset versions or snapshots** (Medium, P2, effort M)

- Evidence: One 'as of' date (2026-06) for the whole dataset; approvals overwrite values.
- Impact: No time series; cannot show change after investment.
- Fix: Create a dated version per approval batch and allow comparison between versions.
- Decision / owner: No decision needed
- Acceptance: Two versions can be compared on the map.

**DOC-01 The UI calls Kondoa's row the official national figure** (Critical, P0, effort S)

- Evidence: src/i18n/locales/en/area.json: 'This is the official INFORM Tanzania country figure. It is not re-aggregated from councils.' and '{{d}} points above the official national value'. methodology.json levels.national: 'reported as published'.
- Impact: False statements on every area profile and the Methodology page.
- Fix: Fix with NAT-01.
- Decision / owner: User: D1
- Acceptance: No 'official' wording without a published source.

**DOC-02 Claims of exact reproduction and traceability overstate the displayed data** (High, P0, effort S)

- Evidence: Methodology page: 'reproduces it exactly', 'cell for cell', 'each traceable to its authority', 'its values come from the Tanzanian data layer'; the advanced section says 'scores shown elsewhere in this application follow the standard INFORM structure until sector data fill the baskets'. True of the engine, not of the displayed values (COR-01, COR-02, COR-03). The limitations section at the end of the page partly contradicts the headline claims (overlays, raise-only floor, Dar es Salaam drought).
- Impact: Readers believe the scores are authentic INFORM values.
- Fix: Reword now; after COR-01, label every displayed value with its lineage (Workbook, Institution, Computed, Expert judgement).
- Decision / owner: No decision needed
- Acceptance: Every value shows its lineage label.

**DOC-03 Limitations section is incomplete** (Medium, P1, effort S)

- Evidence: It discloses 9 graded overlays, but not the vulnerability and coping adjustments, the WASH rebuild, what the floor contains, or that Lushoto's 10 is our own artefact.
- Impact: Partial disclosure.
- Fix: Update after decisions D1 to D3; publish the register of adjustments.
- Decision / owner: No decision needed
- Acceptance: Limitations list matches the audit.

**DOC-04 'A 0 is a real measured zero' is not true for two upstream indicators** (Low, P2, effort S)

- Evidence: The workbook's coastal erosion is 0 for every coastal district; livelihoods (insufficient food) is 0 in 108 units, likely 'not analysed'.
- Impact: Misleading statement.
- Fix: Document the exceptions.
- Decision / owner: No decision needed
- Acceptance: Exceptions listed on the Methodology page.

**DOC-05 Stale or inaccurate statements** (Low, P2, effort S)

- Evidence: METHODOLOGY_MANUAL item 7 'min over our 150 districts'; the apply-climate-hazards.mjs header gives an old flood formula; CHANGELOG '78 workbook indicators (53 in the INFORM score, 25 advanced)' (the 25 are advanced research indicators, not workbook indicators); scripts claim to match TZ_INFORM_model.xlsx.
- Impact: Confusion for maintainers.
- Fix: Edit the statements.
- Decision / owner: No decision needed
- Acceptance: Statements match the code.

**ENG-01 Tests lock in the wrong facts** (High, P0, effort S)

- Evidence: Tests that lock in wrong facts: workbook.golden.test.ts 'national 2.2 / 5.5 / 5.9 -> 4.1'; model.test.ts expect(model.national.risk).toBe(4.1); alert.test.ts (ALERT_BY_CLASS mapping); AreaPage.test.tsx (alert category in the profile); DataPortalPage.smoke.test.tsx ('The official baseline is in use'); dataset.integrity.test.ts compares stored totals with stored rounded categories, so COR-03 passes. Missing: a test that the shipped core equals the workbook, and a test that each displayed source equals the value's lineage.
- Impact: Correct fixes would fail CI; wrong facts look verified.
- Fix: Rewrite invariants: national = defined aggregate; stored == recompute from leaves; core leaves == workbook.
- Decision / owner: No decision needed
- Acceptance: New invariants pass after the fixes and fail on the current data.

**ENG-02 Data scripts edit the dataset in place** (Medium, P1, effort M)

- Evidence: refill-real-hazards, build-hazard-overlays, apply-climate-hazards, apply-vulnerability and enrich-coping-facilities each rewrite tanzania-inform-risk.json; results depend on run order (a reset-to-baseline step is needed).
- Impact: Not reproducible; easy to compound changes.
- Fix: One deterministic build: workbook to core JSON; sources to advanced JSON; nothing mutated in place; checksums recorded.
- Decision / owner: No decision needed
- Acceptance: Two clean builds produce identical files.

**ENG-03 Hazard computations cannot be reproduced by a collaborator** (Medium, P2, effort S)

- Evidence: Climate scripts read CHIRPS/ERA5 from paths outside the repository (/home/kaijage/model/regCM5/..., tanzania_climate_clip).
- Impact: Only one machine can recompute hazards.
- Fix: Document inputs with download scripts and checksums; keep the derived CSVs as the versioned inputs.
- Decision / owner: No decision needed
- Acceptance: A second machine reproduces data-source/*.csv.

**ENG-04 Kiswahili plural forms missing** (Low, P3, effort S)

- Evidence: 21 keys (insights 18, area 3) are plural or ordinal variants missing in sw; sw/insights.json also carries 9 keys that no longer exist in en (leftovers).
- Impact: Some counts may read oddly in Kiswahili.
- Fix: Confirm the i18next plural rules for sw and fill the keys.
- Decision / owner: No decision needed
- Acceptance: No missing keys.

**OPS-01 GitHub token exposed** (Medium, P0, effort S)

- Evidence: A personal access token is embedded in the prod remote URL and was pasted into chat on 2026-08-11.
- Impact: Repository write access could be misused.
- Fix: Rotate the token; use a credential helper.
- Decision / owner: Repository owner
- Acceptance: Old token revoked.

**OPS-02 A second 'reference' workbook is broken and uses a different reference population** (Medium, P1, effort S)

- Evidence: inform_sheets/TZ_INFORM_model.xlsx: cached main-sheet results are #DIV/0! from Earthquake onward; it standardises over 16 SADC countries (1,391 units) while the Country Model Template uses Tanzania only (170). A script header claims to match it.
- Impact: Two different 'authentic' references.
- Fix: Label it as non-reference (archive it); keep the Country Model Template as the single reference.
- Decision / owner: User
- Acceptance: One reference workbook named in docs and code.

**OUT-01 The PMO proposal states false or stale facts** (Critical, P0, effort S)

- Evidence: National 4.1 and 'risk driven by capacity and vulnerability (H 2.2, V 5.5)' are Kondoa's row; completeness figures (22/5/6 of 33) came from a removed stale copy (correct: 41 categories, 33 complete, 7 partial, 1 empty); 'drought peaks in the pastoral north' while the data show Dar es Salaam and Lushoto at 10; the live data portal is not mentioned; on-premise hosting is claimed while the platform runs on Vercel and Supabase (eu-west-1). Deadline 31 October 2026.
- Impact: A reviewer checking the site would find contradictions.
- Fix: Revise before submission.
- Decision / owner: User
- Acceptance: Every number in the proposal reproduces from the audit script or the workbook.

**OUT-02 Presentations state the false national figure** (Critical, P0, effort S)

- Evidence: docs/INFORM_Tanzania_SADC_format.pptx ('the national INFORM risk is 4.1'); docs/ and inform_sheets/INFORM_Tanzania_Subnational_Risk.pptx ('The official national INFORM risk is 4.1').
- Impact: Wrong figure in material shared outside PMO.
- Fix: Correct the decks; if the SADC deck was shared, send a correction.
- Decision / owner: User
- Acceptance: Decks corrected.

**UP-01 Dar es Salaam drought = 10 in the regional workbook** (Medium, P2, effort -)

- Evidence: HA.NAT.DR-FRE (FAO historic drought frequency 1984-2023, regional): Dar es Salaam 19 years (the maximum, score 10), Arusha 17, Manyara 14, Dodoma 11, Singida 10, Shinyanga 7, Simiyu 5. The index is computed on cropland, of which Dar es Salaam has almost none. Recheck of 10 October 2026: shown as data note DN-01 on every Dar es Salaam value (five councils and the region).
- Impact: The authentic model overstates drought in the city.
- Fix: Keep in the core (authentic) with a visible note; report to SADC/JRC; correct in Advanced.
- Decision / owner: User: decision D5
- Acceptance: Note shown; report sent.

**UP-02 Coastal erosion indicator is degenerate for Tanzania** (Medium, P2, effort -)

- Evidence: HA.NAT.CH-ERO (Digital Earth Africa coastlines, district): custom range -0.3..0 maps every value to 0 (169 of 169 units score 0); the only non-zero raw values (23 to 67 m/yr) sit in six landlocked Dodoma units (Bahi 67, Kondoa, Kongwa, Chemba 45, Mpwapwa 34, Dodoma Urban 23), which points to misaligned rows. Shown as data note DN-05 on every unit.
- Impact: Coastal hazard invisible in the authentic model.
- Fix: Report upstream; use the Advanced coastal basket (shoreline retreat, surge, waves, mangroves).
- Decision / owner: User: decision D5
- Acceptance: Report sent; Advanced coastal basket filled.

**UP-03 Livelihoods raw value 0 in 108 units** (Low, P3, effort -)

- Evidence: VU.SE.LV-FS (IPC 2022-2024, regional) is labelled '% of population in phase 2 or higher' but Dodoma carries 149, Simiyu 142 and Manyara 102 (percentages cannot exceed 100; they look like thousands of people); 110 of 170 units carry 0 where no IPC analysis was run. Shown as data note DN-06 on every unit.
- Impact: Zeros treated as measured.
- Fix: Report upstream; replace with MUCHALI/IPC council data via data entry.
- Decision / owner: User: decision D5
- Acceptance: Values replaced or documented.

**PROV-01 The source column shows the intended custodian, not where the value came from** (Critical, P0, effort S)

- Evidence: Area profiles ('Every indicator group, with its source') and the Data portal attach a fixed authority and dataset to each indicator group whatever the value's origin. Kondoa District: child health 7.5 labelled 'MoH, TDHS-MIS 2022' but equal to the workbook value (Global Data Lab 2006-2021); development & poverty 7.7 labelled 'NBS, HBS 2017/18' (workbook: Global Data Lab, OPHI); access to health care and education labelled '2022 PHC' (workbook global values); WASH labelled 'MoW, 2022 PHC water points' (our raw-count rebuild; MoW supplied nothing); lightning labelled 'TMA, Tanzanian institution, NASA LIS/OTD flash density' (a hand grade; no LIS/OTD data used); zoonoses 'MoA', wildfire 'TFS', hazardous material 'NEMC' and vehicle accidents 'TPF' all labelled 'Tanzanian institution' for hand grades; earthquake labelled 'USGS catalogue' while Kondoa's 10 is the workbook's GEM value. Evidence: docs/assessment/screens/04 and 05.
- Impact: Every profile misstates provenance and names institutions as the source of data they did not provide; credibility risk with those institutions. The same labels go out in the indicator CSV download of every profile (EXP-01).
- Fix: Show the real lineage of each value (workbook dataset and year / institution submission / computed product / expert judgement) and show the intended custodian separately as 'Responsible institution'.
- Decision / owner: No decision needed
- Acceptance: For every displayed value the source shown equals its lineage record.

**UX-01 Area profiles are too long for any single audience** (High, P1, effort M)

- Evidence: Fully rendered council profile: 15,867 px on desktop (about 16 screens), 9 sections, 3 charts; region profile 17,111 px; on a 390 px phone 19,241 to 21,670 px. 'What to do', the public guidance, starts about 2,550 px down on a phone, after rank, population, area, map and key findings (screens/06).
- Impact: The public and coordinators scroll past analysis to reach guidance; analysts scroll past guidance to reach evidence.
- Fix: Split into two views: 'Risk and what to do' (public and coordinators, mobile-first, Kiswahili first) and 'Analysis' (dimensions, drivers, comparisons, evidence, facilities). Target under 4,000 px for the first view on a phone.
- Decision / owner: User: D9 (default language)
- Acceptance: Guidance visible on the first phone screen; analysis one tap away.

**UX-02 Duplicated and low-value sections on area profiles** (Medium, P1, effort S)

- Evidence: 'How this profile is calculated' (2,872 px) repeats the Methodology page; 'Neighbouring councils' (691 px) repeats the explorer table; 'How the score is built' (1,040 px), 'The indicator groups that weigh most' (1,368 px) and 'Against its region and the nation' (1,694 px) overlap.
- Impact: About 5,000 px of each profile repeats content found elsewhere.
- Fix: Remove the calculation section (link to Methodology), replace neighbours with a link, merge the three score sections into one 'Why this score' block.
- Decision / owner: No decision needed
- Acceptance: The Analysis view has at most 5 sections.

**UX-03 Region and national 'What to do' list every member council's text** (Medium, P1, effort S)

- Evidence: Dodoma region 'What to do': 3,888 px and 2,014 words; national: 2,375 px.
- Impact: The regional view is a wall of council text.
- Fix: Show a hazard summary (councils per hazard and priority) with links to council statements; show the region's own statements first.
- Decision / owner: No decision needed
- Acceptance: Region guidance under 1,200 px.

**UX-04 The Methodology page is 27,000 px and overlaps Learn and the profiles** (Medium, P2, effort M)

- Evidence: 13 sections, 7,062 words, 27,123 px on desktop and 39,994 px on a phone; content repeated in Learn lessons and in every profile's calculation section.
- Impact: Hard to read and hard to keep consistent; false claims hide in length (DOC-01, DOC-02).
- Fix: A one-page 'How it works' summary plus technical sub-pages (specification, sources register with real lineage, quality checks, changelog, references).
- Decision / owner: No decision needed
- Acceptance: Summary under 4,000 px; each technical page linked.

**UX-05 Insights mixes decision charts with analyst charts** (Low, P2, effort S)

- Evidence: 9 sections, 7 charts, 12,182 px. Decision value: regional ranking, hazard x vulnerability priority corner, hazard hot-spot matrix, data completeness. Analyst value only: spread within regions, indicator groups behind the scores, how the dimensions move together.
- Impact: National users must sift.
- Fix: Keep the four decision sections for NDRRC and PMO-DMD; move analyst charts to an appendix or to Methodology.
- Decision / owner: No decision needed
- Acceptance: Insights main view has at most 5 sections.

**UX-06 Home repeats navigation and overstates data authority** (Medium, P0 (KPI) / P2, effort S)

- Evidence: 'What you can do here' and the closing call to action duplicate the menu; 'Built on authoritative data: every indicator is traceable to its authority, dataset and method' is not true (COR-02, PROV-01); the hero KPI and the equation 'Tanzania: cube root of (2.2 x 5.5 x 5.9) = 4.1' are Kondoa's row (NAT-01). Evidence: screens/01.
- Impact: The first page a visitor sees carries the false national figure.
- Fix: Keep hero, map, corrected KPIs, highest-risk list and an honest one-line data status; remove duplicates.
- Decision / owner: User: D1
- Acceptance: Home under 3,000 px with no unverifiable claim.

**UX-07 The 170 'INFORM units' level is offered to every user** (Low, P2, effort S)

- Evidence: The explorer offers Councils, Regions and INFORM units (170) as equal choices (screens/02).
- Impact: Confusing for non-specialists.
- Fix: Keep it as an analyst option; default users see councils and regions.
- Decision / owner: No decision needed
- Acceptance: Level hidden by default.

**UX-08 Misleading national message: 'Earthquake is the most common top-scoring indicator'** (Medium, P1, effort S)

- Evidence: Insights key finding: earthquake leads in 62 of 195 councils (the page's own count; recomputed from the model dump, earthquake is the top-scoring indicator across all dimensions in 60 councils and the top hazard indicator in 70, so the rule should be stated). Earthquake scores include hand-graded overlays (raised in 20 units) and a min-max exposure index; the Risk Action Guide Book documents earthquake for 29 councils. Kondoa's profile names earthquake (10.0) as its top driver while its guide lists drought, landslide, floods, strong winds, wildfire and heavy rainfall.
- Impact: Public messaging points to a hazard that local guidance does not list.
- Fix: Rank drivers on the authentic core; reconcile model drivers with documented hazards (RC-03); add a caveat.
- Decision / owner: No decision needed
- Acceptance: Top-driver messages agree with documented hazards or explain the difference.

**RC-01 The standing risk class is shown with official warning names and colours** (Critical, P0, effort S)

- Evidence: src/features/guide/alert.ts maps the INFORM risk class to Advisory (very low, low), Warning (medium) and Major warning (high, very high) in yellow, orange and red; shown in every profile header, the explorer card and 'What to do' (screens/03). Today 120 councils permanently show 'Warning: Take action' and 68 'Major warning: take action immediately', with no hazard event. These are the levels the Risk Action Guide Book uses for warnings issued by TMA and Disaster Management Committees; the Kiswahili labels are 'Tahadhari' and 'Tahadhari kubwa', the words TMA uses. The 'What to do' block carries one note ('This category follows from the INFORM risk level, not from a forecast'); the header badge and the explorer card carry none. The badge inherits data defects: Chunya District and Shinyanga District show 'Major warning' only because of COR-03, and councils raised to High by hand grades show 'Major warning'.
- Impact: Permanent false alarms erode trust in real warnings and blur who issues warnings.
- Fix: Remove the badge; show 'Preparedness priority' in INFORM class words and colours (Very low to Very high). Use warning levels only while an official warning is active (RC-04).
- Decision / owner: User: D6
- Acceptance: No warning words or warning colours appear without an active official warning.

**RC-02 Wording implies an active warning** (High, P0, effort S)

- Evidence: The 'When a warning is issued' block preselects the area's alert category (WhatToDo.tsx: useState(alert?.level ?? 1)) and the guide text for that level ends 'This warning remains in force until the authorities lower or withdraw it' (src/data/action-guide/hazards/drought.json, publicHealth.json and others). No warning has been issued.
- Impact: Readers believe a warning is in force.
- Fix: Write it as conditional preparedness ('If TMA issues a warning for this hazard...'); preselect no level unless a warning is active.
- Decision / owner: No decision needed
- Acceptance: Text approved by PMO-DMD and NDRRC.

**RC-03 Two different hazard pictures on the same page** (High, P1, effort M)

- Evidence: The guide lists documented hazards per council (floods 187 councils, heavy rainfall 168, strong winds 105, drought 81, large waves 62, landslide 61, wildfire 58, public health 55, earthquake 29). The model's drivers differ: earthquake is the top driver in 62 councils. Kondoa: guide hazards drought, landslide, floods, strong winds, wildfire, heavy rainfall; model top driver earthquake 10.0.
- Impact: Contradictory messages on one page.
- Fix: One reconciled hazard list per area: documented hazards plus model hazards, each with a priority from the model (D7) and its basis (documented, modelled or both), using the hazard crosswalk.
- Decision / owner: User: D7
- Acceptance: Each area shows one reconciled hazard list.

**RC-04 Warning levels are per area, not per hazard and time** (High, P1, effort M)

- Evidence: One level per area from the risk class: no hazard, no validity period, no issuing authority, no time.
- Impact: Cannot represent a real TMA warning.
- Fix: A warnings record: hazard x area(s) x level x valid from/to x issuer x bulletin link, recorded by NDRRC/PMO-DMD from TMA bulletins (or ingested); shown as a banner while valid, with that level's actions from the guide.
- Decision / owner: User: D8
- Acceptance: A test warning appears only on its areas and only while valid.

**RC-05 Coordinators cannot maintain the guidance** (High, P1, effort L)

- Evidence: The guidance is compiled at build time from data-source/RISK_ACTION_GUIDE_BOOK_0222.docx (scripts/build-action-guide.py) into src/data/action-guide/*.json. No owner, date, version, approval or validity per statement; no portal entry.
- Impact: Local knowledge cannot be updated; nothing shows who said what, when.
- Fix: Store statements in the database with owner, level, hazard, language, version, status and review chain; import the guide as version 1.
- Decision / owner: User: D8
- Acceptance: A DDRRC updates one statement for their council and it publishes after RDRRC approval.

**RC-06 No crosswalk between guide hazards and INFORM indicator groups** (Medium, P1, effort S)

- Evidence: Guide hazards: drought, floods, heavy rainfall, strong winds, landslide, wildfire, earthquake, large waves, public health. INFORM groups without guidance: heatwave, lightning, volcano, zoonoses, environmental degradation, conflict, internal violence; technological groups map only to incident categories.
- Impact: Some hazards shown with no guidance; mapping is implicit in code.
- Fix: Maintain the crosswalk (sheet 'Hazard crosswalk'); write guidance for uncovered hazards or show 'no guidance yet'.
- Decision / owner: No decision needed
- Acceptance: Every hazard on a page has guidance or an explicit note.

**RC-07 No guidance on reducing vulnerability and lack of coping capacity** (Medium, P1, effort M)

- Evidence: The guide covers hazard response only. Nothing links an area's vulnerability or coping drivers (e.g. livelihoods, economic capacity, WASH) to actions.
- Impact: The model's main message for most areas (capacity and vulnerability) has no action attached.
- Fix: A 'Reducing risk over time' library keyed to INFORM vulnerability and coping groups, written by PMO-DMD, reviewed by NDRRC, naming the lead sector; shown when the group is a top driver of the area.
- Decision / owner: User: D10
- Acceptance: Areas show actions for their top vulnerability and coping drivers.

**RC-08 No print card or SMS text for dissemination** (Low, P2, effort S)

- Evidence: Profiles print as long documents; no one-page card; no short message.
- Impact: DDRRCs have nothing ready for notice boards, radio or SMS.
- Fix: A one-page Kiswahili risk card per council and a 160-character message per hazard and level, generated from approved statements.
- Decision / owner: User: D9
- Acceptance: Card and SMS text available for every council.

**GOV-01 Roles cannot be limited to an area** (High, P1, effort M)

- Evidence: Roles are viewer, sector, pmo and admin, attached to an institution; profiles have no area scope. An institution 'DRRC' (Regional and District Disaster Management Committee) exists, so a DRRC user could enter values for any council in the country.
- Impact: Coordinators cannot be given safe access.
- Fix: Add roles DDRRC (one council), RDRRC (one region and its councils), NDRRC (national) and PMO-DMD (national; vulnerability and coping actions); add scope_unit_id to profiles; enforce in row-level security and the workflow functions (existing security-definer pattern).
- Decision / owner: User: D8
- Acceptance: A DDRRC cannot write outside their council (tested).

**GOV-02 No review chain by level** (High, P1, effort M)

- Evidence: Approval is one PMO reviewer step for every submission.
- Impact: No local validation; national reviewers overloaded.
- Fix: Council content: DDRRC drafts, RDRRC approves. Region content: RDRRC drafts, NDRRC approves. National hazard content: NDRRC drafts, PMO-DMD approves. Vulnerability and coping actions: PMO-DMD drafts, NDRRC reviews, assesses and proposes changes, PMO-DMD publishes. Every step logged.
- Decision / owner: User: D8
- Acceptance: Each content type follows its chain (tested).

**GOV-03 No hazard event reporting for district coordinators** (Medium, P2, effort M)

- Evidence: No entry for events (date, place, hazard, impacts, source); the flood event register is a hand-edited CSV (data-source/flood_events.csv).
- Impact: Local event knowledge is lost; Severity has no live inputs.
- Fix: DDRRC event reports, validated by RDRRC, feeding the Advanced event layer and the Severity tool.
- Decision / owner: No decision needed
- Acceptance: An event entered by a DDRRC appears in the register after RDRRC validation.

**GOV-04 No record of official warnings** (Medium, P1, effort S)

- Evidence: The site cannot know whether a TMA warning is active.
- Impact: Banners for real warnings are impossible.
- Fix: The warnings record of RC-04, entered by NDRRC/PMO-DMD from TMA bulletins or ingested if TMA offers a feed.
- Decision / owner: User: D8
- Acceptance: Active warnings drive banners; expired ones disappear.

**PIPE-01 Earthquake is labelled as computed from the USGS catalogue, but that step was never applied** (High, P0 (label) / P1, effort S)

- Evidence: scripts/apply-earthquake.mjs (replace the earthquake overlay with the USGS-catalogue hazard; lower Dar es Salaam drought to the computed value) is not reflected in the shipped data: replaying the pipeline reproduces the shipped earthquake values only WITHOUT it, and the shipped Dar es Salaam drought is still 10 (with the script: 6.6 to 8.1). Area profiles nevertheless describe earthquake as 'Maximum estimated shaking from the USGS catalogue of M4.5+ earthquakes since 1960' and cite 'GST (+USGS), USGS catalogue M>=4.5, 1960-2024 (554 events)'. Shipped earthquake = workbook GEM exposure raised by hand-graded overlays. Earthquake is the top driver in 62 councils.
- Impact: The most frequent top driver carries a false source description.
- Fix: Correct the label now; in Advanced, use the USGS and GEM indicators (HA.NAT.EQ-HIST, HA.NAT.EQ-PGA) as designed; delete or apply the stale script deliberately, never silently.
- Decision / owner: No decision needed
- Acceptance: Earthquake description matches its lineage; replay test passes.

**PIPE-02 The shipped dataset is reproducible only approximately, from scripts that mutate it in place** (Medium, P1, effort S)

- Evidence: Replay in an isolated copy: workbook -> generate-risk-json -> refill-real-hazards -> enrich-coping-facilities -> build-hazard-overlays -> apply-climate-hazards -> apply-vulnerability reproduces every shipped leaf except health conditions in 80 units (0.1 apart, e.g. Monduli shipped 1.0 vs replay 0.9: produced by an earlier version of apply-vulnerability.mjs), 12 dimension totals and 2 risks. The census facility counts come from a geodatabase outside the repository. fix-dimension-aggregation.mjs runs as a dry run unless asked to write.
- Impact: Good news for traceability (every value traces to a script and an input file) but no single command rebuilds the data, and the data no longer matches its own scripts exactly.
- Fix: One deterministic build command with a reproducibility test (replay == shipped) in CI; vendor the facility counts as a data-source file with checksum.
- Decision / owner: No decision needed
- Acceptance: CI replay reproduces the shipped files byte-for-byte.

**MET-09 Drought composite: uncited weights and a second min-max stretch** (Medium, P2, effort S)

- Evidence: score = 0.30 aridity + 0.20 rainfall CV + 0.15 SPEI depth + 0.35 seasonal pressure, each min-max scaled, then the composite min-max scaled again to 0-10 (compute-drought-spi-spei.py lines 126-130). The weights carry no source; the double scaling stretches the distribution so the extremes always reach 0 and 10.
- Impact: Drought scores look more extreme and more precise than the evidence supports.
- Fix: In Advanced, use the basket design (each sub-indicator standardised once against a fixed reference, weighted mean of members present) with documented weights and a sensitivity check.
- Decision / owner: No decision needed
- Acceptance: Weights documented with sources; no second rescaling.

**SEV-01 No zero rule when impact or conditions are zero** (Low, P2, effort S)

- Evidence: The 2026 JRC/ACAPS methodology states that severity is zero (the crisis is not listed) when Impact or Conditions is zero. The engine's inverted geometric mean returns a positive value in that case, so complexity alone yields a score (e.g. 0.9, 'Very low').
- Impact: A scenario with no affected people can still show a severity.
- Fix: Return no severity (or 0) when people in need or either core dimension is zero, as the methodology requires.
- Decision / owner: No decision needed
- Acceptance: Unit test: zero impact or zero conditions gives no severity.

**SEV-02 Track the 2026 revision of the INFORM Severity methodology** (Low, P3, effort M)

- Evidence: INFORM Severity Index: Concept and Methodology, Version 2026 (Poljansek et al., JRC144740, EUR 40592, doi 10.2760/2266313; 154 pp.) keeps the operational 0-5 scale and round-up categories (Table 7) and the 70% x G(Impact 1/3, Conditions 2/3) + 30% Complexity schema (Figure 8), which the engine follows; it recommends rescaling the score to 0-10 to align with the other INFORM products, continuous scoring of the concentration of conditions, a data time-validity framework and a new reliability approach.
- Impact: The engine is current today but will diverge when the proposals are adopted.
- Fix: Watch the INFORM Severity releases; adopt the 0-10 scale and continuous concentration scoring when they become operational.
- Decision / owner: No decision needed
- Acceptance: Engine version stated on the Severity page.

**LRN-01 The course teaches the false national figure as 'official'** (High, P0, effort S)

- Evidence: learn.json lessons.risk: 'For Tanzania as a whole: cube root of (H x V x LCC) = 4.1 ... This is the official INFORM Tanzania country value.' Widgets mark 'Tanzania's national value' on bars; the risk playground says council scores 'match the official score'; the coping lesson says 'official scores change only when new, sourced data are entered through the Data portal', which is not how the current values were produced (COR-02).
- Impact: Coordinators trained on the course will repeat the Kondoa figure and the 'official' framing.
- Fix: Correct with NAT-01; replace 'official' with an accurate description of each value's lineage; review the seven lessons against the audit.
- Decision / owner: User: D1
- Acceptance: Lessons contain no 'official' claim without a published source.

**COV-01 'Data coverage' counts hand grades as data** (Medium, P1, effort S)

- Evidence: Kondoa's profile shows 'Data coverage 94%, 30 of 32 indicator groups'; three of those 30 (lightning 3.0, vehicle accidents 3.0, zoonoses 4.0) are hand grades with no workbook indicator and no measured source. The Insights 'Data coverage' section and its headline finding use the same dataCoverage() function (coverageHistogram in analytics.ts), so the national picture of coverage counts the grades too.
- Impact: Coverage overstates how much of the score is measured.
- Fix: Report coverage by lineage: measured (workbook or institution), computed, expert judgement, missing.
- Decision / owner: No decision needed
- Acceptance: Coverage shows the share by lineage.

**SEC-01 The content security policy allows inline scripts** (Low, P2, effort S)

- Evidence: Live header: script-src 'self' 'unsafe-inline'. Other headers are strong (HSTS with preload, X-Frame-Options DENY, nosniff, strict referrer policy, permissions policy).
- Impact: Weaker protection against injected scripts.
- Fix: Move inline scripts to files or use hashes or nonces; drop 'unsafe-inline' for scripts.
- Decision / owner: No decision needed
- Acceptance: CSP without 'unsafe-inline' in script-src; site still works.

**TST-01 No test guards the shipped data or the provenance shown** (High, P1, effort S)

- Evidence: 404 tests pass (39 files), including strong golden tests of the engine. None asserts that the shipped core equals the workbook (COR-01), that a replay of the pipeline equals the shipped files (PIPE-02), or that each displayed source equals the value's lineage (PROV-01). scripts/audit/integrity_audit.py now measures the first.
- Impact: The defects in this matrix pass CI.
- Fix: Add the three tests to CI (core == workbook unless an approved institutional value exists; replay == shipped; source label == lineage).
- Decision / owner: No decision needed
- Acceptance: Tests fail on the current data and pass after the fixes.

**MET-10 Natural hazards are averaged; INFORM's own method combines hazards with the inverted geometric mean** (Medium, P2, effort S)

- Evidence: Workbook 'INFORM SADC 2024' column S = AVERAGE(G:R) over 12 hazard components (and Y = AVERAGE(T:X) for human hazards). INFORM Concept and Methodology 2017, section 4.2.2.2 and Table 5: the natural-hazard components are aggregated with a geometric average; the Subnational Guidance 2019 (II.5) keeps arithmetic means for indicators and low levels and recommends the (inverted) geometric mean where very different hazards are combined. On the authentic workbook values, replacing the AVERAGE by the inverted geometric mean raises Hazard and Exposure by 0.45 on average (at most 1.1) and moves 45 of 170 units to another risk class (High 24 to 58).
- Impact: The rule is an upstream choice of the SADC 2024 model and is allowed by the subnational guidance, but it is material and undocumented: a district very exposed to one hazard looks moderate when twelve hazards are averaged.
- Fix: Keep the workbook rule in the Core (authentic). State it on the Methodology page. Offer the inverted geometric aggregation only as a labelled sensitivity in Advanced. Raise it with the SADC and INFORM (JRC) partners at the next revision.
- Decision / owner: User: D11
- Acceptance: Methodology page states the rule and the size of the sensitivity; Core values unchanged.

**MET-11 Human hazard averages conflict with technological hazards; INFORM Global takes the maximum of current and projected conflict** (Low, P3, effort S)

- Evidence: Workbook HUMAN = AVERAGE(Conflict Intensity, Conflict Risk, Hazardous Material, Internal Violence, Vehicle Accidents). INFORM 2017 Table 7: Human hazard = MAX(current conflict intensity, projected conflict risk). In the Tanzanian data Conflict Intensity and Conflict Risk have one value for all 170 units, Hazardous Material and Vehicle Accidents are empty, so the category varies only through Internal Violence.
- Impact: The Human hazard category says little about differences between councils.
- Fix: Keep the Core as is and document it. In Advanced, use subnational conflict and violence data (ACLED, police) per council. Report to SADC/JRC with D5.
- Decision / owner: No decision needed
- Acceptance: Rule documented; Advanced uses subnational conflict data.

**MET-12 Risk classes use SADC-wide thresholds that hardly separate Tanzanian units; categories have no classes** (Medium, P2, effort M)

- Evidence: Hidden 'Thresholds' sheet: risk 2.5/3.4/4.3/5.9, hazard 1.3/2.0/3.3/4.7, vulnerability 2.5/3.3/4.1/5.0, lack of coping 4.1/5.3/6.7/7.7 (dimensions and risk only). INFORM derives classes by cluster analysis of the model's own units, for risk, dimensions and categories, and rounds risk thresholds to 0.5 (2017 section 7; Guidance II.6). On the authentic workbook: risk 120/170 Medium; lack of coping only Medium (142) or High (28).
- Impact: Little discrimination between Tanzanian councils; categories cannot be classed consistently; the class words carry less information than users assume.
- Fix: Keep the SADC thresholds in the Core (comparability within SADC). In Advanced, derive Tanzanian classes by the INFORM cluster method (hierarchical clustering, as in the INFORM training R script) for risk, dimensions and categories; never mix the two class sets on one map.
- Decision / owner: User: D11
- Acceptance: Advanced classes documented with the clustering run; Core legend unchanged.

**MET-13 The model's statistical coherence was never checked** (Medium, P2, effort S)

- Evidence: The Subnational Guidance (II.7) requires a cross-correlation check of the finished model. Run on the authentic workbook (170 units): the two coping categories are negatively correlated (Infrastructure vs Institutional r = -0.35) and Institutional is unrelated to risk (r = -0.04); natural and human hazards are unrelated (r = -0.05). Of the 26 populated components, Coastal hazards, Conflict Intensity, Conflict Risk, WASH and DRR implementation have one value across Tanzania, Storms & Cyclone two and Volcano three; Heatwave, Lightning, Zoonoses, Hazardous Material, Vehicle Accidents and the economic vulnerable-group component are empty for every unit.
- Impact: Several components add no subnational information; the coping dimension partly cancels itself; the empty components are the places where hand grades were later inserted (COR-02).
- Fix: Add a coherence report (correlation matrix, constant and empty components, missing shares) to every data build for Core and Advanced; use it to target institutional data (WASH, DRR implementation, conflict, coastal) and to review the Advanced design.
- Decision / owner: No decision needed
- Acceptance: Coherence report produced by the build for each release.

**MET-14 No reliability measure is shown beside the scores** (Medium, P2, effort M)

- Evidence: INFORM publishes a Lack of Reliability Index for every country (2017 section 3.6: missing data, out-of-date data, conflict as a 30% aggravating factor). The site shows a 'data coverage' percentage that counts hand grades as data (COV-01), no data age, and no difference between a council's own values and inherited ones (ADM-05).
- Impact: Users cannot tell well-measured councils from inferred ones.
- Fix: Compute a Tanzanian lack-of-reliability score per council from lineage (measured, computed, inherited, expert, missing) and data age, on 0-10 like INFORM; show it beside the risk and in exports.
- Decision / owner: No decision needed
- Acceptance: Score shown and documented; councils that share a unit score lower reliability.

**MET-15 Updates, validation and versions do not follow the INFORM process** (High, P1, effort M)

- Evidence: Subnational Guidance II.8 to II.10: the model is updated with the core group and partners, validated (INFORM/JRC review of methodology changes), published, and maintained on a fixed cycle (usually 6 or 12 months). The site has no release number, no date per value set and no validation record; 165 of 170 units were modified without a validation step (COR-01).
- Impact: The model cannot be called INFORM-validated; users cannot cite a version; changes cannot be audited back to a decision.
- Fix: Introduce releases (e.g. 'INFORM Tanzania 2026.1') with date, change log and validation record: NDRRC technical committee reviews data changes, PMO-DMD approves publication, methodological changes go to INFORM/JRC before entering Core; set a 12-month cycle aligned with planning.
- Decision / owner: User / PMO: D12
- Acceptance: Every published value set carries a version, date and approval record.

**MET-16 Advanced hazards measure hazard intensity, not people exposed** (Medium, P3, effort M)

- Evidence: INFORM hazard and exposure indicators are physical exposure: people exposed to a given hazard intensity (annual average exposed population), absolute (log) and relative to the population (2017 section 4.2.2). The council hazards (CHIRPS drought, heavy rain, ERA5 heatwave) are climate-intensity indices on each polygon, floored at the source unit (raise-only); population density enters only flood (MET-08).
- Impact: A high drought index over an empty area counts as much as over a populated one; the Advanced hazards are not comparable with INFORM exposure indicators.
- Fix: In Advanced, compute exposed population per hazard: overlay hazard zones (drought frequency, flood-prone cells, landslide susceptibility, heat) on the 2022 census population; report absolute (log) and relative exposure; aggregate as INFORM does; drop the raise-only floor.
- Decision / owner: No decision needed
- Acceptance: Each Advanced hazard has absolute and relative exposure, documented.

**ADM-01 Twelve urban councils use the rural district's data; twelve workbook units are never used** (High, P1, effort S)

- Evidence: scripts/export-councils.py match(): Town councils try the rural name before '<name> Urban', and the workbook suffixes 'Township Authority' and 'Mji' are never recognised; Kigoma Ujiji, Mtwara Mikindani, Mafinga and Makambako are therefore treated as new councils and spatially given the rural unit. Mislinked: Korogwe Town -> Korogwe (own unit: Korogwe Township Authority), Handeni Town -> Handeni (own unit: Handeni Mji), Kibaha Town -> Kibaha (own unit: Kibaha Urban), Mtwara Mikindani Municipal -> Mtwara (own unit: Mtwara Urban), Masasi Town -> Masasi (own unit: Masasi Township Authority), Mafinga Town -> Mufindi (own unit: Mafinga Township Authority), Kasulu Town -> Kasulu (own unit: Kasulu Township Authority), Kigoma Ujiji City -> Kigoma (own unit: Kigoma Urban), Kahama Municipal -> Kahama (own unit: Kahama Township Authority), Babati Town -> Babati (own unit: Babati Urban), Njombe Town -> Njombe (own unit: Njombe Urban), Makambako Town -> Njombe (own unit: Makambako Township Authority). With the authentic workbook values vulnerability and coping are the same in both units (district surveys) but Hazard and Exposure differ; 3 of 12 councils change risk class (Masasi Town High to Medium, Kasulu Town High to Medium, Njombe Town Low to Medium). In the shipped data the gap is larger (e.g. Kasulu Town shows vulnerability 6.2 of rural Kasulu instead of 4.3), and the raise-only council hazards are floored at the rural values.
- Impact: Twelve urban councils (including Kahama Municipal and Kigoma Ujiji) show the wrong district's profile; twelve INFORM units are lost.
- Fix: Map each council to its own workbook unit (rule: City/Municipal/Town first to '<name> Urban', '<name> Township Authority' or '<name> Mji'); regenerate the council index and council hazards; add a test that every workbook unit is used and every link is listed in data-source/council_reconciliation.csv with a reason.
- Decision / owner: No decision needed
- Acceptance: All 170 workbook units used; 25 units back two councils; the 12 councils show their own units.

**ADM-02 Wrong council type and names; renamed councils shown as new** (Low, P2, effort S)

- Evidence: Kigoma Ujiji is typed 'City' because the type test finds 'jiji' inside 'Ujiji' (census name: Halmashauri ya Manispaa Kigoma Ujiji, a Municipal council); with it corrected the mainland count is 6 City, 20 Municipal, 21 Town, 137 District = 184. Mbogwe is displayed as 'Halmashuari Ya Wilaya Ya Mbogwe District' (a typo in the census file defeats the prefix rule) and flagged new. Dar es Salaam City (formerly Ilala), Mwanza City (Nyamagana) and Mtama (formerly Lindi District Council) are flagged 'new/split' although they are renamed councils.
- Impact: Visible errors on the map and profiles; inflated count of 'inherited' councils.
- Fix: Fix the type test (match whole words), add a name-correction table (Mbogwe), and record renames as renames.
- Decision / owner: No decision needed
- Acceptance: Types match PO-RALG (6/20/21/137 on the mainland); no Swahili prefix in names.

**ADM-03 Council identifiers are positional, not official** (High, P1, effort M)

- Evidence: C001 to C195 are assigned in file order of the census layer; the census council code (counc_code) repeats across districts (e.g. 11, 12, 13) and is not kept in the index. Stored data use these IDs: indicator values and raw values (unit_id 'C###', migration 0004), audit log entries, the Risk Action Guide council entries (e.g. 'C195' in kusinipemba.json), links and bookmarks. Any re-export with an added or re-ordered council renumbers every later ID.
- Impact: A boundary update would silently attach approved institutional values, guidance and history to the wrong council.
- Fix: Adopt permanent identifiers built from the official codes (region code + district code + council code from NBS/PO-RALG) or freeze the current C### list in a registry file with append-only rules; keep an alias table; add a test that no existing ID changes meaning.
- Decision / owner: No decision needed
- Acceptance: Re-exporting the councils leaves every existing ID on the same council.

**ADM-04 '195' is hard-coded in tests, page text and scripts** (Low, P2, effort S)

- Evidence: model.test.ts expects 195 three times, explore.test.ts once; the home page lead (en, sw) says 195 councils; scripts print 195. The dataset records no boundary version.
- Impact: A boundary update breaks tests and leaves false counts on the site.
- Fix: Derive counts from the council registry; record the boundary set and date ('NBS 2022 PHC administrative units') in the dataset and show it on the Methodology page.
- Decision / owner: No decision needed
- Acceptance: Counts come from data; boundary version shown.

**ADM-05 50 councils share 25 workbook units; their values are not their own** (Medium, P1, effort M)

- Evidence: Even with ADM-01 fixed, 25 workbook units each back two councils (councils created or split after the workbook's boundaries: e.g. Ubungo/Kinondoni, Kigamboni/Temeke, Kibiti/Rufiji, Chalinze/Bagamoyo, Ushetu and Msalala/Kahama, Magharibi A and B). Vulnerability and coping (and, in the authentic core, hazard and exposure) are copied; direct 0-10 edits keyed by the source unit change both councils at once (measured values already apply per council, DE-02). The INFORM guidance treats a boundary change as a reason to recalculate (II.2, the Niger example).
- Impact: Users read a sibling council's poverty or health values as measured for their own council; one council's correction alters another.
- Fix: Label shared values everywhere (profile, map tooltip, export); allow institutions to enter values per council so the finest level wins; keep inheritance only as the fallback; track the share of councils with their own data as a KPI.
- Decision / owner: No decision needed
- Acceptance: Each shared value is labelled; a council-level entry overrides the shared unit for that council only.

**ADM-06 No procedure for boundary changes (new councils, wards)** (Low, P3, effort S)

- Evidence: Checked against the sources: 195 councils = 184 mainland (PO-RALG in Parliament refers to 'Halmashauri zote 184', e.g. Hansard of 7 February 2025) + 11 Zanzibar; the NBS 2022 geodatabase has 31 regions, 150 districts, 195 councils and 4,344 wards. No council created after the 2022 census was found. A future council (or a move to wards) needs: the official list, boundaries, census population, permanent IDs, recomputed council hazards, flagged inheritance of vulnerability and coping, guidance entries, and updated tests.
- Impact: Without a procedure the next boundary change will repeat ADM-01 and ADM-03.
- Fix: Write a re-basing procedure (data-source/BOUNDARIES.md) and a script that diffs the official list against the registry and reports added, renamed and split councils before anything is regenerated.
- Decision / owner: User / PMO: D12
- Acceptance: A dry run on the current list reports zero changes.

**OUT-03 Other shareable documents repeat the district row as the national figure and describe raise-only and USGS as method** (High, P0, effort S)

- Evidence: docs/HAZARD_ADVANCEMENT_PAPER.md, .docx and .pdf ('Lack-of-Coping 5.9, Risk 4.1'; raise-only described as the method, 8 mentions; USGS earthquake); docs/METHODOLOGY_MANUAL.md and .pdf ('official INFORM country value (4.1)', 'min over our 150 districts', USGS); docs/WORKED_EXAMPLE.md (4.1 four times); docs/LOCAL_DATA_INTEGRATION_PLAN.md and .docx; docs/INDICATOR_SOURCE_REGISTER.md; docs/INDICATOR_UPDATE_DELETE_PROCEDURES.md and .docx ('official' seven times, raise-only four); CHANGELOG.md. OUT-01 and OUT-02 cover only the proposal and the two presentations.
- Impact: Any of these files, several of them formatted for circulation, would spread the Kondoa figure and the raise-only method to partners.
- Fix: Correct the figures and the method statements, or mark each document superseded with a pointer to the assessment; regenerate the PDF and DOCX copies from the corrected Markdown.
- Decision / owner: User: D1
- Acceptance: No document in docs/ states 4.1 as the national figure or raise-only as the method without the correction note.

**EXP-01 Downloads carry the displayed values and the misattributed sources with no version, date or lineage** (Medium, P1, effort S)

- Evidence: RankingTable.tsx exports rank, id, name, region, level, scores, class and population with no date, release or source; IndicatorTable.tsx exports the 'Source' and 'Source kind' columns, i.e. the custodian labels of PROV-01; ChartCard exports chart data; only the severity export stamps 'Generated with INFORM Tanzania on {date}'. None marks hand grades, inherited values or the data as-of date.
- Impact: Files that leave the site look like official INFORM data and cannot be traced to a release.
- Fix: Add a header or trailer row to every export with the release, the date, the lineage of each value (workbook, institution, computed, expert, inherited) and the disclaimer; name files with the release.
- Decision / owner: No decision needed
- Acceptance: Every download carries release, date and lineage; a test opens each export and checks the header.

**TOOL-01 The collection tools' council rows carry the rural unit's raw values for the twelve mislinked councils** (Medium, P1, effort S)

- Evidence: In INFORM_TZ_Collection_Benchmark.xlsx ('Council Entry') the rows of Babati Town, Handeni Town, Kasulu Town, Kibaha Town, Kigoma Ujiji, Korogwe Town, Makambako Town, Masasi Town, Mtwara Mikindani and Njombe Town are identical to the rows of their rural district councils, and Kahama Municipal and Mafinga Town carry Kahama's and Mufindi's values; the tools are generated from the same council index as the site (ADM-01). The measured-value path looks up the baseline raw by council.sourceId, so it carries the same links.
- Impact: Institutions receive a benchmark with another council's raw values for twelve councils, in addition to the Butiama error (SRC-07).
- Fix: Regenerate the NORMAL and ADVANCED tools and inform-baseline-raw lookups from the corrected index (ADM-01); add a test that each council's benchmark row equals its own workbook unit.
- Decision / owner: No decision needed
- Acceptance: The twelve rows equal their own workbook units; test in CI.

**TOOL-02 The ADVANCED Excel tool's formulas have never been compared with the engine** (Low, P2, effort M)

- Evidence: advanced.test.ts tests computeAdvanced against itself (degrades to the normal result with no advanced data; a filled basket changes the score; blank-skip); docs/EXCEL_FORMULA_VERIFICATION.md covers the NORMAL tool only. The Advanced Benchmark values were traced to their data files, but the tool's basket arithmetic (blank-skip weighted mean against the basket ranges) has not been recalculated and compared cell by cell as the NORMAL tool was (9,936 of 9,939 cells).
- Impact: Institutions filling the ADVANCED tool could get scores that differ from what the site would compute.
- Fix: Recalculate the ADVANCED Benchmark in LibreOffice and compare every basket score with computeAdvanced on the same inputs; keep the comparison as a test.
- Decision / owner: No decision needed
- Acceptance: Tool and engine agree on every benchmark cell.

**SEC-02 Officers' names are readable by anonymous clients through the API** (Low, P2, effort S)

- Evidence: raw_values.author_name, indicator_values.author_name and indicator_validations.validated_by_name sit in tables granted SELECT to anon (migrations 0003 and 0004), so any client can list the full names of submitting officers through PostgREST even though the site shows only institutions. Profiles and the audit log are protected.
- Impact: Personal data of officers is published without need; a concern under the Personal Data Protection Act, 2022.
- Fix: Expose public views without personal columns (or store names only in audit_log and submissions, which reviewers read); keep institution and dataset public.
- Decision / owner: No decision needed
- Acceptance: An anonymous request to the public tables returns no personal names.

**SEC-03 A dependency with a known high-severity vulnerability is listed as a runtime dependency** (Low, P3, effort S)

- Evidence: npm audit (production dependencies): xlsx 0.18.5, high, prototype pollution in SheetJS, no fix published on npm. The package is used only by the Node scripts (generate-risk-json.mjs, apply-climate-hazards.mjs, scripts/lib/informRiskDataService.js) and is not in the browser bundle.
- Impact: Dev-time risk only when untrusted workbooks are opened; the audit warning will recur in CI.
- Fix: Move xlsx to devDependencies and install SheetJS 0.20.x from its own registry (or replace with exceljs); open only trusted workbooks with the scripts.
- Decision / owner: No decision needed
- Acceptance: npm audit --omit=dev reports no high or critical vulnerabilities.

**DE-07 Institutions are not notified of requests or decisions** (Medium, P2, effort M)

- Evidence: No email or message path exists in the code or the migrations: a data request (create_requests) and a review decision (review_raw_submission) only write rows; an institution sees its requests after signing in. Combined with DE-04, an institution may never learn that a request with a due date exists.
- Impact: Requests go unanswered; due dates pass unseen.
- Fix: Send an email on request creation, due-date reminder and decision (database webhook or edge function with custom SMTP), with the request link; log the sending.
- Decision / owner: No decision needed
- Acceptance: A test request produces an email to the institution's address.

**DE-08 The database accepts direct-edit submissions for unknown units and indicator keys** (Low, P3, effort S)

- Evidence: submissions.unit_id is checked only for length (2 to 32) and indicator_values.ref only against the pattern '(hazard|vulnerability|coping):[A-Za-z]+'; review_submission writes whatever was submitted. The engine ignores unit ids that are not in the model and keys that belong to no category (applyEdits returns false), so an approved edit can vanish without any warning. submit_raw_values, by contrast, validates unit ids.
- Impact: Silent loss of approved edits after a typo or a renamed key.
- Fix: Validate unit ids and refs against the registry in the submit and review functions, as the measured-value path does.
- Decision / owner: No decision needed
- Acceptance: A submission with an unknown unit or key is rejected with a message.

**TST-02 Accessibility checks are not automated** (Low, P3, effort S)

- Evidence: @axe-core/playwright is a devDependency but no test references it; CI runs typecheck, lint, unit tests and the build only. CHANGELOG reports an axe WCAG 2.1 AA audit of every page: a one-off run that cannot be repeated by CI.
- Impact: Regressions in contrast, focus order or labels (for example on the new alert badge) go unnoticed.
- Fix: Add the axe run for the main pages to CI, failing on serious and critical findings.
- Decision / owner: No decision needed
- Acceptance: CI fails on a serious accessibility finding.

**DOC-06 'Data as of June 2026' is stale** (Low, P2, effort S)

- Evidence: metadata.asOf = 2026-06 (lastUpdated 2026-05-31) while the dataset file last changed on 26 September 2026 (v2 rebuild) and the council data were regenerated on 9 October 2026. The date is shown in the explorer footer, the area hero, the Methodology hero and the suggested citation.
- Impact: Users cite a date that predates the data they see.
- Fix: Derive the as-of date from the release (MET-15) and stamp it at build time.
- Decision / owner: No decision needed
- Acceptance: The displayed date equals the release date of the data shown.

**RC-09 Eight councils have no documented-hazard statement in the guide** (Low, P2, effort S)

- Evidence: In src/data/action-guide/regions/tabora.json the entries for Nzega Town, Nzega District, Igunga, Uyui, Urambo, Sikonge, Tabora Municipal and Kaliua have hazards and 'what helps' lists but an empty 'documented' text; the other 187 councils have one.
- Impact: The 'where the danger lies' line is blank for a whole region.
- Fix: Complete the eight statements from the Risk Action Guide Book or mark them 'to be written by the DDRRC' until the guidance workflow (RC-05) exists.
- Decision / owner: No decision needed
- Acceptance: All 195 councils have a documented-hazard statement or an explicit placeholder.

**UP-04 'Density of health facilities' has a custom range of 0 to 0 and never scores** (Low, P3, effort -)

- Evidence: CC.INF.HC-FAC: custom range 0..0, so it never scores; its raw values (25 Kaskazini Unguja to 349 Dodoma, labelled per capita) are facility counts by region. Shown as data note DN-09 on every unit; the Advancement layer scores the census facilities per 10,000 people on the council polygons (ADV-06).
- Impact: A used indicator that adds nothing; a silent gap for institutions that supply facility data.
- Fix: Report upstream; keep the indicator in the Core as INFORM does; in Advanced, score the 2022 census facility counts per 10,000 people with a documented range; tell submitters when a value cannot be scored.
- Decision / owner: User: decision D5
- Acceptance: Submitter sees a message; Advanced carries a scored facility-density indicator.

**SRC-08 Council populations are transcribed from a third-party site** (Low, P2, effort S)

- Evidence: scripts/compute-exposure.py embeds the 2022 census council populations 'NBS, via citypopulation.de'; no NBS file or checksum is in the repository, and the exposure label on the site reads 'NBS 2022 PHC council (citypopulation.de)'. The transcription sums to the census total (61,741,120) and the three corrected councils were checked, but the per-council figures have not been verified against the NBS administrative units report (the NBS site did not serve the PDF during the assessment).
- Impact: The exposure index of every council rests on an unverified transcription.
- Fix: Store the NBS Volume 1A council table in data-source with its source and checksum; compare the 195 figures; label the exposure 'NBS 2022 PHC'.
- Decision / owner: No decision needed
- Acceptance: All 195 populations equal the NBS table; label corrected.

**UP-05 Drought frequency puts the semi-arid Lake zone at the minimum** (Medium, P2, effort -)

- Evidence: HA.NAT.DR-FRE (FAO historic drought frequency, regional): Simiyu 5 and Mwanza 5 (the minimum, score 0), Tabora 6, Shinyanga 7, while the workbook's own food-security indicator (VU.SE.LV-FS) puts Simiyu (142) and Shinyanga (74) among the highest; 68 of 170 units share the minimum. Dar es Salaam sits at the maximum (19, UP-01). The cropland-based regional index flattens the drought-prone centre.
- Impact: The drought group ranks the semi-arid centre below the coast and the wet south; drought contributes nothing to the risk of Simiyu, Shinyanga, Mwanza and Tabora.
- Fix: Keep the workbook value in the Core with its data note (DN-02); raise with INFORM (JRC) and SADC; TMA and MoA can replace it through the Data portal; the Advancement layer carries council-level drought members.
- Decision / owner: User: decision D5 (upstream queries)
- Acceptance: The note is shown on every affected value; the query is in the register sent to the partners.

**UP-06 Kagera has zero earthquake exposure despite the 2016 Bukoba earthquake** (Medium, P2, effort -)

- Evidence: HA.NAT.EQ-EXP (GEM exposure index, district) is 0 for all eight Kagera units, as for the coast, although the USGS catalogue in the repository records the Mw 5.9 earthquake of 10 September 2016 at 27 km from Nsunga (Missenyi), the most damaging in Tanzania in decades. The index counts people exposed to modelled shaking, which the global hazard model places low in Kagera.
- Impact: Kagera's hazard dimension carries no seismic risk; a known damaging event is invisible in the Core.
- Fix: Keep the Core value with its data note (DN-03); add a felt-intensity member to the Advancement earthquake basket (done, ADV-08) so the event counts there; raise with INFORM (JRC); ask the Geological Survey of Tanzania for a national seismic zonation through the Data portal.
- Decision / owner: User: decision D5
- Acceptance: The note is shown; the Advancement value for Kagera is above the Core's 0.

**UP-07 Ukerewe, a flat island, is the most landslide-exposed unit** (Low, P3, effort -)

- Evidence: HA.NAT.LS-EXP (World Bank landslide exposure, district): Ukerewe 1.0 (score 10), the next unit Same at 0.28 (8.2). The slope member of the Advancement layer puts Ukerewe among the flattest 20 councils. The exposure layer appears to read the lake shore as hazard.
- Impact: A wrong maximum anchors the landslide group's data range: every other unit is scaled against Ukerewe's artefact.
- Fix: Keep the Core value with its data note (DN-04); raise with INFORM (JRC); the Advancement slope and rainfall members correct the council picture.
- Decision / owner: User: decision D5
- Acceptance: The note is shown; Ukerewe's Advancement landslide value is below its Core value.

**UP-08 Internal displacement is assigned to the wrong regions** (Medium, P2, effort -)

- Evidence: VU.VG.DP-IDP (IDMC 2023, regional): Kaskazini Unguja 30,080 people (score 10), Mtwara 291, Rukwa 146, every other region 0, Manyara included, although the Hanang (Katesh) landslide of 3 December 2023 displaced thousands. 30,080 is of the size of IDMC's national disaster-displacement count for Tanzania.
- Impact: The displaced-people group scores 10 in a region with no recorded displacement and 0 where the year's worst disaster struck.
- Fix: Keep the Core value with its data note (DN-07); raise with INFORM (JRC); PMO-DMD enters the recorded displacement figures by region through the Data portal.
- Decision / owner: User: decision D5
- Acceptance: The note is shown; PMO-DMD's figures replace the row when entered.

**UP-09 Access to electricity is 100% for Dodoma region** (Medium, P2, effort -)

- Evidence: CC.INF.COM-ELEC (Global Data Lab, regional): Dodoma 100, against Mjini Magharibi 80.8, Dar es Salaam 74.5, Kilimanjaro 41.5 and a regional median of 15.8; the same dataset gives Dodoma the lowest wealth index (19.1) and GNI per head in Tanzania. The communication group of Dodoma's seven units scores 4.45 against a median of 7.17.
- Impact: Dodoma's lack of coping capacity is understated by a data error in one indicator.
- Fix: Keep the Core value with its data note (DN-08); raise with INFORM (JRC); NBS replaces it with the 2022 census figure through the Data portal.
- Decision / owner: User: decision D5
- Acceptance: The note is shown; the census figure replaces the row when entered.

**UP-10 The earthquake index sits at its ceiling for 49 units** (Low, P3, effort -)

- Evidence: HA.NAT.EQ-EXP: 49 of 169 units score 10 (raw 0.95 to 1.0 on a data range 0..1) across the whole rift, from Dodoma and Arusha to Mbeya, Rukwa and Kigoma, so the Core cannot rank them against each other.
- Impact: A fifth of the units tie at the maximum of one hazard group.
- Fix: Explain on the value (DN-10, status explained); the Advancement event-density and felt-intensity members separate them.
- Decision / owner: No decision needed
- Acceptance: The explanation is shown on every unit at the ceiling.

**UP-11 The flood model gives Kinondoni a tenth of Ilala's exposure** (Low, P3, effort -)

- Evidence: HA.NAT.FL-EXP (JRC river-flood model, district): Kinondoni 0.1% of people exposed (score 1.2) against Ilala 1.4% (4.7) and Temeke 2.2% (5.4), although the Msimbazi valley floods strike Kinondoni and Ilala alike: the model covers river floods, not the urban pluvial floods of Dar es Salaam.
- Impact: Kinondoni and Ubungo (carved from it) read as nearly flood-free.
- Fix: Explain on the value (DN-11, status explained); the Advancement recorded-flood-events member counts Dar es Salaam's floods.
- Decision / owner: No decision needed
- Acceptance: The explanation is shown on Kinondoni and Ubungo.

**ADV-06 Facility densities counted drug outlets as health facilities, on district polygons** (High, P1, effort M)

- Evidence: scripts/spatial-join-facilities.py joined every point of the census 'Health_Facilities' layer (56,677 points: 35,289 accredited drug dispensing outlets, 6,393 pharmacies, 2,244 traditional medicine shops, 2,102 laboratories, and 10,649 dispensaries, health centres and hospitals) to the 150 district polygons. CC.INF.HC-DENS reached 54.8 per 10,000 for Njombe (599 'facilities' for 109,000 people) and 38.1 for Momba; the 32 urban and township workbook units had no row at all, and the profile's facility counts showed the same inflated numbers.
- Impact: The access-to-health-care and education members of the Advancement layer, and the facility counts on every profile, were wrong by a factor of up to six.
- Fix: Rejoin on the 195 council polygons with the facility types filtered (dispensaries, health centres, hospitals; schools pre-primary to secondary): scripts/spatial-join-facilities-councils.py; feed the Advancement members and the Core display counts from it.
- Decision / owner: No decision needed
- Acceptance: Health density median 1.7 and maximum 6.0 per 10,000 over 195 councils; the register's CHK-10 passes.

**ADV-07 Six member reference ranges did not fit the council spans** (Medium, P2, effort S)

- Evidence: The layer's rule is a relative range set from the span of the council values. DR-SPEI was 0..3 for values 1.38 to 1.74 (every council scored 4.6 to 5.8); FL-R50 0..20 for 0 to 9.2 and FL-R100 0..8 for 0 to 2.4 (flood members could not pass the middle of the scale); DR-CV 0.1..0.35 for 0.11 to 0.29; HC-DENS and EDU-DENS 0..12 for the recomputed spans (0.3 to 6.0 and 1.4 to 18.8).
- Impact: Members added less variation than their data carried; the flood basket was muted.
- Fix: Fit the ranges to the council spans (data-source/inform_advanced_spec.csv), regenerate the inputs and the tools, and let the register check every range against its span at each release (CHK-11).
- Decision / owner: No decision needed
- Acceptance: CHK-11 passes: every range within one and a half times its span.

**ADV-08 The earthquake basket measured frequency only, so a single damaging event did not count** (Medium, P2, effort S)

- Evidence: HA.NAT.EQ-HIST counts USGS M >= 4.5 events within 50 km; Kagera has 0 or 1 and scored 0, like the Core (UP-06). scripts/compute-council-earthquake.py already computed the maximum felt intensity (1.5 M - 1.5 log10(R + 15)) but no member used it.
- Impact: Kagera's Advancement earthquake value equalled the Core's 0.
- Fix: Add HA.NAT.EQ-FELT (maximum felt intensity, weight 0.3, range fitted to the council span 5.64 to 7.62) to the basket; regenerate inputs, tools and the sensitivity report.
- Decision / owner: No decision needed
- Acceptance: Kagera's Advancement earthquake value is above the Core's; the ADVANCED tool verifies 2,340 of 2,340 cells.

**RC-10 Profiles communicated warnings and advice where the programme communicates standing risk** (High, P1, effort M)

- Evidence: The 'What to do' section carried warning levels (Advisory, Warning, Major warning with 'be prepared / take action / take action immediately'), 'what helps' advice for residents, text messages for warnings and an incident guide, and the hero and explorer badges said 'Preparedness priority'. The programme's decision (10 October 2026): the system communicates risk for people to live and plan with, not warnings; levels and colours follow the INFORM classes (very low and low yellow, medium and high orange, very high red) and the warning words never appear.
- Impact: Readers took standing risk for warnings; residents were told what to do rather than what the risk means for living, planning, building and investing in the area.
- Fix: Replace the section with 'Know the risk': the risk level on its colour band with what it means for residents and for those who plan, build, invest or settle there; the hazards of the area; the guide's statements about the area one click away; the committees' action library folded. Remove the warning levels, advice, text messages and incident guide from profiles, the explorer panel and the risk card.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: No profile, panel or card shows Advisory, Warning or Major warning; the class and its colour band are shown with the two messages.

**RC-11 Two emergency numbers were shown** (Low, P1, effort S)

- Evidence: Profiles and the risk card listed 190 (Emergency) and 114 (Fire and Rescue); the guide texts said 'call 114 and 190', 'call 114' (52 places in the hazard, incident and region files). The programme uses one number, 190, stated on its own (it is not the Fire and Rescue Force's line).
- Impact: People were given a second number to call.
- Fix: One number, 190, on profiles and the risk card; 114 replaced by 190 in every guide text (council codes such as C114 untouched).
- Decision / owner: User: decided (10 October 2026)
- Acceptance: No 114 remains in the guide texts or the interface.

**DE-09 No single screen let the Office control the distribution of data-serving responsibilities** (Medium, P1, effort M)

- Evidence: Assignments and requests were made indicator by indicator on the Indicators tab; nothing showed the institutions side by side with what each serves, what each owes and what each has delivered, nor where every live value of every group comes from (workbook, institution, withheld, empty).
- Impact: PMO-DMD could not see or steer the data-serving distribution in one place.
- Fix: A data-control tab for administrators and PMO-DMD: institutions with their indicators, requests and submissions; one action to assign every unassigned indicator to its usual source and one to request updates from an institution; the lineage of every group's live values; a CSV of the distribution.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: The tab shows every institution and every group; assignments and requests made there appear on the institutions' Indicators tab and inbox.

**DOC-07 The live Methodology page carried the research analyses as well as the operational documentation** (Medium, P1, effort S)

- Evidence: Thirteen documentation pages, among them the Advancement baskets with their sensitivities, the quality checks with the coherence table, the Tanzanian-classes and aggregation-rule sensitivities and the corrections of the version: text that duplicates the thesis and the assessment reports, which a plagiarism check would read as copied from the site.
- Impact: The site was heavier than its users need and the thesis risked being counted as a copy of it.
- Fix: Keep on the site the operational documentation (overview, structure, calculation with the worked example, geometric mean, classification, levels, severity method, sources register, data notes, references); report the analyses in the thesis and docs/assessment; keep the engine's sensitivities in tests and reports.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: Ten documentation pages; no sensitivity table on the site; the thesis and the assessment reports carry the analyses.

**UX-10 Learning pages used half the screen and the course progress was easy to miss** (Low, P2, effort S)

- Evidence: A lesson's article was 704 px wide on a 1,280 px screen (max-w 44rem) and the progress was a 1 px line with a small count.
- Impact: Lessons and their widgets read small on desktops; progress did not register.
- Fix: Widen the article to 58rem; show the progress as one segment per lesson with a larger count on the overview and in the lesson sidebar.
- Decision / owner: No decision needed
- Acceptance: Article 58rem wide; segmented progress on both screens.

**DATA-01 Six indicator groups of the template had no data and eight values were withheld, leaving the model thin** (High, P1, effort L)

- Evidence: Heatwave, lightning, zoonoses, hazardous material, vehicle accidents and the economic vulnerable-groups group had no data in the workbook; coastal erosion, food security, displacement, Dodoma's electricity, Ukerewe's landslide, Dar es Salaam's drought, the Lake zone's drought and Kagera's earthquake were withheld after validation (DN-01 to DN-08).
- Impact: Almost a third of the groups contributed nothing to any score.
- Fix: Prepare institutional values from public, citable datasets for exactly those indicators (Benchmark 2026): coastal erosion from Digital Earth Africa, sea-level-rise exposure from the Copernicus DEM, cyclone swaths from IBTrACS, heatwave days from ERA5-Land, lightning from WWLLN, road deaths from the police statistics, food security from the IPC, electricity, phones, literacy, female-headed households and disability from the 2022 census, displacement from IDMC; recheck Kagera and the Lake zone from their own sources.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: 30 of 32 groups carry data; the workbook build is unchanged.

**DATA-02 Template indicators without data had no Tanzanian definition the engine could score** (Medium, P1, effort M)

- Evidence: The switched-off template indicators carry no unit, keyed level, direction or reference range, so a submitted value could not be standardised.
- Impact: Institutions could not fill them through the portal.
- Fix: Activate them with a Tanzanian definition as the workbook's Metadata sheet does (ACTIVE_SPECS); resolve the range from the data; migration 0014 flags them core in the portal.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: Seven activations; the workbook specification (SPECS) stays exact for the parity tests.

**DATA-03 Suspicious workbook values were corrected by hand nowhere: the system could not show a corrected value with its lineage** (Medium, P1, effort M)

- Evidence: The quarantine withheld values but offered no route to a corrected value other than an institution's future submission.
- Impact: Dar es Salaam's drought, Ukerewe's landslide and the others stayed blank.
- Fix: Apply benchmark values as approved institutional values of a stated date, merged with the portal's values by date, and keep withheld workbook values out of recomputed leaves.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: Every benchmark value shows its dataset and institution; an approved submission supersedes it.

**TOOL-03 The collection tools did not carry the activated indicators or the benchmark values, and a filled tool could not be imported** (Medium, P1, effort M)

- Evidence: The tools held the 53 workbook indicators only; institutions had to retype a filled tool into the portal or convert it to the CSV template.
- Impact: The tools and the portal were two separate paths.
- Fix: Build the tools from the active specification (60 columns); produce the Benchmark 2026 filled tool with a datasets sheet; read a filled tool directly in the portal (xlsx-lite) on the Data control tab and on the institution's Indicators tab.
- Decision / owner: No decision needed
- Acceptance: A filled tool becomes one pending submission per indicator; nothing enters without approval.

**DATA-05 Zoonoses, plants and pests, and hazardous material still have no validated council dataset** (Low, P2, effort L)

- Evidence: No national register of animal or plant disease outbreaks, pest outbreaks or hazardous installations is published at council level; the EMPRES-i, WAHIS and OpenStreetMap routes tried on 10 October 2026 were not reachable or not usable without credentials.
- Impact: The two groups stay empty and are excluded from the hazard mean.
- Fix: Collect through the institutions (MoA, MoLF, NEMC) with the activated-indicator route; candidate sources: FAO EMPRES-i outbreaks, IRLCO-CSA locust outbreak areas, NEMC's register of hazardous installations.
- Decision / owner: Decision D13: the institutions supply the registers
- Acceptance: Open until a source exists.

**DE-10 Reviewers could type a 0-10 score for an indicator group (Enter scores, Bulk paste)** (Medium, P1, effort S)

- Evidence: Two reviewer tabs wrote 0-10 leaf scores directly, kept for the indicator groups that had no workbook indicator; with the Benchmark 2026 activations every group but two has an indicator the workbook method scores from a measured value.
- Impact: A typed score has no measured value behind it and cannot be recomputed; it contradicts the rule that the model calculates from entered data.
- Fix: Remove the two tabs; keep the measured-value routes (entry sheet, template, filled tool); the engine's override mechanism stays for the benchmark stamps and the recomputed leaves.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: No screen types a score; the review queue still shows any pending direct submission made earlier.

**UX-11 The header listed six sections side by side** (Low, P2, effort S)

- Evidence: Risk explorer, Insights, Crisis severity, Learn, Methodology and Data portal sat in one row; the two destinations people use every day did not stand out.
- Impact: The header read as a list rather than a route.
- Fix: Show Risk explorer and Data portal, and an 'Others' menu with Insights, Crisis severity, Learn and Methodology; the phone menu and the footer keep every section.
- Decision / owner: User: decided (10 October 2026)
- Acceptance: Two links and one menu on desktops; the menu reads as active when one of its pages is open.

**UX-12 Every council and region showed 'Updated' after the Benchmark 2026** (Medium, P1, effort S)

- Evidence: The benchmark values are stamps on every council, and the badge, the update counts and the edited marks counted every stamp: 195 of 195 councils and 31 of 31 regions read 'Updated' with no institution having submitted anything.
- Impact: The badge lost its meaning; a real update could no longer be seen.
- Fix: Give every stamp its origin (portal, benchmark, Advancement) and count portal updates only; show the benchmark as its own lineage.
- Decision / owner: No decision needed
- Acceptance: No unit shows 'Updated' until an institution's value is approved.

**PERF-01 The Benchmark 2026 file tripled the application's first download** (Medium, P1, effort S)

- Evidence: The benchmark JSON repeated its source strings on every value (1.1 MB raw) and sat in the entry chunk (1.69 MB raw, 179 KB gzip).
- Impact: Slower start on low-end phones (parse time).
- Fix: Store the file compactly (dataset metadata once, values as maps; 44 KB) and add an entry-size budget to CI.
- Decision / owner: No decision needed
- Acceptance: Entry 776 KB raw, 172 KB gzip, under a budget of 850 and 200 KB.

**RC-15 The explorer card and the profile listed different hazards for the same council** (Medium, P1, effort S)

- Evidence: The card listed the Guide Book's documented hazards only (Kibiti: floods, large waves, heavy rain, public health) while the profile listed the reconciled list with the model's scores (strong winds 10.0 first), and the band message pointed at 'the hazards listed below'.
- Impact: Two different hazard stories for one council.
- Fix: Use the reconciled list and one naming function in every list.
- Decision / owner: No decision needed
- Acceptance: Kibiti's card reads 'Strong winds · Heavy rainfall · Floods · Large waves', as the profile.

**RC-16 The low band's planning message promised 'few hazard constraints' where a natural hazard is very high** (High, P1, effort S)

- Evidence: 8 of the 29 councils with low or very low risk carry a natural hazard scoring 8 or more (earthquake 10 in Moshi Municipal, Singida District and Municipal, Iramba, Ikungi, Mkalama; landslide 8.1 in Iringa Municipal; environmental degradation 8.6 in Makambako); overall risk is low there because vulnerability and coping are good.
- Impact: Planners and investors told the opposite of what the hazard data say.
- Fix: Name the hazard in the planning message where the band is low and a natural hazard scores 8 or more.
- Decision / owner: D19: the wording, with PMO-DMD
- Acceptance: The eight councils read the hazard-aware message in English and Kiswahili on the profile and the risk card.

**UX-13 Keyboard focus is lost after selecting an area in the explorer** (Medium, P1, effort S)

- Evidence: After choosing an area with the search, focus drops to the page body; Escape does not close the card; more than 120 Tab presses reach the card from the top.
- Impact: Keyboard and screen-reader users lose their place.
- Fix: Move focus to the panel heading on selection, Escape steps back, a skip link reaches the panel (panel phase 1).
- Decision / owner: No decision needed
- Acceptance: Planned in phase 1 of docs/EXPLORER_RISK_PANEL_PLAN.md.

**UX-14 The explorer has no national panel** (Low, P2, effort S)

- Evidence: Selecting Tanzania opens no card; a breadcrumb has no root.
- Impact: The national picture is only on the national profile.
- Fix: Add a national state to the panel and its breadcrumb (panel phase 1).
- Decision / owner: No decision needed
- Acceptance: Planned in phase 1.

**RC-12 Three colour systems on one screen** (Medium, P1, effort S)

- Evidence: The map's classes use a red-yellow-green ramp for every scale; the risk band uses yellow, orange and red; indicators use a third ramp. A medium council is yellow on the map and orange in the panel; a low council green on the map and yellow in the panel. The INFORM SADC 2024 workbook itself colours risk pink to burgundy, hazard yellow to brown, vulnerability blue and lack of coping green, with no green for low risk.
- Impact: The same area reads in two colours on one screen.
- Fix: Nest the five risk classes in the three bands (no green) and take the dimension palettes from the workbook (D17).
- Decision / owner: D17
- Acceptance: Waits for the decision; phase 3 of the plan.

**RC-13 Human hazards would read as a council's own hazards** (Medium, P1, effort S)

- Evidence: Conflict and violence score 6 or more in 99 councils from one regional value (Conflict Barometer) repeated on every council; listed with the natural hazards they read as local conditions.
- Impact: Misleading on a public panel.
- Fix: Show human hazards in a separate fold with their source and resolution (D18).
- Decision / owner: D18
- Acceptance: Phase 2 of the plan.

**RC-14 The Guide Book's statements are not tagged by hazard, and its hazards disagree with the model's in measurable ways** (Low, P2, effort M)

- Evidence: 184 of 195 councils have one statement covering all hazards. Documented but scoring 0 in the Core: strong winds 93 of 105 councils (cyclones only), large waves 33 of 62 (ocean only), public health 59 of 59 (no data).
- Impact: A per-hazard statement cannot be quoted; a documented hazard can read as scoring 0 without a reason.
- Fix: Give each hazard row its basis and the reason when documented but unscored (phase 2); tag the guide's statements by hazard with PMO-DMD (phase 5).
- Decision / owner: No decision needed
- Acceptance: Phases 2 and 5 of the plan.

**DATA-06 Internal violence counts (ACLED, by region) are too complicated to communicate as a council's hazard** (Medium, P1, effort S)

- Evidence: The workbook's internal-violence group counts the political violence events and fatalities ACLED recorded by region (2020-2024: Kigoma 57 events, Dar es Salaam 29, Mtwara 28 with 49 fatalities). They follow news reporting, mix kinds of violence and exist by region only; the panel showed them as a council's hazard.
- Impact: A sensitive, regional count read as a council's own hazard.
- Fix: Withhold the group from the live model by programme decision (a note with the status 'decision', both indicators), keep the workbook's values, count decisions apart from validation findings.
- Decision / owner: User decision (10 October 2026): 'internal violence there should be no data, it's complicated'
- Acceptance: Resolved by data note DN-12.

**DATA-07 Vehicle accidents did not show the big cities: a regional death rate put rural highway regions first** (Medium, P1, effort S)

- Evidence: The Benchmark 2026 activation used road deaths per 100,000 by police region (2024-2025): Lindi 7.8, Ilala 1.3. Police tables count serious crashes only since 2020, and every council carried its police region's rate; the cities, where most crashes and injuries happen (65.7% urban among 7,092 patients, Sawe et al. 2021; Dar es Salaam more than half of the recorded crashes in 2018-2019), read as safe.
- Impact: The hazard map contradicted where crashes happen.
- Fix: Measure crash density per 100 km2: each police region's recorded crashes shared among its councils by population and divided by land area (log-transformed).
- Decision / owner: User request (10 October 2026): 'vehicle accidents, search but in big cities'
- Acceptance: Resolved (Benchmark 2026 revision).

**DATA-08 The benchmark's council population file gave 29 councils a neighbour's population** (Medium, P1, effort S)

- Evidence: data-source/benchmark_2026/council_pop_2022.json had been matched on district names: Kondoa Town 244,854 (Kondoa District's) instead of 80,443, Kibaha Town and District both 123,367; total 64.0 million against the census 61.7 million. The road death rates were computed with it.
- Impact: Per-capita benchmark values off for the police regions concerned.
- Fix: Rebuild the file from the census populations the model uses (data-source/council_climate.csv; total 61,741,120).
- Decision / owner: No decision needed
- Acceptance: Resolved.

**UX-15 Selecting an area showed no map of it, no trends and no statements of its own** (Medium, P1, effort M)

- Evidence: The explorer's panel had the risk level's generic band messages and the guide's statements; the risk card the same. There was no map of the selected area to move around from, no charts or trends beside the map, and no sentence built from the area's own data.
- Impact: The communication read the same for every council of a band.
- Fix: A left column on wide screens with the area's map (neighbours one click away) and trends and charts (parts against region and nation, hazard profile, heatwave days and rainfall by year, change since the workbook); statements generated from the model in the risk panel and on the risk card.
- Decision / owner: User request (10 October 2026)
- Acceptance: Resolved.

**DATA-09 DRR implementation was one national value: a council's own preparedness changed nothing** (High, P1, effort M)

- Evidence: The workbook's DRR implementation group has two national indicators (Sendai score 0.7, anticipatory-action coverage 0 people), so every council scored 6.5 whatever it had in place; the PMO-DMD lists of district plans, assessments, regional centres and trained teams were display metadata only.
- Impact: Preparedness investments did not reach the risk score of the council, its region or the country.
- Fix: A Tanzanian indicator inside the group: the share of five arrangements (EPRP, RVCA, trained ERT, EOCC, DRR training), seeded from the published lists and superseded by the committees' approved records; an arrangement not recorded is not in place.
- Decision / owner: Decision D20 (PMO-DMD, 10 October 2026): the five criteria; registers complete so absence counts; national high until updated
- Acceptance: Resolved; the register of about 40 districts with plans to be completed (26 recorded).

**DATA-10 Governance was a national score and a regional corruption index: the committees' functioning was not measured** (Medium, P1, effort M)

- Evidence: The group has the national government-effectiveness score and the regional subnational corruption index. PMO-DMD sees the differences in stakeholder collaboration (the big cities) and in involvement in DRR issues (Arusha, Mwanza, Pwani); the Disaster Management Act and Policy apply everywhere.
- Impact: Councils could not be told apart on how their committees work.
- Fix: A Tanzanian indicator inside the group: the share of the assessed criteria met (committee active, stakeholder collaboration, involvement in DRR); a council has a value only once assessed; the committees record and confirm through the Data portal.
- Decision / owner: Decision D20 (PMO-DMD, 10 October 2026): criteria; assessed-only rule; PMO-DMD's communication accepted as the seed pending confirmation
- Acceptance: Resolved; assessments to be entered for the other councils.

**LRN-02 The course taught two non-INFORM rules as INFORM: a log-scaled density exposure index that amplifies flood, and a refugee-driven 'displaced people' score for Kasulu** (High, P0, effort S)

- Evidence: learn.json lesson 2 ('exposure = (log10 density − log10 min) ÷ … × 10', 'flood = max(h, √(h × E))', quiz 3 on the max rule) and lesson 3 (callout 'Hosting large displaced populations raises the displaced people indicator'; quiz 4 'Why does Kasulu District score high on displaced people? … It hosts a large refugee population'). In the Core the displaced-people indicator is IDMC internally displaced people by region (2023): Kasulu and Kibondo score 0; only 13 of 170 units score above 0 (src/data/tanzania-inform-risk.json).
- Impact: Officers were taught a formula that is not INFORM's and a factual claim that the Core contradicts; the quiz marked the false claim as the correct answer.
- Fix: Rewrite lesson 2 around INFORM's per-hazard exposure (flood, landslide, cyclone shares of people; earthquake and volcano exposure indices), keep census population as context, and document the removed rule honestly. Rewrite the Kigoma callout and quiz 4 to teach why the camps do not raise the score and how the gap is closed (MoHA/UNHCR through the Data portal, or the Advancement layer). Update the answer key.
- Decision / owner: Done
- Acceptance: catalogue.test.ts: the exposure lesson contains no exposure index, log-scaled density or √; answer keys [2,1,0] and [2,3,0,0].

## Indicator groups: how each differs from the workbook

| Group | Indicators in use | Same | Raised | Lowered | Added | How it was changed | Evidence type | Action |
|---|---|---|---|---|---|---|---|---|
| Coastal hazards | 1 | 144 | 25 | 0 | 1 | refill-real-hazards.mjs: coastal strip set to 7.0 | Judgement grade | Workbook value in core (with UP-02 note); Advanced coastal basket |
| Drought | 1 | 37 | 133 | 0 | 0 | refill-real-hazards.mjs (7.0 / 6.5 lists) + apply-climate-hazards.mjs (CHIRPS/ERA5 index, max) + council raise | Data (different method) + judgement | Workbook value in core; drought basket in Advanced |
| Earthquake | 1 | 150 | 20 | 0 | 0 | build-hazard-overlays.mjs regional grades + refill (Kagera) | Judgement grade | Workbook GEM value in core; PGA + seismicity in Advanced |
| Environmental degradation | 2 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Flood | 1 | 115 | 54 | 0 | 1 | refill-real-hazards.mjs (8.5/8.0/7.5/7.0) + apply-climate-hazards.mjs (heavy rain, events, exposure) | Data + judgement | Workbook flood exposure in core; flood basket in Advanced |
| Heatwave | 0 | 32 | 0 | 0 | 138 | compute-heatwave.py (ERA5) via apply-climate-hazards.mjs | Data (no INFORM indicator in use) | Advanced only, all units |
| Landslide | 1 | 157 | 13 | 0 | 0 | refill-real-hazards.mjs: highlands set to 7.0 | Judgement grade | Workbook value in core; slope + trigger basket in Advanced |
| Lightning | 0 | 41 | 0 | 0 | 129 | build-hazard-overlays.mjs regional grades | Judgement grade | Remove from core; LIS/OTD flash density in Advanced |
| Storms & cyclones | 1 | 140 | 29 | 0 | 1 | storm_cyclone_exposure.csv (37 graded rows from named events) | Judgement from documented events | Workbook value in core; storms basket in Advanced |
| Volcano | 1 | 161 | 9 | 0 | 0 | build-hazard-overlays.mjs district grades | Judgement grade | Workbook value in core; expert assessment or GVP data in Advanced |
| Wildfire | 2 | 167 | 3 | 0 | 0 | build-hazard-overlays.mjs regional grades | Judgement grade | Workbook value in core; TFS/MODIS counts in Advanced |
| Zoonoses, plants & pests | 0 | 99 | 0 | 0 | 71 | build-hazard-overlays.mjs regional grades | Judgement grade | Remove from core; Advanced only with data |
| Conflict intensity | 1 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Conflict risk | 1 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Hazardous material | 0 | 154 | 0 | 0 | 16 | build-hazard-overlays.mjs district grades | Judgement grade | Remove from core; Advanced only with data |
| Internal violence | 2 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Vehicle accidents | 0 | 106 | 0 | 0 | 64 | build-hazard-overlays.mjs grades 'kept moderate' | Judgement grade | Remove from core; police accident counts in Advanced |
| Development & poverty | 4 | 143 | 27 | 0 | 0 | refill-real-hazards.mjs: HBS 2017-18 grades by region | Judgement from survey figures | Workbook value in core; NBS figures via data entry |
| Economic dependency | 3 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Habitat | 2 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Livelihoods | 1 | 157 | 13 | 0 | 0 | apply-vulnerability.mjs: IPC phase mapped to grade | Judgement mapping of real IPC data | IPC figures as raw values via data entry |
| Displaced people | 1 | 164 | 6 | 0 | 0 | apply-vulnerability.mjs: UNHCR refugees scaled | Data, non-INFORM scaling | UNHCR figures as raw values; refugees in Advanced |
| Health conditions | 3 | 84 | 86 | 0 | 0 | apply-vulnerability.mjs: HIV + malaria regional blend | Data, non-INFORM definition | Raw values for INFORM indicators; HIV in Advanced |
| Children health & nutrition | 4 | 125 | 45 | 0 | 0 | refill-real-hazards.mjs: TDHS 2022 stunting grades | Judgement; non-INFORM definition | TDHS 2022 raw values for the INFORM indicators |
| Economic (vulnerable groups) | 0 | 170 | 0 | 0 | 0 | Empty by design (no indicator in use) | Workbook | Keep (documented) |
| Access to health care | 6 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| Economic capacity | 3 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| WASH | 2 | 34 | 22 | 114 | 0 | enrich-coping-facilities.mjs: raw facility counts ranked into 2-8 | Flawed method | PHC 2022 / MoW % via data entry |
| Communication | 3 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep; fill internet access |
| Education | 2 | 170 | 0 | 0 | 0 | Unchanged | Workbook | Keep |
| DRR implementation | 2 | 129 | 0 | 41 | 0 | refill-real-hazards.mjs + enrich-coping-facilities.mjs: EOCC/ERT/AA/EPRP | Judgement grade | Workbook value in core; DRR rubric in Advanced |
| Governance | 2 | 135 | 0 | 35 | 0 | refill-real-hazards.mjs: EOCC regions | Judgement grade | Workbook value in core |

## Data sources of the 53 scoring indicators

| ID | Indicator | Resolution | Distinct values | Source | Year | Assessment | Suggested Tanzanian source |
|---|---|---|---|---|---|---|---|
| HA.NAT.CH-ERO | Coastal Erosion | Adm2 | 5 | Digital Earth Africa | 2000 - 2022 | Regional resolution only; data from 2000 - 2022; degenerate for TZ (UP-02); missing in 1 unit(s) | NEMC/VPO shoreline monitoring; Digital Earth Africa coastlines reprocessed |
| HA.HUM.CI-CBAR | Conflict Barometer | Adm1 | 1 | Heidelberg Institute for International Conflict Research | 2022.0 | Uniform: one value for all units | MoHA |
| HA.HUM.CR-GCRI | GCRI derived Conflict probability | National | 1 | JRC | 2024.0 | Uniform: one value for all units | Global (JRC); national value |
| HA.NAT.DR-FRE | Historic Drought Frequency | Adm1 | 11 | FAO | 1984-2023 | Regional resolution only; data from 1984-2023 | TMA drought monitoring; MoA crop assessments |
| HA.NAT.EQ-EXP | Earthquake exposure | Adm2 | 59 | Global Earthquake Model (GEM) | 2023.0 | District-level variation; missing in 1 unit(s) | GST seismic zonation (GEM PGA is a sound global source) |
| HA.NAT.DE-ERO | Soil Erosion | National | 25 | JRC | Unknown (pre | Regional resolution only; keyed National but varies (SRC-06) | NEMC; SUA soil studies |
| HA.NAT.ED-DEF | Deforestation - Treecover Loss | Adm2 | 164 | Global Forest Watch | 2000-2022 | District-level variation; data from 2000-2022; missing in 1 unit(s) | TFS/NAFORMA forest loss |
| HA.NAT.FL-EXP | Flood exposure | Adm2 | 71 | JRC | n/a

modelle | District-level variation; missing in 1 unit(s) | MoW basin water boards; PMO-DMD flood records |
| HA.HUM.VIO-EVE | Number of Events | Adm1 | 15 | ACLED | 2020-2024 | Regional resolution only | Tanzania Police Force |
| HA.HUM.VIO-FAT | Number of Fatalities | Adm1 | 11 | ACLED | 2020-2024 | Regional resolution only | Tanzania Police Force |
| HA.NAT.LS-EXP | Landslide exposure | Adm2 | 127 | World Bank | 1980-2018 | District-level variation; data from 1980-2018; missing in 1 unit(s) | GST landslide inventory |
| HA.NAT.ST-TC2 | Cyclone exposure - max speed | Adm2 | 2 | 4TU.Research Data | 2023.0 | Regional resolution only; missing in 1 unit(s) | TMA cyclone records |
| HA.NAT.VC-EXP | Volcano exposure | Adm1 | 3 | NOAA | unknown | Regional resolution only | GST volcano monitoring |
| HA.NAT.WF-BURN | Burned Area | Adm1 | 22 | JRC (GWIS) | 2019-2023 | Regional resolution only | TFS fire points (on file in inform_sheets/FIRE DATA) |
| HA.NAT.WF-FWI | Fire Weather Index | Adm1 | 22 | GFDRR | 2022.0 | Regional resolution only | TMA fire weather |
| VU.VG.CH-MORTCH | Child mortality | Adm1 | 25 | Global Data Lab | 2006 - 2021 | Regional resolution only; data from 2006 - 2021 | NBS/MoH TDHS-MIS 2022 |
| VU.VG.CH-MORTINF | Infant mortality | Adm1 | 25 | Global Data Lab | 2011 - 2022 | Regional resolution only; data from 2011 - 2022 | NBS/MoH TDHS-MIS 2022 |
| VU.VG.CH-MORTNEO | Neonatal mortality | Adm1 | 25 | Global Data Lab | 2006 - 2021 | Regional resolution only; data from 2006 - 2021 | NBS/MoH TDHS-MIS 2022 |
| VU.VG.CH-UW | Children Underweight | Adm1 | 23 | Global Data Lab | 2000 - 2022 | Regional resolution only; data from 2000 - 2022 | NBS/MoH TDHS-MIS 2022 |
| VU.SE.POV-GDI | Gender Development Index | Adm1 | 7 | Global Data Lab | 2022.0 | Regional resolution only | NBS |
| VU.SE.POV-GINI | Wealth Inequality | Adm1 | 15 | Global Data Lab | 2011 - 2022 | Regional resolution only; data from 2011 - 2022 | NBS (HBS) |
| VU.SE.POV-HDI | Human Development Index | Adm1 | 13 | Global Data Lab | 2022.0 | Regional resolution only | NBS / MoFP |
| VU.SE.POV-MPI | Multidimensional Poverty Index | Adm1 | 9 | OPHI | 2012-2021 | Regional resolution only; data from 2012-2021 | NBS (HBS, PHC 2022) |
| VU.VG.DP-IDP | Internal Displaced People | Adm1 | 4 | IDMC | 2023.0 | Regional resolution only | PMO-DMD |
| VU.SE.DEP-DR | Dependency Ratio | Adm1 | 24 | Global Data Lab | 2011 - 2022 | Regional resolution only; data from 2011 - 2022 | NBS PHC 2022 (council) |
| VU.SE.DEP-ODA | Net ODA received (% of GNI) | National | 1 | World Bank | 2018-2022 | Uniform: one value for all units | MoFP (national) |
| VU.SE.DEP-REM | Personal remittances | National | 1 | World Bank | 2019-2023 | Uniform: one value for all units | Bank of Tanzania (national) |
| VU.SE.HAB-INF | Population in informal settlements | National | 1 | UN Habitat | 2022.0 | Uniform: one value for all units | MLHHSD / NBS |
| VU.SE.HAB-URB | Urban Population | Adm1 | 25 | Global Data Lab | 2013 - 2022 | Regional resolution only; data from 2013 - 2022 | NBS PHC 2022 (council) |
| VU.VG.HC-LEXP | Life Expectancy | National | 25 | Global Data Lab | 2022.0 | Regional resolution only; keyed National but varies (SRC-06) | NBS |
| VU.VG.HC-MALAPREV | Malaria prevalence | Adm1 | 19 | Malaria Atlas Project | 2022.0 | Regional resolution only | MoH NMCP; TDHS-MIS 2022 |
| VU.VG.HC-MEASLES | Measles Incidence | National | 1 | WHO | 2019-2023 | Uniform: one value for all units | MoH EPI / DHIS2 |
| VU.SE.LV-FS | Food Security - Insufficient food | Adm1 | 10 | IPC | 2022-2024 | Regional resolution only; 0 in 108 units (UP-03) | MUCHALI / IPC (council) |
| CC.INF.HC-BCG | BCG Immunization Coverage | Adm1 | 15 | Global Data Lab | 2006 - 2021 | Regional resolution only; data from 2006 - 2021 | MoH DHIS2 (council) |
| CC.INF.HC-DTP | DTP3 Immunization Coverage | Adm1 | 24 | Global Data Lab | 2006 - 2021 | Regional resolution only; data from 2006 - 2021 | MoH DHIS2 (council) |
| CC.INF.HC-EXP | Health expenditure per capita | National | 1 | WHO | 2017-2021 | Uniform: one value for all units | MoH (national) |
| CC.INF.HC-FAC | Density of health facilities | Adm1 | 31 | HDX | 2019.0 | Regional resolution only | MoH facility registry + PHC 2022 (per capita, council) |
| CC.INF.HC-MEASLES | Measles Immunization Coverage | Adm1 | 26 | Global Data Lab | 2006 - 2021 | Regional resolution only; data from 2006 - 2021 | MoH DHIS2 (council) |
| CC.INF.HC-PHY | Physicians density | National | 1 | WHO | 2018.0 | Uniform: one value for all units | MoH HRHIS (council) |
| CC.INF.COM-ELEC | Access to electricity | Adm1 | 25 | Global Data Lab | 2013 - 2022 | Regional resolution only; data from 2013 - 2022 | NBS PHC 2022 / REA (council) |
| CC.INF.COM-INT | Internet access | Adm1 | 0 | Global Data Lab | 2011 - 2022 | No data in any unit; data from 2011 - 2022 | TCRA |
| CC.INF.COM-PHONE | Cellphone ownership | Adm1 | 24 | Global Data Lab | 2011 - 2022 | Regional resolution only; data from 2011 - 2022 | TCRA / NBS PHC 2022 |
| CC.INS.DRR-EWS | Early Warning System | National | 1 | Anticipation Hub | 2023.0 | Uniform: one value for all units | PMO-DMD / TMA |
| CC.INS.DRR-SEN | Sendai Framework for Action | National | 1 | UNDRR | 2017-2022 | Uniform: one value for all units | PMO-DMD |
| CC.INF.ECO-GDP | Gross National Income per capita | Adm1 | 21 | Global Data Lab | 2022.0 | Regional resolution only | NBS regional accounts |
| CC.INF.ECO-INC | Household income | National | 1 | World Bank | 2017-2021 | Uniform: one value for all units | NBS HBS |
| CC.INF.ECO-IWI | International Wealth Index | Adm1 | 25 | Global Data Lab | 2013 - 2022 | Regional resolution only; data from 2013 - 2022 | NBS |
| CC.INF.EDU-ALIT | Adult literacy rate | National | 1 | World Bank | 2020-2022 | Uniform: one value for all units | NBS PHC 2022 (council) |
| CC.INF.EDU-YRS | Mean years at school | Adm1 | 24 | Global Data Lab | 2022.0 | Regional resolution only | NBS PHC 2022; MoEST |
| CC.INS.GOV-EFF | Government effectiveness | National | 1 | World Bank | 2018-2022 | Uniform: one value for all units | Global (World Bank, national) |
| CC.INS.GOV-SCI | Subnational Corruption Index | Adm1 | 24 | Global Data Lab | 2022.0 | Regional resolution only | PCCB / PO-RALG |
| CC.INF.WASH-SAN | People using at least basic sanitation services (% of population) | National | 1 | WHO/UNICEF Joint Monitoring Programme (JMP) for Water Supply and Sanitation | 2022.0 | Uniform: one value for all units | NBS PHC 2022 (council); MoW |
| CC.INF.WASH-WF | People using at least basic drinking water services (% of population) | National | 1 | WHO/UNICEF Joint Monitoring Programme (JMP) for Water Supply and Sanitation | 2022.0 | Uniform: one value for all units | NBS PHC 2022 (council); MoW water point mapping |

The 25 unused workbook indicators and the 25 advanced indicators are in the workbook's Indicators sheet.

## Recommended data management design

| Area | Element | Design |
|---|---|---|
| Principle | One engine, two published views | CORE = the authentic INFORM workbook plus approved institutional values entered by the INFORM method. ADVANCED = CORE plus Tanzanian research indicators, institution products and labelled expert assessments. Both are always computed from the same approved data; the site shows which view is on screen and the difference per unit. |
| Principle | Indicator level is the unit of entry | Every submission targets one indicator (e.g. CC.INF.WASH-WF) for one or more units, never a whole indicator group. The engine combines indicators into groups exactly as the workbook does (mean of the indicators with data, baseline for the rest). |
| Principle | Partial data always work | An institution may send any subset: 4 councils, one region, the whole country. Finest level wins for each council (council, else region, else national, else workbook baseline). Nothing is zero-filled. Coverage is shown per indicator and per unit. |
| Principle | Every number has lineage | Value, unit, level, period, dataset, institution, method (raw via engine / 0-10 by INFORM tool / own method / expert judgement), entered by, approved by, timestamps, dataset version. |
| Entry path A | Raw measured values (recommended default) | The institution enters the figure in its natural unit (%, count, rate). The engine standardises it with the frozen workbook reference (denominator, outlier fence, transform, min-max, direction) and shows the 0-10 preview before submission. Goes to CORE for the 53 INFORM indicators, to ADVANCED for advanced indicators. |
| Entry path B | 0-10 scores computed by the institution | For institutions that computed scores themselves, e.g. with the NORMAL Excel tool (same standardiser). The submitter declares the method. If 'INFORM standardiser' and the raw value is attached, the system recomputes and must match within 0.05; matching values go to CORE. Scores without raw, or computed by another method, go to ADVANCED only, labelled. Accepts the NORMAL tool's 'Council 0-10' sheet as an upload. |
| Entry path C | Institution products (component level) | A whole hazard index produced by an institution (e.g. a TMA drought index, a TFS fire index) is entered as an advanced sub-indicator with unit, range, weight and owner. ADVANCED only. |
| Entry path D | Events and situations | Floods, outbreaks, IPC classifications, displacement figures go to an event register with dates and sources. They feed Advanced hazard history and the Severity module, not CORE scores directly. |
| Validation | At entry | Unit codes and names matched (council, region, national); period and dataset required; raw values outside the reference range warned (MET-06); 0-10 values outside 0-10 rejected; change of more than 2 points from the current value flagged; duplicate submissions merged. |
| Review | Approval with consequences in view | Reviewer sees current value and lineage, proposal and lineage, path (A/B/C), the 0-10 effect, councils and classes that would change, and whether the view affected is CORE or ADVANCED. Approve, reject, or return with a note. |
| Versioning | Dated dataset versions | Each approval batch creates a version with a date. Any two versions can be compared on the map and in tables (risk over time). 'As of' shown everywhere. |
| Usability | Friendly for institutions | Home shows 'your indicators' and open requests; one screen per indicator with a table of units; type or paste from Excel; download a template with only your indicators and upload it back (raw or 0-10 column); save drafts; Kiswahili and English; works on a phone; email confirmation of each step (needs SMTP, DE-04). |
| Roles | Who does what | Institution officer: enter and confirm own indicators. PMO reviewer: assign, request, review, approve, revert. Administrator: people and institutions. Public: read approved values with lineage. |
| Code changes | What it takes | Extend raw_submissions with value_type (raw | score) and method; add indicator-level score handling in rawValues.deriveRawOverrides; run computeAdvanced with ADVANCED_MERGED for the Advanced view; allow council-level V&C keys; add version table; template generator from inform-indicator-spec.json and inform-advanced-spec.json. |

## Roadmap

| Phase | When | Goal | Decisions and issues |
|---|---|---|---|
| Phase 0 | Now to 31 Oct 2026 | Correct what is false in public and in the proposal | D1, D6; NAT-01, DOC-01, DOC-02, DOC-06, PROV-01, RC-01, RC-02, UX-06 (KPI), ENG-01 (national invariants), COR-03, OUT-01, OUT-02, OUT-03, OPS-01, DE-04, PIPE-01 (label), LRN-01, RC-10, RC-11, LRN-02 (resolved) |
| Phase 1 | Nov 2026 (2-4 weeks) | Restore core integrity; fix the council links; put guidance first; give coordinators safe access | D2, D3, D7, D8, D9, D12; COR-01, COR-02, COR-04, COR-05, COR-06, ADV-01, ADV-02, ENG-02, MET-05, MET-15, DOC-03, OPS-02, UX-01, UX-02, UX-03, UX-08, RC-03, RC-04, RC-06, GOV-01, GOV-02, GOV-04, PIPE-01, PIPE-02, TST-01, COV-01, EXP-01, ADM-01, ADM-03, ADM-05, TOOL-01 |
| Phase 2 | Nov-Dec 2026 (3-5 weeks) | Data management and guidance management by institutions and coordinators | D4, D10; DE-01, DE-02, DE-03, DE-05, DE-06, DE-07, DE-08, SRC-05, SRC-08, RC-05, RC-07, RC-08, RC-09, GOV-03, UX-04, UX-05, UX-07, SEV-01, SEC-01, SEC-02, SEC-03, MET-13, MET-14, ADM-02, ADM-04; onboard first institutions (NBS, MoH, TMA) and pilot DDRRCs in one region, DE-09, DOC-07, UX-10, DATA-01, DATA-02, DATA-03, TOOL-03, DATA-05, DE-10, UX-11, UX-12, PERF-01, RC-15, RC-16, UX-13, UX-14, RC-12, RC-13, RC-14 |
| Phase 3 | Q1 2027 onward | Upgrade data and methods | D11; MET-01, MET-02, MET-03, MET-04, MET-06, MET-07, MET-08, MET-09, MET-10, MET-11, MET-12, MET-16, ADV-03, ADV-04, ADV-05, SRC-01, SRC-02, SRC-03, SRC-04, SRC-06, SRC-07, TOOL-02, UP-01, UP-02, UP-03, UP-04 (D5), ENG-03, ENG-04, TST-02, DOC-04, DOC-05, SEV-02, ADM-06, UP-05, UP-06, UP-07, UP-08, UP-09, UP-10, UP-11, ADV-06, ADV-07, ADV-08 |

## What checked out

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

