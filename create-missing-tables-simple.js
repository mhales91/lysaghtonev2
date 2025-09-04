// Create missing tables using Supabase client API
// Run this with: node create-missing-tables-simple.js

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

async function createMissingTables() {
  console.log('🚀 Creating missing tables...');
  
  try {
    // Test if tables exist by trying to query them
    const tablesToCreate = [
      { name: 't_o_e', description: 'Terms of Engagement' },
      { name: 'analytics_setting', description: 'Analytics Settings' },
      { name: 'project', description: 'Project (singular)' },
      { name: 'time_entry', description: 'Time Entry (singular)' }
    ];
    
    for (const table of tablesToCreate) {
      console.log(`📋 Checking table: ${table.name}`);
      
      try {
        // Try to query the table
        const { data, error } = await supabaseAdmin
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (error && error.code === 'PGRST205') {
          console.log(`❌ Table ${table.name} does not exist - you need to create it manually`);
          console.log(`📝 Please go to your Supabase dashboard and run the create-missing-tables.sql script`);
        } else if (error) {
          console.log(`⚠️ Error with table ${table.name}:`, error.message);
        } else {
          console.log(`✅ Table ${table.name} exists with ${data.length} records`);
        }
      } catch (err) {
        console.log(`❌ Exception with table ${table.name}:`, err.message);
      }
    }
    
    // Copy data from existing tables to new tables (if they exist)
    console.log('\n📋 Copying data to new tables...');
    
    // Copy projects to project table
    try {
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('*');
      
      if (!projectsError && projects && projects.length > 0) {
        console.log(`📊 Found ${projects.length} projects to copy`);
        
        // Try to insert into project table
        const { error: insertError } = await supabaseAdmin
          .from('project')
          .upsert(projects, { onConflict: 'id' });
        
        if (insertError) {
          console.log(`⚠️ Could not copy to project table:`, insertError.message);
        } else {
          console.log(`✅ Copied ${projects.length} projects to project table`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception copying projects:`, err.message);
    }
    
    // Copy time_entries to time_entry table
    try {
      const { data: timeEntries, error: timeEntriesError } = await supabaseAdmin
        .from('time_entries')
        .select('*');
      
      if (!timeEntriesError && timeEntries && timeEntries.length > 0) {
        console.log(`📊 Found ${timeEntries.length} time entries to copy`);
        
        // Try to insert into time_entry table
        const { error: insertError } = await supabaseAdmin
          .from('time_entry')
          .upsert(timeEntries, { onConflict: 'id' });
        
        if (insertError) {
          console.log(`⚠️ Could not copy to time_entry table:`, insertError.message);
        } else {
          console.log(`✅ Copied ${timeEntries.length} time entries to time_entry table`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception copying time entries:`, err.message);
    }
    
    console.log('\n📋 Summary:');
    console.log('Some tables need to be created manually in your Supabase dashboard.');
    console.log('Please run the create-missing-tables.sql script in your Supabase SQL Editor.');
    
  } catch (error) {
    console.error('❌ Failed to create missing tables:', error);
  }
}

// Run the creation
createMissingTables();
