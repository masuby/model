import React, { useState } from "react";
import DeleteData from "./DeleteData";
import "./DataEntry.css";

function DataEntry({ sheetData, setSheetData, onSave, onCancel }) {
  const [mode, setMode] = useState("");
  const [originalData, setOriginalData] = useState([...sheetData]);
  const [newColumnName, setNewColumnName] = useState("");

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    
    // Store original data when entering edit mode
    if (newMode === "edit" || newMode === "add") {
      setOriginalData([...sheetData]);
    }
  };

  const handleEditChange = (rowIndex, colKey, value) => {
    const updated = [...sheetData];
    updated[rowIndex][colKey] = value;
    setSheetData(updated);
  };

  const handleAddRow = () => {
    if (sheetData.length > 0) {
      const emptyRow = {};
      Object.keys(sheetData[0]).forEach((col) => (emptyRow[col] = ""));
      setSheetData([...sheetData, emptyRow]);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      alert("Please enter a column name");
      return;
    }
    
    if (Object.keys(sheetData[0] || {}).includes(newColumnName)) {
      alert("A column with this name already exists");
      return;
    }
    
    const updatedData = sheetData.map(row => ({
      ...row,
      [newColumnName]: ""
    }));
    
    setSheetData(updatedData);
    setNewColumnName("");
  };

  const handleSave = () => {
    if (onSave) {
      onSave(sheetData);
    }
    setMode("");
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(originalData);
    }
    setSheetData(originalData);
    setMode("");
  };

  return (
    <div className="dropdown-container">
      <select value={mode} onChange={handleModeChange}>
        <option value="">Select Action</option>
        <option value="edit">Edit Data</option>
        <option value="add">Add Data</option>
        <option value="delete">Delete Data</option>
      </select>

      {mode === "add" && (
        <div className="add-actions">
          <button onClick={handleAddRow} className="add-row-btn">
            ➕ Add Row
          </button>
          <div className="add-column-section">
            <input
              type="text"
              placeholder="New column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="column-name-input"
            />
            <button onClick={handleAddColumn} className="add-column-btn">
              ➕ Add Column
            </button>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <p className="edit-mode-text">Editing Mode: Click on cells to edit</p>
      )}

      {(mode === "edit" || mode === "add") && (
        <div className="save-cancel-buttons">
          <button onClick={handleSave} className="save-btn">
            💾 Save Changes
          </button>
          <button onClick={handleCancel} className="cancel-btn">
            ❌ Cancel
          </button>
        </div>
      )}

      {/* Editable Table for Edit/Add modes */}
      {(mode === "edit" || mode === "add") && (
        <div className="data-entry-table-container">
          <table>
            <thead>
              <tr>
                {Object.keys(sheetData[0] || {}).map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i}>
                  {Object.entries(row).map(([col, val]) => (
                    <td key={col}>
                      <input
                        value={val}
                        onChange={(e) =>
                          handleEditChange(i, col, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Data Component */}
      {mode === "delete" && (
        <DeleteData 
          sheetData={sheetData} 
          setSheetData={setSheetData}
          mode={mode}
          setMode={setMode}
        />
      )}
    </div>
  );
}

export default DataEntry;