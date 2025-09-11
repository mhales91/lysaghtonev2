// Signature Functions for TOE Process
import { createClient } from '@supabase/supabase-js';

// Handle both Vite (import.meta.env) and Node.js (process.env) environments
const getEnvVar = (key, defaultValue) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", "https://lysaghtone.com/");
const supabaseServiceKey = getEnvVar(
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTY2ODEyOTEsImV4cCI6MjA3MjI1NzI5MX0.M-3C2n285htKskqDHhGQMJx509mTAObsi3WRkpJv5iA"
);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

// Handle Signature Operations
export async function handleSignature(operation, payload) {
  try {
    const { toe_id, signature_data, signer_name, signer_type, signature_id, share_token } = payload;

    if (operation === 'create') {
      if (!toe_id || !signature_data || !signer_name || !signer_type) {
        throw new Error('Missing required fields: toe_id, signature_data, signer_name, signer_type');
      }

      // Check if signature record already exists
      const { data: existingSignature, error: checkError } = await supabase
        .from('toe_signature')
        .select('*')
        .eq('toe_id', toe_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      const signatureRecord = {
        toe_id,
        ip_address: 'client-side',
        user_agent: navigator.userAgent
      };

      // Add share_token if provided
      if (share_token) {
        signatureRecord.share_token = share_token;
      }

      // Add signature data based on type
      if (signer_type === 'client') {
        signatureRecord.client_signature = signature_data;
        signatureRecord.client_signer_name = signer_name;
        signatureRecord.client_signed_date = new Date().toISOString();
      } else if (signer_type === 'lysaght') {
        signatureRecord.lysaght_signature = signature_data;
        signatureRecord.lysaght_signer_name = signer_name;
        signatureRecord.lysaght_signed_date = new Date().toISOString();
      } else {
        throw new Error('Invalid signer_type. Must be "client" or "lysaght"');
      }

      let result;
      if (existingSignature) {
        // Update existing signature
        result = await supabase
          .from('toe_signature')
          .update(signatureRecord)
          .eq('id', existingSignature.id)
          .select()
          .single();
      } else {
        // Create new signature record
        result = await supabase
          .from('toe_signature')
          .insert(signatureRecord)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Update TOE status if both signatures are present
      const { data: updatedSignature } = result;
      if (updatedSignature.client_signature && updatedSignature.lysaght_signature) {
        await supabase
          .from('toe')
          .update({ status: 'signed' })
          .eq('id', toe_id);
      }

      return {
        success: true,
        signature: updatedSignature
      };
    }

    if (operation === 'get') {
      const { toe_id, share_token } = payload;
      
      if (!toe_id && !share_token) {
        throw new Error('Missing required parameter: toe_id or share_token');
      }

      let query = supabase.from('toe_signature').select('*');
      
      if (toe_id) {
        query = query.eq('toe_id', toe_id);
      } else if (share_token) {
        query = query.eq('share_token', share_token);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return {
        success: true,
        signature: data || null
      };
    }

    throw new Error('Invalid operation. Must be "create" or "get"');
  } catch (error) {
    console.error('Error in handleSignature:', error);
    throw error;
  }
}
