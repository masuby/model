# Risk communication from the Risk Action Guide Book

Design of 14 October 2026, built the same day. The Guide Book (`docs/RISK_ACTION_GUIDE_BOOK_0222.docx`,
PMO-DMD) is the source of everything the system says about what a risk means for people and what to do;
the INFORM model stays untouched and decides which of the book's statements apply to an area.

## 1. Decision: the Guide Book's actions follow the INFORM risk class, in INFORM's terms

PMO-DMD's decision of 14 October 2026: the system communicates in INFORM's own terms, the risk class
("Medium risk, 3.8 out of 10"), and the class decides which of the Guide Book's three sets of actions
apply. The book's level words (advisory, warning, major warning) and its colour names are never shown,
and no warning is derived from the class (the rule of 11 October stands).

| INFORM risk class    | Guide Book actions shown |
|----------------------|--------------------------|
| Very low, Low        | the book's first set     |
| Medium               | the second set           |
| High, Very high      | the third set            |

The class thresholds are the SADC workbook's (risk 2.5 / 3.4 / 4.3 / 5.9) and do not change, and the map
keeps the five-step palette of 11 October.

The same correlation applies to **one hazard or indicator group** by its own score, with the hazard list's
display rule (decision D7: under 2 very low, 2 to 4 low, 4 to 6 medium, 6 to 8 high, 8 and above very
high): very low and low take the first set, medium the second, high and very high the third. So a
Medium-risk council whose drought scores 9.4 shows the third set of drought actions and the second set of
wildfire actions: when a value reaches the next class, the specific action changes with it.

A published warning (a committee record of kind `warning`) remains a separate record with its own areas
and validity, shown while in force.

## 2. Content: what the book provides

All of it bilingual, extracted by `scripts/build-action-guide.py` from the book in `data-source/`:

- **Hazards (chapters 1.0 to 9.0)**: for each guide hazard, three levels of IMPACT → ACTION rows
  (`src/data/action-guide/hazards/<hazard>.json`). Tabora's councils carry their own rows.
- **Incidents (10.0)**: the rapid-response guide (`incidents.json`).
- **Vulnerability (11.0) and Lack of Coping Capacity (12.0)**, new on 14 October: for each INFORM group a
  statement of what the indicator measures and what a high score means, the lead sectors, and IMPACT →
  ACTION rows that hold at every level (`src/data/action-guide/indicators/<group>.json`).
- **Regions (13.0)**: each council's documented hazards and "Know your risk" statements (`regions/`).

The crosswalk (`src/features/guide/crosswalk.ts`) ties the model's hazard groups to the guide's hazards.

## 3. Where it shows

Every surface names the INFORM class, in the reader's language, with the book's own words and no
stories:

| Surface | Class | Hazard actions | Vulnerability and coping |
|---|---|---|---|
| Explorer panel, Risk communication | the class badge and the two standing messages | the area's top three hazards, each by its own score: two rows, fold to all | the two highest groups scoring medium or above: one row each, fold to all |
| Profile, "What to do" and "What makes the difference here" | same | each hazard with its class, score and rows (folded) | every group scoring medium or above, with what it measures and the library's entry |
| One-page risk card | the class badge | top three hazards, one row each | the groups scoring high or above, one row each |
| Detailed risk card | the class badge | every high-scoring hazard group, its rows | every high-scoring group: the book's rows and the committee's library entry when there is one |
| Methodology, Classification | the table of section 1 and the group rule | | |

Council-specific rows (Tabora) replace the national rows of the hazard. Rows that only say "keep following
updates" stay out, as before.

## 4. Management: the library in the Data portal

Rows live in two layers: the book (shipped with the site, rebuilt when the book changes) and the
committee records on top of it. A record of kind `guidance` with `topic: 'action'` holds one row:

```
{ topic: 'action', group: 'hazard:flood' | 'vulnerability:livelihoods' | ..., hazard?: 'floods',
  level: 1 | 2 | 3 | null (the class group it holds for, or every class), impact: {en, sw}, actions: {en: [], sw: []},
  replaces: <book row index> | null }
```

- National rows (unit `TZ`) are written by PMO-DMD, the NDRRC or an administrator and reviewed by the
  NDRRC (as the vulnerability-and-coping library is today); council rows by the council's DDRRC, reviewed by
  the RDRRC; region rows by the RDRRC, reviewed by the NDRRC.
- A row with `replaces` stands in place of that book row; without it, it is added after the book's rows.
- The desk (Data portal → Committee desk → "Risk communication") offers the form: scope, indicator group
  or hazard, the class group (very low and low, medium, high and very high, or every class), impact and
  actions in both languages, the book row it replaces, the source. The Data
  management tab shows the library's state: book rows and committee rows per level.
- Reviewed records are published at once on every surface; the audit log records them as any committee
  record. No database change is needed: the rows use the existing `committee_records` table, which the live
  database receives with migrations 0006 to 0017.

## 5. Build order

1. The new book replaces the copy in `data-source/`; the build script learns chapters 11.0 and 12.0; the
   hazard, region and incident files are rebuilt from it.
2. The correlation: the mapping and the group rule; tests and the Methodology table.
3. Assembly: `src/features/guide/actions.ts` merges book rows, council rows and committee rows per hazard
   and per group at a level.
4. Surfaces: panel, profile, both cards.
5. Desk form and the management view.
6. Tests, documentation, release notes; verified on the preview and live.
