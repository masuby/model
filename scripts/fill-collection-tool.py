#!/usr/bin/env python3
"""
fill-collection-tool.py - populate the NORMAL collection tool with the authentic INFORM workbook values
to create the operational BENCHMARK dataset.

Source of truth: the workbook's raw values per unit (src/data/inform-baseline-raw.json, the 170 units of
the INFORM Sub-national SADC 2024 workbook, reproduced by the engine at 8,664/8,664). Each of the 195
councils carries the raw values of its own workbook unit as the council registry links it
(data-source/council_registry.csv, issue ADM-01: the twelve urban councils have their own units;
Butiama its own values). Nothing is invented and nothing falls back to a neighbour: a council whose unit
is not in the baseline would be reported, not filled.

Outputs:
  inform_sheets/INFORM_TZ_Collection_Benchmark.xlsx   the filled benchmark (the blank template
                                                      INFORM_TZ_Collection_Tool.xlsx is kept for sending)
  data-source/collection_benchmark_values.json        the same values, council by council, with the unit
                                                      each council took them from, for the CI test
                                                      (src/engine/risk/__tests__/tools.test.ts)
"""
import csv
import json
import os
from datetime import datetime, timezone

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    return ''.join(ch for ch in str(s).lower() if ch.isalnum())


SPEC = json.load(open(os.path.join(ROOT, 'src/data/inform-indicator-spec.json')))
# Benchmark 2026: the template indicators activated with a Tanzanian definition (and re-resolved ranges)
# join the tool as ordinary rows, so institutions can enter them (src/engine/risk/standardise.ts ACTIVE_SPECS).
_BM = json.load(open(os.path.join(ROOT, 'src/data/tanzania-benchmark-2026.json')))
for _id, _a in _BM['activations'].items():
    if _id in SPEC:
        SPEC[_id] = {**SPEC[_id], **_a, 'id': _id, 'dimension': SPEC[_id]['dimension'], 'category': SPEC[_id]['category'], 'component': SPEC[_id]['component']}
for _id, _r in _BM['respec'].items():
    if _id in SPEC:
        SPEC[_id] = {**SPEC[_id], 'resolved_min': _r['resolved_min'], 'resolved_max': _r['resolved_max']}
name2id = {s['name']: s['id'] for s in SPEC.values() if s['use'] == 'Yes'}

# ---- the workbook's raw values per unit id ----
baseline = json.load(open(os.path.join(ROOT, 'src/data/inform-baseline-raw.json')))
unit_index = {uid: i for i, uid in enumerate(baseline['units'])}

# ---- council -> workbook unit id (the registry, the same link the engine uses) ----
core = json.load(open(os.path.join(ROOT, 'src/data/tanzania-inform-risk.json')))
unit_id_by_name = {norm(u['admin']['adm2Name']): u['admin']['adm2Code'] for u in core['subnational']['adm2']}
registry = list(csv.DictReader(open(os.path.join(ROOT, 'data-source/council_registry.csv'))))
unit_of = {}
for r in registry:
    uid = unit_id_by_name.get(norm(r['workbook_unit']))
    if uid is None or uid not in unit_index:
        raise SystemExit(f"{r['code']} {r['name']}: workbook unit '{r['workbook_unit']}' is not in the baseline")
    unit_of[r['code']] = uid


def raw_of(uid):
    i = unit_index[uid]
    return {sid: vals[i] for sid, vals in baseline['values'].items() if vals[i] is not None and vals[i] != ''}


# ---- load the blank template, read the column -> indicator-id layout from the header ----
TPL = os.path.join(ROOT, 'inform_sheets/INFORM_TZ_Collection_Tool.xlsx')
wb = openpyxl.load_workbook(TPL)
entry = wb['Council Entry']
HEADR = 10
col_id = {}  # column -> spec id
for col in range(4, entry.max_column + 1):
    nm = entry.cell(1, col).value
    if nm and nm in name2id:
        col_id[col] = name2id[nm]
assert len(col_id) == len(name2id), (len(col_id), len(name2id))

# ---- fill every council row with its own unit's raw values ----
sidecar = {}
filled = cells = 0
for r in range(HEADR + 1, entry.max_row + 1):
    name = entry.cell(r, 2).value
    code = entry.cell(r, 3).value
    if not name:
        continue
    uid = unit_of[code]
    raw = raw_of(uid)
    for col, iid in col_id.items():
        v = raw.get(iid)
        if v is not None:
            entry.cell(r, col, v)  # the workbook's raw value (unlocked input cell)
            cells += 1
    sidecar[code] = {'name': name, 'unit': uid, 'values': raw}
    filled += 1

out = os.path.join(ROOT, 'inform_sheets/INFORM_TZ_Collection_Benchmark.xlsx')
wb.save(out)
side = os.path.join(ROOT, 'data-source/collection_benchmark_values.json')
json.dump(
    {
        'source': 'inform_sheets/INFORM_TZ_Collection_Benchmark.xlsx (Council Entry), filled by scripts/fill-collection-tool.py from src/data/inform-baseline-raw.json through data-source/council_registry.csv',
        'built': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'councils': sidecar,
    },
    open(side, 'w'),
    separators=(',', ':'),
)
print('wrote', out, 'and', side)
print('councils filled:', filled, '/ 195 | raw values written:', cells, '| indicator cols:', len(col_id), '| distinct units:', len(set(unit_of.values())))
