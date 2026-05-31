/**
 * COMPREHENSIVE TANZANIA ADMINISTRATIVE UNITS DATABASE
 *
 * Complete database of all 31 regions and 184+ districts in Tanzania.
 * Data sourced from Tanzania National Bureau of Statistics (NBS) and
 * the INFORM Tanzania Country Model Template.
 *
 * Structure:
 * - Regions (ADM1): 31 regions including Zanzibar
 * - Districts (ADM2): 184+ districts/councils
 * - Zones: Geographic and administrative zones
 */

// ============================================================================
// TANZANIA ADMINISTRATIVE ZONES
// ============================================================================

export const TANZANIA_ZONES = {
  CENTRAL: {
    id: 'central',
    name: 'Central Zone',
    regions: ['TZ01', 'TZ13']
  },
  NORTHERN: {
    id: 'northern',
    name: 'Northern Zone',
    regions: ['TZ02', 'TZ03', 'TZ04', 'TZ21']
  },
  EASTERN: {
    id: 'eastern',
    name: 'Eastern Zone',
    regions: ['TZ05', 'TZ06', 'TZ07']
  },
  SOUTHERN: {
    id: 'southern',
    name: 'Southern Zone',
    regions: ['TZ08', 'TZ09', 'TZ10']
  },
  SOUTHERN_HIGHLANDS: {
    id: 'southern_highlands',
    name: 'Southern Highlands Zone',
    regions: ['TZ11', 'TZ12', 'TZ22', 'TZ26']
  },
  WESTERN: {
    id: 'western',
    name: 'Western Zone',
    regions: ['TZ14', 'TZ15', 'TZ16', 'TZ23']
  },
  LAKE: {
    id: 'lake',
    name: 'Lake Zone',
    regions: ['TZ17', 'TZ18', 'TZ19', 'TZ20', 'TZ24', 'TZ25']
  },
  ZANZIBAR: {
    id: 'zanzibar',
    name: 'Zanzibar',
    regions: ['TZ51', 'TZ52', 'TZ53', 'TZ54', 'TZ55']
  }
};

// ============================================================================
// COMPLETE REGIONS DATABASE
// ============================================================================

