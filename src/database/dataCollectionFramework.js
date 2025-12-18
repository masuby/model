/**
 * DATA COLLECTION FRAMEWORK FOR TANZANIA v2.0
 *
 * Enterprise-grade framework for collecting, validating, and managing
 * INFORM indicator data across all 31 regions and 184+ districts.
 *
 * Architecture Features:
 * - Multi-source data collection (Government, APIs, Surveys, Field)
 * - Advanced validation with cross-field and temporal checks
 * - Data quality scoring and anomaly detection
 * - Version control and audit trails
 * - Offline-first data collection with sync
 * - Multi-language support (English, Swahili)
 * - Data lineage and provenance tracking
 * - Scheduled collection with intelligent retry
 * - Real-time monitoring and alerting
 */

import { INDICATOR_DEFINITIONS, TANZANIA_DATA_SOURCES } from './advancedSchema.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FRAMEWORK_CONFIG = {
  version: '2.0.0',
  name: 'INFORM Tanzania Data Collection Framework',

  // Validation settings
  validation: {
    strictMode: false,
    allowPartialSubmissions: true,
    maxOutlierStdDev: 3,           // Flag values > 3 std deviations
    requiredFieldsThreshold: 0.5,  // Minimum 50% of required fields
    crossValidationEnabled: true,
    temporalValidationEnabled: true
  },

  // Data quality thresholds
  quality: {
    excellent: { min: 90, label: 'Excellent', color: '#22c55e' },
    good: { min: 70, label: 'Good', color: '#84cc16' },
    fair: { min: 50, label: 'Fair', color: '#f59e0b' },
    poor: { min: 30, label: 'Poor', color: '#ef4444' },
    critical: { min: 0, label: 'Critical', color: '#7f1d1d' }
  },

  // Data freshness (days)
  freshness: {
    current: 30,
    recent: 90,
    stale: 365,
    outdated: Infinity
  },

  // Collection settings
  collection: {
    maxRetries: 3,
    retryDelayMs: 5000,
    timeoutMs: 30000,
    batchSize: 100,
    parallelCollections: 5
  },

  // Supported languages
  languages: ['en', 'sw'],
  defaultLanguage: 'en'
};

// ============================================================================
// ADMINISTRATIVE UNITS - COMPLETE TANZANIA STRUCTURE
// ============================================================================

export const TANZANIA_ZONES = {
  CENTRAL: { id: 'central', name: 'Central', nameSwahili: 'Kanda ya Kati' },
  NORTHERN: { id: 'northern', name: 'Northern', nameSwahili: 'Kanda ya Kaskazini' },
  EASTERN: { id: 'eastern', name: 'Eastern', nameSwahili: 'Kanda ya Mashariki' },
  SOUTHERN: { id: 'southern', name: 'Southern', nameSwahili: 'Kanda ya Kusini' },
  SOUTHERN_HIGHLANDS: { id: 'southern_highlands', name: 'Southern Highlands', nameSwahili: 'Nyanda za Juu Kusini' },
  WESTERN: { id: 'western', name: 'Western', nameSwahili: 'Kanda ya Magharibi' },
  LAKE: { id: 'lake', name: 'Lake', nameSwahili: 'Kanda ya Ziwa' },
  ZANZIBAR: { id: 'zanzibar', name: 'Zanzibar', nameSwahili: 'Zanzibar' }
};

export const TANZANIA_REGIONS = [
  // Central Zone
  { code: 'TZ01', name: 'Dodoma', nameSwahili: 'Dodoma', capital: 'Dodoma', zone: 'CENTRAL', population: 2083588, area: 41311, isCapital: true },
  { code: 'TZ13', name: 'Singida', nameSwahili: 'Singida', capital: 'Singida', zone: 'CENTRAL', population: 1370637, area: 49341 },

  // Northern Zone
  { code: 'TZ02', name: 'Arusha', nameSwahili: 'Arusha', capital: 'Arusha', zone: 'NORTHERN', population: 1694310, area: 37576 },
  { code: 'TZ03', name: 'Kilimanjaro', nameSwahili: 'Kilimanjaro', capital: 'Moshi', zone: 'NORTHERN', population: 1640087, area: 13250 },
  { code: 'TZ04', name: 'Tanga', nameSwahili: 'Tanga', capital: 'Tanga', zone: 'NORTHERN', population: 2045205, area: 26677 },
  { code: 'TZ21', name: 'Manyara', nameSwahili: 'Manyara', capital: 'Babati', zone: 'NORTHERN', population: 1425131, area: 44522 },

  // Eastern Zone
  { code: 'TZ05', name: 'Morogoro', nameSwahili: 'Morogoro', capital: 'Morogoro', zone: 'EASTERN', population: 2218492, area: 70624 },
  { code: 'TZ06', name: 'Pwani', nameSwahili: 'Pwani', capital: 'Kibaha', zone: 'EASTERN', population: 1098668, area: 32547 },
  { code: 'TZ07', name: 'Dar es Salaam', nameSwahili: 'Dar es Salaam', capital: 'Dar es Salaam', zone: 'EASTERN', population: 4364541, area: 1393, isCommercialCapital: true },

  // Southern Zone
  { code: 'TZ08', name: 'Lindi', nameSwahili: 'Lindi', capital: 'Lindi', zone: 'SOUTHERN', population: 864652, area: 67000 },
  { code: 'TZ09', name: 'Mtwara', nameSwahili: 'Mtwara', capital: 'Mtwara', zone: 'SOUTHERN', population: 1270854, area: 16720 },
  { code: 'TZ10', name: 'Ruvuma', nameSwahili: 'Ruvuma', capital: 'Songea', zone: 'SOUTHERN', population: 1376891, area: 63498 },

  // Southern Highlands
  { code: 'TZ11', name: 'Iringa', nameSwahili: 'Iringa', capital: 'Iringa', zone: 'SOUTHERN_HIGHLANDS', population: 941238, area: 35743 },
  { code: 'TZ12', name: 'Mbeya', nameSwahili: 'Mbeya', capital: 'Mbeya', zone: 'SOUTHERN_HIGHLANDS', population: 2707410, area: 60350 },
  { code: 'TZ22', name: 'Njombe', nameSwahili: 'Njombe', capital: 'Njombe', zone: 'SOUTHERN_HIGHLANDS', population: 702097, area: 21347 },
  { code: 'TZ26', name: 'Songwe', nameSwahili: 'Songwe', capital: 'Vwawa', zone: 'SOUTHERN_HIGHLANDS', population: 998862, area: 27656 },

  // Western Zone
  { code: 'TZ14', name: 'Tabora', nameSwahili: 'Tabora', capital: 'Tabora', zone: 'WESTERN', population: 2291623, area: 76151 },
  { code: 'TZ15', name: 'Rukwa', nameSwahili: 'Rukwa', capital: 'Sumbawanga', zone: 'WESTERN', population: 1004539, area: 22792 },
  { code: 'TZ16', name: 'Kigoma', nameSwahili: 'Kigoma', capital: 'Kigoma', zone: 'WESTERN', population: 2127930, area: 37040 },
  { code: 'TZ23', name: 'Katavi', nameSwahili: 'Katavi', capital: 'Mpanda', zone: 'WESTERN', population: 564604, area: 45843 },

  // Lake Zone
  { code: 'TZ17', name: 'Shinyanga', nameSwahili: 'Shinyanga', capital: 'Shinyanga', zone: 'LAKE', population: 1534808, area: 18901 },
  { code: 'TZ18', name: 'Kagera', nameSwahili: 'Kagera', capital: 'Bukoba', zone: 'LAKE', population: 2458023, area: 28388 },
  { code: 'TZ19', name: 'Mwanza', nameSwahili: 'Mwanza', capital: 'Mwanza', zone: 'LAKE', population: 2772509, area: 9467 },
  { code: 'TZ20', name: 'Mara', nameSwahili: 'Mara', capital: 'Musoma', zone: 'LAKE', population: 1743830, area: 21760 },
  { code: 'TZ24', name: 'Simiyu', nameSwahili: 'Simiyu', capital: 'Bariadi', zone: 'LAKE', population: 1584157, area: 25212 },
  { code: 'TZ25', name: 'Geita', nameSwahili: 'Geita', capital: 'Geita', zone: 'LAKE', population: 1739530, area: 20054 },

  // Zanzibar
  { code: 'TZ51', name: 'Kaskazini Unguja', nameSwahili: 'Kaskazini Unguja', capital: 'Mkokotoni', zone: 'ZANZIBAR', population: 187455, area: 470, isZanzibar: true },
  { code: 'TZ52', name: 'Kusini Unguja', nameSwahili: 'Kusini Unguja', capital: 'Koani', zone: 'ZANZIBAR', population: 115588, area: 854, isZanzibar: true },
  { code: 'TZ53', name: 'Mjini Magharibi', nameSwahili: 'Mjini Magharibi', capital: 'Zanzibar City', zone: 'ZANZIBAR', population: 593678, area: 230, isZanzibar: true, isZanzibarCapital: true },
  { code: 'TZ54', name: 'Kaskazini Pemba', nameSwahili: 'Kaskazini Pemba', capital: 'Wete', zone: 'ZANZIBAR', population: 211732, area: 574, isZanzibar: true },
  { code: 'TZ55', name: 'Kusini Pemba', nameSwahili: 'Kusini Pemba', capital: 'Mkoani', zone: 'ZANZIBAR', population: 195116, area: 332, isZanzibar: true }
];

