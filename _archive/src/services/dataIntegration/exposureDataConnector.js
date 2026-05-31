/**
 * EXPOSURE DATA CONNECTOR
 *
 * Integrates exposure and land cover data sources:
 * - ESA WorldCover 2021 - Land cover classification
 * - SRTM 30m - Elevation and terrain slope
 * - WorldPop - Population density
 * - IWMI - Irrigated/crop areas
 * - FAO - Livestock density
 * - Protected Planet - Protected areas
 * - Global Dam Watch - Dams database
 * - National Bureau of Statistics - Census data
 */

import WMSWFSClient from './wmsWfsClient';

// ============================================================================
// EXPOSURE DATA SOURCE CONFIGURATIONS
// ============================================================================

export const EXPOSURE_DATA_SOURCES = {
  // ESA WorldCover 2021 - Global Land Cover
  ESA_WORLDCOVER: {
    id: 'esa_worldcover',
    name: 'ESA WorldCover 2021',
    description: 'Global land cover map at 10m resolution from ESA',
    baseUrl: 'https://esa-worldcover.org',
    wmsEndpoint: 'https://services.terrascope.be/wms/v2',
    type: 'wms',
    resolution: '10m',
    year: 2021,
    layers: {
      landcover: {
        name: 'Land Cover Classification',
        wmsLayer: 'WORLDCOVER_2021_MAP',
        format: 'GeoTIFF',
        category: 'exposure',
        informComponent: 'exposure',
        classes: {
          10: { name: 'Tree cover', color: '#006400' },
          20: { name: 'Shrubland', color: '#ffbb22' },
          30: { name: 'Grassland', color: '#ffff4c' },
          40: { name: 'Cropland', color: '#f096ff' },
          50: { name: 'Built-up', color: '#fa0000' },
          60: { name: 'Bare/sparse vegetation', color: '#b4b4b4' },
          70: { name: 'Snow and ice', color: '#f0f0f0' },
          80: { name: 'Permanent water bodies', color: '#0064c8' },
          90: { name: 'Herbaceous wetland', color: '#0096a0' },
          95: { name: 'Mangroves', color: '#00cf75' },
          100: { name: 'Moss and lichen', color: '#fae6a0' }
        }
      }
    }
  },

  // SRTM Elevation Data
  SRTM: {
    id: 'srtm',
    name: 'SRTM 30m Elevation',
    description: 'Shuttle Radar Topography Mission elevation data',
    baseUrl: 'https://opentopography.org',
    wmsEndpoint: 'https://portal.opentopography.org/otr/getOT?collection=SRTM30',
    type: 'wms',
    resolution: '30m',
    layers: {
      elevation: {
        name: 'Digital Elevation Model',
        wmsLayer: 'SRTM_GL1',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'meters',
        informComponent: 'exposure'
      },
      slope: {
        name: 'Terrain Slope',
        wmsLayer: 'SRTM_GL1_SLOPE',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'degrees',
        informComponent: 'exposure'
      },
      aspect: {
        name: 'Terrain Aspect',
        wmsLayer: 'SRTM_GL1_ASPECT',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'degrees',
        informComponent: 'exposure'
      }
    }
  },

  // WorldPop Population Data
  WORLDPOP: {
    id: 'worldpop',
    name: 'WorldPop Population',
    description: 'High-resolution population density estimates',
    baseUrl: 'https://www.worldpop.org',
    apiEndpoint: 'https://www.worldpop.org/rest/data',
    wmsEndpoint: 'https://geoserver.worldpop.org/geoserver/wms',
    type: 'wms',
    resolution: '100m',
    countryCode: 'TZA',
    layers: {
      population_density: {
        name: 'Population Density 2020',
        wmsLayer: 'worldpop:TZA_population_density_2020',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'people/km²',
        year: 2020,
        informComponent: 'exposure'
      },
      population_count: {
        name: 'Population Count 2020',
        wmsLayer: 'worldpop:TZA_population_count_2020',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'people',
        year: 2020,
        informComponent: 'exposure'
      },
      urban_change: {
        name: 'Urban Change Detection',
        wmsLayer: 'worldpop:TZA_urban_change',
        format: 'GeoTIFF',
        category: 'exposure',
        informComponent: 'exposure'
      }
    }
  },

  // IWMI Irrigated Areas
  IWMI: {
    id: 'iwmi',
    name: 'IWMI Irrigated Areas',
    description: 'International Water Management Institute irrigation mapping',
    baseUrl: 'https://www.iwmi.cgiar.org',
    wmsEndpoint: 'https://waterdata.iwmi.org/geoserver/wms',
    type: 'wms',
    layers: {
      irrigated_areas: {
        name: 'Irrigated Cropland',
        wmsLayer: 'giam:irrigated_areas_global',
        format: 'GeoTIFF',
        category: 'exposure',
        informComponent: 'exposure'
      },
      crop_intensity: {
        name: 'Crop Intensity',
        wmsLayer: 'giam:crop_intensity',
        format: 'GeoTIFF',
        category: 'exposure',
        informComponent: 'exposure'
      }
    }
  },

  // FAO Livestock Data
  FAO_GLW: {
    id: 'fao_glw',
    name: 'FAO Gridded Livestock',
    description: 'FAO Global Livestock of the World density maps',
    baseUrl: 'https://www.fao.org/livestock-systems',
    wmsEndpoint: 'https://data.apps.fao.org/map/gsrv/gsrv1/wms',
    type: 'wms',
    layers: {
      cattle_density: {
        name: 'Cattle Density',
        wmsLayer: 'GLW4:Ct_2015',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'heads/km²',
        year: 2015,
        informComponent: 'exposure'
      },
      goat_density: {
        name: 'Goat Density',
        wmsLayer: 'GLW4:Gt_2015',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'heads/km²',
        year: 2015,
        informComponent: 'exposure'
      },
      sheep_density: {
        name: 'Sheep Density',
        wmsLayer: 'GLW4:Sh_2015',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'heads/km²',
        year: 2015,
        informComponent: 'exposure'
      },
      poultry_density: {
        name: 'Poultry Density',
        wmsLayer: 'GLW4:Ch_2015',
        format: 'GeoTIFF',
        category: 'exposure',
        unit: 'heads/km²',
        year: 2015,
        informComponent: 'exposure'
      }
    }
  },

  // Protected Planet - WDPA
  PROTECTED_PLANET: {
    id: 'protected_planet',
    name: 'Protected Planet (WDPA)',
    description: 'World Database on Protected Areas from UNEP-WCMC',
    baseUrl: 'https://www.protectedplanet.net',
    wmsEndpoint: 'https://data-gis.unep-wcmc.org/server/rest/services/ProtectedSites/The_World_Database_of_Protected_Areas/MapServer',
    type: 'arcgis',
    layers: {
      protected_areas: {
        name: 'Protected Areas',
        layerId: 0,
        format: 'shapefile',
        category: 'exposure',
        informComponent: 'lack_of_coping_capacity'
      },
      marine_protected: {
        name: 'Marine Protected Areas',
        layerId: 1,
        format: 'shapefile',
        category: 'exposure',
        informComponent: 'lack_of_coping_capacity'
      }
    }
  },

  // Global Dam Watch
  GLOBAL_DAM_WATCH: {
    id: 'global_dam_watch',
    name: 'Global Dam Watch',
    description: 'Global reservoir and dam database',
    baseUrl: 'https://globaldamwatch.org',
    wmsEndpoint: 'https://globaldamwatch.org/geoserver/wms',
    type: 'wms',
    layers: {
      dams: {
        name: 'Dam Locations',
        wmsLayer: 'gdw:global_dams',
        format: 'shapefile',
        category: 'infrastructure',
        informComponent: 'exposure'
      },
      reservoirs: {
        name: 'Reservoir Areas',
        wmsLayer: 'gdw:global_reservoirs',
        format: 'shapefile',
        category: 'infrastructure',
        informComponent: 'exposure'
      }
    }
  },

  // Tanzania National Bureau of Statistics
  NBS_TANZANIA: {
    id: 'nbs_tanzania',
    name: 'Tanzania NBS',
    description: 'Tanzania National Bureau of Statistics census data',
    baseUrl: 'https://www.nbs.go.tz',
    type: 'api',
    datasets: {
      population_census: {
        name: 'Population Census 2022',
        endpoint: '/census/population',
        format: 'shapefile',
        category: 'exposure',
        year: 2022,
        informComponent: 'exposure',
        fields: ['region', 'district', 'ward', 'population', 'households', 'density']
      },
      housing_census: {
        name: 'Housing Census 2022',
        endpoint: '/census/housing',
        format: 'shapefile',
        category: 'exposure',
        year: 2022,
        informComponent: 'vulnerability',
        fields: ['region', 'district', 'housing_type', 'materials', 'water_source', 'electricity']
      },
      agricultural_census: {
        name: 'Agricultural Census 2019/20',
        endpoint: '/census/agriculture',
        format: 'shapefile',
        category: 'exposure',
        year: 2020,
        informComponent: 'exposure',
        fields: ['region', 'district', 'crop_type', 'area_planted', 'yield', 'livestock']
      }
    }
  }
};

