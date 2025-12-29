/**
 * REPORT GENERATION SERVICE
 * Handles PDF and image export for all INFORM Tanzania modules
 * Supports: Warning Bulletins, Risk Reports, Impact Reports, Climate Reports
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { logBulletinGenerated } from './auditService';

// PMO Contact Information - Official Details
const PMO_CONTACT_INFO = {
  office: "Prime Minister's Office",
  department: "Disaster Management Department",
  address: "Government City, Mtumba, 40412",
  poBox: "P.O. BOX 980, Dodoma Tanzania",
  email: "ps@pmo.go.tz",
  phone: "+255 26 2322480",
  fax: "+255 26 2324534",
  emergency: "190",  // National Emergency Number
  title: "Permanent Secretary"
};

// Hazard Type Icons for PDF reports with colors
const HAZARD_ICONS = {
  'Heavy Rainfall': { icon: '🌧️', color: '#2196F3' },
  'Strong Winds': { icon: '💨', color: '#607D8B' },
  'Large Waves': { icon: '🌊', color: '#00BCD4' },
  'Flash Floods': { icon: '🌊', color: '#0288D1' },
  'Riverine Floods': { icon: '🌊', color: '#03A9F4' },
  'Dry Spells': { icon: '☀️', color: '#FF9800' },
  'Drought': { icon: '🏜️', color: '#8D6E63' },
  'Agrometeorological Drought': { icon: '🌾', color: '#8D6E63' },
  'Extreme Temperature': { icon: '🌡️', color: '#F44336' },
  'Extreme Temperature (Hot)': { icon: '🔥', color: '#F44336' },
  'Extreme Temperature (Cold)': { icon: '❄️', color: '#2196F3' },
  'Heatwave': { icon: '🔥', color: '#F44336' },
  'Cold Wave': { icon: '❄️', color: '#2196F3' },
  'Epidemics': { icon: '🦠', color: '#E91E63' },
  'Disease Outbreak': { icon: '🏥', color: '#F44336' },
  'Health-Related Hazards': { icon: '⚕️', color: '#D32F2F' },
  'Crop Stress': { icon: '🌱', color: '#A1887F' },
  'Pest Infestation': { icon: '🐛', color: '#795548' },
  'Livestock Disease': { icon: '🐄', color: '#6D4C41' },
  'Earthquake': { icon: '🌍', color: '#5D4037' },
  'Tsunami': { icon: '🌊', color: '#01579B' },
  'Volcanic Activity': { icon: '🌋', color: '#BF360C' },
  'Landslide': { icon: '⛰️', color: '#4E342E' },
  'Wildfire': { icon: '🔥', color: '#FF5722' },
  'Cyclone': { icon: '🌀', color: '#673AB7' },
  'Rising Water Levels': { icon: '📈', color: '#00ACC1' },
  'Dam Level Alert': { icon: '🚧', color: '#0097A7' },
  'Seismic Activity': { icon: '📊', color: '#3E2723' }
};

/**
 * Get hazard icon and color for PDF display
 * @param {string} hazardType - The hazard type name
 * @returns {object} Object with icon emoji and color
 */
const getHazardIconData = (hazardType) => {
  return HAZARD_ICONS[hazardType] || { icon: '⚠️', color: '#FF9800' };
};

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color code
 * @returns {array} RGB array [r, g, b]
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 152, 0];
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
 * SUPER ROBUST Map Capture with Multiple Fallback Strategies
 * @param {string} mapElementId - ID of map container element
 * @returns {Promise<string>} Base64 image data
 */
