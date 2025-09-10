// Permission utility functions for dynamic role-based access control
import { getRolePermissions as dbGetRolePermissions, hasPermission as dbHasPermission } from '../api/rolePermissions.js';

// All available pages
export const allPages = [
    'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets',
    'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings',
    'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library',
    'TOE Admin', 'Import Jobs'
];

// Default role permissions (fallback)
const defaultPermissions = {
    'Admin': allPages,
    'Director': allPages,
    'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
    'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
    'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
};

// Cache for role permissions to avoid repeated database calls
const permissionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get role permissions from database with caching and localStorage fallback
export const getRolePermissions = async (role) => {
    const cacheKey = `permissions_${role}`;
    const cached = permissionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.permissions;
    }
    
    try {
        const permissions = await dbGetRolePermissions(role);
        permissionCache.set(cacheKey, {
            permissions,
            timestamp: Date.now()
        });
        return permissions;
    } catch (error) {
        console.error('Error fetching role permissions from database:', error);
        
        // Try localStorage fallback
        try {
            const saved = localStorage.getItem('roleConfigs');
            if (saved) {
                const roleConfigs = JSON.parse(saved);
                if (roleConfigs[role] && roleConfigs[role].length > 0) {
                    console.log(`Using localStorage permissions for role: ${role}`);
                    return roleConfigs[role];
                }
            }
        } catch (localStorageError) {
            console.error('Error reading from localStorage:', localStorageError);
        }
        
        // Final fallback to default permissions
        console.log(`Using default permissions for role: ${role}`);
        return defaultPermissions[role] || [];
    }
};

// Check if a user has permission to access a specific page
export const hasPermission = async (userRole, pageName) => {
    try {
        return await dbHasPermission(userRole, pageName);
    } catch (error) {
        console.error('Error checking permission:', error);
        // Fallback to default permissions
        const defaultPerms = defaultPermissions[userRole] || [];
        return defaultPerms.includes(pageName);
    }
};

// Check if current user can access User Management
export const canAccessUserManagement = async (userRole) => {
    return await hasPermission(userRole, 'User Management');
};

// Get all pages a user can access
export const getUserAccessiblePages = async (userRole) => {
    return await getRolePermissions(userRole);
};

// Clear permission cache (useful when permissions are updated)
export const clearPermissionCache = () => {
    permissionCache.clear();
};