// Computed statistics
export const TANZANIA_STATS = {
  totalRegions: TANZANIA_REGIONS.length,
  totalPopulation: TANZANIA_REGIONS.reduce((sum, r) => sum + (r.population || 0), 0),
  totalAreaKm2: TANZANIA_REGIONS.reduce((sum, r) => sum + (r.area || 0), 0),
  mainlandRegions: TANZANIA_REGIONS.filter(r => !r.isZanzibar).length,
  zanzibarRegions: TANZANIA_REGIONS.filter(r => r.isZanzibar).length,
  byZone: Object.keys(TANZANIA_ZONES).reduce((acc, zone) => {
    acc[zone] = TANZANIA_REGIONS.filter(r => r.zone === zone).length;
    return acc;
  }, {})
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation rule definitions for all indicator types
 */
export const VALIDATION_RULES = {
  // Percentage indicators (0-100)
  percentage: {
    type: 'range',
    min: 0,
    max: 100,
    errorMessage: 'Value must be between 0 and 100',
    errorMessageSwahili: 'Thamani lazima iwe kati ya 0 na 100'
  },

  // Score indicators (0-10)
  score: {
    type: 'range',
    min: 0,
    max: 10,
    errorMessage: 'Score must be between 0 and 10',
    errorMessageSwahili: 'Alama lazima iwe kati ya 0 na 10'
  },

  // Population counts (must be positive integer)
  population: {
    type: 'range',
    min: 0,
    max: 100000000,
    mustBeInteger: true,
    errorMessage: 'Population must be a positive integer',
    errorMessageSwahili: 'Idadi ya watu lazima iwe nambari chanya'
  },

  // Rate per 100,000
  ratePer100k: {
    type: 'range',
    min: 0,
    max: 100000,
    errorMessage: 'Rate must be between 0 and 100,000',
    errorMessageSwahili: 'Kiwango lazima kiwe kati ya 0 na 100,000'
  },

  // Density per km2
  density: {
    type: 'range',
    min: 0,
    max: 50000,
    errorMessage: 'Density must be between 0 and 50,000',
    errorMessageSwahili: 'Msongamano lazima uwe kati ya 0 na 50,000'
  },

  // Monetary values (USD)
  currency: {
    type: 'range',
    min: 0,
    max: 1000000000,
    errorMessage: 'Monetary value must be positive',
    errorMessageSwahili: 'Thamani ya fedha lazima iwe chanya'
  },

  // Distance in km
  distance: {
    type: 'range',
    min: 0,
    max: 2000,
    errorMessage: 'Distance must be between 0 and 2000 km',
    errorMessageSwahili: 'Umbali lazima uwe kati ya 0 na 2000 km'
  },

  // Year
  year: {
    type: 'range',
    min: 1900,
    max: 2100,
    mustBeInteger: true,
    errorMessage: 'Year must be between 1900 and 2100',
    errorMessageSwahili: 'Mwaka lazima uwe kati ya 1900 na 2100'
  },

  // Latitude
  latitude: {
    type: 'range',
    min: -90,
    max: 90,
    errorMessage: 'Latitude must be between -90 and 90',
    errorMessageSwahili: 'Latitudo lazima iwe kati ya -90 na 90'
  },

  // Longitude
  longitude: {
    type: 'range',
    min: -180,
    max: 180,
    errorMessage: 'Longitude must be between -180 and 180',
    errorMessageSwahili: 'Longitudo lazima iwe kati ya -180 na 180'
  },

  // Non-negative number
  nonNegative: {
    type: 'range',
    min: 0,
    max: Infinity,
    errorMessage: 'Value must be non-negative',
    errorMessageSwahili: 'Thamani lazima isiwe hasi'
  },

  // Ratio (0 to 1)
  ratio: {
    type: 'range',
    min: 0,
    max: 1,
    errorMessage: 'Ratio must be between 0 and 1',
    errorMessageSwahili: 'Uwiano lazima uwe kati ya 0 na 1'
  }
};

/**
 * Cross-validation rules (validate relationships between fields)
 */
export const CROSS_VALIDATION_RULES = [
  {
    id: 'pop_density_check',
    name: 'Population Density Consistency',
    description: 'Population density should equal population / area',
    check: (data) => {
      if (data.population && data.area_km2 && data.population_density) {
        const expected = data.population / data.area_km2;
        const tolerance = 0.05; // 5% tolerance
        const diff = Math.abs(data.population_density - expected) / expected;
        return diff <= tolerance;
      }
      return true;
    },
    errorMessage: 'Population density inconsistent with population and area'
  },
  {
    id: 'vulnerable_pop_check',
    name: 'Vulnerable Population Check',
    description: 'Vulnerable groups should not exceed total population',
    check: (data) => {
      if (data.total_population) {
        const vulnerable = (data.children_under_5 || 0) +
                          (data.elderly_60_plus || 0) +
                          (data.disabled || 0);
        return vulnerable <= data.total_population;
      }
      return true;
    },
    errorMessage: 'Vulnerable population exceeds total population'
  },
  {
    id: 'risk_components_check',
    name: 'Risk Index Consistency',
    description: 'Risk index should be geometric mean of dimensions',
    check: (data) => {
      if (data.hazard && data.vulnerability && data.lack_coping_capacity && data.risk_index) {
        const expected = Math.pow(data.hazard * data.vulnerability * data.lack_coping_capacity, 1/3);
        const tolerance = 0.1;
        return Math.abs(data.risk_index - expected) <= tolerance;
      }
      return true;
    },
    errorMessage: 'Risk index inconsistent with dimension scores'
  },
  {
    id: 'health_ratio_check',
    name: 'Health Facility Ratio Check',
    description: 'Hospitals should be fewer than health centers',
    check: (data) => {
      if (data.hospitals !== undefined && data.health_centers !== undefined) {
        return data.hospitals <= data.health_centers * 2;
      }
      return true;
    },
    errorMessage: 'Unusual hospital to health center ratio'
  },
  {
    id: 'date_range_check',
    name: 'Date Range Validity',
    description: 'Start date should be before end date',
    check: (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    errorMessage: 'Start date is after end date'
  }
];

/**
 * Temporal validation rules (validate changes over time)
 */
export const TEMPORAL_VALIDATION_RULES = [
  {
    id: 'population_growth_check',
    name: 'Population Growth Rate Check',
    description: 'Annual population change should not exceed 20%',
    maxChangePercent: 20,
    fields: ['total_population', 'population'],
    errorMessage: 'Unusual population change detected (>20% annually)'
  },
  {
    id: 'indicator_stability_check',
    name: 'Indicator Stability Check',
    description: 'Most indicators should not change more than 30% annually',
    maxChangePercent: 30,
    fields: ['*'],  // Apply to all numeric fields
    excludeFields: ['event_count', 'deaths', 'displaced'],  // Exclude volatile fields
    errorMessage: 'Unusual indicator change detected'
  },
  {
    id: 'risk_score_stability',
    name: 'Risk Score Stability',
    description: 'Risk scores should not change more than 2 points annually',
    maxAbsoluteChange: 2,
    fields: ['risk_index', 'hazard', 'vulnerability', 'lack_coping_capacity'],
    errorMessage: 'Unusual risk score change detected'
  }
];

// ============================================================================
// DATA COLLECTION TEMPLATES
// ============================================================================

/**
 * Data collection form templates for each data source type
 */
export const DATA_COLLECTION_TEMPLATES = {
  // Government ministry data collection
  government: {
    id: 'government',
    name: 'Government Data',
    nameSwahili: 'Data ya Serikali',
    description: 'Official data from government ministries and departments',
    descriptionSwahili: 'Data rasmi kutoka wizara na idara za serikali',
    icon: 'building',
    frequency: 'quarterly',
    requiresVerification: true,
    fields: [
      {
        id: 'source_ministry',
        label: 'Source Ministry',
        labelSwahili: 'Wizara Chanzo',
        type: 'select',
        required: true,
        options: [
          { value: 'PMO_DMD', label: 'PMO-DMD (Disaster Management)' },
          { value: 'MoH', label: 'Ministry of Health' },
          { value: 'MoA', label: 'Ministry of Agriculture' },
          { value: 'NBS', label: 'National Bureau of Statistics' },
          { value: 'TMA', label: 'Tanzania Meteorological Authority' },
          { value: 'NEMC', label: 'National Environment Management Council' },
          { value: 'TANAPA', label: 'Tanzania National Parks Authority' },
          { value: 'TRCS', label: 'Tanzania Red Cross Society' }
        ]
      },
      {
        id: 'data_period_start',
        label: 'Data Period Start',
        labelSwahili: 'Mwanzo wa Kipindi',
        type: 'date',
        required: true
      },
      {
        id: 'data_period_end',
        label: 'Data Period End',
        labelSwahili: 'Mwisho wa Kipindi',
        type: 'date',
        required: true
      },
      {
        id: 'admin_level',
        label: 'Administrative Level',
        labelSwahili: 'Ngazi ya Kiutawala',
        type: 'select',
        required: true,
        options: [
          { value: 'national', label: 'National' },
          { value: 'regional', label: 'Regional (ADM1)' },
          { value: 'district', label: 'District (ADM2)' },
          { value: 'ward', label: 'Ward (ADM3)' }
        ]
      },
      {
        id: 'contact_person',
        label: 'Contact Person',
        labelSwahili: 'Mtu wa Kuwasiliana',
        type: 'text',
        required: true
      },
      {
        id: 'contact_email',
        label: 'Contact Email',
        labelSwahili: 'Barua Pepe',
        type: 'email',
        required: true
      },
      {
        id: 'contact_phone',
        label: 'Contact Phone',
        labelSwahili: 'Simu',
        type: 'tel',
        required: false
      },
      {
        id: 'reference_document',
        label: 'Reference Document',
        labelSwahili: 'Hati ya Rejea',
        type: 'file',
        accept: '.pdf,.doc,.docx,.xls,.xlsx',
        required: false
      },
      {
        id: 'verification_status',
        label: 'Verification Status',
        labelSwahili: 'Hali ya Uthibitisho',
        type: 'select',
        required: true,
        options: [
          { value: 'pending', label: 'Pending Verification', labelSwahili: 'Inasubiri Uthibitisho' },
          { value: 'verified', label: 'Verified', labelSwahili: 'Imethibitishwa' },
          { value: 'rejected', label: 'Rejected', labelSwahili: 'Imekataliwa' }
        ]
      },
      {
        id: 'notes',
        label: 'Additional Notes',
        labelSwahili: 'Maelezo ya Ziada',
        type: 'textarea',
        required: false
      }
    ],
    validationRules: {
      requireVerification: true,
      maxAgeMonths: 12,
      requiredFields: ['source_ministry', 'data_period_start', 'data_period_end', 'contact_person', 'contact_email']
    }
  },

  // Survey data (DHS, census, etc.)
  survey: {
    id: 'survey',
    name: 'Survey Data',
    nameSwahili: 'Data ya Utafiti',
    description: 'Data from national surveys and censuses',
    descriptionSwahili: 'Data kutoka utafiti wa kitaifa na sensa',
    icon: 'clipboard-list',
    frequency: 'annual',
    requiresVerification: true,
    fields: [
      {
        id: 'survey_name',
        label: 'Survey Name',
        labelSwahili: 'Jina la Utafiti',
        type: 'select',
        required: true,
        options: [
          { value: 'census', label: 'Population and Housing Census' },
          { value: 'dhs', label: 'Demographic and Health Survey (DHS)' },
          { value: 'mics', label: 'Multiple Indicator Cluster Survey (MICS)' },
          { value: 'hbs', label: 'Household Budget Survey' },
          { value: 'agri_census', label: 'Agricultural Census' },
          { value: 'other', label: 'Other Survey' }
        ]
      },
      {
        id: 'survey_year',
        label: 'Survey Year',
        labelSwahili: 'Mwaka wa Utafiti',
        type: 'number',
        required: true,
        min: 1990,
        max: 2100
      },
      {
        id: 'sample_size',
        label: 'Sample Size',
        labelSwahili: 'Ukubwa wa Sampuli',
        type: 'number',
        required: true,
        min: 100
      },
      {
        id: 'response_rate',
        label: 'Response Rate (%)',
        labelSwahili: 'Kiwango cha Majibu (%)',
        type: 'number',
        required: false,
        min: 0,
        max: 100
      },
      {
        id: 'confidence_level',
        label: 'Confidence Level (%)',
        labelSwahili: 'Kiwango cha Uhakika (%)',
        type: 'number',
        required: true,
        default: 95
      },
      {
        id: 'margin_of_error',
        label: 'Margin of Error (%)',
        labelSwahili: 'Kiwango cha Kosa (%)',
        type: 'number',
        required: false
      },
      {
        id: 'methodology',
        label: 'Methodology',
        labelSwahili: 'Mbinu',
        type: 'textarea',
        required: false
      },
      {
        id: 'geographic_coverage',
        label: 'Geographic Coverage',
        labelSwahili: 'Uenezaji wa Kijiografia',
        type: 'select',
        required: true,
        options: [
          { value: 'national', label: 'National' },
          { value: 'urban', label: 'Urban Only' },
          { value: 'rural', label: 'Rural Only' },
          { value: 'selected_regions', label: 'Selected Regions' }
        ]
      },
      {
        id: 'data_url',
        label: 'Data URL/Source',
        labelSwahili: 'Chanzo cha Data',
        type: 'url',
        required: false
      }
    ],
    validationRules: {
      minSampleSize: 1000,
      maxAgeYears: 5,
      requiredConfidenceLevel: 90,
      requiredResponseRate: 70
    }
  },

  // Real-time API data
  api: {
    id: 'api',
    name: 'API Data',
    nameSwahili: 'Data ya API',
    description: 'Automated data from external APIs',
    descriptionSwahili: 'Data ya kiotomatiki kutoka API za nje',
    icon: 'cloud-download',
    frequency: 'real-time',
    requiresVerification: false,
    fields: [
      {
        id: 'api_source',
        label: 'API Source',
        labelSwahili: 'Chanzo cha API',
        type: 'select',
        required: true,
        options: [
          { value: 'usgs', label: 'USGS Earthquake Data' },
          { value: 'gdacs', label: 'GDACS Alerts' },
          { value: 'acled', label: 'ACLED Conflict Data' },
          { value: 'fewsnet', label: 'FEWS NET Food Security' },
          { value: 'nasa_firms', label: 'NASA FIRMS Fire Data' },
          { value: 'chirps', label: 'CHIRPS Rainfall Data' },
          { value: 'worldbank', label: 'World Bank Indicators' },
          { value: 'hdx', label: 'Humanitarian Data Exchange' }
        ]
      },
      {
        id: 'endpoint',
        label: 'API Endpoint',
        labelSwahili: 'Sehemu ya API',
        type: 'url',
        required: true
      },
      {
        id: 'last_fetch',
        label: 'Last Fetch Time',
        labelSwahili: 'Wakati wa Mwisho Kuchukua',
        type: 'datetime-local',
        required: true
      },
      {
        id: 'fetch_status',
        label: 'Fetch Status',
        labelSwahili: 'Hali ya Kuchukua',
        type: 'select',
        required: true,
        options: [
          { value: 'success', label: 'Success', labelSwahili: 'Imefanikiwa' },
          { value: 'failed', label: 'Failed', labelSwahili: 'Imeshindwa' },
          { value: 'partial', label: 'Partial', labelSwahili: 'Sehemu' },
          { value: 'timeout', label: 'Timeout', labelSwahili: 'Muda Umekwisha' }
        ]
      },
      {
        id: 'records_fetched',
        label: 'Records Fetched',
        labelSwahili: 'Rekodi Zilizochukuliwa',
        type: 'number',
        required: true
      },
      {
        id: 'error_message',
        label: 'Error Message',
        labelSwahili: 'Ujumbe wa Kosa',
        type: 'textarea',
        required: false
      },
      {
        id: 'next_scheduled_fetch',
        label: 'Next Scheduled Fetch',
        labelSwahili: 'Kuchukua Kunakofuata',
        type: 'datetime-local',
        required: false
      }
    ],
    validationRules: {
      maxStalenessHours: 24,
      minRecords: 1
    }
  },

  // Field data collection (community-based)
  field: {
    id: 'field',
    name: 'Field Data',
    nameSwahili: 'Data ya Shamba',
    description: 'Data collected from field surveys and community reports',
    descriptionSwahili: 'Data iliyokusanywa kutoka utafiti wa shamba na ripoti za jamii',
    icon: 'map-pin',
    frequency: 'monthly',
    requiresVerification: true,
    offlineSupported: true,
    fields: [
      {
        id: 'collector_name',
        label: 'Collector Name',
        labelSwahili: 'Jina la Mkusanyaji',
        type: 'text',
        required: true
      },
      {
        id: 'collector_organization',
        label: 'Organization',
        labelSwahili: 'Shirika',
        type: 'text',
        required: true
      },
      {
        id: 'collection_date',
        label: 'Collection Date',
        labelSwahili: 'Tarehe ya Ukusanyaji',
        type: 'date',
        required: true
      },
      {
        id: 'collection_time',
        label: 'Collection Time',
        labelSwahili: 'Wakati wa Ukusanyaji',
        type: 'time',
        required: false
      },
      {
        id: 'latitude',
        label: 'GPS Latitude',
        labelSwahili: 'GPS Latitudo',
        type: 'number',
        required: true,
        step: 0.000001,
        validationRule: 'latitude'
      },
      {
        id: 'longitude',
        label: 'GPS Longitude',
        labelSwahili: 'GPS Longitudo',
        type: 'number',
        required: true,
        step: 0.000001,
        validationRule: 'longitude'
      },
      {
        id: 'gps_accuracy',
        label: 'GPS Accuracy (m)',
        labelSwahili: 'Usahihi wa GPS (m)',
        type: 'number',
        required: false
      },
      {
        id: 'verification_photos',
        label: 'Verification Photos',
        labelSwahili: 'Picha za Uthibitisho',
        type: 'file',
        accept: 'image/*',
        multiple: true,
        required: false
      },
      {
        id: 'community_validated',
        label: 'Community Validated',
        labelSwahili: 'Imethibitishwa na Jamii',
        type: 'checkbox',
        required: false
      },
      {
        id: 'local_informant',
        label: 'Local Informant Name',
        labelSwahili: 'Jina la Mwenyeji',
        type: 'text',
        required: false
      },
      {
        id: 'weather_conditions',
        label: 'Weather Conditions',
        labelSwahili: 'Hali ya Hewa',
        type: 'select',
        required: false,
        options: [
          { value: 'clear', label: 'Clear/Sunny', labelSwahili: 'Jua' },
          { value: 'cloudy', label: 'Cloudy', labelSwahili: 'Mawingu' },
          { value: 'rainy', label: 'Rainy', labelSwahili: 'Mvua' },
          { value: 'stormy', label: 'Stormy', labelSwahili: 'Dhoruba' }
        ]
      },
      {
        id: 'field_notes',
        label: 'Field Notes',
        labelSwahili: 'Maelezo ya Shamba',
        type: 'textarea',
        required: false
      }
    ],
    validationRules: {
      requireGPS: true,
      maxGPSAccuracy: 50,
      requirePhotos: false,
      requireCommunityValidation: true
    }
  },

  // Satellite/Remote Sensing data
  satellite: {
    id: 'satellite',
    name: 'Satellite Data',
    nameSwahili: 'Data ya Setilaiti',
    description: 'Remote sensing and satellite imagery analysis',
    descriptionSwahili: 'Uchambuzi wa picha za setilaiti',
    icon: 'satellite',
    frequency: 'weekly',
    requiresVerification: false,
    fields: [
      {
        id: 'satellite_source',
        label: 'Satellite Source',
        labelSwahili: 'Chanzo cha Setilaiti',
        type: 'select',
        required: true,
        options: [
          { value: 'landsat', label: 'Landsat' },
          { value: 'sentinel', label: 'Sentinel' },
          { value: 'modis', label: 'MODIS' },
          { value: 'viirs', label: 'VIIRS' },
          { value: 'planet', label: 'Planet Labs' }
        ]
      },
      {
        id: 'acquisition_date',
        label: 'Image Acquisition Date',
        labelSwahili: 'Tarehe ya Kupata Picha',
        type: 'date',
        required: true
      },
      {
        id: 'cloud_cover',
        label: 'Cloud Cover (%)',
        labelSwahili: 'Mawingu (%)',
        type: 'number',
        required: true,
        min: 0,
        max: 100
      },
      {
        id: 'spatial_resolution',
        label: 'Spatial Resolution (m)',
        labelSwahili: 'Azimio la Anga (m)',
        type: 'number',
        required: true
      },
      {
        id: 'processing_level',
        label: 'Processing Level',
        labelSwahili: 'Kiwango cha Usindikaji',
        type: 'select',
        required: true,
        options: [
          { value: 'raw', label: 'Raw' },
          { value: 'l1', label: 'Level 1 (Radiometric)' },
          { value: 'l2', label: 'Level 2 (Atmospheric)' },
          { value: 'l3', label: 'Level 3 (Analysis Ready)' }
        ]
      },
      {
        id: 'derived_product',
        label: 'Derived Product',
        labelSwahili: 'Bidhaa Iliyotengenezwa',
        type: 'select',
        required: true,
        options: [
          { value: 'ndvi', label: 'NDVI (Vegetation)' },
          { value: 'ndwi', label: 'NDWI (Water)' },
          { value: 'lst', label: 'LST (Land Surface Temperature)' },
          { value: 'burned_area', label: 'Burned Area' },
          { value: 'flood_extent', label: 'Flood Extent' },
          { value: 'urban_extent', label: 'Urban Extent' }
        ]
      }
    ],
    validationRules: {
      maxCloudCover: 30,
      maxImageAge: 30
    }
  }
};

// ============================================================================
// DATA VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a single indicator value
 */
export function validateIndicatorValue(indicatorId, value, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    normalized: null,
    confidence: 1.0
  };

  // Get indicator definition
  const definition = INDICATOR_DEFINITIONS?.[indicatorId];
  if (!definition) {
    result.warnings.push(`Unknown indicator: ${indicatorId}`);
    // Don't fail validation for unknown indicators in non-strict mode
    if (FRAMEWORK_CONFIG.validation.strictMode) {
      result.valid = false;
      result.errors.push(`Unknown indicator: ${indicatorId}`);
    }
    return result;
  }

  // Check for null/undefined/empty
  if (value === null || value === undefined || value === '') {
    if (definition.required) {
      result.valid = false;
      result.errors.push(`Required indicator ${indicatorId} is missing`);
    } else {
      result.warnings.push(`Optional indicator ${indicatorId} is missing`);
    }
    result.confidence = 0;
    return result;
  }

  // Parse and validate numeric value
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    result.valid = false;
    result.errors.push(`Value for ${indicatorId} must be numeric, got: ${value}`);
    return result;
  }

  result.normalized = numValue;

  // Get validation rule
  const ruleType = definition.validationType || 'nonNegative';
  const rule = VALIDATION_RULES[ruleType];

  if (rule) {
    // Range validation
    if (rule.min !== undefined && numValue < rule.min) {
      result.valid = false;
      result.errors.push(options.language === 'sw' ? rule.errorMessageSwahili : rule.errorMessage);
    }
    if (rule.max !== undefined && numValue > rule.max) {
      result.valid = false;
      result.errors.push(options.language === 'sw' ? rule.errorMessageSwahili : rule.errorMessage);
    }

    // Integer check
    if (rule.mustBeInteger && !Number.isInteger(numValue)) {
      result.valid = false;
      result.errors.push(`Value for ${indicatorId} must be an integer`);
    }
  }

  // Check against indicator-specific range
  if (definition.normalization) {
    const { refMin, refMax } = definition.normalization;
    if (refMin !== undefined && numValue < refMin) {
      result.warnings.push(`Value ${numValue} is below reference minimum ${refMin}`);
      result.confidence *= 0.8;
    }
    if (refMax !== undefined && numValue > refMax) {
      result.warnings.push(`Value ${numValue} exceeds reference maximum ${refMax}`);
      result.confidence *= 0.8;
    }
  }

  // Check thresholds
  if (definition.thresholds) {
    if (numValue >= definition.thresholds.emergency) {
      result.warnings.push(`Value ${numValue} exceeds emergency threshold ${definition.thresholds.emergency}`);
    } else if (numValue >= definition.thresholds.critical) {
      result.warnings.push(`Value ${numValue} exceeds critical threshold ${definition.thresholds.critical}`);
    } else if (numValue >= definition.thresholds.warning) {
      result.warnings.push(`Value ${numValue} exceeds warning threshold ${definition.thresholds.warning}`);
    }
  }

  // Outlier detection (if historical data provided)
  if (options.historicalMean !== undefined && options.historicalStdDev !== undefined) {
    const zScore = Math.abs((numValue - options.historicalMean) / options.historicalStdDev);
    if (zScore > FRAMEWORK_CONFIG.validation.maxOutlierStdDev) {
      result.warnings.push(`Value ${numValue} is a potential outlier (z-score: ${zScore.toFixed(2)})`);
      result.confidence *= 0.7;
    }
  }

  return result;
}

