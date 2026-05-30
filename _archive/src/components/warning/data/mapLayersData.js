/**
 * MAP LAYERS DATA
 * Contains data for roads, hospitals, evacuation routes, shelters
 * for the Tanzania Emergency Warning System
 */

// Major Hospitals in Tanzania (Coordinates: [lat, lng])
export const HOSPITALS = [
  // Dar es Salaam Region
  {
    id: 'hosp_001',
    name: 'Muhimbili National Hospital',
    type: 'National Referral',
    region: 'Dar es Salaam',
    district: 'Ilala',
    coordinates: [-6.8022, 39.2547],
    capacity: 1500,
    emergency: true,
    phone: '+255 22 215 0596',
    services: ['Emergency', 'ICU', 'Surgery', 'Pediatrics', 'Maternity']
  },
  {
    id: 'hosp_002',
    name: 'Amana Regional Referral Hospital',
    type: 'Regional Referral',
    region: 'Dar es Salaam',
    district: 'Ilala',
    coordinates: [-6.8264, 39.2692],
    capacity: 500,
    emergency: true,
    phone: '+255 22 286 2171',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },
  {
    id: 'hosp_003',
    name: 'Mwananyamala Hospital',
    type: 'Regional Referral',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    coordinates: [-6.7684, 39.2439],
    capacity: 400,
    emergency: true,
    phone: '+255 22 262 1437',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },
  {
    id: 'hosp_004',
    name: 'Temeke Regional Referral Hospital',
    type: 'Regional Referral',
    region: 'Dar es Salaam',
    district: 'Temeke',
    coordinates: [-6.8615, 39.2547],
    capacity: 350,
    emergency: true,
    phone: '+255 22 285 1325',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },
  {
    id: 'hosp_005',
    name: 'Aga Khan Hospital',
    type: 'Private',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    coordinates: [-6.7745, 39.2728],
    capacity: 200,
    emergency: true,
    phone: '+255 22 211 5151',
    services: ['Emergency', 'ICU', 'Surgery', 'Specialized Care']
  },

  // Dodoma Region
  {
    id: 'hosp_006',
    name: 'Benjamin Mkapa Hospital',
    type: 'National Referral',
    region: 'Dodoma',
    district: 'Dodoma Urban',
    coordinates: [-6.1630, 35.7516],
    capacity: 400,
    emergency: true,
    phone: '+255 26 232 1169',
    services: ['Emergency', 'ICU', 'Surgery', 'Specialized Care']
  },
  {
    id: 'hosp_007',
    name: 'Dodoma Regional Hospital',
    type: 'Regional Referral',
    region: 'Dodoma',
    district: 'Dodoma Urban',
    coordinates: [-6.1733, 35.7442],
    capacity: 300,
    emergency: true,
    phone: '+255 26 232 1234',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },

  // Arusha Region
  {
    id: 'hosp_008',
    name: 'Mount Meru Regional Hospital',
    type: 'Regional Referral',
    region: 'Arusha',
    district: 'Arusha City',
    coordinates: [-3.3667, 36.6833],
    capacity: 450,
    emergency: true,
    phone: '+255 27 250 3633',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },
  {
    id: 'hosp_009',
    name: 'KCMC Hospital',
    type: 'Zonal Referral',
    region: 'Kilimanjaro',
    district: 'Moshi Urban',
    coordinates: [-3.3269, 37.3463],
    capacity: 630,
    emergency: true,
    phone: '+255 27 275 4377',
    services: ['Emergency', 'ICU', 'Surgery', 'Specialized Care', 'Teaching']
  },

  // Mwanza Region
  {
    id: 'hosp_010',
    name: 'Bugando Medical Centre',
    type: 'Zonal Referral',
    region: 'Mwanza',
    district: 'Nyamagana',
    coordinates: [-2.5167, 32.9000],
    capacity: 900,
    emergency: true,
    phone: '+255 28 254 0610',
    services: ['Emergency', 'ICU', 'Surgery', 'Specialized Care', 'Teaching']
  },
  {
    id: 'hosp_011',
    name: 'Sekou Toure Regional Hospital',
    type: 'Regional Referral',
    region: 'Mwanza',
    district: 'Nyamagana',
    coordinates: [-2.5083, 32.9167],
    capacity: 400,
    emergency: true,
    phone: '+255 28 250 0044',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },

  // Morogoro Region
  {
    id: 'hosp_012',
    name: 'Morogoro Regional Hospital',
    type: 'Regional Referral',
    region: 'Morogoro',
    district: 'Morogoro Urban',
    coordinates: [-6.8244, 37.6591],
    capacity: 350,
    emergency: true,
    phone: '+255 23 260 4033',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },

  // Mbeya Region
  {
    id: 'hosp_013',
    name: 'Mbeya Zonal Referral Hospital',
    type: 'Zonal Referral',
    region: 'Mbeya',
    district: 'Mbeya City',
    coordinates: [-8.9000, 33.4500],
    capacity: 500,
    emergency: true,
    phone: '+255 25 250 2631',
    services: ['Emergency', 'ICU', 'Surgery', 'Specialized Care']
  },

  // Tanga Region
  {
    id: 'hosp_014',
    name: 'Bombo Regional Hospital',
    type: 'Regional Referral',
    region: 'Tanga',
    district: 'Tanga City',
    coordinates: [-5.0667, 39.1000],
    capacity: 400,
    emergency: true,
    phone: '+255 27 264 4604',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },

  // Iringa Region
  {
    id: 'hosp_015',
    name: 'Iringa Regional Hospital',
    type: 'Regional Referral',
    region: 'Iringa',
    district: 'Iringa Urban',
    coordinates: [-7.7700, 35.6900],
    capacity: 300,
    emergency: true,
    phone: '+255 26 270 2085',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },

  // Kagera Region
  {
    id: 'hosp_016',
    name: 'Bukoba Regional Hospital',
    type: 'Regional Referral',
    region: 'Kagera',
    district: 'Bukoba Urban',
    coordinates: [-1.3333, 31.8167],
    capacity: 300,
    emergency: true,
    phone: '+255 28 222 0275',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  },

  // Zanzibar
  {
    id: 'hosp_017',
    name: 'Mnazi Mmoja Hospital',
    type: 'Regional Referral',
    region: 'Zanzibar',
    district: 'Zanzibar Urban',
    coordinates: [-6.1622, 39.1875],
    capacity: 500,
    emergency: true,
    phone: '+255 24 223 1071',
    services: ['Emergency', 'Surgery', 'Pediatrics', 'Maternity']
  }
];

