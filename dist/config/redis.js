"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRedisConfig = exports.redisConfig = void 0;
exports.redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
};
const validateRedisConfig = () => {
    if (!process.env.REDIS_HOST) {
        console.warn('REDIS_HOST not set, using localhost');
    }
};
exports.validateRedisConfig = validateRedisConfig;
//# sourceMappingURL=redis.js.map