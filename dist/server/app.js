"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const winston_1 = __importDefault(require("winston"));
const server_1 = require("@/config/server");
const connection_1 = __importDefault(require("@/database/connection"));
const redis_1 = __importDefault(require("@/cache/redis"));
const auth_1 = __importDefault(require("@/routes/auth"));
const menu_1 = __importDefault(require("@/routes/menu"));
const cart_1 = __importDefault(require("@/routes/cart"));
const payment_1 = __importDefault(require("@/routes/payment"));
const commission_1 = __importDefault(require("@/routes/commission"));
const analytics_1 = __importDefault(require("@/routes/analytics"));
// Validate configuration
(0, server_1.validateServerConfig)();
// Initialize logger
const logger = winston_1.default.createLogger({
    level: server_1.serverConfig.logging.level,
    format: server_1.serverConfig.logging.format === 'json'
        ? winston_1.default.format.json()
        : winston_1.default.format.simple(),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' })
    ]
});
class MenuCAServer {
    app;
    server;
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: process.env.NODE_ENV === 'production'
                ? process.env.ALLOWED_ORIGINS?.split(',')
                : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
        }));
        // Compression middleware
        this.app.use((0, compression_1.default)());
        // Request logging
        this.app.use((0, morgan_1.default)('combined', {
            stream: { write: (message) => logger.info(message.trim()) }
        }));
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use((req, res, next) => {
            const requestId = Math.random().toString(36).substring(2, 15);
            req.headers['x-request-id'] = requestId;
            res.setHeader('x-request-id', requestId);
            logger.info(`Request ${requestId}: ${req.method} ${req.path}`);
            next();
        });
        // Tenant context middleware
        this.app.use(this.tenantContextMiddleware);
    }
    tenantContextMiddleware = (req, _res, next) => {
        let tenantId;
        // Try to get tenant ID from header
        tenantId = req.headers[server_1.serverConfig.tenant.header];
        // Try to get tenant ID from subdomain if enabled
        if (!tenantId && server_1.serverConfig.tenant.subdomainEnabled) {
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
            tenantId = server_1.serverConfig.tenant.defaultId;
        }
        // Add tenant context to request
        req.tenantContext = {
            tenantId,
        };
        logger.debug(`Request assigned to tenant: ${tenantId}`);
        next();
    };
    initializeRoutes() {
        // Health check endpoint
        this.app.get('/health', this.healthCheck);
        // System status endpoint
        this.app.get('/status', this.systemStatus);
        // Authentication routes
        this.app.use('/api/v1/auth', auth_1.default);
        // Menu management routes
        this.app.use('/api/v1/menu', menu_1.default);
        // Shopping cart routes
        this.app.use('/api/v1/cart', cart_1.default);
        // Payment processing routes
        this.app.use('/api/v1/payment', payment_1.default);
        // Commission management routes
        this.app.use('/api/v1/commission', commission_1.default);
        // Analytics and reporting routes
        this.app.use('/api/v1/analytics', analytics_1.default);
        // API v1 routes placeholder
        this.app.use('/api/v1', (req, res) => {
            res.json({
                message: 'MenuCA API v1',
                tenant: req.tenantContext?.tenantId,
                timestamp: new Date().toISOString(),
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.originalUrl,
                method: req.method,
            });
        });
    }
    healthCheck = async (req, res) => {
        try {
            // Test database connection
            const dbHealthy = await connection_1.default.testConnection();
            // Test Redis connection
            const redisHealthy = await redis_1.default.testConnection();
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: dbHealthy ? 'healthy' : 'unhealthy',
                    redis: redisHealthy ? 'healthy' : 'unhealthy',
                },
                version: process.env.npm_package_version || '1.0.0',
            };
            const overallHealthy = dbHealthy && redisHealthy;
            res.status(overallHealthy ? 200 : 503).json(health);
        }
        catch (error) {
            logger.error('Health check failed:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
            });
        }
    };
    systemStatus = async (req, res) => {
        try {
            const status = {
                application: {
                    name: 'MenuCA API',
                    version: process.env.npm_package_version || '1.0.0',
                    environment: server_1.serverConfig.nodeEnv,
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
                    status: await connection_1.default.testConnection() ? 'connected' : 'disconnected',
                    pool: connection_1.default.getPoolStatus(),
                },
                redis: {
                    status: redis_1.default.isReady() ? 'connected' : 'disconnected',
                    info: redis_1.default.isReady() ? await redis_1.default.getInfo() : 'Not available',
                },
            };
            res.json(status);
        }
        catch (error) {
            logger.error('System status check failed:', error);
            res.status(500).json({
                error: 'System status check failed',
                timestamp: new Date().toISOString(),
            });
        }
    };
    initializeErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, _next) => {
            logger.error('Unhandled error:', {
                error: err.message,
                stack: err.stack,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                tenant: req.tenantContext?.tenantId,
            });
            // Don't leak error details in production
            const isDevelopment = server_1.serverConfig.nodeEnv === 'development';
            res.status(500).json({
                error: 'Internal server error',
                message: isDevelopment ? err.message : 'Something went wrong',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            });
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection:', reason);
            process.exit(1);
        });
    }
    async start() {
        try {
            // Initialize database connection
            logger.info('Initializing database connection...');
            const dbConnected = await connection_1.default.testConnection();
            if (!dbConnected) {
                throw new Error('Failed to connect to database');
            }
            // Initialize Redis connection
            logger.info('Initializing Redis connection...');
            await redis_1.default.connect();
            const redisConnected = await redis_1.default.testConnection();
            if (!redisConnected) {
                throw new Error('Failed to connect to Redis');
            }
            // Start the server
            this.server = this.app.listen(server_1.serverConfig.port, server_1.serverConfig.host, () => {
                logger.info(`=� MenuCA server started on ${server_1.serverConfig.host}:${server_1.serverConfig.port}`);
                logger.info(`=� Environment: ${server_1.serverConfig.nodeEnv}`);
                logger.info(`=' Process ID: ${process.pid}`);
            });
            // Graceful shutdown handling
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            // Stop accepting new connections
            this.server.close(async () => {
                logger.info('HTTP server closed');
                try {
                    // Close database connections
                    await connection_1.default.close();
                    logger.info('Database connections closed');
                    // Close Redis connection
                    await redis_1.default.close();
                    logger.info('Redis connection closed');
                    logger.info('Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
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
    getApp() {
        return this.app;
    }
}
// Initialize and start server if this file is run directly
if (require.main === module) {
    const server = new MenuCAServer();
    server.start();
}
exports.default = MenuCAServer;
//# sourceMappingURL=app.js.map