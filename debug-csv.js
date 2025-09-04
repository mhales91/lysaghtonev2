// Debug CSV parsing
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse CSV
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

// Test with CompanySettings
console.log('🔍 Debugging CompanySettings CSV...');
const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'CompanySettings_export.csv'), 'utf8');
const data = parseCSV(csvContent);

console.log('First row:', JSON.stringify(data[0], null, 2));

// Test JSON parsing
const row = data[0];
console.log('\nTesting JSON parsing:');
console.log('charge_out_rates raw:', row.charge_out_rates);
console.log('charge_out_rates type:', typeof row.charge_out_rates);

if (row.charge_out_rates && row.charge_out_rates.trim()) {
  try {
    const parsed = JSON.parse(row.charge_out_rates);
    console.log('charge_out_rates parsed:', parsed);
  } catch (err) {
    console.log('charge_out_rates parse error:', err.message);
  }
}

console.log('\nbilling_models raw:', row.billing_models);
console.log('billing_models type:', typeof row.billing_models);

if (row.billing_models && row.billing_models.trim()) {
  try {
    const parsed = JSON.parse(row.billing_models);
    console.log('billing_models parsed:', parsed);
  } catch (err) {
    console.log('billing_models parse error:', err.message);
  }
}
