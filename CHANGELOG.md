# Changelog

## Unreleased

### The data discrepancies resolved: conflict groups withheld, earthquake and drought measured per council (14 October 2026)

- Conflict intensity, conflict risk and internal violence carry no data anywhere in the live model, by
  programme decision (data notes DN-12 to DN-14); the human-hazard category is the mean of hazardous
  material and vehicle accidents.
- The workbook's earthquake exposure, at its ceiling in 49 units so that "Earthquake" headed 77 councils
  against the Guide Book, is withheld (DN-10, a known artefact) and the Earthquake group carries for every
  council the maximum felt intensity recorded by the USGS catalogue (1960-2024), ranged over the councils.
- The workbook's regional FAO drought frequency, at its minimum across the semi-arid Lake zone, is withheld
  (DN-02, a programme decision) and the Drought group carries the Benchmark 2026 drought hazard index: 0
  where PMO-DMD's Risk Action Guide Book records no drought, otherwise the council's mean annual rainfall
  (CHIRPS 1991-2024) on the span of all councils, the driest scoring 10. Annual rainfall separates the
  Guide Book's drought councils best of the measures on file (AUC 0.84) and the documentation gates it; an
  ungated aridity index was tried and rejected because it put drought first on the humid coast.
- Both measures are Core workflow indicators (migration 0017, owners GST and PMO-DMD) with their evidence
  (earthquakes within 50 km, mean annual rainfall) in the explorer. The first hazard now contradicts the
  Guide Book in 72 councils instead of 111; docs/assessment/INFORM_TZ_Driver_Discrepancies_2026-10-14.md
  records what remains. National INFORM Risk reads 4.3 (High on the SADC thresholds) with 101 councils
  high, 92 medium and 2 low.
- Where two notes withhold the same value, the first in the register names the hold (a unit's own query
  before the general decision).

### No stories on the pages; risk communication in two messages (14 October 2026)

- The generated "What the data say about…" statements are gone from the explorer panel, the risk card
  and the detailed card, and the Guide Book's narrative statements about an area (its nature, where its
  hazards lie, what helps) no longer appear on a council's profile, card or panel; a region's profile
  and panel keep the list of its councils with their hazards. The events the committees report stay.
- The two messages of the risk level, for people who live or work here and for those who plan, build,
  invest or settle here, stand under the title "Risk communication" on the profile, the explorer panel
  and the cards, and go straight to the message: no opening "Risk here is medium."
- Shorter leads on the home page (the geometric mean, the sources) and under the actions; the
  explorer's population source line and the colouring hint are gone.

### The climate year-by-year charts are gone (14 October 2026)

- The heatwave-days and rainfall bar charts with their notes and source line no longer appear in the
  explorer's chart column or on the detailed risk card; the column is titled "Charts". The climate
  series file and its build script are removed.

### Tsunami only on the coast (13 October 2026)

- The Guide Book's earthquake hazard reads "Earthquake and tsunami" only for areas with a sea coast
  (those whose coastal-hazards group scores above 0) and "Earthquake" everywhere inland, on profiles,
  statements, risk cards, the explorer panel, a region's council list and the committee desk.

### Data notes as a status word; a region's councils and their hazards in view (13 October 2026)

- A data note beside a value now shows only its status (value under query, known artefact, withheld by
  decision, explained), in the tooltip, the status line and the CSV downloads; the notes' texts stay in
  the data notes register and the Methodology page.
- On a region's profile, "The area and its hazards" opens on the list of its councils, each with the
  hazards the Risk Action Guide Book records for it; the statement counts are gone and the leads read
  in one line.

### Profiles state the data, not how it was built (13 October 2026)

- The "About the data" notes under a profile's headline are gone: the aggregation rule, the shared
  workbook unit, the Benchmark 2026 note and the reviewed-update line (the indicator table still names
  the source and date of every value, and the Methodology page explains the rules).
- The analysis view's section leads and reading notes are one short line each: what the section holds,
  which way the arrows and ticks read; no restatement of the thresholds or the layers.

### The portal works with a database still on an older migration (13 October 2026)

- A live database that has not received migrations 0006 to 0016 no longer breaks the portal: values are
  read without their type, method and source where the column does not exist yet, the committee desk,
  notifications and the public views read as empty where their tables do not exist, a measured value
  still goes through the older submit function (a score deposit says plainly that it needs the update),
  and the people list reads without the area scope. Each gap met is recorded, and administrators and
  PMO reviewers see a "Database update pending" notice naming the parts that stay unavailable until the
  migrations are applied.

### Plain words on the Methodology page and the portal (13 October 2026)

- The Methodology page states the data simply: the register's columns read "Dataset" and "Method", a
  Benchmark 2026 value names its dataset in one line (its full definition and source stay in the CSV
  download and the thesis), the quality checks no longer print test-file paths or a command to run,
  and the limitations, levels, overview and advanced-model texts lose their work-log wording (dates of
  passes, decision codes, file paths, "byte-identical", "golden test"). The same in Kiswahili.
- Values of the Benchmark 2026 carry the one-line dataset name wherever a profile or the portal shows
  the figures behind a score.

### A Data management area on the Data portal for everyone (13 October 2026)

- The Data portal now carries a "Data management" area that everyone sees, signed in or not: for each of
  the 32 indicator groups, the responsible institution with its partners, the lead sectors, and the
  councils by the source of their live value (the workbook, the Benchmark 2026, values institutions
  entered, values withheld), with a "Sign in to manage" button that takes the reader to the sign-in
  form. Administrators and PMO reviewers get the same area with its controls (assign, request updates,
  import a filled tool, enter figures for any institution with the source recorded) as the
  "Data management" tab, the former "Data control".

### The Methodology as one document again, the map switch in the middle, the portal figures back (13 October 2026)

- The Methodology is one page again, with its thirteen sections and the "On this page" contents:
  Overview, Model structure, The calculation pipeline (with the live worked example), Why a geometric
  mean, Classification, Administrative levels, Advanced multi-source model, Crisis severity method, Data
  sources register, Quality assurance, Limitations & roadmap, Corrections in this version and
  References. The three sections dropped on 11 October (the advanced baskets, the quality checks with
  the live self-check, the corrections) are back as they were; "Limitations & roadmap" carries the
  Core's data notes first and then the roadmap items (vulnerability and coping coarser than hazard,
  scaling relative to Tanzania, drought not multiplied by exposure, drought seasons in bimodal
  highlands, the Sentinel-1 layer, precision, freshness). The summary page and the section pages of
  11 October are gone; a section's own path (`/methodology/sources`) opens the document at that section.
