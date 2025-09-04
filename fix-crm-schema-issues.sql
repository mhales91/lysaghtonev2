-- Fix CRM Pipeline database schema issues
-- This script adds missing columns and creates missing tables

-- Add missing columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS scope_summary TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Handle crm_stage column (rename stage to crm_stage if stage exists, otherwise add crm_stage)
DO $$
BEGIN
    -- Check if stage column exists and rename it to crm_stage
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stage' AND table_schema = 'public') THEN
        ALTER TABLE public.clients RENAME COLUMN stage TO crm_stage;
        -- Update any existing values to match the expected format
        UPDATE public.clients SET crm_stage = LOWER(crm_stage) WHERE crm_stage IS NOT NULL;
    ELSE
        -- Add crm_stage column if stage doesn't exist
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS crm_stage TEXT DEFAULT 'lead';
    END IF;
END $$;

-- Add missing columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS billing_model TEXT DEFAULT 'Fixed Price',
ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER,
ADD COLUMN IF NOT EXISTS actual_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2);

-- Create task_template table
CREATE TABLE IF NOT EXISTS public.task_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    estimated_hours INTEGER,
    hourly_rate DECIMAL(8,2),
    category TEXT,
    is_billable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on task_template table
ALTER TABLE public.task_template ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_template
CREATE POLICY "Enable read access for all users" ON public.task_template
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.task_template
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.task_template
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.task_template
    FOR DELETE USING (true);

-- Add some sample task templates
INSERT INTO public.task_template (name, description, estimated_hours, hourly_rate, category, is_billable) VALUES
('Initial Consultation', 'Initial client consultation and project scoping', 2, 150.00, 'Consultation', true),
('Design Review', 'Review and approval of design documents', 1, 120.00, 'Design', true),
('Site Survey', 'On-site survey and measurements', 4, 100.00, 'Survey', true),
('Documentation', 'Project documentation and reporting', 3, 80.00, 'Administration', true),
('Project Management', 'General project management activities', 2, 100.00, 'Management', true)
ON CONFLICT DO NOTHING;

-- Update the updated_at trigger for clients table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for task_template table
DROP TRIGGER IF EXISTS update_task_template_updated_at ON public.task_template;
CREATE TRIGGER update_task_template_updated_at
    BEFORE UPDATE ON public.task_template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_crm_stage ON public.clients(crm_stage);
CREATE INDEX IF NOT EXISTS idx_clients_project_manager ON public.clients(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_billing_model ON public.projects(billing_model);
CREATE INDEX IF NOT EXISTS idx_projects_project_manager ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_task_template_category ON public.task_template(category);

COMMENT ON TABLE public.task_template IS 'Task templates for project planning and estimation';
COMMENT ON COLUMN public.clients.address IS 'Client address information';
COMMENT ON COLUMN public.clients.crm_stage IS 'CRM pipeline stage: lead, qualified, proposal_sent, negotiation, won';
COMMENT ON COLUMN public.projects.billing_model IS 'Billing model: Fixed Price, Time & Materials, Cost Plus';
