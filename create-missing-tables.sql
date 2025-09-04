-- Create missing tables that the application expects
-- Run this in your Supabase SQL Editor

-- Create t_o_e table (TOE = Terms of Engagement)
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

-- Create project table (singular form)
CREATE TABLE IF NOT EXISTS public.project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_entry table (singular form)
CREATE TABLE IF NOT EXISTS public.time_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.t_o_e ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entry ENABLE ROW LEVEL SECURITY;

-- Create policies for t_o_e
CREATE POLICY "Users can view all t_o_e" ON public.t_o_e
    FOR SELECT USING (true);

CREATE POLICY "Users can insert t_o_e" ON public.t_o_e
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update t_o_e" ON public.t_o_e
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete t_o_e" ON public.t_o_e
    FOR DELETE USING (true);

-- Create policies for analytics_setting
CREATE POLICY "Users can view all analytics_setting" ON public.analytics_setting
    FOR SELECT USING (true);

CREATE POLICY "Users can insert analytics_setting" ON public.analytics_setting
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update analytics_setting" ON public.analytics_setting
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete analytics_setting" ON public.analytics_setting
    FOR DELETE USING (true);

-- Create policies for project
CREATE POLICY "Users can view all project" ON public.project
    FOR SELECT USING (true);

CREATE POLICY "Users can insert project" ON public.project
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project" ON public.project
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete project" ON public.project
    FOR DELETE USING (true);

-- Create policies for time_entry
CREATE POLICY "Users can view all time_entry" ON public.time_entry
    FOR SELECT USING (true);

CREATE POLICY "Users can insert time_entry" ON public.time_entry
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update time_entry" ON public.time_entry
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete time_entry" ON public.time_entry
    FOR DELETE USING (true);

-- Copy data from existing tables to new tables
INSERT INTO public.project (id, name, client_id, description, status, created_at, updated_at)
SELECT id, name, client_id, description, status, created_at, updated_at
FROM public.projects
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.time_entry (id, user_id, task_id, start_time, end_time, duration_minutes, description, created_at, updated_at)
SELECT id, user_id, task_id, start_time, end_time, duration_minutes, description, created_at, updated_at
FROM public.time_entries
ON CONFLICT (id) DO NOTHING;

-- Create some sample data for missing tables
INSERT INTO public.t_o_e (id, client_id, project_id, title, content, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    c.id,
    p.id,
    'Terms of Engagement - ' || p.name,
    'This is a sample TOE document for ' || p.name || ' with client ' || c.name,
    'draft',
    NOW(),
    NOW()
FROM public.clients c
CROSS JOIN public.projects p
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO public.analytics_setting (id, key, value, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'dashboard_refresh_interval', '30000', NOW(), NOW()),
    (gen_random_uuid(), 'chart_default_type', 'line', NOW(), NOW()),
    (gen_random_uuid(), 'data_retention_days', '365', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Show summary
SELECT 'Missing tables created successfully!' as message;
SELECT 'Tables created: t_o_e, analytics_setting, project, time_entry' as details;
