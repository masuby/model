/**
 * REPORT EXPORT BUTTON COMPONENT
 * Multi-format export button for warning bulletins and reports
 * Supports: PDF, PNG, Excel
 */

import React, { useState } from 'react';
import {
  generateWarningBulletinPDF,
  generateRiskAssessmentPDF,
  generateHazardInputPDF,
  generatePDFFromElement,
  exportAsImage
} from '../../../services/reportGenerationService';

const ReportExportButton = ({
  reportType = 'warning', // 'warning', 'risk', 'hazard', 'custom'
  reportData = null,
  elementId = null, // ID of element to export if reportType is 'custom'
  buttonStyle = 'primary', // 'primary', 'secondary', 'compact'
  buttonText = 'Export Report',
  disabled = false,
  onExportComplete = null
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format) => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    setShowDropdown(false);

    // IMPORTANT: Open preview window IMMEDIATELY on user click to avoid popup blocker
    // This must happen synchronously before any await calls
    let previewWindow = null;
    if (format === 'preview') {
      previewWindow = window.open('', '_blank');
      if (previewWindow) {
        // Show loading message while PDF generates
        previewWindow.document.write(`
          <html>
            <head><title>Generating Bulletin Preview...</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:Arial,sans-serif;background:#f5f5f5;">
              <div style="text-align:center;">
                <div style="font-size:48px;margin-bottom:20px;">📄</div>
                <h2 style="color:#1976D2;margin-bottom:10px;">Generating Bulletin Preview</h2>
                <p style="color:#666;">Please wait while the PDF is being created...</p>
                <div style="margin-top:20px;width:200px;height:4px;background:#e0e0e0;border-radius:2px;overflow:hidden;">
                  <div style="width:100%;height:100%;background:linear-gradient(90deg,#1976D2,#42A5F5,#1976D2);animation:loading 1.5s infinite;background-size:200% 100%;"></div>
                </div>
                <style>@keyframes loading{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>
              </div>
            </body>
          </html>
        `);
      }
    }

    try {
      console.log(`📤 ${format === 'preview' ? 'Previewing' : 'Exporting'} ${reportType} report...`);

      switch (reportType) {
        case 'warning':
          if (format === 'preview') {
            // Preview bulletin in new tab - pass the pre-opened window
            await generateWarningBulletinPDF({ ...reportData, _previewMode: true }, null, true, previewWindow);
          } else if (format === 'pdf') {
            // Generate bulletin with enhanced publication-ready map
            await generateWarningBulletinPDF(reportData, null, true);
          } else if (format === 'png' && elementId) {
            const element = document.getElementById(elementId);
            if (element) {
              await exportAsImage(element, `warning_bulletin_${Date.now()}`);
            } else {
              throw new Error('Element not found for image export');
            }
          }
          break;

        case 'risk':
          if (format === 'pdf') {
            await generateRiskAssessmentPDF(reportData);
          } else if (format === 'png' && elementId) {
            const element = document.getElementById(elementId);
            if (element) {
              await exportAsImage(element, `risk_assessment_${Date.now()}`);
            }
          }
          break;

        case 'hazard':
          if (format === 'pdf') {
            await generateHazardInputPDF(reportData);
          } else if (format === 'png' && elementId) {
            const element = document.getElementById(elementId);
            if (element) {
              await exportAsImage(element, `hazard_input_${Date.now()}`);
            }
          }
          break;

        case 'custom':
          if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
              if (format === 'pdf') {
                await generatePDFFromElement(element, `report_${Date.now()}`);
              } else if (format === 'png') {
                await exportAsImage(element, `report_${Date.now()}`);
              }
            } else {
              throw new Error('Element not found');
            }
          }
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      if (onExportComplete) {
        onExportComplete(format);
      }

      console.log(`✅ ${format === 'preview' ? 'Preview' : 'Export'} completed successfully`);

    } catch (error) {
      console.error('❌ Export failed:', error);
      // Close preview window if it was opened and there's an error
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonClass = () => {
    const baseClass = 'report-export-button';
    if (buttonStyle === 'compact') return `${baseClass} compact`;
    if (buttonStyle === 'secondary') return `${baseClass} secondary`;
    return baseClass;
  };

  return (
    <div className="report-export-container" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={getButtonClass()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        disabled={disabled || isExporting}
        style={{
          background: buttonStyle === 'primary'
            ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
            : buttonStyle === 'secondary'
            ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
            : '#666',
          color: 'white',
          border: 'none',
          padding: buttonStyle === 'compact' ? '8px 16px' : '12px 24px',
          borderRadius: '8px',
          fontSize: buttonStyle === 'compact' ? '13px' : '14px',
          fontWeight: '700',
          cursor: disabled || isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          opacity: disabled || isExporting ? 0.6 : 1
        }}
      >
        <span style={{ fontSize: '18px' }}>
          {isExporting ? '⏳' : '📄'}
        </span>
        <span>{isExporting ? 'Exporting...' : buttonText}</span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {showDropdown && !isExporting && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown menu */}
          <div
            className="export-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              border: '2px solid #E0E0E0',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              minWidth: '200px',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '12px 16px',
              borderBottom: '2px solid #F5F5F5',
              background: '#FAFAFA',
              fontWeight: '700',
              fontSize: '13px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Export Options
            </div>

            {/* Preview Option - Only for warning bulletins */}
            {reportType === 'warning' && (
              <button
                type="button"
                className="export-option"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleExport('preview');
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1565C0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  borderBottom: '2px solid #90CAF9'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'}
              >
                <span style={{ fontSize: '20px' }}>👁️</span>
                <div style={{ flex: 1 }}>
                  <div>Preview Bulletin</div>
                  <div style={{ fontSize: '11px', color: '#1976D2', fontWeight: '500' }}>
                    View before downloading
                  </div>
                </div>
              </button>
            )}

            <button
              type="button"
              className="export-option"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExport('pdf');
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: 'none',
                background: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s ease',
                borderBottom: '1px solid #F5F5F5'
              }}
              onMouseEnter={(e) => e.target.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <span style={{ fontSize: '20px' }}>📑</span>
              <div style={{ flex: 1 }}>
                <div>PDF Document</div>
                <div style={{ fontSize: '11px', color: '#999', fontWeight: '500' }}>
                  Professional report format
                </div>
              </div>
            </button>

            <button
              type="button"
              className="export-option"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExport('png');
              }}
              disabled={!elementId}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: 'none',
                background: elementId ? 'white' : '#F9F9F9',
                textAlign: 'left',
                cursor: elementId ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                color: elementId ? '#333' : '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s ease',
                opacity: elementId ? 1 : 0.6
              }}
              onMouseEnter={(e) => elementId && (e.target.style.background = '#F5F5F5')}
              onMouseLeave={(e) => elementId && (e.target.style.background = 'white')}
            >
              <span style={{ fontSize: '20px' }}>🖼️</span>
              <div style={{ flex: 1 }}>
                <div>PNG Image</div>
                <div style={{ fontSize: '11px', color: '#999', fontWeight: '500' }}>
                  High-quality screenshot
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .report-export-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
        }

        .report-export-button:not(:disabled):active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .export-dropdown {
            right: auto;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportExportButton;
