import { supabase } from '@/lib/supabase-client';

// Permission mapping for UI display
export const PERMISSION_MAPPING = {
  // Page permissions
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
  'Import Jobs': 'import_jobs_access',
  
  // Widget permissions
  'Weekly Timesheet Hours': 'weekly_timesheet_widget',
  'Yearly Performance (FYTD)': 'yearly_performance_widget',
  'Workload': 'workload_widget',
  'CRM Pipeline - All Departments': 'crm_pipeline_widget',
  'TOE Board - All Departments': 'toe_board_widget',
  'SLA Tracker - All Departments': 'sla_tracker_widget',
  'Project Portfolio': 'project_portfolio_widget',
  'Upcoming Projects': 'upcoming_projects_widget',
  'Budget Utilisation': 'budget_utilisation_widget'
};

// Reverse mapping for database lookups
export const REVERSE_PERMISSION_MAPPING = Object.fromEntries(
  Object.entries(PERMISSION_MAPPING).map(([key, value]) => [value, key])
);

export class PermissionsService {
  // Get all roles
  static async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Get all permissions
  static async getPermissions() {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Get permissions for a specific role
  static async getRolePermissions(roleId) {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (
          id,
          name,
          description,
          category
        )
      `)
      .eq('role_id', roleId);
    
    if (error) throw error;
    return data.map(item => item.permissions);
  }

  // Get user's roles
  static async getUserRoles(userId) {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(item => item.roles);
  }

  // Get user's permissions (all permissions from all their roles)
  static async getUserPermissions(userId) {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_permissions (
            permissions (
              id,
              name,
              description,
              category
            )
          )
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Flatten the nested structure
    const permissions = [];
    data.forEach(userRole => {
      userRole.roles.role_permissions.forEach(rolePermission => {
        permissions.push(rolePermission.permissions);
      });
    });
    
    return permissions;
  }

  // Check if user has specific permission
  static async hasPermission(userId, permissionName) {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_permissions (
            permissions (
              name
            )
          )
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Check if any role has this permission
    return data.some(userRole => 
      userRole.roles.role_permissions.some(rolePermission => 
        rolePermission.permissions.name === permissionName
      )
    );
  }

  // Update role permissions
  static async updateRolePermissions(roleId, permissionIds) {
    // First, delete existing permissions for this role
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);
    
    if (deleteError) throw deleteError;
    
    // Then insert new permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId
      }));
      
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);
      
      if (insertError) throw insertError;
    }
  }

  // Assign role to user
  static async assignUserRole(userId, roleId) {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId
      });
    
    if (error) throw error;
  }

  // Remove role from user
  static async removeUserRole(userId, roleId) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);
    
    if (error) throw error;
  }

  // Get role by name
  static async getRoleByName(roleName) {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('name', roleName)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get permission by name
  static async getPermissionByName(permissionName) {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('name', permissionName)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get page permissions for a role (UI-friendly format)
  static async getRolePagePermissions(roleId) {
    const permissions = await this.getRolePermissions(roleId);
    const pagePermissions = permissions
      .filter(p => p.category === 'page_access')
      .map(p => REVERSE_PERMISSION_MAPPING[p.name])
      .filter(Boolean);
    
    return pagePermissions;
  }

  // Get widget permissions for a role (UI-friendly format)
  static async getRoleWidgetPermissions(roleId) {
    const permissions = await this.getRolePermissions(roleId);
    const widgetPermissions = permissions
      .filter(p => p.category === 'widget_access')
      .map(p => REVERSE_PERMISSION_MAPPING[p.name])
      .filter(Boolean);
    
    return widgetPermissions;
  }

  // Update role page permissions
  static async updateRolePagePermissions(roleId, pageNames) {
    const permissionNames = pageNames.map(pageName => PERMISSION_MAPPING[pageName]).filter(Boolean);
    const permissionIds = [];
    
    for (const permissionName of permissionNames) {
      const permission = await this.getPermissionByName(permissionName);
      permissionIds.push(permission.id);
    }
    
    await this.updateRolePermissions(roleId, permissionIds);
  }

  // Update role widget permissions
  static async updateRoleWidgetPermissions(roleId, widgetNames) {
    const permissionNames = widgetNames.map(widgetName => PERMISSION_MAPPING[widgetName]).filter(Boolean);
    const permissionIds = [];
    
    for (const permissionName of permissionNames) {
      const permission = await this.getPermissionByName(permissionName);
      permissionIds.push(permission.id);
    }
    
    await this.updateRolePermissions(roleId, permissionIds);
  }
}
