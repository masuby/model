# INFORM Tanzania: Frontend guide

How the web app is put together, and the rules every page follows. Read this before adding a feature.

## Stack

React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS v4 · Radix UI (via `radix-ui`) · React Router 7 ·
TanStack Query · Zustand · i18next · Recharts 3 · Leaflet / react-leaflet · Motion · Supabase (optional).

## Layout of `src/`

```
app/            App.tsx (router, providers), layout/ (AppShell, header, footer, theme, language, ⌘K search)
components/
  ui/           design-system primitives: Button, Card, Badge, primitives.tsx (Tabs, Select, Tooltip,
                Dialog, SheetContent, DropdownMenu, Popover, Switch, Slider, Segmented, Progress, Input…)
  layout/       Page.tsx → PageContainer, PageHeader, Section, SectionHeading, Kicker, KeyFigures, Note
  risk/         ClassBadge, ClassDot, ClassLegend, RampLegend, DimensionBars, ScoreBar,
                Provenance (LevelTag, SourceKindTag, formatRaw: where a value comes from)
  map/          StaticMap (light SVG choropleth) and RiskMap (Leaflet, pan/zoom); lazy-load both
  charts/       ChartCard (flat figure with PNG/CSV export), theme.tsx (useChartTheme, ChartTooltip,
                DIMENSION_COLORS for fills, DIMENSION_TEXT for text)
data-layer/     DataProvider (useModel, useData, useSubmit, useReview…, and the workflow hooks:
                useAssignments, useRequests, useRawValues, useSubmitRaw, useReviewRaw…), local + Supabase
                repositories (the local one enforces the same rules as the database functions)
engine/risk/    INFORM Risk engine: math, classes, hierarchy, standardise, model, metrics, sources
engine/severity INFORM Severity Index engine: definitions, engine, scenarios
features/<x>/   one folder per page (owns its components); features/guide/ is shared: the Risk Action
                Guide Book data used by the area profile and the explorer
data/           generated datasets (do not edit by hand); action-guide/ comes from
                scripts/build-action-guide.py
i18n/           i18next setup + locales/<en|sw>/<namespace>.json
state/prefs.ts  theme, language, learning progress (persisted)
```

## Non-negotiable rules

1. **Every user-visible string is translated.** Add keys to `src/i18n/locales/en/<ns>.json` **and**
   `src/i18n/locales/sw/<ns>.json` (natural Kiswahili, not word-for-word). Use `useTranslation('<ns>')`.
   Shared words live in `common` (classes, dimensions, categories, levels, actions, labels);
   indicator names/descriptions in `indicators` (`t('indicators:flood')`, `t('indicators:desc.flood')`).
2. **Never hard-code INFORM numbers or classes.** Read them from the model (`useModel()`), classify with
   `classify(value, scale)` from `@/engine/risk/classes`. Each dimension has its OWN thresholds
   (`scale = 'hazard' | 'vulnerability' | 'coping' | 'risk'`).
3. **Day and night.** Use semantic tokens only: `bg-background`, `bg-card`, `bg-muted`, `bg-elevated`,
   `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`, `bg-primary/10`,
   `text-success|warning|danger`. Never raw `bg-white`/`text-gray-*`. Charts use `useChartTheme()`.
4. **Accessible.** Radix primitives for interactive widgets; buttons have labels; icons in buttons get
   `aria-label` when there is no text; colour is never the only signal (pair with text/score).
5. **Responsive.** Mobile first; check 375 px, 768 px and 1440 px layouts. Use `PageContainer`.
6. **Typed.** No `any`. `npx tsc -p tsconfig.app.json --noEmit` and `npx vitest run` must pass.
7. **Honest.** Illustrative content is labelled as such; data provenance is shown where values appear.

## Conventions added during QA

- `Progress` requires a `label` (accessible name).
- Dimension colours: `DIMENSION_COLORS` for fills/strokes, `DIMENSION_TEXT` (theme-aware CSS variables)
  for any text: the bright fills fail contrast as text.
- Class fills: take text colour from `onClassColor(hex)`; never hard-code white on a class colour.
- Map overlays positioned over `RiskMap` need `z-[450]` (Leaflet panes sit at z-index 400).
- Translations load lazily per namespace: always declare the namespace in `useTranslation('<ns>')`
  (prefixed keys like `t('learn:x')` only resolve if that namespace is already loaded).
