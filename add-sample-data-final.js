// Add sample data to all tables that the application expects
// Run this with: node add-sample-data-final.js

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
  console.log('🚀 Adding sample data to all tables...');
  
  try {
    // Get existing data for relationships
    const { data: clients } = await supabaseAdmin.from('clients').select('id').limit(5);
    const { data: projects } = await supabaseAdmin.from('projects').select('id').limit(5);
    const { data: tasks } = await supabaseAdmin.from('tasks').select('id').limit(5);
    const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
    
    // Add sample TOE documents
    console.log('📄 Adding sample TOE documents...');
    if (clients && projects && clients.length > 0 && projects.length > 0) {
      const sampleTOEs = [
        {
          id: gen_random_uuid(),
          client_id: clients[0].id,
          project_id: projects[0].id,
          title: 'Terms of Engagement - Project Alpha',
          content: 'This is a sample TOE document for Project Alpha.',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: gen_random_uuid(),
          client_id: clients[1]?.id || clients[0].id,
          project_id: projects[1]?.id || projects[0].id,
          title: 'Terms of Engagement - Project Beta',
          content: 'This is a sample TOE document for Project Beta.',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { error: toeError } = await supabaseAdmin
        .from('t_o_e')
        .upsert(sampleTOEs, { onConflict: 'id' });
      
      if (toeError) {
        console.error('Error adding TOE documents:', toeError);
      } else {
        console.log(`✅ Added ${sampleTOEs.length} TOE documents`);
      }
    }
    
    // Add sample analytics settings
    console.log('📊 Adding sample analytics settings...');
    const sampleAnalyticsSettings = [
      {
        id: gen_random_uuid(),
        key: 'dashboard_refresh_interval',
        value: '30000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        key: 'chart_default_type',
        value: 'line',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        key: 'data_retention_days',
        value: '365',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: analyticsError } = await supabaseAdmin
      .from('analytics_setting')
      .upsert(sampleAnalyticsSettings, { onConflict: 'key' });
    
    if (analyticsError) {
      console.error('Error adding analytics settings:', analyticsError);
    } else {
      console.log(`✅ Added ${sampleAnalyticsSettings.length} analytics settings`);
    }
    
    // Add sample dashboard settings
    console.log('📋 Adding sample dashboard settings...');
    const sampleDashboardSettings = [
      {
        id: gen_random_uuid(),
        key: 'default_view',
        value: 'grid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        key: 'items_per_page',
        value: '20',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        key: 'auto_refresh',
        value: 'true',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: dashboardError } = await supabaseAdmin
      .from('dashboard_settings')
      .upsert(sampleDashboardSettings, { onConflict: 'key' });
    
    if (dashboardError) {
      console.error('Error adding dashboard settings:', dashboardError);
    } else {
      console.log(`✅ Added ${sampleDashboardSettings.length} dashboard settings`);
    }
    
    // Add sample billing settings
    console.log('💰 Adding sample billing settings...');
    const sampleBillingSettings = [
      {
        id: gen_random_uuid(),
        key: 'default_rate',
        value: '150.00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        key: 'currency',
        value: 'NZD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        key: 'tax_rate',
        value: '0.15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: billingError } = await supabaseAdmin
      .from('billing_settings')
      .upsert(sampleBillingSettings, { onConflict: 'key' });
    
    if (billingError) {
      console.error('Error adding billing settings:', billingError);
    } else {
      console.log(`✅ Added ${sampleBillingSettings.length} billing settings`);
    }
    
    // Add sample task templates
    console.log('📝 Adding sample task templates...');
    const sampleTaskTemplates = [
      {
        id: gen_random_uuid(),
        name: 'Initial Design',
        description: 'Create initial design concepts and mockups',
        estimated_hours: 8.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        name: 'Client Review',
        description: 'Review design with client and gather feedback',
        estimated_hours: 2.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        name: 'Final Implementation',
        description: 'Implement final design and deliverables',
        estimated_hours: 16.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: templatesError } = await supabaseAdmin
      .from('task_templates')
      .upsert(sampleTaskTemplates, { onConflict: 'id' });
    
    if (templatesError) {
      console.error('Error adding task templates:', templatesError);
    } else {
      console.log(`✅ Added ${sampleTaskTemplates.length} task templates`);
    }
    
    // Add sample invoices
    console.log('🧾 Adding sample invoices...');
    if (clients && clients.length > 0) {
      const sampleInvoices = [
        {
          id: gen_random_uuid(),
          invoice_number: 'INV-001',
          client_id: clients[0].id,
          amount: 5000.00,
          status: 'draft',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: gen_random_uuid(),
          invoice_number: 'INV-002',
          client_id: clients[1]?.id || clients[0].id,
          amount: 7500.00,
          status: 'sent',
          due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { error: invoicesError } = await supabaseAdmin
        .from('invoices')
        .upsert(sampleInvoices, { onConflict: 'id' });
      
      if (invoicesError) {
        console.error('Error adding invoices:', invoicesError);
      } else {
        console.log(`✅ Added ${sampleInvoices.length} invoices`);
      }
    }
    
    // Add sample prompts
    console.log('🤖 Adding sample prompts...');
    const samplePrompts = [
      {
        id: gen_random_uuid(),
        name: 'Project Brief Generator',
        content: 'Generate a comprehensive project brief based on client requirements',
        category: 'project_management',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: gen_random_uuid(),
        name: 'Invoice Template',
        content: 'Create a professional invoice template with company branding',
        category: 'billing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { error: promptsError } = await supabaseAdmin
      .from('prompts')
      .upsert(samplePrompts, { onConflict: 'id' });
    
    if (promptsError) {
      console.error('Error adding prompts:', promptsError);
    } else {
      console.log(`✅ Added ${samplePrompts.length} prompts`);
    }
    
    console.log('✅ Sample data addition completed!');
    
  } catch (error) {
    console.error('❌ Failed to add sample data:', error);
  }
}

// Run the addition
addSampleData();
