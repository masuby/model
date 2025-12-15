/**
 * MODULE 02: INFORM RISK DASHBOARD
 *
 * Comprehensive risk assessment dashboard for Tanzania
 * Implements the complete INFORM methodology from the Country Model Template
 *
 * Formula: Risk = (H and E × V × LCC)^(1/3)
 */

import React, { useState, useEffect, useMemo } from 'react';
import './Module02InformRisk.css';

// Dimension components
import HazardExposureDimension from './dimensions/HazardExposureDimension';
import VulnerabilityDimension from './dimensions/VulnerabilityDimension';
import CopingCapacityDimension from './dimensions/CopingCapacityDimension';

// Data service - parses Excel template
import { parseInformRiskData } from '../../services/informRiskDataService';

// Mock data service (fallback)
import { getMockTanzaniaData } from './mockData';

// Report Export
import ReportExportButton from '../warning/components/ReportExportButton';

const Module02InformRisk = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [selectedView, setSelectedView] = useState('overview'); // overview, hazard, vulnerability, coping, districts
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load INFORM Risk data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // URL to Tanzania Excel template in public folder
        const excelUrl = '/data/tanzania-inform-risk.xlsx';

        console.log('🚀 Loading INFORM Risk data from Excel...');

        // Parse real Excel data
        const riskData = await parseInformRiskData(excelUrl);

        setData(riskData);
        setLoading(false);

        console.log('✅ INFORM Risk data loaded successfully!');
        console.log('📊 Total districts:', riskData.subnational.adm2.length);
        console.log('🎯 Tanzania Risk Score:', riskData.national.risk.toFixed(2));
        console.log('📈 H and E:', riskData.national.hazardExposure?.toFixed(2));
        console.log('🛡️ V:', riskData.national.vulnerability?.toFixed(2));
        console.log('🏛️ LCC:', riskData.national.lackCopingCapacity?.toFixed(2));
      } catch (error) {
        console.error('❌ Error loading Excel data:', error);
        console.warn('⚠️ Falling back to mock data');

        // Fallback to mock data if Excel parsing fails
        const mockData = getMockTanzaniaData();
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
            <h1>INFORM Risk - Tanzania</h1>
            <p className="header-subtitle">Index for Risk Management</p>
          </div>
          <div className="header-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
            <div className="risk-badge" style={{ borderColor: classification.color }}>
              <div className="risk-score" style={{ color: classification.color }}>
                {national.risk.toFixed(1)}
              </div>
              <div className="risk-label">{classification.level} Risk</div>
              <div className="risk-range">{classification.range}</div>
            </div>

            {/* Risk Assessment Report Export */}
            <ReportExportButton
              reportType="risk"
              reportData={data}
              buttonStyle="secondary"
              buttonText="Export Risk Report"
              onExportComplete={(format) => {
                console.log(`📊 Risk assessment exported as ${format}`);
              }}
            />
          </div>
        </div>
      </header>

      {/* INFORM Formula Display */}
      <div className="inform-formula-section">
        <div className="formula-container">
          <h2 className="formula-title">INFORM Risk Formula</h2>
          <div className="formula-equation">
            Risk = (H and E × V × LCC)<sup>1/3</sup>
          </div>
          <div className="formula-breakdown">
            <div className="formula-component">
              <span className="component-label">H and E</span>
              <span className="component-value">{national.hazardExposure.toFixed(2)}</span>
              <span className="component-name">Hazard and Exposure</span>
            </div>
            <span className="formula-operator">×</span>
            <div className="formula-component">
              <span className="component-label">V</span>
              <span className="component-value">{national.vulnerability.toFixed(2)}</span>
              <span className="component-name">Vulnerability</span>
            </div>
            <span className="formula-operator">×</span>
            <div className="formula-component">
              <span className="component-label">LCC</span>
              <span className="component-value">{national.lackCopingCapacity.toFixed(2)}</span>
              <span className="component-name">Lack of Coping</span>
            </div>
            <span className="formula-operator">=</span>
            <div className="formula-result">
              <span className="result-value" style={{ color: classification.color }}>
                {national.risk.toFixed(2)}
              </span>
              <span className="result-label">Risk Index</span>
            </div>
          </div>

          {/* Formula Verification */}
          {formulaVerification && (
            <div className={`formula-verification ${formulaVerification.isValid ? 'valid' : 'invalid'}`}>
              <span className="verify-icon">{formulaVerification.isValid ? '✓' : '⚠'}</span>
              <span>
                Formula Verified: Calculated = {formulaVerification.calculated},
                Template = {formulaVerification.actual}
                {formulaVerification.isValid
                  ? ' (Match)'
                  : ` (Diff: ${formulaVerification.difference})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="module02-nav">
        <button
          className={`nav-tab ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          Overview
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
          Lack of Coping Capacity
        </button>
        <button
          className={`nav-tab ${selectedView === 'districts' ? 'active' : ''}`}
          onClick={() => setSelectedView('districts')}
        >
          District Analysis
        </button>
      </div>

      {/* Main Content */}
      <main className="module02-main">
        {selectedView === 'overview' && (
          <OverviewSection national={national} />
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

        {selectedView === 'districts' && (
          <DistrictAnalysisSection
            districts={data.subnational.adm2}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
          />
        )}
      </main>

      {/* Important Notice */}
      <div className="inform-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <strong>INFORM Methodology:</strong> This dashboard implements the exact INFORM Risk Index methodology
          from the Tanzania Country Model Template. All scores use geometric mean aggregation to prevent
          compensation effects between dimensions. Data is normalized to a 0-10 scale.
        </div>
      </div>

      {/* Data Integration Panel */}
      {onNavigate && (
        <div className="data-integration-panel">
          <div className="integration-header">
            <h3>📊 Explore Detailed Data</h3>
            <p>Dive deeper into the raw INFORM data tables for comprehensive analysis</p>
          </div>
          <div className="integration-links">
            <button
              className="data-link-btn risk"
              onClick={() => onNavigate('risk')}
            >
              <span className="btn-icon">📈</span>
              <div className="btn-content">
                <div className="btn-title">INFORM Risk Data</div>
                <div className="btn-description">Browse all risk indicators and scores</div>
              </div>
            </button>
            <button
              className="data-link-btn warning"
              onClick={() => onNavigate('warning')}
            >
              <span className="btn-icon">⚠️</span>
              <div className="btn-content">
                <div className="btn-title">INFORM Warning Data</div>
                <div className="btn-description">Early warning system indicators</div>
              </div>
            </button>
            <button
              className="data-link-btn severity"
              onClick={() => onNavigate('severity')}
            >
              <span className="btn-icon">🚨</span>
              <div className="btn-content">
                <div className="btn-title">INFORM Severity Data</div>
                <div className="btn-description">Incident severity assessments</div>
              </div>
            </button>
            <button
              className="data-link-btn climate"
              onClick={() => onNavigate('climate')}
            >
              <span className="btn-icon">🌡️</span>
              <div className="btn-content">
                <div className="btn-title">Climate Change Data</div>
                <div className="btn-description">Future risk projections</div>
              </div>
            </button>
          </div>
          <div className="integration-footer">
            <button
              className="learn-btn"
              onClick={() => onNavigate('module01')}
            >
              ← Back to Module 01 (INFORM Education)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Overview Section - Three Dimensions Summary
 */
const OverviewSection = ({ national }) => {
  const dimensions = [
    {
      id: 'hazard',
      name: 'Hazard and Exposure',
      acronym: 'H and E',
      score: national.hazardExposure,
      color: '#D32F2F',
      description: 'Likelihood of hazardous events and population exposed',
      icon: '⚠️'
    },
    {
      id: 'vulnerability',
      name: 'Vulnerability',
      acronym: 'V',
      score: national.vulnerability,
      color: '#FF9800',
      description: 'Conditions increasing likelihood of suffering harm',
      icon: '🛡️'
    },
    {
      id: 'coping',
      name: 'Lack of Coping Capacity',
      acronym: 'LCC',
      score: national.lackCopingCapacity,
      color: '#1976D2',
      description: 'Absence of resources to manage and recover from shocks',
      icon: '🏛️'
    }
  ];

  return (
    <div className="overview-section">
      <h2>Risk Dimensions Overview</h2>
      <p className="overview-intro">
        INFORM Risk Index combines three equally-weighted dimensions using geometric mean aggregation.
        Each dimension contributes to the overall risk score, and weakness in any dimension significantly
        impacts total risk.
      </p>

      <div className="dimensions-grid">
        {dimensions.map(dim => {
          const classification = getRiskClassification(dim.score);

          return (
            <div key={dim.id} className="dimension-card" style={{ borderTopColor: dim.color }}>
              <div className="dimension-header">
                <span className="dimension-icon">{dim.icon}</span>
                <div className="dimension-title">
                  <h3>{dim.name}</h3>
                  <span className="dimension-acronym">{dim.acronym}</span>
                </div>
              </div>

              <div className="dimension-score-display">
                <div className="score-value" style={{ color: classification.color }}>
                  {dim.score.toFixed(2)}
                </div>
                <div className="score-classification">{classification.level}</div>
              </div>

              <div className="dimension-bar">
                <div
                  className="dimension-bar-fill"
                  style={{
                    width: `${(dim.score / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${dim.color}, ${classification.color})`
                  }}
                />
              </div>

              <p className="dimension-description">{dim.description}</p>

              <div className="dimension-stats">
                <div className="stat">
                  <span className="stat-label">Scale</span>
                  <span className="stat-value">0 - 10</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Range</span>
                  <span className="stat-value">{classification.range}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Interpretation Guide */}
      <div className="risk-interpretation">
        <h3>Risk Classification Scale</h3>
        <div className="classification-scale">
          <div className="scale-item very-low">
            <div className="scale-color"></div>
            <div className="scale-label">Very Low</div>
            <div className="scale-range">0.0 - 1.9</div>
          </div>
          <div className="scale-item low">
            <div className="scale-color"></div>
            <div className="scale-label">Low</div>
            <div className="scale-range">2.0 - 3.4</div>
          </div>
          <div className="scale-item medium">
            <div className="scale-color"></div>
            <div className="scale-label">Medium</div>
            <div className="scale-range">3.5 - 4.9</div>
          </div>
          <div className="scale-item high">
            <div className="scale-color"></div>
            <div className="scale-label">High</div>
            <div className="scale-range">5.0 - 6.4</div>
          </div>
          <div className="scale-item very-high">
            <div className="scale-color"></div>
            <div className="scale-label">Very High</div>
            <div className="scale-range">6.5 - 10.0</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * District Analysis Section
 */
const DistrictAnalysisSection = ({ districts, selectedDistrict, onSelectDistrict }) => {
  return (
    <div className="district-analysis-section">
      <h2>Subnational Analysis - Districts (ADM2)</h2>
      <p className="section-intro">
        Explore INFORM Risk scores at the district level. Total districts: {districts.length}
      </p>

      <div className="district-grid">
        {districts.slice(0, 20).map((district, index) => {
          const classification = getRiskClassification(district.risk);

          return (
            <div
              key={index}
              className={`district-card ${selectedDistrict === district ? 'selected' : ''}`}
              onClick={() => onSelectDistrict(district)}
            >
              <div className="district-name">{district.admin.adm2Name}</div>
              <div className="district-region">{district.admin.adm1Name}</div>
              <div className="district-risk">
                <span className="risk-value" style={{ color: classification.color }}>
                  {district.risk?.toFixed(1) || 'N/A'}
                </span>
                <span className="risk-level">{classification.level}</span>
              </div>
            </div>
          );
        })}
      </div>

      {districts.length > 20 && (
        <div className="load-more">
          <button>Load More Districts ({districts.length - 20} remaining)</button>
        </div>
      )}
    </div>
  );
};

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
