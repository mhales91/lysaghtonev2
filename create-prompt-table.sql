-- Update the existing prompt table to add missing columns for the application
-- The table already exists with: id, name, content, category, tags, created_at, updated_at, created_by_id, is_active

-- Add missing columns that the application expects
ALTER TABLE public.prompt 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS prompt_text TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Update existing data to populate the new columns from existing data
UPDATE public.prompt 
SET 
    title = COALESCE(title, name),
    prompt_text = COALESCE(prompt_text, content),
    is_public = COALESCE(is_public, is_active),
    user_email = (
        SELECT email 
        FROM auth.users 
        WHERE auth.users.id = prompt.created_by_id
    )
WHERE title IS NULL OR prompt_text IS NULL;

-- Make the name and content columns nullable since we're using title and prompt_text now
ALTER TABLE public.prompt ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.prompt ALTER COLUMN content DROP NOT NULL;

-- Add a trigger to automatically sync name/title and content/prompt_text columns
CREATE OR REPLACE FUNCTION sync_prompt_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync title and name columns
    IF NEW.title IS NOT NULL THEN
        NEW.name = NEW.title;
    ELSIF NEW.name IS NOT NULL AND NEW.title IS NULL THEN
        NEW.title = NEW.name;
    END IF;
    
    -- Sync prompt_text and content columns
    IF NEW.prompt_text IS NOT NULL THEN
        NEW.content = NEW.prompt_text;
    ELSIF NEW.content IS NOT NULL AND NEW.prompt_text IS NULL THEN
        NEW.prompt_text = NEW.content;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_prompt_name_trigger ON public.prompt;
DROP TRIGGER IF EXISTS sync_prompt_columns_trigger ON public.prompt;

-- Create trigger to sync name/title and content/prompt_text columns
CREATE TRIGGER sync_prompt_columns_trigger
    BEFORE INSERT OR UPDATE ON public.prompt
    FOR EACH ROW
    EXECUTE FUNCTION sync_prompt_columns();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_is_public ON public.prompt(is_public);
CREATE INDEX IF NOT EXISTS idx_prompt_user_email ON public.prompt(user_email);
CREATE INDEX IF NOT EXISTS idx_prompt_category ON public.prompt(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.prompt ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to public prompts" ON public.prompt;
DROP POLICY IF EXISTS "Allow users to read their own prompts" ON public.prompt;
DROP POLICY IF EXISTS "Allow users to create their own prompts" ON public.prompt;
DROP POLICY IF EXISTS "Allow users to update their own prompts" ON public.prompt;
DROP POLICY IF EXISTS "Allow users to delete their own prompts" ON public.prompt;
DROP POLICY IF EXISTS "Allow admins to manage all prompts" ON public.prompt;

-- Create RLS policies
-- Allow users to read public prompts
CREATE POLICY "Allow read access to public prompts" ON public.prompt
    FOR SELECT USING (is_public = true);

-- Allow users to read their own prompts
CREATE POLICY "Allow users to read their own prompts" ON public.prompt
    FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Allow users to create their own prompts
CREATE POLICY "Allow users to create their own prompts" ON public.prompt
    FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Allow users to update their own prompts
CREATE POLICY "Allow users to update their own prompts" ON public.prompt
    FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

-- Allow users to delete their own prompts
CREATE POLICY "Allow users to delete their own prompts" ON public.prompt
    FOR DELETE USING (user_email = auth.jwt() ->> 'email');

-- Allow admins to manage all prompts
CREATE POLICY "Allow admins to manage all prompts" ON public.prompt
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_role = 'Admin'
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create the new one
DROP TRIGGER IF EXISTS update_prompt_updated_at ON public.prompt;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_prompt_updated_at 
    BEFORE UPDATE ON public.prompt 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