- Speed (keep the shell light): code under `src/app/` imports UI from `@/components/ui/overlays`, never
  the `primitives` barrel, so form controls stay out of the entry bundle. Heavy libraries (recharts,
  leaflet, supabase-js, xlsx) are only ever reached through `import()`; after a build, `dist/index.html`
  must modulepreload `vendor-react` only. Content far below the fold mounts at idle (Severity table and
  methodology, area charts). Do not read layout (`scrollHeight`, `getBoundingClientRect`…) synchronously
  in an effect on mount; let a `ResizeObserver` report it. `useModel()` re-renders only when the model
  changes. Measure with `node scripts/qa-perf.mjs [--only=/route]`.
- Where a value comes from is always shown: the kind of source (`SourceKindTag`: Tanzanian institution
  or global dataset) and, for measured figures, the level (`LevelTag`: council, regional, national or
  INFORM baseline). Their labels live in `common` (`sourceKind.*`, `valueLevel.*`).
- Selecting rows must never move them: bulk-action bars float at the bottom of the screen
  (Data portal → Indicators) instead of being inserted above the list.
- Long option labels: `<SelectItem description="Tanzania Meteorological Authority">TMA</SelectItem>`
  shows the description in the open list only, so the closed select stays short.
- Text on solid `bg-success` / `bg-danger` uses `text-background` (light green and red in night mode
  need dark text).
- `npm run dev:demo` runs the dev server in demo mode (browser-local data) even when `.env.local` has
  Supabase keys: switch roles in the Data portal to walk through the whole workflow.
- Benchmark 2026 (`@/engine/risk/benchmark`, data `src/data/tanzania-benchmark-2026.json`): institutional
  values the engine applies to every council as approved edits dated 2026-10-10 (`BENCHMARK_OVERRIDES` in
  `model.ts`, merged with the portal's overrides by date; `buildModel(…, { benchmark: false })` and
  `workbookOnly` leave them out, and a dated version before the benchmark date has none). `ACTIVE_SPECS`
  (`standardise.ts`) is the specification the portal and the measured-value engine use: the workbook's
  `SPECS` plus the eight activated template indicators and one re-resolved range; `SPECS` stays the
  workbook for the parity tests. A leaf recomputed from measured values never reads a withheld workbook
  value back from the baseline (`deriveRawOverrides`, `LeafInput.withheld`).
- Filled collection tools import directly: `lib/xlsx-lite.ts` reads one worksheet of an .xlsx in the
  browser (zip central directory + DecompressionStream, no spreadsheet library), `lib/tool-import.ts` turns
  the 'Council Entry' sheet into the CSV template rows `parseTemplate` already reviews. `TemplateIO`
  accepts .csv and .xlsx; with `allowAll` (the Data control tab) it takes every indicator, otherwise only
  the institution's.
- Where a value comes from: `@/engine/risk/stamps` (`stampOrigin`, `isPortalStamp`, `isBenchmarkStamp`,
  `portalEditCount`, `stampCount`). An `EditStamp` is a portal update, a Benchmark 2026 value (`release`
  set; built from `RawValue.release` through `deriveRawOverrides`) or an Advancement value (authority
  `CHC`). Anything shown as "Updated", an update count or an edited mark must use the portal origin only;
  the benchmark has its own lineage line and CSV lineage (`benchmark`). The provider drops derived stamps
  that come from the benchmark alone (they are applied inside `buildModel`), so `overrides` holds updates.
- `npm run check:size` checks the entry chunk after `vite build` (budget 880 KB raw, 200 KB gzip). Keep data
  files compact or behind a lazy import.
- Scores are computed, never typed: the Data portal has no screen for a 0-10 score (the "Enter scores" and
  "Bulk paste" tabs were removed on 10 October 2026). A value enters as a measured value in its own unit
  (the Indicators entry sheet, a CSV template, a filled collection tool) and `deriveRawOverrides` turns it
  into the leaf score with the workbook's standardisation; the engine's `EditStamp` overrides remain the
  internal shape of the benchmark stamps and the recomputed leaves.
- Data control (Data portal, administrators and PMO reviewers only): `features/data/tabs/Control.tsx`
  over the pure functions in `features/data/lib/control.ts`. `distribution()` lists every institution
  with the indicators it serves, its open and overdue requests and the submissions waiting for review,
  and which unassigned indicators usually belong to it; `valuesControl()` counts, for each of the 32
  indicator groups, the councils whose live value is the workbook's, carries an approved institutional
  value, is withheld after validation or is empty. Assignments and requests made there use the same
  mutations as the Indicators tab, so they reach the institutions' inbox.
