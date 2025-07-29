"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const database_1 = require("@/config/database");
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
class DatabaseConnection {
    pool;
    static instance;
    constructor() {
        (0, database_1.validateDatabaseConfig)();
        this.pool = new pg_1.Pool({
            ...database_1.databaseConfig,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        // Handle pool events
        this.pool.on('connect', () => {
            logger.info('New database client connected');
        });
        this.pool.on('error', (err) => {
            logger.error('Database pool error:', err);
        });
        this.pool.on('remove', () => {
            logger.info('Database client removed from pool');
        });
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    getPool() {
        return this.pool;
    }
    /**
     * Execute query with tenant context for Row Level Security
     */
    async queryWithTenant(tenantId, text, params) {
        const client = await this.pool.connect();
        try {
            // Set tenant context for RLS
            await client.query(`SET app.current_tenant_id = '${tenantId}'`);
            // Execute the actual query
            const result = await client.query(text, params);
            return result.rows;
        }
        finally {
            // Clear tenant context and release client
            await client.query('RESET app.current_tenant_id');
            client.release();
        }
    }
    /**
     * Execute query without tenant context (for system operations)
     */
    async query(text, params) {
        try {
            const result = await this.pool.query(text, params);
            return result.rows;
        }
        catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }
    /**
     * Get a client for transaction operations
     */
    async getClient() {
        return await this.pool.connect();
    }
    /**
     * Execute transaction with tenant context
     */
    async transactionWithTenant(tenantId, callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`SET app.current_tenant_id = '${tenantId}'`);
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            await client.query('RESET app.current_tenant_id');
            client.release();
        }
    }
    /**
     * Test database connection
     */
    async testConnection() {
        try {
            const result = await this.pool.query('SELECT NOW()');
            logger.info('Database connection test successful:', result.rows[0]);
            return true;
        }
        catch (error) {
            logger.error('Database connection test failed:', error);
            return false;
        }
    }
    /**
     * Close all connections
     */
    async close() {
        if (!this.pool.ended) {
            await this.pool.end();
            logger.info('Database connection pool closed');
        }
    }
    /**
     * Get pool status for monitoring
     */
    getPoolStatus() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
        };
    }
}
// Export singleton instance
exports.db = DatabaseConnection.getInstance();
exports.default = exports.db;
//# sourceMappingURL=connection.js.map