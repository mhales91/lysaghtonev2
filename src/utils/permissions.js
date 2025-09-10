// Database-based permission utility functions
import { PermissionsService } from '@/api/permissions';

// All available pages
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

// Cache for permissions to avoid repeated database calls
let permissionsCache = new Map();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear cache
export const clearPermissionsCache = () => {
    permissionsCache.clear();
    cacheExpiry = 0;
};

// Get user's permissions from database
export const getUserPermissions = async (userId) => {
    const now = Date.now();
    
    // Check cache first
    if (permissionsCache.has(userId) && now < cacheExpiry) {
        return permissionsCache.get(userId);
    }
    
    try {
        const permissions = await PermissionsService.getUserPermissions(userId);
        const permissionNames = permissions.map(p => p.name);
        
        // Cache the result
        permissionsCache.set(userId, permissionNames);
        cacheExpiry = now + CACHE_DURATION;
        
        return permissionNames;
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return [];
    }
};

// Get user's roles from database
export const getUserRoles = async (userId) => {
    try {
        const roles = await PermissionsService.getUserRoles(userId);
        return roles.map(role => role.name);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
    }
};

// Check if user has permission to access a specific page
export const hasPermission = async (userId, pageName) => {
    try {
        const permissionName = getPermissionNameForPage(pageName);
        if (!permissionName) return false;
        
        return await PermissionsService.hasPermission(userId, permissionName);
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
};

// Check if current user can access User Management
export const canAccessUserManagement = async (userId) => {
    return await hasPermission(userId, 'User Management');
};

// Get all pages a user can access
export const getUserAccessiblePages = async (userId) => {
    try {
        const userRoles = await getUserRoles(userId);
        if (userRoles.length === 0) return [];
        
        // Get permissions for the first role (assuming single role for now)
        const role = await PermissionsService.getRoleByName(userRoles[0]);
        if (!role) return [];
        
        const pagePermissions = await PermissionsService.getRolePagePermissions(role.id);
        return pagePermissions;
    } catch (error) {
        console.error('Error fetching accessible pages:', error);
        return [];
    }
};

// Get all widgets a user can access
export const getUserAccessibleWidgets = async (userId) => {
    try {
        const userRoles = await getUserRoles(userId);
        if (userRoles.length === 0) return [];
        
        // Get permissions for the first role (assuming single role for now)
        const role = await PermissionsService.getRoleByName(userRoles[0]);
        if (!role) return [];
        
        const widgetPermissions = await PermissionsService.getRoleWidgetPermissions(role.id);
        return widgetPermissions;
    } catch (error) {
        console.error('Error fetching accessible widgets:', error);
        return [];
    }
};

// Helper function to convert page name to permission name
const getPermissionNameForPage = (pageName) => {
    const mapping = {
        'Dashboard': 'dashboard_access',
        'AI Assistant': 'ai_assistant_access',
        'CRM Pipeline': 'crm_pipeline_access',
        'TOE Manager': 'toe_manager_access',
        'Projects': 'projects_access',
        'Timesheets': 'timesheets_access',
        'Lysaght AI': 'lysaght_ai_access',
        'Billing': 'billing_access',
        'Analytics': 'analytics_access',
        'Task Templates': 'task_templates_access',
        'Company Settings': 'company_settings_access',
        'User Management': 'user_management_access',
        'AI Assistant Manager': 'ai_assistant_manager_access',
        'Billing Settings': 'billing_settings_access',
        'Analytics Settings': 'analytics_settings_access',
        'Prompt Library': 'prompt_library_access',
        'TOE Admin': 'toe_admin_access',
        'Import Jobs': 'import_jobs_access'
    };
    
    return mapping[pageName];
};

// Legacy functions for backward compatibility (now use database)
export const getRolePermissions = async (roleName) => {
    try {
        const role = await PermissionsService.getRoleByName(roleName);
        if (!role) return [];
        
        return await PermissionsService.getRolePagePermissions(role.id);
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return [];
    }
};

export const getRoleWidgetPermissions = async (roleName) => {
    try {
        const role = await PermissionsService.getRoleByName(roleName);
        if (!role) return [];
        
        return await PermissionsService.getRoleWidgetPermissions(role.id);
    } catch (error) {
        console.error('Error fetching role widget permissions:', error);
        return [];
    }
};

// Update role permissions
export const updateRolePermissions = async (roleName, pageNames) => {
    try {
        const role = await PermissionsService.getRoleByName(roleName);
        if (!role) throw new Error(`Role ${roleName} not found`);
        
        await PermissionsService.updateRolePagePermissions(role.id, pageNames);
        clearPermissionsCache(); // Clear cache after update
    } catch (error) {
        console.error('Error updating role permissions:', error);
        throw error;
    }
};

// Update role widget permissions
export const updateRoleWidgetPermissions = async (roleName, widgetNames) => {
    try {
        const role = await PermissionsService.getRoleByName(roleName);
        if (!role) throw new Error(`Role ${roleName} not found`);
        
        await PermissionsService.updateRoleWidgetPermissions(role.id, widgetNames);
        clearPermissionsCache(); // Clear cache after update
    } catch (error) {
        console.error('Error updating role widget permissions:', error);
        throw error;
    }
};