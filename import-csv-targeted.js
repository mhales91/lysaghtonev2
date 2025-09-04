// Import CSV data with proper field mapping
// Run this with: node import-csv-targeted.js

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

// Helper function to convert string to boolean
function convertBoolean(str) {
  if (!str || str === '') return null;
  return str.toLowerCase() === 'true' || str === '1';
}

async function importCSVData() {
  console.log('🚀 Starting targeted CSV data import...');
  
  try {
    // Import in order of dependencies
    await importClients();
    await importProjects();
    await importTasks();
    await importTimeEntries();
    await importCompanySettings();
    await importTOE();
    await importAnalyticsSettings();
    
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
      id: row.id || gen_random_uuid(),
      name: row.company_name || 'Unnamed Client',
      email: row.email || null,
      phone: row.phone || null,
      address: row.address || null,
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
      id: row.id || gen_random_uuid(),
      name: row.project_name || 'Unnamed Project',
      client_id: row.client_id || null,
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
      id: row.id || gen_random_uuid(),
      name: row.task_name || row.name || 'Unnamed Task',
      project_id: row.project_id || null,
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
      id: row.id || gen_random_uuid(),
      user_id: row.user_id || null,
      task_id: row.task_id || null,
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
      id: row.id || gen_random_uuid(),
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

async function importTOE() {
  console.log('\n📄 Importing TOE documents...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'TOE_export.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ TOE_export.csv not found, skipping...');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} TOE documents to import`);
    
    const toeDocs = data.map(row => ({
      id: row.id || gen_random_uuid(),
      client_id: row.client_id || null,
      project_id: row.project_id || null,
      title: row.title || 'Untitled TOE',
      content: row.content || '',
      status: row.status || 'draft',
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
    }));
    
    // Insert in batches
    for (let i = 0; i < toeDocs.length; i += 100) {
      const batch = toeDocs.slice(i, i + 100);
      const { error } = await supabaseAdmin
        .from('t_o_e')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error('Error importing TOE batch:', error);
      } else {
        console.log(`✅ Imported ${batch.length} TOE documents (batch ${Math.floor(i/100) + 1})`);
      }
    }
    
  } catch (error) {
    console.error('Error importing TOE documents:', error);
  }
}

async function importAnalyticsSettings() {
  console.log('\n📊 Importing analytics settings...');
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', 'AnalyticsSetting_export.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ AnalyticsSetting_export.csv not found, skipping...');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    console.log(`📊 Found ${data.length} analytics settings to import`);
    
    const settings = data.map(row => ({
      id: row.id || gen_random_uuid(),
      key: row.key || `analytics_${Math.random()}`,
      value: row.value || '',
      created_at: convertDate(row.created_date) || new Date().toISOString(),
      updated_at: convertDate(row.updated_date) || new Date().toISOString()
    }));
    
    // Insert settings
    const { error } = await supabaseAdmin
      .from('analytics_setting')
      .upsert(settings, { onConflict: 'key' });
    
    if (error) {
      console.error('Error importing analytics settings:', error);
    } else {
      console.log(`✅ Imported ${settings.length} analytics settings`);
    }
    
  } catch (error) {
    console.error('Error importing analytics settings:', error);
  }
}

// Run the import
importCSVData();
