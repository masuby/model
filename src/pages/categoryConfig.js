export const CATEGORIES = {
  RISK: {
    id: 'risk',
    name: 'INFORM RISK',
    title: 'INFORM Risk Index',
    description: 'The INFORM Risk Index is a global, open-source risk assessment for humanitarian crises and disasters. It can support decisions about prevention, preparedness and response.',
    color: '#f30c20ff', // Red
    secondaryColor: '#F8F9FA',
    folder: 'risk-data'
  },
  WARNING: {
    id: 'warning',
    name: 'INFORM WARNING',
    title: 'INFORM Warning',
    description: 'The INFORM Warning (in development) intends to support decisions around preparedness, early warning and early action. It will be complementary to other INFORM products and is intended to pool resources and expertise to deliver shared analysis available to everyone.',
    color: '#d4950dff', // Orange
    secondaryColor: '#FDF6EC',
    folder: 'warning-data'
  },
  SEVERITY: {
    id: 'severity',
    name: 'INFORM SEVERITY',
    title: 'INFORM Severity Index',
    description: 'The INFORM Severity Index is an improved way to objectively measure and compare the severity of humanitarian crises and disasters globally. It can help us develop a shared understanding of crisis severity and ensure all those affected get the help they need.',
    color: '#860ad8ff', // Teal
    secondaryColor: '#F0F9F7',
    folder: 'severity-data'
  },
  CLIMATE: {
    id: 'climate',
    name: 'INFORM CLIMATE CHANGE',
    title: 'INFORM Climate Change',
    description: 'INFORM Climate Change Risk Index is an upgrade of INFORM Risk Index. It includes climate and socio-economic projections. The results are intended to inform policy choices across climate mitigation, climate adaptation, disaster risk reduction, sustainable development and humanitarian assistance.',
    color: '#07b1bdff', // Blue
    secondaryColor: '#F0F7FF',
    folder: 'climate-data'
  }
};

export const FOOTER_CONTENT = {
  risk: {
    title: "INFORM Risk Index",
    description: 'The INFORM Risk Index is a global, open-source risk assessment for humanitarian crises and disasters. It can support decisions about prevention, preparedness and response.',
    contacts: ["risk@inform.co.tz", "+255 719 592 997"],
    quickLinks: ["Methodology", "Data Sources", "Publications", "Get Involved"]
  },
  warning: {
    title: "INFORM Warning",
    description: 'The INFORM Warning (in development) intends to support decisions around preparedness, early warning and early action. It will be complementary to other INFORM products and is intended to pool resources and expertise to deliver shared analysis available to everyone.',
    contacts: ["warning@inform.co.tz", "+255 719 592 997"],
    quickLinks: ["Early Action", "Alerts", "Partners", "Resources"]
  },
  severity: {
    title: "INFORM Severity Index", 
    description: 'The INFORM Severity Index is an improved way to objectively measure and compare the severity of humanitarian crises and disasters globally. It can help us develop a shared understanding of crisis severity and ensure all those affected get the help they need.',
    contacts: ["severity@inform.co.tz", "+255 719 592 997"],
    quickLinks: ["Severity Scale", "Case Studies", "Reports", "Training"]
  },
  climate: {
    title: "INFORM Climate Change",
    description: 'INFORM Climate Change Risk Index is an upgrade of INFORM Risk Index. It includes climate and socio-economic projections. The results are intended to inform policy choices across climate mitigation, climate adaptation, disaster risk reduction, sustainable development and humanitarian assistance.',
    contacts: ["climate@inform.co.tz", "+255 719 592 997"],
    quickLinks: ["Climate Data", "Projections", "Adaptation", "Mitigation"]
  }
};