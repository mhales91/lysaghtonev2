// Import main Base44 data (entities that have actual data)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'http://134.199.146.249:8000';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Helper function to convert string to proper type
function convertValue(value, type) {
  if (value === null || value === '' || value === 'null') return null;
  
  switch (type) {
    case 'number':
    case 'decimal':
      return parseFloat(value) || 0;
    case 'integer':
      return parseInt(value) || 0;
    case 'boolean':
      return value && value.toLowerCase() === 'true';
    case 'json':
      try {
        if (value && value.trim()) {
          return JSON.parse(value);
        }
        return null;
      } catch {
        return value;
      }
    case 'date':
      return value;
    default:
      return value;
  }
}

// Import clients
async function importClients() {
  console.log('🏢 Importing Clients...');
  try {
    const csvPath = path.join(__dirname, 'exportdata', 'Client_export.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  No Client_export.csv found - skipping client import');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: crypto.randomUUID(), // Generate new UUID instead of using MongoDB ObjectId
      company_name: row.company_name,
      contact_person: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address && row.address.trim() ? JSON.parse(row.address) : null,
      crm_stage: row.crm_stage || 'lead',
      tags: row.tags && row.tags.trim() ? JSON.parse(row.tags) : [],
      estimated_value: convertValue(row.estimated_value, 'decimal'),
      probability: convertValue(row.probability, 'decimal'),
      scope_summary: row.scope_summary,
      lead_pm: row.lead_pm,
      response_due: row.response_due,
      moved_at: row.moved_at
    }));

    const { data: result, error } = await supabase
      .from('client')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing clients:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} clients`);
    }
  } catch (err) {
    console.log('⚠️  Error importing clients:', err.message);
  }
}

// Import projects
async function importProjects() {
  console.log('📋 Importing Projects...');
  try {
    const csvPath = path.join(__dirname, 'exportdata', 'Project_export.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  No Project_export.csv found - skipping project import');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: crypto.randomUUID(), // Generate new UUID instead of using MongoDB ObjectId
      toe_id: row.toe_id,
      client_id: row.client_id,
      project_name: row.project_name,
      job_number: convertValue(row.job_number, 'integer'),
      legacy_job_number: row.legacy_job_number,
      legacy_job_id: row.legacy_job_id,
      lead_department: row.lead_department,
      other_departments: row.other_departments && row.other_departments.trim() ? JSON.parse(row.other_departments) : [],
      office: row.office || 'Bay of Plenty',
      budget_hours: convertValue(row.budget_hours, 'decimal'),
      budget_fees: convertValue(row.budget_fees, 'decimal'),
      actual_hours: convertValue(row.actual_hours, 'decimal') || 0,
      actual_fees: convertValue(row.actual_fees, 'decimal') || 0,
      start_date: row.start_date,
      end_date: row.end_date,
      progress_percentage: convertValue(row.progress_percentage, 'decimal') || 0,
      status: row.status || 'not_started',
      project_manager: row.project_manager,
      billing_model: row.billing_model || 'time_and_materials',
      budget_alert_75: convertValue(row.budget_alert_75, 'boolean') || false,
      budget_alert_90: convertValue(row.budget_alert_90, 'boolean') || false,
      signed_toe_url: row.signed_toe_url,
      ai_tags: row.ai_tags && row.ai_tags.trim() ? JSON.parse(row.ai_tags) : [],
      archived_date: row.archived_date,
      archived_by: row.archived_by,
      custom_fields: row.custom_fields && row.custom_fields.trim() ? JSON.parse(row.custom_fields) : {}
    }));

    const { data: result, error } = await supabase
      .from('project')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing projects:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} projects`);
    }
  } catch (err) {
    console.log('⚠️  Error importing projects:', err.message);
  }
}

