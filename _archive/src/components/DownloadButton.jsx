import React from "react";
import { downloadExcelFile } from "../services/excelStorageService";

function DownloadButton({ sheets, fileName = "data.xlsx", categoryFolder = "risk-data" }) {
  const handleDownload = async () => {
    if (!sheets) return;
    
    try {
      const { write, utils } = await import('xlsx');
      
      const workbook = utils.book_new();
      Object.entries(sheets).forEach(([sheetName, data]) => {
        const worksheet = utils.json_to_sheet(data);
        utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed: " + error.message);
    }
  };

  return (
    <button onClick={handleDownload} className="download-button">
    </button>
  );
}

export default DownloadButton;