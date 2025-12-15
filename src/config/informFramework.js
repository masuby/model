/**
 * INFORM Risk Framework Configuration
 * Based on INFORM Methodology v2024
 *
 * Structure: RISK = f(HAZARD, VULNERABILITY, LACK_OF_COPING_CAPACITY)
 * Each dimension aggregates categories, which aggregate components, which aggregate indicators
 */

// INFORM Standard Color Palette (International Standards)
export const INFORM_COLORS = {
  // Risk levels (5-class)
  risk: {
    veryLow: '#2E7D32',    // 0.0 - 2.0
    low: '#8BC34A',        // 2.0 - 3.5
    medium: '#FFC107',     // 3.5 - 5.0
    high: '#FF9800',       // 5.0 - 6.5
    veryHigh: '#D32F2F',   // 6.5 - 10.0
  },
  // Dimension colors
  dimensions: {
    hazard: '#E53935',           // Red family
    vulnerability: '#FB8C00',    // Orange family
    copingCapacity: '#1E88E5',   // Blue family
    risk: '#6D4C41',             // Brown (composite)
  },
  // Category colors (gradient variations)
  categories: {
    natural: '#EF5350',
    human: '#C62828',
    socioEconomic: '#FFB74D',
    vulnerableGroups: '#FF8A65',
    infrastructure: '#42A5F5',
    institutional: '#1565C0',
  }
};

// Risk classification thresholds (INFORM standard)
export const RISK_THRESHOLDS = {
  veryLow: { min: 0, max: 2.0, label: 'Very Low', color: INFORM_COLORS.risk.veryLow },
  low: { min: 2.0, max: 3.5, label: 'Low', color: INFORM_COLORS.risk.low },
  medium: { min: 3.5, max: 5.0, label: 'Medium', color: INFORM_COLORS.risk.medium },
  high: { min: 5.0, max: 6.5, label: 'High', color: INFORM_COLORS.risk.high },
  veryHigh: { min: 6.5, max: 10.0, label: 'Very High', color: INFORM_COLORS.risk.veryHigh },
};

// Get risk class from value
export const getRiskClass = (value) => {
  if (value === null || value === undefined || isNaN(value)) return null;
  const v = parseFloat(value);
  if (v < 2.0) return RISK_THRESHOLDS.veryLow;
  if (v < 3.5) return RISK_THRESHOLDS.low;
  if (v < 5.0) return RISK_THRESHOLDS.medium;
  if (v < 6.5) return RISK_THRESHOLDS.high;
  return RISK_THRESHOLDS.veryHigh;
};

// Get color for value (continuous scale)
export const getColorForValue = (value, dimension = 'risk') => {
  const riskClass = getRiskClass(value);
  return riskClass ? riskClass.color : '#BDBDBD';
};