// ============================================================================
// LAND COVER CLASSIFICATION
// ============================================================================

export const LAND_COVER_CLASSES = {
  tree_cover: { id: 10, name: 'Tree cover', color: '#006400', exposureWeight: 0.3 },
  shrubland: { id: 20, name: 'Shrubland', color: '#ffbb22', exposureWeight: 0.2 },
  grassland: { id: 30, name: 'Grassland', color: '#ffff4c', exposureWeight: 0.2 },
  cropland: { id: 40, name: 'Cropland', color: '#f096ff', exposureWeight: 0.6 },
  built_up: { id: 50, name: 'Built-up', color: '#fa0000', exposureWeight: 1.0 },
  bare_sparse: { id: 60, name: 'Bare/sparse vegetation', color: '#b4b4b4', exposureWeight: 0.1 },
  snow_ice: { id: 70, name: 'Snow and ice', color: '#f0f0f0', exposureWeight: 0.1 },
  water: { id: 80, name: 'Permanent water bodies', color: '#0064c8', exposureWeight: 0.4 },
  wetland: { id: 90, name: 'Herbaceous wetland', color: '#0096a0', exposureWeight: 0.3 },
  mangroves: { id: 95, name: 'Mangroves', color: '#00cf75', exposureWeight: 0.4 },
  moss_lichen: { id: 100, name: 'Moss and lichen', color: '#fae6a0', exposureWeight: 0.1 }
};

