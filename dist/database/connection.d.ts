import { Pool, PoolClient } from 'pg';
declare class DatabaseConnection {
    private pool;
    private static instance;
    private constructor();
    static getInstance(): DatabaseConnection;
    getPool(): Pool;
    /**
     * Execute query with tenant context for Row Level Security
     */
    queryWithTenant<T = any>(tenantId: string, text: string, params?: any[]): Promise<T[]>;
    /**
     * Execute query without tenant context (for system operations)
     */
    query<T = any>(text: string, params?: any[]): Promise<T[]>;
    /**
     * Get a client for transaction operations
     */
    getClient(): Promise<PoolClient>;
    /**
     * Execute transaction with tenant context
     */
    transactionWithTenant<T>(tenantId: string, callback: (client: PoolClient) => Promise<T>): Promise<T>;
    /**
     * Test database connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Close all connections
     */
    close(): Promise<void>;
    /**
     * Get pool status for monitoring
     */
    getPoolStatus(): {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
}
export declare const db: DatabaseConnection;
export default db;
//# sourceMappingURL=connection.d.ts.map