// INFORM Framework Hierarchy
export const INFORM_FRAMEWORK = {
  id: 'RISK',
  name: 'INFORM Risk Index',
  description: 'Composite index measuring humanitarian crisis and disaster risk',
  column: 'RISK',
  weight: 1.0,
  aggregation: 'geometric_mean', // INFORM uses geometric mean at top level
  dimensions: [
    {
      id: 'HAZARD',
      name: 'Hazard and Exposure',
      description: 'Natural and human-induced hazards that may trigger a humanitarian crisis',
      column: 'HAZARD',
      color: INFORM_COLORS.dimensions.hazard,
      weight: 1/3,
      aggregation: 'max', // Takes max of NATURAL and HUMAN
      categories: [
        {
          id: 'NATURAL',
          name: 'Natural Hazards',
          description: 'Exposure to natural disasters and climate-related hazards',
          column: 'NATURAL',
          color: INFORM_COLORS.categories.natural,
          weight: 0.5,
          aggregation: 'max',
          components: [
            {
              id: 'coastal_hazards',
              name: 'Coastal Hazards',
              column: 'Coastal hazards',
              indicators: [
                { id: 'HA.NAT.CH-ERO', name: 'Coastal Erosion', column: 'Coastal Erosion', unit: 'meters/year' },
                { id: 'HA.NAT.CH-SEA', name: 'Sea Level Rise', column: 'Sea Level Rise', unit: 'mm' }
              ]
            },
            {
              id: 'drought',
              name: 'Drought',
              column: 'Drought',
              indicators: [
                { id: 'HA.NAT.DR-FRE', name: 'Historic Drought Frequency', column: 'Historic Drought Frequency', unit: 'years' },
                { id: 'HA.NAT.DR-PRO', name: 'Drought Probability', column: 'Drought probability', unit: '%' }
              ]
            },
            {
              id: 'earthquake',
              name: 'Earthquake',
              column: 'Earthquake',
              indicators: [
                { id: 'HA.NAT.EQ-EXP', name: 'Earthquake Exposure', column: 'Earthquake exposure', unit: 'index' }
              ]
            },
            {
              id: 'environmental_degradation',
              name: 'Environmental Degradation',
              column: 'Environmental Degradation',
              indicators: [
                { id: 'HA.NAT.ED-DEF', name: 'Deforestation', column: 'Deforestation - Treecover Loss', unit: '%' },
                { id: 'HA.NAT.DE-ERO', name: 'Soil Erosion', column: 'Soil Erosion', unit: 'Mg/ha/yr' }
              ]
            },
            {
              id: 'flood',
              name: 'Flood',
              column: 'Flood',
              indicators: [
                { id: 'HA.NAT.FL-EXP', name: 'Flood Exposure', column: 'Flood exposure', unit: '%' },
                { id: 'HA.NAT.FL-FRE', name: 'Flood Frequency', column: 'Flood frequency', unit: 'events' }
              ]
            },
            {
              id: 'heatwave',
              name: 'Heatwave',
              column: 'Heatwave',
              indicators: [
                { id: 'HA.NAT.HW-EXP', name: 'Heatwave Exposure', column: 'Heatwave exposure', unit: 'days' }
              ]
            },
            {
              id: 'landslide',
              name: 'Landslide',
              column: 'Landslide',
              indicators: [
                { id: 'HA.NAT.LS-EXP', name: 'Landslide Exposure', column: 'Landslide exposure', unit: '%' }
              ]
            },
            {
              id: 'lightning',
              name: 'Lightning',
              column: 'Lightning',
              indicators: [
                { id: 'HA.NAT.LI-EXP', name: 'Lightning Exposure', column: 'Lightning exposure', unit: 'flashes/km²' }
              ]
            },
            {
              id: 'storms_cyclone',
              name: 'Storms and Cyclone',
              column: 'Storms and Cyclone',
              indicators: [
                { id: 'HA.NAT.TC-EXP', name: 'Tropical Cyclone Exposure', column: 'Tropical Cyclone exposure', unit: 'index' }
              ]
            },
            {
              id: 'volcano',
              name: 'Volcano',
              column: 'Volcano',
              indicators: [
                { id: 'HA.NAT.VO-EXP', name: 'Volcano Exposure', column: 'Volcano exposure', unit: 'index' }
              ]
            },
            {
              id: 'wildfire',
              name: 'Wildfire',
              column: 'Wildfire',
              indicators: [
                { id: 'HA.NAT.WF-EXP', name: 'Wildfire Exposure', column: 'Wildfire exposure', unit: 'index' }
              ]
            },
            {
              id: 'zoonoses',
              name: 'Zoonoses, Plants & Pests',
              column: 'Zoonoses, Plants & Pests',
              indicators: [
                { id: 'HA.NAT.ZO-EXP', name: 'Zoonotic Disease Exposure', column: 'Zoonotic exposure', unit: 'index' }
              ]
            }
          ]
        },
        {
          id: 'HUMAN',
          name: 'Human Hazards',
          description: 'Exposure to human-induced hazards including conflict and accidents',
          column: 'HUMAN',
          color: INFORM_COLORS.categories.human,
          weight: 0.5,
          aggregation: 'max',
          components: [
            {
              id: 'conflict_intensity',
              name: 'Conflict Intensity',
              column: 'Conflict Intensity',
              indicators: [
                { id: 'HA.HUM.CI-FAT', name: 'Conflict Fatalities', column: 'Conflict fatalities', unit: 'deaths' },
                { id: 'HA.HUM.CI-EVE', name: 'Conflict Events', column: 'Conflict events', unit: 'events' }
              ]
            },
            {
              id: 'conflict_risk',
              name: 'Conflict Risk',
              column: 'Conflict Risk',
              indicators: [
                { id: 'HA.HUM.CR-RSK', name: 'Conflict Probability', column: 'Conflict probability', unit: 'index' }
              ]
            },
            {
              id: 'hazardous_material',
              name: 'Hazardous Material',
              column: 'Hazardous Material',
              indicators: [
                { id: 'HA.HUM.HM-EXP', name: 'Hazmat Exposure', column: 'Hazmat exposure', unit: 'index' }
              ]
            },
            {
              id: 'internal_violence',
              name: 'Internal Violence',
              column: 'Internal Violence',
              indicators: [
                { id: 'HA.HUM.IV-CRI', name: 'Crime Rate', column: 'Crime rate', unit: 'per 100k' }
              ]
            },
            {
              id: 'vehicle_accidents',
              name: 'Vehicle Accidents',
              column: 'Vehicle Accidents',
              indicators: [
                { id: 'HA.HUM.VA-FAT', name: 'Road Traffic Fatalities', column: 'Road traffic fatalities', unit: 'per 100k' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'VULNERABILITY',
      name: 'Vulnerability',
      description: 'Conditions that increase susceptibility to crisis impacts',
      column: 'VULNERABILITY',
      color: INFORM_COLORS.dimensions.vulnerability,
      weight: 1/3,
      aggregation: 'arithmetic_mean',
      categories: [
        {
          id: 'SOCIO_ECONOMIC',
          name: 'Socio-Economic Vulnerability',
          description: 'Development, poverty, and livelihood vulnerabilities',
          column: 'SOCIO-ECONOMIC VULNERABILITY',
          color: INFORM_COLORS.categories.socioEconomic,
          weight: 0.5,
          aggregation: 'arithmetic_mean',
          components: [
            {
              id: 'development_poverty',
              name: 'Development and Poverty',
              column: 'Development and Poverty',
              indicators: [
                { id: 'VU.SEV.DP-MPI', name: 'Multidimensional Poverty Index', column: 'MPI', unit: 'index' },
                { id: 'VU.SEV.DP-HDI', name: 'Human Development Index', column: 'HDI', unit: 'index' },
                { id: 'VU.SEV.DP-GII', name: 'Gender Inequality Index', column: 'GII', unit: 'index' }
              ]
            },
            {
              id: 'economic_dependency',
              name: 'Economic Dependency',
              column: 'Economic Dependency',
              indicators: [
                { id: 'VU.SEV.ED-AID', name: 'Aid Dependency', column: 'Aid dependency', unit: '%GDP' },
                { id: 'VU.SEV.ED-REM', name: 'Remittance Dependency', column: 'Remittance dependency', unit: '%GDP' }
              ]
            },
            {
              id: 'habitat',
              name: 'Habitat',
              column: 'Habitat',
              indicators: [
                { id: 'VU.SEV.HA-URB', name: 'Urban Population', column: 'Urban population', unit: '%' },
                { id: 'VU.SEV.HA-SLU', name: 'Slum Population', column: 'Slum population', unit: '%' }
              ]
            },
            {
              id: 'livelihoods',
              name: 'Livelihoods',
              column: 'Livelihoods',
              indicators: [
                { id: 'VU.SEV.LI-AGR', name: 'Agricultural Dependency', column: 'Agriculture dependency', unit: '%' },
                { id: 'VU.SEV.LI-UNE', name: 'Unemployment', column: 'Unemployment', unit: '%' }
              ]
            }
          ]
        },
        {
          id: 'VULNERABLE_GROUPS',
          name: 'Vulnerable Groups',
          description: 'Population groups with heightened vulnerability',
          column: 'VULNERABLE GROUPS',
          color: INFORM_COLORS.categories.vulnerableGroups,
          weight: 0.5,
          aggregation: 'arithmetic_mean',
          components: [
            {
              id: 'displaced_people',
              name: 'Displaced People',
              column: 'Displaced People',
              indicators: [
                { id: 'VU.VGR.DP-IDP', name: 'Internally Displaced Persons', column: 'IDPs', unit: 'persons' },
                { id: 'VU.VGR.DP-REF', name: 'Refugees', column: 'Refugees', unit: 'persons' }
              ]
            },
            {
              id: 'health_conditions',
              name: 'Health Conditions',
              column: 'Health Conditions',
              indicators: [
                { id: 'VU.VGR.HC-HIV', name: 'HIV Prevalence', column: 'HIV prevalence', unit: '%' },
                { id: 'VU.VGR.HC-MAL', name: 'Malaria Incidence', column: 'Malaria incidence', unit: 'per 1000' }
              ]
            },
            {
              id: 'children_health',
              name: 'Children Health and Nutrition',
              column: 'Children Health and Nutrition',
              indicators: [
                { id: 'VU.VGR.CH-STU', name: 'Stunting', column: 'Stunting', unit: '%' },
                { id: 'VU.VGR.CH-WAS', name: 'Wasting', column: 'Wasting', unit: '%' },
                { id: 'VU.VGR.CH-U5M', name: 'Under-5 Mortality', column: 'Under-5 mortality', unit: 'per 1000' }
              ]
            },
            {
              id: 'economic_vulnerable',
              name: 'Economic',
              column: 'Ecomonic',
              indicators: [
                { id: 'VU.VGR.EC-FOO', name: 'Food Insecurity', column: 'Food insecurity', unit: '%' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'LACK_OF_COPING_CAPACITY',
      name: 'Lack of Coping Capacity',
      description: 'Insufficient capacity to cope with and recover from crises',
      column: 'LACK OF COPING CAPACITY',
      color: INFORM_COLORS.dimensions.copingCapacity,
      weight: 1/3,
      aggregation: 'arithmetic_mean',
      categories: [
        {
          id: 'INFRASTRUCTURE',
          name: 'Infrastructure',
          description: 'Physical and social infrastructure for crisis response',
          column: 'INFRASTRUCTURE',
          color: INFORM_COLORS.categories.infrastructure,
          weight: 0.5,
          aggregation: 'arithmetic_mean',
          components: [
            {
              id: 'access_healthcare',
              name: 'Access to Health Care',
              column: 'Access to health care',
              indicators: [
                { id: 'CC.INF.AH-PHY', name: 'Physicians Density', column: 'Physicians', unit: 'per 10k' },
                { id: 'CC.INF.AH-BED', name: 'Hospital Beds', column: 'Hospital beds', unit: 'per 10k' }
              ]
            },
            {
              id: 'economic_capacity',
              name: 'Economic Capacity',
              column: 'Economic capacity',
              indicators: [
                { id: 'CC.INF.EC-GDP', name: 'GDP per Capita', column: 'GDP per capita', unit: 'USD' }
              ]
            },
            {
              id: 'wash',
              name: 'WASH',
              column: 'WASH',
              indicators: [
                { id: 'CC.INF.WA-WAT', name: 'Access to Safe Water', column: 'Safe water access', unit: '%' },
                { id: 'CC.INF.WA-SAN', name: 'Access to Sanitation', column: 'Sanitation access', unit: '%' }
              ]
            },
            {
              id: 'communication',
              name: 'Communication',
              column: 'Communication',
              indicators: [
                { id: 'CC.INF.CO-MOB', name: 'Mobile Phone Coverage', column: 'Mobile coverage', unit: '%' },
                { id: 'CC.INF.CO-INT', name: 'Internet Access', column: 'Internet access', unit: '%' }
              ]
            },
            {
              id: 'education',
              name: 'Education',
              column: 'Education',
              indicators: [
                { id: 'CC.INF.ED-LIT', name: 'Adult Literacy Rate', column: 'Literacy rate', unit: '%' },
                { id: 'CC.INF.ED-ENR', name: 'School Enrollment', column: 'School enrollment', unit: '%' }
              ]
            }
          ]
        },
        {
          id: 'INSTITUTIONAL',
          name: 'Institutional',
          description: 'Governance and institutional capacity for crisis management',
          column: 'INSTITUTIONAL',
          color: INFORM_COLORS.categories.institutional,
          weight: 0.5,
          aggregation: 'arithmetic_mean',
          components: [
            {
              id: 'drr_implementation',
              name: 'DRR Implementation',
              column: 'DRR implementation',
              indicators: [
                { id: 'CC.INS.DR-SFG', name: 'Sendai Framework Progress', column: 'Sendai progress', unit: 'index' },
                { id: 'CC.INS.DR-EWS', name: 'Early Warning Systems', column: 'Early warning', unit: 'index' }
              ]
            },
            {
              id: 'governance',
              name: 'Governance',
              column: 'Governance',
              indicators: [
                { id: 'CC.INS.GO-COR', name: 'Control of Corruption', column: 'Corruption control', unit: 'index' },
                { id: 'CC.INS.GO-EFF', name: 'Government Effectiveness', column: 'Gov effectiveness', unit: 'index' },
                { id: 'CC.INS.GO-STA', name: 'Political Stability', column: 'Political stability', unit: 'index' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Helper function to flatten framework to get all columns
export const getAllFrameworkColumns = () => {
  const columns = [];

  const traverse = (node, path = []) => {
    if (node.column) {
      columns.push({
        column: node.column,
        id: node.id,
        name: node.name,
        path: [...path, node.name],
        level: path.length,
        color: node.color || INFORM_COLORS.dimensions.risk
      });
    }

    // Traverse children
    ['dimensions', 'categories', 'components', 'indicators'].forEach(childKey => {
      if (node[childKey]) {
        node[childKey].forEach(child => traverse(child, [...path, node.name]));
      }
    });
  };

  traverse(INFORM_FRAMEWORK);
  return columns;
};

// Get hierarchical data for sunburst/treemap visualization
export const getHierarchyData = (data, selectedArea = null) => {
  const getValue = (columnName) => {
    if (!data || data.length === 0) return 0;
    const row = selectedArea
      ? data.find(r => r.ADM2_NAME === selectedArea || r.ADM1_NAME === selectedArea)
      : data[0];
    if (!row) return 0;
    const val = parseFloat(row[columnName]);
    return isNaN(val) ? 0 : val;
  };

  const buildNode = (node) => {
    const children = [];

    ['dimensions', 'categories', 'components', 'indicators'].forEach(childKey => {
      if (node[childKey]) {
        node[childKey].forEach(child => {
          children.push(buildNode(child));
        });
      }
    });

    const value = getValue(node.column);

    return {
      name: node.name,
      id: node.id,
      column: node.column,
      value: value,
      color: node.color || getColorForValue(value),
      riskClass: getRiskClass(value),
      children: children.length > 0 ? children : undefined
    };
  };

  return buildNode(INFORM_FRAMEWORK);
};

// Calculate aggregated values following INFORM methodology
export const calculateAggregatedValue = (values, method = 'arithmetic_mean') => {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  if (validValues.length === 0) return null;

  switch (method) {
    case 'geometric_mean':
      const product = validValues.reduce((acc, val) => acc * val, 1);
      return Math.pow(product, 1 / validValues.length);
    case 'arithmetic_mean':
      return validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
    case 'max':
      return Math.max(...validValues);
    case 'min':
      return Math.min(...validValues);
    case 'sum':
      return validValues.reduce((acc, val) => acc + val, 0);
    default:
      return validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
  }
};

// Get dimension summary for a data row
export const getDimensionSummary = (row) => {
  if (!row) return null;

  return {
    risk: {
      value: parseFloat(row['RISK']) || null,
      class: getRiskClass(row['RISK']),
      color: INFORM_COLORS.dimensions.risk
    },
    hazard: {
      value: parseFloat(row['HAZARD']) || null,
      class: getRiskClass(row['HAZARD']),
      color: INFORM_COLORS.dimensions.hazard,
      natural: parseFloat(row['NATURAL']) || null,
      human: parseFloat(row['HUMAN']) || null
    },
    vulnerability: {
      value: parseFloat(row['VULNERABILITY']) || null,
      class: getRiskClass(row['VULNERABILITY']),
      color: INFORM_COLORS.dimensions.vulnerability,
      socioEconomic: parseFloat(row['SOCIO-ECONOMIC VULNERABILITY']) || null,
      vulnerableGroups: parseFloat(row['VULNERABLE GROUPS']) || null
    },
    copingCapacity: {
      value: parseFloat(row['LACK OF COPING CAPACITY']) || null,
      class: getRiskClass(row['LACK OF COPING CAPACITY']),
      color: INFORM_COLORS.dimensions.copingCapacity,
      infrastructure: parseFloat(row['INFRASTRUCTURE']) || null,
      institutional: parseFloat(row['INSTITUTIONAL']) || null
    }
  };
};

export default INFORM_FRAMEWORK;
