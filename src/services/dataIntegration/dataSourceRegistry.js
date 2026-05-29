/**
 * DATA SOURCE REGISTRY
 *
 * Central registry of all Tanzania data sources for INFORM model
 * Based on PMO-DMD, RCMRD, NBS, and other official sources
 */

// ============================================================================
// DATA SOURCE DEFINITIONS
// ============================================================================

export const DATA_SOURCES = {
  // PMO-DMD TCVMP - Primary hazard/vulnerability source
  TCVMP: {
    id: 'tcvmp',
    name: 'TCVMP (PMO-DMD)',
    description: 'Tanzania Comprehensive Vulnerability Mapping Platform',
    baseUrl: 'https://tcvmp.pmo.go.tz',
    serviceType: 'WMS/WFS',
    capabilities: {
      wms: 'https://tcvmp.pmo.go.tz/ows/?SERVICE=WMS&REQUEST=GetCapabilities',
      wfs: 'https://tcvmp.pmo.go.tz/ows/?SERVICE=WFS&REQUEST=GetCapabilities'
    },
    dataTypes: ['hazard', 'exposure', 'vulnerability'],
    authentication: 'token', // May require authentication
    status: 'active',
    priority: 1,
    layers: {
      flood_hazard: {
        name: 'Flood Hazard',
        typename: 'tz_flood_hazard',
        category: 'hazard',
        unit: 'index',
        scale: [0, 10]
      },
      drought_hazard: {
        name: 'Drought Hazard',
        typename: 'tz_drought_hazard',
        category: 'hazard',
        unit: 'index',
        scale: [0, 10]
      },
      landslide_hazard: {
        name: 'Landslide Hazard',
        typename: 'tz_landslide_hazard',
        category: 'hazard',
        unit: 'index',
        scale: [0, 10]
      },
      earthquake_hazard: {
        name: 'Earthquake Hazard',
        typename: 'tz_earthquake_hazard',
        category: 'hazard',
        unit: 'PGA',
        scale: [0, 10]
      },
      population_exposure: {
        name: 'Population Exposure',
        typename: 'tz_population_exposure',
        category: 'exposure',
        unit: 'people',
        scale: [0, 1000000]
      },
      infrastructure_exposure: {
        name: 'Infrastructure Exposure',
        typename: 'tz_infrastructure',
        category: 'exposure',
        unit: 'count',
        scale: [0, 1000]
      },
      vulnerability_index: {
        name: 'Vulnerability Index',
        typename: 'tz_vulnerability',
        category: 'vulnerability',
        unit: 'index',
        scale: [0, 10]
      }
    }
  },

  // RCMRD GeoPortal - Regional indices
  RCMRD_GEOPORTAL: {
    id: 'rcmrd_geoportal',
    name: 'RCMRD GeoPortal',
    description: 'Regional Centre for Mapping of Resources for Development',
    baseUrl: 'https://geoportal.rcmrd.org',
    serviceType: 'WMS/WFS/REST',
    capabilities: {
      wms: 'https://geoportal.rcmrd.org/geoserver/ows?SERVICE=WMS&REQUEST=GetCapabilities',
      wfs: 'https://geoportal.rcmrd.org/geoserver/ows?SERVICE=WFS&REQUEST=GetCapabilities',
      rest: 'https://geoportal.rcmrd.org/api/v2/datasets/'
    },
    dataTypes: ['sensitivity', 'adaptive_capacity', 'vulnerability'],
    authentication: 'none',
    status: 'active',
    priority: 2,
    layers: {
      sensitivity_index: {
        name: 'Sensitivity Index',
        typename: 'tz_sensitivity',
        category: 'vulnerability',
        unit: 'index',
        scale: [0, 1]
      },
      adaptive_capacity: {
        name: 'Adaptive Capacity',
        typename: 'tz_adaptive_capacity',
        category: 'coping',
        unit: 'index',
        scale: [0, 1]
      },
      climate_vulnerability: {
        name: 'Climate Vulnerability',
        typename: 'tz_climate_vulnerability',
        category: 'vulnerability',
        unit: 'index',
        scale: [0, 1]
      }
    }
  },

  // RCMRD OpenData - ArcGIS REST
  RCMRD_OPENDATA: {
    id: 'rcmrd_opendata',
    name: 'RCMRD OpenData',
    description: 'RCMRD Open Data Portal (ArcGIS)',
    baseUrl: 'https://opendata.rcmrd.org',
    serviceType: 'ArcGIS REST',
    capabilities: {
      rest: 'https://opendata.rcmrd.org/datasets/'
    },
    dataTypes: ['vulnerability', 'indices'],
    authentication: 'none',
    status: 'active',
    priority: 3,
    datasets: {
      vulnerability_index: {
        id: 'd49aa80b236541c0b0ab9c792bd1ae3b',
        name: 'Tanzania Vulnerability Index',
        format: 'GeoJSON'
      }
    }
  },

  // Resilience Academy - Climate Risk Database
  RESILIENCE_ACADEMY: {
    id: 'resilience_academy',
    name: 'Resilience Academy CRD',
    description: 'Climate Risk Database - 287+ datasets',
    baseUrl: 'https://geonode.resilienceacademy.ac.tz',
    serviceType: 'WMS/WFS/REST',
    capabilities: {
      wms: 'https://geonode.resilienceacademy.ac.tz/geoserver/ows?SERVICE=WMS&REQUEST=GetCapabilities',
      wfs: 'https://geonode.resilienceacademy.ac.tz/geoserver/ows?SERVICE=WFS&REQUEST=GetCapabilities',
      rest: 'https://geonode.resilienceacademy.ac.tz/api/v2/datasets/'
    },
    dataTypes: ['flood', 'buildings', 'infrastructure', 'exposure'],
    authentication: 'none',
    status: 'active',
    priority: 2,
    layers: {
      flood_extent: {
        name: 'Flood Extent',
        typename: 'flood_extent',
        category: 'hazard',
        unit: 'area',
        scale: [0, 1]
      },
      building_footprints: {
        name: 'Building Footprints',
        typename: 'building_footprints',
        category: 'exposure',
        unit: 'count',
        scale: [0, 100000]
      },
      critical_infrastructure: {
        name: 'Critical Infrastructure',
        typename: 'critical_infrastructure',
        category: 'exposure',
        unit: 'count',
        scale: [0, 1000]
      }
    }
  },

  // NBS - National Bureau of Statistics
  NBS: {
    id: 'nbs',
    name: 'NBS Tanzania',
    description: 'National Bureau of Statistics - Census & Surveys',
    baseUrl: 'https://www.nbs.go.tz',
    serviceType: 'Web Portal/CSV',
    capabilities: {
      tisp: 'https://tisp.nbs.go.tz',
      census: 'https://sensa.nbs.go.tz',
      gis: 'https://www.nbs.go.tz/statistics/topic/gis'
    },
    dataTypes: ['population', 'poverty', 'housing', 'livelihoods', 'boundaries'],
    authentication: 'none',
    status: 'active',
    priority: 1,
    datasets: {
      population_2022: {
        name: 'Population Census 2022',
        url: 'https://sensa.nbs.go.tz',
        format: 'CSV',
        level: ['region', 'district', 'ward']
      },
      poverty_hbs: {
        name: 'Poverty (HBS 2017/18)',
        url: 'https://tisp.nbs.go.tz',
        format: 'CSV',
        level: ['region', 'district']
      },
      admin_boundaries: {
        name: 'Administrative Boundaries',
        url: 'https://www.nbs.go.tz/statistics/topic/gis',
        format: 'Shapefile',
        level: ['region', 'district', 'ward', 'ea']
      }
    }
  },

  // METEOR - Building Exposure
  METEOR: {
    id: 'meteor',
    name: 'METEOR Explorer',
    description: 'Global building exposure data',
    baseUrl: 'https://maps.meteor-project.org',
    serviceType: 'WMS/Download',
    capabilities: {
      wms: 'https://maps.meteor-project.org/geoserver/wms?REQUEST=GetCapabilities'
    },
    dataTypes: ['building_exposure'],
    authentication: 'none',
    status: 'active',
    priority: 3,
    layers: {
      building_count: {
        name: 'Building Count',
        typename: 'meteor:building_count',
        category: 'exposure',
        unit: 'count',
        resolution: '3-arcsecond'
      },
      building_area: {
        name: 'Building Area',
        typename: 'meteor:building_area',
        category: 'exposure',
        unit: 'sqm',
        resolution: '3-arcsecond'
      },
      replacement_value: {
        name: 'Replacement Value',
        typename: 'meteor:replacement_value',
        category: 'exposure',
        unit: 'USD',
        resolution: '3-arcsecond'
      }
    }
  },

  // Google Earth Engine
  GEE: {
    id: 'gee',
    name: 'Google Earth Engine',
    description: 'Global datasets and computation platform',
    baseUrl: 'https://earthengine.google.com',
    serviceType: 'Python/JS API',
    capabilities: {
      api: 'https://earthengine.googleapis.com/v1/'
    },
    dataTypes: ['population', 'elevation', 'landcover', 'nightlights', 'soil'],
    authentication: 'oauth',
    status: 'active',
    priority: 1,
    datasets: {
      worldpop: {
        name: 'WorldPop Population',
        assetId: 'WorldPop/GP/100m/pop',
        filter: { country: 'TZA' }
      },
      srtm: {
        name: 'SRTM Elevation',
        assetId: 'USGS/SRTMGL1_003'
      },
      modis_landcover: {
        name: 'MODIS Land Cover',
        assetId: 'MODIS/006/MCD12Q1'
      },
      viirs_nightlights: {
        name: 'VIIRS Nighttime Lights',
        assetId: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG'
      },
      smap_soil: {
        name: 'SMAP Soil Moisture',
        assetId: 'NASA/SMAP/SPL4SMGP/007'
      }
    }
  }
};

