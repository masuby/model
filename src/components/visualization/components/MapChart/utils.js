// Utility functions for data processing and coloring

// Detect if column is numerical or categorical
export const detectDataType = (sheetData, dataColumn) => {
  if (!sheetData.length || !dataColumn) return { type: 'categorical', scale: {} };

  const values = sheetData.map(row => row[dataColumn]).filter(v => v != null);
  const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
  const isNumerical = numericCount / values.length > 0.9; // >90% numeric

  if (isNumerical) {
    const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const classes = 5; // 5 classes matching INFORM levels
    // Risk palette: Very Low (green) → Very High (red)
    return {
      type: 'numerical',
      scale: { 
        min, 
        max, 
        classes, 
        colors: ['#FFFFFF', '#FFFF00', '#FFA500', '#FF0000', '#A52A2A'], 
        labels: ['Very Low', 'Low', 'Medium', 'High', 'Very High'] // Legend labels
      }
    };
  } else {
    // Categorical mapping with pure spectrum colors
    return {
      type: 'categorical',
      scale: {
        mappings: {
          'very low': '#FFFFFF',
          'low': '#FFFF00',
          'medium': '#FFA500',
          'high': '#FF0000',
          'very high': '#A52A2A',
          'extreme': '#654321',
          'available': '#0000FF',
          'not available': '#00FF00',
          'yes': '#0000FF',
          'no': '#00FF00',
          // Default fallback
          default: '#9E9E9E'
        }
      }
    };
  }
};

// Get color for a value - UPDATED to handle undefined scales safely
export const getColorForValue = (value, dataType, scale) => {
  if (!value || !scale) return '#9E9E9E'; // Gray for null or undefined scale

  // Handle case where scale might be undefined or incomplete
  if (dataType === 'numerical') {
    const { min, max, classes, colors } = scale;
    
    // Validate numerical scale properties
    if (min === undefined || max === undefined || !classes || !colors || colors.length === 0) {
      return '#9E9E9E';
    }
    
    // Handle case where min equals max to avoid division by zero
    if (min === max) {
      return colors[0] || '#9E9E9E';
    }
    
    try {
      const normalized = (parseFloat(value) - min) / (max - min);
      const classIndex = Math.min(Math.floor(normalized * classes), classes - 1);
      return colors[classIndex] || '#9E9E9E';
    } catch (error) {
      console.error('Error calculating numerical color:', error);
      return '#9E9E9E';
    }
  } else {
    // Categorical data
    const mappings = scale.mappings;
    
    // Validate categorical scale properties
    if (!mappings || typeof mappings !== 'object') {
      return '#9E9E9E';
    }
    
    try {
      const strValue = String(value).toLowerCase().trim();
      
      // First try exact match
      if (mappings[strValue]) {
        return mappings[strValue];
      }
      
      // Then try partial match
      for (const [key, color] of Object.entries(mappings)) {
        if (key !== 'default' && strValue.includes(key)) {
          return color;
        }
      }
      
      // Fallback to default
      return mappings.default || '#9E9E9E';
    } catch (error) {
      console.error('Error calculating categorical color:', error);
      return '#9E9E9E';
    }
  }
};

// Get full style for a GeoJSON feature - UPDATED with safe defaults
export const getStyleForFeature = (value, dataType, scale, isSelected, isRegion = false) => {
  // Safe defaults for missing data
  const baseColor = getColorForValue(value, dataType, scale);
  const fillOpacity = isSelected ? 0.9 : (isRegion ? 0.7 : 0.9);
  const color = isSelected ? '#1e3a8a' : baseColor;
  const weight = isSelected ? 3 : (isRegion ? 1 : 2);

  return {
    fillColor: baseColor,
    fillOpacity,
    color,
    weight,
    opacity: 1,
    fill: true
  };
};

// NEW: Safe scale accessor for multiple columns
export const getScaleForColumn = (colorScales, column) => {
  return colorScales[column] || {};
};

// NEW: Safe data type accessor for multiple columns
export const getDataTypeForColumn = (dataTypes, column) => {
  return dataTypes[column] || 'categorical';
};