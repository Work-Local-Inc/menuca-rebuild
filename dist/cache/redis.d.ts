import { RedisClientType } from 'redis';
declare class RedisConnection {
    private client;
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): RedisConnection;
    connect(): Promise<void>;
    getClient(): RedisClientType;
    /**
     * Set a key-value pair with optional expiration
     */
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    /**
     * Get value by key
     */
    get(key: string): Promise<string | null>;
    /**
     * Delete key(s)
     */
    del(...keys: string[]): Promise<number>;
    /**
     * Check if key exists
     */
    exists(...keys: string[]): Promise<number>;
    /**
     * Set expiration on a key
     */
    expire(key: string, seconds: number): Promise<boolean>;
    /**
     * Increment a number stored at key
     */
    incr(key: string): Promise<number>;
    /**
     * Hash field operations
     */
    hSet(key: string, field: string, value: string): Promise<number>;
    hGet(key: string, field: string): Promise<string | undefined>;
    hGetAll(key: string): Promise<{
        [key: string]: string;
    }>;
    /**
     * Session management helpers
     */
    setSession(sessionId: string, data: object, ttlSeconds?: number): Promise<void>;
    getSession(sessionId: string): Promise<object | null>;
    deleteSession(sessionId: string): Promise<void>;
    /**
     * Cache management helpers
     */
    setCache(key: string, data: object, ttlSeconds?: number): Promise<void>;
    getCache(key: string): Promise<object | null>;
    invalidateCache(pattern: string): Promise<void>;
    /**
     * Rate limiting helpers
     */
    rateLimit(key: string, limit: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    /**
     * Test Redis connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Get Redis info for monitoring
     */
    getInfo(): Promise<string>;
    /**
     * Close Redis connection
     */
    close(): Promise<void>;
    /**
     * Check connection status
     */
    isReady(): boolean;
}
export declare const redis: RedisConnection;
export default redis;
//# sourceMappingURL=redis.d.ts.map