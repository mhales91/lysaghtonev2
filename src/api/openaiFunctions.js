// Real OpenAI API functions for localhost development
// These make actual API calls to OpenAI instead of mock responses

// Removed Bottleneck import - using simple concurrency limiter instead

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ===== RATE LIMIT UTILITIES =====

// TPM helpers (detect, wait, shrink)
export function isTPMRateLimitMessage(msg = "") {
  return /rate limit .* tokens per min|TPM/i.test(msg);
}

export function extractRetryMs(msg = "") {
  const m = msg.match(/try again in (\d+)ms/i);
  return m ? Math.max(100, parseInt(m[1], 10)) : 1000 + Math.floor(Math.random()*500);
}

export function tuneMaxOutputOnTPM(prevMax, msg) {
  // Reduce output so next run fits; parse "Limit L, Used U, Requested R"
  const m = msg.match(/Limit\s+(\d+).*?Used\s+(\d+).*?Requested\s+(\d+)/i);
  if (!m) return Math.max(8000, Math.floor(prevMax * 0.9));
  const [, Ls, Us, Rs] = m;
  const L = Number(Ls), U = Number(Us), R = Number(Rs);
  const over = Math.max(0, (U + R) - L);
  // Leave ~800 token cushion + 1k guard
  const target = Math.min(prevMax - 1000, prevMax - over - 800);
  return Math.max(8000, target);
}

// Local minute bucket gate (prevents starting when you'll overshoot)
let windowStart = 0;
let usedThisWindow = 0;

const now = () => Date.now();

function resetWindowIfNeeded() {
  if (now() - windowStart >= 60_000) {
    windowStart = now();
    usedThisWindow = 0;
  }
}

export async function gateByTPM(predictedTokens, TPM = 200_000, safety = 2_500) {
  // safety cushion so you don't land 100–500 tokens over
  resetWindowIfNeeded();
  const headroom = TPM - usedThisWindow - safety;
  if (predictedTokens <= headroom) return;
  // wait to the next minute window
  const wait = 60_000 - (now() - windowStart) + 100 + Math.random()*200;
  console.log(`TPM gate: predicted ${predictedTokens} tokens, used ${usedThisWindow}, headroom ${headroom}, waiting ${wait}ms`);
  await new Promise(r => setTimeout(r, wait));
  resetWindowIfNeeded();
}

export function accountTokens(actualUsed) {
  resetWindowIfNeeded();
  usedThisWindow += Math.max(0, actualUsed || 0);
  console.log(`Accounted ${actualUsed} tokens, total used this window: ${usedThisWindow}`);
}

// start conservative; learn an EMA of non-output overhead
let drNonOutputEMA = 12000; // seed; updated after successes
function predictedTokensForDR(payload) {
  const out = Number(payload.max_output_tokens ?? 20000);
  return out + Math.max(8000, drNonOutputEMA);
}

// Clamp job to fit current headroom (don't always wait)
function clampToHeadroom(payload, headroom, cushion = 2500) {
  const outMax = Number(payload.max_output_tokens ?? 20000);
  const allowed = Math.max(
    8000,
    Math.min(outMax, headroom - Math.max(6000, drNonOutputEMA) - cushion)
  );
  return { ...payload, max_output_tokens: allowed };
}

