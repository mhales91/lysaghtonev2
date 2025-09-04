// Test script to verify Supabase connection
// Run this with: node test-connection.js

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const getEnvVar = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'http://134.199.146.249:8000');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');
const supabaseServiceKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY', '');

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');
console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Not set');

if (!supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Environment variables not set properly');
  console.error('Please set VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Test anon client
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    console.log('\n🔍 Testing anon client connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST205' && error.message.includes('Could not find the table')) {
        console.log('⚠️  Users table not found - this is expected if setup hasn\'t been run yet');
        console.log('   Please run the SQL setup script in your Supabase dashboard');
      } else {
        console.error('❌ Anon client error:', error.message);
      }
    } else {
      console.log('✅ Anon client connection successful');
    }

    console.log('\n🔍 Testing service role client connection...');
    
    // Test service role connection
    const { data: adminData, error: adminError } = await supabaseAdmin.from('users').select('id').limit(1);
    
    if (adminError) {
      if (adminError.code === 'PGRST205' && adminError.message.includes('Could not find the table')) {
        console.log('⚠️  Users table not found - this is expected if setup hasn\'t been run yet');
        console.log('   Please run the SQL setup script in your Supabase dashboard');
      } else {
        console.error('❌ Service role client error:', adminError.message);
      }
    } else {
      console.log('✅ Service role client connection successful');
    }

    console.log('\n🎉 Connection test completed!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL setup script in your Supabase dashboard');
    console.log('2. Start your app with: npm run dev');
    console.log('3. Test the authentication flow');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