// ============================================================================
// LAYER CATEGORY MAPPINGS
// ============================================================================

export const LAYER_CATEGORIES = {
  hazard: {
    name: 'Hazard',
    color: '#F44336',
    sources: ['TCVMP', 'RESILIENCE_ACADEMY'],
    informDimension: 'hazardExposure'
  },
  exposure: {
    name: 'Exposure',
    color: '#2196F3',
    sources: ['TCVMP', 'RESILIENCE_ACADEMY', 'METEOR', 'NBS'],
    informDimension: 'hazardExposure'
  },
  vulnerability: {
    name: 'Vulnerability',
    color: '#FF9800',
    sources: ['TCVMP', 'RCMRD_GEOPORTAL', 'RCMRD_OPENDATA'],
    informDimension: 'vulnerability'
  },
  coping: {
    name: 'Coping Capacity',
    color: '#9C27B0',
    sources: ['RCMRD_GEOPORTAL', 'NBS'],
    informDimension: 'lackCopingCapacity'
  }
};

// ============================================================================
// INFORM INDICATOR MAPPING
// ============================================================================

export const INFORM_LAYER_MAPPING = {
  // Hazard & Exposure Dimension
  'flood_risk': ['TCVMP.flood_hazard', 'RESILIENCE_ACADEMY.flood_extent'],
  'drought_risk': ['TCVMP.drought_hazard'],
  'earthquake_risk': ['TCVMP.earthquake_hazard'],
  'landslide_risk': ['TCVMP.landslide_hazard'],
  'population_density': ['NBS.population_2022', 'GEE.worldpop'],
  'infrastructure': ['RESILIENCE_ACADEMY.critical_infrastructure', 'TCVMP.infrastructure_exposure'],
  'building_exposure': ['METEOR.building_count', 'RESILIENCE_ACADEMY.building_footprints'],

  // Vulnerability Dimension
  'poverty': ['NBS.poverty_hbs', 'RCMRD_GEOPORTAL.sensitivity_index'],
  'health_access': ['RCMRD_GEOPORTAL.sensitivity_index'],
  'food_insecurity': ['RCMRD_GEOPORTAL.sensitivity_index'],

  // Coping Capacity Dimension
  'adaptive_capacity': ['RCMRD_GEOPORTAL.adaptive_capacity'],
  'governance': ['RCMRD_GEOPORTAL.adaptive_capacity']
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all layers for a specific category
 */
export function getLayersByCategory(category) {
  const layers = [];
  Object.entries(DATA_SOURCES).forEach(([sourceId, source]) => {
    if (source.layers) {
      Object.entries(source.layers).forEach(([layerId, layer]) => {
        if (layer.category === category) {
          layers.push({
            sourceId,
            sourceName: source.name,
            layerId,
            ...layer
          });
        }
      });
    }
  });
  return layers;
}

/**
 * Get all available data sources
 */
export function getActiveDataSources() {
  return Object.entries(DATA_SOURCES)
    .filter(([_, source]) => source.status === 'active')
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([id, source]) => ({ id, ...source }));
}

/**
 * Get data source by ID
 */
export function getDataSource(sourceId) {
  return DATA_SOURCES[sourceId] || null;
}

/**
 * Get WMS/WFS capable sources
 */
export function getWMSWFSSources() {
  return Object.entries(DATA_SOURCES)
    .filter(([_, source]) =>
      source.serviceType.includes('WMS') ||
      source.serviceType.includes('WFS')
    )
    .map(([id, source]) => ({ id, ...source }));
}

export default {
  DATA_SOURCES,
  LAYER_CATEGORIES,
  INFORM_LAYER_MAPPING,
  getLayersByCategory,
  getActiveDataSources,
  getDataSource,
  getWMSWFSSources
};
