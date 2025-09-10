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

// Cache for table existence check to prevent repeated API calls
let tablesExistCache = null;
let tablesExistCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Check if the required tables exist (with caching)
 */
export const checkTablesExist = async () => {
    // Return cached result if still valid
    if (tablesExistCache !== null && Date.now() - tablesExistCacheTime < CACHE_DURATION) {
        return tablesExistCache;
    }

    try {
        // Try to query the roles table
        const { error: rolesError } = await supabase
            .from('roles')
            .select('id')
            .limit(1);
        
        if (rolesError) {
            // Check if it's a table doesn't exist error
            if (rolesError.message.includes('relation "public.roles" does not exist') || 
                rolesError.message.includes('relation "roles" does not exist') ||
                rolesError.code === 'PGRST116' ||
                rolesError.message.includes('does not exist')) {
                console.log('Roles table does not exist yet');
                tablesExistCache = false;
                tablesExistCacheTime = Date.now();
                return false;
            }
            console.log('Roles table error:', rolesError.message);
            tablesExistCache = false;
            tablesExistCacheTime = Date.now();
            return false;
        }

        // Try to query the permissions table
        const { error: permissionsError } = await supabase
            .from('permissions')
            .select('id')
            .limit(1);
        
        if (permissionsError) {
            // Check if it's a table doesn't exist error
            if (permissionsError.message.includes('relation "public.permissions" does not exist') || 
                permissionsError.message.includes('relation "permissions" does not exist') ||
                permissionsError.code === 'PGRST116' ||
                permissionsError.message.includes('does not exist')) {
                console.log('Permissions table does not exist yet');
                tablesExistCache = false;
                tablesExistCacheTime = Date.now();
                return false;
            }
            console.log('Permissions table error:', permissionsError.message);
            tablesExistCache = false;
            tablesExistCacheTime = Date.now();
            return false;
        }

        tablesExistCache = true;
        tablesExistCacheTime = Date.now();
        return true;
    } catch (error) {
        console.log('Error checking tables:', error);
        tablesExistCache = false;
        tablesExistCacheTime = Date.now();
        return false;
    }
};

/**
 * Get all roles from the database
 */
export const getRoles = async () => {
    try {
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
            return [];
        }

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
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
            return [];
        }

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
        // Check if roleName is empty or invalid
        if (!roleName || roleName.trim() === '') {
            console.log('Empty role name provided');
            return [];
        }

        // First check if tables exist
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
            console.log('Database tables do not exist yet');
            return [];
        }

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
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
            return { success: false, error: 'Database tables do not exist' };
        }

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
        // Check if userRole is empty or invalid
        if (!userRole || userRole.trim() === '') {
            console.log('Empty user role provided');
            return false;
        }

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
        
        // First check if tables exist
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
            const errorMsg = 'Database tables do not exist. Please run the SQL script in your Supabase dashboard first.';
            console.error(errorMsg);
            return { 
                success: false, 
                error: errorMsg,
                needsSqlScript: true 
            };
        }
        
        // Check if roles exist, if not create them
        const { data: existingRoles, error: rolesError } = await supabase
            .from('roles')
            .select('name');
        
        if (rolesError) {
            console.error('Error fetching existing roles:', rolesError);
            return { success: false, error: rolesError.message };
        }
        
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
        const { data: existingPermissions, error: permissionsError } = await supabase
            .from('permissions')
            .select('name');
        
        if (permissionsError) {
            console.error('Error fetching existing permissions:', permissionsError);
            return { success: false, error: permissionsError.message };
        }
        
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