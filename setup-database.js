// Script to set up the database tables for role permissions
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lysaghtone.com/';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    try {
        console.log('Setting up database tables...');
        
        // Read the SQL file
        const sqlContent = fs.readFileSync('initialize-role-permissions.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                const { error } = await supabase.rpc('exec_sql', { sql: statement });
                if (error) {
                    console.error('Error executing statement:', error);
                } else {
                    console.log('✓ Statement executed successfully');
                }
            }
        }
        
        console.log('Database setup completed!');
    } catch (error) {
        console.error('Error setting up database:', error);
        console.log('\nPlease run the SQL script manually in your Supabase dashboard:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy the contents of initialize-role-permissions.sql');
        console.log('4. Paste and run the SQL script');
    }
}

setupDatabase();
