// Test import with detailed error logging
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'http://134.199.146.249:8000';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test with a single client record
async function testClientImport() {
  console.log('🧪 Testing client import...');
  
  try {
    const csvPath = path.join(__dirname, 'exportdata', 'Client_export.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    // Parse just the first data row
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const firstDataLine = lines[1];
    
    console.log('Headers:', headers);
    console.log('First data line:', firstDataLine.substring(0, 100) + '...');
    
    // Simple CSV parsing for first row
    const values = firstDataLine.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    
    console.log('Parsed row keys:', Object.keys(row));
    console.log('Company name:', row.company_name);
    console.log('Contact person:', row.contact_person);
    
    // Try to insert a simple client record
    const testClient = {
      id: crypto.randomUUID(),
      company_name: row.company_name || 'Test Company',
      contact_person: row.contact_person || 'Test Person',
      email: row.email,
      phone: row.phone,
      crm_stage: 'lead'
    };
    
    console.log('Test client data:', testClient);
    
    const { data, error } = await supabase
      .from('client')
      .insert(testClient)
      .select();
    
    if (error) {
      console.error('❌ Insert error:', error);
    } else {
      console.log('✅ Insert successful:', data);
    }
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

// Test table existence
async function testTableExists() {
  console.log('🔍 Testing table existence...');
  
  try {
    const { data, error } = await supabase
      .from('client')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error);
    } else {
      console.log('✅ Table exists, current records:', data.length);
    }
  } catch (err) {
    console.error('❌ Table test error:', err.message);
  }
}

// Run tests
async function runTests() {
  await testTableExists();
  await testClientImport();
}

runTests();
