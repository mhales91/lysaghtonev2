-- Create a development user manually in Supabase
-- Run this in your Supabase SQL Editor

-- First, create the user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
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
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
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

-- Get the user ID
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'dev@localhost.com';
    
    -- Create the user in public.users
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
    );
    
    RAISE NOTICE 'Development user created with ID: %', user_id;
END $$;
