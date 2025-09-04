// Find the specific ObjectId causing the error
import fs from 'fs';

// Use the improved CSV parsing function
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    let inJson = false;
    let braceCount = 0;
    let quoteCount = 0;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        quoteCount++;
        if (quoteCount === 1) {
          inQuotes = true;
        } else if (quoteCount === 2) {
          inQuotes = false;
          quoteCount = 0;
        }
      } else if (char === '{' && !inQuotes) {
        inJson = true;
        braceCount++;
      } else if (char === '}' && !inQuotes) {
        braceCount--;
        if (braceCount === 0) {
          inJson = false;
        }
      } else if (char === ',' && !inQuotes && !inJson) {
        values.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || null;
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      row[header] = value;
    });
    data.push(row);
  }
  
  return data;
}

const csvContent = fs.readFileSync('exportdata/Project_export.csv', 'utf8');
const data = parseCSV(csvContent);

// Look for the specific ObjectId from the error
const errorObjectId = '6891184a9c1ab528e477ac82';
console.log('Looking for error ObjectId:', errorObjectId);

for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i];
  const headers = Object.keys(row);
  
  headers.forEach(header => {
    if (row[header] === errorObjectId) {
      console.log('Found error ObjectId in row', i + 1, 'field:', header);
    }
  });
}

// Also check for any ObjectId pattern in the first few rows
console.log('\nChecking first 3 rows for any ObjectId patterns:');
for (let i = 0; i < Math.min(3, data.length); i++) {
  const row = data[i];
  console.log(`Row ${i + 1}:`);
  Object.keys(row).forEach(header => {
    const value = row[header];
    if (value && typeof value === 'string' && value.match(/^[0-9a-f]{24}$/i)) {
      console.log(`  ${header}: ${value}`);
    }
  });
}
