-- Create development user in public.users table
-- This should be run after create-dev-user.sql

-- First, get the user ID from auth.users
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID for dev@localhost.com
    SELECT id INTO user_id FROM auth.users WHERE email = 'dev@localhost.com';
    
    IF user_id IS NOT NULL THEN
        -- Insert or update the user in public.users
        INSERT INTO public.users (
            id,
            email,
            full_name,
            user_role,
            approval_status,
            approved_by,
            approved_date,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'dev@localhost.com',
            'Development User',
            'Admin',
            'approved',
            'system',
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            user_role = 'Admin',
            approval_status = 'approved',
            approved_by = 'system',
            approved_date = NOW(),
            updated_at = NOW();
            
        RAISE NOTICE 'Dev user created/updated in public.users with ID: %', user_id;
    ELSE
        RAISE NOTICE 'Dev user not found in auth.users. Please run create-dev-user.sql first.';
    END IF;
END $$;