- On the home page the National · Regional · Council switch stands in the middle above the map; in
  national mode the score and class sit at its right (under it on phones).
- The Data portal's figures row (values in use, awaiting review, last approved change) shows again to
  everyone, as before; the councils figure stays out.

### National, Regional, Council above the home map (13 October 2026)

- A switch above the landing map draws Tanzania by council (the default), by region, or as one piece in
  the colour of its national INFORM risk class, with the national score beside the switch; a click on
  the national map opens the national profile, on the other two the area's profile. The caption names
  the level shown.

### The Data portal opens on the sign-in (13 October 2026)

- A visitor to the Data portal sees the sign-in panel first (email link or password), on one screen;
  the figures row (values in effect, awaiting review, last change) shows only to people signed in, and
  the "Councils covered" figure is gone with the other administrative counts.

### Kiswahili of Tanzanian disaster management: "kuathirika", not "mfiduo"; no tsunami inland (13 October 2026)

- "Mfiduo" (exposure) is replaced throughout the Kiswahili texts by the terms the Risk Action Guide
  Book itself uses: the dimension is "Vitisho na Kuathirika", the datasets read "Kuathirika kwa
  mafuriko", "Kuathirika kwa matetemeko ya ardhi", the people indicator "Watu walio hatarini", and
  the lessons speak of "kuathirika" with its own agreements.
- The Guide Book's "Earthquake and tsunami" names a hazard only where the guide documents it; a
  council the model alone scores on the earthquake group (an inland one by Lake Victoria, such as
  Tarime) reads "Earthquake" / "Tetemeko la ardhi" on its profile, statements and risk card.

### More room for the live values on the home page (13 October 2026)

- The map sits in the middle of the hero row rather than at its top, and the relation chart reads
  stronger: black, bold title, note, axis labels and legend, thicker lines and a firmer baseline.
- The map reaches further right: it bleeds into the page margin by the padding plus half of what the
  viewport leaves beside the container, up to 3.25rem, and never past the screen's edge.
- The two charts under the headline have more horizontal space: a wider charts column (the map column
  is a little narrower, still reaching into the page margin), more air between the two charts, between
  each label and its value, and between the donut and its legend.

### Silent on the administrative counts, and a steady layout on phones (13 October 2026)

- The site no longer states how many councils and regions there are: the home page's lead, the note
  under "Risk and its parts", the relation chart's note and the explorer's level switch and notes name
  councils and regions without their counts, and the donut's centre shows the share of councils at high
  or very high risk instead of the total.
- On a phone the header no longer overflows the screen (every page was 7 px wider than the viewport
  since the text-size button joined the header): the button is hidden there and the text size is chosen
  in the phone menu instead. Checked on every main page at 390, 768 and 1366 px: no horizontal
  overflow, no page errors, at the normal and the largest text size.

### No duplicated figures on the profile (13 October 2026)

