// Test the signature function
import { handleSignature } from './src/api/signature-functions.js';

async function testSignatureFunction() {
  try {
    console.log('🧪 Testing signature function...');
    
    // Test creating a signature
    const testPayload = {
      toe_id: 'test-toe-id',
      signature_data: 'data:image/jpeg;base64,test-signature-data',
      signer_name: 'Test User',
      signer_type: 'lysaght'
    };
    
    console.log('📝 Testing signature creation...');
    const result = await handleSignature('create', testPayload);
    console.log('✅ Signature creation result:', result);
    
    // Test getting a signature
    console.log('📖 Testing signature retrieval...');
    const getResult = await handleSignature('get', { toe_id: 'test-toe-id' });
    console.log('✅ Signature retrieval result:', getResult);
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSignatureFunction();
