// Create tables using direct SQL execution
// Run this with: node create-tables-simple.js

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

async function createTables() {
  console.log('🚀 Creating database tables...');
  
  try {
    // Test connection first
    console.log('🔌 Testing connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    console.log('✅ Connection successful');
    
    // Create clients table by trying to insert a test record
    console.log('📋 Creating clients table...');
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .insert({ name: 'Test Client' });
    
    if (clientsError && clientsError.code === '42P01') {
      console.log('❌ Clients table does not exist. You need to create it manually in Supabase dashboard.');
      console.log('📝 Please go to your Supabase dashboard and run the create-all-tables.sql script.');
    } else if (clientsError) {
      console.error('❌ Error with clients table:', clientsError);
    } else {
      console.log('✅ Clients table exists and is accessible');
    }
    
    // Test other tables
    const tables = ['projects', 'tasks', 'time_entries', 'company_settings'];
    
    for (const table of tables) {
      console.log(`📋 Testing ${table} table...`);
      const { error: tableError } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        console.log(`❌ ${table} table does not exist.`);
      } else if (tableError) {
        console.log(`⚠️ ${table} table exists but has issues:`, tableError.message);
      } else {
        console.log(`✅ ${table} table exists and is accessible`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('If any tables are missing, you need to create them manually.');
    console.log('Go to your Supabase dashboard and run the create-all-tables.sql script.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the table check
createTables();
