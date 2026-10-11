import sys, json, numpy as np, netCDF4 as nc, geopandas as gpd
from rasterio.features import rasterize
from affine import Affine
SC=sys.argv[1]; ROOT='/home/kaijage/model/inform'
d=nc.Dataset(f'{SC}/dl/wglc/wglc_climatology_05m.nc')
print({v:(d.variables[v].dimensions, d.variables[v].shape) for v in d.variables})
lat=d.variables['lat'][:]; lon=d.variables['lon'][:]
dens_name=[v for v in d.variables if 'dens' in v.lower()][0]
var=d.variables[dens_name]; print('using', dens_name, getattr(var,'units',''), getattr(var,'long_name',''))
# Tanzania window
la=np.where((lat>=-12.5)&(lat<=-0.5))[0]; lo=np.where((lon>=29)&(lon<=41))[0]
sub=var[..., la.min():la.max()+1, lo.min():lo.max()+1]
sub=np.ma.filled(sub, np.nan).astype(float)
# the climatology is a mean daily stroke density per calendar month (strokes km-2 d-1): the annual
# density is the sum over the months of density x days in the month (365-day calendar)
DAYS=np.array([31,28,31,30,31,30,31,31,30,31,30,31], dtype=float)
if sub.ndim==3 and sub.shape[0]==12: annual=np.nansum(sub*DAYS[:,None,None],axis=0)
elif sub.ndim==3: annual=np.nanmean(sub,axis=0)*365.0
else: annual=sub
print('annual grid', annual.shape, 'nanmax', np.nanmax(annual), 'nanmean', np.nanmean(annual))
lats=lat[la]; lons=lon[lo]; dlat=abs(float(lats[1]-lats[0])); dlon=abs(float(lons[1]-lons[0]))
north=float(lats.max())+dlat/2 if lats[0]<lats[-1] else float(lats[0])+dlat/2
if lats[0]<lats[-1]: annual=annual[::-1,:]; lats=lats[::-1]
tr=Affine(dlon,0,float(lons.min())-dlon/2, 0,-dlat, float(lats.max())+dlat/2)
cj=json.load(open(f'{ROOT}/src/data/tanzania-councils.json')); g=gpd.GeoDataFrame.from_features(cj['features'], crs='EPSG:4326')
out=[]
for i,row in g.iterrows():
    m=rasterize([(row.geometry,1)], out_shape=annual.shape, transform=tr, fill=0, all_touched=True).astype(bool)
    vals=annual[m]; vals=vals[np.isfinite(vals)]
    out.append((row['code'],row['name'],row['reg'], float(np.mean(vals)) if vals.size else float('nan'), int(vals.size)))
import csv
with open(f'{SC}/data/lightning_wglc.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['code','name','reg','strokes_per_km2_yr','cells']); 
    for o in out: w.writerow([o[0],o[1],o[2],round(o[3],3),o[4]])
out.sort(key=lambda x:-x[3])
print('TOP 20:', [(o[1],o[2],round(o[3],2)) for o in out[:20]])
print('BOTTOM 10:', [(o[1],o[2],round(o[3],2)) for o in out[-10:]])
for key in ('Kinondoni','Dodoma City','Arusha City','Sumbawanga','Kigoma Ujiji','Mbeya City','Njombe Town','Iringa Municipal','Bukoba Municipal','Mwanza','Ilemela','Musoma Municipal','Geita Town','Songea Municipal','Tabora Municipal','Mtwara Mikindani'):
    for o in out:
        if o[1].startswith(key): print(o[1], o[2], round(o[3],2))
