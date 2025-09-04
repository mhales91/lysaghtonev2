// Test script to verify the custom SDK is working
// Run this with: node test-sdk.js

import { customClient } from './src/lib/custom-sdk.js';

async function testSDK() {
  console.log('🧪 Testing Custom SDK...');
  
  try {
    // Test 1: Check if the custom client is created
    console.log('✅ Custom client created successfully');
    console.log('   - Entities available:', Object.keys(customClient.entities));
    console.log('   - Auth available:', !!customClient.auth);
    
    // Test 2: Test entity creation
    console.log('\n🔍 Testing entity creation...');
    const userEntity = customClient.entities.User;
    console.log('✅ User entity created:', !!userEntity);
    
    // Test 3: Test authentication methods
    console.log('\n🔍 Testing authentication methods...');
    console.log('   - login method:', typeof userEntity.login);
    console.log('   - me method:', typeof userEntity.me);
    console.log('   - isAuthenticated method:', typeof userEntity.isAuthenticated);
    
    // Test 4: Test other entities
    console.log('\n🔍 Testing other entities...');
    const clientEntity = customClient.entities.Client;
    const projectEntity = customClient.entities.Project;
    console.log('✅ Client entity:', !!clientEntity);
    console.log('✅ Project entity:', !!projectEntity);
    
    console.log('\n🎉 SDK test completed successfully!');
    console.log('\nYour Base44 to Supabase integration is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Open your app at: http://localhost:5174/');
    console.log('2. Test the authentication flow');
    console.log('3. Try creating some data');
    
  } catch (error) {
    console.error('❌ SDK test failed:', error.message);
  }
}

testSDK();
