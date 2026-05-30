/**
 * COMMITTEE DATA ENTRY
 * Form for committees to submit indicator data for their region/ward
 * Uses Supabase for real database storage (falls back to localStorage if not configured)
 */

import { useState } from 'react';
import { createSubmission, isUsingSupabase } from '../../services/supabaseDataService';

const CommitteeDataEntry = ({ user, indicators, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitResult, setSubmitResult] = useState(null);

  // Group indicators by dimension
  const dimensions = [
    { id: 'HAZARD', name: 'Hazard & Exposure', icon: '⚠️', color: '#e74c3c' },
    { id: 'VULNERABILITY', name: 'Vulnerability', icon: '👥', color: '#f39c12' },
    { id: 'COPING_CAPACITY', name: 'Coping Capacity', icon: '🛡️', color: '#27ae60' }
  ];

  const getIndicatorsByDimension = (dimensionId) => {
    return indicators.filter(i => i.dimension === dimensionId);
  };

  const handleValueChange = (indicatorId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [field]: value
      }
    }));

    // Clear error when user starts typing
    if (errors[indicatorId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[indicatorId];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    const currentDimension = dimensions[currentStep];
    const dimensionIndicators = getIndicatorsByDimension(currentDimension.id);
    const newErrors = {};

    dimensionIndicators.forEach(indicator => {
      const data = formData[indicator.id];
      if (!data?.value || data.value === '') {
        newErrors[indicator.id] = 'Value is required';
      } else if (data.value < 0 || data.value > 10) {
        newErrors[indicator.id] = 'Value must be between 0 and 10';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, dimensions.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // On review step, validate all dimensions before submitting
    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i];
      const dimIndicators = getIndicatorsByDimension(dim.id);
      const dimErrors = {};
      dimIndicators.forEach(indicator => {
        const data = formData[indicator.id];
        if (!data?.value && data?.value !== 0) {
          dimErrors[indicator.id] = 'Value is required';
        } else if (data.value < 0 || data.value > 10) {
          dimErrors[indicator.id] = 'Value must be between 0 and 10';
        }
      });
      if (Object.keys(dimErrors).length > 0) {
        setErrors(dimErrors);
        setCurrentStep(i); // Go back to the step with errors
        return;
      }
    }

    setSubmitting(true);

    try {
      // Create submission via Supabase service (falls back to localStorage if not configured)
      const submission = await createSubmission({
        committeeId: user?.committeeId,
        committeeName: user?.committeeName,
        adm1Code: user?.adm1Code,
        adm1Name: user?.adm1Name,
        adm2Code: user?.adm2Code,
        adm2Name: user?.adm2Name,
        submittedBy: user?.name || user?.email,
        submittedByEmail: user?.email,
        indicators: formData,
        sourceType: 'committee'
      });

      console.log(`✅ Submission saved ${isUsingSupabase() ? 'to Supabase' : 'to localStorage'}:`, submission);

      // Get calculated scores from response
      const riskScore = submission.riskScore;
      const riskClass = submission.riskClass;

      // Show success
      setSubmitResult({
        success: true,
        riskScore,
        riskClass,
        indicatorCount: Object.keys(formData).length
      });

      // Notify parent after a delay so user sees success
      setTimeout(() => {
        if (onSubmissionComplete) {
          onSubmissionComplete(submission);
        }
        // Reset form
        setFormData({});
        setCurrentStep(0);
        setSubmitResult(null);
      }, 3000);

    } catch (error) {
      console.error('❌ Submission failed:', error);
      setSubmitResult({ success: false, error: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {dimensions.map((dim, index) => (
        <div
          key={dim.id}
          className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
        >
          <span className="step-number">{index + 1}</span>
          <span className="step-label">{dim.name}</span>
        </div>
      ))}
      <div className={`step ${currentStep === dimensions.length ? 'active' : ''}`}>
        <span className="step-number">4</span>
        <span className="step-label">Review & Submit</span>
      </div>
    </div>
  );

  const renderIndicatorForm = (indicator) => {
    const data = formData[indicator.id] || {};
    const hasError = errors[indicator.id];

    return (
      <div key={indicator.id} className={`indicator-form ${hasError ? 'has-error' : ''}`}>
        <div className="indicator-header">
          <h4>{indicator.name}</h4>
          <span className="category-badge">{indicator.category}</span>
        </div>

        <div className="form-row">
          <div className="form-group value-input">
            <label>Value (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={data.value || ''}
              onChange={(e) => handleValueChange(indicator.id, 'value', parseFloat(e.target.value))}
              placeholder="Enter value..."
            />
            {hasError && <span className="error-message">{errors[indicator.id]}</span>}
          </div>

          <div className="form-group confidence-select">
            <label>Confidence Level</label>
            <select
              value={data.confidence || 'medium'}
              onChange={(e) => handleValueChange(indicator.id, 'confidence', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group source-input">
            <label>Data Source</label>
            <input
              type="text"
              value={data.source || ''}
              onChange={(e) => handleValueChange(indicator.id, 'source', e.target.value)}
              placeholder="e.g., Field survey, Government report..."
            />
          </div>
        </div>

        <div className="form-group notes-input">
          <label>Notes (optional)</label>
          <textarea
            value={data.notes || ''}
            onChange={(e) => handleValueChange(indicator.id, 'notes', e.target.value)}
            placeholder="Additional observations or context..."
            rows={2}
          />
        </div>
      </div>
    );
  };

  const renderDimensionForm = () => {
    const currentDimension = dimensions[currentStep];
    const dimensionIndicators = getIndicatorsByDimension(currentDimension.id);

    return (
      <div className="dimension-form">
        <div className="dimension-header" style={{ borderColor: currentDimension.color }}>
          <span className="dimension-icon">{currentDimension.icon}</span>
          <h3>{currentDimension.name}</h3>
        </div>

        <p className="dimension-description">
          Enter values for each indicator below. Values should be between 0 (lowest risk) and 10 (highest risk).
        </p>

        <div className="indicators-form-list">
          {dimensionIndicators.map(indicator => renderIndicatorForm(indicator))}
        </div>
      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="review-step">
      <h3>📋 Review Your Submission</h3>
      <p>Please review the data below before submitting.</p>

      <div className="review-info">
        <div className="review-item">
          <span className="label">Committee:</span>
          <span className="value">{user?.committeeName}</span>
        </div>
        <div className="review-item">
          <span className="label">Region:</span>
          <span className="value">{user?.adm1Name}{user?.adm2Name ? ` → ${user.adm2Name}` : ''}</span>
        </div>
        <div className="review-item">
          <span className="label">Total Indicators:</span>
          <span className="value">{Object.keys(formData).length}</span>
        </div>
      </div>

      <div className="review-summary">
        {dimensions.map(dim => {
          const dimIndicators = getIndicatorsByDimension(dim.id);
          const filledIndicators = dimIndicators.filter(i => formData[i.id]?.value !== undefined);

          return (
            <div key={dim.id} className="dimension-summary">
              <h4>
                {dim.icon} {dim.name}
                <span className="count">({filledIndicators.length}/{dimIndicators.length})</span>
              </h4>
              <div className="summary-list">
                {filledIndicators.map(indicator => (
                  <div key={indicator.id} className="summary-item">
                    <span className="indicator-name">{indicator.name}</span>
                    <span className="indicator-value">{formData[indicator.id]?.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="committee-data-entry">
      <div className="entry-header">
        <h2>✏️ Submit Indicator Data</h2>
        <p>Enter INFORM risk indicator values for {user?.adm1Name}{user?.adm2Name ? ` - ${user.adm2Name}` : ''}</p>
      </div>

      {renderStepIndicator()}

      {/* Success / Error Message */}
      {submitResult && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: submitResult.success ? '#d1fae5' : '#fee2e2',
          color: submitResult.success ? '#065f46' : '#991b1b',
          border: `1px solid ${submitResult.success ? '#6ee7b7' : '#fca5a5'}`,
          fontSize: '15px'
        }}>
          <span style={{ fontSize: '24px' }}>{submitResult.success ? '✅' : '❌'}</span>
          <div>
            {submitResult.success ? (
              <>
                <strong>Data submitted successfully!</strong>
                <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>
                  {submitResult.indicatorCount} indicators submitted.
                  {submitResult.riskScore !== null && (
                    <> INFORM Risk Index: <strong>{submitResult.riskScore}</strong> ({submitResult.riskClass})</>
                  )}
                </div>
              </>
            ) : (
              <><strong>Submission failed:</strong> {submitResult.error}</>
            )}
          </div>
        </div>
      )}

      <div className="entry-content">
        {currentStep < dimensions.length ? renderDimensionForm() : renderReviewStep()}
      </div>

      <div className="entry-actions">
        <button
          className="btn secondary"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          ← Previous
        </button>

        {currentStep < dimensions.length ? (
          <button className="btn primary" onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button
            className="btn submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '⏳ Submitting...' : '✅ Submit Data'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CommitteeDataEntry;
