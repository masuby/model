# Risk explorer: the risk communication panel, assessed and planned

Plan and assessment of 10 October 2026. The plan was written after reading the Tanzania Climate
Vulnerability Mapping Platform (TCVMP, `/home/kaijage/model/tcvmp`, G3W-Suite with a custom frontend by
Masae Analytics for PMO and GCA). The assessment then checked the TCVMP as it runs
(https://tcvmp.pmo.go.tz), our explorer as it behaves, and every element of the proposed panel against the
data the model actually carries. Where the assessment contradicted the first plan, the design below is
corrected and the correction is marked. Nothing in this document changes the INFORM Core.

## 1. The TCVMP as it runs (checked on tcvmp.pmo.go.tz)

| Observation | Measured |
|---|---|
| Layout at 1440 px | header 80 px; left panel 300 px; map 810 px; right panel 330 px. At 1280 px the map is 650 px. |
| Click on a region (Morogoro, cyclone winds; Dodoma, flood with an overlay on) | The right panel shows the region's name, an empty chart ("No monthly data available"), the indicator's description and use case, and the legend. The area's value appears only in a small map control ("Tropical cyclone winds: 2.004 Index / unitless"). No class, no meaning, no breadcrumb, no facility counts: the region card and breadcrumb of the newer code are not deployed. |
| Legend | 1.00 to 6.00 (cyclone winds) and 1.00 to 7.00 (flood) while the text says the classes run 1 to 9; typos in the use-case text. |
| Basemap | every tile carries an "API KEY REQUIRED" watermark (the Carto key is missing). |
| Phone (390 px) | the two panels take the full width, the map is 0 px wide and the page scrolls sideways to 630 px: not usable on a phone. |
| First visit | a guided tour opens over the page on every load. |
| In the newer code | breadcrumb, region card with counts per overlay, point query within a radius, a 2 to 6 panel comparison grid, spatial analysis, PDF and DOCX reports. |

What to take: one context panel whose content follows the selection, the indicator's explanation and legend
when nothing is selected, a breadcrumb, counts of what sits in the area, exports from the panel.
What to avoid: a click that returns a value without meaning, panels that squeeze the map away, a layout
with no phone form, legends that disagree with the text, a tour that interrupts every visit.

## 2. Our explorer as it behaves (measured on the local build)

| Finding | Measured |
|---|---|
| The floating area card covers the map | 360 px card over the map stage: about 31% of the stage at 1440 px, 36% at 1280 px, 50% at 1024 px. Its content is 1,606 px tall in a 747 px card (two scroll lengths). |
| A hazard lens barely changes the card | With the storms lens open on Kibiti the card adds one line ("Storms & cyclones 10.0, #1") and otherwise tells the whole-risk story. |
| Two hazard lists for one council | The card's "Main hazards here" shows the Guide Book's documented hazards only (first four): Kibiti reads "Floods · Large waves · Heavy rainfall · Public health" while its top driver is storms and cyclones at 10.0, and the band message above says "expect the hazards listed below". The profile uses the reconciled list (documented and modelled), so the card and the profile disagree. |
| "Updated" everywhere (regression of the Benchmark 2026 work) | The "Updated" badge and "Includes N approved data updates" now show on all 195 councils and 31 regions: the benchmark stamps count as updates although no institution has submitted anything. |
| No national panel | Selecting Tanzania opens no card. |
| Keyboard | After choosing an area with the search, focus drops to the page body; Escape does not close the card; from the top of the page it takes more than 120 Tab presses to reach the card. axe reports no violations at 1440 and 390 px (axe does not test focus management). |
| Phone | The bottom sheet works, nothing scrolls sideways; the peek shows the name, class, badges and actions. |
| Weight (regression of the Benchmark 2026 work) | The benchmark file sits in the entry chunk: the chunk is 1.69 MB raw (179 KB gzip), of which the benchmark is about 1.1 MB raw (23 KB gzip). A compact form of the same data is 43 KB raw (12.6 KB gzip). The raw size is parse time on low-end phones. |

## 3. Will the data carry the panel? Element by element

| Element of the panel | Data in the model | Finding |
|---|---|---|
| Risk level and the two band messages | yes | The low band's planning message ("New settlement, business and investment face few hazard constraints here") is false for 8 of the 29 councils with low or very low risk, which carry a natural hazard scoring 8 or more: earthquake 10 in Moshi Municipal, Singida District and Municipal, Iramba, Ikungi and Mkalama; landslide 8.1 in Iringa Municipal; environmental degradation 8.6 in Makambako. Overall risk is low there because vulnerability and coping are better, not because the hazard is. The message must read the hazard profile. |
| Hazard rows | `reconciledHazards` (profile) gives each hazard its basis: documented and modelled, modelled only, documented only | The two sources disagree often. Documented by the Guide Book but scoring 0 or no data in the Core: strong winds 93 of 105 councils (the INFORM indicator counts tropical cyclones only: 18 councils at 10, 174 at 0, 3 between); large waves 33 of 62 (the coastal indicator covers the ocean shore, not the lakes); public health 59 of 59 (the zoonoses group has no data); drought 27 of 83; floods 19 of 187. Scoring 6 or more in the Core but not documented: conflict and violence 99 councils, earthquake 59, wildfire 43, environmental degradation 30, heatwave 14, lightning 12. Every row needs its basis, and a documented-but-unscored row needs its reason (cyclones only, ocean only, no data). |
| A hazard's "class" | none | INFORM classes exist for risk and the three dimensions only. The bands used for hazards today (2, 4, 6, 8) are the D7 display rule, pending confirmation. The first plan's "class on the colour scale" for hazards is withdrawn: a hazard row shows its score on the map's own ramp, and band words only once D7 is confirmed. |
| Resolution of the value | in the workbook sources and the benchmark datasets | Drought, volcano, wildfire, soil erosion, conflict and violence are regional or national values repeated on every council of the region. Without a "regional value" mark a reader takes them as the council's own. |
| Human hazards | conflict, violence, accidents, hazardous material | Conflict intensity (HIIK Conflict Barometer, one value per region) scores 6 or more in 99 councils. Shown as a council's hazard on a public panel it would mislead. They belong in a separate fold with source and resolution. |
| Evidence sentences | the lineage of every value: benchmark stamps carry the raw value, period and institution (Kibiti storms: 100% of the area, score 10, 1980-2026, TMA); workbook values have the raw baseline and the source metadata | A generic sentence ("indicator: value unit, period, source, resolution") works for every indicator with the translations that exist (indicator names and units in the data portal's texts). The first plan's example naming the storms (Jobo 2021, Hidaya 2024) is not supported: the storm list exists only in `data-source/benchmark_2026/cyclone_exposure.csv`, not in the shipped data. |
| What the Guide Book says about a hazard | not available | 184 of 195 councils have one statement covering all their hazards (3 have two, 8 have five); statements are not tagged by hazard. The panel can say whether the guide documents the hazard and quote its one-line list ("Rufiji delta floods, large waves, heavy rain, boat accidents, and cholera"); it cannot quote a hazard-specific statement without tagging work. |
| Warnings in force | committee records | Available; shown without level wording. |
| Rank and neighbours on a hazard | computable | Available. |
| National state | the national aggregate exists | The explorer has no national selection; it must be added for the breadcrumb's root. |
| Advancement layer | its stamps carry their inputs (sub-indicators) | The generic sentence covers both layers. |

## 4. Colour: three systems on one screen (resolved 11 October 2026, see the end of this section)

| System | Where | Colours |
|---|---|---|
| Map classes | every lens of risk and the three dimensions | one red-yellow-green ramp: very low dark green, low light green, medium yellow, high orange, very high red |
| Communication bands (programme decision) | the risk level on profiles, cards and the panel | very low and low yellow, medium and high orange, very high red |
| Indicator lens | any indicator group | a sequential light-to-deep-red ramp |
| INFORM's own workbook (conditional formatting of the "INFORM SADC 2024" sheet) | for reference | risk pink to burgundy (#F8AFB0, #FF796C, #EA0029, #A32035, #691C32); hazard pale yellow to brown (#F9FFC9, #FFAF79, #FF7900, #D44E27, #A04121); vulnerability blues (#CFECF5 to #133D73); lack of coping greens (#DFEDE0 to #006853). No green for low risk. |

On one screen a medium council is yellow on the map and orange in the panel, and a low council is green on the
map and yellow in the panel. Recommendation (D17): colour the risk lens in five steps nested inside the
three bands (very low pale yellow, low yellow, medium light orange, high orange, very high red), so the
band's colour is the family of the map's colour and no area reads as a "safe" green; take the dimension
palettes from the workbook (hazard yellow to brown, vulnerability blue, lack of coping green). The
alternative is to keep the map as it is and drop the band colour from the explorer panel.

Built (11 October 2026, after the user's finding that the colours used for risk were not right): the risk
palette is `#fef08a`, `#facc15`, `#fb923c`, `#ea580c`, `#b91c1c` (very low and low in the yellow band,
medium and high in the orange band, very high in the red band); the dimension palettes are the workbook's
own, read from the class formatting of the "INFORM SADC 2024" sheet with openpyxl (hazard `#F9FFC9`,
`#FFAF79`, `#FF7900`, `#D44E27` darkened to `#C94A25` for readable text, `#A04121`; vulnerability `#CFECF5`
to `#133D73`; lack of coping `#DFEDE0` to `#006853`). Indicator lenses take the continuous ramp of their
dimension. Every palette is ordered by luminance (readable in greyscale), and a test holds the text
contrast of every fill at 4.5:1 or better (`src/engine/risk/__tests__/palettes.test.ts`).

## 5. The design, corrected

The right panel replaces the floating card and has three states.

```
State A: nothing selected     State B: an area                  State C: an area and a hazard lens
┌────┬──────────┬─────────┐   ┌────┬──────────┬──────────────┐  ┌────┬──────────┬──────────────┐
│rail│   map    │ what the│   │rail│   map    │ Tanzania ›   │  │rail│ map, lens│ Tanzania ›   │
│ or │          │ map     │   │    │ ■ area   │ Pwani ›      │  │    │ = hazard │ Pwani ›      │
│full│          │ shows,  │   │    │          │ Kibiti       │  │    │ ■ area   │ Kibiti       │
│ctrl│          │ legend, │   │    │          │ High risk    │  │    │          │ ◂ Storms &   │
│    │          │ counts, │   │    │          │ live / plan  │  │    │          │   cyclones   │
│    │          │ how to  │   │    │          │ Hazards (5)  │  │    │          │ 10.0 · TMA   │
│    │          │ read    │   │    │          │  basis·res.  │  │    │          │ evidence     │
│    │          │         │   │    │          │ Nature ▸     │  │    │          │ guide: no    │
│    │          │         │   │    │          │ Warnings     │  │    │          │ rank, region │
│    │          │         │   │    │          │ People ·     │  │    │          │ warnings     │
│    │          │         │   │    │          │ actions      │  │    │          │ actions      │
└────┴──────────┴─────────┘   └────┴──────────┴──────────────┘  └────┴──────────┴──────────────┘
```

Corrections to the first plan, each from the assessment:

1. **One source of truth for the hazard.** State C is an area plus a hazard lens (`metric=ind:hazard:<group>`);
   there is no separate `hazard` parameter. Clicking a hazard row sets the lens, and choosing a hazard lens
   with an area open shows state C, so the map and the panel always agree. A vulnerability or coping lens
   gives the same evidence block for that group.
2. **Hazard rows with their basis, reason and resolution.** Natural hazards first, ranked by score: the score
   on the map's ramp, the basis (documented and modelled, modelled only, documented only with the reason:
   "INFORM counts tropical cyclones only", "the coastal indicator covers the ocean shore", "no data in the
   Core yet"), a "regional value" mark where the data are regional, and the data-note mark. The first five,
   then "show all". Human hazards in a separate fold with their source and resolution.
3. **Messages that read the hazard profile.** The risk level keeps its two messages; where overall risk is
   low or very low but a natural hazard scores 8 or more, the planning message names that hazard instead
   of "few hazard constraints" (wording to agree with PMO-DMD).
4. **Evidence from the lineage.** A generic sentence for every indicator (value, unit, period, source,
   resolution, institution, date), in English and Kiswahili from the existing texts. The benchmark build
   gains a short per-value detail where the source has one (the storms behind a cyclone swath, the
   eroding segments, the police region, the IPC district and phase), stored compactly.
5. **The Guide Book honestly.** State B shows the council's statement; state C says whether the guide
   documents the hazard and quotes its one-line list. Hazard-specific statements wait for the guide to be
   tagged by hazard.
6. **Room for the map.** When an area is open on a desktop, the left control panel collapses to a rail
   (re-openable) and the panel docks at 400 px: the map keeps 824 px at 1280 and 984 px at 1440, against
   488 and 648 px if both panels stayed open. As built, the panel docks below 1280 px as well (568 px of
   map at 1024, where a floating panel left 236 px clear), and the rail opens the controls as a drawer over
   the map there. On phones it is the bottom sheet, whose peek in state C shows the hazard and its score.
7. **Keyboard and screen readers.** Selecting an area moves focus to the panel's heading; Escape steps back
   (C to B to A) and returns focus to where the selection started; a skip link reaches the panel; the panel
   is a labelled region with a heading per section; hazard rows are buttons whose accessible name carries
   the score and the basis.
8. **A national state.** The breadcrumb's root selects Tanzania and shows the national aggregate.

Rules kept from the first plan: standing risk only (no level wording, no "what helps", no incident
guidance); every number shows where it comes from; English and Kiswahili complete; every state is a
shareable link (`/explore?level=council&id=C051&metric=ind:hazard:stormsCyclone`).

## 6. Phases, revised

| Phase | Work | Checks |
|---|---|---|
| 0. Repairs first (small); **done 10 October 2026** | The "Updated" badge and the update count count only values approved through the portal, with the Benchmark 2026 shown as its own lineage line; the benchmark file is stored compactly (and loaded with the model, not the entry chunk); the explorer card uses the reconciled hazard list; the low band's planning message reads the hazard profile | model and explore tests for the badge (0 councils updated today), an entry-chunk size budget in the build check, a test for the 8 low-risk councils with a hazard at 8 or more |
| 1. Panel shell (medium) | Dock, rail, float and sheet; states A and B; breadcrumb with the national state; focus management and Escape | render tests at 1440, 1280, 1024 and 390 px; keyboard tests (focus on selection, Escape, skip link); the accessibility gate |
| 2. Hazard rows and state C (medium) | Rows with basis, reason, resolution and notes; human hazards fold; state C from the lens with the generic evidence; the per-value detail in the benchmark build | tests for the reasons (inland strong winds, lake waves, public health), evidence sentences for one indicator of each source, the "no level words" assertion extended to the panel |
| 3. Colours (small, after D17); **done 11 October 2026** | The nested risk palette and the workbook's dimension palettes on the map, legends and badges | the palette and contrast tests; the accessibility audit in day and night themes; the legend tests |
| 4. Exports and links (small) | The risk card narrowed to a hazard (`/area/:id/card?metric=…`), copy link | card render test, print check |
| 5. Optional | A two-map lens comparison (the TCVMP's grid reduced to two); hazard tagging of the Guide Book with PMO-DMD | performance check, guide data tests |

Status: phase 0 is done (CHANGELOG, "Repairs before the risk communication panel"). Phases 1 and 2 are
built (10 October 2026, CHANGELOG, "The risk communication panel in the Risk explorer") with D14, D16 and
D18 as recommended; the panel docks at every desktop width instead of floating below 1280 px, because the
browser check measured the floating panel over 60% of the map at 1024 px. State A stays in the control
panel on the left (what the map shows, its key and statistics); the right column appears with a selection.
Checks run: 58 test files (528
tests, including the panel's logic and its render, keyboard and breadcrumb tests), the accessibility audit
with the three panel states in day and night themes (no serious or critical findings), a browser check at
1440, 1280, 1024 and 390 px in English and Kiswahili, and the entry budget (808 KB raw, 180 KB gzip).
Phase 4 is partly there (the risk card link and copy link; the card narrowed to a hazard is not built).
Phase 3 is done (11 October 2026, D17 as recommended); phase 5 and D15 are optional; D19's wording waits on PMO-DMD.

Extension of 10 October 2026 (the user's request: "when a small area is selected, aside a map of it for
navigation, another panel with trends and charts, another with risk communication statements"): from
1280 px the left column becomes the area's own (`InsightColumn`: a map of the area built on `StaticMap`,
with its region's councils one click away and the country inset; trends and charts with the risk and its
parts against the region and Tanzania, the hazard profile, heatwave days 1991-2024 and rainfall 1981-2025
by year, and the change since the workbook), the risk communication panel stays on the right and opens
with statements generated from the area's data (`statements.ts`, also on the risk card with a locator
map); the controls open as a drawer. Below 1280 px and on phones the panels fold inside the risk panel.
The map keeps 520 px at 1280 and 680 px at 1440 with both columns open. Highest-scoring groups (11 October 2026, the user: "on Hazards here, put the highest-scoring indicators from the risk profile
in all of Hazard & Exposure, Vulnerability, Lack of Coping Capacity"): the panel's hazard list became the three
dimensions' highest groups (three each, then Show all), from `dimensionGroups()`; the reconciled list with its basis
and human-hazards fold is no longer in the panel.
Risk profile (11 October 2026, the user: "Hazards here and Hazard profile are the same; why not a risk profile with
vulnerabilities and coping capacity as well"): the column's hazard profile became the risk profile, the groups of all
three dimensions, each a click from its evidence.
Wording (11 October 2026, the user: "there should not be too many words; this is the system, other things go to the
thesis"): the panels state names, scores, bars and chips only; the basis and reason lines, the guide citations, the map
hints, the source notes and the disclaimer were removed, and the comparison with the workbook is one short line.
Reachability (11 October 2026,
the user's finding that the panels were not accessible): the area's map is operable by keyboard (the
region's councils are buttons with the value in their name; Enter or Space moves there), and below 1280 px
and on phones the map and the trends open unfolded inside the risk panel.

## 7. Decisions

- D14. Dock the panel from 1280 px with the left panel collapsing to a rail while an area is open
  (recommended), or keep the floating card. Built: docked at every desktop width (see the status above).
- D15. A two-map lens comparison: later, if wanted.
- D16. Evidence: generic sentences from the lineage first (recommended), specific phrasing afterwards.
  Built: generic lines with the per-value details.
- D17. Colours: five nested steps in yellow, orange and red for the risk lens and the workbook's palettes
  for the dimensions (recommended), or keep the map and drop the band colour from the panel. Built as
  recommended (11 October 2026).
- D18. Human hazards in a separate fold with their source and resolution (recommended). Built.
- D19. The wording of the planning message for low-risk councils with a very high hazard (with PMO-DMD).
