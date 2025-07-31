/**
 * Advanced Role-Based Access Control (RBAC) middleware
 * Provides granular permission management for enterprise security
 */
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@/types/auth';
import cache from '@/cache/memory';
import db from '@/database/connection';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Order Management
  ORDER_CREATE = 'order:create',
  ORDER_READ = 'order:read',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_MANAGE_ALL = 'order:manage_all',
  
  // Restaurant Management
  RESTAURANT_CREATE = 'restaurant:create',
  RESTAURANT_READ = 'restaurant:read',
  RESTAURANT_UPDATE = 'restaurant:update',
  RESTAURANT_DELETE = 'restaurant:delete',
  RESTAURANT_MANAGE_OWN = 'restaurant:manage_own',
  
  // Financial Management
  FINANCE_READ = 'finance:read',
  FINANCE_MANAGE = 'finance:manage',
  COMMISSION_READ = 'commission:read',
  COMMISSION_MANAGE = 'commission:manage',
  
  // Analytics & Reporting
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_MANAGE = 'analytics:manage',
  REPORTS_GENERATE = 'reports:generate',
  REPORTS_EXPORT = 'reports:export',
  
  // Security & Compliance
  AUDIT_READ = 'audit:read',
  AUDIT_MANAGE = 'audit:manage',
  SECURITY_MANAGE = 'security:manage',
  ENCRYPTION_MANAGE = 'encryption:manage',
  
  // Campaign Management
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_READ = 'campaign:read',
  CAMPAIGN_UPDATE = 'campaign:update',
  CAMPAIGN_DELETE = 'campaign:delete',
  
  // Support Management
  SUPPORT_READ = 'support:read',
  SUPPORT_MANAGE = 'support:manage',
  SUPPORT_ESCALATE = 'support:escalate'
}

// Default role-permission mappings
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CUSTOMER]: [
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.RESTAURANT_READ
  ],
  
  [UserRole.STAFF]: [
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.RESTAURANT_READ,
    Permission.RESTAURANT_MANAGE_OWN,
    Permission.SUPPORT_READ,
    Permission.USER_READ
  ],
  
  [UserRole.MANAGER]: [
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_MANAGE_ALL,
    Permission.RESTAURANT_READ,
    Permission.RESTAURANT_UPDATE,
    Permission.RESTAURANT_MANAGE_OWN,
    Permission.ANALYTICS_READ,
    Permission.REPORTS_GENERATE,
    Permission.SUPPORT_READ,
    Permission.SUPPORT_MANAGE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_UPDATE,
    Permission.FINANCE_READ,
    Permission.COMMISSION_READ,
    Permission.USER_READ,
    Permission.USER_UPDATE
  ],
  
  [UserRole.ADMIN]: [
    ...Object.values(Permission).filter(p => 
      !p.includes('security:') && !p.includes('encryption:') && !p.includes('audit:manage')
    )
  ],
  
  [UserRole.SUPER_ADMIN]: Object.values(Permission)
};

interface UserPermissions {
  userId: string;
  tenantId: string;
  role: UserRole;
  permissions: Permission[];
  customPermissions?: Permission[];
  lastUpdated: Date;
}

export class RBACService {
  private readonly CACHE_PREFIX = 'rbac:permissions:';
  private readonly CACHE_TTL = 300; // 5 minutes
  