- The hero's score block no longer repeats the risk level as a badge with a "Know the risk" link under
  the class name (the Risk view's top row carries the badge and the messages), and the sticky section
  bar is shown only when a view has more than one section, so the Risk view no longer repeats the
  area's name and score under the view switch.

### The profile opens with the map, the hazards and the risk level in one row (11 October 2026)

- The Risk view of an area profile now starts with one row across the width: the locator map (zoomed
  on the area or the whole country, every other area one click from its profile), the hazards of the
  area, and the risk level with its two messages and the emergency number. The separate "Overview"
  section, which held the map below, is gone; the key findings stay at the head of the Analysis view.

### The home page shows the national risk picture as charts (11 October 2026)

- The four bare figures under the headline (national risk, councils assessed, people covered, councils at
  high risk) are replaced, in the same place, by three compact charts in the scales' own colours
  (`NationalCharts`): risk and its three parts on their class tracks beside the councils by risk class
  as a labelled donut (shares on the slices, the total in the middle, counts and shares beside it), and
  under the two, across the width, how the three parts relate to risk over the 195 councils ranked by
  risk (one line each, averaged over nine councils, labels kept readable on phones). The map sits a
  little further right, into the page margin, so the charts have the room. The distribution table of
  the highest-risk section is folded into the donut. The map caption names the model only, and the
  footer no longer links to the source code. The hero is tighter (a smaller headline, less space above
  and between the lead, the buttons and the charts), so the relation chart is in the first view on a
  1366 × 768 screen.

### The Data portal's action library covers every indicator group, with lead sectors (11 October 2026)

- The Committee desk's "Reducing risk" entry (PMO-DMD writes, the NDRRC reviews) now takes **any of the 32
  indicator groups, hazards included** (standing risk-reducing actions, never warning-level ones), and
  its **lead sectors** are chosen from the shared list of 21 sectors (`src/features/guide/sectors.ts`,
  names under `sectors` in common.json), the proposal for the group pre-selected. The record carries
  `leadSectors`; older entries with one authority still read.
- The detailed risk card shows the sectors PMO-DMD saved for a group before the proposal, and the
  profile's "Reducing risk over time" and the desk's history name them.

### Text size for the whole site, and panels one can widen to read (11 October 2026)

- **Text size** in the header beside the theme (`TextSizeToggle`): Normal, Large (112.5%), Larger
  (125%), Largest (137.5%) of the root font size, so every rem-based measure of the site follows. Saved
  with the other preferences (`textSize` in `inform.prefs`) and applied before first paint by
  `public/theme-init.js`, like the theme.
- **Wider explorer panels**: the left column (controls, or the area's map and trends) and the risk
  panel each have a handle on their inner edge (`PanelResizer`): drag it, or focus it and use the arrow
  keys (Home and End to the limits, Enter or a double click back to the default), and a button in the
  panel header that widens the panel to a reading width (520 / 560 px) or back. Widths persist per side
  (`panelWidths`); the map always keeps 360 px.
- The entry chunk's raw budget rose from 850 to 880 KB for these shell controls (interface code, not
  data; the entry is 850 KB raw, 191 KB gzip against the unchanged 200 KB gzip budget).

### A detailed risk card for sectors and decision-makers (11 October 2026)

- **`/area/:id/card/detailed`** (`docs/DETAILED_RISK_CARD.md`), beside the one-page card, Kiswahili first:
  the risk level and its two messages; a table of the risk and its three parts against the region and
  the country with the rank; **every indicator group scoring 5.0 or more in each dimension** with its
  score, the region's and the country's value, the measured values behind it (dataset, raw value, unit,
  score, detail, origin, period, institution), its **lead sectors** (`src/features/area/sectors.ts`, a
  proposal to confirm with PMO-DMD) and the national action library's entry when PMO-DMD has written one;
  all 32 groups in one table with their sources; the guide's statements with "what helps"; all nine DRR
  arrangements and committee criteria; the climate year by year; the events reported. Linked from the
  profile, the explorer panel and the one-page card. The evidence item moved to
  `src/features/explore/components/Evidence.tsx` so both the panel and the card render it.

### The panel's "Hazards here" becomes the highest-scoring groups of every dimension (11 October 2026)

- The risk communication panel no longer lists hazards only. Under "Highest-scoring indicator groups" it
  shows, for Hazard & Exposure, Vulnerability and Lack of Coping Capacity in turn, the dimension's score
  and its three highest groups (then "Show all"), each with its bar in the dimension's palette, its data
  note mark and its regional/national chip, and one click from its evidence in the panel and its lens on
  the map. The guide-reconciled hazard list with its human-hazards fold is gone from the panel (the
  guide's statements stay under "The nature of the area", and the profile keeps its hazard list); the
  panel and the column read one function, `dimensionGroups()` in `src/features/explore/lib/riskPanel.ts`.

### The area's risk profile beside the map (11 October 2026)

- The insight column's "Hazard profile" repeated the panel's "Hazards here". It is now a **risk profile**:
  the indicator groups of all three dimensions, each dimension with its score and class colour, its
  groups highest first (the five highest, then "Show all"), every group one click from its evidence in
  the panel and its lens on the map. Hazard groups at 0 are left out; vulnerability and coping groups
  show every value.

### Fewer words: the explorer, the profile and the risk card show the data, not its sources (11 October 2026)

- The citations and explanations are gone from the Risk explorer's panels: "From the Risk Action Guide
  Book", "The map is coloured by …", the hazard rows' basis lines ("Documented in the guide", "Scored by
  INFORM"), the reasons why a documented hazard has no score, the "In the Risk Action Guide Book" block of
  the evidence view, the statements' source note, the standing-risk disclaimer, the map hints, and the
  Benchmark/workbook notices under "How the score is built". The rows keep the name, the score, the bar
  and the regional/national chip; "INFORM risk here was 3.5 in the INFORM SADC 2024 workbook and is 3.2
  today (…)" is now "INFORM SADC 2024: 3.5 → now 3.2"; the climate summaries and the control panel's level
  and layer notes are one short line each. The profile's hazard list and the risk card lose the same
  basis lines, the band-rule notes and the disclaimer. The user's rule: the system states the figures;
  explanation belongs to the Methodology page and the thesis.

### Colours by scale, and the area's panels within reach (11 October 2026)

- **Risk is no longer green to red.** The five classes of overall INFORM risk run from pale yellow to deep
  red (`#fef08a`, `#facc15`, `#fb923c`, `#ea580c`, `#b91c1c`), nested in the three colour bands of risk
  communication: very low and low in the yellow band, medium and high in the orange band, very high in the
  red band (decision D17 of `docs/EXPLORER_RISK_PANEL_PLAN.md`). The map, the legends, the badges and the
  panel now speak one colour language, and no area reads as a "safe" green.
- **Each dimension has the workbook's own palette** (`CLASS_PALETTES` in `src/engine/risk/classes.ts`,
  read from the class formatting of the INFORM SADC 2024 sheet): hazard pale yellow to brown, vulnerability
  light to deep blue, lack of coping capacity light to deep green (the fourth hazard step darkened a little,
  `#D44E27` to `#C94A25`, so text on it reaches WCAG AA). `classify()` returns the colour of the score's
  own scale; indicator lenses, bars and matrices take the continuous ramp of their dimension
  (`rampColor(value, scale)`, `rampStops(scale)`, `metric.palette`), so a flood lens is read in the hazard
  colours and a poverty lens in blue. Threshold tables on the Methodology page, the Learn figures and the
  profile's methodology tab show a swatch per scale; the colour popover of the explorer names the palettes.
- **Readable text on every fill**: `readableOn()` chooses white or near-black by luminance, and a test
  checks every palette colour and the no-data grey at 4.5:1 or better.
- **190 is stated on its own.** The emergency number on profiles, the risk card and the guide texts no
  longer names the Fire and Rescue Force with it (PMO-DMD: 190 is not that force's line): "In an
  emergency call 190" ("Wakati wa dharura piga 190"), "call 190". The guide build strips the attribution wherever the guide book carries it.
- **The area's panels can be reached on every screen**: the map of the area is operable by keyboard (the
  region's councils are buttons; Enter or Space moves there, and focus shows the value card; the small
  country inset stays pointer-only), and below 1280 px and on phones the map and the trends open unfolded
  inside the risk panel instead of behind closed disclosures.

### DRR implementation and governance measured where they happen: the councils' own arrangements (11 October 2026)

- **Two Tanzanian institutional indicators** join the workbook's institutional groups
  (`src/engine/risk/institutional.ts`; migration `0016_institutional_indicators.sql`):
  - *DRM arrangements in place* (DRR implementation): the share of five arrangements a council has, an
    emergency preparedness and response plan (EPRP), its risk vulnerability and capacity assessment
    (RVCA), a trained emergency response team (ERT; regional), an emergency operations and communication
    centre (EOCC; regional or national) and DRR training of the committee. An arrangement not recorded
    counts as not in place, since the registers are PMO-DMD's own: the national value is high while they
    are incomplete and falls as more districts are recorded.
  - *Disaster management committee functioning* (Governance): the share of the assessed criteria met among
    three, the committee is active, it collaborates with stakeholders, and it is involved in DRR issues.
    The legal framework (the Disaster Management Act and Policy) is the same everywhere and is not scored;
    a council has a value only once a criterion is assessed.
  Both decrease risk (all in place scores 0 lack of coping) on a fixed 0 to 100 scale. A council's
  arrangements lower its lack of coping capacity, its region's through the mean of its councils, and the
  country's through the mean of all 195: a region whose councils all have plans falls by the full amount,
  one with three of nine by a third.
- **The published lists seed the values** (`data-source/drr_status.csv`, carried into the Benchmark 2026
  by `scripts/build-benchmark.py` and into the profiles by `src/data/tanzania-councils-drr.json`): the
  PMO-DMD lists of June 2026 (19 districts with plans, 10 with anticipatory-action plans, four regions with
  centres and trained teams), the launches and trainings published in 2023-2026 (Kinondoni's plan and
  assessment 2023; Mwanza's centre and team 5 June 2026; Mbeya's team May 2026; Arusha and Dodoma under
  the 2026 roll-out), Kilosa's plan of 2015, and PMO-DMD's communication of 10 October 2026 (Pwani's
  centre; trained teams in the bimodal regions; plans in all five Dar es Salaam municipalities; stakeholder
  collaboration in the big cities; involvement in DRR issues in Arusha, Mwanza and Pwani), each marked to
  be confirmed through the Data portal. 26 districts carry a plan so far against about 40 PMO-DMD reports.
- **The committees record the rest.** The Committee desk's DRR record gains DRR training and the three
  committee criteria (a district committee records its plan, assessment, anticipatory action, training and
  its functioning; a regional committee its centre, team, training and functioning, which speak for its
  councils where a district is silent). An approved record supersedes the published value for its councils
  on the record's date, as an institution's update. The profile's capacity section shows all nine.
- **Effect**: national INFORM Risk stays 3.9; the DRR implementation group rises from 6.5 to 6.8 and the
  governance group falls from 4.5 to 4.1 nationally; 37 councils high, 144 medium, 14 low (38, 140, 17
  before). On the councils the two coping categories no longer move against each other (r = 0.01 against
  -0.38 without the benchmark): the cities and the prepared districts have both infrastructure and
  institutions. The Benchmark 2026 now holds 2,815 values in 18 datasets; 10 activations.

### Hazardous material, road crashes in the cities, internal violence withheld (10 October 2026)

- **Hazardous material has data.** The template's hazardous-material indicator is activated with the
  density of sites that produce, store, process or dispose of hazardous materials, per 100 km² of land
  (`scripts/benchmark/osm_hazmat.py`, `nemc_certificates.py`, `hazmat_sites.py`): 10,341 sites from
  OpenStreetMap (1,368 fuel stations, 445 fuel tanks and tank farms, 157 LPG shops, 16 thermal power
  plants, mines, landfills, wastewater plants, factories and industrial areas), the 2022 census mapping
  (small-scale industries and 726 hospitals, 40 of them referral hospitals) and the NEMC environmental
  certificates of July to September 2026 (490 certificates read from NEMC's monthly lists and placed in
  their council from the ward; 210 are hazardous projects: fuel stations and depots, carbon-in-pulp gold
  plants and tailings facilities, chemical, plastics, paint and fertiliser factories, steel and lime
  plants). The cities and their industrial towns lead; the gold-mining councils follow. NEMC's Mwanza
  water-quality roadmap (2023: 51 industries, the Nyashishi river carrying industrial effluent) is cited
  as corroboration; the Mara River summary (2022) traced that river's blackening to decaying wetland
  plants, not to hazardous material.
- **Vehicle accidents where the crashes are: the big cities.** The indicator is now the density of
  recorded road crashes per 100 km² (police statistics 2024-2025, each police region's crashes shared
  among its councils by population; `scripts/benchmark/road_crashes.py`). Zanzibar Town, the Dar es
  Salaam municipalities, Moshi, Mbeya, Mwanza and Arusha lead; the death rate per 100,000 it replaces had
  put the rural highway regions first and Dar es Salaam among the lowest. Police tables count serious
  crashes only since 2020; the 2014-2019 records, when Dar es Salaam logged more than half of all crashes,
  and a 13-facility study (65.7% of injured patients hurt in urban settings) are cited in the method.
- **Internal violence withheld by programme decision** (data note DN-12): the ACLED counts of political
  violence by region are too complicated to read and communicate as a council's hazard. The live model
  carries no internal violence; the workbook keeps its values. Notes gain a `decision` status, withheld
  apart from the validation findings, and a note can withhold several indicators.
- **Population file corrected**: the benchmark's council populations had given 29 councils a neighbour's
  figure (Kondoa Town 244,854 instead of 80,443); they are now the 2022 census figures the model uses.
- **Effect**: national INFORM Risk 3.9 (Hazard 2.4, Vulnerability 4.2, Lack of coping 5.8); 38 councils
  high, 140 medium, 17 low; 30 of the 32 groups carry data (zoonoses empty, internal violence withheld).
  Migration `0015_benchmark_hazmat_crashes.sql` gives the portal the two indicators' names and units; the
  collection tools carry 61 indicator columns.

### The area beside the map, and statements generated from its data (10 October 2026)

- **Three panels around the map.** Selecting an area on a wide screen (1280 px and up) turns the left
  column into the area's own: a map of the area to move around from (its region's councils one click away,
  the country with the region marked) and trends and charts (the risk and its parts against the region and
  Tanzania, the hazard profile, heatwave days and rainfall year by year, and how the risk changed since the
  INFORM SADC 2024 workbook). The risk communication panel stays on the right; the controls open as a
  drawer. Narrower screens and phones fold the same panels inside the risk panel.
