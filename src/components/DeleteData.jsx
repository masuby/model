import React, { useState } from "react";
import "./DeleteData.css";

function DeleteData({ sheetData, setSheetData, mode, setMode }) {
  const [deleteMode, setDeleteMode] = useState("row");
  const [showDeleteIcons, setShowDeleteIcons] = useState(false);

  const handleDeleteModeChange = (e) => {
    setDeleteMode(e.target.value);
    setShowDeleteIcons(true);
  };

  const handleDeleteRow = (rowIndex) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const updatedData = [...sheetData];
      updatedData.splice(rowIndex, 1);
      setSheetData(updatedData);
    }
  };

  const handleDeleteColumn = (columnKey) => {
    if (window.confirm(`Are you sure you want to delete the column "${columnKey}"?`)) {
      const updatedData = sheetData.map(row => {
        const newRow = { ...row };
        delete newRow[columnKey];
        return newRow;
      });
      setSheetData(updatedData);
    }
  };

  const cancelDelete = () => {
    setShowDeleteIcons(false);
    setMode("");
  };

  return (
    <div className="delete-data-container">
      <select value={deleteMode} onChange={handleDeleteModeChange}>
        <option value="">Select Delete Type</option>
        <option value="row">Delete Rows</option>
        <option value="column">Delete Columns</option>
      </select>

      {showDeleteIcons && (
        <>
          <button onClick={cancelDelete} className="cancel-delete-btn">
            Cancel
          </button>
          
          <div className="delete-instruction">
            {deleteMode === "row" 
              ? "Click on the trash icon to delete a row" 
              : "Click on the trash icon to delete a column"}
          </div>
        </>
      )}

      {showDeleteIcons && (
        <div className="delete-table-container">
          <table>
            <thead>
              <tr>
                {deleteMode === "column" && <th>Action</th>}
                {Object.keys(sheetData[0] || {}).map((col) => (
                  <th key={col}>
                    {deleteMode === "column" && (
                      <button 
                        onClick={() => handleDeleteColumn(col)}
                        className="delete-column-btn"
                        title={`Delete ${col} column`}
                      >
                        🗑️
                      </button>
                    )}
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i}>
                  {deleteMode === "row" && (
                    <td>
                      <button 
                        onClick={() => handleDeleteRow(i)}
                        className="delete-row-btn"
                        title="Delete this row"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                  {Object.entries(row).map(([col, val]) => (
                    <td key={col}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DeleteData;