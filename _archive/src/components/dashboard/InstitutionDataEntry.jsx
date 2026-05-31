/**
 * INSTITUTION DATA ENTRY COMPONENT
 * Multi-step form for institutions to submit hazard indicator data
 * Works with InstitutionDashboard and unified data entry service
 */

import { useState } from 'react';
import { submitInstitutionData } from '../../services/unifiedDataEntryService';
import { REGIONS } from '../../services/authService';

const InstitutionDataEntry = ({ user, indicators, institutionInfo, onSubmissionComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState('national');
  const [indicatorValues, setIndicatorValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const [dataYear, setDataYear] = useState(currentYear);
  const [dataQuarter, setDataQuarter] = useState(null);
  const [dataSource, setDataSource] = useState('');

  // Steps for the wizard
  const steps = [
    { number: 1, label: 'Region Selection' },
    { number: 2, label: 'Indicator Data' },
    { number: 3, label: 'Review & Submit' }
  ];

  const handleIndicatorChange = (indicatorId, field, value) => {
    setIndicatorValues(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [field]: value
      }
    }));
    // Clear error for this indicator
    if (errors[indicatorId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[indicatorId];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!selectedRegion) {
        newErrors.region = 'Please select a region';
      }
    }

    if (currentStep === 2) {
      // Check that at least some indicators have values
      const filledIndicators = Object.entries(indicatorValues).filter(
        ([_, val]) => val.value !== undefined && val.value !== ''
      );
      if (filledIndicators.length === 0) {
        newErrors.general = 'Please enter at least one indicator value';
      }
      // Validate each filled indicator
      indicators.forEach(indicator => {
        const val = indicatorValues[indicator.code]?.value;
        if (val !== undefined && val !== '') {
          if (isNaN(parseFloat(val))) {
            newErrors[indicator.code] = 'Must be a number';
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);

    // Prepare indicator values for submission
    const valuesForSubmission = Object.entries(indicatorValues)
      .filter(([_, val]) => val.value !== undefined && val.value !== '')
      .map(([code, val]) => ({
        indicatorCode: code,
        value: parseFloat(val.value),
        confidence: val.confidence || 'medium',
        notes: val.notes || '',
        regionCode: selectedRegion !== 'national' ? selectedRegion : null,
        regionName: selectedRegion !== 'national' ? REGIONS.find(r => r === selectedRegion) || selectedRegion : 'National'
      }));

    const result = await submitInstitutionData({
      user,
      institutionKey: user?.institution,
      indicatorValues: valuesForSubmission,
      dataSource: dataSource || `${institutionInfo?.shortName || 'Institution'} Official Data`,
      year: dataYear,
      quarter: dataQuarter
    });

    setIsSubmitting(false);

    if (result.success) {
      // Reset form
      setCurrentStep(1);
      setIndicatorValues({});
      setSelectedRegion('national');
      onSubmissionComplete?.();
    } else {
      setErrors({ submit: result.error || 'Submission failed' });
    }
  };

  const getFilledIndicatorsCount = () => {
    return Object.entries(indicatorValues).filter(
      ([_, val]) => val.value !== undefined && val.value !== ''
    ).length;
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
        >
          <div className="step-number">
            {currentStep > step.number ? '✓' : step.number}
          </div>
          <span className="step-label">{step.label}</span>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Select Data Coverage</h3>
      <p className="step-description">
        Choose whether you're submitting data at the national level or for a specific region.
      </p>

      <div className="form-section">
        <div className="form-group">
          <label>Data Coverage</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="region-select"
          >
            <option value="national">National Level</option>
            <optgroup label="Regions">
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </optgroup>
          </select>
          {errors.region && <span className="error-message">{errors.region}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Data Year</label>
            <select value={dataYear} onChange={(e) => setDataYear(parseInt(e.target.value))}>
              {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quarter (Optional)</label>
            <select value={dataQuarter || ''} onChange={(e) => setDataQuarter(e.target.value ? parseInt(e.target.value) : null)}>
              <option value="">Annual Data</option>
              <option value="1">Q1 (Jan-Mar)</option>
              <option value="2">Q2 (Apr-Jun)</option>
              <option value="3">Q3 (Jul-Sep)</option>
              <option value="4">Q4 (Oct-Dec)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Data Source</label>
          <input
            type="text"
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            placeholder={`e.g., ${institutionInfo?.shortName || 'Institution'} Official Records`}
          />
        </div>
      </div>

      <div className="info-box">
        <span className="info-icon">{institutionInfo?.icon || '📊'}</span>
        <div>
          <strong>{institutionInfo?.name || 'Institution'}</strong>
          <p>You can submit data for {indicators.length} hazard indicators.</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="dimension-form">
        <div className="dimension-header" style={{ borderColor: '#f44336', background: '#FFEBEE' }}>
          <span className="dimension-icon">⚠️</span>
          <div>
            <h3 style={{ color: '#C62828' }}>Hazard Indicators</h3>
            <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '14px' }}>
              Enter hazard data for {selectedRegion === 'national' ? 'Tanzania (National)' : selectedRegion}
            </p>
          </div>
        </div>

        {errors.general && (
          <div className="error-banner">
            <span>⚠️</span> {errors.general}
          </div>
        )}

        <div className="indicators-form-list">
          {indicators.map(indicator => (
            <div key={indicator.code} className={`indicator-form ${errors[indicator.code] ? 'has-error' : ''}`}>
              <div className="indicator-header">
                <h4>{indicator.name}</h4>
                <span className="category-badge">{indicator.category}</span>
              </div>

              {indicator.description && (
                <p className="indicator-description">{indicator.description}</p>
              )}

              <div className="form-row">
                <div className="form-group value-input">
                  <label>Value {indicator.unit && `(${indicator.unit})`}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={indicatorValues[indicator.code]?.value || ''}
                    onChange={(e) => handleIndicatorChange(indicator.code, 'value', e.target.value)}
                    placeholder="Enter value"
                  />
                  {errors[indicator.code] && (
                    <span className="error-message">{errors[indicator.code]}</span>
                  )}
                </div>

                <div className="form-group confidence-select">
                  <label>Confidence</label>
                  <select
                    value={indicatorValues[indicator.code]?.confidence || 'medium'}
                    onChange={(e) => handleIndicatorChange(indicator.code, 'confidence', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 2 }}>
                  <label>Notes (Optional)</label>
                  <input
                    type="text"
                    value={indicatorValues[indicator.code]?.notes || ''}
                    onChange={(e) => handleIndicatorChange(indicator.code, 'notes', e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {indicator.source && (
                <div className="indicator-source">
                  <span className="source-label">Source:</span> {indicator.source}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const filledIndicators = Object.entries(indicatorValues)
      .filter(([_, val]) => val.value !== undefined && val.value !== '')
      .map(([code, val]) => ({
        code,
        ...val,
        name: indicators.find(i => i.code === code)?.name || code
      }));

    return (
      <div className="step-content review-step">
        <h3>Review & Submit</h3>
        <p>Please review your data before submitting for PMO review.</p>

        {errors.submit && (
          <div className="error-banner">
            <span>❌</span> {errors.submit}
          </div>
        )}

        <div className="review-info">
          <div className="review-item">
            <span className="label">Institution</span>
            <span className="value">{institutionInfo?.name || 'N/A'}</span>
          </div>
          <div className="review-item">
            <span className="label">Coverage</span>
            <span className="value">{selectedRegion === 'national' ? 'National' : selectedRegion}</span>
          </div>
          <div className="review-item">
            <span className="label">Period</span>
            <span className="value">
              {dataYear}{dataQuarter ? ` Q${dataQuarter}` : ' (Annual)'}
            </span>
          </div>
          <div className="review-item">
            <span className="label">Indicators</span>
            <span className="value">{filledIndicators.length} submitted</span>
          </div>
        </div>

        <div className="review-summary">
          <h4>
            <span>⚠️</span> Hazard Indicators
            <span className="count">({filledIndicators.length} items)</span>
          </h4>

          {filledIndicators.length > 0 ? (
            <div className="summary-list">
              {filledIndicators.map(item => (
                <div key={item.code} className="summary-item">
                  <span className="indicator-name">{item.name}</span>
                  <span className="indicator-value">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No indicators filled</p>
          )}
        </div>

        <div className="submit-notice">
          <span className="notice-icon">ℹ️</span>
          <p>
            Your submission will be sent to PMO for review. You'll be notified once it's approved or if any revisions are needed.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="committee-data-entry">
      <div className="entry-header">
        <h2>{institutionInfo?.icon || '🏢'} Submit Hazard Data</h2>
        <p>Enter indicator values for {institutionInfo?.name || 'your institution'}</p>
      </div>

      {renderStepIndicator()}

      <div className="step-container">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <div className="entry-actions">
        <div>
          {currentStep > 1 && (
            <button className="btn secondary" onClick={handleBack} disabled={isSubmitting}>
              Back
            </button>
          )}
        </div>
        <div>
          {currentStep < 3 && (
            <button className="btn primary" onClick={handleNext}>
              Continue
            </button>
          )}
          {currentStep === 3 && (
            <button
              className="btn submit"
              onClick={handleSubmit}
              disabled={isSubmitting || getFilledIndicatorsCount() === 0}
            >
              {isSubmitting ? 'Submitting...' : `Submit ${getFilledIndicatorsCount()} Indicators`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionDataEntry;
