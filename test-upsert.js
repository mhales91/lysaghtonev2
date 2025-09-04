// Test upsert operation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://134.199.146.249:8000';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpsert() {
  console.log('🧪 Testing upsert operation...');

  const testClient = {
    id: crypto.randomUUID(),
    company_name: 'Test Company 2',
    contact_person: 'Test Person 2',
    email: 'test@example.com',
    phone: '123-456-7890',
    crm_stage: 'lead'
  };

  console.log('Test data:', testClient);

  const { data, error } = await supabase
    .from('client')
    .upsert(testClient, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('❌ Upsert error:', error);
  } else {
    console.log('✅ Upsert successful:', data);
  }

  // Check if record exists
  const { data: check, error: checkError } = await supabase
    .from('client')
    .select('*')
    .eq('company_name', 'Test Company 2');

  if (checkError) {
    console.error('❌ Check error:', checkError);
  } else {
    console.log('✅ Record found:', check.length, 'records');
  }
}

testUpsert();
