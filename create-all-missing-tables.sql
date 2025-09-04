-- Create ALL missing Base44 entity tables
-- These tables are causing the 404/400 errors in the console

-- Create chat_conversation table (causing "relation does not exist" error)
CREATE TABLE public.chat_conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    user_id UUID REFERENCES public.users(id),
    ai_assistant_id UUID REFERENCES public.ai_assistant(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create toe_library_item table (causing TOEAdmin errors)
CREATE TABLE public.toe_library_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id)
);

-- Create toe_folder table (causing TOEList errors)
CREATE TABLE public.toe_folder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.toe_folder(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id)
);

-- Create tag_library table (referenced in schemas)
CREATE TABLE public.tag_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id)
);

-- Create lead_opportunity table (referenced in schemas)
CREATE TABLE public.lead_opportunity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.client(id),
    title TEXT NOT NULL,
    description TEXT,
    value DECIMAL(12,2),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
    expected_close_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id)
);

-- Create timer_session table
CREATE TABLE public.timer_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    task_id UUID REFERENCES public.task(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weekly_submission table
CREATE TABLE public.weekly_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_hours DECIMAL(5,2),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff_rate table
CREATE TABLE public.staff_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    rate DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_rate table
CREATE TABLE public.task_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.task(id),
    rate DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cost_tracker table
CREATE TABLE public.cost_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.project(id),
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id)
);

-- Create import_job table
CREATE TABLE public.import_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id)
);

-- Create import_job_row table
CREATE TABLE public.import_job_row (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID REFERENCES public.import_job(id),
    row_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
    error_message TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_status_map table
CREATE TABLE public.job_status_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID REFERENCES public.import_job(id),
    original_status TEXT,
    mapped_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_crosswalk table
CREATE TABLE public.user_crosswalk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_user_id TEXT NOT NULL,
    new_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_crosswalk table
CREATE TABLE public.client_crosswalk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_client_id TEXT NOT NULL,
    new_client_id UUID REFERENCES public.client(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create toe_review table
CREATE TABLE public.toe_review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toe_id UUID REFERENCES public.toe(id),
    reviewer_id UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create write_off table
CREATE TABLE public.write_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_entry_id UUID REFERENCES public.time_entry(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    approved_by_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create toe_signature table
CREATE TABLE public.toe_signature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toe_id UUID REFERENCES public.toe(id),
    user_id UUID REFERENCES public.users(id),
    signature_data TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE public.chat_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_library_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_folder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_opportunity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_row ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.write_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toe_signature ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now)
CREATE POLICY "Enable all operations for all users" ON public.chat_conversation FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.toe_library_item FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.toe_folder FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.tag_library FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.lead_opportunity FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.timer_session FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.weekly_submission FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.staff_rate FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.task_rate FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.cost_tracker FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.import_job FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.import_job_row FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.job_status_map FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.user_crosswalk FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.client_crosswalk FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.toe_review FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.write_off FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.toe_signature FOR ALL USING (true);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_conversation_updated_at BEFORE UPDATE ON public.chat_conversation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toe_library_item_updated_at BEFORE UPDATE ON public.toe_library_item FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toe_folder_updated_at BEFORE UPDATE ON public.toe_folder FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tag_library_updated_at BEFORE UPDATE ON public.tag_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_opportunity_updated_at BEFORE UPDATE ON public.lead_opportunity FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timer_session_updated_at BEFORE UPDATE ON public.timer_session FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_submission_updated_at BEFORE UPDATE ON public.weekly_submission FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_rate_updated_at BEFORE UPDATE ON public.staff_rate FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_rate_updated_at BEFORE UPDATE ON public.task_rate FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_tracker_updated_at BEFORE UPDATE ON public.cost_tracker FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_import_job_updated_at BEFORE UPDATE ON public.import_job FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_import_job_row_updated_at BEFORE UPDATE ON public.import_job_row FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_status_map_updated_at BEFORE UPDATE ON public.job_status_map FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_crosswalk_updated_at BEFORE UPDATE ON public.user_crosswalk FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_crosswalk_updated_at BEFORE UPDATE ON public.client_crosswalk FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toe_review_updated_at BEFORE UPDATE ON public.toe_review FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_write_off_updated_at BEFORE UPDATE ON public.write_off FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toe_signature_updated_at BEFORE UPDATE ON public.toe_signature FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
