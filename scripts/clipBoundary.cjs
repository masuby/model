/**
 * Clip International Boundary Lines to Tanzania
 * Removes any line segments that extend beyond Tanzania's boundary
 */

const turf = require('@turf/turf');
const fs = require('fs');

async function clipBoundary() {
  console.log('🗺️ Loading GeoJSON files...');

  // Load international boundary lines
  const boundaryLines = JSON.parse(
    fs.readFileSync('/home/kaijage/model/inform/masuby-model/public/geojson/International_Boundary_Lines.geojson', 'utf8')
  );
  console.log(`  Boundary lines: ${boundaryLines.features.length} features`);

  // Load Tanzania country polygon (adm0) as the clipping mask
  const tanzaniaGeoJSON = JSON.parse(
    fs.readFileSync('/home/kaijage/model/inform/masuby-model/public/geojson/Tanzania_Country.geojson', 'utf8')
  );
  console.log(`  Tanzania boundary: ${tanzaniaGeoJSON.features.length} features`);

  // Get Tanzania polygon and create a buffer to include boundary lines on the edge
  const tanzaniaPoly = tanzaniaGeoJSON.features[0];
  // Buffer by a small amount (0.01 degrees ~ 1km) to include lines that are exactly on the boundary
  const bufferedTanzania = turf.buffer(tanzaniaPoly, 0.5, { units: 'kilometers' });

  console.log('✂️ Clipping boundary lines to Tanzania...');
  const clippedFeatures = [];

  for (let i = 0; i < boundaryLines.features.length; i++) {
    const lineFeature = boundaryLines.features[i];
    try {
      // Check if line intersects with Tanzania
      if (turf.booleanIntersects(lineFeature, bufferedTanzania)) {
        // Clip the line to Tanzania boundary
        const clipped = turf.lineSplit(lineFeature, bufferedTanzania);

        if (clipped && clipped.features.length > 0) {
          // Keep only segments that are within Tanzania
          for (const segment of clipped.features) {
            const centroid = turf.centroid(segment);
            if (turf.booleanPointInPolygon(centroid, bufferedTanzania)) {
              segment.properties = lineFeature.properties;
              clippedFeatures.push(segment);
            }
          }
          console.log(`  ✓ Feature ${i + 1}: clipped (${clipped.features.length} segments)`);
        } else {
          // If lineSplit doesn't work, check if the whole line is inside
          const centroid = turf.centroid(lineFeature);
          if (turf.booleanPointInPolygon(centroid, bufferedTanzania)) {
            clippedFeatures.push(lineFeature);
            console.log(`  ✓ Feature ${i + 1}: kept entirely`);
          } else {
            console.log(`  - Feature ${i + 1}: outside Tanzania, skipped`);
          }
        }
      } else {
        console.log(`  - Feature ${i + 1}: outside Tanzania, skipped`);
      }
    } catch (e) {
      // If clipping fails, try to keep lines that are mostly within Tanzania
      try {
        const centroid = turf.centroid(lineFeature);
        if (turf.booleanPointInPolygon(centroid, bufferedTanzania)) {
          clippedFeatures.push(lineFeature);
          console.log(`  ⚠ Feature ${i + 1}: kept (centroid inside)`);
        } else {
          console.log(`  - Feature ${i + 1}: skipped (centroid outside)`);
        }
      } catch (e2) {
        console.warn(`  ⚠ Feature ${i + 1}: error (${e.message})`);
      }
    }
  }

  // Create output GeoJSON
  const clippedBoundary = {
    type: 'FeatureCollection',
    features: clippedFeatures
  };

  // Save clipped boundary
  const outputPath = '/home/kaijage/model/inform/masuby-model/public/geojson/International_Boundary_Clipped.geojson';
  fs.writeFileSync(outputPath, JSON.stringify(clippedBoundary));
  console.log(`\n✅ Saved clipped boundary to ${outputPath}`);
  console.log(`   Original: ${boundaryLines.features.length} features`);
  console.log(`   Clipped: ${clippedFeatures.length} features`);
}

clipBoundary().catch(console.error);
