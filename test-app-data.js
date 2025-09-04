// Test what data the application is trying to fetch
// Run this with: node test-app-data.js

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

async function testAppData() {
  console.log('🔍 Testing what data the application is trying to fetch...');
  
  try {
    // Test the tables that the app is likely trying to access
    const tablesToTest = [
      'clients',
      'projects', 
      'tasks',
      'time_entries',
      'company_settings',
      'users',
      't_o_e', // This might be a table the app is looking for
      'analytics_setting', // Another table from the console errors
      'project', // Singular form
      'time_entry' // Singular form
    ];
    
    for (const table of tablesToTest) {
      console.log(`\n📋 Testing table: ${table}`);
      
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(5);
        
        if (error) {
          if (error.code === 'PGRST205') {
            console.log(`❌ Table ${table} does not exist`);
          } else {
            console.log(`⚠️ Error with table ${table}:`, error.message);
          }
        } else {
          console.log(`✅ Table ${table} exists with ${data.length} records`);
          if (data.length > 0) {
            console.log(`📝 Sample record:`, Object.keys(data[0]));
          }
        }
      } catch (err) {
        console.log(`❌ Exception with table ${table}:`, err.message);
      }
    }
    
    // Test some specific queries that might be failing
    console.log('\n🔍 Testing specific queries...');
    
    // Test the sort queries that are failing
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.log('❌ Projects sort query failed:', error.message);
      } else {
        console.log(`✅ Projects sort query works, found ${data.length} projects`);
      }
    } catch (err) {
      console.log('❌ Projects sort query exception:', err.message);
    }
    
    // Test time entries query
    try {
      const { data, error } = await supabaseAdmin
        .from('time_entries')
        .select('*')
        .limit(10);
      
      if (error) {
        console.log('❌ Time entries query failed:', error.message);
      } else {
        console.log(`✅ Time entries query works, found ${data.length} entries`);
      }
    } catch (err) {
      console.log('❌ Time entries query exception:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAppData();
