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
 * Draw Tanzania map with district colors and hazard icons directly on canvas (fallback method)
 * @param {Object} districtWarningLevels - Object mapping district names to warning levels
 * @param {Array} drawnShapes - Array of hazard icons/shapes to draw on map
 * @param {string} primaryHazardType - The main hazard type for coloring icons
 * @returns {Promise<string>} Base64 image data
 */
const drawTanzaniaMapCanvas = async (districtWarningLevels = {}, drawnShapes = [], primaryHazardType = null) => {
  try {
    console.log('🎨 Drawing Tanzania map on canvas...');
    console.log(`  Districts: ${Object.keys(districtWarningLevels).length}, Icons: ${drawnShapes?.length || 0}`);

    // Fetch GeoJSON data
    const response = await fetch('/tanzania-districts-simplified.geojson');
    if (!response.ok) {
      console.error('Could not load GeoJSON');
      return null;
    }
    const geoJson = await response.json();

    // Create canvas
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 700;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#e8f4ea';
    ctx.fillRect(0, 0, width, height);

    // Tanzania bounds (approximate)
    const bounds = {
      minLng: 29.34,
      maxLng: 40.44,
      minLat: -11.75,
      maxLat: -0.99
    };

    // Convert lat/lng to canvas coordinates
    const toCanvasX = (lng) => ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - 40) + 20;
    const toCanvasY = (lat) => ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (height - 40) + 20;

    // Warning colors
    const warningColors = {
      'Advisory': '#FFFF00',
      'Warning': '#FF6600',
      'Major Warning': '#FF0000'
    };

    // Draw each district
    if (geoJson.features) {
      geoJson.features.forEach(feature => {
        const districtName = feature.properties?.District || feature.properties?.name || '';
        const warningLevel = districtWarningLevels[districtName];
        const fillColor = warningLevel ? warningColors[warningLevel] : '#d4edda';

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = '#2d5016';
        ctx.lineWidth = 0.5;

        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
          drawPolygon(ctx, geometry.coordinates[0], toCanvasX, toCanvasY);
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            drawPolygon(ctx, polygon[0], toCanvasX, toCanvasY);
          });
        }
      });
    }

    // Draw hazard icons on the map
    const hazardIcons = drawnShapes?.filter(s => s.type === 'hazardIcon') || [];
    if (hazardIcons.length > 0) {
      console.log(`🎯 Drawing ${hazardIcons.length} hazard icons on canvas...`);

      hazardIcons.forEach((shape, idx) => {
        if (shape.position && shape.position.lat && shape.position.lng) {
          const x = toCanvasX(shape.position.lng);
          const y = toCanvasY(shape.position.lat);

          // Get icon color based on hazard type
          const hazardInfo = getHazardIconData(shape.hazardType || primaryHazardType);
          const iconColor = hazardInfo.color;

          // Draw outer circle (colored)
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fillStyle = iconColor;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw inner white circle
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();

          // Draw colored center
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = iconColor;
          ctx.fill();

          console.log(`  Icon ${idx + 1}: ${shape.hazardType || 'unknown'} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        }
      });
    }

    // Add title
    ctx.fillStyle = '#1565C0';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TANZANIA - Affected Areas', width / 2, 25);

    // Add legend
    const legendY = height - 50;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    Object.entries(warningColors).forEach(([level, color], idx) => {
      const x = 20 + idx * 150;
      ctx.fillStyle = color;
      ctx.fillRect(x, legendY, 20, 15);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(x, legendY, 20, 15);
      ctx.fillStyle = '#333';
      ctx.fillText(level, x + 25, legendY + 12);
    });

    // Add hazard icon indicator if there are icons
    if (hazardIcons.length > 0) {
      const iconLegendX = width - 180;
      ctx.fillStyle = '#9C27B0';
      ctx.beginPath();
      ctx.arc(iconLegendX, legendY + 7, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillText(`Hazard Markers (${hazardIcons.length})`, iconLegendX + 15, legendY + 12);
    }

    const imageData = canvas.toDataURL('image/png');
    console.log('✅ Canvas map drawn successfully');
    return imageData;

  } catch (error) {
    console.error('❌ Canvas map drawing failed:', error);
    return null;
  }
};

// Helper to draw a polygon on canvas
const drawPolygon = (ctx, coordinates, toCanvasX, toCanvasY) => {
  if (!coordinates || coordinates.length === 0) return;

  ctx.beginPath();
  coordinates.forEach((coord, idx) => {
    const x = toCanvasX(coord[0]);
    const y = toCanvasY(coord[1]);
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

/**
 * IMPROVED Map Capture - Optimized for Leaflet maps
 * @param {Object} districtWarningLevels - Optional district warning levels for fallback drawing
 * @param {Array} drawnShapes - Optional hazard icons/shapes for fallback drawing
 * @param {string} hazardType - Optional primary hazard type for icon coloring
 * @returns {Promise<string>} Base64 image data
 */
const captureMapImage = async (districtWarningLevels = null, drawnShapes = null, hazardType = null) => {
  try {
    console.log('🗺️ Starting map capture...');

    // Short wait for any pending renders
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find the leaflet container - this is the actual map element
    const selectors = [
      '#hazard-map-container .leaflet-container',
      '.interactive-hazard-map-container .leaflet-container',
      '.leaflet-container'
    ];

    let mapElement = null;
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        mapElement = el;
        console.log(`✅ Found map: ${selector} (${el.offsetWidth}x${el.offsetHeight})`);
        break;
      }
    }

    if (!mapElement) {
      console.error('❌ Map element not found');
      // Debug: list all elements
      document.querySelectorAll('[class*="leaflet"], [class*="map"]').forEach((el, i) => {
        console.log(`  ${i}: ${el.className} - ${el.offsetWidth}x${el.offsetHeight}`);
      });
      return null;
    }

    // Ensure map is in viewport
    mapElement.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));

    // Wait for tile images to load
    const tileImages = mapElement.querySelectorAll('.leaflet-tile-loaded, .leaflet-tile');
    console.log(`📍 Found ${tileImages.length} map tiles`);

    // Force all tiles to be visible
    tileImages.forEach(tile => {
      tile.style.opacity = '1';
      tile.style.visibility = 'visible';
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture with html2canvas - use ignoreElements to skip problematic elements
    console.log('📸 Capturing with html2canvas...');

    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#e8f4ea', // Light green background for Tanzania
      scale: 1.5,
      logging: true, // Enable logging for debugging
      imageTimeout: 5000,
      removeContainer: true,
      ignoreElements: (element) => {
        // Skip elements that might cause issues
        const className = element.className || '';
        if (typeof className === 'string') {
          if (className.includes('leaflet-control') ||
              className.includes('leaflet-attribution') ||
              className.includes('map-controls') ||
              className.includes('drawing-tools')) {
            return true;
          }
        }
        return false;
      },
      onclone: (clonedDoc, element) => {
        // Make sure cloned element has proper dimensions
        element.style.width = mapElement.offsetWidth + 'px';
        element.style.height = mapElement.offsetHeight + 'px';

        // Force visibility on all tiles in clone
        element.querySelectorAll('.leaflet-tile, .leaflet-tile-loaded, img').forEach(tile => {
          tile.style.opacity = '1';
          tile.style.visibility = 'visible';
          tile.crossOrigin = 'anonymous';
        });

        // Make overlays visible
        element.querySelectorAll('.leaflet-overlay-pane, .leaflet-marker-pane').forEach(pane => {
          pane.style.opacity = '1';
          pane.style.visibility = 'visible';
        });
      }
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.error('❌ Canvas is empty');
      return null;
    }

    const imageData = canvas.toDataURL('image/png');
    console.log(`✅ Map captured: ${canvas.width}x${canvas.height}px, ${(imageData.length / 1024).toFixed(0)}KB`);

    return imageData;

  } catch (error) {
    console.error('❌ Map capture error:', error);

    // FALLBACK 1: Try to capture just the SVG overlay layer
    try {
      console.log('🔄 Trying fallback 1: capture SVG overlay...');
      const svgOverlay = document.querySelector('.leaflet-overlay-pane svg');
      if (svgOverlay) {
        const svgData = new XMLSerializer().serializeToString(svgOverlay);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e8f4ea';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(url);
        const imageData = canvas.toDataURL('image/png');
        console.log('✅ Fallback SVG capture successful');
        return imageData;
      }
    } catch (fallbackError) {
      console.error('❌ SVG fallback failed:', fallbackError);
    }

    // FALLBACK 2: Draw map directly from GeoJSON with icons
    if (districtWarningLevels || drawnShapes) {
      console.log('🔄 Trying fallback 2: draw map from GeoJSON...');
      const canvasMap = await drawTanzaniaMapCanvas(districtWarningLevels || {}, drawnShapes || [], hazardType);
      if (canvasMap) {
        return canvasMap;
      }
    }

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
        mapImage = await captureMapImage(warningData.districtWarningLevels, warningData.drawnShapes, warningData.hazardType);
        if (mapImage) {
          pdf.setDrawColor(...COLORS.primaryBlue);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin, mapY, halfWidth, mapHeight, 2, 2, 'S');
          pdf.addImage(mapImage, 'PNG', margin + 1, mapY + 1, halfWidth - 2, mapHeight - 2);

          // Draw hazard icons as overlay on the map
          const drawnShapesForMap = warningData.drawnShapes || [];
          const hazardIconsOnMap = drawnShapesForMap.filter(shape => shape.type === 'hazardIcon');

          if (hazardIconsOnMap.length > 0) {
            console.log(`🎯 Drawing ${hazardIconsOnMap.length} hazard icons on PDF map...`);

            // Tanzania approximate bounds for coordinate mapping
            const tanzaniaBounds = {
              minLat: -11.75,
              maxLat: -0.99,
              minLng: 29.34,
              maxLng: 40.44
            };

            // Map dimensions in PDF
            const pdfMapX = margin + 1;
            const pdfMapY = mapY + 1;
            const pdfMapWidth = halfWidth - 2;
            const pdfMapHeight = mapHeight - 2;

            hazardIconsOnMap.forEach((shape, idx) => {
              if (shape.position && shape.position.lat && shape.position.lng) {
                // Convert lat/lng to PDF coordinates
                const latRange = tanzaniaBounds.maxLat - tanzaniaBounds.minLat;
                const lngRange = tanzaniaBounds.maxLng - tanzaniaBounds.minLng;

                const xPercent = (shape.position.lng - tanzaniaBounds.minLng) / lngRange;
                const yPercent = 1 - ((shape.position.lat - tanzaniaBounds.minLat) / latRange); // Invert Y

                const iconX = pdfMapX + (xPercent * pdfMapWidth);
                const iconY = pdfMapY + (yPercent * pdfMapHeight);

                // Get hazard color
                const hazardInfo = getHazardIconData(shape.hazardType || warningData.hazardType);
                const iconColor = hexToRgb(hazardInfo.color);

                // Draw icon marker (outer circle)
                pdf.setFillColor(...iconColor);
                pdf.circle(iconX, iconY, 3, 'F');

                // Draw white inner circle
                pdf.setFillColor(255, 255, 255);
                pdf.circle(iconX, iconY, 2, 'F');

                // Draw colored center dot
                pdf.setFillColor(...iconColor);
                pdf.circle(iconX, iconY, 1.2, 'F');

                console.log(`  Icon ${idx + 1}: (${shape.position.lat.toFixed(2)}, ${shape.position.lng.toFixed(2)}) -> PDF (${iconX.toFixed(1)}, ${iconY.toFixed(1)})`);
              }
            });

            // Add small legend for icon markers
            pdf.setFontSize(6);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100);
            pdf.text(`${hazardIconsOnMap.length} hazard marker(s)`, margin + 2, mapY + mapHeight - 2);
          }
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

    // ========== MAP SECTION ==========
    // Capture and display the hazard map with selected districts and icons
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(76, 175, 80);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    pdf.text('HAZARD MAP', margin + 4, yPosition + 5.5);
    yPosition += 12;

    // Try to capture the map (pass districtWarningLevels for fallback canvas drawing)
    let mapImage = null;
    try {
      console.log('🗺️ Capturing hazard map for PDF...');
      mapImage = await captureMapImage(hazardData.districtWarningLevels, hazardData.drawnShapes, hazardData.hazardType);

      if (mapImage) {
        const mapHeight = 80; // Height for map in PDF
        pdf.setDrawColor(...institutionColor);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, mapHeight, 2, 2, 'S');
        pdf.addImage(mapImage, 'PNG', margin + 1, yPosition + 1, pageWidth - 2 * margin - 2, mapHeight - 2);

        // Draw hazard icons as overlay on the map (if any)
        const drawnShapesForMap = hazardData.drawnShapes || [];
        const hazardIconsOnMap = drawnShapesForMap.filter(shape => shape.type === 'hazardIcon');

        if (hazardIconsOnMap.length > 0) {
          console.log(`🎯 Drawing ${hazardIconsOnMap.length} hazard icons on PDF map...`);

          // Tanzania approximate bounds for coordinate mapping
          const tanzaniaBounds = {
            minLat: -11.75,
            maxLat: -0.99,
            minLng: 29.34,
            maxLng: 40.44
          };

          // Map dimensions in PDF
          const pdfMapX = margin + 1;
          const pdfMapY = yPosition + 1;
          const pdfMapWidth = pageWidth - 2 * margin - 2;
          const pdfMapHeight = mapHeight - 2;

          hazardIconsOnMap.forEach((shape, idx) => {
            if (shape.position && shape.position.lat && shape.position.lng) {
              // Convert lat/lng to PDF coordinates
              const latRange = tanzaniaBounds.maxLat - tanzaniaBounds.minLat;
              const lngRange = tanzaniaBounds.maxLng - tanzaniaBounds.minLng;

              const xPercent = (shape.position.lng - tanzaniaBounds.minLng) / lngRange;
              const yPercent = 1 - ((shape.position.lat - tanzaniaBounds.minLat) / latRange);

              const iconX = pdfMapX + (xPercent * pdfMapWidth);
              const iconY = pdfMapY + (yPercent * pdfMapHeight);

              // Get hazard color
              const hazardInfo = getHazardIconData(shape.hazardType || hazardData.hazardType);
              const iconColor = hexToRgb(hazardInfo.color);

              // Draw icon marker (outer circle with white center)
              pdf.setFillColor(...iconColor);
              pdf.circle(iconX, iconY, 4, 'F');
              pdf.setFillColor(255, 255, 255);
              pdf.circle(iconX, iconY, 2.5, 'F');
              pdf.setFillColor(...iconColor);
              pdf.circle(iconX, iconY, 1.5, 'F');

              console.log(`  Icon ${idx + 1}: (${shape.position.lat.toFixed(2)}, ${shape.position.lng.toFixed(2)}) -> PDF (${iconX.toFixed(1)}, ${iconY.toFixed(1)})`);
            }
          });
        }

        yPosition += mapHeight + 4;
        console.log('✅ Map added to hazard input PDF');
      } else {
        // Show placeholder message if map capture failed
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 2, 2, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Map capture not available', pageWidth / 2, yPosition + 16, { align: 'center' });
        yPosition += 34;
        console.log('⚠️ Map capture failed, showing placeholder');
      }
    } catch (mapError) {
      console.error('❌ Error capturing map:', mapError);
      // Show error placeholder
      pdf.setFillColor(255, 240, 240);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(200, 100, 100);
      pdf.text('Map could not be captured', pageWidth / 2, yPosition + 12, { align: 'center' });
      yPosition += 24;
    }

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