- **What the data say about an area.** The risk panel and the risk card open with sentences generated from
  the area's own data: its risk and rank among councils and within its region, the part of the score that
  weighs most, the hazards that score highest (with the guide's names), road crashes and hazardous-material
  sites where they score high, vulnerability and coping gaps with their drivers, and its people
  (`src/features/guide/statements.ts`). Nothing is typed in; no warning level is named.
- **The risk card** gains those statements and a locator map.
- **Climate series per area** (`src/data/tanzania-council-trends.json`, `scripts/build-trends.py`): heatwave
  days a year 1991-2024 (the Benchmark 2026 definition, `scripts/benchmark/heatwave_annual.py`) and annual
  rainfall 1981-2025 (CHIRPS, `scripts/benchmark/gee_rain_annual.py`), for the councils, the regions and
  Tanzania; loaded only when the trends are shown.

### The risk communication panel in the Risk explorer (10 October 2026)

- **One panel for an area and its hazards** (`src/features/explore/components/RiskPanel.tsx`, logic in
  `lib/riskPanel.ts`; plan in `docs/EXPLORER_RISK_PANEL_PLAN.md`). Selecting an area opens it beside the
  map: where the area sits (Tanzania › region › council, each a link), its risk level on the colour band
  with the two messages (for those who live or work there, for those who plan, build, invest or settle
  there), its hazards, warnings in force, the guide's statements about the place and, folded, how the
  score is built. No warning level is named anywhere.
- **Hazards with their basis.** Natural hazards ranked by score, each saying whether the Risk Action Guide
  Book documents it, INFORM scores it, or both; where the guide documents a hazard INFORM does not score
  here, the reason is given (INFORM counts tropical cyclones only; the coastal indicator covers the ocean
  shore, not lake waves; no data yet; one regional value at its lowest; no exposed population in the
  river-flood model; rainfall is carried by floods and landslides; the global map places the area below
  its threshold). A "Regional value" or "National value" mark shows coarse data. Human hazards (conflict,
  vehicle accidents) sit in their own fold, read as conditions of the wider area.
- **A hazard's evidence.** Choosing a hazard colours the map by it and shows, for the area: its score
  against its region and the country, its rank among councils and within its region, the measured values
  behind it with unit, period, source, institution and origin (INFORM SADC 2024 workbook, Benchmark 2026,
  the Data portal, the Advancement layer), short details where the source has them (the storms behind a
  cyclone swath, the retreating shoreline segments, the police region, the IPC district and phase),
  withheld values with their data note, what the guide documents, and warnings in force for that hazard.
  Regions and the country show the spread over their members instead.
- **The country as an area.** The breadcrumb's root selects Tanzania: the national aggregate, its hazards
  (documented across every council's guide), the councils by risk class, and the map back on the whole
  country.
- **Room for the map.** On desktops the panel docks as a 400 px column and the controls fold to a rail
  (the map keeps 984 px at 1440, 824 px at 1280 and 568 px at 1024, where the old card covered 31 to 50%
  of it); the rail opens the controls beside the map from 1280 px and as a drawer over it below. The
  table view keeps the panel beside the rows; phones keep the bottom sheet, whose peek shows the chosen
  hazard's score.
- **Keyboard and screen readers.** Selecting an area moves focus to the panel's heading (a link that
  opens with an area does not); Escape steps back from a hazard to the area and then closes, returning
  focus to where the selection started or to the place search; a skip link reaches the panel; hazard rows
  are buttons whose names carry the score and the basis. The accessibility audit covers the three panel
  states; the data-note mark is now a labelled image.
- **Repairs found in the browser check**: the "Hide the controls" button sat under the panel header and
  could not be clicked; the map centred a selection as if a card still covered its right side; expanding
  the phone sheet could suspend the page on loading texts and break the map (texts now load inside the
  panel); the phone sheet now starts from its top for each area and hazard.
- **Benchmark detail codes**: `scripts/build-benchmark.py` stores the short per-value details the evidence
  shows (`details` in the benchmark file; `RawValue.detail`, `LeafInput.detail`).

### Repairs before the risk communication panel (10 October 2026)

- **"Updated" means updated again.** Every approved value now carries its origin (`src/engine/risk/stamps.ts`):
  an institution's update through the portal, a Benchmark 2026 value (stamped with its release), or an
  Advancement value. The "Updated" badge, the update counts, the edited marks on the map and in the
  indicator table, and the model's update count read portal updates only; the Benchmark 2026 shows as its
  own lineage line ("Benchmark 2026 · NEMC · 10 Oct 2026", and a notice on the profile and the explorer
  card), as its own column on the Data control screen and as its own lineage in CSV exports.
- **Lighter first download.** The Benchmark 2026 file is stored compactly (dataset metadata once, values as
  plain maps): 44 KB instead of 1.1 MB. The application's entry file fell from 1.69 MB to 0.78 MB;
  `npm run check:size` (a CI step after the build) fails when it grows past its budget.
- **One hazard list.** The explorer card lists the same reconciled hazards as the profile, the model's
  scores included: Kibiti now reads "Strong winds · Heavy rainfall · Floods · Large waves" (it had omitted
  its cyclone exposure of 10.0).
- **Planning messages that read the hazard profile.** Where overall risk is low or very low but a natural
  hazard scores 8 or more (8 of the 29 low-risk councils, e.g. earthquake 10 in Moshi Municipal and the
  Singida councils), the planning message names that hazard instead of "few hazard constraints" (wording
  to agree with PMO-DMD, decision D19).

### Benchmark 2026: data for almost every indicator, and the tools that carry it (10 October 2026)

- **Benchmark 2026** (`src/data/tanzania-benchmark-2026.json`, built by `scripts/build-benchmark.py` from
  `data-source/benchmark_2026/`): 2,380 institutional values prepared from public, citable datasets for the
  indicators the workbook leaves empty or carries with values that failed validation. The engine applies
  them as approved institutional values of 10 October 2026 (`src/engine/risk/benchmark.ts`): every value
  shows its lineage, lifts the hold on the workbook value it replaces, and is superseded by a newer approved
  value from the portal. The workbook itself is unchanged (`buildModel({}, { workbookOnly: true })`).
  - Coastal hazards for the whole coast: Digital Earth Africa shoreline change (2000-2023) joined to the 30
    coastal councils (retreat 0.2 to 1.2 m/yr; inland 0), and the low-elevation coastal zone share from the
    Copernicus DEM as the activated sea-level-rise indicator.
  - Storms and cyclones: the share of each council inside the gale-force swath of every tropical cyclone
    since 1980 (IBTrACS): Mafia, Kibiti, Mkuranga, the Mtwara councils and Kigamboni fully exposed.
  - Heatwave days (ERA5-Land, runs of 3 days above the local 90th percentile, 2015-2024): the islands and
    the coast highest (Micheweni 56 days a year, Mafia 54; Tanga 34; Lindi 19; Tabora 17).
  - Lightning stroke density (WWLLN 2010-2021): Kigoma, Kagera, Kyela, Ruvuma and the western highlands
    highest; the dry north lowest.
  - Road traffic deaths per 100,000 (police statistics 2024-2025, by police region).
  - Food security: the IPC analysis of April 2026 (Phase 2 or worse share in the 30 analysed districts;
    the IPC area phase for every council).
  - 2022 census by council: households lit by electricity (Dodoma City 85%, not 100%), mobile phone
    ownership, adult literacy, female-headed households, disability prevalence.
  - Displacement: IDMC's end-2024 disaster IDP stock allocated to regions by the location of the 2023-2025
    displacement events (Manyara now carries the Hanang landslide).
  - Ukerewe's landslide exposure 0 (the global map has no valid cell on the island).
- **Rechecks that end as explanations**: the Lake zone's drought frequency (FAO's own regional series
  corroborates it) and Kagera's earthquake index (recomputed from the GEM map: the share of area at 0.12 g
  or more, r = 0.96) are retained; Dar es Salaam's drought stays withheld as not applicable to a city.
