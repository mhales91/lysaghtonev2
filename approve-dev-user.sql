-- Approve the development user
-- Run this in your Supabase SQL Editor

UPDATE public.users 
SET 
    approval_status = 'approved',
    user_role = 'Admin',
    approved_by = 'system',
    approved_date = NOW(),
    updated_at = NOW()
WHERE email = 'dev@localhost.com';

-- Show the updated user
SELECT * FROM public.users WHERE email = 'dev@localhost.com';
