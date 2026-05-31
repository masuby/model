/**
 * INFORM TANZANIA DATABASE SCHEMA
 *
 * Professional database schema implementing INFORM methodology
 * with comprehensive validation, relationships, constraints, and migrations.
 *
 * INFORM Risk Formula: Risk = (H×E × V × LCC)^(1/3)
 * where:
 * - H×E = max(Natural, Human) hazards
 * - V = mean(Socio-Economic, Vulnerable Groups)
 * - LCC = mean(Infrastructure, Institutional)
 *
 * Features:
 * - Field validation with custom validators
 * - Relationship definitions with referential integrity
 * - Computed fields and virtual properties
 * - Schema versioning and migration support
 * - Index optimization
 * - Audit trail support
 */

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export const DB_CONFIG = {
  version: '2.0.0',
  name: 'inform_tanzania_db',
  engine: 'indexeddb', // or 'sqlite', 'postgres'
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  timezone: 'Africa/Dar_es_Salaam',

  // Migration settings
  migrations: {
    tableName: '_migrations',
    directory: './migrations'
  },

  // Audit settings
  audit: {
    enabled: true,
    tableName: 'audit_logs',
    trackFields: ['created_at', 'updated_at', 'created_by', 'updated_by']
  }
};

// For backwards compatibility
export const DB_VERSION = DB_CONFIG.version;
export const DB_NAME = DB_CONFIG.name;

// ============================================================================
// FIELD TYPES & VALIDATORS
// ============================================================================

export const FIELD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  TIMESTAMP: 'timestamp',
  ARRAY: 'array',
  OBJECT: 'object',
  JSON: 'json',
  UUID: 'uuid',
  ENUM: 'enum',
  TEXT: 'text',
  DECIMAL: 'decimal',
  FLOAT: 'float',
  INTEGER: 'integer',
  GEOJSON: 'geojson'
};

/**
 * Built-in field validators
 */
export const VALIDATORS = {
  // String validators
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^\+?[0-9]{10,15}$/.test(value),
  url: (value) => {
    try { new URL(value); return true; } catch { return false; }
  },
  alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),
  minLength: (min) => (value) => value && value.length >= min,
  maxLength: (max) => (value) => !value || value.length <= max,
  pattern: (regex) => (value) => regex.test(value),

  // Number validators
  min: (minVal) => (value) => value >= minVal,
  max: (maxVal) => (value) => value <= maxVal,
  range: (minVal, maxVal) => (value) => value >= minVal && value <= maxVal,
  positive: (value) => value > 0,
  nonNegative: (value) => value >= 0,
  integer: (value) => Number.isInteger(value),
  decimal: (places) => (value) => {
    const parts = String(value).split('.');
    return !parts[1] || parts[1].length <= places;
  },

  // INFORM specific validators
  informScore: (value) => value >= 0 && value <= 10,
  percentage: (value) => value >= 0 && value <= 100,
  year: (value) => value >= 1900 && value <= 2100,

  // Date validators
  futureDate: (value) => new Date(value) > new Date(),
  pastDate: (value) => new Date(value) < new Date(),
  dateRange: (start, end) => (value) => {
    const date = new Date(value);
    return date >= new Date(start) && date <= new Date(end);
  },

  // Custom validators
  custom: (fn) => fn
};

// ============================================================================
// ENUM DEFINITIONS
// ============================================================================

export const ENUMS = {
  // Risk classifications
  RISK_CLASS: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],

  // Data quality
  DATA_QUALITY: ['High', 'Medium', 'Low', 'Unknown'],

  // Admin levels
  ADMIN_LEVEL: {
    NATIONAL: 0,
    REGION: 1,
    DISTRICT: 2,
    WARD: 3,
    VILLAGE: 4
  },

  // Warning levels
  WARNING_LEVEL: ['Monitor', 'Advisory', 'Warning', 'Major Warning'],

  // Warning status
  WARNING_STATUS: ['Draft', 'Pending Approval', 'Approved', 'Published', 'Cancelled', 'Expired'],

  // Hazard types
  HAZARD_TYPE: [
    'Heavy Rainfall', 'Flood', 'Drought', 'Landslide', 'Earthquake',
    'Cyclone', 'Storm', 'Heatwave', 'Disease Outbreak', 'Wildfire',
    'Coastal Erosion', 'Environmental Degradation', 'Conflict', 'Lightning',
    'Volcano', 'Tsunami', 'Locust Infestation'
  ],

  // User roles
  USER_ROLE: ['super_admin', 'admin', 'pmo_officer', 'regional_officer', 'district_officer', 'data_collector', 'viewer'],

  // User status
  USER_STATUS: ['active', 'inactive', 'suspended', 'pending'],

  // Severity classes
  SEVERITY_CLASS: ['Minor', 'Moderate', 'Severe', 'Critical', 'Catastrophic'],

  // Climate scenarios
  CLIMATE_SCENARIO: ['RCP2.6', 'RCP4.5', 'RCP6.0', 'RCP8.5', 'SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'],

  // Time horizons
  TIME_HORIZON: ['2030', '2040', '2050', '2070', '2100'],

  // SMS status
  SMS_STATUS: ['pending', 'queued', 'sent', 'delivered', 'failed', 'bounced'],

  // Languages
  LANGUAGE: ['en', 'sw'],

  // Spatial extent
  SPATIAL_EXTENT: ['Local', 'Ward', 'District', 'Regional', 'Zonal', 'National'],

  // Event status
  EVENT_STATUS: ['Ongoing', 'Stabilized', 'Recovery', 'Closed']
};

// ============================================================================
// FIELD DEFINITION HELPERS
// ============================================================================

/**
 * Create a standard field definition
 */
function field(type, options = {}) {
  return {
    type,
    required: options.required || false,
    unique: options.unique || false,
    index: options.index || false,
    default: options.default,
    validate: options.validate || [],
    transform: options.transform,
    computed: options.computed || false,
    virtual: options.virtual || false,
    description: options.description || '',
    ...options
  };
}

/**
 * Primary key field
 */
