import { RedisConfig } from '@/types';

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
};

export const validateRedisConfig = (): void => {
  if (!process.env.REDIS_HOST) {
    console.warn('REDIS_HOST not set, using localhost');
  }
};