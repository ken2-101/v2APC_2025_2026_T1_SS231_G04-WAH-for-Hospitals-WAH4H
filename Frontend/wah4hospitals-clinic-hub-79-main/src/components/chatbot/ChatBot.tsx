
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  Star,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useChatBot } from '@/hooks/useChatBot';
import ChatMessage from './ChatMessage';

interface ChatBotProps {
  currentModule?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ currentModule = 'dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
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
  } = useChatBot(currentModule);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 text-gray-900 rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="relative">
          <Button
            onClick={handleOpen}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </Button>
          {smartMode && (
            <Badge className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1">
              AI
            </Badge>
          )}
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`w-80 shadow-2xl transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-96'
        }`}>
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4" />
                AI Assistant
                {smartMode && <Star className="w-3 h-3 text-yellow-300" />}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <Volume2 className="w-3 h-3 opacity-50" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {!isMinimized && (
              <div className="flex justify-between items-center">
                <p className="text-xs text-blue-100">Enhanced with AI features</p>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs px-1 py-0">
                    Voice
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs px-1 py-0">
                    Smart
                  </Badge>
                </div>
              </div>
            )}
          </CardHeader>

          {/* Messages Area */}
          {!isMinimized && (
            <CardContent className="p-0 h-full flex flex-col">
              <ScrollArea className="flex-1 p-3 max-h-64">
                <div className="space-y-0">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onSuggestionClick={handleSuggestionClick}
                      onQuickAction={handleQuickAction}
                    />
                  ))}
                  
                  {isTyping && <TypingIndicator />}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t bg-gray-50">
                <div className="flex gap-1 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSmartMode(!smartMode)}
                    className={`text-xs h-6 px-2 ${smartMode ? 'bg-blue-100 text-blue-700' : ''}`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Smart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceInput}
                    className={`text-xs h-6 px-2 ${isListening ? 'bg-red-100 text-red-700' : ''}`}
                  >
                    {isListening ? <MicOff className="w-3 h-3 mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
                    Voice
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask me anything..."}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 h-8 text-sm"
                    disabled={isListening}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputValue.trim() || isListening}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default ChatBot;
