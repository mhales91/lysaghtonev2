// Test authentication with your Supabase setup
// Run this with: node test-auth.js

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const getEnvVar = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'http://134.199.146.249:8000');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');
const supabaseServiceKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY', '');

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testAuth() {
  console.log('🧪 Testing Authentication...');
  
  try {
    // Test 1: Try to sign in with existing user
    console.log('\n🔍 Testing sign in with dev@localhost.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'dev@localhost.com',
      password: 'dev123456',
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      // Test 2: Try to create user with admin client
      console.log('\n🔍 Testing user creation with admin client...');
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'dev@localhost.com',
        password: 'dev123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Development User',
          role: 'Admin',
        },
      });
      
      if (createError) {
        console.log('❌ User creation failed:', createError.message);
        console.log('\n💡 Solution: Run the create-dev-user.sql script in your Supabase dashboard');
      } else {
        console.log('✅ User created successfully:', createData.user?.email);
      }
    } else {
      console.log('✅ Sign in successful:', signInData.user?.email);
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

testAuth();