- **Live model**: national INFORM Risk 3.8 (Hazard 2.3, Vulnerability 4.2, Lack of coping 5.8); 124
  councils medium, 42 high, 29 low; 30 of the 32 indicator groups carry data (zoonoses and hazardous
  material remain empty).
- **Seven template indicators activated** with a Tanzanian definition (heatwave, lightning, vehicle
  accidents, sea-level rise, IPC phase, female-headed households, disability), as the workbook's own
  Metadata sheet defines every indicator in use; `ACTIVE_SPECS` in `standardise.ts`; migration
  `0014_benchmark_activations.sql` flags them core in the portal.
- **Tools**: the collection tool carries the activated indicators (60 columns); the new
  `INFORM_TZ_Collection_Benchmark_2026.xlsx` is the tool with the benchmark values filled in (green cells)
  and a sheet listing every dataset. The data portal imports a filled tool directly (xlsx, read without a
  spreadsheet library): on the institution's Indicators tab for its own indicators and on the Office's
  Data control tab for all of them.
- **Methodology page**: the sources register shows the Benchmark 2026 dataset behind each group; the data
  notes record each resolution. Documentation: `docs/BENCHMARK_2026.md`.
- **No level wording anywhere** (second instruction of 10 October 2026): a committee's warning in force shows
  its colour, hazard, areas, validity and issuer on the profile and the risk card; the committee desk chooses
  a level as "Level 1 (yellow)" to "Level 3 (red)"; the words Advisory, Warning and Major warning and their
  calls to action are gone from the site's texts. The level stays in the record and sets the colour only.
