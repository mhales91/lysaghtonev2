// Create Base44 entity tables
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'http://134.199.146.249:8000';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Creating Base44 entity tables...\n');

// Read the SQL script
const sqlScript = fs.readFileSync('create-base44-entities.sql', 'utf8');

// Split into individual statements (basic approach)
const statements = sqlScript
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute`);

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  if (statement.trim()) {
    try {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Use direct SQL execution
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`Statement ${i + 1} result:`, error.message);
      } else {
        console.log(`Statement ${i + 1} completed successfully`);
      }
    } catch (err) {
      console.log(`Statement ${i + 1} error:`, err.message);
    }
  }
}

console.log('\n✅ Base44 entity table creation completed!');
console.log('Note: Some statements may have failed if tables already exist - this is expected.');
console.log('\n📋 Next steps:');
console.log('1. Run: node import-base44-data.js');
console.log('2. Test your application');