- The Methodology page is operational documentation only (overview, structure, calculation with the
  live worked example, geometric mean, classification, levels, severity method, sources register, data
  notes and limitations, references). The sensitivities, the coherence check, the Advancement baskets
  and the corrections stay in the engine and its tests and are reported in `docs/assessment` and the
  thesis, not on the site; a link to a removed section falls back to the summary.
- "Know the risk" (the risk communication of an area): read the guide through `@/features/guide/data`:
  `useAreaGuide(unit)` (the councils behind any unit, their hazards most relevant first and the guide's
  statements about the nature of each area). Each loads one small JSON file on demand; render guide text
  with `pick(text, i18n.language)` and keep labels in the `guide` namespace. The site communicates
  standing risk for people to live and plan with: the risk level with what it means for residents and
  for those who plan, build or invest there, the hazards of the area and the guide's statements about it.
  It does not show warning levels, "what helps" advice, incident actions or warning-level tables; the
  committees publish warnings through the Data portal and the hero shows them while in force. To rebuild
  the guide data from the docx: `python scripts/build-action-guide.py`. One emergency number: 190,
  stated on its own (it is not the Fire and Rescue Force's line), `EMERGENCY_NUMBER` in `WhatToDo.tsx`.
- Risk level colours: `riskBandFor(unit.risk)` (`@/features/guide/alert`) gives an area's INFORM risk
  class with its colour band (very low and low: yellow; medium and high: orange; very high: red). Show
  it with `RiskBandBadge` (`@/features/guide/AlertBadge`), which always names the class ("High risk");
  never derive or show a warning level from the class, and no level wording appears anywhere on the site: a committee's warning in force shows its colour, hazard, areas, validity and issuer only (the level 1 to 3 stays in the record and sets the colour). The band
  colours (`ALERT_COLOR`, standard yellow, orange and red) are deliberately separate from the class
  colours: never colour a band with `CLASS_COLORS`. `AlertDot` is for published warnings only.
- Data notes: `dataNotesFor(unit, dim, group)` (`@/engine/risk/notes`) returns the notes of the
  indicator integrity register that apply to a unit's value (a workbook value under query, a known
  artefact, an explanation); show them with `DataNoteMark` and `DataNoteLine`
  (`@/components/risk/DataNoteMark`) wherever the value appears. A note with `quarantine: true` withholds
  the value from the live model (`unit.quarantined[ref]`, `isWithheld(unit, dim, group)`): the group reads
  as no data with the "withheld" line. The notes live in `src/data/inform-data-notes.json`;
  `node scripts/integrity-recheck.mjs` writes their evidence and the queries to the partners.
- Profile sections can be linked: `/area/<id>#actions` lands on "Know the risk" (the explorer's area panel
  links there). `ScrollToTop` leaves hash links alone.
- Explorer lenses: a dimension opens onto its own indicator groups, nested under it (`LensTiles`;
  `IndicatorChips` on phones), so there is no separate indicator picker.
- Explorer risk panel (`RiskPanel.tsx`, content from `lib/riskPanel.ts`): driven by the URL only. `id` is
  the area (`TZ` selects the country, which is never pinned to the comparison), and an indicator-group lens
  (`metric=ind:<dim>:<group>`) with an area open shows that group's evidence; there is no separate hazard
  parameter. Hazard rows come from `panelHazards(unit, documented)`, evidence from `evidenceFor`, member
  spread from `memberSpread`, ranks from `groupRanks`. On desktops it docks beside the map and the controls
  fold to a rail; in the table it sits beside the rows; on phones `RiskPanelPeek` and `RiskPanelSheetBody`
  fill the bottom sheet. Selections someone makes go through `actions.select` (it bumps `selectSeq`, and
  the panel moves focus to its heading); pass `{ focus: true }` when the map should fly to the selection.
  Texts from a namespace the explorer route does not preload must not suspend the page (the map would be
  torn down): use `useSuspense: false` with `ready`, or keep the component inside the panel's own Suspense
  boundary.
- The selected area beside the map (`components/AreaInsight.tsx`): from 1280 px the explorer's left column
  becomes `InsightColumn` (a map of the area to move around from, built on `StaticMap` with the region's
  councils emphasised and a country inset, and `AreaCharts`: the risk and its parts against the region and
  Tanzania, the hazard profile, the climate year by year and the change since the workbook); the controls
  open as a drawer over it. Below 1280 px and on phones the same panels fold inside the risk panel
  (`withInsight`). The climate series (`src/data/tanzania-council-trends.json`, `scripts/build-trends.py`)
  load only when shown (`lib/trends.ts`).