// Major Roads in Tanzania (simplified polylines)
export const MAJOR_ROADS = [
  {
    id: 'road_001',
    name: 'A7 - Dar es Salaam - Morogoro Highway',
    type: 'Primary',
    coordinates: [
      [-6.8124, 39.2893],  // Dar es Salaam
      [-6.8000, 38.5000],  // Chalinze junction
      [-6.8244, 37.6591]   // Morogoro
    ],
    length: 196,
    condition: 'Good'
  },
  {
    id: 'road_002',
    name: 'A7 - Morogoro - Dodoma Highway',
    type: 'Primary',
    coordinates: [
      [-6.8244, 37.6591],  // Morogoro
      [-6.5000, 36.5000],
      [-6.1630, 35.7516]   // Dodoma
    ],
    length: 260,
    condition: 'Good'
  },
  {
    id: 'road_003',
    name: 'B2 - Dar es Salaam - Mtwara Highway',
    type: 'Primary',
    coordinates: [
      [-6.8124, 39.2893],  // Dar es Salaam
      [-8.0000, 39.5000],
      [-10.2667, 40.1833]  // Mtwara
    ],
    length: 556,
    condition: 'Fair'
  },
  {
    id: 'road_004',
    name: 'A104 - Arusha - Namanga Highway',
    type: 'Primary',
    coordinates: [
      [-3.3667, 36.6833],  // Arusha
      [-2.5417, 36.7833]   // Namanga (Kenya Border)
    ],
    length: 104,
    condition: 'Good'
  },
  {
    id: 'road_005',
    name: 'B1 - Mwanza - Shinyanga Highway',
    type: 'Primary',
    coordinates: [
      [-2.5167, 32.9000],  // Mwanza
      [-3.6617, 33.4217]   // Shinyanga
    ],
    length: 163,
    condition: 'Good'
  },
  {
    id: 'road_006',
    name: 'A7 - Dodoma - Singida Highway',
    type: 'Primary',
    coordinates: [
      [-6.1630, 35.7516],  // Dodoma
      [-4.8167, 34.7500]   // Singida
    ],
    length: 256,
    condition: 'Fair'
  },
  {
    id: 'road_007',
    name: 'B3 - Iringa - Mbeya Highway',
    type: 'Primary',
    coordinates: [
      [-7.7700, 35.6900],  // Iringa
      [-8.9000, 33.4500]   // Mbeya
    ],
    length: 303,
    condition: 'Good'
  },
  {
    id: 'road_008',
    name: 'A14 - Tanga - Moshi Highway',
    type: 'Primary',
    coordinates: [
      [-5.0667, 39.1000],  // Tanga
      [-3.3269, 37.3463]   // Moshi
    ],
    length: 291,
    condition: 'Good'
  },
  {
    id: 'road_009',
    name: 'TANZAM Highway (A7) - Dar to Zambia',
    type: 'International',
    coordinates: [
      [-6.8124, 39.2893],  // Dar es Salaam
      [-6.8244, 37.6591],  // Morogoro
      [-7.7700, 35.6900],  // Iringa
      [-8.9000, 33.4500],  // Mbeya
      [-8.8833, 31.0333]   // Tunduma (Zambia Border)
    ],
    length: 974,
    condition: 'Good'
  },
  {
    id: 'road_010',
    name: 'Central Corridor - Dar to Rwanda/Burundi',
    type: 'International',
    coordinates: [
      [-6.8124, 39.2893],  // Dar es Salaam
      [-6.1630, 35.7516],  // Dodoma
      [-4.8167, 34.7500],  // Singida
      [-2.5167, 32.9000],  // Mwanza
      [-1.3333, 31.8167]   // Bukoba
    ],
    length: 1500,
    condition: 'Fair'
  }
];

