import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! Welcome to ConexusPM. How can I help you today?',
    isUser: false,
    timestamp: new Date()
  }
];

const getAIResponse = async (message: string, conversationHistory: Message[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message,
        conversationHistory: conversationHistory.slice(-10) // Keep last 10 messages for context
      }
    });

    if (error) {
      console.error('Error calling AI chat:', error);
      return "I'm sorry, I'm having trouble responding right now. Please try again or contact our support team.";
    }

    return data.response;
  } catch (error) {
    console.error('Error in AI chat:', error);
    return "I'm sorry, I'm having trouble responding right now. Please try again or contact our support team.";
  }
};

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessages(false);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');

    // Get AI response
    setIsTyping(true);
    
    try {
      const aiResponse = await getAIResponse(currentMessage, messages);
      const botMessage: Message = {
        id: Date.now().toString() + '_bot',
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Show notification if chat is minimized
      if (isMinimized) {
        setHasNewMessages(true);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Trigger Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 relative overflow-hidden"
        >
          <MessageCircle className="h-6 w-6" />
          {hasNewMessages && (
            <Badge className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0 flex items-center justify-center bg-destructive">
              !
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
          isMinimized ? "w-80 h-14" : "w-80 h-96",
          "flex flex-col shadow-xl border-2"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">AI Support</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <p>{message.text}</p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        message.isUser ? "text-right" : "text-left"
                      )}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}