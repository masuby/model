/**
 * LIVE DATA ENTRY COMPONENT
 * Excel-like data entry with real-time INFORM calculations
 *
 * Linked with CommitteeDataEntry - uses the SAME indicators and storage
 * so submissions appear in CommitteeDashboard and vice versa.
 *
 * Features:
 * - Live calculations as you type
 * - Component → Category → Dimension → Risk score display
 * - Visual indicators for risk levels
 * - Auto-save drafts
 * - Loads latest submission data
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  classifyRisk,
  getRiskColor,
  roundTo,
  arithmeticMean
} from '../../database/formulas';
import './LiveDataEntry.css';

// Same indicators as CommitteeDashboard - keeps data in sync
const INDICATORS = [
  { id: 'flood_exposure', name: 'Flood Exposure', dimension: 'HAZARD', category: 'Natural' },
  { id: 'drought_exposure', name: 'Drought Exposure', dimension: 'HAZARD', category: 'Natural' },
  { id: 'earthquake_exposure', name: 'Earthquake Exposure', dimension: 'HAZARD', category: 'Natural' },
  { id: 'conflict_intensity', name: 'Conflict Intensity', dimension: 'HAZARD', category: 'Human' },
  { id: 'development_deprivation', name: 'Development & Deprivation', dimension: 'VULNERABILITY', category: 'Socio-Economic' },
  { id: 'inequality', name: 'Inequality', dimension: 'VULNERABILITY', category: 'Socio-Economic' },
  { id: 'food_security', name: 'Food Security', dimension: 'VULNERABILITY', category: 'Vulnerable Groups' },
  { id: 'health_conditions', name: 'Health Conditions', dimension: 'VULNERABILITY', category: 'Vulnerable Groups' },
  { id: 'drr_capacity', name: 'DRR Capacity', dimension: 'COPING_CAPACITY', category: 'Institutional' },
  { id: 'governance', name: 'Governance', dimension: 'COPING_CAPACITY', category: 'Institutional' },
  { id: 'communication', name: 'Communication', dimension: 'COPING_CAPACITY', category: 'Infrastructure' },
  { id: 'physical_infrastructure', name: 'Physical Infrastructure', dimension: 'COPING_CAPACITY', category: 'Infrastructure' },
];

// Dimension display config
const DIMENSIONS = [
  { id: 'HAZARD', name: 'Hazard & Exposure', icon: '⚠️', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { id: 'VULNERABILITY', name: 'Vulnerability', icon: '👥', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  { id: 'COPING_CAPACITY', name: 'Coping Capacity', icon: '🛡️', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' }
];

// Risk level colors
const RISK_COLORS = {
  'Very Low': '#4CAF50',
  'Low': '#8BC34A',
  'Medium': '#FFC107',
  'High': '#FF9800',
  'Very High': '#F44336'
};

const LiveDataEntry = ({ onSubmit }) => {
  const { user } = useAuth();

  // Values: { [indicatorId]: number | '' }
  const [values, setValues] = useState(() => {
    const initial = {};
    INDICATORS.forEach(ind => { initial[ind.id] = ''; });
    return initial;
  });

  // Metadata per indicator: { [indicatorId]: { confidence, source, notes } }
  const [meta, setMeta] = useState({});

  // Submission metadata
  const [metadata, setMetadata] = useState({
    dataSource: '',
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    notes: ''
  });

  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [lastSubmission, setLastSubmission] = useState(null);

  // Load latest committee submission on mount
  useEffect(() => {
    try {
      // Try to load from committee submissions
      const committeeId = user?.committeeId;
      if (committeeId) {
        const stored = localStorage.getItem(`committee_submissions_${committeeId}`);
        if (stored) {
          const submissions = JSON.parse(stored);
          if (submissions.length > 0) {
            const latest = submissions[0];
            setLastSubmission(latest);

            // Pre-fill values from the latest submission's indicators
            if (latest.indicators && typeof latest.indicators === 'object') {
              const loaded = {};
              INDICATORS.forEach(ind => {
                const data = latest.indicators[ind.id];
                if (data?.value !== undefined && data?.value !== null) {
                  loaded[ind.id] = data.value;
                }
              });
              if (Object.keys(loaded).length > 0) {
                setValues(prev => ({ ...prev, ...loaded }));
              }
            }
          }
        }
      }

      // Also try to load draft
      const draft = localStorage.getItem('live_data_entry_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.values && typeof parsed.values === 'object') {
          setValues(prev => ({ ...prev, ...parsed.values }));
        }
        if (parsed.meta && typeof parsed.meta === 'object') {
          setMeta(prev => ({ ...prev, ...parsed.meta }));
        }
        if (parsed.metadata && typeof parsed.metadata === 'object') {
          setMetadata(prev => ({ ...prev, ...parsed.metadata }));
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
      localStorage.removeItem('live_data_entry_draft');
    }
  }, [user?.committeeId]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (Object.values(values).some(v => v !== '')) {
        localStorage.setItem('live_data_entry_draft', JSON.stringify({
          values, meta, metadata,
          savedAt: new Date().toISOString()
        }));
      }
    }, 30000);
    return () => clearInterval(saveInterval);
  }, [values, meta, metadata]);

  // Handle value change
  const handleValueChange = useCallback((id, value) => {
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= 10)) {
      setValues(prev => ({ ...prev, [id]: value === '' ? '' : numValue }));
    }
  }, []);

  // Get indicators by dimension
  const getByDimension = (dimId) => INDICATORS.filter(i => i.dimension === dimId);

  // Get unique categories within a dimension
  const getCategories = (dimId) => {
    const cats = [...new Set(INDICATORS.filter(i => i.dimension === dimId).map(i => i.category))];
    return cats;
  };

  // Calculate dimension scores
  const scores = useMemo(() => {
    const dimScores = {};

    DIMENSIONS.forEach(dim => {
      const dimIndicators = getByDimension(dim.id);
      const dimValues = dimIndicators
        .map(ind => typeof values[ind.id] === 'number' ? values[ind.id] : parseFloat(values[ind.id]))
        .filter(v => !isNaN(v));

      if (dimValues.length > 0) {
        if (dim.id === 'COPING_CAPACITY') {
          // Invert: Lack of Coping Capacity = 10 - CC
          dimScores[dim.id] = roundTo(10 - arithmeticMean(dimValues), 2);
        } else {
          dimScores[dim.id] = roundTo(arithmeticMean(dimValues), 2);
        }
      }
    });

    // Category scores
    const catScores = {};
    DIMENSIONS.forEach(dim => {
      getCategories(dim.id).forEach(cat => {
        const catIndicators = INDICATORS.filter(i => i.dimension === dim.id && i.category === cat);
        const catValues = catIndicators
          .map(ind => typeof values[ind.id] === 'number' ? values[ind.id] : parseFloat(values[ind.id]))
          .filter(v => !isNaN(v));
        if (catValues.length > 0) {
          catScores[`${dim.id}_${cat}`] = roundTo(arithmeticMean(catValues), 2);
        }
      });
    });

    // Overall risk
    let riskScore = null;
    let riskClass = null;
    let riskColor = '#ccc';

    const h = dimScores['HAZARD'];
    const v = dimScores['VULNERABILITY'];
    const lcc = dimScores['COPING_CAPACITY'];

    if (h !== undefined && v !== undefined && lcc !== undefined) {
      riskScore = roundTo(Math.pow(h * v * lcc, 1 / 3), 2);
      const classObj = classifyRisk(riskScore);
      riskClass = classObj?.label || null;
      riskColor = riskClass ? (RISK_COLORS[riskClass] || classObj?.color || '#ccc') : '#ccc';
    }

    return { dimScores, catScores, riskScore, riskClass, riskColor };
  }, [values]);

  // Completion percentage
  const completionPercent = useMemo(() => {
    const total = INDICATORS.length;
    const filled = INDICATORS.filter(ind => {
      const v = values[ind.id];
      return v !== '' && v !== undefined && v !== null;
    }).length;
    return Math.round((filled / total) * 100);
  }, [values]);

  // Handle submit - saves to SAME storage as CommitteeDataEntry
  const handleSubmit = async () => {
    setSubmitStatus('submitting');
    setSubmitMessage('Submitting data for review...');

    try {
      // Build formData in CommitteeDataEntry format: { [id]: { value, confidence, source, notes } }
      const formData = {};
      INDICATORS.forEach(ind => {
        const v = values[ind.id];
        if (v !== '' && v !== undefined && v !== null) {
          formData[ind.id] = {
            value: typeof v === 'number' ? v : parseFloat(v),
            confidence: meta[ind.id]?.confidence || 'medium',
            source: meta[ind.id]?.source || metadata.dataSource || '',
            notes: meta[ind.id]?.notes || ''
          };
        }
      });

      // Calculate scores
      const getVals = (dimId) => INDICATORS
        .filter(i => i.dimension === dimId)
        .map(i => formData[i.id]?.value)
        .filter(v => v !== undefined && v !== null && !isNaN(v));

      const hazardValues = getVals('HAZARD');
      const vulnValues = getVals('VULNERABILITY');
      const ccValues = getVals('COPING_CAPACITY');

      const hazardScore = hazardValues.length > 0 ? roundTo(arithmeticMean(hazardValues), 2) : null;
      const vulnScore = vulnValues.length > 0 ? roundTo(arithmeticMean(vulnValues), 2) : null;
      const ccScore = ccValues.length > 0 ? roundTo(10 - arithmeticMean(ccValues), 2) : null;

      let riskScore = null;
      let riskClass = null;
      if (hazardScore !== null && vulnScore !== null && ccScore !== null) {
        riskScore = roundTo(Math.pow(hazardScore * vulnScore * ccScore, 1 / 3), 2);
        riskClass = classifyRisk(riskScore).label;
      }

      // Create submission in SAME format as CommitteeDataEntry
      const submission = {
        id: Date.now().toString(),
        committeeId: user?.committeeId,
        committeeName: user?.committeeName,
        adm1Code: user?.adm1Code,
        adm1Name: user?.adm1Name,
        adm2Code: user?.adm2Code,
        adm2Name: user?.adm2Name,
        submittedBy: user?.email,
        submittedAt: new Date().toISOString(),
        indicatorCount: Object.keys(formData).length,
        indicators: formData,
        scores: { hazardScore, vulnScore, ccScore, riskScore, riskClass },
        metadata,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        source: 'live-data-entry'
      };

      // Save to committee submissions (same key as CommitteeDataEntry)
      if (user?.committeeId) {
        const key = `committee_submissions_${user.committeeId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(submission);
        localStorage.setItem(key, JSON.stringify(existing));
      }

      // Save to global pending submissions for PMO review
      const allPending = JSON.parse(localStorage.getItem('all_pending_submissions') || '[]');
      allPending.unshift(submission);
      localStorage.setItem('all_pending_submissions', JSON.stringify(allPending));

      // Clear draft
      localStorage.removeItem('live_data_entry_draft');

      if (onSubmit) {
        await onSubmit(submission);
      }

      setLastSubmission(submission);
      setSubmitStatus('success');
      setSubmitMessage(
        `Data submitted successfully! ${Object.keys(formData).length} indicators.` +
        (riskScore !== null ? ` Risk Index: ${riskScore.toFixed(2)} (${riskClass})` : '')
      );

      setTimeout(() => {
        setSubmitStatus(null);
        setSubmitMessage('');
      }, 5000);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Failed to submit: ' + error.message);
    }
  };

  // Save draft handler
  const handleSaveDraft = () => {
    localStorage.setItem('live_data_entry_draft', JSON.stringify({
      values, meta, metadata,
      savedAt: new Date().toISOString()
    }));
    setSubmitStatus('success');
    setSubmitMessage('Draft saved successfully!');
    setTimeout(() => { setSubmitStatus(null); setSubmitMessage(''); }, 3000);
  };

  // Clear form handler
  const handleClear = () => {
    const cleared = {};
    INDICATORS.forEach(ind => { cleared[ind.id] = ''; });
    setValues(cleared);
    setMeta({});
    localStorage.removeItem('live_data_entry_draft');
  };

  // Render indicator input row
  const renderIndicatorRow = (indicator, index) => {
    const value = values[indicator.id];
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    const hasValue = value !== '' && !isNaN(numValue);

    let valueColor = '#666';
    if (hasValue) {
      if (numValue <= 3.5) valueColor = '#4CAF50';
      else if (numValue <= 5) valueColor = '#FFC107';
      else if (numValue <= 6.5) valueColor = '#FF9800';
      else valueColor = '#F44336';
    }

    return (
      <tr key={indicator.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
        <td className="indicator-name">{indicator.name}</td>
        <td className="indicator-unit">{indicator.category}</td>
        <td className="indicator-value">
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={value}
            onChange={(e) => handleValueChange(indicator.id, e.target.value)}
            placeholder="0-10"
            style={{
              color: valueColor,
              borderColor: hasValue ? valueColor : '#ddd'
            }}
          />
        </td>
        <td className="indicator-bar">
          <div className="value-bar-container">
            <div
              className="value-bar"
              style={{
                width: hasValue ? `${Math.min(numValue * 10, 100)}%` : '0%',
                backgroundColor: valueColor
              }}
            />
          </div>
        </td>
      </tr>
    );
  };

  // Render score card
  const renderScoreCard = (label, score, color = null) => {
    const isValid = score !== undefined && score !== null && !isNaN(score);
    const displayScore = isValid ? score.toFixed(2) : '-';
    const cardColor = color || (isValid ? getRiskColor(score) : '#ccc');

    return (
      <div className="score-card" style={{ borderColor: cardColor }}>
        <div className="score-label">{label}</div>
        <div className="score-value" style={{ color: cardColor }}>
          {displayScore}
        </div>
        {isValid && (
          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{
                width: `${Math.min(score * 10, 100)}%`,
                backgroundColor: cardColor
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="live-data-entry">
      {/* Header with real-time scores */}
      <div className="entry-header">
        <div className="header-info">
          <h2>Live Data Entry</h2>
          <p>
            Enter indicator values (0-10 scale). Calculations update instantly.
            {user?.adm1Name && <> &mdash; {user.adm1Name}{user?.adm2Name ? ` - ${user.adm2Name}` : ''}</>}
          </p>
          {lastSubmission && (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Last submission: {new Date(lastSubmission.submittedAt).toLocaleString()}
              {' '}({lastSubmission.indicatorCount} indicators, {lastSubmission.scores?.riskClass || 'N/A'})
            </p>
          )}
        </div>

        <div className="live-scores">
          {renderScoreCard('Hazard', scores.dimScores['HAZARD'])}
          {renderScoreCard('Vulnerability', scores.dimScores['VULNERABILITY'])}
          {renderScoreCard('Lack of CC', scores.dimScores['COPING_CAPACITY'])}
          <div className="score-card risk-card" style={{ borderColor: scores.riskColor, backgroundColor: `${scores.riskColor}10` }}>
            <div className="score-label">RISK INDEX</div>
            <div className="score-value" style={{ color: scores.riskColor, fontSize: '28px' }}>
              {scores.riskScore !== null ? scores.riskScore.toFixed(2) : '-'}
            </div>
            {scores.riskClass && (
              <div className="risk-class" style={{ backgroundColor: scores.riskColor }}>
                {scores.riskClass}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="completion-bar">
        <div className="completion-label">
          Data Completion: {completionPercent}% ({INDICATORS.filter(ind => values[ind.id] !== '' && values[ind.id] !== undefined && values[ind.id] !== null).length}/{INDICATORS.length} indicators)
        </div>
        <div className="completion-track">
          <div
            className="completion-fill"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Data entry tables by dimension */}
      <div className="entry-sections">
        {DIMENSIONS.map(dim => {
          const dimIndicators = getByDimension(dim.id);
          const categories = getCategories(dim.id);
          const dimScore = scores.dimScores[dim.id];

          return (
            <div key={dim.id} className="entry-section">
              <div className="section-header" style={{ background: dim.gradient }}>
                <h3>{dim.icon} {dim.name}</h3>
                <div className="section-score">
                  {dimScore !== undefined && dimScore !== null ? dimScore.toFixed(2) : '-'}
                </div>
              </div>

              {categories.map(cat => {
                const catIndicators = dimIndicators.filter(i => i.category === cat);
                const catKey = `${dim.id}_${cat}`;
                const catScore = scores.catScores[catKey];

                return (
                  <div key={cat} className="category-block">
                    <div className="category-header">
                      <span className="category-name">{cat}</span>
                      <span className="category-score">
                        {catScore !== undefined && catScore !== null ? catScore.toFixed(2) : '-'}
                      </span>
                    </div>
                    <table className="indicator-table">
                      <thead>
                        <tr>
                          <th>Indicator</th>
                          <th>Category</th>
                          <th>Value</th>
                          <th>Scale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catIndicators.map((ind, i) => renderIndicatorRow(ind, i))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Metadata */}
      <div className="metadata-section">
        <h3>Submission Details</h3>
        <div className="metadata-grid">
          <div className="metadata-field">
            <label>Data Source</label>
            <input
              type="text"
              value={metadata.dataSource}
              onChange={(e) => setMetadata(prev => ({ ...prev, dataSource: e.target.value }))}
              placeholder="e.g., Field Survey, Census Data"
            />
          </div>
          <div className="metadata-field">
            <label>Year</label>
            <select
              value={metadata.year}
              onChange={(e) => setMetadata(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="metadata-field">
            <label>Quarter</label>
            <select
              value={metadata.quarter}
              onChange={(e) => setMetadata(prev => ({ ...prev, quarter: parseInt(e.target.value) }))}
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          </div>
          <div className="metadata-field full-width">
            <label>Notes</label>
            <textarea
              value={metadata.notes}
              onChange={(e) => setMetadata(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments..."
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Status Message */}
      {submitStatus && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: submitStatus === 'success' ? '#d1fae5' :
                      submitStatus === 'error' ? '#fee2e2' : '#dbeafe',
          color: submitStatus === 'success' ? '#065f46' :
                 submitStatus === 'error' ? '#991b1b' : '#1e40af',
          border: `1px solid ${submitStatus === 'success' ? '#6ee7b7' :
                                submitStatus === 'error' ? '#fca5a5' : '#93c5fd'}`
        }}>
          <span style={{ fontSize: '20px' }}>
            {submitStatus === 'success' ? '✅' : submitStatus === 'error' ? '❌' : '⏳'}
          </span>
          <span style={{ fontWeight: 500 }}>{submitMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="entry-actions">
        <button className="btn-clear" onClick={handleClear}>
          Clear All
        </button>
        <button className="btn-draft" onClick={handleSaveDraft}>
          Save Draft
        </button>
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={completionPercent === 0 || submitStatus === 'submitting'}
        >
          {submitStatus === 'submitting' ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>

      {/* Formula explanation */}
      <div className="formula-info">
        <h4>INFORM Risk Calculation</h4>
        <p>
          <strong>Risk Index</strong> = <sup>3</sup>√(Hazard × Vulnerability × Lack of Coping Capacity)
        </p>
        <p className="formula-note">
          * All three dimensions must have values for the Risk Index to calculate.
          Coping Capacity is inverted (Lack of CC = 10 - CC).
        </p>
      </div>
    </div>
  );
};

export default LiveDataEntry;
