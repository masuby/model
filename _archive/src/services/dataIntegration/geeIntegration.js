/**
 * GOOGLE EARTH ENGINE INTEGRATION
 *
 * Integration module for Google Earth Engine
 * Provides access to global datasets for INFORM risk calculation
 *
 * Note: This module provides the configuration and helper functions.
 * Actual GEE computation requires a backend server with ee Python/Node SDK.
 */

// ============================================================================
// GEE CONFIGURATION
// ============================================================================

const GEE_CONFIG = {
  // Tanzania bounding box
  TANZANIA_BOUNDS: {
    west: 29.2,
    south: -11.8,
    east: 40.6,
    north: -0.9
  },

  // Default computation parameters
  DEFAULT_SCALE: 1000, // meters
  MAX_PIXELS: 1e9,

  // API endpoints (if using a GEE backend service)
  apiEndpoint: import.meta.env?.VITE_GEE_API_URL || null
};

// ============================================================================
// GEE DATASET DEFINITIONS
// ============================================================================

/**
 * Global datasets available in Google Earth Engine
 * These can be used for INFORM calculations
 */
export const GEE_DATASETS = {
  // Population datasets
  WORLDPOP: {
    id: 'WorldPop/GP/100m/pop',
    name: 'WorldPop Population',
    description: 'High-resolution global population data',
    category: 'exposure',
    informIndicator: 'population',
    resolution: 100, // meters
    unit: 'people',
    temporalCoverage: '2000-2020',
    filter: { country: 'TZA' },
    bands: ['population'],
    scale: [0, 10000]
  },

  GHSL_POP: {
    id: 'JRC/GHSL/P2023A/GHS_POP',
    name: 'Global Human Settlement Layer Population',
    description: 'Population grids from JRC',
    category: 'exposure',
    informIndicator: 'population',
    resolution: 100,
    unit: 'people',
    temporalCoverage: '1975-2030',
    bands: ['population_count'],
    scale: [0, 50000]
  },

  // Elevation & Terrain
  SRTM: {
    id: 'USGS/SRTMGL1_003',
    name: 'SRTM Digital Elevation',
    description: 'Shuttle Radar Topography Mission 30m DEM',
    category: 'hazard',
    informIndicator: 'terrain',
    resolution: 30,
    unit: 'meters',
    bands: ['elevation'],
    scale: [0, 5895] // Mt Kilimanjaro
  },

  ALOS_DEM: {
    id: 'JAXA/ALOS/AW3D30/V3_2',
    name: 'ALOS World 3D - 30m',
    description: 'JAXA ALOS PRISM DEM',
    category: 'hazard',
    informIndicator: 'terrain',
    resolution: 30,
    unit: 'meters',
    bands: ['DSM'],
    scale: [0, 6000]
  },

  // Land Cover
  MODIS_LANDCOVER: {
    id: 'MODIS/006/MCD12Q1',
    name: 'MODIS Land Cover',
    description: 'Annual global land cover classification',
    category: 'exposure',
    informIndicator: 'land_use',
    resolution: 500,
    unit: 'class',
    bands: ['LC_Type1'],
    temporalCoverage: '2001-present',
    classes: {
      1: 'Evergreen Needleleaf Forest',
      2: 'Evergreen Broadleaf Forest',
      3: 'Deciduous Needleleaf Forest',
      4: 'Deciduous Broadleaf Forest',
      5: 'Mixed Forests',
      6: 'Closed Shrublands',
      7: 'Open Shrublands',
      8: 'Woody Savannas',
      9: 'Savannas',
      10: 'Grasslands',
      11: 'Permanent Wetlands',
      12: 'Croplands',
      13: 'Urban',
      14: 'Cropland/Natural Vegetation',
      15: 'Snow and Ice',
      16: 'Barren',
      17: 'Water Bodies'
    }
  },

  ESA_WORLDCOVER: {
    id: 'ESA/WorldCover/v200',
    name: 'ESA WorldCover 10m',
    description: '10m resolution global land cover',
    category: 'exposure',
    informIndicator: 'land_use',
    resolution: 10,
    unit: 'class',
    bands: ['Map'],
    temporalCoverage: '2021'
  },

  // Night-time Lights (Economic proxy)
  VIIRS_NIGHTLIGHTS: {
    id: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG',
    name: 'VIIRS Nighttime Lights',
    description: 'Monthly nighttime radiance composite',
    category: 'coping',
    informIndicator: 'economic_activity',
    resolution: 463,
    unit: 'nanoWatts/cm2/sr',
    bands: ['avg_rad'],
    temporalCoverage: '2012-present',
    scale: [0, 100]
  },

  // Soil & Agriculture
  SMAP_SOIL: {
    id: 'NASA/SMAP/SPL4SMGP/007',
    name: 'SMAP L4 Soil Moisture',
    description: 'NASA SMAP soil moisture data',
    category: 'hazard',
    informIndicator: 'drought',
    resolution: 9000,
    unit: 'm3/m3',
    bands: ['sm_surface', 'sm_rootzone'],
    temporalCoverage: '2015-present',
    scale: [0, 0.5]
  },

  // Precipitation
  CHIRPS: {
    id: 'UCSB-CHG/CHIRPS/DAILY',
    name: 'CHIRPS Daily Rainfall',
    description: 'Climate Hazards Group InfraRed Precipitation',
    category: 'hazard',
    informIndicator: 'flood',
    resolution: 5566,
    unit: 'mm/day',
    bands: ['precipitation'],
    temporalCoverage: '1981-present',
    scale: [0, 100]
  },

  ERA5_TEMP: {
    id: 'ECMWF/ERA5_LAND/MONTHLY_AGGR',
    name: 'ERA5-Land Monthly Temperature',
    description: 'ECMWF ERA5 reanalysis climate data',
    category: 'hazard',
    informIndicator: 'temperature',
    resolution: 11132,
    unit: 'Kelvin',
    bands: ['temperature_2m'],
    temporalCoverage: '1950-present',
    scale: [273, 323] // 0°C to 50°C
  },

  // Flood & Water
  JRC_WATER: {
    id: 'JRC/GSW1_4/GlobalSurfaceWater',
    name: 'JRC Global Surface Water',
    description: 'Water occurrence and change mapping',
    category: 'hazard',
    informIndicator: 'flood',
    resolution: 30,
    unit: 'percentage',
    bands: ['occurrence', 'change_abs', 'seasonality'],
    temporalCoverage: '1984-2021',
    scale: [0, 100]
  },

  // Fire
  MODIS_FIRE: {
    id: 'MODIS/061/MCD64A1',
    name: 'MODIS Burned Area',
    description: 'Monthly burned area product',
    category: 'hazard',
    informIndicator: 'wildfire',
    resolution: 500,
    unit: 'binary',
    bands: ['BurnDate'],
    temporalCoverage: '2000-present'
  },

  FIRMS: {
    id: 'FIRMS',
    name: 'MODIS Active Fires',
    description: 'Near real-time active fire detections',
    category: 'hazard',
    informIndicator: 'wildfire',
    resolution: 1000,
    unit: 'count',
    temporalCoverage: '2000-present'
  },

  // Vegetation Health
  MODIS_NDVI: {
    id: 'MODIS/061/MOD13Q1',
    name: 'MODIS NDVI',
    description: '16-day vegetation indices',
    category: 'vulnerability',
    informIndicator: 'food_security',
    resolution: 250,
    unit: 'index',
    bands: ['NDVI'],
    temporalCoverage: '2000-present',
    scale: [-2000, 10000] // Raw values, divide by 10000
  }
};

