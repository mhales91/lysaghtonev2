-- Create proper Base44 entity tables based on JSON schemas
-- This script creates tables that match Base44's expected structure exactly
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS public.write_off CASCADE;
DROP TABLE IF EXISTS public.toe_signature CASCADE;
DROP TABLE IF EXISTS public.tag_library CASCADE;
DROP TABLE IF EXISTS public.invoice CASCADE;
DROP TABLE IF EXISTS public.time_entry CASCADE;
DROP TABLE IF EXISTS public.task CASCADE;
DROP TABLE IF EXISTS public.project CASCADE;
DROP TABLE IF EXISTS public.toe CASCADE;
DROP TABLE IF EXISTS public.lead_opportunity CASCADE;
DROP TABLE IF EXISTS public.task_template CASCADE;
DROP TABLE IF EXISTS public.ai_assistant CASCADE;
DROP TABLE IF EXISTS public.chat_conversation CASCADE;
DROP TABLE IF EXISTS public.prompt CASCADE;
DROP TABLE IF EXISTS public.timer_session CASCADE;
DROP TABLE IF EXISTS public.weekly_submission CASCADE;
DROP TABLE IF EXISTS public.staff_rate CASCADE;
DROP TABLE IF EXISTS public.task_rate CASCADE;
DROP TABLE IF EXISTS public.billing_settings CASCADE;
DROP TABLE IF EXISTS public.toe_folder CASCADE;
DROP TABLE IF EXISTS public.cost_tracker CASCADE;
DROP TABLE IF EXISTS public.toe_library_item CASCADE;
DROP TABLE IF EXISTS public.import_job CASCADE;
DROP TABLE IF EXISTS public.import_job_row CASCADE;
DROP TABLE IF EXISTS public.job_status_map CASCADE;
DROP TABLE IF EXISTS public.user_crosswalk CASCADE;
DROP TABLE IF EXISTS public.client_crosswalk CASCADE;
DROP TABLE IF EXISTS public.analytics_setting CASCADE;
DROP TABLE IF EXISTS public.toe_review CASCADE;
DROP TABLE IF EXISTS public.dashboard_settings CASCADE;
DROP TABLE IF EXISTS public.client CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    user_role TEXT DEFAULT 'Staff' CHECK (user_role IN ('Staff', 'Manager', 'DeptLead', 'Director', 'Admin')),
    department TEXT CHECK (department IN ('Planning', 'Survey', 'Engineering', 'PM', 'Admin')),
    office TEXT DEFAULT 'Bay of Plenty' CHECK (office IN ('Bay of Plenty', 'Waikato')),
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by TEXT,
    approved_date TIMESTAMP WITH TIME ZONE,
    user_color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_settings table
CREATE TABLE public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_color TEXT DEFAULT '#5E0F68',
    company_name TEXT DEFAULT 'Lysaght Consultants Limited',
    job_seed INTEGER DEFAULT 10000,
    charge_out_rates JSONB DEFAULT '{
        "graduate": 160,
        "intermediate": 180,
        "senior": 220,
        "director": 250
    }',
    billing_models JSONB DEFAULT '["time_and_materials", "fixed_fee", "profit_share"]',
    tax_rate DECIMAL DEFAULT 0.15,
    professional_indemnity_cover DECIMAL DEFAULT 2000000,
    public_liability_cover DECIMAL DEFAULT 10000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client table
CREATE TABLE public.client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB, -- {street, city, postcode}
    crm_stage TEXT DEFAULT 'lead' CHECK (crm_stage IN ('lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost')),
    tags JSONB DEFAULT '[]',
    estimated_value DECIMAL,
    probability DECIMAL CHECK (probability >= 0 AND probability <= 100),
    scope_summary TEXT,
    lead_pm TEXT, -- User email
    response_due DATE,
    moved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create toe table (Terms of Engagement)
