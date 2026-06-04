#!/usr/bin/env python3
"""Build src/data/inform-advanced-spec.json (the exploded multi-source sub-indicators) for the ENGINE,
from data-source/inform_advanced_spec.csv. Same shape the engine's computeFromRaw expects."""
import csv, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(ROOT, 'data-source/inform_advanced_spec.csv'))))
out = {}
for r in rows:
    out[r['id']] = {
        'id': r['id'], 'dimension': r['dimension'], 'category': r['category'], 'component': r['component'],
        'sector': r['sector'], 'name': r['name'], 'unit': r['unit'], 'transform': r['transform'] or 'None',
        'resolved_min': float(r['resolved_min']), 'resolved_max': float(r['resolved_max']),
        'sign': r['sign'], 'weight': float(r['weight']), 'use': 'Yes', 'outlier': 'No',
        'denominator': 'None', 'basis': r.get('basis', ''),
    }
p = os.path.join(ROOT, 'src/data/inform-advanced-spec.json')
json.dump(out, open(p, 'w'), indent=2)
print('wrote', p, '|', len(out), 'exploded sub-indicators across', len({v['component'] for v in out.values()}), 'components')
