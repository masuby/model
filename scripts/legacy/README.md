# Legacy adjustment pipeline (not part of the Core build)

These scripts produced the pre-October-2026 dataset by editing `src/data/tanzania-inform-risk.json` in
place: documented refills and hand-assigned grades (`refill-real-hazards`, `build-hazard-overlays`),
computed climate indices folded in with a raise-only floor (`apply-climate-hazards`,
`apply-council-hazards`), redefined survey indicators (`apply-vulnerability`), a WASH rebuild from
facility counts (`enrich-coping-facilities`), and the stored-aggregate fixes (`fix-dimension-aggregation`).
The integrity assessment of 9 October 2026 (docs/assessment/) found that this put Tanzanian
adjustments inside the INFORM core and changed 165 of 170 units.

The Core is now built only by `scripts/build-core.mjs` from the workbook, and these scripts are kept
for the record and as the reference for the Advancement layer, where each adjustment is being
re-expressed as a documented, labelled sub-indicator. Do not run them against the Core dataset.
