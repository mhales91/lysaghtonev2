import { supabase } from '@/lib/supabase-client';

// Get all role permissions from database
export const getRolePermissions = async () => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role');
    
    if (error) {
      console.error('Error fetching role permissions:', error);
      return {};
    }
    
    // Convert array to object keyed by role
    const permissionsMap = {};
    data.forEach(item => {
      permissionsMap[item.role] = item.permissions;
    });
    
    return permissionsMap;
  } catch (error) {
    console.error('Error in getRolePermissions:', error);
    return {};
  }
};

// Get permissions for a specific role
export const getRolePermission = async (role) => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permissions')
      .eq('role', role)
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
    const { data, error } = await supabase
      .from('role_permissions')
      .upsert({
        role: role,
        permissions: permissions,
        updated_at: new Date().toISOString()
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
      role: role,
      permissions: permissions,
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
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
