/**
 * SMS SERVICE
 * Handles emergency SMS alerts to affected districts
 * Supports multiple providers: Africa's Talking, Twilio, Beem Africa (Tanzania)
 */

// SMS Provider Configuration
// Note: In Vite, use import.meta.env.VITE_* instead of process.env.REACT_APP_*
const SMS_CONFIG = {
  // Default provider for Tanzania
  provider: 'beem', // Options: 'beem', 'africastalking', 'twilio'

  // Beem Africa (Tanzania local provider)
  beem: {
    apiKey: import.meta.env?.VITE_BEEM_API_KEY || 'your-beem-api-key',
    secretKey: import.meta.env?.VITE_BEEM_SECRET_KEY || 'your-beem-secret',
    senderId: 'PMO-DMD',
    baseUrl: 'https://apisms.beem.africa/v1/send'
  },

  // Africa's Talking
  africastalking: {
    apiKey: import.meta.env?.VITE_AT_API_KEY || 'your-at-api-key',
    username: import.meta.env?.VITE_AT_USERNAME || 'sandbox',
    senderId: 'PMO-DMD',
    baseUrl: 'https://api.africastalking.com/version1/messaging'
  },

  // Twilio
  twilio: {
    accountSid: import.meta.env?.VITE_TWILIO_SID || 'your-twilio-sid',
    authToken: import.meta.env?.VITE_TWILIO_TOKEN || 'your-twilio-token',
    fromNumber: import.meta.env?.VITE_TWILIO_NUMBER || '+15551234567'
  }
};

// District Emergency Contacts Database
const DISTRICT_CONTACTS = {
  // Dar es Salaam Region
  'Ilala': {
    deo: '+255754000001', // District Executive Officer
    dmc: '+255754000002', // District Medical Officer
    police: '+255754000003',
    fireRescue: '+255754000004',
    redCross: '+255754000005',
    emergencyTeam: ['+255754000006', '+255754000007', '+255754000008']
  },
  'Kinondoni': {
    deo: '+255754100001',
    dmc: '+255754100002',
    police: '+255754100003',
    fireRescue: '+255754100004',
    redCross: '+255754100005',
    emergencyTeam: ['+255754100006', '+255754100007', '+255754100008']
  },
  'Temeke': {
    deo: '+255754200001',
    dmc: '+255754200002',
    police: '+255754200003',
    fireRescue: '+255754200004',
    redCross: '+255754200005',
    emergencyTeam: ['+255754200006', '+255754200007', '+255754200008']
  },
  'Ubungo': {
    deo: '+255754300001',
    dmc: '+255754300002',
    police: '+255754300003',
    fireRescue: '+255754300004',
    redCross: '+255754300005',
    emergencyTeam: ['+255754300006', '+255754300007', '+255754300008']
  },
  'Kigamboni': {
    deo: '+255754400001',
    dmc: '+255754400002',
    police: '+255754400003',
    fireRescue: '+255754400004',
    redCross: '+255754400005',
    emergencyTeam: ['+255754400006', '+255754400007', '+255754400008']
  },

  // Dodoma Region
  'Dodoma Urban': {
    deo: '+255755000001',
    dmc: '+255755000002',
    police: '+255755000003',
    fireRescue: '+255755000004',
    redCross: '+255755000005',
    emergencyTeam: ['+255755000006', '+255755000007', '+255755000008']
  },
  'Chamwino': {
    deo: '+255755100001',
    dmc: '+255755100002',
    police: '+255755100003',
    fireRescue: '+255755100004',
    redCross: '+255755100005',
    emergencyTeam: ['+255755100006', '+255755100007', '+255755100008']
  },

  // Arusha Region
  'Arusha City': {
    deo: '+255756000001',
    dmc: '+255756000002',
    police: '+255756000003',
    fireRescue: '+255756000004',
    redCross: '+255756000005',
    emergencyTeam: ['+255756000006', '+255756000007', '+255756000008']
  },
  'Arusha DC': {
    deo: '+255756100001',
    dmc: '+255756100002',
    police: '+255756100003',
    fireRescue: '+255756100004',
    redCross: '+255756100005',
    emergencyTeam: ['+255756100006', '+255756100007', '+255756100008']
  },
  'Meru': {
    deo: '+255756200001',
    dmc: '+255756200002',
    police: '+255756200003',
    fireRescue: '+255756200004',
    redCross: '+255756200005',
    emergencyTeam: ['+255756200006', '+255756200007', '+255756200008']
  },

  // Mwanza Region
  'Nyamagana': {
    deo: '+255757000001',
    dmc: '+255757000002',
    police: '+255757000003',
    fireRescue: '+255757000004',
    redCross: '+255757000005',
    emergencyTeam: ['+255757000006', '+255757000007', '+255757000008']
  },
  'Ilemela': {
    deo: '+255757100001',
    dmc: '+255757100002',
    police: '+255757100003',
    fireRescue: '+255757100004',
    redCross: '+255757100005',
    emergencyTeam: ['+255757100006', '+255757100007', '+255757100008']
  },

  // Morogoro Region
  'Morogoro Urban': {
    deo: '+255758000001',
    dmc: '+255758000002',
    police: '+255758000003',
    fireRescue: '+255758000004',
    redCross: '+255758000005',
    emergencyTeam: ['+255758000006', '+255758000007', '+255758000008']
  },
  'Kilombero': {
    deo: '+255758100001',
    dmc: '+255758100002',
    police: '+255758100003',
    fireRescue: '+255758100004',
    redCross: '+255758100005',
    emergencyTeam: ['+255758100006', '+255758100007', '+255758100008']
  },

  // Default contacts for unlisted districts
  'default': {
    deo: '+255222110000',
    dmc: '+255222110001',
    police: '+255222110002',
    fireRescue: '+255222110003',
    redCross: '+255222110004',
    emergencyTeam: ['+255222110005', '+255222110006']
  }
};