const captureMapImage = async (mapElementId = 'leaflet-map-container') => {
  try {
    console.log('🗺️🗺️🗺️ SUPER ROBUST MAP CAPTURE STARTING...');

    // STRATEGY 1: Wait for map to fully render and complete 5-stage EXTREME Tanzania bounds fit
    console.log('⏰ Waiting 4.5 seconds for map rendering and 5-stage EXTREME Tanzania bounds fit...');
    await new Promise(resolve => setTimeout(resolve, 4500));

    // STRATEGY 2: Try multiple possible map container selectors with priority
    const selectors = [
      '#pdf-map-container .leaflet-container', // HIGHEST PRIORITY: Hidden map for PDF generation
      '#pdf-map-container', // Hidden map container itself
      '#hazard-map-container .leaflet-container', // Primary: New explicit ID
      '.leaflet-container', // Secondary: Direct leaflet container
      '#hazard-map-container', // Tertiary: Container itself
      '.interactive-hazard-map-container .leaflet-container',
      '.interactive-hazard-map-container',
      `#${mapElementId}`,
      '[class*="map-container"]',
      '.hazard-map-view .leaflet-container',
      '#map-container'
    ];

    console.log('🔍 Searching for map with', selectors.length, 'different selectors...');

    let mapElement = null;
    let foundSelector = '';

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`  Testing: "${selector}" - Found ${elements.length} element(s)`);

      if (elements.length > 0) {
        // If multiple elements, choose the largest visible one
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const hasContent = el.offsetWidth > 100 && el.offsetHeight > 100;

          console.log(`    Element ${i}: ${el.offsetWidth}x${el.offsetHeight}px, visible: ${isVisible}, hasContent: ${hasContent}`);

          if (isVisible && hasContent) {
            mapElement = el;
            foundSelector = selector;
            break;
          }
        }

        if (mapElement) break;
      }
    }

    if (!mapElement) {
      console.error('❌ MAP NOT FOUND! Diagnostic info:');
      console.log('  Total .leaflet-container:', document.querySelectorAll('.leaflet-container').length);
      console.log('  Total [class*="map"]:', document.querySelectorAll('[class*="map"]').length);
      console.log('  Total [id*="map"]:', document.querySelectorAll('[id*="map"]').length);

      // List all potential map elements
      const allMaps = document.querySelectorAll('[class*="map"], [id*="map"]');
      allMaps.forEach((el, idx) => {
        console.log(`  Candidate ${idx}: class="${el.className}", id="${el.id}", size=${el.offsetWidth}x${el.offsetHeight}`);
      });

      return null;
    }

    console.log(`✅✅ MAP FOUND using: "${foundSelector}"`);
    console.log(`📐 Dimensions: ${mapElement.offsetWidth}x${mapElement.offsetHeight}px`);

    // STRATEGY 3: Scroll map into view and ensure visibility
    console.log('👀 Ensuring map is visible...');
    mapElement.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for scroll

    // Check dimensions again
    const rect = mapElement.getBoundingClientRect();
    console.log(`📏 After scroll - BoundingRect: ${rect.width}x${rect.height}, Offset: ${mapElement.offsetWidth}x${mapElement.offsetHeight}`);

    if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
      console.error('❌ Map has ZERO dimensions! Cannot capture.');
      return null;
    }

    // STRATEGY 4: Force map tiles to load by waiting for images
    console.log('🖼️ Checking for map tiles...');
    const images = mapElement.querySelectorAll('img');
    console.log(`  Found ${images.length} images in map`);

    // Wait for images to load
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if some tiles fail
        setTimeout(resolve, 2000); // Max 2s wait per image
      });
    });

    await Promise.all(imagePromises);
    console.log('✅ All map tiles loaded (or timed out)');

    // STRATEGY 5: Multiple capture attempts with different settings
    let canvas = null;
    const captureConfigs = [
      // Config 1: High quality, strict CORS
      {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight
      },
      // Config 2: Allow taint for cross-origin images
      {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight
      },
      // Config 3: Lower quality, maximum compatibility
      {
        scale: 1,
        useCORS: false,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight
      }
    ];

    for (let i = 0; i < captureConfigs.length; i++) {
      try {
        console.log(`📸 Capture attempt ${i + 1}/${captureConfigs.length} with config:`, captureConfigs[i]);
        canvas = await html2canvas(mapElement, captureConfigs[i]);

        if (canvas && canvas.width > 0 && canvas.height > 0) {
          console.log(`✅ Capture successful with config ${i + 1}! Canvas: ${canvas.width}x${canvas.height}px`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Capture attempt ${i + 1} failed:`, err.message);
        if (i === captureConfigs.length - 1) throw err; // Rethrow on last attempt
      }
    }

    if (!canvas) {
      console.error('❌ All capture attempts failed!');
      return null;
    }

    // Convert to base64
    const imageData = canvas.toDataURL('image/png');
    const sizeKB = (imageData.length / 1024).toFixed(2);
    console.log(`✅✅✅ MAP CAPTURED SUCCESSFULLY!`);
    console.log(`  Canvas: ${canvas.width}x${canvas.height}px`);
    console.log(`  Data size: ${sizeKB} KB`);
    console.log(`  Data preview: ${imageData.substring(0, 50)}...`);

    return imageData;

  } catch (error) {
    console.error('❌❌❌ CATASTROPHIC MAP CAPTURE ERROR:', error);
    console.error('Stack:', error.stack);
    return null;
  }
};

/**
 * Load image as base64 for PDF embedding
 */
const loadImageAsBase64 = async (imagePath) => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load image:', error);
    return null;
  }
};

/**
 * Generate Warning Bulletin PDF with map - PROFESSIONAL BULLETIN VERSION
 * @param {object} warningData - Warning data object
 * @param {object} riskData - Associated risk data
 * @param {boolean} includeMap - Whether to include map screenshot
 */
export const generateWarningBulletinPDF = async (warningData, riskData = null, includeMap = true, previewWindow = null) => {
  try {
    console.log('📢 Generating Professional Warning Bulletin PDF...');

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Professional color palette
    const COLORS = {
      primaryBlue: [0, 82, 147],      // Deep government blue
      secondaryBlue: [41, 128, 185],  // Lighter blue
      accentGold: [212, 175, 55],     // Gold accent
      darkText: [33, 33, 33],
      lightGray: [248, 249, 250],
      mediumGray: [158, 158, 158],
      // Warning colors - refined
      majorWarning: [198, 40, 40],    // Deep red
      warning: [230, 126, 34],        // Orange
      advisory: [241, 196, 15],       // Gold/Yellow
      monitor: [39, 174, 96]          // Green
    };

    // Helper function to add text with word wrap
    const addText = (text, size = 12, isBold = false, x = margin) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      pdf.text(lines, x, yPosition);
      yPosition += (lines.length * size * 0.4);
    };

    // Helper to get warning color RGB - refined palette
    const getWarningColorRGB = (level) => {
      const levelUpper = (level || '').toUpperCase();
      if (levelUpper.includes('MAJOR')) return COLORS.majorWarning;
      if (levelUpper === 'WARNING') return COLORS.warning;
      if (levelUpper === 'ADVISORY') return COLORS.advisory;
      return COLORS.monitor;
    };

    // ========== COMPACT PROFESSIONAL HEADER WITH COAT OF ARMS ==========
    // Top accent bar with gold stripe (reduced)
    pdf.setFillColor(...COLORS.primaryBlue);
    pdf.rect(0, 0, pageWidth, 4, 'F');
    pdf.setFillColor(...COLORS.accentGold);
    pdf.rect(0, 4, pageWidth, 1.5, 'F');

    // Main header background - compact
    pdf.setFillColor(...COLORS.primaryBlue);
    pdf.rect(0, 5.5, pageWidth, 32, 'F');

    // Load and add Coat of Arms (smaller)
    let logoLoaded = false;
    try {
      const logoBase64 = await loadImageAsBase64('/urt-coat-of-arms.jpeg');
      if (logoBase64) {
        // White circle background for logo
        pdf.setFillColor(255, 255, 255);
        pdf.circle(22, 21.5, 12, 'F');
        // Add logo (smaller)
        pdf.addImage(logoBase64, 'JPEG', 10, 10, 24, 24);
        logoLoaded = true;
      }
    } catch (e) {
      console.warn('Logo load failed, using fallback');
    }

    // If logo failed, use text fallback
    if (!logoLoaded) {
      pdf.setFillColor(255, 255, 255);
      pdf.circle(22, 21.5, 10, 'F');
      pdf.setFontSize(6);
      pdf.setTextColor(...COLORS.primaryBlue);
      pdf.setFont('helvetica', 'bold');
      pdf.text('URT', 22, 23, { align: 'center' });
    }

    // Government text - centered on page
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UNITED REPUBLIC OF TANZANIA', pageWidth / 2, 13, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text("PRIME MINISTER'S OFFICE", pageWidth / 2, 21, { align: 'center' });

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Disaster Management Department (DMD)', pageWidth / 2, 28, { align: 'center' });

    // Emergency badge - compact
    pdf.setFillColor(...COLORS.majorWarning);
    pdf.roundedRect(pageWidth - 38, 10, 28, 18, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMERGENCY', pageWidth - 24, 16, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text('190', pageWidth - 24, 24, { align: 'center' });

    // Bottom gold accent line
    pdf.setFillColor(...COLORS.accentGold);
    pdf.rect(0, 37.5, pageWidth, 1.5, 'F');

    // Reset text color
    pdf.setTextColor(...COLORS.darkText);
    yPosition = 42;

    // ========== WARNING BANNER ==========
    const warningLevel = warningData.finalStatement || warningData.warningLevel || 'WARNING';
    const bannerColor = getWarningColorRGB(warningLevel);

    // Warning level banner - compact
    pdf.setFillColor(...bannerColor);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, 'F');

    // Warning text - adjusted for compact banner with improved font
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EARLY WARNING BULLETIN', pageWidth / 2, yPosition + 8, { align: 'center' });

    pdf.setTextColor(...COLORS.darkText);
    yPosition += 16;

    // ========== COMPACT BULLETIN METADATA ==========
    // Clean reference box with gold accent
    pdf.setFillColor(...COLORS.lightGray);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, 'F');
    pdf.setFillColor(...COLORS.accentGold);
    pdf.rect(margin, yPosition, 3, 12, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.primaryBlue);
    const bulletinNo = `BULLETIN REF: PMO-DMD/EW/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`;
    pdf.text(bulletinNo, margin + 6, yPosition + 5);

    pdf.setTextColor(...COLORS.darkText);
    pdf.setFont('helvetica', 'normal');
    const issueDate = new Date();
    pdf.text(`Issued: ${issueDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 6, yPosition + 10);

    // Valid until - on right side
    const validUntil = warningData.validUntil || new Date(Date.now() + 48 * 60 * 60 * 1000);
    pdf.setTextColor(...COLORS.majorWarning);
    pdf.setFont('helvetica', 'bold');
    // Format Valid Until with date and time (24-hour format)
    const validUntilDate = new Date(validUntil);
    const validDay = String(validUntilDate.getDate()).padStart(2, '0');
    const validMonth = validUntilDate.toLocaleDateString('en-GB', { month: 'short' });
    const validYear = validUntilDate.getFullYear();
    // Format time in 24-hour format
    const validHours = String(validUntilDate.getHours()).padStart(2, '0');
    const validMinutes = String(validUntilDate.getMinutes()).padStart(2, '0');
    pdf.text(`Valid Until: ${validDay} ${validMonth} ${validYear}, ${validHours}:${validMinutes}`, pageWidth - margin - 5, yPosition + 7, { align: 'right' });

    pdf.setTextColor(...COLORS.darkText);
    yPosition += 16;

    // ========== AFFECTED AREAS SECTION (COMPACT) ==========
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(...COLORS.primaryBlue);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    pdf.text('AREAS TO BE AFFECTED', margin + 5, yPosition + 5.5);
    pdf.setTextColor(...COLORS.darkText);
    yPosition += 11;

    // Get districts from various possible sources
    const districts = warningData.spatialExtent || warningData.affectedDistricts || warningData.districts || [];
    const districtWarningLevels = warningData.districtWarningLevels || {};
    const selectedRegions = warningData.selectedRegions || [];

    // Summary statistics
    const districtsByLevel = {
      'MAJOR WARNING': [],
      'WARNING': [],
      'ADVISORY': [],
      'MONITOR': []
    };

    districts.forEach(district => {
      const level = (districtWarningLevels[district] || warningLevel || 'ADVISORY').toUpperCase();
      if (level.includes('MAJOR')) {
        districtsByLevel['MAJOR WARNING'].push(district);
      } else if (level === 'WARNING') {
        districtsByLevel['WARNING'].push(district);
      } else if (level === 'ADVISORY') {
        districtsByLevel['ADVISORY'].push(district);
      } else {
        districtsByLevel['MONITOR'].push(district);
      }
    });

    // Regions affected - compact display with blue indicator
    if (selectedRegions.length > 0) {
      pdf.setFillColor(...COLORS.primaryBlue);
      pdf.circle(margin + 4, yPosition - 0.5, 2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.primaryBlue);
      pdf.text(`Regions (${selectedRegions.length}):`, margin + 8, yPosition);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.darkText);
      const regionText = selectedRegions.join(', ');
      const regionLines = pdf.splitTextToSize(regionText, pageWidth - 2 * margin - 42);
      pdf.text(regionLines, margin + 42, yPosition);
      yPosition += regionLines.length * 4 + 3;
    }

    // Districts - compact simple list (no level grouping)
    if (districts.length > 0) {
      pdf.setFillColor(...COLORS.warning);
      pdf.circle(margin + 4, yPosition - 0.5, 2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.warning);
      pdf.text(`Districts (${districts.length}):`, margin + 8, yPosition);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.darkText);
      const districtText = districts.join(', ');
      const districtLines = pdf.splitTextToSize(districtText, pageWidth - 2 * margin - 42);
      pdf.text(districtLines, margin + 42, yPosition);
      yPosition += districtLines.length * 4 + 3;
    }

    yPosition += 2;

    // ========== COMPACT MAP SECTION (LEFT) & HAZARD INFO (RIGHT) ==========
    const sectionStartY = yPosition;
    const halfWidth = (pageWidth - 2 * margin - 6) / 2;

    // MAP ON LEFT - compact header with improved font
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(...COLORS.monitor);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPosition, halfWidth, 7, 1, 1, 'F');
    pdf.text('AFFECTED AREA MAP', margin + 4, yPosition + 5);
    pdf.setTextColor(...COLORS.darkText);

    let mapImage = null;
    const mapY = yPosition + 8;
    const mapHeight = 55; // Increased for better visibility

    if (includeMap) {
      try {
        mapImage = await captureMapImage();
        if (mapImage) {
          pdf.setDrawColor(...COLORS.primaryBlue);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin, mapY, halfWidth, mapHeight, 2, 2, 'S');
          pdf.addImage(mapImage, 'PNG', margin + 1, mapY + 1, halfWidth - 2, mapHeight - 2);
        }
      } catch (error) {
        console.error('❌ Could not add map to PDF:', error);
      }
    }

    // HAZARD DETAILS ON RIGHT - compact header with improved font
    const rightSectionX = margin + halfWidth + 6;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(...COLORS.warning);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(rightSectionX, sectionStartY, halfWidth, 7, 1, 1, 'F');
    pdf.text('HAZARD DETAILS', rightSectionX + 4, sectionStartY + 5);
    pdf.setTextColor(...COLORS.darkText);

    let infoY = sectionStartY + 12;
    pdf.setFontSize(11);

    // Helper for consistent row layout - all values aligned at same X position
    const labelStartX = rightSectionX + 3;
    const valueStartX = rightSectionX + 40; // Fixed position for all values

    // Hazard Type Row
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.primaryBlue);
    pdf.text('Hazard Type:', labelStartX, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.darkText);
    pdf.text(warningData.hazardType || 'N/A', valueStartX, infoY);
    infoY += 7;

    // Collaboration with Row
    if (warningData.institution) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.primaryBlue);
      pdf.text('Collaboration:', labelStartX, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.darkText);
      pdf.text(warningData.institution, valueStartX, infoY);
      infoY += 7;
    }

    // Likelihood Level Row (was Confidence)
    if (warningData.confidence) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.primaryBlue);
      pdf.text('Likelihood:', labelStartX, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.darkText);
      pdf.text(warningData.confidence, valueStartX, infoY);
      infoY += 7;
    }

    // Severity Row
    if (warningData.severity) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.primaryBlue);
      pdf.text('Severity:', labelStartX, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.darkText);
      pdf.text(warningData.severity, valueStartX, infoY);
      infoY += 7;
    }

    // Impact Level - with prominent aligned box
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.primaryBlue);
    pdf.text('Impact Level:', labelStartX, infoY);

    // Create a prominent badge box aligned with other values
    const levelColor = getWarningColorRGB(warningLevel);
    const badgeWidth = halfWidth - 44;
    const badgeHeight = 10;
    const badgeY = infoY - 6;

    // Draw border around the badge for clarity
    pdf.setDrawColor(...levelColor);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(valueStartX, badgeY, badgeWidth, badgeHeight, 2, 2, 'S');

    // Fill the badge with warning color
    pdf.setFillColor(...levelColor);
    pdf.roundedRect(valueStartX + 0.5, badgeY + 0.5, badgeWidth - 1, badgeHeight - 1, 1.5, 1.5, 'F');

    // Add the warning level text centered in the badge
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(warningLevel, valueStartX + badgeWidth / 2, infoY + 0.5, { align: 'center' });

    yPosition = Math.max(mapY + mapHeight + 3, infoY + 10);

    // ========== SIDE-BY-SIDE: PUBLIC ADVISORY (LEFT) & INSTITUTIONAL DIRECTIVES (RIGHT) ==========
    const hasPublicActions = warningData.publicActions && warningData.publicActions.length > 0;
    const hasDirectives = warningData.actorDirectives && warningData.actorDirectives.length > 0;

    if (hasPublicActions || hasDirectives) {
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        yPosition = margin;
      }

      const advisorySectionY = yPosition;
      const colWidth = (pageWidth - 2 * margin - 6) / 2;
      const rightColX = margin + colWidth + 6;

      // ===== LEFT COLUMN: PUBLIC ADVISORY =====
      if (hasPublicActions) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(...COLORS.monitor);
        pdf.setTextColor(255, 255, 255);
        pdf.roundedRect(margin, advisorySectionY, colWidth, 8, 1, 1, 'F');
        pdf.text('PUBLIC ADVISORY', margin + 4, advisorySectionY + 5.5);
        pdf.setTextColor(...COLORS.darkText);

        let leftY = advisorySectionY + 12;
        pdf.setFontSize(10);

        warningData.publicActions.forEach((action) => {
          const actionText = action.instruction || action.action || action;
          const category = action.category || '';

          if (category) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...COLORS.primaryBlue);
            pdf.text(`${category}:`, margin + 2, leftY);
            leftY += 4;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...COLORS.darkText);
            const lines = pdf.splitTextToSize(actionText, colWidth - 8);
            pdf.text(lines, margin + 2, leftY);
            leftY += lines.length * 4 + 2.5;
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...COLORS.darkText);
            const lines = pdf.splitTextToSize(`• ${actionText}`, colWidth - 6);
            pdf.text(lines, margin + 2, leftY);
            leftY += lines.length * 4 + 2;
          }
        });

        yPosition = Math.max(yPosition, leftY);
      }

      // ===== RIGHT COLUMN: INSTITUTIONAL DIRECTIVES =====
      if (hasDirectives) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(...COLORS.secondaryBlue);
        pdf.setTextColor(255, 255, 255);
        pdf.roundedRect(rightColX, advisorySectionY, colWidth, 8, 1, 1, 'F');
        pdf.text('INSTITUTIONAL DIRECTIVES', rightColX + 4, advisorySectionY + 5.5);
        pdf.setTextColor(...COLORS.darkText);

        let rightY = advisorySectionY + 12;
        pdf.setFontSize(10);

        warningData.actorDirectives.forEach((directive) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...COLORS.primaryBlue);
          pdf.text(`${directive.actor}:`, rightColX + 2, rightY);
          pdf.setTextColor(...COLORS.darkText);
          rightY += 4;

          pdf.setFont('helvetica', 'normal');
          if (directive.actions && directive.actions.length > 0) {
            directive.actions.forEach(action => {
              const lines = pdf.splitTextToSize(`• ${action}`, colWidth - 8);
              pdf.text(lines, rightColX + 4, rightY);
              rightY += lines.length * 4 + 1.5;
            });
          }
          rightY += 2;
        });

        yPosition = Math.max(yPosition, rightY);
      }

      yPosition += 3;
    }

    // ========== HAZARD ICONS LEGEND SECTION ==========
    // Check if we have drawn hazard icons to display
    const drawnShapes = warningData.drawnShapes || [];
    const hazardIconShapes = drawnShapes.filter(shape => shape.type === 'hazardIcon');
    const hasHazardIcons = hazardIconShapes.length > 0 || warningData.hazardType;

    if (hasHazardIcons) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Section header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(156, 39, 176); // Purple for hazard icons
      pdf.setTextColor(255, 255, 255);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
      pdf.text('HAZARD INDICATORS ON MAP', margin + 4, yPosition + 5.5);
      pdf.setTextColor(...COLORS.darkText);
      yPosition += 12;

      // Primary hazard type (always show)
      if (warningData.hazardType) {
        const primaryHazard = getHazardIconData(warningData.hazardType);
        const primaryColor = hexToRgb(primaryHazard.color);

        // Draw hazard icon circle
        pdf.setFillColor(...primaryColor);
        pdf.circle(margin + 8, yPosition + 2, 6, 'F');
        pdf.setFillColor(255, 255, 255);
        pdf.circle(margin + 8, yPosition + 2, 5, 'F');
        pdf.setFillColor(...primaryColor);
        pdf.circle(margin + 8, yPosition + 2, 4, 'F');

        // Hazard text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text(`${primaryHazard.icon} ${warningData.hazardType}`, margin + 18, yPosition + 3);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...COLORS.darkText);
        pdf.text('(Primary Hazard)', margin + 18 + pdf.getTextWidth(`${primaryHazard.icon} ${warningData.hazardType}`) + 3, yPosition + 3);

        yPosition += 10;
      }

      // Additional hazard icons placed on map
      if (hazardIconShapes.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...COLORS.primaryBlue);
        pdf.text('Additional Hazard Markers Placed:', margin + 2, yPosition);
        yPosition += 5;

        // Group icons by hazard type
        const iconsByType = {};
        hazardIconShapes.forEach(shape => {
          const type = shape.hazardType || 'Unknown';
          if (!iconsByType[type]) {
            iconsByType[type] = { count: 0, positions: [] };
          }
          iconsByType[type].count++;
          if (shape.position) {
            iconsByType[type].positions.push(shape.position);
          }
        });

        // Render each hazard type
        Object.entries(iconsByType).forEach(([hazardType, data]) => {
          const hazardInfo = getHazardIconData(hazardType);
          const iconColor = hexToRgb(hazardInfo.color);

          // Draw small icon indicator
          pdf.setFillColor(...iconColor);
          pdf.circle(margin + 6, yPosition + 1, 3, 'F');

          // Hazard type and count
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(...COLORS.darkText);
          pdf.text(`${hazardInfo.icon} ${hazardType}: ${data.count} marker${data.count > 1 ? 's' : ''}`, margin + 12, yPosition + 2);

          yPosition += 6;
        });

        yPosition += 3;
      }

      // Legend note
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Note: Hazard icons indicate specific locations of concern within affected areas.', margin + 2, yPosition);
      yPosition += 8;
    }

    // ========== COMPACT FOOTER ==========
    // Check if we need to add a page for footer (reduced threshold)
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
    }

    const footerStartY = pageHeight - 24;

    // Footer separator - gold accent (thinner)
    pdf.setFillColor(...COLORS.accentGold);
    pdf.rect(0, footerStartY, pageWidth, 1.5, 'F');
    pdf.setFillColor(...COLORS.primaryBlue);
    pdf.rect(0, footerStartY + 1.5, pageWidth, 0.5, 'F');

    // Footer background (compact)
    pdf.setFillColor(...COLORS.lightGray);
    pdf.rect(0, footerStartY + 2, pageWidth, 22, 'F');

    // Left column - Issued By section (compact)
    let footerY = footerStartY + 6;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.primaryBlue);
    pdf.text('ISSUED BY:', margin, footerY);

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    footerY += 3.5;
    pdf.text('Emergency Operation Communication Center (EOCC)', margin, footerY);
    pdf.setFont('helvetica', 'normal');
    footerY += 3;
    pdf.text(`${PMO_CONTACT_INFO.office} - ${PMO_CONTACT_INFO.department}`, margin, footerY);
    footerY += 2.5;
    pdf.text(`${PMO_CONTACT_INFO.address} | ${PMO_CONTACT_INFO.poBox}`, margin, footerY);

    // Right column - Contact details (compact, single line format)
    const rightColX = pageWidth - margin - 70;
    footerY = footerStartY + 6;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.primaryBlue);
    pdf.text('CONTACT:', rightColX, footerY);

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(7);
    footerY += 3.5;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Email: ${PMO_CONTACT_INFO.email}`, rightColX, footerY);
    footerY += 3;
    pdf.text(`Phone: ${PMO_CONTACT_INFO.phone} | Fax: ${PMO_CONTACT_INFO.fax}`, rightColX, footerY);
    footerY += 2.5;
    pdf.text('Web: www.pmo.go.tz', rightColX, footerY);

    // Bottom bar with timestamp centered (thinner)
    pdf.setFillColor(...COLORS.primaryBlue);
    pdf.rect(0, pageHeight - 5, pageWidth, 5, 'F');

    // Format timestamp with leading zeros for hours
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedTimestamp = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Bulletin Generated: ${formattedTimestamp}`, pageWidth / 2, pageHeight - 1.5, { align: 'center' });

    // Generate filename
    const filename = `Warning_Bulletin_${warningData.hazardType || 'Alert'}_${new Date().toISOString().split('T')[0]}`;

    // Check if preview mode
    if (warningData._previewMode || previewWindow) {
      // Generate PDF blob and display in preview window
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (previewWindow) {
        // Use the pre-opened window (avoids popup blocker)
        previewWindow.location.href = pdfUrl;
        previewWindow.focus();
      } else {
        // Fallback: try to open new window (may be blocked)
        window.open(pdfUrl, '_blank');
      }

      console.log('📄 Bulletin preview opened in new tab');
      return { preview: true, url: pdfUrl };
    }

    // Save PDF
    pdf.save(`${filename}.pdf`);

    // Log to audit trail
    logBulletinGenerated(warningData, 'PDF');

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

      // Helper to get risk score (handles both number and object structures)
      const getRiskScore = (d) => {
        if (typeof d.risk === 'number') return d.risk;
        if (d.risk && typeof d.risk.score === 'number') return d.risk.score;
        return 0;
      };

      // Helper to get risk class
      const getRiskClass = (score) => {
        if (score >= 6.5) return 'Very High';
        if (score >= 5) return 'High';
        if (score >= 3.5) return 'Medium';
        if (score >= 2) return 'Low';
        return 'Very Low';
      };

      const riskCategories = {
        'Very High': districts.filter(d => getRiskScore(d) >= 6.5).length,
        'High': districts.filter(d => getRiskScore(d) >= 5 && getRiskScore(d) < 6.5).length,
        'Medium': districts.filter(d => getRiskScore(d) >= 3.5 && getRiskScore(d) < 5).length,
        'Low': districts.filter(d => getRiskScore(d) >= 2 && getRiskScore(d) < 3.5).length,
        'Very Low': districts.filter(d => getRiskScore(d) < 2).length
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
        .sort((a, b) => getRiskScore(b) - getRiskScore(a))
        .slice(0, 10);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      topDistricts.forEach((district, index) => {
        const score = getRiskScore(district);
        const districtName = district.name || district.admin?.adm2Name || 'Unknown';
        const riskClass = district.risk?.class || getRiskClass(score);
        pdf.text(
          `${index + 1}. ${districtName}: ${score.toFixed(2)} (${riskClass})`,
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

    // Date and Metadata
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

/**
 * Helper function to load image as base64 for PDF
 * @param {string} url - URL of the image to load
 * @returns {Promise<string|null>} Base64 image data or null if failed
 */
const loadImageForPDF = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load image:', error);
    return null;
  }
};

/**
 * Generate Hazard Input Report PDF
 * For institutions (TMA, MoW, MoH, MoA, GST) to export their hazard submissions
 * @param {object} hazardData - Hazard input data from institution
 * @param {object} options - Additional options
 */
export const generateHazardInputPDF = async (hazardData, options = {}) => {
  try {
    console.log('📋 Generating Hazard Input Report PDF...');

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 0;

    // Institution colors
    const INSTITUTION_COLORS = {
      TMA: [33, 150, 243],    // Blue
      MoW: [3, 169, 244],     // Light Blue
      MoH: [244, 67, 54],     // Red
      MoA: [139, 195, 74],    // Light Green
      GST: [121, 85, 72]      // Brown
    };

    // Institution logos (public folder paths)
    const INSTITUTION_LOGOS = {
      TMA: '/tmalogo.png',
      MoW: null,  // Add path when available
      MoH: null,  // Add path when available
      MoA: null,  // Add path when available
      GST: null   // Add path when available
    };

    // Warning level colors
    const WARNING_COLORS = {
      'Advisory': [255, 255, 0],      // Yellow
      'Warning': [255, 102, 0],       // Orange
      'Major Warning': [255, 0, 0]    // Red
    };

    const institutionColor = INSTITUTION_COLORS[hazardData.institution] || [33, 150, 243];
    const warningColor = WARNING_COLORS[hazardData.warningLevel] || [255, 152, 0];

    // Try to load institution logo
    const logoPath = INSTITUTION_LOGOS[hazardData.institution];
    let logoImage = null;
    if (logoPath) {
      console.log(`📷 Loading ${hazardData.institution} logo...`);
      logoImage = await loadImageForPDF(logoPath);
    }

    // ========== HEADER SECTION ==========
    // Institution-colored header bar
    pdf.setFillColor(...institutionColor);
    pdf.rect(0, 0, pageWidth, 38, 'F');

    // Logo or fallback circle
    if (logoImage) {
      // Draw white background circle for logo
      pdf.setFillColor(255, 255, 255);
      pdf.circle(22, 19, 11, 'F');
      // Add the logo image
      try {
        pdf.addImage(logoImage, 'PNG', 11, 8, 22, 22);
        console.log('✅ Logo added to PDF');
      } catch (imgError) {
        console.warn('Could not add logo image:', imgError);
        // Fallback to text
        pdf.setFontSize(6);
        pdf.setTextColor(...institutionColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(hazardData.institution || 'TMA', 22, 21, { align: 'center' });
      }
    } else {
      // Fallback: White circle with institution abbreviation
      pdf.setFillColor(255, 255, 255);
      pdf.circle(22, 19, 10, 'F');
      pdf.setFontSize(6);
      pdf.setTextColor(...institutionColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(hazardData.institution || 'TMA', 22, 21, { align: 'center' });
    }

    // Header text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UNITED REPUBLIC OF TANZANIA', pageWidth / 2, 12, { align: 'center' });

    pdf.setFontSize(10);
    pdf.text(hazardData.institutionName || 'Technical Institution', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Weather Alert Briefing to PMO-DMD', pageWidth / 2, 28, { align: 'center' });

    // Report type badge
    pdf.setFillColor(...warningColor);
    pdf.roundedRect(pageWidth - 40, 10, 30, 16, 2, 2, 'F');
    pdf.setTextColor(hazardData.warningLevel === 'Advisory' ? 0 : 255, hazardData.warningLevel === 'Advisory' ? 0 : 255, hazardData.warningLevel === 'Advisory' ? 0 : 255);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('HAZARD', pageWidth - 25, 16, { align: 'center' });
    pdf.text('INPUT', pageWidth - 25, 21, { align: 'center' });

    yPosition = 44;

    // ========== REPORT TITLE BANNER ==========
    pdf.setFillColor(...warningColor);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, 'F');
    pdf.setTextColor(hazardData.warningLevel === 'Advisory' ? 0 : 255, hazardData.warningLevel === 'Advisory' ? 0 : 255, hazardData.warningLevel === 'Advisory' ? 0 : 255);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WEATHER ALERT BRIEFING TO PMO-DMD', pageWidth / 2, yPosition + 8, { align: 'center' });
    yPosition += 18;

    // ========== METADATA SECTION ==========
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 14, 2, 2, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reference:', margin + 4, yPosition + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const refNumber = `HI-${hazardData.institution}-${Date.now().toString().slice(-8)}`;
    pdf.text(refNumber, margin + 24, yPosition + 5);

    // Issue date
    pdf.setFont('helvetica', 'normal');
    const issueDate = new Date(hazardData.issuedAt || Date.now());
    pdf.text(`Submitted: ${issueDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 4, yPosition + 11);

    // Forecast day indicator
    if (hazardData.forecastDay) {
      const forecastLabel = hazardData.forecastDay === 1 ? 'Today' : hazardData.forecastDay === 2 ? 'Tomorrow' : `Day ${hazardData.forecastDay}`;
      pdf.setTextColor(...institutionColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Forecast: ${forecastLabel}`, pageWidth - margin - 4, yPosition + 8, { align: 'right' });
    }

    yPosition += 20;

    // ========== HAZARD DETAILS SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(...institutionColor);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    pdf.text('HAZARD INFORMATION', margin + 4, yPosition + 5.5);
    yPosition += 12;

    // Hazard details grid
    const detailsStartY = yPosition;
    const halfWidth = (pageWidth - 2 * margin - 6) / 2;

    // Left column - Hazard details
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);

    const addDetailRow = (label, value, x, y) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...institutionColor);
      pdf.text(`${label}:`, x, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      pdf.text(value || 'N/A', x + 35, y);
    };

    addDetailRow('Hazard Type', hazardData.hazardType, margin + 2, yPosition);
    yPosition += 6;

    addDetailRow('Institution', `${hazardData.institution} - ${hazardData.institutionName}`, margin + 2, yPosition);
    yPosition += 6;

    addDetailRow('Warning Level', hazardData.warningLevel, margin + 2, yPosition);
    yPosition += 6;

    addDetailRow('Likelihood', hazardData.likelihood || 'High', margin + 2, yPosition);
    yPosition += 6;

    if (hazardData.quantitativeValue) {
      addDetailRow('Intensity', `${hazardData.quantitativeValue}`, margin + 2, yPosition);
      yPosition += 6;
    }

    // Temperature type for Extreme Temperature
    if (hazardData.hazardType === 'Extreme Temperature' && hazardData.temperatureType) {
      addDetailRow('Type', `${hazardData.temperatureType === 'Hot' ? '🔥 Extreme Heat' : '❄️ Extreme Cold'}`, margin + 2, yPosition);
      yPosition += 6;
    }

    yPosition += 4;

    // ========== VALIDITY PERIOD SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(255, 152, 0);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    pdf.text('VALIDITY PERIOD', margin + 4, yPosition + 5.5);
    yPosition += 12;

    const validityStart = hazardData.temporalValidity?.start ? new Date(hazardData.temporalValidity.start) : new Date();
    const validityEnd = hazardData.temporalValidity?.end ? new Date(hazardData.temporalValidity.end) : new Date(Date.now() + 48 * 60 * 60 * 1000);

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);

    // Format dates with 24-hour time
    const formatDateTime = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleDateString('en-GB', { month: 'short' });
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 152, 0);
    pdf.text('From:', margin + 2, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(formatDateTime(validityStart), margin + 18, yPosition);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 152, 0);
    pdf.text('Until:', margin + 80, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(formatDateTime(validityEnd), margin + 96, yPosition);

    yPosition += 10;

    // ========== AFFECTED AREAS SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(76, 175, 80);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    pdf.text('AFFECTED AREAS', margin + 4, yPosition + 5.5);
    yPosition += 12;

    const districts = hazardData.spatialExtent || [];
    const districtWarningLevels = hazardData.districtWarningLevels || {};
    const regions = hazardData.regions || [];

    // Regions
    if (regions.length > 0) {
      pdf.setFillColor(33, 150, 243);
      pdf.circle(margin + 4, yPosition - 0.5, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(33, 150, 243);
      pdf.text(`Regions (${regions.length}):`, margin + 8, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const regionText = regions.join(', ');
      const regionLines = pdf.splitTextToSize(regionText, pageWidth - 2 * margin - 42);
      pdf.text(regionLines, margin + 40, yPosition);
      yPosition += regionLines.length * 4 + 4;
    }

    // Districts with warning levels
    if (districts.length > 0) {
      pdf.setFillColor(255, 152, 0);
      pdf.circle(margin + 4, yPosition - 0.5, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 152, 0);
      pdf.text(`Districts (${districts.length}):`, margin + 8, yPosition);
      yPosition += 5;

      // Group districts by warning level
      const districtsByLevel = { 'Major Warning': [], 'Warning': [], 'Advisory': [] };
      districts.forEach(district => {
        const level = districtWarningLevels[district] || 'Advisory';
        if (districtsByLevel[level]) {
          districtsByLevel[level].push(district);
        }
      });

      pdf.setFontSize(9);
      Object.entries(districtsByLevel).forEach(([level, levelDistricts]) => {
        if (levelDistricts.length > 0) {
          const levelColor = WARNING_COLORS[level] || [255, 152, 0];
          pdf.setFillColor(...levelColor);
          pdf.circle(margin + 8, yPosition - 0.5, 1.5, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...levelColor);
          pdf.text(`${level} (${levelDistricts.length}):`, margin + 12, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          const districtText = levelDistricts.join(', ');
          const districtLines = pdf.splitTextToSize(districtText, pageWidth - 2 * margin - 55);
          pdf.text(districtLines, margin + 50, yPosition);
          yPosition += districtLines.length * 4 + 3;
        }
      });
    }

    yPosition += 4;

    // ========== ADDITIONAL INFORMATION SECTION ==========
    if (hazardData.additionalInfo && hazardData.additionalInfo.trim()) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(156, 39, 176);
      pdf.setTextColor(255, 255, 255);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
      pdf.text('ADDITIONAL INFORMATION', margin + 4, yPosition + 5.5);
      yPosition += 12;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const infoLines = pdf.splitTextToSize(hazardData.additionalInfo, pageWidth - 2 * margin - 4);
      pdf.text(infoLines, margin + 2, yPosition);
      yPosition += infoLines.length * 4 + 4;
    }

    // ========== SIMULATION MODE INDICATOR ==========
    if (hazardData.isSimulation) {
      pdf.setFillColor(255, 193, 7);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('🎯 SIMULATION MODE - This is a test scenario, not a real hazard alert', pageWidth / 2, yPosition + 7, { align: 'center' });
      yPosition += 16;
    }

    // ========== FOOTER SECTION ==========
    const footerStartY = pageHeight - 35;

    // Footer separator
    pdf.setFillColor(...institutionColor);
    pdf.rect(0, footerStartY, pageWidth, 2, 'F');

    // Footer background
    pdf.setFillColor(250, 250, 250);
    pdf.rect(0, footerStartY + 2, pageWidth, 33, 'F');

    // Footer content
    let footerY = footerStartY + 10;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...institutionColor);
    pdf.text('SUBMITTED TO:', margin, footerY);

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    footerY += 5;
    pdf.text("Prime Minister's Office - Disaster Management Department (PMO-DMD)", margin, footerY);
    pdf.setFont('helvetica', 'normal');
    footerY += 4;
    pdf.text('Emergency Operation Communication Center (EOCC)', margin, footerY);
    footerY += 3.5;
    pdf.text(`${PMO_CONTACT_INFO.poBox} | ${PMO_CONTACT_INFO.email}`, margin, footerY);

    // Right side - Source info
    const rightColX = pageWidth - margin - 60;
    footerY = footerStartY + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...institutionColor);
    pdf.text('SOURCE:', rightColX, footerY);

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);
    footerY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text(hazardData.institutionName || 'Technical Institution', rightColX, footerY);
    pdf.setFont('helvetica', 'normal');
    footerY += 4;
    pdf.text(hazardData.source || 'Official Submission', rightColX, footerY);

    // Bottom bar with timestamp
    pdf.setFillColor(...institutionColor);
    pdf.rect(0, pageHeight - 7, pageWidth, 7, 'F');

    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Report Generated: ${timestamp}`, pageWidth / 2, pageHeight - 2.5, { align: 'center' });

    // Generate filename
    const filename = `Hazard_Input_${hazardData.institution}_${hazardData.hazardType?.replace(/\s+/g, '_') || 'Alert'}_${new Date().toISOString().split('T')[0]}`;

    // Save PDF
    pdf.save(`${filename}.pdf`);

    console.log('✅ Hazard Input Report PDF generated:', filename);
    return true;

  } catch (error) {
    console.error('❌ Error generating hazard input report:', error);
    throw error;
  }
};

export default {
  generatePDFFromElement,
  exportAsImage,
  generateWarningBulletinPDF,
  generateRiskAssessmentPDF,
  generateVulnerabilityReportPDF,
  generateAdaptiveCapacityReportPDF,
  generateHazardInputPDF
};
