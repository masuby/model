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

import React, { useState, useMemo } from 'react';
import './Module02InformRisk.css';

// Dimension components
import HazardExposureDimension from './dimensions/HazardExposureDimension';
import VulnerabilityDimension from './dimensions/VulnerabilityDimension';
import CopingCapacityDimension from './dimensions/CopingCapacityDimension';

// Single curated dataset — generated from the authentic Tanzania INFORM Excel
// (scripts/generate-risk-json.mjs). The faithful values the engine's excelParity
// test validates. No runtime Excel parse, no mock/random fallback.
import riskDataset from '../../data/tanzania-inform-risk.json';
import { classifyRisk } from './regionRisk';
import RiskExplorer from './RiskExplorer';


// Risk Assessment Phases based on ISO 31000 and UNDRR Technical Guidance
const RISK_ASSESSMENT_PHASES = [
  {
    id: 'scoping',
    name: 'Scoping',
    icon: '',
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
    icon: '',
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
    icon: '',
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
    icon: '',
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
  { icon: '', title: 'Human and Ecological Systems', description: 'Put risk to human and ecological systems at the centre' },
  { icon: '', title: 'Climate Change Context', description: 'Fully account for the context of climate change' },
  { icon: '', title: 'Systemic Nature', description: 'Recognize the complex and systemic nature of risks' },
  { icon: '', title: 'Inclusive Governance', description: 'Apply inclusive risk governance approaches' },
  { icon: '', title: 'Multidisciplinary Approach', description: 'Use multidisciplinary approaches to identify measures' },
  { icon: '', title: 'Risk Tolerance', description: 'Use the concept of risk tolerance for decision-making' },
  { icon: '', title: 'Nature-based Solutions', description: 'Address risks through Nature-based Solutions' },
  { icon: '', title: 'Cross-sector Integration', description: 'Integrate risk across sectors and levels' },
  { icon: '', title: 'Risk Communication', description: 'Strengthen risk communication and knowledge' },
  { icon: '', title: 'Iterative Process', description: 'Use iterative and flexible processes' }
];

const Module02InformRisk = ({ onNavigate }) => {
  const [data] = useState(riskDataset);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('scoping');

  // Risk data is the curated dataset imported above — no async load, no fallback.

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
  const classification = classifyRisk(national.risk);

  return (
    <div className="module02-container">
      {/* Header */}
      <header className="rk-header ui-card ui-card-pad">
        <div className="rk-header-left">
          <div className="ui-eyebrow">INFORM Risk Index · Tanzania</div>
          <h1 className="ui-h1">National Risk Assessment</h1>
          <p className="rk-header-source ui-muted">
            Official INFORM Tanzania country value (INFORM methodology). Sub-national analysis is built from the INFORM
            country-model workbook and presented on the real NBS-2022 structure — 31 regions · 195 councils.
          </p>
        </div>
        <div className="rk-header-badge" style={{ borderColor: classification.color }}>
          <div className="ui-stat-num" style={{ color: classification.color }}>{national.risk.toFixed(1)}</div>
          <span className="ui-badge" style={{ background: classification.color }}>{classification.level} Risk</span>
          <div className="rk-header-range ui-muted">{classification.range}</div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="module02-nav">
        <button
          className={`nav-tab ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${selectedView === 'map' ? 'active' : ''}`}
          onClick={() => setSelectedView('map')}
        >
          Explore Map
        </button>
        <button
          className={`nav-tab ${selectedView === 'hazard' ? 'active' : ''}`}
          onClick={() => setSelectedView('hazard')}
        >
          Hazard and Exposure
        </button>
        <button
          className={`nav-tab ${selectedView === 'vulnerability' ? 'active' : ''}`}
          onClick={() => setSelectedView('vulnerability')}
        >
          Vulnerability
        </button>
        <button
          className={`nav-tab ${selectedView === 'coping' ? 'active' : ''}`}
          onClick={() => setSelectedView('coping')}
        >
          Coping Capacity
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

        {selectedView === 'map' && <RiskExplorer />}

        {selectedView === 'hazard' && (
          <HazardExposureDimension data={national.dimensions.hazardExposure} />
        )}

        {selectedView === 'vulnerability' && (
          <VulnerabilityDimension data={national.dimensions.vulnerability} />
        )}

        {selectedView === 'coping' && (
          <CopingCapacityDimension data={national.dimensions.lackCopingCapacity} />
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
          <span className="insight-icon"></span>
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
            <div className="component-icon"></div>
            <h4>Hazard</h4>
            <p>
              The probability of experiencing a certain intensity of hazard at a specific location.
              Can include secondary perils (e.g., liquefaction from earthquakes, storm surge from cyclones).
            </p>
          </div>
          <div className="component-card exposure">
            <div className="component-icon"></div>
            <h4>Exposure</h4>
            <p>
              The stock of property, infrastructure, and populations exposed to a hazard.
              Includes socioeconomic factors and critical assets.
            </p>
          </div>
          <div className="component-card vulnerability">
            <div className="component-icon"></div>
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
              <span className="dim-icon"></span>
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
              <span className="dim-icon"></span>
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
              <span className="dim-icon"></span>
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


export default Module02InformRisk;
