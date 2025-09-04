-- Simple development user creation - run this in Supabase SQL Editor

-- Step 1: Create user in auth.users table
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
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Create user in public.users table
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
WHERE au.email = 'dev@localhost.com'
ON CONFLICT (id) DO UPDATE SET
  user_role = 'Admin',
  approval_status = 'approved',
  updated_at = NOW();

-- Step 3: Show the result
SELECT 'Development user created successfully' as message;
