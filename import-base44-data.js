// Import Base44 CSV data into proper entity tables
// This script transforms CSV data to match Base44 JSON schema format

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
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
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
      return value.toLowerCase() === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case 'date':
      return value;
    default:
      return value;
  }
}

// Transform and import functions for each entity
async function importUsers() {
  console.log('👥 Importing Users...');
  try {
    // Check if User_export.csv exists
    const userCsvPath = path.join(__dirname, 'exportdata', 'User_export.csv');
    if (!fs.existsSync(userCsvPath)) {
      console.log('⚠️  No User_export.csv found - skipping user import');
      return;
    }
    
    const csvContent = fs.readFileSync(userCsvPath, 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: row.id || gen_random_uuid(),
      email: row.email,
      full_name: row.full_name,
      first_name: row.first_name,
      last_name: row.last_name,
      user_role: row.user_role || 'Staff',
      department: row.department,
      office: row.office || 'Bay of Plenty',
      approval_status: row.approval_status || 'pending',
      approved_by: row.approved_by,
      approved_date: row.approved_date,
      user_color: row.user_color || '#6366f1'
    }));

    const { data: result, error } = await supabase
      .from('users')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing users:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} users`);
    }
  } catch (err) {
    console.log('⚠️  Error importing users:', err.message);
  }
}

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
      id: row.id || gen_random_uuid(),
      company_name: row.company_name,
      contact_person: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address ? JSON.parse(row.address) : null,
      crm_stage: row.crm_stage || 'lead',
      tags: row.tags ? JSON.parse(row.tags) : [],
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

async function importProjects() {
  console.log('📋 Importing Projects...');
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'Project_export.csv'), 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: row.id || gen_random_uuid(),
      toe_id: row.toe_id,
      client_id: row.client_id,
      project_name: row.project_name,
      job_number: convertValue(row.job_number, 'integer'),
      legacy_job_number: row.legacy_job_number,
      legacy_job_id: row.legacy_job_id,
      lead_department: row.lead_department,
      other_departments: row.other_departments ? JSON.parse(row.other_departments) : [],
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
      ai_tags: row.ai_tags ? JSON.parse(row.ai_tags) : [],
      archived_date: row.archived_date,
      archived_by: row.archived_by,
      custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
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
    console.log('⚠️  No Project_export.csv found or error reading file');
  }
}

async function importTasks() {
  console.log('✅ Importing Tasks...');
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'Task_export.csv'), 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: row.id || gen_random_uuid(),
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
    console.log('⚠️  No Task_export.csv found or error reading file');
  }
}

async function importTimeEntries() {
  console.log('⏰ Importing Time Entries...');
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'TimeEntry_export.csv'), 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: row.id || gen_random_uuid(),
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
      custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null
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
    console.log('⚠️  No TimeEntry_export.csv found or error reading file');
  }
}

async function importTaskTemplates() {
  console.log('📝 Importing Task Templates...');
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'TaskTemplate_export.csv'), 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: row.id || gen_random_uuid(),
      name: row.name,
      dept: row.dept,
      default_hours: convertValue(row.default_hours, 'decimal'),
      is_billable: convertValue(row.is_billable, 'boolean') !== false,
      description: row.description
    }));

    const { data: result, error } = await supabase
      .from('task_template')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing task templates:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} task templates`);
    }
  } catch (err) {
    console.log('⚠️  No TaskTemplate_export.csv found or error reading file');
  }
}

async function importCompanySettings() {
  console.log('⚙️  Importing Company Settings...');
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'CompanySettings_export.csv'), 'utf8');
    const data = parseCSV(csvContent);
    
    if (data.length > 0) {
      const row = data[0]; // Company settings should be a single record
      const transformedData = {
        id: row.id || gen_random_uuid(),
        theme_color: row.theme_color || '#5E0F68',
        company_name: row.company_name || 'Lysaght Consultants Limited',
        job_seed: convertValue(row.job_seed, 'integer') || 10000,
        charge_out_rates: row.charge_out_rates ? JSON.parse(row.charge_out_rates) : {
          graduate: 160,
          intermediate: 180,
          senior: 220,
          director: 250
        },
        billing_models: row.billing_models ? JSON.parse(row.billing_models) : ['time_and_materials', 'fixed_fee', 'profit_share'],
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
    console.log('⚠️  No CompanySettings_export.csv found or error reading file');
  }
}

async function importAnalyticsSettings() {
  console.log('📊 Importing Analytics Settings...');
  try {
    const csvContent = fs.readFileSync(path.join(__dirname, 'exportdata', 'AnalyticsSetting_export.csv'), 'utf8');
    const data = parseCSV(csvContent);
    
    const transformedData = data.map(row => ({
      id: row.id || gen_random_uuid(),
      year: convertValue(row.year, 'integer'),
      company_monthly_budgets: row.company_monthly_budgets ? JSON.parse(row.company_monthly_budgets) : {},
      department_percentages: row.department_percentages ? JSON.parse(row.department_percentages) : {
        'Project Management': 25,
        'Engineering': 25,
        'Surveying': 25,
        'Planning': 25
      }
    }));

    const { data: result, error } = await supabase
      .from('analytics_setting')
      .upsert(transformedData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error importing analytics settings:', error);
    } else {
      console.log(`✅ Imported ${transformedData.length} analytics settings`);
    }
  } catch (err) {
    console.log('⚠️  No AnalyticsSetting_export.csv found or error reading file');
  }
}

// Main import function
async function importAllData() {
  console.log('🚀 Starting Base44 data import...\n');
  
  try {
    // Import in dependency order
    await importUsers();
    await importClients();
    await importCompanySettings();
    await importAnalyticsSettings();
    await importTaskTemplates();
    await importProjects();
    await importTasks();
    await importTimeEntries();
    
    console.log('\n🎉 Base44 data import completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the create-base44-entities.sql script in your Supabase SQL Editor');
    console.log('2. Test your application - it should now work with proper Base44 entity data');
    console.log('3. All JSX files should work without modification');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importAllData();