function primaryKey(type = 'uuid') {
  return field(type, {
    primaryKey: true,
    required: true,
    unique: true,
    index: true,
    default: type === 'uuid' ? () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` : undefined
  });
}

/**
 * Foreign key field
 */
function foreignKey(reference, options = {}) {
  const [table, column = 'id'] = reference.split('.');
  return field('string', {
    ...options,
    foreignKey: { table, column },
    index: true,
    onDelete: options.onDelete || 'CASCADE',
    onUpdate: options.onUpdate || 'CASCADE'
  });
}

/**
 * INFORM score field (0-10)
 */
function informScore(options = {}) {
  return field('decimal', {
    ...options,
    min: 0,
    max: 10,
    precision: 4,
    validate: [VALIDATORS.informScore],
    description: options.description || 'INFORM score (0-10)'
  });
}

/**
 * Timestamp fields
 */
function timestamps() {
  return {
    created_at: field('timestamp', {
      required: true,
      default: () => new Date().toISOString(),
      description: 'Record creation timestamp'
    }),
    updated_at: field('timestamp', {
      default: () => new Date().toISOString(),
      description: 'Last update timestamp'
    }),
    created_by: field('string', {
      description: 'User ID who created the record'
    }),
    updated_by: field('string', {
      description: 'User ID who last updated the record'
    })
  };
}

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Administrative Unit Schema (Regions and Districts)
 */
export const ADMIN_UNIT_SCHEMA = {
  tableName: 'administrative_units',
  description: 'Tanzania administrative divisions (regions, districts, wards)',

  fields: {
    id: primaryKey(),

    // Geographic identification
    country: field('string', {
      default: 'United Republic of Tanzania',
      description: 'Country name'
    }),
    iso3: field('string', {
      default: 'TZA',
      maxLength: 3,
      description: 'ISO 3166-1 alpha-3 country code'
    }),

    // Administrative names and codes
    adm1_name: field('string', {
      required: true,
      index: true,
      description: 'Region name'
    }),
    adm1_code: field('string', {
      required: true,
      index: true,
      description: 'Region code (e.g., TZ01)'
    }),
    adm2_name: field('string', {
      index: true,
      description: 'District name (null for regions)'
    }),
    adm2_code: field('string', {
      index: true,
      description: 'District code (e.g., TZ0101)'
    }),
    adm3_name: field('string', {
      description: 'Ward name'
    }),
    adm3_code: field('string', {
      description: 'Ward code'
    }),

    // Hierarchy
    level: field('integer', {
      required: true,
      index: true,
      enum: Object.values(ENUMS.ADMIN_LEVEL),
      description: '0=National, 1=Region, 2=District, 3=Ward, 4=Village'
    }),
    parent_id: foreignKey('administrative_units.id', {
      description: 'Parent administrative unit'
    }),
    zone: field('string', {
      index: true,
      description: 'Administrative zone (e.g., Northern, Central)'
    }),

    // Demographics
    population: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Total population'
    }),
    population_year: field('integer', {
      validate: [VALIDATORS.year],
      description: 'Year of population data'
    }),
    area_km2: field('decimal', {
      validate: [VALIDATORS.positive],
      description: 'Area in square kilometers'
    }),
    population_density: field('decimal', {
      computed: true,
      description: 'Population per square kilometer'
    }),

    // Geographic coordinates
    centroid_lat: field('decimal', {
      min: -90,
      max: 90,
      description: 'Centroid latitude'
    }),
    centroid_lng: field('decimal', {
      min: -180,
      max: 180,
      description: 'Centroid longitude'
    }),
    bounding_box: field('object', {
      description: 'Geographic bounding box {north, south, east, west}'
    }),
    geometry: field('geojson', {
      description: 'GeoJSON boundary polygon'
    }),

    // Characteristics
    urban_rural: field('string', {
      enum: ['Urban', 'Rural', 'Mixed'],
      description: 'Settlement type'
    }),
    coastal: field('boolean', {
      default: false,
      description: 'Whether the unit has coastline'
    }),
    border_country: field('array', {
      description: 'Adjacent countries for border regions'
    }),

    // Administrative info
    capital: field('string', {
      description: 'Regional/district capital'
    }),
    established_date: field('date', {
      description: 'Date the unit was established'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['adm1_code'], unique: false },
    { fields: ['adm2_code'], unique: false },
    { fields: ['level', 'parent_id'] },
    { fields: ['zone'] },
    { fields: ['centroid_lat', 'centroid_lng'], type: 'spatial' }
  ],

  relations: {
    parent: {
      type: 'belongsTo',
      target: 'administrative_units',
      foreignKey: 'parent_id'
    },
    children: {
      type: 'hasMany',
      target: 'administrative_units',
      foreignKey: 'parent_id'
    },
    riskIndicators: {
      type: 'hasMany',
      target: 'risk_indicators',
      foreignKey: 'admin_unit_id'
    },
    population: {
      type: 'hasMany',
      target: 'population_data',
      foreignKey: 'admin_unit_id'
    },
    infrastructure: {
      type: 'hasOne',
      target: 'infrastructure_resources',
      foreignKey: 'admin_unit_id'
    }
  },

  hooks: {
    beforeSave: (record) => {
      // Calculate population density
      if (record.population && record.area_km2) {
        record.population_density = record.population / record.area_km2;
      }
      return record;
    }
  }
};

/**
 * Risk Indicator Schema - Stores all INFORM indicators
 */
export const RISK_INDICATOR_SCHEMA = {
  tableName: 'risk_indicators',
  description: 'INFORM risk indicator values for administrative units',

  fields: {
    id: primaryKey(),
    admin_unit_id: foreignKey('administrative_units.id', { required: true }),
    year: field('integer', {
      required: true,
      index: true,
      validate: [VALIDATORS.year],
      description: 'Data year'
    }),

    // =========== HAZARD AND EXPOSURE (Dimension) ===========
    // Natural Hazards (Category)
    // Geophysical (Component)
    earthquake: informScore({ description: 'Earthquake hazard index' }),
    volcano: informScore({ description: 'Volcanic hazard index' }),
    landslide: informScore({ description: 'Landslide hazard index' }),

    // Meteorological (Component)
    flood: informScore({ description: 'Flood hazard index' }),
    drought: informScore({ description: 'Drought hazard index' }),
    storms_cyclone: informScore({ description: 'Tropical cyclone/storm hazard' }),
    heatwave: informScore({ description: 'Heatwave hazard index' }),
    wildfire: informScore({ description: 'Wildfire hazard index' }),
    lightning: informScore({ description: 'Lightning hazard index' }),

    // Coastal (Component)
    coastal_hazards: informScore({ description: 'Coastal hazard index (erosion, flooding)' }),
    tsunami: informScore({ description: 'Tsunami hazard index' }),

    // Biological (Component)
    zoonoses: informScore({ description: 'Zoonotic disease hazard' }),
    epidemics: informScore({ description: 'Epidemic hazard index' }),
    locust: informScore({ description: 'Locust/pest infestation hazard' }),

    // Environmental (Component)
    environmental_degradation: informScore({ description: 'Environmental degradation index' }),

    // Aggregates
    natural_hazard_aggregate: informScore({
      computed: true,
      description: 'Aggregated natural hazard score'
    }),

    // Human Hazards (Category)
    conflict_intensity: informScore({ description: 'Current conflict intensity' }),
    conflict_risk: informScore({ description: 'Projected conflict risk' }),
    internal_violence: informScore({ description: 'Internal violence index' }),
    hazardous_material: informScore({ description: 'Hazardous material/industrial risk' }),
    vehicle_accidents: informScore({ description: 'Road accident hazard' }),

    human_hazard_aggregate: informScore({
      computed: true,
      description: 'Aggregated human hazard score'
    }),

    // Dimension Total
    hazard_exposure_total: informScore({
      computed: true,
      description: 'Total Hazard & Exposure dimension score'
    }),

    // =========== VULNERABILITY (Dimension) ===========
    // Socio-Economic Vulnerability (Category)
    development_poverty: informScore({ description: 'Development & poverty index' }),
    inequality: informScore({ description: 'Inequality index (Gini)' }),
    economic_dependency: informScore({ description: 'Economic dependency index' }),
    aid_dependency: informScore({ description: 'Aid dependency ratio' }),

    socio_economic_aggregate: informScore({
      computed: true,
      description: 'Aggregated socio-economic vulnerability'
    }),

    // Vulnerable Groups (Category)
    uprooted_people: informScore({ description: 'Uprooted/displaced people index' }),
    orphans: informScore({ description: 'Orphan population index' }),
    health_conditions: informScore({ description: 'Health conditions vulnerability' }),
    children_under5: informScore({ description: 'Children under 5 vulnerability' }),
    malnutrition: informScore({ description: 'Malnutrition prevalence' }),
    food_insecurity: informScore({ description: 'Food insecurity index' }),

    vulnerable_groups_aggregate: informScore({
      computed: true,
      description: 'Aggregated vulnerable groups score'
    }),

    // Dimension Total
    vulnerability_total: informScore({
      computed: true,
      description: 'Total Vulnerability dimension score'
    }),

    // =========== LACK OF COPING CAPACITY (Dimension) ===========
    // Infrastructure (Category)
    access_health: informScore({ description: 'Access to health services (inverted)' }),
    access_education: informScore({ description: 'Access to education (inverted)' }),
    wash: informScore({ description: 'Water, sanitation, hygiene access (inverted)' }),
    communication: informScore({ description: 'Communication infrastructure (inverted)' }),
    physical_infrastructure: informScore({ description: 'Physical infrastructure (inverted)' }),

    infrastructure_aggregate: informScore({
      computed: true,
      description: 'Aggregated infrastructure coping capacity'
    }),

    // Institutional (Category)
    drr_implementation: informScore({ description: 'DRR implementation (inverted)' }),
    governance: informScore({ description: 'Governance quality (inverted)' }),
    corruption: informScore({ description: 'Corruption perception (inverted)' }),
    government_effectiveness: informScore({ description: 'Government effectiveness (inverted)' }),

    institutional_aggregate: informScore({
      computed: true,
      description: 'Aggregated institutional coping capacity'
    }),

    // Dimension Total
    lack_coping_capacity_total: informScore({
      computed: true,
      description: 'Total Lack of Coping Capacity dimension score'
    }),

    // =========== FINAL RISK INDEX ===========
    risk_index: informScore({
      computed: true,
      index: true,
      description: 'Final INFORM Risk Index'
    }),
    risk_class: field('enum', {
      enum: ENUMS.RISK_CLASS,
      index: true,
      description: 'Risk classification based on risk_index'
    }),
    risk_rank: field('integer', {
      description: 'Rank among all admin units'
    }),

    // =========== TREND ANALYSIS ===========
    risk_trend: field('string', {
      enum: ['Improving', 'Stable', 'Worsening'],
      description: 'Risk trend compared to previous period'
    }),
    risk_change: field('decimal', {
      description: 'Change in risk index from previous year'
    }),

    // =========== METADATA ===========
    data_source: field('string', {
      description: 'Primary data source'
    }),
    data_quality: field('enum', {
      enum: ENUMS.DATA_QUALITY,
      default: 'Medium',
      description: 'Overall data quality assessment'
    }),
    completeness: field('decimal', {
      min: 0,
      max: 100,
      description: 'Percentage of indicators with data'
    }),
    last_verified: field('date', {
      description: 'Last verification date'
    }),
    verified_by: field('string', {
      description: 'User who verified the data'
    }),
    notes: field('text', {
      description: 'Additional notes'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['admin_unit_id', 'year'], unique: true },
    { fields: ['year'] },
    { fields: ['risk_index'] },
    { fields: ['risk_class'] },
    { fields: ['data_quality'] }
  ],

  relations: {
    adminUnit: {
      type: 'belongsTo',
      target: 'administrative_units',
      foreignKey: 'admin_unit_id'
    }
  },

  hooks: {
    beforeSave: (record) => {
      // Calculate aggregates and totals
      // This would call the formula engine
      return record;
    }
  }
};

/**
 * Warning Schema - Active warnings and alerts
 */
export const WARNING_SCHEMA = {
  tableName: 'warnings',
  description: 'Hazard warnings and alerts',

  fields: {
    id: primaryKey(),
    warning_number: field('string', {
      required: true,
      unique: true,
      description: 'Unique warning number (e.g., WRN-2024-001)'
    }),

    // Hazard Information
    hazard_type: field('enum', {
      required: true,
      enum: ENUMS.HAZARD_TYPE,
      index: true,
      description: 'Type of hazard'
    }),
    hazard_subtype: field('string', {
      description: 'Hazard sub-category'
    }),
    hazard_intensity: informScore({
      description: 'Hazard intensity (0-10)'
    }),

    // Warning Classification
    warning_level: field('enum', {
      required: true,
      enum: ENUMS.WARNING_LEVEL,
      index: true,
      description: 'Warning severity level'
    }),
    warning_score: informScore({
      description: 'Calculated warning score'
    }),
    certainty: field('string', {
      enum: ['Observed', 'Likely', 'Possible', 'Unlikely'],
      description: 'Certainty of the event'
    }),
    urgency: field('string', {
      enum: ['Immediate', 'Expected', 'Future', 'Past'],
      description: 'Urgency of action'
    }),

    // Temporal
    onset_date: field('datetime', {
      description: 'Expected onset date'
    }),
    valid_from: field('datetime', {
      required: true,
      index: true,
      description: 'Warning validity start'
    }),
    valid_until: field('datetime', {
      required: true,
      index: true,
      description: 'Warning validity end'
    }),
    issued_at: field('datetime', {
      required: true,
      default: () => new Date().toISOString(),
      description: 'Issue timestamp'
    }),

    // Spatial Extent
    affected_regions: field('array', {
      description: 'Array of affected region codes'
    }),
    affected_districts: field('array', {
      description: 'Array of affected district codes'
    }),
    affected_wards: field('array', {
      description: 'Array of affected ward codes'
    }),
    spatial_extent: field('enum', {
      enum: ENUMS.SPATIAL_EXTENT,
      index: true,
      description: 'Geographic extent of warning'
    }),
    affected_area_km2: field('decimal', {
      description: 'Total affected area'
    }),
    geometry: field('geojson', {
      description: 'Affected area geometry'
    }),

    // Impact Assessment
    population_at_risk: field('integer', {
      description: 'Estimated population at risk'
    }),
    vulnerable_population: field('integer', {
      description: 'Vulnerable population at risk'
    }),
    estimated_impact: field('text', {
      description: 'Impact description'
    }),
    impact_sectors: field('array', {
      description: 'Affected sectors (health, agriculture, etc.)'
    }),

    // Recommended Actions
    recommended_actions: field('array', {
      description: 'List of recommended actions'
    }),
    target_actors: field('array', {
      description: 'Target actors for actions'
    }),
    evacuation_required: field('boolean', {
      default: false,
      description: 'Whether evacuation is recommended'
    }),

    // Status
    status: field('enum', {
      enum: ENUMS.WARNING_STATUS,
      default: 'Draft',
      index: true,
      description: 'Warning workflow status'
    }),
    supersedes_warning_id: foreignKey('warnings.id', {
      description: 'Previous warning this supersedes'
    }),

    // Issuing Authority
    issuing_agency: field('string', {
      default: 'Tanzania Meteorological Authority',
      description: 'Issuing agency'
    }),
    issued_by_user_id: foreignKey('users.id', {
      description: 'User who issued the warning'
    }),
    approved_by_user_id: foreignKey('users.id', {
      description: 'User who approved the warning'
    }),
    approved_at: field('datetime', {
      description: 'Approval timestamp'
    }),

    // Communication
    sms_sent: field('boolean', {
      default: false,
      description: 'SMS notifications sent'
    }),
    sms_count: field('integer', {
      default: 0,
      description: 'Number of SMS sent'
    }),
    bulletin_generated: field('boolean', {
      default: false,
      description: 'Bulletin generated'
    }),

    // Metadata
    confidence_level: field('enum', {
      enum: ENUMS.DATA_QUALITY,
      default: 'Medium',
      description: 'Confidence in the warning'
    }),
    data_sources: field('array', {
      description: 'Data sources used'
    }),
    notes: field('text', {
      description: 'Additional notes'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['warning_number'], unique: true },
    { fields: ['hazard_type', 'status'] },
    { fields: ['warning_level'] },
    { fields: ['valid_from', 'valid_until'] },
    { fields: ['status'] }
  ],

  relations: {
    issuedBy: {
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'issued_by_user_id'
    },
    approvedBy: {
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'approved_by_user_id'
    },
    bulletins: {
      type: 'hasMany',
      target: 'bulletins',
      foreignKey: 'warning_id'
    },
    smsLogs: {
      type: 'hasMany',
      target: 'sms_logs',
      foreignKey: 'warning_id'
    },
    supersedes: {
      type: 'belongsTo',
      target: 'warnings',
      foreignKey: 'supersedes_warning_id'
    }
  }
};

/**
 * Bulletin Schema - Generated warning bulletins
 */
export const BULLETIN_SCHEMA = {
  tableName: 'bulletins',
  description: 'Warning bulletins and publications',

  fields: {
    id: primaryKey(),
    warning_id: foreignKey('warnings.id', { required: true }),
    bulletin_number: field('string', {
      required: true,
      unique: true,
      description: 'Unique bulletin number'
    }),

    // Content
    title: field('string', {
      required: true,
      description: 'Bulletin title'
    }),
    title_sw: field('string', {
      description: 'Bulletin title in Swahili'
    }),
    summary: field('text', {
      description: 'Executive summary'
    }),
    summary_sw: field('text', {
      description: 'Summary in Swahili'
    }),
    content_json: field('json', {
      description: 'Structured bulletin content'
    }),

    // Format & Files
    format: field('enum', {
      enum: ['PDF', 'HTML', 'JSON', 'DOCX'],
      default: 'PDF',
      description: 'Output format'
    }),
    file_path: field('string', {
      description: 'File storage path'
    }),
    file_url: field('string', {
      description: 'Public URL for download'
    }),
    file_size: field('integer', {
      description: 'File size in bytes'
    }),

    // Distribution
    distribution_channels: field('array', {
      default: ['email', 'web'],
      description: 'Distribution channels'
    }),
    recipients: field('array', {
      description: 'List of recipient IDs or emails'
    }),
    recipient_count: field('integer', {
      default: 0,
      description: 'Number of recipients'
    }),

    // Status
    status: field('enum', {
      enum: ['Draft', 'Published', 'Superseded', 'Cancelled'],
      default: 'Draft',
      index: true,
      description: 'Bulletin status'
    }),
    published_at: field('datetime', {
      index: true,
      description: 'Publication timestamp'
    }),

    // Metadata
    generated_by_user_id: foreignKey('users.id'),
    version: field('integer', {
      default: 1,
      description: 'Bulletin version'
    }),
    language: field('enum', {
      enum: ENUMS.LANGUAGE,
      default: 'en',
      description: 'Primary language'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['bulletin_number'], unique: true },
    { fields: ['warning_id'] },
    { fields: ['status'] },
    { fields: ['published_at'] }
  ],

  relations: {
    warning: {
      type: 'belongsTo',
      target: 'warnings',
      foreignKey: 'warning_id'
    },
    generatedBy: {
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'generated_by_user_id'
    }
  }
};

/**
 * User Schema
 */
export const USER_SCHEMA = {
  tableName: 'users',
  description: 'System users and authentication',

  fields: {
    id: primaryKey(),

    // Authentication
    email: field('string', {
      required: true,
      unique: true,
      index: true,
      validate: [VALIDATORS.email],
      description: 'Email address'
    }),
    password_hash: field('string', {
      description: 'Hashed password'
    }),
    password_salt: field('string', {
      description: 'Password salt'
    }),

    // Profile
    name: field('string', {
      required: true,
      description: 'Full name'
    }),
    title: field('string', {
      description: 'Job title'
    }),
    avatar_url: field('string', {
      description: 'Profile picture URL'
    }),

    // Role and Permissions
    role: field('enum', {
      required: true,
      enum: ENUMS.USER_ROLE,
      default: 'viewer',
      index: true,
      description: 'User role'
    }),
    permissions: field('array', {
      default: [],
      description: 'Specific permissions'
    }),

    // Assignment
    assigned_region: field('string', {
      index: true,
      description: 'Primary assigned region code'
    }),
    assigned_regions: field('array', {
      description: 'All assigned region codes'
    }),
    assigned_districts: field('array', {
      description: 'Assigned district codes'
    }),
    department: field('string', {
      description: 'Department/organization'
    }),
    organization: field('string', {
      description: 'Organization name'
    }),

    // Contact
    phone: field('string', {
      validate: [VALIDATORS.phone],
      description: 'Phone number'
    }),
    phone_verified: field('boolean', {
      default: false,
      description: 'Phone verified status'
    }),
    alternative_email: field('string', {
      validate: [VALIDATORS.email],
      description: 'Alternative email'
    }),

    // Status
    status: field('enum', {
      enum: ENUMS.USER_STATUS,
      default: 'pending',
      index: true,
      description: 'Account status'
    }),
    email_verified: field('boolean', {
      default: false,
      description: 'Email verified status'
    }),

    // Security
    last_login: field('datetime', {
      description: 'Last login timestamp'
    }),
    last_login_ip: field('string', {
      description: 'Last login IP address'
    }),
    failed_login_attempts: field('integer', {
      default: 0,
      description: 'Consecutive failed login attempts'
    }),
    locked_until: field('datetime', {
      description: 'Account locked until this time'
    }),
    password_changed_at: field('datetime', {
      description: 'Last password change'
    }),

    // Preferences
    preferences: field('json', {
      default: {},
      description: 'User preferences'
    }),
    notification_settings: field('json', {
      default: { email: true, sms: true, push: false },
      description: 'Notification preferences'
    }),
    language: field('enum', {
      enum: ENUMS.LANGUAGE,
      default: 'en',
      description: 'Preferred language'
    }),
    timezone: field('string', {
      default: 'Africa/Dar_es_Salaam',
      description: 'User timezone'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['role'] },
    { fields: ['status'] },
    { fields: ['assigned_region'] }
  ]
};

/**
 * Audit Log Schema
 */
export const AUDIT_LOG_SCHEMA = {
  tableName: 'audit_logs',
  description: 'System audit trail',

  fields: {
    id: primaryKey(),

    // Event Details
    event_type: field('string', {
      required: true,
      index: true,
      description: 'Event type (e.g., USER_LOGIN, WARNING_CREATED)'
    }),
    event_category: field('string', {
      index: true,
      description: 'Category (auth, data, system)'
    }),
    severity: field('enum', {
      enum: ['debug', 'info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
      description: 'Event severity'
    }),

    // Actor
    user_id: foreignKey('users.id'),
    user_name: field('string', {
      description: 'Username at time of event'
    }),
    user_role: field('string', {
      description: 'User role at time of event'
    }),
    ip_address: field('string', {
      description: 'Client IP address'
    }),
    user_agent: field('string', {
      description: 'Browser/client user agent'
    }),

    // Target
    target_type: field('string', {
      index: true,
      description: 'Target entity type'
    }),
    target_id: field('string', {
      index: true,
      description: 'Target entity ID'
    }),

    // Details
    action: field('string', {
      description: 'Action performed (create, update, delete, view)'
    }),
    description: field('text', {
      description: 'Human-readable description'
    }),
    metadata: field('json', {
      description: 'Additional event metadata'
    }),
    changes: field('json', {
      description: 'Before/after values for updates'
    }),

    // Request info
    request_id: field('string', {
      description: 'Request correlation ID'
    }),
    session_id: field('string', {
      description: 'Session ID'
    }),

    // Timestamp
    created_at: field('timestamp', {
      required: true,
      default: () => new Date().toISOString(),
      index: true
    })
  },

  indexes: [
    { fields: ['event_type'] },
    { fields: ['user_id', 'created_at'] },
    { fields: ['target_type', 'target_id'] },
    { fields: ['created_at'] },
    { fields: ['severity'] }
  ]
};

/**
 * SMS Log Schema
 */
export const SMS_LOG_SCHEMA = {
  tableName: 'sms_logs',
  description: 'SMS message logs',

  fields: {
    id: primaryKey(),
    warning_id: foreignKey('warnings.id'),
    bulletin_id: foreignKey('bulletins.id'),

    // Recipient
    recipient_phone: field('string', {
      required: true,
      index: true,
      description: 'Recipient phone number'
    }),
    recipient_name: field('string', {
      description: 'Recipient name'
    }),
    recipient_role: field('string', {
      description: 'Recipient role'
    }),
    recipient_district: field('string', {
      index: true,
      description: 'Recipient district'
    }),
    recipient_user_id: foreignKey('users.id'),

    // Message
    message_content: field('text', {
      required: true,
      description: 'SMS content'
    }),
    message_type: field('enum', {
      enum: ['alert', 'update', 'cancellation', 'test', 'reminder'],
      default: 'alert',
      index: true,
      description: 'Message type'
    }),
    language: field('enum', {
      enum: ENUMS.LANGUAGE,
      default: 'en',
      description: 'Message language'
    }),
    character_count: field('integer', {
      description: 'Character count'
    }),
    segment_count: field('integer', {
      default: 1,
      description: 'Number of SMS segments'
    }),

    // Delivery
    provider: field('string', {
      description: 'SMS provider name'
    }),
    provider_message_id: field('string', {
      index: true,
      description: 'Provider message ID'
    }),
    status: field('enum', {
      enum: ENUMS.SMS_STATUS,
      default: 'pending',
      index: true,
      description: 'Delivery status'
    }),
    queued_at: field('datetime', {
      description: 'Queued timestamp'
    }),
    sent_at: field('datetime', {
      index: true,
      description: 'Sent timestamp'
    }),
    delivered_at: field('datetime', {
      description: 'Delivery timestamp'
    }),

    // Error Handling
    error_code: field('string', {
      description: 'Error code if failed'
    }),
    error_message: field('string', {
      description: 'Error message if failed'
    }),
    retry_count: field('integer', {
      default: 0,
      description: 'Retry attempts'
    }),
    max_retries: field('integer', {
      default: 3,
      description: 'Maximum retry attempts'
    }),
    next_retry_at: field('datetime', {
      description: 'Next retry timestamp'
    }),

    // Cost tracking
    cost: field('decimal', {
      description: 'Cost in local currency'
    }),

    // Metadata
    batch_id: field('string', {
      index: true,
      description: 'Batch ID for bulk sends'
    }),
    created_at: field('timestamp', {
      required: true,
      default: () => new Date().toISOString()
    })
  },

  indexes: [
    { fields: ['warning_id'] },
    { fields: ['status'] },
    { fields: ['recipient_phone'] },
    { fields: ['sent_at'] },
    { fields: ['batch_id'] }
  ],

  relations: {
    warning: {
      type: 'belongsTo',
      target: 'warnings',
      foreignKey: 'warning_id'
    },
    bulletin: {
      type: 'belongsTo',
      target: 'bulletins',
      foreignKey: 'bulletin_id'
    },
    recipient: {
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'recipient_user_id'
    }
  }
};

/**
 * Severity Event Schema (Post-event assessment)
 */
export const SEVERITY_EVENT_SCHEMA = {
  tableName: 'severity_events',
  description: 'Post-event severity assessments',

  fields: {
    id: primaryKey(),
    warning_id: foreignKey('warnings.id'),

    // Event Information
    event_name: field('string', {
      required: true,
      description: 'Event name'
    }),
    event_type: field('enum', {
      required: true,
      enum: ENUMS.HAZARD_TYPE,
      index: true,
      description: 'Event type'
    }),
    event_start_date: field('datetime', {
      required: true,
      index: true,
      description: 'Event start date'
    }),
    event_end_date: field('datetime', {
      description: 'Event end date'
    }),

    // Location
    affected_regions: field('array', {
      description: 'Affected region codes'
    }),
    affected_districts: field('array', {
      description: 'Affected district codes'
    }),
    affected_wards: field('array', {
      description: 'Affected ward codes'
    }),
    coordinates: field('object', {
      description: 'Event coordinates {lat, lng}'
    }),
    geometry: field('geojson', {
      description: 'Affected area geometry'
    }),

    // Human Impact
    people_affected: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Total people affected'
    }),
    people_displaced: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'People displaced'
    }),
    casualties: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Fatalities'
    }),
    injuries: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Injuries'
    }),
    missing: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Missing persons'
    }),

    // Infrastructure Damage
    houses_damaged: field('integer', {
      description: 'Houses damaged'
    }),
    houses_destroyed: field('integer', {
      description: 'Houses destroyed'
    }),
    schools_affected: field('integer', {
      description: 'Schools affected'
    }),
    health_facilities_affected: field('integer', {
      description: 'Health facilities affected'
    }),
    roads_damaged_km: field('decimal', {
      description: 'Roads damaged (km)'
    }),
    bridges_damaged: field('integer', {
      description: 'Bridges damaged'
    }),
    infrastructure_damage: field('json', {
      description: 'Detailed infrastructure damage'
    }),

    // Economic Impact
    economic_loss_tzs: field('decimal', {
      description: 'Economic loss in TZS'
    }),
    economic_loss_usd: field('decimal', {
      description: 'Economic loss in USD'
    }),
    crops_affected_hectares: field('decimal', {
      description: 'Crop area affected (hectares)'
    }),
    livestock_lost: field('integer', {
      description: 'Livestock lost'
    }),

    // Severity Classification
    severity_score: informScore({
      description: 'Overall severity score'
    }),
    severity_class: field('enum', {
      enum: ENUMS.SEVERITY_CLASS,
      index: true,
      description: 'Severity classification'
    }),

    // Response
    response_actions: field('array', {
      description: 'Response actions taken'
    }),
    agencies_involved: field('array', {
      description: 'Responding agencies'
    }),
    relief_items_distributed: field('json', {
      description: 'Relief items distributed'
    }),

    // Status
    status: field('enum', {
      enum: ENUMS.EVENT_STATUS,
      default: 'Ongoing',
      index: true,
      description: 'Event status'
    }),

    // Metadata
    data_source: field('string', {
      description: 'Assessment data source'
    }),
    verified: field('boolean', {
      default: false,
      description: 'Data verified status'
    }),
    verified_by: foreignKey('users.id'),
    verified_at: field('datetime'),
    notes: field('text', {
      description: 'Additional notes'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['event_type'] },
    { fields: ['event_start_date'] },
    { fields: ['severity_class'] },
    { fields: ['status'] },
    { fields: ['warning_id'] }
  ],

  relations: {
    warning: {
      type: 'belongsTo',
      target: 'warnings',
      foreignKey: 'warning_id'
    }
  }
};

/**
 * Climate Projection Schema
 */
export const CLIMATE_PROJECTION_SCHEMA = {
  tableName: 'climate_projections',
  description: 'Climate change projections by region',

  fields: {
    id: primaryKey(),
    admin_unit_id: foreignKey('administrative_units.id', { required: true }),

    // Scenario
    scenario: field('enum', {
      required: true,
      enum: ENUMS.CLIMATE_SCENARIO,
      index: true,
      description: 'Climate scenario (RCP/SSP)'
    }),
    time_horizon: field('enum', {
      required: true,
      enum: ENUMS.TIME_HORIZON,
      index: true,
      description: 'Projection time horizon'
    }),
    baseline_period: field('string', {
      default: '1986-2005',
      description: 'Baseline comparison period'
    }),

    // Temperature Projections
    temp_change_avg: field('decimal', {
      description: 'Average temperature change (°C)'
    }),
    temp_change_min: field('decimal', {
      description: 'Minimum projected change (°C)'
    }),
    temp_change_max: field('decimal', {
      description: 'Maximum projected change (°C)'
    }),
    extreme_heat_days: field('integer', {
      description: 'Additional extreme heat days per year'
    }),
    heat_wave_frequency: field('decimal', {
      description: 'Change in heat wave frequency'
    }),

    // Precipitation Projections
    precip_change_percent: field('decimal', {
      description: 'Precipitation change (%)'
    }),
    wet_season_change: field('decimal', {
      description: 'Wet season duration change (days)'
    }),
    dry_season_change: field('decimal', {
      description: 'Dry season duration change (days)'
    }),
    extreme_precip_change: field('decimal', {
      description: 'Change in extreme precipitation events (%)'
    }),

    // Hazard Risk Changes
    drought_risk_change: field('decimal', {
      description: 'Change in drought risk (%)'
    }),
    flood_risk_change: field('decimal', {
      description: 'Change in flood risk (%)'
    }),
    cyclone_risk_change: field('decimal', {
      description: 'Change in cyclone risk (%)'
    }),

    // Sea Level (coastal areas)
    sea_level_rise_mm: field('decimal', {
      description: 'Sea level rise (mm)'
    }),
    coastal_erosion_risk: informScore({
      description: 'Coastal erosion risk index'
    }),
    storm_surge_risk: informScore({
      description: 'Storm surge risk index'
    }),

    // Agricultural Impact
    crop_yield_change: field('decimal', {
      description: 'Expected crop yield change (%)'
    }),
    growing_season_change: field('integer', {
      description: 'Change in growing season (days)'
    }),
    water_stress_change: field('decimal', {
      description: 'Change in water stress index'
    }),

    // Risk Projection
    projected_risk_change: field('decimal', {
      description: 'Projected overall risk change'
    }),
    projected_risk_index: informScore({
      description: 'Projected INFORM risk index'
    }),
    adaptation_priority: field('enum', {
      enum: ['Low', 'Medium', 'High', 'Critical'],
      description: 'Adaptation priority level'
    }),
    key_vulnerabilities: field('array', {
      description: 'Key identified vulnerabilities'
    }),
    recommended_adaptations: field('array', {
      description: 'Recommended adaptation measures'
    }),

    // Metadata
    model_source: field('string', {
      description: 'Climate model source'
    }),
    model_ensemble: field('string', {
      description: 'Model ensemble used'
    }),
    confidence_level: field('enum', {
      enum: ENUMS.DATA_QUALITY,
      default: 'Medium',
      description: 'Projection confidence level'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['admin_unit_id', 'scenario', 'time_horizon'], unique: true },
    { fields: ['scenario'] },
    { fields: ['time_horizon'] },
    { fields: ['adaptation_priority'] }
  ],

  relations: {
    adminUnit: {
      type: 'belongsTo',
      target: 'administrative_units',
      foreignKey: 'admin_unit_id'
    }
  }
};

/**
 * Population Data Schema
 */
export const POPULATION_SCHEMA = {
  tableName: 'population_data',
  description: 'Population statistics by administrative unit',

  fields: {
    id: primaryKey(),
    admin_unit_id: foreignKey('administrative_units.id', { required: true }),
    year: field('integer', {
      required: true,
      index: true,
      validate: [VALIDATORS.year],
      description: 'Data year'
    }),

    // Total Population
    total_population: field('integer', {
      required: true,
      validate: [VALIDATORS.nonNegative],
      description: 'Total population'
    }),
    male_population: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Male population'
    }),
    female_population: field('integer', {
      validate: [VALIDATORS.nonNegative],
      description: 'Female population'
    }),

    // Age Distribution
    population_0_4: field('integer', {
      description: 'Population age 0-4'
    }),
    population_5_14: field('integer', {
      description: 'Population age 5-14'
    }),
    population_15_24: field('integer', {
      description: 'Population age 15-24'
    }),
    population_25_64: field('integer', {
      description: 'Population age 25-64'
    }),
    population_65_plus: field('integer', {
      description: 'Population age 65+'
    }),
    median_age: field('decimal', {
      description: 'Median age'
    }),
    dependency_ratio: field('decimal', {
      description: 'Age dependency ratio'
    }),

    // Vulnerable Groups
    children_under_5: field('integer', {
      description: 'Children under 5'
    }),
    elderly_65_plus: field('integer', {
      description: 'Elderly 65+'
    }),
    persons_with_disabilities: field('integer', {
      description: 'Persons with disabilities'
    }),
    internally_displaced: field('integer', {
      description: 'IDPs'
    }),
    refugees: field('integer', {
      description: 'Refugees'
    }),
    orphans: field('integer', {
      description: 'Orphaned children'
    }),
    female_headed_households: field('integer', {
      description: 'Female-headed households'
    }),

    // Density & Distribution
    population_density: field('decimal', {
      computed: true,
      description: 'People per km²'
    }),
    urban_population: field('integer', {
      description: 'Urban population'
    }),
    rural_population: field('integer', {
      description: 'Rural population'
    }),
    urbanization_rate: field('decimal', {
      description: 'Urban population percentage'
    }),

    // Growth
    growth_rate: field('decimal', {
      description: 'Annual growth rate (%)'
    }),
    birth_rate: field('decimal', {
      description: 'Births per 1000'
    }),
    death_rate: field('decimal', {
      description: 'Deaths per 1000'
    }),
    fertility_rate: field('decimal', {
      description: 'Total fertility rate'
    }),

    // Metadata
    data_source: field('string', {
      description: 'Data source (e.g., NBS Census)'
    }),
    is_projection: field('boolean', {
      default: false,
      description: 'Whether this is projected data'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['admin_unit_id', 'year'], unique: true },
    { fields: ['year'] }
  ],

  relations: {
    adminUnit: {
      type: 'belongsTo',
      target: 'administrative_units',
      foreignKey: 'admin_unit_id'
    }
  }
};

/**
 * Infrastructure Resources Schema
 */
export const INFRASTRUCTURE_SCHEMA = {
  tableName: 'infrastructure_resources',
  description: 'Infrastructure and resource data',

  fields: {
    id: primaryKey(),
    admin_unit_id: foreignKey('administrative_units.id', { required: true }),
    data_year: field('integer', {
      required: true,
      index: true,
      validate: [VALIDATORS.year],
      description: 'Data year'
    }),

    // Health Facilities
    hospitals: field('integer', {
      description: 'Number of hospitals'
    }),
    health_centers: field('integer', {
      description: 'Number of health centers'
    }),
    dispensaries: field('integer', {
      description: 'Number of dispensaries'
    }),
    hospital_beds: field('integer', {
      description: 'Total hospital beds'
    }),
    icu_beds: field('integer', {
      description: 'ICU beds'
    }),
    doctors: field('integer', {
      description: 'Number of doctors'
    }),
    nurses: field('integer', {
      description: 'Number of nurses'
    }),
    health_workers_per_1000: field('decimal', {
      computed: true,
      description: 'Health workers per 1000 population'
    }),

    // Emergency Services
    fire_stations: field('integer', {
      description: 'Fire stations'
    }),
    police_stations: field('integer', {
      description: 'Police stations'
    }),
    emergency_shelters: field('integer', {
      description: 'Emergency shelters'
    }),
    shelter_capacity: field('integer', {
      description: 'Total shelter capacity'
    }),
    emergency_vehicles: field('integer', {
      description: 'Emergency vehicles'
    }),

    // Education
    primary_schools: field('integer', {
      description: 'Primary schools'
    }),
    secondary_schools: field('integer', {
      description: 'Secondary schools'
    }),
    vocational_centers: field('integer', {
      description: 'Vocational training centers'
    }),

    // Water and Sanitation
    water_points: field('integer', {
      description: 'Improved water points'
    }),
    water_treatment_plants: field('integer', {
      description: 'Water treatment plants'
    }),
    water_coverage_percent: field('decimal', {
      validate: [VALIDATORS.percentage],
      description: 'Population with improved water access (%)'
    }),
    sanitation_coverage_percent: field('decimal', {
      validate: [VALIDATORS.percentage],
      description: 'Population with improved sanitation (%)'
    }),

    // Transportation
    paved_roads_km: field('decimal', {
      description: 'Paved roads (km)'
    }),
    unpaved_roads_km: field('decimal', {
      description: 'Unpaved roads (km)'
    }),
    bridges: field('integer', {
      description: 'Number of bridges'
    }),
    airports: field('integer', {
      description: 'Airports/airstrips'
    }),
    ports: field('integer', {
      description: 'Ports/harbors'
    }),

    // Energy
    electricity_coverage_percent: field('decimal', {
      validate: [VALIDATORS.percentage],
      description: 'Electricity access (%)'
    }),
    power_stations: field('integer', {
      description: 'Power stations'
    }),

    // Communication
    mobile_coverage_percent: field('decimal', {
      validate: [VALIDATORS.percentage],
      description: 'Mobile network coverage (%)'
    }),
    internet_coverage_percent: field('decimal', {
      validate: [VALIDATORS.percentage],
      description: 'Internet access (%)'
    }),
    radio_stations: field('integer', {
      description: 'Radio stations'
    }),
    tv_stations: field('integer', {
      description: 'TV stations'
    }),

    // Markets & Commerce
    markets: field('integer', {
      description: 'Markets'
    }),
    banks: field('integer', {
      description: 'Banks/financial institutions'
    }),

    // Metadata
    data_source: field('string', {
      description: 'Data source'
    }),

    ...timestamps()
  },

  indexes: [
    { fields: ['admin_unit_id', 'data_year'], unique: true },
    { fields: ['data_year'] }
  ],

  relations: {
    adminUnit: {
      type: 'belongsTo',
      target: 'administrative_units',
      foreignKey: 'admin_unit_id'
    }
  }
};

// ============================================================================
// ALL SCHEMAS COLLECTION
// ============================================================================

export const ALL_SCHEMAS = {
  administrative_units: ADMIN_UNIT_SCHEMA,
  risk_indicators: RISK_INDICATOR_SCHEMA,
  warnings: WARNING_SCHEMA,
  bulletins: BULLETIN_SCHEMA,
  users: USER_SCHEMA,
  audit_logs: AUDIT_LOG_SCHEMA,
  sms_logs: SMS_LOG_SCHEMA,
  severity_events: SEVERITY_EVENT_SCHEMA,
  climate_projections: CLIMATE_PROJECTION_SCHEMA,
  population_data: POPULATION_SCHEMA,
  infrastructure_resources: INFRASTRUCTURE_SCHEMA
};

// ============================================================================
// SCHEMA UTILITIES
// ============================================================================

/**
 * Get all table names
 */
export function getTableNames() {
  return Object.keys(ALL_SCHEMAS);
}

/**
 * Get schema by table name
 */
export function getSchema(tableName) {
  return ALL_SCHEMAS[tableName] || null;
}

/**
 * Validate a record against schema
 */
export function validateRecord(tableName, record) {
  const schema = getSchema(tableName);
  if (!schema) {
    return { valid: false, errors: [`Unknown table: ${tableName}`] };
  }

  const errors = [];
  const fields = schema.fields;

  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const value = record[fieldName];

    // Check required
    if (fieldDef.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    // Check type
    if (fieldDef.type && !validateType(value, fieldDef.type)) {
      errors.push(`${fieldName} must be of type ${fieldDef.type}`);
    }

    // Check enum
    if (fieldDef.enum && !fieldDef.enum.includes(value)) {
      errors.push(`${fieldName} must be one of: ${fieldDef.enum.join(', ')}`);
    }

    // Check min/max for numbers
    if (typeof value === 'number') {
      if (fieldDef.min !== undefined && value < fieldDef.min) {
        errors.push(`${fieldName} must be >= ${fieldDef.min}`);
      }
      if (fieldDef.max !== undefined && value > fieldDef.max) {
        errors.push(`${fieldName} must be <= ${fieldDef.max}`);
      }
    }

    // Check custom validators
    if (fieldDef.validate) {
      for (const validator of fieldDef.validate) {
        if (!validator(value)) {
          errors.push(`${fieldName} failed validation`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate value type
 */
function validateType(value, type) {
  switch (type) {
    case 'string':
    case 'text':
    case 'uuid':
      return typeof value === 'string';
    case 'number':
    case 'decimal':
    case 'float':
    case 'integer':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
    case 'datetime':
    case 'timestamp':
      return !isNaN(new Date(value).getTime());
    case 'array':
      return Array.isArray(value);
    case 'object':
    case 'json':
    case 'geojson':
      return typeof value === 'object' && value !== null;
    case 'enum':
      return true; // Enum validation is handled separately
    default:
      return true;
  }
}

/**
 * Apply default values to a record
 */
export function applyDefaults(tableName, record) {
  const schema = getSchema(tableName);
  if (!schema) return record;

  const result = { ...record };

  for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
    if (result[fieldName] === undefined && fieldDef.default !== undefined) {
      result[fieldName] = typeof fieldDef.default === 'function'
        ? fieldDef.default()
        : fieldDef.default;
    }
  }

  return result;
}

/**
 * Get indexes for a table
 */
export function getIndexes(tableName) {
  const schema = getSchema(tableName);
  return schema?.indexes || [];
}

/**
 * Get relationships for a table
 */
export function getRelations(tableName) {
  const schema = getSchema(tableName);
  return schema?.relations || {};
}

export default {
  DB_CONFIG,
  DB_VERSION,
  DB_NAME,
  FIELD_TYPES,
  VALIDATORS,
  ENUMS,
  ALL_SCHEMAS,
  getTableNames,
  getSchema,
  validateRecord,
  applyDefaults,
  getIndexes,
  getRelations
};
