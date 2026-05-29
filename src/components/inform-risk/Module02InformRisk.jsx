/**
 * MODULE 02: INFORM RISK DASHBOARD
 *
 * Comprehensive risk assessment dashboard for Tanzania
 * Implements the complete INFORM methodology from the Country Model Template
 * Enhanced with UNDRR Risk Assessment Framework
 *
 * Formula: Risk = (H and E × V × LCC)^(1/3)
 *
 * Features:
 * - Risk Assessment Phases (Scoping → Identification → Analysis → Evaluation)
 * - Risk Matrix (Likelihood × Impact)
 * - 10 Key Principles for Comprehensive Risk Assessment
 * - Three INFORM Dimensions with detailed breakdowns
 * - Hazard-specific risk per district with dropdown selection
 */

import React, { useState, useEffect, useMemo } from 'react';
import './Module02InformRisk.css';

// Dimension components
import HazardExposureDimension from './dimensions/HazardExposureDimension';
import VulnerabilityDimension from './dimensions/VulnerabilityDimension';
import CopingCapacityDimension from './dimensions/CopingCapacityDimension';

// Data service - parses Excel template
import { parseInformRiskData } from '../../services/informRiskDataService';

// Mock data service (fallback) and hazard types
import { getMockTanzaniaData, HAZARD_TYPES, OVERALL_RISK } from './mockData';

// Report Export
import ReportExportButton from '../warning/components/ReportExportButton';

// Committee Verified Data Panel - Next Generation
import CommitteeVerifiedDataPanel from './CommitteeVerifiedDataPanel';

// Supabase data service for approved risk data
import { getApprovedRiskData as fetchApprovedRiskData, isUsingSupabase } from '../../services/supabaseDataService';

// Risk Assessment Phases based on ISO 31000 and UNDRR Technical Guidance
const RISK_ASSESSMENT_PHASES = [
  {
    id: 'scoping',
    name: 'Scoping',
    icon: '🎯',
    color: '#2196F3',
    description: 'Define objectives, context, and boundaries of the risk assessment',
    details: [
      'Identify existing policy and planning framework',
      'Define assessment scope and objectives',
      'Establish stakeholder engagement strategy',
      'Determine available resources and data'
    ]
  },
  {
    id: 'identification',
    name: 'Risk Identification',
    icon: '🔍',
    color: '#9C27B0',
    description: 'Identify relevant risks from existing knowledge and expert input',
    details: [
      'Review historical disaster events',
      'Identify potential hazard scenarios',
      'Map exposed populations and assets',
      'Document known vulnerabilities'
    ]
  },
  {
    id: 'analysis',
    name: 'Risk Analysis',
    icon: '📊',
    color: '#FF9800',
    description: 'Analyze risk components, interlinkages, and potential consequences',
    details: [
      'Assess hazard probability and intensity',
      'Evaluate exposure levels',
      'Analyze vulnerability factors',
      'Model cascading and systemic impacts'
    ]
  },
  {
    id: 'evaluation',
    name: 'Risk Evaluation',
    icon: '⚖️',
    color: '#4CAF50',
    description: 'Identify urgent actions based on risk tolerability levels',
    details: [
      'Compare risks against tolerance thresholds',
      'Prioritize risks for action',
      'Identify risk reduction measures',
      'Recommend interventions'
    ]
  }
];

// 10 Key Principles for Comprehensive Risk Assessment (UNDRR 2022)
const TEN_PRINCIPLES = [
  { icon: '👥', title: 'Human and Ecological Systems', description: 'Put risk to human and ecological systems at the centre' },
  { icon: '🌡️', title: 'Climate Change Context', description: 'Fully account for the context of climate change' },
  { icon: '🔗', title: 'Systemic Nature', description: 'Recognize the complex and systemic nature of risks' },
  { icon: '🤝', title: 'Inclusive Governance', description: 'Apply inclusive risk governance approaches' },
  { icon: '🔬', title: 'Multidisciplinary Approach', description: 'Use multidisciplinary approaches to identify measures' },
  { icon: '📏', title: 'Risk Tolerance', description: 'Use the concept of risk tolerance for decision-making' },
  { icon: '🌿', title: 'Nature-based Solutions', description: 'Address risks through Nature-based Solutions' },
  { icon: '🔄', title: 'Cross-sector Integration', description: 'Integrate risk across sectors and levels' },
  { icon: '📢', title: 'Risk Communication', description: 'Strengthen risk communication and knowledge' },
  { icon: '♻️', title: 'Iterative Process', description: 'Use iterative and flexible processes' }
];

