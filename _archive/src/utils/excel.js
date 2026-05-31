import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Helper: check if row is empty
function isEmptyRow(row) {
  return Object.values(row).every((val) => val === "" || val === null || val === undefined);
}

// Helper: check if all headers in a row are empty
function isEmptyHeaderRow(row) {
  return Object.values(row).every((val) => 
    val === "" || val === null || val === undefined || 
    String(val).trim() === "" || String(val).startsWith('__EMPTY')
  );
}

// Helper: remove empty rows and columns, and handle empty headers
function cleanSheetData(data) {
  if (data.length === 0) return [];

  // 1. Check if the first row has empty headers
  let startRowIndex = 0;
  if (data.length > 0 && isEmptyHeaderRow(data[0])) {
    // Use the second row as headers and remove the first row
    startRowIndex = 1;
  }

  // 2. Remove empty rows from the remaining data
  let cleanedRows = data.slice(startRowIndex).filter((row) => !isEmptyRow(row));

  if (cleanedRows.length === 0) return [];

  // 3. Find non-empty columns
  const nonEmptyColumns = new Set();
  cleanedRows.forEach((row) => {
    Object.entries(row).forEach(([key, val]) => {
      if (val !== "" && val !== null && val !== undefined) {
        nonEmptyColumns.add(key);
      }
    });
  });

  // 4. Keep only non-empty columns
  cleanedRows = cleanedRows.map((row) => {
    const newRow = {};
    [...nonEmptyColumns].forEach((col) => {
      newRow[col] = row[col];
    });
    return newRow;
  });

  return cleanedRows;
}

// Load Excel file
export async function loadExcel(filePath) {
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheets = {};
  workbook.SheetNames.forEach((name) => {
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      defval: "", // keep empty cells
      header: 1, // Use array format to preserve row order for header checking
    });
    
    // Convert array format back to object format after header processing
    let processedData = [];
    if (rawData.length > 0) {
      // Check if first row has empty headers
      let headers = rawData[0];
      let dataStartIndex = 0;
      
      // If first row has empty headers, use second row as headers
      if (headers.every(header => 
        !header || header === "" || header === null || header === undefined || 
        String(header).trim() === "" || String(header).startsWith('__EMPTY')
      )) {
        if (rawData.length > 1) {
          headers = rawData[1];
          dataStartIndex = 2;
        }
      } else {
        dataStartIndex = 1;
      }
      
      // Convert to object format
      for (let i = dataStartIndex; i < rawData.length; i++) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          if (headers[j] !== undefined && headers[j] !== null && headers[j] !== "") {
            // Clean header names by removing __EMPTY prefixes
            const cleanHeader = String(headers[j]).replace(/^__EMPTY(_\d+)?/, '').trim() || `column_${j+1}`;
            row[cleanHeader] = rawData[i][j];
          }
        }
        if (!isEmptyRow(row)) {
          processedData.push(row);
        }
      }
    }
    
    sheets[name] = processedData;
  });

  return { workbook, sheets };
}

// Save updated data back to Excel
export function saveExcel(sheets, filename = "updated_model.xlsx") {
  const workbook = XLSX.utils.book_new();

  Object.keys(sheets).forEach((name) => {
    const worksheet = XLSX.utils.json_to_sheet(sheets[name]);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, filename);
}