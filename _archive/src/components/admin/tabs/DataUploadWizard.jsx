/**
 * DATA UPLOAD WIZARD TAB
 * Allows bulk data upload via Excel/CSV templates
 */

import React, { useState, useRef } from 'react';
import { USER_ROLES, INSTITUTIONS } from '../../../services/authService';
import './TabStyles.css';

function DataUploadWizard({ user, onUploadComplete }) {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const uploadTypes = [
    { id: 'hazard', name: 'Hazard Data', icon: '⚠️', description: 'Upload hazard and exposure indicators' },
    { id: 'vulnerability', name: 'Vulnerability Data', icon: '🏚️', description: 'Upload vulnerability indicators' },
    { id: 'coping', name: 'Coping Capacity', icon: '🛡️', description: 'Upload coping capacity indicators' },
    { id: 'full', name: 'Full INFORM Template', icon: '📊', description: 'Upload complete INFORM template' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      validateAndPreview(file);
    }
  };

  const validateAndPreview = (file) => {
    // Mock validation and preview
    setTimeout(() => {
      const mockPreview = {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        rows: 156,
        columns: 12,
        preview: [
          { region: 'Dar es Salaam', indicator: 'Flood Risk', value: 6.8, source: 'TMA' },
          { region: 'Dodoma', indicator: 'Drought Risk', value: 5.2, source: 'TMA' },
          { region: 'Mwanza', indicator: 'Flood Risk', value: 7.1, source: 'MOW' },
          { region: 'Arusha', indicator: 'Earthquake Risk', value: 3.4, source: 'GST' }
        ]
      };
      setPreviewData(mockPreview);

      const mockValidation = {
        valid: true,
        errors: [],
        warnings: [
          { row: 45, message: 'Value 11.2 exceeds maximum scale (10). Will be capped.' },
          { row: 78, message: 'Missing source for indicator. Default source will be used.' }
        ],
        summary: {
          totalRows: 156,
          validRows: 154,
          errorRows: 0,
          warningRows: 2
        }
      };
      setValidationResults(mockValidation);
      setStep(2);
    }, 1000);
  };

  const handleUpload = () => {
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setStep(4);
      if (onUploadComplete) onUploadComplete();
    }, 2000);
  };

  const handleDownloadTemplate = (type) => {
    alert(`Downloading ${type} template...`);
    // In production, this would trigger actual file download
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadType('');
    setPreviewData(null);
    setValidationResults(null);
    setUploading(false);
  };

  return (
    <div className="tab-content data-upload-wizard">
      <div className="tab-header">
        <h3>Data Upload Wizard</h3>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Template</span>
        </div>
        <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Validate Data</span>
        </div>
        <div className={`wizard-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Review & Confirm</span>
        </div>
        <div className={`wizard-step ${step >= 4 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Complete</span>
        </div>
      </div>

      {/* Step 1: Select Template Type */}
      {step === 1 && (
        <div className="wizard-content step-1">
          <div className="template-section">
            <h4>Select Data Type</h4>
            <div className="template-grid">
              {uploadTypes.map(type => (
                <div
                  key={type.id}
                  className={`template-card ${uploadType === type.id ? 'selected' : ''}`}
                  onClick={() => setUploadType(type.id)}
                >
                  <span className="template-icon">{type.icon}</span>
                  <span className="template-name">{type.name}</span>
                  <span className="template-desc">{type.description}</span>
                </div>
              ))}
            </div>
          </div>

          {uploadType && (
            <>
              <div className="download-template">
                <h4>Download Template</h4>
                <p>Download the Excel template for your selected data type:</p>
                <div className="download-buttons">
                  <button
                    className="download-btn"
                    onClick={() => handleDownloadTemplate(uploadType)}
                  >
                    📥 Download Excel Template (.xlsx)
                  </button>
                  <button
                    className="download-btn secondary"
                    onClick={() => handleDownloadTemplate(uploadType + '_csv')}
                  >
                    📥 Download CSV Template
                  </button>
                </div>
              </div>

              <div className="upload-section">
                <h4>Upload Your Data</h4>
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setSelectedFile(file);
                      validateAndPreview(file);
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    hidden
                  />
                  <div className="upload-icon">📤</div>
                  <p>Drag and drop your file here or click to browse</p>
                  <span className="upload-hint">Supported formats: .xlsx, .xls, .csv</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Validate Data */}
      {step === 2 && previewData && validationResults && (
        <div className="wizard-content step-2">
          <div className="file-info">
            <h4>File Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">File Name:</span>
                <span className="info-value">{previewData.fileName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Size:</span>
                <span className="info-value">{previewData.fileSize}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Rows:</span>
                <span className="info-value">{previewData.rows}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Columns:</span>
                <span className="info-value">{previewData.columns}</span>
              </div>
            </div>
          </div>

          <div className="validation-results">
            <h4>Validation Results</h4>
            <div className="validation-summary">
              <div className={`validation-status ${validationResults.valid ? 'valid' : 'invalid'}`}>
                {validationResults.valid ? '✓ Data is valid' : '✕ Validation failed'}
              </div>
              <div className="validation-stats">
                <span className="stat valid">
                  {validationResults.summary.validRows} valid rows
                </span>
                {validationResults.summary.warningRows > 0 && (
                  <span className="stat warning">
                    {validationResults.summary.warningRows} warnings
                  </span>
                )}
                {validationResults.summary.errorRows > 0 && (
                  <span className="stat error">
                    {validationResults.summary.errorRows} errors
                  </span>
                )}
              </div>
            </div>

            {validationResults.warnings.length > 0 && (
              <div className="validation-warnings">
                <h5>Warnings</h5>
                <ul>
                  {validationResults.warnings.map((warning, idx) => (
                    <li key={idx}>
                      <span className="warning-row">Row {warning.row}:</span>
                      <span className="warning-message">{warning.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="data-preview">
            <h4>Data Preview (First 4 rows)</h4>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Indicator</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {previewData.preview.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.region}</td>
                    <td>{row.indicator}</td>
                    <td>{row.value}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wizard-actions">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="btn-primary"
              onClick={() => setStep(3)}
              disabled={!validationResults.valid}
            >
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <div className="wizard-content step-3">
          <div className="review-summary">
            <h4>Review Upload</h4>
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Data Type:</span>
                <span className="summary-value">
                  {uploadTypes.find(t => t.id === uploadType)?.name}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">File:</span>
                <span className="summary-value">{previewData?.fileName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Records:</span>
                <span className="summary-value">{previewData?.rows} rows</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Institution:</span>
                <span className="summary-value">
                  {user?.institution ? INSTITUTIONS[user.institution]?.name : 'PMO-DMD'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Uploaded By:</span>
                <span className="summary-value">{user?.name || 'User'}</span>
              </div>
            </div>
          </div>

          <div className="confirmation-notice">
            <div className="notice-icon">ℹ️</div>
            <p>
              By uploading this data, you confirm that the information is accurate and
              from verified sources. The data will be submitted for PMO review before
              being published to the live system.
            </p>
          </div>

          <div className="wizard-actions">
            <button className="btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div className="wizard-content step-4">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h4>Upload Successful!</h4>
            <p>Your data has been submitted for review.</p>
            <div className="submission-details">
              <p><strong>Submission ID:</strong> SUB-{Date.now()}</p>
              <p><strong>Status:</strong> Pending Review</p>
              <p><strong>Estimated Review Time:</strong> 1-2 business days</p>
            </div>
            <button className="btn-primary" onClick={resetWizard}>
              Upload More Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataUploadWizard;