- Institutional indicators (`@/engine/risk/institutional.ts`): the councils' DRM arrangements and committee
  criteria live on `unit.drr` (`DrrStatus`: the published flags of `src/data/tanzania-councils-drr.json`,
  merged with the committees' approved records by `drrFor` in `model.ts`). The Benchmark 2026 carries the
  published values of the two indicators; `DataProvider` turns approved DRR records into values dated by
  their approval (`institutionalRecordValues`), so they supersede the benchmark through the ordinary
  measured-value path and count as updates. The Committee desk's DRR record holds the nine fields
  (`DRR_FIELD_KEYS` in the data layer); the profile's capacity section shows them; the explorer renders the
  `drr:` and `gov:` detail codes.
- Area statements (`@/features/guide/statements.ts`, rendered by `AreaStatements.tsx`): sentences generated
  from the model for one area (its rank, the dimension that weighs most, its strongest hazards with the
  guide's names, road crashes and hazardous-material sites where they score high, vulnerability, coping
  gaps, people). The explorer's risk panel and the risk card show the same ones; templates are
  `guide:statements.*` in both languages; never a warning level.
- QA before merging UI work: `node scripts/qa-a11y.mjs` (axe, both themes) and
  `node scripts/qa-screenshots.mjs` (full-page screenshots, both themes, both languages, 390/1440 px)
  against `npx vite preview --port 4173`.

## Visual language

**The binding reference is [`docs/DESIGN_LANGUAGE.md`](DESIGN_LANGUAGE.md)** (editorial, few boxes, hairline
rules, colour for data only, serif titles, no decorative motion). The notes below are older detail.


- Cards: `Card` (rounded-2xl, soft shadow). Sections: `SectionHeading` with an eyebrow.
- Headline numbers: `font-display font-extrabold num` (tabular numerals).
- Scores always with one decimal via `formatScore`; populations via `formatNumber`/`formatCompact`.
- Class colours via `ClassBadge`/`ClassDot`, always in the scale's own palette (`CLASS_PALETTES` in
  `src/engine/risk/classes.ts`): risk pale yellow → deep red, nested in the three risk bands; hazard yellow →
  brown, vulnerability blue, lack of coping green, from the INFORM SADC 2024 workbook. Indicator ramps follow
  their dimension: `rampColor(value, scale)` and `rampStops(scale)`; a `Metric` carries its `palette`.
  Text on a fill: `readableOn()` (AA by luminance). Never colour a dimension with the risk palette.
- Motion: subtle `motion` fade/slide on section entry; respect reduced motion (global CSS handles it).
- Icons: `lucide-react`, size 4 (16 px) in buttons.

## Engine API (quick reference)

```ts
const model = useModel();                 // RiskModel with approved edits applied
model.councils / regions / sources / national; model.byId.get(id)
unit.dims.hazard.score; unit.dims.hazard.categories.natural.indicators.flood; unit.risk
parseMetric('risk' | 'dim:hazard' | 'ind:hazard:flood') → { get(u), classOf(v), scale, labelKey }
metricColor(metric, value)                // map/table colour
topDrivers(unit, n, dim?), dataCoverage(unit), indicatorValue(unit, dim, key)
DIMENSIONS / ALL_INDICATORS (hierarchy), sourceFor(dim, key), sourceLabel(src), AUTHORITIES
computeFromRaw(rawById) / standardise(raw, spec) / SPECS / usedSpecs() / ADVANCED_SPECS
deriveRawOverrides(rawValues, model, baseline) → council leaves recomputed from measured values
mergeOverrides(explicit, derived, model)  // the most recent approved value wins per council and leaf
resolveForCouncil(index, specId, council) // council value, else its region's, else the national one
computeSeverity(input) → { severity, category, level, dimensions tree, indicators, reliability }
```

Unit ids: councils `C001…`, regions `R-<placekey>`, INFORM source units `TZ0101…`, national `TZ`.
Preferences (`src/state/prefs.ts`, localStorage `inform.prefs`): theme, language, `textSize` (the root font size in
four steps, applied pre-paint by `public/theme-init.js` and kept in sync by `useTextSizeSync`) and `panelWidths`
(the explorer's left and right panels, `PanelResizer` / `usePanelWidth` in `src/features/explore/components/`).

Routes: `/area/:id` renders any unit's profile; `/area/:id/card` the one-page risk card and
`/area/:id/card/detailed` the detailed risk card for sectors and decision-makers (`docs/DETAILED_RISK_CARD.md`),
both Kiswahili first (`?lang=en`).