/**
 * Validate complete data submission
 */
export function validateDataSubmission(submission, options = {}) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    indicatorResults: {},
    crossValidationResults: [],
    metadata: {
      validatedAt: new Date().toISOString(),
      totalIndicators: 0,
      validIndicators: 0,
      invalidIndicators: 0,
      missingIndicators: 0,
      warningCount: 0,
      qualityScore: 0
    }
  };

  const lang = options.language || FRAMEWORK_CONFIG.defaultLanguage;

  // Required field validation
  const requiredFields = ['adminUnitCode', 'sourceType', 'dataYear', 'submittedBy'];
  for (const field of requiredFields) {
    if (!submission[field]) {
      result.valid = false;
      result.errors.push(lang === 'sw'
        ? `Sehemu inayohitajika haipo: ${field}`
        : `Required field missing: ${field}`
      );
    }
  }

  // Validate admin unit code
  if (submission.adminUnitCode) {
    const regionExists = TANZANIA_REGIONS.some(r => r.code === submission.adminUnitCode);
    if (!regionExists) {
      result.warnings.push(`Unknown admin unit code: ${submission.adminUnitCode}`);
    }
  }

  // Validate source type
  if (submission.sourceType && !DATA_COLLECTION_TEMPLATES[submission.sourceType]) {
    result.valid = false;
    result.errors.push(`Invalid source type: ${submission.sourceType}`);
  }

  // Validate data year
  if (submission.dataYear) {
    const currentYear = new Date().getFullYear();
    if (submission.dataYear > currentYear + 1) {
      result.valid = false;
      result.errors.push('Data year cannot be in the future');
    }
    if (currentYear - submission.dataYear > 10) {
      result.warnings.push('Data is more than 10 years old');
    } else if (currentYear - submission.dataYear > 5) {
      result.warnings.push('Data is more than 5 years old');
    } else if (currentYear - submission.dataYear > 3) {
      result.warnings.push('Data is more than 3 years old');
    }
  }

  // Validate each indicator
  if (submission.indicators) {
    for (const [indicatorId, value] of Object.entries(submission.indicators)) {
      result.metadata.totalIndicators++;

      const indicatorResult = validateIndicatorValue(indicatorId, value, {
        language: lang,
        historicalMean: options.historicalData?.[indicatorId]?.mean,
        historicalStdDev: options.historicalData?.[indicatorId]?.stdDev
      });

      result.indicatorResults[indicatorId] = indicatorResult;

      if (!indicatorResult.valid) {
        result.metadata.invalidIndicators++;
        result.errors.push(...indicatorResult.errors.map(e => `${indicatorId}: ${e}`));
      } else if (indicatorResult.normalized !== null) {
        result.metadata.validIndicators++;
      } else {
        result.metadata.missingIndicators++;
      }

      result.warnings.push(...indicatorResult.warnings.map(w => `${indicatorId}: ${w}`));
      result.metadata.warningCount += indicatorResult.warnings.length;
    }
  }

  // Cross-validation (if enabled)
  if (FRAMEWORK_CONFIG.validation.crossValidationEnabled && submission.indicators) {
    for (const rule of CROSS_VALIDATION_RULES) {
      const passed = rule.check(submission.indicators);
      result.crossValidationResults.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        message: passed ? null : rule.errorMessage
      });

      if (!passed) {
        result.warnings.push(`Cross-validation failed: ${rule.errorMessage}`);
      }
    }
  }

  // Temporal validation (if historical data provided)
  if (FRAMEWORK_CONFIG.validation.temporalValidationEnabled && options.previousSubmission) {
    const temporalResults = validateTemporalChanges(
      submission.indicators,
      options.previousSubmission.indicators,
      options.previousSubmission.dataYear,
      submission.dataYear
    );
    result.warnings.push(...temporalResults.warnings);
  }

  // Calculate overall quality score
  if (result.metadata.totalIndicators > 0) {
    const validRatio = result.metadata.validIndicators / result.metadata.totalIndicators;
    const warningPenalty = Math.min(0.3, result.metadata.warningCount * 0.02);
    result.metadata.qualityScore = Math.round((validRatio - warningPenalty) * 100);
  }

  // Set overall validity
  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}

