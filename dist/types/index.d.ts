export interface Tenant {
    id: string;
    name: string;
    domain: string;
    subdomain: string;
    configuration: Record<string, any>;
    commission_rate: number;
    status: 'active' | 'suspended' | 'inactive';
    created_at: Date;
    updated_at: Date;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string | undefined;
    db: number;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
}
export interface ServerConfig {
    port: number;
    host: string;
    nodeEnv: string;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    bcrypt: {
        rounds: number;
    };
    logging: {
        level: string;
        format: string;
    };
    tenant: {
        defaultId: string;
        header: string;
        subdomainEnabled: boolean;
    };
}
export interface TenantContext {
    tenantId: string;
    userId?: string;
    userRole?: string;
}
import type { User } from './auth';
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            user?: Omit<User, 'password_hash'>;
        }
    }
}
//# sourceMappingURL=index.d.ts.map