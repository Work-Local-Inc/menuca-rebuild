// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { createServer } from 'http';

import { serverConfig, validateServerConfig } from '@/config/server';
import db from '@/database/connection';
import cache from '@/cache/memory';
import authRoutes from '@/routes/auth';
import menuRoutes from '@/routes/menu';
import cartRoutes from '@/routes/cart';
import orderRoutes from '@/routes/orders';
import paymentRoutes from '@/routes/payment';
import commissionRoutes from '@/routes/commission';
import analyticsRoutes from '@/routes/analytics';
import searchRoutes from '@/routes/search';
import chatRoutes from '@/routes/chat';
import monitoringRoutes from '@/routes/monitoring';
import restaurantRoutes from '@/routes/restaurant';
import { chatService } from '@/services/ChatService';
import { monitoringService } from '@/services/MonitoringService';

// Validate configuration
validateServerConfig();

// Initialize logger
const logger = winston.createLogger({
  level: serverConfig.logging.level,
  format: serverConfig.logging.format === 'json' 
    ? winston.format.json() 
    : winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

class MenuCAServer {
  public app: Application;
  private server: any;
  private httpServer: any;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false, 
    });
    this.app.use(limiter);

    // Request ID middleware for tracing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = Math.random().toString(36).substring(2, 15);
      req.headers['x-request-id'] = requestId;
      res.setHeader('x-request-id', requestId);
      logger.info(`Request ${requestId}: ${req.method} ${req.path}`);
      next();
    });

    // Tenant context middleware
    this.app.use(this.tenantContextMiddleware);
  }

  private tenantContextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    let tenantId: string | undefined;

    // Try to get tenant ID from header
    tenantId = req.headers[serverConfig.tenant.header] as string;

    // Try to get tenant ID from subdomain if enabled
    if (!tenantId && serverConfig.tenant.subdomainEnabled) {
      const host = req.get('host');
      if (host) {
        const subdomain = host.split('.')[0];
        // Only use subdomain if it looks like a tenant ID (not localhost, IP, etc.)
        if (subdomain && 
            subdomain !== 'www' && 
            subdomain !== 'api' && 
            subdomain !== 'localhost' &&
            !subdomain.includes(':') &&
            !/^\d+\.\d+\.\d+\.\d+$/.test(subdomain)) {
          tenantId = subdomain;
        }
      }
    }

    // Use default tenant ID if none found
    if (!tenantId) {
      tenantId = serverConfig.tenant.defaultId;
    }

    // Add tenant context to request
    req.tenantContext = {
      tenantId,
    };

    logger.debug(`Request assigned to tenant: ${tenantId}`);
    next();
  };

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.healthCheck);

    // System status endpoint
    this.app.get('/status', this.systemStatus);

    // Authentication routes
    this.app.use('/api/v1/auth', authRoutes);

    // Menu management routes
    this.app.use('/api/v1/menu', menuRoutes);

    // Shopping cart routes
    this.app.use('/api/v1/cart', cartRoutes);

    // Order management routes
    this.app.use('/api/v1/orders', orderRoutes);

    // Payment processing routes
    this.app.use('/api/v1/payment', paymentRoutes);

    // Commission management routes
    this.app.use('/api/v1/commission', commissionRoutes);

    // Analytics and reporting routes
    this.app.use('/api/v1/analytics', analyticsRoutes);

    // Search and help system routes
    this.app.use('/api/v1/search', searchRoutes);

    // Live chat system routes
    this.app.use('/api/v1/chat', chatRoutes);

    // Restaurant management routes
    this.app.use('/api/v1/restaurants', restaurantRoutes);

    // System monitoring routes
    this.app.use('/api/v1/monitoring', monitoringRoutes);

    // API v1 routes placeholder
    this.app.use('/api/v1', (req: Request, res: Response) => {
      res.json({
        message: 'MenuCA API v1',
        tenant: req.tenantContext?.tenantId,
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  private healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Basic health check - just return that server is running
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
      };

      // Test connections but don't fail if they're down
      try {
        const dbHealthy = await db.testConnection();
        const redisHealthy = await cache.testConnection();
        health.services = {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy',
        };
      } catch (error) {
        health.services = {
          database: 'unknown',
          redis: 'unknown',
        };
      }
      
      res.status(200).json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        error: 'Basic health check only',
      });
    }
  };

  private systemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = {
        application: {
          name: 'MenuCA API',
          version: process.env.npm_package_version || '1.0.0',
          environment: serverConfig.nodeEnv,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        database: {
          status: await db.testConnection() ? 'connected' : 'disconnected',
          pool: db.getPoolStatus(),
        },
        redis: {
          status: cache.isReady() ? 'connected' : 'disconnected',
          info: cache.isReady() ? await cache.getInfo() : 'Not available',
        },
      };

      res.json(status);
    } catch (error) {
      logger.error('System status check failed:', error);
      res.status(500).json({
        error: 'System status check failed',
        timestamp: new Date().toISOString(),
      });
    }
  };

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        tenant: req.tenantContext?.tenantId,
      });

      // Don't leak error details in production
      const isDevelopment = serverConfig.nodeEnv === 'development';
      
      res.status(500).json({
        error: 'Internal server error',
        message: isDevelopment ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection with retries
      logger.info('Initializing database connection...');
      let dbConnected = false;
      for (let i = 0; i < 5; i++) {
        try {
          dbConnected = await db.testConnection();
          if (dbConnected) break;
        } catch (error) {
          logger.warn(`Database connection attempt ${i + 1} failed:`, error);
        }
        if (i < 4) await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (!dbConnected) {
        logger.error('Failed to connect to database after 5 attempts');
        throw new Error('Failed to connect to database');
      }

      // Initialize Redis connection (non-blocking)
      logger.info('Initializing Redis connection...');
      try {
        await cache.connect();
        const redisConnected = await cache.testConnection();
        if (redisConnected) {
          logger.info('Redis connected successfully');
        } else {
          logger.warn('Redis connection test failed - continuing without Redis');
        }
      } catch (error) {
        logger.warn('Redis connection failed - continuing without Redis:', error);
      }

      // Initialize WebSocket for live chat
      logger.info('Initializing WebSocket for live chat...');
      chatService.initializeWebSocket(this.httpServer);

      // Start system monitoring (optional)
      logger.info('Starting system monitoring...');
      try {
        await monitoringService.startMonitoring(30000); // Collect metrics every 30 seconds
        logger.info('System monitoring started successfully');
      } catch (error) {
        logger.warn('System monitoring failed to start - continuing without monitoring:', error);
      }

      // Start the server
      this.server = this.httpServer.listen(serverConfig.port, serverConfig.host, () => {
        logger.info(`=� MenuCA server started on ${serverConfig.host}:${serverConfig.port}`);
        logger.info(`=� Environment: ${serverConfig.nodeEnv}`);
        logger.info(`=' Process ID: ${process.pid}`);
        logger.info(`=💬 WebSocket live chat enabled`);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      this.server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          await db.close();
          logger.info('Database connections closed');

          // Close Redis connection
          await cache.close();
          logger.info('Redis connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public getApp(): Application {
    return this.app;
  }
}

// Initialize and start server if this file is run directly
if (require.main === module) {
  const server = new MenuCAServer();
  server.start();
}

export default MenuCAServer;