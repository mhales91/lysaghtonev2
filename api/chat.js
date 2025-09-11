export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: "OpenAI API key not found" 
      });
    }

    const { action, prompt, model, systemPrompt, history } = req.body;
    const effectiveModel = model || "gpt-4o";
    
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h && h.content != null) {
          const role = h.type === "assistant" ? "assistant" : "user";
          messages.push({ role, content: String(h.content) });
        }
      }
    }
    
    messages.push({ role: "user", content: prompt });

    const payload = { 
      model: effectiveModel, 
      messages,
      temperature: 0.7,
      max_tokens: 4000
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} - ${data.error?.message || "Unknown error"}`);
    }
    
    const content = data.choices?.[0]?.message?.content || "No content received from OpenAI.";

    res.json({
      success: true,
      response: content,
      reply: content,
      model_used: data.model || effectiveModel,
      type: action || "chat",
      action_type: action || "chat"
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}