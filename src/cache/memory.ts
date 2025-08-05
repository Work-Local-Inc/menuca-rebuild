// Simple in-memory cache to replace Redis
// Note: This is not suitable for production multi-instance deployments
// but works fine for single-instance Supabase architecture

class MemoryCache {
  private cache = new Map<string, { value: any; expires: number | null }>();
  private static instance: MemoryCache;

  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  public async connect(): Promise<void> {
    // No-op for memory cache
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    this.cache.set(key, { value, expires });
  }

  public async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  public async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) deleted++;
    }
    return deleted;
  }

  public async exists(...keys: string[]): Promise<number> {
    return keys.filter(key => this.cache.has(key)).length;
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    item.expires = Date.now() + (seconds * 1000);
    return true;
  }

  public async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item || !item.expires) return -1;
    
    const remaining = Math.ceil((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  public async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }

  // Session management helpers
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

  // Cache management helpers
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
    const keys = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`cache:${pattern}`)
    );
    await this.del(...keys);
  }

  // Rate limiting helpers
  public async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const rateLimitKey = `rate_limit:${key}`;
    
    const current = await this.incr(rateLimitKey);
    
    if (current === 1) {
      await this.expire(rateLimitKey, windowSeconds);
    }
    
    const ttl = await this.ttl(rateLimitKey);
    const resetTime = Date.now() + (ttl * 1000);
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime,
    };
  }

  // List operations (simplified)
  public async lpush(key: string, ...values: string[]): Promise<number> {
    const current = await this.get(key);
    const list = current ? JSON.parse(current) : [];
    list.unshift(...values);
    await this.set(key, JSON.stringify(list));
    return list.length;
  }

  public async lpos(key: string, element: string): Promise<number | null> {
    const current = await this.get(key);
    if (!current) return null;
    
    const list = JSON.parse(current);
    const index = list.indexOf(element);
    return index >= 0 ? index : null;
  }

  public async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  // Health check methods
  public async testConnection(): Promise<boolean> {
    return true; // Memory cache is always "connected"
  }

  public isReady(): boolean {
    return true;
  }

  public async getInfo(): Promise<string> {
    return `Memory cache with ${this.cache.size} keys`;
  }

  public async close(): Promise<void> {
    // No-op for memory cache
  }

  // Test methods for compatibility
  public async flushAll(): Promise<void> {
    this.cache.clear();
  }
}

// Export singleton instance
export const cache = MemoryCache.getInstance();
export default cache;