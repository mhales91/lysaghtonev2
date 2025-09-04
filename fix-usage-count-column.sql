-- Fix missing usage_count column in toe_library_item table
-- This column is used to track how many times a library item has been used

-- Add the usage_count column if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'toe_library_item' 
        AND column_name = 'usage_count'
    ) THEN
        -- Add the column
        ALTER TABLE public.toe_library_item 
        ADD COLUMN usage_count INTEGER DEFAULT 0;
        
        -- Add comment
        COMMENT ON COLUMN public.toe_library_item.usage_count IS 'Number of times this library item has been used in TOEs';
        
        RAISE NOTICE 'Added usage_count column to toe_library_item table';
    ELSE
        RAISE NOTICE 'usage_count column already exists in toe_library_item table';
    END IF;
END $$;
