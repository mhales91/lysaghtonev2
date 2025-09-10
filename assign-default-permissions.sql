-- Assign default permissions to roles
-- Run this after seeding the data

-- Get role IDs
DO $$
DECLARE
    admin_role_id UUID;
    director_role_id UUID;
    manager_role_id UUID;
    staff_role_id UUID;
    client_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
    SELECT id INTO director_role_id FROM roles WHERE name = 'Director';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager';
    SELECT id INTO staff_role_id FROM roles WHERE name = 'Staff';
    SELECT id INTO client_role_id FROM roles WHERE name = 'Client';

    -- Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Director gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT director_role_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Manager permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE name IN (
        'dashboard_access', 'ai_assistant_access', 'crm_pipeline_access', 
        'toe_manager_access', 'projects_access', 'timesheets_access', 
        'lysaght_ai_access', 'billing_access', 'analytics_access', 
        'task_templates_access', 'company_settings_access'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Staff permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT staff_role_id, id FROM permissions 
    WHERE name IN (
        'dashboard_access', 'ai_assistant_access', 'crm_pipeline_access', 
        'toe_manager_access', 'projects_access', 'timesheets_access', 
        'lysaght_ai_access', 'billing_access', 'analytics_access'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Client permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT client_role_id, id FROM permissions 
    WHERE name IN (
        'dashboard_access', 'projects_access', 'timesheets_access', 'billing_access'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign widget permissions
    -- Admin and Director get all widgets
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions WHERE category = 'widget_access'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT director_role_id, id FROM permissions WHERE category = 'widget_access'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Manager gets all widgets
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions WHERE category = 'widget_access'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Staff gets 8 widgets (exclude budget_utilisation)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT staff_role_id, id FROM permissions 
    WHERE category = 'widget_access' AND name != 'budget_utilisation_widget'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Client gets 6 widgets
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT client_role_id, id FROM permissions 
    WHERE category = 'widget_access' AND name IN (
        'weekly_timesheet_widget', 'yearly_performance_widget', 'workload_widget',
        'crm_pipeline_widget', 'toe_board_widget', 'sla_tracker_widget'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;
