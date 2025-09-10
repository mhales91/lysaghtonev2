import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';

// Create service role client for admin operations (bypasses RLS)
const supabaseUrl = 'https://lysaghtone.com/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTY2ODEyOTEsImV4cCI6MjA3MjI1NzI5MX0.M-3C2n285htKskqDHhGQMJx509mTAObsi3WRkpJv5iA';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

// Get all role permissions from database
export const getRolePermissions = async () => {
  try {
    console.log('🔍 Attempting to fetch all role permissions...');
    
    // Try the most basic query possible - no ordering, no filters
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('user_role, permissions');
    
    if (error) {
      console.error('Error fetching role permissions:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return {};
    }
    
    console.log('✅ Successfully fetched role permissions:', data);
    
    // Convert array to object keyed by user_role
    const permissionsMap = {};
    data.forEach(item => {
      if (item.user_role && item.user_role.trim() !== '') {
        permissionsMap[item.user_role] = item.permissions;
      }
    });
    
    console.log('✅ Final permissions map:', permissionsMap);
    return permissionsMap;
  } catch (error) {
    console.error('Error in getRolePermissions:', error);
    return {};
  }
};

// Get permissions for a specific role
export const getRolePermission = async (role) => {
  try {
    if (!role || role.trim() === '') {
      console.error('Empty or invalid role provided:', role);
      return [];
    }
    
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('permissions')
      .eq('user_role', role)
      .single();
    
    if (error) {
      console.error(`Error fetching permissions for role ${role}:`, error);
      return [];
    }
    
    return data?.permissions || [];
  } catch (error) {
    console.error(`Error in getRolePermission for ${role}:`, error);
    return [];
  }
};

// Update permissions for a specific role
export const updateRolePermission = async (role, permissions) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .upsert({
        user_role: role,
        permissions: permissions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_role'  // Add this to specify the conflict resolution column
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating permissions for role ${role}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in updateRolePermission for ${role}:`, error);
    throw error;
  }
};

// Update multiple role permissions at once
export const updateMultipleRolePermissions = async (permissionsMap) => {
  try {
    const updates = Object.entries(permissionsMap).map(([role, permissions]) => ({
      user_role: role,
      permissions: permissions,
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .upsert(updates)
      .select();
    
    if (error) {
      console.error('Error updating multiple role permissions:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateMultipleRolePermissions:', error);
    throw error;
  }
};

// Initialize role permissions with defaults (for first-time setup)
export const initializeRolePermissions = async () => {
  const defaultPermissions = {
    'Admin': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings', 'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library', 'TOE Admin', 'Import Jobs'],
    'Director': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings', 'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library', 'TOE Admin', 'Import Jobs'],
    'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
    'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
    'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
  };
  
  try {
    await updateMultipleRolePermissions(defaultPermissions);
    console.log('Role permissions initialized with defaults');
  } catch (error) {
    console.error('Error initializing role permissions:', error);
    throw error;
  }
};
