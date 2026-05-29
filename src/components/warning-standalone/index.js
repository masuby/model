/**
 * Warning Standalone System - Exports
 *
 * Main exports for the Hazard Input & PMO Dashboard system
 */

// Main container
import HazardAndPMOSystem from './HazardAndPMOSystem';
export { HazardAndPMOSystem };

// Layer components
export { default as HazardInputPanel } from './layers/HazardInputPanel';
export { default as PMOValidationPanel } from './layers/PMOValidationPanel';

// Map component
export { default as StandaloneHazardMap } from './components/StandaloneHazardMap';

// Services
export * from './services/systemService';

// Configuration data
export * from './data/hazardConfig';
export * from './data/pmoConfig';

// Default export
export default HazardAndPMOSystem;
