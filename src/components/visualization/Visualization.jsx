import React, { useState, useEffect } from "react";
import VisualizationModal from "./components/VisualizationModal";
import "./Visualization.css";

function Visualization({ onSelect, sheetData, sheetName }) {
  const [selected, setSelected] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (sheetData && sheetData.length > 0) {
      const columnNames = Object.keys(sheetData[0]);
      setColumns(columnNames);
    } else {
      setColumns([]);
    }
  }, [sheetData]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelected(value);
    
    if (value && columns.length > 0) {
      setShowModal(true);
      if (onSelect) onSelect(value);
    } else if (value && columns.length === 0) {
      alert("No data available for visualization. Please check your sheet data.");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelected("");
  };

  return (
    <>
      <div className="dropdown-container">
        <select value={selected} onChange={handleChange}>
          <option value="">Select Visualization</option>
          <optgroup label="INFORM Framework">
            <option value="inform-dashboard">🎯 INFORM Risk Dashboard</option>
            <option value="inform-flow">🔄 Hazard-to-Risk Flow</option>
            <option value="inform-sunburst">🌐 Indicator Hierarchy</option>
            <option value="inform-radar">📡 Dimension Comparison</option>
            <option value="inform-map">🗺️ Risk Choropleth Map</option>
          </optgroup>
          <optgroup label="Standard Charts">
            <option value="dashboard">📊 Dashboard View</option>
            <option value="bar">📈 Bar Chart</option>
            <option value="line">📉 Line Graph</option>
            <option value="scatter">🔵 Scatter Plot</option>
            <option value="area">🟩 Area Graph</option>
            <option value="pie">🥧 Pie Chart</option>
            <option value="heatmap">🔥 Heat Map</option>
            <option value="map">🗺️ Map Chart</option>
          </optgroup>
        </select>
      </div>
      
      {showModal && (
        <VisualizationModal
          data={sheetData || []}
          columns={columns}
          isOpen={showModal}
          onClose={handleCloseModal}
          chartType={selected}
        />
      )}
    </>
  );
}

export default Visualization;