-- Seed initial roles and permissions
-- Run this after creating the schema

-- 1. Insert roles
INSERT INTO roles (name, description, is_system_role) VALUES
('Admin', 'Full system access', true),
('Director', 'Executive level access', true),
('Manager', 'Management level access', true),
('Staff', 'Standard user access', true),
('Client', 'Client access', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert page permissions
INSERT INTO permissions (name, description, category) VALUES
('dashboard_access', 'Access to Dashboard page', 'page_access'),
('ai_assistant_access', 'Access to AI Assistant page', 'page_access'),
('crm_pipeline_access', 'Access to CRM Pipeline page', 'page_access'),
('toe_manager_access', 'Access to TOE Manager page', 'page_access'),
('projects_access', 'Access to Projects page', 'page_access'),
('timesheets_access', 'Access to Timesheets page', 'page_access'),
('lysaght_ai_access', 'Access to Lysaght AI page', 'page_access'),
('billing_access', 'Access to Billing page', 'page_access'),
('analytics_access', 'Access to Analytics page', 'page_access'),
('task_templates_access', 'Access to Task Templates page', 'page_access'),
('company_settings_access', 'Access to Company Settings page', 'page_access'),
('user_management_access', 'Access to User Management page', 'page_access'),
('ai_assistant_manager_access', 'Access to AI Assistant Manager page', 'page_access'),
('billing_settings_access', 'Access to Billing Settings page', 'page_access'),
('analytics_settings_access', 'Access to Analytics Settings page', 'page_access'),
('prompt_library_access', 'Access to Prompt Library page', 'page_access'),
('toe_admin_access', 'Access to TOE Admin page', 'page_access'),
('import_jobs_access', 'Access to Import Jobs page', 'page_access')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert widget permissions
INSERT INTO permissions (name, description, category) VALUES
('weekly_timesheet_widget', 'Weekly Timesheet Hours widget', 'widget_access'),
('yearly_performance_widget', 'Yearly Performance (FYTD) widget', 'widget_access'),
('workload_widget', 'Workload widget', 'widget_access'),
('crm_pipeline_widget', 'CRM Pipeline - All Departments widget', 'widget_access'),
('toe_board_widget', 'TOE Board - All Departments widget', 'widget_access'),
('sla_tracker_widget', 'SLA Tracker - All Departments widget', 'widget_access'),
('project_portfolio_widget', 'Project Portfolio widget', 'widget_access'),
('upcoming_projects_widget', 'Upcoming Projects widget', 'widget_access'),
('budget_utilisation_widget', 'Budget Utilisation widget', 'widget_access')
ON CONFLICT (name) DO NOTHING;