/**
 * Validate temporal changes between submissions
 */
export function validateTemporalChanges(currentData, previousData, previousYear, currentYear) {
  const result = { warnings: [], anomalies: [] };
  const yearsDiff = currentYear - previousYear;

  if (yearsDiff <= 0 || !previousData || !currentData) {
    return result;
  }

  for (const rule of TEMPORAL_VALIDATION_RULES) {
    const fieldsToCheck = rule.fields.includes('*')
      ? Object.keys(currentData).filter(f =>
          !rule.excludeFields || !rule.excludeFields.includes(f)
        )
      : rule.fields;

    for (const field of fieldsToCheck) {
      const current = parseFloat(currentData[field]);
      const previous = parseFloat(previousData[field]);

      if (isNaN(current) || isNaN(previous) || previous === 0) continue;

      // Check percentage change
      if (rule.maxChangePercent !== undefined) {
        const changePercent = Math.abs((current - previous) / previous) * 100;
        const annualizedChange = changePercent / yearsDiff;

        if (annualizedChange > rule.maxChangePercent) {
          result.warnings.push(
            `${field}: ${rule.errorMessage} (${annualizedChange.toFixed(1)}% annual change)`
          );
          result.anomalies.push({
            field,
            ruleId: rule.id,
            previousValue: previous,
            currentValue: current,
            changePercent: annualizedChange
          });
        }
      }

      // Check absolute change
      if (rule.maxAbsoluteChange !== undefined) {
        const absoluteChange = Math.abs(current - previous);
        const annualizedAbsolute = absoluteChange / yearsDiff;

        if (annualizedAbsolute > rule.maxAbsoluteChange) {
          result.warnings.push(
            `${field}: ${rule.errorMessage} (${annualizedAbsolute.toFixed(2)} annual change)`
          );
          result.anomalies.push({
            field,
            ruleId: rule.id,
            previousValue: previous,
            currentValue: current,
            absoluteChange: annualizedAbsolute
          });
        }
      }
    }
  }

  return result;
}