- **Data notes**: the hold is counted as it stands live (quarantined and not replaced); the Methodology page
  and the Data control tab state how many values the Benchmark 2026 replaced and how many remain withheld.
- **Header**: Risk explorer and Data portal are the two links; Insights, Crisis severity, Learn and
  Methodology sit in an "Others" menu (the phone menu and the footer keep every section).
- **No typed scores**: the "Enter scores" and "Bulk paste" tabs, which let a reviewer type a 0-10 score for
  an indicator group, are removed. Every value enters as a measured value in its own unit (the entry sheet,
  a CSV template or a filled collection tool) and the engine computes the 0-10 score, the group, the
  dimensions and the risk with the workbook's method. Pending direct submissions already in the queue can
  still be reviewed.

### The Office's data control screen, a leaner methodology, wider lessons (10 October 2026)

- **Data control** (administrators and PMO-DMD, Data portal): one screen with the institutions and the
  indicators each serves, their open and overdue requests and submissions waiting for review; one action
  to assign every unassigned indicator to its usual source and one to request updates from an institution
  for all its indicators; for each of the 32 indicator groups, how many councils carry the workbook's value,
  an approved institutional value, a value withheld after validation, or none; a CSV of the distribution.
- **Methodology page reduced to operational documentation**: overview, structure, calculation with the live
  worked example, geometric mean, classification, administrative levels, severity method, sources register,
  data notes and limitations, references. The Advancement baskets, the quality checks, the corrections and
  the sensitivity tables are reported in `docs/assessment` and the thesis, not on the site, so the thesis is
  not a copy of the site. Old section links return to the summary.
- **Learn**: lessons use 58rem of width; the course progress shows one segment per lesson with a larger
  count on the overview and in the lesson sidebar.

### Validation quarantine: workbook values that fail validation are withheld live (10 October 2026)

Decision of the programme: what is not right is not shown live. The recheck below found workbook values
that contradict documented events, the workbook's other indicators or the indicator's own definition.
The workbook is still reproduced exactly and proven by the tests, but the live model withholds those
values, as INFORM's guidance treats data that fails validation: the group is treated as missing for the
unit (a group with other indicators is recomputed from them) until an institution supplies the value
through the Data portal or the workbook is corrected, and every place that shows the value says so.

- Withheld: coastal erosion (all 170 units: the indicator is degenerate and its only non-zero rows are
  landlocked), food security (all 170: values that cannot be percentages and zeros where no IPC
  analysis was run), Dar es Salaam's drought (3 units), the semi-arid Lake zone's drought minimum (24),
  Kagera's earthquake exposure (8), Ukerewe's landslide exposure (1), Dodoma's electricity access (7;
  the communication group keeps its cellphone indicator) and the displaced-people rows of Kaskazini
  Unguja and Manyara (8): 391 values over the 170 units.
- Effect: the national aggregate is 4.1 (Hazard & Exposure 2.6, Vulnerability 4.2, Lack of Coping
  Capacity 6.2) on the live model against 3.8 on the workbook exactly, because the withheld groups
  carried zeros that pulled every mean down; 182 of 195 councils change risk and 62 change class
  (live: 74 High, 105 Medium, 16 Low). The register and the queries to the partners carry the detail.
- `buildModel({}, { workbookOnly: true })` builds the workbook exactly for the verification tests;
  `data-source/CHECKSUMS.sha256` and `docs/HAZARD_REPRODUCTION.md` make every input reproducible.

### Risk communication, not warnings (10 October 2026)

Decision of the programme: the site communicates standing risk for people to live and plan with, not
warnings. This replaces the "Alert categories" and the "What to do" guidance below.

- **The risk level on its colour band.** Every area is named by its INFORM risk class ("High risk") on
  one of three colours: very low and low yellow, medium and high orange, very high red. Shown under the
  profile's score (a link to "Know the risk"), at the top of that section, in the explorer's area panel
  and on the risk card. No warning level (Advisory, Warning, Major warning) is derived from the class or
  shown with it; those words appear only on warnings the committees publish, while in force.
- **"Know the risk" replaces "What to do"** on every profile: what the level means for people who live
  and work in the area and for those who plan, build, invest or settle there (for example, at very high
  risk: avoid adding residents or business activities in the exposed zones); the hazards of the area;
  what the Risk Action Guide Book records about the nature of the area, one click away. The "what
  helps" advice, the warning-level tables, the text messages and the incident guide are no longer shown
  on profiles or the risk card; the PMO-DMD action library stays, folded.
- **One emergency number: 190**. 114 is gone from the profiles, the risk card and every guide text.

### Indicator integrity recheck (10 October 2026)

Every value of every indicator rechecked against documented events, the other indicators of the
workbook and each indicator's own definition (`node scripts/integrity-recheck.mjs`, register in
`docs/assessment/INFORM_TZ_Indicator_Integrity_core-2026.10.md`).

- **Data notes on Core values.** Eleven workbook values contradict what is known: Dar es Salaam's
  drought frequency (the highest in Tanzania), Kagera's earthquake exposure (0, despite the 2016
  Bukoba earthquake), Ukerewe's landslide exposure (the national maximum, on a flat island), Dodoma's
  electricity access (100%), the displaced-people and food-security rows, the coastal-erosion rows
  (non-zero only in landlocked Dodoma) and the health-facility range (0 to 0), with two explanations
  (the earthquake index at its ceiling across the rift; river floods only for Kinondoni). The Core
  keeps every workbook value; each carries its note where it is shown (profile table and drivers,
  explorer ranking, key findings, CSV exports) and the queries go to INFORM (JRC) and SADC
  (`src/data/inform-data-notes.json`).