// Debug logging
console.log('Environment check:');
console.log('import.meta.env.VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY);
console.log('OPENAI_API_KEY:', OPENAI_API_KEY);
console.log('All env vars:', import.meta.env);

// Helper function to check if model is GPT-5 like
function isG5Like(model) {
  const m = String(model || '').trim().toLowerCase();
  return m.includes('gpt-5') || m.startsWith('o1') || m.startsWith('o3');
}

// Helper function to check if model is a deep research model
function isDeepResearchModel(model) {
  const m = String(model || '').trim().toLowerCase();
  return m.includes('deep-research') || m.includes('o3-deep-research') || m.includes('o4-mini-deep-research');
}

// Helper function to normalize deep research model IDs to the correct dated versions
function normalizeDeepResearchModel(model) {
  const m = String(model || '').trim().toLowerCase();
  if (m.includes('o3-deep-research')) {
    return 'o3-deep-research-2025-06-26';
  } else if (m.includes('o4-mini-deep-research')) {
    return 'o4-mini-deep-research-2025-06-26';
  }
  return model; // return as-is if not a deep research model
}

// ---- Proper TPM Rate Limiting ----
const DEFAULT_TPM = Number(import.meta.env.VITE_OPENAI_TPM ?? 200_000);
const TPM_WINDOW_MS = 60000; // 1 minute window
const TPM_SAFETY_MARGIN = 0.8; // Use only 80% of limit for safety

// Track token usage over time
let tokenUsage = [];
let emaTokensPerJob = 26000; // seed; update from usage

// Clean old token usage records
function cleanTokenUsage() {
  const now = Date.now();
  tokenUsage = tokenUsage.filter(record => now - record.timestamp < TPM_WINDOW_MS);
}

// Get current token usage in the last minute
function getCurrentTokenUsage() {
  cleanTokenUsage();
  return tokenUsage.reduce((sum, record) => sum + record.tokens, 0);
}

// Add token usage record
function recordTokenUsage(tokens) {
  const now = Date.now();
  tokenUsage.push({ timestamp: now, tokens });
  cleanTokenUsage();
}

// Check if we can make a request without exceeding TPM
function canMakeRequest(estimatedTokens = emaTokensPerJob) {
  const currentUsage = getCurrentTokenUsage();
  const maxAllowed = Math.floor(DEFAULT_TPM * TPM_SAFETY_MARGIN);
  return (currentUsage + estimatedTokens) <= maxAllowed;
}

// Wait until we can make a request
async function waitForTPMAvailability(estimatedTokens = emaTokensPerJob) {
  while (!canMakeRequest(estimatedTokens)) {
    const currentUsage = getCurrentTokenUsage();
    const maxAllowed = Math.floor(DEFAULT_TPM * TPM_SAFETY_MARGIN);
    const remaining = maxAllowed - currentUsage;
    const waitTime = Math.min(60000, Math.max(1000, (estimatedTokens - remaining) * 1000 / DEFAULT_TPM));
    
    console.log(`TPM limit approaching. Current: ${currentUsage}, Max: ${maxAllowed}, Estimated: ${estimatedTokens}, Waiting ${waitTime}ms`);
    await new Promise(r => setTimeout(r, waitTime));
  }
}

// derive wait time from headers (Retry-After > reset headers > backoff)
function nextDelay(headers, attempt, baseMs = 250, capMs = 15000) {
  // 1) Retry-After (seconds or HTTP-date)
  const ra = headers.get("retry-after");
  if (ra) {
    const asNum = Number(ra);
    if (!Number.isNaN(asNum)) return Math.min(capMs, asNum * 1000);
    const asDate = Date.parse(ra);
    if (!Number.isNaN(asDate)) return Math.min(capMs, Math.max(0, asDate - Date.now()));
  }

  // 2) x-ratelimit-reset-* (varies by route; treat as seconds if numeric)
  const resets = [
    headers.get("x-ratelimit-reset-requests"),
    headers.get("x-ratelimit-reset-tokens"),
  ].filter(Boolean);
  for (const v of resets) {
    const n = Number(v);
    if (!Number.isNaN(n)) return Math.min(capMs, Math.max(0, n * 1000));
    const d = Date.parse(v);
    if (!Number.isNaN(d)) return Math.min(capMs, Math.max(0, d - Date.now()));
  }

  // 3) decorrelated jitter backoff
  const pow = Math.min(capMs, Math.round(baseMs * (2 ** attempt)));
  return Math.min(capMs, Math.round(pow / 2 + Math.random() * pow));
}

// Headers-aware retry for Responses API
async function responsesCreateWithRetries(payload, { maxRetries = 6 } = {}) {
  const url = "https://api.openai.com/v1/responses";
  let attempt = 0;

  while (true) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) return { body: await res.json(), headers: res.headers };

    // Check for rate limit errors
    const errBody = await res.text().catch(() => "");
    const isRateLimit = res.status === 429 || errBody.includes('rate limit') || errBody.includes('TPM');
    
    if (isRateLimit) {
      // Extract retry time from error message
      const retryMatch = errBody.match(/try again in (\d+)ms/);
      const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 60000; // Default 1 minute
      
      console.log(`Rate limit hit (${res.status}), waiting ${retryAfter}ms before retry ${attempt + 1}/${maxRetries}`);
      console.log(`Error details: ${errBody}`);
      
      // Wait for the specified time plus some buffer
      await new Promise(r => setTimeout(r, retryAfter + 1000));
      attempt++;
      continue;
    }
    
    // Other retryable errors
    const retryable = res.status >= 500 && res.status < 600;
    if (!retryable || attempt >= maxRetries) {
      throw new Error(`OpenAI error ${res.status}: ${errBody || "no body"}`);
    }

    const delay = nextDelay(res.headers, attempt);
    console.log(`Server error, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
    await new Promise(r => setTimeout(r, delay));
    attempt++;
  }
}

// Simple concurrency limiter (TPM is handled separately)
let isDeepResearchRunning = false;
const drLimiter = {
  schedule: async (fn) => {
    while (isDeepResearchRunning) {
      await new Promise(r => setTimeout(r, 100));
    }
    isDeepResearchRunning = true;
    try {
      return await fn();
    } finally {
      isDeepResearchRunning = false;
    }
  }
};

function updateEMA(totalTokens) {
  const alpha = 0.25;
  emaTokensPerJob = Math.round(alpha * totalTokens + (1 - alpha) * emaTokensPerJob);
  console.log(`Updated token estimate: ${emaTokensPerJob} tokens per job`);
  recordTokenUsage(totalTokens); // Record the actual usage
}

// Background polling with adaptive intervals
async function waitForCompletion(id, {
  intervalQueuedMs = 1200,
  intervalInProgressMs = 1200,
  maxQueuedMs = 300000,        // 5 minutes max queued
  timeoutMs = 1800000          // 30 minutes total timeout
} = {}) {
  const url = `https://api.openai.com/v1/responses/${id}`;
  const started = Date.now();
  let wait = intervalQueuedMs;
  let pollCount = 0;

  while (true) {
    await new Promise(r => setTimeout(r, wait + Math.random() * 250));
    pollCount++;

    // Check timeout
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Deep Research timed out after ${Math.round((Date.now() - started) / 1000)}s`);
    }

    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` }
    });
    if (!res.ok) throw new Error(`retrieve error ${res.status}`);

    const data = await res.json();
    console.log(`Poll ${pollCount}: status = ${data.status}, id = ${id} (${Math.round((Date.now() - started) / 1000)}s elapsed)`);

    if (data.status === "completed") return data;
    if (["failed", "cancelled", "expired"].includes(data.status)) {
      // Log full response for debugging
      console.error(`Deep Research job ${data.status} after ${pollCount} polls:`, {
        status: data.status,
        id: data.id,
        error: data.error,
        last_error: data.last_error,
        incomplete_details: data.incomplete_details,
        usage: data.usage,
        created_at: data.created_at,
        model: data.model,
        background: data.background,
        tools: data.tools,
        max_output_tokens: data.max_output_tokens,
        output: data.output
      });
      
      const reason = data?.incomplete_details?.reason || 
                    data?.last_error?.message || 
                    data?.error?.message || 
                    data?.error?.code ||
                    "unknown";
      throw new Error(`Deep Research ended early: ${reason}`);
    }

    // adaptive interval
    if (data.status === "queued") {
      wait = Math.min(6000, Math.round(wait * 1.6));
      if (Date.now() - started > maxQueuedMs) {
        console.info(`Still queued after ${Math.round((Date.now() - started) / 1000)}s; continuing...`);
      }
    } else if (data.status === "in_progress") {
      wait = intervalInProgressMs;
    }
  }
}