// ============================================================================
// DATA QUALITY METRICS
// ============================================================================

/**
 * Calculate comprehensive data quality metrics
 */
export function calculateDataQuality(indicators, metadata = {}) {
  const result = {
    overallScore: 0,
    completeness: calculateDataCompleteness(indicators, metadata.resolution),
    freshness: calculateDataFreshness(metadata.dataYears || {}),
    accuracy: calculateDataAccuracy(indicators),
    consistency: calculateDataConsistency(indicators),
    reliability: calculateDataReliability(metadata),
    grade: 'Unknown',
    recommendations: []
  };

  // Calculate weighted overall score
  const weights = {
    completeness: 0.25,
    freshness: 0.20,
    accuracy: 0.25,
    consistency: 0.15,
    reliability: 0.15
  };

  result.overallScore = Math.round(
    result.completeness.overall * weights.completeness +
    result.freshness.freshnessScore * weights.freshness +
    result.accuracy.score * weights.accuracy +
    result.consistency.score * weights.consistency +
    result.reliability.score * weights.reliability
  );

  // Determine grade
  const grades = FRAMEWORK_CONFIG.quality;
  if (result.overallScore >= grades.excellent.min) {
    result.grade = 'Excellent';
  } else if (result.overallScore >= grades.good.min) {
    result.grade = 'Good';
  } else if (result.overallScore >= grades.fair.min) {
    result.grade = 'Fair';
  } else if (result.overallScore >= grades.poor.min) {
    result.grade = 'Poor';
  } else {
    result.grade = 'Critical';
  }

  // Generate recommendations
  if (result.completeness.overall < 70) {
    result.recommendations.push({
      priority: 'high',
      area: 'completeness',
      message: `Data completeness is ${result.completeness.overall.toFixed(1)}%. Focus on collecting missing indicators.`,
      missingIndicators: result.completeness.missing || []
    });
  }

  if (result.freshness.freshnessScore < 50) {
    result.recommendations.push({
      priority: 'high',
      area: 'freshness',
      message: `${result.freshness.stale} indicators have stale data. Update data sources.`
    });
  }

  if (result.consistency.score < 70) {
    result.recommendations.push({
      priority: 'medium',
      area: 'consistency',
      message: 'Data consistency issues detected. Review cross-validation failures.'
    });
  }

  return result;
}

