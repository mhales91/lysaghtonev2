// Import clients with only the columns that exist
// Run this with: node import-clients-final.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Get environment variables
const getEnvVar = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'http://134.199.146.249:8000');
const supabaseServiceKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY', '');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to generate UUID
function gen_random_uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to parse CSV with proper handling of commas in values
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
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
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    data.push(row);
  }
  
  return data;
}

// Helper function to convert Base44 date to ISO
function convertDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

async function importClientsFinal() {
  console.log('🚀 Starting final clients import...');
  
  try {
    // Read the export file
    const exportPath = path.join(process.cwd(), 'exportdata', 'lysaght_data_export_2025-09-02.txt');
    const exportData = fs.readFileSync(exportPath, 'utf8');
    
    // Import CLIENTS with only basic columns
    const clientsMatch = exportData.match(/=== CLIENTS ===\n([\s\S]*?)(?=\n=== [A-Z]|$)/);
    if (clientsMatch) {
      await importClients(clientsMatch[1]);
    }
    
    console.log('✅ Final clients import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

async function importClients(section) {
  console.log('👥 Importing clients (final)...');
  
  const data = parseCSV(section);
  if (data.length === 0) {
    console.log('⚠️ No client data found');
    return;
  }
  
  console.log(`📊 Found ${data.length} clients to import`);
  
  const clients = data.map(row => ({
    id: gen_random_uuid(), // Generate new UUIDs
    name: row.company_name || 'Unnamed Client',
    created_at: convertDate(row.created_date) || new Date().toISOString()
    // Only include columns that exist in the table
  }));
  
  // Insert clients in batches
  for (let i = 0; i < clients.length; i += 100) {
    const batch = clients.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .from('clients')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error('Error importing clients batch:', error);
    } else {
      console.log(`✅ Imported ${batch.length} clients (batch ${Math.floor(i/100) + 1})`);
    }
  }
}

// Run the import
importClientsFinal();
