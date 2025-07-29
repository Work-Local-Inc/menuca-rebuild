"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDatabaseConfig = exports.databaseConfig = void 0;
exports.databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'menuca_development',
    user: process.env.DB_USER || 'menuca_user',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
};
const validateDatabaseConfig = () => {
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
    }
};
exports.validateDatabaseConfig = validateDatabaseConfig;
//# sourceMappingURL=database.js.map