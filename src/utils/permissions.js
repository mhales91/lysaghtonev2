// Permission utility functions for dynamic role-based access control

// All available pages
export const allPages = [
    'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets',
    'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings',
    'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library',
    'TOE Admin', 'Import Jobs'
];

// Default role permissions
const defaultPermissions = {
    'Admin': allPages,
    'Director': allPages,
    'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
    'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
    'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
};

// Global role configs that can be updated by UserManagement component
let globalRoleConfigs = null;

// Set role configs from UserManagement component
export const setGlobalRoleConfigs = (configs) => {
    globalRoleConfigs = configs;
};

// Load role configurations from localStorage (for localhost) or return defaults
export const getRolePermissions = (role) => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // First check if we have global configs set by UserManagement component
    if (globalRoleConfigs && globalRoleConfigs[role] && globalRoleConfigs[role].length > 0) {
        return globalRoleConfigs[role];
    }
    
    if (isLocalhost) {
        const saved = localStorage.getItem('roleConfigs');
        if (saved) {
            const roleConfigs = JSON.parse(saved);
            if (roleConfigs[role] && roleConfigs[role].length > 0) {
                return roleConfigs[role];
            }
        }
    }
    
    // Fallback to default configuration
    return defaultPermissions[role] || [];
};

// Check if a user has permission to access a specific page
export const hasPermission = (userRole, pageName) => {
    const permissions = getRolePermissions(userRole);
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
