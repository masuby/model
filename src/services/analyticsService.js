/**
 * ANALYTICS SERVICE
 * Dashboard analytics for warning trends, response times, coverage statistics
 * Provides data for charts and graphs visualization
 */

// Sample historical data (in production, would come from database)
const SAMPLE_WARNING_HISTORY = [
  { date: '2025-01-01', hazardType: 'Flood', warningLevel: 'Warning', districts: 5, responseTime: 45 },
  { date: '2025-01-05', hazardType: 'Drought', warningLevel: 'Advisory', districts: 12, responseTime: 120 },
  { date: '2025-01-10', hazardType: 'Cyclone', warningLevel: 'Major Warning', districts: 8, responseTime: 30 },
  { date: '2025-01-15', hazardType: 'Earthquake', warningLevel: 'Warning', districts: 3, responseTime: 15 },
  { date: '2025-02-01', hazardType: 'Flood', warningLevel: 'Major Warning', districts: 15, responseTime: 25 },
  { date: '2025-02-10', hazardType: 'Epidemic', warningLevel: 'Warning', districts: 7, responseTime: 60 },
  { date: '2025-02-20', hazardType: 'Flood', warningLevel: 'Advisory', districts: 4, responseTime: 90 },
  { date: '2025-03-01', hazardType: 'Drought', warningLevel: 'Warning', districts: 20, responseTime: 180 },
  { date: '2025-03-15', hazardType: 'Wildfire', warningLevel: 'Warning', districts: 6, responseTime: 35 },
  { date: '2025-04-01', hazardType: 'Flood', warningLevel: 'Warning', districts: 10, responseTime: 40 },
  { date: '2025-04-15', hazardType: 'Cyclone', warningLevel: 'Advisory', districts: 5, responseTime: 55 },
  { date: '2025-05-01', hazardType: 'Epidemic', warningLevel: 'Major Warning', districts: 25, responseTime: 20 },
  { date: '2025-05-20', hazardType: 'Flood', warningLevel: 'Warning', districts: 8, responseTime: 38 },
  { date: '2025-06-01', hazardType: 'Drought', warningLevel: 'Advisory', districts: 15, responseTime: 150 },
  { date: '2025-06-15', hazardType: 'Earthquake', warningLevel: 'Warning', districts: 4, responseTime: 12 },
  { date: '2025-07-01', hazardType: 'Flood', warningLevel: 'Major Warning', districts: 18, responseTime: 22 },
  { date: '2025-07-20', hazardType: 'Cyclone', warningLevel: 'Warning', districts: 9, responseTime: 28 },
  { date: '2025-08-01', hazardType: 'Wildfire', warningLevel: 'Advisory', districts: 3, responseTime: 45 },
  { date: '2025-08-15', hazardType: 'Flood', warningLevel: 'Warning', districts: 7, responseTime: 42 },
  { date: '2025-09-01', hazardType: 'Epidemic', warningLevel: 'Warning', districts: 12, responseTime: 55 },
  { date: '2025-09-20', hazardType: 'Drought', warningLevel: 'Warning', districts: 22, responseTime: 200 },
  { date: '2025-10-01', hazardType: 'Flood', warningLevel: 'Advisory', districts: 6, responseTime: 75 },
  { date: '2025-10-15', hazardType: 'Cyclone', warningLevel: 'Major Warning', districts: 14, responseTime: 18 },
  { date: '2025-11-01', hazardType: 'Earthquake', warningLevel: 'Warning', districts: 5, responseTime: 10 },
  { date: '2025-11-20', hazardType: 'Flood', warningLevel: 'Warning', districts: 11, responseTime: 35 },
  { date: '2025-12-01', hazardType: 'Epidemic', warningLevel: 'Advisory', districts: 8, responseTime: 80 },
  { date: '2025-12-10', hazardType: 'Flood', warningLevel: 'Warning', districts: 9, responseTime: 32 }
];