/**
 * Calculate data completeness for an admin unit
 */
export function calculateDataCompleteness(indicators, resolution = 'ADM2') {
  const indicatorDefs = INDICATOR_DEFINITIONS || {};
  const requiredIndicators = Object.entries(indicatorDefs)
    .filter(([_, def]) =>
      def.resolution === resolution ||
      def.resolution === 'National' ||
      def.resolution === 'all'
    )
    .map(([id]) => id);

  const totalRequired = requiredIndicators.length || 1;
  const available = [];
  const missing = [];
  const invalid = [];

  for (const id of requiredIndicators) {
    const value = indicators?.[id];
    if (value !== null && value !== undefined && value !== '' && value !== '#DIV/0!') {
      available.push(id);
    } else {
      missing.push(id);
    }
  }

  // Check for invalid values
  for (const [id, value] of Object.entries(indicators || {})) {
    const parsed = parseFloat(value);
    if (value !== null && value !== undefined && value !== '' && isNaN(parsed)) {
      invalid.push(id);
    }
  }

  const overall = (available.length / totalRequired) * 100;

  // Calculate by dimension
  const byDimension = {};
  const byCategory = {};

  for (const [indicatorId, definition] of Object.entries(indicatorDefs)) {
    const dimension = definition.dimension || 'Unknown';
    const category = definition.category || 'Unknown';

    if (!byDimension[dimension]) {
      byDimension[dimension] = { total: 0, available: 0, percentage: 0 };
    }
    if (!byCategory[category]) {
      byCategory[category] = { total: 0, available: 0, percentage: 0 };
    }

    byDimension[dimension].total++;
    byCategory[category].total++;

    const value = indicators?.[indicatorId];
    if (value !== null && value !== undefined && value !== '' && value !== '#DIV/0!') {
      byDimension[dimension].available++;
      byCategory[category].available++;
    }
  }

  // Calculate percentages
  for (const key of Object.keys(byDimension)) {
    const d = byDimension[key];
    byDimension[key].percentage = d.total > 0 ? Math.round((d.available / d.total) * 100) : 0;
  }

  for (const key of Object.keys(byCategory)) {
    const c = byCategory[key];
    byCategory[key].percentage = c.total > 0 ? Math.round((c.available / c.total) * 100) : 0;
  }

  return {
    overall: Math.round(overall * 10) / 10,
    available: available.length,
    missing: missing,
    invalid: invalid,
    totalRequired,
    byDimension,
    byCategory
  };
}

/**
 * Calculate data freshness score
 */
export function calculateDataFreshness(dataYears) {
  const currentYear = new Date().getFullYear();
  const results = { current: 0, recent: 0, stale: 0, outdated: 0, unknown: 0 };
  const details = [];

  for (const [indicatorId, year] of Object.entries(dataYears)) {
    if (!year) {
      results.unknown++;
      details.push({ indicatorId, status: 'unknown', year: null });
      continue;
    }

    const age = currentYear - year;
    let status;

    if (age <= 1) {
      results.current++;
      status = 'current';
    } else if (age <= 3) {
      results.recent++;
      status = 'recent';
    } else if (age <= 5) {
      results.stale++;
      status = 'stale';
    } else {
      results.outdated++;
      status = 'outdated';
    }

    details.push({ indicatorId, status, year, age });
  }

  const total = Object.keys(dataYears).length || 1;
  const freshnessScore = Math.round(
    ((results.current * 100 + results.recent * 70 + results.stale * 30 + results.outdated * 10) / total)
  );

  return {
    ...results,
    total,
    freshnessScore,
    details,
    averageAge: details.length > 0
      ? Math.round(details.filter(d => d.age).reduce((sum, d) => sum + d.age, 0) / details.filter(d => d.age).length * 10) / 10
      : null
  };
}

