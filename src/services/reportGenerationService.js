/**
 * REPORT GENERATION SERVICE
 * Handles PDF and image export for all INFORM Tanzania modules
 * Supports: Warning Bulletins, Risk Reports, Impact Reports, Climate Reports
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PMO Contact Information - Official Details
const PMO_CONTACT_INFO = {
  office: "Prime Minister's Office",
  department: "Disaster Management Department",
  address: "Government City, Mtumba, 40412",
  poBox: "P.O. BOX 980, Dodoma Tanzania",
  email: "ps@pmo.go.tz",
  phone: "+255 26 2322480",
  fax: "+255 26 2324534",
  emergency: "112",
  title: "Permanent Secretary"
};

/**
 * Generate PDF from HTML element
 * @param {HTMLElement} element - The DOM element to convert to PDF
 * @param {string} filename - Output filename (without .pdf extension)
 * @param {object} options - Additional options
 */
export const generatePDFFromElement = async (element, filename = 'report', options = {}) => {
  try {
    console.log('📄 Generating PDF from element...');

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      ...options.html2canvasOptions
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');

    // Handle multi-page if content is too long
    let heightLeft = imgHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(`${filename}.pdf`);
    console.log('✅ PDF generated successfully:', `${filename}.pdf`);

    return true;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

/**
 * Export element as image (PNG)
 * @param {HTMLElement} element - The DOM element to convert to image
 * @param {string} filename - Output filename (without extension)
 * @param {object} options - Additional options
 */
export const exportAsImage = async (element, filename = 'screenshot', options = {}) => {
  try {
    console.log('🖼️ Exporting as image...');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      ...options
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Image exported successfully:', `${filename}.png`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error exporting image:', error);
    throw error;
  }
};

/**
 * Capture map element as image
 * @param {string} mapElementId - ID of map container element
 * @returns {Promise<string>} Base64 image data
 */
const captureMapImage = async (mapElementId = 'leaflet-map-container') => {
  try {
    // Try multiple possible map container selectors
    const selectors = [
      `#${mapElementId}`,
      '.leaflet-container',
      '[class*="map-container"]',
      '.interactive-hazard-map-container .leaflet-container'
    ];

    let mapElement = null;
    for (const selector of selectors) {
      mapElement = document.querySelector(selector);
      if (mapElement) {
        console.log(`📍 Found map using selector: ${selector}`);
        break;
      }
    }

    if (!mapElement) {
      console.warn('⚠️ Map element not found for capture');
      return null;
    }

    console.log('📸 Capturing map image...');
    const canvas = await html2canvas(mapElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: mapElement.offsetWidth,
      height: mapElement.offsetHeight
    });

    const imageData = canvas.toDataURL('image/png');
    console.log('✅ Map image captured successfully');
    return imageData;

  } catch (error) {
    console.error('❌ Error capturing map:', error);
    return null;
  }
};

/**
 * Generate Warning Bulletin PDF with map
 * @param {object} warningData - Warning data object
 * @param {object} riskData - Associated risk data
 * @param {boolean} includeMap - Whether to include map screenshot
 */