- **Advancement layer corrected.** The census "health facilities" layer is mostly drug outlets and
  pharmacies: facility densities are recomputed on the 195 council polygons counting dispensaries,
  health centres and hospitals only (and schools from pre-primary to secondary), which also gives the
  32 urban units values and fixes the profile's facility counts. A felt-intensity member joins the
  earthquake basket (30 sub-indicators, 18 filled), so Kagera's 2016 earthquake counts. Six member
  reference ranges are fitted to the council spans. The ADVANCED tool is regenerated and re-verified.

### Integrity assessment corrections (October 2026)

The integrity assessment of 9 October 2026 (`docs/assessment/`) found that the shipped dataset had
departed from the INFORM SADC 2024 workbook in 165 of 170 units and that the "official national INFORM
figure (4.1)" quoted below and in earlier releases was the Kondoa district row. Corrections:

- **The Core is the workbook.** `scripts/build-core.mjs` copies every scoring value of the 170 units from
  the workbook; no refill, overlay, hand grade, computed index or precautionary ("raise-only") floor
  touches it. The scripts that applied them are retired to `scripts/legacy/`.
- **The national figure is the INFORM aggregate of the 195 councils** (indicator means, category
  means, scaled geometric mean, cube root), built live by the engine and labelled as such. On the
  Core it is 3.8 (Hazard & Exposure 2.4, Vulnerability 3.8, Lack of Coping Capacity 6.2) on the workbook
  exactly, 4.1 on the live model after the validation quarantine of 10 October 2026 (above). INFORM
  publishes no national figure for a subnational model, so none is "official".
- **Every Tanzanian addition is an Advancement layer**, computed from its own documented inputs
  (`src/data/tanzania-advanced-inputs.json`) and shown on each profile beside the Core, never in its
  place. The composite drought index was withdrawn (it scored wet highland councils 10); its members
  enter separately and the growing-season member is withheld.
- **Sources are the workbook's own** (Metadata sheet) for every Core value; earthquake is GEM, not USGS.
- **Documents corrected:** the PMO innovation-challenge proposal, both presentations, the hazard
  advancement paper, the methodology manual, the worked example (regenerated from the engine), the
  local data integration plan, the indicator source register and the update/delete procedures. Where
  a document describes the retired pipeline it is marked as superseded with a pointer to the assessment.
- **Method variants are labelled sensitivities, never Core values** (`src/engine/risk/variants.ts`,
  decision D11 pending): the Methodology page shows what INFORM Global's hazard rules would give
  (inverted geometric mean of the natural hazards: +0.5 on the hazard dimension and 45 of 170 units in
  another risk class; the conflict maximum as well: −0.2 and 51 changes), Tanzanian class thresholds by
  natural breaks for risk, the dimensions and the categories beside the SADC thresholds, and the
  guidance's coherence check live over the councils (`src/engine/risk/coherence.ts`; the report per
  release is `docs/assessment/INFORM_TZ_Coherence_<release>.md`). Every council profile's analysis view
  carries a lack-of-reliability score after INFORM's index (missing groups, age of the data, inherited
  or shared values). The release and validation cycle is written in `docs/RELEASES.md` and the boundary
  procedure in `data-source/BOUNDARIES.md` with `scripts/check-boundaries.py` (decision D12 pending).

### Alert categories from the risk level

*Superseded on 10 October 2026 by "Risk communication, not warnings" above: no warning level is shown.*

- Every area shows its alert category, set automatically by its assessed INFORM risk level: very low
  and low risk are an **Advisory** (yellow), medium a **Warning** (orange), high and very high a
  **Major warning** (red).
- On a profile: a badge under the risk score (a link to "What to do"), and a block at the top of "What
  to do" with the rule behind it; the warning levels there open at the area's own category. In the
  explorer: a badge beside the risk class in the area panel, and a line in its "What to do".
- The alert colours are the standard warning yellow, orange and red, with legible text on each. The
  earlier level dots borrowed the INFORM class colours, whose pale yellow barely showed on a light page.
- The page says the category follows the risk level, not a forecast, and that official TMA warnings
  come first.

### What to do: the Risk Action Guide Book

*Superseded on 10 October 2026 by "Risk communication, not warnings" above: the section is now "Know the risk".*

Every area now says what people can do about its hazards, from the Risk Action Guide Book (based on the
National Disaster Management Strategy 2022 to 2027 and the National Disaster Preparedness and Response
Plan 2022), in English and Kiswahili as the guide publishes it.

- **A "What to do" section on every area profile**, second after the overview:
  - the emergency numbers (190 Emergency, 114 Fire and Rescue) as tap-to-call links;
  - **Know your risk**: where the danger lies in the council and what helps, as the guide states it (a
    region or source unit lists each of its councils, with links to their profiles);
  - **When a warning is issued**: the hazards the guide documents for the area first and any other
    hazard one step away; for each of the three alert levels (Advisory: be prepared, Warning: take
    action, Major warning: take action immediately), what people may see and what to do. Tabora's
    councils lead with their own council plan;
  - **Incidents and accidents**: the guide's rapid-response actions, folded until opened (all open when
    printing).
- **In the risk explorer**, the area panel shows the local advice and the main hazards, with a link
  straight to the full guidance on the profile (`/area/<id>#actions`).
- All 195 councils are covered (councils the guide names by an older name, such as Ilala or Kilombero,
  are matched to their current names). The guide's per-council alert tables are not shown: their
  generated sentences repeat one flood template and differ between English and Kiswahili, so the
  national hazard tables are used, except for Tabora's hand-written council plans.
- The guidance loads on demand (one small file per region and per hazard); the first page load is
  unchanged. Data: `python scripts/build-action-guide.py` from `data-source/RISK_ACTION_GUIDE_BOOK_0222.docx`.

### Explorer: indicator groups under their dimension

- Choosing Hazard & Exposure, Vulnerability or Lack of Coping Capacity lists that dimension's
  indicator groups right under it, by category, each with its score for the selected area. Choosing a
  group colours the map by it and keeps the list open, so moving to the next group is one click. On
  phones the groups are a second row of chips under the lens tabs. This replaces the separate
  indicator search.

### Institutional data workflow

Data entry now runs through the institutions that own the data, in the figures they already publish.

