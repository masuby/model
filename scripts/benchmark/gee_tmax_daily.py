"""Daily ERA5-Land 2 m maximum temperature per council (area mean), 1991-2024, via Earth Engine.
Writes one CSV per year: date, C001..C195 (degrees C)."""
import sys, json, csv, os, time
import ee
ee.Initialize(project='ee-bonephaceedson')
ROOT='/home/kaijage/model/inform'; OUT=sys.argv[1]
os.makedirs(OUT, exist_ok=True)
cj=json.load(open(f'{ROOT}/src/data/tanzania-councils.json'))
feats=[ee.Feature(ee.Geometry(f['geometry']), {'code': f['properties']['code']}) for f in cj['features']]
fc=ee.FeatureCollection(feats)
codes=[f['properties']['code'] for f in cj['features']]
col=ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR').select('temperature_2m_max')
y0,y1=int(sys.argv[2]),int(sys.argv[3])
for y in range(y0,y1+1):
    path=f'{OUT}/tmax_{y}.csv'
    if os.path.exists(path): continue
    yc=col.filterDate(f'{y}-01-01', f'{y+1}-01-01')
    def per_image(img):
        d=img.date().format('YYYY-MM-dd')
        red=img.reduceRegions(collection=fc, reducer=ee.Reducer.mean(), scale=11132)
        return red.map(lambda f: ee.Feature(None, {'date': d, 'code': f.get('code'), 'v': f.get('mean')}))
    table=yc.map(per_image).flatten()
    for attempt in range(3):
        try:
            rows=table.reduceColumns(ee.Reducer.toList(3), ['date','code','v']).get('list').getInfo(); break
        except Exception as e:
            print('retry', y, attempt, str(e)[:120]); time.sleep(20)
    else: continue
    by={}
    for d,c,v in rows: by.setdefault(d,{})[c]=v
    with open(path,'w',newline='') as f:
        w=csv.writer(f); w.writerow(['date']+codes)
        for d in sorted(by): w.writerow([d]+[round(by[d].get(c,float('nan'))-273.15,2) if by[d].get(c) is not None else '' for c in codes])
    print(y, len(by), 'days', flush=True)
