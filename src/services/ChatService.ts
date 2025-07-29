import db from '@/database/connection';
import redis from '@/cache/redis';
import { Pool } from 'pg';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: 'customer' | 'agent';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  metadata?: any;
  created_at: string;
  read_at?: string;
}

export interface ChatSession {
  id: string;
  tenant_id: string;
  customer_id: string;
  agent_id?: string;
  status: 'waiting' | 'active' | 'resolved' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  customer_info: {
    name: string;
    email: string;
    user_agent?: string;
    ip_address?: string;
  };
  queue_position?: number;
  estimated_wait_time?: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  last_activity: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  current_chats: number;
  max_concurrent_chats: number;
  skills: string[];
  average_response_time: number;
  satisfaction_rating: number;
  last_activity: string;
}

export interface ChatQueue {
  waiting_customers: number;
  available_agents: number;
  average_wait_time: number;
  active_sessions: number;
}

export class ChatService {
  private pool: Pool;
  private io: SocketIOServer | null = null;
  private readonly AGENT_PRESENCE_TTL = 300; // 5 minutes
  private readonly SESSION_TTL = 86400; // 24 hours
  private readonly AGENT_PREFIX = 'agent:';
  private readonly SESSION_PREFIX = 'chat_session:';
  private readonly QUEUE_PREFIX = 'chat_queue:';

  constructor() {
    this.pool = db.getPool();
  }

  // =========================================
  // WEBSOCKET INITIALIZATION
  // =========================================

  initializeWebSocket(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.ALLOWED_ORIGINS?.split(',') 
          : true,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token, userType } = data;
          const user = await this.authenticateSocket(token);
          
          if (user) {
            socket.data.user = user;
            socket.data.userType = userType; // 'customer' or 'agent'
            
            if (userType === 'agent') {
              await this.handleAgentConnection(socket);
            }
            
            socket.emit('authenticated', { success: true, user });
          } else {
            socket.emit('authentication_error', { error: 'Invalid token' });
            socket.disconnect();
          }
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authentication_error', { error: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Handle customer chat requests
      socket.on('request_chat', async (data) => {
        if (socket.data.userType !== 'customer') return;
        
        try {
          const session = await this.createChatSession(socket, data);
          socket.emit('chat_session_created', session);
          
          // Try to assign an agent
          await this.assignAgent(session.id);
        } catch (error) {
          console.error('Error creating chat session:', error);
          socket.emit('error', { message: 'Failed to create chat session' });
        }
      });