// SMS Templates in English and Swahili
const SMS_TEMPLATES = {
  // Warning Alert Templates
  warning: {
    en: (data) => `EMERGENCY ALERT - PMO-DMD
${data.warningLevel.toUpperCase()}: ${data.hazardType}
District: ${data.district}
Time: ${data.time}
${data.message}
Actions: ${data.actions}
Emergency: 190`,

    sw: (data) => `TAHADHARI YA DHARURA - PMO-DMD
${data.warningLevel.toUpperCase()}: ${data.hazardType}
Wilaya: ${data.district}
Muda: ${data.time}
${data.message}
Hatua: ${data.actions}
Dharura: 190`
  },

  // Advisory Alert
  advisory: {
    en: (data) => `WEATHER ADVISORY - PMO-DMD
${data.hazardType} expected in ${data.district}
Valid: ${data.validFrom} to ${data.validTo}
${data.message}
Stay informed. Emergency: 190`,

    sw: (data) => `USHAURI WA HALI YA HEWA - PMO-DMD
${data.hazardType} inatarajiwa ${data.district}
Muda: ${data.validFrom} hadi ${data.validTo}
${data.message}
Endelea kupata taarifa. Dharura: 190`
  },

  // Major Warning (Critical)
  majorWarning: {
    en: (data) => `CRITICAL EMERGENCY - PMO-DMD
MAJOR ${data.hazardType.toUpperCase()} WARNING
District: ${data.district}
IMMEDIATE ACTION REQUIRED!
${data.message}
Evacuate if instructed.
Emergency: 190`,

    sw: (data) => `DHARURA KUBWA - PMO-DMD
ONYO KUBWA LA ${data.hazardType.toUpperCase()}
Wilaya: ${data.district}
HATUA YA HARAKA INAHITAJIKA!
${data.message}
Ondoka eneo ikiwa umeelekezwa.
Dharura: 190`
  },

  // All Clear
  allClear: {
    en: (data) => `ALL CLEAR - PMO-DMD
The ${data.hazardType} warning for ${data.district} has been lifted.
Normal activities may resume.
Stay vigilant. Emergency: 190`,

    sw: (data) => `HALI SALAMA - PMO-DMD
Onyo la ${data.hazardType} kwa ${data.district} limeondolewa.
Shughuli za kawaida zinaweza kuendelea.
Kuwa macho. Dharura: 190`
  },

  // Test Message
  test: {
    en: (data) => `TEST MESSAGE - PMO-DMD
This is a test of the Emergency Alert System.
District: ${data.district}
No action required. This is only a test.`,

    sw: (data) => `UJUMBE WA MAJARIBIO - PMO-DMD
Hii ni majaribio ya Mfumo wa Tahadhari ya Dharura.
Wilaya: ${data.district}
Hakuna hatua inayohitajika. Hii ni majaribio tu.`
  }
};

// SMS Log Storage (in production, use database)
let smsLog = [];

/**
 * Send SMS via Beem Africa (Tanzania)
 */