// Tanzania Districts by Region
const TANZANIA_REGIONS = {
  'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
  'Dodoma': ['Dodoma Urban', 'Chamwino', 'Kondoa', 'Mpwapwa', 'Bahi', 'Chemba', 'Kongwa'],
  'Arusha': ['Arusha City', 'Arusha DC', 'Meru', 'Monduli', 'Karatu', 'Ngorongoro', 'Longido'],
  'Mwanza': ['Nyamagana', 'Ilemela', 'Magu', 'Misungwi', 'Kwimba', 'Sengerema', 'Ukerewe', 'Buchosa'],
  'Morogoro': ['Morogoro Urban', 'Morogoro DC', 'Kilombero', 'Ulanga', 'Mvomero', 'Kilosa', 'Gairo', 'Malinyi'],
  'Tanga': ['Tanga City', 'Muheza', 'Korogwe', 'Pangani', 'Handeni', 'Kilindi', 'Lushoto', 'Mkinga'],
  'Mbeya': ['Mbeya City', 'Mbeya DC', 'Chunya', 'Rungwe', 'Kyela', 'Mbarali', 'Busokelo'],
  'Kagera': ['Bukoba Urban', 'Bukoba DC', 'Muleba', 'Biharamulo', 'Ngara', 'Karagwe', 'Kyerwa', 'Missenyi'],
  'Kilimanjaro': ['Moshi Urban', 'Moshi DC', 'Hai', 'Rombo', 'Same', 'Mwanga', 'Siha'],
  'Iringa': ['Iringa Urban', 'Iringa DC', 'Kilolo', 'Mufindi', 'Mafinga'],
  'Pwani': ['Kibaha', 'Bagamoyo', 'Kisarawe', 'Mkuranga', 'Rufiji', 'Mafia'],
  'Singida': ['Singida Urban', 'Singida DC', 'Manyoni', 'Itigi', 'Ikungi', 'Iramba'],
  'Tabora': ['Tabora Urban', 'Uyui', 'Nzega', 'Igunga', 'Sikonge', 'Urambo', 'Kaliua'],
  'Mara': ['Musoma Urban', 'Musoma DC', 'Tarime', 'Serengeti', 'Bunda', 'Butiama', 'Rorya'],
  'Rukwa': ['Sumbawanga Urban', 'Sumbawanga DC', 'Nkasi', 'Kalambo'],
  'Kigoma': ['Kigoma Urban', 'Kigoma DC', 'Kasulu', 'Kibondo', 'Kakonko', 'Buhigwe', 'Uvinza'],
  'Shinyanga': ['Shinyanga Urban', 'Shinyanga DC', 'Kahama', 'Kishapu', 'Msalala', 'Ushetu'],
  'Lindi': ['Lindi Urban', 'Lindi DC', 'Kilwa', 'Nachingwea', 'Ruangwa', 'Liwale'],
  'Mtwara': ['Mtwara Urban', 'Mtwara DC', 'Newala', 'Masasi', 'Tandahimba', 'Nanyumbu'],
  'Ruvuma': ['Songea Urban', 'Songea DC', 'Mbinga', 'Namtumbo', 'Tunduru', 'Nyasa', 'Madaba'],
  'Geita': ['Geita', 'Chato', 'Mbogwe', 'Bukombe', 'Nyang\'hwale'],
  'Katavi': ['Mpanda', 'Mlele', 'Tanganyika'],
  'Njombe': ['Njombe Urban', 'Njombe DC', 'Makambako', 'Wanging\'ombe', 'Ludewa', 'Makete'],
  'Simiyu': ['Bariadi', 'Maswa', 'Meatu', 'Itilima', 'Busega'],
  'Songwe': ['Tunduma', 'Mbozi', 'Momba', 'Songwe'],
  'Zanzibar': ['Zanzibar Urban', 'Zanzibar North', 'Zanzibar South', 'Pemba North', 'Pemba South']
};

/**
 * Get warning history
 */
export const getWarningHistory = () => {
  // Combine sample data with any stored data
  try {
    const stored = JSON.parse(localStorage.getItem('warningHistory') || '[]');
    return [...SAMPLE_WARNING_HISTORY, ...stored].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
  } catch (e) {
    return SAMPLE_WARNING_HISTORY;
  }
};

/**
 * Add warning to history
 */
