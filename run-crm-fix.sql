-- Quick fix for CRM Pipeline - Add crm_stage column
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS crm_stage TEXT DEFAULT 'lead';

-- If stage column exists, rename it to crm_stage
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stage' AND table_schema = 'public') THEN
        ALTER TABLE public.clients RENAME COLUMN stage TO crm_stage;
        UPDATE public.clients SET crm_stage = LOWER(crm_stage) WHERE crm_stage IS NOT NULL;
    END IF;
END $$;