const sendViaBeem = async (recipients, message) => {
  const config = SMS_CONFIG.beem;

  try {
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${config.apiKey}:${config.secretKey}`)
      },
      body: JSON.stringify({
        source_addr: config.senderId,
        schedule_time: '',
        encoding: 0,
        message: message,
        recipients: recipients.map((phone, index) => ({
          recipient_id: index + 1,
          dest_addr: phone.replace('+', '')
        }))
      })
    });

    const result = await response.json();
    return {
      success: result.code === 100,
      provider: 'beem',
      messageId: result.message_id || null,
      response: result
    };
  } catch (error) {
    console.error('Beem SMS Error:', error);
    return { success: false, provider: 'beem', error: error.message };
  }
};

/**
 * Send SMS via Africa's Talking
 */
const sendViaAfricasTalking = async (recipients, message) => {
  const config = SMS_CONFIG.africastalking;

  try {
    const formData = new URLSearchParams();
    formData.append('username', config.username);
    formData.append('to', recipients.join(','));
    formData.append('message', message);
    formData.append('from', config.senderId);

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': config.apiKey
      },
      body: formData
    });

    const result = await response.json();
    return {
      success: result.SMSMessageData?.Recipients?.length > 0,
      provider: 'africastalking',
      messageId: result.SMSMessageData?.Message || null,
      response: result
    };
  } catch (error) {
    console.error('Africa\'s Talking SMS Error:', error);
    return { success: false, provider: 'africastalking', error: error.message };
  }
};

/**
 * Send SMS via Twilio
 */
const sendViaTwilio = async (recipients, message) => {
  const config = SMS_CONFIG.twilio;

  const results = [];

  for (const recipient of recipients) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`)
          },
          body: new URLSearchParams({
            To: recipient,
            From: config.fromNumber,
            Body: message
          })
        }
      );

      const result = await response.json();
      results.push({
        recipient,
        success: result.sid ? true : false,
        messageId: result.sid
      });
    } catch (error) {
      results.push({
        recipient,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.some(r => r.success),
    provider: 'twilio',
    results
  };
};

/**
 * Main SMS sending function
 * @param {string[]} recipients - Array of phone numbers
 * @param {string} message - SMS message content
 * @param {string} provider - Optional provider override
 */
export const sendSMS = async (recipients, message, provider = SMS_CONFIG.provider) => {
  console.log(`Sending SMS via ${provider} to ${recipients.length} recipients`);

  let result;

  switch (provider) {
    case 'beem':
      result = await sendViaBeem(recipients, message);
      break;
    case 'africastalking':
      result = await sendViaAfricasTalking(recipients, message);
      break;
    case 'twilio':
      result = await sendViaTwilio(recipients, message);
      break;
    default:
      result = await sendViaBeem(recipients, message);
  }

  // Log the SMS
  const logEntry = {
    id: `sms_${Date.now()}`,
    timestamp: new Date().toISOString(),
    recipients,
    message,
    provider,
    result,
    messageLength: message.length,
    smsCount: Math.ceil(message.length / 160)
  };

  smsLog.push(logEntry);

  // Store in localStorage for persistence
  try {
    const existingLog = JSON.parse(localStorage.getItem('smsLog') || '[]');
    existingLog.push(logEntry);
    localStorage.setItem('smsLog', JSON.stringify(existingLog.slice(-500))); // Keep last 500
  } catch (e) {
    console.error('Failed to save SMS log:', e);
  }

  return result;
};

/**
 * Send emergency alert to affected districts
 * @param {object} warningData - Warning information
 * @param {string[]} districts - List of affected districts
 * @param {string} language - 'en' or 'sw'
 * @param {string[]} recipientTypes - Types of contacts to alert
 */
export const sendEmergencyAlert = async (
  warningData,
  districts,
  language = 'en',
  recipientTypes = ['deo', 'dmc', 'police', 'emergencyTeam']
) => {
  console.log(`Sending emergency alerts to ${districts.length} districts`);

  const results = [];

  for (const district of districts) {
    // Get district contacts
    const contacts = DISTRICT_CONTACTS[district] || DISTRICT_CONTACTS['default'];

    // Collect phone numbers based on recipient types
    const recipients = [];
    for (const type of recipientTypes) {
      const contact = contacts[type];
      if (Array.isArray(contact)) {
        recipients.push(...contact);
      } else if (contact) {
        recipients.push(contact);
      }
    }

    // Determine message template based on warning level
    let template;
    switch (warningData.warningLevel) {
      case 'Major Warning':
        template = SMS_TEMPLATES.majorWarning;
        break;
      case 'Warning':
        template = SMS_TEMPLATES.warning;
        break;
      case 'Advisory':
        template = SMS_TEMPLATES.advisory;
        break;
      default:
        template = SMS_TEMPLATES.warning;
    }

    // Generate message
    const messageData = {
      hazardType: warningData.hazardType,
      warningLevel: warningData.warningLevel,
      district: district,
      time: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Dar_es_Salaam' }),
      message: warningData.description || warningData.message || 'Take precautionary measures',
      actions: warningData.recommendedActions?.slice(0, 2).join('. ') || 'Follow official instructions',
      validFrom: warningData.validFrom || 'Now',
      validTo: warningData.validTo || 'Until further notice'
    };

    const message = template[language](messageData);

    // Send SMS
    const result = await sendSMS(recipients, message);

    results.push({
      district,
      recipients: recipients.length,
      success: result.success,
      messageLength: message.length,
      smsCount: Math.ceil(message.length / 160)
    });
  }

  // Calculate summary
  const summary = {
    totalDistricts: districts.length,
    successfulDistricts: results.filter(r => r.success).length,
    totalRecipients: results.reduce((sum, r) => sum + r.recipients, 0),
    totalSMS: results.reduce((sum, r) => sum + (r.smsCount * r.recipients), 0),
    timestamp: new Date().toISOString(),
    results
  };

  console.log('Emergency Alert Summary:', summary);

  return summary;
};

/**
 * Send test SMS
 */
export const sendTestSMS = async (phoneNumber, district = 'Test District', language = 'en') => {
  const message = SMS_TEMPLATES.test[language]({ district });
  return await sendSMS([phoneNumber], message);
};

/**
 * Send all-clear notification
 */
export const sendAllClear = async (warningData, districts, language = 'en') => {
  const results = [];

  for (const district of districts) {
    const contacts = DISTRICT_CONTACTS[district] || DISTRICT_CONTACTS['default'];
    const recipients = [
      contacts.deo,
      contacts.dmc,
      ...contacts.emergencyTeam
    ].filter(Boolean);

    const message = SMS_TEMPLATES.allClear[language]({
      hazardType: warningData.hazardType,
      district
    });

    const result = await sendSMS(recipients, message);
    results.push({ district, success: result.success });
  }

  return results;
};

/**
 * Get SMS log
 */
export const getSMSLog = () => {
  try {
    return JSON.parse(localStorage.getItem('smsLog') || '[]');
  } catch (e) {
    return smsLog;
  }
};

/**
 * Get SMS statistics
 */
export const getSMSStatistics = () => {
  const log = getSMSLog();

  const last24h = log.filter(entry => {
    const entryTime = new Date(entry.timestamp);
    const now = new Date();
    return (now - entryTime) < 24 * 60 * 60 * 1000;
  });

  const last7d = log.filter(entry => {
    const entryTime = new Date(entry.timestamp);
    const now = new Date();
    return (now - entryTime) < 7 * 24 * 60 * 60 * 1000;
  });

  return {
    total: log.length,
    last24Hours: last24h.length,
    last7Days: last7d.length,
    successRate: log.length > 0
      ? (log.filter(e => e.result?.success).length / log.length * 100).toFixed(1)
      : 0,
    totalRecipients: log.reduce((sum, e) => sum + e.recipients.length, 0),
    avgMessageLength: log.length > 0
      ? Math.round(log.reduce((sum, e) => sum + e.messageLength, 0) / log.length)
      : 0
  };
};

/**
 * Get district contacts
 */
export const getDistrictContacts = (district) => {
  return DISTRICT_CONTACTS[district] || DISTRICT_CONTACTS['default'];
};

/**
 * Update district contacts
 */
export const updateDistrictContacts = (district, contacts) => {
  DISTRICT_CONTACTS[district] = { ...DISTRICT_CONTACTS[district], ...contacts };

  // Persist to localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('districtContacts') || '{}');
    stored[district] = DISTRICT_CONTACTS[district];
    localStorage.setItem('districtContacts', JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to save district contacts:', e);
  }
};

export default {
  sendSMS,
  sendEmergencyAlert,
  sendTestSMS,
  sendAllClear,
  getSMSLog,
  getSMSStatistics,
  getDistrictContacts,
  updateDistrictContacts,
  SMS_TEMPLATES,
  DISTRICT_CONTACTS
};
