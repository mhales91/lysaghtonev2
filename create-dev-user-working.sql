-- Working development user creation script
-- Run this in your Supabase SQL Editor

-- Step 1: Delete existing user if it exists (to avoid conflicts)
DELETE FROM public.users WHERE email = 'dev@localhost.com';
DELETE FROM auth.users WHERE email = 'dev@localhost.com';

-- Step 2: Create user in auth.users table
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
  gen_random_uuid(),
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

-- Step 3: Create user in public.users table
INSERT INTO public.users (
  id,
  email,
  full_name,
  user_role,
  approval_status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'Development User',
  'Admin',
  'approved',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'dev@localhost.com';

-- Step 4: Show the result
SELECT 'Development user created successfully' as message;