// Deep Research payload builder
function buildDRPayload(topic, brief) {
  return {
    model: "o4-mini-deep-research-2025-06-26",
    input: [
      { role: "developer", content: [{ type: "input_text", text: brief }] },
      { role: "user", content: [{ type: "input_text", text: topic }] }
    ],
    background: true,
    max_output_tokens: Number(import.meta.env.VITE_DR_MAX_OUTPUT_TOKENS ?? 18000)
    // NOTE: omit "tools" unless you must force web_search; the model can pick defaults
  };
}

// Rate limit monitoring
function logRateLimitStatus() {
  const currentConcurrency = Math.max(1, Math.floor(DEFAULT_TPM / Math.max(1000, emaTokensPerJob)));
  const estimatedTPM = emaTokensPerJob * currentConcurrency;
  console.log(`Rate limit status: TPM=${DEFAULT_TPM}, Est. usage=${estimatedTPM}, Concurrency=${currentConcurrency}`);
}

// Utility: turn a Responses API result into a single string of markdown
export function normalizeDeepResearchText(resp) {
  if (!resp) return "";

  // 1) SDK convenience (newer SDKs expose this)
  if (typeof resp.output_text === "string" && resp.output_text.trim()) {
    return resp.output_text;
  }

  // 2) Plain Responses API shape: resp.output is an array of "message" objects
  // Each message has content: [{type: 'output_text'|'text'|..., text: '...'}, ...]
  try {
    const parts = (resp.output ?? [])
      .flatMap(m => m?.content ?? [])
      .map(c => {
        // common shapes
        if (typeof c?.text === "string") return c.text;
        if (typeof c?.content === "string") return c.content;
        if (typeof c?.arguments === "string") return c.arguments; // rare
        // some SDKs nest as { text: { value: "..." } }
        if (c?.text?.value) return String(c.text.value);
        return "";
      })
      .filter(Boolean);

    const joined = parts.join("");
    if (joined.trim()) return joined;
  } catch {}

  // 3) Background retrieve shape sometimes nests under resp.response
  if (resp?.response?.output_text) return String(resp.response.output_text);

  // 4) Fallback: show something rather than crash
  return "*(No text content returned; raw payload)*\n\n```json\n" +
         JSON.stringify(resp, null, 2) + "\n```";
}

// Poll until the background job completes
export async function waitForResponseCompletion(client, responseOrId, { intervalMs = 1200, timeoutMs = 120000 } = {}) {
  const id = typeof responseOrId === "string" ? responseOrId : responseOrId.id;
  const start = Date.now();
  let resp = typeof responseOrId === "string" ? null : responseOrId;

  while (true) {
    if (!resp || resp.status === "in_progress" || resp.status === "queued") {
      await new Promise(r => setTimeout(r, intervalMs));
      resp = await client.responses.retrieve(id);
    }

    if (resp.status === "completed") return resp;

    if (resp.status === "failed" || resp.status === "cancelled" || resp.status === "expired") {
      throw new Error(`Deep Research job ${resp.status}: ${resp?.incomplete_details?.reason ?? "unknown"}`);
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Deep Research timed out while waiting for completion.");
    }
  }
}

