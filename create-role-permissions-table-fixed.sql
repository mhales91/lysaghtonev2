-- Drop the table if it exists (for clean setup)
DROP TABLE IF EXISTS role_permissions CASCADE;

-- Create role_permissions table
CREATE TABLE role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on role for faster lookups
CREATE INDEX idx_role_permissions_role ON role_permissions(role);

-- Insert initial role permissions (mirroring current defaults)
INSERT INTO role_permissions (role, permissions) VALUES
('Admin', '["Dashboard", "AI Assistant", "CRM Pipeline", "TOE Manager", "Projects", "Timesheets", "Lysaght AI", "Billing", "Analytics", "Task Templates", "Company Settings", "User Management", "AI Assistant Manager", "Billing Settings", "Analytics Settings", "Prompt Library", "TOE Admin", "Import Jobs"]'::jsonb),
('Director', '["Dashboard", "AI Assistant", "CRM Pipeline", "TOE Manager", "Projects", "Timesheets", "Lysaght AI", "Billing", "Analytics", "Task Templates", "Company Settings", "User Management", "AI Assistant Manager", "Billing Settings", "Analytics Settings", "Prompt Library", "TOE Admin", "Import Jobs"]'::jsonb),
('Manager', '["Dashboard", "AI Assistant", "CRM Pipeline", "TOE Manager", "Projects", "Timesheets", "Lysaght AI", "Billing", "Analytics", "Task Templates", "Company Settings"]'::jsonb),
('Staff', '["Dashboard", "AI Assistant", "CRM Pipeline", "TOE Manager", "Projects", "Timesheets", "Lysaght AI", "Billing", "Analytics"]'::jsonb),
('Client', '["Dashboard", "Projects", "Timesheets", "Billing"]'::jsonb);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_role_permissions_updated_at();

-- Enable Row Level Security
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read role permissions
CREATE POLICY "Allow authenticated users to read role permissions" ON role_permissions
    FOR SELECT TO authenticated
    USING (true);

-- Create policy to allow authenticated users to update role permissions
CREATE POLICY "Allow authenticated users to update role permissions" ON role_permissions
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy to allow authenticated users to insert role permissions
CREATE POLICY "Allow authenticated users to insert role permissions" ON role_permissions
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Verify the table was created correctly
SELECT * FROM role_permissions ORDER BY role;