// Evacuation Routes (for flood/disaster scenarios)
export const EVACUATION_ROUTES = [
  // Dar es Salaam Flood Evacuation Routes
  {
    id: 'evac_001',
    name: 'Ilala to University of Dar es Salaam',
    district: 'Ilala',
    hazardType: 'Flood',
    startPoint: { name: 'Kariakoo', coordinates: [-6.8167, 39.2667] },
    endPoint: { name: 'UDSM Main Campus', coordinates: [-6.7712, 39.2031] },
    distance: 8.5,
    estimatedTime: '25 min',
    capacity: 5000,
    waypoints: [
      [-6.8100, 39.2600],
      [-6.7900, 39.2300],
      [-6.7800, 39.2100]
    ],
    instructions: [
      'Head north on Uhuru Street',
      'Turn left onto Morogoro Road',
      'Continue to University Road',
      'Proceed to UDSM Main Campus'
    ]
  },
  {
    id: 'evac_002',
    name: 'Msasani to Mikocheni Evacuation Center',
    district: 'Kinondoni',
    hazardType: 'Flood',
    startPoint: { name: 'Msasani Beach', coordinates: [-6.7500, 39.2667] },
    endPoint: { name: 'Mikocheni B School', coordinates: [-6.7667, 39.2417] },
    distance: 3.2,
    estimatedTime: '15 min',
    capacity: 2000,
    waypoints: [
      [-6.7550, 39.2600],
      [-6.7600, 39.2500]
    ],
    instructions: [
      'Move inland from beach area',
      'Head west on Old Bagamoyo Road',
      'Turn left at Mikocheni junction',
      'Proceed to Mikocheni B School'
    ]
  },
  {
    id: 'evac_003',
    name: 'Jangwani to National Stadium',
    district: 'Ilala',
    hazardType: 'Flood',
    startPoint: { name: 'Jangwani', coordinates: [-6.8083, 39.2583] },
    endPoint: { name: 'National Stadium', coordinates: [-6.7917, 39.2750] },
    distance: 2.5,
    estimatedTime: '12 min',
    capacity: 10000,
    waypoints: [
      [-6.8000, 39.2650],
      [-6.7950, 39.2700]
    ],
    instructions: [
      'Head north on Morogoro Road',
      'Continue past Ubungo junction',
      'Turn right at Stadium entrance',
      'Enter National Stadium grounds'
    ]
  }
];

