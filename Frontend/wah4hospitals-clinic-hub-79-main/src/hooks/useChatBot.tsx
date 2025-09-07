
import { useState, useRef, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  quickActions?: Array<{
    label: string;
    action: string;
    icon: React.ReactNode;
  }>;
}

export const useChatBot = (currentModule: string = 'dashboard') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [smartMode, setSmartMode] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { currentRole } = useRole();
  const { toast } = useToast();

  // Enhanced module contexts
  const moduleContexts = {
    dashboard: {
      name: 'Dashboard',
      features: ['view metrics', 'check notifications', 'see recent activities'],
      commonQuestions: ['How do I view patient statistics?', 'Where can I find recent alerts?'],
      quickActions: [
        { label: 'Quick Search', action: 'search', icon: '🔍' },
        { label: 'View Reports', action: 'reports', icon: '📊' },
      ]
    },
    patients: {
      name: 'Patient Management',
      features: ['register new patients', 'search patient records', 'view patient details'],
      commonQuestions: ['How do I register a new patient?', 'How to search for existing patients?'],
      quickActions: [
        { label: 'Add Patient', action: 'add-patient', icon: '👤' },
        { label: 'Search Records', action: 'search-patients', icon: '🔍' },
      ]
    },
    // Add more modules as needed
  };

  const getCurrentContext = () => {
    return moduleContexts[currentModule as keyof typeof moduleContexts] || moduleContexts.dashboard;
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Could not capture voice input. Please try again.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);

  const generateSmartResponse = (userMessage: string) => {
    const context = getCurrentContext();
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return {
        message: `I can help you with ${context.name}! Available features: ${context.features.join(', ')}.`,
        suggestions: context.commonQuestions,
        quickActions: context.quickActions
      };
    }

    // Always return the same structure with all properties
    return {
      message: `I'm here to assist you with ${context.name}. What would you like to know?`,
      suggestions: ['Show me shortcuts', 'Quick tutorial', 'Help me navigate'],
      quickActions: context.quickActions
    };
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      'search': 'Opening smart search...',
      'add-patient': 'Opening patient registration...',
      'reports': 'Loading reports...'
    };

    const message = actionMessages[action] || `Executing ${action}...`;
    
    const quickActionMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, quickActionMessage]);
    
    toast({
      title: "Action Executed",
      description: `Quick action "${action}" has been triggered.`,
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = smartMode 
        ? generateSmartResponse(inputValue)
        : { 
            message: "I received your message. How can I help you further?",
            suggestions: ['Show me shortcuts', 'Quick tutorial', 'Help me navigate'],
            quickActions: getCurrentContext().quickActions
          };
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botResponse.message,
        timestamp: new Date(),
        suggestions: botResponse.suggestions,
        quickActions: botResponse.quickActions
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Text-to-speech
      if (voiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(botResponse.message);
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const initializeChat = () => {
    if (messages.length === 0) {
      const context = getCurrentContext();
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'bot',
        message: `Hello! I'm your AI assistant for ${context.name}. How can I help you today?`,
        timestamp: new Date(),
        suggestions: ['Show me around', 'What can you do?', 'Help me get started'],
        quickActions: context.quickActions
      };
      setMessages([welcomeMessage]);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    isListening,
    voiceEnabled,
    setVoiceEnabled,
    smartMode,
    setSmartMode,
    handleSendMessage,
    handleSuggestionClick,
    handleVoiceInput,
    handleQuickAction,
    initializeChat
  };
};
