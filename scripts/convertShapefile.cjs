/**
 * Convert Shapefile to GeoJSON
 * Usage: node scripts/convertShapefile.cjs
 */

const shapefile = require('shapefile');
const fs = require('fs');
const path = require('path');

async function convertShapefile(shpPath, outputPath) {
  try {
    console.log(`Converting ${shpPath}...`);

    const features = [];
    const source = await shapefile.open(shpPath);

    while (true) {
      const result = await source.read();
      if (result.done) break;
      features.push(result.value);
    }

    const geojson = {
      type: 'FeatureCollection',
      features: features
    };

    // Write to output
    fs.writeFileSync(outputPath, JSON.stringify(geojson));
    console.log(`✅ Saved to ${outputPath} (${features.length} features)`);

    return geojson;
  } catch (error) {
    console.error(`Error converting ${shpPath}:`, error.message);
    throw error;
  }
}

async function main() {
  const GIS_MAPS_DIR = '/home/kaijage/tanzania_climate_clip/GIS_Maps';
  const OUTPUT_DIR = '/home/kaijage/model/inform/masuby-model/public/geojson';

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Convert Water_Body
  await convertShapefile(
    path.join(GIS_MAPS_DIR, 'Water_Body.shp'),
    path.join(OUTPUT_DIR, 'Water_Body.geojson')
  );

  // Convert International_Boundary
  await convertShapefile(
    path.join(GIS_MAPS_DIR, 'International_Boundary.shp'),
    path.join(OUTPUT_DIR, 'International_Boundary.geojson')
  );

  // Convert Regions
  await convertShapefile(
    path.join(GIS_MAPS_DIR, 'Regions.shp'),
    path.join(OUTPUT_DIR, 'Regions.geojson')
  );

  // Convert Districts
  await convertShapefile(
    path.join(GIS_MAPS_DIR, 'Districts.shp'),
    path.join(OUTPUT_DIR, 'Districts_GIS.geojson')
  );

  console.log('\n✅ All shapefiles converted successfully!');
}

main().catch(console.error);
