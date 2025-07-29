import { Pool, PoolClient } from 'pg';
import { databaseConfig, validateDatabaseConfig } from '@/config/database';
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

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    validateDatabaseConfig();
    
    this.pool = new Pool({
      ...databaseConfig,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool events
    this.pool.on('connect', () => {
      logger.info('New database client connected');
    });

    this.pool.on('error', (err: Error) => {
      logger.error('Database pool error:', err);
    });

    this.pool.on('remove', () => {
      logger.info('Database client removed from pool');
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute query with tenant context for Row Level Security
   */
  public async queryWithTenant<T = any>(
    tenantId: string,
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const client = await this.pool.connect();
    
    try {
      // Set tenant context for RLS
      await client.query(`SET app.current_tenant_id = '${tenantId}'`);
      
      // Execute the actual query
      const result = await client.query(text, params);
      
      return result.rows;
    } finally {
      // Clear tenant context and release client
      await client.query('RESET app.current_tenant_id');
      client.release();
    }
  }

  /**
   * Execute query without tenant context (for system operations)
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a client for transaction operations
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute transaction with tenant context
   */
  public async transactionWithTenant<T>(
    tenantId: string,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET app.current_tenant_id = '${tenantId}'`);
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await client.query('RESET app.current_tenant_id');
      client.release();
    }
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      logger.info('Database connection test successful:', result.rows[0]);
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    if (!this.pool.ended) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }

  /**
   * Get pool status for monitoring
   */
  public getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();
export default db;