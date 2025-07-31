import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Send, X, Minimize2, Phone, RotateCcw, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: 'customer' | 'agent';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
}

interface ChatSession {
  id: string;
  status: 'waiting' | 'active' | 'resolved' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  queue_position?: number;
  estimated_wait_time?: number;
  agent_id?: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface LiveChatProps {
  userId: string;
  userToken: string;
  tenantId: string;
}

export const LiveChat: React.FC<LiveChatProps> = ({ userId, userToken, tenantId }) => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showRating, setShowRating] = useState(false);

  // Chat State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);

  // Queue State
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);

  // Rating State
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize WebSocket connection
  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io('http://localhost:3000', {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        
        // Authenticate
        newSocket.emit('authenticate', { 
          token: userToken, 
          userType: 'customer' 
        });
      });

      newSocket.on('authenticated', (data) => {
        console.log('Authenticated:', data);
        setIsAuthenticated(true);
      });

      newSocket.on('authentication_error', (error) => {
        console.error('Authentication failed:', error);
        setIsAuthenticated(false);
      });

      newSocket.on('chat_session_created', (session: ChatSession) => {
        console.log('Chat session created:', session);
        setCurrentSession(session);
        setQueuePosition(session.queue_position || 0);
        setEstimatedWait(session.estimated_wait_time || 0);
      });

      newSocket.on('chat_accepted', (data) => {
        console.log('Chat accepted by agent:', data);
        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            status: 'active',
            agent_id: data.agentId
          });
        }
      });

      newSocket.on('new_message', (message: ChatMessage) => {
        console.log('New message:', message);
        setMessages(prev => [...prev, message]);
        setAgentTyping(false);
      });

      newSocket.on('user_typing', (data) => {
        if (data.userType === 'agent') {
          setAgentTyping(true);
        }
      });

      newSocket.on('user_stop_typing', (data) => {
        if (data.userType === 'agent') {
          setAgentTyping(false);
        }
      });

      newSocket.on('chat_ended', () => {
        console.log('Chat ended');
        setShowRating(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
        setIsAuthenticated(false);
      });

      newSocket.on('error', (error) => {
        console.error('Chat error:', error);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isOpen, userToken]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const requestChat = () => {
    if (socket && isAuthenticated) {
      socket.emit('request_chat', {
        subject: 'General Support',
        priority: 'medium',
        userAgent: navigator.userAgent
      });
    }
  };

  const sendMessage = () => {
    if (socket && currentSession && inputMessage.trim()) {
      socket.emit('send_message', {
        sessionId: currentSession.id,
        message: inputMessage.trim(),
        messageType: 'text'
      });
      
      setInputMessage('');
      stopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    } else {
      startTyping();
    }
  };

  const startTyping = () => {
    if (socket && currentSession && !isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { sessionId: currentSession.id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (socket && currentSession && isTyping) {
      setIsTyping(false);
      socket.emit('typing_stop', { sessionId: currentSession.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const endChat = () => {
    if (socket && currentSession) {
      socket.emit('end_chat', { sessionId: currentSession.id });
    }
  };

  const submitRating = () => {
    if (rating > 0) {
      // Submit rating via API
      fetch(`/api/v1/chat/sessions/${currentSession?.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          rating,
          feedback,
          category: 'general'
        })
      }).then(() => {
        setShowRating(false);
        setCurrentSession(null);
        setMessages([]);
        setRating(0);
        setFeedback('');
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Chat Widget Button
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  // Rating Modal
  if (showRating) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Rate Your Experience
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRating(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 rounded ${
                      rating >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Feedback (optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={submitRating}
                disabled={rating === 0}
                className="flex-1"
              >
                Submit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRating(false)}
                className="flex-1"
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 transition-all duration-300 ${isMinimized ? 'h-14' : 'h-96'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium">
              {currentSession?.status === 'active' ? 'Live Chat' : 'Customer Support'}
            </CardTitle>
          </div>
          
          <div className="flex items-center space-x-1">
            {currentSession && (
              <Badge variant="secondary" className={getStatusColor(currentSession.status)}>
                {currentSession.status}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {/* Connection Status */}
            {!isConnected && (
              <div className="p-3 bg-yellow-50 border-b">
                <p className="text-sm text-yellow-700">Connecting to chat server...</p>
              </div>
            )}

            {/* Pre-chat or Queue */}
            {isConnected && !currentSession && (
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="font-medium mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Chat with our support team for immediate assistance.
                </p>
                <Button onClick={requestChat} disabled={!isAuthenticated}>
                  Start Chat
                </Button>
              </div>
            )}

            {/* Queue Status */}
            {currentSession?.status === 'waiting' && (
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                <RotateCcw className="h-8 w-8 text-blue-600 mb-3 animate-spin" />
                <h3 className="font-medium mb-2">You're in Queue</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Position: {queuePosition}
                </p>
                <p className="text-sm text-gray-600">
                  Estimated wait: {estimatedWait} minutes
                </p>
              </div>
            )}

            {/* Active Chat */}
            {currentSession?.status === 'active' && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender_type === 'customer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {agentTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 px-3 py-2 rounded-lg text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-3">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      {currentAgent ? `Chatting with ${currentAgent.name}` : 'Connected to support'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={endChat}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      End Chat
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};