/**
 * Calculate data accuracy score
 */
export function calculateDataAccuracy(indicators) {
  let validCount = 0;
  let invalidCount = 0;
  let outOfRangeCount = 0;
  const issues = [];

  for (const [indicatorId, value] of Object.entries(indicators || {})) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      invalidCount++;
      issues.push({ indicatorId, issue: 'non-numeric', value });
      continue;
    }

    // Check against known ranges
    const definition = INDICATOR_DEFINITIONS?.[indicatorId];
    if (definition?.normalization) {
      const { refMin, refMax } = definition.normalization;
      if ((refMin !== undefined && parsed < refMin * 0.5) ||
          (refMax !== undefined && parsed > refMax * 2)) {
        outOfRangeCount++;
        issues.push({ indicatorId, issue: 'out-of-range', value: parsed, range: [refMin, refMax] });
      } else {
        validCount++;
      }
    } else {
      validCount++;
    }
  }

  const total = validCount + invalidCount + outOfRangeCount;
  const score = total > 0 ? Math.round((validCount / total) * 100) : 100;

  return {
    score,
    validCount,
    invalidCount,
    outOfRangeCount,
    issues
  };
}

/**
 * Calculate data consistency score
 */
export function calculateDataConsistency(indicators) {
  const results = { passed: 0, failed: 0, skipped: 0 };
  const failures = [];

  for (const rule of CROSS_VALIDATION_RULES) {
    try {
      const passed = rule.check(indicators || {});
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
        failures.push({
          ruleId: rule.id,
          ruleName: rule.name,
          message: rule.errorMessage
        });
      }
    } catch (e) {
      results.skipped++;
    }
  }

  const total = results.passed + results.failed;
  const score = total > 0 ? Math.round((results.passed / total) * 100) : 100;

  return {
    score,
    ...results,
    failures
  };
}

/**
 * Calculate data reliability score
 */
export function calculateDataReliability(metadata) {
  let score = 100;
  const factors = [];

  // Source type reliability
  const sourceReliability = {
    government: 90,
    survey: 85,
    api: 80,
    satellite: 85,
    field: 70,
    estimate: 50,
    unknown: 30
  };

  if (metadata.sourceType) {
    const sourceScore = sourceReliability[metadata.sourceType] || 50;
    factors.push({ factor: 'sourceType', score: sourceScore });
    score = Math.min(score, sourceScore);
  }

  // Verification status
  if (metadata.verified === true) {
    factors.push({ factor: 'verified', score: 100 });
  } else if (metadata.verified === false) {
    factors.push({ factor: 'unverified', score: 60 });
    score = Math.min(score, 60);
  }

  // Sample size (for survey data)
  if (metadata.sampleSize) {
    let sampleScore = 100;
    if (metadata.sampleSize < 100) {
      sampleScore = 40;
    } else if (metadata.sampleSize < 500) {
      sampleScore = 60;
    } else if (metadata.sampleSize < 1000) {
      sampleScore = 80;
    }
    factors.push({ factor: 'sampleSize', score: sampleScore, value: metadata.sampleSize });
    score = Math.min(score, sampleScore);
  }

  // Confidence level
  if (metadata.confidenceLevel) {
    const confScore = Math.min(100, metadata.confidenceLevel);
    factors.push({ factor: 'confidenceLevel', score: confScore, value: metadata.confidenceLevel });
    score = Math.min(score, confScore);
  }

  return { score, factors };
}

// ============================================================================
// DATA COLLECTION SCHEDULE
// ============================================================================

/**
 * Generate data collection schedule
 */
export function generateCollectionSchedule(options = {}) {
  const schedule = [];
  const currentDate = new Date();
  const dataSources = TANZANIA_DATA_SOURCES || {};

  for (const [sourceId, source] of Object.entries(dataSources)) {
    const task = {
      id: `task_${sourceId}_${Date.now()}`,
      sourceId,
      sourceName: source.name || sourceId,
      sourceType: source.type || 'api',
      indicators: source.indicators || [],
      frequency: source.updateFrequency || 'monthly',
      priority: source.priority || 'medium',
      lastCollection: null,
      nextCollection: null,
      status: 'pending',
      contactEmail: source.contactEmail,
      estimatedDuration: source.estimatedDuration || '1 hour',
      dependencies: source.dependencies || [],
      retryCount: 0
    };

    // Calculate next collection date
    task.nextCollection = calculateNextCollectionDate(
      source.updateFrequency,
      source.lastCollection,
      currentDate
    );

    // Add region-specific tasks if source is regional
    if (source.regional && options.includeRegional) {
      for (const region of TANZANIA_REGIONS) {
        schedule.push({
          ...task,
          id: `task_${sourceId}_${region.code}_${Date.now()}`,
          regionCode: region.code,
          regionName: region.name
        });
      }
    } else {
      schedule.push(task);
    }
  }

  // Sort by next collection date and priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  schedule.sort((a, b) => {
    const dateCompare = new Date(a.nextCollection) - new Date(b.nextCollection);
    if (dateCompare !== 0) return dateCompare;
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  return schedule;
}

/**
 * Calculate next collection date based on frequency
 */
function calculateNextCollectionDate(frequency, lastCollection, baseDate = new Date()) {
  const last = lastCollection ? new Date(lastCollection) : new Date(0);
  const next = new Date(Math.max(last.getTime(), baseDate.getTime()));

  switch (frequency) {
    case 'real-time':
    case 'hourly':
      next.setHours(next.getHours() + 1);
      break;
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1);
      break;
    case 'quarterly':
      const currentQuarter = Math.floor(next.getMonth() / 3);
      next.setMonth((currentQuarter + 1) * 3, 1);
      break;
    case 'semi-annual':
      const currentHalf = Math.floor(next.getMonth() / 6);
      next.setMonth((currentHalf + 1) * 6, 1);
      break;
    case 'annual':
      next.setFullYear(next.getFullYear() + 1, 0, 1);
      break;
    case '5-yearly':
      next.setFullYear(next.getFullYear() + 5, 0, 1);
      break;
    case '10-yearly':
      next.setFullYear(next.getFullYear() + 10, 0, 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1, 1);
  }

  return next.toISOString();
}

// ============================================================================
// DATA IMPORT/EXPORT
// ============================================================================

/**
 * Parse CSV data with intelligent type detection
 */
export function parseCSV(csvContent, options = {}) {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return { headers: [], data: [], errors: [] };

  const delimiter = options.delimiter || detectDelimiter(csvContent);
  const headers = parseCSVLine(lines[0], delimiter);
  const data = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i], delimiter);
      if (values.length !== headers.length) {
        errors.push({ line: i + 1, error: 'Column count mismatch' });
        continue;
      }

      const row = {};
      for (let j = 0; j < headers.length; j++) {
        const value = values[j]?.trim();
        row[headers[j]] = value === '' || value === '#DIV/0!' || value === 'N/A' ? null : value;
      }
      data.push(row);
    } catch (e) {
      errors.push({ line: i + 1, error: e.message });
    }
  }

  return { headers, data, errors, rowCount: data.length };
}

/**
 * Detect CSV delimiter
 */