CREATE TABLE public.toe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.client(id) ON DELETE CASCADE,
    folder_id UUID, -- Will reference toe_folder when created
    project_title TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'internal_review', 'review_completed', 'ready_to_send', 'sent', 'signed', 'expired')),
    document_url TEXT,
    signed_document_url TEXT,
    signed_document_content TEXT,
    client_signature_data JSONB,
    signature_status TEXT DEFAULT 'pending' CHECK (signature_status IN ('pending', 'client_signed', 'fully_executed')),
    scope_of_work TEXT,
    fee_structure JSONB DEFAULT '[]',
    assumptions TEXT,
    exclusions TEXT,
    total_fee DECIMAL,
    total_fee_with_gst DECIMAL,
    sent_date DATE,
    signed_date DATE,
    expiry_date DATE,
    ai_tags JSONB DEFAULT '[]',
    project_created BOOLEAN DEFAULT false,
    history JSONB DEFAULT '[]',
    pre_review_version JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project table
CREATE TABLE public.project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toe_id UUID REFERENCES public.toe(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.client(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    job_number INTEGER,
    legacy_job_number TEXT,
    legacy_job_id TEXT,
    lead_department TEXT CHECK (lead_department IN ('Planning', 'Survey', 'Engineering', 'PM', 'Admin')),
    other_departments JSONB DEFAULT '[]',
    office TEXT DEFAULT 'Bay of Plenty' CHECK (office IN ('Bay of Plenty', 'Waikato')),
    budget_hours DECIMAL,
    budget_fees DECIMAL,
    actual_hours DECIMAL DEFAULT 0,
    actual_fees DECIMAL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    progress_percentage DECIMAL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'active', 'on_hold', 'completed', 'cancelled', 'archived')),
    project_manager TEXT, -- User email
    billing_model TEXT DEFAULT 'time_and_materials' CHECK (billing_model IN ('time_and_materials', 'fixed_fee', 'profit_share')),
    budget_alert_75 BOOLEAN DEFAULT false,
    budget_alert_90 BOOLEAN DEFAULT false,
    signed_toe_url TEXT,
    ai_tags JSONB DEFAULT '[]',
    archived_date DATE,
    archived_by TEXT,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task table
CREATE TABLE public.task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.project(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    section TEXT,
    assignee_email TEXT,
    estimated_hours DECIMAL,
    actual_hours DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completion_percentage DECIMAL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_billable BOOLEAN DEFAULT true,
    template_id UUID, -- Will reference task_template when created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entry table
CREATE TABLE public.time_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    project_id UUID REFERENCES public.project(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.task(id) ON DELETE SET NULL,
    phase TEXT,
    date DATE NOT NULL,
    start_time TEXT, -- HH:MM format
    end_time TEXT, -- HH:MM format
    minutes INTEGER NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    base_rate_at_entry DECIMAL,
    billable_rate_effective DECIMAL,
    cost_amount DECIMAL,
    billable_amount DECIMAL,
    invoiced_amount DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'submitted', 'approved', 'invoiced', 'written_off', 'locked')),
    submission_week TEXT, -- YYYY-WW format
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    invoice_id UUID, -- Will reference invoice when created
    write_off_reason TEXT,
    timer_session_id TEXT,
    rounding_applied BOOLEAN DEFAULT false,
    original_minutes INTEGER,
    entry_source TEXT DEFAULT 'manual' CHECK (entry_source IN ('manual', 'timer', 'bulk_import')),
    custom_fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice table
CREATE TABLE public.invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT,
    project_ids JSONB DEFAULT '[]',
    client_id UUID REFERENCES public.client(id) ON DELETE CASCADE,
    date_range_start DATE,
    date_range_end DATE,
    subtotal DECIMAL,
    gst_amount DECIMAL,
    total_amount DECIMAL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'paid', 'overdue')),
    sent_date DATE,
    due_date DATE,
    paid_date DATE,
    approved_date DATE,
    approved_by TEXT,
    xero_id TEXT,
    line_items JSONB DEFAULT '[]',
    written_off_entries JSONB DEFAULT '[]',
    attach_cost_tracker BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_template table
