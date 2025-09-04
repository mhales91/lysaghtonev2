// Check for MongoDB ObjectIds in project CSV
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
const row = data[0];
const headers = Object.keys(row);
const values = Object.values(row);

console.log('Project CSV headers:', headers);
console.log('First data row values:', values);

// Check for MongoDB ObjectId pattern (24 hex characters)
const objectIdPattern = /^[0-9a-f]{24}$/i;
values.forEach((value, index) => {
  if (value && objectIdPattern.test(value)) {
    console.log('Found ObjectId in field:', headers[index], '=', value);
  }
});

// Also check the specific ObjectId from the error
const errorObjectId = '6891184a9c1ab528e477ac82';
console.log('\nLooking for error ObjectId:', errorObjectId);
values.forEach((value, index) => {
  if (value === errorObjectId) {
    console.log('Found error ObjectId in field:', headers[index]);
  }
});
