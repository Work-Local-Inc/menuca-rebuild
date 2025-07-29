import { createClient, RedisClientType } from 'redis';
import { redisConfig, validateRedisConfig } from '@/config/redis';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class RedisConnection {
  private client: RedisClientType;
  private static instance: RedisConnection;
  private isConnected: boolean = false;

  private constructor() {
    validateRedisConfig();
    
    const clientOptions: any = {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      database: redisConfig.db,
    };

    if (redisConfig.password) {
      clientOptions.password = redisConfig.password;
    }

    this.client = createClient(clientOptions);

    // Handle Redis events
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (err: Error) => {
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

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Set a key-value pair with optional expiration
   */
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  /**
   * Get value by key
   */
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  /**
   * Delete key(s)
   */
  public async del(...keys: string[]): Promise<number> {
    try {
      return await this.client.del(keys);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(...keys: string[]): Promise<number> {
    try {
      return await this.client.exists(keys);
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  /**
   * Set expiration on a key
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  /**
   * Get TTL of a key
   */
  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error:', error);
      throw error;
    }
  }

  /**
   * Increment a number stored at key
   */
  public async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      throw error;
    }
  }

  /**
   * Hash field operations
   */
  public async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error('Redis HSET error:', error);
      throw error;
    }
  }

  public async hGet(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error('Redis HGET error:', error);
      throw error;
    }
  }

  public async hGetAll(key: string): Promise<{ [key: string]: string }> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      throw error;
    }
  }

  /**
   * Session management helpers
   */
  public async setSession(sessionId: string, data: object, ttlSeconds: number = 900): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    await this.set(sessionKey, JSON.stringify(data), ttlSeconds);
  }

  public async getSession(sessionId: string): Promise<object | null> {
    const sessionKey = `session:${sessionId}`;
    const data = await this.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    await this.del(sessionKey);
  }

  /**
   * Cache management helpers
   */
  public async setCache(key: string, data: object, ttlSeconds: number = 300): Promise<void> {
    const cacheKey = `cache:${key}`;
    await this.set(cacheKey, JSON.stringify(data), ttlSeconds);
  }

  public async getCache(key: string): Promise<object | null> {
    const cacheKey = `cache:${key}`;
    const data = await this.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }

  public async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(`cache:${pattern}*`);
      if (keys.length > 0) {
        await this.del(...keys);
      }
    } catch (error) {
      logger.error('Redis cache invalidation error:', error);
      throw error;
    }
  }

  /**
   * Rate limiting helpers
   */
  public async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
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
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      throw error;
    }
  }

  /**
   * List operations
   */
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      throw error;
    }
  }

  public async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rPush(key, values);
    } catch (error) {
      logger.error('Redis RPUSH error:', error);
      throw error;
    }
  }

  public async lpos(key: string, element: string): Promise<number | null> {
    try {
      return await this.client.lPos(key, element);
    } catch (error) {
      logger.error('Redis LPOS error:', error);
      return null;
    }
  }

  public async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      logger.error('Redis LLEN error:', error);
      throw error;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      throw error;
    }
  }

  /**
   * Key pattern search
   */
  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      throw error;
    }
  }

  /**
   * Test Redis connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      logger.info('Redis connection test successful:', result);
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis connection test failed:', error);
      return false;
    }
  }

  /**
   * Get Redis info for monitoring
   */
  public async getInfo(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      logger.error('Redis info error:', error);
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
    logger.info('Redis connection closed');
  }

  /**
   * Check connection status
   */
  public isReady(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const redis = RedisConnection.getInstance();
export default redis;