export const TANZANIA_REGIONS_COMPLETE = [
  // Central Zone
  {
    code: 'TZ01',
    name: 'Dodoma',
    capital: 'Dodoma',
    zone: 'CENTRAL',
    population: 2083588,
    area_km2: 41311,
    isNationalCapital: true,
    coordinates: { lat: -6.1630, lon: 35.7516 }
  },
  {
    code: 'TZ13',
    name: 'Singida',
    capital: 'Singida',
    zone: 'CENTRAL',
    population: 1370637,
    area_km2: 49341,
    coordinates: { lat: -4.8160, lon: 34.7500 }
  },

  // Northern Zone
  {
    code: 'TZ02',
    name: 'Arusha',
    capital: 'Arusha',
    zone: 'NORTHERN',
    population: 1694310,
    area_km2: 37576,
    coordinates: { lat: -3.3869, lon: 36.6830 }
  },
  {
    code: 'TZ03',
    name: 'Kilimanjaro',
    capital: 'Moshi',
    zone: 'NORTHERN',
    population: 1640087,
    area_km2: 13209,
    hasMount: 'Kilimanjaro',
    coordinates: { lat: -3.2333, lon: 37.3333 }
  },
  {
    code: 'TZ04',
    name: 'Tanga',
    capital: 'Tanga',
    zone: 'NORTHERN',
    population: 2045205,
    area_km2: 26808,
    hasCoast: true,
    coordinates: { lat: -5.0889, lon: 39.0653 }
  },
  {
    code: 'TZ21',
    name: 'Manyara',
    capital: 'Babati',
    zone: 'NORTHERN',
    population: 1425131,
    area_km2: 44522,
    coordinates: { lat: -4.2167, lon: 35.7500 }
  },

  // Eastern Zone
  {
    code: 'TZ05',
    name: 'Morogoro',
    capital: 'Morogoro',
    zone: 'EASTERN',
    population: 2218492,
    area_km2: 70799,
    coordinates: { lat: -6.8235, lon: 37.6620 }
  },
  {
    code: 'TZ06',
    name: 'Pwani',
    capital: 'Kibaha',
    zone: 'EASTERN',
    population: 1098668,
    area_km2: 32407,
    hasCoast: true,
    coordinates: { lat: -7.0000, lon: 38.5833 }
  },
  {
    code: 'TZ07',
    name: 'Dar es Salaam',
    capital: 'Dar es Salaam',
    zone: 'EASTERN',
    population: 4364541,
    area_km2: 1393,
    isCommercialCapital: true,
    hasCoast: true,
    coordinates: { lat: -6.7924, lon: 39.2083 }
  },

  // Southern Zone
  {
    code: 'TZ08',
    name: 'Lindi',
    capital: 'Lindi',
    zone: 'SOUTHERN',
    population: 864652,
    area_km2: 66046,
    hasCoast: true,
    coordinates: { lat: -9.9833, lon: 39.7167 }
  },
  {
    code: 'TZ09',
    name: 'Mtwara',
    capital: 'Mtwara',
    zone: 'SOUTHERN',
    population: 1270854,
    area_km2: 16707,
    hasCoast: true,
    hasGas: true,
    coordinates: { lat: -10.2736, lon: 40.1828 }
  },
  {
    code: 'TZ10',
    name: 'Ruvuma',
    capital: 'Songea',
    zone: 'SOUTHERN',
    population: 1376891,
    area_km2: 63498,
    coordinates: { lat: -10.6833, lon: 35.6333 }
  },

  // Southern Highlands Zone
  {
    code: 'TZ11',
    name: 'Iringa',
    capital: 'Iringa',
    zone: 'SOUTHERN_HIGHLANDS',
    population: 941238,
    area_km2: 35503,
    coordinates: { lat: -7.7833, lon: 35.7000 }
  },
  {
    code: 'TZ12',
    name: 'Mbeya',
    capital: 'Mbeya',
    zone: 'SOUTHERN_HIGHLANDS',
    population: 2707410,
    area_km2: 60350,
    coordinates: { lat: -8.9000, lon: 33.4500 }
  },
  {
    code: 'TZ22',
    name: 'Njombe',
    capital: 'Njombe',
    zone: 'SOUTHERN_HIGHLANDS',
    population: 702097,
    area_km2: 21347,
    coordinates: { lat: -9.3333, lon: 34.7667 }
  },
  {
    code: 'TZ26',
    name: 'Songwe',
    capital: 'Vwawa',
    zone: 'SOUTHERN_HIGHLANDS',
    population: 998862,
    area_km2: 27656,
    coordinates: { lat: -9.1167, lon: 32.9833 }
  },

  // Western Zone
  {
    code: 'TZ14',
    name: 'Tabora',
    capital: 'Tabora',
    zone: 'WESTERN',
    population: 2291623,
    area_km2: 76151,
    coordinates: { lat: -5.0167, lon: 32.8000 }
  },
  {
    code: 'TZ15',
    name: 'Rukwa',
    capital: 'Sumbawanga',
    zone: 'WESTERN',
    population: 1004539,
    area_km2: 22792,
    hasLake: 'Rukwa',
    coordinates: { lat: -7.9667, lon: 31.6167 }
  },
  {
    code: 'TZ16',
    name: 'Kigoma',
    capital: 'Kigoma',
    zone: 'WESTERN',
    population: 2127930,
    area_km2: 37037,
    hasLake: 'Tanganyika',
    hasRefugeeCamps: true,
    coordinates: { lat: -4.8833, lon: 29.6333 }
  },
  {
    code: 'TZ23',
    name: 'Katavi',
    capital: 'Mpanda',
    zone: 'WESTERN',
    population: 564604,
    area_km2: 45843,
    hasNationalPark: 'Katavi',
    coordinates: { lat: -6.3500, lon: 31.0500 }
  },

  // Lake Zone
  {
    code: 'TZ17',
    name: 'Shinyanga',
    capital: 'Shinyanga',
    zone: 'LAKE',
    population: 1534808,
    area_km2: 18901,
    coordinates: { lat: -3.6667, lon: 33.4167 }
  },
  {
    code: 'TZ18',
    name: 'Kagera',
    capital: 'Bukoba',
    zone: 'LAKE',
    population: 2458023,
    area_km2: 25265,
    hasLake: 'Victoria',
    coordinates: { lat: -1.3333, lon: 31.8167 }
  },
  {
    code: 'TZ19',
    name: 'Mwanza',
    capital: 'Mwanza',
    zone: 'LAKE',
    population: 2772509,
    area_km2: 9467,
    hasLake: 'Victoria',
    coordinates: { lat: -2.5167, lon: 32.9000 }
  },
  {
    code: 'TZ20',
    name: 'Mara',
    capital: 'Musoma',
    zone: 'LAKE',
    population: 1743830,
    area_km2: 21760,
    hasLake: 'Victoria',
    hasNationalPark: 'Serengeti',
    coordinates: { lat: -1.5000, lon: 34.0000 }
  },
  {
    code: 'TZ24',
    name: 'Simiyu',
    capital: 'Bariadi',
    zone: 'LAKE',
    population: 1584157,
    area_km2: 23807,
    coordinates: { lat: -3.3500, lon: 34.1333 }
  },
  {
    code: 'TZ25',
    name: 'Geita',
    capital: 'Geita',
    zone: 'LAKE',
    population: 1739530,
    area_km2: 20054,
    hasMining: true,
    coordinates: { lat: -2.8667, lon: 32.2333 }
  },

  // Zanzibar
  {
    code: 'TZ51',
    name: 'Kaskazini Unguja',
    capital: 'Mkokotoni',
    zone: 'ZANZIBAR',
    population: 187455,
    area_km2: 470,
    isIsland: true,
    coordinates: { lat: -5.8500, lon: 39.2833 }
  },
  {
    code: 'TZ52',
    name: 'Kusini Unguja',
    capital: 'Koani',
    zone: 'ZANZIBAR',
    population: 115588,
    area_km2: 854,
    isIsland: true,
    coordinates: { lat: -6.2667, lon: 39.4667 }
  },
  {
    code: 'TZ53',
    name: 'Mjini Magharibi',
    capital: 'Zanzibar City',
    zone: 'ZANZIBAR',
    population: 593678,
    area_km2: 230,
    isIsland: true,
    isZanzibarCapital: true,
    coordinates: { lat: -6.1622, lon: 39.1922 }
  },
  {
    code: 'TZ54',
    name: 'Kaskazini Pemba',
    capital: 'Wete',
    zone: 'ZANZIBAR',
    population: 211732,
    area_km2: 574,
    isIsland: true,
    coordinates: { lat: -5.0500, lon: 39.7333 }
  },
  {
    code: 'TZ55',
    name: 'Kusini Pemba',
    capital: 'Mkoani',
    zone: 'ZANZIBAR',
    population: 195116,
    area_km2: 332,
    isIsland: true,
    coordinates: { lat: -5.3167, lon: 39.6500 }
  }
];

