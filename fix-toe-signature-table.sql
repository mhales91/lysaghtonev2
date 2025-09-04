-- Fix toe_signature table to match the expected schema for signature functions
-- This script updates the existing table to have the correct columns

-- Drop the existing toe_signature table if it exists
DROP TABLE IF EXISTS public.toe_signature CASCADE;

-- Create the correct toe_signature table with all required columns
CREATE TABLE public.toe_signature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toe_id UUID REFERENCES public.toe(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE,
    
    -- Lysaght signature fields
    lysaght_signature TEXT,
    lysaght_signer_name TEXT,
    lysaght_signed_date TIMESTAMP WITH TIME ZONE,
    
    -- Client signature fields
    client_signature TEXT,
    client_signer_name TEXT,
    client_signed_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    ip_address TEXT,
    user_agent TEXT,
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.toe_signature ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy (allow all for now)
CREATE POLICY "Users can view all toe_signatures" ON public.toe_signature FOR SELECT USING (true);
CREATE POLICY "Users can insert toe_signatures" ON public.toe_signature FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update toe_signatures" ON public.toe_signature FOR UPDATE USING (true);
CREATE POLICY "Users can delete toe_signatures" ON public.toe_signature FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_toe_signature_toe_id ON public.toe_signature(toe_id);
CREATE INDEX idx_toe_signature_share_token ON public.toe_signature(share_token);

-- Add updated_at trigger
CREATE TRIGGER update_toe_signature_updated_at 
    BEFORE UPDATE ON public.toe_signature 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.toe_signature IS 'Base44 TOESignature entity - stores signature data for TOE documents';