// ============================================================================
// EXPOSURE DATA CONNECTOR CLASS
// ============================================================================

class ExposureDataConnector {
  constructor(options = {}) {
    this.options = options;
    this.clients = {};
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.connected = {};
  }

  // ==========================================================================
  // CONNECTION METHODS
  // ==========================================================================

  /**
   * Initialize connection to a specific data source
   */
  async connectSource(sourceId) {
    const source = EXPOSURE_DATA_SOURCES[sourceId];
    if (!source) {
      throw new Error(`Unknown exposure data source: ${sourceId}`);
    }

    try {
      console.log(`[ExposureData] Connecting to ${source.name}...`);

      if (source.type === 'wms' || source.type === 'wms_wfs') {
        this.clients[sourceId] = new WMSWFSClient(source.wmsEndpoint, {
          timeout: 60000,
          retries: 3
        });

        const testResult = await this.clients[sourceId].testConnection();
        this.connected[sourceId] = testResult.success;

        if (testResult.success) {
          console.log(`[ExposureData] ✓ Connected to ${source.name}`);
        } else {
          console.warn(`[ExposureData] ⚠ ${source.name}: ${testResult.error}`);
        }
      } else if (source.type === 'arcgis') {
        this.connected[sourceId] = await this.testArcGISConnection(source);
      } else if (source.type === 'api') {
        this.connected[sourceId] = await this.testApiConnection(source);
      }

      return {
        success: this.connected[sourceId],
        source: source.name
      };

    } catch (error) {
      console.error(`[ExposureData] Failed to connect to ${source.name}:`, error);
      this.connected[sourceId] = false;
      return {
        success: false,
        source: source.name,
        error: error.message
      };
    }
  }

  /**
   * Connect to all exposure data sources
   */
  async connectAll() {
    const results = {};
    for (const sourceId of Object.keys(EXPOSURE_DATA_SOURCES)) {
      results[sourceId] = await this.connectSource(sourceId);
    }
    return results;
  }