- **Every indicator has a responsible institution.** Reviewers assign each of the 53 workbook
  indicators in the INFORM score and the 25 advanced sub-indicators to a Tanzanian institution or a global source, in
  bulk or with suggested owners, and send update or validation requests with a due date and a message.
- **Institutions enter measured figures, not scores.** An officer sees their institution's indicators
  and open requests, and enters figures in natural units for the whole country, any region and any
  council, typed or pasted from a spreadsheet (names matched, header rows skipped, "n/a" read as no
  data). A live 0–10 preview and range checks catch unit mistakes; the dataset is required. They can
  also confirm that the current values still hold.
- **Data at any level.** For each council the most local figure applies (council, else its region, else
  the country, else the INFORM baseline) and only indicator groups with a new figure are recomputed,
  with the workbook's own standardisation and weights.
- **Review with consequences in view.** Reviewers see today's value and where it comes from, the
  proposal, the 0–10 scores and the councils whose scores would move, then approve or reject. Approved
  figures can be reverted one area at a time.
- **Sources everywhere.** Tables say whether each source is a Tanzanian institution or a global dataset,
  and area profiles list the figures behind a recomputed score with the level they were recorded at.
- **People.** Administrators set each person's role and institution in the portal.
- Database: migrations `0004_data_workflow.sql` and `0005_one_live_request.sql` (row-level security;
  every change goes through functions that re-check the caller's role and institution).

### Other changes

- No em dashes anywhere in the site, the documents or the code comments; missing values read "n/a".
- Night mode: text on green and red buttons (Approve, Revert) meets contrast requirements.
- The Data portal's tab row no longer shows a stray scrollbar on Windows.
- `npm run dev:demo` runs the browser-only demo alongside a configured backend.

## 2.0.0: Advanced rebuild (2026-09)

A ground-up rebuild of the web app on a typed, tested foundation, with a new design, English/Kiswahili,
day/night themes, a shared data backend and several methodological corrections.

### Methodology corrections

- **Per-dimension class thresholds.** Hazard, Vulnerability and Lack of Coping Capacity are classified
  with their own thresholds from the workbook's `Thresholds` sheet (e.g. Hazard 1.3 / 2.0 / 3.3 / 4.7).
  Previously every dimension was coloured with the risk thresholds, which misclassified most of them.
- **Edits now propagate everywhere.** Council risk is computed live as ∛(H × V × LCC) (it equals the
  stored value for all 195 councils when nothing is edited), so approved data changes reach the council
  map, regions and every sibling council that shares a source unit. Previously council hazard and risk
  were frozen and ignored edits.
- **Regions aggregate from councils** with the INFORM method (indicator means → categories → scaled
  geometric mean → cube root). Relative to the previous source-unit aggregation, 8 of 31 regions move
  by ±0.1 (Morogoro, Pwani, Mtwara, Iringa, Rukwa, Njombe +0.1; Mbeya, Shinyanga −0.1); none by more. Dar es Salaam's council-to-region name join is fixed.
- **Dimension totals can no longer be overridden** by hand; they are always derived from indicators.
- **Crisis severity follows the official INFORM Severity Index method** (JRC/ACAPS 2020): Severity =
  70% × G(Impact ⅓, Conditions ⅔) + 30% × Complexity, with INFORM's inverted weighted geometric
  aggregation, the official category structure, categories by ROUNDUP (Very low, Low, **Medium**, High,
  Very high) and a separate reliability index. The previous calculator used a plain average and a
  non-standard class scale ("Extreme", no "Medium").
- **Single source of truth for numbers.** The course, home page and profiles read the model; the old
  hard-coded national score (4.2) and course-specific class bands are gone. The national value is the
  official INFORM figure (4.1). *Corrected October 2026: that figure was the Kondoa district row; the
  national value is now the INFORM aggregate of the councils (see "Integrity assessment corrections").*
- Indicator lenses use an absolute 0–10 colour ramp instead of relative quintiles, so maps are
  comparable across indicators.

### Data corrections

- **Census population for three councils.** The climate pipeline's name matcher missed Ilala
  (Dar es Salaam City), Mwanza City and Busokelo and fell back to area-apportioned estimates
  (e.g. Mwanza City 58,096 instead of 594,834). All 195 councils now carry the NBS 2022 figures
  (total 61,741,120 = the official PHC total) and exposure is recomputed
  (`scripts/fix-council-population.py`). Exposure index: Mwanza City 5.3 → 8.2, Dar es Salaam City
  8.2 → 8.6, Busokelo 3.3 → 4.3; no risk class changed.
- **Region facilities** no longer double-count districts that were split into several councils.
- Removed `subnational.adm1`, a stale, unused per-region copy of the district data (every record
  differed from the canonical `adm2`).
- Documented a drought-season artefact in bimodal highlands (Lushoto = 10.0).

### Platform

- TypeScript (strict), Tailwind CSS v4, Radix UI, React Router 7, TanStack Query, Recharts, Motion.
- Engine ported to TypeScript with all golden tests (8,664/8,664 standardised workbook values; full
  raw → risk pipeline for all 170 units; workbook cell parity) plus model, severity and UI tests.
- Data layer with two backends: browser-local demo mode (clearly labelled; migrates old edits) and
  Supabase (accounts, roles, approval queue, audit log, row-level security, server-side approval).
- Installable, offline-capable app (PWA): the app and data work without a connection once visited.
- Code-split routes and vendor chunks; translations loaded per page and language; map boundaries
  fetched per level; Supabase SDK loaded only when configured. First load: 134 KB gzip of app code
  (the old app shipped a single 2.1 MB bundle).
- Accessibility: axe-core WCAG 2.1 AA audit of every page in both themes: no serious or critical
  violations; keyboard navigation; labelled controls; no horizontal overflow at 360 px.
- Security headers (CSP, HSTS, frame denial), CI quality gate (typecheck, lint, tests, build);
  Vercel is the single host. Obsolete GitHub Pages / Netlify / self-host configs archived.

### New experience

- Home, Risk explorer (shareable URL state, compare, ranking table, CSV), Area profiles (print-ready),
  Insights (national analytics with PNG/CSV export), Crisis severity (council picker using census
  population and area), Learn (7 lessons, quizzes, progress saved), Methodology (live worked example,
  source register, limitations), Data portal (scores, measured values, bulk paste, review, audit).
- Full English and Kiswahili; day, night and system themes; ⌘K search for any council or region.

### Housekeeping

- Previous UI archived in `_archive/lean-v1`; stale 2024 specification documents and deployment
  guides archived in `_archive/docs-v1` and `_archive/ops-v1`.
