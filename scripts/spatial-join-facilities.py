import geopandas as gpd, json, sys
GDB='tcvmp/TANZANIA_2022_POST_PHC_GEODATABASE/commondata/tanzania_2022phc_geodatabase.gdb'
dist = gpd.read_file('inform/src/data/tanzania-districts.json')
if dist.crs is None: dist.set_crs(4326, inplace=True)
dist = dist.to_crs(4326)[['dist_name','reg_name','geometry']]
out = {}
for layer,key in [('Health_Facilities','health'),('Education_Facilities','education'),('Water_Facilities','water'),('Boreholes','boreholes')]:
    try:
        pts = gpd.read_file(GDB, layer=layer).to_crs(4326)
        pts = pts[pts.geometry.notna()]
        j = gpd.sjoin(pts[['geometry']], dist, predicate='within', how='inner')
        g = j.groupby(['dist_name','reg_name']).size()
        for (dn,rn),c in g.items():
            out.setdefault(f"{dn}|{rn}", {})[key] = int(c)
        print(f"{layer}: {len(pts)} pts -> joined {len(j)}", file=sys.stderr)
    except Exception as e:
        print(f"{layer} ERR {e}", file=sys.stderr)
json.dump(out, open('/tmp/facility_counts.json','w'))
print("districts with counts:", len(out), file=sys.stderr)