      // Handle agent accepting chats
      socket.on('accept_chat', async (data) => {
        if (socket.data.userType !== 'agent') return;
        
        try {
          const { sessionId } = data;
          await this.acceptChatSession(socket.data.user.id, sessionId);
          socket.join(sessionId);
          socket.emit('chat_accepted', { sessionId });
        } catch (error) {
          console.error('Error accepting chat:', error);
          socket.emit('error', { message: 'Failed to accept chat' });
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const message = await this.sendMessage(socket, data);
          
          // Broadcast to all participants in the chat session
          this.io?.to(data.sessionId).emit('new_message', message);
          
          // Update last activity
          await this.updateSessionActivity(data.sessionId);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(data.sessionId).emit('user_typing', {
          userId: socket.data.user.id,
          userType: socket.data.userType
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(data.sessionId).emit('user_stop_typing', {
          userId: socket.data.user.id,
          userType: socket.data.userType
        });
      });

      // Handle chat session management
      socket.on('end_chat', async (data) => {
        try {
          await this.endChatSession(data.sessionId, socket.data.user.id);
          socket.to(data.sessionId).emit('chat_ended', { sessionId: data.sessionId });
          socket.leave(data.sessionId);
        } catch (error) {
          console.error('Error ending chat:', error);
          socket.emit('error', { message: 'Failed to end chat' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (socket.data.userType === 'agent' && socket.data.user) {
          await this.handleAgentDisconnection(socket.data.user.id);
        }
      });
    });
  }

  // =========================================
  // CHAT SESSION MANAGEMENT
  // =========================================

  async createChatSession(socket: any, data: any): Promise<ChatSession> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('SET app.current_tenant_id = $1', [socket.data.user.tenant_id]);

      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const session: ChatSession = {
        id: sessionId,
        tenant_id: socket.data.user.tenant_id,
        customer_id: socket.data.user.id,
        status: 'waiting',
        priority: data.priority || 'medium',
        subject: data.subject,
        customer_info: {
          name: socket.data.user.name || socket.data.user.email,
          email: socket.data.user.email,
          user_agent: data.userAgent,
          ip_address: socket.handshake.address
        },
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      // Insert session into database
      await client.query(`
        INSERT INTO chat_sessions (
          id, tenant_id, customer_id, status, priority, subject, 
          customer_info, created_at, last_activity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        session.id, session.tenant_id, session.customer_id, session.status,
        session.priority, session.subject, JSON.stringify(session.customer_info),
        session.created_at, session.last_activity
      ]);

      // Cache session in Redis
      await redis.set(
        `${this.SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session),
        this.SESSION_TTL
      );

      // Add to queue
      await this.addToQueue(session);

      // Join socket to session room
      socket.join(sessionId);

      await client.query('COMMIT');
      return session;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async assignAgent(sessionId: string): Promise<boolean> {
    try {
      const availableAgents = await this.getAvailableAgents();
      
      if (availableAgents.length === 0) {
        return false; // No agents available
      }

      // Simple round-robin assignment (could be improved with skill-based routing)
      const agent = availableAgents[0];
      
      // Update session with assigned agent
      const client = await this.pool.connect();
      
      try {
        await client.query(`
          UPDATE chat_sessions 
          SET agent_id = $1, status = 'active', started_at = NOW()
          WHERE id = $2
        `, [agent.id, sessionId]);

        // Update Redis cache
        const sessionData = await redis.get(`${this.SESSION_PREFIX}${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.agent_id = agent.id;
          session.status = 'active';
          session.started_at = new Date().toISOString();
          
          await redis.set(
            `${this.SESSION_PREFIX}${sessionId}`,
            JSON.stringify(session),
            this.SESSION_TTL
          );
        }

        // Notify agent
        this.io?.emit('chat_assignment', {
          sessionId,
          agentId: agent.id,
          customerInfo: sessionData ? JSON.parse(sessionData).customer_info : null
        });

        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      return false;
    }
  }

  async sendMessage(socket: any, data: any): Promise<ChatMessage> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [socket.data.user.tenant_id]);

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const message: ChatMessage = {
        id: messageId,
        chat_session_id: data.sessionId,
        sender_id: socket.data.user.id,
        sender_type: socket.data.userType,
        message: data.message,
        message_type: data.messageType || 'text',
        metadata: data.metadata || null,
        created_at: new Date().toISOString()
      };

      // Insert message into database
      await client.query(`
        INSERT INTO chat_messages (
          id, chat_session_id, sender_id, sender_type, message, 
          message_type, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        message.id, message.chat_session_id, message.sender_id,
        message.sender_type, message.message, message.message_type,
        JSON.stringify(message.metadata), message.created_at
      ]);

      return message;
    } finally {
      client.release();
    }
  }

  // =========================================
  // AGENT MANAGEMENT
  // =========================================

  async handleAgentConnection(socket: any): Promise<void> {
    const agentId = socket.data.user.id;
    
    // Update agent status to online
    await this.updateAgentStatus(agentId, 'online');
    
    // Join agent to agent room for broadcasts
    socket.join('agents');
    
    // Send current queue status
    const queueStatus = await this.getQueueStatus();
    socket.emit('queue_status', queueStatus);
  }

  async handleAgentDisconnection(agentId: string): Promise<void> {
    // Update agent status to offline
    await this.updateAgentStatus(agentId, 'offline');
    
    // Handle any active chats - transfer or end
    await this.handleDisconnectedAgentChats(agentId);
  }

  async updateAgentStatus(agentId: string, status: 'online' | 'busy' | 'away' | 'offline'): Promise<void> {
    const agentKey = `${this.AGENT_PREFIX}${agentId}`;
    
    const agentData = {
      id: agentId,
      status,
      last_activity: new Date().toISOString()
    };

    if (status === 'offline') {
      await redis.del(agentKey);
    } else {
      await redis.set(agentKey, JSON.stringify(agentData), this.AGENT_PRESENCE_TTL);
    }
  }

  async getAvailableAgents(): Promise<Agent[]> {
    try {
      const pattern = `${this.AGENT_PREFIX}*`;
      // Note: In production, use SCAN instead of KEYS
      const agentKeys = await redis.keys(pattern);
      
      const agents: Agent[] = [];
      
      for (const key of agentKeys) {
        const agentData = await redis.get(key);
        if (agentData) {
          const agent = JSON.parse(agentData);
          if (agent.status === 'online' && agent.current_chats < agent.max_concurrent_chats) {
            agents.push(agent);
          }
        }
      }

      // Sort by current workload (agents with fewer chats first)
      return agents.sort((a, b) => a.current_chats - b.current_chats);
    } catch (error) {
      console.error('Error getting available agents:', error);
      return [];
    }
  }

  // =========================================
  // QUEUE MANAGEMENT
  // =========================================

  async addToQueue(session: ChatSession): Promise<void> {
    const queueKey = `${this.QUEUE_PREFIX}${session.tenant_id}`;
    await redis.lpush(queueKey, session.id);
    
    // Update queue position
    const position = await redis.lpos(queueKey, session.id);
    session.queue_position = position || 0;
    
    // Estimate wait time (simple calculation: position * 5 minutes)
    session.estimated_wait_time = (session.queue_position || 0) * 5;
  }

  async getQueueStatus(): Promise<ChatQueue> {
    try {
      const availableAgents = await this.getAvailableAgents();
      
      // Get active sessions count from database
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          "SELECT COUNT(*) as count FROM chat_sessions WHERE status = 'active'"
        );
        
        return {
          waiting_customers: 0, // Would be calculated from queue
          available_agents: availableAgents.length,
          average_wait_time: 5, // Would be calculated from historical data
          active_sessions: parseInt(result.rows[0].count)
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {
        waiting_customers: 0,
        available_agents: 0,
        average_wait_time: 0,
        active_sessions: 0
      };
    }
  }

  // =========================================
  // CHAT HISTORY
  // =========================================

  async getChatHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM chat_messages 
        WHERE chat_session_id = $1 
        ORDER BY created_at ASC 
        LIMIT $2
      `, [sessionId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        chat_session_id: row.chat_session_id,
        sender_id: row.sender_id,
        sender_type: row.sender_type,
        message: row.message,
        message_type: row.message_type,
        metadata: row.metadata,
        created_at: row.created_at,
        read_at: row.read_at
      }));
    } finally {
      client.release();
    }
  }

  async getUserChatSessions(userId: string, userType: 'customer' | 'agent'): Promise<ChatSession[]> {
    const client = await this.pool.connect();
    
    try {
      const field = userType === 'customer' ? 'customer_id' : 'agent_id';
      const result = await client.query(`
        SELECT * FROM chat_sessions 
        WHERE ${field} = $1 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        tenant_id: row.tenant_id,
        customer_id: row.customer_id,
        agent_id: row.agent_id,
        status: row.status,
        priority: row.priority,
        subject: row.subject,
        customer_info: row.customer_info,
        queue_position: row.queue_position,
        estimated_wait_time: row.estimated_wait_time,
        created_at: row.created_at,
        started_at: row.started_at,
        ended_at: row.ended_at,
        last_activity: row.last_activity
      }));
    } finally {
      client.release();
    }
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  private async authenticateSocket(token: string): Promise<any> {
    // This would integrate with your existing JWT authentication
    // For now, returning a mock user
    return {
      id: 'user_123',
      email: 'user@example.com',
      name: 'Test User',
      tenant_id: 'default-tenant'
    };
  }

  private async acceptChatSession(agentId: string, sessionId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        UPDATE chat_sessions 
        SET agent_id = $1, status = 'active', started_at = NOW()
        WHERE id = $2 AND status = 'waiting'
      `, [agentId, sessionId]);
    } finally {
      client.release();
    }
  }

  private async endChatSession(sessionId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        UPDATE chat_sessions 
        SET status = 'resolved', ended_at = NOW()
        WHERE id = $1
      `, [sessionId]);

      // Clean up Redis cache
      await redis.del(`${this.SESSION_PREFIX}${sessionId}`);
    } finally {
      client.release();
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        UPDATE chat_sessions 
        SET last_activity = NOW()
        WHERE id = $1
      `, [sessionId]);
    } finally {
      client.release();
    }
  }

  private async handleDisconnectedAgentChats(agentId: string): Promise<void> {
    // In production, this would transfer chats to other agents or put them back in queue
    console.log(`Handling disconnected agent chats for agent: ${agentId}`);
  }

  // =========================================
  // PUBLIC API METHODS
  // =========================================

  getIO(): SocketIOServer | null {
    return this.io;
  }

  async broadcastToAgents(event: string, data: any): Promise<void> {
    this.io?.to('agents').emit(event, data);
  }

  async sendToSession(sessionId: string, event: string, data: any): Promise<void> {
    this.io?.to(sessionId).emit(event, data);
  }

  // =========================================
  // MONITORING & STATISTICS
  // =========================================

  getConnectionStats(): {
    totalConnections: number;
    totalMessages: number;
    activeSessions: number;
    activeAgents: number;
  } {
    const totalConnections = this.io?.engine.clientsCount || 0;
    
    // In a production environment, these would be tracked with counters
    // For now, return mock data based on current state
    return {
      totalConnections,
      totalMessages: 0, // Would be tracked with a counter
      activeSessions: 0, // Would query database
      activeAgents: 0    // Would count online agents
    };
  }

  async getDetailedStats(): Promise<{
    connections: {
      total: number;
      customers: number;
      agents: number;
    };
    sessions: {
      active: number;
      waiting: number;
      resolved_today: number;
    };
    performance: {
      average_response_time: number;
      messages_per_minute: number;
    };
  }> {
    const client = await this.pool.connect();
    
    try {
      // Get session counts
      const sessionResult = await client.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM chat_sessions 
        WHERE DATE(created_at) = CURRENT_DATE
        GROUP BY status
      `);

      const sessionCounts = sessionResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, { active: 0, waiting: 0, resolved: 0 });

      // Get today's message count
      const messageResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM chat_messages 
        WHERE DATE(created_at) = CURRENT_DATE
      `);

      const totalMessages = parseInt(messageResult.rows[0].count);

      return {
        connections: {
          total: this.io?.engine.clientsCount || 0,
          customers: 0, // Would track by socket type
          agents: 0     // Would track by socket type
        },
        sessions: {
          active: sessionCounts.active,
          waiting: sessionCounts.waiting,
          resolved_today: sessionCounts.resolved
        },
        performance: {
          average_response_time: 120, // Would calculate from historical data
          messages_per_minute: totalMessages / (24 * 60) // Messages per minute today
        }
      };
    } finally {
      client.release();
    }
  }
}

export const chatService = new ChatService();