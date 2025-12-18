/**
 * Clip Water Bodies to Tanzania Boundary
 * Uses Turf.js to intersect water bodies with Tanzania's boundary
 */

const turf = require('@turf/turf');
const fs = require('fs');

async function clipWaterBodies() {
  console.log('🗺️ Loading GeoJSON files...');

  // Load water bodies
  const waterBodies = JSON.parse(
    fs.readFileSync('/home/kaijage/model/inform/masuby-model/public/geojson/Water_Body.geojson', 'utf8')
  );
  console.log(`  Water bodies: ${waterBodies.features.length} features`);

  // Load Tanzania boundary directly (adm0 - clean country outline)
  const tanzaniaGeoJSON = JSON.parse(
    fs.readFileSync('/home/kaijage/model/inform/masuby-model/public/geojson/Tanzania_Country.geojson', 'utf8')
  );
  console.log(`  Tanzania boundary: ${tanzaniaGeoJSON.features.length} features`);

  // Use the first feature as the boundary (it's the full country polygon)
  const tanzaniaBoundary = tanzaniaGeoJSON.features[0];
  console.log('✅ Tanzania boundary loaded');

  // Clip each water body to Tanzania
  console.log('✂️ Clipping water bodies to Tanzania...');
  const clippedFeatures = [];

  for (let i = 0; i < waterBodies.features.length; i++) {
    const waterFeature = waterBodies.features[i];
    try {
      const clipped = turf.intersect(turf.featureCollection([waterFeature, tanzaniaBoundary]));
      if (clipped) {
        // Preserve original properties
        clipped.properties = waterFeature.properties;
        clippedFeatures.push(clipped);
        console.log(`  ✓ Feature ${i + 1}: clipped successfully`);
      } else {
        console.log(`  - Feature ${i + 1}: outside Tanzania, skipped`);
      }
    } catch (e) {
      console.warn(`  ⚠ Feature ${i + 1}: clip failed (${e.message})`);
      // Keep original if clip fails
      clippedFeatures.push(waterFeature);
    }
  }

  // Create output GeoJSON
  const clippedWaterBodies = {
    type: 'FeatureCollection',
    features: clippedFeatures
  };

  // Save clipped water bodies
  const outputPath = '/home/kaijage/model/inform/masuby-model/public/geojson/Water_Body_Clipped.geojson';
  fs.writeFileSync(outputPath, JSON.stringify(clippedWaterBodies));
  console.log(`\n✅ Saved clipped water bodies to ${outputPath}`);
  console.log(`   Original: ${waterBodies.features.length} features`);
  console.log(`   Clipped: ${clippedFeatures.length} features`);
}

clipWaterBodies().catch(console.error);
