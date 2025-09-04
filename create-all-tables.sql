-- Create all necessary tables for Base44 data import
-- Run this in your Supabase SQL Editor

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
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

-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Users can view all clients" ON public.clients
    FOR SELECT USING (true);

CREATE POLICY "Users can insert clients" ON public.clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update clients" ON public.clients
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete clients" ON public.clients
    FOR DELETE USING (true);

-- Create policies for projects
CREATE POLICY "Users can view all projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Users can insert projects" ON public.projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update projects" ON public.projects
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete projects" ON public.projects
    FOR DELETE USING (true);

-- Create policies for tasks
CREATE POLICY "Users can view all tasks" ON public.tasks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert tasks" ON public.tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update tasks" ON public.tasks
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete tasks" ON public.tasks
    FOR DELETE USING (true);

-- Create policies for time_entries
CREATE POLICY "Users can view all time entries" ON public.time_entries
    FOR SELECT USING (true);

CREATE POLICY "Users can insert time entries" ON public.time_entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update time entries" ON public.time_entries
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete time entries" ON public.time_entries
    FOR DELETE USING (true);

-- Create policies for company_settings
CREATE POLICY "Users can view all company settings" ON public.company_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert company settings" ON public.company_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update company settings" ON public.company_settings
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete company settings" ON public.company_settings
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON public.company_settings(key);

-- Show summary
SELECT 'All tables created successfully!' as message;
SELECT 'Tables created: clients, projects, tasks, time_entries, company_settings' as details;
