
import React from 'react';
import { Bot, User, Lightbulb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

interface ChatMessageProps {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onQuickAction: (action: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onSuggestionClick, 
  onQuickAction 
}) => {
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${
        message.type === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-900'
        } rounded-lg p-3 shadow-sm`}>
        <div className="flex items-start gap-2">
          {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 text-blue-600" />}
          {message.type === 'user' && <User className="w-4 h-4 mt-0.5" />}
          <div className="flex-1">
            <p className="text-sm">{message.message}</p>
            
            {/* Quick Actions */}
            {message.quickActions && message.quickActions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs opacity-75 flex items-center gap-1 mb-2">
                  <Zap className="w-3 h-3" />
                  Quick Actions:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {message.quickActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={() => onQuickAction(action.action)}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs p-1.5 h-auto bg-white/20 hover:bg-white/30"
                    >
                      <span className="mr-1">{action.icon}</span>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-2">
                <Separator className="my-2 opacity-30" />
                <p className="text-xs opacity-75 flex items-center gap-1 mb-1">
                  <Lightbulb className="w-3 h-3" />
                  Suggestions:
                </p>
                <div className="space-y-1">
                  {message.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      onClick={() => onSuggestionClick(suggestion)}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs p-2 h-auto bg-white/20 hover:bg-white/30"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
