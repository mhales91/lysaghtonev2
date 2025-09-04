// Signature Handling Function
// Handles TOE signature operations for Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handleSignature(req) {
  try {
    const { method } = req;
    
    if (method === 'POST') {
      return await createSignature(req);
    } else if (method === 'PUT') {
      return await updateSignature(req);
    } else if (method === 'GET') {
      return await getSignature(req);
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Signature handling error:', error);
    return new Response(JSON.stringify({ 
      error: 'Signature operation failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function createSignature(req) {
  try {
    const payload = await req.json();
    const { toe_id, signature_data, signer_name, signer_type } = payload;

    if (!toe_id || !signature_data || !signer_name || !signer_type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: toe_id, signature_data, signer_name, signer_type' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      signer_name,
      signed_date: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    };

    // Add signature data based on type
    if (signer_type === 'client') {
      signatureRecord.client_signature = signature_data;
      signatureRecord.client_signer_name = signer_name;
      signatureRecord.client_signed_date = signatureRecord.signed_date;
    } else if (signer_type === 'lysaght') {
      signatureRecord.lysaght_signature = signature_data;
      signatureRecord.lysaght_signed_date = signatureRecord.signed_date;
    } else {
      return new Response(JSON.stringify({ 
        error: 'Invalid signer_type. Must be "client" or "lysaght"' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response(JSON.stringify({ 
      success: true, 
      signature: updatedSignature 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create signature error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create signature', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateSignature(req) {
  try {
    const payload = await req.json();
    const { signature_id, signature_data, signer_name, signer_type } = payload;

    if (!signature_id || !signature_data || !signer_name || !signer_type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: signature_id, signature_data, signer_name, signer_type' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateData = {
      signer_name,
      signed_date: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    };

    // Add signature data based on type
    if (signer_type === 'client') {
      updateData.client_signature = signature_data;
      updateData.client_signer_name = signer_name;
      updateData.client_signed_date = updateData.signed_date;
    } else if (signer_type === 'lysaght') {
      updateData.lysaght_signature = signature_data;
      updateData.lysaght_signed_date = updateData.signed_date;
    } else {
      return new Response(JSON.stringify({ 
        error: 'Invalid signer_type. Must be "client" or "lysaght"' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('toe_signature')
      .update(updateData)
      .eq('id', signature_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update TOE status if both signatures are present
    if (data.client_signature && data.lysaght_signature) {
      await supabase
        .from('toe')
        .update({ status: 'signed' })
        .eq('id', data.toe_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      signature: data 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update signature error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update signature', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getSignature(req) {
  try {
    const url = new URL(req.url);
    const toe_id = url.searchParams.get('toe_id');
    const share_token = url.searchParams.get('share_token');

    if (!toe_id && !share_token) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: toe_id or share_token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let query = supabase.from('toe_signature').select('*');
    
    if (toe_id) {
      query = query.eq('toe_id', toe_id);
    } else if (share_token) {
      query = query.eq('share_token', share_token);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return new Response(JSON.stringify({ 
          error: 'Signature not found' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      signature: data 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get signature error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get signature', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
