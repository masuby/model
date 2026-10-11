import json, glob, sys, numpy as np, geopandas as gpd, rasterio
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from rasterio.merge import merge
from rasterio.mask import mask
ROOT='/home/kaijage/model/inform'; SC=sys.argv[1]
cj=json.load(open(f'{ROOT}/src/data/tanzania-councils.json'))
g=gpd.GeoDataFrame.from_features(cj['features'], crs='EPSG:4326')
wb=json.load(open(f'{ROOT}/src/data/tanzania-waterbodies.json'))
ocean=shape(next(f['geometry'] for f in wb['features'] if f['properties'].get('name')=='Indian Ocean'))
UTM='EPSG:32737'
gu=g.to_crs(UTM); ocean_u=gpd.GeoSeries([ocean], crs='EPSG:4326').to_crs(UTM).iloc[0]
gu['area_km2']=gu.geometry.area/1e6
coast_line=ocean_u.boundary
gu['dist_m']=gu.geometry.distance(ocean_u)
coastal=gu[gu['dist_m']<500].copy()
print('coastal councils:', len(coastal))
# coastline length: council boundary within 150 m of the ocean boundary
band=coast_line.buffer(150)
coastal['coast_km']=coastal.geometry.boundary.intersection(band).length/1000
b5=ocean_u.buffer(5000); b25=ocean_u.buffer(25000)
coastal['within5km_pct']=coastal.geometry.intersection(b5).area/coastal.geometry.area*100
# DEM mosaic (GLO-90)
tiles=sorted(glob.glob(f'{SC}/dl/dem/*.tif'))
srcs=[rasterio.open(t) for t in tiles]
mosaic, tr = merge(srcs)
meta=srcs[0].meta.copy(); meta.update(height=mosaic.shape[1], width=mosaic.shape[2], transform=tr)
tmp=f'{SC}/dl/dem/_mosaic.tif'
with rasterio.open(tmp,'w',**meta) as dst: dst.write(mosaic)
dem=rasterio.open(tmp)
coastal_wgs=coastal.to_crs('EPSG:4326'); b25_wgs=gpd.GeoSeries([b25], crs=UTM).to_crs('EPSG:4326').iloc[0]
lecz=[]
for idx,row in coastal_wgs.iterrows():
    geom=row.geometry.intersection(b25_wgs)
    try:
        arr,_=mask(dem,[mapping(row.geometry)],crop=True,nodata=-9999)
        a=arr[0]; land=np.isfinite(a)&(a>-9999)
        n_land=land.sum()
        arrz,_=mask(dem,[mapping(geom)],crop=True,nodata=-9999) if not geom.is_empty else (np.full((1,1,1),-9999.0),None)
        z=arrz[0]; low=((z>-9999)&(z<=10)).sum()
        lecz.append(100*low/n_land if n_land else 0)
    except Exception as e:
        lecz.append(float('nan')); print('err', row['name'], e)
coastal['lecz10_pct']=lecz
out=coastal[['code','name','reg','area_km2','coast_km','within5km_pct','lecz10_pct']].copy()
out=out.sort_values('coast_km', ascending=False)
import os; os.makedirs(f'{SC}/data', exist_ok=True)
out.to_csv(f'{SC}/data/coastal_exposure.csv', index=False, float_format='%.2f')
print(out.to_string())
