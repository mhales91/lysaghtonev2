-- Create essential missing Base44 entity tables
-- These are the tables causing Dashboard errors

-- Create ai_assistant table
CREATE TABLE public.ai_assistant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    model TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    system_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create prompt table
CREATE TABLE public.prompt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create billing_settings table
CREATE TABLE public.billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.company_settings(id),
    default_hourly_rate DECIMAL(10,2),
    currency TEXT DEFAULT 'NZD',
    tax_rate DECIMAL(5,4) DEFAULT 0.15,
    invoice_prefix TEXT DEFAULT 'INV',
    payment_terms INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create basic policies
ALTER TABLE public.ai_assistant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for all users" ON public.ai_assistant FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.prompt FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.billing_settings FOR ALL USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_assistant_updated_at BEFORE UPDATE ON public.ai_assistant FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompt_updated_at BEFORE UPDATE ON public.prompt FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_settings_updated_at BEFORE UPDATE ON public.billing_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
