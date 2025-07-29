import express, { Request, Response, NextFunction } from 'express';
import { chatService } from '@/services/ChatService';
import { authenticateToken, requireMinRole } from '@/middleware/auth';
import { UserRole } from '@/types/auth';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// =========================================
// CHAT SESSION ROUTES
// =========================================

// Get user's chat sessions (customer or agent)
router.get('/sessions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userType = req.user!.role === UserRole.CUSTOMER ? 'customer' : 'agent';
    
    const sessions = await chatService.getUserChatSessions(
      req.user!.id,
      userType
    );

    logger.info('Chat sessions retrieved', {
      tenantId: req.tenantContext!.tenantId,
      userId: req.user!.id,
      userType,
      sessionCount: sessions.length
    });

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    logger.error('Failed to get chat sessions:', error);
    next(error);
  }
});

// Get specific chat session details
router.get('/sessions/:sessionId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    // Get chat history
    const messages = await chatService.getChatHistory(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        messages
      }
    });

  } catch (error) {
    logger.error('Failed to get chat session:', error);
    next(error);
  }
});

// Get chat history for a session
router.get('/sessions/:sessionId/messages', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await chatService.getChatHistory(
      sessionId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    logger.error('Failed to get chat messages:', error);
    next(error);
  }
});

// =========================================
// AGENT ROUTES
// =========================================

// Get queue status (agents only)
router.get('/queue/status', authenticateToken, requireMinRole(UserRole.STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queueStatus = await chatService.getQueueStatus();

    res.json({
      success: true,
      data: queueStatus
    });

  } catch (error) {
    logger.error('Failed to get queue status:', error);
    next(error);
  }
});

// Get available agents (admin only)
router.get('/agents/available', authenticateToken, requireMinRole(UserRole.MANAGER), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availableAgents = await chatService.getAvailableAgents();

    res.json({
      success: true,
      data: availableAgents
    });

  } catch (error) {
    logger.error('Failed to get available agents:', error);
    next(error);
  }
});

// Broadcast message to all agents (admin only)
router.post('/agents/broadcast', authenticateToken, requireMinRole(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event, data } = req.body;

    if (!event || !data) {
      res.status(400).json({
        error: 'Event and data are required'
      });
      return;
    }

    await chatService.broadcastToAgents(event, data);

    logger.info('Message broadcast to agents', {
      tenantId: req.tenantContext!.tenantId,
      adminId: req.user!.id,
      event
    });

    res.json({
      success: true,
      message: 'Message broadcast successfully'
    });

  } catch (error) {
    logger.error('Failed to broadcast message:', error);
    next(error);
  }
});

// =========================================
// CHAT FEEDBACK ROUTES
// =========================================

// Submit chat session rating
router.post('/sessions/:sessionId/rating', authenticateToken, requireMinRole(UserRole.CUSTOMER), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback, category } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
      return;
    }

    // Note: This would typically be implemented in ChatService
    // For now, we'll return a success response
    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    logger.error('Failed to submit rating:', error);
    next(error);
  }
});

// =========================================
// SYSTEM ROUTES
// =========================================

// WebSocket connection info
router.get('/websocket/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      endpoint: '/socket.io',
      transports: ['websocket', 'polling'],
      events: {
        client_to_server: [
          'authenticate',
          'request_chat',
          'accept_chat',
          'send_message',
          'typing_start',
          'typing_stop',
          'end_chat'
        ],
        server_to_client: [
          'authenticated',
          'authentication_error',
          'chat_session_created',
          'chat_accepted',
          'new_message',
          'user_typing',
          'user_stop_typing',
          'chat_ended',
          'chat_assignment',
          'queue_status',
          'error'
        ]
      }
    }
  });
});

// Health check for chat service
router.get('/health', async (req: Request, res: Response) => {
  try {
    const io = chatService.getIO();
    const queueStatus = await chatService.getQueueStatus();

    res.json({
      status: 'healthy',
      service: 'chat',
      timestamp: new Date().toISOString(),
      websocket_active: io !== null,
      queue_status: queueStatus
    });

  } catch (error) {
    logger.error('Chat health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'chat',
      timestamp: new Date().toISOString(),
      error: 'Chat service unavailable'
    });
  }
});

export default router;