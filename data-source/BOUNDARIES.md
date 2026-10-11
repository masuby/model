# Boundary changes: the re-basing procedure (issue ADM-06, decision D12)

The 195 councils of the 2022 Population and Housing Census (184 mainland + 11 Zanzibar), in 31 regions and
150 districts, are the headline units of INFORM Tanzania. Their identifiers `C001`..`C195` are the keys of
every stored value (approved data, measured values, committee records, audit log, guidance entries,
links), fixed by `data-source/council_registry.csv`. A boundary change (a new council, a split, a rename,
a move to wards) must never renumber a council silently. This is the procedure; `scripts/check-boundaries.py`
is its first step and reports zero changes on the current list.

## 1. Obtain the official list

- The gazetted list of councils (PO-RALG; Government Notice) and, for Zanzibar, the OCGS list.
- Boundaries: the NBS post-census geodatabase (or the gazetted shapefile), with the census codes
  (region, district, council) and the council population.
- Keep the files in `data-source/boundaries/<year>/` with a `SOURCES.md` naming the document, its date,
  the Government Notice number and the file checksums.

## 2. Diff against the registry (dry run)

```
python3 scripts/check-boundaries.py data-source/boundaries/<year>/councils.csv
```

The official list is a CSV with the columns `code, name, region, district` (`code` = the census council
code `reg_code|dist_code|counc_code`, or blank for a council not yet coded). The script reports, without
changing anything:

- **added** councils (in the list, not in the registry): the parent they were carved from must be named;
- **renamed** councils (same code, different name): the registry keeps the former name in `formerly`;
- **split** councils (a registry council whose code now maps to two names);
- **removed** councils (in the registry, not in the list): never deleted, only retired (`retired` column);
- region or district moves.

A dry run on the current registry (`python3 scripts/check-boundaries.py`) must report **zero changes**.

## 3. Re-base

For every added council, in this order:

1. **Identity.** Append the council to `data-source/council_registry.csv` with the next free `C###`
   (never reuse a retired id), its census codes, type and region, and `parent` = the council it was carved
   from; `link` = `inherits`. Run `python3 scripts/build-council-registry.py` only if the geodatabase
   changed, otherwise edit the registry by hand and run `node scripts/build-council-index.mjs`.
2. **Boundaries.** Add the polygon to `src/data/tanzania-councils.json` and rebuild the map paths
   (`node scripts/build-svg-map.mjs`).
3. **Population and area.** `data-source/population_2022_councils.csv` and `council_climate.csv` need the
   council's census population and polygon area (or the parent's, apportioned and flagged).
4. **Council hazards.** Recompute the Advancement members on the new polygon:
   `python3 scripts/compute-council-climate.py`, `compute-aridity.py`, `compute-council-drought-members.py`,
   `compute-council-earthquake.py`, the Google Earth Engine extractions, then
   `python3 scripts/build-advanced-inputs.py`.
5. **Vulnerability and coping.** The new council inherits its parent's workbook unit (flagged as
   inherited on the site) until institutions enter council values through the Data portal.
6. **Guidance.** Add the council to its region's file under `src/data/action-guide/regions/` (hazards and
   Know-your-risk statements; the DDRRC can write them through the committee desk).
7. **Database.** A migration adds the council to `public.units` (migration 0010 seeds the current list).
8. **Tests.** `src/engine/risk/__tests__/registry.test.ts`, `tools.test.ts` and the migrations test fix the
   counts; update them with the new total and run `npm run check`.
9. **Tools.** Regenerate the collection tools (`build-collection-tool.py`, `fill-collection-tool.py`,
   `build-advanced-tool.py`, `fill-advanced-tool.py`).

A renamed council keeps its id; record the new name in the registry and the former name in `formerly`.
A retired council keeps its id and its history; mark it `retired=<year>` in the registry and exclude it
from the model build.

## 4. Record

Every re-basing is a release (see `docs/RELEASES.md`): note the Government Notice, the councils added,
renamed or retired, and the date, in the change log, and have the NDRRC technical committee review it
before PMO-DMD publishes.
