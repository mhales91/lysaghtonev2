// Check UUID fields in project CSV
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

console.log('Project fields that might contain UUIDs:');
console.log('toe_id:', row.toe_id);
console.log('client_id:', row.client_id);
console.log('id:', row.id);
console.log('created_by_id:', row.created_by_id);

// Check for empty UUID fields
const uuidFields = ['toe_id', 'client_id', 'id', 'created_by_id'];
uuidFields.forEach(field => {
  if (row[field] === '') {
    console.log('⚠️  Empty UUID field:', field);
  }
});

// Check first few rows for empty UUIDs
console.log('\nChecking first 5 rows for empty UUID fields:');
for (let i = 0; i < Math.min(5, data.length); i++) {
  const row = data[i];
  console.log(`Row ${i + 1}:`);
  uuidFields.forEach(field => {
    if (row[field] === '') {
      console.log(`  ⚠️  Empty ${field}`);
    }
  });
}