// ============================================================================
// GEE COMPUTATION RECIPES
// ============================================================================

/**
 * Pre-defined computation recipes for INFORM indicators
 * These are templates for GEE server-side processing
 */
export const GEE_RECIPES = {
  // Population exposure by admin unit
  POPULATION_BY_ADMIN: {
    name: 'Population by Administrative Unit',
    datasets: ['WORLDPOP'],
    reducer: 'sum',
    description: 'Calculate total population per admin unit',
    code: `
      var pop = ee.ImageCollection('WorldPop/GP/100m/pop')
        .filter(ee.Filter.eq('country', 'TZA'))
        .mosaic();
      var adminUnits = ee.FeatureCollection('users/yourname/tz_districts');
      var result = pop.reduceRegions({
        collection: adminUnits,
        reducer: ee.Reducer.sum(),
        scale: 1000
      });
      return result;
    `
  },

  // Flood risk index
  FLOOD_RISK_INDEX: {
    name: 'Flood Risk Index',
    datasets: ['JRC_WATER', 'CHIRPS', 'SRTM'],
    reducer: 'mean',
    description: 'Composite flood risk from water occurrence, rainfall, and elevation',
    code: `
      var waterOccurrence = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence');
      var elevation = ee.Image('USGS/SRTMGL1_003');
      var slope = ee.Terrain.slope(elevation);

      // Normalize layers
      var waterNorm = waterOccurrence.divide(100);
      var slopeInv = slope.multiply(-1).add(90).divide(90); // Invert slope

      // Combine for flood susceptibility
      var floodRisk = waterNorm.multiply(0.5)
        .add(slopeInv.multiply(0.3))
        .add(ee.Image.constant(0.2)); // Base risk

      return floodRisk.rename('flood_risk');
    `
  },

  // Drought severity index
  DROUGHT_INDEX: {
    name: 'Drought Severity Index',
    datasets: ['SMAP_SOIL', 'MODIS_NDVI', 'CHIRPS'],
    reducer: 'mean',
    description: 'Drought severity from soil moisture, vegetation, and rainfall anomalies',
    code: `
      var soilMoisture = ee.ImageCollection('NASA/SMAP/SPL4SMGP/007')
        .select('sm_surface')
        .mean();
      var ndvi = ee.ImageCollection('MODIS/061/MOD13Q1')
        .select('NDVI')
        .mean()
        .divide(10000);

      // Calculate anomalies
      var smAnomaly = soilMoisture.subtract(0.25).divide(0.25); // Deviation from mean
      var ndviAnomaly = ndvi.subtract(0.5).divide(0.5);

      // Drought index (higher = more severe)
      var droughtIndex = smAnomaly.multiply(-1).multiply(0.5)
        .add(ndviAnomaly.multiply(-1).multiply(0.5))
        .clamp(-1, 1)
        .add(1)
        .divide(2)
        .multiply(10); // Scale to 0-10

      return droughtIndex.rename('drought_index');
    `
  },

  // Economic activity proxy
  ECONOMIC_PROXY: {
    name: 'Economic Activity Proxy',
    datasets: ['VIIRS_NIGHTLIGHTS'],
    reducer: 'mean',
    description: 'Nighttime lights as proxy for economic activity',
    code: `
      var ntl = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
        .filterDate('2023-01-01', '2023-12-31')
        .select('avg_rad')
        .median();

      // Normalize to 0-10 scale
      var ntlNorm = ntl.clamp(0, 50).divide(5);

      return ntlNorm.rename('economic_activity');
    `
  },

  // INFORM Risk calculation
  INFORM_RISK: {
    name: 'INFORM Risk Calculation',
    datasets: ['FLOOD_RISK_INDEX', 'WORLDPOP', 'VIIRS_NIGHTLIGHTS'],
    reducer: 'formula',
    description: 'Calculate INFORM risk using (H×E×V×LCC)^(1/3)',
    code: `
      // This would combine the results of other recipes
      var hazard = floodRisk.add(droughtRisk).divide(2);
      var exposure = populationDensity.divide(1000).clamp(0, 10);
      var vulnerability = ee.Image.constant(5); // From external data
      var lackCoping = economicActivity.multiply(-1).add(10); // Inverse of economic activity

      // INFORM formula
      var risk = hazard.multiply(exposure)
        .multiply(vulnerability)
        .multiply(lackCoping)
        .pow(1/3);

      return risk.rename('inform_risk');
    `
  }
};

