-- Fix CRM Pipeline crm_stage column issue
-- Handle the case where both stage and crm_stage columns might exist

-- First, check what columns exist and clean up
DO $$
BEGIN
    -- If both stage and crm_stage exist, drop the stage column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stage' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'crm_stage' AND table_schema = 'public') THEN
        ALTER TABLE public.clients DROP COLUMN stage;
        RAISE NOTICE 'Dropped stage column, keeping crm_stage';
    END IF;
    
    -- If only stage exists, rename it to crm_stage
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stage' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'crm_stage' AND table_schema = 'public') THEN
        ALTER TABLE public.clients RENAME COLUMN stage TO crm_stage;
        UPDATE public.clients SET crm_stage = LOWER(crm_stage) WHERE crm_stage IS NOT NULL;
        RAISE NOTICE 'Renamed stage to crm_stage';
    END IF;
    
    -- If neither exists, add crm_stage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stage' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'crm_stage' AND table_schema = 'public') THEN
        ALTER TABLE public.clients ADD COLUMN crm_stage TEXT DEFAULT 'lead';
        RAISE NOTICE 'Added crm_stage column';
    END IF;
    
    -- If only crm_stage exists, we're good
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stage' AND table_schema = 'public')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'crm_stage' AND table_schema = 'public') THEN
        RAISE NOTICE 'crm_stage column already exists and is correct';
    END IF;
END $$;