// Emergency Shelters
export const EMERGENCY_SHELTERS = [
  // Dar es Salaam
  {
    id: 'shelter_001',
    name: 'National Stadium Emergency Shelter',
    type: 'Primary',
    district: 'Ilala',
    coordinates: [-6.7917, 39.2750],
    capacity: 15000,
    facilities: ['Water', 'Sanitation', 'Medical Post', 'Food Distribution'],
    contact: '+255 22 286 3000'
  },
  {
    id: 'shelter_002',
    name: 'University of Dar es Salaam',
    type: 'Secondary',
    district: 'Kinondoni',
    coordinates: [-6.7712, 39.2031],
    capacity: 8000,
    facilities: ['Water', 'Sanitation', 'Dormitories'],
    contact: '+255 22 241 0500'
  },
  {
    id: 'shelter_003',
    name: 'Azania Secondary School',
    type: 'Community',
    district: 'Ilala',
    coordinates: [-6.8194, 39.2778],
    capacity: 2000,
    facilities: ['Water', 'Sanitation', 'Classrooms'],
    contact: '+255 22 212 3456'
  },
  {
    id: 'shelter_004',
    name: 'Temeke District Emergency Center',
    type: 'Primary',
    district: 'Temeke',
    coordinates: [-6.8615, 39.2500],
    capacity: 5000,
    facilities: ['Water', 'Sanitation', 'Medical Post', 'Food Distribution'],
    contact: '+255 22 285 0000'
  },

  // Dodoma
  {
    id: 'shelter_005',
    name: 'Jamhuri Stadium Dodoma',
    type: 'Primary',
    district: 'Dodoma Urban',
    coordinates: [-6.1700, 35.7450],
    capacity: 10000,
    facilities: ['Water', 'Sanitation', 'Medical Post'],
    contact: '+255 26 232 0000'
  },

  // Arusha
  {
    id: 'shelter_006',
    name: 'Sheikh Amri Abeid Stadium',
    type: 'Primary',
    district: 'Arusha City',
    coordinates: [-3.3750, 36.6917],
    capacity: 12000,
    facilities: ['Water', 'Sanitation', 'Medical Post', 'Food Distribution'],
    contact: '+255 27 250 0000'
  },

  // Mwanza
  {
    id: 'shelter_007',
    name: 'CCM Kirumba Stadium',
    type: 'Primary',
    district: 'Nyamagana',
    coordinates: [-2.5100, 32.9100],
    capacity: 15000,
    facilities: ['Water', 'Sanitation', 'Medical Post', 'Food Distribution'],
    contact: '+255 28 254 0000'
  },

  // Mbeya
  {
    id: 'shelter_008',
    name: 'Sokoine Stadium Mbeya',
    type: 'Primary',
    district: 'Mbeya City',
    coordinates: [-8.9050, 33.4550],
    capacity: 8000,
    facilities: ['Water', 'Sanitation', 'Medical Post'],
    contact: '+255 25 250 0000'
  }
];

// Fire Stations
export const FIRE_STATIONS = [
  {
    id: 'fire_001',
    name: 'Dar es Salaam Central Fire Station',
    district: 'Ilala',
    coordinates: [-6.8167, 39.2833],
    phone: '114',
    vehicles: 8
  },
  {
    id: 'fire_002',
    name: 'Kinondoni Fire Station',
    district: 'Kinondoni',
    coordinates: [-6.7667, 39.2500],
    phone: '114',
    vehicles: 5
  },
  {
    id: 'fire_003',
    name: 'Temeke Fire Station',
    district: 'Temeke',
    coordinates: [-6.8583, 39.2583],
    phone: '114',
    vehicles: 4
  },
  {
    id: 'fire_004',
    name: 'Dodoma Fire Station',
    district: 'Dodoma Urban',
    coordinates: [-6.1700, 35.7400],
    phone: '114',
    vehicles: 4
  },
  {
    id: 'fire_005',
    name: 'Arusha Fire Station',
    district: 'Arusha City',
    coordinates: [-3.3700, 36.6850],
    phone: '114',
    vehicles: 4
  },
  {
    id: 'fire_006',
    name: 'Mwanza Fire Station',
    district: 'Nyamagana',
    coordinates: [-2.5150, 32.9050],
    phone: '114',
    vehicles: 4
  }
];

