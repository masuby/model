// Test script for INFORM calculation engine
import {
  calculateINFORMRisk,
  informScaledGeomean,
  classifyRisk,
  COMPLETE_HIERARCHY,
  ALL_INDICATORS
} from './src/services/informCalculationEngine.js';

console.log('=== INFORM CALCULATION ENGINE TEST ===\n');

// Test 1: Check indicator count
const indicatorCount = Object.keys(ALL_INDICATORS).length;
console.log('1. Indicator Count: ' + indicatorCount);
if (indicatorCount !== 78) {
  console.log('   WARNING: Expected 78, got ' + indicatorCount);
} else {
  console.log('   ✅ Correct!');
}

// Test 2: Test informScaledGeomean function
console.log('\n2. Testing informScaledGeomean (Excel formula):');
const testValues = [5, 5];
const geomResult = informScaledGeomean(testValues);
console.log('   Input: [5, 5] => Result: ' + (geomResult ? geomResult.toFixed(2) : 'null'));
if (geomResult && Math.abs(geomResult - 5) < 0.01) {
  console.log('   ✅ Matches expected value of 5.0');
} else {
  console.log('   WARNING: Expected ~5.0');
}

// Test 3: Test with different values
const testValues2 = [3, 7];
const geomResult2 = informScaledGeomean(testValues2);
console.log('   Input: [3, 7] => Result: ' + (geomResult2 ? geomResult2.toFixed(2) : 'null'));

// Test 4: Full calculation test with sample data
console.log('\n3. Testing full INFORM Risk calculation:');
const sampleIndicators = {
  // HAZARD indicators
  flood_exposure: { value: 6.5 },
  drought_exposure: { value: 5.0 },
  conflict_barometer: { value: 3.0 },

  // VULNERABILITY indicators
  hdi: { value: 4.5 },
  multidimensional_poverty: { value: 6.0 },
  food_insufficient: { value: 5.5 },
  internal_displaced: { value: 4.0 },

  // COPING CAPACITY indicators
  health_expenditure_capita: { value: 3.5 },
  basic_sanitation: { value: 4.0 },
  government_effectiveness: { value: 5.0 },
  sendai_framework: { value: 4.5 }
};

const result = calculateINFORMRisk(sampleIndicators);
const dims = result.dimensions || {};
console.log('   Hazard Score: ' + (dims.HAZARD ? dims.HAZARD.score : 'null'));
console.log('   Vulnerability Score: ' + (dims.VULNERABILITY ? dims.VULNERABILITY.score : 'null'));
console.log('   Lack of Coping Capacity: ' + (dims.COPING_CAPACITY ? dims.COPING_CAPACITY.score : 'null'));
console.log('   Final RISK Score: ' + result.risk);
console.log('   Risk Class: ' + (result.classification ? result.classification.label : 'null'));
console.log('   Coverage: ' + (result.metadata ? result.metadata.coverage : 0) + '%');

if (result.risk !== null) {
  console.log('   ✅ Calculation completed successfully!');
} else {
  console.log('   WARNING: Calculation returned null risk');
}

// Test 5: Check hierarchy structure
console.log('\n4. Checking hierarchy structure:');
const dimNames = Object.keys(COMPLETE_HIERARCHY);
console.log('   Dimensions: ' + dimNames.join(', '));
let totalComponents = 0;
for (const dim of dimNames) {
  const cats = Object.keys(COMPLETE_HIERARCHY[dim].categories);
  for (const cat of cats) {
    const comps = Object.keys(COMPLETE_HIERARCHY[dim].categories[cat].components);
    totalComponents += comps.length;
  }
}
console.log('   Total Components: ' + totalComponents);
if (totalComponents === 32) {
  console.log('   ✅ Component count correct (32)');
} else {
  console.log('   WARNING: Expected 32 components, got ' + totalComponents);
}

// Test 6: Verify Excel code mapping
console.log('\n5. Checking Excel code mapping:');
import { EXCEL_CODE_MAP } from './src/services/informIndicatorDefinitions.js';
const excelCodeCount = Object.keys(EXCEL_CODE_MAP).length;
console.log('   Excel codes mapped: ' + excelCodeCount);
if (excelCodeCount === indicatorCount) {
  console.log('   ✅ All indicators have Excel code mapping');
} else {
  console.log('   WARNING: Mismatch - ' + indicatorCount + ' indicators vs ' + excelCodeCount + ' Excel codes');
}

console.log('\n=== TEST COMPLETE ===');
