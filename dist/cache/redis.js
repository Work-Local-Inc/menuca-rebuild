"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const redis_1 = require("redis");
const redis_2 = require("@/config/redis");
const winston_1 = __importDefault(require("winston"));
// Initialize logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
class RedisConnection {
    client;
    static instance;
    isConnected = false;
    constructor() {
        (0, redis_2.validateRedisConfig)();
        const clientOptions = {
            socket: {
                host: redis_2.redisConfig.host,
                port: redis_2.redisConfig.port,
            },
            database: redis_2.redisConfig.db,
        };
        if (redis_2.redisConfig.password) {
            clientOptions.password = redis_2.redisConfig.password;
        }
        this.client = (0, redis_1.createClient)(clientOptions);
        // Handle Redis events
        this.client.on('connect', () => {
            logger.info('Redis client connecting...');
        });
        this.client.on('ready', () => {
            logger.info('Redis client ready');
            this.isConnected = true;
        });
        this.client.on('error', (err) => {
            logger.error('Redis client error:', err);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            logger.info('Redis client disconnected');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            logger.info('Redis client reconnecting...');
        });
    }
    static getInstance() {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
        }
        return RedisConnection.instance;
    }
    async connect() {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }
    getClient() {
        return this.client;
    }
    /**
     * Set a key-value pair with optional expiration
     */
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            logger.error('Redis SET error:', error);
            throw error;
        }
    }
    /**
     * Get value by key
     */
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger.error('Redis GET error:', error);
            throw error;
        }
    }
    /**
     * Delete key(s)
     */
    async del(...keys) {
        try {
            return await this.client.del(keys);
        }
        catch (error) {
            logger.error('Redis DEL error:', error);
            throw error;
        }
    }
    /**
     * Check if key exists
     */
    async exists(...keys) {
        try {
            return await this.client.exists(keys);
        }
        catch (error) {
            logger.error('Redis EXISTS error:', error);
            throw error;
        }
    }
    /**
     * Set expiration on a key
     */
    async expire(key, seconds) {
        try {
            return await this.client.expire(key, seconds);
        }
        catch (error) {
            logger.error('Redis EXPIRE error:', error);
            throw error;
        }
    }
    /**
     * Increment a number stored at key
     */
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            logger.error('Redis INCR error:', error);
            throw error;
        }
    }
    /**
     * Hash field operations
     */
    async hSet(key, field, value) {
        try {
            return await this.client.hSet(key, field, value);
        }
        catch (error) {
            logger.error('Redis HSET error:', error);
            throw error;
        }
    }
    async hGet(key, field) {
        try {
            return await this.client.hGet(key, field);
        }
        catch (error) {
            logger.error('Redis HGET error:', error);
            throw error;
        }
    }
    async hGetAll(key) {
        try {
            return await this.client.hGetAll(key);
        }
        catch (error) {
            logger.error('Redis HGETALL error:', error);
            throw error;
        }
    }
    /**
     * Session management helpers
     */
    async setSession(sessionId, data, ttlSeconds = 900) {
        const sessionKey = `session:${sessionId}`;
        await this.set(sessionKey, JSON.stringify(data), ttlSeconds);
    }
    async getSession(sessionId) {
        const sessionKey = `session:${sessionId}`;
        const data = await this.get(sessionKey);
        return data ? JSON.parse(data) : null;
    }
    async deleteSession(sessionId) {
        const sessionKey = `session:${sessionId}`;
        await this.del(sessionKey);
    }
    /**
     * Cache management helpers
     */
    async setCache(key, data, ttlSeconds = 300) {
        const cacheKey = `cache:${key}`;
        await this.set(cacheKey, JSON.stringify(data), ttlSeconds);
    }
    async getCache(key) {
        const cacheKey = `cache:${key}`;
        const data = await this.get(cacheKey);
        return data ? JSON.parse(data) : null;
    }
    async invalidateCache(pattern) {
        try {
            const keys = await this.client.keys(`cache:${pattern}*`);
            if (keys.length > 0) {
                await this.del(...keys);
            }
        }
        catch (error) {
            logger.error('Redis cache invalidation error:', error);
            throw error;
        }
    }
    /**
     * Rate limiting helpers
     */
    async rateLimit(key, limit, windowSeconds) {
        const rateLimitKey = `rate_limit:${key}`;
        try {
            const current = await this.incr(rateLimitKey);
            if (current === 1) {
                await this.expire(rateLimitKey, windowSeconds);
            }
            const ttl = await this.client.ttl(rateLimitKey);
            const resetTime = Date.now() + (ttl * 1000);
            return {
                allowed: current <= limit,
                remaining: Math.max(0, limit - current),
                resetTime,
            };
        }
        catch (error) {
            logger.error('Redis rate limit error:', error);
            throw error;
        }
    }
    /**
     * Test Redis connection
     */
    async testConnection() {
        try {
            const result = await this.client.ping();
            logger.info('Redis connection test successful:', result);
            return result === 'PONG';
        }
        catch (error) {
            logger.error('Redis connection test failed:', error);
            return false;
        }
    }
    /**
     * Get Redis info for monitoring
     */
    async getInfo() {
        try {
            return await this.client.info();
        }
        catch (error) {
            logger.error('Redis info error:', error);
            throw error;
        }
    }
    /**
     * Close Redis connection
     */
    async close() {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis connection closed');
    }
    /**
     * Check connection status
     */
    isReady() {
        return this.isConnected;
    }
}
// Export singleton instance
exports.redis = RedisConnection.getInstance();
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map