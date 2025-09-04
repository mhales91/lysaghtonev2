-- Create all missing tables that the application expects
-- Run this in your Supabase SQL Editor

-- Create t_o_e table (Terms of Engagement)
CREATE TABLE IF NOT EXISTS public.t_o_e (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT,
    content TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_setting table
CREATE TABLE IF NOT EXISTS public.analytics_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dashboard_settings table
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_settings table
CREATE TABLE IF NOT EXISTS public.billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    estimated_hours DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    amount DECIMAL,
    status TEXT DEFAULT 'draft',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cost_tracker table
CREATE TABLE IF NOT EXISTS public.cost_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    description TEXT,
    amount DECIMAL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tag_library table
CREATE TABLE IF NOT EXISTS public.tag_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff_rates table
CREATE TABLE IF NOT EXISTS public.staff_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rate DECIMAL,
    effective_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_rates table
CREATE TABLE IF NOT EXISTS public.task_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    rate DECIMAL,
    effective_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timer_sessions table
CREATE TABLE IF NOT EXISTS public.timer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create toe_folders table
CREATE TABLE IF NOT EXISTS public.toe_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.toe_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create toe_library_items table
CREATE TABLE IF NOT EXISTS public.toe_library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create toe_reviews table
CREATE TABLE IF NOT EXISTS public.toe_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toe_id UUID REFERENCES public.t_o_e(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create toe_signatures table
CREATE TABLE IF NOT EXISTS public.toe_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toe_id UUID REFERENCES public.t_o_e(id) ON DELETE SET NULL,
    signer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    signature_data TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weekly_submissions table
CREATE TABLE IF NOT EXISTS public.weekly_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    week_start_date TIMESTAMPTZ,
    status TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create write_offs table
CREATE TABLE IF NOT EXISTS public.write_offs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    amount DECIMAL,
    reason TEXT,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_opportunities table
CREATE TABLE IF NOT EXISTS public.lead_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    value DECIMAL,
    status TEXT,
    probability INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_assistants table
CREATE TABLE IF NOT EXISTS public.ai_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create import_jobs table
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT,
    status TEXT,
    records_processed INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_status_maps table
CREATE TABLE IF NOT EXISTS public.job_status_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_status TEXT,
    new_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_crosswalk table
CREATE TABLE IF NOT EXISTS public.client_crosswalk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_id TEXT,
    new_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_crosswalk table
CREATE TABLE IF NOT EXISTS public.user_crosswalk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_id TEXT,
    new_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.t_o_e ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.write_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_crosswalk ENABLE ROW LEVEL SECURITY;

-- Create policies for all new tables (allow all operations for now)
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        't_o_e', 'analytics_setting', 'dashboard_settings', 'billing_settings',
        'task_templates', 'invoices', 'cost_tracker', 'prompts', 'tag_library',
        'staff_rates', 'task_rates', 'timer_sessions', 'toe_folders',
        'toe_library_items', 'toe_reviews', 'toe_signatures', 'weekly_submissions',
        'write_offs', 'lead_opportunities', 'chat_conversations', 'ai_assistants',
        'import_jobs', 'job_status_maps', 'client_crosswalk', 'user_crosswalk'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('CREATE POLICY "Users can view all %s" ON public.%s FOR SELECT USING (true)', table_name, table_name);
        EXECUTE format('CREATE POLICY "Users can insert %s" ON public.%s FOR INSERT WITH CHECK (true)', table_name, table_name);
        EXECUTE format('CREATE POLICY "Users can update %s" ON public.%s FOR UPDATE USING (true)', table_name, table_name);
        EXECUTE format('CREATE POLICY "Users can delete %s" ON public.%s FOR DELETE USING (true)', table_name, table_name);
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_t_o_e_client_id ON public.t_o_e(client_id);
CREATE INDEX IF NOT EXISTS idx_t_o_e_project_id ON public.t_o_e(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_cost_tracker_project_id ON public.cost_tracker(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_opportunities_client_id ON public.lead_opportunities(client_id);

-- Add some sample data to key tables
INSERT INTO public.analytics_setting (id, key, value, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'dashboard_refresh_interval', '30000', NOW(), NOW()),
    (gen_random_uuid(), 'chart_default_type', 'line', NOW(), NOW()),
    (gen_random_uuid(), 'data_retention_days', '365', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.dashboard_settings (id, key, value, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'default_view', 'grid', NOW(), NOW()),
    (gen_random_uuid(), 'items_per_page', '20', NOW(), NOW()),
    (gen_random_uuid(), 'auto_refresh', 'true', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.billing_settings (id, key, value, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'default_rate', '150.00', NOW(), NOW()),
    (gen_random_uuid(), 'currency', 'NZD', NOW(), NOW()),
    (gen_random_uuid(), 'tax_rate', '0.15', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Show summary
SELECT 'All missing tables created successfully!' as message;
SELECT 'Tables created: 25+ tables for complete application functionality' as details;
