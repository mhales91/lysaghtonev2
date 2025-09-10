// Permission utility functions for dynamic role-based access control
import { getRolePermission, getRolePermissions as getRolePermissionsFromAPI } from '@/api/rolePermissions';

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
export const getRolePermissionsFromDBAsync = async (role) => {
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
  console.log(`🔍 getRolePermissions called for role: "${role}"`);
  
  // First check if we have global configs set by UserManagement component
  if (globalRoleConfigs && globalRoleConfigs[role] && globalRoleConfigs[role].length > 0) {
    console.log('✅ Using global configs:', globalRoleConfigs[role]);
    return globalRoleConfigs[role];
  }
  
  // Check localStorage for cached permissions
  const cached = localStorage.getItem('roleConfigs');
  console.log('💾 Checking localStorage for roleConfigs:', cached);
  
  if (cached) {
    try {
      const roleConfigs = JSON.parse(cached);
      console.log('📊 Parsed roleConfigs:', roleConfigs);
      
      if (roleConfigs[role] && roleConfigs[role].length > 0) {
        console.log(`✅ Found cached permissions for ${role}:`, roleConfigs[role]);
        return roleConfigs[role];
      } else {
        console.log(`❌ No cached permissions found for role: ${role}`);
      }
    } catch (error) {
      console.error('❌ Error parsing cached roleConfigs:', error);
    }
  } else {
    console.log('❌ No cached permissions found in localStorage');
  }
  
  // Return empty array if no permissions found (no defaults)
  console.log('⚠️ Returning empty array - no permissions found');
  return [];
};

// Check if a user has permission to access a specific page
export const hasPermission = (userRole, pageName) => {
  console.log(`🔐 hasPermission called: userRole="${userRole}", pageName="${pageName}"`);
  
  const permissions = getRolePermissions(userRole);
  console.log(`📋 Retrieved permissions for ${userRole}:`, permissions);
  
  const hasAccess = permissions.includes(pageName);
  console.log(`✅ hasPermission result: ${hasAccess}`);
  
  return hasAccess;
};

// Async version for checking permissions (loads from database if needed)
export const hasPermissionAsync = async (userRole, pageName) => {
    const permissions = await getRolePermissionsFromDBAsync(userRole);
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
        console.log('🔄 loadAllRolePermissions: Starting to load permissions from database...');
        const allPermissions = await getRolePermissionsFromAPI(); // Use the renamed import
        console.log('📊 loadAllRolePermissions: Raw permissions from database:', allPermissions);
        
        // Check if we got valid data
        if (!allPermissions || Object.keys(allPermissions).length === 0) {
            console.warn('⚠️ loadAllRolePermissions: No permissions loaded from database, using fallback');
            
            // Set fallback permissions
            const fallbackPermissions = {
                'Admin': ['Dashboard', 'Projects', 'Tasks', 'Timesheets', 'CRM', 'Analytics', 'Billing', 'Admin', 'User Management', 'TOE Manager', 'TOE Sign', 'TOE Admin', 'AI Assistant Manager', 'Prompt Library Manager', 'Analytics Settings', 'Dashboard Settings', 'Billing Admin'],
                'Manager': ['Dashboard', 'Projects', 'Tasks', 'Timesheets', 'CRM', 'Analytics', 'Billing', 'TOE Manager', 'TOE Sign', 'AI Assistant Manager', 'Prompt Library Manager'],
                'Staff': ['Dashboard', 'Projects', 'Tasks', 'Timesheets', 'CRM', 'Analytics', 'Billing', 'TOE Sign']
            };
            
            localStorage.setItem('roleConfigs', JSON.stringify(fallbackPermissions));
            setGlobalRoleConfigs(fallbackPermissions);
            return fallbackPermissions;
        }
        
        // Cache all permissions in localStorage
        localStorage.setItem('roleConfigs', JSON.stringify(allPermissions));
        console.log('💾 loadAllRolePermissions: Cached permissions in localStorage:', allPermissions);
        
        // Update global configs
        setGlobalRoleConfigs(allPermissions);
        
        return allPermissions;
    } catch (error) {
        console.error('❌ loadAllRolePermissions: Error loading all role permissions:', error);
        
        // Set fallback permissions on error
        const fallbackPermissions = {
            'Admin': ['Dashboard', 'Projects', 'Tasks', 'Timesheets', 'CRM', 'Analytics', 'Billing', 'Admin', 'User Management', 'TOE Manager', 'TOE Sign', 'TOE Admin', 'AI Assistant Manager', 'Prompt Library Manager', 'Analytics Settings', 'Dashboard Settings', 'Billing Admin'],
            'Manager': ['Dashboard', 'Projects', 'Tasks', 'Timesheets', 'CRM', 'Analytics', 'Billing', 'TOE Manager', 'TOE Sign', 'AI Assistant Manager', 'Prompt Library Manager'],
            'Staff': ['Dashboard', 'Projects', 'Tasks', 'Timesheets', 'CRM', 'Analytics', 'Billing', 'TOE Sign']
        };
        
        localStorage.setItem('roleConfigs', JSON.stringify(fallbackPermissions));
        setGlobalRoleConfigs(fallbackPermissions);
        return fallbackPermissions;
    }
};