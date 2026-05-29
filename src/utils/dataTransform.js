// Updated dataTransform.js
// Function to detect and convert data types
export const convertToNumberIfPossible = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  
  // Try to parse as float directly first
  const numericValue = parseFloat(value);
  if (!isNaN(numericValue)) return numericValue;
  
  // If that fails, try cleaning the string
  const cleanedValue = value.replace(/[^\d.-]/g, '');
  const cleanedNumericValue = parseFloat(cleanedValue);
  
  // Return the numeric value if valid, otherwise return the original value
  return isNaN(cleanedNumericValue) ? value : cleanedNumericValue;
};

// Check if a value can be converted to a number
export const isConvertibleToNumber = (value) => {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  
  // Try direct conversion
  if (!isNaN(parseFloat(value))) return true;
  
  // Try cleaned conversion
  const cleanedValue = value.replace(/[^\d.-]/g, '');
  return !isNaN(parseFloat(cleanedValue)) && cleanedValue !== '';
};

// Get all columns from data
export const getAllColumns = (data) => {
  if (!data || data.length === 0) {
    console.log("No data available to extract columns");
    return [];
  }
  return Object.keys(data[0]);
};

// Get numeric columns from data
export const getNumericColumns = (data) => {
  if (!data || data.length === 0) {
    console.log("No data available to check numeric columns");
    return [];
  }
  
  return Object.keys(data[0]).filter(column => {
    // Check if at least some values in this column are numeric
    return data.some(item => {
      const value = item[column];
      return isConvertibleToNumber(value);
    });
  });
};

// Transform data for visualization
// Improve the transformDataForVisualization function
export const transformDataForVisualization = (data, xColumn, yColumn) => {
  if (!data || !xColumn || !yColumn) {
    console.log("Missing data or columns for transformation");
    return [];
  }
  
  console.log(`Transforming data: ${xColumn} vs ${yColumn}`);
  console.log('Sample data:', data.slice(0, 3));
  
  const transformed = data
    .filter(item => {
      const hasX = item[xColumn] !== undefined && item[xColumn] !== null && item[xColumn] !== '';
      const hasY = item[yColumn] !== undefined && item[yColumn] !== null && item[yColumn] !== '';
      return hasX && hasY;
    })
    .map(item => {
      const xValue = item[xColumn];
      const yValue = item[yColumn];
      
      // Convert yValue to number if possible
      let numericValue;
      if (isConvertibleToNumber(yValue)) {
        numericValue = convertToNumberIfPossible(yValue);
      } else {
        numericValue = 0; // Default to 0 if not convertible
      }
      
      return {
        name: String(xValue || ''),
        value: numericValue
      };
    })
    .filter(item => item.name && item.name.trim() !== '');
  
  console.log('Transformed data:', transformed);
  return transformed;
};

// Function to extract unique values for categorical data
export const getUniqueValues = (data, column) => {
  if (!data || !column) return [];
  const values = data.map(item => item[column]).filter(value => value !== undefined && value !== null);
  return [...new Set(values)];
};

// Function to aggregate data for specific chart types
export const aggregateData = (data, categoryColumn, valueColumn, aggregation = 'sum') => {
  const aggregated = {};
  
  data.forEach(item => {
    const category = item[categoryColumn];
    const value = isConvertibleToNumber(item[valueColumn]) ? 
                  convertToNumberIfPossible(item[valueColumn]) : 0;
    
    if (category !== undefined && category !== null) {
      if (!aggregated[category]) {
        aggregated[category] = 0;
      }
      
      switch (aggregation) {
        case 'sum':
          aggregated[category] += value;
          break;
        case 'average':
          // We'll handle average separately after summing all values
          aggregated[category] = { sum: (aggregated[category].sum || 0) + value, count: (aggregated[category].count || 0) + 1 };
          break;
        case 'count':
          aggregated[category] = (aggregated[category] || 0) + 1;
          break;
        case 'max':
          aggregated[category] = Math.max(aggregated[category] || -Infinity, value);
          break;
        case 'min':
          aggregated[category] = Math.min(aggregated[category] || Infinity, value);
          break;
        default:
          aggregated[category] += value;
      }
    }
  });
  
  // For average, calculate the final value
  if (aggregation === 'average') {
    Object.keys(aggregated).forEach(category => {
      aggregated[category] = aggregated[category].sum / aggregated[category].count;
    });
  }
  
  return Object.keys(aggregated).map(category => ({
    name: category,
    value: aggregated[category]
  }));
};