function detectDelimiter(content) {
  const firstLine = content.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detected = ',';

  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = d;
    }
  }

  return detected;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line, delimiter = ',') {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Convert INFORM CSV row to indicator data structure
 */
export function csvRowToIndicatorData(row, indicatorColumns) {
  const adminUnit = {
    country: row.COUNTRY || row.Country || 'Tanzania',
    adm1Name: row.ADM1_NAME || row.Region || row.adm1_name,
    adm2Name: row.ADM2_NAME || row.District || row.adm2_name,
    iso3: row.ISO3 || row.iso3 || 'TZA',
    adm1Code: row.ADM1_PCODE || row.ADM1_CODE || row.adm1_code,
    adm2Code: row.ADM2_PCODE || row.ADM2_CODE || row.adm2_code
  };

  const indicators = {};
  for (const column of indicatorColumns) {
    if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
      const parsed = parseFloat(row[column]);
      indicators[column] = isNaN(parsed) ? row[column] : parsed;
    }
  }

  return { adminUnit, indicators };
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data, columns, options = {}) {
  const includeHeaders = options.includeHeaders !== false;
  const delimiter = options.delimiter || ',';
  const lineEnding = options.lineEnding || '\n';

  const escapeValue = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [];

  if (includeHeaders) {
    lines.push(columns.map(escapeValue).join(delimiter));
  }

  for (const row of data) {
    lines.push(columns.map(col => escapeValue(row[col])).join(delimiter));
  }

  return lines.join(lineEnding);
}

/**
 * Export data to JSON format with metadata
 */
export function exportToJSON(data, metadata = {}) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: FRAMEWORK_CONFIG.version,
    ...metadata,
    recordCount: data.length,
    data
  }, null, 2);
}

// ============================================================================
// COLLECTION REPORT
// ============================================================================

/**
 * Generate comprehensive collection report
 */
export function generateCollectionReport(collectionResults, options = {}) {
  const report = {
    generatedAt: new Date().toISOString(),
    version: FRAMEWORK_CONFIG.version,
    period: options.period || 'current',
    summary: {
      totalSources: 0,
      successfulCollections: 0,
      failedCollections: 0,
      partialCollections: 0,
      totalIndicators: 0,
      totalRecords: 0,
      dataCompleteness: 0
    },
    bySource: {},
    byRegion: {},
    byDimension: {},
    timeline: [],
    issues: [],
    recommendations: [],
    quality: null
  };

  // Process each source result
  for (const [sourceId, result] of Object.entries(collectionResults || {})) {
    report.summary.totalSources++;

    const sourceReport = {
      status: result.success ? 'success' : (result.partial ? 'partial' : 'failed'),
      indicatorsCollected: result.indicators?.length || 0,
      recordsCollected: result.records || 0,
      errors: result.errors || [],
      warnings: result.warnings || [],
      duration: result.duration,
      timestamp: result.timestamp,
      quality: result.quality || null
    };

    report.bySource[sourceId] = sourceReport;

    if (result.success) {
      report.summary.successfulCollections++;
      report.summary.totalIndicators += sourceReport.indicatorsCollected;
      report.summary.totalRecords += sourceReport.recordsCollected;
    } else if (result.partial) {
      report.summary.partialCollections++;
      report.summary.totalIndicators += sourceReport.indicatorsCollected;
    } else {
      report.summary.failedCollections++;

      report.issues.push({
        severity: 'error',
        source: sourceId,
        message: result.error || 'Collection failed',
        timestamp: result.timestamp
      });
    }

    // Add to timeline
    if (result.timestamp) {
      report.timeline.push({
        timestamp: result.timestamp,
        source: sourceId,
        event: result.success ? 'collection_success' : 'collection_failed',
        details: { indicators: sourceReport.indicatorsCollected, errors: sourceReport.errors.length }
      });
    }
  }

  // Calculate overall completeness
  report.summary.dataCompleteness = report.summary.totalSources > 0
    ? Math.round(((report.summary.successfulCollections + report.summary.partialCollections * 0.5) /
        report.summary.totalSources) * 100)
    : 0;

  // Sort timeline
  report.timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Generate recommendations
  if (report.summary.dataCompleteness < 50) {
    report.recommendations.push({
      priority: 'critical',
      message: 'Data completeness is below 50%. Immediate action required.',
      actions: ['Review failed data sources', 'Check network connectivity', 'Verify API credentials']
    });
  }

  if (report.summary.failedCollections > 0) {
    report.recommendations.push({
      priority: 'high',
      message: `${report.summary.failedCollections} data source(s) failed to collect.`,
      actions: report.issues.filter(i => i.severity === 'error').map(i => `Fix ${i.source}: ${i.message}`)
    });
  }

  if (report.summary.partialCollections > 0) {
    report.recommendations.push({
      priority: 'medium',
      message: `${report.summary.partialCollections} data source(s) had partial collection.`,
      actions: ['Review partial collections for missing data', 'Retry failed indicators']
    });
  }

  return report;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get region by code or name
 */
export function getRegion(codeOrName) {
  return TANZANIA_REGIONS.find(r =>
    r.code === codeOrName ||
    r.name.toLowerCase() === codeOrName.toLowerCase() ||
    r.nameSwahili?.toLowerCase() === codeOrName.toLowerCase()
  );
}

/**
 * Get regions by zone
 */
export function getRegionsByZone(zone) {
  return TANZANIA_REGIONS.filter(r => r.zone === zone);
}

/**
 * Get form template with localized labels
 */
export function getLocalizedTemplate(templateId, language = 'en') {
  const template = DATA_COLLECTION_TEMPLATES[templateId];
  if (!template) return null;

  const isSwahili = language === 'sw';

  return {
    ...template,
    name: isSwahili ? template.nameSwahili : template.name,
    description: isSwahili ? template.descriptionSwahili : template.description,
    fields: template.fields.map(field => ({
      ...field,
      label: isSwahili ? (field.labelSwahili || field.label) : field.label,
      options: field.options?.map(opt => ({
        ...opt,
        label: isSwahili ? (opt.labelSwahili || opt.label) : opt.label
      }))
    }))
  };
}

/**
 * Calculate collection priority score
 */
export function calculateCollectionPriority(source, currentStatus) {
  let priority = 50; // Base priority

  // Increase priority for critical sources
  if (source.priority === 'critical') priority += 30;
  else if (source.priority === 'high') priority += 20;
  else if (source.priority === 'low') priority -= 10;

  // Increase priority for stale data
  const daysSinceUpdate = currentStatus?.lastUpdate
    ? Math.floor((Date.now() - new Date(currentStatus.lastUpdate)) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceUpdate > 30) priority += 20;
  else if (daysSinceUpdate > 7) priority += 10;

  // Increase priority for failed previous attempts
  if (currentStatus?.consecutiveFailures > 0) {
    priority += Math.min(20, currentStatus.consecutiveFailures * 5);
  }

  return Math.min(100, Math.max(0, priority));
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Configuration
  FRAMEWORK_CONFIG,

  // Administrative structure
  TANZANIA_ZONES,
  TANZANIA_REGIONS,
  TANZANIA_STATS,

  // Validation
  VALIDATION_RULES,
  CROSS_VALIDATION_RULES,
  TEMPORAL_VALIDATION_RULES,
  validateIndicatorValue,
  validateDataSubmission,
  validateTemporalChanges,

  // Data collection templates
  DATA_COLLECTION_TEMPLATES,
  getLocalizedTemplate,

  // Data quality
  calculateDataQuality,
  calculateDataCompleteness,
  calculateDataFreshness,
  calculateDataAccuracy,
  calculateDataConsistency,
  calculateDataReliability,

  // Scheduling
  generateCollectionSchedule,
  calculateCollectionPriority,

  // Import/Export
  parseCSV,
  csvRowToIndicatorData,
  exportToCSV,
  exportToJSON,

  // Reporting
  generateCollectionReport,

  // Utilities
  getRegion,
  getRegionsByZone
};
