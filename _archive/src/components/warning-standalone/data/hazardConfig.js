/**
 * HAZARD CONFIGURATION DATA
 * Institutions, hazard types, and regions
 */

// Institutional mandates
export const INSTITUTIONS = {
  TMA: {
    name: 'Tanzania Meteorological Authority',
    hazards: ['Heavy Rainfall', 'Strong Winds', 'Large Waves', 'Dry Spells', 'Extreme Temperature'],
    icon: '🌧️',
    color: '#2196F3'
  },
  MOW: {
    name: 'Ministry of Water',
    hazards: ['River Flood', 'Dam Level Alert', 'Coastal Flood'],
    icon: '🌊',
    color: '#03A9F4'
  },
  MOH: {
    name: 'Ministry of Health',
    hazards: ['Disease Outbreak', 'Epidemic', 'Health Emergency'],
    icon: '🏥',
    color: '#F44336'
  },
  MOA: {
    name: 'Ministry of Agriculture',
    hazards: ['Agricultural Drought', 'Crop Disease', 'Livestock Disease', 'Pest Infestation'],
    icon: '🌾',
    color: '#8BC34A'
  },
  GST: {
    name: 'Geological Survey of Tanzania',
    hazards: ['Earthquake', 'Landslide', 'Volcanic Activity', 'Ground Subsidence'],
    icon: '🏔️',
    color: '#795548'
  }
};

// Tanzania regions and districts
export const REGIONS = {
  'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
  'Dodoma': ['Dodoma Urban', 'Chamwino', 'Kondoa', 'Mpwapwa', 'Chemba'],
  'Arusha': ['Arusha Urban', 'Arusha Rural', 'Meru', 'Karatu', 'Monduli'],
  'Kilimanjaro': ['Moshi Urban', 'Moshi Rural', 'Hai', 'Rombo', 'Same'],
  'Mwanza': ['Ilemela', 'Nyamagana', 'Magu', 'Sengerema', 'Ukerewe'],
  'Mbeya': ['Mbeya Urban', 'Mbeya Rural', 'Rungwe', 'Kyela', 'Mbarali'],
  'Morogoro': ['Morogoro Urban', 'Morogoro Rural', 'Kilosa', 'Mvomero', 'Ulanga'],
  'Tanga': ['Tanga Urban', 'Muheza', 'Pangani', 'Korogwe', 'Handeni'],
  'Pwani': ['Kibaha', 'Mkuranga', 'Bagamoyo', 'Kisarawe', 'Rufiji'],
  'Singida': ['Singida Urban', 'Singida Rural', 'Ikungi', 'Manyoni'],
  'Tabora': ['Tabora Urban', 'Tabora Rural', 'Kaliua', 'Kahama'],
  'Kagera': ['Bukoba Urban', 'Bukoba Rural', 'Muleba', 'Karagwe'],
  'Iringa': ['Iringa Urban', 'Iringa Rural', 'Mufindi', 'Ludewa'],
  'Mtwara': ['Mtwara Urban', 'Mtwara Rural', 'Newala', 'Masasi'],
  'Lindi': ['Lindi Urban', 'Lindi Rural', 'Mlandizi', 'Kilwa'],
  'Ruvuma': ['Songea Urban', 'Songea Rural', 'Tunduru', 'Mbinga'],
  'Njombe': ['Njombe Urban', 'Njombe Rural', 'Makambako', 'Wanging\'ombe']
};

// Helper functions
export function getTodayDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return formatDateTimeLocal(now);
}

export function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setHours(23, 59, 0, 0);
  return formatDateTimeLocal(tomorrow);
}

export function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getQuantitativeUnit(hazardType) {
  const units = {
    'Heavy Rainfall': 'mm/24h',
    'River Flood': 'meters',
    'Dam Level Alert': 'meters',
    'Dry Spells': 'days',
    'Extreme Temperature': '°C',
    'Strong Winds': 'km/h',
    'Disease Outbreak': 'cases',
    'Epidemic': 'cases'
  };
  return units[hazardType] || 'value';
}
