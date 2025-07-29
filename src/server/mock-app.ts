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

import mockAnalyticsRoutes from '@/routes/mock-analytics';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ]
});

class MockMenuCAServer {
  public app: Application;
  private server: any;

  constructor() {
    this.app = express();
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
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.healthCheck);

    // System status endpoint
    this.app.get('/status', this.systemStatus);

    // Mock Analytics routes
    this.app.use('/api/v1/analytics', mockAnalyticsRoutes);

    // API v1 routes placeholder
    this.app.use('/api/v1', (req: Request, res: Response) => {
      res.json({
        message: 'MenuCA Mock API v1',
        tenant: 'demo-tenant',
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
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'mocked',
          redis: 'mocked',
        },
        version: '1.0.0-mock',
      };

      res.status(200).json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  };

  private systemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = {
        application: {
          name: 'MenuCA Mock API',
          version: '1.0.0-mock',
          environment: 'development',
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
          status: 'mocked',
        },
        redis: {
          status: 'mocked',
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
      });

      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    });
  }

  public async start(): Promise<void> {
    try {
      const port = parseInt(process.env.PORT || '8000');
      const host = process.env.HOST || 'localhost';

      // Start the server
      this.server = this.app.listen(port, host, () => {
        logger.info(`🚀 MenuCA Mock server started on ${host}:${port}`);
        logger.info(`🔧 Environment: development (mock mode)`);
        logger.info(`📊 Process ID: ${process.pid}`);
        logger.info(`📈 Analytics endpoints available at http://${host}:${port}/api/v1/analytics/`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// Initialize and start server if this file is run directly
if (require.main === module) {
  const server = new MockMenuCAServer();
  server.start();
}

export default MockMenuCAServer;