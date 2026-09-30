# INFORM Tanzania

**Sub-national disaster risk and crisis severity for every council in Tanzania.**

INFORM Tanzania applies the [INFORM](https://drmkc.jrc.ec.europa.eu/inform-index) methodology of the
European Commission Joint Research Centre and IASC partners to all **195 councils** and **31 regions**
of the United Republic of Tanzania, using Tanzanian data (NBS 2022 census, CHIRPS/ERA5 climate, USGS,
TDHS-MIS, HBS, IPC/MUCHALI, UNHCR, …). It is an open, transparent and reproducible index to target
preparedness, anticipatory action and investment.

| | |
|---|---|
| **Risk explorer** | Interactive map and ranking of every council and region, by overall risk, any dimension or any of 32 indicators |
| **Area profiles** | Report-grade, printable profile of any council/region: drivers, indicators, sources, peers |
| **Insights** | National analytics: regional ranking, hazard hot-spots, how the dimensions interact, data coverage |
| **Crisis severity** | The official INFORM Severity Index method for an unfolding crisis, with a council picker |
| **Learn** | A seven-lesson course with quizzes and live widgets built on the real engine |
| **Methodology** | Every formula, threshold, data source and limitation, with a live worked example |
| **Data portal** | Institutions keep their assigned indicators current with national, regional or council figures; PMO assigns, requests, reviews and approves; full audit trail |

English and Kiswahili · day and night themes · responsive · accessible.

---

## How the index works

```
indicator (raw, natural units)
  → standardise to 0–10          denominator · Tukey outlier cap · log transform · min–max (inverted for "decrease risk")
  → indicator group = mean       blanks skipped (null = no data, 0 = a real zero)
  → category = mean              Natural · Human · Socio-economic · Vulnerable groups · Infrastructure · Institutional
  → dimension = scaled geomean   (10 − GEOMEAN((10 − c)/10·9 + 1, …)) / 9 · 10
  → INFORM Risk = ∛(Hazard & Exposure × Vulnerability × Lack of Coping Capacity)
```

Classes use the Tanzania workbook's own thresholds, **separately for risk and for each dimension**
(e.g. risk: Very low < 2.5 ≤ Low < 3.4 ≤ Medium < 4.3 ≤ High < 5.9 ≤ Very high).
Full details: the in-app **Methodology** page and [`docs/METHODOLOGY_MANUAL.md`](docs/METHODOLOGY_MANUAL.md).

The engine is verified against the official Excel workbook: all **8,664** standardised values, the full
raw → risk pipeline for all **170** INFORM source units, and the workbook's cached dimension and risk
cells (`src/engine/risk/__tests__`).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5174
```

```bash
npm run check        # typecheck + lint + tests
npm run build        # production build → dist/
```

Requires Node 22+.

### Shared data backend (optional)

Without configuration the Data portal runs in **demo mode** (edits stay in the visitor's browser).
To enable real accounts, roles and a shared approval queue:

1. Create a Supabase project and apply every file in [`supabase/migrations/`](supabase/migrations) in order.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see [`.env.example`](.env.example)).
3. Make yourself an administrator (`update profiles set role = 'admin' where id = '<your user id>';`),
   then manage everyone's role and institution in *Data portal → People*. Details in
   [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Repository layout

```
src/
  app/            router, providers, app shell (header, footer, ⌘K search, theme, language)
  components/     design system (ui/), risk widgets, the map, charts
  engine/risk/    INFORM Risk engine (TypeScript, golden-tested)
  engine/severity INFORM Severity Index engine (JRC/ACAPS method)
  data-layer/     local + Supabase repositories, React Query hooks
  features/       one folder per page
  i18n/           English + Kiswahili catalogues
  data/           bundled dataset (generated; do not edit by hand)
data-source/      transparent CSV inputs + GeoJSON boundaries
scripts/          offline data pipeline (Python/Node): climate, exposure, earthquake, tools
supabase/         database schema (migrations/) and the retired v1 schema (legacy/)
docs/             methodology, data plans, frontend guide, deployment
_archive/         previous versions kept for reference (not built)
```

## Updating the data

The site ships a bundled dataset generated offline. See [`data-source/README.md`](data-source/README.md):
edit/extend the CSVs, re-run the relevant `scripts/compute-*.py` / `scripts/apply-*.mjs`, then
`npm test` to confirm the engine still reproduces the workbook. Approved Data-portal edits are applied
on top of the bundled dataset at runtime.

## Contributing

Read [`docs/DESIGN_LANGUAGE.md`](docs/DESIGN_LANGUAGE.md) (editorial, few boxes, colour for data only) and
[`docs/FRONTEND_GUIDE.md`](docs/FRONTEND_GUIDE.md). Every user-visible string must exist in both `en` and
`sw`; never hard-code INFORM numbers or classes; `npm run check` must pass. Before merging UI work run
`node scripts/qa-a11y.mjs`, `node scripts/qa-screenshots.mjs` and `node scripts/qa-perf.mjs` against
`npx vite preview --port 4173`.

## Licence and attribution

Methodology © European Commission Joint Research Centre / INFORM partners. Data © the respective
Tanzanian and international providers listed on the Methodology page.
