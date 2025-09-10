import { supabase } from '../lib/supabase-client.js';

// All available pages for role permissions
export const allPages = [
    'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets',
    'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings',
    'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library',
    'TOE Admin', 'Import Jobs'
];

// All available dashboard widgets
export const allDashboardWidgets = [
    'Weekly Timesheet Hours',
    'Yearly Performance (FYTD)',
    'Workload',
    'CRM Pipeline - All Departments',
    'TOE Board - All Departments',
    'SLA Tracker - All Departments',
    'Project Portfolio',
    'Upcoming Projects',
    'Budget Utilisation'
];

// Available roles
export const availableRoles = ['Admin', 'Director', 'Manager', 'Staff', 'Client'];

/**
 * Get all roles from the database
 */
export const getRoles = async () => {
    try {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
};

/**
 * Get all permissions from the database
 */
export const getPermissions = async () => {
    try {
        const { data, error } = await supabase
            .from('permissions')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return [];
    }
};

/**
 * Get role permissions for a specific role by role name
 */
export const getRolePermissions = async (roleName) => {
    try {
        // First get the role ID
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single();
        
        if (roleError) {
            console.error('Role not found:', roleName, roleError);
            return [];
        }

        // Then get permissions for that role
        const { data, error } = await supabase
            .from('role_permissions')
            .select(`
                permission_id,
                permissions(name)
            `)
            .eq('role_id', roleData.id);
        
        if (error) throw error;
        
        return data?.map(item => item.permissions.name).filter(Boolean) || [];
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return [];
    }
};

/**
 * Save role permissions for a specific role
 */
export const saveRolePermissions = async (roleName, pageNames) => {
    try {
        // First, get the role ID
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single();
        
        if (roleError) throw roleError;
        if (!roleData) throw new Error(`Role ${roleName} not found`);

        // Get permission IDs for the pages
        const { data: permissionData, error: permissionError } = await supabase
            .from('permissions')
            .select('id, name')
            .in('name', pageNames);
        
        if (permissionError) throw permissionError;

        // Delete existing permissions for this role
        const { error: deleteError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleData.id);
        
        if (deleteError) throw deleteError;

        // Insert new permissions
        if (permissionData.length > 0) {
            const rolePermissions = permissionData.map(permission => ({
                role_id: roleData.id,
                permission_id: permission.id,
                granted_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('role_permissions')
                .insert(rolePermissions);
            
            if (insertError) throw insertError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving role permissions:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if a user has permission to access a specific page
 */
export const hasPermission = async (userRole, pageName) => {
    try {
        const permissions = await getRolePermissions(userRole);
        return permissions.includes(pageName);
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
};

/**
 * Initialize default permissions in the database
 */
export const initializeDefaultPermissions = async () => {
    try {
        console.log('Initializing default permissions...');
        
        // Check if roles exist, if not create them
        const { data: existingRoles } = await supabase
            .from('roles')
            .select('name');
        
        const existingRoleNames = existingRoles?.map(r => r.name) || [];
        
        for (const roleName of availableRoles) {
            if (!existingRoleNames.includes(roleName)) {
                const { error } = await supabase
                    .from('roles')
                    .insert({ name: roleName });
                if (error) {
                    console.error(`Error creating role ${roleName}:`, error);
                } else {
                    console.log(`Created role: ${roleName}`);
                }
            }
        }

        // Check if permissions exist, if not create them
        const { data: existingPermissions } = await supabase
            .from('permissions')
            .select('name');
        
        const existingPermissionNames = existingPermissions?.map(p => p.name) || [];
        
        for (const pageName of allPages) {
            if (!existingPermissionNames.includes(pageName)) {
                const { error } = await supabase
                    .from('permissions')
                    .insert({ name: pageName });
                if (error) {
                    console.error(`Error creating permission ${pageName}:`, error);
                } else {
                    console.log(`Created permission: ${pageName}`);
                }
            }
        }

        // Set up default role permissions
        const defaultPermissions = {
            'Admin': allPages,
            'Director': allPages,
            'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
            'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
            'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
        };

        for (const [roleName, pageNames] of Object.entries(defaultPermissions)) {
            console.log(`Setting up permissions for ${roleName}...`);
            await saveRolePermissions(roleName, pageNames);
        }

        console.log('Default permissions initialized successfully');
        return { success: true };
    } catch (error) {
        console.error('Error initializing default permissions:', error);
        return { success: false, error: error.message };
    }
};
