// Check total counts of imported data
// Run this with: node check-total-counts.js

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

async function checkTotalCounts() {
  console.log('🔍 Checking total counts of imported data...');
  
  try {
    // Check total clients
    const { count: clientsCount, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (clientsError) {
      console.error('Error counting clients:', clientsError);
    } else {
      console.log(`✅ Total Clients: ${clientsCount}`);
    }
    
    // Check total projects
    const { count: projectsCount, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (projectsError) {
      console.error('Error counting projects:', projectsError);
    } else {
      console.log(`✅ Total Projects: ${projectsCount}`);
    }
    
    // Check total tasks
    const { count: tasksCount, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    
    if (tasksError) {
      console.error('Error counting tasks:', tasksError);
    } else {
      console.log(`✅ Total Tasks: ${tasksCount}`);
    }
    
    // Check total time entries
    const { count: timeEntriesCount, error: timeEntriesError } = await supabaseAdmin
      .from('time_entries')
      .select('*', { count: 'exact', head: true });
    
    if (timeEntriesError) {
      console.error('Error counting time entries:', timeEntriesError);
    } else {
      console.log(`✅ Total Time Entries: ${timeEntriesCount}`);
    }
    
    // Check total company settings
    const { count: companySettingsCount, error: companySettingsError } = await supabaseAdmin
      .from('company_settings')
      .select('*', { count: 'exact', head: true });
    
    if (companySettingsError) {
      console.error('Error counting company settings:', companySettingsError);
    } else {
      console.log(`✅ Total Company Settings: ${companySettingsCount}`);
    }
    
    console.log('\n🎉 Total counts check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkTotalCounts();
