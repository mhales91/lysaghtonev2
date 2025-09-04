// Create missing tables that the application expects
// Run this with: node create-missing-tables.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
    // Read the SQL file
    const sqlContent = fs.readFileSync('create-missing-tables.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', {
            sql: statement
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('✅ Missing tables creation completed!');
    
  } catch (error) {
    console.error('❌ Failed to create missing tables:', error);
  }
}

// Run the creation
createMissingTables();
