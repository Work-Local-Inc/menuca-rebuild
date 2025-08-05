import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  MessageCircle, Send, Phone, Clock, User, Star, 
  CheckCircle, AlertCircle, Pause, Play, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: 'customer' | 'agent';
  message: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  customer_id: string;
  status: 'waiting' | 'active' | 'resolved' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  customer_info: {
    name: string;
    email: string;
  };
  queue_position?: number;
  created_at: string;
  last_activity: string;
}

interface QueueStatus {
  waiting_customers: number;
  available_agents: number;
  average_wait_time: number;
  active_sessions: number;
}

interface AgentDashboardProps {
  agentId: string;
  agentToken: string;
  tenantId: string;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  agentId,
  agentToken,
  tenantId
}) => {
  // Connection State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'online' | 'away' | 'busy'>('away');

  // Chat State
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);

  // Queue State
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    waiting_customers: 0,
    available_agents: 0,
    average_wait_time: 0,
    active_sessions: 0
  });
  const [waitingQueue, setWaitingQueue] = useState<ChatSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Agent connected to chat server');
      setIsConnected(true);
      
      // Authenticate as agent
      newSocket.emit('authenticate', { 
        token: agentToken, 
        userType: 'agent' 
      });
    });

    newSocket.on('authenticated', (data) => {
      console.log('Agent authenticated:', data);
      setIsAuthenticated(true);
      setAgentStatus('online');
    });

    newSocket.on('authentication_error', (error) => {
      console.error('Agent authentication failed:', error);
      setIsAuthenticated(false);
    });

    newSocket.on('chat_assignment', (data) => {
      console.log('New chat assigned:', data);
      // Add to waiting queue for agent to accept
      fetchWaitingQueue();
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      console.log('New message received:', message);
      if (selectedSession && message.chat_session_id === selectedSession.id) {
        setMessages(prev => [...prev, message]);
      }
      setCustomerTyping(false);
    });

    newSocket.on('user_typing', (data) => {
      if (data.userType === 'customer' && selectedSession && data.userId !== agentId) {
        setCustomerTyping(true);
      }
    });

    newSocket.on('user_stop_typing', (data) => {
      if (data.userType === 'customer') {
        setCustomerTyping(false);
      }
    });

    newSocket.on('chat_ended', (data) => {
      console.log('Chat ended:', data);
      // Remove from active sessions
      setActiveSessions(prev => prev.filter(s => s.id !== data.sessionId));
      if (selectedSession?.id === data.sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    });

    newSocket.on('queue_status', (status: QueueStatus) => {
      console.log('Queue status update:', status);
      setQueueStatus(status);
    });

    newSocket.on('disconnect', () => {
      console.log('Agent disconnected from chat server');
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [agentToken, agentId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch data on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSessions();
      fetchWaitingQueue();
    }
  }, [isAuthenticated]);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/v1/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${agentToken}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const active = data.data.filter((s: ChatSession) => s.status === 'active');
        setActiveSessions(active);
      }
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    }
  };

  const fetchWaitingQueue = async () => {
    // In a real implementation, this would fetch waiting sessions from API
    // For now, we'll use mock data
    setWaitingQueue([]);
  };

  const acceptChat = async (sessionId: string) => {
    if (socket) {
      socket.emit('accept_chat', { sessionId });
      
      // Move from waiting to active
      const waitingSession = waitingQueue.find(s => s.id === sessionId);
      if (waitingSession) {
        setActiveSessions(prev => [...prev, { ...waitingSession, status: 'active' }]);
        setWaitingQueue(prev => prev.filter(s => s.id !== sessionId));
        setSelectedSession({ ...waitingSession, status: 'active' });
        fetchChatHistory(sessionId);
      }
    }
  };

  const selectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    await fetchChatHistory(session.id);
  };

  const fetchChatHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${agentToken}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const sendMessage = () => {
    if (socket && selectedSession && inputMessage.trim()) {
      socket.emit('send_message', {
        sessionId: selectedSession.id,
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
    if (socket && selectedSession && !isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { sessionId: selectedSession.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (socket && selectedSession && isTyping) {
      setIsTyping(false);
      socket.emit('typing_stop', { sessionId: selectedSession.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const endChat = () => {
    if (socket && selectedSession) {
      socket.emit('end_chat', { sessionId: selectedSession.id });
    }
  };

  const updateStatus = (newStatus: 'online' | 'away' | 'busy') => {
    setAgentStatus(newStatus);
    // In real implementation, this would update agent status via API
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'busy': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'away': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Agent Dashboard</h1>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {getStatusIcon(agentStatus)}
              <span className="text-sm font-medium">{agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}</span>
            </div>
          </div>

          {/* Status Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant={agentStatus === 'online' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateStatus('online')}
              className="flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              Online
            </Button>
            <Button
              variant={agentStatus === 'away' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateStatus('away')}
              className="flex items-center gap-1"
            >
              <Pause className="h-3 w-3" />
              Away
            </Button>
            <Button
              variant={agentStatus === 'busy' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateStatus('busy')}
              className="flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              Busy
            </Button>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Waiting</p>
                  <p className="text-2xl font-bold text-orange-600">{queueStatus.waiting_customers}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Chats</p>
                  <p className="text-2xl font-bold text-blue-600">{queueStatus.active_sessions}</p>
                </div>
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Available Agents</p>
                  <p className="text-2xl font-bold text-green-600">{queueStatus.available_agents}</p>
                </div>
                <User className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avg Wait</p>
                  <p className="text-2xl font-bold text-purple-600">{queueStatus.average_wait_time}m</p>
                </div>
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Chat List */}
        <div className="w-80 bg-white border-r flex flex-col">
          <Tabs defaultValue="active" className="flex-1">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="active">Active ({activeSessions.length})</TabsTrigger>
              <TabsTrigger value="queue">Queue ({waitingQueue.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="flex-1 overflow-hidden">
              <div className="overflow-y-auto h-full">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedSession?.id === session.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{session.customer_info.name}</h4>
                      <Badge variant="secondary" className={getPriorityColor(session.priority)}>
                        {session.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{session.subject || 'General Support'}</p>
                    <p className="text-xs text-gray-500">
                      Last activity: {formatTime(session.last_activity)}
                    </p>
                  </div>
                ))}

                {activeSessions.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active chats</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="queue" className="flex-1 overflow-hidden">
              <div className="overflow-y-auto h-full">
                {waitingQueue.map((session) => (
                  <div key={session.id} className="p-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{session.customer_info.name}</h4>
                      <Badge variant="secondary" className={getPriorityColor(session.priority)}>
                        {session.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{session.subject || 'General Support'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Waiting: {Math.floor((Date.now() - new Date(session.created_at).getTime()) / 60000)}m
                      </p>
                      <Button
                        size="sm"
                        onClick={() => acceptChat(session.id)}
                        className="text-xs"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}

                {waitingQueue.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No customers waiting</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{selectedSession.customer_info.name}</h3>
                    <p className="text-sm text-gray-600">{selectedSession.customer_info.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(selectedSession.priority)}>
                      {selectedSession.priority}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={endChat}
                      className="text-red-600 hover:text-red-700"
                    >
                      End Chat
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'agent' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender_type === 'agent'
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

                {/* Customer Typing Indicator */}
                {customerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 px-4 py-2 rounded-lg">
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

              {/* Message Input */}
              <div className="bg-white border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat Selected</h3>
                <p className="text-gray-500">
                  Select a chat from the sidebar or wait for new customers to join the queue.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};