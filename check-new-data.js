// Check the newly imported data
// Run this with: node check-new-data.js

import { createClient } from '@supabase/supabase-js';

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

async function checkNewData() {
  console.log('🔍 Checking newly imported data...');
  
  try {
    // Check clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(5);
    
    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    } else {
      console.log(`✅ Clients: ${clients.length} found`);
      if (clients.length > 0) {
        console.log(`   Sample client: ${clients[0].name}`);
      }
    }
    
    // Check projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    } else {
      console.log(`✅ Projects: ${projects.length} found`);
      if (projects.length > 0) {
        console.log(`   Sample project: ${projects[0].name}`);
      }
    }
    
    // Check tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .limit(5);
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    } else {
      console.log(`✅ Tasks: ${tasks.length} found`);
      if (tasks.length > 0) {
        console.log(`   Sample task: ${tasks[0].name}`);
      }
    }
    
    // Check time entries
    const { data: timeEntries, error: timeEntriesError } = await supabaseAdmin
      .from('time_entries')
      .select('*')
      .limit(5);
    
    if (timeEntriesError) {
      console.error('Error fetching time entries:', timeEntriesError);
    } else {
      console.log(`✅ Time Entries: ${timeEntries.length} found`);
      if (timeEntries.length > 0) {
        console.log(`   Sample time entry: ${timeEntries[0].description || 'No description'}`);
      }
    }
    
    // Check company settings
    const { data: companySettings, error: companySettingsError } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .limit(5);
    
    if (companySettingsError) {
      console.error('Error fetching company settings:', companySettingsError);
    } else {
      console.log(`✅ Company Settings: ${companySettings.length} found`);
      if (companySettings.length > 0) {
        console.log(`   Sample setting: ${companySettings[0].key} = ${companySettings[0].value}`);
      }
    }
    
    console.log('\n🎉 Data check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkNewData();