// Police Stations (Major)
export const POLICE_STATIONS = [
  {
    id: 'police_001',
    name: 'Central Police Station Dar es Salaam',
    district: 'Ilala',
    coordinates: [-6.8139, 39.2894],
    phone: '112',
    type: 'Regional HQ'
  },
  {
    id: 'police_002',
    name: 'Oysterbay Police Station',
    district: 'Kinondoni',
    coordinates: [-6.7589, 39.2775],
    phone: '112',
    type: 'District'
  },
  {
    id: 'police_003',
    name: 'Temeke Police Station',
    district: 'Temeke',
    coordinates: [-6.8611, 39.2556],
    phone: '112',
    type: 'District'
  },
  {
    id: 'police_004',
    name: 'Dodoma Central Police Station',
    district: 'Dodoma Urban',
    coordinates: [-6.1722, 35.7461],
    phone: '112',
    type: 'Regional HQ'
  },
  {
    id: 'police_005',
    name: 'Arusha Central Police Station',
    district: 'Arusha City',
    coordinates: [-3.3694, 36.6828],
    phone: '112',
    type: 'Regional HQ'
  }
];

// Layer Configuration for Map
export const MAP_LAYER_CONFIG = {
  hospitals: {
    name: 'Hospitals',
    nameSwahili: 'Hospitali',
    icon: '🏥',
    color: '#F44336',
    visible: true,
    data: HOSPITALS
  },
  roads: {
    name: 'Major Roads',
    nameSwahili: 'Barabara Kuu',
    icon: '🛣️',
    color: '#FF9800',
    visible: true,
    data: MAJOR_ROADS
  },
  evacuationRoutes: {
    name: 'Evacuation Routes',
    nameSwahili: 'Njia za Uokoaji',
    icon: '🚨',
    color: '#4CAF50',
    visible: false,
    data: EVACUATION_ROUTES
  },
  shelters: {
    name: 'Emergency Shelters',
    nameSwahili: 'Makazi ya Dharura',
    icon: '🏠',
    color: '#2196F3',
    visible: false,
    data: EMERGENCY_SHELTERS
  },
  fireStations: {
    name: 'Fire Stations',
    nameSwahili: 'Vituo vya Zimamoto',
    icon: '🚒',
    color: '#FF5722',
    visible: false,
    data: FIRE_STATIONS
  },
  policeStations: {
    name: 'Police Stations',
    nameSwahili: 'Vituo vya Polisi',
    icon: '👮',
    color: '#3F51B5',
    visible: false,
    data: POLICE_STATIONS
  }
};

// Helper function to get hospitals by district
export const getHospitalsByDistrict = (district) => {
  return HOSPITALS.filter(h => h.district === district);
};

// Helper function to get evacuation routes by district and hazard type
export const getEvacuationRoutes = (district, hazardType = null) => {
  let routes = EVACUATION_ROUTES.filter(r => r.district === district);
  if (hazardType) {
    routes = routes.filter(r => r.hazardType === hazardType);
  }
  return routes;
};

// Helper function to get nearest hospital
export const getNearestHospital = (lat, lng) => {
  let nearest = null;
  let minDistance = Infinity;

  HOSPITALS.forEach(hospital => {
    const distance = Math.sqrt(
      Math.pow(hospital.coordinates[0] - lat, 2) +
      Math.pow(hospital.coordinates[1] - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = hospital;
    }
  });

  return nearest;
};

// Helper function to get shelters by district
export const getSheltersByDistrict = (district) => {
  return EMERGENCY_SHELTERS.filter(s => s.district === district);
};

export default {
  HOSPITALS,
  MAJOR_ROADS,
  EVACUATION_ROUTES,
  EMERGENCY_SHELTERS,
  FIRE_STATIONS,
  POLICE_STATIONS,
  MAP_LAYER_CONFIG,
  getHospitalsByDistrict,
  getEvacuationRoutes,
  getNearestHospital,
  getSheltersByDistrict
};
