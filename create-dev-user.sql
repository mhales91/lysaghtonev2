-- Create development user for localhost testing
-- This script creates a user in the auth.users table with proper credentials

-- Insert the development user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'dev@localhost.com',
  crypt('dev123456', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Development User", "role": "Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the user ID for the next step
-- We'll need to insert into the public.users table as well
-- This will be done in a separate step after we get the user ID
