-- Reset the password for the dev user
-- This will update the password in auth.users to match what the code expects

-- First, let's check if the user exists
SELECT id, email FROM auth.users WHERE email = 'dev@localhost.com';

-- Update the password for dev@localhost.com
UPDATE auth.users 
SET encrypted_password = crypt('dev123456', gen_salt('bf'))
WHERE email = 'dev@localhost.com';

-- Also update mitchell@lysaght.net.nz if needed
UPDATE auth.users 
SET encrypted_password = crypt('dev123456', gen_salt('bf'))
WHERE email = 'mitchell@lysaght.net.nz';

-- Verify the update
SELECT id, email, encrypted_password IS NOT NULL as has_password 
FROM auth.users 
WHERE email IN ('dev@localhost.com', 'mitchell@lysaght.net.nz');