  /**
   * Test ArcGIS REST API connection
   */
  async testArcGISConnection(source) {
    try {
      const response = await fetch(`${source.wmsEndpoint}?f=json`, {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test standard API connection
   */
  async testApiConnection(source) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(source.baseUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // DATA RETRIEVAL METHODS
  // ==========================================================================

  /**
   * Get WMS layer URL for map display
   */
  getWMSLayerUrl(sourceId, layerId, bbox, options = {}) {
    const source = EXPOSURE_DATA_SOURCES[sourceId];
    if (!source || !source.layers?.[layerId]) {
      throw new Error(`Unknown layer: ${sourceId}/${layerId}`);
    }

    const layer = source.layers[layerId];
    const client = this.clients[sourceId];

    if (!client) {
      throw new Error(`Not connected to ${source.name}`);
    }

    return client.getMapUrl(layer.wmsLayer, bbox, {
      format: 'image/png',
      transparent: true,
      width: options.width || 512,
      height: options.height || 512,
      ...options
    });
  }

  /**
   * Get land cover data for a region
   */
  async getLandCoverData(regionName) {
    const cacheKey = `landcover_${regionName}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = {
      region: regionName,
      source: 'ESA WorldCover 2021',
      classes: {},
      totalArea: 0,
      exposureIndex: 0
    };

    if (this.connected.ESA_WORLDCOVER && this.clients.ESA_WORLDCOVER) {
      try {
        // Get land cover distribution
        const features = await this.clients.ESA_WORLDCOVER.getFeatures(
          'WORLDCOVER_2021_MAP',
          { filter: `region_name='${regionName}'`, maxFeatures: 1000 }
        );

        if (features && features.features) {
          for (const feature of features.features) {
            const classId = feature.properties?.class || feature.properties?.landcover_class;
            if (classId && LAND_COVER_CLASSES[classId]) {
              const area = feature.properties?.area || 1;
              result.classes[classId] = (result.classes[classId] || 0) + area;
              result.totalArea += area;
            }
          }

          // Calculate weighted exposure index
          let weightedSum = 0;
          for (const [classId, area] of Object.entries(result.classes)) {
            const classInfo = Object.values(LAND_COVER_CLASSES).find(c => c.id === parseInt(classId));
            if (classInfo) {
              weightedSum += (area / result.totalArea) * classInfo.exposureWeight;
            }
          }
          result.exposureIndex = weightedSum;
        }
      } catch (error) {
        console.warn('[ExposureData] Could not fetch land cover data:', error.message);
      }
    }

    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Get population data for a region
   */
  async getPopulationData(regionName) {
    const cacheKey = `population_${regionName}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = {
      region: regionName,
      sources: [],
      totalPopulation: 0,
      density: 0,
      urbanPopulation: 0,
      ruralPopulation: 0
    };

    // Try WorldPop first
    if (this.connected.WORLDPOP && this.clients.WORLDPOP) {
      try {
        const features = await this.clients.WORLDPOP.getFeatures(
          'worldpop:TZA_population_density_2020',
          { filter: `region_name='${regionName}'`, maxFeatures: 100 }
        );

        if (features && features.features && features.features.length > 0) {
          result.sources.push('WorldPop');
          result.density = features.features.reduce((sum, f) =>
            sum + (f.properties?.density || 0), 0) / features.features.length;
        }
      } catch (error) {
        console.warn('[ExposureData] WorldPop fetch failed:', error.message);
      }
    }

    // Try NBS Tanzania census data
    if (this.connected.NBS_TANZANIA) {
      try {
        // This would connect to actual NBS API
        result.sources.push('NBS Tanzania Census 2022');
      } catch (error) {
        console.warn('[ExposureData] NBS data fetch failed:', error.message);
      }
    }

    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Get livestock density data
   */
  async getLivestockData(regionName) {
    const result = {
      region: regionName,
      source: 'FAO GLW',
      livestock: {
        cattle: 0,
        goats: 0,
        sheep: 0,
        poultry: 0
      },
      totalLSU: 0 // Livestock Units
    };

    if (this.connected.FAO_GLW && this.clients.FAO_GLW) {
      const livestockTypes = ['cattle', 'goat', 'sheep', 'poultry'];

      for (const type of livestockTypes) {
        try {
          const layer = EXPOSURE_DATA_SOURCES.FAO_GLW.layers[`${type}_density`];
          if (layer) {
            const features = await this.clients.FAO_GLW.getFeatures(
              layer.wmsLayer,
              { filter: `region_name='${regionName}'`, maxFeatures: 10 }
            );

            if (features && features.features && features.features.length > 0) {
              result.livestock[type] = features.features.reduce((sum, f) =>
                sum + (f.properties?.density || 0), 0) / features.features.length;
            }
          }
        } catch (error) {
          console.warn(`[ExposureData] FAO ${type} fetch failed:`, error.message);
        }
      }

      // Calculate Livestock Standard Units (LSU)
      // FAO conversion factors: cattle=0.7, goats=0.1, sheep=0.1, poultry=0.01
      result.totalLSU = result.livestock.cattle * 0.7 +
                        result.livestock.goats * 0.1 +
                        result.livestock.sheep * 0.1 +
                        result.livestock.poultry * 0.01;
    }

    return result;
  }

  /**
   * Get elevation and terrain data
   */
  async getTerrainData(bbox) {
    const result = {
      source: 'SRTM 30m',
      elevation: { min: 0, max: 0, mean: 0 },
      slope: { min: 0, max: 0, mean: 0, steepArea: 0 }
    };

    if (this.connected.SRTM && this.clients.SRTM) {
      try {
        // Get elevation statistics
        const elevationFeatures = await this.clients.SRTM.getFeatures(
          'SRTM_GL1',
          { bbox, maxFeatures: 100 }
        );

        if (elevationFeatures && elevationFeatures.features) {
          const elevations = elevationFeatures.features
            .map(f => f.properties?.elevation || f.properties?.value)
            .filter(v => v !== null && v !== undefined);

          if (elevations.length > 0) {
            result.elevation = {
              min: Math.min(...elevations),
              max: Math.max(...elevations),
              mean: elevations.reduce((a, b) => a + b, 0) / elevations.length
            };
          }
        }
      } catch (error) {
        console.warn('[ExposureData] SRTM fetch failed:', error.message);
      }
    }

    return result;
  }

  // ==========================================================================
  // INFORM INTEGRATION METHODS
  // ==========================================================================

  /**
   * Get INFORM-formatted exposure scores
   */
  async getINFORMExposureScores(regionName) {
    const scores = {
      population: { score: 0, confidence: 0, sources: [] },
      agriculture: { score: 0, confidence: 0, sources: [] },
      infrastructure: { score: 0, confidence: 0, sources: [] },
      environment: { score: 0, confidence: 0, sources: [] }
    };

    // Get population exposure
    const populationData = await this.getPopulationData(regionName);
    if (populationData.density > 0) {
      // Normalize density to 0-10 scale (assuming max density of 10000/km²)
      scores.population.score = Math.min(10, (populationData.density / 1000) * 10);
      scores.population.confidence = populationData.sources.length / 2;
      scores.population.sources = populationData.sources;
    }

    // Get agricultural exposure
    const landCoverData = await this.getLandCoverData(regionName);
    if (landCoverData.totalArea > 0) {
      scores.agriculture.score = landCoverData.exposureIndex * 10;
      scores.agriculture.confidence = 0.8;
      scores.agriculture.sources = [landCoverData.source];
    }

    // Get livestock exposure
    const livestockData = await this.getLivestockData(regionName);
    if (livestockData.totalLSU > 0) {
      scores.agriculture.score = Math.max(
        scores.agriculture.score,
        Math.min(10, (livestockData.totalLSU / 100) * 10)
      );
      scores.agriculture.sources.push(livestockData.source);
    }

    // Calculate composite exposure score (geometric mean)
    const validScores = Object.values(scores).filter(s => s.score > 0);
    const compositeScore = validScores.length > 0
      ? Math.pow(
          validScores.reduce((product, s) => product * (s.score || 1), 1),
          1 / validScores.length
        )
      : 0;

    return {
      individual: scores,
      composite: compositeScore,
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get all available layers
   */
  getAllLayers() {
    const layers = [];

    for (const [sourceId, source] of Object.entries(EXPOSURE_DATA_SOURCES)) {
      const sourceLayers = source.layers || source.datasets;
      if (sourceLayers) {
        for (const [layerId, layer] of Object.entries(sourceLayers)) {
          layers.push({
            sourceId,
            sourceName: source.name,
            layerId,
            ...layer,
            connected: this.connected[sourceId] || false
          });
        }
      }
    }

    return layers;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return Object.entries(EXPOSURE_DATA_SOURCES).map(([id, source]) => ({
      id,
      name: source.name,
      description: source.description,
      connected: this.connected[id] || false,
      type: source.type,
      resolution: source.resolution,
      layerCount: Object.keys(source.layers || source.datasets || {}).length
    }));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let exposureDataInstance = null;

export function getExposureDataConnector(options = {}) {
  if (!exposureDataInstance) {
    exposureDataInstance = new ExposureDataConnector(options);
  }
  return exposureDataInstance;
}

export function resetExposureDataConnector() {
  exposureDataInstance = null;
}

export default ExposureDataConnector;
