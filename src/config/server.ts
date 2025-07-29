import { ServerConfig } from '@/types';

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  tenant: {
    defaultId: process.env.DEFAULT_TENANT_ID || 'default',
    header: process.env.TENANT_HEADER || 'x-tenant-id',
    subdomainEnabled: process.env.TENANT_SUBDOMAIN_ENABLED === 'true',
  },
};

export const validateServerConfig = (): void => {
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'change-this-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
};