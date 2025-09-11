// Ultra-minimal AI functions to avoid all bundling issues
export const openaiAdvanced = async (params) => {
  try {
    const { prompt, model = 'gpt-4o', systemPrompt, history = [], action = 'chat' } = params;
    
    // Build messages array
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    
    // Add history
    for (const h of history) {
      if (h && h.content != null) {
        const role = h.type === 'assistant' ? 'assistant' : 'user';
        messages.push({ role, content: String(h.content) });
      }
    }
    
    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    // Get API key from environment
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Build payload
    const payload = { 
      model, 
      messages,
      temperature: 0.7,
      max_tokens: 4000
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract content from response
    let content = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content || 'No content received from OpenAI.';
    } else {
      throw new Error('Unexpected response format from OpenAI Chat Completions API');
    }

    return {
      success: true,
      response: content,
      reply: content,
      model_used: data.model || model
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error.message,
      response: error.message,
      reply: error.message
    };
  }
};

// Simple wrapper functions
export const openaiChat = async (params) => {
  return await openaiAdvanced({ ...params, action: 'chat' });
};

export const chatStandard = async (params) => {
  return await openaiAdvanced({ ...params, action: 'chat' });
};

export const chatWithRetrieval = async (params) => {
  return await openaiAdvanced({ ...params, action: 'chat' });
};
