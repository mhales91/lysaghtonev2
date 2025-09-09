// AI Chat Function
// Based on Base44 openaiChat_g5 function, adapted for Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

// Detect GPT-5 / o1 / o3 (trim + lowercase, robust)
function isG5Like(model) {
  const m = String(model || '').trim().toLowerCase();
  return m.includes('gpt-5') || m.startsWith('o1') || m.startsWith('o3');
}

function isDeepResearchModel(model) {
  const m = String(model || '').trim().toLowerCase();
  return m.includes('deep-research') || m.includes('o3-deep-research') || m.includes('o4-mini-deep-research');
}

async function callOpenAI(payload) {
  const headers = {
    'Authorization': 'Bearer ' + OPENAI_API_KEY,
    'Content-Type': 'application/json'
  };
  if (OPENAI_PROJECT_ID) headers['OpenAI-Project'] = OPENAI_PROJECT_ID;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const raw = await resp.text();
  let data;
  try { 
    data = raw ? JSON.parse(raw) : {}; 
  } catch { 
    data = { raw }; 
  }

  return { ok: resp.ok, status: resp.status, data, raw };
}

export default async function aiChat(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set');
    }

    // Authenticate user via Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    let body = {};
    try { 
      body = await req.json(); 
    } catch {
      // ignore
    }

    const prompt = body && body.prompt != null ? String(body.prompt) : '';
    const systemPrompt = body && body.systemPrompt != null ? String(body.systemPrompt) : '';
    const model = body && body.model ? String(body.model) : 'gpt-4o';
    const history = Array.isArray(body.history) ? body.history : [];

    // Build messages
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      if (!h || h.content == null) continue;
      const role = h.type === 'assistant' ? 'assistant' : 'user';
      messages.push({ role, content: String(h.content) });
    }
    messages.push({ role: 'user', content: prompt });

    // Choose token param branch
    const g5 = isG5Like(model);
    const isDR = isDeepResearchModel(model);
    const payload = { model, messages };
    let param_mode = 'none';

    if (isDR) {
      // Deep Research models - use max_output_tokens and background
      delete payload.max_tokens;
      delete payload.max_completion_tokens;
      payload.max_output_tokens = Number(process.env.DR_MAX_OUTPUT_TOKENS ?? 20000);
      payload.background = true;
      param_mode = 'max_output_tokens';
    } else if (g5) {
      payload.max_completion_tokens = 500;   // GPT-5/o1/o3 style
      // no temperature for g5 family
      param_mode = 'max_completion_tokens';
    } else {
      payload.max_tokens = 500;              // GPT-4/4o style
      payload.temperature = 0.7;
      param_mode = 'max_tokens';
    }

    // First attempt
    let result = await callOpenAI(payload);

    // If API rejects token param, flip once and retry
    if (!result.ok && result.data && result.data.error) {
      const err = result.data.error;
      const p = String(err.param || '').toLowerCase();
      const msg = String(err.message || '').toLowerCase();

      if ((p.includes('max_tokens') || msg.includes('max_tokens')) && payload.max_tokens != null) {
        delete payload.max_tokens;
        delete payload.temperature;
        payload.max_completion_tokens = 500;
        param_mode = 'max_completion_tokens';
        result = await callOpenAI(payload);
      } else if ((p.includes('max_completion_tokens') || msg.includes('max_completion_tokens')) && payload.max_completion_tokens != null) {
        delete payload.max_completion_tokens;
        payload.max_tokens = 500;
        payload.temperature = 0.7;
        param_mode = 'max_tokens';
        result = await callOpenAI(payload);
      } else if (p.includes('temperature') && payload.temperature != null) {
        delete payload.temperature;
        result = await callOpenAI(payload);
      }
    }

    if (!result.ok) {
      return json({ 
        success: false, 
        error: 'OpenAI API error: ' + result.status + ' - ' + result.raw 
      }, result.status);
    }

    const data = result.data;
    const content = (data && data.choices && data.choices[0] && data.choices[0].message)
      ? data.choices[0].message.content
      : '';
    const model_used = (data && data.model) ? data.model : model;

    return json({
      success: true,
      response: content,
      model_used,
      usage: (data && data.usage) ? data.usage : null,
      param_mode
    });

  } catch (err) {
    return json({ 
      success: false, 
      error: (err && err.message) ? err.message : String(err) 
    }, 500);
  }
}
