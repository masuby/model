import React from 'react';
import './MapChart.css';

function HoverPopup({ info, dataColumns }) {
  return (
    <div 
      className="hover-popup-container"
      style={{
        position: 'fixed',
        left: `${info.x || 0 + 15}px`,
        top: `${info.y || 0 + 15}px`,
        zIndex: 1000
      }}
    >
      <div className="popup-content">
        <h4>{info.title}</h4>
        {info.isDistrict && info.region && <p className="popup-region">Region: {info.region}</p>}
        
        {dataColumns && dataColumns.map(column => (
          <p key={column} className="popup-data">
            <strong>{column}:</strong> {info.data[column]}
          </p>
        ))}
        
        {info.lat !== null && info.lng !== null && (
          <p className="popup-coords">
            <strong>Coordinates:</strong> Lat: {info.lat.toFixed(4)}, Lng: {info.lng.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}

export default HoverPopup;