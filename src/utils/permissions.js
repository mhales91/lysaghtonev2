// Permission utility functions for dynamic role-based access control
import { getRolePermission, getRolePermissions } from '@/api/rolePermissions';

// All available pages
export const allPages = [
    'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets',
    'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings',
    'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library',
    'TOE Admin', 'Import Jobs'
];

// Global role configs that can be updated by UserManagement component
let globalRoleConfigs = null;

// Set role configs from UserManagement component
export const setGlobalRoleConfigs = (configs) => {
    globalRoleConfigs = configs;
};

// Load role permissions from database with localStorage fallback
export const getRolePermissionsFromDB = async (role) => {
    try {
        // First check if we have global configs set by UserManagement component
        if (globalRoleConfigs && globalRoleConfigs[role] && globalRoleConfigs[role].length > 0) {
            return globalRoleConfigs[role];
        }
        
        // Check localStorage for cached permissions (performance optimization)
        const cached = localStorage.getItem('roleConfigs');
        if (cached) {
            try {
                const roleConfigs = JSON.parse(cached);
                if (roleConfigs[role] && roleConfigs[role].length > 0) {
                    return roleConfigs[role];
                }
            } catch (error) {
                console.error('Error parsing cached roleConfigs:', error);
            }
        }
        
        // Load from database
        const permissions = await getRolePermission(role);
        
        // Cache the result in localStorage for performance
        if (permissions && permissions.length > 0) {
            const currentCache = JSON.parse(localStorage.getItem('roleConfigs') || '{}');
            currentCache[role] = permissions;
            localStorage.setItem('roleConfigs', JSON.stringify(currentCache));
        }
        
        return permissions || [];
    } catch (error) {
        console.error(`Error loading permissions for role ${role}:`, error);
        return [];
    }
};

// Synchronous version for immediate use (uses cached data)
export const getRolePermissions = (role) => {
    // First check if we have global configs set by UserManagement component
    if (globalRoleConfigs && globalRoleConfigs[role] && globalRoleConfigs[role].length > 0) {
        return globalRoleConfigs[role];
    }
    
    // Check localStorage for cached permissions
    const cached = localStorage.getItem('roleConfigs');
    if (cached) {
        try {
            const roleConfigs = JSON.parse(cached);
            if (roleConfigs[role] && roleConfigs[role].length > 0) {
                return roleConfigs[role];
            }
        } catch (error) {
            console.error('Error parsing cached roleConfigs:', error);
        }
    }
    
    // Return empty array if no permissions found (no defaults)
    return [];
};

// Check if a user has permission to access a specific page
export const hasPermission = (userRole, pageName) => {
    const permissions = getRolePermissions(userRole);
    return permissions.includes(pageName);
};

// Async version for checking permissions (loads from database if needed)
export const hasPermissionAsync = async (userRole, pageName) => {
    const permissions = await getRolePermissionsFromDB(userRole);
    return permissions.includes(pageName);
};

// Check if current user can access User Management
export const canAccessUserManagement = (userRole) => {
    return hasPermission(userRole, 'User Management');
};

// Get all pages a user can access
export const getUserAccessiblePages = (userRole) => {
    return getRolePermissions(userRole);
};

// Load all role permissions from database and cache them
export const loadAllRolePermissions = async () => {
    try {
        const allPermissions = await getRolePermissions();
        
        // Cache all permissions in localStorage
        localStorage.setItem('roleConfigs', JSON.stringify(allPermissions));
        
        // Update global configs
        setGlobalRoleConfigs(allPermissions);
        
        return allPermissions;
    } catch (error) {
        console.error('Error loading all role permissions:', error);
        return {};
    }
};