// Function to explain Deep Research failure details
function explainDRFailure(resp) {
  const err = {
    status: resp?.status,
    reason: resp?.incomplete_details?.reason,
    last_error: resp?.last_error,                // backend/tool error
    last_error_message: resp?.last_error?.message,
    error: resp?.error,
    error_message: resp?.error?.message,
    incomplete_details: resp?.incomplete_details,
    usage: resp?.usage,
    id: resp?.id,
    // Additional debugging fields
    created_at: resp?.created_at,
    model: resp?.model,
    background: resp?.background,
    tools: resp?.tools,
    max_output_tokens: resp?.max_output_tokens
  };
  console.warn("Deep Research failure detail:", err);
  console.warn("Full failed response:", JSON.stringify(resp, null, 2));
  return err;
}


// Deep Research call wrapper with TPM-aware retry logic
export async function runDeepResearch(topic, brief, client) {
  const TPM = Number(import.meta.env.VITE_OPENAI_TPM ?? 200000);
  let tpmStrikes = 0; // Track consecutive TPM errors
  
  let payload = {
    model: "o4-mini-deep-research-2025-06-26",
    input: [
      { role: "developer", content: [{ type: "input_text", text: brief }] },
      { role: "user",      content: [{ type: "input_text", text: topic }] }
    ],
    tools: [{ type: "web_search" }],
    background: true,
    max_output_tokens: Number(import.meta.env.VITE_DR_MAX_OUTPUT_TOKENS ?? 18000), // Reduced default
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    // 1) HEADROOM GATE BEFORE CREATE (with larger cushion)
    await gateByTPM(predictedTokensForDR(payload), TPM, 5000);
    
    // 2) CLAMP TO FIT CURRENT HEADROOM
    resetWindowIfNeeded();
    const headroom = TPM - usedThisWindow - 2500;
    payload = clampToHeadroom(payload, headroom);

    // 2) CREATE
    const { body: created, headers } = await responsesCreateWithRetries(payload);
    
    // Log rate limit hints
    const remainingRequests = headers.get("x-ratelimit-remaining-requests");
    const remainingTokens = headers.get("x-ratelimit-remaining-tokens");
    if (remainingRequests || remainingTokens) {
      console.debug("Rate hints:", { remainingRequests, remainingTokens });
    }

    // 3) POLL + HANDLE THROWN TPM HERE
    let final;
    try {
      final = await waitForCompletion(created.id);
    } catch (e) {
      const msg = String(e?.message || "");
      if (isTPMRateLimitMessage(msg)) {
        tpmStrikes = (tpmStrikes || 0) + 1;
        // always shrink a bit
        payload = { ...payload, max_output_tokens: tuneMaxOutputOnTPM(payload.max_output_tokens, msg) };
        if (tpmStrikes >= 2) {
          // wait for minute reset (+ jitter)
          const toReset = 60_000 - (Date.now() - windowStart) + 200 + Math.random()*300;
          console.warn(`TPM again → waiting until next minute (~${Math.max(500, toReset)}ms); next max_output_tokens=${payload.max_output_tokens} (attempt ${attempt+1}/3)`);
          await new Promise(r => setTimeout(r, Math.max(500, toReset)));
          resetWindowIfNeeded();
        } else {
          const waitMs = extractRetryMs(msg);
          console.warn(`TPM during poll. Waiting ~${Math.max(800, waitMs)}ms; next max_output_tokens=${payload.max_output_tokens} (attempt ${attempt+1}/3)`);
          await new Promise(r => setTimeout(r, Math.max(800, waitMs))); // floor a bit
        }
        continue; // retry loop
      }
      throw e; // non-TPM failure -> bubble up
    }

    // 4) SUCCESS PATH
    if (final?.status === "completed") {
      const out = final?.usage?.output_tokens ?? 0;
      const total = (final?.usage?.total_tokens)
        ?? ((final?.usage?.input_tokens || 0) + (final?.usage?.output_tokens || 0));
      if (total) {
        accountTokens(total);
        updateEMA(total);
        
        // Learn non-output overhead from successful runs
        const nonOutput = Math.max(0, total - out);
        drNonOutputEMA = Math.round(0.25 * nonOutput + 0.75 * drNonOutputEMA);
        console.log(`Updated DR non-output EMA: ${drNonOutputEMA} tokens`);
      }
      
      // Normalize the response to ensure we always return a string
      const text = normalizeDeepResearchText(final);
      
      // Check for truncation and add user feedback
      const reason = final?.incomplete_details?.reason;
      let finalText = text;
      
      if (reason === "max_output_tokens") {
        console.warn("Deep Research hit max_output_tokens; content may be incomplete.");
        finalText = text + "\n\n---\n\n⚠️ **Note**: This response was truncated due to length limits. Consider breaking your query into smaller parts for a complete analysis.";
      } else if (reason === "max_completion_tokens") {
        console.warn("Deep Research hit max_completion_tokens; content may be incomplete.");
        finalText = text + "\n\n---\n\n⚠️ **Note**: This response was truncated due to token limits. Consider rephrasing your question for a more focused response.";
      }
      
      // Return a shape the UI expects (string for markdown)
      return { 
        text: finalText, 
        raw: final, 
        truncated: !!reason,
        model_used: final?.model || payload.model
      };
    }

    // 5) BACKGROUND RETURNED FAILED BUT DIDN'T THROW (future-proof)
    const msg = String(final?.incomplete_details?.reason || final?.last_error?.message || final?.error?.message || "");
    if (isTPMRateLimitMessage(msg)) {
      tpmStrikes = (tpmStrikes || 0) + 1;
      // always shrink a bit
      payload = { ...payload, max_output_tokens: tuneMaxOutputOnTPM(payload.max_output_tokens, msg) };
      if (tpmStrikes >= 2) {
        // wait for minute reset (+ jitter)
        const toReset = 60_000 - (Date.now() - windowStart) + 200 + Math.random()*300;
        console.warn(`TPM in failed response → waiting until next minute (~${Math.max(500, toReset)}ms); next max_output_tokens=${payload.max_output_tokens} (attempt ${attempt+1}/3)`);
        await new Promise(r => setTimeout(r, Math.max(500, toReset)));
        resetWindowIfNeeded();
      } else {
        const waitMs = extractRetryMs(msg);
        console.warn(`TPM in failed response. Waiting ~${Math.max(800, waitMs)}ms; next max_output_tokens=${payload.max_output_tokens} (attempt ${attempt+1}/3)`);
        await new Promise(r => setTimeout(r, Math.max(800, waitMs))); // floor a bit
      }
      continue;
    }
    
    // Other failure → bubble up
    throw new Error(`Deep Research failed: ${msg || "unknown"}`);
  }

  throw new Error("Deep Research failed after TPM retries.");
}

