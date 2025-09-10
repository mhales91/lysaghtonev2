-- Initialize role permissions system
-- This script creates the roles and permissions tables and populates them with default data

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles if they don't exist
INSERT INTO public.roles (name, description) VALUES
    ('Admin', 'Full system access'),
    ('Director', 'Executive level access'),
    ('Manager', 'Department management access'),
    ('Staff', 'Standard user access'),
    ('Client', 'Client portal access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions if they don't exist
INSERT INTO public.permissions (name, description) VALUES
    ('Dashboard', 'Access to main dashboard'),
    ('AI Assistant', 'Access to AI assistant features'),
    ('CRM Pipeline', 'Access to CRM pipeline management'),
    ('TOE Manager', 'Access to Terms of Engagement management'),
    ('Projects', 'Access to project management'),
    ('Timesheets', 'Access to timesheet management'),
    ('Lysaght AI', 'Access to Lysaght AI features'),
    ('Billing', 'Access to billing features'),
    ('Analytics', 'Access to analytics and reporting'),
    ('Task Templates', 'Access to task template management'),
    ('Company Settings', 'Access to company settings'),
    ('User Management', 'Access to user management'),
    ('AI Assistant Manager', 'Access to AI assistant management'),
    ('Billing Settings', 'Access to billing settings'),
    ('Analytics Settings', 'Access to analytics settings'),
    ('Prompt Library', 'Access to prompt library'),
    ('TOE Admin', 'Access to TOE administration'),
    ('Import Jobs', 'Access to job import features')
ON CONFLICT (name) DO NOTHING;

-- Set up default role permissions
-- Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Director gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Director'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager gets most permissions except some admin functions
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Manager'
AND p.name IN (
    'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 
    'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff gets basic permissions
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Staff'
AND p.name IN (
    'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 
    'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Client gets limited permissions
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Client'
AND p.name IN ('Dashboard', 'Projects', 'Timesheets', 'Billing')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for roles table
DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
CREATE POLICY "Allow read access to roles" ON public.roles
    FOR SELECT USING (true);

-- Create RLS policies for permissions table
DROP POLICY IF EXISTS "Allow read access to permissions" ON public.permissions;
CREATE POLICY "Allow read access to permissions" ON public.permissions
    FOR SELECT USING (true);

-- Create RLS policies for role_permissions table
DROP POLICY IF EXISTS "Allow read access to role_permissions" ON public.role_permissions;
CREATE POLICY "Allow read access to role_permissions" ON public.role_permissions
    FOR SELECT USING (true);

-- Allow admins to manage role permissions
DROP POLICY IF EXISTS "Allow admins to manage role_permissions" ON public.role_permissions;
CREATE POLICY "Allow admins to manage role_permissions" ON public.role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_role = 'Admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON public.roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON public.permissions;
CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON public.permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