const Module02InformRisk = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState('scoping');

  // Load approved committee data from Supabase (falls back to localStorage)

  // Merge approved committee data into existing risk data
  const mergeApprovedData = (baseData, approvedSubmissions) => {
    if (!baseData || !approvedSubmissions?.length) return baseData;

    const merged = JSON.parse(JSON.stringify(baseData)); // Deep clone

    approvedSubmissions.forEach(approved => {
      // Use calculated scores from INFORM methodology
      const calc = approved.calculated;
      if (!calc) return;

      // Create district entry from approved data with full INFORM structure
      const newEntry = {
        admin: {
          country: 'United Republic of Tanzania',
          adm1Name: approved.adm1Name,
          adm2Name: approved.adm2Name || approved.adm1Name,
          iso3: 'TZA',
          adm1Code: approved.adm1Code,
          adm2Code: approved.adm2Code
        },
        hazardExposure: {
          total: calc.hazardScore,
          natural: calc.dimensions?.HAZARD?.categories?.Natural,
          human: calc.dimensions?.HAZARD?.categories?.Human
        },
        vulnerability: {
          total: calc.vulnerabilityScore,
          socioEconomic: calc.dimensions?.VULNERABILITY?.categories?.['Socio-Economic'],
          vulnerableGroups: calc.dimensions?.VULNERABILITY?.categories?.['Vulnerable Groups']
        },
        lackCopingCapacity: {
          total: calc.lackOfCopingScore,
          institutional: calc.dimensions?.COPING_CAPACITY?.categories?.Institutional,
          infrastructure: calc.dimensions?.COPING_CAPACITY?.categories?.Infrastructure
        },
        risk: calc.riskScore,
        classification: calc.riskClass,
        _committeeSource: {
          committeeName: approved.committeeName,
          submittedBy: approved.submittedBy,
          submittedAt: approved.submittedAt,
          approvedAt: approved.approvedAt,
          approvedBy: approved.approvedBy,
          methodology: approved.methodology || 'INFORM 2024',
          indicatorCount: Object.keys(approved.indicators || {}).length
        }
      };

      // Merge into adm2 array
      if (!merged.subnational) merged.subnational = {};
      if (!merged.subnational.adm2) merged.subnational.adm2 = [];

      // Find existing entry for this region/district
      const existingIdx = merged.subnational.adm2.findIndex(d =>
        d.admin?.adm1Name === approved.adm1Name &&
        (approved.adm2Name ? d.admin?.adm2Name === approved.adm2Name : true)
      );

      if (existingIdx >= 0) {
        // Override with committee-approved data
        merged.subnational.adm2[existingIdx] = {
          ...merged.subnational.adm2[existingIdx],
          ...newEntry
        };
      } else {
        // Add as new entry
        merged.subnational.adm2.push(newEntry);
      }
    });

    return merged;
  };

  // Load INFORM Risk data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const excelUrl = '/data/tanzania-inform-risk.xlsx';
        console.log('🚀 Loading INFORM Risk data from Excel...');
        let riskData = await parseInformRiskData(excelUrl);

        // Merge approved committee data from Supabase (or localStorage)
        const approvedData = await fetchApprovedRiskData();
        if (approvedData.length > 0) {
          console.log(`📊 Merging ${approvedData.length} approved submissions ${isUsingSupabase() ? 'from Supabase' : 'from localStorage'}...`);
          riskData = mergeApprovedData(riskData, approvedData);
        }

        setData(riskData);
        setLoading(false);
        console.log('✅ INFORM Risk data loaded successfully!');
      } catch (error) {
        console.error('❌ Error loading Excel data:', error);
        console.warn('⚠️ Falling back to mock data');
        let mockData = getMockTanzaniaData();

        // Still merge approved data even with mock
        try {
          const approvedData = await fetchApprovedRiskData();
          if (approvedData.length > 0) {
            mockData = mergeApprovedData(mockData, approvedData);
          }
        } catch (e) {
          console.warn('Could not load approved data:', e);
        }

        setData(mockData);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate verification of INFORM formula
  const formulaVerification = useMemo(() => {
    if (!data) return null;
    const { hazardExposure, vulnerability, lackCopingCapacity, risk } = data.national;
    const calculated = Math.pow(hazardExposure * vulnerability * lackCopingCapacity, 1/3);
    const diff = Math.abs(calculated - risk);
    return {
      calculated: calculated.toFixed(2),
      actual: risk.toFixed(2),
      isValid: diff < 0.1,
      difference: diff.toFixed(3)
    };
  }, [data]);

  if (loading) {
    return (
      <div className="module02-loading">
        <div className="loading-spinner"></div>
        <p>Loading INFORM Risk Data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="module02-error">
        <h2>Error Loading Data</h2>
        <p>Could not load INFORM Risk data. Please check the data source.</p>
      </div>
    );
  }

  const { national } = data;
  const { classification } = national;

  return (
    <div className="module02-container">
      {/* Header */}
      <header className="module02-header">
        <div className="header-content">
          <div className="header-left">
            <h1>INFORM Risk Assessment</h1>
            <p className="header-subtitle">Tanzania Index for Risk Management</p>
          </div>
          <div className="header-right">
            <div className="risk-badge" style={{ borderColor: classification.color }}>
              <div className="risk-score" style={{ color: classification.color }}>
                {national.risk.toFixed(1)}
              </div>
              <div className="risk-label">{classification.level} Risk</div>
              <div className="risk-range">{classification.range}</div>
            </div>
            <ReportExportButton
              reportType="risk"
              reportData={data}
              buttonStyle="secondary"
              buttonText="Export Report"
              onExportComplete={(format) => console.log(`📊 Risk assessment exported as ${format}`)}
            />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="module02-nav">
        <button
          className={`nav-tab ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          📚 Overview
        </button>
        <button
          className={`nav-tab ${selectedView === 'hazard' ? 'active' : ''}`}
          onClick={() => setSelectedView('hazard')}
        >
          ⚠️ Hazard and Exposure
        </button>
        <button
          className={`nav-tab ${selectedView === 'vulnerability' ? 'active' : ''}`}
          onClick={() => setSelectedView('vulnerability')}
        >
          🛡️ Vulnerability
        </button>
        <button
          className={`nav-tab ${selectedView === 'coping' ? 'active' : ''}`}
          onClick={() => setSelectedView('coping')}
        >
          🏛️ Coping Capacity
        </button>
        <button
          className={`nav-tab ${selectedView === 'risk' ? 'active' : ''}`}
          onClick={() => setSelectedView('risk')}
        >
          🗺️ Risk
        </button>
        <button
          className={`nav-tab verified-tab ${selectedView === 'verified' ? 'active' : ''}`}
          onClick={() => setSelectedView('verified')}
        >
          ✅ Verified Data
        </button>
      </div>

      {/* Main Content */}
      <main className="module02-main">
        {selectedView === 'overview' && (
          <OverviewSection
            selectedPhase={selectedPhase}
            onSelectPhase={setSelectedPhase}
          />
        )}

        {selectedView === 'hazard' && (
          <HazardExposureDimension data={national.dimensions.hazardExposure} />
        )}

        {selectedView === 'vulnerability' && (
          <VulnerabilityDimension data={national.dimensions.vulnerability} />
        )}

        {selectedView === 'coping' && (
          <CopingCapacityDimension data={national.dimensions.lackCopingCapacity} />
        )}

        {selectedView === 'risk' && (
          <RiskSection
            data={data}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
          />
        )}

        {selectedView === 'verified' && (
          <CommitteeVerifiedDataPanel
            nationalData={national}
            onSelectRegion={(region) => {
              setSelectedDistrict(region);
              setSelectedView('risk');
            }}
          />
        )}
      </main>

    </div>
  );
};

/**
 * Overview Section - Risk Assessment Framework
 */
const OverviewSection = ({ selectedPhase, onSelectPhase }) => {
  return (
    <div className="overview-section">
      {/* Introduction */}
      <div className="overview-intro">
        <h2>How Do We Measure Disaster Risk?</h2>
        <p className="intro-text">
          Identifying, assessing and understanding disaster risk is critical to reducing it.
          We can measure disaster risk by analysing trends of previous disaster losses and
          estimate future losses by conducting comprehensive risk assessments.
        </p>
        <div className="key-insight">
          <span className="insight-icon">💡</span>
          <p>
            <strong>Hazards do not have to turn into disasters.</strong> A catastrophic disaster
            is not the inevitable consequence of a hazard event. Much can be done to reduce
            exposure and vulnerability of populations.
          </p>
        </div>
      </div>

      {/* Risk Assessment Phases */}
      <div className="assessment-phases">
        <h3>Risk Assessment Phases (ISO 31000)</h3>
        <p className="section-description">
          The comprehensive risk assessment follows the ISO 31000 workflow with four main phases.
          Click each phase to learn more.
        </p>

        <div className="phases-timeline">
          {RISK_ASSESSMENT_PHASES.map((phase, index) => (
            <div
              key={phase.id}
              className={`phase-card ${selectedPhase === phase.id ? 'active' : ''}`}
              onClick={() => onSelectPhase(phase.id)}
              style={{ '--phase-color': phase.color }}
            >
              <div className="phase-number">{index + 1}</div>
              <div className="phase-icon">{phase.icon}</div>
              <div className="phase-name">{phase.name}</div>
              {index < RISK_ASSESSMENT_PHASES.length - 1 && (
                <div className="phase-arrow">→</div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Phase Details */}
        {selectedPhase && (
          <div className="phase-details">
            {RISK_ASSESSMENT_PHASES.filter(p => p.id === selectedPhase).map(phase => (
              <div key={phase.id} className="phase-detail-card" style={{ borderLeftColor: phase.color }}>
                <div className="detail-header">
                  <span className="detail-icon">{phase.icon}</span>
                  <h4>{phase.name}</h4>
                </div>
                <p className="detail-description">{phase.description}</p>
                <ul className="detail-list">
                  {phase.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 10 Key Principles */}
      <div className="key-principles">
        <h3>10 Key Principles for Comprehensive Risk Assessment</h3>
        <p className="section-description">
          Based on UNDRR Technical Guidance (2022) for risk assessment in the context of climate change.
        </p>
        <div className="principles-grid">
          {TEN_PRINCIPLES.map((principle, index) => (
            <div key={index} className="principle-card">
              <div className="principle-number">{index + 1}</div>
              <div className="principle-icon">{principle.icon}</div>
              <div className="principle-content">
                <h4>{principle.title}</h4>
                <p>{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Components */}
      <div className="risk-components">
        <h3>Components of Risk Assessment</h3>
        <div className="components-grid">
          <div className="component-card hazard">
            <div className="component-icon">⚡</div>
            <h4>Hazard</h4>
            <p>
              The probability of experiencing a certain intensity of hazard at a specific location.
              Can include secondary perils (e.g., liquefaction from earthquakes, storm surge from cyclones).
            </p>
          </div>
          <div className="component-card exposure">
            <div className="component-icon">🏘️</div>
            <h4>Exposure</h4>
            <p>
              The stock of property, infrastructure, and populations exposed to a hazard.
              Includes socioeconomic factors and critical assets.
            </p>
          </div>
          <div className="component-card vulnerability">
            <div className="component-icon">🎯</div>
            <h4>Vulnerability</h4>
            <p>
              The susceptibility to damage of assets exposed to hazard forces.
              Includes fragility functions estimating damage ratios and social costs.
            </p>
          </div>
        </div>
      </div>

      {/* Risk Dimensions Overview - INFORM Three Pillars */}
      <div className="risk-dimensions-overview">
        <h3>Risk Dimensions Overview (INFORM Framework)</h3>
        <p className="section-description">
          The INFORM Risk Index combines three equally-weighted dimensions using geometric mean aggregation.
          Each dimension captures a distinct aspect of disaster risk.
        </p>
        <div className="dimensions-overview-grid">
          <div className="dimension-overview-card he">
            <div className="dim-header">
              <span className="dim-icon">⚠️</span>
              <div className="dim-title">
                <h4>Hazard and Exposure (H and E)</h4>
                <span className="dim-acronym">First Dimension</span>
              </div>
            </div>
            <p className="dim-description">
              Measures the likelihood of hazardous events occurring and the population/assets exposed to them.
              Combines natural hazard probability with human and physical exposure factors.
            </p>
            <ul className="dim-factors">
              <li>Natural hazards (floods, droughts, earthquakes, cyclones)</li>
              <li>Human hazards (conflict, displacement)</li>
              <li>Population density in hazard zones</li>
              <li>Critical infrastructure exposure</li>
            </ul>
          </div>

          <div className="dimension-overview-card v">
            <div className="dim-header">
              <span className="dim-icon">🛡️</span>
              <div className="dim-title">
                <h4>Vulnerability (V)</h4>
                <span className="dim-acronym">Second Dimension</span>
              </div>
            </div>
            <p className="dim-description">
              Captures conditions that increase the likelihood of suffering harm from hazard events.
              Includes socio-economic and vulnerable groups factors.
            </p>
            <ul className="dim-factors">
              <li>Socio-economic vulnerability (poverty, inequality)</li>
              <li>Vulnerable groups (children, elderly, disabled)</li>
              <li>Food security and nutrition</li>
              <li>Health system fragility</li>
            </ul>
          </div>

          <div className="dimension-overview-card lcc">
            <div className="dim-header">
              <span className="dim-icon">🏛️</span>
              <div className="dim-title">
                <h4>Lack of Coping Capacity (LCC)</h4>
                <span className="dim-acronym">Third Dimension</span>
              </div>
            </div>
            <p className="dim-description">
              Measures the absence of resources and abilities to manage, mitigate, and recover from disaster impacts.
              Inverted scale - higher values indicate weaker capacity.
            </p>
            <ul className="dim-factors">
              <li>Institutional capacity (governance, DRR systems)</li>
              <li>Infrastructure (communications, transport, utilities)</li>
              <li>Access to health care and education</li>
              <li>Financial resources and social safety nets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* INFORM Notice */}
      <div className="inform-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <strong>INFORM Methodology:</strong> This dashboard implements the exact INFORM Risk Index
          methodology from the Tanzania Country Model Template. All scores use geometric mean aggregation
          to prevent compensation effects between dimensions. Data is normalized to a 0-10 scale.
        </div>
      </div>
    </div>
  );
};

/**
 * Risk Section - Main Risk Overview with Level Selection
 * Provides National, Regional, and District overview views
 */
const RiskSection = ({ data, selectedDistrict, onSelectDistrict }) => {
  const [analysisLevel, setAnalysisLevel] = useState('national');
  const [selectedHazardType, setSelectedHazardType] = useState('overall');

  // Get current hazard info
  const currentHazardInfo = HAZARD_TYPES.find(h => h.id === selectedHazardType) || HAZARD_TYPES[0];

  return (
    <div className="risk-section">
      {/* Overview Level Selector */}
      <div className="analysis-level-selector">
        <h2>Risk Overview</h2>
        <p className="section-intro">
          Explore INFORM Risk scores at different administrative levels for Tanzania.
        </p>

        <div className="level-dropdown-container">
          <label className="level-label">
            <span className="label-icon">📊</span>
            Select Overview Level:
          </label>
          <select
            value={analysisLevel}
            onChange={e => setAnalysisLevel(e.target.value)}
            className="level-dropdown"
          >
            <option value="national">🏛️ National Overview</option>
            <option value="regional">🗺️ Subnational Overview - Regional</option>
            <option value="district">📍 Subnational Overview - District</option>
          </select>
        </div>

        {/* Risk View Type - Overall vs Specific Hazard */}
        <div className="risk-view-selector" style={{ marginTop: '16px' }}>
          <div className="overall-risk-button-container">
            <button
              className={`overall-risk-btn ${selectedHazardType === 'overall' ? 'active' : ''}`}
              onClick={() => setSelectedHazardType('overall')}
            >
              <span className="btn-icon">{OVERALL_RISK.icon}</span>
              <span className="btn-text">{OVERALL_RISK.name}</span>
              <span className="btn-desc">{OVERALL_RISK.description}</span>
            </button>
          </div>

          <div className="hazard-separator">
            <span>OR</span>
          </div>

          {/* Hazard Risk Selector */}
          <div className="level-dropdown-container hazard-selector">
            <label className="level-label">
              <span className="label-icon">🎯</span>
              Select Hazard Risk:
            </label>
            <select
              value={selectedHazardType === 'overall' ? '' : selectedHazardType}
              onChange={e => {
                if (e.target.value) setSelectedHazardType(e.target.value);
              }}
              className="level-dropdown hazard-dropdown"
            >
              <option value="">-- Select a specific hazard --</option>
              {HAZARD_TYPES.map(hazard => (
                <option key={hazard.id} value={hazard.id}>
                  {hazard.icon} {hazard.name} - {hazard.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Hazard Indicator */}
        {selectedHazardType !== 'overall' && (
          <div className="hazard-indicator-banner">
            <span className="hazard-icon">{currentHazardInfo.icon}</span>
            <span className="hazard-text">
              Viewing <strong>{currentHazardInfo.name}</strong> specific risk data
            </span>
          </div>
        )}
      </div>

      {/* National Overview View */}
      {analysisLevel === 'national' && (
        <NationalAnalysisView national={data.national} selectedHazard={selectedHazardType} />
      )}

      {/* Regional Overview View */}
      {analysisLevel === 'regional' && (
        <RegionalAnalysisView
          regions={data.subnational?.adm1 || []}
          districts={data.subnational?.adm2 || []}
          selectedHazard={selectedHazardType}
        />
      )}

      {/* District Overview View */}
      {analysisLevel === 'district' && (
        <DistrictAnalysisSection
          districts={data.subnational?.adm2 || []}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={onSelectDistrict}
          selectedHazard={selectedHazardType}
          onSelectHazard={setSelectedHazardType}
        />
      )}
    </div>
  );
};

/**
 * National Overview View
 * Shows overall national risk profile
 */
const NationalAnalysisView = ({ national, selectedHazard = 'overall' }) => {
  const classification = national.classification;
  const hazardInfo = HAZARD_TYPES.find(h => h.id === selectedHazard) || HAZARD_TYPES[0];

  // Get hazard-specific risk score (simulated - in production would come from data)
  const getHazardRisk = () => {
    if (selectedHazard === 'overall') return national.risk;
    // Simulated hazard-specific risks based on national risk
    const hazardMultipliers = {
      heavyRainfall: 1.15,
      riverineFlood: 1.10,
      flashFlood: 1.20,
      drought: 1.25,
      largeWaves: 0.75,
      strongWinds: 0.85,
      cyclone: 0.80,
      earthquake: 0.60,
      landslide: 0.70,
      wildfire: 0.55,
      epidemic: 1.10
    };
    return Math.min(10, national.risk * (hazardMultipliers[selectedHazard] || 1));
  };

  const displayRisk = getHazardRisk();
  const displayClassification = getRiskClassification(displayRisk);

  return (
    <div className="national-analysis-view">
      <div className="analysis-header-banner">
        <h3>🏛️ National Overview - Tanzania</h3>
        <p>
          {selectedHazard === 'overall'
            ? 'Overall country-level INFORM Risk assessment'
            : `${hazardInfo.icon} ${hazardInfo.name} specific risk assessment`}
        </p>
      </div>

      {/* Main Risk Score */}
      <div className="national-risk-display">
        <div className="risk-score-large" style={{ borderColor: displayClassification.color }}>
          <span className="score-number" style={{ color: displayClassification.color }}>
            {displayRisk.toFixed(1)}
          </span>
          <span className="score-label">
            {selectedHazard === 'overall' ? 'INFORM Risk Index' : `${hazardInfo.name} Risk Index`}
          </span>
          <span className="score-class" style={{ backgroundColor: displayClassification.color }}>
            {displayClassification.level}
          </span>
        </div>
      </div>

      {/* Three Dimensions Summary */}
      <div className="dimensions-summary">
        <h4>Risk Dimensions</h4>
        <div className="dimensions-grid">
          <div className="dimension-card he">
            <div className="dim-icon">⚠️</div>
            <div className="dim-info">
              <span className="dim-name">Hazard and Exposure</span>
              <span className="dim-score">{national.hazardExposure.toFixed(1)}</span>
            </div>
            <div className="dim-bar">
              <div className="bar-fill" style={{
                width: `${(national.hazardExposure / 10) * 100}%`,
                backgroundColor: '#D32F2F'
              }} />
            </div>
          </div>

          <div className="dimension-card v">
            <div className="dim-icon">🛡️</div>
            <div className="dim-info">
              <span className="dim-name">Vulnerability</span>
              <span className="dim-score">{national.vulnerability.toFixed(1)}</span>
            </div>
            <div className="dim-bar">
              <div className="bar-fill" style={{
                width: `${(national.vulnerability / 10) * 100}%`,
                backgroundColor: '#FF9800'
              }} />
            </div>
          </div>

          <div className="dimension-card lcc">
            <div className="dim-icon">🏛️</div>
            <div className="dim-info">
              <span className="dim-name">Lack of Coping Capacity</span>
              <span className="dim-score">{national.lackCopingCapacity.toFixed(1)}</span>
            </div>
            <div className="dim-bar">
              <div className="bar-fill" style={{
                width: `${(national.lackCopingCapacity / 10) * 100}%`,
                backgroundColor: '#1976D2'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="national-stats">
        <h4>Key Statistics</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <span className="stat-value">61.7M</span>
            <span className="stat-label">Population</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🗺️</span>
            <span className="stat-value">31</span>
            <span className="stat-label">Regions</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📍</span>
            <span className="stat-value">184</span>
            <span className="stat-label">Districts</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🌡️</span>
            <span className="stat-value">{national.hazardExposure.toFixed(1)}</span>
            <span className="stat-label">Hazard Score</span>
          </div>
        </div>
      </div>

      {/* Formula Summary */}
      <div className="formula-summary">
        <div className="formula-box">
          <span className="formula-label">
            {selectedHazard === 'overall' ? 'INFORM Formula:' : `${hazardInfo.name} Risk Formula:`}
          </span>
          <span className="formula-equation">
            Risk = ({national.hazardExposure.toFixed(1)} × {national.vulnerability.toFixed(1)} × {national.lackCopingCapacity.toFixed(1)})<sup>1/3</sup> = <strong style={{ color: displayClassification.color }}>{displayRisk.toFixed(2)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Regional Overview View
 * Shows risk by region (ADM1 level)
 */
const RegionalAnalysisView = ({ regions, districts, selectedHazard = 'overall' }) => {
  const [sortBy, setSortBy] = useState('risk');
  const [filterLevel, setFilterLevel] = useState('all');

  const hazardInfo = HAZARD_TYPES.find(h => h.id === selectedHazard) || HAZARD_TYPES[0];

  // Get hazard-specific risk for a region
  const getHazardRisk = (baseRisk) => {
    if (selectedHazard === 'overall') return baseRisk;
    const hazardMultipliers = {
      heavyRainfall: 1.15,
      riverineFlood: 1.10,
      flashFlood: 1.20,
      drought: 1.25,
      largeWaves: 0.75,
      strongWinds: 0.85,
      cyclone: 0.80,
      earthquake: 0.60,
      landslide: 0.70,
      wildfire: 0.55,
      epidemic: 1.10
    };
    return Math.min(10, baseRisk * (hazardMultipliers[selectedHazard] || 1));
  };

  // Aggregate districts by region to create regional data
  const regionalData = useMemo(() => {
    const regionMap = {};

    districts.forEach(district => {
      const regionName = district.admin?.adm1Name || 'Unknown';
      if (!regionMap[regionName]) {
        regionMap[regionName] = {
          name: regionName,
          districts: [],
          totalRisk: 0,
          hazardExposure: 0,
          vulnerability: 0,
          lackCopingCapacity: 0
        };
      }
      regionMap[regionName].districts.push(district);
      regionMap[regionName].totalRisk += district.risk || 0;
      regionMap[regionName].hazardExposure += district.hazardExposure || 0;
      regionMap[regionName].vulnerability += district.vulnerability || 0;
      regionMap[regionName].lackCopingCapacity += district.lackCopingCapacity || 0;
    });

    // Calculate averages
    return Object.values(regionMap).map(region => ({
      ...region,
      risk: region.totalRisk / region.districts.length,
      hazardExposure: region.hazardExposure / region.districts.length,
      vulnerability: region.vulnerability / region.districts.length,
      lackCopingCapacity: region.lackCopingCapacity / region.districts.length,
      districtCount: region.districts.length
    }));
  }, [districts]);

  const sortedRegions = useMemo(() => {
    let filtered = [...regionalData];

    // Filter by risk level (using hazard-specific risk)
    if (filterLevel !== 'all') {
      filtered = filtered.filter(r => {
        const classification = getRiskClassification(getHazardRisk(r.risk));
        return classification.level.toLowerCase().replace(' ', '-') === filterLevel;
      });
    }

    // Sort (using hazard-specific risk)
    return filtered.sort((a, b) => {
      if (sortBy === 'risk') return getHazardRisk(b.risk) - getHazardRisk(a.risk);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'districts') return b.districtCount - a.districtCount;
      return 0;
    });
  }, [regionalData, sortBy, filterLevel, selectedHazard]);

  return (
    <div className="regional-analysis-view">
      <div className="analysis-header-banner">
        <h3>🗺️ Subnational Overview - Regional Level</h3>
        <p>
          {selectedHazard === 'overall'
            ? 'Risk assessment aggregated by region (ADM1)'
            : `${hazardInfo.icon} ${hazardInfo.name} risk by region (ADM1)`}
        </p>
      </div>

      {/* Filters */}
      <div className="regional-filters">
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="risk">Risk Score (High to Low)</option>
            <option value="name">Name (A-Z)</option>
            <option value="districts">District Count</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by level:</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="very-high">Very High</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="very-low">Very Low</option>
          </select>
        </div>
        <div className="filter-stats">
          Showing {sortedRegions.length} regions
        </div>
      </div>

      {/* Regional Grid */}
      <div className="regional-grid">
        {sortedRegions.map((region, index) => {
          const hazardRisk = getHazardRisk(region.risk);
          const classification = getRiskClassification(hazardRisk);
          return (
            <div key={region.name} className="regional-card">
              <div className="regional-rank">#{index + 1}</div>
              <div className="regional-header">
                <h4 className="regional-name">{region.name}</h4>
                <span className="district-count">{region.districtCount} districts</span>
              </div>

              <div className="regional-risk">
                <span className="risk-value" style={{ color: classification.color }}>
                  {hazardRisk.toFixed(1)}
                </span>
                <span className="risk-level" style={{ backgroundColor: classification.color }}>
                  {classification.level}
                </span>
              </div>

              <div className="regional-dimensions">
                <div className="mini-dim">
                  <span className="mini-icon">⚠️</span>
                  <span className="mini-value">{region.hazardExposure.toFixed(1)}</span>
                </div>
                <div className="mini-dim">
                  <span className="mini-icon">🛡️</span>
                  <span className="mini-value">{region.vulnerability.toFixed(1)}</span>
                </div>
                <div className="mini-dim">
                  <span className="mini-icon">🏛️</span>
                  <span className="mini-value">{region.lackCopingCapacity.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="regional-summary">
        <h4>Regional Summary {selectedHazard !== 'overall' && `- ${hazardInfo.name}`}</h4>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label">Total Regions</span>
            <span className="stat-value">{regionalData.length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Highest Risk</span>
            <span className="stat-value" style={{ color: '#F44336' }}>
              {sortedRegions[0]?.name || 'N/A'} ({sortedRegions[0] ? getHazardRisk(sortedRegions[0].risk).toFixed(1) : 'N/A'})
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Average Risk</span>
            <span className="stat-value">
              {(regionalData.reduce((sum, r) => sum + getHazardRisk(r.risk), 0) / regionalData.length).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * District Overview Section - with Hazard-Specific Risk from parent
 */
const DistrictAnalysisSection = ({ districts, selectedDistrict, onSelectDistrict, selectedHazard = 'overall', onSelectHazard }) => {
  const [sortBy, setSortBy] = useState('risk');
  const [filterLevel, setFilterLevel] = useState('all');

  // Get hazard-specific risk for a district
  const getHazardRisk = (district, hazardId) => {
    if (hazardId === 'overall') {
      return district.risk || 0;
    }
    // Check both hazardRisks and hazardExposure.hazards for the hazard-specific score
    if (district.hazardRisks && district.hazardRisks[hazardId] !== undefined) {
      return district.hazardRisks[hazardId];
    }
    if (district.hazardExposure?.hazards && district.hazardExposure.hazards[hazardId] !== undefined) {
      return district.hazardExposure.hazards[hazardId];
    }
    return 0;
  };

  const sortedDistricts = useMemo(() => {
    let filtered = [...districts];

    // Filter by risk level (using selected hazard's risk)
    if (filterLevel !== 'all') {
      filtered = filtered.filter(d => {
        const riskScore = getHazardRisk(d, selectedHazard);
        const classification = getRiskClassification(riskScore);
        return classification.level.toLowerCase().replace(' ', '-') === filterLevel;
      });
    }

    // Sort (using selected hazard's risk)
    return filtered.sort((a, b) => {
      if (sortBy === 'risk') {
        return getHazardRisk(b, selectedHazard) - getHazardRisk(a, selectedHazard);
      }
      if (sortBy === 'name') {
        return (a.admin?.adm2Name || '').localeCompare(b.admin?.adm2Name || '');
      }
      return 0;
    });
  }, [districts, sortBy, filterLevel, selectedHazard]);

  // Get the currently selected hazard info
  const currentHazard = HAZARD_TYPES.find(h => h.id === selectedHazard) || HAZARD_TYPES[0];

  return (
    <div className="district-analysis-section">
      <div className="analysis-header-banner">
        <h3>📍 Subnational Overview - District Level</h3>
        <p>
          {selectedHazard === 'overall'
            ? `Risk assessment at district level (ADM2). Total districts: ${districts.length}`
            : `${currentHazard.icon} ${currentHazard.name} risk at district level. Total districts: ${districts.length}`}
        </p>
      </div>

      {/* Filters */}
      <div className="district-filters">
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="risk">Risk Score (High to Low)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by level:</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="very-high">Very High</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="very-low">Very Low</option>
          </select>
        </div>
        <div className="filter-stats">
          Showing {sortedDistricts.length} of {districts.length} districts
          {selectedHazard !== 'overall' && (
            <span className="hazard-filter-tag" style={{ backgroundColor: getHazardColor(selectedHazard) }}>
              {currentHazard.icon} {currentHazard.name}
            </span>
          )}
        </div>
      </div>

      <div className="district-grid">
        {sortedDistricts.slice(0, 50).map((district, index) => {
          const hazardRisk = getHazardRisk(district, selectedHazard);
          const classification = getRiskClassification(hazardRisk);
          const overallRisk = district.risk || 0;

          return (
            <div
              key={index}
              className={`district-card ${selectedDistrict === district ? 'selected' : ''}`}
              onClick={() => onSelectDistrict(district)}
            >
              <div className="district-rank">#{index + 1}</div>
              <div className="district-name">{district.admin?.adm2Name || 'Unknown'}</div>
              <div className="district-region">{district.admin?.adm1Name || ''}</div>

              {/* Main Risk Display */}
              <div className="district-risk">
                <span className="risk-value" style={{ color: classification.color }}>
                  {hazardRisk.toFixed(1)}
                </span>
                <span className="risk-level" style={{ backgroundColor: classification.color }}>
                  {classification.level}
                </span>
              </div>

              {/* Show hazard type indicator if specific hazard selected */}
              {selectedHazard !== 'overall' && (
                <div className="hazard-indicator">
                  <span className="hazard-badge" style={{ backgroundColor: getHazardColor(selectedHazard) }}>
                    {currentHazard.icon} {currentHazard.name}
                  </span>
                  <span className="overall-risk-note">
                    Overall: {overallRisk.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Mini hazard breakdown on hover/expand */}
              {district.hazardRisks && (
                <div className="hazard-mini-breakdown">
                  {Object.entries(district.hazardRisks).slice(0, 3).map(([key, value]) => {
                    const hazardInfo = HAZARD_TYPES.find(h => h.id === key);
                    return (
                      <span key={key} className="mini-hazard" title={hazardInfo?.name || key}>
                        {hazardInfo?.icon || '⚠️'} {value.toFixed(1)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedDistricts.length > 50 && (
        <div className="load-more">
          <p>{sortedDistricts.length - 50} more districts available</p>
        </div>
      )}

      {/* Hazard Legend */}
      <div className="hazard-legend">
        <h4>Hazard Types Available</h4>
        <div className="legend-items">
          {HAZARD_TYPES.map(hazard => (
            <button
              key={hazard.id}
              className={`legend-item ${selectedHazard === hazard.id ? 'active' : ''}`}
              onClick={() => onSelectHazard?.(hazard.id)}
              style={selectedHazard === hazard.id ? {
                backgroundColor: getHazardColor(hazard.id),
                color: 'white'
              } : {}}
            >
              <span className="legend-icon">{hazard.icon}</span>
              <span className="legend-name">{hazard.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Helper: Get hazard color by type
 */
function getHazardColor(hazardId) {
  const colors = {
    overall: '#2196F3',
    heavyRainfall: '#1565C0',
    riverineFlood: '#0288D1',
    flashFlood: '#00ACC1',
    drought: '#FF9800',
    largeWaves: '#0097A7',
    strongWinds: '#78909C',
    cyclone: '#9C27B0',
    earthquake: '#795548',
    landslide: '#5D4037',
    wildfire: '#F44336',
    epidemic: '#E91E63'
  };
  return colors[hazardId] || '#607D8B';
}

/**
 * Helper: Get risk classification
 */
function getRiskClassification(score) {
  if (score === null || score === undefined) return { level: 'Unknown', color: '#999', range: 'N/A' };
  if (score >= 0 && score < 2) return { level: 'Very Low', color: '#43A047', range: '0.0 - 1.9' };
  if (score >= 2 && score < 3.5) return { level: 'Low', color: '#8BC34A', range: '2.0 - 3.4' };
  if (score >= 3.5 && score < 5) return { level: 'Medium', color: '#FFC107', range: '3.5 - 4.9' };
  if (score >= 5 && score < 6.5) return { level: 'High', color: '#FF9800', range: '5.0 - 6.4' };
  return { level: 'Very High', color: '#F44336', range: '6.5 - 10.0' };
}

export default Module02InformRisk;
