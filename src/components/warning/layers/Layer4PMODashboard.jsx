/**
 * LAYER 4: PMO-DMD CONSOLIDATION & VALIDATION DASHBOARD
 * Progressive Build - Adding workflow data, impact assessment, and actor selection
 */

import React, { useState } from 'react';
import '../Module03WarningSystem.css';
import {
  REGISTERED_ACTORS,
  PUBLIC_ACTIONS,
  IMPACT_LEVELS,
  ASSESSMENT_FACTORS,
  TECHNICAL_ENTITIES
} from '../data/workflowData';
import ReportExportButton from '../components/ReportExportButton';
import InteractiveHazardMap from '../components/InteractiveHazardMap';
import { logWarningApproved, logWarningPublished, logBulletinGenerated } from '../../../services/auditService';

const Layer4PMODashboard = ({ activeWarnings, activeHazards, riskData, onApproveWarning, onRollbackHazard }) => {
  console.log('🏛️ PMO-DMD Dashboard rendering...');
  console.log('  - activeHazards:', activeHazards?.length || 0);
  console.log('  - activeWarnings:', activeWarnings?.length || 0);
  console.log('  - riskData:', riskData ? 'Loaded' : 'Not loaded');

  const [selectedHazard, setSelectedHazard] = useState(null);
  const [impactLevel, setImpactLevel] = useState('MODERATE');
  const [finalStatement, setFinalStatement] = useState('WARNING');
  const [selectedActors, setSelectedActors] = useState([]);
  const [exposureNotes, setExposureNotes] = useState('');
  const [vulnerabilityNotes, setVulnerabilityNotes] = useState('');
  const [capacityNotes, setCapacityNotes] = useState('');
  const [pmoOverrideLevel, setPmoOverrideLevel] = useState(''); // Empty = use calculated, otherwise PMO override

  // Rollback/Request More Info state
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [additionalInfoNeeded, setAdditionalInfoNeeded] = useState([]);
  const [rollbackNotes, setRollbackNotes] = useState('');

  // Proactive Information Request state (when no hazard input exists)
  const [showProactiveRequestModal, setShowProactiveRequestModal] = useState(false);
  const [proactiveRequestSource, setProactiveRequestSource] = useState(''); // monitoring, regional_alert, global_alert, other
  const [proactiveSelectedInstitutions, setProactiveSelectedInstitutions] = useState([]);
  const [proactiveSelectedHazards, setProactiveSelectedHazards] = useState([]);
  const [proactiveInfoCategories, setProactiveInfoCategories] = useState([]);
  const [proactiveNotes, setProactiveNotes] = useState('');
  const [proactiveAttachments, setProactiveAttachments] = useState([]);
  const [proactiveUrgency, setProactiveUrgency] = useState('normal'); // normal, urgent, critical

  // Predefined information categories that PMO can request
  const INFO_CATEGORIES = [
    { id: 'spatial', label: 'Spatial Extent / Affected Areas', description: 'More specific district/region data' },
    { id: 'temporal', label: 'Temporal Validity', description: 'Start/end dates, duration clarification' },
    { id: 'severity', label: 'Severity Assessment', description: 'Justification for warning level' },
    { id: 'confidence', label: 'Confidence Level', description: 'Data sources, forecast reliability' },
    { id: 'impact', label: 'Potential Impact Details', description: 'Expected damage, population at risk' },
    { id: 'mitigation', label: 'Recommended Actions', description: 'Suggested preparedness measures' },
    { id: 'supporting', label: 'Supporting Data/Evidence', description: 'Maps, charts, historical data' },
    { id: 'other', label: 'Other Information', description: 'Specify in notes' }
  ];

  // Request sources for proactive information requests
  const REQUEST_SOURCES = [
    { id: 'monitoring', label: 'Routine Monitoring', description: 'Regular hazard surveillance and monitoring', icon: '📊' },
    { id: 'regional_alert', label: 'Regional Center Alert', description: 'Alert received from regional monitoring center (e.g., SADC DMC)', icon: '🌍' },
    { id: 'global_alert', label: 'Global Center Alert', description: 'Alert received from global center (e.g., WMO, UNDRR, GloFAS)', icon: '🌐' },
    { id: 'cross_border', label: 'Cross-Border Hazard', description: 'Hazard reported in neighboring country that may affect Tanzania', icon: '🗺️' },
    { id: 'media_report', label: 'Media/Social Media Report', description: 'Unverified hazard information from media sources', icon: '📰' },
    { id: 'community_report', label: 'Community Report', description: 'Information received from local communities or LGAs', icon: '👥' },
    { id: 'other', label: 'Other', description: 'Other source - specify in notes', icon: '📝' }
  ];

  // Calculate basic statistics
  const stats = {
    pendingReview: Array.isArray(activeHazards) ? activeHazards.length : 0,
    activeWarnings: Array.isArray(activeWarnings) ? activeWarnings.filter(w => w.status === 'active').length : 0,
    institutionsReporting: Array.isArray(activeHazards) ? new Set(activeHazards.map(h => h.institution)).size : 0,
    totalPopulationAtRisk: 0
  };

  // Helper: Get risk color based on score
  const getRiskColor = (score) => {
    if (!score) return '#9E9E9E';
    if (score >= 6.5) return '#F44336';
    if (score >= 5.0) return '#FF9800';
    if (score >= 3.5) return '#FFC107';
    if (score >= 2.0) return '#8BC34A';
    return '#4CAF50';
  };

  // Helper: Get hazard intensity score (1-10)
  const getHazardScore = (hazard) => {
    const levelScores = {
      'Major Warning': 9,
      'Warning': 7,
      'Advisory': 5,
      'Monitor': 3
    };
    return levelScores[hazard?.warningLevel] || 5;
  };

  // Helper: Calculate warning score using INFORM formula
  const calculateWarningScore = (hazard, riskData) => {
    const H = getHazardScore(hazard);
    const E = riskData?.national?.hazardExposure || 5.0;
    const V = riskData?.national?.vulnerability || 4.5;
    const LCC = riskData?.national?.lackCopingCapacity || 4.7;

    // INFORM formula: Risk = (H × E × V × LCC)^(1/4)
    return Math.pow(H * E * V * LCC, 0.25);
  };

  // Helper: Get warning level from calculated score
  const getWarningLevelFromScore = (score) => {
    if (score >= 7.5) return 'MAJOR WARNING';
    if (score >= 5.0) return 'WARNING';
    if (score >= 2.5) return 'ADVISORY';
    return 'MONITOR';
  };

  // Helper: Get final warning level (PMO override > calculated > institution)
  const getFinalWarningLevel = (hazard, riskData) => {
    // Priority 1: PMO-DMD override (if selected)
    if (pmoOverrideLevel) {
      return pmoOverrideLevel;
    }
    // Priority 2: Calculated from INFORM formula
    const calculatedScore = calculateWarningScore(hazard, riskData);
    return getWarningLevelFromScore(calculatedScore);
  };

  // Helper: Get warning color from level
  const getWarningColorFromLevel = (level) => {
    const levelMap = {
      'MAJOR WARNING': '#F44336',
      'Major Warning': '#F44336',
      'WARNING': '#FF9800',
      'Warning': '#FF9800',
      'ADVISORY': '#FFC107',
      'Advisory': '#FFC107',
      'MONITOR': '#4CAF50',
      'Monitor': '#4CAF50'
    };
    return levelMap[level] || '#FFC107';
  };

  // Get the final districts object with updated warning levels based on PMO decision
  const getFinalDistrictsForMap = () => {
    if (!selectedHazard) return {};

    const finalLevel = getFinalWarningLevel(selectedHazard, riskData);
    const districts = {};

    // Update all districts to use the final PMO/calculated level
    if (selectedHazard.spatialExtent) {
      selectedHazard.spatialExtent.forEach(district => {
        districts[district] = finalLevel;
      });
    }

    return districts;
  };

  // Toggle actor selection
  const toggleActor = (actorId) => {
    setSelectedActors(prev =>
      prev.includes(actorId)
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    );
  };

  // Handle warning issuance
  const handleIssueWarning = () => {
    if (!selectedHazard) {
      alert('⚠️ Please select a hazard to assess');
      return;
    }

    const assessment = {
      hazardId: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      institution: selectedHazard.institution,
      impactLevel: IMPACT_LEVELS[impactLevel],
      finalStatement,
      actorDirectives: REGISTERED_ACTORS
        .filter(actor => selectedActors.includes(actor.id))
        .map(actor => ({
          actor: actor.name,
          role: actor.role,
          actions: actor.actions
        })),
      publicActions: PUBLIC_ACTIONS[finalStatement] || [],
      assessmentFactors: {
        exposure: exposureNotes,
        vulnerability: vulnerabilityNotes,
        capacity: capacityNotes
      },
      issuedAt: new Date().toISOString(),
      issuedBy: 'PMO-DMD'
    };

    console.log('📢 Warning Issued:', assessment);

    // Log to audit trail
    logWarningApproved({
      id: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      warningLevel: finalStatement,
      spatialExtent: selectedHazard.spatialExtent || []
    }, `Impact Level: ${IMPACT_LEVELS[impactLevel].value}, Actors Notified: ${selectedActors.length}`);

    logWarningPublished({
      id: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      warningLevel: finalStatement,
      spatialExtent: selectedHazard.spatialExtent || []
    }, ['Dashboard', 'SMS', 'Bulletin']);

    alert(`✅ Warning Successfully Issued!\n\nHazard: ${selectedHazard.hazardType}\nStatement: ${finalStatement}\nImpact Level: ${IMPACT_LEVELS[impactLevel].value}\nActors Notified: ${selectedActors.length}`);

    if (onApproveWarning) {
      onApproveWarning(assessment);
    }
  };

  // Handle rollback/request more information
  const handleRollbackHazard = () => {
    if (!selectedHazard) {
      alert('Please select a hazard first');
      return;
    }

    if (additionalInfoNeeded.length === 0 && !rollbackNotes.trim()) {
      alert('Please select at least one information category or provide notes explaining what information is needed.');
      return;
    }

    const rollbackData = {
      hazardId: selectedHazard.id,
      hazardType: selectedHazard.hazardType,
      institution: selectedHazard.institution || selectedHazard.institutionName,
      reason: rollbackReason,
      additionalInfoNeeded: additionalInfoNeeded.map(id => {
        const category = INFO_CATEGORIES.find(c => c.id === id);
        return category ? category.label : id;
      }),
      notes: rollbackNotes,
      requestedBy: 'PMO-DMD',
      requestedAt: new Date().toISOString(),
      status: 'PENDING_REVISION'
    };

    console.log('🔄 Hazard Rollback Requested:', rollbackData);

    // Show confirmation
    const infoList = rollbackData.additionalInfoNeeded.join(', ') || 'See notes';
    alert(
      `📋 Information Request Sent!\n\n` +
      `Institution: ${rollbackData.institution}\n` +
      `Hazard: ${rollbackData.hazardType}\n` +
      `Reason: ${rollbackData.reason || 'Additional information needed'}\n` +
      `Information Requested: ${infoList}\n\n` +
      `The institution will be notified to provide additional information before the hazard can be processed.`
    );

    // Call parent callback if provided
    if (onRollbackHazard) {
      onRollbackHazard(rollbackData);
    }

    // Reset form and close modal
    setShowRollbackModal(false);
    setRollbackReason('');
    setAdditionalInfoNeeded([]);
    setRollbackNotes('');
    setSelectedHazard(null);
  };

  // Toggle info category selection
  const toggleInfoCategory = (categoryId) => {
    setAdditionalInfoNeeded(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle proactive info category selection
  const toggleProactiveInfoCategory = (categoryId) => {
    setProactiveInfoCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle institution selection for proactive request
  const toggleProactiveInstitution = (institutionKey) => {
    setProactiveSelectedInstitutions(prev =>
      prev.includes(institutionKey)
        ? prev.filter(key => key !== institutionKey)
        : [...prev, institutionKey]
    );
  };

  // Toggle hazard selection for proactive request
  const toggleProactiveHazard = (hazard) => {
    setProactiveSelectedHazards(prev =>
      prev.includes(hazard)
        ? prev.filter(h => h !== hazard)
        : [...prev, hazard]
    );
  };

  // Handle file attachment
  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Allow documents, images, and PDFs (max 10MB each)
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif',
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    setProactiveAttachments(prev => [...prev, ...validFiles]);
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setProactiveAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle proactive information request submission
  const handleProactiveRequest = () => {
    if (proactiveSelectedInstitutions.length === 0) {
      alert('Please select at least one institution to send the request to.');
      return;
    }

    if (!proactiveRequestSource) {
      alert('Please select the source/reason for this information request.');
      return;
    }

    if (proactiveInfoCategories.length === 0 && !proactiveNotes.trim()) {
      alert('Please select at least one information category or provide notes explaining what information is needed.');
      return;
    }

    const requestData = {
      requestId: `REQ-${Date.now()}`,
      requestType: 'PROACTIVE_INFORMATION_REQUEST',
      source: proactiveRequestSource,
      sourceLabel: REQUEST_SOURCES.find(s => s.id === proactiveRequestSource)?.label || proactiveRequestSource,
      targetInstitutions: proactiveSelectedInstitutions.map(key => ({
        key,
        name: TECHNICAL_ENTITIES[key]?.name || key,
        abbreviation: TECHNICAL_ENTITIES[key]?.abbreviation || key
      })),
      hazardTypes: proactiveSelectedHazards,
      informationNeeded: proactiveInfoCategories.map(id => {
        const category = INFO_CATEGORIES.find(c => c.id === id);
        return category ? category.label : id;
      }),
      notes: proactiveNotes,
      attachments: proactiveAttachments.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })),
      urgency: proactiveUrgency,
      requestedBy: 'PMO-DMD',
      requestedAt: new Date().toISOString(),
      status: 'PENDING_RESPONSE'
    };

    console.log('📋 Proactive Information Request:', requestData);

    // Build confirmation message
    const institutionNames = requestData.targetInstitutions.map(i => i.abbreviation).join(', ');
    const hazardList = proactiveSelectedHazards.length > 0 ? proactiveSelectedHazards.join(', ') : 'Not specified';
    const infoList = requestData.informationNeeded.join(', ') || 'See notes';
    const attachmentCount = proactiveAttachments.length;

    alert(
      `📤 Information Request Sent!\n\n` +
      `Request ID: ${requestData.requestId}\n` +
      `Source: ${requestData.sourceLabel}\n` +
      `To Institution(s): ${institutionNames}\n` +
      `Hazard Type(s): ${hazardList}\n` +
      `Information Requested: ${infoList}\n` +
      `Urgency: ${proactiveUrgency.toUpperCase()}\n` +
      `Attachments: ${attachmentCount} file(s)\n\n` +
      `The selected institution(s) will be notified to provide the requested information.`
    );

    // Reset form and close modal
    setShowProactiveRequestModal(false);
    setProactiveRequestSource('');
    setProactiveSelectedInstitutions([]);
    setProactiveSelectedHazards([]);
    setProactiveInfoCategories([]);
    setProactiveNotes('');
    setProactiveAttachments([]);
    setProactiveUrgency('normal');
  };

  console.log('📊 Stats calculated:', stats);

  return (
    <div className="layer4-container" style={{ padding: '20px' }}>
      {/* Confirmation Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        border: '3px solid #2E7D32'
      }}>
        ✅ PMO-DMD Dashboard - National Consolidation & Validation Interface
      </div>

      <div className="layer-header" style={{ marginBottom: '20px' }}>
        <h2>🏛️ PMO-DMD: Consolidation & Validation Dashboard</h2>
        <p className="layer-description">
          National risk integration, impact assessment, and final warning issuance
        </p>
      </div>

      {/* Dashboard Statistics */}
      <div className="pmo-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976D2' }}>{stats.pendingReview}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Hazards Pending Review</div>
        </div>

        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>{stats.activeWarnings}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Active Warnings</div>
        </div>

        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏛️</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.institutionsReporting}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Institutions Reporting</div>
        </div>

        <div className="pmo-stat-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E0E0E0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F44336' }}>{stats.totalPopulationAtRisk.toLocaleString()}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Population At Risk</div>
        </div>
      </div>

      {/* Proactive Information Request Section */}
      <div style={{
        background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '2px solid #4CAF50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '28px' }}>📤</span>
            <h3 style={{ margin: 0, color: '#2E7D32', fontSize: '18px' }}>
              Request Hazard Information from Institutions
            </h3>
          </div>
          <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.5' }}>
            No hazard input yet? PMO-DMD can proactively request information from technical institutions
            based on monitoring needs, regional/global alerts, or external hazard reports.
          </p>
        </div>
        <button
          onClick={() => setShowProactiveRequestModal(true)}
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>📋</span>
          REQUEST INFORMATION
        </button>
      </div>

      {/* Step 2.1: Multi-Agency Review */}
      <div className="pmo-section" style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #E0E0E0'
      }}>
        <h3 style={{ marginBottom: '12px', color: '#1976D2' }}>📥 Step 2.1: Multi-Agency Hazard Review</h3>
        <p style={{ marginBottom: '16px', color: '#666' }}>Select a hazard forecast from technical institutions for impact assessment</p>

        {!activeHazards || activeHazards.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#F5F5F5',
            borderRadius: '8px',
            border: '2px dashed #CCC'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>📭 No hazard forecasts available for review</p>
            <small style={{ color: '#666' }}>Hazards will appear here after institutions submit forecasts in Layer 1</small>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeHazards.map((hazard, index) => (
              <div
                key={index}
                onClick={() => {
                  console.log('🎯 Hazard selected:', hazard);
                  setSelectedHazard(hazard);
                }}
                className={`hazard-review-card ${selectedHazard === hazard ? 'selected' : ''}`}
                style={{
                  padding: '16px',
                  background: selectedHazard === hazard ? '#E3F2FD' : 'white',
                  border: selectedHazard === hazard ? '2px solid #1976D2' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{hazard.institution || 'Unknown Institution'}</span>
                  <span style={{ color: '#1976D2', fontWeight: 'bold' }}>{hazard.hazardType || 'Unknown Hazard'}</span>
                  <span className={`hazard-warning-level ${(hazard.warningLevel || '').toLowerCase().replace(' ', '-')}`} style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: hazard.warningLevel === 'Major Warning' ? '#FFEBEE' :
                               hazard.warningLevel === 'Warning' ? '#FFF3E0' : '#FFF9C4',
                    color: hazard.warningLevel === 'Major Warning' ? '#C62828' :
                          hazard.warningLevel === 'Warning' ? '#E65100' : '#F57F17'
                  }}>
                    {hazard.warningLevel || 'Advisory'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div><strong>Forecast Day:</strong> {hazard.forecastDay || 'N/A'}</div>
                  <div><strong>Districts Affected:</strong> {hazard.districtWarningLevels ? Object.keys(hazard.districtWarningLevels).length : 0}</div>
                  <div><strong>Likelihood:</strong> {hazard.likelihood || 'Medium'}</div>
                </div>
                {selectedHazard === hazard && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    ✓ Selected for Assessment
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2.2: Impact-Based Risk Assessment */}
      {selectedHazard && (
        <div className="pmo-section">
          <h3>📊 Step 2.2: Impact-Based Risk Assessment</h3>
          <p>Analyze factors from INFORM Risk (Module 02) to determine potential impact</p>

          {/* Risk Data Summary from INFORM */}
          {riskData?.national && (
            <div style={{
              background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid #90CAF9'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1565C0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📈 INFORM Risk Data (National Level)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getRiskColor(riskData.national.risk) }}>
                    {riskData.national.risk?.toFixed(1) || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Overall Risk</div>
                </div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getRiskColor(riskData.national.hazardExposure) }}>
                    {riskData.national.hazardExposure?.toFixed(1) || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Hazard & Exposure</div>
                </div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getRiskColor(riskData.national.vulnerability) }}>
                    {riskData.national.vulnerability?.toFixed(1) || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Vulnerability</div>
                </div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getRiskColor(riskData.national.lackCopingCapacity) }}>
                    {riskData.national.lackCopingCapacity?.toFixed(1) || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Lack of Coping</div>
                </div>
              </div>
            </div>
          )}

          {/* Hazard-Specific Analysis */}
          <div style={{
            background: selectedHazard.warningLevel === 'Major Warning' ? '#FFEBEE' :
                       selectedHazard.warningLevel === 'Warning' ? '#FFF3E0' : '#FFF9C4',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: `2px solid ${selectedHazard.warningLevel === 'Major Warning' ? '#F44336' :
                                 selectedHazard.warningLevel === 'Warning' ? '#FF9800' : '#FFC107'}`
          }}>
            <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎯 Selected Hazard Analysis: {selectedHazard.hazardType}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                <strong>Institution:</strong> {selectedHazard.institution || selectedHazard.institutionName || 'Unknown'}
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                <strong>Warning Level:</strong>{' '}
                <span style={{
                  background: selectedHazard.warningLevel === 'Major Warning' ? '#F44336' :
                             selectedHazard.warningLevel === 'Warning' ? '#FF9800' : '#FFC107',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  {selectedHazard.warningLevel || 'Advisory'}
                </span>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                <strong>Affected Districts:</strong> {selectedHazard.spatialExtent?.length || 0}
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                <strong>Confidence:</strong> {selectedHazard.confidence || 'Medium'}
              </div>
            </div>

            {/* Districts List */}
            {selectedHazard.spatialExtent && selectedHazard.spatialExtent.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <strong>Districts:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedHazard.spatialExtent.map((district, idx) => {
                    const districtLevel = selectedHazard.districtWarningLevels?.[district] || selectedHazard.warningLevel || 'Advisory';
                    return (
                      <span key={idx} style={{
                        background: districtLevel === 'Major Warning' ? '#F44336' :
                                   districtLevel === 'Warning' ? '#FF9800' : '#FFC107',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {district}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Warning Level Calculation (INFORM Formula) */}
          <div style={{
            background: '#F3E5F5',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #CE93D8'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#7B1FA2' }}>📐 Warning Level Calculation (INFORM Formula)</h4>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Warning Score = (H × E × V × LCC)^(1/4)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <span style={{ background: '#FFCDD2', padding: '6px 12px', borderRadius: '4px' }}>
                  H = {getHazardScore(selectedHazard)}
                </span>
                <span>×</span>
                <span style={{ background: '#C8E6C9', padding: '6px 12px', borderRadius: '4px' }}>
                  E = {riskData?.national?.hazardExposure?.toFixed(1) || '5.0'}
                </span>
                <span>×</span>
                <span style={{ background: '#BBDEFB', padding: '6px 12px', borderRadius: '4px' }}>
                  V = {riskData?.national?.vulnerability?.toFixed(1) || '4.5'}
                </span>
                <span>×</span>
                <span style={{ background: '#FFE0B2', padding: '6px 12px', borderRadius: '4px' }}>
                  LCC = {riskData?.national?.lackCopingCapacity?.toFixed(1) || '4.7'}
                </span>
              </div>

              {/* Level Comparison: Institution vs Calculated vs Final */}
              <div style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center'
              }}>
                {/* Institution Level */}
                <div style={{
                  padding: '12px',
                  background: '#F5F5F5',
                  borderRadius: '8px',
                  border: '2px dashed #9E9E9E'
                }}>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Institution Said</div>
                  <div style={{
                    background: getWarningColorFromLevel(selectedHazard.warningLevel),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {selectedHazard.warningLevel || 'Advisory'}
                  </div>
                </div>

                {/* Calculated Level */}
                <div style={{
                  padding: '12px',
                  background: '#E8F5E9',
                  borderRadius: '8px',
                  border: '2px solid #4CAF50'
                }}>
                  <div style={{ fontSize: '10px', color: '#2E7D32', marginBottom: '4px' }}>INFORM Calculated</div>
                  <div style={{
                    background: getWarningColorFromLevel(getWarningLevelFromScore(calculateWarningScore(selectedHazard, riskData))),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {getWarningLevelFromScore(calculateWarningScore(selectedHazard, riskData))}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                    Score: {calculateWarningScore(selectedHazard, riskData).toFixed(2)}
                  </div>
                </div>

                {/* Final Level (used on map) */}
                <div style={{
                  padding: '12px',
                  background: pmoOverrideLevel ? '#FFF3E0' : '#E3F2FD',
                  borderRadius: '8px',
                  border: `3px solid ${getWarningColorFromLevel(getFinalWarningLevel(selectedHazard, riskData))}`
                }}>
                  <div style={{ fontSize: '10px', color: '#1565C0', marginBottom: '4px' }}>
                    {pmoOverrideLevel ? '🏛️ PMO Override' : '✓ Final (Map)'}
                  </div>
                  <div style={{
                    background: getWarningColorFromLevel(getFinalWarningLevel(selectedHazard, riskData)),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {getFinalWarningLevel(selectedHazard, riskData)}
                  </div>
                </div>
              </div>
            </div>

            {/* PMO-DMD Override Selector */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'white',
              borderRadius: '8px',
              border: '2px dashed #7B1FA2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 'bold', color: '#7B1FA2', fontSize: '13px' }}>
                  🏛️ PMO-DMD Override (Optional):
                </label>
                <select
                  value={pmoOverrideLevel}
                  onChange={(e) => setPmoOverrideLevel(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '2px solid #7B1FA2',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: pmoOverrideLevel ? getWarningColorFromLevel(pmoOverrideLevel) : 'white',
                    color: pmoOverrideLevel ? 'white' : '#333',
                    cursor: 'pointer',
                    minWidth: '200px'
                  }}
                >
                  <option value="">Use Calculated Level</option>
                  <option value="MAJOR WARNING">🔴 MAJOR WARNING</option>
                  <option value="WARNING">🟠 WARNING</option>
                  <option value="ADVISORY">🟡 ADVISORY</option>
                  <option value="MONITOR">🟢 MONITOR</option>
                </select>
                {pmoOverrideLevel && (
                  <button
                    onClick={() => setPmoOverrideLevel('')}
                    style={{
                      padding: '6px 12px',
                      background: '#F44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear Override
                  </button>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                {pmoOverrideLevel
                  ? `⚠️ PMO-DMD has overridden the calculated level. Map will show ${pmoOverrideLevel} color.`
                  : '💡 Leave empty to use the calculated level. Select to override if PMO-DMD assessment differs.'}
              </div>
            </div>

            {/* Request More Information Button - Below Warning Level Calculation */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
              borderRadius: '12px',
              border: '2px solid #FF5722',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#E64A19', fontSize: '14px', marginBottom: '4px' }}>
                  🔄 Need More Information?
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  If the hazard data is incomplete or needs clarification, request additional details from the institution.
                </div>
              </div>
              <button
                onClick={() => setShowRollbackModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 87, 34, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.3)';
                }}
              >
                🔄 REQUEST MORE INFORMATION
              </button>
            </div>
          </div>

          <div className="assessment-factors">
            {/* Exposure */}
            <div className="factor-card">
              <div className="factor-header">
                <div className="factor-icon">⚠️</div>
                <div>
                  <h4>Hazard & Exposure</h4>
                  <p>Population and assets in hazard-prone areas</p>
                </div>
                {riskData?.national?.hazardExposure && (
                  <div style={{
                    marginLeft: 'auto',
                    background: getRiskColor(riskData.national.hazardExposure),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}>
                    {riskData.national.hazardExposure.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="factor-components">
                <strong>Components (from INFORM):</strong>
                <ul>
                  <li>Population exposed to hazard</li>
                  <li>Physical exposure (buildings, infrastructure)</li>
                  <li>Economic exposure (assets, livelihoods)</li>
                </ul>
              </div>
              <div className="factor-input">
                <label>Assessment Notes:</label>
                <textarea
                  rows="3"
                  value={exposureNotes}
                  onChange={(e) => setExposureNotes(e.target.value)}
                  placeholder="e.g., High population density in flood-prone areas, critical infrastructure at risk..."
                />
              </div>
            </div>

            {/* Vulnerability */}
            <div className="factor-card">
              <div className="factor-header">
                <div className="factor-icon">🛡️</div>
                <div>
                  <h4>Vulnerability</h4>
                  <p>Susceptibility to harm from the hazard</p>
                </div>
                {riskData?.national?.vulnerability && (
                  <div style={{
                    marginLeft: 'auto',
                    background: getRiskColor(riskData.national.vulnerability),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}>
                    {riskData.national.vulnerability.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="factor-components">
                <strong>Components (from INFORM):</strong>
                <ul>
                  <li>Socio-economic vulnerability (poverty, inequality)</li>
                  <li>Vulnerable groups (children, elderly, disabled)</li>
                  <li>Quality of infrastructure (buildings, roads)</li>
                </ul>
              </div>
              <div className="factor-input">
                <label>Assessment Notes:</label>
                <textarea
                  rows="3"
                  value={vulnerabilityNotes}
                  onChange={(e) => setVulnerabilityNotes(e.target.value)}
                  placeholder="e.g., High poverty levels, informal settlements with weak structures..."
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="factor-card">
              <div className="factor-header">
                <div className="factor-icon">🏛️</div>
                <div>
                  <h4>Lack of Coping Capacity</h4>
                  <p>Inability to manage and recover from impacts</p>
                </div>
                {riskData?.national?.lackCopingCapacity && (
                  <div style={{
                    marginLeft: 'auto',
                    background: getRiskColor(riskData.national.lackCopingCapacity),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}>
                    {riskData.national.lackCopingCapacity.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="factor-components">
                <strong>Components (from INFORM):</strong>
                <ul>
                  <li>Infrastructure (roads, communications, health facilities)</li>
                  <li>Institutional capacity (DRR governance, early warning)</li>
                  <li>Emergency services availability</li>
                </ul>
              </div>
              <div className="factor-input">
                <label>Assessment Notes:</label>
                <textarea
                  rows="3"
                  value={capacityNotes}
                  onChange={(e) => setCapacityNotes(e.target.value)}
                  placeholder="e.g., Limited emergency services in remote areas, weak communication infrastructure..."
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Step 3: Warning Issuance */}
      {selectedHazard && (
        <div className="pmo-section">
          <h3>📢 Step 3: Issuance of National-Level Warning</h3>

          {/* Actor Selection */}
          <div className="actors-directive">
            <h4>🎯 Step 3.B: Directives to Registered Actors</h4>
            <p>Select actors who should receive directives and take preparedness actions</p>

            <div className="actors-grid">
              {REGISTERED_ACTORS.map(actor => (
                <label key={actor.id} className="actor-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedActors.includes(actor.id)}
                    onChange={() => toggleActor(actor.id)}
                  />
                  <div className="actor-info">
                    <div className="actor-name">{actor.name}</div>
                    <div className="actor-role">{actor.role}</div>
                    <div className="actor-category">{actor.category}</div>
                  </div>
                </label>
              ))}
            </div>

            {selectedActors.length > 0 && (
              <div className="selected-actors-summary">
                <h5>✅ Selected Actors Will Receive These Directives:</h5>
                <div className="actors-actions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Actor</th>
                        <th>Role</th>
                        <th>Actions to Take</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REGISTERED_ACTORS
                        .filter(actor => selectedActors.includes(actor.id))
                        .map(actor => (
                          <tr key={actor.id}>
                            <td><strong>{actor.name}</strong></td>
                            <td>{actor.role}</td>
                            <td>
                              <ul className="action-list">
                                {actor.actions.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Public Actions */}
          <div className="public-actions-section">
            <h4>📱 Step 3.C: Actions to be Taken by the Public</h4>
            <p>The following actions will be communicated to the public based on the warning level</p>

            {PUBLIC_ACTIONS[finalStatement] && (
              <div className="public-actions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Action Category</th>
                      <th>Public Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PUBLIC_ACTIONS[finalStatement].map((action, idx) => (
                      <tr key={idx}>
                        <td>{action.category}</td>
                        <td>{action.instruction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Issue Warning & Export Report Actions */}
          <div className="issue-warning-actions">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <button className="btn-issue-warning" onClick={handleIssueWarning}>
                🚨 ISSUE NATIONAL WARNING
              </button>

              {/* Report Export Button - Far Right */}
              {selectedHazard && (
                <ReportExportButton
                  reportType="warning"
                  reportData={{
                    hazardType: selectedHazard.hazardType,
                    institution: selectedHazard.institution || selectedHazard.institutionName,
                    severity: selectedHazard.severity,
                    confidence: selectedHazard.confidence || 'Medium',
                    // Drawn shapes for hazard icons in PDF
                    drawnShapes: selectedHazard.drawnShapes || [],
                    // Enhanced affected areas data
                    spatialExtent: selectedHazard.spatialExtent || [],
                    affectedDistricts: selectedHazard.spatialExtent || selectedHazard.affectedDistricts || [],
                    districtWarningLevels: getFinalDistrictsForMap(),
                    selectedRegions: selectedHazard.spatialExtent
                      ? [...new Set(selectedHazard.spatialExtent.map(district => {
                          // Derive region from district (simplified - would need proper mapping)
                          const regionMap = {
                            'Ilala': 'Dar es Salaam', 'Kinondoni': 'Dar es Salaam', 'Temeke': 'Dar es Salaam',
                            'Ubungo': 'Dar es Salaam', 'Kigamboni': 'Dar es Salaam',
                            'Dodoma Urban': 'Dodoma', 'Chamwino': 'Dodoma', 'Kondoa': 'Dodoma',
                            'Arusha City': 'Arusha', 'Arusha DC': 'Arusha', 'Meru': 'Arusha',
                            'Moshi Urban': 'Kilimanjaro', 'Moshi DC': 'Kilimanjaro', 'Rombo': 'Kilimanjaro',
                            'Mwanza City': 'Mwanza', 'Ilemela': 'Mwanza', 'Nyamagana': 'Mwanza',
                            'Mbeya City': 'Mbeya', 'Mbeya DC': 'Mbeya', 'Rungwe': 'Mbeya',
                            'Morogoro Urban': 'Morogoro', 'Morogoro DC': 'Morogoro', 'Kilosa': 'Morogoro',
                            'Iringa Urban': 'Iringa', 'Iringa DC': 'Iringa', 'Kilolo': 'Iringa',
                            'Tanga City': 'Tanga', 'Muheza': 'Tanga', 'Pangani': 'Tanga',
                            'Lindi Urban': 'Lindi', 'Lindi DC': 'Lindi', 'Kilwa': 'Lindi',
                            'Mtwara Urban': 'Mtwara', 'Mtwara DC': 'Mtwara', 'Masasi': 'Mtwara',
                            'Songea Urban': 'Ruvuma', 'Songea DC': 'Ruvuma', 'Mbinga': 'Ruvuma',
                            'Kigoma Urban': 'Kigoma', 'Kigoma DC': 'Kigoma', 'Kasulu': 'Kigoma',
                            'Tabora Urban': 'Tabora', 'Tabora DC': 'Tabora', 'Igunga': 'Tabora',
                            'Singida Urban': 'Singida', 'Singida DC': 'Singida', 'Manyoni': 'Singida',
                            'Shinyanga Urban': 'Shinyanga', 'Shinyanga DC': 'Shinyanga', 'Kahama': 'Shinyanga',
                            'Bukoba Urban': 'Kagera', 'Bukoba DC': 'Kagera', 'Muleba': 'Kagera',
                            'Musoma Urban': 'Mara', 'Musoma DC': 'Mara', 'Bunda': 'Mara',
                            'Sumbawanga Urban': 'Rukwa', 'Sumbawanga DC': 'Rukwa', 'Kalambo': 'Rukwa',
                            'Mpanda Urban': 'Katavi', 'Mpanda DC': 'Katavi', 'Mlele': 'Katavi',
                            'Njombe Urban': 'Njombe', 'Njombe DC': 'Njombe', 'Makete': 'Njombe',
                            'Babati Urban': 'Manyara', 'Babati DC': 'Manyara', 'Hanang': 'Manyara',
                            'Geita': 'Geita', 'Chato': 'Geita', 'Bukombe': 'Geita',
                            'Simiyu': 'Simiyu', 'Bariadi': 'Simiyu', 'Maswa': 'Simiyu'
                          };
                          return regionMap[district] || 'Unknown Region';
                        }).filter(r => r !== 'Unknown Region'))]
                      : [],
                    // Warning level info
                    warningLevel: getFinalWarningLevel(selectedHazard, riskData),
                    finalStatement: getFinalWarningLevel(selectedHazard, riskData),
                    // Validity period
                    validUntil: selectedHazard.temporalValidity?.end || new Date(Date.now() + 48 * 60 * 60 * 1000),
                    // Impact and actors
                    impactLevel: IMPACT_LEVELS[impactLevel],
                    actorDirectives: REGISTERED_ACTORS
                      .filter(actor => selectedActors.includes(actor.id))
                      .map(actor => ({
                        actor: actor.name,
                        role: actor.role,
                        actions: actor.actions
                      })),
                    publicActions: PUBLIC_ACTIONS[finalStatement] || [],
                    assessmentFactors: {
                      exposure: exposureNotes,
                      vulnerability: vulnerabilityNotes,
                      capacity: capacityNotes
                    }
                  }}
                  buttonStyle="secondary"
                  buttonText="Export Warning Bulletin"
                  disabled={!selectedHazard}
                  onExportComplete={(format) => {
                    console.log(`📄 Warning bulletin exported as ${format}`);
                  }}
                />
              )}
            </div>
            <p className="issue-note">
              Issue the warning to send directives to all selected actors and activate public communication channels.
              Export the bulletin as PDF or image for distribution.
            </p>
          </div>
        </div>
      )}

      {/* Active Warnings Summary */}
      {activeWarnings && activeWarnings.length > 0 && (
        <div className="pmo-section">
          <h3>⚠️ Active Warnings Summary</h3>
          <div className="active-warnings-list">
            {activeWarnings.slice(0, 5).map((warning, index) => (
              <div key={warning.id || index} className="active-warning-item">
                <div className="warning-meta">
                  <span className="warning-level-badge" style={{
                    backgroundColor: warning.warningLevel === 'Major Warning' ? '#F44336' :
                                    warning.warningLevel === 'Warning' ? '#FF9800' : '#FFC107'
                  }}>
                    {warning.warningLevel}
                  </span>
                  <span className="warning-district">{warning.district}</span>
                  <span className="warning-hazard">{warning.hazard?.hazardType || 'Unknown'}</span>
                </div>
                <div className="warning-timestamp">
                  Issued: {new Date(warning.issuedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROLLBACK / REQUEST MORE INFORMATION MODAL */}
      {showRollbackModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
              padding: '20px 24px',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🔄 Request More Information
              </h3>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                Roll back hazard input to request additional details from the institution
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Selected Hazard Info */}
              {selectedHazard && (
                <div style={{
                  background: '#FFF3E0',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #FFB74D'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#E65100', marginBottom: '8px' }}>
                    Selected Hazard
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                    <div><strong>Institution:</strong> {selectedHazard.institution || selectedHazard.institutionName}</div>
                    <div><strong>Hazard Type:</strong> {selectedHazard.hazardType}</div>
                    <div><strong>Warning Level:</strong> {selectedHazard.warningLevel}</div>
                    <div><strong>Districts:</strong> {selectedHazard.spatialExtent?.length || 0}</div>
                  </div>
                </div>
              )}

              {/* Reason Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  Reason for Request *
                </label>
                <select
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #E0E0E0',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">-- Select a reason --</option>
                  <option value="incomplete">Incomplete Information</option>
                  <option value="clarification">Needs Clarification</option>
                  <option value="inconsistent">Data Inconsistency</option>
                  <option value="outdated">Outdated Forecast</option>
                  <option value="verification">Requires Verification</option>
                  <option value="other">Other (specify in notes)</option>
                </select>
              </div>

              {/* Information Categories */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                  What additional information is needed? *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '10px'
                }}>
                  {INFO_CATEGORIES.map(category => (
                    <label
                      key={category.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        background: additionalInfoNeeded.includes(category.id) ? '#E3F2FD' : '#F5F5F5',
                        border: additionalInfoNeeded.includes(category.id) ? '2px solid #1976D2' : '2px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={additionalInfoNeeded.includes(category.id)}
                        onChange={() => toggleInfoCategory(category.id)}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                          {category.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {category.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  Additional Notes / Instructions
                </label>
                <textarea
                  value={rollbackNotes}
                  onChange={(e) => setRollbackNotes(e.target.value)}
                  placeholder="Provide specific details about what information is needed, questions for the institution, or any clarifications required..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #E0E0E0',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRollbackModal(false);
                    setRollbackReason('');
                    setAdditionalInfoNeeded([]);
                    setRollbackNotes('');
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '2px solid #9E9E9E',
                    background: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRollbackHazard}
                  disabled={!selectedHazard}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: selectedHazard ? 'pointer' : 'not-allowed',
                    opacity: selectedHazard ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  📤 Send Request to Institution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROACTIVE INFORMATION REQUEST MODAL */}
      {showProactiveRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '800px',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              padding: '20px 24px',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                📤 Request Hazard Information from Institutions
              </h3>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                Proactively request hazard information based on monitoring needs, regional/global alerts, or external reports
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Request Source Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '15px' }}>
                  📍 Source of Request / Reason *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '10px'
                }}>
                  {REQUEST_SOURCES.map(source => (
                    <label
                      key={source.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        background: proactiveRequestSource === source.id ? '#E8F5E9' : '#F5F5F5',
                        border: proactiveRequestSource === source.id ? '2px solid #4CAF50' : '2px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="requestSource"
                        checked={proactiveRequestSource === source.id}
                        onChange={() => setProactiveRequestSource(source.id)}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                          {source.icon} {source.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {source.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Institution Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '15px' }}>
                  🏛️ Select Institution(s) to Request From *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {Object.entries(TECHNICAL_ENTITIES).map(([key, entity]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px',
                        background: proactiveSelectedInstitutions.includes(key) ? '#E3F2FD' : 'white',
                        border: proactiveSelectedInstitutions.includes(key) ? `2px solid ${entity.color}` : '2px solid #E0E0E0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={proactiveSelectedInstitutions.includes(key)}
                        onChange={() => toggleProactiveInstitution(key)}
                        style={{ marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '20px' }}>{entity.icon}</span>
                          <span style={{ fontWeight: '700', color: entity.color }}>{entity.abbreviation}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>{entity.name}</div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          Hazards: {entity.hazards.slice(0, 3).join(', ')}{entity.hazards.length > 3 ? '...' : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hazard Type Selection */}
              {proactiveSelectedInstitutions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '15px' }}>
                    ⚠️ Hazard Type(s) of Interest (Optional)
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {/* Get unique hazards from selected institutions */}
                    {[...new Set(proactiveSelectedInstitutions.flatMap(key => TECHNICAL_ENTITIES[key]?.hazards || []))].map(hazard => (
                      <button
                        key={hazard}
                        type="button"
                        onClick={() => toggleProactiveHazard(hazard)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '20px',
                          border: proactiveSelectedHazards.includes(hazard) ? '2px solid #1976D2' : '2px solid #E0E0E0',
                          background: proactiveSelectedHazards.includes(hazard) ? '#E3F2FD' : 'white',
                          color: proactiveSelectedHazards.includes(hazard) ? '#1976D2' : '#666',
                          fontSize: '13px',
                          fontWeight: proactiveSelectedHazards.includes(hazard) ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {proactiveSelectedHazards.includes(hazard) ? '✓ ' : ''}{hazard}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Information Categories */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '15px' }}>
                  📋 What information is needed? *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '10px'
                }}>
                  {INFO_CATEGORIES.map(category => (
                    <label
                      key={category.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        background: proactiveInfoCategories.includes(category.id) ? '#E3F2FD' : '#F5F5F5',
                        border: proactiveInfoCategories.includes(category.id) ? '2px solid #1976D2' : '2px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={proactiveInfoCategories.includes(category.id)}
                        onChange={() => toggleProactiveInfoCategory(category.id)}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                          {category.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {category.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Urgency Level */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '15px' }}>
                  ⏰ Urgency Level
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'normal', label: 'Normal', color: '#4CAF50', icon: '🟢', desc: 'Response within 48 hours' },
                    { id: 'urgent', label: 'Urgent', color: '#FF9800', icon: '🟠', desc: 'Response within 24 hours' },
                    { id: 'critical', label: 'Critical', color: '#F44336', icon: '🔴', desc: 'Immediate response required' }
                  ].map(level => (
                    <label
                      key={level.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        background: proactiveUrgency === level.id ? `${level.color}15` : 'white',
                        border: proactiveUrgency === level.id ? `2px solid ${level.color}` : '2px solid #E0E0E0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        flex: '1',
                        minWidth: '150px'
                      }}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        checked={proactiveUrgency === level.id}
                        onChange={() => setProactiveUrgency(level.id)}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: level.color }}>
                          {level.icon} {level.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{level.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '15px' }}>
                  📝 Additional Notes / Instructions
                </label>
                <textarea
                  value={proactiveNotes}
                  onChange={(e) => setProactiveNotes(e.target.value)}
                  placeholder="Provide specific details about the hazard situation, questions for the institution, source details (e.g., WMO bulletin reference), or any clarifications needed..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #E0E0E0',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* File Attachment */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px', color: '#333', fontSize: '15px' }}>
                  📎 Attach Supporting Documents (Optional)
                </label>
                <div style={{
                  border: '2px dashed #BDBDBD',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: '#FAFAFA'
                }}>
                  <input
                    type="file"
                    id="file-attachment"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                    onChange={handleFileAttachment}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="file-attachment"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    📁 Choose Files
                  </label>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Supported: PDF, Word, Excel, Images (max 10MB each)
                  </p>
                </div>

                {/* Attached Files List */}
                {proactiveAttachments.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '8px', fontSize: '13px' }}>
                      Attached Files ({proactiveAttachments.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {proactiveAttachments.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            background: '#E3F2FD',
                            borderRadius: '8px',
                            border: '1px solid #90CAF9'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>
                              {file.type.includes('pdf') ? '📄' :
                               file.type.includes('word') || file.type.includes('document') ? '📝' :
                               file.type.includes('excel') || file.type.includes('sheet') ? '📊' :
                               file.type.includes('image') ? '🖼️' : '📁'}
                            </span>
                            <div>
                              <div style={{ fontWeight: '500', fontSize: '13px', color: '#333' }}>{file.name}</div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {(file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            style={{
                              background: '#FFEBEE',
                              border: '1px solid #EF9A9A',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#C62828'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E0E0E0' }}>
                <button
                  onClick={() => {
                    setShowProactiveRequestModal(false);
                    setProactiveRequestSource('');
                    setProactiveSelectedInstitutions([]);
                    setProactiveSelectedHazards([]);
                    setProactiveInfoCategories([]);
                    setProactiveNotes('');
                    setProactiveAttachments([]);
                    setProactiveUrgency('normal');
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '2px solid #9E9E9E',
                    background: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProactiveRequest}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                  }}
                >
                  📤 Send Request to Institution(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN MAP FOR PDF GENERATION - Rendered off-screen but accessible to html2canvas */}
      {selectedHazard && selectedHazard.spatialExtent && selectedHazard.spatialExtent.length > 0 && (
        <div
          id="pdf-map-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0',
            width: '800px',
            height: '600px',
            zIndex: -1,
            pointerEvents: 'none'
          }}
        >
          <InteractiveHazardMap
            selectedHazardType={selectedHazard.hazardType}
            selectedDistricts={getFinalDistrictsForMap()}
            onDistrictSelect={() => {}} // No-op for hidden map
            riskData={riskData}
            activeHazards={[]}
            showPMOView={true}
            warningLevel={getFinalWarningLevel(selectedHazard, riskData)}
          />
        </div>
      )}
    </div>
  );
};

export default Layer4PMODashboard;
