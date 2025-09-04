// Complete Base44 data import script
// Run this with: node import-base44-complete.js

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

// Helper function to convert string to number
function convertNumber(str) {
  if (!str || str === '') return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

async function importBase44Data() {
  console.log('🚀 Starting complete Base44 data import...');
  
  try {
    // Read the export file
    const exportPath = path.join(process.cwd(), 'exportdata', 'lysaght_data_export_2025-09-02.txt');
    const exportData = fs.readFileSync(exportPath, 'utf8');
    
    // Split into sections
    const sections = exportData.split(/^=== [A-Z]/m);
    
    // Process each section
    for (const section of sections) {
      if (section.includes('PROJECTS ===')) {
        await importProjects(section);
      } else if (section.includes('CLIENTS ===')) {
        await importClients(section);
      } else if (section.includes('TIME ENTRIES ===')) {
        await importTimeEntries(section);
      } else if (section.includes('TASKS ===')) {
        await importTasks(section);
      } else if (section.includes('COMPANY SETTINGS ===')) {
        await importCompanySettings(section);
      }
    }
    
    console.log('✅ Complete Base44 data import finished!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

async function importProjects(section) {
  console.log('📁 Importing projects...');
  
  const data = parseCSV(section);
  if (data.length === 0) return;
  
  const projects = data.map(row => ({
    id: row.id || gen_random_uuid(),
    name: row.project_name || 'Unnamed Project',
    client_id: row.client_id || null,
    description: row.job_number ? `Job #${row.job_number}` : null,
    status: row.status || 'active',
    created_at: convertDate(row.created_date) || new Date().toISOString(),
    updated_at: convertDate(row.updated_date) || new Date().toISOString()
  }));
  
  // Insert projects in batches
  for (let i = 0; i < projects.length; i += 100) {
    const batch = projects.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .from('projects')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error('Error importing projects batch:', error);
    } else {
      console.log(`✅ Imported ${batch.length} projects (batch ${Math.floor(i/100) + 1})`);
    }
  }
}

async function importClients(section) {
  console.log('👥 Importing clients...');
  
  const data = parseCSV(section);
  if (data.length === 0) return;
  
  const clients = data.map(row => ({
    id: row.id || gen_random_uuid(),
    name: row.company_name || 'Unnamed Client',
    email: row.email || null,
    phone: row.phone || null,
    address: row.address || null,
    created_at: convertDate(row.created_date) || new Date().toISOString(),
    updated_at: convertDate(row.updated_date) || new Date().toISOString()
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

async function importTimeEntries(section) {
  console.log('⏰ Importing time entries...');
  
  const data = parseCSV(section);
  if (data.length === 0) return;
  
  const timeEntries = data.map(row => ({
    id: row.id || gen_random_uuid(),
    user_id: row.user_id || null,
    task_id: row.task_id || null,
    start_time: convertDate(row.start_time),
    end_time: convertDate(row.end_time),
    duration_minutes: convertNumber(row.duration_minutes),
    description: row.description || null,
    created_at: convertDate(row.created_date) || new Date().toISOString(),
    updated_at: convertDate(row.updated_date) || new Date().toISOString()
  }));
  
  // Insert time entries in batches
  for (let i = 0; i < timeEntries.length; i += 100) {
    const batch = timeEntries.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .from('time_entries')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error('Error importing time entries batch:', error);
    } else {
      console.log(`✅ Imported ${batch.length} time entries (batch ${Math.floor(i/100) + 1})`);
    }
  }
}

async function importTasks(section) {
  console.log('📋 Importing tasks...');
  
  const data = parseCSV(section);
  if (data.length === 0) return;
  
  const tasks = data.map(row => ({
    id: row.id || gen_random_uuid(),
    name: row.name || 'Unnamed Task',
    project_id: row.project_id || null,
    description: row.description || null,
    status: row.status || 'pending',
    created_at: convertDate(row.created_date) || new Date().toISOString(),
    updated_at: convertDate(row.updated_date) || new Date().toISOString()
  }));
  
  // Insert tasks in batches
  for (let i = 0; i < tasks.length; i += 100) {
    const batch = tasks.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .from('tasks')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error('Error importing tasks batch:', error);
    } else {
      console.log(`✅ Imported ${batch.length} tasks (batch ${Math.floor(i/100) + 1})`);
    }
  }
}

async function importCompanySettings(section) {
  console.log('⚙️ Importing company settings...');
  
  const data = parseCSV(section);
  if (data.length === 0) return;
  
  const settings = data.map(row => ({
    id: gen_random_uuid(),
    key: row.key || `setting_${Math.random()}`,
    value: row.value || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Insert settings
  const { error } = await supabaseAdmin
    .from('company_settings')
    .upsert(settings, { onConflict: 'key' });
  
  if (error) {
    console.error('Error importing company settings:', error);
  } else {
    console.log(`✅ Imported ${settings.length} company settings`);
  }
}

// Run the import
importBase44Data();
