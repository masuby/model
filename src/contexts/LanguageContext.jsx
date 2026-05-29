/**
 * LANGUAGE CONTEXT
 * Multi-language support for English and Swahili (Kiswahili)
 * Provides translations throughout the application
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Translation Dictionary
const TRANSLATIONS = {
  // ============== COMMON ==============
  common: {
    appName: {
      en: 'INFORM Tanzania',
      sw: 'INFORM Tanzania'
    },
    welcome: {
      en: 'Welcome',
      sw: 'Karibu'
    },
    login: {
      en: 'Login',
      sw: 'Ingia'
    },
    logout: {
      en: 'Logout',
      sw: 'Toka'
    },
    submit: {
      en: 'Submit',
      sw: 'Wasilisha'
    },
    cancel: {
      en: 'Cancel',
      sw: 'Ghairi'
    },
    save: {
      en: 'Save',
      sw: 'Hifadhi'
    },
    delete: {
      en: 'Delete',
      sw: 'Futa'
    },
    edit: {
      en: 'Edit',
      sw: 'Hariri'
    },
    view: {
      en: 'View',
      sw: 'Tazama'
    },
    search: {
      en: 'Search',
      sw: 'Tafuta'
    },
    loading: {
      en: 'Loading...',
      sw: 'Inapakia...'
    },
    error: {
      en: 'Error',
      sw: 'Kosa'
    },
    success: {
      en: 'Success',
      sw: 'Imefaulu'
    },
    warning: {
      en: 'Warning',
      sw: 'Onyo'
    },
    confirm: {
      en: 'Confirm',
      sw: 'Thibitisha'
    },
    yes: {
      en: 'Yes',
      sw: 'Ndiyo'
    },
    no: {
      en: 'No',
      sw: 'Hapana'
    },
    close: {
      en: 'Close',
      sw: 'Funga'
    },
    back: {
      en: 'Back',
      sw: 'Rudi'
    },
    next: {
      en: 'Next',
      sw: 'Endelea'
    },
    previous: {
      en: 'Previous',
      sw: 'Iliyopita'
    },
    download: {
      en: 'Download',
      sw: 'Pakua'
    },
    export: {
      en: 'Export',
      sw: 'Hamisha'
    },
    import: {
      en: 'Import',
      sw: 'Ingiza'
    },
    print: {
      en: 'Print',
      sw: 'Chapisha'
    },
    share: {
      en: 'Share',
      sw: 'Shiriki'
    },
    date: {
      en: 'Date',
      sw: 'Tarehe'
    },
    time: {
      en: 'Time',
      sw: 'Muda'
    },
    status: {
      en: 'Status',
      sw: 'Hali'
    },
    actions: {
      en: 'Actions',
      sw: 'Vitendo'
    },
    details: {
      en: 'Details',
      sw: 'Maelezo'
    },
    description: {
      en: 'Description',
      sw: 'Maelezo'
    },
    name: {
      en: 'Name',
      sw: 'Jina'
    },
    type: {
      en: 'Type',
      sw: 'Aina'
    },
    level: {
      en: 'Level',
      sw: 'Kiwango'
    },
    all: {
      en: 'All',
      sw: 'Zote'
    },
    none: {
      en: 'None',
      sw: 'Hakuna'
    }
  },

  // ============== NAVIGATION ==============
  navigation: {
    dashboard: {
      en: 'Dashboard',
      sw: 'Dashibodi'
    },
    education: {
      en: 'Education',
      sw: 'Elimu'
    },
    risk: {
      en: 'Risk',
      sw: 'Hatari'
    },
    warning: {
      en: 'Warning',
      sw: 'Onyo'
    },
    severity: {
      en: 'Severity',
      sw: 'Ukali'
    },
    climateChange: {
      en: 'Climate Change',
      sw: 'Mabadiliko ya Tabianchi'
    },
    settings: {
      en: 'Settings',
      sw: 'Mipangilio'
    },
    profile: {
      en: 'Profile',
      sw: 'Wasifu'
    },
    help: {
      en: 'Help',
      sw: 'Msaada'
    },
    about: {
      en: 'About',
      sw: 'Kuhusu'
    }
  },

  // ============== WARNING MODULE ==============
  warning: {
    title: {
      en: 'Early Warning System',
      sw: 'Mfumo wa Tahadhari ya Mapema'
    },
    createWarning: {
      en: 'Create Warning',
      sw: 'Unda Onyo'
    },
    warningLevel: {
      en: 'Warning Level',
      sw: 'Kiwango cha Onyo'
    },
    advisory: {
      en: 'Advisory',
      sw: 'Ushauri'
    },
    warningLabel: {
      en: 'Warning',
      sw: 'Onyo'
    },
    majorWarning: {
      en: 'Major Warning',
      sw: 'Onyo Kubwa'
    },
    hazardType: {
      en: 'Hazard Type',
      sw: 'Aina ya Hatari'
    },
    hazardTypes: {
      flood: { en: 'Flood', sw: 'Mafuriko' },
      drought: { en: 'Drought', sw: 'Ukame' },
      cyclone: { en: 'Cyclone', sw: 'Kimbunga' },
      earthquake: { en: 'Earthquake', sw: 'Tetemeko la Ardhi' },
      epidemic: { en: 'Epidemic', sw: 'Janga' },
      wildfire: { en: 'Wildfire', sw: 'Moto wa Nyika' },
      tsunami: { en: 'Tsunami', sw: 'Tsunami' },
      landslide: { en: 'Landslide', sw: 'Maporomoko ya Ardhi' },
      storm: { en: 'Storm', sw: 'Dhoruba' },
      heatwave: { en: 'Heat Wave', sw: 'Wimbi la Joto' }
    },
    affectedAreas: {
      en: 'Affected Areas',
      sw: 'Maeneo Yaliyoathirika'
    },
    affectedDistricts: {
      en: 'Affected Districts',
      sw: 'Wilaya Zilizoathirika'
    },
    selectDistricts: {
      en: 'Select Districts',
      sw: 'Chagua Wilaya'
    },
    validFrom: {
      en: 'Valid From',
      sw: 'Inaanza Tarehe'
    },
    validTo: {
      en: 'Valid Until',
      sw: 'Inaisha Tarehe'
    },
    issuedBy: {
      en: 'Issued By',
      sw: 'Imetolewa na'
    },
    issuedAt: {
      en: 'Issued At',
      sw: 'Imetolewa Tarehe'
    },
    urgency: {
      en: 'Urgency',
      sw: 'Dharura'
    },
    immediate: {
      en: 'Immediate',
      sw: 'Haraka'
    },
    expected: {
      en: 'Expected',
      sw: 'Inatarajiwa'
    },
    future: {
      en: 'Future',
      sw: 'Baadaye'
    },
    certainty: {
      en: 'Certainty',
      sw: 'Uhakika'
    },
    observed: {
      en: 'Observed',
      sw: 'Imeonekana'
    },
    likely: {
      en: 'Likely',
      sw: 'Yawezekana'
    },
    possible: {
      en: 'Possible',
      sw: 'Inawezekana'
    },
    unlikely: {
      en: 'Unlikely',
      sw: 'Haiwezekani'
    }
  },

  // ============== BULLETIN ==============
  bulletin: {
    title: {
      en: 'Warning Bulletin',
      sw: 'Taarifa ya Onyo'
    },
    emergencyBulletin: {
      en: 'Emergency Bulletin',
      sw: 'Taarifa ya Dharura'
    },
    hazardInformation: {
      en: 'Hazard Information',
      sw: 'Taarifa ya Hatari'
    },
    impactAssessment: {
      en: 'Impact Assessment',
      sw: 'Tathmini ya Athari'
    },
    publicAdvisory: {
      en: 'Public Advisory',
      sw: 'Ushauri kwa Umma'
    },
    recommendedActions: {
      en: 'Recommended Actions',
      sw: 'Hatua Zinazopendekezwa'
    },
    contactInformation: {
      en: 'Contact Information',
      sw: 'Mawasiliano'
    },
    forMoreInfo: {
      en: 'For More Information, Contact Us',
      sw: 'Kwa Taarifa Zaidi, Wasiliana Nasi'
    },
    emergencyNumber: {
      en: 'Emergency Number',
      sw: 'Nambari ya Dharura'
    },
    generateBulletin: {
      en: 'Generate Bulletin',
      sw: 'Tengeneza Taarifa'
    },
    downloadPDF: {
      en: 'Download PDF',
      sw: 'Pakua PDF'
    },
    sendSMS: {
      en: 'Send SMS Alert',
      sw: 'Tuma Ujumbe wa SMS'
    },
    exposure: {
      en: 'Exposure',
      sw: 'Uwezekano wa Kuathirika'
    },
    vulnerability: {
      en: 'Vulnerability',
      sw: 'Udhaifu'
    },
    lackOfCopingCapacity: {
      en: 'Lack of Coping Capacity',
      sw: 'Ukosefu wa Uwezo wa Kukabiliana'
    }
  },

  // ============== RISK MODULE ==============
  risk: {
    title: {
      en: 'Risk Assessment',
      sw: 'Tathmini ya Hatari'
    },
    riskIndex: {
      en: 'Risk Index',
      sw: 'Kielelezo cha Hatari'
    },
    hazard: {
      en: 'Hazard',
      sw: 'Hatari'
    },
    exposure: {
      en: 'Exposure',
      sw: 'Uwezekano wa Kuathirika'
    },
    vulnerability: {
      en: 'Vulnerability',
      sw: 'Udhaifu'
    },
    copingCapacity: {
      en: 'Coping Capacity',
      sw: 'Uwezo wa Kukabiliana'
    },
    veryLow: {
      en: 'Very Low',
      sw: 'Chini Sana'
    },
    low: {
      en: 'Low',
      sw: 'Chini'
    },
    medium: {
      en: 'Medium',
      sw: 'Wastani'
    },
    high: {
      en: 'High',
      sw: 'Juu'
    },
    veryHigh: {
      en: 'Very High',
      sw: 'Juu Sana'
    },
    calculateRisk: {
      en: 'Calculate Risk',
      sw: 'Hesabu Hatari'
    },
    riskMap: {
      en: 'Risk Map',
      sw: 'Ramani ya Hatari'
    }
  },

  // ============== ANALYTICS ==============
  analytics: {
    title: {
      en: 'Analytics Dashboard',
      sw: 'Dashibodi ya Uchambuzi'
    },
    totalWarnings: {
      en: 'Total Warnings',
      sw: 'Jumla ya Maonyo'
    },
    thisMonth: {
      en: 'This Month',
      sw: 'Mwezi Huu'
    },
    lastMonth: {
      en: 'Last Month',
      sw: 'Mwezi Uliopita'
    },
    avgResponseTime: {
      en: 'Average Response Time',
      sw: 'Wastani wa Muda wa Majibu'
    },
    responseTime: {
      en: 'Response Time',
      sw: 'Muda wa Majibu'
    },
    minutes: {
      en: 'minutes',
      sw: 'dakika'
    },
    warningsByMonth: {
      en: 'Warnings by Month',
      sw: 'Maonyo kwa Mwezi'
    },
    warningsByType: {
      en: 'Warnings by Type',
      sw: 'Maonyo kwa Aina'
    },
    districtCoverage: {
      en: 'District Coverage',
      sw: 'Upeo wa Wilaya'
    },
    smsStatistics: {
      en: 'SMS Statistics',
      sw: 'Takwimu za SMS'
    },
    smsSent: {
      en: 'SMS Sent',
      sw: 'SMS Zilizotumwa'
    },
    successRate: {
      en: 'Success Rate',
      sw: 'Kiwango cha Mafanikio'
    }
  },

  // ============== SMS ==============
  sms: {
    title: {
      en: 'SMS Alerts',
      sw: 'Tahadhari za SMS'
    },
    sendAlert: {
      en: 'Send Alert',
      sw: 'Tuma Tahadhari'
    },
    recipients: {
      en: 'Recipients',
      sw: 'Wapokeaji'
    },
    message: {
      en: 'Message',
      sw: 'Ujumbe'
    },
    sent: {
      en: 'Sent',
      sw: 'Imetumwa'
    },
    delivered: {
      en: 'Delivered',
      sw: 'Imepokelewa'
    },
    failed: {
      en: 'Failed',
      sw: 'Imeshindwa'
    },
    pending: {
      en: 'Pending',
      sw: 'Inasubiri'
    },
    testSMS: {
      en: 'Send Test SMS',
      sw: 'Tuma SMS ya Majaribio'
    },
    emergencyAlert: {
      en: 'Emergency Alert',
      sw: 'Tahadhari ya Dharura'
    }
  },

  // ============== AUDIT ==============
  audit: {
    title: {
      en: 'Audit Trail',
      sw: 'Rekodi za Ukaguzi'
    },
    eventType: {
      en: 'Event Type',
      sw: 'Aina ya Tukio'
    },
    user: {
      en: 'User',
      sw: 'Mtumiaji'
    },
    timestamp: {
      en: 'Timestamp',
      sw: 'Muda'
    },
    severity: {
      en: 'Severity',
      sw: 'Ukali'
    },
    module: {
      en: 'Module',
      sw: 'Moduli'
    },
    exportLog: {
      en: 'Export Log',
      sw: 'Hamisha Rekodi'
    },
    clearOld: {
      en: 'Clear Old Entries',
      sw: 'Futa Rekodi za Zamani'
    }
  },

  // ============== MAP ==============
  map: {
    title: {
      en: 'Map',
      sw: 'Ramani'
    },
    layers: {
      en: 'Layers',
      sw: 'Tabaka'
    },
    districts: {
      en: 'Districts',
      sw: 'Wilaya'
    },
    regions: {
      en: 'Regions',
      sw: 'Mikoa'
    },
    roads: {
      en: 'Roads',
      sw: 'Barabara'
    },
    hospitals: {
      en: 'Hospitals',
      sw: 'Hospitali'
    },
    evacuationRoutes: {
      en: 'Evacuation Routes',
      sw: 'Njia za Uokoaji'
    },
    shelters: {
      en: 'Shelters',
      sw: 'Makazi ya Dharura'
    },
    waterBodies: {
      en: 'Water Bodies',
      sw: 'Maji'
    },
    selectOnMap: {
      en: 'Select on Map',
      sw: 'Chagua kwenye Ramani'
    },
    zoomIn: {
      en: 'Zoom In',
      sw: 'Kuza'
    },
    zoomOut: {
      en: 'Zoom Out',
      sw: 'Punguza'
    },
    resetView: {
      en: 'Reset View',
      sw: 'Rejesha Mtazamo'
    }
  },

  // ============== AUTH ==============
  auth: {
    username: {
      en: 'Username',
      sw: 'Jina la Mtumiaji'
    },
    password: {
      en: 'Password',
      sw: 'Nenosiri'
    },
    email: {
      en: 'Email',
      sw: 'Barua Pepe'
    },
    phone: {
      en: 'Phone',
      sw: 'Simu'
    },
    role: {
      en: 'Role',
      sw: 'Nafasi'
    },
    department: {
      en: 'Department',
      sw: 'Idara'
    },
    forgotPassword: {
      en: 'Forgot Password?',
      sw: 'Umesahau Nenosiri?'
    },
    rememberMe: {
      en: 'Remember Me',
      sw: 'Nikumbuke'
    },
    loginFailed: {
      en: 'Login failed. Please check your credentials.',
      sw: 'Kuingia kumeshindwa. Tafadhali angalia taarifa zako.'
    },
    sessionExpired: {
      en: 'Session expired. Please login again.',
      sw: 'Muda umekwisha. Tafadhali ingia tena.'
    },
    guestAccess: {
      en: 'Continue as Guest (Free Access)',
      sw: 'Endelea kama Mgeni (Bila Malipo)'
    }
  },

  // ============== FOOTER ==============
  footer: {
    issuedBy: {
      en: 'Issued by',
      sw: 'Imetolewa na'
    },
    eocc: {
      en: 'Emergency Operational and Communication Center (EOCC)',
      sw: 'Kituo cha Uendeshaji na Mawasiliano ya Dharura (EOCC)'
    },
    permanentSecretary: {
      en: 'Permanent Secretary',
      sw: 'Katibu Mkuu'
    },
    primeMinitersOffice: {
      en: "Prime Minister's Office",
      sw: 'Ofisi ya Waziri Mkuu'
    },
    disasterManagement: {
      en: 'Disaster Management Department',
      sw: 'Idara ya Usimamizi wa Maafa'
    },
    allRightsReserved: {
      en: 'All Rights Reserved',
      sw: 'Haki Zote Zimehifadhiwa'
    }
  },

  // ============== MESSAGES ==============
  messages: {
    confirmDelete: {
      en: 'Are you sure you want to delete this item?',
      sw: 'Una uhakika unataka kufuta kipengee hiki?'
    },
    savedSuccessfully: {
      en: 'Saved successfully',
      sw: 'Imehifadhiwa kwa mafanikio'
    },
    deletedSuccessfully: {
      en: 'Deleted successfully',
      sw: 'Imefutwa kwa mafanikio'
    },
    operationFailed: {
      en: 'Operation failed. Please try again.',
      sw: 'Utendaji umeshindwa. Tafadhali jaribu tena.'
    },
    noDataFound: {
      en: 'No data found',
      sw: 'Hakuna data iliyopatikana'
    },
    selectAtLeastOne: {
      en: 'Please select at least one item',
      sw: 'Tafadhali chagua angalau kipengee kimoja'
    },
    warningCreated: {
      en: 'Warning created successfully',
      sw: 'Onyo limeundwa kwa mafanikio'
    },
    warningApproved: {
      en: 'Warning approved successfully',
      sw: 'Onyo limeidhinishwa kwa mafanikio'
    },
    bulletinGenerated: {
      en: 'Bulletin generated successfully',
      sw: 'Taarifa imetengenezwa kwa mafanikio'
    },
    smsSent: {
      en: 'SMS sent successfully',
      sw: 'SMS imetumwa kwa mafanikio'
    },
    smsFailed: {
      en: 'Failed to send SMS',
      sw: 'Imeshindwa kutuma SMS'
    }
  }
};

// Create Context
const LanguageContext = createContext();

/**
 * Language Provider Component
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load saved language preference
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Toggle between English and Swahili
   */
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'sw' : 'en');
  }, []);

  /**
   * Get translation for a key
   * @param {string} category - Translation category (e.g., 'common', 'warning')
   * @param {string} key - Translation key
   * @param {object} params - Optional parameters for interpolation
   */
  const t = useCallback((category, key, params = {}) => {
    try {
      const categoryObj = TRANSLATIONS[category];
      if (!categoryObj) {
        console.warn(`Translation category not found: ${category}`);
        return key;
      }

      const translation = categoryObj[key];
      if (!translation) {
        console.warn(`Translation key not found: ${category}.${key}`);
        return key;
      }

      let text = translation[language] || translation['en'] || key;

      // Handle nested keys (e.g., warning.hazardTypes.flood)
      if (typeof translation === 'object' && !translation.en && !translation.sw) {
        const nestedKey = params.nested;
        if (nestedKey && translation[nestedKey]) {
          text = translation[nestedKey][language] || translation[nestedKey]['en'] || nestedKey;
        }
      }

      // Interpolate parameters
      Object.keys(params).forEach(param => {
        if (param !== 'nested') {
          text = text.replace(`{${param}}`, params[param]);
        }
      });

      return text;
    } catch (e) {
      console.error('Translation error:', e);
      return key;
    }
  }, [language]);

  /**
   * Get all translations for a category
   */
  const getCategory = useCallback((category) => {
    const categoryObj = TRANSLATIONS[category];
    if (!categoryObj) return {};

    const result = {};
    Object.keys(categoryObj).forEach(key => {
      const translation = categoryObj[key];
      if (translation && (translation.en || translation.sw)) {
        result[key] = translation[language] || translation['en'];
      }
    });
    return result;
  }, [language]);

  /**
   * Check if current language is Swahili
   */
  const isSwahili = language === 'sw';

  /**
   * Get language name
   */
  const languageName = language === 'en' ? 'English' : 'Kiswahili';

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    getCategory,
    isSwahili,
    languageName,
    TRANSLATIONS
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use language context
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Language Switcher Component
 */
export const LanguageSwitcher = ({ style = {} }) => {
  const { language, toggleLanguage, languageName } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: language === 'en' ? '#2196F3' : '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        ...style
      }}
      title={language === 'en' ? 'Switch to Kiswahili' : 'Badilisha kuwa Kiingereza'}
    >
      <span style={{ fontSize: '18px' }}>{language === 'en' ? '🇬🇧' : '🇹🇿'}</span>
      <span>{languageName}</span>
    </button>
  );
};

export default {
  LanguageProvider,
  useLanguage,
  LanguageSwitcher,
  TRANSLATIONS
};