export const addWarningToHistory = (warning) => {
  try {
    const stored = JSON.parse(localStorage.getItem('warningHistory') || '[]');
    stored.push({
      date: new Date().toISOString().split('T')[0],
      hazardType: warning.hazardType,
      warningLevel: warning.warningLevel,
      districts: warning.spatialExtent?.length || 1,
      responseTime: warning.responseTime || Math.floor(Math.random() * 60) + 15
    });
    localStorage.setItem('warningHistory', JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to add warning to history:', e);
  }
};

/**
 * Get warnings by month for chart
 */
export const getWarningsByMonth = () => {
  const history = getWarningHistory();
  const monthCounts = {};

  history.forEach(warning => {
    const month = warning.date.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  // Get last 12 months
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    months.push({
      month: key,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: monthCounts[key] || 0
    });
  }

  return months;
};

/**
 * Get warnings by hazard type
 */
export const getWarningsByHazardType = () => {
  const history = getWarningHistory();
  const hazardCounts = {};

  history.forEach(warning => {
    hazardCounts[warning.hazardType] = (hazardCounts[warning.hazardType] || 0) + 1;
  });

  return Object.entries(hazardCounts)
    .map(([hazardType, count]) => ({ hazardType, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Get warnings by warning level
 */
export const getWarningsByLevel = () => {
  const history = getWarningHistory();
  const levelCounts = {
    'Advisory': 0,
    'Warning': 0,
    'Major Warning': 0
  };

  history.forEach(warning => {
    if (levelCounts.hasOwnProperty(warning.warningLevel)) {
      levelCounts[warning.warningLevel]++;
    }
  });

  return Object.entries(levelCounts).map(([level, count]) => ({
    level,
    count,
    color: level === 'Advisory' ? '#FFED00' :
           level === 'Warning' ? '#FF8C00' : '#FF0000'
  }));
};

/**
 * Get average response time by hazard type
 */
export const getResponseTimeByHazard = () => {
  const history = getWarningHistory();
  const hazardResponseTimes = {};

  history.forEach(warning => {
    if (!hazardResponseTimes[warning.hazardType]) {
      hazardResponseTimes[warning.hazardType] = [];
    }
    hazardResponseTimes[warning.hazardType].push(warning.responseTime);
  });

  return Object.entries(hazardResponseTimes).map(([hazardType, times]) => ({
    hazardType,
    avgResponseTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    minResponseTime: Math.min(...times),
    maxResponseTime: Math.max(...times),
    count: times.length
  }));
};

/**
 * Get district coverage statistics
 */
export const getDistrictCoverage = () => {
  const history = getWarningHistory();
  const totalDistricts = Object.values(TANZANIA_REGIONS).flat().length;

  // Count total districts affected
  const totalAffected = history.reduce((sum, w) => sum + w.districts, 0);

  // Calculate average districts per warning
  const avgDistrictsPerWarning = history.length > 0
    ? Math.round(totalAffected / history.length)
    : 0;

  // Get regions with most warnings (simulated)
  const regionWarnings = {};
  Object.keys(TANZANIA_REGIONS).forEach(region => {
    regionWarnings[region] = Math.floor(Math.random() * 20) + 1;
  });

  const topRegions = Object.entries(regionWarnings)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalDistricts,
    totalAffected,
    avgDistrictsPerWarning,
    topRegions
  };
};

/**
 * Get response time trends (monthly average)
 */
export const getResponseTimeTrends = () => {
  const history = getWarningHistory();
  const monthlyTimes = {};

  history.forEach(warning => {
    const month = warning.date.substring(0, 7);
    if (!monthlyTimes[month]) {
      monthlyTimes[month] = [];
    }
    monthlyTimes[month].push(warning.responseTime);
  });

  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    const times = monthlyTimes[key] || [];
    months.push({
      month: key,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      avgResponseTime: times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0
    });
  }

  return months;
};

/**
 * Get overall statistics
 */
export const getOverallStatistics = () => {
  const history = getWarningHistory();
  const now = new Date();
  const thisMonth = now.toISOString().substring(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString().substring(0, 7);

  const thisMonthWarnings = history.filter(w => w.date.startsWith(thisMonth)).length;
  const lastMonthWarnings = history.filter(w => w.date.startsWith(lastMonth)).length;

  const responseTimes = history.map(w => w.responseTime);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const majorWarnings = history.filter(w => w.warningLevel === 'Major Warning').length;

  // Calculate month-over-month change
  const monthChange = lastMonthWarnings > 0
    ? Math.round(((thisMonthWarnings - lastMonthWarnings) / lastMonthWarnings) * 100)
    : thisMonthWarnings > 0 ? 100 : 0;

  return {
    totalWarnings: history.length,
    thisMonth: thisMonthWarnings,
    lastMonth: lastMonthWarnings,
    monthChange,
    avgResponseTime,
    fastestResponse: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    slowestResponse: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    majorWarnings,
    majorWarningPercentage: history.length > 0
      ? Math.round((majorWarnings / history.length) * 100)
      : 0,
    totalDistrictsAffected: history.reduce((sum, w) => sum + w.districts, 0),
    avgDistrictsPerWarning: history.length > 0
      ? Math.round(history.reduce((sum, w) => sum + w.districts, 0) / history.length)
      : 0
  };
};

/**
 * Get hazard type distribution for pie chart
 */
export const getHazardDistribution = () => {
  const byHazard = getWarningsByHazardType();
  const total = byHazard.reduce((sum, h) => sum + h.count, 0);

  const colors = {
    'Flood': '#2196F3',
    'Drought': '#FF9800',
    'Cyclone': '#9C27B0',
    'Earthquake': '#F44336',
    'Epidemic': '#4CAF50',
    'Wildfire': '#FF5722',
    'Tsunami': '#00BCD4',
    'Landslide': '#795548',
    'Storm': '#607D8B'
  };

  return byHazard.map(h => ({
    ...h,
    percentage: total > 0 ? Math.round((h.count / total) * 100) : 0,
    color: colors[h.hazardType] || '#9E9E9E'
  }));
};

/**
 * Get weekly warning trend (last 12 weeks)
 */
export const getWeeklyTrend = () => {
  const history = getWarningHistory();
  const weeks = [];

  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const count = history.filter(w => {
      const date = new Date(w.date);
      return date >= weekStart && date < weekEnd;
    }).length;

    weeks.push({
      week: `W${12 - i}`,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      count
    });
  }

  return weeks;
};

/**
 * Get SMS statistics
 */
export const getSMSAnalytics = () => {
  try {
    const smsLog = JSON.parse(localStorage.getItem('smsLog') || '[]');

    const now = new Date();
    const last24h = smsLog.filter(s => {
      return (now - new Date(s.timestamp)) < 24 * 60 * 60 * 1000;
    });

    const last7d = smsLog.filter(s => {
      return (now - new Date(s.timestamp)) < 7 * 24 * 60 * 60 * 1000;
    });

    return {
      total: smsLog.length,
      last24Hours: last24h.length,
      last7Days: last7d.length,
      totalRecipients: smsLog.reduce((sum, s) => sum + s.recipients.length, 0),
      successRate: smsLog.length > 0
        ? Math.round((smsLog.filter(s => s.result?.success).length / smsLog.length) * 100)
        : 0
    };
  } catch (e) {
    return { total: 0, last24Hours: 0, last7Days: 0, totalRecipients: 0, successRate: 0 };
  }
};

/**
 * Get bulletin generation statistics
 */
export const getBulletinAnalytics = () => {
  try {
    const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
    const bulletinEvents = auditLog.filter(e =>
      e.eventType === 'BULLETIN_GENERATED' || e.eventType === 'BULLETIN_DOWNLOADED'
    );

    const byFormat = {};
    bulletinEvents.forEach(e => {
      const format = e.details?.format || 'PDF';
      byFormat[format] = (byFormat[format] || 0) + 1;
    });

    return {
      total: bulletinEvents.length,
      byFormat,
      generated: auditLog.filter(e => e.eventType === 'BULLETIN_GENERATED').length,
      downloaded: auditLog.filter(e => e.eventType === 'BULLETIN_DOWNLOADED').length
    };
  } catch (e) {
    return { total: 0, byFormat: {}, generated: 0, downloaded: 0 };
  }
};

/**
 * Export all analytics data
 */
export const exportAnalyticsData = () => {
  const data = {
    exportDate: new Date().toISOString(),
    overallStatistics: getOverallStatistics(),
    warningsByMonth: getWarningsByMonth(),
    warningsByHazardType: getWarningsByHazardType(),
    warningsByLevel: getWarningsByLevel(),
    responseTimeByHazard: getResponseTimeByHazard(),
    responseTimeTrends: getResponseTimeTrends(),
    districtCoverage: getDistrictCoverage(),
    hazardDistribution: getHazardDistribution(),
    smsAnalytics: getSMSAnalytics(),
    bulletinAnalytics: getBulletinAnalytics()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  return data;
};

export default {
  getWarningHistory,
  addWarningToHistory,
  getWarningsByMonth,
  getWarningsByHazardType,
  getWarningsByLevel,
  getResponseTimeByHazard,
  getDistrictCoverage,
  getResponseTimeTrends,
  getOverallStatistics,
  getHazardDistribution,
  getWeeklyTrend,
  getSMSAnalytics,
  getBulletinAnalytics,
  exportAnalyticsData,
  TANZANIA_REGIONS
};
