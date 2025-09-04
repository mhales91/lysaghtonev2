// Add sample data to existing tables
// Run this with: node add-sample-data.js

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

// Helper function to generate UUID
function gen_random_uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function addSampleData() {
  console.log('🚀 Adding sample data...');
  
  try {
    // Add sample tasks
    console.log('📋 Adding sample tasks...');
    const { data: projects } = await supabaseAdmin.from('projects').select('id').limit(3);
    
    if (projects && projects.length > 0) {
      const sampleTasks = [
        {
          id: gen_random_uuid(),
          name: 'Initial Design',
          project_id: projects[0].id,
          description: 'Create initial design concepts',
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: gen_random_uuid(),
          name: 'Client Review',
          project_id: projects[0].id,
          description: 'Review design with client',
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: gen_random_uuid(),
          name: 'Final Implementation',
          project_id: projects[1]?.id || projects[0].id,
          description: 'Implement final design',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { error: tasksError } = await supabaseAdmin
        .from('tasks')
        .upsert(sampleTasks, { onConflict: 'id' });
      
      if (tasksError) {
        console.error('Error adding tasks:', tasksError);
      } else {
        console.log(`✅ Added ${sampleTasks.length} sample tasks`);
      }
    }
    
    // Add sample time entries
    console.log('⏰ Adding sample time entries...');
    const { data: tasks } = await supabaseAdmin.from('tasks').select('id').limit(3);
    const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
    
    if (tasks && tasks.length > 0 && users && users.length > 0) {
      const sampleTimeEntries = [
        {
          id: gen_random_uuid(),
          user_id: users[0].id,
          task_id: tasks[0].id,
          start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          duration_minutes: 60,
          description: 'Worked on initial design concepts',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: gen_random_uuid(),
          user_id: users[0].id,
          task_id: tasks[1]?.id || tasks[0].id,
          start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          end_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          duration_minutes: 60,
          description: 'Client meeting and feedback',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { error: timeEntriesError } = await supabaseAdmin
        .from('time_entries')
        .upsert(sampleTimeEntries, { onConflict: 'id' });
      
      if (timeEntriesError) {
        console.error('Error adding time entries:', timeEntriesError);
      } else {
        console.log(`✅ Added ${sampleTimeEntries.length} sample time entries`);
      }
    }
    
    console.log('✅ Sample data addition completed!');
    
  } catch (error) {
    console.error('❌ Failed to add sample data:', error);
  }
}

// Run the addition
addSampleData();