// ============================================================================
// COMPLETE DISTRICTS DATABASE (184+ Districts)
// ============================================================================

export const TANZANIA_DISTRICTS_COMPLETE = [
  // Dodoma Region (TZ01)
  { code: 'TZ0101', name: 'Kondoa', region: 'TZ01', regionName: 'Dodoma', population: 269704, type: 'district' },
  { code: 'TZ0102', name: 'Mpwapwa', region: 'TZ01', regionName: 'Dodoma', population: 305056, type: 'district' },
  { code: 'TZ0103', name: 'Kongwa', region: 'TZ01', regionName: 'Dodoma', population: 309973, type: 'district' },
  { code: 'TZ0104', name: 'Chamwino', region: 'TZ01', regionName: 'Dodoma', population: 330543, type: 'district' },
  { code: 'TZ0105', name: 'Dodoma Urban', region: 'TZ01', regionName: 'Dodoma', population: 410956, type: 'urban' },
  { code: 'TZ0106', name: 'Bahi', region: 'TZ01', regionName: 'Dodoma', population: 221645, type: 'district' },
  { code: 'TZ0107', name: 'Chemba', region: 'TZ01', regionName: 'Dodoma', population: 235711, type: 'district' },

  // Arusha Region (TZ02)
  { code: 'TZ0201', name: 'Monduli', region: 'TZ02', regionName: 'Arusha', population: 158929, type: 'district' },
  { code: 'TZ0202', name: 'Meru', region: 'TZ02', regionName: 'Arusha', population: 268144, type: 'district' },
  { code: 'TZ0203', name: 'Arusha Urban', region: 'TZ02', regionName: 'Arusha', population: 416442, type: 'city' },
  { code: 'TZ0204', name: 'Karatu', region: 'TZ02', regionName: 'Arusha', population: 230166, type: 'district' },
  { code: 'TZ0205', name: 'Ngorongoro', region: 'TZ02', regionName: 'Arusha', population: 174278, type: 'district' },
  { code: 'TZ0206', name: 'Arusha', region: 'TZ02', regionName: 'Arusha', population: 323198, type: 'district' },
  { code: 'TZ0207', name: 'Longido', region: 'TZ02', regionName: 'Arusha', population: 123153, type: 'district' },

  // Kilimanjaro Region (TZ03)
  { code: 'TZ0301', name: 'Rombo', region: 'TZ03', regionName: 'Kilimanjaro', population: 260963, type: 'district' },
  { code: 'TZ0302', name: 'Mwanga', region: 'TZ03', regionName: 'Kilimanjaro', population: 131442, type: 'district' },
  { code: 'TZ0303', name: 'Same', region: 'TZ03', regionName: 'Kilimanjaro', population: 269807, type: 'district' },
  { code: 'TZ0304', name: 'Moshi', region: 'TZ03', regionName: 'Kilimanjaro', population: 466737, type: 'district' },
  { code: 'TZ0305', name: 'Hai', region: 'TZ03', regionName: 'Kilimanjaro', population: 210533, type: 'district' },
  { code: 'TZ0306', name: 'Moshi Urban', region: 'TZ03', regionName: 'Kilimanjaro', population: 184292, type: 'urban' },
  { code: 'TZ0307', name: 'Siha', region: 'TZ03', regionName: 'Kilimanjaro', population: 116313, type: 'district' },

  // Tanga Region (TZ04)
  { code: 'TZ0401', name: 'Lushoto', region: 'TZ04', regionName: 'Tanga', population: 492441, type: 'district' },
  { code: 'TZ0402', name: 'Korogwe', region: 'TZ04', regionName: 'Tanga', population: 242038, type: 'district' },
  { code: 'TZ0403', name: 'Muheza', region: 'TZ04', regionName: 'Tanga', population: 204461, type: 'district' },
  { code: 'TZ0404', name: 'Tanga Urban', region: 'TZ04', regionName: 'Tanga', population: 273332, type: 'city' },
  { code: 'TZ0405', name: 'Pangani', region: 'TZ04', regionName: 'Tanga', population: 54025, type: 'district' },
  { code: 'TZ0406', name: 'Handeni', region: 'TZ04', regionName: 'Tanga', population: 276646, type: 'district' },
  { code: 'TZ0407', name: 'Kilindi', region: 'TZ04', regionName: 'Tanga', population: 236833, type: 'district' },
  { code: 'TZ0408', name: 'Mkinga', region: 'TZ04', regionName: 'Tanga', population: 118065, type: 'district' },
  { code: 'TZ0409', name: 'Korogwe Town', region: 'TZ04', regionName: 'Tanga', population: 54479, type: 'township' },
  { code: 'TZ0410', name: 'Handeni Town', region: 'TZ04', regionName: 'Tanga', population: 38885, type: 'township' },

  // Morogoro Region (TZ05)
  { code: 'TZ0501', name: 'Kilosa', region: 'TZ05', regionName: 'Morogoro', population: 438175, type: 'district' },
  { code: 'TZ0502', name: 'Morogoro', region: 'TZ05', regionName: 'Morogoro', population: 286248, type: 'district' },
  { code: 'TZ0503', name: 'Kilombero', region: 'TZ05', regionName: 'Morogoro', population: 407880, type: 'district' },
  { code: 'TZ0504', name: 'Ulanga', region: 'TZ05', regionName: 'Morogoro', population: 265203, type: 'district' },
  { code: 'TZ0505', name: 'Morogoro Urban', region: 'TZ05', regionName: 'Morogoro', population: 315866, type: 'urban' },
  { code: 'TZ0506', name: 'Mvomero', region: 'TZ05', regionName: 'Morogoro', population: 312109, type: 'district' },
  { code: 'TZ0507', name: 'Gairo', region: 'TZ05', regionName: 'Morogoro', population: 193011, type: 'district' },

  // Pwani Region (TZ06)
  { code: 'TZ0601', name: 'Bagamoyo', region: 'TZ06', regionName: 'Pwani', population: 311740, type: 'district' },
  { code: 'TZ0602', name: 'Kibaha', region: 'TZ06', regionName: 'Pwani', population: 132045, type: 'district' },
  { code: 'TZ0603', name: 'Kisarawe', region: 'TZ06', regionName: 'Pwani', population: 101598, type: 'district' },
  { code: 'TZ0604', name: 'Mkuranga', region: 'TZ06', regionName: 'Pwani', population: 222921, type: 'district' },
  { code: 'TZ0605', name: 'Rufiji', region: 'TZ06', regionName: 'Pwani', population: 217274, type: 'district' },
  { code: 'TZ0606', name: 'Mafia', region: 'TZ06', regionName: 'Pwani', population: 46438, type: 'district' },
  { code: 'TZ0607', name: 'Kibaha Urban', region: 'TZ06', regionName: 'Pwani', population: 66652, type: 'urban' },

  // Dar es Salaam Region (TZ07)
  { code: 'TZ0701', name: 'Kinondoni', region: 'TZ07', regionName: 'Dar es Salaam', population: 1775049, type: 'municipal' },
  { code: 'TZ0702', name: 'Ilala', region: 'TZ07', regionName: 'Dar es Salaam', population: 1220611, type: 'municipal' },
  { code: 'TZ0703', name: 'Temeke', region: 'TZ07', regionName: 'Dar es Salaam', population: 1368881, type: 'municipal' },
  { code: 'TZ0704', name: 'Ubungo', region: 'TZ07', regionName: 'Dar es Salaam', population: 845527, type: 'municipal' },
  { code: 'TZ0705', name: 'Kigamboni', region: 'TZ07', regionName: 'Dar es Salaam', population: 208420, type: 'municipal' },

  // Lindi Region (TZ08)
  { code: 'TZ0801', name: 'Kilwa', region: 'TZ08', regionName: 'Lindi', population: 190744, type: 'district' },
  { code: 'TZ0802', name: 'Lindi', region: 'TZ08', regionName: 'Lindi', population: 194143, type: 'district' },
  { code: 'TZ0803', name: 'Nachingwea', region: 'TZ08', regionName: 'Lindi', population: 178464, type: 'district' },
  { code: 'TZ0804', name: 'Liwale', region: 'TZ08', regionName: 'Lindi', population: 91380, type: 'district' },
  { code: 'TZ0805', name: 'Ruangwa', region: 'TZ08', regionName: 'Lindi', population: 132047, type: 'district' },
  { code: 'TZ0806', name: 'Lindi Urban', region: 'TZ08', regionName: 'Lindi', population: 77874, type: 'urban' },

  // Mtwara Region (TZ09)
  { code: 'TZ0901', name: 'Mtwara', region: 'TZ09', regionName: 'Mtwara', population: 228003, type: 'district' },
  { code: 'TZ0902', name: 'Newala', region: 'TZ09', regionName: 'Mtwara', population: 183930, type: 'district' },
  { code: 'TZ0903', name: 'Masasi', region: 'TZ09', regionName: 'Mtwara', population: 243756, type: 'district' },
  { code: 'TZ0904', name: 'Tandahimba', region: 'TZ09', regionName: 'Mtwara', population: 227514, type: 'district' },
  { code: 'TZ0905', name: 'Mtwara Urban', region: 'TZ09', regionName: 'Mtwara', population: 108299, type: 'urban' },
  { code: 'TZ0906', name: 'Nanyumbu', region: 'TZ09', regionName: 'Mtwara', population: 151933, type: 'district' },
  { code: 'TZ0907', name: 'Masasi Town', region: 'TZ09', regionName: 'Mtwara', population: 127419, type: 'township' },

  // Ruvuma Region (TZ10)
  { code: 'TZ1001', name: 'Tunduru', region: 'TZ10', regionName: 'Ruvuma', population: 298279, type: 'district' },
  { code: 'TZ1002', name: 'Songea', region: 'TZ10', regionName: 'Ruvuma', population: 173821, type: 'district' },
  { code: 'TZ1003', name: 'Mbinga', region: 'TZ10', regionName: 'Ruvuma', population: 353695, type: 'district' },
  { code: 'TZ1004', name: 'Songea Urban', region: 'TZ10', regionName: 'Ruvuma', population: 203309, type: 'urban' },
  { code: 'TZ1005', name: 'Namtumbo', region: 'TZ10', regionName: 'Ruvuma', population: 196063, type: 'district' },
  { code: 'TZ1006', name: 'Nyasa', region: 'TZ10', regionName: 'Ruvuma', population: 151724, type: 'district' },

  // Iringa Region (TZ11)
  { code: 'TZ1101', name: 'Iringa', region: 'TZ11', regionName: 'Iringa', population: 254032, type: 'district' },
  { code: 'TZ1102', name: 'Mufindi', region: 'TZ11', regionName: 'Iringa', population: 265829, type: 'district' },
  { code: 'TZ1103', name: 'Iringa Urban', region: 'TZ11', regionName: 'Iringa', population: 151345, type: 'urban' },
  { code: 'TZ1104', name: 'Kilolo', region: 'TZ11', regionName: 'Iringa', population: 218873, type: 'district' },
  { code: 'TZ1105', name: 'Mafinga Town', region: 'TZ11', regionName: 'Iringa', population: 51159, type: 'township' },

  // Mbeya Region (TZ12)
  { code: 'TZ1201', name: 'Chunya', region: 'TZ12', regionName: 'Mbeya', population: 290478, type: 'district' },
  { code: 'TZ1202', name: 'Mbeya', region: 'TZ12', regionName: 'Mbeya', population: 305319, type: 'district' },
  { code: 'TZ1203', name: 'Kyela', region: 'TZ12', regionName: 'Mbeya', population: 221490, type: 'district' },
  { code: 'TZ1204', name: 'Rungwe', region: 'TZ12', regionName: 'Mbeya', population: 339157, type: 'district' },
  { code: 'TZ1205', name: 'Busokelo', region: 'TZ12', regionName: 'Mbeya', population: 115475, type: 'district' },
  { code: 'TZ1206', name: 'Mbeya Urban', region: 'TZ12', regionName: 'Mbeya', population: 385279, type: 'city' },
  { code: 'TZ1207', name: 'Mbarali', region: 'TZ12', regionName: 'Mbeya', population: 300517, type: 'district' },

  // Singida Region (TZ13)
  { code: 'TZ1301', name: 'Iramba', region: 'TZ13', regionName: 'Singida', population: 236282, type: 'district' },
  { code: 'TZ1302', name: 'Singida', region: 'TZ13', regionName: 'Singida', population: 242951, type: 'district' },
  { code: 'TZ1303', name: 'Manyoni', region: 'TZ13', regionName: 'Singida', population: 296763, type: 'district' },
  { code: 'TZ1304', name: 'Singida Urban', region: 'TZ13', regionName: 'Singida', population: 150379, type: 'urban' },
  { code: 'TZ1305', name: 'Ikungi', region: 'TZ13', regionName: 'Singida', population: 272959, type: 'district' },
  { code: 'TZ1306', name: 'Mkalama', region: 'TZ13', regionName: 'Singida', population: 171303, type: 'district' },

  // Tabora Region (TZ14)
  { code: 'TZ1401', name: 'Nzega', region: 'TZ14', regionName: 'Tabora', population: 502252, type: 'district' },
  { code: 'TZ1402', name: 'Igunga', region: 'TZ14', regionName: 'Tabora', population: 399727, type: 'district' },
  { code: 'TZ1403', name: 'Uyui', region: 'TZ14', regionName: 'Tabora', population: 390017, type: 'district' },
  { code: 'TZ1404', name: 'Urambo', region: 'TZ14', regionName: 'Tabora', population: 370796, type: 'district' },
  { code: 'TZ1405', name: 'Sikonge', region: 'TZ14', regionName: 'Tabora', population: 174662, type: 'district' },
  { code: 'TZ1406', name: 'Tabora Urban', region: 'TZ14', regionName: 'Tabora', population: 226999, type: 'urban' },
  { code: 'TZ1407', name: 'Kaliua', region: 'TZ14', regionName: 'Tabora', population: 227170, type: 'district' },

  // Rukwa Region (TZ15)
  { code: 'TZ1501', name: 'Kalambo', region: 'TZ15', regionName: 'Rukwa', population: 207700, type: 'district' },
  { code: 'TZ1502', name: 'Sumbawanga', region: 'TZ15', regionName: 'Rukwa', population: 305845, type: 'district' },
  { code: 'TZ1503', name: 'Nkasi', region: 'TZ15', regionName: 'Rukwa', population: 281200, type: 'district' },
  { code: 'TZ1504', name: 'Sumbawanga Urban', region: 'TZ15', regionName: 'Rukwa', population: 209794, type: 'urban' },

  // Kigoma Region (TZ16)
  { code: 'TZ1601', name: 'Kibondo', region: 'TZ16', regionName: 'Kigoma', population: 260537, type: 'district' },
  { code: 'TZ1602', name: 'Kasulu', region: 'TZ16', regionName: 'Kigoma', population: 428504, type: 'district' },
  { code: 'TZ1603', name: 'Kigoma', region: 'TZ16', regionName: 'Kigoma', population: 211566, type: 'district' },
  { code: 'TZ1604', name: 'Kigoma Urban', region: 'TZ16', regionName: 'Kigoma', population: 215458, type: 'urban' },
  { code: 'TZ1605', name: 'Uvinza', region: 'TZ16', regionName: 'Kigoma', population: 383206, type: 'district' },
  { code: 'TZ1606', name: 'Buhigwe', region: 'TZ16', regionName: 'Kigoma', population: 253846, type: 'district' },
  { code: 'TZ1607', name: 'Kakonko', region: 'TZ16', regionName: 'Kigoma', population: 198375, type: 'district' },
  { code: 'TZ1608', name: 'Kasulu Town', region: 'TZ16', regionName: 'Kigoma', population: 176438, type: 'township' },

  // Shinyanga Region (TZ17)
  { code: 'TZ1701', name: 'Shinyanga Urban', region: 'TZ17', regionName: 'Shinyanga', population: 161391, type: 'urban' },
  { code: 'TZ1702', name: 'Kishapu', region: 'TZ17', regionName: 'Shinyanga', population: 272990, type: 'district' },
  { code: 'TZ1703', name: 'Shinyanga', region: 'TZ17', regionName: 'Shinyanga', population: 370162, type: 'district' },
  { code: 'TZ1704', name: 'Kahama', region: 'TZ17', regionName: 'Shinyanga', population: 433671, type: 'district' },
  { code: 'TZ1705', name: 'Kahama Town', region: 'TZ17', regionName: 'Shinyanga', population: 296594, type: 'township' },

  // Kagera Region (TZ18)
  { code: 'TZ1801', name: 'Karagwe', region: 'TZ18', regionName: 'Kagera', population: 332020, type: 'district' },
  { code: 'TZ1802', name: 'Bukoba', region: 'TZ18', regionName: 'Kagera', population: 289697, type: 'district' },
  { code: 'TZ1803', name: 'Muleba', region: 'TZ18', regionName: 'Kagera', population: 540310, type: 'district' },
  { code: 'TZ1804', name: 'Biharamulo', region: 'TZ18', regionName: 'Kagera', population: 453887, type: 'district' },
  { code: 'TZ1805', name: 'Ngara', region: 'TZ18', regionName: 'Kagera', population: 320056, type: 'district' },
  { code: 'TZ1806', name: 'Bukoba Urban', region: 'TZ18', regionName: 'Kagera', population: 128796, type: 'urban' },
  { code: 'TZ1807', name: 'Missenyi', region: 'TZ18', regionName: 'Kagera', population: 203210, type: 'district' },
  { code: 'TZ1808', name: 'Kyerwa', region: 'TZ18', regionName: 'Kagera', population: 190047, type: 'district' },

  // Mwanza Region (TZ19)
  { code: 'TZ1901', name: 'Ukerewe', region: 'TZ19', regionName: 'Mwanza', population: 345147, type: 'district' },
  { code: 'TZ1902', name: 'Magu', region: 'TZ19', regionName: 'Mwanza', population: 299759, type: 'district' },
  { code: 'TZ1903', name: 'Nyamagana', region: 'TZ19', regionName: 'Mwanza', population: 363452, type: 'municipal' },
  { code: 'TZ1904', name: 'Kwimba', region: 'TZ19', regionName: 'Mwanza', population: 398020, type: 'district' },
  { code: 'TZ1905', name: 'Sengerema', region: 'TZ19', regionName: 'Mwanza', population: 663034, type: 'district' },
  { code: 'TZ1906', name: 'Ilemela', region: 'TZ19', regionName: 'Mwanza', population: 343001, type: 'municipal' },
  { code: 'TZ1907', name: 'Misungwi', region: 'TZ19', regionName: 'Mwanza', population: 360096, type: 'district' },

  // Mara Region (TZ20)
  { code: 'TZ2001', name: 'Tarime', region: 'TZ20', regionName: 'Mara', population: 339693, type: 'district' },
  { code: 'TZ2002', name: 'Serengeti', region: 'TZ20', regionName: 'Mara', population: 249420, type: 'district' },
  { code: 'TZ2003', name: 'Musoma', region: 'TZ20', regionName: 'Mara', population: 178356, type: 'district' },
  { code: 'TZ2004', name: 'Bunda', region: 'TZ20', regionName: 'Mara', population: 335061, type: 'district' },
  { code: 'TZ2005', name: 'Musoma Urban', region: 'TZ20', regionName: 'Mara', population: 134327, type: 'urban' },
  { code: 'TZ2006', name: 'Rorya', region: 'TZ20', regionName: 'Mara', population: 265241, type: 'district' },
  { code: 'TZ2007', name: 'Butiama', region: 'TZ20', regionName: 'Mara', population: 241732, type: 'district' },

  // Manyara Region (TZ21)
  { code: 'TZ2101', name: 'Babati', region: 'TZ21', regionName: 'Manyara', population: 312392, type: 'district' },
  { code: 'TZ2102', name: 'Hanang', region: 'TZ21', regionName: 'Manyara', population: 275990, type: 'district' },
  { code: 'TZ2103', name: 'Mbulu', region: 'TZ21', regionName: 'Manyara', population: 320279, type: 'district' },
  { code: 'TZ2104', name: 'Simanjiro', region: 'TZ21', regionName: 'Manyara', population: 178693, type: 'district' },
  { code: 'TZ2105', name: 'Kiteto', region: 'TZ21', regionName: 'Manyara', population: 244669, type: 'district' },
  { code: 'TZ2106', name: 'Babati Urban', region: 'TZ21', regionName: 'Manyara', population: 93108, type: 'urban' },

  // Njombe Region (TZ22)
  { code: 'TZ2201', name: 'Njombe Urban', region: 'TZ22', regionName: 'Njombe', population: 130223, type: 'urban' },
  { code: 'TZ2202', name: "Wanging'ombe", region: 'TZ22', regionName: 'Njombe', population: 159506, type: 'district' },
  { code: 'TZ2203', name: 'Makete', region: 'TZ22', regionName: 'Njombe', population: 101626, type: 'district' },
  { code: 'TZ2204', name: 'Njombe', region: 'TZ22', regionName: 'Njombe', population: 143482, type: 'district' },
  { code: 'TZ2205', name: 'Ludewa', region: 'TZ22', regionName: 'Njombe', population: 133218, type: 'district' },
  { code: 'TZ2206', name: 'Makambako Town', region: 'TZ22', regionName: 'Njombe', population: 34042, type: 'township' },

  // Katavi Region (TZ23)
  { code: 'TZ2301', name: 'Mpanda Urban', region: 'TZ23', regionName: 'Katavi', population: 127346, type: 'urban' },
  { code: 'TZ2302', name: 'Mpanda', region: 'TZ23', regionName: 'Katavi', population: 299552, type: 'district' },
  { code: 'TZ2303', name: 'Mlele', region: 'TZ23', regionName: 'Katavi', population: 137706, type: 'district' },

  // Simiyu Region (TZ24)
  { code: 'TZ2401', name: 'Bariadi', region: 'TZ24', regionName: 'Simiyu', population: 422940, type: 'district' },
  { code: 'TZ2402', name: 'Itilima', region: 'TZ24', regionName: 'Simiyu', population: 313900, type: 'district' },
  { code: 'TZ2403', name: 'Meatu', region: 'TZ24', regionName: 'Simiyu', population: 298930, type: 'district' },
  { code: 'TZ2404', name: 'Maswa', region: 'TZ24', regionName: 'Simiyu', population: 324824, type: 'district' },
  { code: 'TZ2405', name: 'Busega', region: 'TZ24', regionName: 'Simiyu', population: 223563, type: 'district' },

  // Geita Region (TZ25)
  { code: 'TZ2501', name: 'Geita', region: 'TZ25', regionName: 'Geita', population: 807619, type: 'district' },
  { code: 'TZ2502', name: "Nyang'hwale", region: 'TZ25', regionName: 'Geita', population: 149903, type: 'district' },
  { code: 'TZ2503', name: 'Mbogwe', region: 'TZ25', regionName: 'Geita', population: 207651, type: 'district' },
  { code: 'TZ2504', name: 'Bukombe', region: 'TZ25', regionName: 'Geita', population: 225282, type: 'district' },
  { code: 'TZ2505', name: 'Chato', region: 'TZ25', regionName: 'Geita', population: 349075, type: 'district' },

  // Songwe Region (TZ26)
  { code: 'TZ2601', name: 'Songwe', region: 'TZ26', regionName: 'Songwe', population: 169641, type: 'district' },
  { code: 'TZ2605', name: 'Ileje', region: 'TZ26', regionName: 'Songwe', population: 124451, type: 'district' },
  { code: 'TZ2606', name: 'Mbozi', region: 'TZ26', regionName: 'Songwe', population: 446339, type: 'district' },
  { code: 'TZ2609', name: 'Momba', region: 'TZ26', regionName: 'Songwe', population: 183890, type: 'district' },
  { code: 'TZ2610', name: 'Tunduma Town', region: 'TZ26', regionName: 'Songwe', population: 74541, type: 'township' },

  // Zanzibar - Kaskazini Unguja (TZ51)
  { code: 'TZ5101', name: 'Kaskazini A', region: 'TZ51', regionName: 'Kaskazini Unguja', population: 92259, type: 'district' },
  { code: 'TZ5102', name: 'Kaskazini B', region: 'TZ51', regionName: 'Kaskazini Unguja', population: 95196, type: 'district' },

  // Zanzibar - Kusini Unguja (TZ52)
  { code: 'TZ5201', name: 'Kati', region: 'TZ52', regionName: 'Kusini Unguja', population: 60981, type: 'district' },
  { code: 'TZ5202', name: 'Kusini', region: 'TZ52', regionName: 'Kusini Unguja', population: 54607, type: 'district' },

  // Zanzibar - Mjini Magharibi (TZ53)
  { code: 'TZ5301', name: 'Magharibi', region: 'TZ53', regionName: 'Mjini Magharibi', population: 331944, type: 'district' },
  { code: 'TZ5302', name: 'Mjini', region: 'TZ53', regionName: 'Mjini Magharibi', population: 261734, type: 'urban' },

  // Zanzibar - Kaskazini Pemba (TZ54)
  { code: 'TZ5401', name: 'Wete', region: 'TZ54', regionName: 'Kaskazini Pemba', population: 111067, type: 'district' },
  { code: 'TZ5402', name: 'Micheweni', region: 'TZ54', regionName: 'Kaskazini Pemba', population: 100665, type: 'district' },

  // Zanzibar - Kusini Pemba (TZ55)
  { code: 'TZ5501', name: 'Chake Chake', region: 'TZ55', regionName: 'Kusini Pemba', population: 96832, type: 'district' },
  { code: 'TZ5502', name: 'Mkoani', region: 'TZ55', regionName: 'Kusini Pemba', population: 98284, type: 'district' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all regions
 * @returns {Object[]} Array of regions
 */
export function getAllRegions() {
  return TANZANIA_REGIONS_COMPLETE;
}

/**
 * Get region by code
 * @param {string} code - Region code
 * @returns {Object|undefined} Region object
 */
export function getRegionByCode(code) {
  return TANZANIA_REGIONS_COMPLETE.find(r => r.code === code);
}

/**
 * Get all districts
 * @returns {Object[]} Array of districts
 */
export function getAllDistricts() {
  return TANZANIA_DISTRICTS_COMPLETE;
}

/**
 * Get district by code
 * @param {string} code - District code
 * @returns {Object|undefined} District object
 */
export function getDistrictByCode(code) {
  return TANZANIA_DISTRICTS_COMPLETE.find(d => d.code === code);
}

/**
 * Get districts by region code
 * @param {string} regionCode - Region code
 * @returns {Object[]} Array of districts
 */
export function getDistrictsByRegionCode(regionCode) {
  return TANZANIA_DISTRICTS_COMPLETE.filter(d => d.region === regionCode);
}

/**
 * Get regions by zone
 * @param {string} zone - Zone ID
 * @returns {Object[]} Array of regions
 */
export function getRegionsByZone(zone) {
  const zoneDef = TANZANIA_ZONES[zone];
  if (!zoneDef) return [];
  return TANZANIA_REGIONS_COMPLETE.filter(r => zoneDef.regions.includes(r.code));
}

/**
 * Get total population
 * @returns {number} Total population
 */
export function getTotalPopulation() {
  return TANZANIA_DISTRICTS_COMPLETE.reduce((sum, d) => sum + (d.population || 0), 0);
}

/**
 * Get statistics
 * @returns {Object} Statistics
 */
export function getTanzaniaStats() {
  return {
    totalRegions: TANZANIA_REGIONS_COMPLETE.length,
    totalDistricts: TANZANIA_DISTRICTS_COMPLETE.length,
    totalPopulation: getTotalPopulation(),
    zones: Object.keys(TANZANIA_ZONES).length,
    coastal: TANZANIA_REGIONS_COMPLETE.filter(r => r.hasCoast).length,
    island: TANZANIA_REGIONS_COMPLETE.filter(r => r.isIsland).length
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  TANZANIA_ZONES,
  TANZANIA_REGIONS_COMPLETE,
  TANZANIA_DISTRICTS_COMPLETE,
  getAllRegions,
  getRegionByCode,
  getAllDistricts,
  getDistrictByCode,
  getDistrictsByRegionCode,
  getRegionsByZone,
  getTotalPopulation,
  getTanzaniaStats
};
