// Import all CSV data from Base44 export
// Run this with: node import-csv-data.js

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
  console.log('🚀 Starting CSV data import...');
  
  try {
    // Define the import order and table mappings
    const importOrder = [
      { csvFile: 'Client_export.csv', tableName: 'clients', priority: 1 },
      { csvFile: 'Project_export.csv', tableName: 'projects', priority: 2 },
      { csvFile: 'Task_export.csv', tableName: 'tasks', priority: 3 },
      { csvFile: 'TimeEntry_export.csv', tableName: 'time_entries', priority: 4 },
      { csvFile: 'CompanySettings_export.csv', tableName: 'company_settings', priority: 5 },
      { csvFile: 'TOE_export.csv', tableName: 't_o_e', priority: 6 },
      { csvFile: 'AnalyticsSetting_export.csv', tableName: 'analytics_setting', priority: 7 },
      { csvFile: 'TaskTemplate_export.csv', tableName: 'task_templates', priority: 8 },
      { csvFile: 'Invoice_export.csv', tableName: 'invoices', priority: 9 },
      { csvFile: 'CostTracker_export.csv', tableName: 'cost_tracker', priority: 10 },
      { csvFile: 'DashboardSettings_export.csv', tableName: 'dashboard_settings', priority: 11 },
      { csvFile: 'BillingSettings_export.csv', tableName: 'billing_settings', priority: 12 },
      { csvFile: 'Prompt_export.csv', tableName: 'prompts', priority: 13 },
      { csvFile: 'TagLibrary_export.csv', tableName: 'tag_library', priority: 14 },
      { csvFile: 'StaffRate_export.csv', tableName: 'staff_rates', priority: 15 },
      { csvFile: 'TaskRate_export.csv', tableName: 'task_rates', priority: 16 },
      { csvFile: 'TimerSession_export.csv', tableName: 'timer_sessions', priority: 17 },
      { csvFile: 'TOEFolder_export.csv', tableName: 'toe_folders', priority: 18 },
      { csvFile: 'TOELibraryItem_export.csv', tableName: 'toe_library_items', priority: 19 },
      { csvFile: 'TOEReview_export.csv', tableName: 'toe_reviews', priority: 20 },
      { csvFile: 'TOESignature_export.csv', tableName: 'toe_signatures', priority: 21 },
      { csvFile: 'WeeklySubmission_export.csv', tableName: 'weekly_submissions', priority: 22 },
      { csvFile: 'WriteOff_export.csv', tableName: 'write_offs', priority: 23 },
      { csvFile: 'LeadOpportunity_export.csv', tableName: 'lead_opportunities', priority: 24 },
      { csvFile: 'ChatConversation_export.csv', tableName: 'chat_conversations', priority: 25 },
      { csvFile: 'AIAssistant_export.csv', tableName: 'ai_assistants', priority: 26 },
      { csvFile: 'ImportJob_export.csv', tableName: 'import_jobs', priority: 27 },
      { csvFile: 'JobStatusMap_export.csv', tableName: 'job_status_maps', priority: 28 },
      { csvFile: 'ClientCrosswalk_export.csv', tableName: 'client_crosswalk', priority: 29 },
      { csvFile: 'UserCrosswalk_export.csv', tableName: 'user_crosswalk', priority: 30 }
    ];
    
    // Sort by priority
    importOrder.sort((a, b) => a.priority - b.priority);
    
    for (const { csvFile, tableName } of importOrder) {
      await importCSVFile(csvFile, tableName);
    }
    
    console.log('✅ CSV data import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

async function importCSVFile(csvFile, tableName) {
  console.log(`\n📋 Importing ${csvFile} to ${tableName}...`);
  
  try {
    const csvPath = path.join(process.cwd(), 'exportdata', csvFile);
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️ File ${csvFile} does not exist, skipping...`);
      return;
    }
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    if (data.length === 0) {
      console.log(`⚠️ No data found in ${csvFile}, skipping...`);
      return;
    }
    
    console.log(`📊 Found ${data.length} records in ${csvFile}`);
    
    // Transform data based on table
    const transformedData = transformDataForTable(data, tableName);
    
    if (transformedData.length === 0) {
      console.log(`⚠️ No valid data after transformation for ${tableName}, skipping...`);
      return;
    }
    
    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      try {
        const { error } = await supabaseAdmin
          .from(tableName)
          .upsert(batch, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Error importing batch to ${tableName}:`, error.message);
        } else {
          console.log(`✅ Imported ${batch.length} records to ${tableName} (batch ${Math.floor(i/batchSize) + 1})`);
        }
      } catch (err) {
        console.error(`❌ Exception importing batch to ${tableName}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error importing ${csvFile}:`, error);
  }
}

function transformDataForTable(data, tableName) {
  return data.map(row => {
    const transformed = {};
    
    // Common transformations
    Object.entries(row).forEach(([key, value]) => {
      // Skip empty values
      if (!value || value === '') {
        return;
      }
      
      // Handle different field types
      if (key.includes('date') || key.includes('Date')) {
        transformed[key] = convertDate(value);
      } else if (key.includes('id') && key !== 'id') {
        // Keep IDs as strings for now
        transformed[key] = value;
      } else if (key.includes('amount') || key.includes('rate') || key.includes('hours') || key.includes('minutes')) {
        transformed[key] = convertNumber(value);
      } else if (key === 'is_active' || key === 'is_completed' || key === 'is_approved') {
        transformed[key] = convertBoolean(value);
      } else {
        transformed[key] = value;
      }
    });
    
    // Ensure ID exists
    if (!transformed.id) {
      transformed.id = gen_random_uuid();
    }
    
    // Add timestamps if not present
    if (!transformed.created_at) {
      transformed.created_at = new Date().toISOString();
    }
    if (!transformed.updated_at) {
      transformed.updated_at = new Date().toISOString();
    }
    
    return transformed;
  });
}

// Run the import
importCSVData();
