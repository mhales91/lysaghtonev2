-- Simple development user creation script
-- Run this in your Supabase SQL Editor

-- First, let's check if the user already exists
DO $$
DECLARE
    user_exists boolean;
    user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'dev@localhost.com') INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'User dev@localhost.com already exists';
        -- Get the existing user ID
        SELECT id INTO user_id FROM auth.users WHERE email = 'dev@localhost.com';
    ELSE
        -- Create new user
        user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated',
            'dev@localhost.com',
            crypt('dev123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Development User", "role": "Admin"}',
            false,
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'User dev@localhost.com created with ID: %', user_id;
    END IF;
    
    -- Now create or update the user in public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        user_role,
        approval_status,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'dev@localhost.com',
        'Development User',
        'Admin',
        'approved',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        user_role = EXCLUDED.user_role,
        approval_status = EXCLUDED.approval_status,
        updated_at = NOW();
    
    RAISE NOTICE 'Public user record created/updated for ID: %', user_id;
END $$;