// Legacy wrapper for backward compatibility
async function callDeepResearch(payload) {
  // Extract topic and brief from payload
  const topic = payload.input?.[1]?.content?.[0]?.text || "Unknown topic";
  const brief = payload.input?.[0]?.content?.[0]?.text || "Research this topic comprehensively.";
  
  return runDeepResearch(topic, brief, { responses: { create: responsesCreateWithRetries } });
}

// Helper function to build OpenAI headers
function buildOpenAIHeaders() {
  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  };
  return headers;
}

// Helper function to call OpenAI Chat Completions API
async function callOpenAIChatCompletions(payload) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: buildOpenAIHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }
  
  return data;
}

// Helper function to call OpenAI Responses API (for deep research models)
async function callOpenAIResponses(payload, method = 'POST') {
  if (method === 'GET' && payload.id) {
    // Handle polling requests
    console.log('Polling OpenAI Responses API for job:', payload.id);
    const response = await fetch(`https://api.openai.com/v1/responses/${payload.id}`, {
      method: 'GET',
      headers: buildOpenAIHeaders()
    });
    
    console.log('OpenAI Responses API polling status:', response.status);
    const data = await response.json();
    console.log('OpenAI Responses API polling data:', data);
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }
    
    return data;
  } else {
    // Handle create requests
  console.log('Calling OpenAI Responses API with payload:', JSON.stringify(payload, null, 2));
      console.log('Payload model:', payload.model);
      console.log('Payload tools:', payload.tools);
  
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: buildOpenAIHeaders(),
    body: JSON.stringify(payload)
  });

  console.log('OpenAI Responses API response status:', response.status);
  const data = await response.json();
  console.log('OpenAI Responses API response data:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }
  
  return data;
  }
}

// Helper function to call OpenAI Images API with GPT-Image-1
async function callOpenAIImage(prompt, options = {}) {
  const {
    size = '1024x1024',
    quality = 'high',

    n = 1,

    user = null
  } = options;

  console.log('Calling OpenAI Images API with GPT-Image-1:', {
    model: 'gpt-image-1',
    prompt: prompt,
    size,
    quality,

    n,

  });
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: buildOpenAIHeaders(),
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      size,
      quality,
      n,
      ...(user && { user })
    })
  });

  console.log('OpenAI Images API response status:', response.status);
  const data = await response.json();
  console.log('OpenAI Images API response data:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`OpenAI Images API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }
  
  return data;
}

// Helper function for image editing with GPT-Image-1
async function callOpenAIImageEdit(image, mask, prompt, options = {}) {
  const {
    size = '1024x1024',
    n = 1,

    user = null
  } = options;

  console.log('Calling OpenAI Image Edit API with GPT-Image-1:', {
    model: 'gpt-image-1',
    prompt: prompt,
    size,
    n,

  });

  const formData = new FormData();
  formData.append('image', image);
  if (mask) formData.append('mask', mask);
  formData.append('prompt', prompt);
  formData.append('model', 'gpt-image-1');
  formData.append('size', size);
  formData.append('n', n.toString());
  if (user) formData.append('user', user);

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  });

  console.log('OpenAI Image Edit API response status:', response.status);
  const data = await response.json();
  console.log('OpenAI Image Edit API response data:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`OpenAI Image Edit API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }
  
  return data;
}

