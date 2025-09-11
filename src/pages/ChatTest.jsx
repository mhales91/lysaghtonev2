import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User as UserIcon, Search, MessageCircle, Sparkles, Zap, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Simple API call function
async function callChatAPI(params) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return await response.json();
}

export default function ChatTest() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState("chat");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await callChatAPI({
        action: actionType,
        prompt: inputMessage,
        model: selectedModel,
        systemPrompt: actionType === "deep_research" 
          ? "You are a comprehensive research assistant. Conduct thorough, detailed research and provide in-depth analysis."
          : "You are a helpful AI assistant. Be concise and helpful.",
        history: messages,
      });

      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: "assistant",
          content: response.reply || response.response,
          timestamp: new Date().toISOString(),
          model_used: response.model_used,
          action_type: response.action_type,
          original_model_requested: response.original_model_requested,
        };

        setMessages([...newMessages, aiMessage]);
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ backgroundColor: 'var(--lysaght-background)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--lysaght-primary)' }}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--lysaght-text)' }}>
                AI Chat Test
              </h1>
              <p className="text-sm" style={{ color: 'var(--lysaght-text-light)' }}>
                Test OpenAI models and deep research capabilities
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Mode</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={actionType === "chat" ? "default" : "outline"}
                    onClick={() => setActionType("chat")}
                    className="flex items-center gap-1 flex-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                  <Button
                    size="sm"
                    variant={actionType === "deep_research" ? "default" : "outline"}
                    onClick={() => setActionType("deep_research")}
                    className="flex items-center gap-1 flex-1"
                  >
                    <Search className="w-4 h-4" />
                    Research
                  </Button>
                </div>
              </div>
              
              {/* Model Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="o3-deep-research">O3 Deep Research</SelectItem>
                    <SelectItem value="o3-deep-research-2025-06-26">O3 Deep Research (2025-06-26)</SelectItem>
                    <SelectItem value="o4-mini-deep-research">O4 Mini Deep Research</SelectItem>
                    <SelectItem value="o4-mini-deep-research-2025-06-26">O4 Mini Deep Research (2025-06-26)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Chat */}
              <Button
                variant="outline"
                onClick={() => setMessages([])}
                className="w-full"
                disabled={messages.length === 0}
              >
                Clear Chat
              </Button>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-3 min-h-[70vh] max-h-[80vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0" style={{ borderColor: 'var(--lysaght-border)' }}>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" style={{ color: 'var(--lysaght-primary)' }} />
                {actionType === "deep_research" ? "Deep Research Assistant" : "AI Assistant"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(80vh - 200px)' }}>
                {messages.length === 0 ? (
                  <div className="text-center mt-8" style={{ color: 'var(--lysaght-text-light)' }}>
                    <Bot className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--lysaght-border)' }} />
                    <p className="text-lg font-medium mb-2">Start a conversation with the AI</p>
                    <p className="text-sm">
                      {actionType === "deep_research" 
                        ? "Ask me to research any topic in depth" 
                        : "Ask me anything or start a conversation"}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.type !== "user" && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--lysaght-primary)' }}
                        >
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-4 rounded-xl ${
                          message.type === "user"
                            ? "text-white"
                            : message.type === "error"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : message.action_type === "deep_research"
                            ? "bg-purple-50 text-purple-900 border border-purple-200"
                            : "bg-gray-50 text-gray-800"
                        }`}
                        style={message.type === "user" ? { backgroundColor: 'var(--lysaght-primary)' } : {}}
                      >
                        {message.type === "user" ? (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none break-words">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                        {message.action_type === "deep_research" && (
                          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-purple-200">
                            <Search className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Deep Research Response</span>
                          </div>
                        )}
                        {message.model_used && (
                          <div className="text-xs mt-2 pt-2 border-t" style={{ color: 'var(--lysaght-text-light)' }}>
                            <p>Model: {message.model_used}</p>
                          </div>
                        )}
                      </div>
                      {message.type === "user" && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--lysaght-border)' }}
                        >
                          <UserIcon className="w-5 h-5" style={{ color: 'var(--lysaght-text-light)' }} />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--lysaght-primary)' }}
                    >
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm" style={{ color: 'var(--lysaght-text-light)' }}>
                          {actionType === "deep_research" ? "Conducting research..." : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4" style={{ borderColor: 'var(--lysaght-border)' }}>
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={actionType === "deep_research" 
                    ? "What topic would you like me to research in depth?" 
                    : "Type your message here..."}
                    disabled={isLoading}
                    className="flex-1 min-h-[60px] resize-none"
                    rows={2}
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-6"
                    style={{ backgroundColor: 'var(--lysaght-primary)' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
