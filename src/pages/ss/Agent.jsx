import React, { useState, useEffect, useRef } from 'react';
import { agentSDK } from '@/agents';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from '@/components/agent/MessageBubble';
import { Send, Plus, MessageSquare, Trash2, Bot, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AGENT_NAME = "lysaght_assistant";

export default function AgentPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const scrollAreaRef = useRef(null);

    // Load user and conversations on mount
    useEffect(() => {
        const initializeAgent = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
                
                // Load conversations for this agent
                const convos = await agentSDK.listConversations({ agent_name: AGENT_NAME });
                setConversations(convos || []);
                
            } catch (error) {
                console.error('Failed to initialize agent:', error);
                toast.error(`Failed to load agent: ${error.message}`);
            } finally {
                setIsInitialLoading(false);
            }
        };

        initializeAgent();
    }, []);

    // Subscribe to conversation updates
    useEffect(() => {
        if (currentConversation?.id) {
            const unsubscribe = agentSDK.subscribeToConversation(currentConversation.id, (data) => {
                if (data && data.messages) {
                    setMessages(data.messages);
                }
            });
            return () => unsubscribe();
        }
    }, [currentConversation?.id]);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
        setInput('');
    };

    const handleSelectConversation = async (conversation) => {
        try {
            setCurrentConversation(conversation);
            setMessages(conversation.messages || []);
        } catch (error) {
            toast.error(`Failed to load conversation: ${error.message}`);
        }
    };

    const handleDeleteConversation = async (e, conversationId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this conversation?")) return;
        
        try {
            await agentSDK.deleteConversation(conversationId);
            
            if (currentConversation?.id === conversationId) {
                handleNewConversation();
            }
            
            // Reload conversations
            const convos = await agentSDK.listConversations({ agent_name: AGENT_NAME });
            setConversations(convos || []);
            
            toast.success("Conversation deleted successfully");
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            toast.error(`Failed to delete conversation: ${error.message}`);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const messageText = input.trim();
        setInput('');
        setIsLoading(true);

        try {
            let conversationToUse = currentConversation;

            // Create new conversation if none exists
            if (!conversationToUse) {
                conversationToUse = await agentSDK.createConversation({
                    agent_name: AGENT_NAME,
                    metadata: {
                        name: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
                        description: 'Chat with Lysaght Assistant',
                    }
                });
                setCurrentConversation(conversationToUse);
                
                // Reload conversations list
                const convos = await agentSDK.listConversations({ agent_name: AGENT_NAME });
                setConversations(convos || []);
            }

            // Send the message
            await agentSDK.addMessage(conversationToUse, {
                role: 'user',
                content: messageText,
            });

        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error(`Failed to send message: ${error.message}`);
            setInput(messageText); // Restore input on error
        } finally {
            setIsLoading(false);
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Loading AI Assistant...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <div className="w-80 bg-gray-50 border-r flex flex-col">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <h1 className="text-lg font-semibold">AI Assistant</h1>
                        </div>
                        <Button
                            onClick={handleNewConversation}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            New
                        </Button>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                        Welcome, {currentUser?.full_name}
                    </div>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1 px-4">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">No conversations yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    onClick={() => handleSelectConversation(conversation)}
                                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                        currentConversation?.id === conversation.id 
                                            ? 'bg-purple-100 border border-purple-200' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium truncate">
                                            {conversation.metadata?.name || `Chat ${conversation.id.slice(-6)}`}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {conversation.message_count || 0} messages
                                        </p>
                                    </div>
                                    <Button
                                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                                        size="icon"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 h-6 w-6 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="border-b p-4 bg-white">
                    <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6 text-purple-600" />
                        <div>
                            <h2 className="text-lg font-semibold">Lysaght Assistant</h2>
                            <p className="text-sm text-gray-600">Ask me about your projects, clients, and tasks</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-xl font-medium text-gray-900 mb-2">How can I help you?</h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    I can help you find information about your projects, clients, tasks, and team members.
                                    Just ask me anything!
                                </p>
                                <div className="mt-6 space-y-2 text-sm text-gray-500">
                                    <p>Try asking me things like:</p>
                                    <ul className="space-y-1">
                                        <li>• "Show me all active projects"</li>
                                        <li>• "What tasks are overdue?"</li>
                                        <li>• "Tell me about client ABC Corp"</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {messages.map((message, index) => (
                                <MessageBubble key={index} message={message} />
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-3">
                                    <Bot className="w-8 h-8 text-purple-600 flex-shrink-0" />
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4 bg-white">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                        <div className="flex gap-3">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                placeholder="Ask me about your projects, clients, or tasks..."
                                disabled={isLoading}
                                className="flex-1 min-h-[60px] resize-none"
                                rows={2}
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="self-end bg-purple-600 hover:bg-purple-700"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}