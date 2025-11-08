import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const CustomLegend = ({ dataColumns = [], dataTypes = {}, colorScales = {}, position = 'topright' }) => {
  const map = useMap();
  const legendRef = useRef(null);

  useEffect(() => {
    if (!map || !L || dataColumns.length === 0) return;

    // Wait for map to be fully initialized
    if (!map.getContainer()) {
      return;
    }

    // Remove existing legend if present
    if (legendRef.current) {
      try {
        map.removeControl(legendRef.current);
      } catch (error) {
        console.warn('Error removing existing legend:', error);
      }
    }

    const legend = L.control({ position });

    legend.onAdd = () => {
      try {
        const div = L.DomUtil.create('div', 'legend-control');
        
        // Generate legend content for all columns
        let legendHTML = '';
        
        dataColumns.forEach((column, index) => {
          const dataType = dataTypes[column] || 'categorical';
          const scale = colorScales[column] || {};
          
          legendHTML += `
            <div class="legend-section ${index > 0 ? 'legend-section-separator' : ''}">
              <div class="legend-title">${column}</div>
              <div class="legend-body">
                ${generateLegendContent(dataType, scale)}
              </div>
            </div>
          `;
        });

        div.innerHTML = legendHTML;
        return div;
      } catch (error) {
        console.error('Error creating legend content:', error);
        const fallbackDiv = L.DomUtil.create('div', 'legend-control');
        fallbackDiv.innerHTML = '<div class="legend-title">Legend</div><div>Error loading legend</div>';
        return fallbackDiv;
      }
    };

    // Add legend to map with error handling
    try {
      legend.addTo(map);
      legendRef.current = legend;
    } catch (error) {
      console.error('Error adding legend to map:', error);
    }

    return () => {
      if (legendRef.current) {
        try {
          map.removeControl(legendRef.current);
          legendRef.current = null;
        } catch (error) {
          console.warn('Error cleaning up legend:', error);
        }
      }
    };
  }, [map, dataColumns, dataTypes, colorScales, position]);

  return null;
};

// Helper to generate legend HTML based on type with safe defaults
const generateLegendContent = (dataType, scale) => {
  // Safe defaults for missing data
  if (!dataType || !scale) {
    return '<i style="background:gray"></i> No data';
  }

  try {
    if (dataType === 'numerical') {
      const { min, max, classes, colors } = scale;
      if (min === undefined || max === undefined || !classes || !colors || colors.length === 0) {
        return '<i style="background:gray"></i> No data';
      }
      
      const step = (max - min) / classes;
      const labels = [];
      for (let i = 0; i < classes; i++) {
        const from = min + (i * step);
        const to = min + ((i + 1) * step);
        const label = i === 0 ? `< ${to.toFixed(1)}` : 
                     i === classes - 1 ? `≥ ${from.toFixed(1)}` : 
                     `${from.toFixed(1)} - ${to.toFixed(1)}`;
        const color = colors[i] || '#9E9E9E';
        labels.push(`<i style="background:${color}; opacity:0.9;"></i> ${label}`);
      }
      return labels.join('<br>');
    } else { 
      // categorical
      const mappings = scale.mappings;
      if (!mappings || typeof mappings !== 'object') {
        return '<i style="background:gray"></i> No data';
      }
      
      const labels = Object.entries(mappings)
        .filter(([key]) => key !== 'default')
        .map(([key, color]) => `<i style="background:${color}; opacity:0.9;"></i> ${key.toUpperCase()}`)
        .join('<br>');
      return labels || '<i style="background:gray"></i> No categories';
    }
  } catch (error) {
    console.error('Error generating legend content:', error);
    return '<i style="background:gray"></i> Error loading legend';
  }
};

export default CustomLegend;