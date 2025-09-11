import React, { useState } from "react";

export default function LysaghtAI() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not found");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: inputMessage }],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: data.choices[0]?.message?.content || "No response",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#7c3aed", marginBottom: "20px" }}>Lysaght AI - Simple Test</h1>
      
      <div style={{ marginBottom: "20px", minHeight: "400px", border: "1px solid #ccc", padding: "10px", borderRadius: "8px" }}>
        {messages.length === 0 ? (
          <p style={{ color: "#666" }}>Start a conversation...</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: "10px", padding: "10px", backgroundColor: msg.type === "user" ? "#f0f0f0" : "#e8f4fd", borderRadius: "8px" }}>
              <strong>{msg.type === "user" ? "You" : "AI"}:</strong> {msg.content}
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ color: "#666" }}>AI is thinking...</div>
        )}
      </div>

      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          style={{ padding: "10px 20px", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
