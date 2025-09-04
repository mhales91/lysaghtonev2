// Debug JSON parsing issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse CSV (same as import script)
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
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
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || null;
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Unescape double quotes in JSON strings
      if (value && typeof value === 'string' && (value.includes('""') || value.startsWith('{') || value.startsWith('['))) {
        value = value.replace(/""/g, '"');
      }
      // Fix JSON without quotes around property names
      if (value && typeof value === 'string' && value.startsWith('{') && value.includes(':')) {
        value = value.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        // Fix unquoted string values in JSON objects
        value = value.replace(/:\s*([^",}\s][^,}]*?)(\s*[,}])/g, (match, val, ending) => {
          const trimmed = val.trim();
          // Don't quote numbers, booleans, or already quoted strings
          if (trimmed.match(/^\d+$/) || trimmed === 'true' || trimmed === 'false' || trimmed === 'null' || trimmed.startsWith('"')) {
            return match;
          }
          return `: "${trimmed}"${ending}`;
        });
      }
      // Fix arrays without quotes around string values
      if (value && typeof value === 'string' && value.startsWith('[') && value.includes(',')) {
        value = value.replace(/\[([^\]]+)\]/g, (match, content) => {
          const items = content.split(',').map(item => {
            const trimmed = item.trim();
            if (trimmed && !trimmed.startsWith('"') && !trimmed.match(/^\d+$/)) {
              return `"${trimmed}"`;
            }
            return trimmed;
          });
          return `[${items.join(',')}]`;
        });
      }
      row[header] = value;
    });
    data.push(row);
  }
  
  return data;
}

// Test with client data
console.log('🔍 Debugging JSON parsing...');

const csvPath = path.join(__dirname, 'exportdata', 'Client_export.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const data = parseCSV(csvContent);

console.log('First row keys:', Object.keys(data[0]));

// Test JSON parsing for each field that might contain JSON
const row = data[0];
const jsonFields = ['address', 'tags'];

jsonFields.forEach(field => {
  console.log(`\n${field}:`);
  console.log('Raw value:', row[field]);
  console.log('Type:', typeof row[field]);
  
  if (row[field] && row[field].trim()) {
    try {
      const parsed = JSON.parse(row[field]);
      console.log('✅ Parsed successfully:', parsed);
    } catch (err) {
      console.log('❌ Parse error:', err.message);
      console.log('Value at position 13:', row[field].substring(10, 20));
    }
  } else {
    console.log('⚠️  Empty or null value');
  }
});