// Import tasks
async function importTasks() {
  console.log('✅ Importing Tasks...');
  try {
    const csvPath = path.join(__dirname, 'exportdata', 'Task_export.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  No Task_export.csv found - skipping task import');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: crypto.randomUUID(), // Generate new UUID instead of using MongoDB ObjectId
      project_id: row.project_id,
      task_name: row.task_name,
      section: row.section,
      assignee_email: row.assignee_email,
      estimated_hours: convertValue(row.estimated_hours, 'decimal'),
      actual_hours: convertValue(row.actual_hours, 'decimal') || 0,
      status: row.status || 'not_started',
      completion_percentage: convertValue(row.completion_percentage, 'decimal') || 0,
      due_date: row.due_date,
      priority: row.priority || 'medium',
      is_billable: convertValue(row.is_billable, 'boolean') !== false,
      template_id: row.template_id
    }));

    const { data: result, error } = await supabase
      .from('task')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing tasks:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} tasks`);
    }
  } catch (err) {
    console.log('⚠️  Error importing tasks:', err.message);
  }
}

// Import time entries
async function importTimeEntries() {
  console.log('⏰ Importing Time Entries...');
  try {
    const csvPath = path.join(__dirname, 'exportdata', 'TimeEntry_export.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  No TimeEntry_export.csv found - skipping time entry import');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: crypto.randomUUID(), // Generate new UUID instead of using MongoDB ObjectId
      user_email: row.user_email,
      project_id: row.project_id,
      task_id: row.task_id,
      phase: row.phase,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      minutes: convertValue(row.minutes, 'integer'),
      description: row.description,
      billable: convertValue(row.billable, 'boolean') !== false,
      base_rate_at_entry: convertValue(row.base_rate_at_entry, 'decimal'),
      billable_rate_effective: convertValue(row.billable_rate_effective, 'decimal'),
      cost_amount: convertValue(row.cost_amount, 'decimal'),
      billable_amount: convertValue(row.billable_amount, 'decimal'),
      invoiced_amount: convertValue(row.invoiced_amount, 'decimal') || 0,
      status: row.status || 'approved',
      submission_week: row.submission_week,
      submitted_at: row.submitted_at,
      approved_at: row.approved_at,
      approved_by: row.approved_by,
      invoice_id: row.invoice_id,
      write_off_reason: row.write_off_reason,
      timer_session_id: row.timer_session_id,
      rounding_applied: convertValue(row.rounding_applied, 'boolean') || false,
      original_minutes: convertValue(row.original_minutes, 'integer'),
      entry_source: row.entry_source || 'manual',
      custom_fields: row.custom_fields && row.custom_fields.trim() ? JSON.parse(row.custom_fields) : null
    }));

    const { data: result, error } = await supabase
      .from('time_entry')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing time entries:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} time entries`);
    }
  } catch (err) {
    console.log('⚠️  Error importing time entries:', err.message);
  }
}

// Import company settings
async function importCompanySettings() {
  console.log('⚙️  Importing Company Settings...');
  try {
    const csvPath = path.join(__dirname, 'exportdata', 'CompanySettings_export.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  No CompanySettings_export.csv found - skipping company settings import');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    if (data.length > 0) {
      const row = data[0]; // Company settings should be a single record
      const transformedData = {
        id: crypto.randomUUID(), // Generate new UUID instead of using MongoDB ObjectId
        theme_color: row.theme_color || '#5E0F68',
        company_name: row.company_name || 'Lysaght Consultants Limited',
        job_seed: convertValue(row.job_seed, 'integer') || 10000,
        charge_out_rates: row.charge_out_rates && row.charge_out_rates.trim() ? JSON.parse(row.charge_out_rates) : {
          graduate: 160,
          intermediate: 180,
          senior: 220,
          director: 250
        },
        billing_models: row.billing_models && row.billing_models.trim() ? JSON.parse(row.billing_models) : ['time_and_materials', 'fixed_fee', 'profit_share'],
        tax_rate: convertValue(row.tax_rate, 'decimal') || 0.15,
        professional_indemnity_cover: convertValue(row.professional_indemnity_cover, 'decimal') || 2000000,
        public_liability_cover: convertValue(row.public_liability_cover, 'decimal') || 10000000
      };

      const { data: result, error } = await supabase
        .from('company_settings')
        .upsert(transformedData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error importing company settings:', error);
      } else {
        console.log('✅ Imported company settings');
      }
    }
  } catch (err) {
    console.log('⚠️  Error importing company settings:', err.message);
  }
}

// Main import function
async function importMainData() {
  console.log('🚀 Starting Base44 main data import...\n');
  
  try {
    // Import in dependency order
    await importCompanySettings();
    await importClients();
    await importProjects();
    await importTasks();
    await importTimeEntries();
    
    console.log('\n🎉 Base44 main data import completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure you have run the create-base44-entities.sql script in your Supabase SQL Editor');
    console.log('2. Test your application - it should now work with proper Base44 entity data');
    console.log('3. All JSX files should work without modification');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importMainData();