// ============================================================================
// GEE CLIENT CLASS
// ============================================================================

/**
 * Google Earth Engine Client
 * Handles communication with GEE backend service
 */
class GEEClient {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || GEE_CONFIG.apiEndpoint;
    this.authenticated = false;
    this.userId = null;
  }

  /**
   * Check if GEE backend is available
   */
  async checkBackend() {
    if (!this.apiEndpoint) {
      return {
        available: false,
        message: 'No GEE backend configured. Set REACT_APP_GEE_API_URL environment variable.'
      };
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/health`);
      if (response.ok) {
        return { available: true, message: 'GEE backend is available' };
      }
      return { available: false, message: `Backend returned ${response.status}` };
    } catch (error) {
      return { available: false, message: error.message };
    }
  }

  /**
   * Get available datasets
   */
  getAvailableDatasets() {
    return Object.entries(GEE_DATASETS).map(([id, dataset]) => ({
      id,
      ...dataset
    }));
  }

  /**
   * Get datasets by category
   */
  getDatasetsByCategory(category) {
    return Object.entries(GEE_DATASETS)
      .filter(([_, dataset]) => dataset.category === category)
      .map(([id, dataset]) => ({ id, ...dataset }));
  }

  /**
   * Get dataset info
   */
  getDatasetInfo(datasetId) {
    return GEE_DATASETS[datasetId] || null;
  }

  /**
   * Request computation from backend
   */
  async compute(recipe, params = {}) {
    if (!this.apiEndpoint) {
      throw new Error('GEE backend not configured');
    }

    const response = await fetch(`${this.apiEndpoint}/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipe,
        params: {
          bounds: GEE_CONFIG.TANZANIA_BOUNDS,
          scale: params.scale || GEE_CONFIG.DEFAULT_SCALE,
          ...params
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Computation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get map tiles URL for a dataset
   */
  async getMapTilesUrl(datasetId, options = {}) {
    if (!this.apiEndpoint) {
      // Return placeholder for development
      return {
        url: null,
        message: 'GEE backend required for map tiles'
      };
    }

    const response = await fetch(`${this.apiEndpoint}/tiles/${datasetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bounds: GEE_CONFIG.TANZANIA_BOUNDS,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get tiles: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Export data to GeoJSON
   */
  async exportToGeoJSON(datasetId, adminBoundaries, options = {}) {
    if (!this.apiEndpoint) {
      throw new Error('GEE backend required for export');
    }

    const response = await fetch(`${this.apiEndpoint}/export/geojson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset: datasetId,
        boundaries: adminBoundaries,
        reducer: options.reducer || 'mean',
        scale: options.scale || GEE_CONFIG.DEFAULT_SCALE
      })
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get INFORM indicator mapping for GEE datasets
 */
export function getINFORMMapping() {
  const mapping = {};

  Object.entries(GEE_DATASETS).forEach(([id, dataset]) => {
    if (dataset.informIndicator) {
      if (!mapping[dataset.informIndicator]) {
        mapping[dataset.informIndicator] = [];
      }
      mapping[dataset.informIndicator].push({
        datasetId: id,
        datasetName: dataset.name,
        category: dataset.category
      });
    }
  });

  return mapping;
}

/**
 * Get computation recipe
 */
export function getRecipe(recipeName) {
  return GEE_RECIPES[recipeName] || null;
}

/**
 * List available recipes
 */
export function listRecipes() {
  return Object.entries(GEE_RECIPES).map(([id, recipe]) => ({
    id,
    name: recipe.name,
    description: recipe.description,
    datasets: recipe.datasets
  }));
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let geeClientInstance = null;

export function getGEEClient(options = {}) {
  if (!geeClientInstance) {
    geeClientInstance = new GEEClient(options);
  }
  return geeClientInstance;
}

export function resetGEEClient() {
  geeClientInstance = null;
}

export default GEEClient;
export { GEE_CONFIG };