  /**
   * Get user permissions (with caching)
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<UserPermissions | null> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${userId}`;
    
    try {
      // Try Redis cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache miss for user permissions:', error);
    }
    
    // Fetch from database
    const pool = db.getPool();
    const client = await pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Get user with role
      const userResult = await client.query(`
        SELECT id, role, status FROM users 
        WHERE id = $1 AND tenant_id = $2 AND status = 'active'
      `, [userId, tenantId]);
      
      if (userResult.rows.length === 0) {
        return null;
      }
      
      const user = userResult.rows[0];
      
      // Get custom permissions
      const permissionsResult = await client.query(`
        SELECT permission, granted 
        FROM user_permissions 
        WHERE user_id = $1 AND tenant_id = $2
      `, [userId, tenantId]);
      
      const customPermissions: Permission[] = [];
      const revokedPermissions: Permission[] = [];
      
      for (const row of permissionsResult.rows) {
        if (row.granted) {
          customPermissions.push(row.permission as Permission);
        } else {
          revokedPermissions.push(row.permission as Permission);
        }
      }
      
      // Build final permissions
      const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.role as UserRole] || [];
      const finalPermissions = [
        ...defaultPermissions,
        ...customPermissions
      ].filter(p => !revokedPermissions.includes(p));
      
      const userPermissions: UserPermissions = {
        userId,
        tenantId,
        role: user.role as UserRole,
        permissions: finalPermissions,
        customPermissions: customPermissions.length > 0 ? customPermissions : undefined,
        lastUpdated: new Date()
      };
      
      // Cache the result
      try {
        await cache.set(cacheKey, JSON.stringify(userPermissions), this.CACHE_TTL);
      } catch (error) {
        logger.warn('Failed to cache user permissions:', error);
      }
      
      return userPermissions;
    } finally {
      client.release();
    }
  }
  
  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, tenantId: string, permission: Permission): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    if (!userPermissions) {
      return false;
    }
    
    return userPermissions.permissions.includes(permission);
  }
  
  /**
   * Grant custom permission to user
   */
  async grantPermission(userId: string, tenantId: string, permission: Permission, grantedBy: string): Promise<void> {
    const pool = db.getPool();
    const client = await pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      await client.query(`
        INSERT INTO user_permissions (user_id, tenant_id, permission, granted, granted_by, created_at)
        VALUES ($1, $2, $3, true, $4, NOW())
        ON CONFLICT (user_id, tenant_id, permission) 
        DO UPDATE SET granted = true, granted_by = $4, updated_at = NOW()
      `, [userId, tenantId, permission, grantedBy]);
      
      // Invalidate cache
      await this.invalidateUserCache(userId, tenantId);
      
      // Log the change
      logger.info('Permission granted', {
        userId,
        tenantId,
        permission,
        grantedBy,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Revoke permission from user
   */
  async revokePermission(userId: string, tenantId: string, permission: Permission, revokedBy: string): Promise<void> {
    const pool = db.getPool();
    const client = await pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      await client.query(`
        INSERT INTO user_permissions (user_id, tenant_id, permission, granted, granted_by, created_at)
        VALUES ($1, $2, $3, false, $4, NOW())
        ON CONFLICT (user_id, tenant_id, permission) 
        DO UPDATE SET granted = false, granted_by = $4, updated_at = NOW()
      `, [userId, tenantId, permission, revokedBy]);
      
      // Invalidate cache
      await this.invalidateUserCache(userId, tenantId);
      
      // Log the change
      logger.info('Permission revoked', {
        userId,
        tenantId,
        permission,
        revokedBy,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Invalidate user permissions cache
   */
  private async invalidateUserCache(userId: string, tenantId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${userId}`;
    try {
      await cache.del(cacheKey);
    } catch (error) {
      logger.warn('Failed to invalidate user permissions cache:', error);
    }
  }
}

export const rbacService = new RBACService();

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }
      
      const hasPermission = await rbacService.hasPermission(
        req.user.id,
        req.user.tenant_id,
        permission
      );
      
      if (!hasPermission) {
        // Log unauthorized access attempt
        logger.warn('Unauthorized access attempt', {
          userId: req.user.id,
          tenantId: req.user.tenant_id,
          requiredPermission: permission,
          userRole: req.user.role,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          required: permission
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
        code: 'RBAC_ERROR'
      });
    }
  };
};

/**
 * Middleware to require any of multiple permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }
      
      let hasAnyPermission = false;
      
      for (const permission of permissions) {
        const hasPermission = await rbacService.hasPermission(
          req.user.id,
          req.user.tenant_id,
          permission
        );
        
        if (hasPermission) {
          hasAnyPermission = true;
          break;
        }
      }
      
      if (!hasAnyPermission) {
        // Log unauthorized access attempt
        logger.warn('Unauthorized access attempt (any permission)', {
          userId: req.user.id,
          tenantId: req.user.tenant_id,
          requiredPermissions: permissions,
          userRole: req.user.role,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          required: permissions
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
        code: 'RBAC_ERROR'
      });
    }
  };
};