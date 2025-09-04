// Import CSV data with proper UUID conversion and field mapping
// Run this with: node import-csv-fixed.js

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

// Helper function to convert MongoDB ObjectId to UUID
function convertToUUID(objectId) {
  if (!objectId || objectId === '') return gen_random_uuid();
  
  // If it's already a valid UUID format, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(objectId)) {
    return objectId;
  }
  
  // Convert MongoDB ObjectId to UUID-like format
  if (objectId.length === 24) {
    // MongoDB ObjectId is 24 hex characters
    const hex = objectId;
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      '4' + hex.substring(13, 16), // Version 4
      ((parseInt(hex.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.substring(17, 20), // Variant
      hex.substring(20, 24)
    ].join('-');
  }
  
  // If it's not a valid format, generate a new UUID
  return gen_random_uuid();
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

async function importCSVData() {
  console.log('🚀 Starting fixed CSV data import...');
  
  try {
    // Import in order of dependencies
    await importClients();
    await importProjects();
    await importTasks();
    await importTimeEntries();
    await importCompanySettings();
    
    console.log('✅ CSV data import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

async function importClients() {
  console.log('\n👥 Importing clients...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'Client_export.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} clients to import`);
    
    const clients = data.map(row => ({
      id: convertToUUID(row.id),
      name: row.company_name || 'Unnamed Client',
      email: row.email || null,
      phone: row.phone || null,
      // Skip address column since it doesn't exist in our table
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
    }));
    
    // Insert in batches
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
    
  } catch (error) {
    console.error('Error importing clients:', error);
  }
}

async function importProjects() {
  console.log('\n📁 Importing projects...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'Project_export.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} projects to import`);
    
    const projects = data.map(row => ({
      id: convertToUUID(row.id),
      name: row.project_name || 'Unnamed Project',
      client_id: convertToUUID(row.client_id),
      description: row.job_number ? `Job #${row.job_number}` : null,
      status: row.status || 'active',
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
    }));
    
    // Insert in batches
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
    
  } catch (error) {
    console.error('Error importing projects:', error);
  }
}

async function importTasks() {
  console.log('\n📋 Importing tasks...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'Task_export.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ Task_export.csv not found, skipping...');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} tasks to import`);
    
    const tasks = data.map(row => ({
      id: convertToUUID(row.id),
      name: row.task_name || row.name || 'Unnamed Task',
      project_id: convertToUUID(row.project_id),
      description: row.description || null,
      status: row.status || 'pending',
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
    }));
    
    // Insert in batches
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
    
  } catch (error) {
    console.error('Error importing tasks:', error);
  }
}

async function importTimeEntries() {
  console.log('\n⏰ Importing time entries...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'TimeEntry_export.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ TimeEntry_export.csv not found, skipping...');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} time entries to import`);
    
    const timeEntries = data.map(row => ({
      id: convertToUUID(row.id),
      user_id: convertToUUID(row.user_id),
      task_id: convertToUUID(row.task_id),
      start_time: convertDate(row.start_time),
      end_time: convertDate(row.end_time),
      duration_minutes: convertNumber(row.minutes) || convertNumber(row.duration_minutes),
      description: row.description || null,
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
    }));
    
    // Insert in batches
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
    
  } catch (error) {
    console.error('Error importing time entries:', error);
  }
}

async function importCompanySettings() {
  console.log('\n⚙️ Importing company settings...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'CompanySettings_export.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ CompanySettings_export.csv not found, skipping...');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} company settings to import`);
    
    const settings = data.map(row => ({
      id: convertToUUID(row.id),
      key: row.key || `setting_${Math.random()}`,
      value: row.value || '',
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
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
    
  } catch (error) {
    console.error('Error importing company settings:', error);
  }
}

// Run the import
importCSVData();
