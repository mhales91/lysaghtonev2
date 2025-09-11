import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { AIAssistant, ChatConversation, User } from '@/api/entitiesDirect';
// Remove problematic imports that cause 'rt' error on Vercel
import { 
  openaiAdvanced as realOpenaiAdvanced, 
  openaiChat as realOpenaiChat, 
  chatWithRetrieval as realChatWithRetrieval, 
  chatStandard as realChatStandard 
} from '@/api/aiFunctionsMinimal';
// import { UploadFile } from '@/api/integrations';
import { Bot, Send, User as UserIcon, Sparkles, MessageCircle, Trash2, Paperclip, X, BookText, Edit2, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import PromptLibrary from '../components/ai/PromptLibrary';

export const ALLOWED_MODELS = [
  'gpt-5',
  'gpt-5-chat-latest',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4o',
  'gpt-4o-mini'
];

export function normalizeModel(m) {
  const x = String(m || '').trim().toLowerCase();
  const alias = {
    'gpt5': 'gpt-5',
    'gpt-5.0': 'gpt-5',
    'gpt-5-turbo': 'gpt-5',
    'gpt-4-turbo': 'gpt-4o',
    'gpt-3.5-turbo': 'gpt-4o-mini'
  };
  const resolved = alias[x] || x;
  return ALLOWED_MODELS.includes(resolved) ? resolved : 'gpt-4o';
}

const GENERAL_CHAT_ASSISTANT = {
  id: 'general-chat',
  name: 'Lysaght AI',
  description: 'Ask me anything, generate images, or perform deep research.',
  system_prompt: 'You are a helpful general-purpose AI assistant.',
  isGeneral: true
};

function ChatMessage({ message, assistantName }) {
  const isUser = message.type === 'user';
  const bgColor = isUser ? 'bg-gray-100' : 'bg-white';
  const alignment = isUser ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex gap-4 ${alignment}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-purple-100 text-purple-600">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className="max-w-3xl">
        <div className="font-semibold mb-1">{isUser ? 'You' : assistantName}</div>
        <div className={`p-4 rounded-xl ${bgColor} ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}`}>
          {/* Safely extract text content for ReactMarkdown */}
          {(() => {
            // message may be a string, or an object { text, raw }
            const md =
              typeof message.content === "string"
                ? message.content
                : typeof message.content?.text === "string"
                  ? message.content.text
                  : typeof message.content?.content === "string"
                    ? message.content.content
                    : "";

            // Last-resort fallback to avoid react-markdown crash
            const safe = (md && typeof md === "string") ? md : "*(no content)*";

            return <ReactMarkdown className="whitespace-pre-wrap">{safe}</ReactMarkdown>;
          })()}

          {message.files && message.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-black/5 rounded">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {message.image_url && (
            <div className="mt-3">
              <img src={message.image_url} alt="Generated" className="max-w-md h-auto rounded-lg border" />
            </div>
          )}

          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              Tools Used: {message.tool_calls.map((tool, idx) => (tool && tool.function && tool.function.name) ? tool.function.name : `tool_${idx}`).join(', ')}
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-gray-300 text-gray-600">
            <UserIcon className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export default function LysaghtAI() {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(GENERAL_CHAT_ASSISTANT);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [actionType, setActionType] = useState('chat');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [lastModelId, setLastModelId] = useState(null);

  const scrollAreaRef = useRef(null);
  const { toast } = useToast();

  const availableModels = ALLOWED_MODELS;

  useEffect(() => {
    (async () => {
      setIsLoadingAssistants(true);
      try {
        const [user, assistantData] = await Promise.all([
          User.me(),
          AIAssistant.filter({ is_active: true })
        ]);
        setCurrentUser(user);
        setAssistants([GENERAL_CHAT_ASSISTANT, ...assistantData.filter(a => a.name !== 'General ChatGPT')]);
      } catch (err) {
        toast({ title: 'Error', description: `Failed to load initial data: ${err.message}`, variant: 'destructive' });
      }
      setIsLoadingAssistants(false);
    })();
  }, [toast]);

  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      try {
        const assistantIdFilter = selectedAssistant.isGeneral ? { assistant_id: null } : { assistant_id: selectedAssistant.id };
        const convos = await ChatConversation.filter(
          { created_by: currentUser.email, ...assistantIdFilter },
          '-last_message_at'
        );
        setConversations(convos);
      } catch (err) {
        toast({ title: 'Error', description: `Failed to load conversations: ${err.message}`, variant: 'destructive' });
      }
    })();
  }, [currentUser, selectedAssistant, toast]);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    try {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    } catch (e) {}
  }, [messages]);

  function generateConversationTitle(firstMessage) {
    const words = String(firstMessage || '').split(' ').slice(0, 6).join(' ');
    return words.length > 30 ? words.slice(0, 30) + '...' : (words || 'New chat');
  }

  function startNewConversation() {
    setSelectedAssistant(GENERAL_CHAT_ASSISTANT);
    setCurrentConversation(null);
    setMessages([]);
    setUploadedFiles([]);
    setActionType('chat');
    setSelectedModel('gpt-4o');
    setLastModelId(null);
  }

  function loadConversation(conversation) {
    const assistant = assistants.find(a => a.id === conversation.assistant_id) || GENERAL_CHAT_ASSISTANT;
    setSelectedAssistant(assistant);
    setCurrentConversation(conversation);
    setMessages(conversation.messages || []);
    setLastModelId(null);
  }

  async function deleteConversation(conversationId) {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await ChatConversation.delete(conversationId);
      if (currentConversation && currentConversation.id === conversationId) startNewConversation();
      const assistantIdFilter = selectedAssistant.isGeneral ? { assistant_id: null } : { assistant_id: selectedAssistant.id };
      const convos = await ChatConversation.filter({ created_by: currentUser.email, ...assistantIdFilter }, '-last_message_at');
      setConversations(convos);
      toast({ title: 'Conversation Deleted', description: 'The conversation has been successfully deleted.' });
    } catch (err) {
      toast({ title: 'Error', description: `Failed to delete conversation: ${err.message}`, variant: 'destructive' });
    }
  }

  async function handleFileUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploadingFiles(true);
    const added = [];
    try {
      for (const file of files) {
        const res = await UploadFile({ file });
        added.push({
          id: Date.now() + Math.random(),
          name: file.name,
          url: res.file_url,
          size: file.size,
          type: file.type
        });
      }
      setUploadedFiles(prev => [...prev, ...added]);
      toast({ title: 'File Uploaded', description: `${added.length} file(s) uploaded successfully.` });
    } catch (err) {
      toast({ title: 'Error', description: `Failed to upload one or more files: ${err.message}`, variant: 'destructive' });
    }
    setIsUploadingFiles(false);
    event.target.value = '';
  }

  function removeFile(fileId) {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast({ title: 'File Removed', description: 'File successfully removed from pending uploads.' });
  }

  async function handleSendMessage(e) {
    console.log('handleSendMessage called');
    try {
      e.preventDefault();
      if (!inputMessage.trim() || !selectedAssistant) return;

      const userMessage = {
        id: String(Date.now()),
        type: 'user',
        content: inputMessage,
        timestamp: new Date().toISOString(),
        files: uploadedFiles.length ? [...uploadedFiles] : undefined
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInputMessage('');
      const currentFiles = [...uploadedFiles];
      setUploadedFiles([]);
      setIsLoading(true);

      try {
        // await AIAssistant.update(selectedAssistant.id, { usage_count: (selectedAssistant.usage_count || 0) + 1 });

        const fileUrls = currentFiles.map(f => f.url);
        let responseData;

        if (selectedAssistant.isGeneral) {
          const effectiveModel = normalizeModel(selectedModel);
          const hint = (selectedAssistant.system_prompt || '') +
            `\n\n[Meta instruction: The active OpenAI model id for this chat is "${effectiveModel}". If the user asks what model you are, answer exactly "${effectiveModel}".]`;

          const apiResponse = {
            success: true,
            response: 'Test response - AI functions temporarily disabled for debugging',
            reply: 'Test response - AI functions temporarily disabled for debugging',
            model_used: 'test-model'
          };
          responseData = apiResponse;
        } else {
          const safeAssistant = {
            ...selectedAssistant,
            model: normalizeModel(selectedAssistant.model || 'gpt-4o')
          };

          const useRetrieval =
            !!safeAssistant.file_search_enabled &&
            typeof safeAssistant.vector_store_id === 'string' &&
            safeAssistant.vector_store_id.startsWith('vs_');

          let apiResponse;
          if (useRetrieval) {
            apiResponse = await realChatWithRetrieval({
              message: userMessage.content,
              history: messages,
              assistantConfig: {
                model: safeAssistant.model,
                system_prompt: safeAssistant.system_prompt || '',
                vector_store_id: safeAssistant.vector_store_id
              },
              fileUrls: fileUrls.length ? fileUrls : undefined
            });
          } else {
            apiResponse = await realChatStandard({
              message: userMessage.content,
              history: messages,
              assistantConfig: safeAssistant,
              fileUrls: fileUrls.length ? fileUrls : undefined
            });
          }
          responseData = apiResponse;
        }

        if (!responseData || !responseData.success) {
          const details = responseData && responseData.details ? ` Details: ${JSON.stringify(responseData.details)}` : '';
          throw new Error((responseData && responseData.error) ? responseData.error + details : 'Failed to get AI response');
        }

        const used = responseData.model_used ||
          (selectedAssistant.isGeneral ? normalizeModel(selectedModel) : normalizeModel(selectedAssistant.model || 'gpt-4o'));

        const aiMessage = {
          id: String(Date.now() + 1),
          type: 'assistant',
          content: responseData.reply || responseData.response,
          timestamp: new Date().toISOString(),
          model_used: used,
          usage: responseData.usage,
          action_type: responseData.type,
          image_url: responseData.image_url,
          tool_calls: responseData.tool_calls || []
        };

        setLastModelId(used);

        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);

        const conversationData = {
          created_by: (currentUser && currentUser.email) ? currentUser.email : '',
          assistant_id: selectedAssistant.isGeneral ? null : selectedAssistant.id,
          messages: finalMessages,
          last_message_at: new Date().toISOString(),
          message_count: finalMessages.length
        };

        // if (currentConversation) {
        //   await ChatConversation.update(currentConversation.id, conversationData);
        // } else {
        //   const conversationTitle = generateConversationTitle(userMessage.content);
        //   const newConversation = await ChatConversation.create({ ...conversationData, title: conversationTitle });
        //   setCurrentConversation(newConversation);
        //   const assistantIdFilter = selectedAssistant.isGeneral ? { assistant_id: null } : { assistant_id: selectedAssistant.id };
        //   const convos = await ChatConversation.filter({ created_by: currentUser.email, ...assistantIdFilter }, '-last_message_at');
        //   setConversations(convos);
        // }
      } catch (err) {
        console.error('Error in handleSendMessage:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
          cause: err.cause,
          // Add more debugging info
          errorString: err.toString(),
          constructor: err.constructor.name
        });
        const errorMessage = {
          id: String(Date.now() + 1),
          type: 'error',
          content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
        toast({ title: 'Error', description: `Failed to get response from AI: ${err.message}`, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error in handleSendMessage:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        cause: err.cause,
        // Add more debugging info
        errorString: err.toString(),
        constructor: err.constructor.name
      });
      const errorMessage = {
        id: String(Date.now() + 1),
        type: 'error',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: 'Error', description: `Failed to get response from AI: ${err.message}`, variant: 'destructive' });
    }
  }

  function handleAssistantChange(assistantId) {
    const assistant = assistants.find(a => a.id === assistantId);
    if (!assistant) return;

    setSelectedAssistant(assistant);
    setCurrentConversation(null);
    setMessages([]);
    setUploadedFiles([]);
    setActionType('chat');
    setLastModelId(null);

    if (assistant.isGeneral) {
      setSelectedModel('gpt-4o');
    } else {
      setSelectedModel(normalizeModel(assistant.model || 'gpt-4o'));
    }
  }

  function handleSelectPrompt(text) {
    setInputMessage(text);
    setShowPromptLibrary(false);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <div className="w-72 bg-[#F9F9F9] flex flex-col border-r border-gray-200">
        <div className="p-4 flex flex-col h-full">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h1 className="text-lg font-bold">Lysaght AI</h1>
              </div>
            </div>
            <Button
              onClick={startNewConversation}
              className="w-full justify-start bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-sm"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPromptLibrary(true)}
              className="w-full justify-start mt-2"
            >
              <BookText className="w-4 h-4 mr-2" />
              Prompt Library
            </Button>
          </div>

          <div className="mt-6 flex-shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-2 mb-2">GPTs</h3>
            <div className="space-y-1">
              {isLoadingAssistants ? (
                <div className="flex items-center p-2 text-sm text-gray-500">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Loading GPTs...
                </div>
              ) : (
                assistants.map(assistant => (
                  <button
                    key={assistant.id}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${selectedAssistant && selectedAssistant.id === assistant.id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    onClick={() => handleAssistantChange(assistant.id)}
                  >
                    <div className="flex items-center gap-2">
                      {assistant.isGeneral ? (
                        <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      ) : (
                        <Bot className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{assistant.name}</div>
                        {!assistant.isGeneral && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assistant.web_search_enabled && <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Web</span>}
                            {assistant.file_search_enabled && <span className="text-xs bg-green-100 text-green-600 px-1 rounded">Files</span>}
                            {assistant.code_interpreter_enabled && <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">Code</span>}
                            {assistant.image_generation_enabled && <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Images</span>}
                            {assistant.custom_functions && assistant.custom_functions.length > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">Functions</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto space-y-1 pr-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-2 mb-2">Chats</h3>
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${currentConversation && currentConversation.id === conversation.id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                onClick={() => loadConversation(conversation)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm truncate">{conversation.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedAssistant.isGeneral ? (
              <React.Fragment>
                <h3 className="font-semibold text-lg">{selectedAssistant.name}</h3>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </React.Fragment>
            ) : (
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold">{selectedAssistant.name}</h3>
                  <p className="text-sm text-gray-500">{normalizeModel(selectedAssistant.model || 'gpt-4o')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastModelId && <Badge variant="outline" className="text-xs">model: {lastModelId}</Badge>}
            {!selectedAssistant.isGeneral && (
              <React.Fragment>
                {selectedAssistant.web_search_enabled && <Badge variant="outline" className="text-xs">Web Search</Badge>}
                {selectedAssistant.file_search_enabled && <Badge variant="outline" className="text-xs">Knowledge Base</Badge>}
                {selectedAssistant.code_interpreter_enabled && <Badge variant="outline" className="text-xs">Code Analysis</Badge>}
                {selectedAssistant.image_generation_enabled && <Badge variant="outline" className="text-xs">Image Generation</Badge>}
                {selectedAssistant.custom_functions && selectedAssistant.custom_functions.length > 0 && (
                  <Badge variant="outline" className="text-xs">{selectedAssistant.custom_functions.length} Functions</Badge>
                )}
              </React.Fragment>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-gray-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-2xl font-medium">What can I help with?</h3>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map(m => (
                  <ChatMessage key={m.id} message={m} assistantName={selectedAssistant.name} />
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-3xl">
                      <div className="font-semibold mb-1">{selectedAssistant.name}</div>
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {actionType === 'generate_image' ? 'Generating image...' :
                             actionType === 'deep_research' ? 'Researching...' : 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-white p-4 w-full max-w-4xl mx-auto">
          {selectedAssistant.isGeneral && (
            <div className="flex justify-center gap-2 mb-2">
              <Button size="sm" variant={actionType === 'chat' ? 'secondary' : 'ghost'} onClick={() => setActionType('chat')}>💬 Chat</Button>
              <Button size="sm" variant={actionType === 'generate_image' ? 'secondary' : 'ghost'} onClick={() => setActionType('generate_image')}>🎨 Generate Image</Button>
              <Button size="sm" variant={actionType === 'deep_research' ? 'secondary' : 'ghost'} onClick={() => setActionType('deep_research')}>🔍 Deep Research</Button>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                  <button onClick={() => removeFile(file.id)} className="text-gray-500 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedAssistant
                  ? (actionType === 'generate_image'
                      ? 'Describe the image you want to generate...'
                      : (actionType === 'deep_research'
                          ? 'What topic would you like me to research?'
                          : 'Ask anything...'))
                  : 'Select a GPT first...'
              }
              disabled={!selectedAssistant || isLoading}
              className="w-full p-4 pr-24 rounded-2xl border-gray-300 focus:ring-purple-500 focus:border-purple-500 shadow-sm resize-none"
              rows={1}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
              />
              <label htmlFor="file-upload" className="cursor-pointer p-2 rounded-full text-gray-500 hover:bg-gray-100">
                {isUploadingFiles ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </label>
              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || !selectedAssistant || isLoading}
                className="rounded-full bg-purple-600 hover:bg-purple-700 w-9 h-9"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showPromptLibrary && (
        <PromptLibrary
          currentUser={currentUser}
          onClose={() => setShowPromptLibrary(false)}
          onSelectPrompt={handleSelectPrompt}
        />
      )}
    </div>
  );
}
