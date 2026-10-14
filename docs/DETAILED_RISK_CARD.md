# The detailed risk card

Route `/area/:id/card/detailed` (the reader's language; `?lang=sw|en` prints the other one; `?print=1` opens the
print dialogue). Built 11 October 2026 from the user's request: "a detailed risk card as well, which guides
sectors and decision-makers on all high-scoring contributing risk indicators; it talks for all".
Code: `src/features/area/DetailedRiskCardPage.tsx`, lead sectors in `src/features/guide/sectors.ts`,
texts under `detailed` in `src/i18n/locales/{en,sw}/area.json` and the sector names under `sectors` in
`common.json`.

## Who it is for, and how it differs from the one-page card

| | One-page card (`/area/:id/card`) | Detailed card (`/area/:id/card/detailed`) |
|---|---|---|
| Reader | a ward office, a notice board, a radio desk, the public | sector officers, council management, the RC/DC offices, PMO-DMD, ministries |
| Length | one A4 sheet | two to three A4 pages |
| Hazards | the guide-reconciled hazard list with its bands | every indicator group of every dimension, the high-scoring ones in full |
| Guidance | the risk level's two messages | the two messages, the lead sectors of every high-scoring group, the national action library's entry when there is one, and the guide's "what helps" |
| Evidence | none | the measured values behind each high-scoring group (value, unit, score, detail, origin, period, institution) |

Both read the same model, guide and committee records; nothing is typed into either, and no warning
level is derived from the risk level.

## Sections, in order

1. **Header**: name, level and region, date; the risk badge and score; the emergency number (190).
2. **Warnings in force** (only when a committee has published one).
3. **What the data say**: the generated statements (rank, what weighs most, hazards, vulnerability,
   coping gaps, people) beside a locator map.
4. **The risk level's two messages**: for those who live and work here, and for those who plan, build,
   invest or settle here (the planning message names a very high hazard where overall risk is low).
5. **Risk and its parts**: a table of INFORM risk and the three dimensions, each with its score, class
   (in the dimension's colour), the region's and the country's value, and the risk rank among the level.
6. **High-scoring indicator groups (5.0 and above)**: for Hazard & Exposure, Vulnerability and Lack of
   Coping Capacity in turn, the dimension's score and every group scoring 5.0 or more (hazard groups at
   0 are never listed), each with
   - its score and bar in the dimension's palette, the region's and the country's value, its rank among
     the level and the regional/national resolution mark;
   - up to three measured values behind it (the dataset, the raw value with its unit and score, the
     source's detail such as the storms counted or the sites found, and origin · period · institution);
   - its **lead sectors**: the ones PMO-DMD set for the group in the action library (Data portal,
     Committee desk, "Reducing risk"), else the proposal of `sectorsFor()` from the ministries', agencies'
     and councils' mandates;
   - the **national action library's entry** when PMO-DMD has written one for the group (topic `vc`
     guidance approved by the NDRRC, through the Data portal): its lead sector, why and the actions.
   A dimension with no group at 5.0 or more says so and names its highest group.
7. **All indicator groups**: one table of the 32 groups with category, score here, region, Tanzania and
   the first source behind the value (origin · period · institution · resolution); high-scoring rows in
   bold; a data note's status in brackets.
8. **The area and its hazards**: the guide's statements per council (the area, the risk) with **what
   helps**, the guide book's advice, which the one-page card and the profile leave out.
9. **DRR arrangements and the committee**: all nine criteria (EPRP, RVCA, trained ERT, EOCC, DRR
   training, anticipatory action, committee active, stakeholder collaboration, involvement in DRR),
   in place / not in place / not recorded for a council, counts over the councils for a region or the
   country.
10. **Events reported by the committees** (when there are any), **footer** with the date and the link.

## Design choices

- **Threshold 5.0** (`HIGH_SCORE`): the upper half of the 0-10 scale. INFORM defines classes only for
  risk and the dimensions, so a group threshold is a display rule, stated in the section title.
- **The sector mapping has a proposal and an owner**: `sectors.ts` proposes two to four of 21 sectors per
  group; an action library entry for the group (any of the 32, hazards included) carries the sectors
  PMO-DMD chose, and the card shows those. The proposal is the fallback until every group has an entry.
- **No warning-level wording, no incident actions**: the detailed card is standing-risk guidance for
  planning and investment, like the rest of the site. Warnings appear only when a committee has
  published one.
- **Everything from the model**: scores, ranks, evidence, resolution marks and data notes come from the
  same functions the explorer uses (`dimensionGroups`, `evidenceFor`, `groupRanks`, `coarseOf`,
  `dataNotesFor`); the card never carries its own numbers.
- **Print**: A4 with 10-11 mm margins, blocks that avoid page breaks, the table of all groups on a new
  page.

## Open points for PMO-DMD

- Write the action library entries (Data portal, Committee desk, "Reducing risk"): the group, its lead
  sectors, why it matters and the actions; once approved, the detailed card shows the entry and its
  sectors under that group. Until then the proposal in `src/features/guide/sectors.ts` stands.
- Decide whether the threshold stays at 5.0 or follows the hazard display bands (6 high, 8 very high).

## Risk communication (14 October 2026)

Each high-scoring group block shows "What to do": a hazard group's rows are the book's rows for its guide
hazard in the set its own score selects (a council's own rows for Tabora); a vulnerability or coping group's rows are the
book's chapter 11.0 or 12.0 rows, preceded by what the indicator measures; committee rows of the library
stand in place of a book row or follow the rows. See `docs/RISK_COMMUNICATION_DESIGN.md`.