export const generateWarningBulletinPDF = async (warningData, riskData = null, includeMap = true) => {
  try {
    console.log('📢 Generating Warning Bulletin PDF...');

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text, size = 12, isBold = false) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPosition);
      yPosition += (lines.length * size * 0.4);
    };

    // Header - Tanzania Coat of Arms & Title
    pdf.setFillColor(33, 150, 243); // Blue header
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UNITED REPUBLIC OF TANZANIA', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(18);
    pdf.text('Prime Minister\'s Office', pageWidth / 2, 25, { align: 'center' });

    pdf.setFontSize(14);
    pdf.text('Disaster Management Department', pageWidth / 2, 33, { align: 'center' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition = 50;

    // Warning Banner
    const warningLevel = warningData.finalStatement || warningData.warningLevel || 'WARNING';
    const bannerColor = warningLevel === 'MAJOR WARNING' ? [244, 67, 54] :
                       warningLevel === 'WARNING' ? [255, 152, 0] :
                       [255, 193, 7];

    pdf.setFillColor(...bannerColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(warningLevel, pageWidth / 2, yPosition + 13, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    yPosition += 30;

    // Bulletin Number & Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const bulletinNo = `BULLETIN NO: PMO-DMD/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    pdf.text(bulletinNo, margin, yPosition);
    pdf.text(`DATE: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;

    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Hazard Information
    addText('HAZARD INFORMATION', 16, true);
    yPosition += 5;

    addText(`Hazard Type: ${warningData.hazardType || 'N/A'}`, 12, false);
    yPosition += 3;

    if (warningData.institution) {
      addText(`Reporting Institution: ${warningData.institution}`, 12, false);
      yPosition += 3;
    }

    if (warningData.severity) {
      addText(`Severity: ${warningData.severity}`, 12, false);
      yPosition += 3;
    }

    yPosition += 5;

    // Affected Areas
    if (warningData.affectedDistricts || warningData.districts) {
      addText('AFFECTED DISTRICTS', 16, true);
      yPosition += 5;

      const districts = warningData.affectedDistricts || warningData.districts || [];
      const districtText = Array.isArray(districts) ? districts.join(', ') : districts;
      addText(districtText, 12, false);
      yPosition += 5;
    }

    // Impact Assessment
    if (warningData.impactLevel) {
      addText('IMPACT ASSESSMENT', 16, true);
      yPosition += 5;

      addText(`Impact Level: ${warningData.impactLevel.value || warningData.impactLevel}`, 12, true);
      yPosition += 3;

      if (warningData.impactLevel.description) {
        addText(warningData.impactLevel.description, 11, false);
        yPosition += 5;
      }
    }

    // Assessment Factors
    if (warningData.assessmentFactors) {
      const { exposure, vulnerability, capacity } = warningData.assessmentFactors;

      if (exposure) {
        addText('Exposure Considerations:', 12, true);
        addText(exposure, 11, false);
        yPosition += 3;
      }

      if (vulnerability) {
        addText('Vulnerability Analysis:', 12, true);
        addText(vulnerability, 11, false);
        yPosition += 3;
      }

      if (capacity) {
        addText('Coping Capacity Assessment:', 12, true);
        addText(capacity, 11, false);
        yPosition += 3;
      }
    }

    // Capture and add map image
    if (includeMap) {
      try {
        const mapImage = await captureMapImage();
        if (mapImage) {
          // Check if we need a new page
          if (yPosition > pageHeight - 150) {
            pdf.addPage();
            yPosition = margin;
          }

          yPosition += 10;
          addText('AFFECTED AREA MAP', 14, true);
          yPosition += 5;

          // Add map image
          const mapWidth = pageWidth - 2 * margin;
          const mapHeight = 100; // Fixed height for map

          pdf.addImage(mapImage, 'PNG', margin, yPosition, mapWidth, mapHeight);
          yPosition += mapHeight + 10;

          console.log('✅ Map image added to PDF');
        }
      } catch (error) {
        console.warn('⚠️ Could not add map to PDF:', error);
      }
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Public Actions
    if (warningData.publicActions && warningData.publicActions.length > 0) {
      addText('PUBLIC ADVISORY - ACTIONS TO TAKE', 16, true);
      yPosition += 5;

      warningData.publicActions.forEach((action, index) => {
        addText(`${index + 1}. ${action.action}`, 11, false);
        yPosition += 2;
      });
      yPosition += 5;
    }

    // Actor Directives
    if (warningData.actorDirectives && warningData.actorDirectives.length > 0) {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      addText('INSTITUTIONAL DIRECTIVES', 16, true);
      yPosition += 5;

      warningData.actorDirectives.forEach((directive, index) => {
        addText(`${directive.actor} - ${directive.role}:`, 12, true);
        yPosition += 2;

        if (directive.actions && directive.actions.length > 0) {
          directive.actions.forEach(action => {
            addText(`  • ${action}`, 11, false);
            yPosition += 2;
          });
        }
        yPosition += 3;
      });
    }

    // Footer - Contact Information (Professional Format)
    if (yPosition > pageHeight - 70) {
      pdf.addPage();
      yPosition = margin;
    }

    const footerY = pageHeight - 60;

    // Separator line
    pdf.setDrawColor(33, 150, 243);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Contact Section Header
    yPosition = footerY + 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(33, 150, 243);
    pdf.text('FOR MORE INFORMATION, CONTACT US:', margin, yPosition);

    // Contact Details
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    yPosition += 5;
    pdf.text(PMO_CONTACT_INFO.title, margin, yPosition);

    pdf.setFont('helvetica', 'normal');
    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.office, margin, yPosition);
    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.department, margin, yPosition);
    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.address, margin, yPosition);
    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.poBox, margin, yPosition);

    // Contact details in right column
    const rightColX = pageWidth / 2 + 10;
    yPosition = footerY + 17;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Email:', rightColX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.email, rightColX + 15, yPosition);

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Phone:', rightColX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.phone, rightColX + 15, yPosition);

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fax:', rightColX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.fax, rightColX + 15, yPosition);

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Emergency:', rightColX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.emergency, rightColX + 15, yPosition);

    // Issued by information
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const issueY = pageHeight - 10;
    pdf.text('Issued by: PMO-DMD Early Warning System', margin, issueY);
    pdf.text(`${new Date().toLocaleString('en-GB')}`, pageWidth - margin, issueY, { align: 'right' });

    // Save PDF
    const filename = `Warning_Bulletin_${warningData.hazardType || 'Alert'}_${new Date().toISOString().split('T')[0]}`;
    pdf.save(`${filename}.pdf`);

    console.log('✅ Warning Bulletin PDF generated:', filename);
    return true;

  } catch (error) {
    console.error('❌ Error generating warning bulletin:', error);
    throw error;
  }
};

/**
 * Generate Risk Assessment Report PDF
 * @param {object} riskData - INFORM risk data
 * @param {string} districtName - Optional district name for district-level reports
 */
export const generateRiskAssessmentPDF = async (riskData, districtName = null) => {
  try {
    console.log('📊 Generating Risk Assessment PDF...');

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header
    pdf.setFillColor(211, 47, 47); // Red for risk
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORM RISK ASSESSMENT REPORT', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(14);
    pdf.text('Tanzania National Risk Profile', pageWidth / 2, 25, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    yPosition = 45;

    // Date
    pdf.setFontSize(10);
    pdf.text(`Report Generated: ${new Date().toLocaleDateString('en-GB')}`, margin, yPosition);
    yPosition += 10;

    // Overall Risk Score
    if (riskData.national) {
      const { risk, hazardExposure, vulnerability, lackCopingCapacity, classification } = riskData.national;

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NATIONAL RISK PROFILE', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(14);
      pdf.text(`Overall Risk Score: ${risk.toFixed(2)}`, margin, yPosition);
      pdf.text(`Risk Level: ${classification.level}`, margin, yPosition + 7);
      yPosition += 20;

      // Risk Formula
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORM Risk Formula: Risk = (H and E × V × LCC)^(1/3)', margin, yPosition);
      yPosition += 10;

      // Dimension Scores
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Hazard and Exposure (H and E): ${hazardExposure.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 7;
      pdf.text(`Vulnerability (V): ${vulnerability.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 7;
      pdf.text(`Lack of Coping Capacity (LCC): ${lackCopingCapacity.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 15;
    }

    // District-level summary
    if (riskData.subnational && riskData.subnational.adm2) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DISTRICT RISK DISTRIBUTION', margin, yPosition);
      yPosition += 10;

      const districts = riskData.subnational.adm2;
      const riskCategories = {
        'Very High': districts.filter(d => d.risk.score >= 6.5).length,
        'High': districts.filter(d => d.risk.score >= 5 && d.risk.score < 6.5).length,
        'Medium': districts.filter(d => d.risk.score >= 3.5 && d.risk.score < 5).length,
        'Low': districts.filter(d => d.risk.score >= 2 && d.risk.score < 3.5).length,
        'Very Low': districts.filter(d => d.risk.score < 2).length
      };

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      Object.entries(riskCategories).forEach(([category, count]) => {
        pdf.text(`${category} Risk: ${count} districts`, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Top 10 highest risk districts
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOP 10 HIGHEST RISK DISTRICTS', margin, yPosition);
      yPosition += 8;

      const topDistricts = [...districts]
        .sort((a, b) => b.risk.score - a.risk.score)
        .slice(0, 10);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      topDistricts.forEach((district, index) => {
        pdf.text(
          `${index + 1}. ${district.name}: ${district.risk.score.toFixed(2)} (${district.risk.class})`,
          margin + 5,
          yPosition
        );
        yPosition += 5;
      });
    }

    // Footer - Contact Information (Professional Format)
    const footerY = pageHeight - 60;

    // Separator line
    pdf.setDrawColor(33, 150, 243);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Contact Section Header
    yPosition = footerY + 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(33, 150, 243);
    pdf.text('FOR MORE INFORMATION, CONTACT US:', margin, yPosition);

    // Left column: Title, Office, Department, Address, PO Box
    yPosition += 8;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text(PMO_CONTACT_INFO.title, margin, yPosition);

    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.office, margin, yPosition);

    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.department, margin, yPosition);

    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.address, margin, yPosition);

    yPosition += 4;
    pdf.text(PMO_CONTACT_INFO.poBox, margin, yPosition);

    // Right column: Email, Phone, Fax, Emergency
    const rightColumnX = pageWidth / 2 + 10;
    yPosition = footerY + 15;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Email:', rightColumnX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.email, rightColumnX + 15, yPosition);

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Phone:', rightColumnX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.phone, rightColumnX + 15, yPosition);

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fax:', rightColumnX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.fax, rightColumnX + 15, yPosition);

    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Emergency:', rightColumnX, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(PMO_CONTACT_INFO.emergency, rightColumnX + 15, yPosition);

    // Bottom line - Issued by
    yPosition = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Issued by INFORM Tanzania Platform | ${new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );

    // Save
    const filename = districtName
      ? `Risk_Assessment_${districtName}_${new Date().toISOString().split('T')[0]}`
      : `Risk_Assessment_Tanzania_${new Date().toISOString().split('T')[0]}`;
    pdf.save(`${filename}.pdf`);

    console.log('✅ Risk Assessment PDF generated:', filename);
    return true;

  } catch (error) {
    console.error('❌ Error generating risk assessment:', error);
    throw error;
  }
};

/**
 * Generate Vulnerability Assessment Report PDF
 * @param {object} vulnerabilityData - Vulnerability assessment data
 * @param {string} districtName - District name (optional)
 */
export const generateVulnerabilityReportPDF = async (vulnerabilityData, districtName = null) => {
  try {
    console.log('🛡️ Generating Vulnerability Assessment PDF...');

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Helper function
    const addText = (text, size = 12, isBold = false) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPosition);
      yPosition += (lines.length * size * 0.4);
    };

    // Header
    pdf.setFillColor(156, 39, 176); // Purple for vulnerability
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VULNERABILITY ASSESSMENT REPORT', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(14);
    const title = districtName ? `${districtName} District Analysis` : 'Tanzania National Profile';
    pdf.text(title, pageWidth / 2, 25, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    yPosition = 45;

    // Date & Metadata
    addText(`Report Generated: ${new Date().toLocaleDateString('en-GB')}`, 10);
    yPosition += 5;

    // Vulnerability Score
    if (vulnerabilityData.score !== undefined) {
      addText('VULNERABILITY INDEX', 16, true);
      yPosition += 5;

      addText(`Score: ${vulnerabilityData.score.toFixed(2)} / 10`, 14, true);
      addText(`Classification: ${vulnerabilityData.classification || 'N/A'}`, 12);
      yPosition += 10;
    }

    // Footer - Contact Information
    const footerY = pdf.internal.pageSize.getHeight() - 40;
    pdf.setDrawColor(156, 39, 176);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    let contactY = footerY + 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(156, 39, 176);
    pdf.text('CONTACT:', margin, contactY);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    contactY += 4;
    pdf.text(`${PMO_CONTACT_INFO.department}, ${PMO_CONTACT_INFO.poBox}`, margin, contactY);
    contactY += 3.5;
    pdf.text(`${PMO_CONTACT_INFO.email} | ${PMO_CONTACT_INFO.phone}`, margin, contactY);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin, footerY + 6, { align: 'right' });

    // Save
    const filename = districtName
      ? `Vulnerability_Assessment_${districtName}_${new Date().toISOString().split('T')[0]}`
      : `Vulnerability_Assessment_Tanzania_${new Date().toISOString().split('T')[0]}`;
    pdf.save(`${filename}.pdf`);

    console.log('✅ Vulnerability report generated:', filename);
    return true;

  } catch (error) {
    console.error('❌ Error generating vulnerability report:', error);
    throw error;
  }
};

/**
 * Generate Adaptive Capacity Report PDF
 * @param {object} capacityData - Adaptive capacity data
 * @param {string} districtName - District name (optional)
 */
export const generateAdaptiveCapacityReportPDF = async (capacityData, districtName = null) => {
  try {
    console.log('🏛️ Generating Adaptive Capacity Report PDF...');

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    const addText = (text, size = 12, isBold = false) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPosition);
      yPosition += (lines.length * size * 0.4);
    };

    // Header
    pdf.setFillColor(76, 175, 80); // Green for capacity
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADAPTIVE CAPACITY ASSESSMENT', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(14);
    const title = districtName ? `${districtName} District` : 'Tanzania National';
    pdf.text(title, pageWidth / 2, 25, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    yPosition = 45;

    // Metadata
    addText(`Assessment Date: ${new Date().toLocaleDateString('en-GB')}`, 10);
    yPosition += 10;

    // Capacity Score
    if (capacityData.score !== undefined) {
      addText('ADAPTIVE CAPACITY INDEX', 16, true);
      yPosition += 5;

      addText(`Score: ${capacityData.score.toFixed(2)} / 10`, 14, true);
      addText(`Capacity Level: ${capacityData.level || 'N/A'}`, 12);
      yPosition += 10;
    }

    // Footer - Contact Information
    const footerY = pdf.internal.pageSize.getHeight() - 40;
    pdf.setDrawColor(76, 175, 80);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    let contactY = footerY + 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(76, 175, 80);
    pdf.text('CONTACT:', margin, contactY);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    contactY += 4;
    pdf.text(`${PMO_CONTACT_INFO.department}, ${PMO_CONTACT_INFO.poBox}`, margin, contactY);
    contactY += 3.5;
    pdf.text(`${PMO_CONTACT_INFO.email} | ${PMO_CONTACT_INFO.phone}`, margin, contactY);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin, footerY + 6, { align: 'right' });

    // Save
    const filename = districtName
      ? `Adaptive_Capacity_${districtName}_${new Date().toISOString().split('T')[0]}`
      : `Adaptive_Capacity_Tanzania_${new Date().toISOString().split('T')[0]}`;
    pdf.save(`${filename}.pdf`);

    console.log('✅ Adaptive capacity report generated:', filename);
    return true;

  } catch (error) {
    console.error('❌ Error generating adaptive capacity report:', error);
    throw error;
  }
};

export default {
  generatePDFFromElement,
  exportAsImage,
  generateWarningBulletinPDF,
  generateRiskAssessmentPDF,
  generateVulnerabilityReportPDF,
  generateAdaptiveCapacityReportPDF
};
