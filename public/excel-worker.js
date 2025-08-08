// Excel parsing web worker
// This worker handles Excel file parsing using the xlsx library

try {
  importScripts('https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js');
} catch (error) {
  self.postMessage({
    type: 'parse-error',
    error: 'Failed to load Excel parsing library'
  });
}

// Handle messages from the main thread
self.onmessage = function(e) {
  const { file, type } = e.data;
  
  if (type === 'parse-excel') {
    // Check if XLSX is available
    if (typeof XLSX === 'undefined') {
      self.postMessage({
        type: 'parse-error',
        error: 'Excel parsing library not loaded'
      });
      return;
    }
    
    parseExcelFile(file);
  }
};

// Parse Excel file and extract data
function parseExcelFile(file) {
  try {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });
        
        // Extract headers and data
        const headers = jsonData[0] || [];
        const rows = jsonData.slice(1);
        
        // Define required columns to keep
        const requiredColumns = [
          'Model No', 'Model Name', 'Color', 'Memory', 'serial', 
          'os', 'version', 'wipe', 'region code', 'batteryhealth', 'time', 'Imei', 'Fail'
        ];
        
        // Define columns to exclude
        const excludedColumns = [
          'Wipe Report', 'Diagnostics Report'
        ];
        
        // Filter headers to keep only required columns and exclude unwanted ones
        const filteredHeaders = headers.filter(header => {
          // Check if header should be excluded
          const shouldExclude = excludedColumns.some(excluded => 
            header && header.toLowerCase().includes(excluded.toLowerCase())
          );
          
          if (shouldExclude) {
            return false;
          }
          
          // Check if header should be included
          return requiredColumns.some(required => 
            header && header.toLowerCase().includes(required.toLowerCase())
          );
        });
        
        // Convert to array of objects with only required columns
        const parsedData = rows.map(row => {
          const obj = {};
          filteredHeaders.forEach(header => {
            const headerIndex = headers.indexOf(header);
            if (headerIndex !== -1) {
              obj[header] = row[headerIndex] || '';
            }
          });
          return obj;
        });
        
        // Send success response
        self.postMessage({
          type: 'parse-success',
          data: {
            headers: filteredHeaders,
            rows: parsedData,
            totalRows: parsedData.length,
            sheetName: firstSheetName
          }
        });
        
      } catch (error) {
        // Send error response
        self.postMessage({
          type: 'parse-error',
          error: `Failed to parse Excel file: ${error.message}`
        });
      }
    };
    
    reader.onerror = function(error) {
      self.postMessage({
        type: 'parse-error',
        error: 'Failed to read file'
      });
    };
    
    // Read file as array buffer
    reader.readAsArrayBuffer(file);
    
  } catch (error) {
    self.postMessage({
      type: 'parse-error',
      error: `Worker error: ${error.message}`
    });
  }
}
