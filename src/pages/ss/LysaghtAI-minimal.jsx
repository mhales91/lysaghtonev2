import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Send, User as UserIcon, Sparkles, MessageCircle, Trash2, Paperclip, X, BookText, Edit2, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';

// Minimal AI function that doesn't use any problematic imports
const callOpenAI = async (prompt, model = 'gpt-4o') => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    success: true,
    response: data.choices[0]?.message?.content || 'No response',
    reply: data.choices[0]?.message?.content || 'No response',
    model_used: data.model || model
  };
};

export default function LysaghtAI() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const { toast } = useToast();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: String(Date.now()),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await callOpenAI(inputMessage, selectedModel);
      
      const aiMessage = {
        id: String(Date.now() + 1),
        type: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        model_used: response.model_used
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: String(Date.now() + 1),
        type: 'error',
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <h3 className="font-semibold text-lg">Lysaght AI (Minimal Version)</h3>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-44 mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-4 ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.type !== 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      <Bot className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="max-w-3xl">
                  <div className="font-semibold mb-1">{m.type === 'user' ? 'You' : 'AI'}</div>
                  <div className={`p-4 rounded-xl ${m.type === 'user' ? 'bg-gray-100' : 'bg-white'} ${m.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}`}>
                    <ReactMarkdown className="whitespace-pre-wrap">{m.content}</ReactMarkdown>
                  </div>
                </div>
                {m.type === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-300 text-gray-600">
                      <UserIcon className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-3xl">
                  <div className="font-semibold mb-1">AI</div>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-white p-4">
          <form onSubmit={handleSendMessage} className="relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="w-full p-4 pr-24 rounded-2xl border-gray-300 focus:ring-purple-500 focus:border-purple-500 shadow-sm resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-purple-600 hover:bg-purple-700 w-9 h-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