// Helper function for image variations with GPT-Image-1
async function callOpenAIImageVariation(image, options = {}) {
  const {
    size = '1024x1024',
    n = 1,

    user = null
  } = options;

  console.log('Calling OpenAI Image Variation API:', {
    size,
    n
  });

  const formData = new FormData();
  formData.append('image', image);
  formData.append('size', size);
  formData.append('n', n.toString());
  if (user) formData.append('user', user);

  const response = await fetch('https://api.openai.com/v1/images/variations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  });

  console.log('OpenAI Image Variation API response status:', response.status);
  const data = await response.json();
  console.log('OpenAI Image Variation API response data:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`OpenAI Image Variation API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
  }
  
  return data;
}

// Helper function for streaming image generation
async function* callOpenAIImageStream(prompt, options = {}) {
  const {
    size = '1024x1024',
    quality = 'high',

    n = 1,
    user = null
  } = options;

  console.log('Calling OpenAI Images API with streaming:', {
    model: 'gpt-image-1',
    prompt: prompt,
    size,
    quality,

    n,
    stream: true
  });
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: buildOpenAIHeaders(),
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      size,
      quality,

      n,
      stream: true,
      ...(user && { user })
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI Images API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.warn('Failed to parse streaming data:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const openaiAdvanced = async (params) => {
  console.log('Real openaiAdvanced called with params:', params);
  console.log('OPENAI_API_KEY length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 'undefined');

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env.local file.');
  }

  const { action, prompt, model, systemPrompt, history, fileUrls } = params;
  const effectiveModel = model || 'gpt-4o';

  try {
    if (action === 'generate_image') {
      console.log('Generating image with gpt-image-1 model...');
      
      // Extract image generation options from params
      const imageOptions = {
        size: params.size || '1024x1024',
        quality: params.quality || 'high',
        n: params.n || 1,
        user: params.user || null
      };
      
      const imageResponse = await callOpenAIImage(prompt, imageOptions);
      console.log('Full image response:', JSON.stringify(imageResponse, null, 2));
      
      // Try different possible response formats for gpt-image-1
      let imageUrls = [];
      
      // Handle multiple images if available
      if (imageResponse.data && Array.isArray(imageResponse.data)) {
        imageUrls = await Promise.all(imageResponse.data.map(async (item) => {
          let url = item.url || item.b64_json || item.image_url;
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            url = `data:image/png;base64,${url}`;
          } else if (url && url.startsWith('http')) {
            // Use a CORS proxy to convert external URL to base64
            try {
              const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
              const response = await fetch(proxyUrl);
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              url = `data:image/png;base64,${base64}`;
            } catch (error) {
              console.error('Error converting external URL to base64 via proxy:', error);
              // Keep original URL as fallback
            }
          }
          return url;
        }));
        imageUrls = imageUrls.filter(Boolean);
      } else {
        // Fallback to single image
        let imageUrl = imageResponse.data?.[0]?.url || 
                      imageResponse.data?.[0]?.b64_json || 
                      imageResponse.url || 
                      imageResponse.image_url;
        
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `data:image/png;base64,${imageUrl}`;
        } else if (imageUrl && imageUrl.startsWith('http')) {
          // Use a CORS proxy to convert external URL to base64
          try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            imageUrl = `data:image/png;base64,${base64}`;
          } catch (error) {
            console.error('Error converting external URL to base64 via proxy:', error);
            // Keep original URL as fallback
          }
        }
        
        if (imageUrl) {
          imageUrls = [imageUrl];
        }
      }
      
      console.log('Extracted imageUrls:', imageUrls);
      
      if (imageUrls.length === 0) {
        console.error('No image URLs found in response. Full response:', imageResponse);
        throw new Error('No image URLs returned from OpenAI');
      }

      return {
        success: true,
        image_url: imageUrls[0], // Keep single image_url for backward compatibility
        image_urls: imageUrls,   // Add array of all image URLs
        response: `Image${imageUrls.length > 1 ? 's' : ''} generated successfully`,
        reply: `Image${imageUrls.length > 1 ? 's' : ''} generated successfully`,
        model_used: 'gpt-image-1',
        size: imageOptions.size,
        quality: imageOptions.quality,

      };
    }

    if (action === 'create_variations') {
      console.log('Creating image variations with gpt-image-1 model...');
      
      const imageOptions = {
        size: params.size || '1024x1024',
        n: params.n || 3
      };
      
      const imageResponse = await callOpenAIImageVariation(params.image, imageOptions);
      console.log('Variations response:', JSON.stringify(imageResponse, null, 2));
      
      // Handle multiple variations
      let imageUrls = [];
      if (imageResponse.data && Array.isArray(imageResponse.data)) {
        imageUrls = imageResponse.data.map(item => {
          let url = item.url || item.b64_json || item.image_url;
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            url = `data:image/png;base64,${url}`;
          }
          return url;
        }).filter(Boolean);
      }
      
      if (imageUrls.length === 0) {
        throw new Error('No variation URLs returned from OpenAI');
      }

      return {
        success: true,
        images: imageUrls,
        image_url: imageUrls[0], // For backward compatibility
        response: `Generated ${imageUrls.length} image variations successfully`,
        reply: `Generated ${imageUrls.length} image variations successfully`,
        model_used: 'gpt-image-1'
      };
    }

    if (action === 'edit_image') {
      console.log('Editing image with gpt-image-1 model...');
      
      const imageOptions = {
        size: params.size || '1024x1024',
        prompt: params.prompt
      };
      
      const imageResponse = await callOpenAIImageEdit(params.image, null, params.prompt, imageOptions);
      console.log('Edit response:', JSON.stringify(imageResponse, null, 2));
      
      // Handle edited image
      let imageUrl = imageResponse.data?.[0]?.url || 
                    imageResponse.data?.[0]?.b64_json || 
                    imageResponse.url || 
                    imageResponse.image_url;
      
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        imageUrl = `data:image/png;base64,${imageUrl}`;
      }
      
      if (!imageUrl) {
        throw new Error('No edited image URL returned from OpenAI');
      }

      return {
        success: true,
        image_url: imageUrl,
        response: `Image edited successfully: ${params.prompt}`,
        reply: `Image edited successfully: ${params.prompt}`,
        model_used: 'gpt-image-1'
      };
    }

    if (action === 'deep_research') {
      console.log('Starting deep research with model:', effectiveModel);
      console.log('Model type:', typeof effectiveModel);
      console.log('Model value:', JSON.stringify(effectiveModel));
      console.log('isDeepResearchModel check:', isDeepResearchModel(effectiveModel));
      
      // For deep research, we want to use the selected model and fail clearly if not available
      const researchModel = effectiveModel;
      console.log('Using deep research model:', researchModel);
      
      // Build messages for deep research
      const messages = [];
      
      // Enhanced system prompt for comprehensive research following OpenAI best practices
      const researchSystemPrompt = `You are an expert research assistant specializing in comprehensive, multi-faceted analysis. Your role is to conduct thorough, methodical research that goes beyond surface-level information.

## Research Methodology:
1. **Initial Analysis**: Break down the research question into key components and sub-questions
2. **Multi-Perspective Approach**: Consider different viewpoints, stakeholders, and contexts
3. **Evidence-Based Research**: Focus on factual, verifiable information with proper sourcing
4. **Critical Analysis**: Evaluate the reliability, relevance, and implications of findings
5. **Synthesis**: Integrate findings into coherent, actionable insights
6. **Limitations & Assumptions**: Clearly state what is known, unknown, and assumed

## Output Structure:
- **Executive Summary**: 2-3 sentence overview of key findings
- **Research Question Analysis**: Deconstruction of the main question
- **Key Findings**: Organized by topic with supporting evidence
- **Critical Analysis**: Evaluation of findings and their implications
- **Gaps & Limitations**: What remains unclear or requires further research
- **Actionable Recommendations**: Specific, practical next steps
- **Sources & References**: Where applicable, note types of sources used

## Research Principles:
- Be thorough but concise
- Distinguish between facts and opinions
- Acknowledge uncertainty when information is incomplete
- Provide context for findings
- Focus on practical applicability
- Maintain objectivity while being comprehensive

Conduct your research with the highest standards of academic and professional rigor.`;
      
      messages.push({ role: 'system', content: researchSystemPrompt });
      
      // Add custom system prompt if provided
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Add conversation history
      if (Array.isArray(history)) {
        for (const h of history) {
          if (h && h.content != null) {
            const role = h.type === 'assistant' ? 'assistant' : 'user';
            messages.push({ role, content: String(h.content) });
          }
        }
      }
      
      // Add current research prompt with enhanced context
      const enhancedPrompt = `Please conduct a comprehensive deep research analysis on the following topic:

"${prompt}"

Please follow the research methodology outlined in your system instructions and provide a thorough, well-structured analysis that addresses all relevant aspects of this topic.`;
      
      messages.push({ role: 'user', content: enhancedPrompt });

      // Build payload with research-optimized parameters
      let payload;
      if (isDeepResearchModel(researchModel)) {
        // Responses API format for deep research models
        // Note: Deep research models are "reasoning" models - no sampling params allowed
        
      // Limit prompt length to reduce token usage and avoid rate limits
      const MAX_PROMPT_CHARS = 3000; // More reasonable limit for DR
      const truncatedPrompt = typeof prompt === "string" && prompt.length > MAX_PROMPT_CHARS
        ? prompt.slice(0, MAX_PROMPT_CHARS) + "…"
        : prompt;
        
        const devInstructions = `You are a professional researcher. Produce a structured, citation-rich report with:
- Clear section headers (Overview, Key Findings, Evidence, Gaps, Sources)
- Bullet points with specific statistics and dates
- Inline citations and a final sources list
- Call out any places where data is weak or contested`;

        // Use official Deep Research payload format (matches OpenAI documentation exactly)
        payload = {
          model: normalizeDeepResearchModel(researchModel),
          input: [
            { 
              role: "developer", 
              content: [{ 
                type: "input_text", 
                text: `You are a professional researcher. Produce a structured, citation-rich report with:
- Clear section headers (Overview, Key Findings, Evidence, Gaps, Sources)
- Bullet points with specific statistics and dates
- Inline citations and a final sources list
- Call out any places where data is weak or contested` 
              }] 
            },
            { 
              role: "user", 
              content: [{ 
                type: "input_text", 
                text: truncatedPrompt 
              }] 
            }
          ],
          background: true,
          tools: [
            { type: "web_search" }
          ],
          max_output_tokens: Number(import.meta.env.VITE_DR_MAX_OUTPUT_TOKENS ?? 18000)
        };
      } else {
        // Chat completions API format
        payload = { 
          model: researchModel, 
          messages,
          // Research-specific parameters
          temperature: 0.3,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        };
      }
      
      console.log('Final payload for API call:', JSON.stringify(payload, null, 2));
      
      // Enhanced payload validation for Deep Research
      if (isDeepResearchModel(researchModel)) {
        console.log('=== Deep Research Payload Validation ===');
        console.log('Model being used:', payload.model);
        console.log('Normalized model:', normalizeDeepResearchModel(payload.model));
        console.log('Input length:', payload.input?.length);
        console.log('Tools configured:', JSON.stringify(payload.tools, null, 2));
        console.log('Background mode:', payload.background);
        console.log('Max output tokens:', payload.max_output_tokens);
        console.log('========================================');
      }

      // Use responses endpoint for deep research models, chat completions for others
      let response;
      let currentModel = researchModel; // Track the actual model used
      
      if (isDeepResearchModel(researchModel)) {
        console.log('Using responses endpoint for deep research model:', researchModel);
        
        // Extract topic and brief from payload for new TPM-aware function
        const topic = payload.input?.[1]?.content?.[0]?.text || truncatedPrompt;
        const brief = payload.input?.[0]?.content?.[0]?.text || 'Research this topic comprehensively.';
        
        const drResult = await drLimiter.schedule(() => 
          runDeepResearch(topic, brief, { responses: { create: responsesCreateWithRetries } })
        );
        
        // Extract normalized text from the result
        content = drResult.text || 'No content received from deep research model.';
        
        // Update currentModel with the actual model used
        currentModel = drResult.model_used || currentModel;
        
        // Log actual text length
        console.log('Deep research response (chars):', content.length);
      } else {
        console.log('Using chat completions endpoint for model:', researchModel);
        response = await callOpenAIChatCompletions(payload);
        
        // Chat completions format
        if (response.choices && response.choices[0] && response.choices[0].message) {
          content = response.choices[0].message.content || 'No content received from OpenAI.';
          currentModel = response.model || researchModel;
        } else {
          throw new Error('Unexpected response format from OpenAI Chat Completions API');
        }
      }
      
      console.log('Final content length:', content.length);
      console.log('Model used:', currentModel);

      return {
        success: true,
        response: content,
        reply: content,
        model_used: currentModel,
        truncated: false
      };
    }

    // Default to chat completions for other actions
    console.log('Using chat completions for action:', action);
    
    // Build messages array
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add conversation history
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h && h.content != null) {
          const role = h.type === 'assistant' ? 'assistant' : 'user';
          messages.push({ role, content: String(h.content) });
        }
      }
    }
    
    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    // Build payload
    const payload = { 
      model: effectiveModel, 
      messages,
      temperature: 0.7,
      max_tokens: 4000
    };
    
    console.log('Calling OpenAI Chat Completions API with payload:', JSON.stringify(payload, null, 2));

    const response = await callOpenAIChatCompletions(payload);
    console.log('OpenAI Chat Completions API response:', JSON.stringify(response, null, 2));
    
    // Extract content from response
    let content = '';
    if (response.choices && response.choices[0] && response.choices[0].message) {
      content = response.choices[0].message.content || 'No content received from OpenAI.';
    } else {
      throw new Error('Unexpected response format from OpenAI Chat Completions API');
    }

    return {
      success: true,
      response: content,
      reply: content,
      model_used: response.model || effectiveModel
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      success: false,
      error: error.message,
      response: error.message,
      reply: error.message
    };
  }
};

// Add missing functions that are imported by LysaghtAI.jsx
export const openaiChat = async (params) => {
  // Simple wrapper around openaiAdvanced for chat functionality
  return await openaiAdvanced({ ...params, action: 'chat' });
};

export const chatStandard = async (params) => {
  // Simple wrapper around openaiAdvanced for standard chat
  return await openaiAdvanced({ ...params, action: 'chat' });
};

export const chatWithRetrieval = async (params) => {
  // Simple wrapper around openaiAdvanced for chat with retrieval
  return await openaiAdvanced({ ...params, action: 'chat' });
};