CREATE TABLE public.task_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dept TEXT CHECK (dept IN ('Planning', 'Survey', 'Engineering', 'PM', 'Admin')),
    default_hours DECIMAL NOT NULL,
    is_billable BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_setting table
CREATE TABLE public.analytics_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    company_monthly_budgets JSONB DEFAULT '{}',
    department_percentages JSONB DEFAULT '{
        "Project Management": 25,
        "Engineering": 25,
        "Surveying": 25,
        "Planning": 25
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_settings table
CREATE TABLE public.dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now - you can restrict later)
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can view all company_settings" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Users can view all clients" ON public.client FOR SELECT USING (true);
CREATE POLICY "Users can view all toes" ON public.toe FOR SELECT USING (true);
CREATE POLICY "Users can view all projects" ON public.project FOR SELECT USING (true);
CREATE POLICY "Users can view all tasks" ON public.task FOR SELECT USING (true);
CREATE POLICY "Users can view all time_entries" ON public.time_entry FOR SELECT USING (true);
CREATE POLICY "Users can view all invoices" ON public.invoice FOR SELECT USING (true);
CREATE POLICY "Users can view all task_templates" ON public.task_template FOR SELECT USING (true);
CREATE POLICY "Users can view all analytics_settings" ON public.analytics_setting FOR SELECT USING (true);
CREATE POLICY "Users can view all dashboard_settings" ON public.dashboard_settings FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_client_company_name ON public.client(company_name);
CREATE INDEX idx_project_client_id ON public.project(client_id);
CREATE INDEX idx_project_status ON public.project(status);
CREATE INDEX idx_task_project_id ON public.task(project_id);
CREATE INDEX idx_time_entry_user_email ON public.time_entry(user_email);
CREATE INDEX idx_time_entry_project_id ON public.time_entry(project_id);
CREATE INDEX idx_time_entry_date ON public.time_entry(date);
CREATE INDEX idx_invoice_client_id ON public.invoice(client_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON public.client FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toe_updated_at BEFORE UPDATE ON public.toe FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON public.project FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON public.task FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entry_updated_at BEFORE UPDATE ON public.time_entry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_template_updated_at BEFORE UPDATE ON public.task_template FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_setting_updated_at BEFORE UPDATE ON public.analytics_setting FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_settings_updated_at BEFORE UPDATE ON public.dashboard_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default company settings
INSERT INTO public.company_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Insert default analytics setting for current year
INSERT INTO public.analytics_setting (year) VALUES (2024) ON CONFLICT DO NOTHING;

-- Insert default dashboard settings
INSERT INTO public.dashboard_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.users IS 'Base44 User entity - extends auth.users with custom fields';
COMMENT ON TABLE public.company_settings IS 'Base44 CompanySettings entity - global company configuration';
COMMENT ON TABLE public.client IS 'Base44 Client entity - external clients and CRM data';
COMMENT ON TABLE public.toe IS 'Base44 TOE entity - Terms of Engagement documents';
COMMENT ON TABLE public.project IS 'Base44 Project entity - ongoing projects';
COMMENT ON TABLE public.task IS 'Base44 Task entity - individual tasks within projects';
COMMENT ON TABLE public.time_entry IS 'Base44 TimeEntry entity - time tracking records';
COMMENT ON TABLE public.invoice IS 'Base44 Invoice entity - client invoices';
COMMENT ON TABLE public.task_template IS 'Base44 TaskTemplate entity - reusable task templates';
COMMENT ON TABLE public.analytics_setting IS 'Base44 AnalyticsSetting entity - analytics configuration';
COMMENT ON TABLE public.dashboard_settings IS 'Base44 DashboardSettings entity - dashboard widget permissions';
