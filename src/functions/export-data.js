// Data Export Function
// Based on Base44 exportAllData function, adapted for Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple CSV conversion function
function arrayToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export default async function exportData(req) {
  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Check user role - only allow Admin/Director to export all data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['Admin', 'Director'].includes(userData.user_role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log('Starting data export for user:', user.email);

    // Fetch all major entities using service role
    const [
      projectsResult,
      clientsResult,
      timeEntriesResult,
      invoicesResult,
      toesResult,
      tasksResult,
      usersResult,
      companySettingsResult
    ] = await Promise.all([
      supabase.from('project').select('*').order('created_at', { ascending: false }).limit(5000),
      supabase.from('client').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('time_entry').select('*').order('created_at', { ascending: false }).limit(10000),
      supabase.from('invoice').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('toe').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('task').select('*').order('created_at', { ascending: false }).limit(5000),
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('company_settings').select('*')
    ]);

    const projects = projectsResult.data || [];
    const clients = clientsResult.data || [];
    const timeEntries = timeEntriesResult.data || [];
    const invoices = invoicesResult.data || [];
    const toes = toesResult.data || [];
    const tasks = tasksResult.data || [];
    const users = usersResult.data || [];
    const companySettings = companySettingsResult.data || [];

    console.log('Data fetched:', {
      projects: projects.length,
      clients: clients.length,
      timeEntries: timeEntries.length,
      invoices: invoices.length,
      toes: toes.length,
      tasks: tasks.length,
      users: users.length
    });

    // Convert to CSV format
    const csvData = {
      projects: arrayToCSV(projects),
      clients: arrayToCSV(clients),
      time_entries: arrayToCSV(timeEntries),
      invoices: arrayToCSV(invoices),
      toes: arrayToCSV(toes),
      tasks: arrayToCSV(tasks),
      users: arrayToCSV(users.map(u => ({
        // Remove sensitive fields for security
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        user_role: u.user_role,
        department: u.department,
        office: u.office,
        created_at: u.created_at
      }))),
      company_settings: arrayToCSV(companySettings)
    };

    // Create a simple multi-file text format
    const exportContent = [
      '=== LYSAGHT CONSULTANTS DATA EXPORT ===',
      `Export Date: ${new Date().toISOString()}`,
      `Exported By: ${user.email}`,
      '',
      '=== PROJECTS ===',
      csvData.projects,
      '',
      '=== CLIENTS ===',
      csvData.clients,
      '',
      '=== TIME ENTRIES ===',
      csvData.time_entries,
      '',
      '=== INVOICES ===',
      csvData.invoices,
      '',
      '=== TOE DOCUMENTS ===',
      csvData.toes,
      '',
      '=== TASKS ===',
      csvData.tasks,
      '',
      '=== USERS ===',
      csvData.users,
      '',
      '=== COMPANY SETTINGS ===',
      csvData.company_settings,
      '',
      '=== END OF EXPORT ===',
      `Total Records: ${projects.length + clients.length + timeEntries.length + invoices.length + toes.length + tasks.length}`
    ].join('\n');

    return new Response(exportContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="lysaght_data_export_${new Date().toISOString().split('T')[0]}.txt"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Export failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'content-type': 'application/json' } 
      }
    );
  }
}
