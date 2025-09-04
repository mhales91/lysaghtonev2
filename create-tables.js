// Create all necessary tables for Base44 data import
// Run this with: node create-tables.js

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
    // Create clients table
    console.log('📋 Creating clients table...');
    const { error: clientsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (clientsError) {
      console.error('❌ Error creating clients table:', clientsError);
    } else {
      console.log('✅ Clients table created successfully');
    }
    
    // Create projects table
    console.log('📋 Creating projects table...');
    const { error: projectsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (projectsError) {
      console.error('❌ Error creating projects table:', projectsError);
    } else {
      console.log('✅ Projects table created successfully');
    }
    
    // Create tasks table
    console.log('📋 Creating tasks table...');
    const { error: tasksError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (tasksError) {
      console.error('❌ Error creating tasks table:', tasksError);
    } else {
      console.log('✅ Tasks table created successfully');
    }
    
    // Create time_entries table
    console.log('📋 Creating time_entries table...');
    const { error: timeEntriesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.time_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
            start_time TIMESTAMPTZ,
            end_time TIMESTAMPTZ,
            duration_minutes INTEGER,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (timeEntriesError) {
      console.error('❌ Error creating time_entries table:', timeEntriesError);
    } else {
      console.log('✅ Time entries table created successfully');
    }
    
    // Create company_settings table
    console.log('📋 Creating company_settings table...');
    const { error: settingsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.company_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (settingsError) {
      console.error('❌ Error creating company_settings table:', settingsError);
    } else {
      console.log('✅ Company settings table created successfully');
    }
    
    // Enable RLS on all tables
    console.log('🔒 Enabling Row Level Security...');
    const tables = ['clients', 'projects', 'tasks', 'time_entries', 'company_settings'];
    
    for (const table of tables) {
      const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsError) {
        console.error(`❌ Error enabling RLS on ${table}:`, rlsError);
      } else {
        console.log(`✅ RLS enabled on ${table}`);
      }
    }
    
    // Create policies for all tables
    console.log('🛡️ Creating RLS policies...');
    const policies = [
      { table: 'clients', action: 'SELECT' },
      { table: 'clients', action: 'INSERT' },
      { table: 'clients', action: 'UPDATE' },
      { table: 'clients', action: 'DELETE' },
      { table: 'projects', action: 'SELECT' },
      { table: 'projects', action: 'INSERT' },
      { table: 'projects', action: 'UPDATE' },
      { table: 'projects', action: 'DELETE' },
      { table: 'tasks', action: 'SELECT' },
      { table: 'tasks', action: 'INSERT' },
      { table: 'tasks', action: 'UPDATE' },
      { table: 'tasks', action: 'DELETE' },
      { table: 'time_entries', action: 'SELECT' },
      { table: 'time_entries', action: 'INSERT' },
      { table: 'time_entries', action: 'UPDATE' },
      { table: 'time_entries', action: 'DELETE' },
      { table: 'company_settings', action: 'SELECT' },
      { table: 'company_settings', action: 'INSERT' },
      { table: 'company_settings', action: 'UPDATE' },
      { table: 'company_settings', action: 'DELETE' }
    ];
    
    for (const policy of policies) {
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Users can ${policy.action.toLowerCase()} all ${policy.table}" ON public.${policy.table}
              FOR ${policy.action} USING (true);
        `
      });
      
      if (policyError) {
        console.error(`❌ Error creating policy for ${policy.table}:`, policyError);
      } else {
        console.log(`✅ Policy created for ${policy.table} ${policy.action}`);
      }
    }
    
    // Create indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);',
      'CREATE INDEX IF NOT EXISTS idx_company_settings_key ON public.company_settings(key);'
    ];
    
    for (const index of indexes) {
      const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
        sql: index
      });
      
      if (indexError) {
        console.error('❌ Error creating index:', indexError);
      } else {
        console.log('✅ Index created successfully');
      }
    }
    
    console.log('\n🎉 All tables created successfully!');
    console.log('📋 Tables created: clients, projects, tasks, time_entries, company_settings');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

// Run the table creation
createTables();
