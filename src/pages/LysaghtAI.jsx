import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIAssistant, ChatConversation, User } from '@/api/entities';
import { useUser } from '@/contexts/UserContext';
import { openaiAdvanced, openaiChat } from '@/api/functions';
import { chatWithRetrieval } from '@/api/functions/chatWithRetrieval';
import { chatStandard } from '@/api/functions/chatStandard';
import { 
  openaiAdvanced as realOpenaiAdvanced, 
  openaiChat as realOpenaiChat, 
  chatWithRetrieval as realChatWithRetrieval, 
  chatStandard as realChatStandard 
} from '@/api/openaiFunctions';

// Helper function to check if model is a deep research model
function isDeepResearchModel(model) {
  const m = String(model || '').trim().toLowerCase();
  return m.includes('deep-research') || m.includes('o3-deep-research') || m.includes('o4-mini-deep-research');
}
import { UploadFile } from '@/api/integrations';
import { Bot, Send, User as UserIcon, Sparkles, MessageCircle, Trash2, Paperclip, X, BookText, Edit2, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import PromptLibrary from '../components/ai/PromptLibrary';

import { ALLOWED_MODELS, normalizeModel } from '@/constants/models';

const GENERAL_CHAT_ASSISTANT = {
  id: 'general-chat',
  name: 'Lysaght AI',
  description: 'Ask me anything, generate images, or perform deep research.',
  system_prompt: 'You are a helpful general-purpose AI assistant.',
  isGeneral: true
};

function ChatMessage({ message, assistantName, handleImageAction }) {
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
        <div className="font-semibold mb-1 flex items-center gap-2">
          {isUser ? 'You' : assistantName}
          {message.type === 'assistant' && message.action_type === 'deep_research' && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              🔍 Deep Research
            </Badge>
          )}
        </div>
        <div className={`p-4 rounded-xl ${bgColor} ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}`}>
          <div className="whitespace-pre-wrap">
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

              return <ReactMarkdown>{safe}</ReactMarkdown>;
            })()}
          </div>

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

          {(message.image_url || (message.image_urls && message.image_urls.length > 0)) && (
            <div className="mt-3">
              {/* Display multiple images if available, otherwise single image */}
              {(message.image_urls && message.image_urls.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {message.image_urls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img src={imageUrl} alt={`Generated ${index + 1}`} className="w-full h-auto rounded-lg border" />
                      {/* Only show action buttons for base64 images (data URLs) */}
                      {imageUrl.startsWith('data:') && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex gap-1">
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleImageAction("variations", imageUrl)} title="Create Variations">
                              <Sparkles className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleImageAction("edit", imageUrl)} title="Edit Image">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleImageAction("download", imageUrl)} title="Download Image">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative group">
                  <img src={message.image_url} alt="Generated" className="max-w-md h-auto rounded-lg border" />
                  {/* Only show action buttons for base64 images (data URLs) */}
                  {message.image_url.startsWith('data:') && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleImageAction("variations", message.image_url)} title="Create Variations">
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleImageAction("edit", message.image_url)} title="Edit Image">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleImageAction("download", message.image_url)} title="Download Image">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action buttons for the first image (or single image) - only for base64 images */}
              {(message.image_urls?.[0]?.startsWith('data:') || message.image_url?.startsWith('data:')) && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleImageAction("variations", message.image_urls?.[0] || message.image_url)}>
                    <Sparkles className="h-4 w-4 mr-1" /> Create Variations
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleImageAction("edit", message.image_urls?.[0] || message.image_url)}>
                    <Edit2 className="h-4 w-4 mr-1" /> Edit Image
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleImageAction("download", message.image_urls?.[0] || message.image_url)}>
                    <Paperclip className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              )}
            </div>
          )}

          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              Tools Used: {message.tool_calls.map((tool, idx) => (tool && tool.function && tool.function.name) ? tool.function.name : `tool_${idx}`).join(', ')}
            </div>
          )}

          {message.action_type === 'deep_research' && (
            <div className="mt-3 text-xs text-gray-500 border-t pt-2">
              <div className="flex items-center gap-4">
                <div><strong>Model:</strong> {message.model_used}</div>
                {message.research_depth && (
                  <div><strong>Research Depth:</strong> {message.research_depth}</div>
                )}
                {message.token_usage && (
                  <div><strong>Tokens:</strong> {message.token_usage.total_tokens || 'N/A'}</div>
                )}
                {message.endpoint_used && (
                  <div><strong>Endpoint:</strong> {message.endpoint_used}</div>
                )}
              </div>
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
  const { currentUser } = useUser();
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(GENERAL_CHAT_ASSISTANT);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [actionType, setActionType] = useState('chat');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageQuality, setImageQuality] = useState('high');
  const [imageCount, setImageCount] = useState(1);
  const [originalImageFiles, setOriginalImageFiles] = useState(new Map());
  const [lastModelId, setLastModelId] = useState(null);
  
  // New state for qualifying questions and progress tracking
  const [qualifyingQuestions, setQualifyingQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isAskingQuestions, setIsAskingQuestions] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchStatus, setResearchStatus] = useState('');
  const [isResearchActive, setIsResearchActive] = useState(false);

  const scrollAreaRef = useRef(null);
  const { toast } = useToast();

  const availableModels = ALLOWED_MODELS;

  useEffect(() => {
    (async () => {
      if (!currentUser) {
        console.log('LysaghtAI: No current user, skipping initialization');
        return;
      }

      setIsLoadingAssistants(true);
      try {
        console.log('LysaghtAI: Loading data for user:', currentUser.email);
        
        // Try to load AI assistants, but handle the case where the table doesn't exist or has RLS issues
        try {
          const assistantData = await AIAssistant.filter({ is_active: true });
          setAssistants([GENERAL_CHAT_ASSISTANT, ...assistantData.filter(a => a.name !== 'General ChatGPT')]);
          console.log('LysaghtAI: Loaded assistants successfully:', assistantData.length);
        } catch (assistantError) {
          console.warn('LysaghtAI: Could not load AI assistants, using default only:', assistantError.message);
          // If AI assistants fail to load, just use the general chat assistant
          setAssistants([GENERAL_CHAT_ASSISTANT]);
          
          // Show a less intrusive warning instead of an error toast
          if (assistantError.message.includes('role') && assistantError.message.includes('does not exist')) {
            console.warn('LysaghtAI: AI Assistant table may not be set up properly. Using general chat only.');
          }
        }
        
        // Always use database for conversations
        const assistantIdFilter = selectedAssistant.isGeneral ? {} : { ai_assistant_id: selectedAssistant.id };
        const filterParams = { user_id: currentUser.id, ...assistantIdFilter };
        const convos = await ChatConversation.filter(filterParams, '-created_at');
        setConversations(convos);
      } catch (err) {
        console.error('LysaghtAI: Error loading initial data:', err);
        // Only show error toast for critical errors, not for missing AI assistants
        if (!err.message.includes('role') || !err.message.includes('does not exist')) {
          toast({ title: 'Error', description: `Failed to load initial data: ${err.message}`, variant: 'destructive' });
        }
      }
      setIsLoadingAssistants(false);
    })();
  }, [currentUser, toast, selectedAssistant]);

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

  // Generate qualifying questions for deep research using OpenAI
  const generateQualifyingQuestions = useCallback(async (topic) => {
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        // Use real OpenAI to generate relevant questions
        const prompt = `Generate 4-6 qualifying questions to better understand this research request: "${topic}"

Return ONLY a JSON array of question objects with this exact structure:
[
  {
    "id": "unique_id",
    "question": "Clear, specific question",
    "type": "select" or "text",
    "options": ["Option1", "Option2", "Option3"] (only for select type),
    "required": true or false
  }
]

Make questions relevant to the topic and helpful for comprehensive research. Mix select and text questions. Keep questions concise and actionable.`;

        const response = await realOpenaiAdvanced({
          prompt: prompt,
          model: 'gpt-4o',
          action: 'chat',
          systemPrompt: 'You are a research assistant. Generate relevant qualifying questions in valid JSON format only.',
          history: []
        });

        if (response.success && response.reply) {
          try {
            // Extract JSON from response
            const jsonMatch = response.reply.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const questions = JSON.parse(jsonMatch[0]);
              return questions;
            }
          } catch (parseError) {
            console.error('Failed to parse OpenAI response:', parseError);
          }
        }
      }
      
      // Fallback to generic questions if OpenAI fails
      return [
        {
          id: 'scope',
          question: 'What specific aspect would you like me to focus on?',
          type: 'text',
          placeholder: 'e.g., current trends, historical data, specific regions, etc.',
          required: false
        },
        {
          id: 'depth',
          question: 'How detailed should the research be?',
          type: 'select',
          options: ['High-level overview', 'Detailed analysis', 'Comprehensive deep-dive', 'Specific data points'],
          required: true
        },
        {
          id: 'timeframe',
          question: 'What time period are you interested in?',
          type: 'text',
          placeholder: 'e.g., last 5 years, 2024, historical trends',
          required: false
        },
        {
          id: 'specific_requirements',
          question: 'Any specific requirements or focus areas?',
          type: 'text',
          placeholder: 'e.g., particular regions, companies, technologies, etc.',
          required: false
        }
      ];
    } catch (error) {
      console.error('Error generating qualifying questions:', error);
      // Return fallback questions
      return [
        {
          id: 'scope',
          question: 'What specific aspect would you like me to focus on?',
          type: 'text',
          placeholder: 'e.g., current trends, historical data, specific regions, etc.',
          required: false
        },
        {
          id: 'depth',
          question: 'How detailed should the research be?',
          type: 'select',
          options: ['High-level overview', 'Detailed analysis', 'Comprehensive deep-dive', 'Specific data points'],
          required: true
        }
      ];
    }
  }, []);

  function startNewConversation() {
    setSelectedAssistant(GENERAL_CHAT_ASSISTANT);
    setCurrentConversation(null);
    setMessages([]);
    setUploadedFiles([]);
    setActionType('chat');
    setSelectedModel('gpt-4o');
    setLastModelId(null);
    setIsAskingQuestions(false);
    setQualifyingQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsResearchActive(false);
    setResearchProgress(0);
    setResearchStatus('');
  }

  function loadConversation(conversation) {
    try {
      console.log('Loading conversation:', conversation);
      
      if (!conversation || !conversation.id) {
        console.error('Invalid conversation provided:', conversation);
        toast({ title: 'Error', description: 'Invalid conversation', variant: 'destructive' });
        return;
      }
      
      const assistant = assistants.find(a => a.id === conversation.ai_assistant_id) || GENERAL_CHAT_ASSISTANT;
      setSelectedAssistant(assistant);
      setCurrentConversation(conversation);
      
      // Always use database messages
      setMessages(conversation.messages || []);
      
      // Reset all research-related state
      setLastModelId(null);
      setIsAskingQuestions(false);
      setQualifyingQuestions([]);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setIsResearchActive(false);
      setResearchProgress(0);
      setResearchStatus('');
      
      console.log('Conversation loaded successfully');
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({ title: 'Error', description: 'Failed to load conversation', variant: 'destructive' });
    }
  }

  async function deleteConversation(conversationId) {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await ChatConversation.delete(conversationId);
      if (currentConversation && currentConversation.id === conversationId) startNewConversation();
      const assistantIdFilter = selectedAssistant.isGeneral ? {} : { ai_assistant_id: selectedAssistant.id };
      // For localhost, skip user_email filter since column doesn't exist
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const filterParams = isLocalhost ? assistantIdFilter : { user_email: currentUser.email, ...assistantIdFilter };
      const convos = await ChatConversation.filter(filterParams, '-last_message_at');
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
  // Handle qualifying question answers (all at once)
  const handleQuestionAnswer = useCallback((answers) => {
    // Parse answers from user input (assuming they're separated by new lines)
    const answerLines = answers.split('\n').filter(line => line.trim());
    const newAnswers = {};
    
    qualifyingQuestions.forEach((question, index) => {
      if (answerLines[index]) {
        newAnswers[question.id] = answerLines[index].trim();
      }
    });
    
    setUserAnswers(prev => ({ ...prev, ...newAnswers }));
    
    // Add user answers as a chat message
    const answerMessage = {
      id: String(Date.now()),
      type: 'user',
      content: answers,
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...messages, answerMessage];
    setMessages(updatedMessages);
    
    // Save to localStorage
    // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // if (isLocalhost && currentConversation) {
    //   saveMessagesToStorage(currentConversation.id, updatedMessages);
    // }
    
    // Start deep research with all answers
    startDeepResearch();
  }, [qualifyingQuestions]);

  // Start deep research with user answers
  const startDeepResearch = useCallback(async () => {
    // Ensure we're using a deep research model
    console.log('startDeepResearch - selectedModel:', selectedModel);
    console.log('startDeepResearch - isDeepResearchModel check:', isDeepResearchModel(selectedModel));
    if (!isDeepResearchModel(selectedModel)) {
      console.log('startDeepResearch - Setting model to o3-deep-research');
      setSelectedModel('o3-deep-research');
    }
    
    setIsAskingQuestions(false);
    setIsResearchActive(true);
    setResearchProgress(0);
    setResearchStatus('Preparing research...');
    
    // Build enhanced prompt with user answers
    let enhancedPrompt = inputMessage;
    if (Object.keys(userAnswers).length > 0) {
      enhancedPrompt += '\n\nBased on the following requirements:\n';
      Object.entries(userAnswers).forEach(([key, value]) => {
        if (value) {
          const question = qualifyingQuestions.find(q => q.id === key);
          if (question) {
            enhancedPrompt += `- ${question.question}: ${value}\n`;
          }
        }
      });
    }
    
    // Create user message with enhanced prompt
    const userMessage = {
      id: String(Date.now()),
      type: 'user',
      content: enhancedPrompt,
      timestamp: new Date().toISOString(),
      files: uploadedFiles.length ? [...uploadedFiles] : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    const currentFiles = [...uploadedFiles];
    setUploadedFiles([]);
    setIsLoading(true);
    
    // Continue with the research process, passing the correct model
    const researchModel = isDeepResearchModel(selectedModel) ? selectedModel : 'o3-deep-research';
    console.log('startDeepResearch - using researchModel:', researchModel);
    await processDeepResearch(userMessage, newMessages, currentFiles, researchModel);
  }, [inputMessage, userAnswers, qualifyingQuestions, messages, uploadedFiles, selectedModel]);

  // Process deep research with progress tracking
  const processDeepResearch = useCallback(async (userMessage, newMessages, currentFiles, researchModel = 'o3-deep-research') => {
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setResearchProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 1000);

      const statusUpdates = [
        'Analyzing your request...',
        'Gathering relevant information...',
        'Searching for current data...',
        'Compiling research findings...',
        'Preparing comprehensive report...'
      ];
      
      let statusIndex = 0;
      const statusInterval = setInterval(() => {
        if (statusIndex < statusUpdates.length - 1) {
          setResearchStatus(statusUpdates[statusIndex]);
          statusIndex++;
        }
      }, 2000);

      // Continue with existing research logic...
      await performResearch(userMessage, newMessages, currentFiles, researchModel);
      
      // Clear intervals
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      setResearchProgress(100);
      setResearchStatus('Research complete!');
      setIsResearchActive(false);
      
    } catch (error) {
      setIsResearchActive(false);
      setResearchProgress(0);
      setResearchStatus('');
      throw error;
    }
  }, []);

  // Perform the actual research (extracted from existing logic)
  const performResearch = useCallback(async (userMessage, newMessages, currentFiles, researchModel = 'o3-deep-research') => {
    try {
      if (!selectedAssistant.isGeneral) {
        await AIAssistant.update(selectedAssistant.id, { usage_count: (selectedAssistant.usage_count || 0) + 1 });
      }

      const fileUrls = currentFiles.map(f => f.url);
      let responseData;

      if (selectedAssistant.isGeneral) {
        const effectiveModel = normalizeModel(researchModel);
        const hint = (selectedAssistant.system_prompt || '') +
          `\n\n[Meta instruction: The active OpenAI model id for this chat is "${effectiveModel}". If the user asks what model you are, answer exactly "${effectiveModel}".]`;

        // For localhost, use real OpenAI functions
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let apiResponse;
        
        if (isLocalhost) {
          console.log('Using real OpenAI functions for deep research on localhost');
          console.log('Selected model for deep research:', effectiveModel);
          console.log('Action type:', actionType);
          apiResponse = await realOpenaiAdvanced({
            prompt: userMessage.content,
            model: effectiveModel,
            action: 'deep_research',
            systemPrompt: hint,
            history: newMessages.slice(0, -1), // All messages except the current user message
            fileUrls: fileUrls.length ? fileUrls : undefined,
            // Add advanced image options for image generation
            ...(actionType === 'generate_image' && {
              size: imageSize,
              quality: imageQuality,
              n: imageCount
            })
          });
        } else {
          apiResponse = await openaiAdvanced({
            prompt: userMessage.content,
            model: effectiveModel,
            action: 'deep_research',
            systemPrompt: hint,
            history: newMessages.slice(0, -1), // All messages except the current user message
            fileUrls: fileUrls.length ? fileUrls : undefined
          });
        }
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
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
          // Use real OpenAI functions for localhost
          console.log('Using real OpenAI functions for specialized assistant on localhost');
          if (useRetrieval) {
            apiResponse = await realChatWithRetrieval({
              message: userMessage.content,
              history: newMessages.slice(0, -1),
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
              history: newMessages.slice(0, -1),
              assistantConfig: safeAssistant,
              fileUrls: fileUrls.length ? fileUrls : undefined
            });
          }
        } else {
          if (useRetrieval) {
            apiResponse = await chatWithRetrieval({
              message: userMessage.content,
              history: newMessages.slice(0, -1),
              assistantConfig: {
                model: safeAssistant.model,
                system_prompt: safeAssistant.system_prompt || '',
                vector_store_id: safeAssistant.vector_store_id
              },
              fileUrls: fileUrls.length ? fileUrls : undefined
            });
          } else {
            apiResponse = await chatStandard({
              message: userMessage.content,
              history: newMessages.slice(0, -1),
              assistantConfig: safeAssistant,
              fileUrls: fileUrls.length ? fileUrls : undefined
            });
          }
        }
        responseData = apiResponse;
      }

      console.log('Processing responseData:', responseData);
      console.log('responseData.success:', responseData?.success);
      console.log('responseData.response:', responseData?.response);
      console.log('responseData.reply:', responseData?.reply);

      if (!responseData || !responseData.success) {
        const details = responseData && responseData.details ? ` Details: ${JSON.stringify(responseData.details)}` : '';
        console.error('Response validation failed:', { responseData, success: responseData?.success });
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
        image_urls: responseData.image_urls || (responseData.image_url ? [responseData.image_url] : []),
        tool_calls: responseData.tool_calls || []
      };

      console.log('Creating aiMessage:', aiMessage);
      console.log('aiMessage.content:', aiMessage.content);

      setLastModelId(used);

      const finalMessages = [...newMessages, aiMessage];
      console.log('Setting finalMessages:', finalMessages);
      console.log('Last message in finalMessages:', finalMessages[finalMessages.length - 1]);
      setMessages(finalMessages);
      
      // Save messages to localStorage immediately for localhost
      // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // if (isLocalhost && currentConversation) {
      //   saveMessagesToStorage(currentConversation.id, finalMessages);
      // }

      // Handle conversation saving (same logic as before)
      const conversationData = {
        user_id: currentUser.id,
        ...(selectedAssistant.isGeneral ? {} : { ai_assistant_id: selectedAssistant.id }), // Only include if not general
        messages: finalMessages,
        last_message_at: new Date().toISOString(),
        message_count: finalMessages.length
      };

      // Handle conversation saving
      // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (currentConversation) {
        // Update existing conversation
        const updatedConversation = {
          ...currentConversation,
          ...conversationData,
          updated_at: new Date().toISOString()
        };
        setCurrentConversation(updatedConversation);
        
        // Update conversations list
        const updatedConversations = conversations.map(conv => 
          conv.id === currentConversation.id ? updatedConversation : conv
        );
        setConversations(updatedConversations);
        
        // Save messages to localStorage
        // saveMessagesToStorage(currentConversation.id, finalMessages);
      } else {
        // Create new conversation
        const conversationTitle = generateConversationTitle(userMessage.content);
        const newConversation = await ChatConversation.create({ ...conversationData, title: conversationTitle });
        setCurrentConversation(newConversation);
        
        // Add to conversations list
        const updatedConversations = [newConversation, ...conversations];
        setConversations(updatedConversations);
        
        // Save messages to localStorage
        // saveMessagesToStorage(conversationId, finalMessages);
      }

    } catch (err) {
      const errorMessage = {
        id: String(Date.now() + 1),
        type: 'error',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      throw err;
    }
  }, [selectedAssistant, selectedModel, actionType, imageSize, imageQuality, imageCount, currentUser, conversations, currentConversation, generateConversationTitle]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedAssistant) return;

    // Check if this is a deep research request and we need qualifying questions
    if (actionType === 'deep_research' && !isAskingQuestions && qualifyingQuestions.length === 0) {
      // Set a deep research model if not already selected
      console.log('Current selectedModel before deep research:', selectedModel);
      console.log('isDeepResearchModel check:', isDeepResearchModel(selectedModel));
      if (!isDeepResearchModel(selectedModel)) {
        console.log('Setting model to o3-deep-research');
        setSelectedModel('o3-deep-research');
      }
      
      setIsLoading(true);
      try {
        const questions = await generateQualifyingQuestions(inputMessage);
        setQualifyingQuestions(questions);
        setIsAskingQuestions(true);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        
        // Skip qualifying questions for deep research - go directly to research
        console.log('Skipping qualifying questions, starting deep research directly');
        startDeepResearch();
      } catch (error) {
        console.error('Error generating questions:', error);
        toast({ title: 'Error', description: 'Failed to generate qualifying questions. Starting research directly.', variant: 'destructive' });
        // Start research directly if question generation fails
        startDeepResearch();
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If we're in the middle of asking questions, handle the answers
    if (isAskingQuestions) {
      handleQuestionAnswer(inputMessage);
      setInputMessage('');
      return;
    }

    // If deep research is active, don't process through main flow
    if (isResearchActive) {
      return;
    }

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
      if (!selectedAssistant.isGeneral) {
        await AIAssistant.update(selectedAssistant.id, { usage_count: (selectedAssistant.usage_count || 0) + 1 });
      }

      const fileUrls = currentFiles.map(f => f.url);
      let responseData;

      if (selectedAssistant.isGeneral) {
        const effectiveModel = normalizeModel(selectedModel);
        const hint = (selectedAssistant.system_prompt || '') +
          `\n\n[Meta instruction: The active OpenAI model id for this chat is "${effectiveModel}". If the user asks what model you are, answer exactly "${effectiveModel}".]`;

        // For localhost, try openaiAdvanced first, fallback to openaiChat if not available
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let apiResponse;
        
        if (isLocalhost) {
          // Use real OpenAI functions for localhost
          console.log('Using real OpenAI functions for localhost');
          console.log('Selected model:', effectiveModel);
          console.log('Action type:', actionType);
          apiResponse = await realOpenaiAdvanced({
            prompt: userMessage.content,
            model: effectiveModel,
            action: actionType,
            systemPrompt: hint,
            history: messages,
            fileUrls: fileUrls.length ? fileUrls : undefined,
            // Add advanced image options for image generation
            ...(actionType === 'generate_image' && {
              size: imageSize,
              quality: imageQuality,
              n: imageCount
            })
          });
          console.log('apiResponse from realOpenaiAdvanced:', apiResponse);
          console.log('Model used in deep research API response:', apiResponse?.model_used);
        } else {
          apiResponse = await openaiAdvanced({
            prompt: userMessage.content,
            model: effectiveModel,
            action: actionType,
            systemPrompt: hint,
            history: finalMessages.slice(0, -1), // All messages except the current user message
            fileUrls: fileUrls.length ? fileUrls : undefined
          });
        }
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
        if (isLocalhost) {
          // Use real OpenAI functions for localhost
          console.log('Using real OpenAI functions for specialized assistant on localhost');
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
        } else {
          if (useRetrieval) {
            apiResponse = await chatWithRetrieval({
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
            apiResponse = await chatStandard({
              message: userMessage.content,
              history: messages,
              assistantConfig: safeAssistant,
              fileUrls: fileUrls.length ? fileUrls : undefined
            });
          }
        }
        responseData = apiResponse;
      }

      console.log('Processing responseData:', responseData);
      console.log('responseData.success:', responseData?.success);
      console.log('responseData.response:', responseData?.response);
      console.log('responseData.reply:', responseData?.reply);

      if (!responseData || !responseData.success) {
        const details = responseData && responseData.details ? ` Details: ${JSON.stringify(responseData.details)}` : '';
        console.error('Response validation failed:', { responseData, success: responseData?.success });
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
        image_urls: responseData.image_urls || (responseData.image_url ? [responseData.image_url] : []),
        tool_calls: responseData.tool_calls || []
      };

      console.log('Creating aiMessage:', aiMessage);
      console.log('aiMessage.content:', aiMessage.content);

      setLastModelId(used);

      const finalMessages = [...newMessages, aiMessage];
      console.log('Setting finalMessages:', finalMessages);
      console.log('Last message in finalMessages:', finalMessages[finalMessages.length - 1]);
      setMessages(finalMessages);
      
      // Save messages to localStorage immediately for localhost
      // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // if (isLocalhost && currentConversation) {
      //   saveMessagesToStorage(currentConversation.id, finalMessages);
      // }

      // For localhost, skip user_email and last_message_at since columns don't exist
      const conversationData = {
        user_id: currentUser.id,
        ...(selectedAssistant.isGeneral ? {} : { ai_assistant_id: selectedAssistant.id }), // Only include if not general
        messages: finalMessages,
        last_message_at: new Date().toISOString(),
        message_count: finalMessages.length
      };

      // Handle conversation saving
      // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (currentConversation) {
        // Update existing conversation in database
        await ChatConversation.update(currentConversation.id, conversationData);
        
        // Update local state
        const updatedConversation = {
          ...currentConversation,
          ...conversationData,
          updated_at: new Date().toISOString()
        };
        setCurrentConversation(updatedConversation);
        
        // Update conversations list
        const updatedConversations = conversations.map(conv => 
          conv.id === currentConversation.id ? updatedConversation : conv
        );
        setConversations(updatedConversations);
      } else {
        // Create new conversation
        const conversationTitle = generateConversationTitle(userMessage.content);
        const newConversation = await ChatConversation.create({ ...conversationData, title: conversationTitle });
        setCurrentConversation(newConversation);
        
        // Add to conversations list
        const updatedConversations = [newConversation, ...conversations];
        setConversations(updatedConversations);
      }
    } catch (err) {
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

  // GPT-Image-1 Advanced Feature Handlers - defined right before return
  const handleDownloadImage = useCallback((imageUrl) => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started", description: "Image download has started." });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({ title: "Error", description: "Failed to download image." });
    }
  }, [toast]);

  const handleCreateVariations = useCallback(async (imageUrl) => {
    try {
      setIsLoading(true);
      toast({ title: "Creating Variations", description: "Generating image variations..." });
      
      let file;
      
      // Handle different image URL types
      if (imageUrl.startsWith('data:')) {
        // Base64 image - convert directly
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        file = new File([blob], "image.png", { type: "image/png" });
      } else {
        // External URL - use a different approach
        try {
          // Try multiple CORS proxy services
          const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
            `https://cors-anywhere.herokuapp.com/${imageUrl}`,
            `https://thingproxy.freeboard.io/fetch/${imageUrl}`
          ];
          
          let success = false;
          for (const proxyUrl of proxies) {
            try {
              const response = await fetch(proxyUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                  'Accept': 'image/*'
                }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                file = new File([blob], "image.png", { type: "image/png" });
                success = true;
                break;
              }
            } catch (proxyError) {
              console.log(`Proxy ${proxyUrl} failed:`, proxyError);
              continue;
            }
          }
          
          if (!success) {
            throw new Error('All proxies failed');
          }
        } catch (proxyError) {
          // If all proxies fail, show error message
          toast({ 
            title: "CORS Error", 
            description: "Cannot create variations from external URLs due to browser security. Please generate a new image first." 
          });
          return;
        }
      }
      
      const result = await realOpenaiAdvanced({
        action: "create_variations",
        image: file,
        n: 3,
        size: "1024x1024"
      });
      
      if (result.success) {
        toast({ title: "Variations Created", description: "Generated 3 image variations successfully!" });
        // Add variations to messages
        result.images.forEach((variationUrl, index) => {
          const variationMessage = {
            id: String(Date.now() + index),
            type: "assistant",
            content: `Image variation ${index + 1}`,
            timestamp: new Date().toISOString(),
            image_url: variationUrl,
            model_used: "gpt-image-1"
          };
          setMessages(prev => [...prev, variationMessage]);
        });
      } else {
        throw new Error(result.error || "Failed to create variations");
      }
    } catch (error) {
      console.error("Error creating variations:", error);
      toast({ title: "Error", description: "Failed to create image variations. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [toast, setIsLoading, setMessages]);

  const handleEditImage = useCallback(async (imageUrl) => {
    const editPrompt = prompt("Enter your edit instructions (e.g., \"add a hat\", \"change background to blue\"):");
    if (!editPrompt) return;
    
    try {
      setIsLoading(true);
      toast({ title: "Editing Image", description: "Applying your edits..." });
      
      let file;
      
      // Handle different image URL types
      if (imageUrl.startsWith('data:')) {
        // Base64 image - convert directly
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        file = new File([blob], "image.png", { type: "image/png" });
      } else {
        // External URL - use a different approach
        try {
          // Try multiple CORS proxy services
          const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
            `https://cors-anywhere.herokuapp.com/${imageUrl}`,
            `https://thingproxy.freeboard.io/fetch/${imageUrl}`
          ];
          
          let success = false;
          for (const proxyUrl of proxies) {
            try {
              const response = await fetch(proxyUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                  'Accept': 'image/*'
                }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                file = new File([blob], "image.png", { type: "image/png" });
                success = true;
                break;
              }
            } catch (proxyError) {
              console.log(`Proxy ${proxyUrl} failed:`, proxyError);
              continue;
            }
          }
          
          if (!success) {
            throw new Error('All proxies failed');
          }
        } catch (proxyError) {
          // If all proxies fail, show error message
          toast({ 
            title: "CORS Error", 
            description: "Cannot edit external URLs due to browser security. Please generate a new image first." 
          });
          return;
        }
      }
      
      const result = await realOpenaiAdvanced({
        action: "edit_image",
        image: file,
        prompt: editPrompt,
        size: "1024x1024"
      });
      
      if (result.success) {
        toast({ title: "Image Edited", description: "Your edits have been applied successfully!" });
        const editedMessage = {
          id: String(Date.now()),
          type: "assistant",
          content: `Edited image: ${editPrompt}`,
          timestamp: new Date().toISOString(),
          image_url: result.image_url,
          model_used: "gpt-image-1"
        };
        setMessages(prev => [...prev, editedMessage]);
      } else {
        throw new Error(result.error || "Failed to edit image");
      }
    } catch (error) {
      console.error("Error editing image:", error);
      toast({ title: "Error", description: "Failed to edit image. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [toast, setIsLoading, setMessages]);

  const handleImageAction = useCallback((action, imageUrl) => {
    console.log("handleImageAction called with:", action, imageUrl);
    switch (action) {
      case "variations":
        handleCreateVariations(imageUrl);
        break;
      case "edit":
        handleEditImage(imageUrl);
        break;
      case "download":
        handleDownloadImage(imageUrl);
        break;
      default:
        console.log("Unknown image action:", action);
    }
  }, [handleCreateVariations, handleEditImage, handleDownloadImage]);

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
            {/* Question Generation Loading */}


            {messages.length === 0 && !isAskingQuestions && !isResearchActive ? (
              <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-gray-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-2xl font-medium">What can I help with?</h3>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map(m => (
                  <ChatMessage key={m.id} message={m} assistantName={selectedAssistant.name} handleImageAction={handleImageAction} />
                ))}
                {isLoading && !isResearchActive && (
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
                             actionType === 'deep_research' ? 'Conducting comprehensive research...' : 'Thinking...'}
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

          {actionType === 'generate_image' && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Advanced Image Options</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Size</label>
                  <Select value={imageSize} onValueChange={setImageSize}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                      <SelectItem value="1024x1536">1024x1536 (Portrait)</SelectItem>
                      <SelectItem value="1536x1024">1536x1024 (Landscape)</SelectItem>
                      <SelectItem value="auto">Auto (Let AI choose)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Quality</label>
                  <Select value={imageQuality} onValueChange={setImageQuality}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-2">
                <label className="text-xs text-gray-600">Number of Images</label>
                <Select value={imageCount.toString()} onValueChange={(value) => setImageCount(parseInt(value))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image</SelectItem>
                    <SelectItem value="2">2 Images</SelectItem>
                    <SelectItem value="3">3 Images</SelectItem>
                    <SelectItem value="4">4 Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

          {/* Minimalist Research Progress Indicator */}
          {isResearchActive && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{researchStatus}</span>
                <span className="text-gray-400">•</span>
                <span>Model: {selectedModel}</span>
                <span className="text-gray-400">•</span>
                <span>{Math.round(researchProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-black h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${researchProgress}%` }}
                ></div>
              </div>
            </div>
          )}

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
