#!/usr/bin/env python3
"""
fill-advanced-tool.py - populate the ADVANCED tool with the Advancement layer's inputs to create the
advanced BENCHMARK. The values are those of src/data/tanzania-advanced-inputs.json (one source of truth,
built by scripts/build-advanced-inputs.py with the provenance of every member); only sub-indicators with
data are filled, every other cell is left BLANK (the no-bias design skips it). The DRM-arrangements
member, which the engine counts from each council's record, is prefilled from the Core dataset's
recorded arrangements (the PMO-DMD list) so the benchmark matches what the site shows.

Output: inform_sheets/INFORM_TZ_Advanced_Benchmark.xlsx
"""
import csv
import json
import os

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    return ''.join(ch for ch in str(s).lower() if ch.isalnum())


adv = list(csv.DictReader(open(os.path.join(ROOT, 'data-source/inform_advanced_spec.csv'))))
name2id = {a['name']: a['id'] for a in adv}
inputs = json.load(open(os.path.join(ROOT, 'src/data/tanzania-advanced-inputs.json')))
values = inputs['values']

# the DRM member: count of the arrangements recorded for the council's workbook unit (EPRP, AA, EOCC, ERT, RVCA)
core = json.load(open(os.path.join(ROOT, 'src/data/tanzania-inform-risk.json')))
unit_by_name = {norm(u['admin']['adm2Name']): u for u in core['subnational']['adm2']}
registry = list(csv.DictReader(open(os.path.join(ROOT, 'data-source/council_registry.csv'))))
DRR = 'CC.INS.DRR-STAT'


def drr_count(code):
    r = next((x for x in registry if x['code'] == code), None)
    u = unit_by_name.get(norm(r['workbook_unit'])) if r else None
    d = (u or {}).get('drr')
    if not d:
        return None
    return sum(1 for k in ('eprp', 'aa', 'eocc', 'ert', 'rvca') if d.get(k) is True)


# ---- load template, map column -> advanced id (header row 1 = name) ----
TPL = os.path.join(ROOT, 'inform_sheets/INFORM_TZ_Advanced_Tool.xlsx')
wb = openpyxl.load_workbook(TPL)
e = wb['Advanced Entry']
HEADR = 10
col_id = {c: name2id[e.cell(1, c).value] for c in range(4, e.max_column + 1) if e.cell(1, c).value in name2id}
assert len(col_id) == len(adv), (len(col_id), len(adv))

filled = cells = 0
bycount = {}
for r in range(HEADR + 1, e.max_row + 1):
    name = e.cell(r, 2).value
    code = e.cell(r, 3).value
    if not name:
        continue
    vals = dict(values.get(code, {}))
    n = drr_count(code)
    if n is not None:
        vals[DRR] = n
    if vals:
        filled += 1
    for col, iid in col_id.items():
        if iid in vals and vals[iid] is not None:
            e.cell(r, col, vals[iid])
            cells += 1
            bycount[iid] = bycount.get(iid, 0) + 1

out = os.path.join(ROOT, 'inform_sheets/INFORM_TZ_Advanced_Benchmark.xlsx')
wb.save(out)
print('wrote', out)
print('councils with >=1 value:', filled, '/ 195 | cells written:', cells, '| release', inputs['release'])
id2name = {v: k for k, v in name2id.items()}
for iid, n in sorted(bycount.items()):
    print('  %-18s %-40s %d councils' % (iid, id2name[iid][:40], n))
